# 7. Full Installation Instructions

This section provides complete instructions for running The Hive locally using Docker.
## 7.1 Prerequisites
Docker (version 20.10+)
Docker Compose (version 2.0+)
Git
Verify installation:
docker --version
docker-compose --version
git --version
## 7.2 Quick Start
### Step 1: Clone the Repository
git clone https://github.com/kj-kenan/SWE573-Kenan-s-Repo.git
cd SWE573-Kenan-s-Repo
### Step 2: Set Up Environment Variables
Create a .env file in the project root directory with the following content:
# Django Settings
DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL via Docker)
DATABASE_URL=postgresql://hive:hive@db:5432/hive

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
### Step 3: Build and Run Backend with Docker
From the project root directory:
docker-compose up --build
This command will:
Build the Docker image
Start PostgreSQL database container
Start the backend (Django) container
Initialize the database
Install all dependencies
Note: First run takes 3-5 minutes. Subsequent runs are faster.
### Step 4: Run Frontend (Separate Terminal)
Open a new terminal and run:
cd frontend
npm install
npm start
Frontend will start at http://localhost:3000
### Step 5: Access the Application
Once both backend and frontend are running, open your browser:
## 7.3 System Requirements
Operating System: Linux, macOS, or Windows (with WSL2)
RAM: Minimum 4GB
Disk Space: At least 2GB free space
Network: Internet connection required for initial setup
