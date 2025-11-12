# Phase 3 Enhancement Plan: Real Event Integration

## Overview
Add real event APIs to match GPT's conceptual recommendations with actual events that have real URLs, dates, and registration links.

---

## Current State (MVP - Phases 1 & 2)

### Phase 1: Data Collection
- ✅ Survey deployed and collecting responses
- ✅ Airtable storing user data
- ✅ No recommendations yet

### Phase 2: Conceptual Recommendations
- ✅ GPT-4 generates psychology-based recommendations
- ✅ Users receive 10 personalized activity suggestions
- ✅ Activity types are accurate (verified: gay hiking groups exist, beach volleyball exists, etc.)
- ⚠️ URLs are fabricated (GPT invents organization names/websites)
- ⚠️ Users must Google to find actual organizations

**User Experience:**
```
Recommendation: "SF Bay Area Gay Hiking Group - Saturday Morning Adventures"
User Action: Googles "SF gay hiking" → Finds BLAZE, Rainbow Sierrans, etc.
Result: User finds real groups, but requires extra step
```

---

## Phase 3: Real Event Matching

### Goal
Automatically match conceptual recommendations with real events from APIs, providing direct links and registration.

### Target Launch
**After achieving:**
- 100+ survey completions
- User feedback on conceptual recommendations
- Validation that psychology-based matching works
- Budget approval for API costs

---

## Technical Architecture

### Enhanced Data Flow

```
User Survey
    ↓
Airtable (Store + Calculate Scores)
    ↓
GPT-4 (Generate 10 Conceptual Recommendations)
    ↓
Event Matching Engine (NEW)
    ├─→ Meetup.com API (Search recurring groups)
    ├─→ Eventbrite API (Search one-time events)
    ├─→ Google Places API (Search venues)
    └─→ Facebook Events API (Optional)
    ↓
Matching Algorithm (Score & Rank)
    ↓
Enhanced Recommendations (Conceptual + Real Options)
    ↓
User Receives 10 Recommendations with 2-3 Real Options Each
```

---

## API Selection & Integration

### Primary APIs (Recommended)

#### 1. Meetup.com API
**Purpose:** Recurring activities (weekly clubs, ongoing classes)

**Why Meetup:**
- Best source for recurring social groups
- Strong LGBTQ+ community presence
- Affinity groups well-represented
- Free tier available

**What You Get:**
- Group name, description, member count
- Meeting schedule, location
- Direct signup link
- Category tags

**Cost:**
- Free tier: 200 requests/day
- Paid: $9.99/month for more

**Example Response:**
```json
{
  "name": "BLAZE >> Gay Men Backpacking",
  "link": "https://meetup.com/blazesf",
  "members": 450,
  "next_event": {
    "name": "Mount Tamalpais Hike",
    "time": "2025-11-16T09:00:00",
    "yes_rsvp_count": 15
  },
  "category": "Outdoors & Adventure",
  "topics": ["hiking", "lgbtq", "gay men"]
}
```

**Integration Priority:** ⭐⭐⭐⭐⭐ (HIGHEST)

---

#### 2. Eventbrite API
**Purpose:** One-time events (workshops, concerts, festivals)

**Why Eventbrite:**
- Largest database of ticketed events
- Professional/structured events
- Direct ticket purchase links
- Good search/filtering

**What You Get:**
- Event name, description, venue
- Date/time, ticket price
- Registration link
- Category tags

**Cost:**
- Free tier available
- No cost for searching
- Eventbrite takes cut of ticket sales (if you host events)

**Example Response:**
```json
{
  "name": "Young Professionals Networking Night",
  "url": "https://eventbrite.com/e/12345",
  "start": "2025-11-20T18:00:00",
  "end": "2025-11-20T20:00:00",
  "venue": "Harper & Rye, 1695 Polk St",
  "ticket_price": "$15",
  "category": "Business & Professional"
}
```

