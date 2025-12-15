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



