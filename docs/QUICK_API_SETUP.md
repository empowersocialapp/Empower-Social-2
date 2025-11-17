# Quick API Setup Guide

## Required APIs

The system only needs **2 APIs** for conceptual recommendations:

1. **OpenAI API** - Generate personalized recommendations
2. **Airtable API** - Store user data and recommendations

---

## Quick Setup (5 minutes)

### Step 1: OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

### Step 2: Airtable API Key

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

### Step 3: Airtable Base ID

1. Open your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part after `/app` (the long string)
4. Add to `backend/.env`:
   ```env
   AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
   ```

### Step 4: Verify Setup

Run the check script:
```bash
cd backend
node check-api-keys.js
```

You should see:
```
✅ REQUIRED (System needs these to work):
  ✅ OpenAI API Key: Valid
  ✅ Airtable API Key: Valid
  ✅ Airtable Base ID: Valid
```

### Step 5: Restart Backend

```bash
# Kill existing backend
lsof -ti:3000 | xargs kill -9

# Restart
cd backend
npm start
```

---

## Optional Configuration

You can customize these in `backend/.env`:

```env
# Model selection (default: gpt-4o)
OPENAI_CONCEPT_MODEL=gpt-4o        # or gpt-4o-mini for faster/cheaper

# Testing mode (default: false)
TEST_MODE=false                     # Set to true for testing (generates 1 recommendation)

# Number of recommendations (default: 5)
RECOMMENDATIONS_COUNT=5             # How many concepts to generate
```

---

## Troubleshooting

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

---

## Cost Estimates

- **OpenAI**: ~$0.10 per recommendation set (5 recommendations)
- **Airtable**: Free tier (1,200 requests/minute)

For 100 users/month: ~$10/month total

---

## Notes

- **Conceptual Recommendations Only**: The system generates conceptual activity recommendations, not real events
- **No Event APIs Needed**: Event APIs (Eventbrite, Meetup, etc.) are not required
- **Future Enhancement**: Real event matching can be added later as a separate feature
