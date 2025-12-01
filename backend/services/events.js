const axios = require('axios');

/**
 * OTHER EVENT SOURCES TO CONSIDER:
 *
 * APIs (Structured Data):
 * - Eventbrite API (already implemented)
 * - Meetup API (already implemented)
 * - Facebook Events API (requires app approval)
 * - Ticketmaster API
 * - StubHub API
 * - Bandsintown API (music events)
 * - Songkick API (concerts)
 * - Yelp Events API
 * - Google Places API (events)
 *
 * Web Scraping (via Firecrawl):
 * - Local event calendars (city websites, parks & rec)
 * - Community center websites
 * - University event calendars
 * - Library event pages
 * - Museum/venue websites
 * - Local news event listings
 * - Facebook Events (public pages)
 * - Nextdoor events
 * - Local Facebook groups
 *
 * Aggregators:
 * - AllEvents.in
 * - Eventful API
 * - Local event aggregators
 */

/**
 * Fetch real events from Eventbrite API
 * @param {string} zipcode - User's zipcode
 * @param {Array} categories - Interest categories
 * @param {number} radius - Search radius in miles
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchEventbriteEvents(zipcode, categories = [], radius = 25) {
  try {
    // Eventbrite API requires authentication
    // You'll need to get an API key from: https://www.eventbrite.com/platform/api/
    const apiKey = process.env.EVENTBRITE_API_KEY;

    if (!apiKey) {
      console.warn('EVENTBRITE_API_KEY not set, skipping Eventbrite events');
      return [];
    }

    // Convert zipcode to lat/lng (you'll need a geocoding service)
    // For now, using a placeholder - you'd use Google Maps Geocoding API or similar
    const location = await geocodeZipcode(zipcode);

    if (!location) {
      return [];
    }

    // Build category filters (Eventbrite category IDs)
    const categoryMap = {
      'Arts & Culture': '103',
      'Sports & Fitness': '108',
      'Food & Dining': '110',
      'Social & Entertainment': '105',
      'Learning & Development': '102',
      'Outdoor & Nature': '109',
      'Games & Hobbies': '119',
      'Volunteering & Community': '111',
      'Wellness & Mindfulness': '107',
      'Music & Performance': '103'
    };

    const categoryIds = categories
      .map(cat => categoryMap[cat])
      .filter(Boolean)
      .join(',');

    // Eventbrite API endpoint (v3) - no trailing slash
    const url = 'https://www.eventbriteapi.com/v3/events/search';
    const params = {
      'location.latitude': location.lat,
      'location.longitude': location.lng,
      'location.within': `${radius}mi`,
      'status': 'live',
      'order_by': 'start_asc',
      'start_date.range_start': new Date().toISOString(),
      'start_date.range_end': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Next 14 days
      'expand': 'venue,category'
    };

    // Add categories if provided
    if (categoryIds) {
      params.categories = categoryIds;
    }

    // Eventbrite supports both Bearer token and query parameter authentication
    // Try Bearer token first (preferred), fallback to query parameter if needed
    let response;
    try {
      response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });
    } catch (bearerError) {
      // If Bearer token fails, try query parameter method
      if (bearerError.response?.status === 401 || bearerError.response?.status === 403) {
        console.log('Bearer token auth failed, trying query parameter method...');
        params.token = apiKey;
        response = await axios.get(url, {
          params,
          timeout: 10000
        });
      } else {
        throw bearerError;
      }
    }

    const events = response.data.events || [];
    console.log(`Eventbrite found ${events.length} events`);
    return events;
  } catch (error) {
    // Better error logging to diagnose the issue
    if (process.env.EVENTBRITE_API_KEY) {
      if (error.response) {
        console.error('Eventbrite API error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });
      } else {
        console.error('Error fetching Eventbrite events:', error.message);
      }
    }
    return [];
  }
}

/**
 * Fetch events from Google Places API 2.0 (Text Search)
 * Uses activity-focused queries to find specific workshops, classes, leagues, events
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {Array} categories - Interest categories
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchGooglePlacesEvents(zipcode, city, state, categories = []) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      if (process.env.DEBUG_EVENTS === 'true') {
        console.log('GOOGLE_MAPS_API_KEY not set, skipping Google Places events');
      }
      return [];
    }

    console.log('Fetching Google Places API 2.0 events...');

    const location = await geocodeZipcode(zipcode);
    if (!location || !location.lat || !location.lng) {
      return [];
    }

    // Map categories to activity-focused queries and place types (Places API 2.0)
    const categoryQueryMap = {
      'Sports & Fitness': {
        queries: ['fitness classes', 'yoga classes', 'gym classes', 'sports leagues', 'workout classes'],
        types: ['gym', 'fitness_center', 'yoga_studio', 'sports_club']
      },
      'Arts & Culture': {
        queries: ['art classes', 'pottery workshops', 'painting classes', 'art workshops', 'craft classes'],
        types: ['art_school', 'art_studio', 'art_gallery', 'community_center']
      },
      'Food & Dining': {
        queries: ['cooking classes', 'culinary workshops', 'wine tasting events', 'cooking courses'],
        types: ['cooking_school', 'restaurant']
      },
      'Music & Entertainment': {
        queries: ['music classes', 'dance classes', 'live music events', 'concerts'],
        types: ['music_venue', 'night_club', 'performing_arts_theater']
      },
      'Outdoor & Nature': {
        queries: ['outdoor activities', 'hiking groups', 'nature workshops', 'outdoor classes'],
        types: ['park', 'campground']
      },
      'Learning & Education': {
        queries: ['educational workshops', 'learning classes', 'skill-building courses', 'training workshops'],
        types: ['school', 'university', 'training_center', 'library']
      },
      'Community & Volunteering': {
        queries: ['community events', 'volunteer opportunities', 'community workshops', 'networking events'],
        types: ['community_center', 'church', 'synagogue']
      },
      'Health & Wellness': {
        queries: ['wellness classes', 'meditation classes', 'health workshops', 'wellness events'],
        types: ['spa', 'gym', 'yoga_studio']
      },
      'Social & Networking': {
        queries: ['networking events', 'social meetups', 'networking workshops', 'social events'],
        types: ['community_center', 'restaurant', 'cafe']
      }
    };

    const events = [];
    const locationStr = `${city}, ${state}`;
    const radius = 8000; // 8km radius (5000 meters)

    // Build activity-focused queries for each category
    const searchQueries = [];
    const includedTypes = new Set();

    categories.forEach(category => {
      const mapping = categoryQueryMap[category];
      if (mapping) {
        // Add activity-focused queries
        mapping.queries.slice(0, 2).forEach(query => {
          searchQueries.push(`${query} ${locationStr}`);
        });
        // Collect place types
        mapping.types.forEach(type => includedTypes.add(type));
      }
    });

    // If no categories, use general activity queries
    if (searchQueries.length === 0) {
      searchQueries.push(`workshops ${locationStr}`);
      searchQueries.push(`classes ${locationStr}`);
      searchQueries.push(`events ${locationStr}`);
      includedTypes.add('community_center');
      includedTypes.add('school');
    }

    // Use Google Places API 2.0 Text Search
    const url = 'https://places.googleapis.com/v1/places:searchText';

    // Limit to 3 queries to manage API costs
    for (const textQuery of searchQueries.slice(0, 3)) {
      try {
        const requestBody = {
          textQuery: textQuery,
          maxResultCount: 10,
          locationBias: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng
              },
              radius: radius
            }
          }
        };

        // Add included types if we have them
        if (includedTypes.size > 0) {
          requestBody.includedTypes = Array.from(includedTypes).slice(0, 5);
        }

        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.rating,places.location'
          },
          timeout: 10000
        });

        if (response.data && response.data.places) {
          response.data.places.forEach(place => {
            // Filter to only include places that likely host activities
            // Check if place has activity indicators in name or types
            const name = place.displayName?.text || '';
            const types = place.types || [];
            const lowerName = name.toLowerCase();

            const activityIndicators = [
              'class', 'workshop', 'studio', 'school', 'center', 'club', 'academy',
              'training', 'learning', 'education'
            ];

            const hasActivityIndicator =
              activityIndicators.some(indicator => lowerName.includes(indicator)) ||
              types.some(type => ['art_school', 'yoga_studio', 'gym', 'community_center', 'school'].includes(type));

            if (hasActivityIndicator) {
              events.push({
                name: name,
                description: `Activities at ${name}`,
                location: place.formattedAddress || `${city}, ${state}`,
                url: place.websiteUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + locationStr)}`,
                source: 'Google Places API 2.0',
                startTime: null,
                venue: name,
                address: place.formattedAddress,
                category: categories[0] || 'General',
                rating: place.rating,
                types: types,
                coordinates: place.location ? {
                  lat: place.location.latitude,
                  lng: place.location.longitude
                } : null
              });
            }
          });
        }
      } catch (searchError) {
        // Log error but continue with other queries
        if (process.env.DEBUG_EVENTS === 'true') {
          console.warn(`Google Places API 2.0 search failed for "${textQuery}":`, searchError.message);
        }
        continue;
      }
    }

    console.log(`Google Places API 2.0 found ${events.length} activity venues`);
    return events;
  } catch (error) {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Error fetching Google Places API 2.0 events:', error.message);
    }
    return [];
  }
}

/**
 * Fetch events using Google Custom Search API (Fallback only)
 * Searches for events based on user interests and location
 * Only used when primary sources return < 5 events
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {Array} categories - Interest categories
 * @param {string} specificInterests - Specific interests text
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchGoogleSearchEvents(zipcode, city, state, categories = [], specificInterests = '') {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      // Silently skip if no API keys
      return [];
    }

    const location = await geocodeZipcode(zipcode);
    const locationStr = location ? `${city}, ${state}` : `${zipcode}`;

    // Build simple search queries (query-optimizer removed - using basic queries)
    const searchQueries = [];

    // Create simple activity queries for each category
    if (categories.length > 0) {
      categories.slice(0, 3).forEach(category => {
        // Simple query format: "[category] events [location]"
        searchQueries.push(`${category} events ${locationStr}`);
        searchQueries.push(`${category} meetup ${locationStr}`);
      });
    }

    // Add specific interests if provided
    if (specificInterests && specificInterests.trim().length > 0) {
      const interests = specificInterests.split(',').slice(0, 2);
      interests.forEach(interest => {
        const trimmed = interest.trim();
        // Build queries for each interest with different formats
        ['workshop', 'class', 'league'].forEach(format => {
          const query = buildActivityQuery(trimmed, format, {}, locationStr);
          const optimized = addActionVerbs(query);
          const withNegatives = addNegativeKeywords(optimized);
          searchQueries.push(withNegatives);
        });
      });
    }

    // If no specific queries, use PRD-based general activity queries
    if (searchQueries.length === 0) {
      searchQueries.push(`join upcoming workshops ${locationStr} registration`);
      searchQueries.push(`take classes ${locationStr} sign up`);
      searchQueries.push(`attend events ${locationStr} this week`);
    }

    const events = [];

    // Search multiple queries to find specific events
    for (const query of searchQueries.slice(0, 3)) {
      try {
        const url = 'https://www.googleapis.com/customsearch/v1';
        const params = {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: 5, // Limit results per query
          dateRestrict: 'd14' // Last 14 days
        };

        const response = await axios.get(url, { params, timeout: 5000 });

        if (response.data.items) {
          response.data.items.forEach(item => {
            // Filter out generic places - look for event indicators
            const title = item.title.toLowerCase();
            const snippet = item.snippet.toLowerCase();
            const link = item.link.toLowerCase();

            // Skip if it's clearly a generic place/organization
            const isGenericPlace =
              link.includes('wikipedia.org') ||
              link.includes('yelp.com/biz') ||
              (title.includes('about') && !title.includes('event')) ||
              (snippet.includes('about us') && !snippet.includes('event'));

            // Look for event indicators
            const hasEventIndicators =
              title.includes('event') ||
              title.includes('workshop') ||
              title.includes('class') ||
              title.includes('league') ||
              title.includes('meetup') ||
              title.includes('registration') ||
              title.includes('sign up') ||
              snippet.includes('register') ||
              snippet.includes('sign up') ||
              snippet.includes('starts') ||
              snippet.includes('begins') ||
              snippet.includes('date:') ||
              snippet.includes('time:') ||
              link.includes('eventbrite.com') ||
              link.includes('meetup.com') ||
              link.includes('event') ||
              link.includes('workshop') ||
              link.includes('class');

            // Only include if it looks like an event
            if (!isGenericPlace && hasEventIndicators) {
              // Try to extract date from snippet
              let startTime = null;
              const dateMatch = snippet.match(/(\w+day,?\s+)?(\w+\s+\d{1,2})|(\d{1,2}\/\d{1,2})|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i);
              if (dateMatch) {
                // Basic date parsing - could be improved
                try {
                  startTime = new Date(dateMatch[0]).toISOString();
                } catch (e) {
                  // Date parsing failed, leave as null
                }
              }

              events.push({
                name: item.title,
                description: item.snippet,
                url: item.link,
                source: 'Google Search',
                startTime: startTime,
                location: locationStr,
                category: categories[0] || 'General'
              });
            }
          });
        }
      } catch (queryError) {
        // Skip failed queries
        continue;
      }
    }

    return events;
  } catch (error) {
    // Only log if API keys are set
    if (process.env.GOOGLE_SEARCH_API_KEY) {
      console.error('Error fetching Google Search events:', error.message);
    }
    return [];
  }
}

/**
 * Geocode zipcode to lat/lng coordinates
 * @param {string} zipcode - Zipcode to geocode
 * @returns {Promise<Object>} {lat, lng} or null
 */
