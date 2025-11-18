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
    // Add timeout to prevent hanging (60 seconds max)
    const timeoutMs = 60000; // 60 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI API timeout after 60 seconds')), timeoutMs)
    );
    
    const apiCallPromise = openai.chat.completions.create({
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
    
    const completion = await Promise.race([apiCallPromise, timeoutPromise]);
    
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
 * Build detailed setting preferences section
 */
function buildDetailedSettingPreferences(survey) {
  const prefs = [];
  if (survey.Pref_Indoor === true || survey.Pref_Indoor === 'Yes') {
    prefs.push('- ✅ Prefers INDOOR activities');
  } else if (survey.Pref_Indoor === false || survey.Pref_Indoor === 'No') {
    prefs.push('- ❌ Does NOT prefer indoor activities');
  }
  if (survey.Pref_Outdoor === true || survey.Pref_Outdoor === 'Yes') {
    prefs.push('- ✅ Prefers OUTDOOR activities');
  } else if (survey.Pref_Outdoor === false || survey.Pref_Outdoor === 'No') {
    prefs.push('- ❌ Does NOT prefer outdoor activities');
  }
  if (survey.Pref_Physical_Active === true || survey.Pref_Physical_Active === 'Yes') {
    prefs.push('- ✅ Prefers PHYSICAL/ACTIVE activities');
  } else if (survey.Pref_Physical_Active === false || survey.Pref_Physical_Active === 'No') {
    prefs.push('- ❌ Does NOT prefer physical activities');
  }
  if (survey.Pref_Relaxed_Lowkey === true || survey.Pref_Relaxed_Lowkey === 'Yes') {
    prefs.push('- ✅ Prefers RELAXED/LOW-KEY atmospheres');
  } else if (survey.Pref_Relaxed_Lowkey === false || survey.Pref_Relaxed_Lowkey === 'No') {
    prefs.push('- ❌ Does NOT prefer relaxed atmospheres');
  }
  if (survey.Pref_Structured === true || survey.Pref_Structured === 'Yes') {
    prefs.push('- ✅ Prefers STRUCTURED activities');
  } else if (survey.Pref_Structured === false || survey.Pref_Structured === 'No') {
    prefs.push('- ❌ Does NOT prefer structured activities');
  }
  if (survey.Pref_Spontaneous === true || survey.Pref_Spontaneous === 'Yes') {
    prefs.push('- ✅ Prefers SPONTANEOUS activities');
  } else if (survey.Pref_Spontaneous === false || survey.Pref_Spontaneous === 'No') {
    prefs.push('- ❌ Does NOT prefer spontaneous activities');
  }
  return prefs.length > 0 ? prefs.join('\n') : '- No specific setting preferences indicated';
}

/**
 * Build interpretation section for GPT prompt
 */
function buildInterpretationSection(user, survey, scores) {
  const extraversionInterp = getExtraversionInterpretation(scores.Extraversion_Category);
  const conscientiousnessInterp = getConscientiousnessInterpretation(scores.Conscientiousness_Category);
  const opennessInterp = getOpennessInterpretation(scores.Openness_Category);
  
  // Determine extraversion guidance
  let extraversionGuidance = '';
  if (scores.Extraversion_Category === 'High') {
    extraversionGuidance = 'HIGH: User thrives in large groups, networking events, and high-energy social situations. Prioritize events with 20+ people, mixers, and social gatherings.';
  } else if (scores.Extraversion_Category === 'Low') {
    extraversionGuidance = 'LOW: User prefers intimate settings and meaningful one-on-one connections. Prioritize small groups (3-6 people), quiet environments, and activities with built-in conversation time.';
  } else {
    extraversionGuidance = 'MEDIUM: User enjoys balance. Mix small intimate groups with moderate-sized events (10-20 people).';
  }
  
  // Determine conscientiousness guidance
  let conscientiousnessGuidance = '';
  if (scores.Conscientiousness_Category === 'High') {
    conscientiousnessGuidance = 'HIGH: User needs clear schedules, goals, and organization. Recommend: classes with curriculum, structured volunteer programs, scheduled meetups with agendas.';
  } else if (scores.Conscientiousness_Category === 'Low') {
    conscientiousnessGuidance = 'LOW: User prefers flexibility and spontaneity. Recommend: drop-in events, open workshops, flexible meetups, improvisation activities.';
  } else {
    conscientiousnessGuidance = 'MEDIUM: User enjoys both structure and flexibility. Mix scheduled programs with flexible options.';
  }
  
  // Determine openness guidance
  let opennessGuidance = '';
  if (scores.Openness_Category === 'High') {
    opennessGuidance = 'HIGH: User craves novelty and diversity. Prioritize: experimental activities, diverse cultural events, creative workshops, new experiences they haven\'t tried.';
  } else if (scores.Openness_Category === 'Low') {
    opennessGuidance = 'LOW: User prefers familiar, traditional activities. Prioritize: established communities, routine hobbies, familiar venues, traditional formats.';
  } else {
    opennessGuidance = 'MEDIUM: User enjoys both familiar and new experiences. Balance traditional activities with occasional novelty.';
  }
  
  // Determine motivation guidance
  const intrinsicGuidance = scores.Intrinsic_Motivation >= 4 
    ? 'HIGH - User prioritizes fun and enjoyment. Activities should be entertaining and pleasurable.'
    : scores.Intrinsic_Motivation <= 2 
    ? 'LOW - Fun is secondary. Focus on other motivations.'
    : 'MEDIUM - Fun matters but not primary.';
    
  const socialGuidance = scores.Social_Motivation >= 4
    ? 'HIGH - User seeks connection and friendship. Prioritize community-building, recurring groups, buddy systems.'
    : scores.Social_Motivation <= 2
    ? 'LOW - Social aspect is secondary. Activity quality matters more than socializing.'
    : 'MEDIUM - Social connection is nice but not essential.';
    
  const achievementGuidance = scores.Achievement_Motivation >= 4
    ? 'HIGH - User wants to learn and improve. Prioritize: workshops, classes, skill-building, certifications, progression paths.'
    : scores.Achievement_Motivation <= 2
    ? 'LOW - User prefers casual participation without pressure to improve.'
    : 'MEDIUM - Some learning component is appreciated.';
  
  // Determine social needs guidance
  const closeFriendsCount = survey.Close_Friends_Count || '';
  let closeFriendsGuidance = '';
  if (closeFriendsCount === '0' || closeFriendsCount === '1-2') {
    closeFriendsGuidance = 'CRITICAL: User has very few close friends. Prioritize welcoming, beginner-friendly groups with structured ice-breakers. Emphasize community-building and recurring meetups.';
  } else if (closeFriendsCount === '3-5') {
    closeFriendsGuidance = 'MODERATE: User has some friends but could use more. Balance community-building with activity-focused events.';
  } else {
    closeFriendsGuidance = 'GOOD: User has solid friend group. Focus on activity quality and shared interests.';
  }
  
  const socialSatisfaction = survey.Social_Satisfaction || '';
  let satisfactionGuidance = '';
  if (socialSatisfaction.includes('Dissatisfied') || socialSatisfaction.includes('Very Dissatisfied')) {
    satisfactionGuidance = 'LOW SATISFACTION: User is unhappy with current social life. Recommend NEW social circles, different activity types, fresh communities away from current routine.';
  } else if (socialSatisfaction.includes('Satisfied') || socialSatisfaction.includes('Very Satisfied')) {
    satisfactionGuidance = 'HIGH SATISFACTION: User is happy socially. Focus on activity quality and shared interests rather than friend-making.';
  } else {
    satisfactionGuidance = 'NEUTRAL: User is okay with current social life. Balance community-building with activity focus.';
  }
  
  const lonelinessFreq = survey.Loneliness_Frequency || '';
  let lonelinessGuidance = '';
  if (lonelinessFreq.includes('Often') || lonelinessFreq.includes('Always') || lonelinessFreq.includes('Very Often')) {
    lonelinessGuidance = 'HIGH LONELINESS: CRITICAL PRIORITY. User feels isolated. Prioritize: welcoming beginner groups, recurring meetups, buddy systems, structured social activities, community-building focus.';
  } else if (lonelinessFreq.includes('Never') || lonelinessFreq.includes('Rarely')) {
    lonelinessGuidance = 'LOW LONELINESS: User feels connected. Focus on activity quality and shared interests.';
  } else {
    lonelinessGuidance = 'MODERATE: User sometimes feels lonely. Include some community-building activities.';
  }
  
  // Build looking for guidance
  const lookingFor = Array.isArray(survey.Looking_For) ? survey.Looking_For : (survey.Looking_For ? [survey.Looking_For] : []);
  const lookingForGuidance = lookingFor.map(goal => {
    if (goal.includes('friends') || goal.includes('community')) return `  - "${goal}" → Prioritize recurring groups, community-building, welcoming environments`;
    if (goal.includes('romantic') || goal.includes('partner')) return `  - "${goal}" → Include co-ed social events, singles mixers, activities with relationship-building potential`;
    if (goal.includes('networking') || goal.includes('professional')) return `  - "${goal}" → Include career-related meetups, industry events, professional development`;
    if (goal.includes('explore') || goal.includes('interests')) return `  - "${goal}" → Prioritize variety, novel activities, diverse options`;
    if (goal.includes('fun') || goal.includes('enjoy')) return `  - "${goal}" → Emphasize entertaining, enjoyable activities`;
    if (goal.includes('volunteer') || goal.includes('involvement')) return `  - "${goal}" → Include volunteer opportunities, civic engagement, community service`;
    return `  - "${goal}" → Consider in recommendation selection`;
  }).join('\n') || '  - Consider user goals when selecting recommendations';
  
  // Build preferences guidance
  const freeTime = survey.Free_Time_Per_Week || '';
  let freeTimeGuidance = '';
  if (freeTime.includes('Less than 5') || freeTime.includes('5-10')) {
    freeTimeGuidance = 'LIMITED TIME: Only recommend activities that fit their schedule. Prioritize: short events (1-2 hours), flexible timing, low commitment.';
  } else if (freeTime.includes('More than 20')) {
    freeTimeGuidance = 'PLENTY OF TIME: User has significant availability. Can recommend longer activities, multi-day events, intensive workshops.';
  } else {
    freeTimeGuidance = 'MODERATE TIME: Recommend activities that fit typical schedules (2-4 hours).';
  }
  
  const travelDistance = survey.Travel_Distance_Willing || '';
  let travelGuidance = '';
  if (travelDistance.includes('Less than 5') || travelDistance.includes('5-10')) {
    travelGuidance = 'LOCAL ONLY: Prioritize events within walking distance or short drive. Avoid recommending events far away.';
  } else if (travelDistance.includes('15+')) {
    travelGuidance = 'WILLING TO TRAVEL: User is open to events further away. Can include events in neighboring areas.';
  } else {
    travelGuidance = 'MODERATE DISTANCE: Focus on events within reasonable distance, prioritize closer options.';
  }
  
  return `## HOW TO INTERPRET THIS DATA

### Understanding Personality Scores:
- **Extraversion (${scores.Extraversion_Raw}/14 - ${scores.Extraversion_Category}):**
  - This measures how much energy the user gains from social interaction
  - ${extraversionGuidance}
  
- **Conscientiousness (${scores.Conscientiousness_Raw}/14 - ${scores.Conscientiousness_Category}):**
  - This measures preference for structure and planning
  - ${conscientiousnessGuidance}
  
- **Openness (${scores.Openness_Raw}/14 - ${scores.Openness_Category}):**
  - This measures openness to new experiences
  - ${opennessGuidance}

### Understanding Motivation Scores:
- **Primary Motivation: ${scores.Primary_Motivation}** - This is their MAIN driver. Weight this highest.
- **Intrinsic (${scores.Intrinsic_Motivation.toFixed(1)}/5):** ${intrinsicGuidance}
- **Social (${scores.Social_Motivation.toFixed(1)}/5):** ${socialGuidance}
- **Achievement (${scores.Achievement_Motivation.toFixed(1)}/5):** ${achievementGuidance}

### Understanding Social Needs:
- **Close Friends: ${closeFriendsCount}** - ${closeFriendsGuidance}
- **Social Satisfaction: ${socialSatisfaction}** - ${satisfactionGuidance}
- **Loneliness: ${lonelinessFreq}** - ${lonelinessGuidance}
- **Looking For: ${Array.isArray(survey.Looking_For) ? survey.Looking_For.join(', ') : survey.Looking_For}** - Interpret each:
${lookingForGuidance}

### Understanding Preferences:
- **Free Time: ${freeTime}** - ${freeTimeGuidance}
- **Travel Distance: ${travelDistance}** - ${travelGuidance}
- **Setting Preferences:**
${buildDetailedSettingPreferences(survey)}

## DECISION PRIORITY ORDER:

When selecting recommendations, prioritize in this order:

1. **MUST MATCH (Non-negotiable):**
   - Interest categories (ONLY from: ${Array.isArray(survey.Interest_Categories) ? survey.Interest_Categories.join(', ') : survey.Interest_Categories})
   - Time window (within 14 days)
   - Travel distance (${travelDistance})

2. **HIGH PRIORITY (Strongly weight):**
${scores.Extraversion_Category === 'Low' && (lonelinessFreq.includes('Often') || lonelinessFreq.includes('Always')) ? '  - CRITICAL: Low extraversion + high loneliness = Small, welcoming groups with structured social time' : ''}
  - ${scores.Primary_Motivation} motivation (${scores.Primary_Motivation === 'Intrinsic' ? scores.Intrinsic_Motivation.toFixed(1) : scores.Primary_Motivation === 'Social' ? scores.Social_Motivation.toFixed(1) : scores.Achievement_Motivation.toFixed(1)}/5)
  - ${lonelinessFreq.includes('Often') || lonelinessFreq.includes('Always') ? 'HIGH LONELINESS - Prioritize community-building' : 'Social needs'}
  - Setting preferences

3. **MEDIUM PRIORITY (Consider):**
  - Other personality traits (conscientiousness, openness)
  - Secondary motivations
  - Affinity groups (70/30 rule)

4. **NICE TO HAVE:**
  - Variety in categories
  - Mix of recurring/one-time
  - Group size diversity

## COMBINING SIGNALS - DECISION MATRIX:

When multiple signals point in different directions, use these rules:

**Personality Conflicts:**
- High Extraversion + Low Openness → Large groups doing familiar activities
- Low Extraversion + High Openness → Small groups trying new things
- High Conscientiousness + Low Extraversion → Structured small-group activities
- Low Conscientiousness + High Extraversion → Spontaneous large-group events

**Motivation Conflicts:**
- High Social + High Achievement → Skill-building classes with strong community
- High Intrinsic + Low Social → Fun activities that happen to be social
- High Achievement + Low Conscientiousness → Flexible learning opportunities

**Social Needs Override:**
- If loneliness is HIGH, prioritize social connection over other factors
- If social satisfaction is LOW, prioritize new social circles
- If close friends count is LOW, prioritize welcoming beginner groups`;
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
  
  // Build interpretation section
  const interpretationSection = buildInterpretationSection(user, survey, scores);
  
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

CRITICAL - INTEREST RESTRICTIONS:
- ONLY recommend activities from the interest categories listed above: ${Array.isArray(survey.Interest_Categories) ? survey.Interest_Categories.join(', ') : survey.Interest_Categories}
- DO NOT recommend activities from categories NOT in the list above
- If "Sports & Fitness" is NOT in the list, DO NOT recommend any sports activities
- If "Arts & Culture" is NOT in the list, DO NOT recommend arts/cultural activities
- Only use the specific interest categories the user has selected

Social Needs:
- Close Friends: ${survey.Close_Friends_Count}
- Social Satisfaction: ${survey.Social_Satisfaction}
- Loneliness: ${survey.Loneliness_Frequency}

Preferences:
- Free Time: ${survey.Free_Time_Per_Week}
- Travel Distance: ${survey.Travel_Distance_Willing}

${affinityGroups.length > 0 ? `Affinity Groups: ${affinityGroups.join('; ')}` : ''}

---

${interpretationSection}

---

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
- 50% should be RECURRING ORGANIZATIONS/GROUPS: clubs, classes, regular meetups, ongoing groups (ONLY from interest categories listed above)
- 50% should be ONE-TIME EVENTS: workshops, concerts, festivals, pop-ups, street events (ONLY from interest categories listed above)
- EVERY concept must be SOCIAL - done with others, not solo
- Focus on URBAN-FRIENDLY activities that thrive in cities
- NOT rural activities: avoid camping, fishing, hunting, birdwatching
- NOT solo activities: avoid individual hobbies, solo workouts, personal projects
- Urban outdoor activities: urban hiking groups, park fitness groups, walking tours, community gardens
- Diverse categories (at least 3 different types)
- Each concept tailored to THIS specific person in an URBAN, SOCIAL environment

SEARCH QUERY REQUIREMENTS (CRITICAL):
- For RECURRING activities: Search for ORGANIZATIONS, LEAGUES, CLUBS, GROUPS, CLASSES (ONLY from interest categories listed above)
  * Format: "join [activity] league [location]", "join [activity] club [location]", "[activity] meetup group [location]", "[activity] class [location]"
  * Examples (only if those categories are selected): "join pottery club ${location}", "join book club ${location}", "join cooking class ${location}", "join art workshop ${location}"
  
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

