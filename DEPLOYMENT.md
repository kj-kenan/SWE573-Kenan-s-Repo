# DigitalOcean App Platform Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub repository
- [ ] Database migrations are up to date
- [ ] All environment variables documented
- [ ] Frontend hosting decision made (Option A or B)

---

## 🔧 FILES CHANGED FOR PRODUCTION

### Backend Changes:
- `backend/mysite/settings.py` - Added production settings with environment variables
- `backend/entrypoint.sh` - New startup script for migrations and database checks
- `Dockerfile` - Improved for production with entrypoint script
- `app.yaml` - DigitalOcean App Platform configuration (optional reference)

### New Files:
- `backend/entrypoint.sh` - Startup script
- `app.yaml` - DO App Platform config (optional)
- `.gitignore` - Updated for production artifacts

---

## 🔑 REQUIRED ENVIRONMENT VARIABLES

Set these in DigitalOcean App Platform dashboard under your app's Settings > App-Level Environment Variables:

### Required Variables:

```bash
# Django Core
DJANGO_SECRET_KEY=your-super-secret-key-min-50-chars-generate-with-openssl-rand-hex-32
DEBUG=False
ALLOWED_HOSTS=your-app-name.ondigitalocean.app,your-custom-domain.com

# Database (automatically set by DO if using managed DB)
DATABASE_URL=postgresql://user:pass@host:port/dbname
DATABASE_SSL_REQUIRE=True

# CORS & CSRF (frontend domains)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-frontend-domain.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com,https://your-frontend-domain.netlify.app

# Frontend URL (for email links)
FRONTEND_URL=https://your-frontend-domain.com

# Email Configuration (Gmail example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Optional: Logging
LOG_LEVEL=INFO
DJANGO_LOG_LEVEL=INFO
```

### Optional Variables:

```bash
# Force SQLite (only for local dev - set to False in production)
FORCE_SQLITE=False

# Security (auto-set by DO, but you can override)
SECURE_SSL_REDIRECT=True
```

---

## 📝 STEP-BY-STEP DEPLOYMENT INSTRUCTIONS

### Step 1: Prepare GitHub Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for DigitalOcean deployment"
   git push origin main
   ```

2. Note your repository URL (e.g., `https://github.com/yourusername/the-hive`)

---

### Step 2: Create DigitalOcean Account & App

1. **Sign up/Login to DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Use student credits or create account

2. **Navigate to App Platform**
   - Click "Create" → "Apps"
   - Or go to https://cloud.digitalocean.com/apps

3. **Connect GitHub**
   - Click "GitHub" → Authorize DigitalOcean
   - Select your repository
   - Choose branch (usually `main` or `master`)

4. **Configure App**
   - **App Name**: `the-hive` (or your choice)
   - **Region**: Choose closest to your users (e.g., `nyc`, `sfo`)
   - **Resource Type**: Choose "Web Service"

---

### Step 3: Configure Build & Run Settings

In the App Platform configuration:

1. **Source Directory**: `/` (root)
2. **Dockerfile Path**: `Dockerfile`
3. **HTTP Port**: `8000`
4. **HTTP Request Routes**: `/`

**OR if using non-Docker build:**

1. **Environment**: `Python`
2. **Build Command**: (leave empty, Dockerfile handles it)
3. **Run Command**: (leave empty, Dockerfile handles it)
4. **Working Directory**: `/backend`

**Note**: DigitalOcean App Platform will auto-detect the Dockerfile and use it.

---

### Step 4: Create Managed PostgreSQL Database

1. **In the same App creation flow:**
   - Scroll to "Resources" section
   - Click "Add Resource" → "Database"
   - Choose **PostgreSQL**
   - **Plan**: `Basic` → `$15/month` (or Dev Database if available)
   - **Version**: PostgreSQL 16 (or latest)
   - **Database Name**: `the-hive-db` (or auto-generated)

2. **Important**: The `DATABASE_URL` will be automatically set by DO as an environment variable.

3. **Note**: If using student credits, check for free tier options first.

---

### Step 5: Set Environment Variables

1. **In App Platform configuration:**
   - Scroll to "Environment Variables" section
   - Click "Edit" or "Add Variable"

2. **Add each variable from the list above:**
   - Use the exact variable names
   - For `DJANGO_SECRET_KEY`, generate one:
     ```bash
     # On your local machine:
     python -c "import secrets; print(secrets.token_urlsafe(50))"
     ```
   - For `ALLOWED_HOSTS`, use your app's DO domain: `your-app-name.ondigitalocean.app`
   - For `CORS_ALLOWED_ORIGINS`, use your frontend URL (Netlify/DO Static Site)