async function geocodeZipcode(zipcode) {
  try {
    // Option 1: Use Google Maps Geocoding API (requires API key)
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const response = await axios.get(url, {
        params: {
          address: zipcode,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        // Extract city and state from address components
        let city = '';
        let state = '';
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
        }

        return {
          lat: location.lat,
          lng: location.lng,
          city: city,
          state: state
        };
      }
    }

    // Option 2: Use OpenStreetMap Nominatim (free, rate-limited)
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const url = 'https://nominatim.openstreetmap.org/search';
        const response = await axios.get(url, {
          params: {
            postalcode: zipcode,
            country: 'US',
            format: 'json',
            limit: 1
          },
          headers: {
            'User-Agent': 'Empower-Social-App' // Required by Nominatim
          }
        });

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            city: result.address?.city || result.address?.town || '',
            state: result.address?.state || ''
          };
        }
      } catch (osmError) {
        console.warn('OpenStreetMap geocoding failed:', osmError.message);
      }
    }

    // Fallback: return null if no geocoding service works
    console.warn('No geocoding service configured or failed, using placeholder location');
    return null;
  } catch (error) {
    console.error('Error geocoding zipcode:', error.message);
    return null;
  }
}

/**
 * Filter and rank events based on user preferences
 * @param {Array} events - Raw events from APIs
 * @param {Object} userProfile - User profile data
 * @returns {Array} Filtered and ranked events
 */
