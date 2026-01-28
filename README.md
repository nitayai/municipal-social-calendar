# Municipal Internal Web App

A Next.js 14 foundation for a municipal internal web application with RTL support, dark mode, and Supabase authentication.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase
- **Theme:** next-themes (dark/light mode)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A Supabase project

### Installation

1. Clone the repository and install dependencies:

```bash
cd municipal-app
npm install
```

2. Copy the environment example file:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
municipal-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth route group (login, register)
│   │   ├── (dashboard)/          # Protected route group
│   │   └── api/auth/             # Auth API routes
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── providers/            # Context providers
│   ├── lib/
│   │   └── supabase/             # Supabase client utilities
│   └── types/                    # TypeScript types
├── supabase/
│   └── migrations/               # Database migrations
└── public/                       # Static assets
```

## Features

- RTL layout (Hebrew)
- Dark/Light theme toggle
- Supabase authentication
- Protected routes via middleware
- SaaS-ready database schema (multi-tenant)
- Role-based access (user, manager, super_admin)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Your application URL |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The application uses two main tables:

- **profiles** - Extended user profiles linked to Supabase auth
- **organizations** - Multi-tenant organization support

See `supabase/migrations/001_initial_schema.sql` for the complete schema.
