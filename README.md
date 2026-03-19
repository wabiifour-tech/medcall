# MedCall - Educational Video Conferencing Platform

A resilient video conferencing platform designed for educational environments with secure attendance tracking.

## Features

- **Resilient Video Conferencing**: P2P for local networks, SFU for remote connections
- **Secure Attendance System**: One-time profile lock, server timestamps, duplicate prevention
- **Offline-First Architecture**: LocalStorage sync for offline attendance records
- **PWA Support**: Installable on Android, iOS, Windows, macOS
- **Adaptive Bitrate**: Automatic quality adjustment for low-bandwidth environments

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon, Supabase, or any Vercel-compatible Postgres)
- **Real-time**: WebRTC with STUN/TURN servers
- **Auth**: NextAuth.js with session management

## Deployment to Vercel

### Step 1: Create a GitHub Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: MedCall video conferencing platform"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/medcall.git
git push -u origin main
```

### Step 2: Create a PostgreSQL Database

In Vercel, choose one of these options:
- **Neon** (Recommended) - Serverless Postgres with auto-scaling
- **Supabase** - Postgres with built-in auth and realtime
- **Prisma Postgres** - Managed by Prisma team

Click "Create Database" and copy the connection strings.

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string (pooled) from your database |
| `DIRECT_DATABASE_URL` | Direct connection string from your database |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel app URL (e.g., `https://medcall.vercel.app`) |

5. Click "Deploy"
6. After deployment, run migrations in Vercel dashboard:
   - Go to Settings → Functions
   - Add build command: `prisma migrate deploy`

### Step 4: Seed the Database (Optional)

After deployment, you can seed test users via the API or create your own:

**Default Test Accounts (after seeding):**
- Host: matric `HOST001`, password `password123`
- Student: matric `CSC/2020/001`, password `password123`

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"

# WebRTC (optional for production)
STUN_SERVER="stun:stun.l.google.com:19302"
TURN_SERVER="turn:your-turn-server.com:3478"
TURN_USERNAME="username"
TURN_PASSWORD="password"
```

## Local Development

```bash
# Install dependencies
bun install

# Set up local database
bun run db:push

# Run development server
bun run dev
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── attendance/    # Attendance tracking API
│   │   └── meetings/      # Meeting management API
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/
│   ├── medcall/           # MedCall-specific components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # Authentication utilities
│   └── webrtc.ts          # WebRTC configuration
└── hooks/                 # React hooks
```

## Security Features

- **Profile Lock**: User profiles become immutable after first login
- **Server Timestamps**: Attendance times recorded server-side
- **Duplicate Prevention**: Database constraint prevents multiple attendance per meeting
- **Secure Passwords**: bcrypt hashing for password storage

## License

MIT

