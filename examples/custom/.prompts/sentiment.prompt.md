---
model: "gpt-4o-mini"
config:
  temperature: 0.1
  maxTokens: 256
inputs:
  text: string
outputs:
  sentiment:
    type: enum
    values: [positive, negative, neutral, mixed]
  score: number
---

Analyze the sentiment of the following text and classify it.

Text: {{ text }}

Return the sentiment classification and a confidence score between 0 and 1.
