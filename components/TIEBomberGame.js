import { useEffect, useRef } from "react";

const COLS = 72;
const ROWS = 29;
const GAME_ROWS = 26;
const FPS = 20;
const FRAME_MS = 1000 / FPS;

const PLAYER_W = 9;
const PLAYER_H = 2;
const PLAYER_Y = GAME_ROWS - PLAYER_H - 1;

const PLAYER_ART = [
  "(o)[#](o)",
  "   |||   ",
];

const C = {
  red:    "#f55",
  blue:   "#48f",
  gold:   "#fa0",
  cyan:   "#0ff",
  yellow: "#ff0",
  white:  "#fff",
  orange: "#f80",
  dim:    "#555",
};

const ENEMIES = {
  xwing: { art: ["\\-X-/", " |^| "], w: 5, h: 2, score: 10, speed: 0.12, fireRate: 70, color: C.red },
  ywing: { art: ["--[Y]--", "|=| |=|"], w: 7, h: 2, score: 25, speed: 0.08, fireRate: 55, color: C.gold, missileRate: 180 },
  awing: { art: ["/A\\", "|||"], w: 3, h: 2, score: 15, speed: 0.22, fireRate: 90, color: C.blue },
};

const SPAWN_POOL = ["xwing", "xwing", "xwing", "ywing", "ywing", "awing"];

const WAVE_MESSAGES = [
  "INCOMING WAVE OF REBELS!",
  "MORE REBEL SCUM APPROACHES!",
  "DEFEND THE EMPIRE!",
  "THE REBELLION PRESSES FORWARD!",
  "SQUAD OF REBELS INBOUND!",
  "NO MERCY FOR THE ALLIANCE!",
  "REBEL FIGHTERS DETECTED!",
  "PROTECT THE EMPEROR'S HAMMER!",
];

function createGrid() {
  const chars  = Array.from({ length: ROWS }, () => Array(COLS).fill(" "));
  const colors = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  return { chars, colors };
}

function drawSprite(chars, colors, art, x, y, color) {
  art.forEach((row, dy) => {
    const gy = Math.floor(y) + dy;
    if (gy < 0 || gy >= ROWS) return;
    [...row].forEach((ch, dx) => {
      const gx = x + dx;
      if (gx >= 0 && gx < COLS) { chars[gy][gx] = ch; colors[gy][gx] = color; }
    });
  });
}

function setCell(chars, colors, x, y, ch, color) {
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) { chars[y][x] = ch; colors[y][x] = color; }
}

function writeText(chars, colors, text, x, y, color) {
  if (y < 0 || y >= ROWS) return;
  [...text].forEach((ch, i) => {
    const gx = x + i;
    if (gx < COLS) { chars[y][gx] = ch; colors[y][gx] = color; }
  });
}

function centerText(chars, colors, text, y, color) {
  writeText(chars, colors, text, Math.max(0, Math.floor((COLS - text.length) / 2)), y, color);
}

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
function esc(ch) { return ESC_MAP[ch] || ch; }

function gridToHTML(chars, colors) {
  const rows = [];
  for (let y = 0; y < ROWS; y++) {
    let html = "", i = 0;
    while (i < COLS) {
      const col = colors[y][i];
      let text = "";
      if (!col) {
        while (i < COLS && !colors[y][i]) { text += esc(chars[y][i]); i++; }
        html += text;
      } else {
        while (i < COLS && colors[y][i] === col) { text += esc(chars[y][i]); i++; }
        html += '<span style="color:' + col + '">' + text + "</span>";
      }
    }
    rows.push(html);
  }
  return rows.join("\n");
}

