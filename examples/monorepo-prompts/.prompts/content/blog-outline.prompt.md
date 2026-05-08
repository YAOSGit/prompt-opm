---
model: "gpt-4o"
config:
  temperature: 0.8
  maxTokens: 2048
inputs:
  topic: string
  audience: string
  wordCount: number
outputs:
  title: string
  outline: string[]
  estimatedReadTime: number
---

{{ @brand-voice }}

Create a blog post outline about {{ topic }} for {{ audience }}.
Target word count: {{ wordCount }}.
Include an engaging title, section outline, and estimated read time.
