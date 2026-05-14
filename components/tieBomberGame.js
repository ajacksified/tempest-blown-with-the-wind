import { useEffect, useRef } from "react";
import styles from "./tieBomberGame.module.css";

// ── Grid ────────────────────────────────────────────────────────────────────
const COLS      = 72;
const ROWS      = 29;
const GAME_ROWS = 26;

// ── Timing ───────────────────────────────────────────────────────────────────
const FPS      = 20;
const FRAME_MS = 1000 / FPS;

// ── Player ───────────────────────────────────────────────────────────────────
const PLAYER_W         = 9;
const PLAYER_H         = 2;
const PLAYER_Y         = GAME_ROWS - PLAYER_H - 1;
const PLAYER_SPEED     = 2;   // cells/tick lateral movement
const PLAYER_LIVES     = 3;
const PLAYER_LIVES_MAX = 5;

const PLAYER_ART = [
  "(o)[#](o)",
  "   |||   ",
];

// ── Projectile speeds (cells/tick) ───────────────────────────────────────────
const BULLET_SPEED        = 2;
const PLAYER_MISSILE_SPEED = 1.5;
const ENEMY_BULLET_SPEED  = 1;
const ENEMY_MISSILE_SPEED = 0.7;
const POWERUP_DRIFT_SPEED = 0.2;

// ── Combat ───────────────────────────────────────────────────────────────────
const INVINCIBLE_TICKS_BULLET  = 40;
const INVINCIBLE_TICKS_MISSILE = 50;
const INVINCIBLE_TICKS_RAM     = 40;
const SCORE_PENALTY_MISSED     = 50;
const SCORE_MISSILE_INTERCEPT  = 10;
const ENEMY_MISSILE_DAMAGE     = 2;
const MISSILE_BLAST_RADIUS     = 3;

// ── Powerup spawn chances (cumulative roll thresholds) ───────────────────────
const POWERUP_MAX_ON_SCREEN  = 5;
const POWERUP_CHANCE_BOMB    = 0.01;
const POWERUP_CHANCE_SHIELD  = 0.05;
const POWERUP_CHANCE_MISSILE = 0.1;

// ── Difficulty scaling ───────────────────────────────────────────────────────
const SPEED_SCALE_DIVISOR   = 400;  // speedMult = 1 + score / SPEED_SCALE_DIVISOR
const SPAWN_INTERVAL_BASE   = 30;
const SPAWN_INTERVAL_MIN    = 8;
const SPAWN_INTERVAL_SCALE  = 60;   // interval shrinks 1 tick per N score
const SPAWN_INTERVAL_JITTER = 10;
const SPAWN_BATCH_BASE      = 1;
const SPAWN_BATCH_MAX       = 4;
const SPAWN_BATCH_SCALE     = 250;  // batch grows 1 per N score

// ── Timers (ticks) ───────────────────────────────────────────────────────────
const WAVE_COOLDOWN_TICKS    = 180;
const MSG_DEFAULT_TICKS      = 70;
const SCORE_FLASH_TICKS      = 6;
const EXPLOSION_TICKS        = 5;
const INTERCEPT_EXPLOSION_TICKS = 4;
const BOMB_EXPLOSION_TICKS   = 10;

const C = {
  red:     "#f55",
  blue:    "#48f",
  gold:    "#fa0",
  dimGold: "#a70",
  cyan:    "#0ff",
  yellow:  "#ff0",
  white:   "#fff",
  orange:  "#f80",
  magenta: "#f0f",
  dim:     "#555",
};

