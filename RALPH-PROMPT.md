# PlantScope Ralph Loop Prompt

You are building PlantScope, a mobile-first plant info web app using iNaturalist API.

## Instructions

1. Read `PHASES.md` to see what's done and what's pending.
2. Pick the FIRST phase with status `pending`.
3. Read `docs/04-implementation-plan.md` for that phase's tasks and exit criteria.
4. Read `docs/02-technical-architecture.md` and `docs/03-ui-ux-design.md` for reference.
5. Implement the phase fully, verifying each exit criterion.
6. Start the dev server (`python3 -m http.server 8000`) and verify in browser.
7. When all exit criteria pass, update `PHASES.md` — change that phase's status from `pending` to `done`.
8. Commit ALL changes atomically: `git add -A && git commit -m "Phase N: <short description>"` — one commit per phase, no partial commits.
9. If ALL phases are now `done`, output: `<promise>ALL PHASES COMPLETE</promise>`
10. If phases remain, just exit — you'll be called again for the next one.

## Key Constraints

- Zero-build: no npm, no bundler. All deps from CDN via import maps.
- Hotwire (Turbo + Stimulus) for JS framework.
- Bulma CSS from CDN.
- File structure per `docs/02-technical-architecture.md`.
- Mobile-first (375px), responsive up.
- Test in browser before marking a phase done.

## Important

- Do NOT skip phases or do multiple phases in one iteration.
- Do ONE phase per iteration, verify it, mark it done, then exit.
- If a phase's exit criteria can't be met, leave it `pending` and explain what's blocking in a comment in PHASES.md.
