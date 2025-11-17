const OpenAI = require('openai');

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY must be set in environment variables');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate conceptual/idealized event recommendations
 * Stage 1 of two-stage recommendation system
 * @param {Object} userProfile - Complete user profile (user, survey, scores)
 * @param {number} recommendationsCount - Number of concepts to generate
 * @returns {Promise<Object>} {success: boolean, data: {concepts: Array} | error: string}
 */
async function generateConceptualRecommendations(userProfile, recommendationsCount = 5) {
  try {
    const { user, survey, scores, location } = userProfile;
    
    // Build prompt for conceptual generation
    const prompt = buildConceptualPrompt(user, survey, scores, location, recommendationsCount);
    
    // Use gpt-4o for concept generation (faster than gpt-4-turbo, still high quality)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CONCEPT_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social psychologist and activity recommender. You deeply understand personality types, social preferences, and what makes people thrive. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 2500 // Slightly reduced for speed
    });
    
    const responseText = completion.choices[0].message.content;
    const concepts = JSON.parse(responseText);
    
    // Validate and normalize concepts
    const normalizedConcepts = normalizeConcepts(concepts, recommendationsCount);
    
    return {
      success: true,
      data: {
        concepts: normalizedConcepts
      }
    };
  } catch (error) {
    console.error('Error generating conceptual recommendations:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate conceptual recommendations'
    };
  }
}

/**
 * Build prompt for conceptual recommendation generation
 */
