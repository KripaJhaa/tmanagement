# Careers Page Application

A full-stack white-label application for managing company-specific job listings, applications, and admin workflows.

## Project Structure

```
Career/
├── package.json        # Root workspace configuration
├── backend/           # Node.js + Express backend
│   ├── package.json   # Backend-specific dependencies
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── scripts/   # SQL migrations and seeds
│   │   ├── schema.sql # Database schema
│   │   └── index.js   # Main server file
│   ├── uploads/       # Resume upload directory
│   └── .env          # Backend environment configuration
└── frontend/         # React.js frontend
    ├── package.json  # Frontend-specific dependencies
    ├── public/      # Static assets
    ├── src/
    │   ├── components/ # Reusable React components
    │   ├── pages/     # Page components (CareersPage, AdminDashboard, etc.)
    │   └── App.js     # Main React application
    └── .env.development # Frontend environment configuration
```

This project uses npm workspaces for efficient dependency management. The root `package.json` defines the workspace configuration, allowing shared dependencies and simplified package management.

## Prerequisites

- Node.js (v16 or higher recommended)
- PostgreSQL (v13 or higher recommended)
- npm (v7 or higher) or yarn
- Git

## Setup Instructions

### Database Setup

1. Create a PostgreSQL database:
   ```bash
   createdb careers_db
   ```

2. Note your PostgreSQL connection details (host, port, username, password)

### Project Setup

1. Install all dependencies from the root directory:
   ```bash
   npm install
   ```

   This will install dependencies for both frontend and backend using npm workspaces.

### Backend Setup

3. Create and configure `.env`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```
   # Database
   DATABASE_URL=postgres://username:password@localhost:5432/careers_db
   
   # Server
   PORT=3000
   
   # Admin Authentication (for legacy single-admin mode)
   ADMIN_PASSWORD_HASH='$2b$...'  # Use quoted bcrypt hash
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=uploads
   ```

5. Apply database migrations and seeds:
   ```bash
   # Install Liquibase (macOS)
   brew install liquibase
   
   # Install PostgreSQL JDBC driver
   brew install postgresql-connector-java
   
   # Run all migrations and seeds
   liquibase update
   
   # To rollback the last migration
   liquibase rollbackCount 1
   
   # To see pending migrations
   liquibase status
   
   # To generate SQL without executing
   liquibase updateSQL
   ```

7. Start the backend server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### Frontend Setup

No need to install frontend dependencies separately as they are handled by npm workspaces.

3. Create `.env.development`:
   ```bash
   cp .env.example .env.development
   ```

4. Configure environment:
   ```
   # API URL (backend)
   REACT_APP_API_URL=http://localhost:3000
   
   # Optional: Default company slug for development
   REACT_APP_COMPANY_SLUG=admin123
   ```

5. Start both frontend and backend servers from the root directory:
   ```bash
   # Start both services with default ports (backend: 3000, frontend: 3001)
   npm start

   # Start with custom ports
   FRONTEND_PORT=3002 BACKEND_PORT=4000 npm start

   # Or start services individually
   npm run start:backend  # Starts backend on default port 3000
   npm run start:frontend # Starts frontend on default port 3001

   # Start individual services with custom ports
   BACKEND_PORT=4000 npm run start:backend
   FRONTEND_PORT=3002 npm run start:frontend
   ```

   The application uses npm workspaces to manage dependencies and run scripts from the root directory. The development servers support hot reloading for both frontend and backend changes.

## Key Features

- Multi-tenant company support
- Company-specific job listings and admin dashboards
- Admin features:
  - Create/edit/manage jobs
  - Track application status
  - View candidate details and resumes
  - Toggle job status (published/draft/paused)
- Public features:
  - Company-specific career pages
  - Shareable job links
  - Application submission with resume upload
- Responsive design with animations

## API Endpoints

### Public APIs

- `GET /api/jobs/companies/:company_slug/jobs` - List jobs for company
- `GET /api/jobs/companies/:company_slug/jobs/:job_slug` - Get job details
- `POST /api/jobs/applications` - Submit job application

### Admin APIs (Auth Required)

- `POST /api/admin/register` - Register new company + admin
- `GET /api/admin/settings` - Get admin settings
- `GET /api/admin/jobs` - List jobs (company-scoped)
- `POST /api/admin/jobs` - Create job
- `PATCH /api/admin/jobs/:id` - Update job
- `GET /api/admin/applications` - List applications
- `PATCH /api/admin/applications/:id` - Update application status

## Authentication

Two authentication modes are supported:

1. DB-backed Company Admins:
   - Register via `/api/admin/register`
   - Login with username/password
   - Company-scoped access

2. Legacy Single Admin:
   - Uses ADMIN_PASSWORD_HASH from .env
   - Configure company_id manually

## Technology Stack

### Frontend
- React 18
- React Router v6
- TailwindCSS
- Framer Motion (animations)
- Axios (API client)
- react-hot-toast (notifications)

### Backend
- Node.js + Express
- PostgreSQL (with pg Pool)
- bcrypt (password hashing)
- multer (file upload)
- dotenv (configuration)

### Development Tools
- nodemon (backend auto-reload)
- react-scripts (CRA based)
- eslint + prettier
- concurrently (run multiple commands)

## Development Notes

- Backend runs on port 3000 by default
- Frontend dev server on port 3001
- File upload limits:
  - Max size: 5MB
  - Supported types: .pdf, .docx
  - Stored in: backend/uploads/
- Database:
  - Uses migrations for schema changes
  - Company slugs must be unique
  - Job slugs auto-generated from titles

## Troubleshooting

### Backend Issues

1. Port already in use:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. Database connection fails:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists: `createdb careers_db`

3. Admin login fails:
   - Verify ADMIN_PASSWORD_HASH in .env is properly quoted
   - Check if admin exists in DB: `SELECT * FROM admins;`
   - For DB admins, ensure company_id is set correctly

### Frontend Issues

1. Module not found errors:
   ```bash
   # Clean install dependencies
   rm -rf node_modules
   npm install
   ```

2. API connection fails:
   - Verify backend is running
   - Check REACT_APP_API_URL in .env.development
   - Look for CORS errors in browser console

3. Routing 404s:
   - Ensure company slug is correct
   - Verify job slugs exist in database
   - Check both frontend routes and API endpoints

### Database Maintenance

1. Reset/recreate database:
   ```bash
   dropdb careers_db
   createdb careers_db
   cd backend
   psql -d careers_db -f src/schema.sql
   # Run migrations in order
   psql -d careers_db -f src/scripts/migrations/*.sql
   ```

2. Generate missing job slugs:
   ```sql
   UPDATE jobs 
   SET job_slug = lower(regexp_replace(title, '[^a-z0-9]+', '-', 'g'))
   WHERE job_slug IS NULL OR job_slug = '';
   ```