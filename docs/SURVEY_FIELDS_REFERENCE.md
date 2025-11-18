# Empower Social - Survey Fields, Calculations & Data Handling
## Technical Reference for Building a Similar System

**Version:** 1.0  
**Last Updated:** November 2025  
**Purpose:** Complete technical specification of survey fields, calculations, and data processing logic

---

## Table of Contents

1. [Survey Field Overview](#survey-field-overview)
2. [Data Collection (Frontend)](#data-collection-frontend)
3. [Data Processing & Transformations](#data-processing--transformations)
4. [Calculation Formulas](#calculation-formulas)
5. [Airtable Field Mappings](#airtable-field-mappings)
6. [Validation Rules](#validation-rules)
7. [Special Handling & Edge Cases](#special-handling--edge-cases)

---

## Survey Field Overview

### 1. User Demographics

| Field | Type | Frontend ID | Scale/Options | Required | Notes |
|-------|------|-------------|---------------|----------|-------|
| `name` | String | `firstName` | Text input | Yes | Trimmed, min 1 char |
| `username` | String | `username` | Text input | Yes | Min 3 chars, max 20, alphanumeric + underscore/hyphen |
| `email` | String | `email` | Email input | Yes | Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| `age` | Number | `age` | Number input | Yes | Range: 1-120 |
| `gender` | String | `gender` | Select | Yes | Options: `male`, `female`, `non-binary`, `prefer-not-to-say`, `other` |
| `zipcode` | String | `zipcode` | Text input | Yes | Exactly 5 digits (regex: `/^\d{5}$/`) |

### 2. Personality Assessment (Big Five - TIPI)

**Scale:** 1-7 (Likert scale)  
**Questions:** 6 items measuring 3 dimensions

| Question | Field | Dimension | Reverse Scored? | Airtable Field |
|----------|-------|------------|-----------------|----------------|
| Q1: "I see myself as extraverted, enthusiastic" | `q1` | Extraversion | No | `Q1_Extraverted_Enthusiastic` |
| Q6: "I see myself as reserved, quiet" | `q6` | Extraversion | **Yes** (8 - value) | `Q6_Reserved_Quiet` |
| Q3: "I see myself as dependable, self-disciplined" | `q3` | Conscientiousness | No | `Q3_Dependable_Disciplined` |
| Q8: "I see myself as disorganized, careless" | `q8` | Conscientiousness | **Yes** (8 - value) | `Q8_Disorganized_Careless` |
| Q5: "I see myself as open to new experiences, complex" | `q5` | Openness | No | `Q5_Open_Complex` |
| Q10: "I see myself as conventional, uncreative" | `q10` | Openness | **Yes** (8 - value) | `Q10_Conventional_Uncreative` |

**Data Structure:**
```javascript
personality: {
  q1: 1-7,
  q6: 1-7,  // Reverse scored
  q3: 1-7,
  q8: 1-7,  // Reverse scored
  q5: 1-7,
  q10: 1-7  // Reverse scored
}
```

### 3. Motivation Assessment (Self-Determination Theory)

**Scale:** 1-5 (Likert scale)  
**Questions:** 6 items measuring 3 dimensions

| Question | Field | Dimension | Airtable Field |
|----------|-------|------------|----------------|
| M1: "Because I think it would be enjoyable" | `m1` | Intrinsic | `M1_Enjoyable_Fun` |
| M4: "Because I would feel energized and engaged" | `m4` | Intrinsic | `M4_Energized_Engaged` |
| M2: "Because I want to spend time with people" | `m2` | Social | `M2_Time_With_People` |
| M5: "Because I want to meet new people" | `m5` | Social | `M5_Meet_New_People` |
| M3: "Because I want to develop my skills" | `m3` | Achievement | `M3_Develop_Skills` |
| M6: "Because I want to challenge myself" | `m6` | Achievement | `M6_Challenge_Myself` |

**Data Structure:**
```javascript
motivation: {
  m1: 1-5,
  m2: 1-5,
  m3: 1-5,
  m4: 1-5,
  m5: 1-5,
  m6: 1-5
}
```

### 4. Social Connection Data

| Field | Type | Frontend ID | Scale/Options | Airtable Field | Notes |
|-------|------|-------------|---------------|----------------|-------|
| `closeFriends` | String | `closeFriends` | Number input → Mapped to ranges | `Close_Friends_Count` | See mapping below |
| `satisfaction` | String | `socialSatisfaction` | 1-7 → Mapped to labels | `Social_Satisfaction` | See mapping below |
| `loneliness` | String | `loneliness` | 1-5 → Mapped to labels | `Loneliness_Frequency` | See mapping below |
| `lookingFor` | Array | N/A | Multi-select (currently empty) | `Looking_For` | Future feature |

**Data Structure:**
```javascript
social: {
  closeFriends: "0-2" | "3-5" | "6-10" | "10+",
  satisfaction: "Very Dissatisfied" | "Dissatisfied" | "Somewhat Dissatisfied" | "Neutral" | "Somewhat Satisfied" | "Satisfied" | "Very Satisfied",
  loneliness: "Never (1)" | "Rarely (2)" | "Sometimes (3)" | "Often (4)" | "Always (5)",
  lookingFor: [] // Currently empty array
}
```

### 5. Interests

| Field | Type | Frontend | Airtable Field | Notes |
|-------|------|----------|----------------|-------|
| `categories` | Array | Checkboxes `name="categories"` | `Interest_Categories` | Multi-select, mapped to labels |
| `specific` | String | Checkboxes `name="interests"` | `Specific_Interests` | Comma-separated string |

**Interest Categories (Frontend → Airtable Mapping):**
```javascript
const categoryLabelMap = {
  'sports': 'Sports & Fitness',
  'arts': 'Arts & Culture',
  'food': 'Food & Dining',
  'social': 'Social & Networking',
  'learning': 'Learning & Education',
  'outdoor': 'Outdoor & Nature',
  'games': 'Technology & Gaming',
  'community': 'Community & Volunteering',
  'wellness': 'Health & Wellness',
  'music': 'Music & Entertainment'
};
```

**Data Structure:**
```javascript
interests: {
  categories: ['sports', 'arts', 'outdoor'],  // Frontend keys
  specific: 'yoga, hiking, meditation, photography'  // Comma-separated string
}
```

### 6. Activity Preferences

| Field | Type | Frontend | Airtable Field | Notes |
|-------|------|----------|----------------|-------|
| `freeTime` | String | Select dropdown | `Free_Time_Per_Week` | Mapped from frontend values |
| `travelDistance` | String | Select dropdown | `Travel_Distance_Willing` | Mapped from frontend values |
| `indoor` | Boolean | Checkbox | `Pref_Indoor` | Default: `false` |
| `outdoor` | Boolean | Checkbox | `Pref_Outdoor` | Default: `false` |
| `physical` | Boolean | Checkbox | `Pref_Physical_Active` | Default: `false` |
| `relaxed` | Boolean | Checkbox | `Pref_Relaxed_Lowkey` | Default: `false` |
| `structured` | Boolean | Checkbox | `Pref_Structured` | Default: `false` |
| `spontaneous` | Boolean | Checkbox | `Pref_Spontaneous` | Default: `false` |

**Free Time Mapping:**
```javascript
const freeTimeMap = {
  '<5': 'Less than 5 hours',
  '5-10': '5-10 hours',
  '10-20': '10-20 hours',
  '>20': 'More than 20 hours'
};
```

**Travel Distance Mapping:**
```javascript
const travelDistanceMap = {
  '<1': 'Less than 1 mile',
  '1-5': '1-5 miles',
  '5-15': '5-15 miles',
  '15+': '15+ miles'
};
```

**Data Structure:**
```javascript
preferences: {
  freeTime: 'Less than 5 hours' | '5-10 hours' | '10-20 hours' | 'More than 20 hours',
  travelDistance: 'Less than 1 mile' | '1-5 miles' | '5-15 miles' | '15+ miles',
  indoor: boolean,
  outdoor: boolean,
  physical: boolean,
  relaxed: boolean,
  structured: boolean,
  spontaneous: boolean
}
```

### 7. Affinity Groups

**6 categories, each is a multi-select array:**

| Category | Frontend Key | Airtable Field | Options Mapping |
|----------|--------------|----------------|-----------------|
| Faith-Based | `faith` | `Affinity_Faith_Based` | See mapping below |
| LGBTQ+ | `lgbtq` | `Affinity_LGBTQ` | See mapping below |
| Cultural/Ethnic | `cultural` | `Affinity_Cultural_Ethnic` | See mapping below |
| Women's | `womens` | `Affinity_Womens` | See mapping below |
| Young Professionals | `youngProf` | `Affinity_Young_Prof` | See mapping below |
| International | `international` | `Affinity_International` | See mapping below |

**Data Structure:**
```javascript
affinityGroups: {
  faith: ['christian-protestant', 'catholic', ...],  // Frontend values
  lgbtq: ['gay-men', 'lesbian', ...],
  cultural: ['african-american', 'asian-american', ...],
  womens: ['professional-women', 'moms', ...],
  youngProf: ['general-young-prof', 'young-prof-20s', ...],
  international: ['general-international', 'recent-immigrants', ...]
}
```

---

## Data Collection (Frontend)

### Frontend Form Submission Structure

```javascript
const surveyData = {
  // Demographics
  name: string,           // From: document.getElementById('firstName').value.trim()
  username: string,       // From: document.getElementById('username').value.trim()
  email: string,         // From: document.getElementById('email').value.trim()
  age: number,           // From: parseInt(document.getElementById('age').value)
  gender: string,        // From: document.getElementById('gender').value
  zipcode: string,       // From: document.getElementById('zipcode').value.trim()
  
  // Edit mode flags (if editing existing survey)
  userId: string | undefined,
  isEdit: boolean,
  
  // Personality (raw scores, 1-7)
  personality: {
    q1: number,  // parseInt(document.getElementById('q1')?.value) || 1
    q6: number,
    q3: number,
    q8: number,
    q5: number,
    q10: number
  },
  
  // Motivation (raw scores, 1-5)
  motivation: {
    m1: number,  // parseInt(document.getElementById('m1')?.value) || 1
    m2: number,
    m3: number,
    m4: number,
    m5: number,
    m6: number
  },
  
  // Social data
  social: {
    closeFriends: string,      // Raw number from input, will be mapped to range
    satisfaction: string,      // Format: "Neutral (4)" - number in parentheses
    loneliness: string,        // Format: "Very Often (5)" - label with number
    lookingFor: []             // Currently empty array
  },
  
  // Interests
  interests: {
    categories: string[],      // Array of frontend keys: ['sports', 'arts', ...]
    specific: string           // Comma-separated: 'yoga, hiking, meditation'
  },
  
  // Preferences
  preferences: {
    freeTime: string,         // Mapped value: 'Less than 5 hours', etc.
    travelDistance: string,   // Mapped value: 'Less than 1 mile', etc.
    indoor: boolean,
    outdoor: boolean,
    physical: boolean,
    relaxed: boolean,
    structured: boolean,
    spontaneous: boolean
  },
  
  // Affinity groups
  affinityGroups: {
    faith: string[],          // Array of frontend values
    lgbtq: string[],
    cultural: string[],
    womens: string[],
    youngProf: string[],
    international: string[]
  }
};
```

---

## Data Processing & Transformations

### 1. Close Friends Count Mapping

**Frontend Input:** Raw number (e.g., `2`, `5`, `12`)  
**Processing:**
```javascript
// Convert to number if string
let num = typeof closeFriendsCount === 'string' 
  ? parseInt(closeFriendsCount.trim()) 
  : closeFriendsCount;

// Map to ranges
if (num <= 2) {
  closeFriendsCount = '0-2';
} else if (num <= 5) {
  closeFriendsCount = '3-5';
} else if (num <= 10) {
  closeFriendsCount = '6-10';
} else {
  closeFriendsCount = '10+';
}
```

**Airtable Value:** `'0-2'` | `'3-5'` | `'6-10'` | `'10+'`

### 2. Social Satisfaction Mapping

**Frontend Input:** Number 1-7 or string like `"Neutral (4)"`  
**Processing:**
```javascript
// Extract number from string like "Neutral (4)" or parse as number
let satisfactionValue;
if (typeof socialSatisfaction === 'string') {
  const match = socialSatisfaction.match(/\((\d+)\)/);
  if (match) {
    satisfactionValue = parseInt(match[1]);
  } else {
    satisfactionValue = parseInt(socialSatisfaction);
  }
} else {
  satisfactionValue = parseInt(socialSatisfaction);
}

// Map 1-7 to labels
const satisfactionMap = {
  1: 'Very Dissatisfied',
  2: 'Dissatisfied',
  3: 'Somewhat Dissatisfied',
  4: 'Neutral',
  5: 'Somewhat Satisfied',
  6: 'Satisfied',
  7: 'Very Satisfied'
};
socialSatisfaction = satisfactionMap[satisfactionValue];
```

**Airtable Value:** `'Very Dissatisfied'` | `'Dissatisfied'` | `'Somewhat Dissatisfied'` | `'Neutral'` | `'Somewhat Satisfied'` | `'Satisfied'` | `'Very Satisfied'`

### 3. Loneliness Frequency Mapping

**Frontend Input:** String like `"Very Often (5)"` or number 1-5  
**Processing:**
```javascript
// Extract number from format like "Very Often (5)"
const match = lonelinessFrequency.match(/\((\d+)\)/);
if (match) {
  const value = parseInt(match[1]);
  const lonelinessMap = {
    1: 'Never (1)',
    2: 'Rarely (2)',
    3: 'Sometimes (3)',
    4: 'Often (4)',
    5: 'Always (5)'  // Note: Airtable uses "Always" not "Very Often"
  };
  lonelinessFrequency = lonelinessMap[value];
} else {
  // Fallback: map label
  const label = lonelinessFrequency.replace(/\s*\(\d+\)\s*$/, '').trim();
  const labelMap = {
    'Never': 'Never (1)',
    'Rarely': 'Rarely (2)',
    'Sometimes': 'Sometimes (3)',
    'Often': 'Often (4)',
    'Very Often': 'Always (5)',  // Map "Very Often" to "Always (5)"
    'Always': 'Always (5)'
  };
  lonelinessFrequency = labelMap[label] || lonelinessFrequency;
}
```

**Airtable Value:** `'Never (1)'` | `'Rarely (2)'` | `'Sometimes (3)'` | `'Often (4)'` | `'Always (5)'`

**Important:** Airtable expects `"Always (5)"` not `"Very Often (5)"` - the backend maps this automatically.

### 4. Interest Categories Mapping

**Frontend Input:** Array of keys: `['sports', 'arts', 'outdoor']`  
**Processing:**
```javascript
const categoryLabelMap = {
  'sports': 'Sports & Fitness',
  'arts': 'Arts & Culture',
  'food': 'Food & Dining',
  'social': 'Social & Networking',
  'learning': 'Learning & Education',
  'outdoor': 'Outdoor & Nature',
  'games': 'Technology & Gaming',
  'community': 'Community & Volunteering',
  'wellness': 'Health & Wellness',
  'music': 'Music & Entertainment'
};

const interestCategories = (interests?.categories || [])
  .filter(key => key && key.trim().length > 0)
  .map(key => categoryLabelMap[key] || key)
  .filter(label => label && label.trim().length > 0);
```

**Airtable Value:** Array of labels: `['Sports & Fitness', 'Arts & Culture', 'Outdoor & Nature']`

### 5. Affinity Groups Mapping

**Frontend Input:** Arrays of frontend values (e.g., `['christian-protestant', 'catholic']`)  
**Processing:** Each category has its own mapping function. See full mappings below.

**Faith-Based Mapping:**
```javascript
const faithMap = {
  'christian-protestant': 'Christian',
  'catholic': 'Catholic',
  'jewish': 'Jewish',
  'muslim': 'Muslim',
  'hindu': 'Hindu',
  'buddhist': 'Buddhist',
  'lds': 'Other faith',
  'spiritual': 'Spiritual (non-religious)',
  'atheist-agnostic': 'Atheist/Agnostic',
  'other-faith': 'Other faith'
};
```

**LGBTQ+ Mapping:**
```javascript
const lgbtqMap = {
  'gay-men': 'Gay men\'s communities',
  'lesbian': 'Lesbian communities',
  'bisexual': 'Bisexual/Pansexual communities',
  'transgender': 'Transgender communities',
  'queer-nonbinary': 'Queer/Non-binary communities',
  'general-lgbtq': 'General LGBTQ+ inclusive spaces'
};
```

**Cultural/Ethnic Mapping:**
```javascript
const culturalMap = {
  'african-american': 'African American',
  'asian-american': 'Asian American',
  'hispanic-latino': 'Hispanic/Latino',
  'middle-eastern': 'Middle Eastern',
  'native-american': 'Indigenous/Native American',
  'pacific-islander': 'Other',
  'jewish-cultural': 'Other',
  'multiracial': 'Multicultural',
  'international-students': 'International students',
  'other-cultural': 'Other'
};
```

**Women's Mapping:**
```javascript
const womensMap = {
  'professional-women': 'Professional women',
  'women-entrepreneurs': 'Women entrepreneurs',
  'moms': 'Moms/Parents',
  'women-40-plus': 'Women 40+',
  'women-in-stem': 'Women in STEM'
};
```

**Young Professionals Mapping:**
```javascript
const youngProfMap = {
  'general-young-prof': 'Young professionals (20s)',
  'young-prof-of-color': 'Young professionals (20s)',
  'lgbtq-young-prof': 'Young professionals (20s)',
  'women-in-business': 'Young professionals (20s)',
  'young-prof-20s': 'Young professionals (20s)',
  'young-prof-30s': 'Young professionals (30s)',
  'career-changers': 'Career changers',
  'recent-grads': 'Recent grads'
};
```

**International Mapping:**
```javascript
const internationalMap = {
  'general-international': 'International community',
  'recent-immigrants': 'Recent immigrants',
  'international-students': 'International students',
  'expats': 'Expats',
  'language-learners': 'Language learners'
};
```

**Airtable Value:** Arrays of mapped labels (e.g., `['Christian', 'Catholic']`)

### 6. Empty Value Cleanup

**Before sending to Airtable, all fields are cleaned:**

```javascript
// Remove undefined, null, empty string values
Object.keys(fields).forEach(key => {
  const value = fields[key];
  if (value === undefined || value === null || value === '') {
    delete fields[key];
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Keep empty arrays for multi-select fields (Airtable handles them)
      const multiSelectFields = [
        'Affinity_Faith_Based', 'Affinity_LGBTQ', 'Affinity_Cultural_Ethnic',
        'Affinity_Womens', 'Affinity_Young_Prof', 'Affinity_International',
        'Looking_For', 'Interest_Categories'
      ];
      if (!multiSelectFields.includes(key)) {
        delete fields[key];
      }
    } else if (value.every(v => !v || (typeof v === 'string' && v.trim().length === 0))) {
      // Remove arrays containing only empty strings
      delete fields[key];
    }
  }
});
```

**Important:** Multi-select fields can have empty arrays in Airtable, so they're preserved. Other empty arrays are removed.

---

## Calculation Formulas

### 1. Personality Scores (Big Five)

**Calculated in Airtable using formula fields:**

#### Extraversion
```
Extraversion_Raw = Q1 + (8 - Q6)
```
- **Range:** 2-14
- **Categories:**
  - Low: 2-6 → `"Low"`
  - Medium: 7-10 → `"Medium"`
  - High: 11-14 → `"High"`

#### Conscientiousness
```
Conscientiousness_Raw = Q3 + (8 - Q8)
```
- **Range:** 2-14
- **Categories:** Same as Extraversion

#### Openness
```
Openness_Raw = Q5 + (8 - Q10)
```
- **Range:** 2-14
- **Categories:** Same as Extraversion

**Airtable Formula Example:**
```javascript
// Extraversion_Category formula in Airtable:
IF({Extraversion_Raw} >= 11, "High", 
  IF({Extraversion_Raw} <= 6, "Low", "Medium"))
```

### 2. Motivation Scores

**Calculated in Airtable using formula fields:**

#### Intrinsic Motivation
```
Intrinsic_Motivation = (M1 + M4) / 2
```
- **Range:** 1-5
- **Interpretation:** Fun-seeking, enjoyment-focused

#### Social Motivation
```
Social_Motivation = (M2 + M5) / 2
```
- **Range:** 1-5
- **Interpretation:** Connection-seeking, relationship-focused

#### Achievement Motivation
```
Achievement_Motivation = (M3 + M6) / 2
```
- **Range:** 1-5
- **Interpretation:** Skill-building, challenge-focused

#### Primary Motivation
```
Primary_Motivation = Highest of (Intrinsic_Motivation, Social_Motivation, Achievement_Motivation)
```
- **Airtable Formula:**
```javascript
IF({Intrinsic_Motivation} >= {Social_Motivation} AND {Intrinsic_Motivation} >= {Achievement_Motivation}, "Intrinsic",
  IF({Social_Motivation} >= {Achievement_Motivation}, "Social", "Achievement"))
```

### 3. Social Need Score (Optional - Used in GPT Prompt)

**Calculated in backend/JavaScript (not stored in Airtable):**
```javascript
const socialNeedScore = 
  (lonelinessValue * 2) + 
  (15 - closeFriendsCount) + 
  ((8 - socialSatisfactionValue) * 1.5);
```

- **Range:** 0-50 (approximately)
- **Interpretation:**
  - 0-15: Low social need
  - 16-30: Medium social need
  - 31-50: High social need (prioritize community building)

**Example:**
- Loneliness: 4 (Often)
- Close Friends: 2
- Social Satisfaction: 3 (Somewhat Dissatisfied)
- Score: `(4 × 2) + (15 - 2) + ((8 - 3) × 1.5) = 8 + 13 + 7.5 = 28.5`

---

## Airtable Field Mappings

### Users Table

| Frontend Field | Airtable Field | Type | Notes |
|----------------|----------------|------|-------|
| `name` | `Name` | Single line text | |
| `username` | `Username` | Single line text | Unique |
| `email` | `Email` | Email | |
| `age` | `Age` | Number | |
| `gender` | `Gender` | Single select | Options: `male`, `female`, `non-binary`, `prefer-not-to-say`, `other` |
| `zipcode` | `Zipcode` | Single line text | 5 digits |

### Survey_Responses Table

| Frontend Field | Airtable Field | Type | Notes |
|----------------|----------------|------|-------|
| `personality.q1` | `Q1_Extraverted_Enthusiastic` | Number | 1-7 |
| `personality.q6` | `Q6_Reserved_Quiet` | Number | 1-7 (reverse scored in calculation) |
| `personality.q3` | `Q3_Dependable_Disciplined` | Number | 1-7 |
| `personality.q8` | `Q8_Disorganized_Careless` | Number | 1-7 (reverse scored in calculation) |
| `personality.q5` | `Q5_Open_Complex` | Number | 1-7 |
| `personality.q10` | `Q10_Conventional_Uncreative` | Number | 1-7 (reverse scored in calculation) |
| `motivation.m1` | `M1_Enjoyable_Fun` | Number | 1-5 |
| `motivation.m2` | `M2_Time_With_People` | Number | 1-5 |
| `motivation.m3` | `M3_Develop_Skills` | Number | 1-5 |
| `motivation.m4` | `M4_Energized_Engaged` | Number | 1-5 |
| `motivation.m5` | `M5_Meet_New_People` | Number | 1-5 |
| `motivation.m6` | `M6_Challenge_Myself` | Number | 1-5 |
| `social.closeFriends` (mapped) | `Close_Friends_Count` | Single select | Options: `0-2`, `3-5`, `6-10`, `10+` |
| `social.satisfaction` (mapped) | `Social_Satisfaction` | Single select | Options: `Very Dissatisfied`, `Dissatisfied`, `Somewhat Dissatisfied`, `Neutral`, `Somewhat Satisfied`, `Satisfied`, `Very Satisfied` |
| `social.loneliness` (mapped) | `Loneliness_Frequency` | Single select | Options: `Never (1)`, `Rarely (2)`, `Sometimes (3)`, `Often (4)`, `Always (5)` |
| `social.lookingFor` | `Looking_For` | Multiple select | Currently empty array |
| `interests.categories` (mapped) | `Interest_Categories` | Multiple select | Options: `Sports & Fitness`, `Arts & Culture`, `Food & Dining`, `Social & Networking`, `Learning & Education`, `Outdoor & Nature`, `Technology & Gaming`, `Community & Volunteering`, `Health & Wellness`, `Music & Entertainment` |
| `interests.specific` | `Specific_Interests` | Long text | Comma-separated string |
| `preferences.freeTime` (mapped) | `Free_Time_Per_Week` | Single select | Options: `Less than 5 hours`, `5-10 hours`, `10-20 hours`, `More than 20 hours` |
| `preferences.travelDistance` (mapped) | `Travel_Distance_Willing` | Single select | Options: `Less than 1 mile`, `1-5 miles`, `5-15 miles`, `15+ miles` |
| `preferences.indoor` | `Pref_Indoor` | Checkbox | Boolean |
| `preferences.outdoor` | `Pref_Outdoor` | Checkbox | Boolean |
| `preferences.physical` | `Pref_Physical_Active` | Checkbox | Boolean |
| `preferences.relaxed` | `Pref_Relaxed_Lowkey` | Checkbox | Boolean |
| `preferences.structured` | `Pref_Structured` | Checkbox | Boolean |
| `preferences.spontaneous` | `Pref_Spontaneous` | Checkbox | Boolean |
| `affinityGroups.faith` (mapped) | `Affinity_Faith_Based` | Multiple select | See affinity mappings above |
| `affinityGroups.lgbtq` (mapped) | `Affinity_LGBTQ` | Multiple select | See affinity mappings above |
| `affinityGroups.cultural` (mapped) | `Affinity_Cultural_Ethnic` | Multiple select | See affinity mappings above |
| `affinityGroups.womens` (mapped) | `Affinity_Womens` | Multiple select | See affinity mappings above |
| `affinityGroups.youngProf` (mapped) | `Affinity_Young_Prof` | Multiple select | See affinity mappings above |
| `affinityGroups.international` (mapped) | `Affinity_International` | Multiple select | See affinity mappings above |
| N/A | `User` | Link to Users | Created automatically |

### Calculated_Scores Table

| Field | Type | Formula/Calculation | Notes |
|-------|------|---------------------|-------|
| `User` | Link to Users | Manual link | |
| `Survey Response` | Link to Survey_Responses | Manual link | |
| `Extraversion_Raw` | Number | `Q1 + (8 - Q6)` | Formula field (lookup from Survey_Responses) |
| `Extraversion_Category` | Single select | `IF({Extraversion_Raw} >= 11, "High", IF({Extraversion_Raw} <= 6, "Low", "Medium"))` | Formula field |
| `Conscientiousness_Raw` | Number | `Q3 + (8 - Q8)` | Formula field |
| `Conscientiousness_Category` | Single select | `IF({Conscientiousness_Raw} >= 11, "High", IF({Conscientiousness_Raw} <= 6, "Low", "Medium"))` | Formula field |
| `Openness_Raw` | Number | `Q5 + (8 - Q10)` | Formula field |
| `Openness_Category` | Single select | `IF({Openness_Raw} >= 11, "High", IF({Openness_Raw} <= 6, "Low", "Medium"))` | Formula field |
| `Intrinsic_Motivation` | Number | `(M1 + M4) / 2` | Formula field |
| `Social_Motivation` | Number | `(M2 + M5) / 2` | Formula field |
| `Achievement_Motivation` | Number | `(M3 + M6) / 2` | Formula field |
| `Primary_Motivation` | Single select | Highest of three motivations | Formula field |

---

## Validation Rules

### Frontend Validation

```javascript
// Name: Required, non-empty string
if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
  return { valid: false, error: 'Name is required' };
}

// Username: Required, 3-20 chars, alphanumeric + underscore/hyphen
if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
  return { valid: false, error: 'Username is required (minimum 3 characters)' };
}
// Pattern: /^[a-zA-Z0-9_-]+$/

// Email: Required, valid email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
  return { valid: false, error: 'Valid email is required (format: name@domain.com)' };
}

// Age: Required, number, 1-120
if (!data.age || typeof data.age !== 'number' || data.age < 1 || data.age > 120) {
  return { valid: false, error: 'Valid age is required (1-120)' };
}

// Gender: Required, non-empty string
if (!data.gender || typeof data.gender !== 'string' || data.gender.trim().length === 0) {
  return { valid: false, error: 'Gender is required' };
}

// Zipcode: Required, exactly 5 digits
const zipcodeRegex = /^\d{5}$/;
if (!data.zipcode || typeof data.zipcode !== 'string' || !zipcodeRegex.test(data.zipcode.trim())) {
  return { valid: false, error: 'Valid zipcode is required (5 digits)' };
}

// Personality: All 6 questions required, 1-7 scale
const personalityQuestions = ['q1', 'q6', 'q3', 'q8', 'q5', 'q10'];
for (const q of personalityQuestions) {
  const score = data.personality[q];
  if (score === undefined || score === null || typeof score !== 'number' || score < 1 || score > 7) {
    return { valid: false, error: `Personality question ${q} must be a number between 1 and 7` };
  }
}

// Motivation: All 6 questions required, 1-5 scale
const motivationQuestions = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
for (const m of motivationQuestions) {
  const score = data.motivation[m];
  if (score === undefined || score === null || typeof score !== 'number' || score < 1 || score > 5) {
    return { valid: false, error: `Motivation question ${m} must be a number between 1 and 5` };
  }
}

// Interests: At least one category required
if (!data.interests || !data.interests.categories || !Array.isArray(data.interests.categories) || data.interests.categories.length === 0) {
  return { valid: false, error: 'Please select at least one interest category' };
}
```

---

## Special Handling & Edge Cases

### 1. Reverse Scoring

**Questions Q6, Q8, Q10 are reverse-scored:**
- Frontend collects: `q6 = 2` (user selected "2" for "reserved, quiet")
- Calculation: `8 - 2 = 6` (higher = more extraverted)
- **Why:** These questions are worded in the opposite direction

### 2. Empty String Handling

**Close Friends Count:**
- If empty string `""` → Set to `undefined` → Removed from Airtable fields
- If valid number → Mapped to range (`'0-2'`, `'3-5'`, etc.)

**Free Time & Travel Distance:**
- If empty string → Set to `undefined` → Removed from Airtable fields
- If valid value → Mapped to Airtable format

### 3. Multi-Select Field Empty Arrays

**Preserved for:**
- `Affinity_Faith_Based`
- `Affinity_LGBTQ`
- `Affinity_Cultural_Ethnic`
- `Affinity_Womens`
- `Affinity_Young_Prof`
- `Affinity_International`
- `Looking_For`
- `Interest_Categories`

**Removed for:** All other fields (if empty array)

### 4. Interest Categories Mapping

**Frontend keys must match exactly:**
- `'sports'` → `'Sports & Fitness'`
- `'arts'` → `'Arts & Culture'`
- etc.

**If key doesn't match:** Falls back to original key (may cause Airtable error if not a valid option)

### 5. Loneliness Frequency Special Case

**Frontend sends:** `"Very Often (5)"`  
**Airtable expects:** `"Always (5)"`  
**Backend maps:** `"Very Often"` → `"Always (5)"` automatically

### 6. Social Satisfaction Format

**Frontend sends:** `"Neutral (4)"` (label with number in parentheses)  
**Backend extracts:** Number `4` from parentheses  
**Backend maps:** `4` → `"Neutral"` (label without number)  
**Airtable stores:** `"Neutral"` (label only)

### 7. Specific Interests Format

**Frontend:** Array of checkbox values: `['yoga', 'hiking', 'meditation']`  
**Backend:** Joined to comma-separated string: `'yoga, hiking, meditation'`  
**Airtable:** Stored as long text field

### 8. Boolean Preferences

**Default value:** `false` if not checked  
**Airtable:** Checkbox field (true/false)

---

## Complete Data Flow Example

### 1. User Submits Survey

**Frontend collects:**
```javascript
{
  name: "Alex",
  age: 28,
  personality: { q1: 5, q6: 3, q3: 6, q8: 2, q5: 7, q10: 1 },
  social: { closeFriends: "4", satisfaction: "Neutral (4)", loneliness: "Often (4)" },
  interests: { categories: ["sports", "outdoor"], specific: ["yoga", "hiking"] }
}
```

### 2. Backend Processing

**Transformations:**
- `closeFriends: "4"` → `"3-5"`
- `satisfaction: "Neutral (4)"` → `"Neutral"`
- `loneliness: "Often (4)"` → `"Often (4)"` (no change needed)
- `categories: ["sports", "outdoor"]` → `["Sports & Fitness", "Outdoor & Nature"]`
- `specific: ["yoga", "hiking"]` → `"yoga, hiking"`

### 3. Airtable Storage

**Users Table:**
```
Name: "Alex"
Age: 28
...
```

**Survey_Responses Table:**
```
Q1_Extraverted_Enthusiastic: 5
Q6_Reserved_Quiet: 3
Close_Friends_Count: "3-5"
Social_Satisfaction: "Neutral"
Loneliness_Frequency: "Often (4)"
Interest_Categories: ["Sports & Fitness", "Outdoor & Nature"]
Specific_Interests: "yoga, hiking"
...
```

### 4. Calculated Scores (Airtable Formulas)

**Calculated_Scores Table:**
```
Extraversion_Raw: 5 + (8 - 3) = 10
Extraversion_Category: "Medium"
Conscientiousness_Raw: 6 + (8 - 2) = 12
Conscientiousness_Category: "High"
Openness_Raw: 7 + (8 - 1) = 14
Openness_Category: "High"
Intrinsic_Motivation: (M1 + M4) / 2
...
```

---

## Implementation Notes

### Key Files

1. **Frontend:** `frontend/survey/intake-survey.html`
   - Form collection logic (lines ~2200-2350)
   - Data formatting before submission

2. **Backend:** `backend/services/airtable.js`
   - Field mapping functions
   - Empty value cleanup
   - `createSurveyResponse()` and `updateSurveyResponse()` functions

3. **Backend:** `backend/routes/survey.js`
   - Validation logic
   - API endpoint: `POST /api/submit-survey`
   - API endpoint: `GET /api/survey/:userId`

4. **Airtable:** Calculated_Scores table
   - Formula fields for personality and motivation calculations

### Common Pitfalls

1. **Select Field Options Must Match Exactly**
   - Case-sensitive: `"Very Often"` ≠ `"very often"`
   - No extra spaces: `"Very Often"` ≠ `"Very Often "`
   - Punctuation matters: `"5-10 hours"` ≠ `"5 to 10 hours"`

2. **Empty Values**
   - Don't send `undefined`, `null`, or `""` to Airtable select fields
   - Use cleanup logic before sending

3. **Multi-Select Arrays**
   - Airtable accepts empty arrays `[]` for multi-select fields
   - Don't delete empty arrays for multi-select fields

4. **Reverse Scoring**
   - Remember Q6, Q8, Q10 are reverse-scored in calculations
   - Store raw values in Airtable, calculate in formula fields

5. **Interest Categories**
   - Frontend uses keys (`'sports'`), Airtable uses labels (`'Sports & Fitness'`)
   - Must map before sending to Airtable

---

## Testing Checklist

- [ ] All personality questions (1-7 scale) validate correctly
- [ ] All motivation questions (1-5 scale) validate correctly
- [ ] Close friends count maps to correct range
- [ ] Social satisfaction extracts number and maps to label
- [ ] Loneliness frequency maps "Very Often" to "Always (5)"
- [ ] Interest categories map from keys to labels
- [ ] Affinity groups map from frontend values to Airtable labels
- [ ] Empty values are cleaned before sending to Airtable
- [ ] Multi-select fields preserve empty arrays
- [ ] Personality scores calculate correctly (with reverse scoring)
- [ ] Motivation scores calculate correctly (averages)
- [ ] Primary motivation selects highest of three

---

**End of Document**

