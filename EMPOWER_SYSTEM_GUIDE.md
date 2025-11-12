# Empower System Guide
## Understanding How Your Survey Creates Personalized Recommendations

---

## 📋 **Table of Contents**
1. [Overview](#overview)
2. [Step-by-Step Flow](#step-by-step-flow)
3. [How Scores Are Interpreted](#how-scores-are-interpreted)
4. [The GPT Prompt Generation](#the-gpt-prompt-generation)
5. [Next Steps: Storage & API Integration](#next-steps)
6. [Recommendation Display Design](#recommendation-display)

---

## Overview

**Empower** takes a user through a 7-page survey, interprets their personality, social needs, motivations, and interests, then generates a personalized prompt for a Custom GPT that finds matching events and activities.

### The Complete Flow:
```
User fills survey → Data collected → Scores calculated → 
Prompt generated → Sent to GPT → Events recommended → 
Displayed to user
```

---

## Step-by-Step Flow

### **STEP 1: User Completes Survey (7 Pages)**

**Page 1: Basic Information**
- Name, Age, Gender, Zipcode
- **Purpose:** Demographics and location for event filtering

**Page 2: Personality Assessment (TIPI - Ten Item Personality Inventory)**
- 6 questions on 1-7 scale
- Measures Big Five traits: Extraversion, Conscientiousness, Openness
- **Purpose:** Understand social preferences, structure needs, openness to new experiences

**Page 3: Social Connection**
- Close friends count, loneliness frequency, social satisfaction
- **Purpose:** Identify isolation and need for community building

**Page 4: Core Motivation (Situational Motivation Scale)**
- 6 questions measuring intrinsic, social, and achievement motivation
- **Purpose:** Understand WHY they participate in activities

**Page 5: Interest Categories (Broad)**
- 10 major categories (Sports, Arts, Food, etc.)
- **Purpose:** Identify general areas of interest

**Page 6: Specific Interests**
- Detailed interests within selected categories (all pre-checked)
- **Purpose:** Get granular about exact activities they enjoy

**Page 7: Activity Preferences**
- Free time, travel distance, activity settings (indoor/outdoor, physical/relaxed)
- **Purpose:** Practical constraints and preferences

---

### **STEP 2: Data Collection & Score Calculation**

When user clicks "Submit," JavaScript collects all form data:

```javascript
const formData = {
    // Demographics
    firstName: "Alex",
    age: 28,
    gender: "female",
    zipcode: "22903",
    
    // Personality (calculated from reversed items)
    extraversion: 5,           // Range: 2-14 (low = introverted)
    conscientiousness: 12,     // Range: 2-14 (high = organized)
    openness: 13,              // Range: 2-14 (high = loves novelty)
    
    // Social connection
    closeFriends: 2,           // Number of close friends
    loneliness: 4,             // Scale: 1-5 (4 = often lonely)
    socialSatisfaction: 3,     // Scale: 1-7 (3 = dissatisfied)
    
    // Motivations (sum of 2 items each)
    intrinsicMotivation: 7,    // Range: 2-10 (enjoys fun)
    socialMotivation: 9,       // Range: 2-10 (wants connection)
    achievementMotivation: 6,  // Range: 2-10 (moderate skill-building)
    
    // Interests
    interestCategories: ["sports", "outdoor", "wellness"],
    specificInterests: ["yoga", "hiking", "meditation", "photography"],
    
    // Practical
    freeTime: "10-20",         // Hours per week
    travelDistance: "5-15",    // Miles
    activityPreferences: ["outdoor", "relaxed", "physical"]
}
```

**Key Calculations:**

**Personality Scores:**
- Items 6, 8, 10 are reverse-scored: `8 - original_score`
- Extraversion = Q1 + Q6R
- Conscientiousness = Q3 + Q8R
- Openness = Q5 + Q10R

**Social Need Score:**
- Formula: `(loneliness × 2) + (15 - closeFriends) + ((8 - socialSatisfaction) × 1.5)`
- Range: 0-50 (higher = more need for connection)
- Example: `(4 × 2) + (15 - 2) + ((8 - 3) × 1.5) = 8 + 13 + 7.5 = 28.5`

**Motivation Dimensions:**
- Intrinsic = M1 + M4 (fun/enjoyment)
- Social = M2 + M5 (connection/people)
- Achievement = M3 + M6 (skills/challenge)

---

### **STEP 3: Prompt Generation (Dynamic & Personalized)**

The `generatePersonalizedGPTPrompt()` function creates a custom prompt based on the user's scores.

**Key Features:**

#### **A. Dynamic Date Range**
```javascript
const today = new Date(); // Nov 12, 2025
const futureDate = new Date();
futureDate.setDate(today.getDate() + 30); // Dec 12, 2025

// Result in prompt:
"Timeframe: Nov 12, 2025 to Dec 12, 2025 (next 30 days from TODAY)"
```
✅ **Always shows events for the next 30 days from when GPT is called**
✅ **Updates dynamically** - if user requests new recommendations on Dec 1, it searches Dec 1 - Dec 31

#### **B. Personality Interpretation**

```javascript
// Extraversion: 5/14
const isIntroverted = (5 < 7); // TRUE

// Added to prompt:
"Extraversion: 5/14 (INTROVERTED)"
"Priority: Small intimate groups (max 8-10 people) - user is introverted"
```

```javascript
// Conscientiousness: 12/14
const isHighlyConscientious = (12 > 10); // TRUE

// Added to prompt:
"Conscientiousness: 12/14 (HIGHLY ORGANIZED)"
"Priority: Structured programs with clear schedules and goals"
```

#### **C. Social Need Prioritization**

```javascript
// Social Need Score: 28.5/50
const hasHighSocialNeed = (28.5 > 30); // FALSE (but close)

// If TRUE, would add:
"**CRITICAL: Community building and making friends** - User is lonely"
"Recurring weekly meetups that build consistent relationships"
"Explicitly welcoming and newcomer-friendly environments"
```

#### **D. Dominant Motivation**

```javascript
const motivations = {
    intrinsic: 7,
    social: 9,      // ← HIGHEST
    achievement: 6
};

// Added to prompt:
"**DOMINANT: SOCIAL**"
"Priority: Strong social connection opportunities - user is socially motivated"
```

#### **E. Personalized Constraints**

```javascript
// Travel distance: "5-15" → "15 miles"
"Location: Within 15 miles of zipcode 22903"

// Activity preferences: ["outdoor", "relaxed", "physical"]
"Priorities:
- Outdoor activities in nature
- Low-key and relaxed atmospheres  
- Active and physically engaging events"
```

---

### **STEP 4: The Complete GPT Prompt**

Here's what gets sent to the Custom GPT for our example user (Alex):

```
USER PROFILE:

Demographics:
- Name: Alex
- Age: 28
- Location: 22903
- Available time: 10-20 hours per week
- Max travel: 15 miles

Personality (out of 14):
- Extraversion: 5/14 (INTROVERTED)
- Conscientiousness: 12/14 (HIGHLY ORGANIZED)
- Openness: 13/14 (VERY OPEN TO NEW EXPERIENCES)

Social Situation:
- Close friends: 2 (SOCIALLY ISOLATED)
- Loneliness: 4/5 (OFTEN LONELY - HIGH PRIORITY)
- Social satisfaction: 3/7
- **SOCIAL NEED SCORE: 29/50** (MEDIUM-HIGH - Emphasize community!)

Core Motivations (out of 10):
- Intrinsic (fun): 7/10
- Social (connection): 9/10
- Achievement (skills): 6/10
- **DOMINANT: SOCIAL**

Interests:
- Categories: sports, outdoor, wellness
- Specific: yoga, hiking, meditation, photography

Activity Preferences: outdoor, relaxed, physical

---

SEARCH CONSTRAINTS:
- **Timeframe: Nov 12, 2025 to Dec 12, 2025 (next 30 days from TODAY)**
- **Today's date: Nov 12, 2025** (use this to filter events)
- Location: Within 15 miles of zipcode 22903
- Required balance: 
  * 50% RECURRING events (weekly groups, leagues, ongoing clubs)
  * 50% ONE-TIME events (workshops, concerts, single activities)

RECOMMENDATION PRIORITIES (in order):
1. Small intimate groups (max 8-10 people) - user is introverted
2. Structured programs with clear schedules and goals - user is highly organized
3. Novel and diverse experiences - user loves trying new things
4. Strong social connection opportunities - user is socially motivated
5. Outdoor activities in nature
6. Low-key and relaxed atmospheres
7. Active and physically engaging events

EVENT SOURCES TO SEARCH:
✓ Meetup groups (especially recurring)
✓ Local sports leagues (ZogSports, YMCA, rec leagues)
✓ Eventbrite events
✓ Fitness studio class schedules
✓ Community centers and parks & rec
✓ Volunteer organizations
✓ Book clubs, hobby groups, maker spaces
✓ Cultural organizations (museums, galleries, theaters)

REQUIRED OUTPUT FORMAT:
For each recommendation provide:
1. Event/Organization name
2. Type: [RECURRING] or [ONE-TIME]
3. Date/Schedule
4. Location & distance from 22903
5. Group size: Small/Medium/Large
6. Match score: 0-100
7. Why it's a match (2-3 reasons)
8. Registration link
9. Newcomer-friendly: Yes/No
10. Cost: Free/$/$$/$$$
11. Image URL

BALANCE REQUIREMENT:
- Exactly 5 RECURRING opportunities
- Exactly 5 ONE-TIME events
- Minimum 2 different activity categories
- All events within Nov 12 - Dec 12, 2025

Please recommend 10 events/organizations in the 22903 area.
```

---

## How Scores Are Interpreted

### **Personality Dimensions**

| Score | Extraversion | Conscientiousness | Openness |
|-------|-------------|------------------|----------|
| 2-6 (Low) | Introverted<br>→ Small groups, quiet venues | Spontaneous<br>→ Flexible schedules, drop-in | Conventional<br>→ Familiar activities |
| 7-10 (Med) | Ambivert<br>→ Mixed preferences | Balanced<br>→ Semi-structured | Moderately open<br>→ Some variety |
| 11-14 (High) | Extraverted<br>→ Large groups, parties | Organized<br>→ Structured programs | Loves novelty<br>→ New experiences |

### **Social Need Interpretation**

| Social Need Score | Interpretation | Recommendation Strategy |
|-------------------|----------------|------------------------|
| 0-15 (Low) | Socially satisfied | Focus on activity quality |
| 16-30 (Medium) | Some social needs | Balance activity + social |
| 31-50 (High) | HIGH PRIORITY | Emphasize community building, recurring events, welcoming atmospheres |

### **Motivation Types**

| Motivation | Score | Focus On |
|------------|-------|----------|
| **Intrinsic** | 8-10 (High) | Fun activities, entertainment, pure enjoyment |
| **Social** | 8-10 (High) | Networking, friend-making, community |
| **Achievement** | 8-10 (High) | Skill-building, challenges, certifications |

---

## Next Steps: Storage & API Integration

### **Option 1: Airtable (Recommended for MVP)**

**1. Create Airtable Base:**
- Table: `user_profiles`
- Fields: All survey data + GPT prompt + recommendations

**2. Add Submission Code:**
```javascript
async function saveToAirtable(formData, gptPrompt) {
    const response = await fetch('https://api.airtable.com/v0/YOUR_BASE_ID/user_profiles', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                user_id: generateUserId(),
                timestamp: new Date().toISOString(),
                ...formData,
                gpt_prompt: gptPrompt.prompt
            }
        })
    });
    return response.json();
}
```

**3. Call Custom GPT:**
```javascript
async function getRecommendations(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_OPENAI_API_KEY`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{
                role: 'system',
                content: 'You are an event recommendation engine for Empower...'
            }, {
                role: 'user',
                content: prompt
            }]
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

---

## Recommendation Display Design

### **Card-Based Layout**

Each recommendation should be displayed as a card with:

**Visual Elements:**
- Event/organization image (from imageUrl)
- [RECURRING] or [ONE-TIME] badge
- Match score badge (e.g., "92% Match")

**Content:**
- **Title:** Event/Organization name
- **Schedule:** Date or recurring schedule
- **Location:** Venue + distance
- **Cost:** Free/$/$$/$$$
- **Group Size:** Small/Medium/Large badge
- **Why It's a Match:** 2-3 bullet points
- **Newcomer-friendly badge** (if yes)

**Actions:**
- "Sign Up" or "Learn More" button (links to registration URL)
- "Save for Later" button (future feature)

### **Example Card HTML:**

```html
<div class="event-card">
    <div class="event-image" style="background-image: url('image-url')">
        <span class="event-type-badge recurring">RECURRING</span>
        <span class="match-score-badge">92% Match</span>
    </div>
    
    <div class="event-content">
        <h3>Charlottesville Hiking Club</h3>
        
        <div class="event-meta">
            <span class="schedule">📅 Every Saturday, 9:00 AM</span>
            <span class="location">📍 Various trails • 3.2 miles away</span>
            <span class="cost">💰 Free</span>
            <span class="group-size">👥 Small group (8-12 people)</span>
        </div>
        
        <div class="match-reasons">
            <h4>Why this matches you:</h4>
            <ul>
                <li>Small group setting perfect for introverts</li>
                <li>Outdoor activity aligns with your interests</li>
                <li>Recurring schedule builds consistent friendships</li>
            </ul>
        </div>
        
        <div class="event-badges">
            <span class="badge newcomer">✨ Newcomer-Friendly</span>
        </div>
        
        <div class="event-actions">
            <a href="registration-url" class="btn-primary">Join the Group</a>
            <button class="btn-secondary">Save</button>
        </div>
    </div>
</div>
```

### **Card Grid Layout:**

```css
.recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    padding: 40px;
}

.event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.event-image {
    height: 200px;
    background-size: cover;
    background-position: center;
    position: relative;
}

.event-type-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: #FF8C42;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}

.match-score-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: white;
    color: #FF8C42;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
}
```

---

## Testing Your Current System

**To test the current implementation:**

1. Fill out the entire survey
2. Click "Submit"
3. Open browser console (F12)
4. You'll see:
   - Your collected profile data
   - The generated GPT prompt
   - Personality interpretation
   - Social need score
   - Dominant motivation

**What the console shows:**
```
=== FORM SUBMISSION ===
User Profile Data: {firstName: "Alex", age: 28, ...}

=== GENERATING GPT PROMPT ===
GPT Prompt Metadata: {
    generatedAt: "2025-11-12T...",
    socialNeedScore: 29,
    dominantMotivation: "social",
    personalityProfile: {
        extraversion: "introverted",
        conscientiousness: "organized",
        openness: "very open"
    }
}

Full GPT Prompt:
[Complete personalized prompt text...]
```

---

## Summary

✅ **Survey collects** comprehensive user data across 7 pages
✅ **Scores are calculated** and interpreted automatically
✅ **Prompt is generated** dynamically based on user profile
✅ **Date range updates** every time (always next 30 days)
✅ **Constraints are personalized** based on personality, needs, and preferences
✅ **Ready for integration** with Airtable + Custom GPT

**Next implementation steps:**
1. Set up Airtable or database
2. Add API calls to save data
3. Connect to Custom GPT
4. Build recommendations display page
5. Add user authentication

