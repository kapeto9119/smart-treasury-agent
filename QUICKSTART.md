# 🚀 Quick Start Guide

## Prerequisites Check

```bash
# Check Node.js version (need 20+)
node --version

# Check Python version (need 3.11+)
python3 --version

# Check Docker (optional but recommended)
docker --version
docker-compose --version
```

## Step-by-Step Setup

### 1️⃣ Clone and Configure

```bash
# Clone repository (if needed)
git clone <your-repo-url>
cd smart-treasury-agent

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your favorite editor
```

### 2️⃣ Option A: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# In another terminal, seed the database
docker-compose exec backend npx tsx src/scripts/seedData.ts

# Access the application
open http://localhost:3000
```

**Service URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Python Microservice: http://localhost:8000

### 2️⃣ Option B: Manual Setup

#### Python Microservice

```bash
cd python-ms

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Test locally (optional)
curl -X POST http://localhost:8000/simulate/local \
  -H "Content-Type: application/json" \
  -d @test_input.json

# Start service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Keep this terminal running
```

#### Backend (new terminal)

```bash
cd back

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env  # Add your API keys

# Build TypeScript
npm run build

# Start development server
npm run dev

# In another terminal, seed database
npx tsx src/scripts/seedData.ts

# Keep this terminal running
```

#### Frontend (new terminal)

```bash
cd front/smart-treasury-agent

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.example .env.local
nano .env.local  # Add your keys

# Start development server
npm run dev

# Keep this terminal running
```

### 3️⃣ Verify Everything Works

```bash
# Test Python service
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"treasury-simulation","daytona_connected":true}

# Test backend
curl http://localhost:3001/api/health
# Expected: {"status":"healthy","service":"smart-treasury-backend"}

# Open frontend
open http://localhost:3000
# Should see the dashboard
```

### 4️⃣ Run Your First Simulation

1. **Open** http://localhost:3000
2. **Click** "Run Scenarios" button
3. **Wait** ~10-30 seconds for 3 parallel simulations
4. **View** results comparing Conservative/Balanced/Aggressive strategies
5. **Click** on a scenario to see Claude's recommendation
6. **Execute** the recommended transfer

## 🔧 Troubleshooting

### Python Service Won't Start

```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill existing process if needed
kill -9 <PID>

# Try running with different port
PORT=8001 uvicorn app.main:app --reload
```

### Backend Won't Start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Verify environment variables
cat back/.env | grep -v "^#" | grep -v "^$"

# Check for missing dependencies
cd back && npm install

# Check TypeScript compilation
npm run build
```

### Frontend Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
cd front/smart-treasury-agent
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Database Issues

```bash
# Verify Supabase connection
curl -X POST https://YOUR_PROJECT.supabase.co/rest/v1/accounts \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Re-run seed script
cd back
npx tsx src/scripts/seedData.ts
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes and rebuild
docker-compose down -v
docker-compose up --build

# View logs
docker-compose logs -f python-service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🧪 Testing

### Test Python Service Locally

```bash
cd python-ms

# Activate virtual environment
source venv/bin/activate

# Run local simulation (no Daytona)
curl -X POST http://localhost:8000/simulate/local \
  -H "Content-Type: application/json" \
  -d @test_input.json

# Should return simulation results
```

### Test Backend API

```bash
# Get accounts
curl http://localhost:3001/api/accounts

# Get forecast
curl http://localhost:3001/api/forecast

# Get policy
curl http://localhost:3001/api/policy
```

### Test Full Flow

```bash
# Run scenarios
curl -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"modes":["conservative","balanced","aggressive"]}'

# Wait a few seconds, then get scenarios
curl http://localhost:3001/api/scenarios
```

## 📋 Required Environment Variables

### Critical (Must Have)

```bash
# Supabase (Database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Daytona (Simulations)
DAYTONA_API_KEY=your_daytona_key
DAYTONA_API_URL=https://api.daytona.io

# Python Service
PYTHON_SERVICE_URL=http://localhost:8000
```

### Optional (Nice to Have)

```bash
# WorkOS (Authentication - can be skipped in dev)
WORKOS_API_KEY=sk_live_...
WORKOS_CLIENT_ID=client_...

# Galileo (AI Observability)
GALILEO_API_KEY=your_key
GALILEO_PROJECT_ID=your_project

# Browser Use (Market Data)
BROWSER_USE_API_KEY=your_key
```

## 🎯 Success Criteria

✅ All three services running without errors
✅ Health checks pass for Python (8000) and Backend (3001)
✅ Frontend loads at http://localhost:3000
✅ Dashboard shows accounts and forecast data
✅ "Run Scenarios" creates 3 scenarios
✅ Scenarios complete with status "completed"
✅ Results include metrics and Claude recommendations
✅ Can view individual scenario details

## 📚 Next Steps

Once everything is running:

1. **Explore** the dashboard and data
2. **Run** multiple scenario sets
3. **Compare** different strategy outputs
4. **Execute** transfers and see balance updates
5. **Check** Galileo dashboard (if configured)
6. **Review** Daytona workspaces (if configured)

## 🆘 Need Help?

- Check [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) for architecture details
- Review [README.md](./README.md) for full documentation
- Look at logs: `docker-compose logs -f` or console output in dev mode

---

Happy Treasury Management! 💰