function buildConceptualPrompt(user, survey, scores, location, count) {
  const extraversionInterp = getExtraversionInterpretation(scores.Extraversion_Category);
  const conscientiousnessInterp = getConscientiousnessInterpretation(scores.Conscientiousness_Category);
  const opennessInterp = getOpennessInterpretation(scores.Openness_Category);
  
  // Build affinity groups section
  const affinityGroups = [];
  if (survey.Affinity_Faith_Based?.length > 0) affinityGroups.push(`Faith: ${survey.Affinity_Faith_Based.join(', ')}`);
  if (survey.Affinity_LGBTQ?.length > 0) affinityGroups.push(`LGBTQ: ${survey.Affinity_LGBTQ.join(', ')}`);
  if (survey.Affinity_Cultural_Ethnic?.length > 0) affinityGroups.push(`Cultural: ${survey.Affinity_Cultural_Ethnic.join(', ')}`);
  if (survey.Affinity_Womens?.length > 0) affinityGroups.push(`Women's: ${survey.Affinity_Womens.join(', ')}`);
  if (survey.Affinity_Young_Prof?.length > 0) affinityGroups.push(`Young Professional: ${survey.Affinity_Young_Prof.join(', ')}`);
  if (survey.Affinity_International?.length > 0) affinityGroups.push(`International: ${survey.Affinity_International.join(', ')}`);
  
  return `You are an expert social psychologist and activity recommender. Generate ${count} idealized event/activity concepts that would be PERFECT for this person.

USER PROFILE:
Name: ${user.Name}
Location: ${location}
Age: ${user.Age}
Gender: ${user.Gender}

Personality:
- Extraversion: ${scores.Extraversion_Raw}/14 (${scores.Extraversion_Category}) - ${extraversionInterp}
- Conscientiousness: ${scores.Conscientiousness_Raw}/14 (${scores.Conscientiousness_Category}) - ${conscientiousnessInterp}
- Openness: ${scores.Openness_Raw}/14 (${scores.Openness_Category}) - ${opennessInterp}

Motivations:
- Primary: ${scores.Primary_Motivation}
- Intrinsic (fun): ${scores.Intrinsic_Motivation.toFixed(1)}/5
- Social (connection): ${scores.Social_Motivation.toFixed(1)}/5
- Achievement (skill-building): ${scores.Achievement_Motivation.toFixed(1)}/5

Interests: ${Array.isArray(survey.Interest_Categories) ? survey.Interest_Categories.join(', ') : survey.Interest_Categories}
Specific Interests: ${survey.Specific_Interests || 'Not specified'}

Social Needs:
- Close Friends: ${survey.Close_Friends_Count}
- Social Satisfaction: ${survey.Social_Satisfaction}
- Loneliness: ${survey.Loneliness_Frequency}

Preferences:
- Free Time: ${survey.Free_Time_Per_Week}
- Travel Distance: ${survey.Travel_Distance_Willing}

${affinityGroups.length > 0 ? `Affinity Groups: ${affinityGroups.join('; ')}` : ''}

CRITICAL REQUIREMENT - SOCIAL FOCUS:
- ALL recommendations MUST be activities done WITH OTHER PEOPLE
- Focus on: groups, clubs, leagues, classes, meetups, events, workshops, tours
- AVOID: solo activities, individual pursuits, things you do alone
- Every concept should involve social interaction, group participation, or community engagement

LOCATION CONTEXT:
- User is in an URBAN AREA: ${location}
- Focus on activities that work in dense, walkable cities (DC, NY, SF, Chicago, Denver, Miami, etc.)
- Prioritize: organizations, clubs, leagues, meetups, workshops, events, festivals
- AVOID: rural activities (camping, fishing, hunting, birdwatching)
- Urban-friendly outdoor: urban hiking groups, park activities, walking tours, community gardens
- Urban-specific: rooftop events, street festivals, pop-ups, walking tours, neighborhood events

REQUIREMENTS:
- Generate exactly ${count} concepts
- 50% should be RECURRING ORGANIZATIONS/GROUPS: sports leagues, clubs, classes, regular meetups, ongoing groups
- 50% should be ONE-TIME EVENTS: workshops, concerts, festivals, pop-ups, street events
- EVERY concept must be SOCIAL - done with others, not solo
- Focus on URBAN-FRIENDLY activities that thrive in cities
- NOT rural activities: avoid camping, fishing, hunting, birdwatching
- NOT solo activities: avoid individual hobbies, solo workouts, personal projects
- Urban outdoor activities: urban hiking groups, park fitness groups, walking tours, community gardens
- Diverse categories (at least 3 different types)
- Each concept tailored to THIS specific person in an URBAN, SOCIAL environment

SEARCH QUERY REQUIREMENTS (CRITICAL):
- For RECURRING activities: Search for ORGANIZATIONS, LEAGUES, CLUBS, GROUPS, CLASSES
  * Format: "join [activity] league [location]", "join [activity] club [location]", "[activity] meetup group [location]", "[activity] class [location]"
  * Examples: "join adult soccer league ${location}", "join pottery club ${location}", "running group ${location}", "yoga class ${location}"
  
- For ONE-TIME events: Search for SPECIFIC EVENTS, WORKSHOPS, TOURNAMENTS, TOURS
  * Format: "attend [activity] workshop [location]", "[activity] event [location] this week", "[activity] tournament [location]", "[activity] tour [location]"
  * Examples: "attend cooking workshop ${location}", "jazz concert ${location} this week", "photography workshop ${location}", "food tour ${location}"
  
- ALWAYS include action verbs: "join", "attend", "participate", "enroll"
- ALWAYS specify format: "league", "club", "group", "class", "workshop", "event", "meetup", "tour"
- Include location: "${location}"
- Add temporal: "weekly", "monthly", "this week", "upcoming" for events
- NEVER search for solo activities or individual pursuits

EXAMPLES OF GOOD QUERIES FOR ORGANIZATIONS (SOCIAL):
✅ "join adult recreational basketball league ${location} registration"
✅ "join pottery wheel throwing club ${location} membership"
✅ "running group ${location} weekly meetup"
✅ "photography meetup group ${location}"
✅ "yoga class ${location} beginner friendly"

EXAMPLES OF GOOD QUERIES FOR EVENTS (SOCIAL):
✅ "attend beginner pottery workshop ${location} this weekend"
✅ "cooking class Italian cuisine ${location} registration"
✅ "jazz concert ${location} this week"
✅ "weekend hiking group event ${location}"
✅ "food tour ${location} walking"

EXAMPLES OF BAD QUERIES (AVOID - SOLO OR GENERIC):
❌ "pottery studio ${location}" (venue, not group activity)
❌ "gym near me" (solo workout, not group)
❌ "art classes" (missing location and social context)
❌ "fitness places" (too vague, not social)
❌ "meditation app" (solo, not group)
❌ "running solo" (not social)
❌ "camping trip" (rural, not urban)

OUTPUT FORMAT (JSON):
{
  "concepts": [
    {
      "conceptName": "Descriptive name of ideal event",
      "category": "Category name",
      "whyItMatches": "COMPREHENSIVE explanation (3-4 sentences) covering:
        - Interest alignment: How this matches their specific interests (${survey.Specific_Interests || 'their stated interests'}) and interest categories (${Array.isArray(survey.Interest_Categories) ? survey.Interest_Categories.join(', ') : survey.Interest_Categories})
        - Personality fit: How this aligns with their ${scores.Extraversion_Category} extraversion (${scores.Extraversion_Raw}/14 - ${extraversionInterp}), ${scores.Conscientiousness_Category} conscientiousness (${scores.Conscientiousness_Raw}/14 - ${conscientiousnessInterp}), and ${scores.Openness_Category} openness (${scores.Openness_Raw}/14 - ${opennessInterp})
        - Motivation match: How this supports their ${scores.Primary_Motivation} motivation - specifically their intrinsic/fun-seeking (${scores.Intrinsic_Motivation.toFixed(1)}/5), social/connection-seeking (${scores.Social_Motivation.toFixed(1)}/5), and achievement/skill-building (${scores.Achievement_Motivation.toFixed(1)}/5) motivations
        - Social needs: How this addresses their social situation - they have ${survey.Close_Friends_Count} close friends, rate their social satisfaction as ${survey.Social_Satisfaction}, and experience loneliness ${survey.Loneliness_Frequency}
        - Practical fit: How this works with their ${survey.Free_Time_Per_Week} free time per week and willingness to travel ${survey.Travel_Distance_Willing}",
      "idealCharacteristics": {
        "setting": "indoor/outdoor/mixed",
        "groupSize": "small/medium/large",
        "atmosphere": "relaxed/energetic/structured/etc",
        "timeCommitment": "1-2 hours / 2-4 hours / full day"
      },
      "searchQueries": [
        "[action verb] [activity] [format] [qualifier] [location]",
        "Example: join beginner pottery wheel throwing classes ${location}",
        "Example: take weekend cooking workshop ${location} registration"
      ],
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "isRecurring": true/false,
      "priority": 1-5
    }
  ]
}

Generate ${count} concepts now.`;
}

