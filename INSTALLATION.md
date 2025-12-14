# 🐝 The Hive - Local Installation Guide

Quick guide to run The Hive project locally using Docker.

---

## 📋 Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git**

**Verify installation:**
```bash
docker --version
docker-compose --version
git --version
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kj-kenan/SWE573-Kenan-s-Repo.git
cd SWE573-Kenan-s-Repo
```

---

### 2. Set Up Environment Variables

Create a `.env` file in the **project root directory**:

**Create `.env` file with the following content:**
```env
# Django Settings
DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL via Docker)
DATABASE_URL=postgresql://hive:hive@db:5432/hive

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email Settings (Optional - for email verification)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

### 3. Build and Run Backend with Docker

**From the project root directory:**

```bash
docker-compose up --build
```

**This command will:**
- Build the Docker image
- Start PostgreSQL database container
- Start the backend (Django) container
- Initialize the database
- Install all dependencies

**First run takes 3-5 minutes. Subsequent runs are faster.**

### 4. Run Frontend (Separate Terminal)

**Open a new terminal and run:**

```bash
cd frontend
npm install
npm start
```

**Frontend will start at http://localhost:3000**

---

### 5. Access the Application

Once both backend and frontend are running, open your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React app (main interface) |
| **Backend API** | http://localhost:8000 | Django REST API |
| **Admin Panel** | http://localhost:8000/admin | Django admin (if superuser created) |

---

## 📦 Alternative: Run Without Docker (SQLite)

### Backend (Django)

```bash
cd backend

# Create .env file with FORCE_SQLITE=True
echo "DEBUG=True" > .env
echo "DJANGO_SECRET_KEY=dev-secret-key" >> .env
echo "FORCE_SQLITE=True" >> .env
echo "CORS_ALLOWED_ORIGINS=http://localhost:3000" >> .env

# Install and run
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend will run at: http://localhost:8000

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

Frontend will run at: http://localhost:3000

---

## 🛠️ Useful Commands

### Start containers (after first build)
```bash
docker-compose up
```

### Stop containers
```bash
docker-compose down
```

### Rebuild containers (after code changes)
```bash
docker-compose up --build
```

### View logs
```bash
docker-compose logs -f
```

### Run Django commands in container
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Run tests
```bash
docker-compose exec backend python manage.py test core.tests
```

---

## 🧪 Create a Test User

### Option 1: Via Frontend
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in username, email, password
4. Account created with 3 Beellars

### Option 2: Via Django Shell
```bash
docker-compose exec backend python manage.py shell
```

```python
from django.contrib.auth.models import User
from core.models import UserProfile

user = User.objects.create_user(
    username='testuser',
    email='test@example.com',
    password='testpass123'
)
print(f"User created: {user.username}")
print(f"Balance: {user.profile.timebank_balance} Beellars")
```

---

## 🔧 Troubleshooting

### Problem: Port already in use
**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**
```bash
# Stop the containers
docker-compose down

# Check what's using the port
# On Mac/Linux:
lsof -i :3000
lsof -i :8000

# On Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process or change ports in docker-compose.yml
```

---

### Problem: Database migration errors
**Solution:**
```bash
docker-compose down
docker-compose up --build
docker-compose exec backend python manage.py migrate
```

---

### Problem: Frontend can't connect to backend
**Solution:**
- Ensure both containers are running: `docker-compose ps`
- Check `.env` file has correct CORS settings
- Try accessing backend directly: http://localhost:8000/api/health/

---

### Problem: Docker build fails
**Solution:**
```bash
# Clean up Docker
docker-compose down --volumes
docker system prune -a

# Rebuild
docker-compose up --build
```

---

## 📚 Testing the Application

### 1. Run Unit Tests
```bash
docker-compose exec backend python manage.py test core.tests
```

**Expected output:** `Ran 46 tests in ~130s - OK`

### 2. Manual Testing Flow
1. **Register** a new user at http://localhost:3000
2. **Create an Offer** (you'll have 3 Beellars to start)
3. **Browse Offers** on the map
4. **Send a Handshake** (create a second user account)
5. **Accept and Complete** the handshake
6. **Check TimeBank** to see balance changes

---

## 🗂️ Project Structure

```
SWE573-Kenan-s-Repo/
├── backend/              # Django backend
│   ├── core/            # Main app (models, views, tests)
│   ├── mysite/          # Django settings
│   ├── manage.py        # Django management
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile       # Backend Docker config
├── frontend/            # React frontend
│   ├── src/            # React components
│   ├── public/         # Static files
│   ├── package.json    # Node dependencies
│   └── Dockerfile      # Frontend Docker config
├── docker-compose.yml   # Docker orchestration
└── INSTALLATION.md      # This file
```

---

## 📖 Additional Documentation

- **Testing Guide:** `backend/TESTING_GUIDE.md`
- **Test Cases:** `backend/TEST_CASES_AND_RESULTS.md`
- **Quick Reference:** `backend/TEST_QUICK_REFERENCE.md`
- **Requirements:** `docs/SRS.md`

---

## 🎓 For Instructors

### Quick Verification Checklist

✅ Clone repo  
✅ Create `.env` file in `backend/`  
✅ Run `docker-compose up --build`  
✅ Visit http://localhost:3000  
✅ Register a user  
✅ Create an offer  
✅ Run tests: `docker-compose exec backend python manage.py test core.tests`  

**Total setup time: ~5 minutes**

---

## 💡 Tips

- **First run is slow** (building images) - subsequent runs are fast
- **PostgreSQL is used with Docker** (no manual setup needed)
- **All data persists** in Docker volume `pgdata`
- **For SQLite:** Add `FORCE_SQLITE=True` to `.env`
- **Frontend auto-reloads** on code changes
- **Backend requires manual restart** after code changes

---

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Cannot connect to backend | Check if both containers are running: `docker ps` |
| Port conflict | Change ports in `docker-compose.yml` |
| Database errors | Run: `docker-compose exec backend python manage.py migrate` |
| Module not found | Rebuild: `docker-compose up --build` |
| Permission denied | On Linux/Mac: `sudo docker-compose up --build` |

---

## 📞 Support

- **GitHub:** https://github.com/kj-kenan/SWE573-Kenan-s-Repo
- **Issues:** Open an issue on GitHub for bugs or questions

---

**Last Updated:** December 2025  
**Tested On:** Docker 24.0+, Docker Compose 2.0+  
**Status:** ✅ Ready for evaluation

