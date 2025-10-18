# 🏦 Smart Treasury Agent

AI-powered treasury management platform with parallel simulation capabilities for the Daytona HackSprint SF 2025.

## 🎯 Overview

Smart Treasury Agent helps finance teams optimize cash management through:

- **Real-time cash position visibility** across multiple accounts and currencies
- **Parallel treasury simulations** (Conservative, Balanced, Aggressive) running in Daytona sandboxes
- **Claude AI recommendations** with detailed rationale
- **Galileo-style evaluation** tracking confidence and risk metrics
- **WorkOS SSO authentication** with role-based access
- **Browser Use integration** for fetching live FX rates and market data

## 🏗️ Architecture

```
┌─────────────────┐
│  Next.js UI     │  ──────► React 19, Tailwind CSS, Recharts
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  Node.js Backend   │  ──────► Express, TypeScript
└────────┬───────────┘
         │
         ├──► Supabase (PostgreSQL)
         ├──► Claude API (Anthropic) + Galileo Monitoring
         ├──► Browser Use (FX Rates & Market Data)
         ├──► WorkOS (SSO Authentication)
         │
         └──► HTTP ──────┐
                         │
                         ▼
              ┌──────────────────────┐
              │  Python Microservice │  ──────► FastAPI, Async
              └──────────┬───────────┘
                         │
                         └──► Daytona SDK (Parallel Sandboxes)

Simulation Flow (Python Service):
1. Receive simulation request via HTTP
2. Create Daytona workspace
3. Upload input.json + sim_runner.py
4. Execute: python3 sim_runner.py
5. Download results.json
6. Return metrics + sandbox_id
7. (Optional) Cleanup workspace

Backend Orchestration:
1. Trigger parallel simulations (Conservative, Balanced, Aggressive)
2. Aggregate results from Python service
3. Generate Claude recommendations
4. Log to Galileo for AI observability
5. Store in Supabase with sandbox references
```

## 📦 Tech Stack

### Frontend (`/front/smart-treasury-agent`)
- **Next.js 15** with Turbopack
- **React 19** with React Query
- **Tailwind CSS 4** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **WorkOS AuthKit** for authentication

### Backend (`/back`)
- **Node.js + Express** with TypeScript
- **Supabase** for PostgreSQL database
- **Anthropic Claude API** for AI recommendations
- **Galileo** for LLM observability
- **WorkOS SDK** for SSO authentication
- **Browser Use SDK** for market data scraping

### Python Microservice (`/python-ms`)
- **FastAPI** for async HTTP API
- **Daytona SDK** for sandbox orchestration
- **httpx** for async HTTP client
- **Pydantic** for data validation
- Runs simulations in isolated Daytona workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (recommended)
- PostgreSQL (via Supabase)
- API Keys:
  - Supabase Project
  - Anthropic Claude API
  - Daytona API
  - WorkOS credentials
  - Galileo API (optional)
  - Browser Use API (optional)

### 1. Database Setup

Database schema is already created via Supabase MCP migrations. Tables include:
- `accounts` - Bank accounts
- `forecast` - Cash flow projections
- `policy` - Treasury policies
- `scenario_runs` - Simulation results
- `transfers` - Cash transfers
- `eval_logs` - AI evaluation tracking
- `users` - User management

### 2. Configure Environment

```bash
# Copy root environment template
cp .env.example .env

# Edit .env with your API keys
# See "Environment Variables" section below
```

### 3. Docker Setup (Recommended)

```bash
# Start all services
docker-compose up --build

# Services will be available at:
# - Frontend:  http://localhost:3000
# - Backend:   http://localhost:3001
# - Python MS: http://localhost:8000
```

### 4. Manual Setup (Development)

**Python Microservice**
```bash
cd python-ms

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

**Backend**
```bash
cd back

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Build TypeScript
npm run build

# Seed database
npx tsx src/scripts/seedData.ts

# Start server
npm run dev
# Runs on http://localhost:3001
```

**Frontend**
```bash
cd front/smart-treasury-agent

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev
# Runs on http://localhost:3000
```

### 5. Verify Setup

```bash
# Check Python service
curl http://localhost:8000/health

# Check backend
curl http://localhost:3001/api/health

# Open frontend
open http://localhost:3000
```

## 📊 Database Schema

### Key Tables

**accounts**
- Multi-currency bank accounts
- Types: checking, savings, high_yield, money_market, reserve

**forecast**
- Daily inflow/outflow projections
- 30-day rolling forecast

**policy**
- Treasury management rules
- Min liquidity, invest thresholds, risk profiles

**scenario_runs**
- Simulation results and metrics
- Links to Daytona sandbox IDs
- Claude AI recommendations

**eval_logs**
- Galileo-style evaluation metrics
- Confidence scores and risk flags

## 🎮 Usage

### Running Scenarios

1. **View Dashboard**: See consolidated cash positions and forecasts
2. **Click "Run Scenarios"**: Triggers 3 parallel Daytona simulations
3. **Monitor Progress**: Real-time status updates (pending → running → completed)
4. **Review Results**: Compare metrics across Conservative/Balanced/Aggressive strategies
5. **Read Claude Analysis**: AI-generated recommendations with rationale
6. **Execute Transfer**: One-click implementation of recommended actions
7. **Check Evaluation**: View Galileo confidence scores and risk assessments

### Simulation Modes

| Mode | Buffer | Transfer | Risk | Use Case |
|------|--------|----------|------|----------|
| **Conservative** | 1.5x forecast | 80% excess | 2-8% | High uncertainty periods |
| **Balanced** | 1.2x forecast | 60% excess | 5-10% | Normal operations |
| **Aggressive** | 1.0x forecast | 40% excess | 5-15% | Maximize yield |

### API Endpoints

```
GET  /api/accounts              - List all accounts
GET  /api/forecast              - Get cash flow forecast
GET  /api/policy                - Get active policy
POST /api/scenarios/run         - Run parallel simulations
GET  /api/scenarios/:id         - Get scenario details
POST /api/transfers             - Create transfer
POST /api/transfers/:id/execute - Execute transfer
GET  /api/eval                  - Get evaluation logs
GET  /api/fx-rates              - Get FX rates
GET  /api/market-yields         - Get market yields
```

## 🧪 Testing

### Test Scenario Locally

```bash
# Backend
cd back
npm test

