# GPT Prompt Template - Implementation Example

## Node.js Example: Generate Prompt from Airtable Data

```javascript
const Airtable = require('airtable');
const OpenAI = require('openai');

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate personalized event recommendations for a user
 * @param {string} userId - Airtable User record ID
 * @returns {Promise<string>} Generated recommendations
 */
async function generateRecommendations(userId) {
  
  // 1. Fetch user data
  const user = await base('Users').find(userId);
  
  // 2. Get latest survey response for this user
  const surveyResponses = await base('Survey_Responses')
    .select({
      filterByFormula: `{User} = '${userId}'`,
      maxRecords: 1,
      sort: [{ field: 'Submitted At', direction: 'desc' }]
    })
    .firstPage();
  
  if (surveyResponses.length === 0) {
    throw new Error('No survey response found for user');
  }
  
  const surveyResponse = surveyResponses[0];
  
  // 3. Get calculated scores
  const calculatedScores = await base('Calculated_Scores')
    .select({
      filterByFormula: `{User} = '${userId}'`,
      maxRecords: 1,
      sort: [{ field: 'Calculated At', direction: 'desc' }]
    })
    .firstPage();
  
  if (calculatedScores.length === 0) {
    throw new Error('No calculated scores found for user');
  }
  
  const scores = calculatedScores[0];
  
  // 4. Build the prompt using template
  const prompt = buildPrompt(user.fields, surveyResponse.fields, scores.fields);
  
  // 5. Store prompt in GPT_Prompts table
  const promptRecord = await base('GPT_Prompts').create([
    {
      fields: {
        User: [userId],
        'Survey Response': [surveyResponse.id],
        'Calculated Scores': [scores.id],
        Prompt_Text: prompt,
        Prompt_Version: 'v1.0',
        Used_For_Recommendations: true
      }
    }
  ]);
  
  // 6. Send to GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an expert social activity recommendation engine.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000
  });
  
  const recommendations = completion.choices[0].message.content;
  
  // 7. Update GPT_Prompts record with generated recommendations
  await base('GPT_Prompts').update([
    {
      id: promptRecord[0].id,
      fields: {
        Recommendations_Generated: recommendations
      }
    }
  ]);
  
  return recommendations;
}

/**
 * Build GPT prompt from user data
 */
function buildPrompt(userData, surveyData, scoresData) {
  
  // Get interpretations based on scores
  const extraversionInterp = getExtraversionInterpretation(scoresData.Extraversion_Category);
  const conscientiousnessInterp = getConscientiousnessInterpretation(scoresData.Conscientiousness_Category);
  const opennessInterp = getOpennessInterpretation(scoresData.Openness_Category);
  
  // Build setting preferences string
  const settingPrefs = buildSettingPreferences(surveyData);
  
  // Build affinity groups section
  const affinityGroups = buildAffinityGroupsSection(surveyData);
  
  // Build the full prompt
  const prompt = `
You are an expert social activity recommendation engine for Empower Social, a platform that matches people with events, activities, and communities based on psychology and personality - not just interests.

Your task is to recommend 10 personalized social activities, events, groups, or experiences for this user in ${getLocation(userData.Zipcode)}.

---

## USER PROFILE

**Demographics:**
- Age: ${userData.Age}
- Gender: ${userData.Gender}
- Location: ${userData.Zipcode} (${getLocation(userData.Zipcode)})

**Personality Assessment (Big Five Traits):**
- Extraversion: ${scoresData.Extraversion_Category} (${scoresData.Extraversion_Raw}/14)
  - Interpretation: ${extraversionInterp}
- Conscientiousness: ${scoresData.Conscientiousness_Category} (${scoresData.Conscientiousness_Raw}/14)
  - Interpretation: ${conscientiousnessInterp}
- Openness to Experience: ${scoresData.Openness_Category} (${scoresData.Openness_Raw}/14)
  - Interpretation: ${opennessInterp}

**Motivation Profile:**
- Primary Motivation: ${scoresData.Primary_Motivation}
- Intrinsic Motivation (fun-seeking): ${scoresData.Intrinsic_Motivation.toFixed(1)}/5
- Social Motivation (connection-seeking): ${scoresData.Social_Motivation.toFixed(1)}/5
- Achievement Motivation (skill-building): ${scoresData.Achievement_Motivation.toFixed(1)}/5

**Social Needs:**
- Close Friends: ${surveyData.Close_Friends_Count}
- Social Satisfaction: ${surveyData.Social_Satisfaction}
- Loneliness Frequency: ${surveyData.Loneliness_Frequency}
- Looking For: ${Array.isArray(surveyData.Looking_For) ? surveyData.Looking_For.join(', ') : surveyData.Looking_For}

