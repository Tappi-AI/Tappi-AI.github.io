# tappi-ai.github.io

A Svelte + SvelteKit starter template with built-in AI-assisted development. Designed for people who want to describe what they want and let AI build it.

## What's Inside

1. **Svelte 5 + SvelteKit 2 template** — A clean, minimal frontend starter
2. **Multi-agent Claude Code system** — An orchestrator + workers that autonomously implement features from a ticket list
3. **Browser debugging** — Playwright-based visual debugging so the AI can see and interact with your running app

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://docs.docker.com/get-docker/) (for containerized dev & browser debugging)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)
- `tmux` (for multi-agent mode: `sudo apt install tmux` or `brew install tmux`)

### 1. Run the dev server

```bash
cd frontend
npm install
npm run dev
```

Or with Docker:
```bash
docker compose up
```

App runs at http://localhost:3000

### 2. Use AI to develop (interactive)

Just open Claude Code in the project directory and describe what you want:

```bash
claude
```

Then tell it what to build. The skills and rules in `.claude/` guide it to write clean, organized code.

### 3. Use AI to develop (autonomous multi-agent)

For bigger tasks, use the planning + bot workflow:

```bash
# Step 1: Plan — have a conversation to design tickets
claude
> /claude-bot plan

# Step 2: Run — let the bot execute tickets autonomously
bash .tmp/claude-bot/start.sh

# Step 3: Monitor
tmux attach -t <project-folder-name>

# Step 4: Stop
bash .tmp/claude-bot/stop.sh
```

The bot creates an orchestrator (Haiku) that assigns tasks to worker agents (Sonnet). Each worker picks a ticket, implements it, tests, lints, and commits — all automatically.

## Project Structure

```
frontend/                    # SvelteKit application
├── src/
│   ├── lib/                 # Reusable logic (NOT in .svelte files)
│   │   ├── utils/           # Pure functions
│   │   ├── services/        # API calls
│   │   ├── logic/           # Business logic
│   │   ├── types/           # TypeScript interfaces
│   │   └── stores/          # Svelte stores
│   ├── routes/              # Pages (UI only)
│   └── app.html             # HTML template
├── static/                  # Static assets
├── package.json
└── vite.config.ts           # Build config + test setup

browser/                     # Playwright browser automation (Docker)
├── browse.py                # Screenshot, click, inspect running app
└── Dockerfile

.claude/                     # AI development rules & skills
├── skills/
│   ├── claude-bot/          # Multi-agent orchestration system
│   ├── dev-svelte/          # Svelte code quality rules
│   └── programming/         # Test, format, lint, commit workflow
└── settings.local.json

docker-compose.yml           # Frontend + optional browser service
```

## Commands

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run check     # TypeScript type checking
npm run test      # Run tests
npm run lint      # Format + lint code
npm run format    # Format with Prettier
```

## Browser Debugging (for AI)

The browser service lets AI see your running app:

```bash
# Start browser service
docker compose --profile browser up -d

# AI can run these to debug visually
docker compose exec browser python browse.py status http://frontend:3000
docker compose exec browser python browse.py screenshot "name"
docker compose exec browser python browse.py click "Button Text"
docker compose exec browser python browse.py buttons
```

Screenshots are saved to `.browser/`.

## How the AI Workflow Works

### Interactive mode
You talk to Claude Code directly. The `.claude/skills/` folder teaches it to:
- Keep logic out of `.svelte` files (put it in `lib/`)
- Run tests, format, and lint before committing
- Follow consistent code organization patterns

### Autonomous mode (claude-bot)
1. **Planning phase** — You describe what you want. Claude acts as a Tech Lead, designs tickets, and writes them to `.tmp/llm.plan.status`
2. **Execution phase** — The orchestrator (Haiku) reads tickets and assigns them to workers (Sonnet) running in tmux windows
3. **Each worker** — picks one ticket, implements it, runs tests, formats, lints, commits, and signals completion
4. **Coordination** — Git locks prevent conflicts, trigger files signal status, 15-min timeouts kill stuck workers

### Key files for autonomous mode

| File | Purpose |
|------|---------|
| `.tmp/llm.plan.status` | Ticket checklist (`[ ]` pending, `[x]` done) |
| `.tmp/llm.working.log` | Log of completed work |
| `.tmp/llm.working.notes` | Design decisions from planning |
| `.tmp/claude-bot/*.sh` | Custom runner scripts for this project |

## Customization

- `frontend/vite.config.ts` — Backend URLs, build settings, test config
- `frontend/myconfig.js` — Base path for deployment
- `docker-compose.yml` — Service configuration
- `.claude/skills/` — Modify AI behavior and rules

## Deployment

Uses SvelteKit's static adapter. Run `npm run build` and deploy the `build/` folder to any static host.

## License

MIT
