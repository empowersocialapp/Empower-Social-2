# Affinity Groups Implementation Summary

## ✅ What Was Added

### **New Page 8: Community Connections (Optional)**

Added as the final page before submit with:
- 6 main affinity categories (collapsible)
- 50+ specific sub-options
- 70/30 balance explanation
- Privacy notice

---

## 📋 **Affinity Categories & Options**

### **1. Faith-based or spiritual communities**
- Christian (Protestant/Evangelical)
- Catholic
- Jewish
- Muslim
- Hindu
- Buddhist
- Latter-day Saints (Mormon)
- Spiritual but not religious
- Atheist/Agnostic communities

### **2. LGBTQ+ communities**
- Gay men's communities
- Lesbian communities
- Bisexual/Pansexual communities
- Transgender communities
- Queer/Non-binary communities
- General LGBTQ+ inclusive spaces

### **3. Cultural or ethnic heritage groups**
- African American/Black communities
- Asian American communities
- Hispanic/Latino/Latinx communities
- Middle Eastern/North African (MENA)
- Native American/Indigenous communities
- Pacific Islander communities
- Jewish cultural communities
- Multiracial/Multicultural communities

### **4. Women's groups and networks**
- General women's groups
- Professional women's networks
- Women of color groups
- LGBTQ+ women's spaces
- Moms/mothers groups

### **5. Young professionals (20s-30s)**
- General young professionals
- Young professionals of color
- LGBTQ+ young professionals
- Women in business

### **6. International or immigrant communities**
- General international community
- Recent immigrants/refugees
- International students
- Expats living in the US

---

## 🎨 **User Experience**

### **How It Works:**
1. User checks main category (e.g., "LGBTQ+ communities")
2. Section smoothly expands showing specific options
3. User selects specifics (e.g., "Gay men's communities")
4. If unchecked, section collapses and clears selections

### **Visual Design:**
- Collapsible sections (hidden by default)
- Smooth expand/collapse animations
- Privacy notice at top
- 70/30 balance explanation at bottom
- Easy to skip entirely

---

## 💾 **Data Structure**

```javascript
affinityGroups: {
  faithBased: {
    selected: true,
    specific: ["catholic", "spiritual"]
  },
  lgbtq: {
    selected: true,
    specific: ["gay-men", "general-lgbtq"]
  },
  cultural: {
    selected: false,
    specific: []
  },
  womens: {
    selected: false,
    specific: []
  },
  youngProfessionals: {
    selected: false,
    specific: []
  },
  international: {
    selected: false,
    specific: []
  }
}
```

---

## 🎯 **GPT Prompt Integration**

### **Affinity Section in Prompt:**
```
Affinity Communities:
- LGBTQ+: gay-men, general-lgbtq
- Faith: catholic, spiritual

AFFINITY BALANCE RULE:
- PRIMARY FOCUS (70%): Match user's interests, personality, and social needs first
- AFFINITY ENHANCEMENT (30%): Include 3 out of 10 recommendations that ALSO align with affinity communities
- CRITICAL: Affinity recommendations MUST still match their core interests
  * Example: If they like hiking AND selected "gay-men", recommend "Gay Men's Hiking Group" ✓
  * Example: If they don't have trivia in interests, DON'T recommend "Gay Trivia Night" ✗
- Affinity is a BOOST to good matches, not a filter or replacement
- Never exclude general community events
- Balance must still apply: 5 recurring + 5 one-time across all 10 recommendations
```

---

## 📊 **Recommendation Balance**

### **Example Output (User selected: Gay men's communities + Hiking interest):**

**10 Recommendations:**
1. Charlottesville Hiking Club (94%) - General
2. **Gay Men's Outdoor Adventures** (92%) - Affinity + Interest ✓
3. Nature Photography Workshop (91%) - General
4. Yoga in the Park (89%) - General
5. **LGBTQ+ Hiking Group** (88%) - Affinity + Interest ✓
6. Trail Running Group (87%) - General
7. Photography Meetup (86%) - General
8. **Gay Men's Wellness Retreat** (85%) - Affinity + Interest ✓
9. Meditation Workshop (84%) - General
10. Weekend Camping Trip (83%) - General

**Result:**
- 7 general events (70%)
- 3 affinity-enhanced events (30%)
- All affinity events match hiking/outdoor interests
- No random "gay bar night" just because user is gay

---

## 🔒 **Privacy Features**

1. **Completely optional** - Easy to skip
2. **Private notice** - Clear explanation at top
3. **No sharing without consent** - Stated explicitly
4. **Can be updated later** - Mentioned in note
5. **Encrypted storage** - When backend is added

---

## ✅ **What Changed**

### **Survey Structure:**
- ~~7 pages~~ → **8 pages**
- New Page 8 before submit
- Progress bar updated (1 of 8)

### **Data Collection:**
- `collectAffinityData()` function
- Added to form submission
- Included in GPT prompt

### **JavaScript Functions:**
- `setupAffinityToggle()` - Expand/collapse
- `generateAffinityPromptSection()` - Format for prompt
- `generateAffinityBalanceInstructions()` - 70/30 rules

### **GPT Prompt:**
- Affinity communities section
- Balance rule (70% general, 30% affinity)
- Examples of good vs bad matches

---

## 🧪 **Testing Checklist**

- [ ] Open survey, fill out to Page 8
- [ ] Check "LGBTQ+ communities"
- [ ] Verify section expands smoothly
- [ ] Select "Gay men's communities"
- [ ] Uncheck main checkbox
- [ ] Verify section collapses and clears selections
- [ ] Submit form
- [ ] Check console for affinity data
- [ ] Verify GPT prompt includes affinity section
- [ ] Verify 70/30 balance rules are included

---

## 📝 **Next Steps**

When implementing recommendations:
1. Score events primarily on interest match (0-100)
2. Add small boost (+8 points) for affinity alignment
3. Select top 7 general events
4. Select top 3 affinity-enhanced events
5. Combine and sort by final score
6. Ensure 5 recurring + 5 one-time balance

---

## 💡 **User Stories**

**Story 1: Gay man who likes hiking**
- Selects: LGBTQ+ → Gay men's communities
- Interests: Hiking, photography, yoga
- Gets: Mix of general hiking clubs + gay men's hiking groups
- Does NOT get: Random gay events unrelated to interests

**Story 2: Catholic woman seeking faith + social**
- Selects: Faith → Catholic, Women's groups → General women's
- Interests: Book clubs, volunteering
- Gets: Catholic book clubs, women's volunteer groups, general community
- Balanced mix of faith-based and secular

**Story 3: Young professional, no affinity selected**
- Skips entire affinity section
- Gets: 100% interest-based recommendations
- No change to current recommendation logic

---

**Implementation complete! Survey now has comprehensive affinity matching with 70/30 balance. 🎉**
