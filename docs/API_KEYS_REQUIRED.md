# API Keys Required for Empower Social

## ✅ Already Required (System Won't Work Without These)

These are **already set up** and required for basic functionality:

1. **OpenAI API Key** (`OPENAI_API_KEY`)
   - **Purpose**: Generate personalized recommendations
   - **Status**: ✅ Already in use
   - **Where to get**: https://platform.openai.com/api-keys
   - **Cost**: ~$0.10 per recommendation

2. **Airtable API Key** (`AIRTABLE_API_KEY`)
   - **Purpose**: Store user data, survey responses, scores
   - **Status**: ✅ Already in use
   - **Where to get**: https://airtable.com/create/tokens
   - **Cost**: Free tier available

3. **Airtable Base ID** (`AIRTABLE_BASE_ID`)
   - **Purpose**: Identify which Airtable base to use
   - **Status**: ✅ Already in use
   - **Where to get**: From your Airtable base URL
   - **Cost**: Free

---

## 🎯 Recommended (For Real Events)

These are **optional but recommended** to get real events in recommendations:

### Priority 1: Firecrawl (Best for Local Events)

4. **Firecrawl API Key** (`FIRECRAWL_API_KEY`)
   - **Purpose**: Scrape local event calendars (city websites, libraries, parks & rec)
   - **Status**: ⚠️ Not yet added
   - **Where to get**: https://www.firecrawl.dev/
   - **Cost**: Paid service (check pricing)
   - **Why Priority 1**: Finds unique local events not on Eventbrite/Meetup
   - **What it does**: 
     - Scrapes `city.gov/events`, `citylibrary.org/events`, etc.
     - Uses GPT-4 to extract structured event data
     - Finds community events, library programs, city activities

### Priority 2: Event APIs (For Broader Coverage)

5. **Eventbrite API Key** (`EVENTBRITE_API_KEY`)
   - **Purpose**: Get structured events from Eventbrite
   - **Status**: ⚠️ Not yet added
   - **Where to get**: https://www.eventbrite.com/platform/api/
   - **Cost**: Free tier (2,000 calls/hour)
   - **Why Priority 2**: Good coverage of commercial events, workshops, conferences

6. **Meetup API Key** (`MEETUP_API_KEY`)
   - **Purpose**: Get structured events from Meetup
   - **Status**: ⚠️ Not yet added
   - **Where to get**: https://www.meetup.com/meetup_api/
   - **Cost**: Free tier available
   - **Why Priority 2**: Great for social groups, hobby meetups, networking

### Priority 3: Geocoding (Optional - Has Free Fallback)

7. **Google Maps API Key** (`GOOGLE_MAPS_API_KEY`)
   - **Purpose**: Convert zipcode to lat/lng and get city/state
   - **Status**: ⚠️ Not yet added (but has free fallback)
   - **Where to get**: https://console.cloud.google.com/ (enable Geocoding API)
   - **Cost**: $200/month free credit, then pay-as-you-go
   - **Why Priority 3**: System already uses free OpenStreetMap as fallback
   - **Note**: Only needed if you want more reliable geocoding

---

## 📋 Quick Setup Checklist

### Minimum Setup (Current - Works Now)
- ✅ OpenAI API Key
- ✅ Airtable API Key
- ✅ Airtable Base ID

### Recommended Setup (For Real Events)
- ✅ OpenAI API Key
- ✅ Airtable API Key
- ✅ Airtable Base ID
- ⚠️ **Firecrawl API Key** ← Add this first
- ⚠️ **Eventbrite API Key** ← Add this second
- ⚠️ **Meetup API Key** ← Add this third
- ⚠️ Google Maps API Key (optional - free fallback exists)

---

## 🚀 Getting Started

### Step 1: Add Firecrawl (Most Important for Local Events)

1. Go to https://www.firecrawl.dev/
2. Sign up and get your API key
3. Add to `backend/.env`:
   ```env
   FIRECRAWL_API_KEY=fc-your-key-here
   ```

### Step 2: Add Eventbrite

1. Go to https://www.eventbrite.com/platform/api/
2. Sign up for API access
3. Get your OAuth token or Personal Token
4. Add to `backend/.env`:
   ```env
   EVENTBRITE_API_KEY=your-token-here
   ```

### Step 3: Add Meetup

1. Go to https://www.meetup.com/meetup_api/
2. Sign up for API access
3. Get your API key
4. Add to `backend/.env`:
   ```env
   MEETUP_API_KEY=your-key-here
   ```

### Step 4: (Optional) Add Google Maps

1. Go to https://console.cloud.google.com/
2. Create a project
3. Enable "Geocoding API"
4. Create an API key
5. Add to `backend/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your-key-here
   ```

**Note**: Google Maps is optional - the system will use free OpenStreetMap if not set.

---

## 💰 Cost Summary

### Current (Minimum Setup)
- OpenAI: ~$0.10 per user
- Airtable: Free tier
- **Total**: ~$0.10 per user

### With All APIs (Recommended)
- OpenAI: ~$0.10 per user
- Airtable: Free tier
- Firecrawl: ~$0.05-0.10 per user (depends on pages scraped)
- Eventbrite: Free tier
- Meetup: Free tier
- Google Maps: Free tier ($200/month credit)
- **Total**: ~$0.15-0.20 per user

---

## 🧪 Testing

After adding API keys, test with:

1. Submit a survey
2. Check console logs for:
   - "Fetching real events..."
   - "Fetched X real events"
   - Any API errors

3. Verify recommendations include:
   - Real event names
   - Actual URLs
   - Real dates and locations

---

## ❓ Which Ones Do I Really Need?

**Minimum (Current)**: System works with just OpenAI + Airtable, but recommendations will be conceptual (not real events).

**Recommended**: 
- **Firecrawl** - Most valuable for unique local events
- **Eventbrite** - Good for commercial events
- **Meetup** - Good for social groups

**Nice to Have**:
- **Google Maps** - Only if you want more reliable geocoding (free fallback exists)

---

## 🔍 Current Status

Check your `backend/.env` file to see which keys you have:

```bash
# Required (should already be set)
OPENAI_API_KEY=sk-...
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...

# Recommended (add these)
FIRECRAWL_API_KEY=
EVENTBRITE_API_KEY=
MEETUP_API_KEY=

# Optional
GOOGLE_MAPS_API_KEY=
```


