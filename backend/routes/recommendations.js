const express = require('express');
const router = express.Router();
const Airtable = require('airtable');
const { geocodeZipcode } = require('../services/events');

// Initialize Airtable base
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

/**
 * GET /api/recommendations/:userId
 * Fetch recommendations for a user
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Fetch GPT_Prompts records for this user
    // Try multiple query formats to handle different Airtable field types
    console.log(`Querying GPT_Prompts for userId: ${userId}`);

    let prompts = await base('GPT_Prompts')
      .select({
        filterByFormula: `{User} = '${userId}'`,
        maxRecords: 10
      })
      .firstPage();

    console.log(`Query 1 ({User} = '${userId}'): Found ${prompts.length} prompts`);

    // If that doesn't work, try the array format
    if (prompts.length === 0) {
      prompts = await base('GPT_Prompts')
        .select({
          filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
          maxRecords: 10
        })
        .firstPage();
      console.log(`Query 2 (FIND in ARRAYJOIN): Found ${prompts.length} prompts`);
    }

    // Try a third format - fetch all recent and filter in JavaScript
    if (prompts.length === 0) {
      try {
        const allRecent = await base('GPT_Prompts')
          .select({
            maxRecords: 100
          })
          .firstPage();

        // Filter in JavaScript by checking if User array contains our userId
        prompts = allRecent.filter(record => {
          const userLinks = record.fields.User || [];
          const isMatch = Array.isArray(userLinks) && userLinks.includes(userId);
          if (isMatch) {
            console.log(`Found matching prompt: ${record.id}, User field:`, userLinks);
          }
          return isMatch;
        });

        // Sort by createdTime in JavaScript (newest first)
        prompts.sort((a, b) => {
          const timeA = new Date(a._rawJson?.createdTime || a.createdTime || 0).getTime();
          const timeB = new Date(b._rawJson?.createdTime || b.createdTime || 0).getTime();
          return timeB - timeA;
        });

        console.log(`Query 3 (fetch all and filter): Found ${prompts.length} prompts`);
      } catch (fetchAllError) {
        console.log(`Query 3 failed: ${fetchAllError.message}`);
      }
    }

    if (prompts.length === 0) {
      console.error(`No GPT_Prompts found for userId: ${userId} after trying all query formats`);
      return res.status(404).json({
        success: false,
        error: 'No recommendations found for this user'
      });
    }

    // Sort by createdTime (newest first) and get the latest
    const sortedPrompts = prompts.sort((a, b) => {
      const timeA = new Date(a.createdTime || 0).getTime();
      const timeB = new Date(b.createdTime || 0).getTime();
      return timeB - timeA; // Descending order (newest first)
    });

    const promptRecord = sortedPrompts[0];
    const recommendations = promptRecord.fields.Recommendations_Generated || '';

    // Also fetch user data
    const user = await base('Users').find(userId);
    
    // Geocode zipcode to get city/state for location display
    let userLocation = null;
    if (user.fields?.Zipcode) {
      try {
        const locationData = await geocodeZipcode(user.fields.Zipcode);
        if (locationData?.city && locationData?.state) {
          userLocation = `${locationData.city}, ${locationData.state}`;
        }
      } catch (geocodeError) {
        console.warn('Failed to geocode zipcode:', geocodeError.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        userName: user.fields.Name,
        userEmail: user.fields.Email,
        recommendations: recommendations,
        userLocation: userLocation, // City, State format
        createdAt: promptRecord.createdTime || null
      }
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/recommendations/:userId/regenerate
 * Regenerate recommendations for a user
 */
