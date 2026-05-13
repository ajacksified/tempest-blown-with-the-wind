import { useEffect, useRef, useCallback } from 'react';
import styles from './LightsaberGame.module.css';

// ════════════════════════════════════════════════════════════════════════════
// TUNING — all adjustable values live here
// ════════════════════════════════════════════════════════════════════════════

// ── Difficulty presets ───────────────────────────────────────────────────────
//  scrollSpeed    px/s notes travel down the lane
//  hitWindow      seconds around note centre that counts as a hit
//  density        fraction of notes kept (1 = all)
//  holdThresholdMs MIDI note must be longer than this (ms) to become a hold note
//  maxComboMult   ceiling for the combo multiplier
//  minLaneGapMs   soft minimum gap (ms) between consecutive notes in the same lane
const DIFFICULTY_CONFIG = {
  NOVICE: {
    scrollSpeed:      100,   // slow scroll — easy to read
    hitWindow:        0.130, // very forgiving timing window
    density:          0.05,  // only a quarter of MIDI notes shown
    holdThresholdMs:  2000,  // almost no hold notes (very long MIDI notes only)
    maxComboMult:     2,     // combo multiplier tops out at ×2
    minLaneGapMs:     1000,   // ~2 notes/sec per lane
  },
  KNIGHT: {
    scrollSpeed:      200,
    hitWindow:        0.100,
    density:          0.1,
    holdThresholdMs:  1000,
    maxComboMult:     4,
    minLaneGapMs:     500,   // ~8 notes/sec per lane
  },
  REGENT: {
    scrollSpeed:      300,
    hitWindow:        0.05,
    density:          0.2,
    holdThresholdMs:  250,
    maxComboMult:     8,
    minLaneGapMs:     250,    // ~16 notes/sec per lane
  },
};

// ── Chord limiting ────────────────────────────────────────────────────────────
const CHORD_WINDOW_MS  = 50;   // notes within this window are treated as one chord
const CHORD_MAX_LANES  = 3;    // maximum simultaneous lanes in one chord
// Notes between LANE_GAP_SOFT_FLOOR × minGap and minGap are kept probabilistically.
const LANE_GAP_SOFT_FLOOR = 0.6;

// ── Scoring ───────────────────────────────────────────────────────────────────
const SCORE_PERFECT          = 300;  // points for a perfect tap
const SCORE_GOOD             = 100;  // points for a good tap / completed hold
const PERFECT_WINDOW_FRAC    = 0.6;  // perfect if delta ≤ hitWindow × this
const HOLD_COMPLETE_GRACE    = 0.05; // seconds after hold end before auto-scoring
const HOLD_MIN_FRACTION      = 0.7;  // fraction of hold that must be held for GOOD on early release

// ── Combo multiplier thresholds ───────────────────────────────────────────────
const COMBO_THRESH_X2 = 10;
const COMBO_THRESH_X4 = 25;
const COMBO_THRESH_X8 = 50;

// ── Timing ────────────────────────────────────────────────────────────────────
const FEEDBACK_DISPLAY_MS = 600;  // how long hit feedback text stays on screen
const SONG_END_GRACE_SEC  = 2;    // seconds after last note before game-over triggers

// ── Layout ───────────────────────────────────────────────────────────────────
const NUM_LANES    = 4;
const CANVAS_W     = 560;
const CANVAS_H     = 720;
const LANE_W       = 80;
const LANE_GAP     = 20;
const LANES_TOTAL  = NUM_LANES * LANE_W + (NUM_LANES - 1) * LANE_GAP;
const LANES_LEFT   = (CANVAS_W - LANES_TOTAL) / 2;
const HIT_Y        = CANVAS_H - 100;  // y-centre of the hit zone
const HIT_ZONE_H   = 16;              // height of the hit zone band
const NOTE_W       = LANE_W - 10;     // width of a note rectangle
const NOTE_H       = 20;              // height of a tap note
const HOLD_CAP_H   = 14;              // height of the hold-note head cap
const NOTE_R       = 6;               // corner radius on notes