**Integration Priority:** ⭐⭐⭐⭐⭐ (HIGHEST)

---

#### 3. Google Places API
**Purpose:** Find specific venues (gyms, studios, cafes)

**Why Google Places:**
- Most comprehensive venue database
- Accurate addresses, hours, contact info
- User reviews and ratings
- Photos

**What You Get:**
- Business name, address, phone
- Opening hours
- Website, Google Maps link
- Rating, review count

**Cost:**
- Pay as you go
- ~$0.032 per search request
- ~$0.017 per place details request
- ~$0.05 total per user

**Example Response:**
```json
{
  "name": "SOMA Pottery Studio",
  "address": "123 Townsend St, San Francisco",
  "phone": "+1-415-555-0123",
  "website": "http://somapottery.com",
  "rating": 4.7,
  "hours": "Thu 6:00 PM – 9:00 PM"
}
```

**Integration Priority:** ⭐⭐⭐ (MEDIUM - Phase 3.2)

---

### Secondary APIs (Optional)

#### 4. Facebook Events API
**Purpose:** Community events, local gatherings

**Pros:**
- Huge event database
- Free community events
- Local neighborhood activities

**Cons:**
- More restricted API access
- Requires Facebook app approval
- Data quality varies

**Integration Priority:** ⭐⭐ (LOW - Phase 4)

---

## Matching Algorithm

### Step 1: Extract Keywords from Conceptual Recommendation

GPT returns:
```
"SF Bay Area Gay Hiking Group - Join local LGBTQ+ outdoor enthusiasts 
for Saturday morning hikes exploring trails around the Bay Area."
```

Extract:
- **Activity Type:** Hiking, outdoor
- **Affinity Group:** Gay men, LGBTQ+
- **Location:** San Francisco Bay Area
- **Frequency:** Weekly (Saturday mornings)
- **Category:** Outdoor & Nature

---

### Step 2: Search Each API

**Meetup Search:**
```javascript
const meetupResults = await searchMeetup({
  query: "gay hiking OR LGBTQ hiking",
  location: "San Francisco, CA",
  radius: 25, // miles
  category: "outdoors",
  upcoming_events: true
});
```

**Eventbrite Search:**
```javascript
const eventbriteResults = await searchEventbrite({
  q: "hiking outdoor",
  "location.address": "San Francisco, CA",
  "location.within": "25mi",
  categories: "103", // Sports & Fitness
  start_date: "2025-11-12T00:00:00Z"
});
```

---

### Step 3: Score & Rank Matches

**Scoring Criteria (0-100 points):**

| Criteria | Points | Example |
|----------|--------|---------|
| Keyword Match | 0-30 | "gay hiking" in title = 30 pts |
| Location Match | 0-20 | Within 10 miles = 20 pts |
| Category Match | 0-15 | Correct category = 15 pts |
| Affinity Match | 0-15 | LGBTQ+ tag = 15 pts |
| Activity Level Match | 0-10 | Physical activity = 10 pts |
| Recency/Active | 0-10 | Recent activity = 10 pts |

**Example Scoring:**
```javascript
BLAZE >> Gay Men Backpacking:
- Keywords ("gay", "hiking"): 30 pts
- Location (SF): 20 pts
- Category (Outdoors): 15 pts
- Affinity (LGBTQ+): 15 pts
- Physical: 10 pts
- Active (last event 2 days ago): 10 pts
Total: 100/100 ⭐ PERFECT MATCH
```

---

### Step 4: Return Top 2-3 Matches Per Recommendation