/**
 * Normalize and validate concepts from GPT response
 */
function normalizeConcepts(concepts, expectedCount) {
  let conceptArray = [];
  
  // Handle different response formats
  if (Array.isArray(concepts)) {
    conceptArray = concepts;
  } else if (concepts.concepts && Array.isArray(concepts.concepts)) {
    conceptArray = concepts.concepts;
  } else if (concepts.data && Array.isArray(concepts.data)) {
    conceptArray = concepts.data;
  } else {
    console.warn('Unexpected concepts format:', Object.keys(concepts));
    return [];
  }
  
  // Validate and normalize each concept
  const normalized = conceptArray
    .slice(0, expectedCount)
    .map((concept, index) => {
      return {
        conceptName: concept.conceptName || concept.name || `Concept ${index + 1}`,
        category: concept.category || 'General',
        whyItMatches: concept.whyItMatches || concept.why || 'Matches user profile',
        idealCharacteristics: concept.idealCharacteristics || {
          setting: concept.setting || 'mixed',
          groupSize: concept.groupSize || 'medium',
          atmosphere: concept.atmosphere || 'welcoming',
          timeCommitment: concept.timeCommitment || '2-3 hours'
        },
        searchQueries: Array.isArray(concept.searchQueries) 
          ? concept.searchQueries.slice(0, 5)
          : (concept.searchQueries ? [concept.searchQueries] : []),
        keywords: Array.isArray(concept.keywords) 
          ? concept.keywords.slice(0, 10)
          : (concept.keywords ? [concept.keywords] : []),
        isRecurring: concept.isRecurring !== undefined ? concept.isRecurring : (index % 2 === 0),
        priority: concept.priority || Math.min(5, index + 1)
      };
    });
  
  return normalized;
}

/**
 * Helper functions (reused from openai.js)
 */
function getExtraversionInterpretation(category) {
  const interps = {
    'High': 'You gain energy from social interaction and enjoy meeting new people',
    'Medium': 'You enjoy both social and solo activities in balance',
    'Low': 'You prefer smaller groups and intimate settings'
  };
  return interps[category] || interps['Medium'];
}

function getConscientiousnessInterpretation(category) {
  const interps = {
    'High': 'You prefer structured, organized activities with clear goals',
    'Medium': 'You enjoy a mix of structured and flexible activities',
    'Low': 'You prefer spontaneous, flexible activities without rigid schedules'
  };
  return interps[category] || interps['Medium'];
}

function getOpennessInterpretation(category) {
  const interps = {
    'High': 'You enjoy novel experiences and creative activities',
    'Medium': 'You balance familiar and new experiences',
    'Low': 'You prefer traditional, familiar activities and routines'
  };
  return interps[category] || interps['Medium'];
}

module.exports = {
  generateConceptualRecommendations
};

