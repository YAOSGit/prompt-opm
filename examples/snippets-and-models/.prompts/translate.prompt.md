---
model: "claude-3-opus"
config:
  temperature: 0.2
  maxTokens: 2048
inputs:
  text: string
  targetLanguage: string
  preserveFormatting: boolean
  glossary: object
outputs:
  translation: string
  confidence: number
---

Translate the following text to {{ targetLanguage }}.

{{ @persona }}

Text to translate:
{{ text }}

Preserve original formatting: {{ preserveFormatting }}

Use this glossary for domain-specific terms:
{{ glossary }}
