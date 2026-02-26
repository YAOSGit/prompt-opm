---
model: "gemini-1.5-pro"
version: "1.0.1"
config:
  temperature: 0.7
  maxTokens: 512
inputs:
  name: string
  traits: string[]
outputs:
  bio: string
---
{{ @persona }}
Write a short professional bio for {{ name }}.
Highlight these traits: {{ traits }}.
Keep it under 100 words.