// ── Visual ────────────────────────────────────────────────────────────────────
const BG_COLOR              = '#040408';
const LANE_DIVIDER_COLOR    = '#1a1a1a';
const HUD_SCORE_COLOR       = '#ff0';
const HUD_COMBO_COLOR       = '#0ff';
const HUD_BEST_COLOR        = '#555';
const HUD_PILOT_COLOR       = '#0a0';
const HUD_DIFF_COLOR        = '#444';
const MISS_COLOR            = '#f44';
const PERFECT_COLOR         = '#ff0';
const GOOD_COLOR            = '#0f0';
const PAUSE_BG              = 'rgba(0,0,0,0.72)';
const PAUSE_TEXT_COLOR      = '#0f0';
const PAUSE_HINT_COLOR      = '#0a0';
const NOTE_GLOW_BLUR        = 14;    // px shadowBlur on tap notes
const HOLD_ACTIVE_BLUR      = 20;    // px shadowBlur on held notes
const HOLD_END_CAP_H        = 14;    // height of the hold-note tail (release) cap
const HIT_ACTIVE_BLUR       = 14;    // px shadowBlur on active hit-zone bar
const HIT_KEY_LABEL_BLUR    = 10;    // px shadowBlur on active key label
const FEEDBACK_RISE_PX      = 45;    // how far feedback text floats upward
const FEEDBACK_START_OFFSET = 55;    // initial y offset above hit zone
const ARROW_SPACING_PX      = 200;   // px between ghost-arrow repetitions in lane
const ARROW_GUIDE_ALPHA     = 0.10;  // opacity of scrolling ghost arrows
const ARROW_HEADER_ALPHA    = 0.22;  // opacity of static header arrow
const STAR_COUNT            = 90;
const STAR_MAX_R            = 1.5;
const STAR_MIN_R            = 0.3;
const STAR_MAX_ALPHA        = 0.65;
const STAR_MIN_ALPHA        = 0.15;

// ── Colours (stored as [r,g,b] so we can build valid rgba() strings) ──────────
// Using shorthand hex like '#4af' and appending alpha digits produces invalid
// color strings such as '#4afbb' that browsers reject.
const LANE_RGB    = [[68,170,255], [255,68,68], [68,255,68], [170,68,255]];
const LANE_COLORS = LANE_RGB.map(([r,g,b]) => `rgb(${r},${g},${b})`);
const LANE_DIM    = ['#0a1520', '#200808', '#081408', '#100820'];
const LANE_LABELS = ['←', '↓', '↑', '→'];

// ── Tone.js synth parameters ──────────────────────────────────────────────────
const SYNTH_OSCILLATOR  = 'sawtooth';
const SYNTH_ATTACK      = 0.005;
const SYNTH_DECAY       = 0.08;
const SYNTH_SUSTAIN     = 0.55;
const SYNTH_RELEASE     = 0.25;
const SYNTH_VOLUME_DB   = -12;
const REVERB_DECAY      = 1.0;
const REVERB_WET        = 0.2;

// ════════════════════════════════════════════════════════════════════════════
// Pure helpers
// ════════════════════════════════════════════════════════════════════════════

function laneRgba(lane, alpha) {
  const [r, g, b] = LANE_RGB[lane];
  return `rgba(${r},${g},${b},${alpha})`;
}

function comboMult(combo, maxMult) {
  const m = maxMult ?? 8;
  if (m >= 8 && combo >= COMBO_THRESH_X8) return 8;
  if (m >= 4 && combo >= COMBO_THRESH_X4) return 4;
  if (m >= 2 && combo >= COMBO_THRESH_X2) return 2;
  return 1;
}

function laneX(lane)                           { return LANES_LEFT + lane * (LANE_W + LANE_GAP); }
function noteHeadY(note, elapsed, scrollSpeed) { return HIT_Y - (note.time - elapsed) * scrollSpeed; }
function noteBodyH(note, scrollSpeed)          { return note.duration * scrollSpeed; }

function makeStars() {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H,
    r: Math.random() * (STAR_MAX_R - STAR_MIN_R) + STAR_MIN_R,
    a: Math.random() * (STAR_MAX_ALPHA - STAR_MIN_ALPHA) + STAR_MIN_ALPHA,
  }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function addFeedback(gs, lane, text, color, now) {
  gs.feedback = gs.feedback.filter(f => f.lane !== lane);
  gs.feedback.push({ lane, text, color, expiry: now + FEEDBACK_DISPLAY_MS });
}

