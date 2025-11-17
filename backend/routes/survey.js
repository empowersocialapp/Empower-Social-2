const express = require('express');
const router = express.Router();
const Airtable = require('airtable');
const { createUser, createSurveyResponse, createCalculatedScores, updateSurveyResponse, updateCalculatedScores } = require('../services/airtable');
const { generateRecommendations, savePromptToAirtable } = require('../services/openai');

// Initialize Airtable base
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

/**
 * Validate survey submission data
 * @param {Object} data - Survey submission data
 * @returns {Object} {valid: boolean, error?: string}
 */
function validateSurveyData(data) {
  // Validate user fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    return { valid: false, error: 'Username is required (minimum 3 characters)' };
  }

  // Email validation with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
    return { valid: false, error: 'Valid email is required (format: name@domain.com)' };
  }

  if (!data.age || typeof data.age !== 'number' || data.age < 1 || data.age > 120) {
    return { valid: false, error: 'Valid age is required (1-120)' };
  }

  if (!data.gender || typeof data.gender !== 'string' || data.gender.trim().length === 0) {
    return { valid: false, error: 'Gender is required' };
  }

  // Zipcode validation - must be 5 digits
  const zipcodeRegex = /^\d{5}$/;
  if (!data.zipcode || typeof data.zipcode !== 'string' || !zipcodeRegex.test(data.zipcode.trim())) {
    return { valid: false, error: 'Valid zipcode is required (5 digits)' };
  }
  
  // Validate personality scores (Q1, Q6, Q3, Q8, Q5, Q10 - 1-7 scale)
  if (!data.personality || typeof data.personality !== 'object') {
    return { valid: false, error: 'Personality scores are required' };
  }
  
  const personalityQuestions = ['q1', 'q6', 'q3', 'q8', 'q5', 'q10'];
  for (const q of personalityQuestions) {
    const score = data.personality[q];
    if (score === undefined || score === null || typeof score !== 'number' || score < 1 || score > 7) {
      return { valid: false, error: `Personality question ${q} must be a number between 1 and 7` };
    }
  }
  
  // Validate motivation scores (M1-M6 - 1-5 scale)
  if (!data.motivation || typeof data.motivation !== 'object') {
    return { valid: false, error: 'Motivation scores are required' };
  }
  
  const motivationQuestions = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
  for (const m of motivationQuestions) {
    const score = data.motivation[m];
    if (score === undefined || score === null || typeof score !== 'number' || score < 1 || score > 5) {
      return { valid: false, error: `Motivation question ${m} must be a number between 1 and 5` };
    }
  }
  
  // Validate at least one interest category is selected
  if (!data.interests || !data.interests.categories || !Array.isArray(data.interests.categories) || data.interests.categories.length === 0) {
    return { valid: false, error: 'Please select at least one interest category' };
  }
  
  return { valid: true };
}

/**
 * POST /api/submit-survey
 * Submit survey data and create records in Airtable
 */
