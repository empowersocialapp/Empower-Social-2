# Empower 🌟

> **Less Scrolling. More Living.**

A personalized event recommendation engine that uses psychology-backed assessments to match users with meaningful real-world activities and communities.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Private](https://img.shields.io/badge/repo-private-red)

---

## 📖 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [File Structure](#file-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Empower** is a web application that helps people find events, activities, and communities that actually match who they are—not just what they're interested in. By combining personality psychology, social connection research, and motivational theory, Empower goes beyond simple interest matching to recommend experiences that truly resonate.

### Key Stats
- **7-page intake survey** capturing comprehensive user profiles
- **3 personality dimensions** measured (Big Five traits)
- **6 motivation factors** assessed (Situational Motivation Scale)
- **10+ interest categories** with 100+ specific activities
- **Dynamic recommendations** updated for the next 30 days

---

## 🚨 The Problem

Modern life presents a paradox:
- **Record loneliness levels** despite digital connectivity
- **Analysis paralysis** from endless event options
- **Poor match quality** from generic event platforms
- **Surface-level matching** based only on interests, not personality or needs

People spend hours scrolling through Meetup, Eventbrite, and Facebook Events looking for "something to do," but these platforms don't understand:
- Whether you're introverted (prefer small groups) or extraverted (energized by crowds)
- If you're lonely and need recurring community vs. socially satisfied
- Whether you want fun, skill-building, or deeper connections
- Your practical constraints (time, distance, activity preferences)

---

## 💡 The Solution

Empower uses a psychology-backed intake survey to create a rich user profile, then generates AI-powered recommendations that consider:

### **Personality Fit**
- **Extraversion:** Small intimate groups vs. large social events
- **Conscientiousness:** Structured programs vs. spontaneous activities  
- **Openness:** Novel experiences vs. familiar routines

### **Social Needs**
- **Connection priority:** High for lonely/isolated users
- **Group preferences:** Recurring communities vs. one-time events
- **Newcomer support:** Welcoming environments emphasized

### **Core Motivations**
- **Intrinsic:** Fun and enjoyment-focused activities
- **Social:** Friend-making and networking opportunities
- **Achievement:** Skill-building and goal-oriented programs

### **Practical Constraints**
- Time availability, travel distance, activity preferences
- Always shows events within the next 30 days
- Balances 50% recurring (build relationships) + 50% one-time (variety)

---

## ✨ Features

### Current Features (v1.0)
- ✅ **Comprehensive intake survey** (7 pages, ~5 minutes)
- ✅ **Psychology-backed assessments** (TIPI, Situational Motivation Scale)
- ✅ **Modular interest system** (easily add/remove categories)
- ✅ **Dynamic GPT prompt generation** (personalized based on profile)
- ✅ **Smart score interpretation** (automatically calculates personality dimensions)
- ✅ **Social need scoring** (prioritizes community for lonely users)
- ✅ **Responsive design** (mobile-friendly)
- ✅ **Beautiful UI** (Montserrat + DM Sans typography)

### Current Features (v1.0)
- ✅ **Airtable integration** (user profiles, survey responses, recommendations)
- ✅ **OpenAI GPT-4 integration** (conceptual recommendation generation)
- ✅ **Recommendation display** (card-based with personalized explanations)
- ✅ **User profile storage** (save profiles, track history)
- ✅ **Refresh recommendations** (get new suggestions anytime)

### Coming Soon
- 🔄 **Real event matching** (match concepts to actual events with URLs)
- 🔄 **Save/share functionality** (bookmark concepts)
- 🔄 **Feedback system** (improve recommendations based on user feedback)

---

## 🔬 How It Works

### 1. User Completes Survey

**Page 1:** Basic demographics (name, age, gender, zipcode)

**Page 2:** Personality Assessment (6 questions)
- Measures Big Five traits via TIPI (Ten Item Personality Inventory)
- Calculates extraversion, conscientiousness, openness scores

**Page 3:** Social Connection (3 questions)
- Close friends count, loneliness frequency, social satisfaction
- Generates composite "social need score" (0-50)

**Page 4:** Core Motivation (6 questions)
- Based on Situational Motivation Scale
- Measures intrinsic, social, and achievement motivations

**Page 5:** Interest Categories
- User selects broad categories (Sports, Arts, Food, etc.)

**Page 6:** Specific Interests
- Auto-selects all interests in chosen categories
- User unchecks what they don't want (faster UX)

**Page 7:** Activity Preferences
- Free time, travel distance, setting preferences

### 2. Score Interpretation

**Personality Dimensions** (2-14 range):
```
Extraversion < 7     → Introverted (small groups)
Extraversion 7-10    → Ambivert (flexible)
Extraversion > 10    → Extraverted (large groups)

Conscientiousness < 7  → Spontaneous (flexible schedules)
Conscientiousness > 10 → Organized (structured programs)

Openness > 10        → Very open (novel experiences)
```

**Social Need Score** (0-50 range):
```javascript
score = (loneliness × 2) + (15 - closeFriends) + ((8 - socialSatisfaction) × 1.5)

Score 0-15   → Low need (focus on activities)
Score 16-30  → Medium need (balance)
Score 31-50  → High need (prioritize community)
```

**Dominant Motivation:**
- Highest score among intrinsic, social, and achievement
- Determines messaging and event emphasis

### 3. Conceptual Recommendation Generation

The system generates personalized conceptual activity recommendations using GPT-4:

- **Interpreted personality** ("INTROVERTED, HIGHLY ORGANIZED, VERY OPEN")
- **Social situation** with emphasis level
- **Prioritized recommendations** (ordered by user's specific needs)
- **Activity type balance** (50% recurring organizations/groups, 50% one-time events)
- **Urban and social focus** (all activities done with other people)
- **Comprehensive explanations** covering interest alignment, personality fit, motivation match, social needs, and practical fit

### 4. AI-Powered Concept Generation

GPT-4 uses the user profile to:
- Generate idealized activity concepts that match personality, interests, and motivations
- Provide detailed explanations of why each concept fits the user
- Balance activity types (recurring for relationships, one-time for variety)
- Focus on urban, social, group-oriented activities

### 5. Display Recommendations

Beautiful card-based UI showing:
- Activity concept name and type badge (RECURRING/ONE-TIME)
- Why it matches (comprehensive personalized explanation)
- Location context
- Note that these are conceptual recommendations to use as inspiration

---

## 🛠 Tech Stack

### Frontend
- **HTML5/CSS3** - Semantic markup and modern styling
- **JavaScript (ES6+)** - Dynamic form handling and prompt generation
- **Google Fonts** - Montserrat (headers) + DM Sans (body)
- **Responsive Design** - Mobile-first approach

### Backend
- **Airtable** - User profile storage, survey responses, recommendations
- **OpenAI GPT-4** - Conceptual recommendation generation
- **Node.js/Express** - API server

### Design System
- **Colors:** Orange gradient (#FF8C42 → #FFA566), warm neutral background
- **Typography:** Montserrat (bold, confident headers) + DM Sans (readable body)
- **Components:** Cards, badges, buttons with hover states
- **Layout:** CSS Grid for recommendations, Flexbox for forms

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/empowersocialapp/Empower-Social-2.git
cd Empower-Social-2
```

2. **Set up backend**
```bash
cd backend
npm install
# Create .env file with API keys (see docs/QUICK_API_SETUP.md)
npm start
```

3. **Open the survey**
```bash
# Frontend runs on local server (port 8081)
# Or open directly in browser:
open frontend/survey/intake-survey.html
```

4. **Test the survey**
- Fill out all 7 pages
- Click Submit
- View recommendations on the results page

### File Overview

```
Empower-Social/
├── backend/                    # Node.js + Express API server
│   ├── server.js              # Main server file
│   ├── routes/                # API route handlers
│   ├── services/              # Airtable & OpenAI integrations
│   └── scripts/               # Utility scripts
├── frontend/                   # HTML/CSS/JavaScript frontend
│   ├── survey/                # Intake survey
│   ├── profile/               # Login & recommendations pages
│   └── assets/                # CSS & JavaScript files
├── docs/                       # Documentation
└── tests/                      # Test files
```

---

## 📁 File Structure

### `frontend/survey/intake-survey.html`
Complete 7-page survey with:
- Form validation
- Score calculation
- Dynamic prompt generation
- Modular interest system
- Responsive design
- Edit mode support (pre-fills existing data)

**Key Functions:**
- `generateBroadCategories()` - Renders interest categories from config
- `generateSpecificInterests()` - Shows selected category details
- `loadExistingSurveyData()` - Loads user data for editing
- Form submission with edit/new mode detection

### `frontend/profile/recommendations.html`
Recommendations display page showing:
- Card-based recommendation layout
- Personalized explanations
- Regenerate recommendations button
- Edit survey button
- User profile information

### `backend/server.js`
Express.js API server with:
- Survey submission endpoint
- Recommendations fetching/regeneration
- User authentication
- Airtable integration
- OpenAI GPT-4 integration

### Documentation Files
- `docs/EMPOWER_SYSTEM_GUIDE.md` - Comprehensive technical documentation
- `docs/QUICK_API_SETUP.md` - Quick setup guide for API keys
- `docs/AIRTABLE_SETUP_GUIDE.md` - Airtable database setup
- `CURSOR_CONTEXT.md` - Project context for AI assistants

---

## 🗺 Roadmap

### Phase 1: MVP (Current) ✅
- [x] Survey design and implementation
- [x] Score calculation logic
- [x] GPT prompt generation
- [x] UI/UX design
- [x] Database integration (Airtable)
- [x] OpenAI GPT-4 integration
- [x] Recommendations display page
- [x] User authentication (login)
- [x] Survey editing functionality

### Phase 2: Core Features (In Progress)
- [x] User profile management
- [x] Recommendation regeneration
- [ ] Save/bookmark recommendations
- [ ] User dashboard
- [ ] Feedback system

### Phase 3: Enhancement
- [ ] Refresh recommendations (get new matches anytime)
- [ ] Event attendance tracking
- [ ] Social connections (friend system)
- [ ] Event organizer partnerships
- [ ] Mobile app (React Native)

### Phase 4: Scale
- [ ] Multiple city support
- [ ] Event organizer dashboard
- [ ] Analytics and insights
- [ ] Premium features
- [ ] Social impact metrics

---

## 🧪 Development & Testing

### Testing the System
1. Start backend server: `cd backend && npm start`
2. Open `frontend/survey/intake-survey.html` in browser
3. Fill out all 7 pages with realistic data
4. Submit survey and verify:
   - User created in Airtable
   - Survey response saved
   - Recommendations generated
   - Recommendations displayed on results page
5. Test edit mode:
   - Login with username
   - Click "Edit Survey"
   - Modify data and resubmit
   - Verify new recommendations generated

### Modifying Interests
Edit the `interestCategories` object in the JavaScript:

```javascript
const interestCategories = {
    // Add new category
    newCategory: {
        label: "New Category Name",
        icon: "🎯",
        subInterests: [
            { id: "item-1", label: "First Item" },
            { id: "item-2", label: "Second Item" }
        ]
    },
    // Remove or edit existing categories
};
```

### Viewing Recommendations
1. Complete the survey or login with existing username
2. View recommendations on `frontend/profile/recommendations.html`
3. See personalized recommendation cards with:
   - Activity concepts and types
   - Detailed explanations
   - Regenerate option
   - Edit survey option

---

## 📊 Data Privacy

Empower takes user privacy seriously:

- ✅ **Secure storage** - User data stored in Airtable (encrypted at rest)
- ✅ **Transparent scoring** - All calculations visible and verifiable
- ✅ **User control** - Users can edit their profiles anytime
- 🔄 **Future:** User data export and deletion options
- 🔄 **Future:** GDPR and CCPA compliance

---

## 👥 Team

**Empower Social**

**Contact:** 
- Email: your.email@example.com
- Website: [Coming Soon]

---

## 🙏 Acknowledgments

- **Psychology Frameworks:** 
  - TIPI (Ten Item Personality Inventory) - Gosling et al., 2003
  - Situational Motivation Scale - Guay et al., 2000
  - Big Five Personality Theory

- **Design Inspiration:**
  - Meetup.com (community focus)
  - Airbnb Experiences (discovery flow)
  - Spotify (personalization approach)

- **Typography:**
  - Montserrat by Julieta Ulanovsky
  - DM Sans by Colophon Foundry

---

## 📈 Project Status

**Current Version:** 1.0.0 (MVP - Survey Complete)

**Last Updated:** November 17, 2025

**Status:** 🟡 In Active Development

---

## 🌟 Why Empower?

> "We don't just match interests—we match people to the experiences that will truly enrich their lives."

Traditional event platforms show you *what's happening*. Empower shows you *what's right for you*.

- **For the introvert:** Small group hiking clubs, not massive festivals
- **For the lonely:** Recurring communities that build friendships
- **For the achievement-oriented:** Skill-building workshops, not just "hang out" meetups
- **For the spontaneous:** Drop-in activities, not 8-week commitments

**Join us in building a platform that helps people find their people and live fuller lives.**

---

## 📞 Get In Touch

Interested in Empower? Reach out!

- **Email:** your.email@example.com
- **Website:** [Coming Soon]

---

<div align="center">

**Empower: Less Scrolling. More Living.** 🌟

© 2025 Empower Social. All rights reserved.

</div>
