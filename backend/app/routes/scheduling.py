"""Scheduling routes for the application."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import db, User, Schedule, ScheduleParticipant, ScheduleNotification
from datetime import datetime
from flask_mail import Message, Mail
import uuid

scheduling_bp = Blueprint('scheduling', __name__)

@scheduling_bp.route('/schedules', methods=['POST'])
@jwt_required()
def create_schedule():
    """Create a new schedule."""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'startTime', 'endTime', 'participants', 'notifyVia']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create schedule
        schedule = Schedule(
            id=str(uuid.uuid4()),
            title=data['title'],
            description=data.get('description', ''),
            start_time=datetime.fromisoformat(data['startTime'].replace('Z', '+00:00')),
            end_time=datetime.fromisoformat(data['endTime'].replace('Z', '+00:00')),
            creator_id=current_user_id
        )
        db.session.add(schedule)
        db.session.flush()  # Get schedule.id before using it
          # Add participants and notifications (excluding the creator)
        for participant_id in data['participants']:
            # Skip if participant is the creator (creator should not be a participant)
            if participant_id == current_user_id:
                continue
                
            # Create participant
            participant = ScheduleParticipant(
                id=str(uuid.uuid4()),
                schedule_id=schedule.id,
                user_id=participant_id,
                status='pending'
            )
            db.session.add(participant)
            
            # Create notifications and send emails
            for notify_type in data['notifyVia']:
                notification = ScheduleNotification(
                    id=str(uuid.uuid4()),
                    schedule_id=schedule.id,
                    user_id=participant_id,
                    type=notify_type,
                    status='pending'
                )
                db.session.add(notification)                # Handle email notifications
                if notify_type == 'email':
                    user = User.query.get(participant_id)
                    if user and user.email:
                        try:
                            # Get the mail instance from the app
                            mail = current_app.extensions.get('mail')
                            email_sent = False
                            
                            if mail is not None:
                                try:
                                    msg = Message(
                                        f'New Meeting Invitation: {schedule.title}',
                                        sender=current_app.config['MAIL_DEFAULT_SENDER'],
                                        recipients=[user.email]
                                    )
                                    msg.body = f'''
You have been invited to a meeting:

Title: {schedule.title}
Description: {schedule.description}
Start Time: {schedule.start_time}
End Time: {schedule.end_time}

Please log in to respond to this invitation.
'''
                                    mail.send(msg)
                                    email_sent = True
                                    notification.status = 'sent'
                                except Exception as flask_mail_error:
                                    print(f"Flask-Mail failed: {str(flask_mail_error)}, trying enhanced Email1...")                            # If Flask-Mail failed or is not available, use eventlet-bypass email utility
                            if not email_sent:
                                from app.utils.EmailBypass import send_email_with_local_fallback
                                success = send_email_with_local_fallback(
                                    to=user.email,
                                    subject=f'New Meeting Invitation: {schedule.title}',
                                    body=f'''
You have been invited to a meeting:

Title: {schedule.title}
Description: {schedule.description}
Start Time: {schedule.start_time}
End Time: {schedule.end_time}

Please log in to respond to this invitation.
'''
                                )
                                notification.status = 'sent' if success else 'failed'
                                
                        except Exception as mail_error:
                            print(f"Failed to send email: {str(mail_error)}")
                            notification.status = 'failed'
        
        db.session.commit()
        
        # Return the created schedule
        return jsonify({
            'message': 'Schedule created successfully',
            'schedule': {
                'id': schedule.id,
                'title': schedule.title,
                'description': schedule.description,
                'startTime': schedule.start_time.isoformat(),
                'endTime': schedule.end_time.isoformat(),
                'creator': {
                    'id': current_user_id,
                    'name': User.query.get(current_user_id).name
                },
                'participants': [{
                    'id': p.user_id,
                    'name': User.query.get(p.user_id).name,
                    'status': 'pending'
                } for p in schedule.participants]
            }
        }), 201
        
    except ValueError as ve:
        db.session.rollback()
        print(f"Value Error: {str(ve)}")
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error creating schedule: {str(e)}")
        return jsonify({'error': 'Failed to create schedule'}), 500

@scheduling_bp.route('/schedules', methods=['GET'])
@jwt_required()
def list_schedules():
    """List schedules for the current user."""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get_or_404(current_user_id)

        # Get schedules where user is either creator or participant
        created_schedules = Schedule.query.filter_by(creator_id=current_user_id).all()
        participated_schedules = Schedule.query.join(ScheduleParticipant).filter(
            ScheduleParticipant.user_id == current_user_id
        ).all()

        # Combine and deduplicate schedules
        all_schedules = list({s.id: s for s in created_schedules + participated_schedules}.values())
        
        # Convert to dictionary format
        schedule_list = []
        for schedule in all_schedules:
            schedule_dict = schedule.to_dict()
            if schedule_dict:  # Only add if successfully converted
                schedule_list.append(schedule_dict)

        return jsonify({
            'schedules': schedule_list
        }), 200

    except ValueError as ve:
        print(f"Value Error in list_schedules: {str(ve)}")
        return jsonify({'error': 'Invalid user ID format'}), 422
    except Exception as e:
        print(f"Error listing schedules: {str(e)}")
        return jsonify({'error': 'Failed to fetch schedules'}), 500

@scheduling_bp.route('/schedules/<schedule_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_schedule(schedule_id):
    """Respond to a schedule invitation."""
    user_id = get_jwt_identity()
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['accepted', 'declined']:
        return jsonify({'error': 'Invalid status'}), 400
    
    try:
        participant = ScheduleParticipant.query.filter_by(
            schedule_id=schedule_id,
            user_id=user_id
        ).first_or_404()
        
        participant.status = status
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully {status} the invitation'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/schedules/<schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    """Delete a schedule (creator can delete anytime, participants can delete if cancelled)."""
    try:
        current_user_id = int(get_jwt_identity())
        schedule = Schedule.query.get_or_404(schedule_id)
        
        # Check permissions
        is_creator = schedule.creator_id == current_user_id
        is_participant = any(p.user_id == current_user_id for p in schedule.participants)
        all_cancelled = all(p.status == 'cancelled' for p in schedule.participants)
        
        if not (is_creator or (is_participant and all_cancelled)):
            return jsonify({
                'error': 'You can only delete if you are the creator or if the schedule is cancelled'
            }), 403

        # Delete related notifications
        ScheduleNotification.query.filter_by(schedule_id=schedule_id).delete()
        
        # Delete related participants
        ScheduleParticipant.query.filter_by(schedule_id=schedule_id).delete()
        
        # Delete schedule
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({'message': 'Schedule deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting schedule: {str(e)}")
        return jsonify({'error': 'Failed to delete schedule'}), 500
    
    
    
    
    
@scheduling_bp.route('/schedules/<schedule_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_schedule(schedule_id):
    """Cancel a schedule (creator only)."""
    try:
        current_user_id = int(get_jwt_identity())
        
        # Find schedule and verify creator
        schedule = Schedule.query.get_or_404(schedule_id)
        if schedule.creator_id != current_user_id:
            return jsonify({'error': 'Only the creator can cancel this schedule'}), 403

        # Update all participants' status to 'cancelled'
        for participant in schedule.participants:
            participant.status = 'cancelled'
              # Send cancellation notifications
            notification = ScheduleNotification(
                id=str(uuid.uuid4()),
                schedule_id=schedule.id,
                user_id=participant.user_id,
                type='in_app',
                status='pending'
            )
            db.session.add(notification)
            
            # Create email notification entry
            email_notification = ScheduleNotification(
                id=str(uuid.uuid4()),
                schedule_id=schedule.id,
                user_id=participant.user_id,
                type='email',
                status='pending'
            )
            db.session.add(email_notification)
              # Send email notification with proper status tracking
            user = User.query.get(participant.user_id)
            if user and user.email:
                try:
                    # Get the mail instance from the app
                    mail = current_app.extensions.get('mail')
                    email_sent = False
                    
                    if mail is not None:
                        try:
                            msg = Message(
                                f'Meeting Cancelled: {schedule.title}',
                                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                                recipients=[user.email]
                            )
                            msg.body = f'''
The following meeting has been cancelled:

Title: {schedule.title}
Description: {schedule.description}
Start Time: {schedule.start_time}
End Time: {schedule.end_time}

This meeting has been cancelled by the organizer.
'''
                            mail.send(msg)
                            email_sent = True
                            email_notification.status = 'sent'
                        except Exception as flask_mail_error:
                            print(f"Flask-Mail failed for cancellation: {str(flask_mail_error)}, trying enhanced Email1...")
                    
                    # If Flask-Mail failed or is not available, use enhanced Email1
                    if not email_sent:
                        from app.utils.Email1 import send_email_with_local_fallback
                        success = send_email_with_local_fallback(
                            to=user.email,
                            subject=f'Meeting Cancelled: {schedule.title}',
                            body=f'''
The following meeting has been cancelled:

Title: {schedule.title}
Description: {schedule.description}
Start Time: {schedule.start_time}
End Time: {schedule.end_time}

This meeting has been cancelled by the organizer.
'''
                        )
                        email_notification.status = 'sent' if success else 'failed'
                        if not success:
                            print(f"Enhanced email system also failed for {user.email}")
                            
                except Exception as mail_error:
                    print(f"Failed to send cancellation email: {str(mail_error)}")
                    email_notification.status = 'failed'

        db.session.commit()
        return jsonify({'message': 'Schedule cancelled successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error cancelling schedule: {str(e)}")
        return jsonify({'error': 'Failed to cancel schedule'}), 500