const ENEMIES = {
  xwing: { art: ["\/-X-\\", " |^| "], w: 5, h: 2, score: 50, speed: 0.10, fireRate: 70, color: C.red },
  ywing: { art: ["--[Y]--", "|=| |=|"], w: 7, h: 2, score: 75, speed: 0.06, fireRate: 55, color: C.gold, missileRate: 180 },
  awing: { art: ["\\A/", "|||"], w: 3, h: 2, score: 50, speed: 0.18, fireRate: 90, color: C.blue },
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
      score: 0, lives: PLAYER_LIVES, tick: 0, spawnTimer: 10, invincible: 0, gameOver: false,
      keys: { left: false, right: false, space: false, enter: false },
      spaceFired: false, enterFired: false,
      loadedItem: null, missile: null, explosion: null,
      message: "", messageTimer: 0, waveMessageCooldown: 0, waveIndex: 0,
      prevLives: PLAYER_LIVES, scoreFlash: null,
    };

    const setMsg   = (s, t, d = MSG_DEFAULT_TICKS) => { s.message = t; s.messageTimer = d; };
    const flashScr = (s, gained) => { s.scoreFlash = { color: gained ? C.white : C.red, timer: SCORE_FLASH_TICKS }; };

    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (!s || s.gameOver) return;
      if (e.key === "ArrowLeft"  || e.key === "a") { s.keys.left  = true; e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d") { s.keys.right = true; e.preventDefault(); }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") { s.keys.space = true; e.preventDefault(); }
      if (e.key === "Enter") { s.keys.enter = true; e.preventDefault(); }
    };
    const handleKeyUp = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === "ArrowLeft"  || e.key === "a") s.keys.left  = false;
      if (e.key === "ArrowRight" || e.key === "d") s.keys.right = false;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") { s.keys.space = false; s.spaceFired = false; }
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
            setCell(chars, colors, p.x - 1, py, "[", C.green);
            setCell(chars, colors, p.x,     py, "+", C.green);
            setCell(chars, colors, p.x + 1, py, "]", C.green);
          } else if (p.kind === "bomb") {
            setCell(chars, colors, p.x - 1, py, "{", C.green);
            setCell(chars, colors, p.x,     py, "B", C.green);
            setCell(chars, colors, p.x + 1, py, "}", C.green);
          } else {
            setCell(chars, colors, p.x - 1, py, "(", C.green);
            setCell(chars, colors, p.x,     py, "M", C.green);
            setCell(chars, colors, p.x + 1, py, ")", C.green);
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
        drawSprite(chars, colors, ENEMIES[e.type].art, e.x, e.y,
          e.type === "ywing" && e.hp === 1 ? C.dimGold : ENEMIES[e.type].color)
      );

      if (s.messageTimer > 0)
        centerText(chars, colors, "\u2560 " + s.message + " \u2563", 2, C.yellow);

      for (let c = 0; c < COLS; c++) {
        chars[GAME_ROWS][c]  = "\u2550";
        colors[GAME_ROWS][c] = C.dim;
      }

      if (s.loadedItem) {
        const hintColor = s.loadedItem === "bomb" ? C.magenta : C.cyan;
        writeText(chars, colors, "[enter]", 61, GAME_ROWS + 1, hintColor);
      }

      const displayName = pilotName.length > 18 ? pilotName.slice(0, 18) : pilotName;
      const scoreStr    = String(Math.max(0, s.score)).padStart(6, "0");
      const livesStr    = "\u2665".repeat(Math.max(0, s.lives));
      const mslState    = s.loadedItem === "bomb" ? "[BOMB ]" : s.loadedItem === "missile" ? "[READY]" : "[-----]";
      const mslColor    = s.loadedItem === "bomb" ? C.magenta : s.loadedItem === "missile" ? C.cyan : C.dim;
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

      if (s.keys.left)  s.playerX = Math.max(0, s.playerX - PLAYER_SPEED);
      if (s.keys.right) s.playerX = Math.min(COLS - PLAYER_W, s.playerX + PLAYER_SPEED);

      if (s.keys.space && !s.spaceFired) {
        s.spaceFired = true;
        s.bullets.push({ x: s.playerX + 3, y: PLAYER_Y - 1 });
        s.bullets.push({ x: s.playerX + 5, y: PLAYER_Y - 1 });
      }

      if (s.keys.enter && !s.enterFired && s.loadedItem && !s.missile) {
        s.enterFired = true;
        if (s.loadedItem === "missile") {
          s.loadedItem = null;
          s.missile    = { x: s.playerX + 4, y: PLAYER_Y - 1 };
        } else if (s.loadedItem === "bomb") {
          s.loadedItem = null;
          let bombScore = 0;
          s.enemies.forEach(e => { bombScore += ENEMIES[e.type].score; });
          s.enemies       = [];
          s.enemyBullets  = [];
          s.enemyMissiles = [];
          s.score += bombScore;
          if (bombScore > 0) flashScr(s, true);
          s.explosion = { x: Math.floor(COLS / 2), y: Math.floor(GAME_ROWS / 2), timer: BOMB_EXPLOSION_TICKS };
          setMsg(s, "SPACE BOMB DEPLOYED!");
        }
      }

      s.bullets       = s.bullets.map(b => ({ ...b, y: b.y - BULLET_SPEED })).filter(b => b.y >= 0);
      if (s.missile) {
        s.missile = { ...s.missile, y: s.missile.y - PLAYER_MISSILE_SPEED };
        if (s.missile.y < 0) s.missile = null;
      }
      s.enemyBullets  = s.enemyBullets.map(b  => ({ ...b, y: b.y + ENEMY_BULLET_SPEED  })).filter(b  => b.y < GAME_ROWS);
      s.enemyMissiles = s.enemyMissiles.map(m => ({ ...m, y: m.y + ENEMY_MISSILE_SPEED })).filter(m  => m.y < GAME_ROWS);
      s.powerups      = s.powerups.map(p      => ({ ...p, y: p.y + POWERUP_DRIFT_SPEED })).filter(p  => p.y < GAME_ROWS);

      s.powerups = s.powerups.filter(p => {
        const py = Math.floor(p.y);
        if (p.x + 1 >= s.playerX && p.x - 1 < s.playerX + PLAYER_W
            && py >= PLAYER_Y && py < PLAYER_Y + PLAYER_H) {
          if (p.kind === "shield") {
            s.lives = Math.min(s.lives + 1, PLAYER_LIVES_MAX);
            s.prevLives = s.lives;
            setMsg(s, "SHIELDS RESTORED!");
          } else if (p.kind === "bomb") {
            s.loadedItem = "bomb";
            setMsg(s, "SPACE BOMB LOADED!");
          } else {
            s.loadedItem = "missile";
            setMsg(s, "TORPEDO LOADED!");
          }
          return false;
        }
        return true;
      });

      const speedMult = 1 + s.score / SPEED_SCALE_DIVISOR;
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
        const interval  = Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - Math.floor(s.score / SPAWN_INTERVAL_SCALE));
        s.spawnTimer    = interval + Math.floor(Math.random() * SPAWN_INTERVAL_JITTER);
        const batchSize = Math.min(SPAWN_BATCH_MAX, SPAWN_BATCH_BASE + Math.floor(s.score / SPAWN_BATCH_SCALE));
        for (let b = 0; b < batchSize; b++) {
          const type = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
          const info = ENEMIES[type];
          s.enemies.push({
            x: 1 + Math.floor(Math.random() * (COLS - info.w - 1)),
            y: -(info.h + b * 3), type,
            hp: type === "ywing" ? 2 : 1,
            fireTimer: 30 + Math.floor(Math.random() * info.fireRate),
          });
        }
        if (s.waveMessageCooldown <= 0) {
          setMsg(s, WAVE_MESSAGES[s.waveIndex % WAVE_MESSAGES.length]);
          s.waveIndex++;
          s.waveMessageCooldown = WAVE_COOLDOWN_TICKS;
        }
      }

      const destroyedEnemies = new Set(), usedBullets = new Set();
      s.bullets.forEach((b, bi) => {
        s.enemies.forEach((e, ei) => {
          if (destroyedEnemies.has(ei) || usedBullets.has(bi)) return;
          const info = ENEMIES[e.type], ey = Math.floor(e.y);
          if (b.x >= e.x && b.x < e.x + info.w && b.y >= ey && b.y < ey + info.h) {
            usedBullets.add(bi);
            if (e.hp > 1) {
              e.hp--;
            } else {
              destroyedEnemies.add(ei);
              s.score += info.score;
              flashScr(s, true);
            }
          }
        });
      });

      if (destroyedEnemies.size > 0) {
        [...destroyedEnemies].forEach(ei => {
          const e = s.enemies[ei];
          if (!e || s.powerups.length >= POWERUP_MAX_ON_SCREEN) return;
          const roll = Math.random();
          if (roll < POWERUP_CHANCE_BOMB) {
            s.powerups.push({
              kind: "bomb",
              x: Math.max(1, Math.min(COLS - 2, e.x + Math.floor(ENEMIES[e.type].w / 2))),
              y: Math.max(0, Math.floor(e.y)),
            });
          } else if (roll < POWERUP_CHANCE_SHIELD) {
            s.powerups.push({
              kind: "shield",
              x: Math.max(1, Math.min(COLS - 2, e.x + Math.floor(ENEMIES[e.type].w / 2))),
              y: Math.max(0, Math.floor(e.y)),
            });
          } else if (roll < POWERUP_CHANCE_MISSILE) {
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
            s.score += SCORE_MISSILE_INTERCEPT;
            flashScr(s, true);
            s.explosion = { x: m.x, y: my, timer: INTERCEPT_EXPLOSION_TICKS };
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
            if (Math.abs(ec - mx) <= MISSILE_BLAST_RADIUS && Math.abs(er - my) <= MISSILE_BLAST_RADIUS) { blastScore += info.score; return false; }
            return true;
          });
          s.score += blastScore;
          if (blastScore > 0) flashScr(s, true);
          s.explosion = { x: mx, y: my, timer: EXPLOSION_TICKS };
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
            s.invincible = INVINCIBLE_TICKS_BULLET;
          }
        });
        s.enemyBullets = s.enemyBullets.filter((_, i) => !hitEB.has(i));

        s.enemyMissiles = s.enemyMissiles.filter(m => {
          const my = Math.floor(m.y);
          if (m.x + 1 >= s.playerX && m.x - 1 < s.playerX + PLAYER_W
              && my >= PLAYER_Y && my < PLAYER_Y + PLAYER_H) {
            s.lives -= ENEMY_MISSILE_DAMAGE;
            s.invincible = INVINCIBLE_TICKS_MISSILE;
            return false;
          }
          return true;
        });
      }

      s.enemies = s.enemies.filter(e => {
        const info = ENEMIES[e.type], ey = Math.floor(e.y);
        if (ey >= GAME_ROWS) {
          s.score = Math.max(0, s.score - SCORE_PENALTY_MISSED);
          flashScr(s, false);
          return false;
        }
        if (s.invincible === 0
            && ey + info.h >= PLAYER_Y && ey < PLAYER_Y + PLAYER_H
            && e.x + info.w > s.playerX && e.x < s.playerX + PLAYER_W) {
          s.lives--;
          s.invincible = INVINCIBLE_TICKS_RAM;
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
    <div className={styles.wrapper}>
      <pre ref={preRef} className={styles.screen} />
      <div className={styles.controls}>
        &#8592; &#8594; move &nbsp;&nbsp; SPACE / UP: fire &nbsp;&nbsp; ENTER: torpedo
      </div>
    </div>
  );
}
