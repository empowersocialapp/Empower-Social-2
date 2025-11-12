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

    // Eventbrite API endpoint
    const url = 'https://www.eventbriteapi.com/v3/events/search/';
    const params = {
      'location.latitude': location.lat,
      'location.longitude': location.lng,
      'location.within': `${radius}mi`,
      'categories': categoryIds || undefined,
      'status': 'live',
      'order_by': 'start_asc',
      'start_date.range_start': new Date().toISOString(),
      'start_date.range_end': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Next 14 days
      'expand': 'venue,category'
    };

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data.events || [];
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error.message);
    return [];
  }
}

/**
 * Fetch real events from Meetup API
 * @param {string} zipcode - User's zipcode
 * @param {Array} categories - Interest categories
 * @param {number} radius - Search radius in miles
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchMeetupEvents(zipcode, categories = [], radius = 25) {
  try {
    const apiKey = process.env.MEETUP_API_KEY;
    
    if (!apiKey) {
      console.warn('MEETUP_API_KEY not set, skipping Meetup events');
      return [];
    }

    const location = await geocodeZipcode(zipcode);
    if (!location) {
      return [];
    }

    // Meetup category mapping
    const categoryMap = {
      'Arts & Culture': '1',
      'Sports & Fitness': '2',
      'Food & Dining': '9',
      'Social & Entertainment': '10',
      'Learning & Development': '4',
      'Outdoor & Nature': '2',
      'Games & Hobbies': '11',
      'Volunteering & Community': '13',
      'Wellness & Mindfulness': '14',
      'Music & Performance': '1'
    };

    const categoryIds = categories
      .map(cat => categoryMap[cat])
      .filter(Boolean)
      .join(',');

    const url = 'https://api.meetup.com/find/upcoming_events';
    const params = {
      lat: location.lat,
      lon: location.lng,
      radius: radius,
      category: categoryIds || undefined,
      page: 20
    };

    const response = await axios.get(url, {
      params: {
        ...params,
        key: apiKey
      }
    });

    return response.data.events || [];
  } catch (error) {
    console.error('Error fetching Meetup events:', error.message);
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
 * @param {Array} categories - Interest categories
 * @returns {Promise<Array>} Array of scraped events
 */
async function fetchFirecrawlEvents(zipcode, city, categories = []) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!apiKey) {
      console.warn('FIRECRAWL_API_KEY not set, skipping Firecrawl events');
      return [];
    }

    const events = [];
    
    // URLs to scrape for events (customize based on location)
    const urlsToScrape = [
      // City/County event calendars
      `https://www.${city.toLowerCase().replace(' ', '')}.gov/events`,
      `https://www.${city.toLowerCase().replace(' ', '')}parksandrec.org/events`,
      
      // Community centers
      `https://www.${city.toLowerCase().replace(' ', '')}communitycenter.org/calendar`,
      
      // Libraries
      `https://www.${city.toLowerCase().replace(' ', '')}library.org/events`,
      
      // Universities (if applicable)
      // `https://events.${city.toLowerCase().replace(' ', '')}university.edu`,
    ];

    // Use Firecrawl to scrape each URL (limit to 2 URLs max for speed)
    const urlsToScrapeLimited = urlsToScrape.slice(0, 2); // Only scrape first 2 URLs to save time
    
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
        console.log(`Scraped ${url} (parsing skipped for speed)`);
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error.message);
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
      max_tokens: 2000,
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
    
    // Common local event sources to scrape
    const localSources = [
      // Parks & Recreation
      `https://www.${city.toLowerCase().replace(/\s+/g, '')}parksandrec.org/events`,
      
      // Community centers
      `https://www.${city.toLowerCase().replace(/\s+/g, '')}communitycenter.com/calendar`,
      
      // Local news event listings
      `https://www.${city.toLowerCase().replace(/\s+/g, '')}times.com/events`,
      
      // Chamber of Commerce
      `https://www.${city.toLowerCase().replace(/\s+/g, '')}chamber.org/events`,
    ];

    // Limit to 2 URLs for speed
    const localSourcesLimited = localSources.slice(0, 2);
    
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
  
  const [
    eventbriteEvents, 
    meetupEvents, 
    firecrawlEvents,
    localEvents
  ] = await Promise.all([
    fetchEventbriteEvents(zipcode, categories, 25),
    fetchMeetupEvents(zipcode, categories, 25),
    fetchFirecrawlEvents(zipcode, city, categories),
    fetchLocalCommunityEvents(zipcode, city, state)
  ]);

  console.log('Event counts by source:');
  console.log(`  Eventbrite: ${eventbriteEvents.length} raw events`);
  console.log(`  Meetup: ${meetupEvents.length} raw events`);
  console.log(`  Firecrawl: ${firecrawlEvents.length} events`);
  console.log(`  Local Community: ${localEvents.length} events`);

  // Combine and normalize event format
  const allEvents = [
    ...normalizeEventbriteEvents(eventbriteEvents),
    ...normalizeMeetupEvents(meetupEvents),
    ...firecrawlEvents,
    ...localEvents
  ];
  
  console.log(`Total events after normalization: ${allEvents.length}`);

  // Remove duplicates (by name + date)
  const uniqueEvents = removeDuplicateEvents(allEvents);

  // Filter events to only those within 14 days
  const now = new Date();
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const eventsWithin14Days = uniqueEvents.filter(event => {
    if (!event.startTime) return false; // Exclude events without dates
    const eventDate = new Date(event.startTime);
    return eventDate >= now && eventDate <= fourteenDaysFromNow;
  });
  
  console.log(`Events within 14 days: ${eventsWithin14Days.length} (filtered from ${uniqueEvents.length})`);

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
 * Normalize Meetup events to common format
 */
function normalizeMeetupEvents(events) {
  return events.map(event => ({
    id: event.id,
    name: event.name,
    description: event.description,
    startTime: new Date(event.time + (event.utc_offset || 0)).toISOString(),
    endTime: event.duration ? new Date(event.time + event.duration + (event.utc_offset || 0)).toISOString() : null,
    venue: event.venue?.name || 'TBD',
    address: formatAddress(event.venue),
    cost: event.fee?.amount ? `$${event.fee.amount}` : 'Free',
    url: event.link,
    category: event.group?.category?.name,
    source: 'Meetup',
    imageUrl: event.group?.photo?.highres_link || event.group?.photo?.photo_link
  }));
}

/**
 * Format address from venue object
 */
function formatAddress(venue) {
  if (!venue) return 'TBD';
  
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

module.exports = {
  fetchRealEvents,
  fetchEventbriteEvents,
  fetchMeetupEvents,
  fetchFirecrawlEvents,
  fetchLocalCommunityEvents,
  geocodeZipcode
};