function filterAndRankEvents(events, userProfile) {
  // Filter events based on:
  // - Distance (within travel radius)
  // - Time availability
  // - Interest categories
  // - Affinity groups (if applicable)

  // Rank events based on:
  // - Personality match
  // - Motivation alignment
  // - Interest relevance
  // - Social needs

  // This is a simplified version - you'd want more sophisticated ranking
  return events
    .filter(event => {
      // Basic filtering logic
      return true; // Placeholder
    })
    .slice(0, 20); // Return top 20 for GPT to choose from
}

/**
 * Fetch events using Firecrawl from websites
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name (from geocoding)
 * @param {string} state - State abbreviation
 * @param {Array} categories - Interest categories
 * @returns {Promise<Array>} Array of scraped events
 */
async function fetchFirecrawlEvents(zipcode, city, state, categories = []) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      console.warn('FIRECRAWL_API_KEY not set, skipping Firecrawl events');
      return [];
    }

    const events = [];

    // URLs to scrape for events (customize based on location)
    const citySlug = city.toLowerCase().replace(/\s+/g, '');
    const urlsToScrape = [
      // City/County event calendars
      `https://www.${citySlug}.gov/events`,
      `https://www.${citySlug}parksandrec.org/events`,

      // Community centers
      `https://www.${citySlug}communitycenter.org/calendar`,

      // Libraries
      `https://www.${citySlug}library.org/events`,

      // Universities
      `https://events.${citySlug}university.edu`,
      `https://www.${citySlug}university.edu/events`,

      // Museums
      `https://www.${citySlug}museum.org/events`,
      `https://www.${citySlug}artmuseum.org/calendar`,

      // Nextdoor (community events - public pages)
      `https://nextdoor.com/events/${citySlug}-${state.toLowerCase()}`,

      // Religious organizations (generic patterns)
      `https://www.${citySlug}church.org/events`,
      `https://www.${citySlug}temple.org/calendar`,

      // Nonprofits
      `https://www.${citySlug}nonprofit.org/events`,
      `https://www.${citySlug}volunteer.org/calendar`
    ];

    // Use Firecrawl to scrape each URL (limit to 4 URLs max for speed)
    // Prioritize: city.gov, parks&rec, libraries, universities
    const urlsToScrapeLimited = urlsToScrape.slice(0, 4);

    for (const url of urlsToScrapeLimited) {
      try {
        // Add timeout to each scrape (5 seconds max per URL)
        const scrapePromise = axios.post('https://api.firecrawl.dev/v1/scrape', {
          url: url,
          formats: ['markdown'],
          onlyMainContent: true
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout per URL
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scrape timeout')), 5000)
        );

        const response = await Promise.race([scrapePromise, timeoutPromise]);

        // Parse events from scraped content (async function) - skip GPT parsing for speed
        // Just return empty for now - GPT parsing is too slow
        // const scrapedEvents = await parseEventsFromScrapedContent(response.data, url, city);
        // events.push(...scrapedEvents);
        // Note: Firecrawl scraping works but parsing is disabled for performance
        // Events would need to be parsed from the scraped markdown content
        console.log(`Scraped ${url} (parsing disabled - would need GPT-4 to extract events)`);
      } catch (error) {
        // Only log if we have an API key and it's not a 404/500 (expected for many URLs)
        if (process.env.FIRECRAWL_API_KEY && !error.message.includes('404') && !error.message.includes('500')) {
          console.warn(`Failed to scrape ${url}:`, error.message);
        }
        // Continue with other URLs
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching Firecrawl events:', error.message);
    return [];
  }
}

/**
 * Parse events from Firecrawl scraped content using GPT-4
 * Uses GPT-4 to extract structured event data from scraped HTML/markdown
 */
async function parseEventsFromScrapedContent(scrapedData, sourceUrl, city) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set, cannot parse events from scraped content');
      return [];
    }

    // Get the markdown content from Firecrawl response
    const content = scrapedData.data?.markdown || scrapedData.markdown || '';

    if (!content || content.length < 100) {
      // Not enough content to parse
      return [];
    }

    // Use GPT-4 to extract events from the scraped content
    const prompt = `Extract all events from the following webpage content. Return a JSON array of events with this exact structure:

[
  {
    "name": "Event Name",
    "date": "YYYY-MM-DD or date string",
    "time": "HH:MM or time string",
    "location": "Venue name and address",
    "description": "Brief description",
    "url": "Event URL if available",
    "cost": "Free or price"
  }
]

Webpage content:
${content.substring(0, 8000)} // Limit to avoid token limits

Source URL: ${sourceUrl}
City: ${city}

Only extract actual events (not navigation, headers, footers). Return ONLY valid JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured event data from web content. Return only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000
      // Note: response_format json_object requires object, not array
      // So we'll parse the text response instead
    });

    const responseText = completion.choices[0].message.content;

    // Parse JSON response - GPT may return array or object
    let parsedEvents = [];
    try {
      // Try parsing as JSON first
      const jsonResponse = JSON.parse(responseText);

      // Handle different response formats
      if (Array.isArray(jsonResponse)) {
        parsedEvents = jsonResponse;
      } else if (jsonResponse.events && Array.isArray(jsonResponse.events)) {
        parsedEvents = jsonResponse.events;
      } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        parsedEvents = jsonResponse.data;
      }
    } catch (parseError) {
      // Try to extract JSON array from text if wrapped in markdown or other text
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          parsedEvents = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('Failed to parse extracted JSON:', e.message);
        }
      }
    }

    // Normalize parsed events to common format
    return parsedEvents.map(event => ({
      id: `firecrawl_${Date.now()}_${Math.random()}`,
      name: event.name || 'Untitled Event',
      description: event.description || '',
      startTime: event.date ? new Date(`${event.date} ${event.time || '12:00'}`).toISOString() : null,
      endTime: null,
      venue: event.location?.split(',')[0] || 'TBD',
      address: event.location || 'TBD',
      cost: event.cost || 'See website',
      url: event.url || sourceUrl,
      category: 'General',
      source: 'Firecrawl',
      imageUrl: null
    })).filter(event => event.name !== 'Untitled Event'); // Filter out invalid events

  } catch (error) {
    console.error('Error parsing events from scraped content:', error.message);
    return [];
  }
}

/**
 * Fetch events using Firecrawl with structured JSON extraction
 * Uses Firecrawl's JSON format to extract structured event data
 * @param {string} url - URL to scrape
 * @param {string} query - Search query for context
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} category - Event category hint
 * @returns {Promise<Array>} Array of extracted events
 */
async function fetchFirecrawlEventsStructured(url, query, city, state, category = '') {
  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

    if (!firecrawlApiKey) {
      return [];
    }

    // Define schema for event extraction
    const eventSchema = {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Event, club, class, workshop, league, or meetup name'
              },
              description: {
                type: 'string',
                description: 'Brief description of the activity'
              },
              date: {
                type: 'string',
                description: "Event date (e.g., 'Oct 7', 'Tomorrow', 'Every Saturday', 'TBD')"
              },
              time: {
                type: 'string',
                description: "Event time (e.g., '6:30 PM', '10:00 AM - 12:00 PM', 'TBD')"
              },
              location: {
                type: 'string',
                description: 'Event location, venue name, or address'
              },
              url: {
                type: 'string',
                description: 'Registration URL, event page URL, or website'
              },
              recurring: {
                type: 'boolean',
                description: 'Whether this is a recurring activity (club, class, league)'
              },
              cost: {
                type: 'string',
                description: "Cost (e.g., 'Free', '$20', '$50/month', 'See website')"
              }
            },
            required: ['name']
          }
        }
      },
      required: ['events']
    };

    // Build extraction prompt based on context
    let extractionPrompt = `Extract all events, clubs, classes, workshops, leagues, or meetups from this page. 
