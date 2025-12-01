# Empower Social 🌟

> **Less Scrolling. More Living.**

A personalized event recommendation engine that uses psychology-backed assessments to match users with meaningful real-world activities and communities.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Status](https://img.shields.io/badge/status-active-green)
![Deployment](https://img.shields.io/badge/deployment-AWS%20Amplify-blue)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Key Documentation](#key-documentation)
- [Recent Updates](#recent-updates)
- [Development](#development)

---

## 🎯 Overview

**Empower Social** is a web application that helps people find events, activities, and communities that match their personality, motivations, and social needs—not just their interests. By combining validated psychological assessments (TIPI for Big Five traits, Situational Motivation Scale) with AI-powered recommendation generation, Empower provides personalized suggestions that truly resonate.

### How It Works

1. **User completes a 7-page intake survey** (~5 minutes)
   - Demographics and location
   - Personality assessment (Big Five traits)
   - Social connection metrics
   - Core motivations
   - Interest categories and specific activities
   - Activity preferences and affinity groups

2. **Backend processes and calculates scores**
   - Personality dimensions (Extraversion, Conscientiousness, Openness)
   - Social need scoring (prioritizes community for isolated users)
   - Motivation factors (Intrinsic, Social, Achievement)

3. **AI generates personalized recommendations**
   - GPT-4-turbo creates conceptual activity recommendations
   - Recommendations consider personality fit, social needs, motivations, and practical constraints
   - Cached for performance, regenerated on profile updates

4. **User views and manages recommendations**
   - Card-based display with personalized explanations
   - Ability to regenerate recommendations
   - Edit profile/survey to update preferences

---

## ✨ Features

### Core Functionality ✅

- **Comprehensive intake survey** (7 pages, ~5 minutes)
- **Psychology-backed assessments**
  - TIPI (Ten-Item Personality Inventory) for Big Five traits
  - Situational Motivation Scale for core motivations
- **Smart score calculation** (automated via Airtable formulas)
- **AI-powered recommendations** (GPT-4-turbo with personalized prompts)
- **User authentication** (email-based login for returning users)
- **Profile editing** (update survey responses and regenerate recommendations)
- **Recommendation regeneration** (bypasses cache for fresh results)
- **Responsive design** (mobile-friendly UI)

### Data Management ✅

- **Airtable integration** (cloud-based database)
  - Users table
  - Survey_Responses table
  - Calculated_Scores table (formula fields)
  - GPT_Prompts table (audit trail)
- **Data validation** (frontend and backend)
- **Empty field handling** (proper cleanup for optional fields)
- **Multi-select field support** (interests, affinity groups)

### Code Quality ✅

- **ESLint configuration** (code style enforcement)
- **Pre-commit hooks** (Husky for linting before commits)
- **Error handling** (comprehensive try-catch blocks)
- **Logging** (structured error and info logs)

---

## 🛠 Tech Stack

### Frontend
- **Vanilla HTML/CSS/JavaScript** (no frameworks)
- **Responsive CSS** (mobile-first design)
- **Modern typography** (Montserrat + DM Sans)

### Backend
- **Node.js** (v14+)
- **Express.js** (RESTful API)
- **Airtable API** (database)
- **OpenAI API** (GPT-4-turbo for recommendations)

### Database
- **Airtable** (cloud-based relational database)
  - Linked records for relationships
  - Formula fields for automatic calculations
  - Lookup fields for data aggregation

### Deployment
- **AWS Amplify** (hosting and auto-deployment)
- **GitHub** (version control and CI/CD)

### Development Tools
- **ESLint** (code linting)
- **Husky** (Git hooks)
- **npm** (package management)

---

## 📁 Project Structure

```
Empower-Social/
├── backend/
│   ├── routes/
│   │   ├── login.js              # User authentication
│   │   ├── recommendations.js    # Recommendation endpoints
│   │   └── survey.js             # Survey submission/retrieval
│   ├── services/
│   │   ├── airtable.js           # Airtable database operations
│   │   ├── openai-conceptual.js  # GPT prompt generation
│   │   ├── recommendations-v2.js # Recommendation generation logic
│   │   └── events.js             # Event-related utilities
│   ├── scripts/                  # Utility scripts
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── assets/
│   │   ├── css/                  # Stylesheets
│   │   └── js/
│   │       └── recommendations.js # Frontend recommendation logic
│   ├── profile/
│   │   ├── login.html            # Login page
│   │   └── recommendations.html  # Recommendations display
│   ├── survey/
│   │   └── intake-survey.html    # Main survey form
│   ├── config.js                 # Frontend configuration
│   └── index.html                # Landing page
│
├── docs/
│   ├── SURVEY_FIELDS_REFERENCE.md    # Complete survey field documentation
│   ├── GPT_PROMPT_TEMPLATE.md        # GPT prompt structure
│   ├── AIRTABLE_SETUP_GUIDE.md       # Database setup instructions
│   ├── API_SETUP_GUIDE.md            # API key configuration
│   ├── AMPLIFY_SETUP.md              # Deployment guide
│   └── ... (other documentation)
│
├── package.json                  # Root package.json (ESLint, Husky)
├── .eslintrc.json               # ESLint configuration
├── .husky/                      # Git hooks
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Airtable account and API key
- OpenAI API key
- AWS Amplify account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/empowersocialapp/Empower-Social-2.git
   cd Empower-Social
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install root dependencies** (for ESLint/Husky)
   ```bash
   cd ..
   npm install
   ```

4. **Set up environment variables**
   
   Create `backend/.env` file:
   ```env
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_base_id
   OPENAI_API_KEY=your_openai_api_key
   PORT=3000
   ```

5. **Set up Airtable database**
   
   See `docs/AIRTABLE_SETUP_GUIDE.md` for detailed instructions on:
   - Creating tables (Users, Survey_Responses, Calculated_Scores, GPT_Prompts)
   - Setting up fields and formulas
   - Configuring linked records

6. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

7. **Open the frontend**
   
   Open `frontend/index.html` in your browser, or serve it via a local server:
   ```bash
   # Using Python
   cd frontend
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server frontend -p 8000
   ```

### Configuration

- **Frontend API endpoint**: Edit `frontend/config.js` to point to your backend URL
- **Backend CORS**: Configure in `backend/server.js` if needed
- **Airtable field names**: Must match exactly as specified in `docs/SURVEY_FIELDS_REFERENCE.md`

---

## 📚 Key Documentation

### For Developers

- **[Survey Fields Reference](docs/SURVEY_FIELDS_REFERENCE.md)** - Complete technical specification of all survey fields, calculations, and data handling
- **[GPT Prompt Template](docs/GPT_PROMPT_TEMPLATE.md)** - Structure and examples of GPT prompts used for recommendations
- **[Airtable Setup Guide](docs/AIRTABLE_SETUP_GUIDE.md)** - Step-by-step database setup instructions
- **[API Setup Guide](docs/API_SETUP_GUIDE.md)** - Configuration for Airtable and OpenAI APIs
- **[Amplify Setup](docs/AMPLIFY_SETUP.md)** - Deployment instructions for AWS Amplify

### For Understanding the System

- **[Empower System Guide](docs/EMPOWER_SYSTEM_GUIDE.md)** - High-level overview of how the system works
- **[Cursor Context](CURSOR_CONTEXT.md)** - Project context for AI assistants
- **[Backend Verification](BACKEND_VERIFICATION.md)** - Backend testing and verification

---

## 🔄 Recent Updates

### November 2025

- ✅ **Fixed recommendation caching** - Recommendations now properly regenerate when users edit their profiles
- ✅ **Fixed data saving issues** - Close friends count, free time, travel distance, and affinity selections now save correctly
- ✅ **Fixed interests auto-select** - Interests no longer reset to all selected when editing survey
- ✅ **Improved navigation** - Standardized all navigation paths to use absolute paths for AWS Amplify compatibility
- ✅ **Fixed JavaScript errors** - Converted inline `onclick` handlers to event listeners, fixed syntax errors
- ✅ **Added code quality tools** - ESLint configuration and pre-commit hooks (Husky)
- ✅ **Created comprehensive documentation** - Survey fields reference document for technical specifications

### Key Bug Fixes

- **Cache invalidation**: Recommendations now bypass cache on regenerate/edit
- **Empty field handling**: Proper cleanup of empty strings and arrays
- **Multi-select preservation**: Empty arrays preserved for Airtable multi-select fields
- **Event listener migration**: All buttons now use event listeners instead of inline handlers
- **Path standardization**: All navigation uses absolute paths (`/path/to/file.html`)

---

## 💻 Development

### Code Style

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes preferred
- **Trailing spaces**: Not allowed
- **ESLint**: Run `npm run lint` to check, `npm run lint:fix` to auto-fix

### Git Workflow

- Pre-commit hook runs ESLint automatically
- Commit messages should be descriptive
- Push to `main` branch triggers AWS Amplify deployment

### Testing

1. **Test survey submission**: Fill out all 7 pages and verify data saves correctly
2. **Test recommendation generation**: Verify recommendations appear after submission
3. **Test profile editing**: Edit survey and verify recommendations regenerate
4. **Test login**: Use email to login as returning user
5. **Test empty fields**: Submit survey with optional fields empty

### Debugging

- **Backend logs**: Check `backend.log` or console output
- **Frontend console**: Check browser developer console for JavaScript errors
- **Airtable**: Verify records are created correctly in Airtable UI
- **API responses**: Check network tab in browser dev tools

---

## 📝 License

See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is a private repository. For questions or issues, contact the project maintainer.

---

## 📧 Support

For technical questions or issues:
- Check the documentation in the `docs/` folder
- Review `docs/SURVEY_FIELDS_REFERENCE.md` for data handling questions
- Check `docs/GPT_PROMPT_TEMPLATE.md` for recommendation generation questions

---

**Last Updated**: November 2025  
**Version**: 1.0.0

