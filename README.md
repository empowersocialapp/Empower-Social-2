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

### Coming Soon
- 🔄 **Database integration** (Airtable/Supabase)
- 🔄 **Custom GPT API connection** (automated recommendations)
- 🔄 **Recommendation display** (card-based with images and match scores)
- 🔄 **User authentication** (save profiles, track history)
- 🔄 **Save/share functionality** (bookmark events)
- 🔄 **Refresh recommendations** (get new suggestions anytime)

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

### 3. Prompt Generation

The system generates a personalized GPT prompt including:

- **Dynamic date range** (always next 30 days from today)
- **Interpreted personality** ("INTROVERTED, HIGHLY ORGANIZED, VERY OPEN")
- **Social situation** with emphasis level
- **Prioritized recommendations** (ordered by user's specific needs)
- **Event source requirements** (Meetup, leagues, studios, etc.)
- **Balance requirement** (50% recurring, 50% one-time)

### 4. AI-Powered Matching

The Custom GPT uses the prompt to:
- Search local events within date range and distance
- Score events based on personality fit, social needs, motivation alignment
- Balance event types (recurring for relationships, one-time for variety)
- Provide match reasoning specific to the user's profile

### 5. Display Recommendations

Beautiful card-based UI showing:
- Event image and type badge (RECURRING/ONE-TIME)
- Match score (0-100%)
- Schedule, location, cost, group size
- Why it's a match (2-3 personalized reasons)
- Newcomer-friendly and other badges
- Registration/sign-up links

---

## 🛠 Tech Stack

### Frontend
- **HTML5/CSS3** - Semantic markup and modern styling
- **JavaScript (ES6+)** - Dynamic form handling and prompt generation
- **Google Fonts** - Montserrat (headers) + DM Sans (body)
- **Responsive Design** - Mobile-first approach

### Planned Backend
- **Airtable/Supabase** - User profile storage
- **OpenAI GPT-4** - Event recommendation engine
- **Custom GPT API** - Personalized prompt processing

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
git clone https://github.com/empowersocialapp/Empower-Social.git
cd Empower-Social
```

2. **Open the survey**
```bash
# Simply open the HTML file in your browser
open intake-survey.html
# or on Windows
start intake-survey.html
```

3. **Test the survey**
- Fill out all 7 pages
- Click Submit
- Open browser console (F12) to see generated GPT prompt

### File Overview

```
Empower-Social/
├── intake-survey.html          # Main survey application
├── recommendations-mockup.html # Visual mockup of recommendations display
├── README.md                   # This file
├── EMPOWER_SYSTEM_GUIDE.md    # Detailed technical documentation
└── assets/                     # (Future: images, icons)
```

---

## 📁 File Structure

### `intake-survey.html`
Complete 7-page survey with:
- Form validation
- Score calculation
- Dynamic prompt generation
- Modular interest system
- Responsive design

**Key Functions:**
- `generateBroadCategories()` - Renders interest categories from config
- `generateSpecificInterests()` - Shows selected category details
- `generatePersonalizedGPTPrompt()` - Creates custom AI prompt
- `calculateEventMatchScore()` - (Future) Scores events

### `recommendations-mockup.html`
Visual mockup showing:
- Card-based event layout
- Match scores and badges
- Reasoning for matches
- Sign-up buttons
- Save functionality

### `EMPOWER_SYSTEM_GUIDE.md`
Comprehensive technical documentation:
- Step-by-step flow explanation
- Score interpretation formulas
- GPT prompt structure
- API integration guide
- Database schema

---

## 🗺 Roadmap

### Phase 1: MVP (Current)
- [x] Survey design and implementation
- [x] Score calculation logic
- [x] GPT prompt generation
- [x] UI/UX design
- [ ] Database integration (Airtable)
- [ ] Custom GPT setup and testing

### Phase 2: Core Features
- [ ] User authentication (sign up/login)
- [ ] GPT API integration
- [ ] Recommendations display page
- [ ] Save/bookmark events
- [ ] User dashboard

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

### Testing the Survey
1. Open `intake-survey.html` in browser
2. Fill out all 7 pages with realistic data
3. Check browser console (F12) after submission
4. Verify:
   - All scores calculated correctly
   - Personality interpretation accurate
   - Social need score makes sense
   - GPT prompt includes all data
   - Date range is dynamic (next 30 days)

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

### Viewing the Mockup
1. Open `recommendations-mockup.html` in browser
2. See example event cards with:
   - Match scores and badges
   - Personalized reasoning
   - Images and metadata
   - Interactive buttons

---

## 📊 Data Privacy

Empower takes user privacy seriously:

- ✅ **No data collection** in current version (all client-side)
- ✅ **Transparent scoring** (all calculations visible in console)
- 🔄 **Future:** Encrypted storage and secure authentication
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

**Last Updated:** November 12, 2025

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
