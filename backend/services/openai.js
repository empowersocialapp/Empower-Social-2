const OpenAI = require('openai');
const { base } = require('./airtable');
const { fetchRealEvents, geocodeZipcode } = require('./events');

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY must be set in environment variables');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate personalized event recommendations for a user
 * @param {string} userId - Airtable User record ID
 * @param {string} [surveyResponseId] - Optional: Airtable Survey_Response record ID (if not provided, will query)
 * @param {string} [calculatedScoresId] - Optional: Airtable Calculated_Scores record ID (if not provided, will query)
 * @param {number} [numRecommendations] - Optional: Number of recommendations to generate (default: 5, or from env RECOMMENDATIONS_COUNT)
 * @returns {Promise<Object>} {success: boolean, data: {recommendations, promptText, surveyResponseId, calculatedScoresId} | error: string}
 */
async function generateRecommendations(userId, surveyResponseId = null, calculatedScoresId = null, numRecommendations = null) {
  // Get number of recommendations from parameter, env var, or default to 5
  const recommendationsCount = numRecommendations || parseInt(process.env.RECOMMENDATIONS_COUNT) || 5;
  console.log(`Generating ${recommendationsCount} recommendations (max_tokens: ${Math.max(1000, recommendationsCount * 300 + 500)})`);
  try {
    if (!userId) {
      return {
        success: false,
        error: 'userId is required'
      };
    }

    // 1. Fetch user data
    const user = await base('Users').find(userId);
    if (!user || !user.fields) {
      return {
        success: false,
        error: 'User not found or user data is invalid'
      };
    }
    
    // 2. Get survey response (use provided ID or query for latest)
    let surveyResponse;
    if (surveyResponseId) {
      surveyResponse = await base('Survey_Responses').find(surveyResponseId);
    } else {
      const surveyResponses = await base('Survey_Responses')
        .select({
          filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
          maxRecords: 1
        })
        .firstPage();
      
      if (surveyResponses.length === 0) {
        return {
          success: false,
          error: 'No survey response found for user'
        };
      }
      
      surveyResponse = surveyResponses[0];
      surveyResponseId = surveyResponse.id;
    }
    
    if (!surveyResponse || !surveyResponse.fields) {
      return {
        success: false,
        error: 'Survey response data is invalid'
      };
    }
    
    // 3. Get calculated scores (use provided ID or query for latest)
    let scores;
    if (calculatedScoresId) {
      scores = await base('Calculated_Scores').find(calculatedScoresId);
    } else {
      const calculatedScores = await base('Calculated_Scores')
        .select({
          filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
          maxRecords: 1
        })
        .firstPage();
      
      if (calculatedScores.length === 0) {
        return {
          success: false,
          error: 'No calculated scores found for user'
        };
      }
      
      scores = calculatedScores[0];
      calculatedScoresId = scores.id;
    }
    
    if (!scores || !scores.fields) {
      return {
        success: false,
        error: 'Calculated scores data is invalid'
      };
    }
    
    // 4. Fetch real events from APIs (with timeout to prevent long waits)
    console.log('Fetching real events...');
    const zipcode = user.fields?.Zipcode;
    if (!zipcode) {
      return {
        success: false,
        error: 'User zipcode is required for recommendations'
      };
    }
    
    const userProfile = {
      zipcode: zipcode,
      interests: {
        categories: surveyResponse.fields.Interest_Categories || [],
        specific: surveyResponse.fields.Specific_Interests || ''
      },
      preferences: {
        travelDistance: surveyResponse.fields.Travel_Distance_Willing || '15+ miles',
        freeTime: surveyResponse.fields.Free_Time_Per_Week || '10-20 hours'
      },
      affinityGroups: {
        lgbtq: surveyResponse.fields.Affinity_LGBTQ || [],
        faith: surveyResponse.fields.Affinity_Faith_Based || [],
        cultural: surveyResponse.fields.Affinity_Cultural_Ethnic || [],
        womens: surveyResponse.fields.Affinity_Womens || [],
        youngProf: surveyResponse.fields.Affinity_Young_Prof || [],
        international: surveyResponse.fields.Affinity_International || []
      }
    };
    
    // Fetch events with 15-second timeout to prevent long waits
    let realEvents = [];
    try {
      const fetchPromise = fetchRealEvents(userProfile);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Event fetching timeout after 15 seconds')), 15000)
      );
      realEvents = await Promise.race([fetchPromise, timeoutPromise]);
      console.log(`Fetched ${realEvents.length} real events`);
    } catch (error) {
      console.warn('Event fetching timed out or failed, continuing without events:', error.message);
      realEvents = []; // Continue without events
    }
    
    if (realEvents.length > 0) {
      console.log('Sample events:', realEvents.slice(0, 3).map(e => ({ name: e.name, source: e.source, url: e.url })));
    } else {
      // Only warn if API keys are configured (otherwise it's expected)
      if (process.env.EVENTBRITE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.FIRECRAWL_API_KEY) {
        console.warn('⚠️  No real events found. Check API keys and event fetching logic.');
      }
      // Otherwise silently continue - recommendations will be conceptual
    }
    
    // 5. Build the prompt using template (now with real events)
    const promptText = await buildPrompt(user.fields, surveyResponse.fields, scores.fields, realEvents, recommendationsCount);
    
    // 6. Calculate max_tokens based on number of recommendations
    // Each recommendation is ~250-300 tokens, so: count * 300 + buffer
    const maxTokens = Math.max(1000, recommendationsCount * 300 + 500);
    
    // Add timeout to prevent hanging (90 seconds max for legacy system)
    const timeoutMs = 90000; // 90 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI API timeout after 90 seconds')), timeoutMs)
    );
    
    // 6. Send to GPT-4-turbo
    const apiCallPromise = openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social activity recommendation engine.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });
    
    const completion = await Promise.race([apiCallPromise, timeoutPromise]);
    
    const recommendations = completion.choices[0].message.content;
    
    return {
      success: true,
      data: {
        recommendations,
        promptText,
        surveyResponseId: surveyResponseId,
        calculatedScoresId: calculatedScoresId
      }
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate recommendations'
    };
  }
}

