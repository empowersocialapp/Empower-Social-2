# Empower Social - Project Context for Cursor AI

## Project Overview
Psychology-based social activity recommendation system. Users take a scientifically-validated survey, we calculate personality/motivation scores, then generate personalized event recommendations using GPT-4.

## System Architecture

### Data Flow:
1. User completes survey (frontend/survey/intake-survey.html)
2. POST to /api/submit-survey
3. Backend creates records in Airtable (Users → Survey_Responses → Calculated_Scores)
4. Backend builds GPT-4 prompt from Airtable data
5. Send to OpenAI API, get recommendations
6. Store in GPT_Prompts table
7. Return recommendations to user

### Tech Stack:
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Node.js + Express (✅ BUILT)
- **Database**: Airtable (cloud-based, formulas auto-calculate scores)
- **AI**: OpenAI GPT-4-turbo
- **Deployment**: Netlify/Vercel (planned)

## Database Schema (Airtable)

### Table 1: Users
- User ID (autonumber)
- Name, Email, Age, Gender, Zipcode
- Links to Survey_Responses, Calculated_Scores

### Table 2: Survey_Responses
- Response ID (autonumber)
- User (link)
- Personality: Q1, Q6, Q3, Q8, Q5, Q10 (1-7 scale)
- Motivation: M1-M6 (1-5 scale)
- Social: Close_Friends_Count, Social_Satisfaction, Loneliness_Frequency
- Interests: Interest_Categories, Specific_Interests
- Preferences: Free_Time, Travel_Distance, Setting checkboxes
- Affinity Groups: 6 multiple-select fields
- Links to Calculated_Scores

### Table 3: Calculated_Scores
- Score ID (autonumber)
- User, Survey Response (links)
- Lookup fields: Pull Q1-Q10, M1-M6 from Survey_Responses
- Formula fields (AUTO-CALCULATED by Airtable):
  - Extraversion_Raw = Q1 + (8 - Q6)
  - Conscientiousness_Raw = Q3 + (8 - Q8)
  - Openness_Raw = Q5 + (8 - Q10)
  - Categories: IF(raw >= 11, "High", IF(raw <= 6, "Low", "Medium"))
  - Intrinsic_Motivation = (M1 + M4) / 2
  - Social_Motivation = (M2 + M5) / 2
  - Achievement_Motivation = (M3 + M6) / 2
  - Primary_Motivation = highest of three

### Table 4: GPT_Prompts
- Prompt ID (autonumber)
- User, Survey Response, Calculated Scores (links)
- Prompt_Text (long text)
- Recommendations_Generated (long text)

## Scoring Logic

**Personality (Big Five - TIPI):**
- 6 items, 7-point Likert scale
- Items 6, 8, 10 are REVERSE-SCORED (8 - original)
- Three dimensions: Extraversion, Conscientiousness, Openness
- Range per dimension: 2-14
- Categories: Low (2-6), Medium (7-10), High (11-14)

**Motivation (Self-Determination Theory):**
- 6 items, 5-point Likert scale
- Three dimensions: Intrinsic, Social, Achievement
- Average of 2 items per dimension
- Range per dimension: 1-5
- Primary = highest score

## Recommendation Rules

**Personality Matching:**
- High Extraversion → Large groups, social mixers, networking
- Low Extraversion → Small groups (3-6), intimate settings, quiet
- High Conscientiousness → Structured classes, scheduled programs, organized
- Low Conscientiousness → Spontaneous, flexible, drop-in events
- High Openness → Novel experiences, experimental, creative, diverse
- Low Openness → Traditional, familiar venues, routine

**Affinity Groups (70/30 Rule - CRITICAL):**
- 70% recommendations: Pure interest/personality match
- 30% recommendations: Interest + affinity enhancement
- Affinity MUST match interests (not random affinity events)
- Example ✅: Gay man who likes hiking → "Gay Men's Hiking Group"
- Example ❌: Gay man who likes hiking → Random LGBTQ+ film festival

