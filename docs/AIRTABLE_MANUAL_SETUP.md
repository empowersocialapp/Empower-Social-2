# Airtable Manual Setup - Step by Step

## ⚠️ Important: Airtable doesn't allow programmatic schema changes
You need to add these fields manually in the Airtable UI. This guide makes it as quick as possible.

## Required Tables and Fields

### 1. Users Table
Required fields (should already exist):
- `Name` (Single line text)
- `Email` (Email)
- `Age` (Number)
- `Gender` (Single select)
- `Zipcode` (Single line text)

### 2. Survey_Responses Table
Required fields (should already exist):
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
Required fields (should already exist):
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

After setup, run:
```bash
cd backend
node scripts/verify-airtable-setup.js
```

Should show: ✅ All tables and fields are set up correctly!

## Notes

- All tables should be created automatically when you first run the survey
- If you see "Unknown field name" errors, check that field names match exactly (case-sensitive)
- The system uses conceptual recommendations only (no event matching), so no additional event-related tables are needed
