# Dev Method

- Use `Skill(claude-bot)` for developing.

# Browser Testing (Playwright via Docker)

Use the browser container to take screenshots and verify pages — both local dev and deployed site.

## Setup
```bash
docker compose --profile browser up -d browser
```

## Commands
```bash
# Screenshot local dev
docker compose exec browser python browse.py screenshot http://frontend:3000

# Screenshot deployed site
docker compose exec browser python browse.py screenshot https://tappi-ai.github.io
docker compose exec browser python browse.py screenshot https://tappi-ai.github.io/calendar

# Check page status
docker compose exec browser python browse.py status https://tappi-ai.github.io

# List buttons
docker compose exec browser python browse.py buttons
```

Screenshots are saved to `.browser/` directory — use `Read` tool to view them.

# Deployment

- GitHub Pages at: https://tappi-ai.github.io
- Repo: Tappi-AI/Tappi-AI.github.io
- Auto-deploys on push to main via `.github/workflows/deploy.yml`
