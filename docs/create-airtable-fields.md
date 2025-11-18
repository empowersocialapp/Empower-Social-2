# Airtable Field Creation Quick Reference

## Copy-Paste Field Names

### Recommendation_Feedback Table

Create these fields in order:

```
User
Recommendation_ID
Recommendation_Data
Rating
Feedback_Text
Shown_At
Feedback_Given_At
Action_Taken
Feedback_Categories
```

### Users Table (New Fields)

```
Recommendations_Shown
Feedback_Summary
```

### GPT_Prompts Table (New Field)

```
Recommendations_Pool
```

## Select Options to Add

### Recommendation_Feedback.Action_Taken

Copy these exactly (one per line):
```
interested
not_interested
maybe_later
```

### Recommendation_Feedback.Feedback_Categories

Copy these exactly (one per line):
```
too_far
wrong_time
not_my_style
too_expensive
wrong_group_size
already_doing
not_interested
maybe_later
```

## Field Types Quick Reference

- **Single line text**: `Recommendation_ID`, `Recommendations_Shown`
- **Long text**: `Recommendation_Data`, `Feedback_Text`, `Feedback_Summary`, `Recommendations_Pool`
- **Number**: `Rating` (Integer, Precision: 0)
- **Date**: `Shown_At`, `Feedback_Given_At` (Include time: YES)
- **Single select**: `Action_Taken` (with options above)
- **Multiple select**: `Feedback_Categories` (with options above)
- **Link to another record**: `User` (Link to Users table)




