const DIMENSIONS = [
  {
    id: 'communicating', label: 'Communicating',
    leftLabel: 'Low-context', rightLabel: 'High-context',
    description: 'How explicit and literal communication is.',
    leftDescription: 'Precise, simple, clear. Messages are understood at face value. Repetition is appreciated for clarity. Things are spelled out, written down, said out loud.',
    rightDescription: 'Layered, nuanced, sophisticated. Messages are read between the lines. Implicit understanding is valued. Much goes unsaid because it is assumed shared.',
  },
  {
    id: 'evaluating', label: 'Evaluating',
    leftLabel: 'Direct negative feedback', rightLabel: 'Indirect negative feedback',
    description: 'How negative feedback is delivered.',
    leftDescription: 'Frank, blunt, honest. Negative messages stand alone, not softened by positives. May be given in front of others. Criticism is a sign of respect for your competence.',
    rightDescription: 'Softened, wrapped, contextual. Negative messages are delivered privately and subtly, surrounded by positives. Bluntness reads as disrespect.',
  },
  {
    id: 'leading', label: 'Leading',
    leftLabel: 'Egalitarian', rightLabel: 'Hierarchical',
    description: 'How power and authority flow through the team.',
    leftDescription: 'Distance between leader and team is low. The best leader is a facilitator among equals. Structure is flat. Communication skips levels freely.',
    rightDescription: 'Status matters. Distance between leader and team is high. Structure is multilayered and fixed. Communication follows the chain of command.',
  },
  {
    id: 'deciding', label: 'Deciding',
    leftLabel: 'Consensual', rightLabel: 'Top-down',
    description: 'How decisions are made and committed to.',
    leftDescription: 'Decisions emerge from group discussion until everyone agrees. Slow to decide, fast to execute, rarely revisited.',
    rightDescription: 'Decisions are made by individuals (usually the leader). Fast to decide, easily revisited and changed if needed.',
  },
  {
    id: 'trusting', label: 'Trusting',
    leftLabel: 'Task-based', rightLabel: 'Relationship-based',
    description: 'How trust is built and maintained.',
    leftDescription: 'Trust is built through work — reliability, delivery, competence. Easy to pick up and drop with each task. You trust because the work shows.',
    rightDescription: 'Trust is built through personal connection — meals, stories, shared experience. Slower to build, more durable once built.',
  },
  {
    id: 'disagreeing', label: 'Disagreeing',
    leftLabel: 'Confrontational', rightLabel: 'Avoids confrontation',
    description: 'Whether open disagreement is appropriate.',
    leftDescription: 'Open disagreement is appropriate and healthy. Debate sharpens ideas. Disagreement does not damage relationships — it strengthens them.',
    rightDescription: 'Open disagreement damages relationships or group harmony. Dissent is expressed through other means — silence, side channels, alternative proposals.',
  },
  {
    id: 'scheduling', label: 'Scheduling',
    leftLabel: 'Linear-time', rightLabel: 'Flexible-time',
    description: 'How time and planning work in practice.',
    leftDescription: 'Time is managed strictly. Schedules are followed. Meetings start on time. One thing at a time. Punctuality is respect.',
    rightDescription: 'Time is approached fluidly. Plans shift mid-day. Many things happen in parallel. Interruptions are accepted as part of life.',
  },
];

