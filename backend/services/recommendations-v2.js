const { generateConceptualRecommendations } = require('./openai-conceptual');
const { base } = require('./airtable');
const { geocodeZipcode } = require('./events');

// Simple in-memory cache for concepts (24-hour TTL)
const conceptCache = new Map();

/**
 * Generate conceptual recommendations only (no event matching)
 * @param {string} userId - Airtable User record ID
 * @param {string} [surveyResponseId] - Optional: Airtable Survey_Response record ID
 * @param {string} [calculatedScoresId] - Optional: Airtable Calculated_Scores record ID
 * @param {number} [numRecommendations] - Optional: Number of recommendations (default: 5)
 * @param {boolean} [bypassCache] - Optional: If true, bypass cache and generate new recommendations
 * @returns {Promise<Object>} {success: boolean, data: {...} | error: string}
 */
async function generateRecommendationsV2(userId, surveyResponseId = null, calculatedScoresId = null, numRecommendations = null, bypassCache = false) {
  try {
    const isTestMode = process.env.TEST_MODE === 'true';
    const recommendationsCount = isTestMode ? 1 : (numRecommendations || parseInt(process.env.RECOMMENDATIONS_COUNT) || 5);
    
    console.log(`🎯 Generating ${recommendationsCount} conceptual recommendations`);
    
    // 1. Fetch user data from Airtable
    const user = await base('Users').find(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // 2. Fetch survey response
    let surveyResponse;
    if (surveyResponseId) {
      surveyResponse = await base('Survey_Responses').find(surveyResponseId);
    } else {
      const surveyRecords = await base('Survey_Responses')
        .select({ filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))` })
        .all();
      
      if (surveyRecords.length === 0) {
        return { success: false, error: 'No survey response found for this user' };
      }
      
      surveyRecords.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
      surveyResponse = surveyRecords[0];
    }
    
    // 3. Fetch calculated scores
    let calculatedScores;
    if (calculatedScoresId) {
      calculatedScores = await base('Calculated_Scores').find(calculatedScoresId);
    } else {
      const scoreRecords = await base('Calculated_Scores')
        .select({ filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))` })
        .all();
      
      if (scoreRecords.length === 0) {
        return { success: false, error: 'No calculated scores found for this user' };
      }
      
      scoreRecords.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
      calculatedScores = scoreRecords[0];
    }
    
    // 4. Get location from zipcode (with null check)
    const zipcode = user.fields?.Zipcode;
    if (!zipcode) {
      console.warn('No zipcode found for user, using default location');
      return { success: false, error: 'User zipcode is required for recommendations' };
    }
    
    const location = await geocodeZipcode(zipcode);
    const city = location?.city || 'Unknown';
    const state = location?.state || 'Unknown';
    const locationStr = `${city}, ${state}`;
    
    // 5. Build user profile for conceptual generation (with null checks)
    const userProfile = {
      user: {
        Name: user.fields?.Name || 'User',
        Age: user.fields?.Age || 25,
        Gender: user.fields?.Gender || 'Not specified',
        Zipcode: zipcode
      },
      survey: {
        Interest_Categories: surveyResponse.fields?.Interest_Categories || [],
        Specific_Interests: surveyResponse.fields?.Specific_Interests || '',
        Close_Friends_Count: surveyResponse.fields?.Close_Friends_Count || '',
        Social_Satisfaction: surveyResponse.fields?.Social_Satisfaction || '',
        Loneliness_Frequency: surveyResponse.fields?.Loneliness_Frequency || '',
        Free_Time_Per_Week: surveyResponse.fields?.Free_Time_Per_Week || '',
        Travel_Distance_Willing: surveyResponse.fields?.Travel_Distance_Willing || '',
        Affinity_Faith_Based: surveyResponse.fields?.Affinity_Faith_Based || [],
        Affinity_LGBTQ: surveyResponse.fields?.Affinity_LGBTQ || [],
        Affinity_Cultural_Ethnic: surveyResponse.fields?.Affinity_Cultural_Ethnic || [],
        Affinity_Womens: surveyResponse.fields?.Affinity_Womens || [],
        Affinity_Young_Prof: surveyResponse.fields?.Affinity_Young_Prof || [],
        Affinity_International: surveyResponse.fields?.Affinity_International || []
      },
      scores: {
        Extraversion_Raw: calculatedScores.fields?.Extraversion_Raw || 0,
        Extraversion_Category: calculatedScores.fields?.Extraversion_Category || 'Medium',
        Conscientiousness_Raw: calculatedScores.fields?.Conscientiousness_Raw || 0,
        Conscientiousness_Category: calculatedScores.fields?.Conscientiousness_Category || 'Medium',
        Openness_Raw: calculatedScores.fields?.Openness_Raw || 0,
        Openness_Category: calculatedScores.fields?.Openness_Category || 'Medium',
        Primary_Motivation: calculatedScores.fields?.Primary_Motivation || 'Social',
        Intrinsic_Motivation: calculatedScores.fields?.Intrinsic_Motivation || 0,
        Social_Motivation: calculatedScores.fields?.Social_Motivation || 0,
        Achievement_Motivation: calculatedScores.fields?.Achievement_Motivation || 0
      },
      location: locationStr
    };
    
    // 6. Generate conceptual recommendations (with caching)
    console.log('=== Generating conceptual recommendations ===');
    // Create cache key that includes survey data hash to invalidate on changes
    // This ensures edits generate new recommendations
    const surveyDataHash = JSON.stringify({
      interests: surveyResponse.fields.Interest_Categories || [],
      affinities: {
        faith: surveyResponse.fields.Affinity_Faith_Based || [],
        lgbtq: surveyResponse.fields.Affinity_LGBTQ || [],
        cultural: surveyResponse.fields.Affinity_Cultural_Ethnic || [],
        womens: surveyResponse.fields.Affinity_Womens || [],
        youngProf: surveyResponse.fields.Affinity_Young_Prof || [],
        international: surveyResponse.fields.Affinity_International || []
      },
      preferences: {
        freeTime: surveyResponse.fields.Free_Time_Per_Week,
        travel: surveyResponse.fields.Travel_Distance_Willing
      }
    });
    const cacheKey = `${userId}-${surveyResponse.id}-${Buffer.from(surveyDataHash).toString('base64').slice(0, 16)}`;
    let concepts;
    
    if (conceptCache.has(cacheKey)) {
      const cached = conceptCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        console.log('Using cached concepts');
        concepts = cached.concepts;
      } else {
        conceptCache.delete(cacheKey);
      }
    }
    
    if (!concepts) {
      console.log('Generating new concepts (cache miss or expired)');
      const conceptResult = await generateConceptualRecommendations(userProfile, recommendationsCount);
      if (!conceptResult.success) {
        return { success: false, error: `Conceptual generation failed: ${conceptResult.error}` };
      }
      concepts = conceptResult.data.concepts;
      
      // Cache concepts
      conceptCache.set(cacheKey, {
        concepts: concepts,
        timestamp: Date.now()
      });
    }
    
    console.log(`Generated ${concepts.length} concepts`);
    
    // 7. Format concepts for display
    const formattedRecommendations = formatConceptualRecommendations(concepts, locationStr);
    
    // 8. Save to Airtable (GPT_Prompts table)
    const promptText = JSON.stringify({
      concepts: concepts,
      method: 'conceptual_only'
    }, null, 2);
    
    try {
      const recommendationsText = formattedRecommendations.map(r => 
        `${r.name}\n${r.whyItMatches}\n${r.date} ${r.time} at ${r.location}\n${r.url}`
      ).join('\n\n---\n\n');
      
      const fields = {
        User: [userId],
        'Survey Response': [surveyResponse.id],
        'Calculated Scores': [calculatedScores.id],
        Prompt_Text: promptText,
        Recommendations_Generated: recommendationsText
      };
      
      console.log('Saving recommendations to Airtable...');
      const promptRecord = (await base('GPT_Prompts').create([{ fields }]))[0];
      console.log('Successfully saved recommendations to Airtable. Prompt ID:', promptRecord.id);
      
      return {
        success: true,
        data: {
          recommendations: formattedRecommendations,
          concepts: concepts,
          promptText: promptText,
          promptId: promptRecord.id,
          surveyResponseId: surveyResponse.id,
          calculatedScoresId: calculatedScores.id,
          method: 'conceptual_only',
          stats: {
            conceptsGenerated: concepts.length,
            recommendationsReturned: formattedRecommendations.length
          }
        }
      };
    } catch (airtableError) {
      console.error('Error saving to Airtable:', airtableError);
      const errorMessage = airtableError.error?.message || airtableError.message || 'Unknown error';
      return {
        success: true,
        data: {
          recommendations: formattedRecommendations,
          concepts: concepts,
          promptText: promptText,
          surveyResponseId: surveyResponse.id,
          calculatedScoresId: calculatedScores.id,
          method: 'conceptual_only',
          stats: {
            conceptsGenerated: concepts.length,
            recommendationsReturned: formattedRecommendations.length
          },
          warning: 'Failed to save to Airtable: ' + errorMessage
        }
      };
    }
  } catch (error) {
    console.error('Error in generateRecommendationsV2:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate recommendations'
    };
  }
}

/**
 * Format conceptual recommendations for frontend display
 */
function formatConceptualRecommendations(concepts, location) {
  return concepts.map((concept, index) => {
    // For conceptual recommendations, we don't have real dates/times
    const dateStr = concept.isRecurring ? 'Ongoing' : 'Check schedule';
    const timeStr = concept.isRecurring ? 'Varies' : 'TBD';
    
    return {
      name: concept.conceptName,
      url: '#', // No real URL for concepts
      whyItMatches: concept.whyItMatches,
      date: dateStr,
      time: timeStr,
      location: location,
      recurring: concept.isRecurring || false,
      category: concept.category || 'General',
      isConceptual: true // Flag to indicate this is a concept, not a real event
    };
  });
}

module.exports = {
  generateRecommendationsV2
};