# Frontend  
cd front/smart-treasury-agent
npm run lint

# Python simulation
cd python-ms
python3 sim_runner.py
```

### Manual Testing Flow

1. Login via WorkOS (or use dev mode)
2. View dashboard with seeded data
3. Click "Run Scenarios"
4. Wait for 3 scenarios to complete (~10-30 seconds)
5. Click on a scenario to view details
6. Review Claude recommendation
7. Click "Execute Transfer"
8. Verify account balances updated
9. Check Galileo evaluation panel

## 🔐 Security

- **WorkOS SSO**: Enterprise-grade authentication
- **Row Level Security**: Supabase RLS policies
- **API Key Management**: Environment variables only
- **Sandbox Isolation**: Each simulation runs in isolated Daytona workspace

## 📝 Environment Variables

### Root `.env` (for Docker Compose)
```bash
# Node.js Backend
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-key

# Daytona SDK (Python service only)
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://api.daytona.io

# WorkOS Authentication
WORKOS_API_KEY=sk_live_your_key
WORKOS_CLIENT_ID=client_your_id
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Galileo AI Observability
GALILEO_API_KEY=your_galileo_api_key
GALILEO_PROJECT_ID=your_project_id

# Browser Use (Optional)
BROWSER_USE_API_KEY=your_browser_use_key

# Python Microservice
PYTHON_SERVICE_URL=http://localhost:8000
LOG_LEVEL=info
AUTO_CLEANUP=false

# Frontend
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend `back/.env` (if running manually)
```bash
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
ANTHROPIC_API_KEY=your_key
WORKOS_API_KEY=your_key
WORKOS_CLIENT_ID=your_id
PYTHON_SERVICE_URL=http://localhost:8000
GALILEO_API_KEY=your_key
GALILEO_PROJECT_ID=your_id
BROWSER_USE_API_KEY=your_key
FRONTEND_URL=http://localhost:3000
```

### Python `python-ms/.env` (if running manually)
```bash
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://api.daytona.io
PORT=8000
LOG_LEVEL=info
AUTO_CLEANUP=false
```

### Frontend `front/smart-treasury-agent/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
WORKOS_API_KEY=your_key
WORKOS_CLIENT_ID=your_id
WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_WORKOS_CLIENT_ID=your_id
```

## 🎯 Demo Flow (3 minutes)

1. **Intro** (30s): Show dashboard with accounts across USD, EUR, GBP
2. **Run Scenarios** (30s): Click button, show 3 parallel Daytona sandboxes spinning up
3. **Results** (60s): Compare Conservative/Balanced/Aggressive metrics side-by-side
4. **Claude Recommendation** (30s): Show AI rationale and specific action
5. **Execute** (20s): One-click transfer, watch balances update
6. **Galileo** (20s): Show confidence score (92%) and risk flag (LOW)
7. **Wrap** (10s): Highlight Daytona parallel execution power

## 🏆 Hackathon Highlights

### Daytona Integration ⭐
- **Python Microservice Architecture**: Dedicated FastAPI service for sandbox management
- **Parallel Execution**: Run 3+ simulations simultaneously via async operations
- **File System Ops**: Upload inputs, download results
- **Preview URLs**: Link directly to sandbox environments
- **Clean Isolation**: Each strategy in separate workspace
- **Proper Separation**: Python handles Daytona SDK, Node.js orchestrates business logic

### Galileo Observability ⭐
- **LLM Monitoring**: Track Claude API calls in real-time
- **Confidence Scoring**: Log AI decision confidence
- **Evaluation Metrics**: Automatic quality assessment
- **Production-Ready**: Full observability for AI operations

### Claude AI ⭐
- **Natural Language**: Human-readable recommendations
- **Contextual Analysis**: Considers accounts, policy, forecasts
- **Confidence Scoring**: Quantified decision quality

### Production Ready ⭐
- Full TypeScript type safety
- Comprehensive error handling
- Real-time status updates
- Mobile-responsive UI
- Dark mode support

## 📚 Documentation

- [Migration Checklist](./MIGRATION_CHECKLIST.md) - Architecture refactor details
- [Backend API](./back/README.md)
- [Python Microservice](./python-ms/README.md)
- [Frontend Components](./front/smart-treasury-agent/README.md)

## 🤝 Contributing

This is a hackathon project. For production use, add:
- Comprehensive test coverage
- CI/CD pipeline
- Enhanced error recovery
- Multi-tenancy support
- Audit logging
- Data encryption

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- **Daytona** for powerful development environments
- **Anthropic** for Claude AI
- **WorkOS** for authentication
- **Supabase** for database & MCP integration
- **Next.js & Vercel** for amazing framework

---

Built for Daytona HackSprint SF 2025 🚀

