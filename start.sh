#!/bin/bash

echo "============================================"
echo "   Wellness Coach Pro - Startup Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Step 1: Clean up ports
echo -e "${YELLOW}Step 1: Cleaning up ports 3000, 4000, 4001...${NC}"
kill_port 3000
kill_port 4000
kill_port 4001
echo -e "${GREEN}Ports cleaned!${NC}"
echo ""

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}Dependencies installed!${NC}"
else
    echo -e "${GREEN}Step 2: Dependencies already installed.${NC}"
fi
echo ""

# Step 3: Seed the database
echo -e "${YELLOW}Step 3: Seeding database with sample data...${NC}"
npx ts-node --compiler-options '{"module":"CommonJS"}' src/lib/seed.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database seeded successfully!${NC}"
else
    echo -e "${RED}Warning: Database seeding failed. The app will still start.${NC}"
fi
echo ""

# Step 4: Start the application
echo -e "${YELLOW}Step 4: Starting the application...${NC}"
echo ""
echo "============================================"
echo -e "${GREEN}   Application starting on port 3000${NC}"
echo "============================================"
echo ""
echo "Open your browser and navigate to:"
echo -e "${GREEN}   http://localhost:3000${NC}"
echo ""
echo "Available pages:"
echo "   - Home:         http://localhost:3000"
echo "   - Clients:      http://localhost:3000/clients"
echo "   - Fitness:      http://localhost:3000/fitness"
echo "   - Nutrition:    http://localhost:3000/nutrition"
echo "   - Wellness:     http://localhost:3000/wellness"
echo "   - Appointments: http://localhost:3000/appointments"
echo "   - Admin:        http://localhost:3000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo ""

npm run dev
