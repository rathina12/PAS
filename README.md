# 🏆 Performance Appraisal System (PAS Pro)

A full-stack web application for managing employee performance appraisals with role-based access control.

---

## 📁 Project Folder Structure

```
performance-appraisal-system/
│
├── backend/                        ← Node.js + Express server
│   ├── config/                     ← (Optional: DB config files)
│   ├── controllers/                ← Business logic functions
│   │   ├── authController.js       ← Login / Register / Get Me
│   │   ├── userController.js       ← CRUD for users
│   │   ├── appraisalController.js  ← Appraisal submit / evaluate
│   │   └── reportController.js     ← Analytics and reports
│   ├── middleware/
│   │   └── auth.js                 ← JWT verification + Role check
│   ├── models/
│   │   ├── User.js                 ← MongoDB User schema
│   │   ├── Appraisal.js            ← MongoDB Appraisal schema
│   │   └── Notification.js         ← MongoDB Notification schema
│   ├── routes/
│   │   ├── auth.js                 ← /api/auth routes
│   │   ├── users.js                ← /api/users routes
│   │   ├── appraisals.js           ← /api/appraisals routes
│   │   └── reports.js              ← /api/reports routes
│   ├── .env                        ← Environment variables
│   ├── package.json
│   └── server.js                   ← Main entry point
│
└── frontend/                       ← React app
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Auth/
        │   │   ├── Login.js         ← Login page
        │   │   └── Register.js      ← Registration page
        │   ├── Common/
        │   │   └── AppLayout.js     ← Sidebar + Header shell
        │   ├── Dashboard/
        │   │   └── Dashboard.js     ← Role-specific dashboards
        │   ├── Employee/
        │   │   ├── SelfAppraisal.js ← Fullscreen appraisal form
        │   │   ├── MyAppraisals.js  ← View submitted appraisals
        │   │   └── MyProfile.js     ← View/edit profile
        │   ├── Manager/
        │   │   ├── TeamMembers.js   ← View assigned team
        │   │   ├── TeamAppraisals.js← View team appraisals
        │   │   └── EvaluateAppraisal.js ← Manager evaluation form
        │   └── Admin/
        │       ├── ManageUsers.js   ← CRUD users
        │       ├── AllAppraisals.js ← View all appraisals
        │       └── Reports.js       ← Charts + analytics
        ├── context/
        │   ├── AuthContext.js       ← Global auth state
        │   └── ToastContext.js      ← Toast notification system
        ├── styles/
        │   └── main.css             ← All CSS styles
        ├── App.js                   ← Routing setup
        └── index.js                 ← React entry point
```

---

## ⚙️ Prerequisites

Before you start, make sure you have installed:

1. **Node.js** (v16 or higher) — https://nodejs.org
2. **npm** (comes with Node.js)
3. **MongoDB** — either:
   - Local: https://www.mongodb.com/try/download/community
   - Cloud (free): https://www.mongodb.com/atlas (recommended for beginners)
4. **Git** (optional) — https://git-scm.com

---

## 🚀 Step-by-Step Setup Instructions

### STEP 1 — Set Up MongoDB

