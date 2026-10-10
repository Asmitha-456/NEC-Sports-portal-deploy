# NEC Sports Event Management & Automation System — Full-Stack

A complete web platform and backend engine for **National Engineering College (Autonomous), Kovilpatti** featuring event scheduling, department points leaderboard, protected role-based portals, live attendance tracking, and an **Automatic On-Duty (OD) Generation Engine**.

---

## 🚀 Quick Start (Running the Backend & App)

### Option 1: One-Click on Windows
Double-click `start-backend.bat` in this folder. It will install dependencies and start the backend on `http://localhost:5000`.

### Option 2: Command Line (CMD / Terminal)
```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Start the server
node server.js
```

Once running:
- Open your browser at: **`http://localhost:5000`**
- API Health Check: **`http://localhost:5000/api/health`**

---

## 🔑 Demo Credentials

| Role | Username / Email | Password |
|---|---|---|
| **Student** | `24104016@nec.edu.in` *(or `24104016`)* | `Student@2026` |
| **PT Staff** | `sportsstaff@nec.edu.in` | `NECStaff@2026` |
| **Administrator** | `sportsadmin@nec.edu.in` | `NECAdmin@2026` |

---

## ⚡ Key Feature: Automatic OD (On-Duty) Generation Engine

### What is the Automatic OD Generator?
When students represent the college in sports tournaments, they require official On-Duty (OD) permissions to excuse them from academic classes without losing attendance percentages.

Our automatic backend OD engine provides:
1. **Automated Roster Fetching & Validation**: Select an event, session, and status filter (`Selected` / `Attended`). Eligible students are automatically populated.
2. **Attendance-Linked OD Generation**: One-click **"✓ Save & Auto-Generate OD"** directly inside the attendance screen to automatically sanction OD only for students marked **Present** in trials/matches.
3. **Smart Department Splitting**: Option to automatically split the batch into separate official OD letters for each Head of Department (HOD CSE, HOD ECE, etc.).
4. **Unique Official Reference Numbers**: Formula-generated official reference numbers (e.g. `NEC/PED/OD/2026-27/CSE-FOOT/4821`).
5. **Approval Workflow Tracking**: Status lifecycle: `Generated` ➔ `Submitted to HOD` ➔ `HOD Approved` ➔ `Principal Sanctioned`.
6. **Printable Official Letterhead**: Structured format featuring NEC Autonomous college letterhead, official date, subject, student table, signature blocks (Physical Director, HOD, Principal), and official college seal.
7. **Student Self-Service ("My OD Passes")**: Students can log in to view their verified OD passes and print their personal OD slip for their class tutor.
8. **Department OD Analytics**: Summary dashboard of total OD passes per department to help HODs track academic attendance balance.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Login with email/reg, password, and role; returns JWT token & user profile
- `GET /api/auth/me` — Get current logged-in user profile

### Events (`/api/events`)
- `GET /api/events` — List all events (supports `?sport=...&category=...&status=...&search=...`)
- `GET /api/events/:id` — Event details + member roster
- `POST /api/events` — Create event (Staff/Admin)
- `PUT /api/events/:id` — Update event schedule/venue with notifications (Staff/Admin)
- `DELETE /api/events/:id` — Delete event (Admin)

### Automatic OD Engine (`/api/od`)
- `POST /api/od/auto-generate` — **Auto-generate official OD batch(es)** based on criteria
- `GET /api/od/batches` — List all generated OD batches with filters
- `GET /api/od/batches/:id` — Detailed batch view with roster
- `PUT /api/od/batches/:id/status` — Transition approval status (`Submitted to HOD`, `HOD Approved`)
- `DELETE /api/od/batches/:id` — Delete OD batch
- `GET /api/od/student/:reg?` — Student self-service OD lookup
- `GET /api/od/analytics` — Department-wise OD analytics

### Attendance (`/api/attendance`)
- `GET /api/attendance?event=...` — Get attendance records for an event
- `POST /api/attendance` — Batch save attendance

### Points & Leaderboards (`/api/points`)
- `GET /api/points/departments` — Department points ranking
- `GET /api/points/students` — Student points ranking
- `POST /api/points/update` — Award tournament points

### Reports & CSV Downloads (`/api/reports`)
- `GET /api/reports/export/members` — Download all event members CSV
- `GET /api/reports/export/attendance` — Download attendance report CSV
- `GET /api/reports/export/points` — Download department points CSV
- `GET /api/reports/export/od/:batchId` — Download OD batch CSV
- `GET /api/reports/audit` — View audit trail

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Node.js & Express.js
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing
- **Security**: Role-Based Access Control (`student`, `staff`, `admin`)
- **Database**: Zero-dependency structured JSON storage engine with atomic temp writes and automated migrations
- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism & Responsive UI), JavaScript (ES6+)
