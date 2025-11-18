# Airtable Field Verification Checklist

This document lists all select/multi-select fields that need to be verified in your Airtable base to ensure they match what the code is sending.

## 🔍 Fields to Verify

### 1. Users Table

#### Gender (Single select)
**Code sends:** `male`, `female`, `non-binary`, `prefer-not-to-say`, `other`

**Action:** Verify these exact lowercase values exist as options in Airtable, or update the code if Airtable uses different values (e.g., capitalized).

---

### 2. Survey_Responses Table

#### Close_Friends_Count (Single select)
**Code sends:** `0-2`, `3-5`, `6-10`, `10+`

**Action:** ✅ Already mapped correctly - verify these exact strings exist in Airtable.

---

#### Social_Satisfaction (Single select)
**Code sends (after mapping):**
- `Very Dissatisfied` (for value 1)
- `Dissatisfied` (for value 2)
- `Somewhat Dissatisfied` (for value 3)
- `Neutral` (for value 4)
- `Somewhat Satisfied` (for value 5)
- `Satisfied` (for value 6)
- `Very Satisfied` (for value 7)

**Action:** Verify these exact strings exist in Airtable. The code extracts the number from "Neutral (4)" format and maps it to these labels.

---

#### Loneliness_Frequency (Single select)
**Code sends (after mapping):**
- `Never`
- `Rarely`
- `Sometimes`
- `Often`
- `Very Often`

**Action:** Verify these exact strings exist in Airtable. The code strips "(5)" from "Very Often (5)" format.

---

#### Free_Time_Per_Week (Single select)
**Code sends:**
- `Less than 5 hours`
- `5-10 hours`
- `10-20 hours`
- `More than 20 hours`

**Action:** Verify these exact strings exist in Airtable.

---

#### Travel_Distance_Willing (Single select)
**Code sends:**
- `Less than 1 mile`
- `1-5 miles`
- `5-15 miles`
- `15+ miles`

**Action:** Verify these exact strings exist in Airtable.

---

#### Interest_Categories (Multiple select)
**Code sends (after mapping):**
- `Sports & Fitness`
- `Arts & Culture`
- `Food & Dining`
- `Social & Networking`
- `Learning & Education`
- `Outdoor & Nature`
- `Technology & Gaming`
- `Community & Volunteering`
- `Health & Wellness`
- `Music & Entertainment`

**Action:** Verify these exact strings exist in Airtable. The code maps frontend keys (e.g., `sports`) to these labels.

---

#### Affinity_Faith_Based (Multiple select)
**Code sends (after mapping):**
- `Christian`
- `Catholic`
- `Jewish`
- `Muslim`
- `Hindu`
- `Buddhist`
- `Other faith`
- `Spiritual (non-religious)`
- `Atheist/Agnostic`

**Action:** Verify these exact strings exist in Airtable.

---

#### Affinity_LGBTQ (Multiple select)
**Code sends (after mapping):**
- `Gay men's communities`
- `Lesbian communities`
- `Bisexual/Pansexual communities`
- `Transgender communities`
- `Queer/Non-binary communities`
- `General LGBTQ+ inclusive spaces`

**Action:** Verify these exact strings exist in Airtable.

---

#### Affinity_Cultural_Ethnic (Multiple select)
**Code sends (after mapping):**
- `African American`
- `Asian American`
- `Hispanic/Latino`
- `Middle Eastern`
- `Indigenous/Native American`
- `Multicultural`
- `International students`
- `Other`

**Action:** Verify these exact strings exist in Airtable.

---

#### Affinity_Womens (Multiple select)
**Code sends (after mapping):**
- `Professional women`
- `Women entrepreneurs`
- `Moms/Parents`
- `Women 40+`
- `Women in STEM`

**Action:** Verify these exact strings exist in Airtable.

---

#### Affinity_Young_Prof (Multiple select)
**Code sends (after mapping):**
- `Young professionals (20s)`
- `Young professionals (30s)`
- `Career changers`
- `Recent grads`

**Action:** Verify these exact strings exist in Airtable.

---

#### Affinity_International (Multiple select)
**Code sends (after mapping):**
- `International community`
- `Recent immigrants`
- `International students`
- `Expats`
- `Language learners`

**Action:** Verify these exact strings exist in Airtable.

---

## ✅ Quick Verification Steps

1. **Open your Airtable base**
2. **For each field listed above:**
   - Click on the field name
   - Check "Field options" or "Select options"
   - Compare the options with the values listed above
   - Ensure they match exactly (case-sensitive!)

3. **If options don't match:**
   - Option A: Update Airtable options to match the code (recommended)
   - Option B: Share the exact Airtable options with me and I'll update the mapping code

## 🚨 Common Issues

- **Case sensitivity:** "Very Often" ≠ "very often" ≠ "Very often"
- **Extra spaces:** "Very Often" ≠ "Very Often " (trailing space)
- **Punctuation:** "5-10 hours" ≠ "5 to 10 hours"
- **Missing options:** If Airtable doesn't have an option the code sends, you'll get the "insufficient permissions" error

## 📝 Notes

- All mappings are in `backend/services/airtable.js`
- The `mapAffinityValues()` function handles affinity group mappings
- The `categoryLabelMap` handles interest category mappings
- Social_Satisfaction and Loneliness_Frequency have special formatting logic to extract numbers from parentheses

