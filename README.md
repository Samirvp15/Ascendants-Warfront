# Ascendants Warfront

A lane-based tactical card battler. Deploy units across three lanes, manage mana and gold, and destroy the enemy Nexus before yours falls.

![Game logo](public/images/game_logo.png)

## Play locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Documentation

| Doc | Purpose |
|-----|---------|
| **[Game Guide](docs/GAME_GUIDE.md)** | Mechanics, units, spells, strategy |
| **[UI Guidelines](docs/UI_GUIDELINES.md)** | **Primary UI target** — layout, components, palette ([reference mockup](public/images/referenceGame.png)) |

### UI reference (development target)

All UI work should follow the mockup below:

![UI reference mockup](public/images/referenceGame.png)

See **[docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md)** for layout zones, component specs, colors, and an implementation checklist.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4

## Project structure

```
src/App.tsx                    — Game logic, card library, UI
public/images/                 — Card art, battlefield, referenceGame.png
docs/GAME_GUIDE.md             — Player-facing game documentation
docs/UI_GUIDELINES.md          — UI development guidelines (reference mockup)
```
