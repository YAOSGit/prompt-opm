---
model: "gpt-4o"
config:
  temperature: 0.7
  maxTokens: 1024
inputs:
  userName: string
  planName: string
  features: string[]
outputs:
  subject: string
  body: string
---

{{ @brand-voice }}
{{ @safety }}

Write a welcome onboarding email for {{ userName }} who just signed up for the {{ planName }} plan.

Highlight these features: {{ features }}

The email should be warm, concise, and include a clear call-to-action.
