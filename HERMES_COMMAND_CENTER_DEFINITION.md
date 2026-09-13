# Hermes Command Center — Product and Technical Definition

**Status:** Approved implementation definition
**Owner:** Rob Spain
**Repository:** `robdspain/eveclaw`
**Runtime:** Hermes on Rob's Mac mini
**Web:** Netlify
**State:** Convex
**Private network:** Tailscale

## 1. Product definition

Hermes Command Center is Rob's private, mobile-first operating console for a roster of specialized AI agents. It combines the best interaction patterns from Grok Bot and EveClaw while keeping Hermes as the single execution authority.

A user selects an agent, opens or creates a thread, sends a request, watches the run and tool activity live, and receives a durable result. Proactive jobs appear as ordinary threads with an automation badge. The same thread history is available from the Mac mini and iPhone.

The product is not a new model provider, hosted AI service, or API-key proxy. Netlify and Convex provide the application surface and state. The Mac mini runs Hermes, OAuth sessions, MCP connectors, local files, browser automation, and scheduled jobs.

## 2. Design principles

1. **Hermes executes.** The browser never calls Claude, Codex, Gemini, xAI, or tool providers directly.
2. **Subscription-first.** Use Claude OAuth, ChatGPT/Codex OAuth, Gemini Antigravity CLI login, and OAuth connectors. Never add API-key billing to make a connector work.
3. **One source of truth for execution.** A run has one Hermes execution ID and one durable thread association.
4. **Realtime but recoverable.** Live events improve the experience; Convex snapshots and Hermes session IDs make reconnects safe.
5. **Separate agents, shared control plane.** Agents have distinct profiles, instructions, threads, schedules, and status, but share the Command Center shell.
6. **Fail closed.** An offline bridge, expired ticket, missing connector, or ambiguous external action produces a visible blocked state, not a fake success.
7. **Private by default.** Sensitive school, custody, legal, financial, and family content is not copied into cloud state unless explicitly enabled for that thread.
8. **Human confirmation for consequences.** Sending, publishing, deleting, paying, changing legal/school records, or messaging people requires confirmation.

## 3. System architecture

```text
 iPhone / browser
       |
       | HTTPS + Convex auth/realtime
       v
 Netlify Next.js app
       |
       | short-lived bridge ticket; no provider secrets
       v
 Hermes Bridge on Mac mini (Tailscale/private)
       |
       | Hermes gateway/session APIs
       v
 Hermes runtime
   |       |       |       |
 Claude  Codex  Gemini  OAuth/MCP/local tools
 OAuth   OAuth   agy     Google/GitHub/etc.
```

### Components

#### Command Center web app

Responsibilities:

- Authentication and session bootstrap
- Agent roster, thread list, search, chat, model display
- Rendering streamed events and tool activity
- Manage page for schedules, connectors, skills, memory, and run history
- Convex queries/mutations for durable state
- Bridge client calls using short-lived, scoped tickets
- Push notification registration

It must not contain provider API keys, OAuth refresh tokens, Hermes dashboard passwords, or Tailscale credentials.

#### Convex

Responsibilities:

- User identity and authorization metadata
- Agent definitions and enabled/disabled state
- Thread metadata and durable message projections
- Run metadata and terminal status
- Schedule projections and last-run history
- Connector display status and account aliases
- Short-lived event/reconnect metadata
- Audit records for confirmations and external actions

Convex is not the model runtime and never stores provider credentials.

#### Hermes Bridge

A small Mac-mini service next to the Hermes gateway. It is the only component allowed to invoke Hermes sessions for the web app.

Responsibilities:

- Validate bridge tickets and user/thread scope
- Create/resume/cancel Hermes runs
- Translate Hermes events to the stable Command Center protocol
- Report provider/connector availability without exposing credentials
- Reconcile active Hermes sessions and cron jobs into Convex
- Enforce confirmation requirements before consequential tool calls
- Reconnect and replay events after browser disconnects

The bridge must bind to a private interface or require Tailscale access. It must not be exposed as an unauthenticated public Netlify function.

## 4. User experience definition

### Main shell