const PRESETS = {
  'coding-agents': {
    title: 'Coding Agents — Workstyle Stereotypes',
    notes: 'Why these five: three flagship lab CLIs (Claude Code, Codex, Gemini CLI) plus two contrasting takes on the same problem — Cursor (AI inside the IDE) and pi.dev (minimal terminal harness you wire up yourself). Together they cover the workstyle spectrum from "thinking partner" to "build your own".',
    items: [
      {
        name: 'Claude Code',
        icon: '🟠',
        positions: { communicating: 70, evaluating: 60, leading: 30, deciding: 35, trusting: 60, disagreeing: 50, scheduling: 30 },
        note: 'Explains itself. Polite, asks before destructive ops. Takes "yes, proceed" as a contract. Best when you want a thinking partner, not just a tool.',
      },
      {
        name: 'Codex',
        icon: '⚫',
        positions: { communicating: 35, evaluating: 25, leading: 55, deciding: 70, trusting: 35, disagreeing: 25, scheduling: 45 },
        note: 'Direct, terse, just does it. Less hedging, less explaining — closer to "task in, diff out". Best when you know what you want and you do not want a conversation.',
      },
      {
        name: 'Gemini CLI',
        icon: '🔵',
        positions: { communicating: 55, evaluating: 65, leading: 55, deciding: 60, trusting: 50, disagreeing: 65, scheduling: 60 },
        note: 'Middle-ground voice. Longer responses, softens disagreements, tends to propose alternatives. Best when you want options, not a single opinionated path.',
      },
      {
        name: 'Cursor',
        icon: '⌨',
        positions: { communicating: 65, evaluating: 50, leading: 45, deciding: 45, trusting: 60, disagreeing: 60, scheduling: 60 },
        note: 'AI-first IDE. Lives where you live, sees what you see — open files, recent edits, your highlights. Agreeable, ambient, fast. Best when you want AI woven into the editor, not a separate conversation.',
      },
      {
        name: 'pi.dev',
        icon: 'π',
        positions: { communicating: 25, evaluating: 25, leading: 15, deciding: 20, trusting: 30, disagreeing: 30, scheduling: 50 },
        note: 'Minimal terminal harness. Ships with primitives, not features — you wire it up to fit your workflow. Multi-provider by design. Best when you want to build your own agent, not use someone else\'s.',
      },
    ],
  },

  'python-frameworks': {
    title: 'Python Backend Frameworks — Workstyle Stereotypes',
    notes: 'Why these three: FastAPI, Django and Flask are the three most-used Python web frameworks, anchored at very different points on the convention-vs-control axis. Comparing them clarifies what tradeoffs you are actually choosing.',
    items: [
      {
        name: 'FastAPI',
        icon: '⚡',
        positions: { communicating: 50, evaluating: 35, leading: 35, deciding: 35, trusting: 40, disagreeing: 40, scheduling: 65 },
        note: 'Modern, async-first, opinionated about types but flexible about everything else. Trusts your annotations as contracts. Best when you want speed and type safety without framework lock-in.',
      },
      {
        name: 'Django',
        icon: '🟢',
        positions: { communicating: 75, evaluating: 65, leading: 75, deciding: 82, trusting: 65, disagreeing: 70, scheduling: 25 },
        note: 'Batteries-included, opinionated, conventional. There is a "Django way" for almost everything — follow it and you ship fast, fight it and you suffer. Best when you want a full stack out of the box.',
      },
      {
        name: 'Flask',
        icon: '🧪',
        positions: { communicating: 22, evaluating: 30, leading: 22, deciding: 22, trusting: 30, disagreeing: 28, scheduling: 35 },
        note: 'Minimalist, explicit, do-it-yourself. No opinions about structure — you pick the ORM, the auth, the templating. Best when you want a clean canvas and full control.',
      },
    ],
  },

  'programming-languages': {
    title: 'Programming Languages — Workstyle Stereotypes',
    notes: 'Why these five: Python, JavaScript and Rust set the corners — friendly/forgiving, permissive/chaotic, strict/explicit. C and Java add depth: C is raw and unforgiving, Java is verbose and ceremonial. Together they trace the spectrum of how a language treats you.',
    items: [
      {
        name: 'Python',
        icon: '🐍',
        positions: { communicating: 65, evaluating: 55, leading: 45, deciding: 40, trusting: 55, disagreeing: 55, scheduling: 50 },
        note: 'Friendly, conventional, "we are all adults here". The Pythonic way matters but is not enforced — your code is judged on readability and idioms, not on types.',
      },
      {
        name: 'JavaScript',
        icon: '🟨',
        positions: { communicating: 20, evaluating: 30, leading: 15, deciding: 20, trusting: 25, disagreeing: 28, scheduling: 80 },
        note: 'Maximum flexibility, minimum enforcement. Write a callback, write a class, write nothing structured at all — the runtime takes everything. Pays you back at debug time.',
      },
      {
        name: 'Rust',
        icon: '🦀',
        positions: { communicating: 30, evaluating: 12, leading: 78, deciding: 85, trusting: 25, disagreeing: 18, scheduling: 35 },
        note: 'The compiler is the senior engineer. Will not let you ship until you have proved memory safety. Brutal feedback up front, calm runtime after. Demands explicit thinking.',
      },
      {
        name: 'C',
        icon: '⚙',
        positions: { communicating: 15, evaluating: 8, leading: 35, deciding: 30, trusting: 18, disagreeing: 12, scheduling: 22 },
        note: 'Raw, explicit, unforgiving. No abstractions, no garbage collector, no safety net. Your code is exactly what the CPU runs. Brilliant if you respect it, brutal if you do not.',
      },
      {
        name: 'Java',
        icon: '☕',
        positions: { communicating: 75, evaluating: 50, leading: 80, deciding: 75, trusting: 60, disagreeing: 75, scheduling: 40 },
        note: 'Verbose, structured, ceremonial. Everything has a place, a class, a pattern. Slow to change but extremely stable — code from 1998 still runs. Enterprise-friendly to a fault.',
      },
    ],
  },

  'naruto': {
    title: 'Naruto — Workstyle Stereotypes',
    notes: 'Why these five: Team 7 (Naruto, Sasuke, Sakura) covers the original cadet trio — three sharply different but well-intentioned workstyles. Orochimaru and Danzo add the antagonist register: schemers who operate from the shadows, decide for everyone, and treat trust as a tool.',
    items: [
      {
        name: 'Naruto',
        icon: '🦊',
        positions: { communicating: 22, evaluating: 12, leading: 25, deciding: 35, trusting: 88, disagreeing: 8, scheduling: 75 },
        note: 'Loud, blunt, gut-driven. Confronts everything head-on. Relationship-first — decisions follow bonds, not plans.',
      },
      {
        name: 'Sasuke',
        icon: '⚡',
        positions: { communicating: 18, evaluating: 22, leading: 75, deciding: 88, trusting: 32, disagreeing: 18, scheduling: 50 },
        note: 'Solitary, top-down, task-first. Direct but rarely elaborates. Will confront, will not debate. Comfortable making the call alone.',
      },
      {
        name: 'Sakura',
        icon: '🌸',
        positions: { communicating: 52, evaluating: 42, leading: 42, deciding: 50, trusting: 68, disagreeing: 38, scheduling: 35 },
        note: 'The mediator. Reads context, balances feelings and task, plans before acting. Bridges the other two when they would not talk.',
      },
      {
        name: 'Orochimaru',
        icon: '🐍',
        positions: { communicating: 82, evaluating: 88, leading: 90, deciding: 88, trusting: 22, disagreeing: 78, scheduling: 55 },
        note: 'Schemer-in-chief. Long-term, indirect, transactional. Decisions are made in shadow and revealed only when irreversible. Trusts no one, uses everyone.',
      },
      {
        name: 'Danzo',
        icon: '🦅',
        positions: { communicating: 85, evaluating: 80, leading: 92, deciding: 95, trusting: 18, disagreeing: 82, scheduling: 28 },
        note: 'Hawkish pragmatist. Decides for "the village" without telling the village. Operates through covert structures, builds loyalty through obedience, treats compassion as a tactical liability.',
      },
    ],
  },

  'operating-systems': {
    title: 'Operating Systems — Workstyle Stereotypes',
    notes: 'Why these three: Linux, macOS and Windows are the three desktop OSes that matter — and they sit at three sharply different points on the curated-vs-DIY axis. Linux gives you primitives, macOS gives you decisions, Windows gives you compromise.',
    items: [
      {
        name: 'Linux',
        icon: '🐧',
        positions: { communicating: 15, evaluating: 12, leading: 20, deciding: 18, trusting: 30, disagreeing: 22, scheduling: 45 },
        note: 'DIY by default. The OS gives you a kernel and tools — you wire up the rest, your way. Everything is explicit, everything is configurable, nothing is decided for you. Brilliant if you want control, exhausting if you want defaults.',
      },
      {
        name: 'macOS',
        icon: '🍎',
        positions: { communicating: 80, evaluating: 75, leading: 80, deciding: 88, trusting: 65, disagreeing: 75, scheduling: 35 },
        note: 'Curated, opinionated, design-first. Apple has decided how things look, work and connect — follow the path and everything flows; step off it and friction hits hard. Best when you want defaults that are good.',
      },
      {
        name: 'Windows',
        icon: '🪟',
        positions: { communicating: 55, evaluating: 50, leading: 60, deciding: 55, trusting: 55, disagreeing: 60, scheduling: 60 },
        note: 'The compromise. Decades of accumulated conventions, broadest hardware support, both GUI and shell. Less opinionated than macOS, more curated than Linux. Best when you have to run everything for everyone.',
      },
    ],
  },

  'gaming-platforms': {
    title: 'Gaming Platforms — Workstyle Stereotypes',
    notes: 'Why these four: PC, PlayStation, Xbox and Nintendo Switch cover the gaming spectrum from total openness (PC) to total curation (Nintendo). Each platform\'s workstyle reflects a different bet on what gaming should be — a hobby you build, a cinematic product you consume, a service you subscribe to, or a present you unwrap.',
    items: [
      {
        name: 'PC',
        icon: '🖥',
        positions: { communicating: 18, evaluating: 25, leading: 18, deciding: 20, trusting: 35, disagreeing: 35, scheduling: 55 },
        note: 'Open, configurable, infinite. You pick the hardware, the OS, the storefront, the peripherals, the mods. Highest ceiling, highest setup cost. Best when you want everything — including the choice.',
      },
      {
        name: 'PlayStation',
        icon: '🎮',
        positions: { communicating: 75, evaluating: 65, leading: 75, deciding: 80, trusting: 65, disagreeing: 70, scheduling: 35 },
        note: 'Premium, cinematic, AAA-first. Sony decides what gaming should feel like, then polishes it relentlessly. Strong exclusives, closed ecosystem, predictable cycles. Best when you want curated AAA experiences.',
      },
      {
        name: 'Xbox',
        icon: '❎',
        positions: { communicating: 60, evaluating: 55, leading: 60, deciding: 60, trusting: 72, disagreeing: 65, scheduling: 68 },
        note: 'Service-first, ecosystem-driven. Microsoft pushes Game Pass, cross-PC play, and broad compatibility. Less curated than Sony, more open than nothing. Best when you want a library subscription and to play on both console and PC.',
      },
      {
        name: 'Nintendo Switch',
        icon: '🍄',
        positions: { communicating: 70, evaluating: 80, leading: 80, deciding: 85, trusting: 80, disagreeing: 88, scheduling: 70 },
        note: 'Family-first, exclusives-driven, hybrid. Nintendo refuses to compete on specs — competes on design, joy, and franchises everyone knows. Most closed of all platforms, most beloved. Best when you want games that feel like presents.',
      },
    ],
  },

  'enterprise-captains': {
    title: 'Enterprise Captains — Workstyle Stereotypes',
    notes: 'Why these four: Archer, Pike, Kirk and Picard are the four iconic captains of the Enterprise across the franchise — the pioneer, the mentor, the cowboy, the diplomat. Four people in the same chair, four sharply different workstyles. (Brief captaincies like Garrett, Decker, Jellico are omitted to keep the contrast sharp.)',
    items: [
      {
        name: 'Archer',
        icon: '🐕',
        positions: { communicating: 32, evaluating: 28, leading: 55, deciding: 50, trusting: 70, disagreeing: 28, scheduling: 60 },
        note: 'The pioneer. First captain to push warp 5 — had to invent the captaincy as he went, no protocol to lean on. Hot-tempered early, humanistic always. Decisions on instinct, often personal.',
      },
      {
        name: 'Pike',
        icon: '🎖',
        positions: { communicating: 58, evaluating: 55, leading: 55, deciding: 50, trusting: 72, disagreeing: 62, scheduling: 45 },
        note: 'The mentor. Calm, principled, considered. Listens to officers, cooks for the crew, leads by trust more than by rank. Avoids drama when he can, holds the line when he must.',
      },
      {
        name: 'Kirk',
        icon: '⚔',
        positions: { communicating: 28, evaluating: 30, leading: 65, deciding: 75, trusting: 60, disagreeing: 18, scheduling: 75 },
        note: 'The cowboy. Action-oriented, decisive, rule-breaker. Trusts his gut, improvises constantly, picks fights when needed. "I don\'t believe in the no-win scenario."',
      },
      {
        name: 'Picard',
        icon: '🍵',
        positions: { communicating: 80, evaluating: 75, leading: 70, deciding: 65, trusting: 55, disagreeing: 78, scheduling: 35 },
        note: 'The diplomat. Intellectual, principled, formal. Prefers negotiation to phasers, consults his senior officers, then says "make it so". Hierarchical bridge protocol with a humanist core.',
      },
    ],
  },

  'star-wars': {
    title: 'Star Wars — Workstyle Stereotypes',
    notes: 'Why these five: Anakin (the gifted but conflicted), Yoda (the patient master), Darth Vader (the enforcer Anakin became), Palpatine (the long-game schemer) and Leia (the rebel-born-royal). They cover the workstyle spectrum of the saga — from chaotic potential, to ancient wisdom, to ruthless enforcement, to manipulative authority, to direct rebellion.',
    items: [
      {
        name: 'Anakin Skywalker',
        icon: '🌪',
        positions: { communicating: 25, evaluating: 20, leading: 35, deciding: 65, trusting: 80, disagreeing: 12, scheduling: 65 },
        note: 'Gifted, hot-headed, conflicted. Says exactly what he feels, often badly. Decisions driven by attachment, not by Jedi discipline. Chafes at the Council, never backs down from a fight.',
      },
      {
        name: 'Yoda',
        icon: '🌿',
        positions: { communicating: 88, evaluating: 70, leading: 55, deciding: 35, trusting: 70, disagreeing: 65, scheduling: 30 },
        note: 'The master teacher. Speaks in riddles, lets students discover the answer themselves. Trusts time, demands discipline. Will fight when needed but prefers to teach.',
      },
      {
        name: 'Darth Vader',
        icon: '⚫',
        positions: { communicating: 65, evaluating: 20, leading: 92, deciding: 88, trusting: 25, disagreeing: 15, scheduling: 35 },
        note: 'The enforcer. Implements the Emperor\'s will with cold precision. No tolerance for incompetence — force-chokes the messengers. Hierarchical to the bone, conflicted underneath.',
      },
      {
        name: 'Palpatine',
        icon: '⚡',
        positions: { communicating: 92, evaluating: 88, leading: 95, deciding: 95, trusting: 18, disagreeing: 78, scheduling: 45 },
        note: 'Schemer-in-chief. Decades of planning, double-meanings in every sentence, allies as instruments. Decides for the galaxy and reveals only when irreversible. Trusts no one, uses everyone.',
      },
      {
        name: 'Princess Leia',
        icon: '👑',
        positions: { communicating: 30, evaluating: 25, leading: 50, deciding: 60, trusting: 65, disagreeing: 18, scheduling: 55 },
        note: 'Born royal, lives rebel. Direct, sharp-tongued, decisive. Calls out the Empire and Han Solo with the same edge. Egalitarian in cause, firm in command.',
      },
    ],
  },

  'attack-on-titan': {
    title: 'Attack on Titan — Workstyle Stereotypes',
    notes: 'Why these three: Eren, Levi and Armin are the original trio of the Survey Corps. Three sharply different workstyles forced to collaborate — Eren is the will, Levi is the blade, Armin is the brain. Adding more cadets dilutes the contrast.',
    items: [
      {
        name: 'Eren',
        icon: '🔥',
        positions: { communicating: 18, evaluating: 10, leading: 80, deciding: 92, trusting: 75, disagreeing: 5, scheduling: 60 },
        note: 'Gut-driven, loud, increasingly authoritarian. Decides for everyone, asks no permission, never backs down from a fight. Relationship-driven early, top-down by the end.',
      },
      {
        name: 'Levi',
        icon: '🗡',
        positions: { communicating: 25, evaluating: 15, leading: 60, deciding: 70, trusting: 35, disagreeing: 22, scheduling: 28 },
        note: 'Brutally direct, disciplined, task-based. Calls things by their name. Demands competence, respects results, has no patience for excuses.',
      },
      {
        name: 'Armin',
        icon: '📖',
        positions: { communicating: 70, evaluating: 70, leading: 35, deciding: 30, trusting: 65, disagreeing: 75, scheduling: 50 },
        note: 'The strategist. Thinks before acting, considers every angle, leads through ideas. Avoids direct confrontation, finds the third option no one saw.',
      },
    ],
  },
};
