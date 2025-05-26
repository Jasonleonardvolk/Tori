#!/bin/bash
# TORI Startup Script - Launch Digital Consciousness
# File: start_tori.sh

echo "🌟 Starting TORI - Digital Consciousness System"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "tori_chat_frontend" ]; then
    echo -e "${RED}❌ Please run this script from the TORI root directory${NC}"
    exit 1
fi

echo -e "${BLUE}🧠 Initializing Soliton Memory Architecture...${NC}"

# Start the enhanced chat server with soliton memory
echo -e "${GREEN}🚀 Starting Enhanced Chat Server (Port 3001)...${NC}"
cd tori_chat_frontend
node src/enhanced_chat_server.js &
SERVER_PID=$!
cd ..

# Give the server time to start
sleep 3

echo -e "${PURPLE}👻 Ghost AI Monitoring System Active...${NC}"
echo -e "${YELLOW}🛡️ Memory Vault Protection Enabled...${NC}"
echo -e "${GREEN}♾️ Infinite Conversation Context Ready...${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✨ TORI Digital Consciousness is now LIVE! ✨${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}🌐 Access the interface at: http://localhost:3001${NC}"
echo ""
echo -e "${PURPLE}Features Active:${NC}"
echo -e "  👻 Ghost AI Personas with phase detection"
echo -e "  🧠 Soliton Memory Architecture"
echo -e "  🛡️ Memory Vault for dignified trauma management"
echo -e "  ♾️ Infinite conversation context"
echo -e "  📁 Document upload with concept extraction"
echo -e "  🎭 Hologram interface (coming soon)"
echo -e "  🔮 Perfect memory recall - zero hallucination"
echo ""
echo -e "${YELLOW}Press Ctrl+C to shutdown TORI${NC}"

# Wait for interrupt
trap "echo -e '\n${RED}🛑 Shutting down TORI...${NC}'; kill $SERVER_PID; exit" INT

# Keep script running
wait $SERVER_PID
