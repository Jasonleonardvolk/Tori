#!/bin/bash
# TORI Chat One-Step Deployment Script (Unix/Mac version)
# This script handles all steps to build and deploy the TORI Chat interface
# Now includes conversation extraction functionality

echo ""
echo "======================================="
echo "    TORI Chat Production Deployment    "
echo "======================================="
echo ""
echo "This script will build and deploy the TORI Chat interface"
echo "and launch it on http://localhost:3000"
echo ""

# Check for extraction-related arguments
EXTRACT_CONVERSATION=""
VERIFY_EXTRACTION=false
OUTPUT_DIR=""

# Parse arguments
for arg in "$@"
do
  case $arg in
    --extract=*)
      EXTRACT_CONVERSATION="${arg#*=}"
      shift
      ;;
    --verify)
      VERIFY_EXTRACTION=true
      shift
      ;;
    --outdir=*)
      OUTPUT_DIR="${arg#*=}"
      shift
      ;;
  esac
done

# Process extraction if requested
if [ ! -z "$EXTRACT_CONVERSATION" ]; then
  echo "Conversation extraction requested for: $EXTRACT_CONVERSATION"
  
  EXTRACT_ARGS="--conversation $EXTRACT_CONVERSATION"
  
  if [ "$VERIFY_EXTRACTION" = true ]; then
    EXTRACT_ARGS="$EXTRACT_ARGS --verify"
  fi
  
  if [ ! -z "$OUTPUT_DIR" ]; then
    EXTRACT_ARGS="$EXTRACT_ARGS --output $OUTPUT_DIR"
  fi
  
  echo "Running extraction with arguments: $EXTRACT_ARGS"
  node extraction-integration.js $EXTRACT_ARGS
  
  # Exit after extraction if --extract-only is specified
  if [[ "$*" == *"--extract-only"* ]]; then
    echo "Extraction complete. Exiting as requested by --extract-only flag."
    exit 0
  fi
  
  echo ""
  echo "Continuing with deployment..."
  echo ""
fi


# Navigate to the correct directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/tori_chat_frontend"

# Verify we're in the right place
if [ ! -f "vite.config.js" ]; then
  echo "ERROR: Not in the correct directory!"
  echo "Expected to find vite.config.js in $(pwd)"
  echo ""
  read -p "Press Enter to exit..."
  exit 1
fi

# Clean any existing build
echo "Cleaning previous build..."
if [ -d "dist" ]; then
  rm -rf dist
fi

# Fix React dependency conflicts
echo "Checking for React dependency conflicts..."
if node ../fix-react-deps.js --ci; then
  echo "React dependencies check passed."
else
  echo "Failed to fix React dependencies."
  read -p "Press Enter to exit..."
  exit 1
fi

# Install dependencies
echo "Installing production dependencies..."
echo "Running: npm ci --omit dev"
npm ci --omit dev
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to install dependencies."
  echo "Trying alternative approach..."
  npm ci --omit dev --legacy-peer-deps
  if [ $? -ne 0 ]; then
    echo "ERROR: All dependency installation methods failed."
    echo "See TORI_CHAT_DEPLOYMENT_PLAN.md for details."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
  fi
fi

# Verify Vite config has correct entry point
echo "Checking Vite configuration..."
if ! grep -q "src/index.html" vite.config.js; then
  echo "WARNING: Your vite.config.js might not be using the correct entry point."
  echo "This could result in building the redirect page instead of the full UI."
  echo "See TORI_CHAT_DEPLOYMENT_PLAN.md for details on fixing this."
  echo ""
  read -p "Press any key to continue anyway..."
fi

# Verify .env.production exists
if [ ! -f ".env.production" ]; then
  echo "Creating .env.production..."
  echo "VITE_APP_MODE=chat" > .env.production
  echo "PUBLIC_URL=/" >> .env.production
fi

# Build the application 
echo "Building production version..."
echo "Running: npx vite build"
npx vite build
if [ $? -ne 0 ]; then
  echo "ERROR: Build failed. See error messages above."
  echo ""
  read -p "Press Enter to exit..."
  exit 1
fi

# Verify build size
SIZE=$(stat --format=%s dist/index.html 2>/dev/null || stat -f %z dist/index.html 2>/dev/null)
echo "Built index.html size: $SIZE bytes"
if [ "$SIZE" -lt 1000 ]; then
  echo "WARNING: The built index.html is very small ($SIZE bytes)"
  echo "This might indicate it's still the redirect page rather than the full UI."
  echo ""
  read -p "Press any key to continue anyway..."
fi

# Install express if needed
echo "Checking for express dependency..."
if ! npm list express --depth=0 &>/dev/null; then
  echo "Installing express..."
  npm install express
fi

# Check if port is in use
echo ""
echo "Checking if port 3000 is available..."
if ! node ../check-port.js; then
  echo "Would you like to try an alternative port? (y/n)"
  read -r choice
  if [[ "$choice" =~ ^[Yy]$ ]]; then
    echo "Using port 3001 instead..."
    export PORT=3001
    echo "Access the application at: http://localhost:3001"
  else
    echo ""
    echo "Please manually stop the process using port 3000 and try again."
    echo "Use: lsof -i :3000"
    echo "Then: kill -9 PID_NUMBER"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
  fi
else
  export PORT=3000
  echo "Access the application at: http://localhost:3000"
fi

# Start the production server
echo ""
echo "Starting production server..."
echo "Running: node start-production.cjs"
echo ""
echo "Press Ctrl+C to stop the server when finished."
echo ""
node start-production.cjs

# If we get here, something went wrong
echo ""
echo "The server has stopped unexpectedly."
echo "Check the error messages above for more information."
echo ""
read -p "Press Enter to exit..."