**Event Mix Requirements:**
- 50% recurring activities (weekly clubs, ongoing classes)
- 50% one-time events (workshops, festivals, special occasions)
- At least 3 different activity categories
- Mix of group sizes

## API Endpoints (To Build)

### POST /api/submit-survey
**Request Body:**
```json
{
  "name": "Test User",
  "age": 28,
  "gender": "Male",
  "zipcode": "94109",
  "email": "test@example.com",
  "personality": {
    "q1": 6, "q6": 3, "q3": 7,
    "q8": 2, "q5": 6, "q10": 2
  },
  "motivation": {
    "m1": 5, "m2": 4, "m3": 4,
    "m4": 4, "m5": 3, "m6": 4
  },
  "social": {
    "closeFriends": "3-5",
    "satisfaction": "Neutral (3)",
    "loneliness": "Sometimes (3)",
    "lookingFor": ["Community involvement", "Just have fun"]
  },
  "interests": {
    "categories": ["Social & Networking", "Creative Hobbies"],
    "specific": ""
  },
  "preferences": {
    "freeTime": "More than 20 hours",
    "travelDistance": "15+ miles",
    "indoor": false,
    "outdoor": true,
    "physical": true,
    "relaxed": false,
    "structured": false,
    "spontaneous": true
  },
  "affinityGroups": {
    "faith": [],
    "lgbtq": ["Gay men"],
    "cultural": [],
    "womens": [],
    "youngProf": ["Recent grads", "Young professionals (20s)"],
    "international": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "userId": "recABC123",
  "recommendations": "1. SF Bay Area Gay Hiking Group...\n2. ..."
}
```

## Important Files

- `docs/TEAM_BRIEFING.md` - Complete system overview
- `docs/EMPOWER_SYSTEM_GUIDE.md` - Technical documentation
- `docs/GPT_PROMPT_TEMPLATE.md` - Complete prompt with all rules
- `backend/services/openai.js` - Example implementation
- `tests/sample-data/` - Real test data and output
- `frontend/survey/intake-survey.html` - Production-ready survey

## What's Built vs What's Needed

✅ **Built:**
- Survey UI (complete, production-ready with edit mode)
- Airtable database (fully configured with formulas)
- GPT prompt template (comprehensive, tested)
- Backend API server (server.js, routes, services)
- Survey submission handler (create & update)
- Airtable integration functions
- GPT-4 integration wrapper (conceptual recommendations)
- Results page UI (display recommendations)
- User authentication (login)
- Recommendation regeneration

🔨 **Future Enhancements:**
- Real event matching (match concepts to actual events with URLs)
- Geocoding service (zipcode → city/state)
- User feedback system
- Save/bookmark functionality

## Cost & Performance

- Airtable: Free tier (1,200 records)
- OpenAI: ~$0.06 per user recommendation
- Response time: 30-60 seconds (GPT generation)
- Scalable to thousands of users

## Known Issues

1. GPT-4 fabricates specific URLs (but activity types are real)
2. No real-time event data (conceptual recommendations)
3. Need geocoding API for accurate city/state lookup
4. No feedback loop yet (can't track which events users attend)

## Coding Style Preferences

- Use async/await (not callbacks)
- Comprehensive error handling with try-catch
- Environment variables for ALL secrets
- Clear function names (createUser, buildPrompt, etc.)
- Comments only for complex logic
- ES6+ syntax
- Return consistent JSON: {success: boolean, data/error: any}

## Airtable Integration Notes

- NEVER modify formula fields in code (they auto-calculate)
- Always link records in correct order: User → Survey → Scores
- Use record IDs for linking (format: recXXXXXXXXXXXXXX)
- Airtable returns arrays for lookup fields - handle appropriately

## Testing Approach

- Unit tests for prompt builder, validation functions
- Integration tests for Airtable + OpenAI flow
- Use sample test data from tests/sample-data/
- Mock external APIs in tests to avoid costs

## Environment Variables Required
```
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
OPENAI_API_KEY=your_openai_key
PORT=3000
NODE_ENV=development
```

---

This context file helps Cursor understand the entire system when making suggestions or writing code.