3. **Critical Variables to Set:**
   ```
   DJANGO_SECRET_KEY=<generated-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=your-app-name.ondigitalocean.app
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
   FRONTEND_URL=https://your-frontend-domain.com
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-gmail-app-password
   ```

4. **Don't set DATABASE_URL manually** - DO will set it automatically when you attach the database.

---

### Step 6: Configure Resource Limits

1. **Instance Size**: 
   - **Free/Student**: `Basic XXS` ($5/month) or smallest available
   - **Production**: `Basic XS` ($12/month) recommended minimum

2. **Instance Count**: `1` (can scale later)

3. **Auto-scaling**: Leave disabled for now

---

### Step 7: Deploy the App

1. **Review Configuration**
   - Double-check all settings
   - Verify environment variables

2. **Click "Create Resources" or "Launch App"**
   - DO will start building your app
   - This takes 5-10 minutes first time

3. **Monitor Build Logs**
   - Watch for any errors
   - Check if migrations run successfully
   - Verify static files are collected

---

### Step 8: Run Migrations & Create Superuser

After initial deployment:

1. **Access App Console:**
   - Go to your app in DO dashboard
   - Click "Console" tab
   - Or use DO CLI: `doctl apps create-deployment <app-id>`

2. **Run migrations** (usually done automatically by entrypoint.sh):
   ```bash
   python manage.py migrate
   ```

3. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```
   Follow prompts to create admin user.

**Alternative: Use DO's One-Click Console:**
- In App Platform → Your App → "Console" tab
- Run commands interactively

---

### Step 9: Configure Custom Domain (Optional)

1. **In App Platform:**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `api.thehive.com`)

2. **Update DNS:**
   - DO will provide CNAME record
   - Add it to your domain's DNS settings
   - Wait for DNS propagation (5-60 minutes)

3. **Update Environment Variables:**
   - Add custom domain to `ALLOWED_HOSTS`
   - Add to `CORS_ALLOWED_ORIGINS` if needed
   - Redeploy app

---

### Step 10: Verify Deployment

Test these endpoints:

1. **Health Check:**
   ```
   GET https://your-app-name.ondigitalocean.app/api/health/
   Expected: {"status": "ok"}
   ```

2. **API Root:**
   ```
   GET https://your-app-name.ondigitalocean.app/
   Expected: JSON with API info
   ```

3. **Admin Panel:**
   ```
   GET https://your-app-name.ondigitalocean.app/admin/
   Login with superuser credentials
   ```

4. **API Endpoints:**
   ```
   GET https://your-app-name.ondigitalocean.app/api/offers/
   GET https://your-app-name.ondigitalocean.app/api/requests/
   ```

---

### Step 11: Frontend Configuration

**If hosting frontend separately (Option A - Recommended):**

1. **Build frontend with API URL:**
   ```bash
   cd frontend
   REACT_APP_API_BASE_URL=https://your-app-name.ondigitalocean.app npm run build
   ```

2. **Deploy to Netlify/Vercel/DO Static Site:**
   - Netlify: Drag & drop `frontend/build` folder
   - Or connect GitHub repo, set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`
   - Add environment variable: `REACT_APP_API_BASE_URL=https://your-app-name.ondigitalocean.app`

3. **Update CORS in backend:**
   - Add your frontend domain to `CORS_ALLOWED_ORIGINS`
   - Redeploy backend

**If serving frontend via Django (Option B):**

1. Build frontend: `cd frontend && npm run build`
2. Copy `frontend/build` contents to `backend/staticfiles/`
3. Configure Django to serve index.html for all routes (add to urls.py)
4. Update `CORS_ALLOWED_ORIGINS` to match your backend domain

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "DisallowedHost" Error

**Symptoms**: `Invalid HTTP_HOST header` error

**Fix**:
- Add your DO app domain to `ALLOWED_HOSTS`
- Format: `your-app-name.ondigitalocean.app`
- Redeploy

---

### Issue 2: CORS Errors in Browser

**Symptoms**: Frontend can't connect to API, CORS policy errors

**Fix**:
- Add frontend domain to `CORS_ALLOWED_ORIGINS`
- Format: `https://your-frontend-domain.com` (with protocol)
- No trailing slash
- Redeploy backend

---

### Issue 3: Static Files Not Loading (404)

**Symptoms**: CSS/JS files return 404