```json
{
  "recommendation": {
    "id": 1,
    "title": "Gay Men's Hiking Group",
    "type": "Recurring | Outdoor & Nature",
    "whyItMatches": "Your high openness to experience and preference for outdoor, physical activities align perfectly with hiking groups. Your affinity selection (gay men) makes LGBTQ+-focused groups ideal for building authentic connections.",
    
    "conceptualDescription": "Join a welcoming community of LGBTQ+ outdoor enthusiasts for regular hikes exploring trails around the Bay Area. Expect moderate group sizes (10-20 people), Saturday morning meetups, and a mix of skill levels. Perfect for making lasting friendships while staying active.",
    
    "realOptions": [
      {
        "source": "Meetup",
        "name": "BLAZE >> Gay Men Backpacking",
        "url": "https://meetup.com/blazesf",
        "members": 450,
        "matchScore": 100,
        "nextEvent": {
          "name": "Mount Tamalpais Summit Hike",
          "date": "Saturday, Nov 16, 2025",
          "time": "9:00 AM",
          "rsvps": 15,
          "location": "Mill Valley, CA"
        },
        "description": "BLAZE >> is a gay men's hiking and backpacking group based out of the San Francisco Bay Area...",
        "tags": ["LGBTQ+", "hiking", "outdoor", "gay men"]
      },
      {
        "source": "Meetup",
        "name": "Rainbow Sierrans",
        "url": "https://rainbowsierrans.org",
        "members": 1200,
        "matchScore": 95,
        "nextEvent": {
          "name": "Point Reyes Coastal Trail",
          "date": "Saturday, Nov 16, 2025",
          "time": "8:00 AM",
          "rsvps": 22,
          "location": "Point Reyes, CA"
        },
        "description": "LGBTQ+ outings and conservation club, official Sierra Club chapter...",
        "tags": ["LGBTQ+", "sierra club", "hiking", "conservation"]
      }
    ]
  }
}
```

---

## Implementation Steps

### Phase 3.1: Basic Integration (2-3 weeks)

**Week 1: API Setup**
- [ ] Sign up for Meetup API key
- [ ] Sign up for Eventbrite API key
- [ ] Test API endpoints with Postman/curl
- [ ] Understand rate limits and quotas

**Week 2: Backend Integration**
- [ ] Create `backend/services/meetup.js`
- [ ] Create `backend/services/eventbrite.js`
- [ ] Create `backend/services/eventMatcher.js`
- [ ] Add matching algorithm
- [ ] Add scoring system

**Week 3: Testing & Refinement**
- [ ] Test with real user data
- [ ] Verify match quality
- [ ] Tune scoring algorithm
- [ ] Add error handling
- [ ] Deploy to production

---

### Phase 3.2: Enhanced Matching (1-2 weeks)

**Improvements:**
- [ ] Add Google Places for venue details
- [ ] Add caching layer (Redis) to reduce API calls
- [ ] Add fallback logic if no matches found
- [ ] Track match success rate in Airtable
- [ ] A/B test: conceptual only vs. conceptual + real

---

### Phase 3.3: User Feedback Loop (Ongoing)

**Track:**
- Which real events users actually click
- Which real events users join/attend
- Match quality ratings
- Click-through rates per API source

**Store in New Airtable Table: Event_Interactions**
```
Interaction ID
User (link)
Recommendation ID
Real Event URL
Action (clicked, joined, attended, dismissed)
Timestamp
Feedback (optional rating 1-5)
```

---

## Code Structure

### New Files to Create:

```
backend/
├── services/
│   ├── meetup.js           # Meetup API integration
│   ├── eventbrite.js       # Eventbrite API integration
│   ├── googlePlaces.js     # Google Places API integration
│   └── eventMatcher.js     # Matching algorithm
├── utils/
│   ├── scoring.js          # Match scoring logic
│   └── cache.js            # Caching layer (Redis)
└── routes/
    └── events.js           # GET /api/events/:recommendationId
```

### Example: `backend/services/meetup.js`

