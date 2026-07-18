# HireTrack - Premium Applicant Tracking System (ATS)

HireTrack is a premium, state-of-the-art applicant tracking system (ATS) and hiring management platform built using **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, and **Supabase (PostgreSQL)**. It features a complete job explorer for candidates, an interactive Kanban pipeline board for recruiters, scheduling workflows, scorecard reviews, and a local AI Resume Scanner.

---

## Key Features

### 🏢 Multi-Company Recruiter Dashboard
- **Active Job Postings**: Track active openings with custom company names, locations, salary ranges, and visibility expiry dates.
- **Conversion Funnel**: View a real-time, stage-by-stage candidate distribution chart showing recruiting conversions and bottlenecks.
- **Archive & Expiration**: Easily remove job listings, or let them automatically expire from candidate search lists.

### 📋 Drag-and-Drop Pipeline Kanban Board
- **Kanban Board**: Drag applicant cards across recruitment stages (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) with instant visual feedback and database synchronization.
- **Candidate Detail Drawer**: Slide open candidate summaries from the right with a smooth backdrop blur overlay. Organized into sub-tabs:
  - **Profile**: Resume URLs, cover letters, and contact details.
  - **Interviews**: Form to schedule new rounds and view interview logs.
  - **Reviews & Scorecards**: In-depth scorecard forms and history.
- **Pipeline Filter**: Search candidates dynamically by name, email, or skill keywords in real-time.

### 📅 Interviews & Scorecards
- **Interview Scheduler**: Invite candidates to customizable rounds (Technical, HR, Managerial, System Design) with date-time selectors and video meeting link attachments.
- **Star Scorecard Evaluations**: Grade candidates on a 1-to-5 star scale across critical metrics (Technical, Communication, Logic, Values, Culture Fit) and write detailed feedback.
- **Automatic Scorecard Averages**: Computes average stars (e.g. `★ 4.3`) to show overall alignment on the Kanban board cards.

### ✉️ Quick Email Composer
- **Personalized Email Templates**: Instantly generate pre-filled drafts for **Interview Invitations**, **Job Offers**, or **Application Rejection** notifications.
- **Direct Mail Launch**: Open your native email application with a pre-filled, URL-encoded `mailto:` link with one click.

### 💼 Candidate Job Board & Portal
- **Job Explorer**: Search open jobs with metadata, company labels, and required skills tags.
- **Skills Match Score**: View compatibility match percentages (e.g. `85% Match`) on job cards, calculated by comparing your profile skills against requirements.
- **Application Documents**: Submit a Resume URL and Cover Letter when applying to jobs.
- **Withdraw Applications**: Cancel active applications anytime.

### 🤖 AI Resume Scanner & "Fix Resume" Advisor
- **circular ATS Score Meter**: View calculated ATS match ratings inside a circular progress ring.
- **Keyword Gap Identifier**: Flags required keywords and skills missing from your candidate profile.
- **Actionable AI Plan**: Step-by-step instructions on improving your Profile Summary, expanding Experience descriptions, and fixing Resume URL permissions to increase compatibility.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **Date Utilities**: `date-fns`

---

## Getting Started

### 1. Environment Setup
Create a `.env` file in the root directory:

```env
# Database Connection (Supabase Pooler on Session port 5432)
DATABASE_URL="postgresql://<username>:<password>@<pooler-host>:5432/postgres?connection_limit=2"
DIRECT_URL="postgresql://<username>:<password>@<pooler-host>:5432/postgres"

# NextAuth Secrets
AUTH_SECRET="your-development-only-secret-key"
```

*Note: If your local machine operates on an IPv4-only network, configure your connection string to route through Supabase's TCP pooler host on port `5432` rather than the direct IPv6 database host to prevent getaddrinfo connection errors.*

### 2. Install Dependencies
```bash
npm install
```

### 3. Sync Database Schema
Deploy the Prisma schema directly to your Supabase instance:
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to launch the application.

### 5. Build for Production
```bash
npm run build
```
