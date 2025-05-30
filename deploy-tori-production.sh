#!/bin/bash
# 🚀 TORI PRODUCTION DEPLOYMENT SCRIPT
# Complete launch sequence for TORI Cognitive OS with Banksy Integration

echo "🧠 TORI COGNITIVE OS - PRODUCTION DEPLOYMENT"
echo "=============================================="
echo "Date: $(date)"
echo "System: TORI with Banksy Oscillator Integration"
echo "Status: Ready for Production Launch!"
echo ""

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start Banksy backend
start_banksy_backend() {
    echo "🌀 Starting Banksy Oscillator Backend..."
    
    # Check if port 8000 is available
    if ! check_port 8000; then
        echo "🔄 Attempting to free port 8000..."
        pkill -f "simulation_api.py" 2>/dev/null || true
        sleep 2
    fi
    
    # Navigate to backend directory
    cd alan_backend/server
    
    # Check if Python dependencies are installed
    if ! python -c "import fastapi, uvicorn, websockets" >/dev/null 2>&1; then
        echo "📦 Installing Python dependencies..."
        pip install fastapi uvicorn websockets numpy
    fi
    
    # Start the simulation API server
    echo "🚀 Launching Banksy simulation API on port 8000..."
    nohup python simulation_api.py > ../../logs/banksy_backend.log 2>&1 &
    BANKSY_PID=$!
    echo $BANKSY_PID > ../../logs/banksy.pid
    
    # Wait for backend to start
    sleep 3
    
    # Verify backend is running
    if curl -s http://localhost:8000/ >/dev/null; then
        echo "✅ Banksy backend is running (PID: $BANKSY_PID)"
        return 0
    else
        echo "❌ Failed to start Banksy backend"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "🖥️  Starting TORI Frontend..."
    
    # Navigate back to project root
    cd ../..
    
    # Check if port 3000 is available
    if ! check_port 3000; then
        echo "🔄 Attempting to free port 3000..."
        pkill -f "npm start\\|react-scripts\\|node.*react" 2>/dev/null || true
        sleep 2
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing Node.js dependencies..."
        npm install
    fi
    
    # Build the application
    echo "🔨 Building production frontend..."
    npm run build
    
    # Start the development server (or use serve for production)
    echo "🚀 Launching TORI frontend on port 3000..."
    nohup npm start > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    
    # Wait for frontend to start
    sleep 5
    
    # Verify frontend is running
    if curl -s http://localhost:3000/ >/dev/null; then
        echo "✅ TORI frontend is running (PID: $FRONTEND_PID)"
        return 0
    else
        echo "❌ Failed to start TORI frontend"
        return 1
    fi
}

# Function to run health checks
run_health_checks() {
    echo "🏥 Running system health checks..."
    
    # Check backend API
    echo "🔍 Checking Banksy API..."
    if curl -s http://localhost:8000/ | grep -q "ALAN Simulation API"; then
        echo "✅ Banksy API is healthy"
    else
        echo "❌ Banksy API health check failed"
        return 1
    fi
    
    # Check frontend
    echo "🔍 Checking TORI frontend..."
    if curl -s http://localhost:3000/ >/dev/null; then
        echo "✅ TORI frontend is healthy"
    else
        echo "❌ TORI frontend health check failed"
        return 1
    fi
    
    # Check WebSocket connection (simplified)
    echo "🔍 Checking WebSocket capabilities..."
    if curl -s http://localhost:8000/ws/simulate >/dev/null; then
        echo "✅ WebSocket endpoint is accessible"
    else
        echo "❌ WebSocket endpoint check failed"
        return 1
    fi
    
    return 0
}

# Function to display system status
show_system_status() {
    echo ""
    echo "🎯 TORI SYSTEM STATUS"
    echo "===================="
    echo "🌀 Banksy Backend:  http://localhost:8000"
    echo "🖥️  TORI Frontend:   http://localhost:3000"
    echo "📊 API Docs:        http://localhost:8000/docs"
    echo "🔌 WebSocket:       ws://localhost:8000/ws/simulate"
    echo ""
    echo "📁 Log Files:"
    echo "   Backend:  logs/banksy_backend.log"
    echo "   Frontend: logs/frontend.log"
    echo ""
    echo "🔧 Process IDs:"
    if [ -f logs/banksy.pid ]; then
        echo "   Banksy:   $(cat logs/banksy.pid)"
    fi
    if [ -f logs/frontend.pid ]; then
        echo "   Frontend: $(cat logs/frontend.pid)"
    fi
    echo ""
}

# Function to show usage instructions
show_usage() {
    echo "🎮 USING TORI"
    echo "============"
    echo "1. Open browser to: http://localhost:3000"
    echo "2. Look for Banksy Oscillator panel (🌀 icon)"
    echo "3. Check status indicators (should be green)"
    echo "4. Click 'Start Simulation' to test Banksy"
    echo "5. Watch real-time synchronization metrics"
    echo ""
    echo "🔧 MONITORING"
    echo "============"
    echo "• Debug panel available in UI (toggle on)"
    echo "• Backend API docs: http://localhost:8000/docs"
    echo "• Check logs in logs/ directory"
    echo ""
    echo "🛑 STOPPING"
    echo "==========="
    echo "• Run: ./stop-tori-production.sh"
    echo "• Or manually kill processes listed above"
    echo ""
}

# Main deployment sequence
main() {
    # Create logs directory
    mkdir -p logs
    
    # Clear any existing PIDs
    rm -f logs/*.pid
    
    echo "🚀 Starting TORI Production Deployment..."
    echo ""
    
    # Start backend first
    if ! start_banksy_backend; then
        echo "❌ Backend startup failed. Aborting deployment."
        exit 1
    fi
    
    echo ""
    
    # Start frontend
    if ! start_frontend; then
        echo "❌ Frontend startup failed. Aborting deployment."
        exit 1
    fi
    
    echo ""
    
    # Run health checks
    if ! run_health_checks; then
        echo "❌ Health checks failed. System may not be fully operational."
        echo "🔍 Check log files for details."
        exit 1
    fi
    
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    
    # Show system status
    show_system_status
    
    # Show usage instructions
    show_usage
    
    echo "✅ TORI Cognitive OS with Banksy Integration is now LIVE!"
    echo "🧠 The system is ready for cognitive exploration and reasoning."
    echo ""
}

# Run main deployment
main "$@"