Focus on activities people can join or attend. Include:
- One-time events (workshops, concerts, special events, tournaments)
- Recurring activities (clubs, classes, regular meetups, leagues)
- Organizations that host activities

For each activity, extract: name, description, date, time, location, registration/website URL, whether it's recurring, and cost.
If information is not available, use "TBD" for dates/times and "See website" for cost.`;

    // Special handling for Reddit wiki pages
    if (url.includes('reddit.com') && url.includes('wiki')) {
      extractionPrompt = `This is a Reddit wiki page listing ${category || 'activities'} in ${city}. 
Extract all clubs, groups, organizations, or events mentioned.
Include: name, description, website/contact URL, meeting schedule if mentioned.
For recurring activities, set recurring: true.`;
    }

    console.log(`Firecrawl: Extracting structured events from ${url} using JSON schema`);

    const response = await axios.post(
      'https://api.firecrawl.dev/v2/scrape',
      {
        url: url,
        formats: [{
          type: 'json',
          schema: eventSchema,
          prompt: extractionPrompt
        }],
        only_main_content: true,
        maxAge: 86400000 // Cache for 24 hours (1 day)
      },
      {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for JSON extraction
      }
    );

    if (response.data && response.data.data && response.data.data.json) {
      const extracted = response.data.data.json;

      if (extracted.events && Array.isArray(extracted.events) && extracted.events.length > 0) {
        console.log(`Firecrawl: Extracted ${extracted.events.length} structured events from ${url}`);

        // Normalize to our event format
        const normalizedEvents = extracted.events.map(event => {
          // Parse date/time into ISO format if possible
          let startTime = null;
          if (event.date && event.date !== 'TBD') {
            try {
              // Try to parse common date formats
              const dateStr = `${event.date} ${event.time || '12:00'}`;
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                startTime = parsed.toISOString();
              }
            } catch (e) {
              // Date parsing failed, leave as null
            }
          }

          return {
            name: event.name || 'Untitled Event',
            description: event.description || '',
            url: event.url || url,
            source: 'Firecrawl (structured)',
            startTime: startTime,
            venue: event.location?.split(',')[0] || `${city}, ${state}`,
            address: event.location || `${city}, ${state}`,
            category: category || 'General',
            cost: event.cost || 'See website',
            recurring: event.recurring || false
          };
        }).filter(event => event.name !== 'Untitled Event' && event.name.length > 3);

        return normalizedEvents;
      } else {
        console.log(`Firecrawl: No events extracted from ${url} (empty array or invalid format)`);
        if (process.env.DEBUG_EVENTS === 'true' && extracted) {
          console.log('  Response structure:', JSON.stringify(extracted).substring(0, 300));
        }
      }
    } else {
      console.log(`Firecrawl: No JSON data in response from ${url}`);
      if (process.env.DEBUG_EVENTS === 'true' && response.data) {
        console.log('  Response keys:', Object.keys(response.data));
        if (response.data.data) {
          console.log('  Data keys:', Object.keys(response.data.data));
        }
      }
    }

    return [];
  } catch (error) {
    // Always log errors to help debug (even 404s and timeouts)
    const errorType = error.response?.status === 404 ? '404 Not Found' :
      error.code === 'ECONNABORTED' || error.message.includes('timeout') ? 'Timeout' :
        error.response?.status ? `HTTP ${error.response.status}` :
          error.message || 'Unknown error';

    console.log(`Firecrawl: Extraction failed for ${url} - ${errorType}`);

    if (process.env.DEBUG_EVENTS === 'true') {
      console.warn(`Firecrawl structured extraction failed for ${url}:`, error.message);
      if (error.response) {
        console.warn(`  Response status: ${error.response.status}`);
        console.warn('  Response data:', JSON.stringify(error.response.data).substring(0, 200));
      }
    }

    return [];
  }
}

/**
 * Fetch events from Facebook (public events via scraping)
 * Note: Facebook Events API requires app approval, so scraping public pages is an alternative
 */
async function fetchFacebookEvents(zipcode, city, categories = []) {
  try {
    // Option 1: Use Firecrawl to scrape Facebook public event pages
    // Option 2: Use Facebook Graph API (requires app approval)

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return [];
    }

    // Search Facebook for events in the area
    const searchUrl = `https://www.facebook.com/events/search/?q=${encodeURIComponent(city)}%20events`;

    // Use Firecrawl to scrape Facebook event listings
    // Note: Facebook may block scraping, so this might not work reliably

    return [];
  } catch (error) {
    console.error('Error fetching Facebook events:', error.message);
    return [];
  }
}

/**
 * Fetch events from local community sources
 * Uses Firecrawl to scrape various local event calendars
 */
