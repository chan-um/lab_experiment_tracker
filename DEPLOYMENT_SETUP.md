# Deployment Setup Guide

## Backend CORS Configuration (REQUIRED)

Your Cloud Run backend needs to allow requests from your Firebase Hosting frontend.

### Steps to Configure CORS:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → Select your `lab-app` service
3. Click **"Edit & Deploy New Revision"**
4. Go to the **"Variables & Secrets"** tab
5. Under **"Environment Variables"**, add or update:
   - **Name**: `CORS_ORIGINS`
   - **Value**: `https://my-lab-app-3512a.web.app,https://my-lab-app-3512a.firebaseapp.com`
6. Click **"Deploy"**

### Why This is Needed:

The Flask backend uses `flask-cors` to control which domains can make API requests. Without this configuration:
- Frontend requests will fail with CORS errors
- Browser will block cross-origin requests from Firebase Hosting to Cloud Run

### Current Configuration:

The backend defaults to `http://localhost:5173,http://localhost:3000` for local development. In production, you must set `CORS_ORIGINS` to include your Firebase Hosting domains.

## Frontend API Configuration

The frontend is configured to use:
- **Backend URL**: `https://lab-app-r7ao4jqdya-ue.a.run.app/api`
- **Configured in**: `.github/workflows/firebase-hosting-merge.yml`

This is set as an environment variable during the build process and gets baked into the frontend bundle.

## Testing the Connection

After deploying with correct CORS configuration:

1. Open your frontend: https://my-lab-app-3512a.web.app
2. Open browser DevTools (F12) → Console tab
3. You should see: `API_BASE_URL: https://lab-app-r7ao4jqdya-ue.a.run.app/api`
4. If you see `localhost:5000`, the frontend hasn't been rebuilt yet

## Troubleshooting

### "Cannot connect to backend server"
- ✅ Check that Cloud Run service is running
- ✅ Verify CORS_ORIGINS includes your Firebase Hosting URL
- ✅ Check browser console for the actual API_BASE_URL being used
- ✅ Verify the frontend has been rebuilt after workflow changes

### CORS Errors in Browser Console
- Verify `CORS_ORIGINS` environment variable is set in Cloud Run
- Check that the Firebase Hosting URL matches exactly (including https://)
- Redeploy the Cloud Run service after updating CORS_ORIGINS
