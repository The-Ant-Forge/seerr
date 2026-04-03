# Code Review Phases

Periodically we do a consolidation review covering all source, tests, build config, and metadata.

## Review Checklist

Ordered by risk — review high-severity items first, hygiene last.

### 1. Authorization & Business Rules
1. **AuthN/AuthZ correctness** — every route, action, and UI path enforces
   the right admin/user/requester permissions; no server-side trust in
   client claims; admin-only config never leaks to frontend consumers
2. **Request lifecycle integrity** — request state machine allows only valid
   transitions; duplicate requests, re-requests, partial availability,
   cancellation, and approval bypasses are handled explicitly; UI state
   matches backend truth

### 2. API & Contract Fidelity
3. **OpenAPI fidelity** — spec matches actual request validation, response
   shapes, status codes, and error formats
4. **Boundary validation** — all external input validated/coerced at
   route/webhook/job boundaries; no implicit trust in query params, body
   payloads, or provider responses
5. **Frontend/backend alignment** — React consumers handle
   nullable/optional/error states exactly as the API actually behaves

### 3. Data Integrity & Database Safety
6. **Migration safety** — column renames vs adds, data-loss risk on
   destructive changes, rollback path exists, migration tested on both
   SQLite and Postgres
7. **Cross-database correctness** — queries behave the same on SQLite and
   Postgres for nulls, case sensitivity, unique constraints, dates,
   JSON/text, and transaction semantics
8. **Transactional integrity** — multi-step writes use transactions or
   compensating logic; no partial state commits

### 4. External Integrations
9. **Provider correctness** — TMDB/Sonarr/Radarr/Plex/Jellyfin adapters
   handle provider-specific fields, capability differences, schema drift,
   and missing data safely
10. **Idempotency & deduplication** — repeated retries or user actions do not
    create duplicate requests, imports, or inconsistent statuses
11. **Timeouts, retries & rate limits** — outbound calls have sane
    timeout/retry behaviour, bounded concurrency, and explicit handling for
    429s and provider downtime
12. **Staleness & reconciliation** — cache/sync logic eventually converges
    with provider truth; stale availability/request state is corrected
    predictably

### 5. Background Jobs & Concurrency
13. **Job idempotency** — scheduled jobs can run twice without corrupting
    state
14. **Overlap & failure isolation** — concurrent runs and long-running jobs
    do not race or double-process; one provider/job failure does not block
    unrelated work or poison shared state
15. **Checkpointing** — pagination cursors, incremental sync markers, and
    retry queues recover cleanly from interruption

### 6. Security
16. **Input/output security** — injection risks in raw TypeORM queries, XSS
    in rendered content, SSRF/path risks in external fetches, unsafe
    deserialization
17. **Secrets & credentials** — API keys/tokens stored, masked, and logged
    safely; no accidental exposure through Next.js env handling or
    serialised props

### 7. Error Handling & Observability
18. **Error handling quality** — exceptions not swallowed; user-facing
    failures are actionable; provider errors distinguished from local bugs
19. **Logging & tracing** — structured logs include request/media/provider/job
    context without leaking secrets; enough metadata to debug "why is this
    request stuck?"

### 8. Performance
20. **Database efficiency** — N+1 queries, missing indexes, eager-loading
    mistakes, unbounded scans, expensive counts
21. **Frontend efficiency** — avoidable re-renders, oversized payloads,
    duplicated fetches, bad SSR/CSR cache boundaries

### 9. Frontend Quality
22. **SSR/client boundary** — no server-only imports in client code, no
    hydration bugs, no secret leakage through props/env vars
23. **i18n completeness** — no hardcoded user-facing strings; message
    IDs/defaults consistent; missing-key behaviour is correct
24. **Accessibility** — keyboard navigation in modals/drawers, accessible
    names for poster-only buttons, focus management, colour contrast in
    status badges, screen-reader handling for async states

### 10. Tests & Regression Protection
25. **Meaningful test coverage** — permissions, state transitions, provider
    adapters, job idempotency/overlap, migrations, and user-facing E2E
    flows; not just line-count coverage
26. **Fixture realism** — API/provider mocks reflect real payloads and
    failure modes, not idealised happy paths only

### 11. Drift & Hygiene
27. **Configuration drift** — defaults, cron schedules, feature flags, and
    env vars match current behaviour
28. **Documentation drift** — specs in `docs/`, CLAUDE.md, README, and
    inline comments match real behaviour
29. **Code hygiene** — dead code, stale TODOs, duplication, commented-out
    code, unused dependencies, naming inconsistencies removed or justified

## Deliverable
A review document in `docs/` named `Code-Review-YYMMDD.md` (or similar) with:
- Summary table: Category, Description, Action, Impact, Effort, Risk
- Detailed findings grouped by category, ordered by impact then effort
- Out-of-scope items noted for TODO.md

## Process
1. Produce the review document — do NOT implement during review
2. Review and approve findings with the user
3. Implement approved items in focused commits
4. Re-run tests after each change
5. On completion of review items update the code review doc to reflect tasks done, deferred or ignored.
