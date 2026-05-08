---
model: "gpt-4o"
config:
  temperature: 0.1
  maxTokens: 512
inputs:
  title: string
  description: string
  stackTrace: string
outputs:
  severity:
    type: enum
    values: [critical, high, medium, low]
  category: string
  suggestedAssignee: string
---

Classify this bug report:

Title: {{ title }}
Description: {{ description }}
Stack trace: {{ stackTrace }}

Determine severity, category, and suggest which team should handle it.
