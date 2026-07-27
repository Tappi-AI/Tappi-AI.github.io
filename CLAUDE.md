# Dev Method

- Use `Skill(claude-bot)` for developing.

# Site

Jekyll static site for tappi.ai. Source lives at the repo root (no `pages/`
subfolder) — `index.md`, `about/`, `esg-demo/`, `_layouts/`, `_data/`,
`assets/`. Demo content (ESG traceability data) is ported from the sibling
`../esg-tappi` repo's demo UI — never copy real backend credentials from
that repo into this one.

No external CDNs or shared theme submodules — layout and CSS are
self-contained in `_layouts/base.html` and `assets/css/main.css`.

## Local development

```bash
docker compose up site
```

Site runs at http://localhost:14001 with livereload.

## Browser Testing

Not currently wired up in this repo — use the `developing-debug-frontend`
skill (Playwright via Docker) when visual verification is needed, instead of
maintaining a bespoke `browser/` service here.

# Deployment

- GitHub Pages at: https://tappi-ai.github.io (custom domain: https://tappi.ai, via `CNAME`)
- Repo: Tappi-AI/Tappi-AI.github.io
- Auto-deploys on push to main via `.github/workflows/jekyll.yml`, which builds this repo's `Dockerfile` and publishes `_site/`.