#### Option A: MongoDB Atlas (Cloud — Easier for beginners)
1. Go to https://www.mongodb.com/atlas and sign up for free
2. Create a new cluster (free tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (it looks like):
   `mongodb+srv://username:password@cluster.mongodb.net/dbname`
5. Use this string in the `.env` file (Step 3)

#### Option B: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB: `mongod` (or start via Windows Services)
3. Use `mongodb://localhost:27017/performance_appraisal` in `.env`

---

### STEP 2 — Set Up the Backend

Open your terminal and navigate to the backend folder:

```bash
# Navigate to backend
cd performance-appraisal-system/backend

# Install all dependencies
npm install
```

This will install: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `nodemon`

---

### STEP 3 — Configure Environment Variables

Edit the `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/performance_appraisal
JWT_SECRET=change_this_to_a_long_random_string_abc123xyz
JWT_EXPIRE=7d
```

> **Important:** Change `JWT_SECRET` to any long random string. This is used to sign authentication tokens.

If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

---

### STEP 4 — Start the Backend Server

```bash
# From the backend/ folder
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

> **Troubleshooting:** If MongoDB connection fails, check your `MONGO_URI` in `.env`

---

### STEP 5 — Set Up the Frontend

Open a **new terminal window** and navigate to the frontend folder:

```bash
# Navigate to frontend
cd performance-appraisal-system/frontend

# Install all dependencies
npm install
```

This will install: `react`, `react-router-dom`, `axios`, `recharts`

---

### STEP 6 — Start the Frontend

```bash
# From the frontend/ folder
npm start
```

The browser will automatically open at `http://localhost:3000`

---

### STEP 7 — Create Your First Admin Account

1. Configure a MongoDB connection in `backend/.env`.
2. For the **very first** admin only, set `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters) as environment variables, then run `node scripts/bootstrapAdmin.js` inside `backend/`.
3. Sign in using those credentials at `http://localhost:3000/login`.
4. Create further managers/employees from **Manage Users**. Public registration creates employee accounts only.

---

## 👤 How to Use the System

### As Admin:
1. **Add Managers**: Go to "Manage Users" → Click "+ Add User" → Set role to "Manager"
2. **Add Employees**: Click "+ Add User" → Set role to "Employee" → Assign to a manager
3. **View Reports**: Go to "Reports" for analytics and charts
4. **View All Appraisals**: See every appraisal across the system

### As Manager:
1. **View Team**: See all your assigned employees with stats
2. **Review Appraisals**: Go to "Team Appraisals" → Click "Evaluate" on submitted ones
3. **Rate & Comment**: Give ratings (1-5) for each criteria, add feedback
4. **Approve/Reject**: Select a decision and submit your evaluation

### As Employee:
1. **Submit Appraisal**: Click "Submit Appraisal" → Select period → Rate yourself → Submit
2. **View Results**: Go to "My Appraisals" → Click "View" to see detailed feedback
3. **Check Notifications**: Bell icon shows updates when manager reviews your appraisal

---

## 📊 Rating System

| Score | Grade | Label           |
|-------|-------|-----------------|
| 4.5 – 5.0 | A | Excellent      |
| 3.5 – 4.4 | B | Good           |
| 2.5 – 3.4 | C | Average        |
| 1.5 – 2.4 | D | Below Average  |
| 1.0 – 1.4 | F | Poor           |

**Final Score** = Average of (Self Score + Manager Score) / 2

---

## 🔌 API Endpoints Reference

### Authentication
```
POST   /api/auth/register    — Register new user
POST   /api/auth/login       — Login and get token
GET    /api/auth/me          — Get current user info
```

### Users (Admin only for management)
```
GET    /api/users            — Get all users
POST   /api/users            — Create user
GET    /api/users/:id        — Get user by ID
PUT    /api/users/:id        — Update user
DELETE /api/users/:id        — Deactivate user
GET    /api/users/team       — Get manager's team (Manager)
GET    /api/users/managers   — Get all managers list (Admin)
```

### Appraisals
```
POST   /api/appraisals              — Submit self-appraisal (Employee)
GET    /api/appraisals/my           — Get my appraisals (Employee)
GET    /api/appraisals/team         — Get team appraisals (Manager)
GET    /api/appraisals/all          — Get all appraisals (Admin)
GET    /api/appraisals/:id          — Get one appraisal
PUT    /api/appraisals/:id/evaluate — Manager evaluation
```

### Reports (Admin)
```
GET    /api/reports/summary         — System stats
GET    /api/reports/performance     — Performance report
GET    /api/reports/employee/:id    — Employee history
```

---

## 🛠️ Common Issues & Fixes

**Problem: Backend won't start**
- Check if MongoDB is running: `mongod --version`
- Check `.env` file has correct `MONGO_URI`

**Problem: "CORS error" in browser**
- Make sure backend is running on port 5000
- Check `frontend/package.json` has `"proxy": "http://localhost:5000"`

**Problem: Login fails**
- Make sure backend is running first
- Check credentials match what you registered with

**Problem: Charts not showing**
- Submit and approve at least one appraisal first

---

## 🔒 Security Notes

- Never expose `JWT_SECRET` publicly
- Change the default secret before deploying
- Passwords are hashed with bcrypt (never stored as plain text)
- JWT tokens expire after 7 days

---

## 📦 Tech Stack Summary

| Layer    | Technology         |
|----------|--------------------|
| Frontend | React 18           |
| Routing  | React Router v6    |
| HTTP     | Axios              |
| Charts   | Recharts           |
| Styling  | Pure CSS (no Tailwind) |
| Backend  | Node.js + Express  |
| Database | MongoDB + Mongoose |
| Auth     | JWT + bcryptjs     |


## Security and UI refresh branch

The `improve/security-and-ui-refresh` branch contains improved design tokens, responsive sidebar navigation, stricter public registration, first-admin bootstrap and a unique employee/period/year index.

**Migration caution:** Before deploying the unique appraisal index, remove or reconcile any existing duplicate employee/period/year records. Test on a staging database before merging. Run frontend build and backend integration checks locally; this branch has not been verified with a live MongoDB environment.
