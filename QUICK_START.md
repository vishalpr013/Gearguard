# GearGuard - Quick Start Guide

## ⚡ IMPORTANT: Understanding Your Backend

### **Your Backend is ALREADY RUNNING!** ✅

This project uses **Supabase** as a cloud backend service. There is **NO separate backend server to start**.

```
❌ You DON'T need to run: node server.js, python app.py, etc.
✅ Your backend is: Supabase Cloud (already running 24/7)
```

### What Supabase Provides:
- ☁️ **PostgreSQL Database** (hosted in the cloud)
- 🔐 **Authentication** (sign up/sign in)
- ⚡ **Real-time Updates** (instant data sync)
- 🚀 **REST API** (auto-generated)
- 🔒 **Security** (Row Level Security)

---

## 🚀 Complete Setup in 3 Steps

### **Step 1: Set Up Database Tables** (One-time setup)

1. **Open the SQL file**: `setup_complete_database.sql` (in this folder)

2. **Copy EVERYTHING** from that file (Ctrl+A, then Ctrl+C)

3. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq/sql/new
   - Or: Dashboard → Your Project (GearGuard) → SQL Editor → New query

4. **Paste and Run**:
   - Paste the SQL (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for: ✅ **"Success. No rows returned"**

5. **Verify Tables Created**:
   - Click "Table Editor" in left sidebar
   - You should see: `teams`, `users`, `equipment`, `requests`

---

### **Step 2: Start Frontend** (Every time)

Open terminal in project folder and run:

```powershell
npm run dev
```

You'll see:
```
VITE v5.4.8  ready in 447 ms
➜  Local:   http://localhost:5173/
```

---

### **Step 3: Use the App**

1. **Open browser**: http://localhost:5173

2. **Create your account**:
   - Click "Sign Up" tab
   - Enter your name, email, password
   - Click "Create Account"

3. **Sign in and start using GearGuard!**

---

## 📊 What's Running?

```
┌─────────────────────────────────────────┐
│  FRONTEND (Local)                       │
│  http://localhost:5173                  │
│  Tech: Vite + React + TypeScript        │
│  Status: ▶️  npm run dev                │
└─────────────────────────────────────────┘
                    ↕️ (API calls)
┌─────────────────────────────────────────┐
│  BACKEND (Cloud - Supabase)             │
│  https://hcksqblptemepdewhgmq.supabase  │
│  Tech: PostgreSQL + Auth + Realtime    │
│  Status: ☁️  Always running             │
└─────────────────────────────────────────┘
```

---

## 🔧 Common Questions

### Q: How do I start the backend?
**A:** You don't! Supabase is cloud-based and always running.

### Q: Do I need to install PostgreSQL?
**A:** No! The database is hosted on Supabase cloud.

### Q: What about API endpoints?
**A:** Supabase auto-generates REST/GraphQL APIs for all tables.

### Q: How do I see my data?
**A:** Go to Supabase Dashboard → Table Editor → select a table.

### Q: Can I work offline?
**A:** No, your app needs internet to connect to Supabase cloud.

---

## 🎯 Daily Development Workflow

Every time you want to work on this project:

1. Open terminal in project folder
2. Run: `npm run dev`
3. Open: http://localhost:5173
4. Start coding!

That's it! No backend server to start. 🎉

---

## 🆘 Troubleshooting

### "Sign up failed" or "Sign in failed"
- ✅ Check: Did you run the SQL setup? (Step 1 above)
- ✅ Check: Is your internet working? (needs Supabase cloud)
- ✅ Check: Is `.env` file correct? (should have VITE_SUPABASE_URL and KEY)

### Frontend won't start
- Run: `npm install` (install dependencies)
- Run: `npm run dev` (start dev server)

### Can't access Supabase Dashboard
- Check: Are you logged in to https://supabase.com?
- URL: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq

---

## 📝 Your Project URLs

- **Frontend (Local)**: http://localhost:5173
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq
- **Supabase SQL Editor**: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq/sql/new
- **Supabase Table Editor**: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq/editor

---

## ✅ Checklist

- [ ] Run SQL setup file in Supabase (one-time)
- [ ] Verify tables exist in Table Editor
- [ ] Start frontend with `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Create account and sign in
- [ ] Start using GearGuard!

---

**Need help?** Check the main README.md or SETUP_GUIDE.md files.
