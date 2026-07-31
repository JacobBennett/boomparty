# Bomberman

A multiplayer, browser-based Bomberman built with [Phaser 3](https://phaser.io/), [Node.js](https://nodejs.org/), [Express](http://expressjs.com/), and [Socket.io](https://socket.io/).

This is a rebuild of a game that once ran as part of a hosted service and was shut down. Its behavior, art, and protocol were reconstructed from extracted client artifacts and ported onto this codebase (a fork of [DmytroVasin/bomber](https://github.com/DmytroVasin/bomber), later maintained by [brag00n](https://github.com/brag00n/bomber)).

## How it plays

- No menus: type your name once and you're in the matchmaking queue. When a second player joins (or you click **Start without waiting** for a solo game), a short countdown shows the lineup — you **vs** your opponents — then the round starts.
- Up to 6 players (hot map) or 4 (cold map); the map is chosen by the server. Players appear as circular avatars with name tags.
- Drop bombs (spacebar, or the on-screen fire button on touch devices) to blast crates and opponents. You can walk off a bomb you just planted, but never back onto one. Last player standing wins.
- Breaking a crate has a 50% chance to drop an upgrade, each stacking +1 with no cap:
  - **Speed** — move faster
  - **Power** — longer blast reach
  - **+1 Bomb** — one more bomb down at the same time
- Rounds have a 3-minute timer: if it runs out, nobody wins.
- Join while a round is running and you'll **observe** the game live, then play the next one.
- Movement: arrow keys (diagonals allowed) or the virtual joystick on touch devices.

**Multiplayer testing tip:** open the game in two separate browser *windows*, not tabs — hidden tabs throttle the game loop to ~1 fps.

## Run it locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000). That's it — there is no build step; the client runs as native ES modules served straight by Express, and Phaser is served from `node_modules`.

Set `PORT` to change the port: `PORT=8080 npm start`.

### Docker

```bash
docker build -t bomberman .
docker run -d --name bomberman -p 3000:3000 --restart=always bomberman
```

## Host it on the web

The app is a single Node process serving both the static client and the websocket server, so any host that runs Node and supports WebSockets works.

### Option 1: Render.com (easiest)

1. Push this repo to GitHub.
2. On [render.com](https://render.com), create a **Web Service** → connect the repo.
3. Settings: Runtime **Node**, Build command `npm install`, Start command `npm start`. The free instance type is fine to start.
4. Deploy. Render sets `PORT` automatically (the server reads it) and supports WebSockets out of the box.

Your game will be live at `https://<your-service>.onrender.com`. Note the free tier spins down after inactivity — the first visit after a quiet period takes ~30s to wake.

Railway and Fly.io work the same way (Node app, `npm start`, WebSockets supported by default).

### Option 2: A VPS with Docker

On any small VPS (DigitalOcean, Hetzner, Lightsail…):

```bash
git clone <your-repo-url> bomberman
cd bomberman
docker build -t bomberman .
docker run -d --name bomberman -p 80:3000 --restart=always bomberman
```

The game is then live on `http://<server-ip>`. To put it behind nginx with a domain and TLS, WebSocket upgrades must be forwarded:

```nginx
server {
  listen 80;
  server_name bomber.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

Then add TLS with `certbot --nginx`.

## Project layout

```
server/
  app.js          Express + Socket.io bootstrap
  matchmaking.js  Queue, countdown, rounds, observers, win/timer logic
  constants.js    Server-side tuning (fuse time, spoil chance, round length…)
  entity/         Game, Player, Bomb (blast raycast), Spoil
client/
  index.html      Loads Phaser, socket.io, and js/app.js as an ES module
  js/states/      Boot → Preload → Lobby → Play → Win scenes
  js/entities/    Player, enemies, bombs, blasts, spoils, bones, HUD
  js/helpers/     UI elements, circular-avatar masking, sound, joystick
  maps/           Two Tiled JSON maps (28×18 @ 32px) + tileset
  images/, sound/ Art and audio assets
```

Gameplay is server-authoritative: bomb fuses, blast shapes, spoil drops/pickups, win conditions, and the round timer all resolve on the server; clients render what they're told. The map ships to clients inside the game-start payload, so the server's collision matrix and the client's rendering always agree.

## Debugging

- Client: the Phaser game instance is exposed as `window.game` in the browser console.
- Server: `node --inspect server/app.js`, then open `chrome://inspect/#devices`.
- A headless second player is easy to script with `socket.io-client` (dev dependency): connect to the server, emit `enter-game { name }`, and drive the events from there.

## Credits & licenses

- Original game and [tutorial](tutorial.md) by [Dmytro Vasin](https://github.com/DmytroVasin/bomber) (MIT). Note the tutorial describes the Phaser 2 version — the architecture still applies, the API calls don't.
- Phaser 3 migration, Docker setup, sound, and joystick work by [brag00n](https://github.com/brag00n/bomber).
- Music: "Techno-Randomness_Looping", "Happy-Trancin", "Electric-Rain_Looping" and sound effects by Eric Matyas ([soundimage.org](https://soundimage.org)), used under the Soundimage license; "TownTheme" ([opengameart.org](https://opengameart.org/content/town-theme-rpg)) under CC0 1.0.
