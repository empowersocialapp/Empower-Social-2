# API Setup Guide for Empower Social

This guide will help you configure the APIs needed for the conceptual recommendation system.

## 📋 Required APIs

The system needs these APIs:

1. **OpenAI API** - Generate personalized conceptual recommendations
2. **Airtable API** - Store user data, survey responses, and recommendations

---

## 🚀 Step-by-Step Setup

### Step 1: OpenAI API

**Purpose**: Generate personalized conceptual activity recommendations using GPT-4

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it (e.g., "Empower Social")
5. Copy the key (starts with `sk-`)

**Add to `backend/.env`:**
```env
OPENAI_API_KEY=sk-your-key-here
```

**Optional Configuration:**
```env
OPENAI_CONCEPT_MODEL=gpt-4o  # or gpt-4o-mini for faster/cheaper
```

**Cost**: ~$0.10 per recommendation set (5 recommendations)

---

### Step 2: Airtable API

**Purpose**: Store user profiles, survey responses, calculated scores, and recommendations

#### Part A: Get API Key

1. Go to https://airtable.com/create/tokens
2. Sign in to your Airtable account
3. Click "Create new token"
4. Name it (e.g., "Empower Social")
5. Grant access to your base:
   - Select your base
   - Grant "data.records:read" and "data.records:write" scopes
6. Copy the token (starts with `pat`)

**Add to `backend/.env`:**
```env
AIRTABLE_API_KEY=pat-your-key-here
```

#### Part B: Get Base ID

1. Open your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part after `/app` (the long string of letters/numbers)
4. Copy it

**Add to `backend/.env`:**
```env
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

**Cost**: Free tier available (1,200 requests/minute)

---

## ✅ Verification

After adding all API keys, verify they work:

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

---

## 🔧 Environment Variables

Create or update `backend/.env`:

```env
# Required
OPENAI_API_KEY=sk-your-key-here
AIRTABLE_API_KEY=pat-your-key-here
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Optional
OPENAI_CONCEPT_MODEL=gpt-4o        # Model to use (default: gpt-4o)
TEST_MODE=false                     # Set to true for testing
RECOMMENDATIONS_COUNT=5             # Number of recommendations to generate
```

---

## 💰 Cost Estimates

### Per User (Survey + Recommendations)
- **OpenAI GPT-4o**: ~$0.10 per recommendation set
- **Airtable**: Free tier covers most use cases

### Monthly Estimates
- **100 users**: ~$10/month (OpenAI only)
- **1,000 users**: ~$100/month (OpenAI only)
- **Airtable**: Free tier (up to 1,200 requests/minute)

---

## 🐛 Troubleshooting

### OpenAI Issues

**"OpenAI API Key not found"**
- Check that `OPENAI_API_KEY` is set in `backend/.env`
- Verify the key starts with `sk-`
- Make sure you have credits in your OpenAI account

**"Invalid API key"**
- Verify the key is copied correctly (no extra spaces)
- Check that the key hasn't expired
- Ensure you have sufficient credits

### Airtable Issues

**"Airtable API Key not found"**
- Check that `AIRTABLE_API_KEY` is set in `backend/.env`
- Verify the key starts with `pat`
- Make sure the token has access to your base

**"Airtable Base ID not found"**
- Check that `AIRTABLE_BASE_ID` is set in `backend/.env`
- Verify the Base ID matches your Airtable base URL

**"Unknown field name" errors**
- Check that field names match exactly (case-sensitive)
- Verify the token has the right scopes (read + write)

---

## 📝 Notes

- **Conceptual Recommendations Only**: The system currently generates conceptual activity recommendations, not real events with URLs
- **No Event APIs Needed**: Event APIs (Eventbrite, Meetup, etc.) are not required for the conceptual system
- **Future Enhancement**: Real event matching can be added later as a separate feature

---

## 🔄 Next Steps

After setting up APIs:

1. ✅ Verify API keys work (`node check-api-keys.js`)
2. ✅ Set up Airtable tables (see `docs/AIRTABLE_SETUP_GUIDE.md`)
3. ✅ Test the survey flow
4. ✅ Check that recommendations are generated and saved
