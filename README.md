# Hermes Command Center

A personal, self-hosted AI command center for Rob, based on the excellent [EveClaw](https://github.com/michaelshimeles/eveclaw) interface patterns and adapted to run through Hermes on the Mac mini.

This fork is intentionally becoming its own product. The web app provides the conversation and management experience; Hermes remains the execution layer for models, tools, scheduled jobs, and OAuth-backed connectors.

## Product direction

- Grok-style agent roster with separate persistent threads
- Streaming conversations, search, command palette, model/agent picker
- Scheduled tasks, reminders, run history, and live status
- Connector and skill management
- Mobile-first PWA access from the iPhone
- Neo animated face and voice interaction as a first-class surface
- Convex for durable application state
- Netlify for web deployment
- Hermes bridge on the Mac mini for execution

## Subscription-only boundary

No model calls are made from the browser, Netlify, or Convex. The Mac mini uses subscription/OAuth-backed sessions where available:

- Claude OAuth subscription
- ChatGPT/Codex OAuth subscription
- Gemini through the authenticated Antigravity CLI
- Google/GitHub/Notion and similar OAuth connectors
- SuperGrok only through supported subscription OAuth; never the stored xAI API key

## Development

Requires Node 24.

```bash
npm install
npm run dev
```

The original upstream EveClaw implementation is retained while each surface is migrated to Hermes. `upstream` points to the source repository; `origin` points to Rob's fork.

## Repository remotes

- Fork: `https://github.com/robdspain/eveclaw`
- Upstream: `https://github.com/michaelshimeles/eveclaw`