router.post('/recommendations/:userId/regenerate', async (req, res) => {
  try {
    const { userId } = req.params;
    const { surveyResponseId, calculatedScoresId } = req.body; // Allow IDs to be passed in body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // First verify the user exists
    try {
      const user = await base('Users').find(userId);
      console.log(`User found: ${user.fields.Name} (${user.fields.Email})`);
    } catch (userError) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please make sure you completed the survey.'
      });
    }

    // If IDs are provided, use them directly; otherwise, find them
    let surveyResponseIdToUse = surveyResponseId;
    let calculatedScoresIdToUse = calculatedScoresId;

    // Get user's latest survey response and calculated scores (only if not provided)
    if (!surveyResponseIdToUse || !calculatedScoresIdToUse) {
      // Try multiple query formats to handle different Airtable field types
      console.log(`Querying for survey responses for userId: ${userId}`);

      let surveyResponses = await base('Survey_Responses')
        .select({
          filterByFormula: `{User} = '${userId}'`,
          maxRecords: 10
        })
        .firstPage();

      console.log(`Query 1 ({User} = '${userId}'): Found ${surveyResponses.length} responses`);

      // If that doesn't work, try the array format
      if (surveyResponses.length === 0) {
        surveyResponses = await base('Survey_Responses')
          .select({
            filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
            maxRecords: 10
          })
          .firstPage();
        console.log(`Query 2 (FIND in ARRAYJOIN): Found ${surveyResponses.length} responses`);
      }

      // Try a third format - using the RECORD_ID() function
      if (surveyResponses.length === 0) {
        try {
          surveyResponses = await base('Survey_Responses')
            .select({
              filterByFormula: `SEARCH('${userId}', ARRAYJOIN({User}))`,
              maxRecords: 10
            })
            .firstPage();
          console.log(`Query 3 (SEARCH in ARRAYJOIN): Found ${surveyResponses.length} responses`);
        } catch (searchError) {
          console.log(`Query 3 failed: ${searchError.message}`);
        }
      }

      // Last resort: try to get all recent survey responses and filter in JavaScript
      if (surveyResponses.length === 0) {
        try {
          const allRecent = await base('Survey_Responses')
            .select({
              maxRecords: 100
            })
            .firstPage();

          // Filter in JavaScript by checking if User array contains our userId
          surveyResponses = allRecent.filter(record => {
            const userLinks = record.fields.User || [];
            return Array.isArray(userLinks) && userLinks.includes(userId);
          });
          console.log(`Query 4 (fetch all and filter): Found ${surveyResponses.length} responses`);
        } catch (fetchAllError) {
          console.log(`Query 4 failed: ${fetchAllError.message}`);
        }
      }

      if (surveyResponses.length === 0) {
        console.error(`No survey responses found for userId: ${userId} after trying all query formats`);
        return res.status(404).json({
          success: false,
          error: 'No survey response found for this user. It looks like the survey may not have been completed successfully. Please take the survey again.'
        });
      }

      // Sort by createdTime (newest first) and get the latest
      const sortedSurveyResponses = surveyResponses.sort((a, b) => {
        const timeA = new Date(a.createdTime || 0).getTime();
        const timeB = new Date(b.createdTime || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });

      surveyResponseIdToUse = sortedSurveyResponses[0].id;

      // Try multiple query formats for calculated scores
      let calculatedScores = await base('Calculated_Scores')
        .select({
          filterByFormula: `{User} = '${userId}'`,
          maxRecords: 10
        })
        .firstPage();

      // If that doesn't work, try the array format
      if (calculatedScores.length === 0) {
        calculatedScores = await base('Calculated_Scores')
          .select({
            filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
            maxRecords: 10
          })
          .firstPage();
      }

      // Last resort: fetch all and filter in JavaScript
      if (calculatedScores.length === 0) {
        try {
          const allRecent = await base('Calculated_Scores')
            .select({
              maxRecords: 100
            })
            .firstPage();

          // Filter in JavaScript by checking if User array contains our userId
          calculatedScores = allRecent.filter(record => {
            const userLinks = record.fields.User || [];
            return Array.isArray(userLinks) && userLinks.includes(userId);
          });
          console.log(`Query 3 (fetch all and filter): Found ${calculatedScores.length} calculated scores`);
        } catch (fetchAllError) {
          console.log(`Query 3 failed: ${fetchAllError.message}`);
        }
      }

      if (calculatedScores.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No calculated scores found for this user'
        });
      }

      // Sort by createdTime (newest first) and get the latest
      const sortedCalculatedScores = calculatedScores.sort((a, b) => {
        const timeA = new Date(a.createdTime || 0).getTime();
        const timeB = new Date(b.createdTime || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });

      calculatedScoresIdToUse = sortedCalculatedScores[0].id;
    }

    // Generate conceptual recommendations
    const { generateRecommendationsV2 } = require('../services/recommendations-v2');
    const { generateRecommendations, savePromptToAirtable } = require('../services/openai');

    let recommendationsResult;
    let method = 'conceptual_only';

    // Try v2 conceptual system first, fallback to legacy if it fails
    // Bypass cache when explicitly regenerating
    try {
      console.log('Attempting conceptual recommendation system (bypassing cache)...');
      recommendationsResult = await generateRecommendationsV2(userId, surveyResponseIdToUse, calculatedScoresIdToUse, null, true);

      if (!recommendationsResult.success) {
        console.warn('Conceptual system failed, falling back to legacy:', recommendationsResult.error);
        throw new Error(recommendationsResult.error);
      }
    } catch (v2Error) {
      console.log('Conceptual system failed, using legacy system as fallback:', v2Error.message);
      method = 'legacy';

      // Fallback to legacy system
      recommendationsResult = await generateRecommendations(userId, surveyResponseIdToUse, calculatedScoresIdToUse);

      if (!recommendationsResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to generate recommendations: ${recommendationsResult.error}`
        });
      }

      // Legacy system needs manual saving
      const { recommendations, promptText } = recommendationsResult.data;
      const saveResult = await savePromptToAirtable(
        userId,
        surveyResponseIdToUse,
        calculatedScoresIdToUse,
        promptText,
        recommendations
      );

      if (!saveResult.success) {
        console.error('Failed to save prompt to Airtable:', saveResult.error);
      }

      // Get user location (city, state) for display
      let userLocation = null;
      try {
        const user = await base('Users').find(userId);
        if (user.fields?.Zipcode) {
          const locationData = await geocodeZipcode(user.fields.Zipcode);
          if (locationData?.city && locationData?.state) {
            userLocation = `${locationData.city}, ${locationData.state}`;
          }
        }
      } catch (locationError) {
        console.warn('Failed to geocode zipcode for regenerate (legacy):', locationError.message);
      }

      return res.status(200).json({
        success: true,
        userId: userId,
        recommendations: recommendations,
        userLocation: userLocation, // City, State format
        method: method,
        message: 'Recommendations regenerated successfully (legacy system)'
      });
    }

    // Conceptual system succeeded
    const { recommendations, stats } = recommendationsResult.data;

    // Convert array to string if needed (v2 system returns array)
    const recommendationsText = Array.isArray(recommendations)
      ? recommendations.map(r =>
        `${r.name}\n${r.whyItMatches}\n${r.date} ${r.time} at ${r.location}\n${r.url}`
      ).join('\n\n---\n\n')
      : recommendations;

    // Get user location (city, state) for display
    let userLocation = null;
    try {
      const user = await base('Users').find(userId);
      if (user.fields?.Zipcode) {
        const locationData = await geocodeZipcode(user.fields.Zipcode);
        if (locationData?.city && locationData?.state) {
          userLocation = `${locationData.city}, ${locationData.state}`;
        }
      }
    } catch (locationError) {
      console.warn('Failed to geocode zipcode for regenerate:', locationError.message);
    }

    return res.status(200).json({
      success: true,
      userId: userId,
      recommendations: recommendationsText,
      userLocation: userLocation, // City, State format
      method: method,
      stats: stats,
      message: 'Recommendations regenerated successfully (conceptual system)'
    });

  } catch (error) {
    console.error('Error regenerating recommendations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/user/by-email
 * Find user by email address
 */
router.post('/user/by-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Search for user by email
    const users = await base('Users')
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        userName: user.fields.Name,
        userEmail: user.fields.Email
      }
    });

  } catch (error) {
    console.error('Error finding user by email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/test/create-test-user
 * Create a test user with survey response and recommendations (for testing only)
 */
router.post('/test/create-test-user', async (req, res) => {
  try {
    const { email = 'test@example.com', name = 'Test User', zipcode = '22903' } = req.body;

    const { createUser, createSurveyResponse, createCalculatedScores } = require('../services/airtable');
    const { generateRecommendationsV2 } = require('../services/recommendations-v2');
    const { generateRecommendations, savePromptToAirtable } = require('../services/openai');

    // Create test user
    const userResult = await createUser({
      name: name,
      email: email,
      age: 30,
      gender: 'Other',
      zipcode: zipcode
    });

    if (!userResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create user: ${userResult.error}`
      });
    }

    const userId = userResult.data.userId;

    // Create test survey response with dummy data
    const testSurveyData = {
      personality: { q1: 5, q6: 3, q3: 6, q8: 2, q5: 4, q10: 3 },
      motivation: { m1: 4, m2: 5, m3: 3, m4: 4, m5: 5, m6: 3 },
      social: {
        closeFriends: '6-10',
        satisfaction: 'Neutral (4)',
        loneliness: 'Sometimes (3)',
        lookingFor: [] // Empty array to avoid select option errors
      },
      interests: {
        categories: ['sports', 'social', 'outdoor'],
        specific: 'Running, hiking, social events'
      },
      preferences: {
        freeTime: '5-10 hours',
        travelDistance: '5-15 miles',
        indoor: true,
        outdoor: true,
        physical: true,
        relaxed: false,
        structured: true,
        spontaneous: false
      },
      affinityGroups: {
        faith: [],
        lgbtq: [],
        cultural: [],
        womens: [],
        youngProf: [], // Empty to avoid mapping issues
        international: []
      }
    };

    const surveyResult = await createSurveyResponse(testSurveyData, userId);
    if (!surveyResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create survey response: ${surveyResult.error}`
      });
    }

    const surveyResponseId = surveyResult.data.surveyResponseId;

    // Create calculated scores
    const scoresResult = await createCalculatedScores(userId, surveyResponseId);
    if (!scoresResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create calculated scores: ${scoresResult.error}`
      });
    }

    const calculatedScoresId = scoresResult.data.calculatedScoresId;

    // Generate conceptual recommendations
    let recommendationsResult;
    let method = 'conceptual_only';

    try {
      console.log('Attempting conceptual recommendation system for test user...');
      recommendationsResult = await generateRecommendationsV2(userId, surveyResponseId, calculatedScoresId);

      if (!recommendationsResult.success) {
        console.warn('Conceptual system failed, falling back to legacy:', recommendationsResult.error);
        throw new Error(recommendationsResult.error);
      }
    } catch (v2Error) {
      console.log('Conceptual system failed, using legacy system as fallback:', v2Error.message);
      method = 'legacy';

      // Fallback to legacy system
      recommendationsResult = await generateRecommendations(userId, surveyResponseId, calculatedScoresId);
      if (!recommendationsResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to generate recommendations: ${recommendationsResult.error}`
        });
      }

      // Legacy system needs manual saving
      const { recommendations, promptText } = recommendationsResult.data;
      const saveResult = await savePromptToAirtable(
        userId,
        surveyResponseId,
        calculatedScoresId,
        promptText,
        recommendations
      );

      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          userName: name,
          userEmail: email,
          zipcode: zipcode,
          surveyResponseId: surveyResponseId,
          calculatedScoresId: calculatedScoresId,
          recommendations: recommendations,
          method: method,
          warning: recommendationsResult.data?.warning || null,
          message: 'Test user created successfully with recommendations (legacy system)'
        }
      });
    }

    // Conceptual system succeeded
    const { recommendations, stats, promptId, warning } = recommendationsResult.data;

    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        userName: name,
        userEmail: email,
        zipcode: zipcode,
        surveyResponseId: surveyResponseId,
        calculatedScoresId: calculatedScoresId,
        recommendations: recommendations,
        promptId: promptId,
        method: method,
        stats: stats,
        warning: warning || null,
        message: 'Test user created successfully with recommendations (conceptual system)'
      }
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});


/**
 * POST /api/recommendation-feedback
 * Save user feedback on recommendations
 */
router.post('/recommendation-feedback', async (req, res) => {
  try {
    const { userId, recommendationId, action, reason, timestamp } = req.body;

    if (!userId || !recommendationId || !action) {
      return res.status(400).json({
        success: false,
        error: 'userId, recommendationId, and action are required'
      });
    }

    // Validate action
    const validActions = ['interested', 'maybe', 'not-interested'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `action must be one of: ${validActions.join(', ')}`
      });
    }

    // Save to Airtable (or log for now if table doesn't exist)
    try {
      // Try to create record in Recommendation_Feedback table
      const fields = {
        User: [userId],
        Recommendation_ID: recommendationId,
        Action: action,
        Reason: reason || null,
        Timestamp: timestamp || new Date().toISOString()
      };

      await base('Recommendation_Feedback').create([{ fields }]);

      return res.status(200).json({
        success: true,
        message: 'Feedback saved successfully'
      });
    } catch (airtableError) {
      // If table doesn't exist, log the feedback for now
      console.log('Recommendation Feedback (table may not exist):', {
        userId,
        recommendationId,
        action,
        reason,
        timestamp
      });

      // Still return success - feedback is non-critical
      return res.status(200).json({
        success: true,
        message: 'Feedback logged (table may need to be created)',
        warning: 'Recommendation_Feedback table may not exist in Airtable'
      });
    }
  } catch (error) {
    console.error('Error saving recommendation feedback:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

