# Local Development Setup Guide

## Quick Start

### Backend (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (if not already created):**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows (PowerShell):
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
   - Windows (CMD):
     ```bash
     venv\Scripts\activate.bat
     ```
   - Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r ../requirements.txt
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server:**
   ```bash
   python manage.py runserver
   ```
   
   Backend will run on: `http://localhost:8000`

### Frontend (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Create `.env` file in frontend directory:**
   Create a file named `.env` with:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server:**
   ```bash
   npm start
   ```
   
   Frontend will run on: `http://localhost:3000`

## Important Notes

- **Database**: Local development uses SQLite (`db.sqlite3` in backend folder)
- **CORS**: Already configured to allow `http://localhost:3000`
- **API Endpoints**: Frontend will connect to `http://localhost:8000/api/`
- **Hot Reload**: Both servers support hot reload - changes will refresh automatically

## Troubleshooting

### Backend Issues:
- If migrations fail, try: `python manage.py migrate --run-syncdb`
- If port 8000 is busy, use: `python manage.py runserver 8001`

### Frontend Issues:
- If port 3000 is busy, React will ask to use another port
- Clear browser cache if you see old API responses
- Make sure `.env` file is in `frontend/` directory (not root)

### Database Issues:
- If you need to reset database: Delete `backend/db.sqlite3` and run migrations again
- To see admin panel: Go to `http://localhost:8000/admin/` (requires superuser)

## Testing the Setup

1. Backend health check: Visit `http://localhost:8000/api/health/`
2. Frontend: Visit `http://localhost:3000`
3. Try registering a new user
4. Try creating an offer/request

## Environment Variables

For local development, you don't need any environment variables. The system will:
- Use SQLite database automatically
- Use DEBUG=True mode
- Allow all hosts (for local testing)

For production deployment, you'll need:
- `DATABASE_URL` (PostgreSQL connection string)
- `DJANGO_SECRET_KEY` (Django secret key)










