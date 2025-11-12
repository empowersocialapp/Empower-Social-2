# Event Sources for Empower Social

## Overview

Empower Social fetches events from multiple sources to provide comprehensive, personalized recommendations. The system combines structured APIs with web scraping to find both mainstream and local community events.

## Event Sources

### 1. **Eventbrite API** ✅ Implemented
- **Type**: Structured API
- **Best For**: Commercial events, workshops, conferences, ticketed events
- **Coverage**: National and international
- **Setup**: Requires `EVENTBRITE_API_KEY`
- **Rate Limit**: 2,000 calls/hour (free tier)
- **Cost**: Free tier available

### 2. **Meetup API** ✅ Implemented
- **Type**: Structured API
- **Best For**: Social groups, hobby meetups, networking events
- **Coverage**: Global (strong in urban areas)
- **Setup**: Requires `MEETUP_API_KEY`
- **Rate Limit**: Varies by plan
- **Cost**: Free tier available

### 3. **Firecrawl Web Scraping** ✅ Implemented
- **Type**: Web scraping + GPT-4 extraction
- **Best For**: Local community events, city calendars, libraries, parks & rec
- **Coverage**: Any website with event listings
- **Setup**: Requires `FIRECRAWL_API_KEY` and `OPENAI_API_KEY`
- **Sources Scraped**:
  - City/County event calendars (`city.gov/events`)
  - Parks & Recreation calendars (`cityparksandrec.org/events`)
  - Library event pages (`citylibrary.org/events`)
  - Community center calendars (`citycommunitycenter.org/calendar`)
  - Local news event listings
  - Chamber of Commerce events
- **How It Works**:
  1. Firecrawl scrapes the webpage and converts to markdown
  2. GPT-4 extracts structured event data from the content
  3. Events normalized to common format
- **Cost**: Per-page scraping fee + GPT-4 parsing cost

### 4. **Local Community Events** ✅ Implemented
- **Type**: Firecrawl scraping (specialized for local sources)
- **Best For**: Hyper-local events, community gatherings
- **Sources**: Custom URLs based on user's city
- **Setup**: Uses `FIRECRAWL_API_KEY`

## Additional Sources (Not Yet Implemented)

### APIs (Structured Data)
- **Facebook Events API**: Requires app approval, limited access
- **Ticketmaster API**: Large concerts, sports events
- **StubHub API**: Secondary ticket market
- **Bandsintown API**: Music concerts and shows
- **Songkick API**: Concert discovery
- **Yelp Events API**: Local business events
- **Google Places API**: Events at venues/places

### Web Scraping Targets (via Firecrawl)
- **Facebook Events** (public pages): May be blocked by Facebook
- **Nextdoor Events**: Community-based events
- **Local Facebook Groups**: Group-organized events
- **University Event Calendars**: Campus events
- **Museum/Venue Websites**: Institution-specific events
- **Religious Organization Calendars**: Faith-based events
- **Nonprofit Organization Calendars**: Community service events

### Aggregators
- **AllEvents.in**: Event aggregator
- **Eventful API**: Event discovery platform
- **Local event aggregators**: City-specific event sites

## How Events Are Combined

1. **Parallel Fetching**: All sources queried simultaneously
2. **Normalization**: Events converted to common format
3. **Deduplication**: Same events from multiple sources removed
4. **Filtering**: Events filtered by location, interests, preferences
5. **Ranking**: Events ranked by relevance to user profile
6. **Selection**: Top 20-30 events sent to GPT-4
7. **Final Selection**: GPT-4 selects 10 best matches

## Customization

### Adding Custom URLs for Firecrawl

Edit `backend/services/events.js` → `fetchFirecrawlEvents()` or `fetchLocalCommunityEvents()`:

```javascript
const urlsToScrape = [
  // Add your custom URLs here
  `https://www.yourcity.gov/events`,
  `https://www.yourcommunitycenter.org/calendar`,
  // etc.
];
```

### Adding New API Sources

1. Create fetch function: `fetchNewSourceEvents(zipcode, categories)`
2. Add to `fetchRealEvents()` parallel array
3. Create normalization function: `normalizeNewSourceEvents(events)`
4. Add to normalization step

### Location-Specific Customization

The system automatically:
- Geocodes zipcode to get city/state
- Uses city name to construct URLs (e.g., `charlottesville.gov/events`)
- Falls back gracefully if URLs don't exist

For better results, you can:
- Maintain a database of known-good URLs per city
- Use city-specific URL patterns
- Cache successful URLs per location

## Performance Considerations

### Caching
- Consider caching scraped content (Firecrawl results)
- Cache geocoding results (zipcode → city/state)
- Cache event lists per zipcode (refresh daily)

### Rate Limiting
- Firecrawl: Respect rate limits, batch requests
- APIs: Monitor rate limits, implement backoff
- GPT-4: Batch parsing when possible

### Cost Optimization
- Only scrape URLs that are likely to have events
- Cache scraped content to avoid re-scraping
- Use GPT-4 parsing efficiently (batch when possible)
- Prioritize free APIs (Eventbrite, Meetup) over paid scraping

## Future Enhancements

1. **Event Database**: Cache events in Airtable or database
2. **Scheduled Scraping**: Daily/weekly background jobs
3. **User-Reported Events**: Allow users to submit events
4. **Event Quality Scoring**: Rate events by user engagement
5. **Location-Specific URL Database**: Maintain known-good URLs
6. **Smart URL Discovery**: Use search engines to find event pages
7. **Event Deduplication**: Better matching across sources
8. **Real-time Updates**: Webhook subscriptions for event updates

## Testing

To test event sources:

1. **Test Individual Sources**:
   ```javascript
   const { fetchEventbriteEvents } = require('./services/events');
   const events = await fetchEventbriteEvents('22903', ['Arts & Culture']);
   console.log(events);
   ```

2. **Test Firecrawl**:
   ```javascript
   const { fetchFirecrawlEvents } = require('./services/events');
   const events = await fetchFirecrawlEvents('22903', 'Charlottesville', ['Arts & Culture']);
   console.log(events);
   ```

3. **Test Full Pipeline**:
   - Submit a survey
   - Check console logs for "Fetching real events..."
   - Verify events appear in recommendations

## Troubleshooting

### No Events from Firecrawl
- Check `FIRECRAWL_API_KEY` is set
- Verify URLs exist (may need city-specific customization)
- Check Firecrawl API status
- Review console logs for scraping errors

### Events Not Parsing Correctly
- Check GPT-4 parsing logs
- Verify scraped content has event data
- Adjust GPT-4 prompt in `parseEventsFromScrapedContent()`
- Consider using Firecrawl's structured extraction features

### Too Many Duplicate Events
- Improve `removeDuplicateEvents()` function
- Add more sophisticated matching (fuzzy matching)
- Consider event ID mapping across sources

### High Costs
- Reduce number of URLs scraped
- Cache scraped content
- Use free APIs more (Eventbrite, Meetup)
- Batch GPT-4 parsing requests


