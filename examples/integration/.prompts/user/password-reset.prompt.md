---
model: "gpt-4o-mini"
config:
  temperature: 0.3
  maxTokens: 512
inputs:
  userName: string
  resetLink: string
outputs:
  subject: string
  body: string
---

{{ @brand-voice }}

Write a password reset email for {{ userName }}.
Include the reset link: {{ resetLink }}
Keep it brief and security-focused.
