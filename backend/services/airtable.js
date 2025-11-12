const Airtable = require('airtable');

// Initialize Airtable base
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

/**
 * Create a new user record in the Users table
 * @param {Object} userData - User information
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {number} userData.age - User's age
 * @param {string} userData.gender - User's gender
 * @param {string} userData.zipcode - User's zipcode
 * @returns {Promise<Object>} {success: boolean, data: {userId, record} | error: string}
 */
async function createUser(userData) {
  try {
    const { name, email, age, gender, zipcode } = userData;

    if (!name || !email || !age || !gender || !zipcode) {
      return {
        success: false,
        error: 'Missing required user fields: name, email, age, gender, zipcode'
      };
    }

    const records = await base('Users').create([
      {
        fields: {
          Name: name,
          Email: email,
          Age: age,
          Gender: gender,
          Zipcode: zipcode
        }
      }
    ]);

    const record = records[0];
    
    return {
      success: true,
      data: {
        userId: record.id,
        record: record.fields
      }
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user record'
    };
  }
}

/**
 * Create a survey response record linked to a user
 * @param {Object} surveyData - Survey response data
 * @param {string} userId - Airtable User record ID
 * @returns {Promise<Object>} {success: boolean, data: {surveyResponseId, record} | error: string}
 */
async function createSurveyResponse(surveyData, userId) {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'userId is required'
      };
    }

    const { personality, motivation, social, interests, preferences, affinityGroups } = surveyData;

    // Build fields object for Airtable
    const fields = {
      User: [userId], // Link to User record
      
      // Personality questions (mapped to Airtable field names)
      Q1_Extraverted_Enthusiastic: personality?.q1,
      Q6_Reserved_Quiet: personality?.q6,
      Q3_Dependable_Disciplined: personality?.q3,
      Q8_Disorganized_Careless: personality?.q8,
      Q5_Open_Complex: personality?.q5,
      Q10_Conventional_Uncreative: personality?.q10,
      
      // Motivation questions (mapped to Airtable field names)
      M1_Enjoyable_Fun: motivation?.m1,
      M2_Time_With_People: motivation?.m2,
      M3_Develop_Skills: motivation?.m3,
      M4_Energized_Engaged: motivation?.m4,
      M5_Meet_New_People: motivation?.m5,
      M6_Challenge_Myself: motivation?.m6,
      
      // Social fields
      Close_Friends_Count: social?.closeFriends,
      Social_Satisfaction: social?.satisfaction,
      Loneliness_Frequency: social?.loneliness,
      Looking_For: social?.lookingFor || [],
      
      // Interests
      Interest_Categories: interests?.categories || [],
      Specific_Interests: interests?.specific || '',
      
      // Preferences
      Free_Time_Per_Week: preferences?.freeTime,
      Travel_Distance_Willing: preferences?.travelDistance,
      Pref_Indoor: preferences?.indoor || false,
      Pref_Outdoor: preferences?.outdoor || false,
      Pref_Physical_Active: preferences?.physical || false,
      Pref_Relaxed_Lowkey: preferences?.relaxed || false,
      Pref_Structured: preferences?.structured || false,
      Pref_Spontaneous: preferences?.spontaneous || false,
      
      // Affinity groups (6 multiple-select fields)
      Affinity_Faith_Based: affinityGroups?.faith || [],
      Affinity_LGBTQ: affinityGroups?.lgbtq || [],
      Affinity_Cultural_Ethnic: affinityGroups?.cultural || [],
      Affinity_Womens: affinityGroups?.womens || [],
      Affinity_Young_Prof: affinityGroups?.youngProf || [],
      Affinity_International: affinityGroups?.international || []
    };

    // Remove undefined values
    Object.keys(fields).forEach(key => {
      if (fields[key] === undefined) {
        delete fields[key];
      }
    });

    const records = await base('Survey_Responses').create([
      { fields }
    ]);

    const record = records[0];
    
    return {
      success: true,
      data: {
        surveyResponseId: record.id,
        record: record.fields
      }
    };
  } catch (error) {
    console.error('Error creating survey response:', error);
    return {
      success: false,
      error: error.message || 'Failed to create survey response record'
    };
  }
}

/**
 * Create a calculated scores record linked to both User and Survey_Response
 * Note: The actual scores are calculated by Airtable formulas automatically
 * This function just creates the record with the links, and Airtable will populate the calculated fields
 * @param {string} userId - Airtable User record ID
 * @param {string} surveyResponseId - Airtable Survey_Response record ID
 * @returns {Promise<Object>} {success: boolean, data: {calculatedScoresId, record} | error: string}
 */
async function createCalculatedScores(userId, surveyResponseId) {
  try {
    if (!userId || !surveyResponseId) {
      return {
        success: false,
        error: 'userId and surveyResponseId are required'
      };
    }

    // Create Calculated_Scores record with links to User and Survey_Response
    // Airtable will automatically calculate the score fields via formulas
    const records = await base('Calculated_Scores').create([
      {
        fields: {
          User: [userId],
          'Survey Response': [surveyResponseId]
        }
      }
    ]);

    const record = records[0];
    
    // Fetch the record again to get the calculated fields
    // Airtable formulas are calculated immediately, but we need to retrieve the full record
    const fullRecord = await base('Calculated_Scores').find(record.id);
    
    return {
      success: true,
      data: {
        calculatedScoresId: fullRecord.id,
        record: fullRecord.fields
      }
    };
  } catch (error) {
    console.error('Error creating calculated scores:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calculated scores record'
    };
  }
}

module.exports = {
  createUser,
  createSurveyResponse,
  createCalculatedScores,
  base // Export base for other services that might need direct access
};