router.post('/submit-survey', async (req, res) => {
  try {
    const surveyData = req.body;
    
    // Validate request body
    if (!surveyData || typeof surveyData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }
    
    // Check if this is an edit mode submission
    const isEditMode = surveyData.isEdit === true && surveyData.userId;
    let userId;
    let surveyResponseId;
    let calculatedScoresId;
    
    // Extract user data
    const userData = {
      name: surveyData.name.trim(),
      username: surveyData.username.trim(),
      email: surveyData.email.trim(),
      age: surveyData.age,
      gender: surveyData.gender.trim(),
      zipcode: surveyData.zipcode.trim()
    };
    
    if (isEditMode) {
      // EDIT MODE: Update existing records
      userId = surveyData.userId;
      
      // Validate all required fields
      const validation = validateSurveyData(surveyData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
      
      // Step 1: Update user record
      try {
        await base('Users').update(userId, {
          Name: userData.name,
          Username: userData.username,
          Email: userData.email,
          Age: userData.age,
          Gender: userData.gender,
          Zipcode: userData.zipcode
        });
      } catch (userError) {
        return res.status(500).json({
          success: false,
          error: `Failed to update user: ${userError.message}`
        });
      }
      
      // Step 2: Find and update existing survey response
      let surveyResponses = await base('Survey_Responses')
        .select({
          filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
          maxRecords: 1
        })
        .firstPage();
      
      // Fallback: fetch all and filter
      if (surveyResponses.length === 0) {
        const allRecent = await base('Survey_Responses')
          .select({ maxRecords: 100 })
          .firstPage();
        
        surveyResponses = allRecent.filter(record => {
          const userLinks = record.fields.User || [];
          return Array.isArray(userLinks) && userLinks.includes(userId);
        });
      }
      
      if (surveyResponses.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No survey response found to update'
        });
      }
      
      surveyResponseId = surveyResponses[0].id;
      
      // Update survey response
      const updateResult = await updateSurveyResponse(surveyResponseId, surveyData);
      if (!updateResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to update survey response: ${updateResult.error}`
        });
      }
      
      // Step 3: Update calculated scores
      const scoresResult = await updateCalculatedScores(userId, surveyResponseId);
      if (!scoresResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to update calculated scores: ${scoresResult.error}`
        });
      }
      
      calculatedScoresId = scoresResult.data.calculatedScoresId;
      
      // Small delay to ensure Airtable has fully updated the record
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Regenerate recommendations with updated data
      // Re-fetch the survey response to ensure we have the latest data
      const updatedSurveyResponse = await base('Survey_Responses').find(surveyResponseId);
      console.log('Updated Interest_Categories:', updatedSurveyResponse.fields.Interest_Categories);
      
      const { generateRecommendationsV2 } = require('../services/recommendations-v2');
      
      let recommendationsResult;
      try {
        console.log('Attempting conceptual recommendation system for survey update...');
        recommendationsResult = await generateRecommendationsV2(userId, surveyResponseId, calculatedScoresId);
        
        if (!recommendationsResult.success) {
          console.warn('Conceptual system failed, falling back to legacy:', recommendationsResult.error);
          throw new Error(recommendationsResult.error);
        }
      } catch (v2Error) {
        console.log('Conceptual system failed, using legacy system as fallback:', v2Error.message);
        
        // Fallback to legacy system
        const { generateRecommendations, savePromptToAirtable } = require('../services/openai');
        recommendationsResult = await generateRecommendations(userId, surveyResponseId, calculatedScoresId);
        
        if (!recommendationsResult.success) {
          return res.status(500).json({
            success: false,
            error: `Failed to regenerate recommendations: ${recommendationsResult.error}`
          });
        }
        
        const { recommendations, promptText } = recommendationsResult.data;
        
        // Save prompt and recommendations to GPT_Prompts table
        const saveResult = await savePromptToAirtable(
          userId,
          surveyResponseId,
          calculatedScoresId,
          promptText,
          recommendations
        );
        
        if (!saveResult.success) {
          console.error('Failed to save prompt to Airtable:', saveResult.error);
        }
        
        // Success response with recommendations
        return res.status(200).json({
          success: true,
          userId: userId,
          recommendations: recommendations,
          message: 'Survey updated successfully and recommendations regenerated (legacy system)'
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
      
      return res.status(200).json({
        success: true,
        userId: userId,
        recommendations: recommendationsText,
        message: 'Survey updated successfully and recommendations regenerated'
      });
    } else {
      // NEW SUBMISSION MODE: Create new records (existing logic)
      // Validate all required fields
      const validation = validateSurveyData(surveyData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
      
      // Step 1: Create user record
      const userResult = await createUser(userData);
      if (!userResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to create user: ${userResult.error}`
        });
      }
      
      userId = userResult.data.userId;
    
    // Step 2: Create survey response record
    const surveyResult = await createSurveyResponse(surveyData, userId);
    if (!surveyResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create survey response: ${surveyResult.error}`
      });
    }
    
    const surveyResponseId = surveyResult.data.surveyResponseId;
    
    // Step 3: Create calculated scores record
    const scoresResult = await createCalculatedScores(userId, surveyResponseId);
    if (!scoresResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create calculated scores: ${scoresResult.error}`
      });
    }
    
    const calculatedScoresId = scoresResult.data.calculatedScoresId;
    
    // Step 4: Generate conceptual recommendations
    const { generateRecommendationsV2 } = require('../services/recommendations-v2');
    
    let recommendationsResult;
    try {
      console.log('Attempting conceptual recommendation system for survey submission...');
      recommendationsResult = await generateRecommendationsV2(userId, surveyResponseId, calculatedScoresId);
      
      if (!recommendationsResult.success) {
        console.warn('Conceptual system failed, falling back to legacy:', recommendationsResult.error);
        throw new Error(recommendationsResult.error);
      }
    } catch (v2Error) {
      console.log('Conceptual system failed, using legacy system as fallback:', v2Error.message);
      
      // Fallback to legacy system
      const { generateRecommendations, savePromptToAirtable } = require('../services/openai');
      recommendationsResult = await generateRecommendations(userId, surveyResponseId, calculatedScoresId);
      
      if (!recommendationsResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to generate recommendations: ${recommendationsResult.error}`
        });
      }
      
      const { recommendations, promptText } = recommendationsResult.data;
      
      // Save prompt and recommendations to GPT_Prompts table
      const saveResult = await savePromptToAirtable(
        userId,
        surveyResponseId,
        calculatedScoresId,
        promptText,
        recommendations
      );
      
      if (!saveResult.success) {
        console.error('Failed to save prompt to Airtable:', saveResult.error);
      }
      
      // Success response with recommendations
      return res.status(201).json({
        success: true,
        userId: userId,
        recommendations: recommendations,
        message: 'Survey submitted successfully and recommendations generated (legacy system)'
      });
    }
    
    // Conceptual system succeeded - recommendations are already saved in generateRecommendationsV2
    // Return success response with userId for frontend redirect
    return res.status(201).json({
      success: true,
      userId: userId,
      message: 'Survey submitted successfully and recommendations generated'
    });
    }
    
  } catch (error) {
    console.error('Error in submit-survey endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/survey/:userId
 * Get survey data for a user to pre-fill edit form
 */
router.get('/survey/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Get user data
    let user;
    try {
      user = await base('Users').find(userId);
    } catch (userError) {
      console.error('Error fetching user:', userError);
      if (userError.error === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'User not found. Please make sure you have completed the survey.'
        });
      }
      return res.status(500).json({
        success: false,
        error: `Error fetching user: ${userError.message || 'Unknown error'}`
      });
    }

    // Get survey response
    let surveyResponses = await base('Survey_Responses')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 1
      })
      .firstPage();

    // Fallback: fetch all and filter
    if (surveyResponses.length === 0) {
      const allRecent = await base('Survey_Responses')
        .select({ maxRecords: 100 })
        .firstPage();

      surveyResponses = allRecent.filter(record => {
        const userLinks = record.fields.User || [];
        return Array.isArray(userLinks) && userLinks.includes(userId);
      });
    }

    if (surveyResponses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No survey data found for this user'
      });
    }

    const surveyResponse = surveyResponses[0];
    const fields = surveyResponse.fields;

    // Format response for frontend
    const surveyData = {
      name: user.fields.Name,
      username: user.fields.Username,
      email: user.fields.Email,
      age: user.fields.Age,
      gender: user.fields.Gender,
      zipcode: user.fields.Zipcode,
      personality: {
        q1: fields.Q1_Extraverted_Enthusiastic,
        q6: fields.Q6_Reserved_Quiet,
        q3: fields.Q3_Dependable_Disciplined,
        q8: fields.Q8_Disorganized_Careless,
        q5: fields.Q5_Open_Complex,
        q10: fields.Q10_Conventional_Uncreative
      },
      motivation: {
        m1: fields.M1_Enjoyable_Fun,
        m2: fields.M2_Time_With_People,
        m3: fields.M3_Develop_Skills,
        m4: fields.M4_Energized_Engaged,
        m5: fields.M5_Meet_New_People,
        m6: fields.M6_Challenge_Myself
      },
      social: {
        closeFriends: fields.Close_Friends_Count,
        satisfaction: fields.Social_Satisfaction,
        loneliness: fields.Loneliness_Frequency,
        lookingFor: fields.Looking_For || []
      },
      interests: {
        categories: fields.Interest_Categories || [],
        specific: fields.Specific_Interests || ''
      },
      preferences: {
        freeTime: fields.Free_Time_Per_Week,
        travelDistance: fields.Travel_Distance_Willing,
        indoor: fields.Pref_Indoor,
        outdoor: fields.Pref_Outdoor,
        physical: fields.Pref_Physical_Active,
        relaxed: fields.Pref_Relaxed_Lowkey,
        structured: fields.Pref_Structured,
        spontaneous: fields.Pref_Spontaneous
      },
      affinityGroups: {
        faith: fields.Affinity_Faith_Based || [],
        lgbtq: fields.Affinity_LGBTQ || [],
        cultural: fields.Affinity_Cultural_Ethnic || [],
        womens: fields.Affinity_Womens || [],
        youngProf: fields.Affinity_Young_Prof || [],
        international: fields.Affinity_International || []
      }
    };

    return res.json({
      success: true,
      data: surveyData
    });

  } catch (error) {
    console.error('Error fetching survey data:', error);
    
    // Handle Airtable-specific errors
    if (error.error === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'User or survey data not found. Please make sure you have completed the survey.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