- **Left rail:** agent roster; each card shows avatar, purpose, online/offline, busy/idle, and active-run count.
- **Thread column:** pinned, recent, automated, and archived threads; full-text search.
- **Main conversation:** streaming messages, markdown, attachments, tool activity, artifacts, and run state.
- **Right drawer:** current agent/model, connector states, schedule summary, run details, and context controls.
- **Composer:** text, attachment, voice input, agent selector, model selector, send, stop, and confirmation controls.
- **Mobile:** roster/thread columns become drawers; conversation and composer remain primary.

### Agent roster

Initial agents come from the verified Grok/Codex inventory:

- Study
- Personal Inbox
- Mac Mini Health
- Study Flash Cards
- Financial Manager
- Transformation Marketing
- Waylon CUSD
- KCUSD Inbox
- Court Ops
- Newsletter
- Apple Messages

Each agent definition contains:

```text
id, displayName, purpose, icon, instructionsRef,
allowedTools, allowedConnectors, sensitiveByDefault,
enabled, currentStatus, lastRunAt
```

### Thread behavior

- New thread is assigned to the selected agent.
- Thread title starts from the first user message and can be renamed.
- Pin, archive, delete, fork, search, and export are supported.
- Automated runs create or reopen a clearly labeled thread.
- Forking creates a new thread with an explicit context snapshot.
- Browser reconnect resumes from the last durable event boundary.

### Run display

Every run visibly shows:

- queued / running / waiting for confirmation / completed / failed / canceled
- selected subscription provider and model label
- elapsed time
- current tool, if any
- expandable progress/tool events
- retry or resume action when safe
- exact failure class when blocked

## 5. Request and event flow

### Human message

1. Browser authenticates through the web app.
2. Browser submits `thread.send` with `threadId`, `agentId`, text, and attachment references.
3. Server validates user/thread ownership and requests a short-lived bridge ticket.
4. Bridge validates ticket, creates/resumes Hermes session, and emits `run.started`.
5. Hermes executes using the configured subscription session and connectors.
6. Bridge emits progress, tool, confirmation, and terminal events.
7. Convex stores a durable message/run projection.
8. Browser renders the stream and reconciles against Convex after completion.

### Proactive schedule

1. Hermes cron runs on the Mac mini.
2. Bridge reconciles the run to the matching Convex schedule.
3. Bridge creates an automation-origin thread or appends to the configured thread.
4. User receives an in-app unread badge and optional web push.
5. Run history links directly to the resulting thread.

### Reconnect

1. Browser reconnects with `threadId` and last received event sequence.
2. Bridge replays buffered events if available.
3. Browser loads the durable Convex projection.
4. If Hermes is still running, bridge reattaches.
5. If the run is terminal, browser displays the final state without duplication.

## 6. Stable bridge protocol

Commands:

- `thread.send`
- `thread.cancel`
- `thread.resume`
- `run.confirm`
- `run.reject`
- `events.subscribe`
- `status.get`
- `schedules.reconcile`
- `connectors.status`

Events:

- `run.queued`
- `run.started`
- `run.progress`
- `run.tool.started`
- `run.tool.completed`
- `run.confirmation.required`
- `run.completed`
- `run.failed`
- `run.canceled`
- `connector.changed`
- `schedule.changed`

Protocol requirements:

- versioned envelopes
- request ID and run ID on every command/event
- monotonic event sequence per run
- idempotency key for sends
- bounded payload sizes
- no secret values in event payloads
- schema validation at both bridge and web boundaries

## 7. Convex definition

Recommended tables:

- `users`: auth subject, display name, role, createdAt
- `agents`: agent configuration and status projection
- `threads`: owner, agent, title, pinned, archived, origin, sensitivity mode
- `messages`: thread, role, content projection, event boundary, createdAt
- `runs`: thread, Hermes session/run IDs, provider label, model label, state, timestamps, error class
- `runEvents`: run, sequence, safe event payload, createdAt, short retention
- `scheduledTasks`: Hermes cron ID, name, schedule, enabled, agent, last/next run
- `connectors`: connector ID, display name, OAuth status, account alias, checkedAt
- `skills`: name, description, version, enabled, updatedAt
- `confirmations`: run, action class, description, decision, decidedAt
- `auditEvents`: actor, action, target, outcome, timestamp

