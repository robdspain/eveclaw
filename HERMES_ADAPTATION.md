# Hermes adaptation notes

## Why this fork exists

EveClaw provides the closest existing reference for the web experience Rob wants: threads, streaming, proactive work, management surfaces, connections, skills, and mobile access. This fork keeps that product shape while replacing the agent/runtime assumptions with Hermes.

## Backend replacement

| EveClaw surface | Hermes Command Center target |
| --- | --- |
| Eve agent runtime | Hermes gateway and Mac-mini bridge |
| Neon persistence | Convex tables and realtime queries |
| Vercel deployment | Netlify deployment |
| AI Gateway/provider routing | Hermes subscription/OAuth provider sessions |
| Composio connection runtime | Hermes MCP/OAuth connectors |
| Eve reminders/webhooks | Hermes cron and bridge-triggered runs |
| Eve session stream | Hermes run events + Convex durable messages |

## Migration rules

1. Preserve the useful chat/manage UX; do not copy provider credentials or backend secrets.
2. Keep model execution on the Mac mini. The browser, Netlify, and Convex must not call model providers.
3. Store connector status and account aliases only; never provider tokens in Convex.
4. Keep sensitive legal, custody, school, and financial transcripts metadata-only by default.
5. Require explicit confirmation for external sends, destructive actions, payments, or legal changes.
6. Keep `upstream` available for selectively pulling UI improvements, but review every merge before adopting backend changes.

## Initial implementation order

1. Run the upstream Eve chat UI locally and establish a clean baseline.
2. Add Hermes/Convex/Netlify adapters behind typed interfaces.
3. Replace Eve session calls with the Hermes bridge.
4. Replace persistence with Convex while retaining a migration path for local thread data.
5. Add the Neo face as the visual shell and mobile voice surface.
6. Add the migrated Grok/Codex roster and scheduled-task inventory.
7. Deploy a protected Netlify preview and test from the iPhone over Tailscale.
