# AWS Amplify Deployment Guide

This guide will help you deploy the Empower Social application to AWS Amplify.

## Prerequisites

- AWS Account
- GitHub repository connected (Empower-Social-2)
- Environment variables ready (see below)

## Deployment Options

### Option 1: Frontend on Amplify + Backend on Separate Service (Recommended)

This is the simplest approach:
- **Frontend**: Deploy static files to Amplify
- **Backend**: Deploy to Render (recommended), Railway, or AWS Lambda

### Option 2: Full Stack on Amplify

- **Frontend**: Static hosting on Amplify
- **Backend**: AWS Lambda functions via Amplify

---

## Step 1: Prepare Repository

The repository is already configured with:
- ✅ `amplify.yml` - Build configuration
- ✅ `frontend/config.js` - Environment-aware API configuration
- ✅ Updated frontend files to use dynamic API URLs

## Step 2: Deploy Frontend to Amplify

### 2.1 Connect Repository

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** and authorize
4. Select repository: `empowersocialapp/Empower-Social-2`
5. Select branch: `main`

### 2.2 Configure Build Settings

Amplify should auto-detect the `amplify.yml` file. If not, use these settings:

**Build settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "No build step needed for static HTML"
    build:
      commands:
        - echo "Frontend is ready"
  artifacts:
    baseDirectory: frontend
    files:
      - '**/*'
```

**App root:** `/` (root of repository)

### 2.3 Set Environment Variables

In Amplify Console → App settings → Environment variables, add:

**For Frontend (if using separate backend):**
```
REACT_APP_API_URL=https://your-backend-url.com
# Or leave empty if using config.js auto-detection
```

**Note:** The `frontend/config.js` file will auto-detect the environment, but you can override it with environment variables if needed.

### 2.4 Deploy

1. Click **"Save and deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://main.xxxxx.amplifyapp.com`

---

## Step 3: Deploy Backend

### Option A: Deploy to Render (Recommended - Free Tier Available)

1. Go to [Render.com](https://render.com)
2. Create new **Web Service**
3. Connect GitHub repository (`Empower-Social-2`)
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   ```
   AIRTABLE_API_KEY=your_key
   AIRTABLE_BASE_ID=your_base_id
   OPENAI_API_KEY=your_key
   PORT=3000
   NODE_ENV=production
   ```
6. Render will auto-deploy and give you a URL like: `https://your-app.onrender.com`

**Note:** Render's free tier provides 750 hours/month, which is enough to run a single service 24/7.

### Option B: Deploy to Railway (Alternative)

**Note:** Railway's free plan may be limited to databases only. Render is recommended for hosting Node.js applications on the free tier.

1. Go to [Railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select `Empower-Social-2` repository
4. Set root directory: `backend`
5. Add environment variables (same as Render)
6. Railway will auto-deploy and give you a URL like: `https://your-app.railway.app`

### Option C: AWS Lambda (Advanced)

If you want everything on AWS, you can convert the Express app to Lambda functions. See AWS documentation for Serverless Express.

---

## Step 4: Update API URLs

### If Backend is on Separate Service:

1. Update `frontend/config.js` to point to your backend URL:

```javascript
// In frontend/config.js, update the Amplify section:
} else if (isAmplify) {
    // Replace with your actual backend URL
    API_BASE_URL = 'https://your-backend.onrender.com';
    // or
    API_BASE_URL = 'https://your-backend.railway.app';
}
```

2. Or set environment variable in Amplify Console:
   - Go to App settings → Environment variables
   - Add: `REACT_APP_API_URL=https://your-backend-url.com`
   - Update `config.js` to check for this variable first

### Update CORS on Backend

Make sure your backend allows requests from Amplify domain:

```javascript
// In backend/server.js
const corsOptions = {
  origin: [
    'http://localhost:8081',
    'https://*.amplifyapp.com',
    'https://your-custom-domain.com'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

---

## Step 5: Custom Domain (Optional)

1. In Amplify Console → Domain management
2. Add custom domain
3. Follow DNS setup instructions
4. SSL certificate is automatically provisioned

---

## Step 6: Environment Variables Checklist

### Backend Environment Variables (Render/Railway/Lambda):

✅ `AIRTABLE_API_KEY` - Your Airtable API key  
✅ `AIRTABLE_BASE_ID` - Your Airtable base ID  
✅ `OPENAI_API_KEY` - Your OpenAI API key  
✅ `PORT` - Port number (usually 3000)  
✅ `NODE_ENV` - Set to `production`  

### Frontend Environment Variables (Amplify):

✅ `REACT_APP_API_URL` - (Optional) Backend API URL if not using auto-detection

---

## Step 7: Verify Deployment

1. **Frontend**: Visit your Amplify URL
2. **Test Survey**: Complete the intake survey
3. **Check Backend**: Verify API calls in browser DevTools → Network tab
4. **Test Login**: Try logging in with existing user
5. **Test Recommendations**: Verify recommendations load correctly

---

## Troubleshooting

### Frontend can't connect to backend

- Check CORS settings on backend
- Verify backend URL in `frontend/config.js`
- Check browser console for CORS errors
- Ensure backend is running and accessible

### Build fails on Amplify

- Check `amplify.yml` syntax
- Verify `frontend/` directory structure
- Check build logs in Amplify Console

### API calls return 404

- Verify API routes are correct
- Check backend is deployed and running
- Verify environment variables are set

### Environment variables not working

- Restart Amplify app after adding variables
- Check variable names match exactly
- Verify no typos in variable values

---

## Cost Estimates

**AWS Amplify:**
- Free tier: 1000 build minutes/month, 15 GB storage
- Paid: ~$0.01 per build minute after free tier
- **Estimated cost**: $0-5/month for small apps

**Render:**
- Free tier: 750 hours/month (enough for 24/7 on single service)
- Paid: ~$7-25/month for production (if needed)
- **Note:** Railway's free plan may be limited to databases only

**Total estimated cost**: $5-25/month for full deployment

---

## Next Steps

1. ✅ Deploy frontend to Amplify
2. ✅ Deploy backend to Render (or Railway)
3. ✅ Update API URLs
4. ✅ Test end-to-end flow
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring/alerts
7. ✅ Set up CI/CD for automatic deployments

---

## Support

For issues:
- Check Amplify build logs
- Check backend logs (Render/Railway dashboard)
- Review browser console for errors
- Verify all environment variables are set correctly