**Interest Categories:**
${Array.isArray(surveyData.Interest_Categories) ? surveyData.Interest_Categories.join(', ') : surveyData.Interest_Categories}

**Specific Interests:**
${surveyData.Specific_Interests || 'Not specified'}

**Activity Preferences:**
- Free Time Available: ${surveyData.Free_Time_Per_Week}
- Willing to Travel: ${surveyData.Travel_Distance_Willing}
- Setting Preferences: ${settingPrefs}

${affinityGroups}

---

## RECOMMENDATION GUIDELINES

### 1. Personality-Based Matching

**For Extraversion:**
- High (11-14): Prioritize large group events, social mixers, networking opportunities, high-energy gatherings
- Medium (7-10): Balance between small group activities and moderate-sized events, mix of intimate and social
- Low (2-6): Focus on small group activities (3-6 people), one-on-one opportunities, quieter environments

**For Conscientiousness:**
- High (11-14): Structured classes, organized volunteer work, goal-oriented activities, scheduled programs
- Medium (7-10): Mix of structured and flexible activities
- Low (2-6): Drop-in events, spontaneous meetups, flexible commitments, improvisation

**For Openness:**
- High (11-14): Novel experiences, diverse cultural events, experimental activities, creative pursuits
- Medium (7-10): Balance of familiar and new experiences
- Low (2-6): Traditional activities, familiar venues, established communities, routine hobbies

### 2. Motivation Alignment

**Intrinsic Motivation (Fun-seeking):**
- High (4-5): Entertainment events, recreational activities, playful experiences, enjoyment-focused
- Medium (2.5-3.9): Balance fun with other benefits
- Low (1-2.4): Focus on other motivations (skill-building, social connection)

**Social Motivation (Connection-seeking):**
- High (4-5): Friend-making emphasis, community-building, recurring meetups, relationship-focused
- Medium (2.5-3.9): Social aspect present but not primary
- Low (1-2.4): Activity-focused rather than social-focused

**Achievement Motivation (Skill-building):**
- High (4-5): Workshops, classes, competitive activities, skill progression, certifications
- Medium (2.5-3.9): Some learning component
- Low (1-2.4): Casual participation, no pressure to improve

### 3. Social Needs Response

**High Loneliness + Low Friend Count:**
- Prioritize: Welcoming beginner-friendly groups, buddy systems, structured ice-breakers, recurring meetups

**Low Social Satisfaction:**
- Recommend: New social circles different from current routine, fresh communities, different activity types

**Looking For (adjust recommendations based on stated goals):**
- "Make new friends" → Emphasize community-building, recurring groups
- "Explore new interests" → Novel activities, variety of options
- "Meet romantic partner" → Social events with singles, co-ed activities
- "Professional networking" → Career-related meetups, industry events
- "Community involvement" → Volunteer opportunities, civic engagement

### 4. Affinity Groups Integration (70/30 Rule)

**CRITICAL:** Affinity groups are enhancement, not replacement.

**70% of recommendations:** Based purely on interests, personality, and motivation
**30% of recommendations:** Interest-based + affinity enhancement

**Example (correct):**
- User: Gay man who likes hiking
- ✅ Recommend: "Gay Men's Hiking Group" (interest + affinity match)
- ❌ Do NOT recommend: Random LGBTQ+ events unrelated to hiking

**If affinity groups selected:** Find organizations/events that match BOTH their interests AND affinity identity. Do not recommend affinity events outside their stated interests.

**If no affinity groups selected:** Focus 100% on personality, motivation, and interests.

### 5. Practical Constraints

**Time Commitment:**
- Match recommendations to available free time: ${surveyData.Free_Time_Per_Week}

**Distance:**
- Only recommend events within: ${surveyData.Travel_Distance_Willing}

**Setting Preferences:**
- ${settingPrefs} → Weight recommendations toward these settings

### 6. Recommendation Mix (REQUIRED)

**Event Type Balance:**
- 50% recurring activities (weekly clubs, ongoing classes, regular meetups)
- 50% one-time events (workshops, concerts, festivals, special occasions)

**Diversity Requirements:**
- At least 3 different activity categories
- Mix of group sizes (small, medium, large)
- Variety of time commitments (drop-in, weekly, monthly)

---

## OUTPUT FORMAT

For each recommendation, provide:

1. **Event/Activity Name**
2. **Type:** [Recurring/One-time] [Category]
3. **Why It Matches:** Specific personality, motivation, or interest alignment
4. **Logistics:** Day/time, location, cost
5. **What to Expect:** Group size, atmosphere, commitment
6. **How to Join:** Contact info or website

---

## YOUR RECOMMENDATIONS:

