#!/bin/bash
# Quick start script for SecureCollab Platform

echo "🚀 Starting SecureCollab Platform..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if setup has been run
if [ ! -d "backend/venv" ]; then
    echo "❌ Setup not completed. Please run ./setup.sh first"
    exit 1
fi

# Start backend in background
echo "🔧 Starting Backend..."
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend started successfully"
else
    echo "⚠️  Backend may still be starting..."
fi

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "🎉 Both services are starting!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "To stop services:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait
