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
 * @param {string} userData.username - User's username
 * @param {string} userData.email - User's email
 * @param {number} userData.age - User's age
 * @param {string} userData.gender - User's gender
 * @param {string} userData.zipcode - User's zipcode
 * @returns {Promise<Object>} {success: boolean, data: {userId, record} | error: string}
 */
async function createUser(userData) {
  try {
    const { name, username, email, age, gender, zipcode } = userData;

    if (!name || !username || !email || !age || !gender || !zipcode) {
      return {
        success: false,
        error: 'Missing required user fields: name, username, email, age, gender, zipcode'
      };
    }

    // Check if username already exists
    const existingUsers = await base('Users').select({
      filterByFormula: `{Username} = '${username}'`,
      maxRecords: 1
    }).firstPage();

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: 'Username already taken. Please choose a different username.'
      };
    }

    const records = await base('Users').create([
      {
        fields: {
          Name: name,
          Username: username,
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
 * Map frontend affinity group values to Airtable select options
 * @param {Array} values - Array of frontend values
 * @param {string} category - Affinity category type
 * @returns {Array} Mapped values for Airtable
 */
function mapAffinityValues(values, category) {
  if (!values || values.length === 0) return [];
  
  // Filter out empty strings
  const filteredValues = values.filter(v => v && v.trim && v.trim().length > 0);
  if (filteredValues.length === 0) return [];
  
  console.log(`Mapping affinity values for ${category}:`, filteredValues);
  
  const mappings = {
    faith: {
      'christian-protestant': 'Christian',  // Airtable: "Christian"
      'catholic': 'Catholic',
      'jewish': 'Jewish',
      'muslim': 'Muslim',
      'hindu': 'Hindu',
      'buddhist': 'Buddhist',
      'lds': 'Other faith',  // Airtable doesn't have LDS, map to "Other faith"
      'spiritual': 'Spiritual (non-religious)',  // Airtable: "Spiritual (non-religious)"
      'atheist-agnostic': 'Atheist/Agnostic',  // Airtable: "Atheist/Agnostic"
      'other-faith': 'Other faith'  // Added for completeness
    },
    lgbtq: {
      'gay-men': 'Gay men\'s communities',
      'lesbian': 'Lesbian communities',
      'bisexual': 'Bisexual/Pansexual communities',
      'transgender': 'Transgender communities',
      'queer-nonbinary': 'Queer/Non-binary communities',
      'general-lgbtq': 'General LGBTQ+ inclusive spaces'
    },
    cultural: {
      'african-american': 'African American',  // Airtable: "African American"
      'asian-american': 'Asian American',
      'hispanic-latino': 'Hispanic/Latino',  // Airtable: "Hispanic/Latino"
      'middle-eastern': 'Middle Eastern',
      'native-american': 'Indigenous/Native American',  // Airtable: "Indigenous/Native American"
      'pacific-islander': 'Other',  // Airtable doesn't have Pacific Islander, map to "Other"
      'jewish-cultural': 'Other',  // Airtable doesn't have Jewish cultural, map to "Other"
      'multiracial': 'Multicultural',  // Airtable: "Multicultural"
      'international-students': 'International students',
      'other-cultural': 'Other'  // Airtable: "Other"
    },
    womens: {
      'professional-women': 'Professional women',
      'women-entrepreneurs': 'Women entrepreneurs',
      'moms': 'Moms/Parents',
      'women-40-plus': 'Women 40+',
      'women-in-stem': 'Women in STEM'
    },
    youngProf: {
      'general-young-prof': 'Young professionals (20s)',  // Default to 20s
      'young-prof-of-color': 'Young professionals (20s)',  // Default to 20s
      'lgbtq-young-prof': 'Young professionals (20s)',  // Default to 20s
      'women-in-business': 'Young professionals (20s)',  // Default to 20s
      'young-prof-20s': 'Young professionals (20s)',  // Added for future use
      'young-prof-30s': 'Young professionals (30s)',  // Added for future use
      'career-changers': 'Career changers',  // Added for future use
      'recent-grads': 'Recent grads'  // Added for future use
    },
    international: {
      'general-international': 'International community',  // Airtable: "International community"
      'recent-immigrants': 'Recent immigrants',  // Airtable: "Recent immigrants"
      'international-students': 'International students',
      'expats': 'Expats',
      'language-learners': 'Language learners'  // Added for future use
    }
  };
  
  const categoryMap = mappings[category] || {};
  const mapped = filteredValues
    .map(value => {
      const mappedValue = categoryMap[value] || value;
      console.log(`  Mapping "${value}" -> "${mappedValue}"`);
      return mappedValue;
    })
    .filter(mappedValue => mappedValue && mappedValue.trim && mappedValue.trim().length > 0); // Filter out empty mapped values
  console.log(`Final mapped values for ${category}:`, mapped);
  return mapped;
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

    console.log('=== createSurveyResponse called ===');
    console.log('Raw surveyData.affinityGroups:', JSON.stringify(surveyData.affinityGroups, null, 2));

    const { personality, motivation, social, interests, preferences, affinityGroups } = surveyData;
    
    console.log('Extracted affinityGroups:', JSON.stringify(affinityGroups, null, 2));

    // Map frontend category keys to Airtable labels
    // IMPORTANT: These must match EXACTLY with Airtable's Interest_Categories select options
    const categoryLabelMap = {
      'sports': 'Sports & Fitness',
      'arts': 'Arts & Culture',
      'food': 'Food & Dining',
      'social': 'Social & Networking',  // Updated to match Airtable
      'learning': 'Learning & Education',  // Updated to match Airtable
      'outdoor': 'Outdoor & Nature',
      'games': 'Technology & Gaming',  // Updated to match Airtable
      'community': 'Community & Volunteering',  // Updated to match Airtable
      'wellness': 'Health & Wellness',  // Updated to match Airtable
      'music': 'Music & Entertainment'  // Updated to match Airtable
    };

    // Convert category keys to labels for Airtable, filter out empty strings
    const interestCategories = (interests?.categories || [])
      .filter(key => key && key.trim().length > 0)
      .map(key => {
        return categoryLabelMap[key] || key; // Use mapped label or fallback to original
      })
      .filter(label => label && label.trim().length > 0); // Filter out any empty mapped values
    
    console.log('=== Interest Categories Mapping ===');
    console.log('Frontend categories:', interests?.categories);
    console.log('Mapped categories:', interestCategories);

    // Map Close_Friends_Count to Airtable format (select field with ranges)
    let closeFriendsCount = social?.closeFriends;
    
    // Handle empty string, null, or undefined first
    if (closeFriendsCount === '' || closeFriendsCount === null || closeFriendsCount === undefined) {
      closeFriendsCount = undefined; // Will be removed by cleanup if truly empty
    } else {
      // Convert to number if it's a string, or use as-is if already a number
      let num = typeof closeFriendsCount === 'string' 
        ? parseInt(closeFriendsCount.trim()) 
        : closeFriendsCount;
      
      // Always map to the range format that matches Airtable options
      if (num !== undefined && num !== null && !isNaN(num) && num >= 0) {
        // Map to ranges that match Airtable select options: blank, "0-2", "3-5", "6-10", "10+"
        if (num <= 2) {
          closeFriendsCount = '0-2';
        } else if (num <= 5) {
          closeFriendsCount = '3-5';
        } else if (num <= 10) {
          closeFriendsCount = '6-10';
        } else {
          closeFriendsCount = '10+';
        }
      } else {
        // If invalid, set to undefined so it's not included
        closeFriendsCount = undefined;
      }
    }

    // Map Social_Satisfaction - convert frontend format to Airtable format
    // Frontend sends: "Neutral (4)", "Satisfied (6)", etc. or just numbers 1-7
    // Extract number and map to Airtable options
    let socialSatisfaction = social?.satisfaction;
    if (socialSatisfaction) {
      let satisfactionValue;
      
      // Extract number from string like "Neutral (4)" or just use the number if it's already numeric
      if (typeof socialSatisfaction === 'string') {
        const match = socialSatisfaction.match(/\((\d+)\)/);
        if (match) {
          satisfactionValue = parseInt(match[1]);
        } else {
          // Try to parse as number
          satisfactionValue = parseInt(socialSatisfaction);
        }
      } else {
        satisfactionValue = parseInt(socialSatisfaction);
      }
      
      // Map 1-7 scale to Airtable options (common satisfaction scale)
      if (!isNaN(satisfactionValue) && satisfactionValue >= 1 && satisfactionValue <= 7) {
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
      } else {
        // Fallback: try to extract label from string
        socialSatisfaction = String(socialSatisfaction).replace(/\s*\(\d+\)\s*$/, '').trim();
        if (socialSatisfaction.trim().length === 0) {
          socialSatisfaction = undefined;
        }
      }
    }

    // Map Loneliness_Frequency - convert frontend format to Airtable format
    // Frontend sends: "Never (1)", "Rarely (2)", "Sometimes (3)", "Often (4)", "Very Often (5)"
    // Airtable expects: "Never (1)", "Rarely (2)", "Sometimes (3)", "Often (4)", "Always (5)" (with numbers)
    // Note: Airtable uses "Always" not "Very Often" for value 5
    let lonelinessFrequency = social?.loneliness;
    if (lonelinessFrequency) {
      if (typeof lonelinessFrequency !== 'string') {
        lonelinessFrequency = String(lonelinessFrequency);
      }
      
      // Extract the number from format like "Very Often (5)" or "Always (5)"
      const match = lonelinessFrequency.match(/\((\d+)\)/);
      if (match) {
        const value = parseInt(match[1]);
        // Map to Airtable options (Airtable includes the number in parentheses)
        const lonelinessMap = {
          1: 'Never (1)',
          2: 'Rarely (2)',
          3: 'Sometimes (3)',
          4: 'Often (4)',
          5: 'Always (5)'  // Airtable uses "Always" not "Very Often"
        };
        lonelinessFrequency = lonelinessMap[value] || lonelinessFrequency;
      } else {
        // If no number found, try to map the label
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
      
      if (lonelinessFrequency.trim().length === 0) {
        lonelinessFrequency = undefined;
      }
    }

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
      
      // Social fields (mapped to match Airtable select options)
      Close_Friends_Count: closeFriendsCount,
      Social_Satisfaction: socialSatisfaction,
      Loneliness_Frequency: lonelinessFrequency,
      Looking_For: (social?.lookingFor || []).filter(v => v && v.trim && v.trim().length > 0),
      
      // Interests (mapped to Airtable labels)
      Interest_Categories: interestCategories.length > 0 ? interestCategories : undefined,
      Specific_Interests: interests?.specific && interests.specific.trim().length > 0 ? interests.specific : undefined,
      
      // Preferences - only set to undefined if truly missing, not if empty string
      Free_Time_Per_Week: preferences?.freeTime && typeof preferences.freeTime === 'string' && preferences.freeTime.trim().length > 0 
        ? preferences.freeTime.trim() 
        : (preferences?.freeTime || undefined),
      Travel_Distance_Willing: preferences?.travelDistance && typeof preferences.travelDistance === 'string' && preferences.travelDistance.trim().length > 0 
        ? preferences.travelDistance.trim() 
        : (preferences?.travelDistance || undefined),
      Pref_Indoor: preferences?.indoor || false,
      Pref_Outdoor: preferences?.outdoor || false,
      Pref_Physical_Active: preferences?.physical || false,
      Pref_Relaxed_Lowkey: preferences?.relaxed || false,
      Pref_Structured: preferences?.structured || false,
      Pref_Spontaneous: preferences?.spontaneous || false,
      
      // Affinity groups (6 multiple-select fields) - map frontend values to Airtable options
      // Return empty array instead of undefined - cleanup will handle empty arrays for multi-select fields
      Affinity_Faith_Based: mapAffinityValues(affinityGroups?.faith || [], 'faith'),
      Affinity_LGBTQ: mapAffinityValues(affinityGroups?.lgbtq || [], 'lgbtq'),
      Affinity_Cultural_Ethnic: mapAffinityValues(affinityGroups?.cultural || [], 'cultural'),
      Affinity_Womens: mapAffinityValues(affinityGroups?.womens || [], 'womens'),
      Affinity_Young_Prof: mapAffinityValues(affinityGroups?.youngProf || [], 'youngProf'),
      Affinity_International: mapAffinityValues(affinityGroups?.international || [], 'international')
    };

    // Remove undefined, null, empty string, and empty array values
    // This prevents Airtable from trying to create new select options with invalid values
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      if (value === undefined || value === null || value === '') {
        delete fields[key];
      }
      // Remove empty arrays (especially important for multi-select fields)
      if (Array.isArray(value) && value.length === 0) {
        delete fields[key];
      }
      // Remove arrays containing only empty strings or whitespace
      if (Array.isArray(value) && value.every(v => !v || (typeof v === 'string' && v.trim().length === 0))) {
        delete fields[key];
      }
    });

    // Debug logging
    console.log('Creating survey response with fields:', JSON.stringify(fields, null, 2));
    console.log('Close_Friends_Count value:', fields.Close_Friends_Count);
    console.log('Social_Satisfaction value:', fields.Social_Satisfaction);
    console.log('Loneliness_Frequency value:', fields.Loneliness_Frequency);
    console.log('Affinity_LGBTQ (mapped):', fields.Affinity_LGBTQ);
    console.log('Raw affinityGroups from request:', JSON.stringify(affinityGroups, null, 2));

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
    
    // Enhanced error logging for select field issues
    if (error.message && error.message.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
      console.error('=== SELECT FIELD ERROR ===');
      console.error('This error means a value being sent doesn\'t match Airtable\'s select options.');
      console.error('Interest_Categories being sent:', interestCategories);
      console.error('Check your Airtable "Interest_Categories" field options and make sure they match exactly.');
      console.error('Current mapping:', categoryLabelMap);
    }
    
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

/**
 * Find a user by username
 * @param {string} username - Username to look up
 * @returns {Promise<Object>} {success: boolean, data: {userId, username, name} | error: string}
 */
async function getUserByUsername(username) {
  try {
    if (!username) {
      return {
        success: false,
        error: 'Username is required'
      };
    }

    const records = await base('Users').select({
      filterByFormula: `{Username} = '${username}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const record = records[0];

    return {
      success: true,
      data: {
        userId: record.id,
        username: record.fields.Username,
        name: record.fields.Name,
        email: record.fields.Email
      }
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user'
    };
  }
}

/**
 * Update an existing survey response record
 * @param {string} surveyResponseId - Airtable Survey_Response record ID
 * @param {Object} surveyData - Survey data to update
 * @returns {Promise<Object>} {success: boolean, data: {record} | error: string}
 */
async function updateSurveyResponse(surveyResponseId, surveyData) {
  try {
    if (!surveyResponseId) {
      return {
        success: false,
        error: 'surveyResponseId is required'
      };
    }

    console.log('=== updateSurveyResponse called ===');
    console.log('Raw surveyData.affinityGroups:', JSON.stringify(surveyData.affinityGroups, null, 2));

    const { personality, motivation, social, interests, preferences, affinityGroups } = surveyData;
    
    console.log('Extracted affinityGroups:', JSON.stringify(affinityGroups, null, 2));

    // Map frontend category keys to Airtable labels (same as createSurveyResponse)
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

    // Convert category keys to labels for Airtable, filter out empty strings
    const interestCategories = (interests?.categories || [])
      .filter(key => key && key.trim().length > 0)
      .map(key => {
        return categoryLabelMap[key] || key;
      })
      .filter(label => label && label.trim().length > 0);
    
    console.log('=== Interest Categories Mapping ===');
    console.log('Frontend categories:', interests?.categories);
    console.log('Mapped categories:', interestCategories);

    // Map Close_Friends_Count to Airtable format (same as createSurveyResponse)
    let closeFriendsCount = social?.closeFriends;
    
    // Handle empty string, null, or undefined first
    if (closeFriendsCount === '' || closeFriendsCount === null || closeFriendsCount === undefined) {
      closeFriendsCount = undefined; // Will be removed by cleanup if truly empty
    } else {
      // Convert to number if it's a string, or use as-is if already a number
      let num = typeof closeFriendsCount === 'string' 
        ? parseInt(closeFriendsCount.trim()) 
        : closeFriendsCount;
      
      if (num !== undefined && num !== null && !isNaN(num) && num >= 0) {
        if (num <= 2) {
          closeFriendsCount = '0-2';
        } else if (num <= 5) {
          closeFriendsCount = '3-5';
        } else if (num <= 10) {
          closeFriendsCount = '6-10';
        } else {
          closeFriendsCount = '10+';
        }
      } else {
        closeFriendsCount = undefined;
      }
    }

    // Map Social_Satisfaction - convert frontend format to Airtable format (same as createSurveyResponse)
    let socialSatisfaction = social?.satisfaction;
    if (socialSatisfaction) {
      let satisfactionValue;
      
      // Extract number from string like "Neutral (4)" or just use the number if it's already numeric
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
      
      // Map 1-7 scale to Airtable options
      if (!isNaN(satisfactionValue) && satisfactionValue >= 1 && satisfactionValue <= 7) {
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
      } else {
        // Fallback: try to extract label from string
        socialSatisfaction = String(socialSatisfaction).replace(/\s*\(\d+\)\s*$/, '').trim();
        if (socialSatisfaction.trim().length === 0) {
          socialSatisfaction = undefined;
        }
      }
    }

    // Map Loneliness_Frequency - convert frontend format to Airtable format (same as createSurveyResponse)
    let lonelinessFrequency = social?.loneliness;
    if (lonelinessFrequency) {
      if (typeof lonelinessFrequency !== 'string') {
        lonelinessFrequency = String(lonelinessFrequency);
      }
      
      // Extract the number from format like "Very Often (5)" or "Always (5)"
      const match = lonelinessFrequency.match(/\((\d+)\)/);
      if (match) {
        const value = parseInt(match[1]);
        // Map to Airtable options (Airtable includes the number in parentheses)
        const lonelinessMap = {
          1: 'Never (1)',
          2: 'Rarely (2)',
          3: 'Sometimes (3)',
          4: 'Often (4)',
          5: 'Always (5)'  // Airtable uses "Always" not "Very Often"
        };
        lonelinessFrequency = lonelinessMap[value] || lonelinessFrequency;
      } else {
        // If no number found, try to map the label
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
      
      if (lonelinessFrequency.trim().length === 0) {
        lonelinessFrequency = undefined;
      }
    }

    // Build fields object for Airtable (same structure as createSurveyResponse)
    const fields = {
      Q1_Extraverted_Enthusiastic: personality?.q1,
      Q6_Reserved_Quiet: personality?.q6,
      Q3_Dependable_Disciplined: personality?.q3,
      Q8_Disorganized_Careless: personality?.q8,
      Q5_Open_Complex: personality?.q5,
      Q10_Conventional_Uncreative: personality?.q10,
      
      M1_Enjoyable_Fun: motivation?.m1,
      M2_Time_With_People: motivation?.m2,
      M3_Develop_Skills: motivation?.m3,
      M4_Energized_Engaged: motivation?.m4,
      M5_Meet_New_People: motivation?.m5,
      M6_Challenge_Myself: motivation?.m6,
      
      Close_Friends_Count: closeFriendsCount,
      Social_Satisfaction: socialSatisfaction,
      Loneliness_Frequency: lonelinessFrequency,
      Looking_For: (social?.lookingFor || []).filter(v => v && v.trim && v.trim().length > 0),
      
      Interest_Categories: interestCategories.length > 0 ? interestCategories : undefined,
      Specific_Interests: interests?.specific || undefined,
      
      // Preferences - only set to undefined if truly missing, not if empty string
      Free_Time_Per_Week: preferences?.freeTime && typeof preferences.freeTime === 'string' && preferences.freeTime.trim().length > 0 
        ? preferences.freeTime.trim() 
        : (preferences?.freeTime || undefined),
      Travel_Distance_Willing: preferences?.travelDistance && typeof preferences.travelDistance === 'string' && preferences.travelDistance.trim().length > 0 
        ? preferences.travelDistance.trim() 
        : (preferences?.travelDistance || undefined),
      Pref_Indoor: preferences?.indoor || false,
      Pref_Outdoor: preferences?.outdoor || false,
      Pref_Physical_Active: preferences?.physical || false,
      Pref_Relaxed_Lowkey: preferences?.relaxed || false,
      Pref_Structured: preferences?.structured || false,
      Pref_Spontaneous: preferences?.spontaneous || false,
      
      // Affinity groups - return empty array instead of undefined, cleanup will handle empty arrays for multi-select fields
      Affinity_Faith_Based: mapAffinityValues(affinityGroups?.faith || [], 'faith'),
      Affinity_LGBTQ: mapAffinityValues(affinityGroups?.lgbtq || [], 'lgbtq'),
      Affinity_Cultural_Ethnic: mapAffinityValues(affinityGroups?.cultural || [], 'cultural'),
      Affinity_Womens: mapAffinityValues(affinityGroups?.womens || [], 'womens'),
      Affinity_Young_Prof: mapAffinityValues(affinityGroups?.youngProf || [], 'youngProf'),
      Affinity_International: mapAffinityValues(affinityGroups?.international || [], 'international')
    };

    // Remove undefined, null, empty string, and empty array values
    // Multi-select fields can have empty arrays (Airtable handles this)
    const multiSelectFields = ['Affinity_Faith_Based', 'Affinity_LGBTQ', 'Affinity_Cultural_Ethnic', 
                                 'Affinity_Womens', 'Affinity_Young_Prof', 'Affinity_International',
                                 'Looking_For', 'Interest_Categories'];
    
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      if (value === undefined || value === null || value === '') {
        delete fields[key];
      }
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) {
          // Keep empty arrays for multi-select fields (Airtable can handle them)
          if (!multiSelectFields.includes(key)) {
            delete fields[key];
          }
        } else if (value.every(v => !v || (typeof v === 'string' && v.trim().length === 0))) {
          // Remove arrays containing only empty strings or whitespace
          delete fields[key];
        }
      }
    });

    // Debug logging
    console.log('Updating survey response with fields:', JSON.stringify(fields, null, 2));
    console.log('Close_Friends_Count value:', fields.Close_Friends_Count);
    console.log('Social_Satisfaction value:', fields.Social_Satisfaction);
    console.log('Loneliness_Frequency value:', fields.Loneliness_Frequency);
    console.log('Affinity_LGBTQ (mapped):', fields.Affinity_LGBTQ);

    const record = await base('Survey_Responses').update(surveyResponseId, fields);

    return {
      success: true,
      data: {
        surveyResponseId: record.id,
        record: record.fields
      }
    };
  } catch (error) {
    console.error('Error updating survey response:', error);
    
    // Enhanced error logging for select field issues
    if (error.message && error.message.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
      console.error('=== SELECT FIELD ERROR ===');
      console.error('This error means a value being sent doesn\'t match Airtable\'s select options.');
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update survey response record'
    };
  }
}

/**
 * Update calculated scores record (triggers recalculation via Airtable formulas)
 * @param {string} userId - Airtable User record ID
 * @param {string} surveyResponseId - Airtable Survey_Response record ID
 * @returns {Promise<Object>} {success: boolean, data: {calculatedScoresId} | error: string}
 */
async function updateCalculatedScores(userId, surveyResponseId) {
  try {
    if (!userId || !surveyResponseId) {
      return {
        success: false,
        error: 'userId and surveyResponseId are required'
      };
    }

    // Find existing Calculated_Scores record for this user and survey response
    // Note: Field name might be 'Survey Response' or 'Survey_Response' - try without filter first
    let calculatedScores = await base('Calculated_Scores')
      .select({
        maxRecords: 100
      })
      .firstPage();
    
    // Filter in JavaScript to find matching record
    calculatedScores = calculatedScores.filter(record => {
      const userLinks = record.fields.User || [];
      const surveyLinks = record.fields['Survey Response'] || record.fields['Survey_Response'] || [];
      return Array.isArray(userLinks) && userLinks.includes(userId) &&
             Array.isArray(surveyLinks) && surveyLinks.includes(surveyResponseId);
    });

    // Already filtered above, no need for fallback

    if (calculatedScores.length > 0) {
      // Update existing record (just touch it to trigger recalculation)
      const recordId = calculatedScores[0].id;
      await base('Calculated_Scores').update(recordId, {
        // Just update a timestamp or touch the record to trigger formulas
        // Airtable will recalculate formulas automatically
      });

      // Fetch the updated record to get recalculated values
      const fullRecord = await base('Calculated_Scores').find(recordId);

      return {
        success: true,
        data: {
          calculatedScoresId: fullRecord.id,
          record: fullRecord.fields
        }
      };
    } else {
      // No existing record, create a new one
      return await createCalculatedScores(userId, surveyResponseId);
    }
  } catch (error) {
    console.error('Error updating calculated scores:', error);
    return {
      success: false,
      error: error.message || 'Failed to update calculated scores'
    };
  }
}

module.exports = {
  createUser,
  createSurveyResponse,
  createCalculatedScores,
  updateSurveyResponse,
  updateCalculatedScores,
  getUserByUsername,
  base // Export base for other services that might need direct access
};

