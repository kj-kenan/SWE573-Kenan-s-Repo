#!/bin/bash
set -e

echo "Starting The Hive backend..."

# Change to backend directory
cd /app/backend

# Wait for database to be ready (useful for managed databases)
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database connection..."
    python << END
import sys
import time
import psycopg2
import os
from urllib.parse import urlparse

max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            parsed = urlparse(db_url)
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                dbname=parsed.path[1:],
                connect_timeout=5
            )
            conn.close()
            print("Database connection successful!")
            sys.exit(0)
    except Exception as e:
        attempt += 1
        if attempt >= max_attempts:
            print(f"Failed to connect to database after {max_attempts} attempts")
            sys.exit(1)
        print(f"Database connection attempt {attempt}/{max_attempts} failed: {e}")
        time.sleep(2)
END
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Execute the main command (gunicorn)
echo "Starting gunicorn server..."
exec "$@"

