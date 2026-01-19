# Cyberpunk 2079 Atlantix
A web-based character builder and combat calculator for a custom Cyberpunk tabletop RPG system.
This project is the next evolution of the original desktop calculator, rebuilt from the ground up with a modern web stack and a data-driven design philosophy.

Current Status: Sandbox Mode

Multiplayer, DM hosting, and persistence are planned but not yet implemented.

## Core principles:

**Sandbox First**
- Let players experiment without friction. Rules enforcement is a mode, not a limitation.

**Data Over Logic**
- Game content lives in JSON. The engine validates and calculates — it does not dictate outcomes.

**Future-Proofing**
- Multiplayer, respecs, and balance changes should not require rewrites.


If a designer can add new content without touching TypeScript, the system is working as intended.

## Tech Stack
**Frontend:** React + TypeScript

**State Management:** Local state (sandbox), designed for future sync

**Styling:** CSS / utility-based styling

**Data:** JSON-driven game definitions

**Build Tooling:** Vite

(Backend, auth, and persistence are intentionally deferred.)

## Getting started
``` bash
git clone https://github.com/Francisc0Leyva/cyberpunk-rpg-engine.git
cd cyberpunk-rpg-web
npm install
npm run dev
```
