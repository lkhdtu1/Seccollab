from flask_socketio import emit, join_room, leave_room
from flask import request
from flask_jwt_extended import decode_token

def register_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        try:
            auth_token = request.args.get('token')
            if auth_token:
                # Verify JWT token
                decoded = decode_token(auth_token)
                user_id = decoded['sub']
                join_room(f'user_{user_id}')
                emit('connected', {'status': 'success'})
            else:
                return False
        except Exception as e:
            print(f"Connection error: {str(e)}")
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        print('Client disconnected')

    @socketio.on('message')
    def handle_message(data):
        """Handle incoming messages"""
        try:
            # Verify the sender is authenticated
            auth_token = request.args.get('token')
            if not auth_token:
                return
            
            decoded = decode_token(auth_token)
            sender_id = decoded['sub']
            
            # Emit to specific room
            receiver_room = f'user_{data.get("receiver_id")}'
            emit('new_message', {
                'sender_id': sender_id,
                'content': data.get('content'),
                'timestamp': data.get('timestamp')
            }, room=receiver_room)
            
        except Exception as e:
            print(f"Message handling error: {str(e)}")