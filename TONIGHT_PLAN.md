# Hermes Command Center — Tonight's implementation plan

Date: 2026-09-13
Repository: `robdspain/eveclaw`
Local: `/Volumes/Fast Storage/00-Organized/Work/Neo AI/neo_code_repos/eveclaw`

## Definition of done for tonight

- The fork is clearly branded as Hermes Command Center.
- The web app has a Hermes-native adapter boundary instead of scattering Eve-specific runtime calls through the UI.
- The existing chat, thread, manage, search, scheduled-work, connector, and skills surfaces continue to typecheck and build.
- Netlify deployment configuration is present and safe.
- Convex integration seam is documented and ready without putting provider secrets in Convex.
- Mac-mini execution bridge contract is implemented as a typed server boundary, with a development/mock mode that is explicit and never pretends to be production execution.
- Changes are committed and pushed to `robdspain/eveclaw`.

## Non-goals for tonight

- Do not copy EveClaw provider/API credentials.
- Do not introduce API-key model billing.
- Do not deploy publicly without authentication and bridge authorization.
- Do not migrate sensitive historical transcripts automatically.
- Do not claim SuperGrok OAuth works until Hermes supports it.
- Do not replace the working Eve UI wholesale; preserve it while adapters are introduced.

## Phase 0 — Baseline and safety

1. Confirm branch, remotes, clean/known working tree, Node/tool versions.
2. Run install, typecheck, and build.
3. Inspect EveClaw runtime entry points and API routes.
4. Record any upstream assumptions that must be replaced.

## Phase 1 — Product identity and app shell

1. Rebrand visible identity from Eve/Ruth to Hermes/Neo where it is user-facing.
2. Add Hermes runtime configuration with `executionMode: bridge | local-dev`.
3. Add an explicit subscription-only provider registry used by the UI.
4. Preserve existing thread/manage UX and avoid backend rewrites until the boundary is tested.

## Phase 2 — Hermes bridge contract

1. Add typed request/response/event schemas for:
   - thread send
   - thread cancel
   - run status
   - tool activity
   - scheduled-task sync
   - connector status
2. Add a server-side bridge client interface.
3. Add a local-dev mock implementation only for UI development; label it clearly.
4. Add production adapter stub that targets the Mac-mini Hermes bridge but fails closed when not configured.
5. Keep browser and Netlify code unaware of provider credentials.

## Phase 3 — Convex seam

1. Add Convex schema design for users, agents, threads, messages, runs, schedules, connectors, and events.
2. Add repository interfaces so the UI can switch from local storage/Neon to Convex incrementally.
3. Store connector metadata/status only, never OAuth tokens or API keys.
4. Add retention flags for sensitive threads.

## Phase 4 — Netlify delivery

1. Add `netlify.toml` and build configuration.
2. Add environment variable documentation with no secret values.
3. Add health route and protected bridge readiness route.
4. Build production bundle.
5. Deploy only a protected preview after authentication is confirmed.

## Phase 5 — First real Mac-mini vertical slice

1. Implement bridge process next to Hermes gateway on the Mac mini.
2. Authenticate browser session through Convex and issue short-lived bridge tickets.
3. Stream Hermes session events into the Command Center.
4. Persist thread/message/run metadata in Convex.
5. Verify from the iPhone over Tailscale.

## Phase 6 — Migration and polish

1. Import agent roster metadata from the verified Grok/Codex inventory.
2. Surface Hermes cron jobs and migrated routines.
3. Add push notifications and reconnect handling.
4. Add explicit confirmation gates for external/destructive actions.
5. Add tests for auth, bridge failure, reconnect, retention, and connector status.

## Commit plan

- `docs: define hermes command center tonight plan`
- `refactor: add hermes runtime adapter boundary`
- `feat: add hermes bridge protocol types`
- `feat: add convex persistence seam`
- `chore: add netlify deployment configuration`
- `feat: add hermes command center identity shell`

## Proof required before reporting completion

- `npm run typecheck` passes.
- `npm run build` passes, or a documented real blocker is reported.
- Git status is understood.
- Commits are pushed and remote SHAs verified.
- Any incomplete production integration is explicitly labeled TODO, not presented as working.
