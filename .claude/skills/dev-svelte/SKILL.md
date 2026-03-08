# Svelte Dev Skill

## Rule 1: Keep Logic Out of Svelte Files

**DO NOT write business logic in `.svelte` files.**

Move to `lib/` files instead:
- Data transformation → `lib/utils/`
- API calls → `lib/services/`
- Complex algorithms → `lib/logic/`
- TypeScript types → `lib/types/`

## Rule 2: Svelte Files = UI Only

`.svelte` files handle:
- HTML rendering
- Button clicks
- Form inputs
- State display
- Styling

## Rule 3: Structure

```
src/
├── routes/          ← Svelte pages only
└── lib/
    ├── utils/       ← Pure functions (testable)
    ├── services/    ← API calls
    ├── logic/       ← Business logic
    └── types/       ← Interfaces
```

## Example: WRONG

```svelte
<script>
  async function handleClick() {
    const data = await fetch('/api/check/...');
    const json = await data.json();
    const results = json.map(item => ({
      ...item,
      available: item.status === 'free'
    }));
  }
</script>
```

## Example: RIGHT

**lib/services/api.ts**
```typescript
export async function checkUsername(user: string) {
  const data = await fetch(`/api/check/${user}`);
  return data.json();
}

export function formatResults(data: any) {
  return data.map(item => ({
    ...item,
    available: item.status === 'free'
  }));
}
```

**routes/+page.svelte**
```svelte
<script>
  import { checkUsername, formatResults } from '$lib/services/api';

  async function handleClick() {
    const data = await checkUsername(username);
    results = formatResults(data);
  }
</script>
```

## Why?

- **Testable**: Pure functions have no dependencies
- **Reusable**: Logic works in React/Vue/Node.js
- **Maintainable**: Clear separation of concerns
- **Framework-agnostic**: Easy to migrate UI later

## Browser Debugging

Start services with browser automation:

```bash
docker compose --profile browser up -d

# Commands
docker compose exec browser python browse.py status http://localhost:3000
docker compose exec browser python browse.py screenshot "name"
docker compose exec browser python browse.py click "Button Text"
docker compose exec browser python browse.py buttons
```

Screenshots saved to `.browser/` folder.

## Checklist

When writing code:
- [ ] Logic in `lib/`?
- [ ] No API calls in components?
- [ ] Imports organized (Svelte → App → Lib)?
- [ ] Component < 150 lines?
- [ ] Types in `lib/types/`?
