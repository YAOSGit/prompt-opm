---
model: "gpt-4o"
version: "1.0.0"
config:
  temperature: 0
  maxTokens: 64
inputs:
  text: string
  categories: string[]
outputs:
  category: string
  confidence: number
---
Classify the following text into exactly one of the given categories.
Respond with JSON containing "category" and "confidence" (0-1).

Categories: {{ categories }}

Text: {{ text }}
