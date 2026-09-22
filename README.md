# MonkMaze — Lead Generation & Business Automation Platform

Lead generation and business automation platform with multi-step lead capture feeding analytics dashboards, plus admin workflows for meetings, invoicing and project tracking.

> **Client project.** Not publicly deployed.

**Case study with architecture write-up →** https://amirmaqbool.online/work/monk-maze

## Stack

- **Frontend** — Next.js, TailwindCSS
- **Backend** — Node.js, Express.js, REST APIs
- **Database** — MongoDB, Mongoose
- **Auth** — JWT with role-based access control

## Features

- Multi-step lead capture
- Admin dashboard system
- Meeting and invoice management
- Analytics and blog tools

## Architecture

Next.js client -> Express.js REST API (JWT auth + role-based access control middleware) -> MongoDB via Mongoose.

## My role

Full-stack development: MongoDB schema design, REST API endpoints, JWT authentication with role-based access control, and the admin dashboard interface.

## Running locally

```bash
git clone https://github.com/AmirMaqbool0/Monk_Backend.git
cd Monk_Backend
npm install
npm run dev
```

Requires Node.js 18+. Create a `.env` file in the project root with your own values for: `MONGO_URI, JWT_SECRET`.

---

Built by [Amir Maqbool](https://amirmaqbool.online) — Full Stack Developer (React · Next.js · Node.js · MongoDB), open to relocation to Germany.
