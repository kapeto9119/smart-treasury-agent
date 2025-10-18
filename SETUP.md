# 🚀 Quick Setup Guide

Complete setup instructions for Smart Treasury Agent.

## Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] Python 3.11+ installed
- [ ] Supabase project created
- [ ] Anthropic API key obtained
- [ ] Daytona API key obtained
- [ ] WorkOS credentials configured (or use dev mode)

## Step-by-Step Setup

### 1. Clone & Navigate

```bash
git clone <your-repo>
cd smart-treasury-agent
```

### 2. Database Setup (Supabase)

The database schema has already been created via MCP migrations. The following tables exist:

- ✅ accounts
- ✅ forecast
- ✅ policy
- ✅ scenario_runs
- ✅ transfers
- ✅ eval_logs
- ✅ users

Get your Supabase credentials:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

### 3. Backend Setup

```bash
cd back

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Daytona
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://api.daytona.io

# WorkOS (optional - dev mode works without)
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# Browser Use (optional)
BROWSER_USE_API_KEY=your_browser_use_api_key

# CORS
FRONTEND_URL=http://localhost:3000
EOF

# Start backend
npm run dev
```

Backend should start on http://localhost:3001

### 4. Seed Database

In a new terminal (keep backend running):

```bash
cd back
npx tsx src/scripts/seedData.ts
```

You should see:
```
🌱 Starting database seeding...
Creating accounts...
✓ Created 6 accounts
...
✅ Ready for simulation!
```

### 5. Frontend Setup

```bash
cd front/smart-treasury-agent

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WorkOS (optional - not required for dev)
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_WORKOS_CLIENT_ID=your_workos_client_id
EOF

# Start frontend
npm run dev
```

Frontend should start on http://localhost:3000

### 6. Test the Application

1. **Open Browser**: Navigate to http://localhost:3000
2. **View Dashboard**: You should see 6 accounts with balances
3. **Run Scenarios**: Click "Run Scenarios" button
4. **Watch Progress**: Scenarios will move from pending → running → completed
5. **View Results**: Click on a completed scenario to see details
6. **Execute Transfer**: Try executing a recommended transfer

## 🧪 Testing Python Simulation Locally

```bash
cd python-ms

# Use test input
cp test_input.json input.json

# Run simulation
python3 sim_runner.py

# View results
cat results.json
```

Expected output:
```json
{
  "idleCashPct": 22.5,
  "liquidityCoverageDays": 12.3,
  "estYieldBps": 115,
  "shortfallRiskPct": 6.2,
  "recommendation": "Transfer $70,000 from Operating Checking to High-Yield Savings"
}
```

## 🔧 Troubleshooting

### Backend won't start
- Check .env file has all required variables
- Verify Supabase URL and key are correct
- Check port 3001 is not in use: `lsof -i :3001`

### Frontend won't start
- Check .env.local exists
- Verify API URL points to backend
- Check port 3000 is not in use: `lsof -i :3000`

### Scenarios fail
- Check Daytona API key is valid
- Check backend logs for errors
- Verify Anthropic API key has credits
- Check Supabase connection

### No data showing
- Run seed script: `npx tsx src/scripts/seedData.ts`
- Check Supabase dashboard for data
- Check browser console for API errors

### Python simulation errors
- Verify Python 3.11+ is installed: `python3 --version`
- Check input.json is valid JSON
- Look at error message in terminal

## 📱 Development Mode Features

In development mode (NODE_ENV=development):

- **No Auth Required**: Authentication bypassed for easier testing
- **CORS Enabled**: Frontend can call backend
- **Detailed Logging**: See all API calls and errors
- **Hot Reload**: Both frontend and backend auto-reload on changes

## 🎯 Ready for Demo

Once everything is working:

1. ✅ Dashboard loads with accounts
2. ✅ Run Scenarios creates 3 parallel simulations
3. ✅ Scenarios complete within 30 seconds
4. ✅ Can view detailed results with Claude recommendations
5. ✅ Can execute transfers
6. ✅ Galileo evaluation shows confidence scores

You're ready to demo! 🎉

## 🚀 Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Configure proper WorkOS SSO
3. Set up SSL/TLS certificates
4. Use production Daytona environment
5. Enable RLS policies in Supabase
6. Set up monitoring and logging
7. Configure rate limiting

## 📞 Need Help?

- Check main README.md for architecture details
- Review backend/README.md for API docs
- Look at python-ms/README.md for simulation details
- Check Daytona documentation for sandbox issues
- Review Anthropic docs for Claude API

---

Happy hacking! 🎉

