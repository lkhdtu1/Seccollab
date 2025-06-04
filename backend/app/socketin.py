from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
import eventlet
import json
eventlet.monkey_patch()
import uuid
from app.models.user import db
from app.models.Message import Chat
socketio = SocketIO(
    cors_allowed_origins=["http://localhost:3000"],
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

def init_websocket(app):
    socketio.init_app(app)
    
    @socketio.on('connect')
    def handle_connect():
        try:
            # Get auth data from connect packet
            auth_data = request.args.to_dict()
            if 'token' in auth_data:
                # Verify token
                decoded = decode_token(auth_data['token'])
                user_id = decoded['sub']
                join_room(f'user_{user_id}')
                emit('connected', {'status': 'success', 'userId': user_id})
                print(f'User {user_id} connected successfully')
                return True
            print('No token provided')
            return False
        except Exception as e:
            print(f'Connection error: {str(e)}')
            return False

    @socketio.on('private_message')
    def handle_private_message(data):
        try:
            auth_data = request.args.to_dict()
            if 'token' not in auth_data:
                return
            
            decoded = decode_token(auth_data['token'])
            sender_id = decoded['sub']
            receiver_id = data.get('receiver_id')
            
            # If message is already saved (has an ID), just relay it
            if 'id' in data:
                if receiver_id:
                    receiver_room = f'user_{receiver_id}'
                    emit('new_message', {
                        'sender_id': sender_id,
                        'message': data
                    }, room=receiver_room)
                return
                
            # Otherwise save new message
            message = Chat(
                id=str(uuid.uuid4()),
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=data.get('content'),
                content_type=data.get('content_type', 'text')
            )
            
            with app.app_context():
                db.session.add(message)
                db.session.commit()
                
                if receiver_id:
                    receiver_room = f'user_{receiver_id}'
                    emit('new_message', {
                        'sender_id': sender_id,
                        'message': message.to_dict()
                    }, room=receiver_room)
                    
        except Exception as e:
            print(f'Message handling error: {str(e)}')

    return socketio