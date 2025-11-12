const express = require('express');
const router = express.Router();
const { createUser, createSurveyResponse, createCalculatedScores } = require('../services/airtable');
const { generateRecommendations, savePromptToAirtable } = require('../services/openai');

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
  
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (!data.age || typeof data.age !== 'number' || data.age < 1 || data.age > 120) {
    return { valid: false, error: 'Valid age is required (1-120)' };
  }
  
  if (!data.gender || typeof data.gender !== 'string' || data.gender.trim().length === 0) {
    return { valid: false, error: 'Gender is required' };
  }
  
  if (!data.zipcode || typeof data.zipcode !== 'string' || data.zipcode.trim().length === 0) {
    return { valid: false, error: 'Zipcode is required' };
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
    
    // Validate all required fields
    const validation = validateSurveyData(surveyData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    // Extract user data
    const userData = {
      name: surveyData.name.trim(),
      email: surveyData.email.trim(),
      age: surveyData.age,
      gender: surveyData.gender.trim(),
      zipcode: surveyData.zipcode.trim()
    };
    
    // Step 1: Create user record
    const userResult = await createUser(userData);
    if (!userResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create user: ${userResult.error}`
      });
    }
    
    const userId = userResult.data.userId;
    
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
    
    // Step 4: Generate recommendations using GPT-4
    // Pass the IDs we just created to avoid querying
    const recommendationsResult = await generateRecommendations(userId, surveyResponseId, calculatedScoresId);
    if (!recommendationsResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to generate recommendations: ${recommendationsResult.error}`
      });
    }
    
    const { recommendations, promptText } = recommendationsResult.data;
    
    // Step 5: Save prompt and recommendations to GPT_Prompts table
    const saveResult = await savePromptToAirtable(
      userId,
      surveyResponseId,
      calculatedScoresId,
      promptText,
      recommendations
    );
    
    if (!saveResult.success) {
      // Log error but don't fail the request - recommendations were generated successfully
      console.error('Failed to save prompt to Airtable:', saveResult.error);
    }
    
    // Success response with recommendations
    return res.status(201).json({
      success: true,
      userId: userId,
      recommendations: recommendations,
      message: 'Survey submitted successfully and recommendations generated'
    });
    
  } catch (error) {
    console.error('Error in submit-survey endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