// ════════════════════════════════════════════════════════════════════════════
// Note building
// ════════════════════════════════════════════════════════════════════════════

function buildNotes(rawNotes, { density, holdThresholdMs, minLaneGapMs }) {
  // 1. Density pass — thin out the note stream
  const densityPass = density >= 1
    ? rawNotes
    : rawNotes.filter((_, i) => i % 2 === 0 || Math.random() < density);

  // 2. Assign lanes so we can do per-lane filtering
  const withLanes = densityPass.map(n => ({ ...n, lane: n.midi % NUM_LANES }));

  // 3. Per-lane gap pass — enforce a soft minimum gap per lane.
  //    Notes that violate the gap are dropped; notes near the boundary are
  //    kept with a probability proportional to how close they are to passing,
  //    so the rhythm breathes with the music rather than cutting off rigidly.
  const lastLaneTime = new Array(NUM_LANES).fill(0);
  const gapSec = minLaneGapMs / 1000;

  const gapPass = withLanes.filter(n => {
    const gap   = n.time - lastLaneTime[n.lane];
    const ratio = gap / gapSec;
    if (ratio >= 1) {
      lastLaneTime[n.lane] = n.time;
      return true;
    }
    if (ratio > LANE_GAP_SOFT_FLOOR && Math.random() < ratio) {
      lastLaneTime[n.lane] = n.time;
      return true;
    }
    return false;
  });

  // 4. Build final note objects
  const builtNotes = gapPass.map(n => ({
    midi:     n.midi,
    time:     n.time,
    duration: n.duration,
    lane:     n.lane,
    isHold:   n.duration * 1000 > holdThresholdMs,
    hit:      false,
    holdOk:   false,
    holding:  false,
    released: false,
    scored:   false,
  }));

  // 5. Remove notes whose time falls inside an active hold on the same lane.
  //    This prevents tap notes (or short holds) from appearing in the middle
  //    of a hold bar, which would confuse the player.
  const holdWindows = builtNotes
    .filter(n => n.isHold)
    .map(n => ({ lane: n.lane, start: n.time, end: n.time + n.duration }));

  const noOverlapNotes = builtNotes.filter(n => {
    if (n.isHold) return true;   // hold notes are never culled by this pass
    return !holdWindows.some(
      hw => hw.lane === n.lane && n.time > hw.start && n.time < hw.end
    );
  });

  // 6. Chord-limit pass — cap simultaneous notes to CHORD_MAX_LANES.
  //    Notes are grouped by proximity (within CHORD_WINDOW_MS). When a group
  //    exceeds the limit, the lane(s) to drop are chosen deterministically from
  //    the sorted bitmask of lanes in that chord, so the same 4-lane pattern
  //    always drops the same lane(s) every time it appears.
  const chordWindowSec = CHORD_WINDOW_MS / 1000;
  // Cache: bitmask of lane set → sorted array of lanes to keep
  const keepCache = new Map();

  function lanesToKeep(lanes) {
    const mask = lanes.reduce((m, l) => m | (1 << l), 0);
    if (!keepCache.has(mask)) {
      // Always drop the lane(s) with the highest index first — deterministic
      const sorted = [...lanes].sort((a, b) => a - b);
      keepCache.set(mask, sorted.slice(0, CHORD_MAX_LANES));
    }
    return keepCache.get(mask);
  }

  const chordLimited = [];
  let i = 0;
  while (i < noOverlapNotes.length) {
    // Collect all notes in the same chord window
    const chord = [noOverlapNotes[i]];
    let j = i + 1;
    while (j < noOverlapNotes.length && noOverlapNotes[j].time - noOverlapNotes[i].time < chordWindowSec) {
      chord.push(noOverlapNotes[j]);
      j++;
    }

    if (chord.length <= CHORD_MAX_LANES) {
      chordLimited.push(...chord);
    } else {
      const lanesInChord = [...new Set(chord.map(n => n.lane))];
      if (lanesInChord.length <= CHORD_MAX_LANES) {
        // More than CHORD_MAX_LANES notes but within allowed lanes — keep all
        chordLimited.push(...chord);
      } else {
        const allowed = new Set(lanesToKeep(lanesInChord));
        // Keep one note per allowed lane (prefer earliest)
        for (const lane of allowed) {
          const pick = chord.find(n => n.lane === lane);
          if (pick) chordLimited.push(pick);
        }
      }
    }
    i = j;
  }

  return chordLimited;
}

