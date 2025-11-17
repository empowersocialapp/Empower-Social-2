# Airtable Setup Guide - Conceptual Recommendations System

## Quick Setup Checklist

- [ ] Verify `Users` table exists with required fields
- [ ] Verify `Survey_Responses` table exists with required fields
- [ ] Verify `Calculated_Scores` table exists with required fields
- [ ] Verify `GPT_Prompts` table exists with required fields
- [ ] Test with verification script

## Required Tables

### 1. Users Table

Required fields:
- `Name` (Single line text)
- `Email` (Email)
- `Age` (Number)
- `Gender` (Single select)
- `Zipcode` (Single line text)

### 2. Survey_Responses Table

Required fields:
- `User` (Link to Users)
- `Interest_Categories` (Multiple select)
- `Specific_Interests` (Long text)
- `Close_Friends_Count` (Single select)
- `Social_Satisfaction` (Single select)
- `Loneliness_Frequency` (Single select)
- `Free_Time_Per_Week` (Single select)
- `Travel_Distance_Willing` (Single select)
- `Affinity_Faith_Based` (Multiple select)
- `Affinity_LGBTQ` (Multiple select)
- `Affinity_Cultural_Ethnic` (Multiple select)
- `Affinity_Womens` (Multiple select)
- `Affinity_Young_Prof` (Multiple select)
- `Affinity_International` (Multiple select)

### 3. Calculated_Scores Table

Required fields:
- `User` (Link to Users)
- `Survey Response` (Link to Survey_Responses)
- `Extraversion_Raw` (Number)
- `Extraversion_Category` (Single select)
- `Conscientiousness_Raw` (Number)
- `Conscientiousness_Category` (Single select)
- `Openness_Raw` (Number)
- `Openness_Category` (Single select)
- `Primary_Motivation` (Single select)
- `Intrinsic_Motivation` (Number)
- `Social_Motivation` (Number)
- `Achievement_Motivation` (Number)

### 4. GPT_Prompts Table

Required fields:
- `User` (Link to Users)
- `Survey Response` (Link to Survey_Responses)
- `Calculated Scores` (Link to Calculated_Scores)
- `Prompt_Text` (Long text) - Stores the full prompt sent to GPT
- `Recommendations_Generated` (Long text) - Stores formatted recommendations

## Verification

After setup, run the verification script:

```bash
cd backend
node scripts/verify-airtable-setup.js
```

Should show: ✅ All tables and fields are set up correctly!

## Common Issues

### Issue: "Unknown field name" error
**Solution:** Make sure field names match exactly (case-sensitive, no extra spaces)

### Issue: Link field not working
**Solution:** Ensure link fields point to the correct tables

### Issue: Tables not found
**Solution:** Verify table names match exactly (case-sensitive)

## Testing After Setup

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Complete a survey at `/survey/intake-survey.html`

3. Check that:
   - User record is created in `Users` table
   - Survey response is created in `Survey_Responses` table
   - Calculated scores are created in `Calculated_Scores` table
   - Recommendations are saved in `GPT_Prompts` table

## Notes

- All tables should be created automatically when you first run the survey
- The system uses conceptual recommendations only (no event matching)
- No additional event-related tables or fields are needed
