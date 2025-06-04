from flask import Blueprint, jsonify
from app.models.file import File
from app.models.file_share import FileShare
from app.models.user import User
from app.utils.logging import Log
from app.utils.database import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"msg": "Unauthorized"}), 401
    """
    Returns statistics for the dashboard.
    """
    try:
        # File statistics
        total_files = File.query.count()
        shared_files = FileShare.query.count()
        files_by_type = db.session.query(File.mime_type, db.func.count(File.id)).group_by(File.mime_type).all()
        files_by_type_dict = {file_type: count for file_type, count in files_by_type}

        # Activity statistics (real data)
        today = datetime.utcnow()
        start_of_week = today - timedelta(days=today.weekday())

        uploads = [
            db.session.query(db.func.count(Log.id))
            .filter(Log.action == 'UPLOAD', Log.timestamp >= start_of_week + timedelta(days=i), Log.timestamp < start_of_week + timedelta(days=i + 1))
            .scalar()
            for i in range(7)
        ]

        downloads = [
            db.session.query(db.func.count(Log.id))
            .filter(Log.action == 'DOWNLOAD', Log.timestamp >= start_of_week + timedelta(days=i), Log.timestamp < start_of_week + timedelta(days=i + 1))
            .scalar()
            for i in range(7)
        ]

        shares = [
            db.session.query(db.func.count(Log.id))
            .filter(Log.action == 'SHARE', Log.timestamp >= start_of_week + timedelta(days=i), Log.timestamp < start_of_week + timedelta(days=i + 1))
            .scalar()
            for i in range(7)
        ]

        # Storage statistics
        total_storage = 100  # Assume 100 GB total storage
        used_storage = db.session.query(db.func.sum(File.size)).scalar() or 0
        used_storage_gb = round(used_storage / (1024 * 1024 * 1024), 2)  # Convert bytes to GB
        usage_by_type = db.session.query(File.mime_type, db.func.sum(File.size)).group_by(File.mime_type).all()
        usage_by_type_dict = {file_type: round(size / (1024 * 1024 * 1024), 2) for file_type, size in usage_by_type}

        # Format the response
        stats = {
            "fileStats": {
                "totalFiles": total_files,
                "sharedFiles": shared_files,
                "filesByType": files_by_type_dict
            },
            "activityStats": {
                "uploads": uploads,
                "downloads": downloads,
                "shares": shares
            },
            "storageStats": {
                "used": used_storage_gb,
                "total": total_storage,
                "usageByType": usage_by_type_dict
            }
        }

        return jsonify({"status": "success", "data": stats}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@stats_bp.route('/user/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get statistics for the current user."""
    current_user_id = get_jwt_identity()
    
    # Get time ranges
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = now - timedelta(days=7)
    
    # Get activity counts for different types
    upload_count = Log.query.filter(
        Log.user_id == current_user_id,
        Log.action == 'UPLOAD'
    ).count()
    
    download_count = Log.query.filter(
        Log.user_id == current_user_id,
        Log.action == 'DOWNLOAD'
    ).count()
    
    # Count both share logs and actual file shares
    share_logs_count = Log.query.filter(
        Log.user_id == current_user_id,
        Log.action == 'SHARE'
    ).count()
    
    # Count files shared by the user
    file_shares_count = FileShare.query.join(File).filter(
        File.owner_id == current_user_id
    ).count()
    
    share_count = share_logs_count + file_shares_count
    
    # Get user and daily login count
    user = User.query.get(current_user_id)
    login_count = user.daily_login_count if user else 0
    
    # Get log activities
    log_activities = db.session.query(
        db.func.date(Log.timestamp).label('date'),
        Log.action,
        db.func.count().label('count')
    ).filter(
        Log.user_id == current_user_id,
        Log.timestamp >= seven_days_ago,
        Log.action.in_(['UPLOAD', 'DOWNLOAD', 'SHARE'])
    ).group_by(
        db.func.date(Log.timestamp),
        Log.action
    ).all()

    # Get file share activities using literal SQL for the action column
    share_activities = db.session.query(
        db.func.date(FileShare.created_at).label('date'),
        db.literal_column("'SHARE'").label('action'),
        db.func.count().label('count')
    ).join(File).filter(
        File.owner_id == current_user_id,
        FileShare.created_at >= seven_days_ago
    ).group_by(
        db.func.date(FileShare.created_at)
    ).all()

    # Combine both activity sets
    daily_activities = log_activities + share_activities
    
    # Format daily activities for charting
    activity_data = {}
    for row in daily_activities:
        # Convert the date to a string in YYYY-MM-DD format
        date_str = row[0].strftime('%Y-%m-%d') if hasattr(row[0], 'strftime') else str(row[0])
        action = row[1]
        count = row[2]
        
        if date_str not in activity_data:
            activity_data[date_str] = {'uploads': 0, 'downloads': 0, 'shares': 0}
        if action == 'UPLOAD':
            activity_data[date_str]['uploads'] = count
        elif action == 'DOWNLOAD':
            activity_data[date_str]['downloads'] = count
        elif action == 'SHARE':
            activity_data[date_str]['shares'] = count
    
    return jsonify({
        'total_stats': {
            'uploads': upload_count,
            'downloads': download_count,
            'shares': share_count,
            'daily_logins': login_count
        },
        'daily_activities': activity_data
    })