// ════════════════════════════════════════════════════════════════════════════
// Input handlers
// ════════════════════════════════════════════════════════════════════════════

function handlePress(gs, lane, elapsed, now) {
  const hw = gs.cfg.hitWindow;
  let best = null, bestDelta = Infinity;

  for (const note of gs.notes) {
    if (note.lane !== lane || note.scored || note.hit) continue;
    const delta = Math.abs(elapsed - note.time);
    if (delta < hw * 2 && delta < bestDelta) { best = note; bestDelta = delta; }
  }
  if (!best) return;

  if (best.isHold) {
    best.hit = true;
    if (bestDelta <= hw) {
      best.holdOk  = true;
      best.holding = true;
    } else {
      best.scored = true;
      gs.combo    = 0;
      addFeedback(gs, lane, 'FAIL', MISS_COLOR, now);
    }
  } else {
    best.hit    = true;
    best.scored = true;
    const perfect = bestDelta <= hw * PERFECT_WINDOW_FRAC;
    const pts     = Math.round((perfect ? SCORE_PERFECT : SCORE_GOOD) * comboMult(gs.combo, gs.cfg.maxComboMult));
    gs.score += pts;
    gs.combo += 1;
    if (gs.combo > gs.highCombo) gs.highCombo = gs.combo;
    addFeedback(gs, lane, perfect ? 'COUNTER!' : 'DEFLECT', perfect ? PERFECT_COLOR : GOOD_COLOR, now);
  }
}