async function fetchLocalCommunityEvents(zipcode, city, state) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return [];
    }

    const events = [];

    // Common local event sources to scrape (expanded list)
    const citySlug = city.toLowerCase().replace(/\s+/g, '');
    const localSources = [
      // Parks & Recreation
      `https://www.${citySlug}parksandrec.org/events`,

      // Community centers
      `https://www.${citySlug}communitycenter.com/calendar`,
      `https://www.${citySlug}communitycenter.org/events`,

      // Local news event listings
      `https://www.${citySlug}times.com/events`,
      `https://www.${citySlug}news.com/events`,

      // Chamber of Commerce
      `https://www.${citySlug}chamber.org/events`,
      `https://www.${citySlug}chamber.com/calendar`,

      // Nextdoor events
      `https://nextdoor.com/events/${citySlug}-${state.toLowerCase()}`,

      // University calendars
      `https://events.${citySlug}university.edu`,
      `https://calendar.${citySlug}university.edu`,

      // Museum events
      `https://www.${citySlug}museum.org/events`,
      `https://www.${citySlug}artmuseum.org/calendar`,

      // Religious organizations
      `https://www.${citySlug}church.org/events`,
      `https://www.${citySlug}temple.org/calendar`,

      // Nonprofit calendars
      `https://www.${citySlug}nonprofit.org/events`,
      `https://www.${citySlug}volunteer.org/calendar`
    ];

    // Limit to 4 URLs for speed (prioritize most common sources)
    const localSourcesLimited = localSources.slice(0, 4);

    for (const url of localSourcesLimited) {
      try {
        // Add timeout (5 seconds max per URL)
        const scrapePromise = axios.post('https://api.firecrawl.dev/v1/scrape', {
          url: url,
          formats: ['markdown'],
          onlyMainContent: true
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scrape timeout')), 5000)
        );

        const response = await Promise.race([scrapePromise, timeoutPromise]);

        // Skip GPT parsing for speed - it's too slow
        // const parsed = await parseEventsFromScrapedContent(response.data, url, city);
        // events.push(...parsed);
        console.log(`Scraped ${url} (parsing skipped for speed)`);
      } catch (error) {
        // Skip failed URLs
        continue;
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching local community events:', error.message);
    return [];
  }
}

/**
 * Fetch real events from multiple sources
 * @param {Object} userProfile - User profile with preferences
 * @returns {Promise<Array>} Combined array of real events
 */
async function fetchRealEvents(userProfile) {
  const { zipcode, interests, preferences, affinityGroups } = userProfile;
  const categories = interests?.categories || [];

  // Get city/state from zipcode for better searching
  const location = await geocodeZipcode(zipcode);
  const city = location?.city || 'Charlottesville'; // Fallback
  const state = location?.state || 'VA'; // Fallback

  // Fetch from multiple sources in parallel
  console.log('=== Fetching events from all sources ===');
  console.log('Location:', { zipcode, city, state });
  console.log('Categories:', categories);

  const specificInterests = userProfile.interests?.specific || '';

  // Fetch from primary sources (structured APIs and Firecrawl)
  const [
    eventbriteEvents,
    googlePlacesEvents,
    firecrawlEvents,
    localEvents
  ] = await Promise.all([
    fetchEventbriteEvents(zipcode, categories, 25),
    fetchGooglePlacesEvents(zipcode, city, state, categories),
    fetchFirecrawlEvents(zipcode, city, state, categories),
    fetchLocalCommunityEvents(zipcode, city, state)
  ]);

  // Combine and normalize event format from primary sources
  let allEvents = [
    ...normalizeEventbriteEvents(eventbriteEvents),
    ...googlePlacesEvents, // Google Places events are already in normalized format
    ...firecrawlEvents,
    ...localEvents
  ];

  // Only use Google Custom Search as fallback if we have < 5 events
  if (allEvents.length < 5) {
    console.log(`Only ${allEvents.length} events from primary sources, using Google Search as fallback...`);
    try {
      const googleSearchEvents = await fetchGoogleSearchEvents(zipcode, city, state, categories, specificInterests);
      allEvents = [...allEvents, ...googleSearchEvents];
    } catch (searchError) {
      // Continue without Google Search if it fails
      console.warn('Google Search fallback failed:', searchError.message);
    }
  }

  // Only log event counts if we have some events or if debugging
  if (allEvents.length > 0 || process.env.DEBUG_EVENTS === 'true') {
    console.log('Event counts by source:');
    console.log(`  Eventbrite: ${eventbriteEvents.length} raw events`);
    console.log(`  Google Places: ${googlePlacesEvents.length} events`);
    console.log(`  Firecrawl: ${firecrawlEvents.length} events`);
    console.log(`  Local Community: ${localEvents.length} events`);
    console.log(`Total events after normalization: ${allEvents.length}`);
  }

  // Remove duplicates (by name + date)
  const uniqueEvents = removeDuplicateEvents(allEvents);

  // Filter events to only those within 14 days
  const now = new Date();
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const eventsWithin14Days = uniqueEvents.filter(event => {
    if (!event.startTime) {return false;} // Exclude events without dates
    const eventDate = new Date(event.startTime);
    return eventDate >= now && eventDate <= fourteenDaysFromNow;
  });

  // Only log if we have events or debugging is enabled
  if (eventsWithin14Days.length > 0 || process.env.DEBUG_EVENTS === 'true') {
    console.log(`Events within 14 days: ${eventsWithin14Days.length} (filtered from ${uniqueEvents.length})`);
  }

  // Filter and rank based on user preferences
  return filterAndRankEvents(eventsWithin14Days, userProfile);
}

/**
 * Normalize Eventbrite events to common format
 */
function normalizeEventbriteEvents(events) {
  return events.map(event => ({
    id: event.id,
    name: event.name?.text || event.name,
    description: event.description?.text || event.description,
    startTime: event.start?.local || event.start?.utc,
    endTime: event.end?.local || event.end?.utc,
    venue: event.venue?.name || 'TBD',
    address: formatAddress(event.venue),
    cost: event.is_free ? 'Free' : `$${event.ticket_availability?.minimum_ticket_price?.display || 'See website'}`,
    url: event.url,
    category: event.category?.name,
    source: 'Eventbrite',
    imageUrl: event.logo?.url
  }));
}


/**
 * Format address from venue object
 */
function formatAddress(venue) {
  if (!venue) {return 'TBD';}

  const parts = [
    venue.address?.address_1,
    venue.address?.city,
    venue.address?.state,
    venue.address?.postal_code
  ].filter(Boolean);

  return parts.join(', ') || venue.name || 'TBD';
}

/**
 * Remove duplicate events (same name + similar date)
 */
function removeDuplicateEvents(events) {
  const seen = new Map();
  const unique = [];

  for (const event of events) {
    const key = `${event.name?.toLowerCase()}_${event.startTime?.substring(0, 10)}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(event);
    }
  }

  return unique;
}

/**
 * Fetch events from Google Custom Search using a direct query
 * Optimized for concept-based queries from the v2 recommendation system
 * @param {string} query - Direct search query
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} category - Event category hint
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchGoogleSearchEventsByQuery(query, zipcode, city, state, category = '') {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return [];
    }

    const locationStr = `${city}, ${state}`;

    // Enhance query with location if not already included
    let enhancedQuery = query;
    if (!query.toLowerCase().includes(city.toLowerCase()) && !query.toLowerCase().includes(state.toLowerCase())) {
      enhancedQuery = `${query} ${locationStr}`;
    }

    // Add "upcoming" or "future" to prioritize future events
    const futureTerms = ['upcoming', 'future', 'this week', 'next week', 'this month', 'next month'];
    const hasFutureTerm = futureTerms.some(term => query.toLowerCase().includes(term));
    if (!hasFutureTerm) {
      enhancedQuery = `upcoming ${enhancedQuery}`;
    }

    // Add event-specific terms to improve results
    const eventTerms = ['registration', 'sign up', 'register', 'event', 'workshop', 'class', 'meetup'];
    const hasEventTerm = eventTerms.some(term => query.toLowerCase().includes(term));
    if (!hasEventTerm) {
      // Add a generic event term if missing
      enhancedQuery = `${enhancedQuery} event registration`;
    }

    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: apiKey,
      cx: searchEngineId,
      q: enhancedQuery,
      num: 10, // Increased from 5 to get more results
      // Note: dateRestrict filters by page update date, not event date
      // We rely on date extraction and filtering instead
      safe: 'active'
    };

    const response = await axios.get(url, { params, timeout: 8000 });
    const events = [];

    if (response.data.items) {
      response.data.items.forEach(item => {
        const title = item.title.toLowerCase();
        const snippet = item.snippet || '';
        const snippetLower = snippet.toLowerCase();
        const link = item.link.toLowerCase();

        // Enhanced filtering - skip generic places and non-events
        const isGenericPlace =
          link.includes('wikipedia.org') ||
          link.includes('yelp.com/biz') ||
          link.includes('yellowpages.com') ||
          (title.includes('about') && !title.includes('event') && !title.includes('class')) ||
          (snippetLower.includes('about us') && !snippetLower.includes('event') && !snippetLower.includes('class'));

        // Enhanced event indicators
        const hasEventIndicators =
          title.includes('event') ||
          title.includes('workshop') ||
          title.includes('class') ||
          title.includes('league') ||
          title.includes('meetup') ||
          title.includes('registration') ||
          title.includes('sign up') ||
          title.includes('enroll') ||
          title.includes('join') ||
          snippetLower.includes('register') ||
          snippetLower.includes('sign up') ||
          snippetLower.includes('enroll') ||
          snippetLower.includes('starts') ||
          snippetLower.includes('begins') ||
          snippetLower.includes('date:') ||
          snippetLower.includes('time:') ||
          snippetLower.includes('when:') ||
          snippetLower.includes('upcoming') ||
          link.includes('eventbrite.com') ||
          link.includes('meetup.com') ||
          link.includes('event') ||
          link.includes('workshop') ||
          link.includes('class') ||
          link.includes('registration');

        if (!isGenericPlace && hasEventIndicators) {
          // Improved date extraction with better year inference
          let startTime = null;
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          const datePatterns = [
            /(\w+day,?\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i, // "Saturday, November 15, 2024"
            /(\w+day,?\s+)?(\w+\s+\d{1,2})/i, // "Saturday, November 15"
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/i, // "11/15/2024"
            /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i, // "November 15, 2024"
            /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i, // "November 15"
            /(today|tomorrow|this week|next week|this weekend)/i
          ];

          for (const pattern of datePatterns) {
            const match = snippet.match(pattern) || title.match(pattern);
            if (match) {
              try {
                let dateStr = match[0];

                // Handle relative dates
                if (/today/i.test(dateStr)) {
                  dateStr = new Date().toDateString();
                } else if (/tomorrow/i.test(dateStr)) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  dateStr = tomorrow.toDateString();
                } else if (/this weekend/i.test(dateStr)) {
                  const saturday = new Date();
                  saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));
                  dateStr = saturday.toDateString();
                } else if (/next week/i.test(dateStr)) {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  dateStr = nextWeek.toDateString();
                } else {
                  // For dates without year, infer the year
                  // If month/day has already passed this year, assume next year
                  if (!/\d{4}/.test(dateStr)) {
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthMatch = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
                    const dayMatch = dateStr.match(/\b(\d{1,2})\b/);

                    if (monthMatch && dayMatch) {
                      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthMatch[1].toLowerCase());
                      const day = parseInt(dayMatch[1]);

                      // Create date for this year
                      let testDate = new Date(currentYear, monthIndex, day);

                      // If date has passed this year, use next year
                      if (testDate < now) {
                        testDate = new Date(currentYear + 1, monthIndex, day);
                      }

                      dateStr = testDate.toDateString();
                    }
                  }
                }

                const parsed = new Date(dateStr);

                // Only accept dates that are in the future and within the next 60 days
                const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
                if (!isNaN(parsed.getTime()) && parsed > now && parsed <= sixtyDaysFromNow) {
                  startTime = parsed.toISOString();
                  break;
                }
              } catch (e) {
                // Continue to next pattern
              }
            }
          }

          // Extract time if available
          const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i;
          const timeMatch = snippet.match(timePattern);

          events.push({
            name: item.title,
            description: snippet.substring(0, 300), // Limit description length
            url: item.link,
            source: 'Google Search',
            startTime: startTime,
            location: locationStr,
            venue: extractVenueName(item.title, snippet) || locationStr,
            address: locationStr,
            category: category || 'General',
            cost: extractCost(snippet) || 'See website'
          });
        }
      });
    }

    return events;
  } catch (error) {
    if (process.env.DEBUG_EVENTS === 'true') {
      console.warn(`Google Search query failed for "${query}":`, error.message);
    }
    return [];
  }
}

/**
 * Extract venue name from title or snippet
 */
function extractVenueName(title, snippet) {
  // Look for common venue patterns
  const venuePatterns = [
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/, // "at Golden Gate Park"
    /@\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/, // "@ Golden Gate Park"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+in\s+/ // "Golden Gate Park in"
  ];

  for (const pattern of venuePatterns) {
    const match = (title + ' ' + snippet).match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract cost information from snippet
 */
function extractCost(snippet) {
  const costPatterns = [
    /\$(\d+)/, // "$20"
    /free/i, // "Free"
    /(\d+)\s*dollars?/i, // "20 dollars"
    /(\d+)\s*USD/i // "20 USD"
  ];

  for (const pattern of costPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes('free')) {
        return 'Free';
      }
      return `$${match[1] || match[0]}`;
    }
  }

  return null;
}

/**
 * Fetch events from Google Places API 2.0 using a direct query
 * Optimized for concept-based queries from the v2 recommendation system
 * @param {string} query - Direct search query
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} category - Event category hint
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchGooglePlacesEventsByQuery(query, zipcode, city, state, category = '') {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return [];
    }

    const location = await geocodeZipcode(zipcode);
    if (!location || !location.lat || !location.lng) {
      return [];
    }

    // Build text query from the concept query
    // Extract key activity terms and add location
    const locationStr = `${city}, ${state}`;
    let textQuery = query;

    // Remove negative keywords and location if already in query
    const negativeKeywords = ['-supplies', '-store', '-shop', '-gallery', '-equipment', '-retail'];
    negativeKeywords.forEach(keyword => {
      textQuery = textQuery.replace(new RegExp(keyword, 'gi'), '');
    });

    // Ensure location is included
    if (!textQuery.toLowerCase().includes(city.toLowerCase())) {
      textQuery = `${textQuery} ${locationStr}`;
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const requestBody = {
      textQuery: textQuery,
      maxResultCount: 10, // Increased from default
      locationBias: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: 10000 // 10km radius
        }
      }
    };

    // Add relevant place types based on category
    const categoryTypeMap = {
      'Sports & Fitness': ['gym', 'fitness_center', 'yoga_studio', 'sports_club'],
      'Arts & Culture': ['art_school', 'art_studio', 'art_gallery', 'community_center'],
      'Food & Dining': ['cooking_school', 'restaurant'],
      'Music & Entertainment': ['music_venue', 'night_club', 'performing_arts_theater'],
      'Outdoor & Nature': ['park', 'campground'],
      'Learning & Education': ['school', 'university', 'training_center', 'library'],
      'Community & Volunteering': ['community_center', 'church', 'synagogue'],
      'Health & Wellness': ['spa', 'gym', 'yoga_studio'],
      'Social & Networking': ['community_center', 'restaurant', 'cafe']
    };

    if (category && categoryTypeMap[category]) {
      requestBody.includedTypes = categoryTypeMap[category].slice(0, 5);
    }

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.rating,places.location,places.businessStatus'
      },
      timeout: 10000
    });

    const events = [];

    if (response.data && response.data.places) {
      response.data.places.forEach(place => {
        const name = place.displayName?.text || '';
        const types = place.types || [];
        const lowerName = name.toLowerCase();

        // Enhanced activity indicators
        const activityIndicators = [
          'class', 'workshop', 'studio', 'school', 'center', 'club', 'academy',
          'training', 'learning', 'education', 'gym', 'fitness', 'yoga',
          'meetup', 'group', 'league', 'team'
        ];

        const hasActivityIndicator =
          activityIndicators.some(indicator => lowerName.includes(indicator)) ||
          types.some(type => [
            'art_school', 'yoga_studio', 'gym', 'community_center', 'school',
            'fitness_center', 'sports_club', 'training_center', 'cooking_school'
          ].includes(type));

        // Only include places that are open and have activity indicators
        const isOpen = place.businessStatus !== 'CLOSED_PERMANENTLY';

        if (hasActivityIndicator && isOpen) {
          events.push({
            name: name,
            description: `Activities and events at ${name}`,
            location: place.formattedAddress || `${city}, ${state}`,
            url: place.websiteUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + locationStr)}`,
            source: 'Google Places API 2.0',
            startTime: null, // Places API doesn't provide event dates
            venue: name,
            address: place.formattedAddress || `${city}, ${state}`,
            category: category || 'General',
            rating: place.rating,
            types: types,
            coordinates: place.location ? {
              lat: place.location.latitude,
              lng: place.location.longitude
            } : null,
            cost: 'See website' // Places API doesn't provide cost info
          });
        }
      });
    }

    return events;
  } catch (error) {
    if (process.env.DEBUG_EVENTS === 'true') {
      console.warn(`Google Places query failed for "${query}":`, error.message);
    }
    return [];
  }
}

