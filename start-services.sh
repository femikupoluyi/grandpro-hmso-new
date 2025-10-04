#!/bin/bash

# Simple startup script for GrandPro HMSO services

echo "Starting GrandPro HMSO Services..."

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*serve-frontend.js" 2>/dev/null
sleep 2

cd /root/grandpro-hmso-new

# Start backend
echo "Starting backend on port 5000..."
cd backend
nohup node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
nohup node serve-frontend.js > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 3

# Test services
echo ""
echo "Testing services..."
curl -s http://localhost:5000/health | grep -q "healthy" && echo "✓ Backend is running" || echo "✗ Backend failed"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && echo "✓ Frontend is running" || echo "✗ Frontend failed"

echo ""
echo "Access URLs:"
echo "Frontend: http://morphvm-wz7xxc7v.ssh.cloud.morph.so:3000"
echo "Backend API: http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000"
echo ""
echo "View logs:"
echo "Backend: tail -f /root/grandpro-hmso-new/logs/backend.log"
echo "Frontend: tail -f /root/grandpro-hmso-new/logs/frontend.log"
