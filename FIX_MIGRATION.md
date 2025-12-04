# Fix: email_verified Column Error

## The Problem
The error shows: `column core_userprofile.email_verified does not exist`

This means the database migration hasn't been applied to your **running server's database**.

## The Solution

You need to run the migration in the same environment where your server is running.

### Option 1: If Running Django Server Locally (not Docker)

1. **Make sure you're using the same database as your server**
   - Check if you have `DATABASE_URL` environment variable set
   - If your server is using PostgreSQL, you need to set the same `DATABASE_URL`

2. **Run the migration:**
   ```bash
   cd backend
   python manage.py migrate
   ```

### Option 2: If Running with Docker

If your server is running in Docker, you need to run migrations inside the Docker container:

```bash
docker compose exec web python manage.py migrate
```

Or if you're using a different docker-compose command:
```bash
docker-compose exec web python manage.py migrate
```

### Option 3: Restart Your Server

If your Docker setup runs migrations on startup (which your docker-compose.yml does), you can:

1. Stop your server
2. Restart it (migrations should run automatically)

```bash
docker compose down
docker compose up --build
```

## Verify Migration Applied

After running the migration, verify it worked:

```bash
python manage.py showmigrations core
```

You should see `[X] 0010_userprofile_email_verified` with a checkmark.

## Quick Test

After the migration is applied:
1. Try registering a new user again
2. The 500 error should be gone
3. Check your console/terminal for the activation email (it will be printed)

---

**Note:** Make sure the migration file exists at:
`backend/core/migrations/0010_userprofile_email_verified.py`

If it doesn't exist, the migration needs to be created first.

