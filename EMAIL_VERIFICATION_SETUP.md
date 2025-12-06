# Email Verification Setup Guide

## Fixing the 500 Error on Registration

The 500 error you're seeing is likely because the database migration hasn't been run yet. The `email_verified` field needs to be added to your database.

### Step 1: Run the Database Migration

**If running locally (not in Docker):**
```bash
cd backend
python manage.py migrate
```

**If running in Docker:**
```bash
docker compose exec web python manage.py migrate
```

Or if your docker-compose file uses a different name:
```bash
docker-compose exec web python manage.py migrate
```

### Step 2: Verify Migration Applied

Check that migration 0010 has been applied:
```bash
cd backend
python manage.py showmigrations core
```

You should see `[X] 0010_userprofile_email_verified` with a checkmark.

### Step 3: Test Registration Again

Try registering again. The error should be resolved.

## Additional Notes

### Email Configuration

The system uses the **console email backend by default** for development. This means emails will be printed to your console/terminal instead of actually being sent. This is perfect for testing!

For production, you'll need to configure SMTP settings in your `.env` file:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Troubleshooting

If you still get errors after running migrations:

1. **Check the server logs** - The improved error handling will now show detailed error messages
2. **Verify the migration exists** - Check that `backend/core/migrations/0010_userprofile_email_verified.py` exists
3. **Check database connection** - Ensure your database is running and accessible

### Testing Email Verification

1. Register a new user with an email
2. Check your console/terminal for the activation email (it will be printed)
3. Copy the activation link from the console
4. Visit the activation link in your browser
5. You should see a success message
6. Now try logging in with your credentials

The activation link format is: `http://localhost:3000/activate/[token]`



