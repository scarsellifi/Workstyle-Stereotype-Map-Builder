# Workstyle Stereotype Map Builder

A playful experiment for visual reasoning. Place "actors" — coding agents, fictional characters, programming languages, operating systems — on seven behavioral axes, then ask the matcher to recommend what fits you.

**Try it live →** [scarsellifi.github.io/Workstyle-Stereotype-Map-Builder](https://scarsellifi.github.io/Workstyle-Stereotype-Map-Builder/)

> The word **Stereotype** in the name is the point. The maps are exaggerations meant to spark a conversation, not measurements meant to be true.

## What it does

1. **Renders a Workstyle Stereotype Map** — seven behavioral axes, each element placed somewhere between two opposite poles.
2. **Matches you to those elements** — describe yourself or what you need; the matcher places *you* on the same axes and recommends one element (or a combo of two), with reasoning per axis.

You can also build your own maps from scratch, drag dots to refine, generate maps from a topic with AI, and add new elements with AI suggestions.

## Quickstart

The fastest path is the [live demo](https://scarsellifi.github.io/Workstyle-Stereotype-Map-Builder/). To run locally, open `index.html` in a browser — no backend, no build, no dependencies.

```bash
xdg-open index.html    # Linux
open index.html        # macOS
```

For AI features (generate / match / ✨ add): in **Settings**, paste an [OpenRouter API key](https://openrouter.ai/keys). The key stays in your browser's `localStorage` and is sent only to `openrouter.ai`.

## The 7 axes

| Dimension | Left pole (0) | Right pole (100) |
|---|---|---|
| Communicating | Low-context | High-context |
| Evaluating | Direct negative feedback | Indirect negative feedback |
| Leading | Egalitarian | Hierarchical |
| Deciding | Consensual | Top-down |
| Trusting | Task-based | Relationship-based |
| Disagreeing | Confrontational | Avoids confrontation |
| Scheduling | Linear-time | Flexible-time |

Click any axis name in the app to see its definition with both poles explained.

## Built-in presets

**Tech**
- Coding Agents — Claude Code, Codex, Gemini CLI, Cursor, pi.dev
- Operating Systems — Linux, macOS, Windows
- Programming Languages — Python, JavaScript, Rust, C, Java
- Python Backend Frameworks — FastAPI, Django, Flask
- Gaming Platforms — PC, PlayStation, Xbox, Nintendo Switch

**Fiction**
- Naruto — Team 7 + Orochimaru + Danzo
- Attack on Titan — Eren, Levi, Armin
- Star Trek — Enterprise Captains (Archer, Pike, Kirk, Picard)
- Star Wars — Anakin, Yoda, Darth Vader, Palpatine, Leia

## Features

- **Drag any dot** along an axis to reposition it. Auto-saves to `localStorage`.
- **Click an icon** (on the map or in the sidebar) to see the element's bio and all 7 per-axis scores visualized as bars.
- **Click an axis name** ("COMMUNICATING", etc.) to see what that axis means with both poles explained.
- **Find your match** — describe yourself; get a recommendation (single or combo) with reasoning per axis. A dashed "You" dot appears on every axis so you can see the distance visually.
- **✨ Add with AI** — type a name, click ✨, and the AI fills in positions, icon and bio calibrated against the rest of the map.
- **Generate** entire maps from a topic. Returns 3 elements with full positioning and notes.
- **Save & My maps** — Generated maps auto-save into a personal library; click **Save** to keep a hand-built one too. Saved maps appear under **My maps** in the preset dropdown. Manage and delete them via the **⋯** button.
- **Export / Import** maps as JSON.

## Data format

```json
{
  "title": "Coding Agents — Workstyle Stereotypes",
  "notes": "Why these five: ...",
  "items": [
    {
      "name": "Claude Code",
      "icon": "🟠",
      "note": "Explains itself. Polite, asks before destructive ops...",
      "positions": {
        "communicating": 70, "evaluating": 60, "leading": 30,
        "deciding": 35, "trusting": 60, "disagreeing": 50, "scheduling": 30
      }
    }
  ]
}
```

`icon` accepts either an emoji or an image URL (`https://…` or `data:…`).

## Project structure

```
index.html      entry point + all dialogs
styles.css      styling + responsive breakpoints
app.js          state, rendering, drag, matcher, OpenRouter calls, persistence
presets.js      DIMENSIONS (axis definitions) + PRESETS (all built-in maps)
```

## Lineage

Inspired by a talk on **team management at PyCon Italia 2026**, and by the visual structure of Erin Meyer's [*The Culture Map*](https://erinmeyer.com/books/the-culture-map/) — which itself stands on **Geert Hofstede's** *cultural dimensions theory* and, earlier still, **Edward T. Hall's** *high-context vs low-context* framework from *Beyond Culture* (1976).

We think these sociological dimensions are genuinely useful — but we also think **individual differences matter more than stereotypes**. So here we apply them only to **tech and fiction**, where simplification is the point. We do not believe they fairly describe countries or cultures, which have a thousand nuances and deserve more than a horizontal line.

## The spirit

Don't make real decisions from a 7-axis cartoon — don't hire, fire, promote or pick tools based on this. And don't use it to stereotype real people by anything that defines who they are. That's the opposite of what this is for.

For unrestricted experimentation, clone the repo locally and use your own OpenRouter key — then use the output responsibly.

Built by **Marco Scarselli**. Vibe-coded. [MIT licensed](https://opensource.org/licenses/MIT).

<sub>Not affiliated with the authors cited above. Trademarks belong to their owners.</sub>
