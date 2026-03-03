---
model: "claude-3-opus"
config:
  temperature: 0.2
  maxTokens: 4096
inputs:
  code: string
  language: string
  context: string
outputs:
  issues: string[]
  suggestions: string[]
  rating: number
---

{{ @safety }}

Review this {{ language }} code:

```{{ language }}
{{ code }}
```

Context: {{ context }}

Provide specific issues, improvement suggestions, and an overall quality rating (1-10).