function handleRelease(gs, lane, elapsed, now) {
  for (const note of gs.notes) {
    if (note.lane !== lane || !note.isHold || !note.hit || note.released || note.scored) continue;
    note.released = true;
    note.holding  = false;
    if (note.holdOk) {
      const fraction = Math.max(0, Math.min(1, (elapsed - note.time) / note.duration));
      if (fraction >= HOLD_MIN_FRACTION) {
        const pts = Math.round(SCORE_GOOD * comboMult(gs.combo, gs.cfg.maxComboMult));
        gs.score += pts;
        gs.combo += 1;
        if (gs.combo > gs.highCombo) gs.highCombo = gs.combo;
        addFeedback(gs, lane, 'DEFLECT', GOOD_COLOR, now);
      } else {
        gs.combo = 0;
        addFeedback(gs, lane, 'FAIL', MISS_COLOR, now);
      }
      note.scored = true;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Tick (game logic, runs every frame while not paused)
// ════════════════════════════════════════════════════════════════════════════

function tick(gs, now, onGameOver) {
  const elapsed = (now - gs.startTime) / 1000;
  const { cfg } = gs;

  // Edge-detect key presses / releases
  for (let lane = 0; lane < NUM_LANES; lane++) {
    const pressed  = gs.keysDown[lane] && !gs.keysPrev[lane];
    const released = !gs.keysDown[lane] && gs.keysPrev[lane];
    if (pressed)  handlePress(gs, lane, elapsed, now);
    if (released) handleRelease(gs, lane, elapsed, now);
    if (gs.keysDown[lane]) {
      for (const note of gs.notes) {
        if (note.lane === lane && note.isHold && note.holdOk && !note.released) note.holding = true;
      }
    }
    gs.keysPrev[lane] = gs.keysDown[lane];
  }

  // Auto-miss notes that have scrolled past the hit zone.
  // Hold notes that are actively being held are skipped — they complete via
  // the auto-complete pass below or by the player releasing.
  const missY = HIT_Y + cfg.hitWindow * cfg.scrollSpeed + HIT_ZONE_H + 30;
  for (const note of gs.notes) {
    if (note.scored) continue;
    if (note.isHold && note.holdOk) continue;   // actively held — don't auto-miss
    if (noteHeadY(note, elapsed, cfg.scrollSpeed) > missY) {
      note.scored = true;
      gs.combo    = 0;
      addFeedback(gs, note.lane, 'FAIL', MISS_COLOR, now);
    }
  }

  // Auto-complete holds that have run their full duration
  for (const note of gs.notes) {
    if (!note.isHold || note.scored || !note.holdOk || note.released) continue;
    if (elapsed > note.time + note.duration + HOLD_COMPLETE_GRACE) {
      note.scored   = true;
      note.released = true;
      const pts     = Math.round(SCORE_PERFECT * comboMult(gs.combo, cfg.maxComboMult));
      gs.score += pts;
      gs.combo += 1;
      if (gs.combo > gs.highCombo) gs.highCombo = gs.combo;
      addFeedback(gs, note.lane, 'COUNTER!', PERFECT_COLOR, now);
    }
  }

  gs.feedback = gs.feedback.filter(f => f.expiry > now);

  // End-of-song trigger
  const last = gs.notes[gs.notes.length - 1];
  if (last && now - gs.startTime > (last.time + last.duration + SONG_END_GRACE_SEC) * 1000) {
    onGameOver(gs.score, gs.highCombo);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Draw (runs every frame, even while paused)
// ════════════════════════════════════════════════════════════════════════════

function draw(ctx, gs, now) {
  const elapsed = gs.startTime ? (now - gs.startTime) / 1000 : 0;
  const { cfg, pilotName, difficulty } = gs;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  ctx.save();
  for (const star of gs.stars) {
    ctx.globalAlpha = star.a;
    ctx.fillStyle   = '#fff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Lane backgrounds + dividers
  for (let lane = 0; lane < NUM_LANES; lane++) {
    const x = laneX(lane);
    ctx.fillStyle   = LANE_DIM[lane];
    ctx.fillRect(x, 0, LANE_W, CANVAS_H);
    ctx.strokeStyle = LANE_DIVIDER_COLOR;
    ctx.lineWidth   = 1;
    ctx.strokeRect(x, 0, LANE_W, CANVAS_H);
  }

  // Scrolling ghost arrows (visual lane guide)
  const scrollOffset = (elapsed * cfg.scrollSpeed) % ARROW_SPACING_PX;
  for (let lane = 0; lane < NUM_LANES; lane++) {
    const cx = laneX(lane) + LANE_W / 2;
    ctx.font      = '22px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = laneRgba(lane, ARROW_GUIDE_ALPHA);
    for (let y = scrollOffset; y < HIT_Y; y += ARROW_SPACING_PX) {
      ctx.fillText(LANE_LABELS[lane], cx, y + 14);
    }
    // Static header arrow at top of each lane
    ctx.fillStyle = laneRgba(lane, ARROW_HEADER_ALPHA);
    ctx.font      = 'bold 20px monospace';
    ctx.fillText(LANE_LABELS[lane], cx, 30);
  }

  // Hit zone
  for (let lane = 0; lane < NUM_LANES; lane++) {
    const x      = laneX(lane);
    const color  = LANE_COLORS[lane];
    const active = gs.keysDown[lane];

    ctx.fillStyle = laneRgba(lane, active ? 0.33 : 0.10);
    ctx.fillRect(x, HIT_Y - HIT_ZONE_H / 2, LANE_W, HIT_ZONE_H);

    if (active) { ctx.shadowColor = color; ctx.shadowBlur = HIT_ACTIVE_BLUR; }
    ctx.fillStyle = active ? color : laneRgba(lane, 0.47);
    ctx.fillRect(x, HIT_Y - 2, LANE_W, 4);
    ctx.shadowBlur = 0;

    // Key label below hit zone
    ctx.font      = 'bold 18px monospace';
    ctx.textAlign = 'center';
    if (active) { ctx.shadowColor = color; ctx.shadowBlur = HIT_KEY_LABEL_BLUR; }
    ctx.fillStyle = active ? color : laneRgba(lane, 0.53);
    ctx.fillText(LANE_LABELS[lane], x + LANE_W / 2, HIT_Y + HIT_ZONE_H + 20);
    ctx.shadowBlur = 0;
  }

  // Notes
  for (const note of gs.notes) {
    if (!note.isHold && note.scored) continue;
    if (note.isHold && note.scored && note.released) continue;

    const color = LANE_COLORS[note.lane];
    const x     = laneX(note.lane) + 5;
    const headY = noteHeadY(note, elapsed, cfg.scrollSpeed);

    if (note.isHold) {
      // startY = press point — arrives at HIT_Y at note.time (player presses here)
      // endY   = release point — arrives at HIT_Y at note.time+note.duration (player releases here)
      // The body extends UPWARD from startY so the start cap leads, end cap trails.
      const startY  = headY;
      const endY    = headY - noteBodyH(note, cfg.scrollSpeed);
      const drawTop = Math.max(0, endY);
      const drawBot = Math.min(CANVAS_H, startY);
      if (drawBot < 0 || drawTop > CANVAS_H) continue;

      // Body — brighter at bottom (press end), dimmer at top (release end)
      const grad = ctx.createLinearGradient(0, endY, 0, startY);
      grad.addColorStop(0, laneRgba(note.lane, 0.20));
      grad.addColorStop(1, laneRgba(note.lane, 0.73));
      ctx.fillStyle = grad;
      ctx.fillRect(x, drawTop, NOTE_W, drawBot - drawTop);

      if (note.holding) {
        ctx.shadowColor = color;
        ctx.shadowBlur  = HOLD_ACTIVE_BLUR;
        ctx.fillStyle   = laneRgba(note.lane, 0.27);
        ctx.fillRect(x, drawTop, NOTE_W, drawBot - drawTop);
        ctx.shadowBlur  = 0;
      }

      // Start cap (press) at bottom — solid, bright
      if (startY > -HOLD_CAP_H - 4 && startY < CANVAS_H) {
        ctx.fillStyle   = color;
        ctx.shadowColor = color;
        ctx.shadowBlur  = NOTE_GLOW_BLUR;
        roundRect(ctx, x, startY - HOLD_CAP_H / 2, NOTE_W, HOLD_CAP_H, NOTE_R);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // End cap (release) at top — slightly different shade + inner stripe
      if (endY > -HOLD_END_CAP_H - 4 && endY < CANVAS_H) {
        ctx.fillStyle   = laneRgba(note.lane, 0.90);
        ctx.shadowColor = color;
        ctx.shadowBlur  = NOTE_GLOW_BLUR;
        roundRect(ctx, x, endY - HOLD_END_CAP_H / 2, NOTE_W, HOLD_END_CAP_H, NOTE_R);
        ctx.fill();
        ctx.fillStyle  = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 0;
        ctx.fillRect(x + 4, endY - 2, NOTE_W - 8, 4);
      }
    } else {
      if (headY < -NOTE_H - 4 || headY > CANVAS_H + NOTE_H) continue;
      ctx.fillStyle   = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = NOTE_GLOW_BLUR;
      roundRect(ctx, x, headY - NOTE_H / 2, NOTE_W, NOTE_H, NOTE_R);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Floating hit-feedback text
  for (const fb of gs.feedback) {
    const age   = 1 - (fb.expiry - now) / FEEDBACK_DISPLAY_MS;
    const alpha = Math.max(0, 1 - age * 1.4);
    const y     = HIT_Y - FEEDBACK_START_OFFSET - age * FEEDBACK_RISE_PX;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font        = 'bold 14px monospace';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = fb.color;
    ctx.shadowColor = fb.color;
    ctx.shadowBlur  = 8;
    ctx.fillText(fb.text, laneX(fb.lane) + LANE_W / 2, y);
    ctx.restore();
  }

  // HUD
  ctx.font      = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = HUD_SCORE_COLOR;
  ctx.fillText(`SCORE: ${String(gs.score).padStart(8, '0')}`, 12, 22);
  ctx.fillStyle = HUD_COMBO_COLOR;
  ctx.fillText(`COMBO: x${gs.combo}`, 12, 40);
  ctx.fillStyle = HUD_BEST_COLOR;
  ctx.font      = '11px monospace';
  ctx.fillText(`BEST:  x${gs.highCombo}`, 12, 56);

  ctx.textAlign = 'right';
  ctx.font      = '11px monospace';
  if (pilotName)  { ctx.fillStyle = HUD_PILOT_COLOR; ctx.fillText(pilotName, CANVAS_W - 12, 22); }
  if (difficulty) { ctx.fillStyle = HUD_DIFF_COLOR;  ctx.fillText(difficulty, CANVAS_W - 12, 36); }

  // Pause overlay
  if (gs.paused) {
    ctx.fillStyle = PAUSE_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font        = 'bold 26px monospace';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = PAUSE_TEXT_COLOR;
    ctx.shadowColor = PAUSE_TEXT_COLOR;
    ctx.shadowBlur  = 10;
    ctx.fillText('⏸  PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 14);
    ctx.shadowBlur  = 0;
    ctx.font        = '13px monospace';
    ctx.fillStyle   = PAUSE_HINT_COLOR;
    ctx.fillText('Press ESC to resume', CANVAS_W / 2, CANVAS_H / 2 + 14);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// React component
// ════════════════════════════════════════════════════════════════════════════

export default function LightsaberGame({ pilotName, difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const gsRef     = useRef(null);
  const rafRef    = useRef(null);
  const cleanRef  = useRef([]);

  const handleGameOver = useCallback(
    (score, combo) => onGameOver(score, combo),
    [onGameOver]
  );

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop(now) {
      const gs = gsRef.current;
      if (gs && !gs.songDone) {
        if (!gs.paused) tick(gs, now, (score, combo) => {
          gs.songDone = true;
          handleGameOver(score, combo);
        });
        draw(ctx, gs, now);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [handleGameOver]);

  // Load MIDI and initialise Tone.js audio on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ Midi }, Tone] = await Promise.all([
        import('@tonejs/midi'),
        import('tone'),
      ]);
      if (cancelled) return;

      const response = await fetch('/imperialmarch.mid');
      const buf      = await response.arrayBuffer();
      const midi     = new Midi(buf);

      const rawNotes = [];
      midi.tracks.forEach(track =>
        track.notes.forEach(n => rawNotes.push({ midi: n.midi, time: n.time, duration: n.duration }))
      );
      rawNotes.sort((a, b) => a.time - b.time);
      if (cancelled) return;

      const cfg   = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.MEDIUM;
      const notes = buildNotes(rawNotes, cfg);

      gsRef.current = {
        cfg, notes, pilotName, difficulty,
        stars:     makeStars(),
        keysDown:  [false, false, false, false],
        keysPrev:  [false, false, false, false],
        score:     0,
        combo:     0,
        highCombo: 0,
        feedback:  [],
        paused:    false,
        songDone:  false,
        startTime: null,
      };

      const reverb = new Tone.Reverb({ decay: REVERB_DECAY, wet: REVERB_WET }).toDestination();
      const synth  = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: SYNTH_OSCILLATOR },
        envelope:   { attack: SYNTH_ATTACK, decay: SYNTH_DECAY, sustain: SYNTH_SUSTAIN, release: SYNTH_RELEASE },
        volume:     SYNTH_VOLUME_DB,
      }).connect(reverb);

      const part = new Tone.Part((time, note) => {
        synth.triggerAttackRelease(
          Tone.Frequency(note.midi, 'midi').toFrequency(),
          note.duration,
          time
        );
      }, rawNotes.map(n => [n.time, n]));
      part.start(0);

      cleanRef.current = [
        () => { Tone.Transport.stop(); Tone.Transport.cancel(); },
        () => { part.stop(); part.dispose(); },
        () => synth.dispose(),
        () => reverb.dispose(),
      ];
      if (cancelled) return;

      await Tone.start();
      Tone.Transport.start();
      gsRef.current.startTime = performance.now();
      startLoop();
    }

    load().catch(err => console.error('LightsaberGame init error:', err));

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cleanRef.current.forEach(fn => { try { fn(); } catch (_) {} });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard input
  useEffect(() => {
    const LANE_KEY = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, a: 0, s: 1, w: 2, d: 3 };

    const onDown = (e) => {
      if (e.key === 'Escape') {
        if (gsRef.current) gsRef.current.paused = !gsRef.current.paused;
        return;
      }
      const lane = LANE_KEY[e.key];
      if (lane === undefined) return;
      e.preventDefault();
      if (gsRef.current) gsRef.current.keysDown[lane] = true;
    };

    const onUp = (e) => {
      const lane = LANE_KEY[e.key];
      if (lane === undefined) return;
      e.preventDefault();
      if (gsRef.current) gsRef.current.keysDown[lane] = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={styles.canvas}
      />
    </div>
  );
}
