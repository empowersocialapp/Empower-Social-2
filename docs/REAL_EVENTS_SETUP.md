# Real Events Integration Setup Guide

## Overview

The system now supports fetching real events from multiple sources:
- **Event APIs**: Eventbrite, Meetup (structured data)
- **Web Scraping**: Firecrawl (scrapes local event calendars, community centers, libraries, etc.)
- **Hybrid Approach**: GPT-4 extracts events from scraped content

## Architecture

1. **Events Service** (`backend/services/events.js`)
   - Fetches events from Eventbrite API
   - Fetches events from Meetup API
   - **Uses Firecrawl to scrape** local event calendars, community centers, libraries
   - **Uses GPT-4 to extract** structured event data from scraped content
   - Normalizes events to common format
   - Filters/ranks based on user preferences
   - Removes duplicates

2. **OpenAI Service** (updated)
   - Fetches real events before generating recommendations
   - Includes real events in GPT prompt
   - GPT-4 selects best matches from real events
   - Formats recommendations with real event details

## Setup Steps

### 1. Get API Keys

#### Eventbrite API
1. Go to https://www.eventbrite.com/platform/api/
2. Sign up for Eventbrite API access
3. Get your OAuth token or Personal Token
4. Add to `.env`: `EVENTBRITE_API_KEY=your_token_here`

#### Meetup API
1. Go to https://www.meetup.com/meetup_api/
2. Sign up for Meetup API access
3. Get your API key
4. Add to `.env`: `MEETUP_API_KEY=your_key_here`

#### Firecrawl API (for web scraping)
1. Go to https://www.firecrawl.dev/
2. Sign up for Firecrawl API access
3. Get your API key
4. Add to `.env`: `FIRECRAWL_API_KEY=your_key_here`

**What Firecrawl does:**
- Scrapes local event calendars (city websites, parks & rec)
- Scrapes community center websites
- Scrapes library event pages
- Scrapes museum/venue websites
- Uses GPT-4 to extract structured event data from scraped content

#### Google Maps Geocoding (for zipcode → lat/lng)
1. Go to https://console.cloud.google.com/
2. Enable Geocoding API
3. Create API key
4. Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`

**Note:** Google Maps API has free tier (first $200/month free), but you can also use free alternatives like OpenStreetMap Nominatim (rate-limited, already implemented as fallback).

### 2. Update Environment Variables

Add to `backend/.env`:
```env
EVENTBRITE_API_KEY=your_eventbrite_key
MEETUP_API_KEY=your_meetup_key
FIRECRAWL_API_KEY=your_firecrawl_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Priority:**
- **Firecrawl** is most valuable for local events (city calendars, libraries, community centers)
- **Eventbrite/Meetup** are good for broader event discovery
- **Google Maps** is needed for geocoding (or use free OpenStreetMap fallback)

### 3. Install Dependencies

The `axios` package should already be in `package.json`. If not:
```bash
cd backend
npm install axios
```

### 4. Test the Integration

1. Start your backend server: `npm start`
2. Submit a survey
3. Check console logs for:
   - "Fetching real events..."
   - "Fetched X real events"
4. Recommendations should now include real events with actual URLs

## How It Works

1. **User submits survey** → Data saved to Airtable
2. **System fetches real events** from multiple sources:
   - Eventbrite API (structured events)
   - Meetup API (structured events)
   - **Firecrawl** scrapes local event calendars:
     - City/County event pages
     - Parks & Recreation calendars
     - Library event listings
     - Community center calendars
     - Local news event pages
   - **GPT-4 extracts** structured event data from scraped content
3. **Events normalized** to common format
4. **Events filtered** by location, interests, preferences
5. **Duplicates removed** (same event from multiple sources)
6. **GPT-4 receives**:
   - User profile (personality, interests, etc.)
   - List of real events (20-30 best matches)
7. **GPT-4 selects** 10 best matches from real events
8. **GPT-4 formats** recommendations with real event details (dates, URLs, locations)

## Fallback Behavior

If no API keys are set or no events are found:
- System falls back to conceptual recommendations
- GPT-4 will indicate these are suggestions to search for
- User experience remains smooth

## Customization

### Add More Event Sources

Edit `backend/services/events.js`:
- Add new fetch functions (e.g., `fetchFacebookEvents()`)
- Add to `fetchRealEvents()` function
- Normalize to common format

### Adjust Filtering/Ranking

Edit `filterAndRankEvents()` function in `events.js`:
- Add personality-based filtering
- Add distance calculations
- Add affinity group matching
- Improve ranking algorithm

### Improve Geocoding

Current implementation uses Google Maps. Alternatives:
- **OpenStreetMap Nominatim** (free, rate-limited)
- **Mapbox Geocoding API**
- **HERE Geocoding API**

## Cost Considerations

- **Eventbrite API**: Free tier available (2,000 calls/hour)
- **Meetup API**: Free tier available
- **Firecrawl API**: Paid service (check pricing at firecrawl.dev)
  - Scraping costs per page
  - Consider caching scraped content
- **Google Maps API**: $200/month free credit
  - **OR** use free OpenStreetMap Nominatim (already implemented as fallback)
- **OpenAI GPT-4**: 
  - ~$0.10 per recommendation (unchanged)
  - Additional cost for parsing scraped content (~$0.02-0.05 per page scraped)

**Total estimated cost per user:**
- With APIs only: ~$0.10-0.15
- With Firecrawl scraping: ~$0.15-0.25 (depends on pages scraped)

## Troubleshooting

### No events found
- Check API keys are set correctly
- Verify zipcode geocoding is working
- Check API rate limits
- Review console logs for API errors

### Events not matching user profile
- Improve `filterAndRankEvents()` function
- Adjust category mappings
- Add more filtering criteria

### API errors
- Check API key validity
- Verify API quotas/limits
- Check network connectivity
- Review API documentation for changes

## Next Steps

1. **Get API keys** for Eventbrite and Meetup
2. **Test with real data** to see event quality
3. **Refine filtering** based on results
4. **Add more sources** (Facebook Events, local event calendars)
5. **Build event database** for caching/offline access

