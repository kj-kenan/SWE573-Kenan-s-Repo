# Frontend Deployment Guide - DigitalOcean Static Site

## ✅ Backend Status
- Backend URL: `https://thehivebackend-bnd7k.ondigitalocean.app`
- Health endpoint working: `/api/health/` returns `{"status": "ok"}`

---

## 📝 Frontend Deployment Steps

### Step 1: Push Frontend Code to GitHub

Ensure all frontend changes are committed and pushed:

```bash
git add .
git commit -m "Prepare frontend for deployment"
git push origin main
```

---

### Step 2: Create DigitalOcean Static Site

1. **Go to DigitalOcean Apps**
   - Navigate to: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**
   - Select "GitHub"
   - Authorize DigitalOcean (if not already done)
   - Select your repository: `kj-kenan/SWE573-Kenan-s-Repo`
   - Branch: `main`
   - **Source Directory**: `frontend` (important!)

3. **Configure App Settings**
   - **App Name**: `the-hive-frontend` (or your choice)
   - **Region**: Same as backend (e.g., New York)
   - **Resource Type**: Automatically detected as "Static Site"

4. **Configure Build Settings**
   
   DigitalOcean should auto-detect React, but verify:
   
   - **Build Command**: 
     ```
     npm install && npm run build
     ```
   
   - **Output Directory**: 
     ```
     build
     ```
   
   - **HTTP Port**: Leave empty for static sites

5. **Set Environment Variables**
   
   Click "Edit" next to Environment Variables and add:
   
   ```
   REACT_APP_API_BASE_URL=https://thehivebackend-bnd7k.ondigitalocean.app
   ```
   
   **Important**: This must be set BEFORE the build, not after!

6. **Review and Create**
   - Review all settings
   - Click "Create Resources"
   - Wait 5-10 minutes for first deployment

---

### Step 3: Monitor Build

Watch the build logs in the DigitalOcean dashboard:

1. Look for successful build messages:
   ```
   npm install
   npm run build
   Creating an optimized production build...
   Compiled successfully!
   ```

2. If build fails, check:
   - Build command is correct
   - Environment variable is set
   - Source directory is `frontend`

---

### Step 4: Get Frontend URL

After deployment completes:

1. Go to your app in DigitalOcean dashboard
2. You'll see the app URL (e.g., `https://the-hive-frontend-xyz.ondigitalocean.app`)
3. Copy this URL - you'll need it for the next step

---

### Step 5: Update Backend CORS Settings

Now that you have the frontend URL, update the backend:

1. Go to backend app in DigitalOcean: `thehivebackend-bnd7k`
2. Go to Settings → App-Level Environment Variables
3. Update these variables:

```bash
# Replace with your actual frontend URL
FRONTEND_URL=https://your-frontend-app.ondigitalocean.app
CORS_ALLOWED_ORIGINS=https://your-frontend-app.ondigitalocean.app
CSRF_TRUSTED_ORIGINS=https://your-frontend-app.ondigitalocean.app

# Keep the existing backend domain
ALLOWED_HOSTS=thehivebackend-bnd7k.ondigitalocean.app
```

4. Save changes
5. Backend will automatically redeploy

---

### Step 6: Test the Deployment

1. **Visit Frontend URL**
   ```
   https://your-frontend-app.ondigitalocean.app
   ```

2. **Test Key Features**:
   - [ ] Landing page loads
   - [ ] Register a new user
   - [ ] Login with credentials
   - [ ] View map on home page
   - [ ] Create an offer/request
   - [ ] View profile
   - [ ] Check if location capture works

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for any CORS errors
   - Verify API calls go to `https://thehivebackend-bnd7k.ondigitalocean.app`

---

## 🔧 Troubleshooting

### Issue 1: CORS Errors

**Symptoms**: 
```
Access to fetch at 'https://thehivebackend-bnd7k.ondigitalocean.app/api/...' 
from origin 'https://your-frontend-app.ondigitalocean.app' has been blocked by CORS policy
```

**Fix**:
1. Ensure `CORS_ALLOWED_ORIGINS` in backend includes your frontend URL
2. Use `https://` (not `http://`)
3. No trailing slash
4. Redeploy backend after updating

---

### Issue 2: API Calls Go to Wrong URL

**Symptoms**: API calls go to `localhost:8000` or old Render URL

**Fix**:
1. Verify `REACT_APP_API_BASE_URL` is set in frontend app settings
2. Environment variable must be set BEFORE build
3. Trigger a rebuild: Settings → General → "Force Rebuild"

---

### Issue 3: Build Fails

**Symptoms**: Deployment fails with npm errors

**Fix**:
1. Check build logs for specific error
2. Verify `package.json` is in `frontend/` directory
3. Ensure source directory is set to `frontend`
4. Check Node version compatibility

---

### Issue 4: Blank Page After Deployment

**Symptoms**: App deploys but shows blank page

**Fix**:
1. Check browser console for errors
2. Verify output directory is `build`
3. Check if `_redirects` file exists in `frontend/public/` for client-side routing
4. Verify all dependencies are in `package.json`, not just `devDependencies`

---

## 📋 Summary Checklist

- [ ] Frontend code pushed to GitHub
- [ ] DigitalOcean static site created with source directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Output directory: `build`
- [ ] Environment variable set: `REACT_APP_API_BASE_URL=https://thehivebackend-bnd7k.ondigitalocean.app`
- [ ] Frontend deployed successfully
- [ ] Backend CORS updated with frontend URL
- [ ] Backend redeployed
- [ ] Registration tested
- [ ] Login tested
- [ ] Map features tested
- [ ] No CORS errors in console

---

## 🎯 Expected Result

After successful deployment:
- Frontend: `https://your-frontend-app.ondigitalocean.app`
- Backend: `https://thehivebackend-bnd7k.ondigitalocean.app`
- All API calls work without CORS errors
- Users can register, login, and use all features

---

## 🔄 Future Updates

To update the frontend:
1. Make changes locally
2. Commit and push to GitHub
3. DigitalOcean auto-deploys (if enabled)
4. Or manually trigger deployment in dashboard

To update environment variables:
1. Settings → App-Level Environment Variables
2. Update the variable
3. Click "Save"
4. App rebuilds automatically

---

**Ready to deploy? Follow Step 1 above!**