**Fix**:
- Verify `collectstatic` runs in build logs
- Check `STATIC_ROOT` is set correctly
- Verify WhiteNoise middleware is in `MIDDLEWARE`
- Check `STORAGES` configuration uses WhiteNoise

---

### Issue 4: Database Connection Failed

**Symptoms**: `OperationalError`, can't connect to database

**Fix**:
- Verify `DATABASE_URL` is set (check DO dashboard)
- Ensure database is running and attached to app
- Check `DATABASE_SSL_REQUIRE=True` for managed databases
- Verify database firewall allows app connections

---

### Issue 5: Media Files (Profile Pictures) Not Accessible

**Symptoms**: Uploaded images return 404

**Fix**:
- **Option 1 (Recommended)**: Set up DigitalOcean Spaces (S3-compatible)
  - Create Spaces bucket
  - Install `django-storages` and `boto3`
  - Configure in settings.py (see below)
- **Option 2 (Temporary)**: Media files stored locally (lost on restart)
  - Works for testing only
  - Not suitable for production

**Spaces Configuration** (add to settings.py):
```python
INSTALLED_APPS += ['storages']

AWS_ACCESS_KEY_ID = os.getenv('DO_SPACES_ACCESS_KEY')
AWS_SECRET_ACCESS_KEY = os.getenv('DO_SPACES_SECRET_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('DO_SPACES_BUCKET_NAME')
AWS_S3_ENDPOINT_URL = os.getenv('DO_SPACES_ENDPOINT_URL')  # e.g., https://nyc3.digitaloceanspaces.com
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
AWS_DEFAULT_ACL = 'public-read'

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

### Issue 6: Build Timeout

**Symptoms**: Build fails after 10-15 minutes

**Fix**:
- Check Dockerfile for unnecessary steps
- Optimize requirements.txt (pin versions)
- Use DO's build cache
- Check build logs for specific errors

---

### Issue 7: Application Crashes on Startup

**Symptoms**: App deploys but crashes immediately

**Fix**:
- Check logs in DO dashboard → Runtime Logs
- Verify all required env vars are set
- Check database connection
- Verify entrypoint.sh has execute permissions
- Test Dockerfile locally: `docker build -t test . && docker run test`

---

## 📊 MONITORING & MAINTENANCE

### View Logs:
- App Platform → Your App → Runtime Logs
- Real-time logs available
- Filter by component (build, run, deploy)

### Scale Resources:
- Settings → Components → Edit Component
- Adjust instance size/count
- Enable auto-scaling if needed

### Database Backups:
- Managed PostgreSQL includes automatic backups
- View in Databases → Your DB → Backups

### Update Application:
- Push to GitHub (main branch)
- DO will auto-deploy if enabled
- Or manually trigger deployment

---

## 🔐 SECURITY CHECKLIST

- [ ] `DEBUG=False` in production
- [ ] `DJANGO_SECRET_KEY` is strong and unique
- [ ] `ALLOWED_HOSTS` restricted to your domains
- [ ] `CORS_ALLOWED_ORIGINS` restricted to frontend domain
- [ ] Database credentials not in code (use env vars)
- [ ] Email credentials not in code (use env vars)
- [ ] HTTPS enabled (DO handles this automatically)
- [ ] CSRF and session cookies secure
- [ ] Regular security updates applied

---

## 💰 COST ESTIMATE (Student/Free Tier)

**Minimum Setup:**
- App Platform Basic XXS: $5/month (or free with credits)
- Managed PostgreSQL Basic: $15/month (or free dev DB if available)
- **Total: ~$20/month** (or use student credits)

**Recommended Setup:**
- App Platform Basic XS: $12/month
- Managed PostgreSQL Basic: $15/month
- **Total: ~$27/month**

**Free Alternatives:**
- Use DO Spaces for media: $5/month (1TB storage)
- Or use local disk temporarily (not recommended)

---

## 📞 NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test all API endpoints
2. ✅ Create admin superuser
3. ✅ Test user registration/login
4. ✅ Verify email sending works
5. ✅ Test file uploads (profile pictures)
6. ✅ Set up monitoring/alerts
7. ✅ Configure custom domain
8. ✅ Set up backup strategy

---

## 🆘 GETTING HELP

- DigitalOcean Docs: https://docs.digitalocean.com/products/app-platform/
- DO Community: https://www.digitalocean.com/community/tags/app-platform
- Check app logs in DO dashboard
- Use DO support if on paid plan

---

**Last Updated**: 2025-01-XX
**Django Version**: 5.2.7
**Python Version**: 3.12