export default function TIEBomberGame({ pilotName, onGameOver }) {
  const preRef        = useRef(null);
  const stateRef      = useRef(null);
  const rafRef        = useRef(null);
  const lastTimeRef   = useRef(0);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  useEffect(() => {
    stateRef.current = {
      playerX: Math.floor(COLS / 2) - Math.floor(PLAYER_W / 2),
      bullets: [], enemyBullets: [], enemyMissiles: [],
      enemies: [], powerups: [],
      score: 0, lives: 3, tick: 0, spawnTimer: 10, invincible: 0, gameOver: false,
      keys: { left: false, right: false, space: false, enter: false },
      spaceFired: false, enterFired: false,
      missileLoaded: false, missile: null, explosion: null,
      message: "", messageTimer: 0, waveMessageCooldown: 0, waveIndex: 0,
      prevLives: 3, scoreFlash: null,
    };

    const setMsg   = (s, t, d = 70) => { s.message = t; s.messageTimer = d; };
    const flashScr = (s, gained)    => { s.scoreFlash = { color: gained ? C.white : C.red, timer: 10 }; };

    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (!s || s.gameOver) return;
      if (e.key === "ArrowLeft")  { s.keys.left  = true; e.preventDefault(); }
      if (e.key === "ArrowRight") { s.keys.right = true; e.preventDefault(); }
      if (e.key === " " || e.key === "ArrowUp") { s.keys.space = true; e.preventDefault(); }
      if (e.key === "Enter") { s.keys.enter = true; e.preventDefault(); }
    };
    const handleKeyUp = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === "ArrowLeft")  s.keys.left  = false;
      if (e.key === "ArrowRight") s.keys.right = false;
      if (e.key === " " || e.key === "ArrowUp") { s.keys.space = false; s.spaceFired = false; }
      if (e.key === "Enter") { s.keys.enter = false; s.enterFired = false; }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup",   handleKeyUp);

    function render() {
      const s = stateRef.current;
      if (!preRef.current) return;
      const { chars, colors } = createGrid();

      if (s.invincible === 0 || s.tick % 4 < 2) {
        drawSprite(chars, colors, PLAYER_ART, s.playerX, PLAYER_Y, null);
      }

      s.bullets.forEach(b => {
        setCell(chars, colors, b.x, b.y, "|", C.green);
      });

      if (s.missile) {
        const mx = s.missile.x, my = Math.floor(s.missile.y);
        if (my >= 0 && my < GAME_ROWS) {
          setCell(chars, colors, mx - 1, my,     "[", C.cyan);
          setCell(chars, colors, mx,     my,     "M", C.cyan);
          setCell(chars, colors, mx + 1, my,     "]", C.cyan);
          setCell(chars, colors, mx,     my + 1, "|", C.cyan);
        }
      }

      s.powerups.forEach(p => {
        const py = Math.floor(p.y);
        if (py >= 0 && py < GAME_ROWS) {
          if (p.kind === "shield") {
            setCell(chars, colors, p.x - 1, py, "[", C.white);
            setCell(chars, colors, p.x,     py, "+", C.white);
            setCell(chars, colors, p.x + 1, py, "]", C.white);
          } else {
            setCell(chars, colors, p.x - 1, py, "(", C.yellow);
            setCell(chars, colors, p.x,     py, "M", C.yellow);
            setCell(chars, colors, p.x + 1, py, ")", C.yellow);
          }
        }
      });

      if (s.explosion && s.explosion.timer > 0) {
        const ex = s.explosion.x, ey = s.explosion.y;
        const ch = s.explosion.timer % 2 === 0 ? "*" : "#";
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -3; dx <= 3; dx++)
            setCell(chars, colors, ex + dx, ey + dy, ch, C.orange);
      }

      s.enemyBullets.forEach(b => {
        if (b.y >= 0 && b.y < GAME_ROWS) setCell(chars, colors, b.x, Math.floor(b.y), "|", C.red);
      });

      s.enemyMissiles.forEach(m => {
        const my = Math.floor(m.y);
        if (my >= 0 && my < GAME_ROWS) {
          setCell(chars, colors, m.x - 1, my, "{", C.yellow);
          setCell(chars, colors, m.x,     my, "*", C.yellow);
          setCell(chars, colors, m.x + 1, my, "}", C.yellow);
        }
      });

      s.enemies.forEach(e =>
        drawSprite(chars, colors, ENEMIES[e.type].art, e.x, e.y, ENEMIES[e.type].color)
      );

      if (s.messageTimer > 0)
        centerText(chars, colors, "\u2560 " + s.message + " \u2563", 2, C.yellow);

      for (let c = 0; c < COLS; c++) {
        chars[GAME_ROWS][c]  = "\u2550";
        colors[GAME_ROWS][c] = C.dim;
      }

      if (s.missileLoaded) {
        writeText(chars, colors, "[enter]", 61, GAME_ROWS + 1, C.cyan);
      }

      const displayName = pilotName.length > 18 ? pilotName.slice(0, 18) : pilotName;
      const scoreStr    = String(Math.max(0, s.score)).padStart(6, "0");
      const livesStr    = "\u2665".repeat(Math.max(0, s.lives));
      const mslState    = s.missileLoaded ? "[READY]" : "[-----]";
      const mslColor    = s.missileLoaded ? C.cyan : C.dim;
      const scoreColor  = s.scoreFlash && s.scoreFlash.timer > 0 ? s.scoreFlash.color : null;

      writeText(chars, colors, ("PILOT: " + displayName).padEnd(26), 0,  GAME_ROWS + 2, null);
      writeText(chars, colors, ("SCORE: " + scoreStr).padEnd(18),     26, GAME_ROWS + 2, scoreColor);
      writeText(chars, colors, ("LIVES: " + livesStr).padEnd(12),     44, GAME_ROWS + 2, null);
      writeText(chars, colors, "MSL: ",                               56, GAME_ROWS + 2, null);
      writeText(chars, colors, mslState,                               61, GAME_ROWS + 2, mslColor);

      preRef.current.innerHTML = gridToHTML(chars, colors);
    }

    function tick() {
      const s = stateRef.current;
      if (!s || s.gameOver) return;
      s.tick++;

      if (s.invincible > 0) s.invincible--;
      if (s.messageTimer > 0) s.messageTimer--;
      if (s.waveMessageCooldown > 0) s.waveMessageCooldown--;
      if (s.explosion && s.explosion.timer > 0) s.explosion.timer--;
      if (s.scoreFlash && s.scoreFlash.timer > 0) s.scoreFlash.timer--;

      if (s.keys.left)  s.playerX = Math.max(0, s.playerX - 2);
      if (s.keys.right) s.playerX = Math.min(COLS - PLAYER_W, s.playerX + 2);

      if (s.keys.space && !s.spaceFired) {
        s.spaceFired = true;
        s.bullets.push({ x: s.playerX + 3, y: PLAYER_Y - 1 });
        s.bullets.push({ x: s.playerX + 5, y: PLAYER_Y - 1 });
      }

      if (s.keys.enter && !s.enterFired && s.missileLoaded && !s.missile) {
        s.enterFired    = true;
        s.missileLoaded = false;
        s.missile       = { x: s.playerX + 4, y: PLAYER_Y - 1 };
      }

      s.bullets       = s.bullets.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y >= 0);
      if (s.missile) {
        s.missile = { ...s.missile, y: s.missile.y - 1 };
        if (s.missile.y < 0) s.missile = null;
      }
      s.enemyBullets  = s.enemyBullets.map(b  => ({ ...b, y: b.y + 1   })).filter(b  => b.y < GAME_ROWS);
      s.enemyMissiles = s.enemyMissiles.map(m => ({ ...m, y: m.y + 0.7 })).filter(m  => m.y < GAME_ROWS);
      s.powerups      = s.powerups.map(p      => ({ ...p, y: p.y + 0.08})).filter(p  => p.y < GAME_ROWS);

      s.powerups = s.powerups.filter(p => {
        const py = Math.floor(p.y);
        if (p.x + 1 >= s.playerX && p.x - 1 < s.playerX + PLAYER_W
            && py >= PLAYER_Y && py < PLAYER_Y + PLAYER_H) {
          if (p.kind === "shield") {
            s.lives = Math.min(s.lives + 1, 5);
            s.prevLives = s.lives;
            setMsg(s, "SHIELDS RESTORED!");
          } else {
            s.missileLoaded = true;
            setMsg(s, "TORPEDO LOADED!");
          }
          return false;
        }
        return true;
      });

      const speedMult = 1 + s.score / 300;
      s.enemies.forEach(e => {
        const info = ENEMIES[e.type];
        e.y += info.speed * speedMult;
        e.fireTimer--;
        if (e.fireTimer <= 0) {
          const base = info.fireRate;
          e.fireTimer = Math.floor(base * 0.5 + Math.random() * base);
          s.enemyBullets.push({ x: e.x + Math.floor(info.w / 2), y: Math.floor(e.y) + info.h });
        }
        if (e.type === "ywing") {
          if (e.missileTimer === undefined)
            e.missileTimer = 60 + Math.floor(Math.random() * info.missileRate);
          e.missileTimer--;
          if (e.missileTimer <= 0) {
            e.missileTimer = Math.floor(info.missileRate * 0.7 + Math.random() * info.missileRate);
            s.enemyMissiles.push({ x: e.x + Math.floor(info.w / 2), y: Math.floor(e.y) + info.h });
          }
        }
      });

      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        const interval = Math.max(8, 30 - Math.floor(s.score / 60));
        s.spawnTimer   = interval + Math.floor(Math.random() * 10);
        const batchSize = Math.min(4, 2 + Math.floor(s.score / 150));
        for (let b = 0; b < batchSize; b++) {
          const type = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
          const info = ENEMIES[type];
          s.enemies.push({
            x: 1 + Math.floor(Math.random() * (COLS - info.w - 1)),
            y: -(info.h + b * 3), type,
            fireTimer: 30 + Math.floor(Math.random() * info.fireRate),
          });
        }
        if (s.waveMessageCooldown <= 0) {
          setMsg(s, WAVE_MESSAGES[s.waveIndex % WAVE_MESSAGES.length]);
          s.waveIndex++;
          s.waveMessageCooldown = 180;
        }
      }

      const destroyedEnemies = new Set(), usedBullets = new Set();
      s.bullets.forEach((b, bi) => {
        s.enemies.forEach((e, ei) => {
          if (destroyedEnemies.has(ei) || usedBullets.has(bi)) return;
          const info = ENEMIES[e.type], ey = Math.floor(e.y);
          if (b.x >= e.x && b.x < e.x + info.w && b.y >= ey && b.y < ey + info.h) {
            destroyedEnemies.add(ei);
            usedBullets.add(bi);
            s.score += info.score;
            flashScr(s, true);
          }
        });
      });

      if (destroyedEnemies.size > 0) {
        [...destroyedEnemies].forEach(ei => {
          const e = s.enemies[ei];
          if (!e || s.powerups.length >= 3) return;
          const roll = Math.random();
          if (roll < 0.02) {
            s.powerups.push({
              kind: "shield",
              x: Math.max(1, Math.min(COLS - 2, e.x + Math.floor(ENEMIES[e.type].w / 2))),
              y: Math.max(0, Math.floor(e.y)),
            });
          } else if (roll < 0.12) {
            s.powerups.push({
              kind: "missile",
              x: Math.max(1, Math.min(COLS - 2, e.x + Math.floor(ENEMIES[e.type].w / 2))),
              y: Math.max(0, Math.floor(e.y)),
            });
          }
        });
      }
      s.bullets = s.bullets.filter((_, bi) => !usedBullets.has(bi));
      s.enemies = s.enemies.filter((_, ei) => !destroyedEnemies.has(ei));

      // Player bullets intercept enemy missiles
      const interceptedMissiles = new Set(), interceptBullets = new Set();
      s.bullets.forEach((b, bi) => {
        s.enemyMissiles.forEach((m, mi) => {
          if (interceptedMissiles.has(mi) || interceptBullets.has(bi)) return;
          const my = Math.floor(m.y);
          if (b.x >= m.x - 1 && b.x <= m.x + 1 && b.y >= my - 1 && b.y <= my + 1) {
            interceptedMissiles.add(mi);
            interceptBullets.add(bi);
            s.score += 10;
            flashScr(s, true);
            s.explosion = { x: m.x, y: my, timer: 4 };
          }
        });
      });
      s.bullets       = s.bullets.filter((_, bi) => !interceptBullets.has(bi));
      s.enemyMissiles = s.enemyMissiles.filter((_, mi) => !interceptedMissiles.has(mi));

      if (s.missile) {
        const mx = s.missile.x, my = Math.floor(s.missile.y);
        const hitAny = s.enemies.some(e => {
          const info = ENEMIES[e.type], ey = Math.floor(e.y);
          return mx >= e.x - 1 && mx <= e.x + info.w && my >= ey - 1 && my <= ey + info.h;
        });
        if (hitAny) {
          let blastScore = 0;
          s.enemies = s.enemies.filter(e => {
            const info = ENEMIES[e.type];
            const ec = e.x + Math.floor(info.w / 2), er = Math.floor(e.y) + Math.floor(info.h / 2);
            if (Math.abs(ec - mx) <= 3 && Math.abs(er - my) <= 3) { blastScore += info.score; return false; }
            return true;
          });
          s.score += blastScore;
          if (blastScore > 0) flashScr(s, true);
          s.explosion = { x: mx, y: my, timer: 5 };
          s.missile   = null;
        }
      }

      if (s.invincible === 0) {
        const hitEB = new Set();
        s.enemyBullets.forEach((b, i) => {
          if (hitEB.has(i)) return;
          if (b.x >= s.playerX && b.x < s.playerX + PLAYER_W
              && Math.floor(b.y) >= PLAYER_Y && Math.floor(b.y) < PLAYER_Y + PLAYER_H) {
            hitEB.add(i);
            s.lives--;
            s.invincible = 40;
          }
        });
        s.enemyBullets = s.enemyBullets.filter((_, i) => !hitEB.has(i));

        s.enemyMissiles = s.enemyMissiles.filter(m => {
          const my = Math.floor(m.y);
          if (m.x + 1 >= s.playerX && m.x - 1 < s.playerX + PLAYER_W
              && my >= PLAYER_Y && my < PLAYER_Y + PLAYER_H) {
            s.lives -= 2;
            s.invincible = 50;
            return false;
          }
          return true;
        });
      }

      s.enemies = s.enemies.filter(e => {
        const info = ENEMIES[e.type], ey = Math.floor(e.y);
        if (ey >= GAME_ROWS) {
          s.score = Math.max(0, s.score - 50);
          flashScr(s, false);
          return false;
        }
        if (s.invincible === 0
            && ey + info.h >= PLAYER_Y && ey < PLAYER_Y + PLAYER_H
            && e.x + info.w > s.playerX && e.x < s.playerX + PLAYER_W) {
          s.lives--;
          s.invincible = 40;
          return false;
        }
        return true;
      });

      if (s.lives < s.prevLives) {
        if (s.lives === 2)      setMsg(s, "SHIELDS DOWN!");
        else if (s.lives === 1) setMsg(s, "HULL DAMAGE! EJECT!");
        s.prevLives = s.lives;
      }

      if (s.lives <= 0) {
        s.gameOver = true;
        render();
        onGameOverRef.current(s.score);
        return;
      }
      render();
    }

    function loop(time) {
      if (time - lastTimeRef.current >= FRAME_MS) {
        lastTimeRef.current = time;
        tick();
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup",   handleKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "#000", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <pre ref={preRef} style={{
        color: "#0f0", backgroundColor: "#000",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: "14px", lineHeight: "1.4",
        margin: 0, padding: "0.5rem", userSelect: "none", letterSpacing: "0",
      }} />
      <div style={{
        color: "#555", fontSize: "11px", marginTop: "0.5rem",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      }}>
        &#8592; &#8594; move &nbsp;&nbsp; SPACE / UP: fire &nbsp;&nbsp; ENTER: torpedo
      </div>
    </div>
  );
}