/**
 * Save prompt and recommendations to GPT_Prompts table
 * @param {string} userId - Airtable User record ID
 * @param {string} surveyResponseId - Airtable Survey_Response record ID
 * @param {string} calculatedScoresId - Airtable Calculated_Scores record ID
 * @param {string} promptText - The prompt text sent to GPT
 * @param {string} recommendations - The generated recommendations
 * @returns {Promise<Object>} {success: boolean, data: {promptId} | error: string}
 */
async function savePromptToAirtable(userId, surveyResponseId, calculatedScoresId, promptText, recommendations) {
  try {
    if (!userId || !surveyResponseId || !calculatedScoresId || !promptText || !recommendations) {
      return {
        success: false,
        error: 'All parameters are required: userId, surveyResponseId, calculatedScoresId, promptText, recommendations'
      };
    }

    const records = await base('GPT_Prompts').create([
      {
        fields: {
          User: [userId],
          'Survey Response': [surveyResponseId],
          'Calculated Scores': [calculatedScoresId],
          Prompt_Text: promptText,
          Recommendations_Generated: recommendations
        }
      }
    ]);

    const record = records[0];
    
    return {
      success: true,
      data: {
        promptId: record.id
      }
    };
  } catch (error) {
    console.error('Error saving prompt to Airtable:', error);
    return {
      success: false,
      error: error.message || 'Failed to save prompt to Airtable'
    };
  }
}

/**
 * Build GPT prompt from user data
 * @param {Object} userData - User fields from Airtable
 * @param {Object} surveyData - Survey response fields from Airtable
 * @param {Object} scoresData - Calculated scores fields from Airtable
 * @param {Array} realEvents - Array of real events from APIs
 * @param {number} recommendationsCount - Number of recommendations to generate
 * @returns {string} The complete prompt text
 */
