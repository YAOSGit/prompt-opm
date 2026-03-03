---
model: "gpt-4o-mini"
config:
  temperature: 0.9
  maxTokens: 280
inputs:
  topic: string
  platform: string
  tone: string
outputs:
  post: string
  hashtags: string[]
---

{{ @brand-voice }}

Write a {{ platform }} post about {{ topic }} with a {{ tone }} tone.
Include relevant hashtags.
