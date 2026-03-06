---
model: "gemini-1.5-pro"
version: "1.0.2"
config:
  temperature: 0.5
  maxTokens: 1024
inputs:
  userName: string
  productName: string
  tone: enum(formal, casual, friendly)
outputs:
  subject: string
  body: string
---
{{ @persona }}
{{ @.signoff }}
Write a welcome email for {{ userName }} who just signed up for {{ productName }}.
Use a {{ tone }} tone.
Return JSON with "subject" and "body" fields.
