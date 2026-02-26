---
model: "claude-sonnet-4-20250514"
version: "1.0.1"
config:
  temperature: 0.3
  maxTokens: 2048
inputs:
  code: string
  language: string
  focusAreas: string[]
outputs:
  issues: string
  suggestions: string
  rating: number
---
{{ @persona }}
Review the following {{ language }} code.
Focus on these areas: {{ focusAreas }}.

Return JSON with:
- "issues": a list of problems found
- "suggestions": actionable improvements
- "rating": overall quality score from 1-10

Code:
```{{ language }}
{{ code }}
```