Sensitive content mode:

- `metadata-only`: store title, status, timestamps, and local Hermes reference; no message bodies.
- `durable`: store encrypted/authorized message projections in Convex.
- `local-only`: keep full content on the Mac mini and show only summaries/status remotely.

Default for Financial Manager, Waylon CUSD, KCUSD Inbox, and Court Ops is metadata-only or local-only.

## 8. Connector definition

The Manage page shows connection state, not secrets.

### Subscription/model connections

- Claude OAuth: Hermes provider session
- ChatGPT/Codex OAuth: Hermes provider session and bundled Codex MCP
- Gemini: authenticated Antigravity CLI on Mac mini
- SuperGrok: display as unavailable until Hermes supports working Premium+ OAuth

### Tool connectors

Connectors execute through Hermes MCP/OAuth integrations on the Mac mini. Initial targets:

- Gmail
- Google Calendar
- Google Drive
- GitHub
- Notion
- Apple Messages/local Mac automation where explicitly authorized

A connector card shows connected, needs reauth, unavailable, or disabled. OAuth flows occur on the Mac mini or an approved provider page, never through Convex-stored secrets.

## 9. Security model

- Convex auth required for all user data.
- Bridge tickets are short-lived, scoped to user/thread/action, and single-use where practical.
- Tailscale is the preferred private transport.
- No public endpoint directly proxies Hermes.
- Confirmation required for external communication, publication, deletion, financial action, legal/school record changes, and irreversible filesystem changes.
- Every confirmation and consequential action is audited.
- Sensitive thread retention is explicit and visible.
- Logs redact tokens, passwords, keys, message contents where configured, and full connector payloads.

## 10. Deployment definition

### Netlify

- Deploy `apps/eve` as the web app.
- Build with Node 24.
- Store only public configuration and server-side application configuration.
- Use protected deploy previews until auth, CSP, and bridge tickets are verified.

### Mac mini

- Hermes gateway remains managed locally.
- Bridge runs as a launchd service under Rob's user account.
- Bridge health and Hermes gateway health are separate signals.
- Tailscale connection is required for private direct mode.
- Local system SSH remains separate from Tailscale SSH semantics.

### Convex

- Separate development and production deployments.
- Schema migrations reviewed and committed.
- No provider credentials or raw `.env` files committed.

## 11. Acceptance criteria

The implementation is complete when:

1. Rob can open the Netlify app from iPhone and authenticate.
2. Agent roster loads with accurate online/busy status.
3. Rob can create, rename, pin, archive, search, and reopen threads.
4. A message reaches Hermes on the Mac mini and streams back live.
5. Disconnect/reconnect does not duplicate or lose the final result.
6. Tool activity is visible without leaking secrets.
7. Scheduled Hermes jobs appear with status and run history.
8. A proactive job creates a linked thread and unread notification.
9. Connector cards report OAuth status accurately.
10. Claude/Codex/Gemini use subscription sessions only.
11. SuperGrok is never silently routed through an API key.
12. Sensitive thread modes prevent unintended cloud transcript storage.
13. Confirmation gates block consequential actions until approved.
14. Netlify production build, Convex schema, bridge tests, and mobile smoke test pass.
15. The repo has no uncommitted generated credentials or local secrets.

## 12. Delivery sequence

### Milestone A — shell and contracts

Already started: fork, identity rebrand, runtime config, Netlify config, protocol types, health route.

### Milestone B — backend seams

- Add Convex package/schema and auth adapter.
- Add bridge server package and ticket validation.
- Add typed browser bridge client.
- Add status and event reconciliation.

### Milestone C — real chat

- Replace Eve runtime calls in chat with the Hermes adapter.
- Preserve thread UI and local migration fallback.
- Stream real Hermes events.

### Milestone D — management

- Replace reminders/automation data with Hermes cron projections.
- Add roster administration, connector status, skills, and retention controls.

### Milestone E — production

- Run Mac-mini bridge under launchd.
- Configure Convex production.
- Deploy protected Netlify preview.
- Test iPhone over Tailscale.
- Promote after acceptance checklist passes.