Please provide 10 personalized recommendations following all guidelines above.
`;

  return prompt.trim();
}

/**
 * Helper functions
 */

function getExtraversionInterpretation(category) {
  const interps = {
    'High': 'You gain energy from social interaction and enjoy meeting new people',
    'Medium': 'You enjoy a balance of social time and solitude',
    'Low': 'You prefer smaller groups and meaningful one-on-one connections'
  };
  return interps[category] || '';
}

function getConscientiousnessInterpretation(category) {
  const interps = {
    'High': 'You appreciate structure, organization, and goal-oriented activities',
    'Medium': 'You balance planning with flexibility',
    'Low': 'You prefer spontaneous, flexible activities without rigid schedules'
  };
  return interps[category] || '';
}

function getOpennessInterpretation(category) {
  const interps = {
    'High': 'You seek novel experiences and enjoy exploring new ideas and cultures',
    'Medium': 'You appreciate both familiar comforts and occasional new experiences',
    'Low': 'You prefer traditional activities and established communities'
  };
  return interps[category] || '';
}

function buildSettingPreferences(surveyData) {
  const prefs = [];
  if (surveyData.Pref_Indoor) prefs.push('Indoor');
  if (surveyData.Pref_Outdoor) prefs.push('Outdoor');
  if (surveyData.Pref_Physical_Active) prefs.push('Physical/Active');
  if (surveyData.Pref_Relaxed_Lowkey) prefs.push('Relaxed/Low-key');
  if (surveyData.Pref_Structured) prefs.push('Structured');
  if (surveyData.Pref_Spontaneous) prefs.push('Spontaneous');
  return prefs.length > 0 ? prefs.join(', ') : 'No specific preferences';
}

function buildAffinityGroupsSection(surveyData) {
  const affinityGroups = [];
  
  if (surveyData.Affinity_Faith_Based && surveyData.Affinity_Faith_Based.length > 0) {
    affinityGroups.push(`Faith-based: ${Array.isArray(surveyData.Affinity_Faith_Based) ? surveyData.Affinity_Faith_Based.join(', ') : surveyData.Affinity_Faith_Based}`);
  }
  if (surveyData.Affinity_LGBTQ && surveyData.Affinity_LGBTQ.length > 0) {
    affinityGroups.push(`LGBTQ+: ${Array.isArray(surveyData.Affinity_LGBTQ) ? surveyData.Affinity_LGBTQ.join(', ') : surveyData.Affinity_LGBTQ}`);
  }
  if (surveyData.Affinity_Cultural_Ethnic && surveyData.Affinity_Cultural_Ethnic.length > 0) {
    affinityGroups.push(`Cultural/Ethnic: ${Array.isArray(surveyData.Affinity_Cultural_Ethnic) ? surveyData.Affinity_Cultural_Ethnic.join(', ') : surveyData.Affinity_Cultural_Ethnic}`);
  }
  if (surveyData.Affinity_Womens && surveyData.Affinity_Womens.length > 0) {
    affinityGroups.push(`Women's Groups: ${Array.isArray(surveyData.Affinity_Womens) ? surveyData.Affinity_Womens.join(', ') : surveyData.Affinity_Womens}`);
  }
  if (surveyData.Affinity_Young_Prof && surveyData.Affinity_Young_Prof.length > 0) {
    affinityGroups.push(`Young Professionals: ${Array.isArray(surveyData.Affinity_Young_Prof) ? surveyData.Affinity_Young_Prof.join(', ') : surveyData.Affinity_Young_Prof}`);
  }
  if (surveyData.Affinity_International && surveyData.Affinity_International.length > 0) {
    affinityGroups.push(`International/Immigrant: ${Array.isArray(surveyData.Affinity_International) ? surveyData.Affinity_International.join(', ') : surveyData.Affinity_International}`);
  }
  
  if (affinityGroups.length === 0) {
    return '**Community Connections (Affinity Groups):**\nNo affinity groups selected';
  }
  
  return `**Community Connections (Affinity Groups):**\n${affinityGroups.join('\n')}`;
}

function getLocation(zipcode) {
  // In production, use a geocoding API (Google Maps, Mapbox, etc.)
  // For now, return placeholder
  return 'Charlottesville, VA'; // TODO: Implement zipcode lookup
}

// Export for use in your backend
module.exports = {
  generateRecommendations,
  buildPrompt
};
```

---

## Usage Example

```javascript
// In your Express route or API endpoint
app.post('/api/generate-recommendations', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const recommendations = await generateRecommendations(userId);
    
    res.json({
      success: true,
      recommendations
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## Environment Variables Required

```bash
# .env file
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Testing

```javascript
// test.js
const { generateRecommendations } = require('./generateRecommendations');

async function test() {
  try {
    const userId = 'recABC123'; // Your test user's Airtable record ID
    const recommendations = await generateRecommendations(userId);
    console.log(recommendations);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
```