async function buildPrompt(userData, surveyData, scoresData, realEvents = [], recommendationsCount = 10) {
  // Get interpretations based on scores
  const extraversionInterp = getExtraversionInterpretation(scoresData.Extraversion_Category);
  const conscientiousnessInterp = getConscientiousnessInterpretation(scoresData.Conscientiousness_Category);
  const opennessInterp = getOpennessInterpretation(scoresData.Openness_Category);
  
  // Build setting preferences string
  const settingPrefs = buildSettingPreferences(surveyData);
  
  // Build affinity groups section
  const affinityGroups = buildAffinityGroupsSection(surveyData);
  
  // Get location from zipcode using geocoding
  const location = await getLocation(userData.Zipcode);
  
  // Build the full prompt
  const prompt = `
You are an expert social activity recommendation engine for Empower Social, a platform that matches people with events, activities, and communities based on psychology and personality - not just interests.

Your task is to recommend ${recommendationsCount} personalized social activities, events, groups, or experiences for this user in ${location}.

**CRITICAL TIME CONSTRAINT:** Only recommend events that occur within the next 14 days from today (${new Date().toLocaleDateString()}). Do NOT recommend events more than 14 days away.

---

## USER PROFILE

**Demographics:**
- Age: ${userData.Age}
- Gender: ${userData.Gender}
- Location: ${userData.Zipcode} (${location})

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

**CRITICAL - INTEREST RESTRICTIONS:**
- ONLY recommend activities from the interest categories listed above
- DO NOT recommend activities from categories NOT in the list
- If "Sports & Fitness" is NOT in the list, DO NOT recommend any sports activities
- If "Arts & Culture" is NOT in the list, DO NOT recommend arts/cultural activities
- Only use the specific interest categories the user has selected

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

**Time Window (CRITICAL):**
- **ONLY recommend events occurring within the next 14 days** from today (${new Date().toLocaleDateString()})
- Events must have a start date between today and 14 days from now
- Do NOT recommend events scheduled more than 14 days in the future

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

**Note:** You are generating ${recommendationsCount} recommendations total. Round the split (e.g., for ${recommendationsCount} recommendations: ${Math.floor(recommendationsCount/2)} recurring, ${Math.ceil(recommendationsCount/2)} one-time).

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
6. **How to Join:** MUST include a clickable URL (website link). If no URL is available from the event source, provide the best available link (e.g., organization website, event platform homepage).
7. **URL:** [REQUIRED] Direct link to event page, registration, or organization website

---

## REAL EVENTS AVAILABLE:

${realEvents.length > 0 ? formatRealEventsForPrompt(realEvents) : 'No real events found. Please provide conceptual recommendations based on the user profile, but clearly indicate these are suggestions for the user to search for themselves.'}

---

## YOUR TASK:

${realEvents.length > 0 
  ? `CRITICAL: You MUST select and recommend events ONLY from the REAL EVENTS list above. Do NOT create fictional events. 

Requirements:
- Use ONLY events from the REAL EVENTS list (all events in the list are already filtered to within 14 days)
- Include the actual event name, date, time, location, and URL from the list
- If there are fewer than ${recommendationsCount} events in the list, recommend only the events that exist
- Format each recommendation with: Event Name (from list), Date/Time (from list), Location (from list), URL (from list), Why It Matches
- **MANDATORY: Every recommendation MUST include a "URL:" field with the actual URL from the event list**
- **MANDATORY: Verify the event date is within 14 days - all events in the list should already meet this criteria**
- Do NOT make up event names, dates, locations, or URLs`
  : `Since no real events were found, provide ${recommendationsCount} conceptual recommendations based on the user profile. For each recommendation, include a "URL:" field with a search link or relevant website where the user can find similar events. Clearly indicate these are suggestions for the user to search for, and provide guidance on where to find similar events.`}

Please provide ${recommendationsCount} personalized recommendations following all guidelines above.

**CRITICAL REQUIREMENT:** Every single recommendation MUST include a "URL:" field with a clickable link. If using real events, use the URL from the event list. If providing conceptual recommendations, include a search URL or relevant website link.
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

async function getLocation(zipcode) {
  try {
    if (!zipcode) {
      return 'your area';
    }
    
    // Use geocoding to get city and state from zipcode
    const locationData = await geocodeZipcode(zipcode);
    
    if (locationData && locationData.city && locationData.state) {
      return `${locationData.city}, ${locationData.state}`;
    } else if (locationData && locationData.city) {
      return locationData.city;
    } else {
      // Fallback to zipcode if geocoding fails
      return `zipcode ${zipcode}`;
    }
  } catch (error) {
    console.warn('Geocoding failed, using zipcode as fallback:', error.message);
    return `zipcode ${zipcode}`;
  }
}

/**
 * Format real events for GPT prompt
 * @param {Array} events - Array of real event objects
 * @returns {string} Formatted string of events for prompt
 */
function formatRealEventsForPrompt(events) {
  if (events.length === 0) {
    return 'No real events available.';
  }

  return events.map((event, index) => {
    return `
${index + 1}. **${event.name}**
   - Source: ${event.source}
   - Date/Time: ${event.startTime ? new Date(event.startTime).toLocaleString() : 'TBD'}
   - Location: ${event.venue}, ${event.address}
   - Cost: ${event.cost}
   - Category: ${event.category || 'General'}
   - Description: ${event.description ? event.description.substring(0, 200) + '...' : 'No description'}
   - URL: ${event.url}
   - Event ID: ${event.id}`;
  }).join('\n');
}

module.exports = {
  generateRecommendations,
  savePromptToAirtable
};
