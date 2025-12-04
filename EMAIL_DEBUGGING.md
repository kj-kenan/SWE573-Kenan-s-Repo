# Email Debugging Guide

## Where to Find Console Emails

With the **console email backend** (default for development), emails are **printed to the terminal/console where your Django server is running**.

### Where to Look:

1. **If running Django locally:**
   - Look at the terminal/command prompt where you ran `python manage.py runserver`
   - The email will be printed there when registration happens

2. **If running in Docker:**
   - Run: `docker compose logs -f web`
   - Or: `docker-compose logs -f web`
   - The email will appear in these logs

3. **If using VS Code or another IDE:**
   - Check the "Terminal" or "Output" panel where your server is running

## What You Should See

When you register a new user, you should see output like:

```
============================================================
📧 SENDING ACTIVATION EMAIL
============================================================
To: user@example.com
From: noreply@thehive.com
Subject: Activate your Hive account

Activation URL: http://localhost:3000/activate/[long-token-here]
============================================================

✅ Email sent successfully to user@example.com
```

Then you'll see the full email content printed below.

## Testing the Email System

1. **Register a new user**
2. **Check your server console/terminal** - you should see the email printed
3. **Copy the activation URL** from the console
4. **Paste it in your browser** to activate the account

## If You Don't See Emails

### Option 1: Check Server Logs

Make sure you're looking at the right terminal. The email appears in the **same terminal where your Django server is running**.

### Option 2: Check for Errors

Look for any error messages in the console. The improved logging will show:
- `[DEBUG] Attempting to send activation email...`
- `[DEBUG] Email sending result: True/False`
- `[ERROR] Error sending activation email...` (if there's a problem)

### Option 3: Verify Email Backend

Check that you're using the console backend. In `backend/mysite/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Or check your environment variables - make sure you don't have `EMAIL_BACKEND` set to something else.

## Sending Real Emails (Production)

When you're ready to send real emails, configure SMTP in your `.env` file:

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

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use that app password in `EMAIL_HOST_PASSWORD`

## Quick Test

Try registering a user right now and watch your server console - you should see the email appear immediately!