```javascript
const axios = require('axios');

class MeetupService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.meetup.com';
  }

  async searchGroups(params) {
    try {
      const response = await axios.get(`${this.baseURL}/find/groups`, {
        params: {
          key: this.apiKey,
          text: params.query,
          lat: params.lat,
          lon: params.lon,
          radius: params.radius || 25,
          category: params.category,
          upcoming_events: true
        }
      });

      return response.data.map(group => ({
        source: 'Meetup',
        name: group.name,
        url: group.link,
        members: group.members,
        description: group.description,
        category: group.category.name,
        nextEvent: group.next_event ? {
          name: group.next_event.name,
          time: group.next_event.time,
          rsvps: group.next_event.yes_rsvp_count
        } : null,
        tags: group.topics?.map(t => t.name) || []
      }));

    } catch (error) {
      console.error('Meetup API error:', error);
      return [];
    }
  }
}

module.exports = MeetupService;
```

### Example: `backend/services/eventMatcher.js`

```javascript
const MeetupService = require('./meetup');
const EventbriteService = require('./eventbrite');
const { scoreMatch } = require('../utils/scoring');

class EventMatcher {
  constructor() {
    this.meetup = new MeetupService(process.env.MEETUP_API_KEY);
    this.eventbrite = new EventbriteService(process.env.EVENTBRITE_API_KEY);
  }

  async findRealEvents(conceptualRec, userLocation) {
    // Extract search params from conceptual recommendation
    const searchParams = this.extractSearchParams(conceptualRec);

    // Search all APIs in parallel
    const [meetupResults, eventbriteResults] = await Promise.all([
      this.meetup.searchGroups(searchParams),
      this.eventbrite.searchEvents(searchParams)
    ]);

    // Combine and score
    const allResults = [...meetupResults, ...eventbriteResults];
    const scoredResults = allResults.map(event => ({
      ...event,
      matchScore: scoreMatch(conceptualRec, event)
    }));

    // Sort by score and return top 3
    return scoredResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }

  extractSearchParams(conceptualRec) {
    // Parse the conceptual recommendation to extract:
    // - Keywords (activity type, affinity group)
    // - Category
    // - Location preferences
    // - Activity level
    
    return {
      query: this.extractKeywords(conceptualRec.title),
      category: this.mapCategory(conceptualRec.category),
      location: conceptualRec.userLocation,
      radius: conceptualRec.travelDistance
    };
  }

  extractKeywords(title) {
    // Simple keyword extraction
    // In production, could use NLP/entity extraction
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .join(' ');
  }

  mapCategory(empowerCategory) {
    // Map Empower categories to API categories
    const categoryMap = {
      'Outdoor & Nature': 'outdoors',
      'Sports & Fitness': 'fitness',
      'Arts & Culture': 'arts',
      'Social & Networking': 'social',
      // ... etc
    };
    return categoryMap[empowerCategory] || 'social';
  }
}

module.exports = EventMatcher;
```

---

## Environment Variables

Add to `.env`:

```bash
# Event API Keys (Phase 3)
MEETUP_API_KEY=your_meetup_key_here
EVENTBRITE_API_KEY=your_eventbrite_key_here
GOOGLE_PLACES_API_KEY=your_google_key_here

# Feature Flags
ENABLE_REAL_EVENTS=false  # Set to true when Phase 3 is live
```

---

## Cost Analysis

### MVP (Phase 2): $0.06/user
- OpenAI GPT-4: $0.06

### Phase 3.1 (Meetup + Eventbrite): $0.06/user
- OpenAI GPT-4: $0.06
- Meetup API: Free tier (200 requests/day)
- Eventbrite API: Free

### Phase 3.2 (+ Google Places): $0.11/user
- OpenAI GPT-4: $0.06
- Meetup API: Free tier
- Eventbrite API: Free
- Google Places: $0.05 (10 searches per user)

### At Scale (1,000 users/month):
- Phase 2: $60/month
- Phase 3.1: $60/month (no additional cost!)
- Phase 3.2: $110/month

**Conclusion:** Adding Meetup + Eventbrite is essentially FREE! ✨

---

