# API Keys Required for Empower Social

## ✅ Required (System Won't Work Without These)

These are **required** for basic functionality:

1. **OpenAI API Key** (`OPENAI_API_KEY`)
   - **Purpose**: Generate personalized conceptual recommendations
   - **Status**: ✅ Required
   - **Where to get**: https://platform.openai.com/api-keys
   - **Cost**: ~$0.10 per recommendation
   - **Model**: Uses GPT-4o or GPT-4o-mini (configurable via `OPENAI_CONCEPT_MODEL`)

2. **Airtable API Key** (`AIRTABLE_API_KEY`)
   - **Purpose**: Store user data, survey responses, scores, recommendations
   - **Status**: ✅ Required
   - **Where to get**: https://airtable.com/create/tokens
   - **Cost**: Free tier available (1,200 requests/minute)

3. **Airtable Base ID** (`AIRTABLE_BASE_ID`)
   - **Purpose**: Identify which Airtable base to use
   - **Status**: ✅ Required
   - **Where to get**: From your Airtable base URL (the part after `/app` and before the table name)
   - **Cost**: Free

---

## 📋 Setup Instructions

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

### Step 2: Get Airtable API Key

1. Go to https://airtable.com/create/tokens
2. Sign in to your Airtable account
3. Click "Create new token"
4. Name it (e.g., "Empower Social")
5. Grant access to your base
6. Copy the token (starts with `pat`)
7. Add to `backend/.env`:
   ```env
   AIRTABLE_API_KEY=pat-your-key-here
   ```

### Step 3: Get Airtable Base ID

1. Open your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part after `/app` (the long string of letters/numbers)
4. Add to `backend/.env`:
   ```env
   AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
   ```

---

## 🔧 Environment Variables

Create or update `backend/.env`:

```env
# Required
OPENAI_API_KEY=sk-your-key-here
AIRTABLE_API_KEY=pat-your-key-here
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Optional
OPENAI_CONCEPT_MODEL=gpt-4o  # or gpt-4o-mini for faster/cheaper
TEST_MODE=false              # Set to true for testing (generates 1 recommendation)
RECOMMENDATIONS_COUNT=5      # Number of recommendations to generate
```

---

## ✅ Verification

After adding API keys, verify they work:

```bash
cd backend
node check-api-keys.js
```

Should show:
- ✅ OpenAI API Key: Valid
- ✅ Airtable API Key: Valid
- ✅ Airtable Base ID: Valid

---

## 💰 Cost Estimates

### Per User (Survey + Recommendations)
- **OpenAI GPT-4o**: ~$0.10 per recommendation set (5 recommendations)
- **Airtable**: Free tier covers most use cases (1,200 requests/minute)

### Monthly Estimates (100 users)
- **OpenAI**: ~$10/month (100 users × $0.10)
- **Airtable**: Free tier (up to 1,200 requests/minute)

---

## 🐛 Troubleshooting

### "OpenAI API Key not found"
- Check that `OPENAI_API_KEY` is set in `backend/.env`
- Verify the key starts with `sk-`
- Make sure you have credits in your OpenAI account

### "Airtable API Key not found"
- Check that `AIRTABLE_API_KEY` is set in `backend/.env`
- Verify the key starts with `pat`
- Make sure the token has access to your base

### "Airtable Base ID not found"
- Check that `AIRTABLE_BASE_ID` is set in `backend/.env`
- Verify the Base ID matches your Airtable base URL
- Make sure the base exists and is accessible

### "Invalid API key" errors
- Verify keys are copied correctly (no extra spaces)
- Check that keys haven't expired
- For Airtable, ensure the token has the right scopes

---

## 📝 Notes

- **Conceptual Recommendations Only**: The system currently generates conceptual activity recommendations, not real events with URLs
- **No Event APIs Needed**: Event APIs (Eventbrite, Meetup, etc.) are not required for the conceptual system
- **Future Enhancement**: Real event matching can be added later as a separate feature