/**
 * Search for events using custom search queries (for concept matching)
 * @param {Array} searchQueries - Array of search query strings
 * @param {string} zipcode - User's zipcode
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} category - Event category hint
 * @returns {Promise<Array>} Array of event objects
 */
async function searchEventsByQueries(searchQueries, zipcode, city, state, category = '') {
  const events = [];
  const isTestMode = process.env.TEST_MODE === 'true';

  // In test mode, limit to 1 query per concept for speed
  // Otherwise limit to 3 queries per concept to avoid excessive API calls
  const limitedQueries = isTestMode ? searchQueries.slice(0, 1) : searchQueries.slice(0, 3);

  for (const query of limitedQueries) {
    try {
      // Use Google Custom Search as primary source (most reliable for finding events)
      if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
        const googleEvents = await fetchGoogleSearchEventsByQuery(query, zipcode, city, state, category);
        if (googleEvents.length > 0) {
          events.push(...googleEvents);
          console.log(`Google Search: Found ${googleEvents.length} events for query "${query.substring(0, 50)}"`);
        }
      }

      // Also use Google Places API 2.0 for activity venues
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const placesEvents = await fetchGooglePlacesEventsByQuery(query, zipcode, city, state, category);
        if (placesEvents.length > 0) {
          events.push(...placesEvents);
          console.log(`Google Places: Found ${placesEvents.length} venues for query "${query.substring(0, 50)}"`);
        }
      }

      // Note: Eventbrite API v3 doesn't have a public /events/search endpoint
      // The search endpoint requires OAuth 2.0 or organization-specific access
      // For now, we'll skip Eventbrite search and rely on Google Custom Search
      // TODO: Implement OAuth 2.0 flow for Eventbrite if search is needed
      if (false && process.env.EVENTBRITE_API_KEY && category) {
        try {
          const location = await geocodeZipcode(zipcode);
          if (location) {
            // Extract activity-focused keywords from query (PRD pattern)
            // Remove location, stop words, and negative keywords
            const stopWords = ['in', 'at', 'the', 'a', 'an', 'for', 'to', 'of', 'and', 'or',
              'join', 'learn', 'take', 'attend', 'participate', 'enroll',
              city, state, zipcode, 'registration', 'sign', 'up'];
            const negativeWords = ['supplies', 'store', 'shop', 'gallery', 'equipment', 'retail'];

            const queryKeywords = query.toLowerCase()
              .split(/\s+/)
              .filter(word => {
                return word.length > 2 &&
                       !stopWords.includes(word) &&
                       !negativeWords.includes(word) &&
                       !word.startsWith('-');
              })
              .slice(0, 4) // Get more keywords for better matching
              .join(' ');

            if (queryKeywords.length > 0) {
              const eventbriteUrl = 'https://www.eventbriteapi.com/v3/events/search'; // No trailing slash
              const eventbriteParams = {
                'location.latitude': location.lat,
                'location.longitude': location.lng,
                'location.within': '25mi',
                'q': queryKeywords,
                'status': 'live',
                'order_by': 'start_asc',
                'start_date.range_start': new Date().toISOString(),
                'start_date.range_end': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                'expand': 'venue,category'
              };

              // Try Bearer token first, fallback to query parameter
              let eventbriteResponse;
              try {
                eventbriteResponse = await axios.get(eventbriteUrl, {
                  params: eventbriteParams,
                  headers: {
                    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`
                  },
                  timeout: 10000
                });
              } catch (bearerError) {
                // If Bearer token fails with 401/403, try query parameter method
                // If it's a 404, the endpoint might be wrong or query invalid
                if (bearerError.response?.status === 401 || bearerError.response?.status === 403) {
                  console.log('Eventbrite Bearer token auth failed, trying query parameter method...');
                  eventbriteParams.token = process.env.EVENTBRITE_API_KEY;
                  delete eventbriteParams.q; // Remove q param when using token in query
                  eventbriteResponse = await axios.get(eventbriteUrl, {
                    params: {
                      ...eventbriteParams,
                      q: queryKeywords // Add q back
                    },
                    timeout: 10000
                  });
                } else if (bearerError.response?.status === 404) {
                  // 404 might mean invalid endpoint or query - try without 'q' parameter
                  console.log(`Eventbrite 404 for query "${queryKeywords}", trying without 'q' parameter...`);
                  const paramsWithoutQ = { ...eventbriteParams };
                  delete paramsWithoutQ.q;
                  try {
                    eventbriteResponse = await axios.get(eventbriteUrl, {
                      params: {
                        ...paramsWithoutQ,
                        token: process.env.EVENTBRITE_API_KEY
                      },
                      timeout: 10000
                    });
                  } catch (fallbackError) {
                    // If that also fails, try with just location and category
                    console.log('Eventbrite search with location only...');
                    throw fallbackError; // Will be caught by outer catch
                  }
                } else {
                  throw bearerError;
                }
              }

              if (eventbriteResponse && eventbriteResponse.data && eventbriteResponse.data.events) {
                const eventbriteEvents = normalizeEventbriteEvents(eventbriteResponse.data.events);
                console.log(`Eventbrite found ${eventbriteEvents.length} events for query "${queryKeywords}"`);
                events.push(...eventbriteEvents);
              } else if (eventbriteResponse && eventbriteResponse.data) {
                console.log('Eventbrite response received but no events in data:', Object.keys(eventbriteResponse.data));
              }
            } else {
              console.log(`Skipping Eventbrite search - query keywords empty after filtering: "${query}"`);
            }
          }
        } catch (eventbriteError) {
          // Eventbrite search failed, continue with other sources
          const errorDetails = eventbriteError.response
            ? `Status: ${eventbriteError.response.status}, Data: ${JSON.stringify(eventbriteError.response.data).substring(0, 200)}`
            : eventbriteError.message;
          console.warn(`Eventbrite search failed for query "${query}": ${errorDetails}`);
        }
      }

      // Use Firecrawl with structured JSON extraction
      // Firecrawl targets event calendars directly (city sites, community centers, libraries, Reddit wikis)
      if (process.env.FIRECRAWL_API_KEY && city && state) {
        try {
          const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
          const citySlug = city.toLowerCase().replace(/\s+/g, '');
          const locationStr = `${city}, ${state}`;

          // Build activity-focused URLs following PRD patterns
          // Prioritize URLs that are more likely to allow scraping (Meetup, then city sites)
          // Use simpler URLs (base pages or simple search formats)
          const activityUrlPatterns = [
            // Meetup with activity keywords (public search results - most reliable for scraping)
            `https://www.meetup.com/find/?keywords=${encodeURIComponent(query.split(' ').slice(0, 3).join(' '))}&location=${citySlug}-${state.toLowerCase()}`,

            // Eventbrite location browse (simpler format - just location, no query in path)
            `https://www.eventbrite.com/d/${state.toLowerCase()}--${citySlug}/`,

            // City event calendars (simplified URLs - base pages without query params)
            `https://www.${citySlug}.gov/events`,
            `https://www.${citySlug}parksandrec.org/events`,

            // Libraries with event calendars (base pages)
            `https://www.${citySlug}library.org/events`,

            // Community centers with activity pages
            `https://www.${citySlug}communitycenter.org/classes`,
            `https://www.${citySlug}communitycenter.org/workshops`,

            // Reddit wiki pages (community-curated, but often blocks scraping - try last)
            `https://www.reddit.com/r/${citySlug}/wiki/events`,
            `https://www.reddit.com/r/${citySlug}/wiki/clubs`
          ];

          // Use structured JSON extraction (limit to 1-2 URLs per query in test mode)
          const urlsToTry = isTestMode ? activityUrlPatterns.slice(0, 1) : activityUrlPatterns.slice(0, 2);
          console.log(`Firecrawl: Attempting structured extraction from ${urlsToTry.length} URLs for query "${query}"`);

          for (const url of urlsToTry) {
            try {
              const extractedEvents = await fetchFirecrawlEventsStructured(
                url,
                query,
                city,
                state,
                category
              );

              if (extractedEvents.length > 0) {
                events.push(...extractedEvents);
                console.log(`Firecrawl: Added ${extractedEvents.length} events from ${url}`);
              }
            } catch (firecrawlError) {
              // Skip failed Firecrawl attempts (404s are common for many URLs)
              if (process.env.DEBUG_EVENTS === 'true' && !firecrawlError.message.includes('404')) {
                console.warn(`Firecrawl structured extraction failed for ${url}:`, firecrawlError.message);
              }
              continue;
            }
          }
        } catch (firecrawlError) {
          // Continue with other search methods
          if (process.env.DEBUG_EVENTS === 'true') {
            console.warn(`Firecrawl search failed for query "${query}":`, firecrawlError.message);
          }
        }
      }
    } catch (queryError) {
      // Continue with next query if one fails
      console.warn(`Error searching with query "${query}":`, queryError.message);
      continue;
    }
  }

  // Filter out past events and events without valid future dates
  const now = new Date();
  const futureEvents = events.filter(event => {
    if (!event.startTime) {
      // For events without dates, only accept if from known event platforms
      // These platforms typically only show upcoming events
      const trustedPlatforms = ['eventbrite.com', 'meetup.com', 'facebook.com/events'];
      const url = (event.url || '').toLowerCase();
      const isFromTrustedPlatform = trustedPlatforms.some(platform => url.includes(platform));

      if (isFromTrustedPlatform) {
        // Accept events from trusted platforms even without dates
        // They're likely upcoming events
        return true;
      }

      // For other sources, exclude events without dates to avoid past events
      return false;
    }

    try {
      const eventDate = new Date(event.startTime);
      // Only include events in the future (at least 1 hour from now to account for timezone issues)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      return eventDate >= oneHourFromNow;
    } catch (e) {
      // Invalid date, exclude
      return false;
    }
  });

  if (futureEvents.length < events.length) {
    console.log(`Filtered out ${events.length - futureEvents.length} past/invalid events from search results`);
  }

  // Remove duplicates and return
  return removeDuplicateEvents(futureEvents);
}

module.exports = {
  fetchRealEvents,
  fetchEventbriteEvents,
  fetchGooglePlacesEvents,
  fetchGooglePlacesEventsByQuery,
  fetchGoogleSearchEvents,
  fetchGoogleSearchEventsByQuery,
  fetchFirecrawlEvents,
  fetchFirecrawlEventsStructured,
  fetchLocalCommunityEvents,
  geocodeZipcode,
  searchEventsByQueries
};