## Success Metrics

### Track These KPIs:

**Match Quality:**
- % of recommendations with at least 1 real match
- % of recommendations with 3+ real matches
- Average match score (target: >75/100)

**User Engagement:**
- Click-through rate on real event links
- % of users who join/register for recommended events
- Time from recommendation → registration
- User ratings of match quality (1-5 stars)

**API Performance:**
- API response times
- API error rates
- Cache hit rate
- Cost per user

**Business Impact:**
- User retention (do they come back?)
- NPS score improvement
- Viral coefficient (referrals)

---

## Rollout Plan

### Soft Launch (Beta Testers)
- Enable for 10-20 beta users
- Collect detailed feedback
- Fix bugs, tune algorithm
- Verify costs are manageable

### Phased Rollout
- Week 1: 10% of users
- Week 2: 25% of users
- Week 3: 50% of users
- Week 4: 100% of users

### A/B Test
- Group A: Conceptual only (control)
- Group B: Conceptual + real events
- Compare: satisfaction, engagement, retention

---

## Risk Mitigation

### API Rate Limits
**Risk:** Exceed free tier limits
**Mitigation:** 
- Cache results (30-day TTL)
- Implement request queuing
- Monitor daily usage
- Upgrade to paid tier if needed ($10/month)

### Poor Match Quality
**Risk:** Real events don't match conceptual well
**Mitigation:**
- Tune scoring algorithm
- Add manual curation for top 10 activities
- Fall back to conceptual if match score < 50

### API Downtime
**Risk:** Meetup/Eventbrite API goes down
**Mitigation:**
- Try-catch error handling
- Fall back to conceptual recommendations
- Show cached results if available
- Display message: "Unable to load real events, showing conceptual recommendations"

### Cost Overruns
**Risk:** Google Places costs add up
**Mitigation:**
- Only use for high-value users (premium tier)
- Implement aggressive caching
- Set monthly budget caps
- Monitor costs daily

---

## Future Enhancements (Phase 4+)

### Custom Event Database
- Curate high-quality organizations
- Verify URLs manually
- Build partnerships with event organizers
- Get exclusive discounts for Empower users

### User-Generated Events
- Let users create and share events
- Build community within Empower
- Reduce dependence on external APIs

### Smart Recommendations
- Learn from past attendance
- Collaborative filtering (users like you also liked...)
- Time-based recommendations (weather, season, holidays)

### Integration with Calendar Apps
- "Add to Calendar" button
- Send reminders before events
- Track which events users actually attend

---

## Decision Point

**You should proceed to Phase 3 when:**
- [ ] 100+ users have completed surveys
- [ ] User feedback requests real event links
- [ ] Psychology-based matching is validated
- [ ] Budget approved for potential API costs
- [ ] Development time available (2-3 weeks)

**Stay in Phase 2 if:**
- Still validating product-market fit
- Users are satisfied with conceptual recommendations
- Limited development resources
- Want to keep costs minimal

---

## Questions to Answer Before Phase 3

1. What % of users successfully find events with conceptual-only?
2. What's the #1 user complaint about current recommendations?
3. Which activity categories have the weakest matches?
4. Are users willing to pay for better recommendations?
5. Can we get Meetup/Eventbrite partnerships?

---

## Summary

**Phase 3 Goals:**
- ✅ Match conceptual → real events automatically
- ✅ Provide 2-3 real options per recommendation
- ✅ Increase user success rate (finding events)
- ✅ Reduce friction (no manual Googling)
- ✅ Maintain low costs (mostly free APIs)

**Timeline:** 2-3 weeks development + 1-2 weeks testing

**Cost Impact:** Minimal ($0/user with free tiers)

**Risk:** Low (can fall back to conceptual if APIs fail)

**User Impact:** HIGH (significantly better UX)

---

*Document Version: 1.0*
*Created: November 12, 2025*
*Next Review: After 100 survey completions*
