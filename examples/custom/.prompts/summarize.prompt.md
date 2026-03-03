---
model: "gpt-4o"
config:
  temperature: 0.3
  maxTokens: 1024
inputs:
  content: string
  maxLength: number
  style: string
outputs:
  summary: string
  keyPoints: string[]
---

{{ @persona }}

Summarize the following content in {{ maxLength }} words or fewer.
Use a {{ style }} tone.

Content:
{{ content }}

{{ @format-rules }}
