# ✅ Pre-Demo Checklist

Complete this checklist before your Daytona HackSprint SF 2025 demo.

---

## 🔧 Environment Setup

### API Keys & Credentials
- [ ] **Supabase**: Project URL and anon key configured
- [ ] **Anthropic**: Claude API key with available credits
- [ ] **Daytona**: API key with sandbox creation permissions
- [ ] **WorkOS**: Client ID and API key (or using dev mode)
- [ ] **Browser Use**: API key (optional)

### Backend Configuration
- [ ] `/back/.env` file created with all required variables
- [ ] Backend dependencies installed: `cd back && npm install`
- [ ] Backend starts without errors: `npm run dev`
- [ ] Backend health check passes: http://localhost:3001/api/health
- [ ] Database seeded successfully: `npm run seed`

### Frontend Configuration
- [ ] `/front/smart-treasury-agent/.env.local` created
- [ ] Frontend dependencies installed: `cd front/smart-treasury-agent && npm install`
- [ ] Frontend starts without errors: `npm run dev`
- [ ] Frontend loads at: http://localhost:3000

### Database Verification
- [ ] All 7 tables exist in Supabase (accounts, forecast, policy, etc.)
- [ ] Seed data visible: 6 accounts with balances
- [ ] 30-day forecast data present
- [ ] Active treasury policy created

---

## 🧪 Functionality Testing

### Basic Features
- [ ] **Dashboard loads** with account cards showing balances
- [ ] **Total cash** displays correctly (~$2.6M with seed data)
- [ ] **7-day forecast** shows inflow/outflow data
- [ ] **Treasury policy** displays in sidebar
- [ ] **No console errors** in browser developer tools

### Scenario Execution
- [ ] **"Run Scenarios" button** is visible and clickable
- [ ] Clicking button creates 3 scenarios (Conservative, Balanced, Aggressive)
- [ ] Scenarios transition: pending → running → completed
- [ ] Completion happens within 30-60 seconds
- [ ] All 3 scenarios complete successfully (no failures)

### Scenario Details
- [ ] Can click on completed scenario to view details
- [ ] **Metrics display** correctly:
  - Idle Cash % (e.g., 22%)
  - Liquidity Coverage Days (e.g., 12.3 days)
  - Estimated Yield (e.g., 115 bps)
  - Shortfall Risk % (e.g., 6%)
- [ ] **Claude recommendation** shows with rationale
- [ ] **Galileo evaluation** shows confidence score and risk flag
- [ ] **Execute Transfer** button works (updates account balances)

### UI/UX Polish
- [ ] Loading spinners show during async operations
- [ ] Status badges show correct colors (pending=yellow, running=blue, completed=green)
- [ ] All buttons and links are clickable
- [ ] Page navigation works (Home ↔ Scenarios ↔ Detail)
- [ ] Responsive design looks good on laptop screen
- [ ] No layout breaks or overlapping elements

---

## 📊 Demo Prep

### Story & Talking Points
- [ ] **Problem statement** clear: Manual, Excel-driven treasury is inefficient
- [ ] **Solution summary** ready: AI-powered parallel simulations with Daytona
- [ ] **Daytona value prop** highlighted: Parallel execution of 3+ sandboxes simultaneously
- [ ] **Claude integration** explained: Context-aware recommendations with rationale
- [ ] **Target audience** defined: Mid-to-large enterprises with complex treasury needs

### Demo Flow Rehearsed
- [ ] **Opening** (30s): Show dashboard, explain $2.6M across 6 accounts
- [ ] **Run scenarios** (30s): Click button, show parallel execution starting
- [ ] **Real-time updates** (30s): Watch scenarios move from pending → running → completed
- [ ] **Review results** (60s): Open Balanced scenario, walk through 4 metrics
- [ ] **Claude recommendation** (30s): Show AI analysis and transfer suggestion
- [ ] **Galileo evaluation** (20s): Point out 92% confidence, LOW risk
- [ ] **Execute** (20s): Click execute, show balances update
- [ ] **Closing** (10s): Emphasize Daytona parallel power + Claude intelligence

### Backup Plans
- [ ] Screenshots of working demo (in case of live demo issues)
- [ ] Pre-recorded video walkthrough (optional safety net)
- [ ] Browser tabs pre-opened to key URLs
- [ ] Terminal windows ready with backend running
- [ ] Test scenarios pre-run so you know they work

---

## 🎬 Demo Day Setup

### 30 Minutes Before
- [ ] Restart computer (fresh start)
- [ ] Close unnecessary applications
- [ ] Check internet connection is stable
- [ ] Test backend: `cd back && npm run dev`
- [ ] Test frontend: `cd front/smart-treasury-agent && npm run dev`
- [ ] Run one test scenario end-to-end
- [ ] Clear browser cache and restart browser

### 5 Minutes Before
- [ ] Backend running on :3001
- [ ] Frontend running on :3000
- [ ] Dashboard loaded and looking good
- [ ] No errors in terminal or console
- [ ] Screen sharing tested and working
- [ ] Presentation mode enabled (hide notifications)

### During Demo
- [ ] Speak clearly about the problem you're solving
- [ ] Highlight Daytona's parallel execution capability
- [ ] Show Claude's intelligent recommendations
- [ ] Emphasize production-ready code quality
- [ ] Have fun! 🎉

---

## ⚠️ Troubleshooting Quick Fixes

### Scenarios Won't Start
```bash
# Check Daytona API key
echo $DAYTONA_API_KEY

# Check backend logs
# Look for errors in terminal running backend
```

### Scenarios Stay "Running" Forever
- Daytona API might be slow
- Check your API key has sufficient quota
- Try with just 1 scenario first: modify modes array in code

### Claude Recommendations Don't Show
- Check Anthropic API key
- Verify Claude API credits available
- Backend will fallback to simulation recommendation if Claude fails

### Frontend Not Loading Data
```bash
# Check API connection
curl http://localhost:3001/api/health
curl http://localhost:3001/api/accounts
```

### "No active policy found" Error
```bash
# Re-run seed script
cd back
npm run seed
```

---

## 🎯 Success Criteria

Your demo is ready when:

✅ Dashboard loads in < 3 seconds
✅ Accounts show realistic balances
✅ "Run Scenarios" creates 3 scenarios
✅ All scenarios complete successfully
✅ Metrics display correctly
✅ Claude recommendations appear
✅ Galileo scores show confidence
✅ Transfer execution works
✅ No errors in console or terminal
✅ You feel confident explaining the value

---

## 📝 Final Checks

- [ ] Code is committed to git
- [ ] README.md is comprehensive
- [ ] .env files are NOT committed (check .gitignore)
- [ ] All TODO items are complete
- [ ] Demo script is practiced 2-3 times
- [ ] You know how to handle questions about:
  - How Daytona integration works
  - Why parallel execution matters
  - How Claude generates recommendations
  - What production deployment would look like
  - Future features/roadmap

---

## 🚀 You're Ready!

When all checkboxes above are complete, you have:

- ✨ A working, production-ready application
- 🎯 A clear demo flow that highlights key features
- 💪 Confidence in handling technical questions
- 🏆 A strong entry for the hackathon

**Go win that hackathon!** 🎉

---

*Good luck from your AI coding assistant!* 🤖

