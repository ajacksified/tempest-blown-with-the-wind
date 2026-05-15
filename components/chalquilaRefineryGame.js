import { useEffect, useRef, useCallback, useState } from 'react';
import styles from './chalquilaRefineryGame.module.css';

// ── Layout ───────────────────────────────────────────────────────────────────
const W  = 64; // inner width between box walls
const LW = 27; // left col width in 2-col sections
const RW = W - LW - 1; // = 36

// ── Colors ───────────────────────────────────────────────────────────────────
const C = {
  amber: '#ffb000',
  dim:   '#a07000',
  warn:  '#ff8800',
  err:   '#ff4444',
  ok:    '#ffdd66',
  white: '#fffaf0',
  green: '#88cc44',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const ESC_M = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const ESC = s => String(s).replace(/[&<>]/g, ch => ESC_M[ch]);
const S   = (t, c) => c ? `<span style="color:${c}">${ESC(String(t))}</span>` : ESC(String(t));
const P   = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };

function makeBar(val, max, width, fg, bg) {
  const n = Math.min(width, Math.max(0, Math.round((val / max) * width)));
  return { html: S('\u2588'.repeat(n), fg) + S('\u2591'.repeat(width - n), bg || C.dim), len: width };
}

function wrapText(text, maxLen) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur ? cur.length + 1 : 0) + w.length > maxLen) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Build inner content: segs = [{t, c?}] or [{html, len}]
function inner(segs, width) {
  let html = '', len = 0;
  for (const seg of segs) {
    if ('html' in seg) {
      html += seg.html; len += seg.len;
    } else {
      const t = String(seg.t ?? '');
      html += seg.c ? S(t, seg.c) : ESC(t);
      len += t.length;
    }
  }
  if (len < width) html += ' '.repeat(width - len);
  return html;
}

const WALL = S('\u2551', C.dim);
const bline  = segs       => WALL + inner(segs, W)  + WALL;
const b2line = (ls, rs)   => WALL + inner(ls, LW) + WALL + inner(rs, RW) + WALL;
const hsep   = (l,m,r)    => S(l + '\u2550'.repeat(W) + r, C.dim);
const h2sep  = (l,lm,rm,r)=> S(l + '\u2550'.repeat(LW) + lm + '\u2550'.repeat(RW) + r, C.dim);

const tempColor  = v => v >= 93 ? C.err : v >= 85 ? C.warn : C.ok;
const pressColor = v => v >= 80 ? C.err : v >= 65 ? C.warn : C.ok;
const impColor   = v => v >= 30 ? C.err : v >= 18 ? C.warn : C.ok;
const loadColor  = v => v >= 75 ? C.err : v >= 55 ? C.warn : C.ok;
const statBadge  = (v, w, e) =>
  v >= e ? S('[!!!]', C.err) : v >= w ? S('[!  ]', C.warn) : S('[ OK]', C.ok);

const COL_COLOR = { STABLE: C.ok, OVERHEATING: C.warn, CONTAMINATED: C.warn, OFFLINE: C.err };

// ── Chaos event definitions ──────────────────────────────────────────────────
function addLog(gs, msg) {
  gs.log.push(String(msg).slice(0, W - 2));
  if (gs.log.length > 4) gs.log.shift();
}

const CHAOS_DEFS = [
  {
    id: 'coolant_leak', banner: 'WARNING: COOLANT LEAK DETECTED',
    type: 'type', required: 'SEAL', timeout: 5,
    successMsg: 'Leak sealed. Systems stabilizing.',
    failMsg: 'Seal failed \u2014 coolant pressure lost.',
    onSuccess: () => {},
    onFail: gs => {
      gs.crewPct = Math.max(0, gs.crewPct - 20);
      gs.pressure = Math.min(100, gs.pressure + 12);
      addLog(gs, '> Crew injured. Pressure spiked.');
    },
  },
  {
    id: 'fire', banner: 'FIRE DETECTED IN TANK ?',
    type: 'choice', timeout: 8,
    onSpawn: (ev, gs) => {
      const onlineIdxs = gs.columns.map((c, i) => c !== 'OFFLINE' ? i : -1).filter(i => i >= 0);
      const idx = onlineIdxs.length
        ? onlineIdxs[Math.floor(Math.random() * onlineIdxs.length)]
        : Math.floor(Math.random() * gs.columns.length);
      ev.tankIdx = idx;
      ev.banner  = `FIRE DETECTED IN TANK ${idx + 1}`;
      ev.failMsg = `No response \u2014 fire spread to Tank ${idx + 1}.`;
    },
    choices: [
      { key: 'foam',   label: 'ADD FOAM',       fn: (gs, ev) => { gs.impurity = Math.min(50, gs.impurity + 6); addLog(gs, `> Foam applied. Tank ${ev.tankIdx + 1} fire out. Batch fouled.`); } },
      { key: 'vent',   label: 'VENT PRESSURE',   fn: (gs, ev) => { gs.pressure = Math.max(0, gs.pressure - 20); addLog(gs, `> Vented. Tank ${ev.tankIdx + 1} fire out. Pressure dropped.`); } },
      { key: 'ignore', label: 'IGNORE',          fn: (gs, ev) => {
        if (Math.random() < 0.55) {
          gs.explosions++;
          gs.crewPct = Math.max(0, gs.crewPct - 30);
          gs.columns[ev.tankIdx] = 'OFFLINE';
          addLog(gs, `> *** EXPLOSION *** Tank ${ev.tankIdx + 1} offline.`);
        } else {
          addLog(gs, '> Fire self-extinguished. Outstanding luck.');
        }
      }},
    ],
    successMsg: null,
    failMsg: 'No response \u2014 fire spread.',
    onSuccess: () => {},
    onFail: (gs, ev) => {
      gs.explosions++;
      gs.crewPct = Math.max(0, gs.crewPct - 30);
      gs.columns[ev.tankIdx ?? 2] = 'OFFLINE';
      addLog(gs, `> Tank ${(ev.tankIdx ?? 2) + 1} offline. Casualties reported.`);
    },
  },
  {
    id: 'pressure_spike', banner: 'CRITICAL: PRESSURE SPIKE DETECTED',
    type: 'type', required: 'VENT', timeout: 4,
    successMsg: 'Pressure vented. Crisis averted.',
    failMsg: 'Vent failed \u2014 line rupture.',
    onSuccess: gs => { gs.pressure = Math.max(0, gs.pressure - 15); },
    onFail: gs => {
      gs.explosions++;
      gs.pressure = 100;
      addLog(gs, '> RUPTURE. Pressure at maximum.');
    },
  },
  {
    id: 'worm_escape', banner: 'ALERT: CHALQUILA WORM ESCAPE',
    type: 'type', required: 'CONTAIN', timeout: 6,
    successMsg: 'Worms contained. Bioreactor secured.',
    failMsg: 'Containment failed \u2014 methanol contamination.',
    onSuccess: () => {},
    onFail: gs => {
      gs.methanol = Math.min(50, gs.methanol + 10);
      addLog(gs, '> Methanol spike from escaped worms.');
    },
  },
  {
    id: 'inspection', banner: 'IMPERIAL INSPECTION DETECTED',
    type: 'type', required: 'HIDE', timeout: 5,
    successMsg: 'Equipment concealed. Inspector satisfied.',
    failMsg: 'Equipment exposed. Operation terminated.',
    onSuccess: () => {},
    onFail: gs => {
      gs.complete = true;
      gs.specialEnding = 'inspection';
      addLog(gs, '> OPERATION TERMINATED BY IMPERIAL AUTHORITY.');
    },
  },
];

// ── Game state ───────────────────────────────────────────────────────────────
function initState() {
  return {
    mashTemp: 72, pressure: 45, impurity: 8, reactorLoad: 35,
    ethanol: 5, methanol: 1, progress: 0,
    columns: ['STABLE', 'STABLE', 'STABLE'],
    crewPct: 100, explosions: 0,
    log: [
      '> Refinery systems online.',
      '> Worm bioreactor active.',
      '> Awaiting operator commands.',
    ],
    tick: 0, stabilityLog: [],
    chaosEvent: null,
    complete: false, specialEnding: null,
    stabilizeBonusTicks: 0, catalystTicks: 0,
    showHighscore: false,
    showHelp: false,
    toxMax: 20, methanolWarned: false,
    overrideCooldown: 0,
    overheatTicks: 0, harshTicks: 0, sweetTicks: 0,
  };
}

function doTick(gs) {
  gs.tick++;
  if (gs.stabilizeBonusTicks > 0) gs.stabilizeBonusTicks--;
  if (gs.catalystTicks > 0) gs.catalystTicks--;
  if (gs.overrideCooldown > 0) gs.overrideCooldown--;

  // Column state drift
  for (let i = 0; i < 3; i++) {
    const col = gs.columns[i];
    if (col === 'OFFLINE') continue;
    if (gs.mashTemp > 87 && col === 'STABLE' && Math.random() < (i === 0 ? 0.14 : 0.07)) {
      gs.columns[i] = 'OVERHEATING'; addLog(gs, `> COL ${i+1} OVERHEATING. Ethanol yield degraded. Reduce heat.`);
    }
    if (gs.impurity > 18 && col === 'STABLE' && Math.random() < (i === 1 ? 0.11 : 0.06)) {
      gs.columns[i] = 'CONTAMINATED'; addLog(gs, `> COL ${i+1} CONTAMINATED. Methanol rising. Purge lines.`);
    }
    if (col === 'OVERHEATING' && gs.mashTemp > 93 && Math.random() < 0.09) {
      gs.columns[i] = 'OFFLINE'; addLog(gs, `> COL ${i+1} OFFLINE. Yield and progress reduced.`);
    }
    if (col === 'OVERHEATING' && gs.mashTemp < 80 && Math.random() < 0.14) {
      gs.columns[i] = 'STABLE'; addLog(gs, `> Col ${i+1} cooled. Back online. Yield restored.`);
    }
  }

  const overheat   = gs.columns.filter(c => c === 'OVERHEATING').length;
  const contamined = gs.columns.filter(c => c === 'CONTAMINATED').length;
  const offline    = gs.columns.filter(c => c === 'OFFLINE').length;
  const active     = 3 - offline;

  // Hidden flavor accumulation
  if (overheat > 0) gs.overheatTicks++;
  if (gs.pressure > 75 && gs.mashTemp > 82) gs.harshTicks++;
  if (gs.mashTemp <= 80 && overheat === 0 && offline === 0) gs.sweetTicks++;

  // Ethanol production (builds toward target over ~3 min)
  const tempFactor = Math.max(0, Math.min(1, (gs.mashTemp - 62) / 28));
  let ethanolRate = tempFactor * 0.65 * (active / 3) - overheat * 0.07;
  if (gs.catalystTicks > 0) ethanolRate *= 1.6;
  gs.ethanol = Math.min(68, gs.ethanol + Math.max(0, ethanolRate));

  // Methanol (bad; rises with high temp and contamination)
  let methRate = 0;
  if (gs.mashTemp > 83) methRate += (gs.mashTemp - 83) * 0.022;
  methRate += contamined * 0.22;
  if (gs.catalystTicks > 0 && Math.random() < 0.28) methRate += 0.3;
  gs.methanol = Math.min(50, gs.methanol + methRate);

  // Impurity drift
  gs.impurity = Math.min(50, gs.impurity + 0.25 + contamined * 0.2);

  // Reactor load (derived)
  gs.reactorLoad = Math.min(100, Math.max(0,
    25 + gs.pressure * 0.4 + (gs.mashTemp - 70) * 0.5 + gs.impurity * 0.25
    - (gs.stabilizeBonusTicks > 0 ? 15 : 0)
  ));

  // Progress
  let progRate = (0.42 + gs.pressure * 0.006) * (active / 3);
  if (gs.catalystTicks > 0) progRate *= 1.35;
  gs.progress = Math.min(100, gs.progress + Math.max(0, progRate));

  gs.stabilityLog.push(100 - gs.reactorLoad);

  // Chaos event countdown / new event roll
  if (gs.chaosEvent) {
    gs.chaosEvent.timeLeft--;
    if (gs.chaosEvent.timeLeft <= 0) {
      gs.chaosEvent.onFail(gs, gs.chaosEvent);
      addLog(gs, `> !! ${gs.chaosEvent.failMsg}`);
      gs.chaosEvent = null;
    }
  } else if (gs.tick > 8 && gs.progress < 97) {
    const chance = 0.022 + gs.reactorLoad * 0.0014;
    if (Math.random() < chance) {
      const pool = CHAOS_DEFS.filter(e => e.id !== 'inspection' || gs.tick > 60);
      const def  = pool[Math.floor(Math.random() * pool.length)];
      const ev   = { ...def, timeLeft: def.timeout };
      if (def.onSpawn) def.onSpawn(ev, gs);
      gs.chaosEvent = ev;
    }
  }

  if (!gs.methanolWarned && gs.methanol > gs.toxMax) {
    gs.methanolWarned = true;
    addLog(gs, `> Methanol over limit. Cannot be reduced \u2014 slow further production.`);
  }

  if (gs.crewPct <= 0 && !gs.complete) { gs.complete = true; gs.specialEnding = 'crew_dead'; }
  if (gs.progress >= 100 && !gs.complete) gs.complete = true;
}

// ── Override outcomes ─────────────────────────────────────────────────────────
const OVERRIDE_OUTCOMES = [
  // Good
  { msg: '> OVERRIDE ACCEPTED. Emergency flux shunt. All columns restored.',
    fn: gs => { gs.columns = ['STABLE','STABLE','STABLE']; gs.impurity = Math.max(0, gs.impurity - 12); } },
  { msg: '> OVERRIDE ACCEPTED. Turbo-fermentation engaged. Catalyst at 200%.',
    fn: gs => { gs.catalystTicks = 20; gs.ethanol = Math.min(68, gs.ethanol + 5); } },
  { msg: '> OVERRIDE ACCEPTED. Pressure optimized. Reactor load dropping.',
    fn: gs => { gs.pressure = Math.min(Math.max(gs.pressure, 45), 60); gs.stabilizeBonusTicks = 20; } },
  // Bad
  { msg: '> OVERRIDE REJECTED. Safety interlock tripped. Pressure rupture.',
    fn: gs => { gs.explosions++; gs.pressure = Math.min(100, gs.pressure + 28); gs.crewPct = Math.max(0, gs.crewPct - 18); addLog(gs, '> *** RUPTURE *** Crew injured. Pressure spiked.'); } },
  { msg: '> OVERRIDE ACCEPTED. Worm bioreactor at 300%. Methanol flooding lines.',
    fn: gs => { gs.methanol = Math.min(50, gs.methanol + 14); gs.catalystTicks = 6; } },
  { msg: '> OVERRIDE ACCEPTED. Column cooling disabled. This will be fine.',
    fn: gs => { gs.mashTemp = Math.min(100, gs.mashTemp + 12); gs.ethanol = Math.min(68, gs.ethanol + 4); } },
  { msg: '> OVERRIDE ACCEPTED. Impurity filters bypassed for throughput.',
    fn: gs => { gs.progress = Math.min(100, gs.progress + 12); gs.impurity = Math.min(50, gs.impurity + 14); } },
  // Chaotic
  { msg: '> OVERRIDE ACCEPTED. All parameters randomized. Good luck.',
    fn: gs => {
      gs.pressure  = Math.floor(Math.random() * 70) + 15;
      gs.mashTemp  = Math.floor(Math.random() * 30) + 68;
      gs.impurity  = Math.floor(Math.random() * 20);
    } },
  { msg: '> OVERRIDE ACCEPTED. Reactor running at 140% rated capacity.',
    fn: gs => { gs.ethanol = Math.min(68, gs.ethanol + 7); gs.methanol = Math.min(50, gs.methanol + 7); gs.reactorLoad = Math.min(100, gs.reactorLoad + 18); } },
  // Null
  { msg: '> OVERRIDE ACCEPTED. All systems nominal. Nothing happened. Suspicious.',
    fn: () => {} },
];

// ── Command parser ────────────────────────────────────────────────────────────
function parseCmd(raw, gs) {
  const cmd = raw.toLowerCase().trim();

  // During a typed-response chaos event, CMD input goes to chaos handler
  if (gs.chaosEvent && gs.chaosEvent.type === 'type') {
    if (cmd.toUpperCase() === gs.chaosEvent.required) {
      gs.chaosEvent.onSuccess(gs);
      addLog(gs, `> ${gs.chaosEvent.successMsg}`);
    } else {
      addLog(gs, `> WRONG RESPONSE. Required: ${gs.chaosEvent.required}`);
    }
    gs.chaosEvent = null;
    return;
  }

  // During a choice chaos event, CMD input selects an option by name
  if (gs.chaosEvent && gs.chaosEvent.type === 'choice') {
    const choice = gs.chaosEvent.choices.find(c => c.key === cmd);
    if (choice) {
      choice.fn(gs, gs.chaosEvent);
    } else {
      const valid = gs.chaosEvent.choices.map(c => c.key).join(', ');
      addLog(gs, `> UNKNOWN OPTION. Valid: ${valid}`);
    }
    gs.chaosEvent = null;
    return;
  }

  if (/^(increase heat|raise temp|heat up|raise heat|increase temp|more heat)$/.test(cmd)) {
    gs.mashTemp = Math.min(100, gs.mashTemp + 5);
    const t = gs.mashTemp;
    const heatMsg =
      t >= 93 ? `> Temp \u2192 ${t}C. Column failure imminent. Methanol spiking.` :
      t >= 88 ? `> Temp \u2192 ${t}C. Ethanol up. Methanol risk high — overheat warning.` :
      t >= 84 ? `> Temp \u2192 ${t}C. Ethanol yield up. Methanol beginning to climb.` :
      t >= 78 ? `> Temp \u2192 ${t}C. Ethanol yield increasing.` :
                `> Temp \u2192 ${t}C. Below optimal — ethanol building slowly.`;
    addLog(gs, heatMsg);
  } else if (/^(reduce heat|lower temp|cool down|lower heat|decrease heat|reduce temp|less heat)$/.test(cmd)) {
    gs.mashTemp = Math.max(60, gs.mashTemp - 5);
    const t = gs.mashTemp;
    const coolMsg =
      t < 70  ? `> Temp \u2192 ${t}C. Fermentation nearly stalled.` :
      t < 78  ? `> Temp \u2192 ${t}C. Yield slowing. Methanol rate dropping.` :
      t <= 83 ? `> Temp \u2192 ${t}C. Back in optimal range. Methanol risk stable.` :
                `> Temp \u2192 ${t}C. Cooling down. Methanol rate decreasing.`;
    addLog(gs, coolMsg);
  } else if (/^(vent pressure|release pressure|depressurize|reduce pressure|lower pressure)$/.test(cmd)) {
    gs.pressure = Math.max(0, gs.pressure - 10);
    const p = gs.pressure;
    const ventMsg =
      p < 20  ? `> Pressure \u2192 ${p}%. Batch progression nearly stalled.` :
      p < 40  ? `> Pressure vented to ${p}%. Proof production slowed. Load easing.` :
                `> Pressure vented to ${p}%. Throughput reduced. Reactor stabilizing.`;
    addLog(gs, ventMsg);
  } else if (/^(add pressure|pressurize|raise pressure|increase pressure)$/.test(cmd)) {
    gs.pressure = Math.min(100, gs.pressure + 10);
    const p = gs.pressure;
    const pressMsg =
      p >= 80 ? `> Pressure \u2192 ${p}%. WARNING: instability risk. Chaos more likely.` :
      p >= 65 ? `> Pressure \u2192 ${p}%. Batch faster. Reactor load elevated.` :
                `> Pressure \u2192 ${p}%. Batch progressing faster.`;
    addLog(gs, pressMsg);
  } else if (/^(add catalyst|catalyst|worm catalyst)$/.test(cmd)) {
    gs.catalystTicks = 12;
    if (Math.random() < 0.3) {
      gs.methanol = Math.min(50, gs.methanol + 4);
      addLog(gs, '> Catalyst added. Fermentation spiking — methanol elevated.');
    } else {
      addLog(gs, '> Catalyst added. Worm fermentation accelerating for 12s.');
    }
  } else if (/^(purge lines|purge|purge line)$/.test(cmd)) {
    const prev = gs.impurity;
    gs.impurity = Math.max(0, gs.impurity - 9);
    const contIdx = gs.columns.findIndex(c => c === 'CONTAMINATED');
    if (contIdx >= 0) {
      gs.columns[contIdx] = 'STABLE';
      addLog(gs, `> Lines purged. Col ${contIdx + 1} cleared — methanol source removed.`);
    } else {
      addLog(gs, `> Lines purged. Impurity ${prev.toFixed(0)}% \u2192 ${gs.impurity.toFixed(0)}%. Contamination risk reduced.`);
    }
    gs.progress = Math.max(0, gs.progress - 1.5);
  } else if (/^(stabilize core|stabilize|core stabilize)$/.test(cmd)) {
    gs.stabilizeBonusTicks = 15;
    addLog(gs, '> Core stabilized. Reactor load dropping for 15s. Chaos risk reduced.');
  } else if (/^(check status|status|check)$/.test(cmd)) {
    addLog(gs, `> T:${gs.mashTemp}C P:${gs.pressure}% I:${gs.impurity.toFixed(0)}% R:${gs.reactorLoad.toFixed(0)}% E:${gs.ethanol.toFixed(0)}%`);
  } else if (/^(override|override safeties|safety override)$/.test(cmd)) {
    if (gs.overrideCooldown > 0) {
      addLog(gs, `> Override cooldown active. ${gs.overrideCooldown}s remaining.`);
    } else {
      const outcome = OVERRIDE_OUTCOMES[Math.floor(Math.random() * OVERRIDE_OUTCOMES.length)];
      outcome.fn(gs);
      addLog(gs, outcome.msg);
      gs.overrideCooldown = 30;
    }
  } else if (/^(highscore|high score|ledger|scores|history)$/.test(cmd)) {
    gs.showHighscore = !gs.showHighscore;
    gs.showHelp = false;
  } else if (/^(help|\?)$/.test(cmd)) {
    gs.showHelp = !gs.showHelp;
    gs.showHighscore = false;
  } else if (cmd) {
    gs.showHighscore = false;
    gs.showHelp = false;
    addLog(gs, `> Unknown: "${raw.slice(0, 24)}". Type HELP.`);
  }
}

// ── Flavor derivation (hidden — emerges from operating conditions) ────────────
function deriveFlavor(gs) {
  const t = Math.max(gs.tick, 1);
  // Smoky: columns spent meaningful time overheating
  if (gs.overheatTicks / t >= 0.18) return 'smoky';
  // Harsh: sustained high-pressure hot mashing
  if (gs.harshTicks   / t >= 0.30) return 'harsh';
  // Sweet: prolonged low-temp stable operation
  if (gs.sweetTicks   / t >= 0.35) return 'sweet';
  return 'neutral';
}

// ── Score computation (exported for debrief) ─────────────────────────────────
export function computeScores(gs, order) {
  const { profile } = order;
  const sec = order.secondaryObjective || null;

  // Proof quality
  const proofTarget = profile.proofMin + (profile.proofMax ? (profile.proofMax - profile.proofMin) / 2 : 2);
  const proofDiff   = Math.abs(gs.ethanol - proofTarget);
  const inRange     = gs.ethanol >= profile.proofMin && (!profile.proofMax || gs.ethanol <= profile.proofMax);
  let quality;
  if (inRange)     quality = proofDiff <= 3 ? 95 : proofDiff <= 6 ? 85 : 75;
  else             quality = proofDiff <= 4 ? 65 : proofDiff <= 8 ? 50 : proofDiff <= 14 ? 35 : 20;
  if (profile.flavor === 'any') quality = Math.max(quality, 65);

  // Flavor affinity — hidden, emerges from operating conditions
  const producedFlavor = deriveFlavor(gs);
  let flavorMatch = null; // null = 'any' profile, no flavor requirement
  if (profile.flavor !== 'any') {
    flavorMatch = producedFlavor === profile.flavor;
    quality = Math.max(0, Math.min(100, quality + (flavorMatch ? 12 : -12)));
  }

  // Toxicity — base toxMax, then check if secondary objective adjusts it
  const meth = gs.methanol;
  let effectiveToxMax = profile.toxMax;
  if (sec?.id === 'tolerance_questionable') effectiveToxMax = profile.toxMax * 1.5;
  if (sec?.id === 'tolerance_strong')       effectiveToxMax = profile.toxMax * 2.5;
  if (sec?.id === 'tolerance_immune')       effectiveToxMax = profile.toxMax * 5;

  let toxScore;
  if (sec?.id === 'preferred_side_effects') {
    // Customer *wants* methanol; invert the scoring
    toxScore =
      meth < 2                     ? 30  : // too pure, disappointing
      meth <= profile.toxMax * 0.5 ? 55  : // present but weak
      meth <= profile.toxMax * 2   ? 95  : // right in the zone
      meth <= profile.toxMax * 3.5 ? 70  : // even they have limits
                                     40;   // genuinely dangerous
  } else {
    toxScore =
      meth <= effectiveToxMax * 0.4 ? 100 :
      meth <= effectiveToxMax       ? 75  :
      meth <= effectiveToxMax * 1.5 ? 45  :
      meth <= effectiveToxMax * 2.5 ? 20  : 5;
  }

  // Stability
  const avgStab = gs.stabilityLog.length > 0
    ? gs.stabilityLog.reduce((a, b) => a + b, 0) / gs.stabilityLog.length
    : 50;
  let stabilityScore = Math.round(avgStab);
  if (sec?.id === 'consistency') stabilityScore = Math.min(100, Math.round(stabilityScore * 1.4));

  // Delivery speed
  const speedScore = Math.max(10, Math.round(100 - gs.tick * 0.45));

  // Secondary objective bonus/penalty
  let secBonus = 0;
  let secAchieved = null; // null = always-applied modifier; true/false = goal outcome
  if (sec) {
    switch (sec.id) {
      case 'fast_delivery':
        secAchieved = gs.tick < 100;
        if (secAchieved) secBonus = 20;
        break;
      case 'tolerance_questionable':
      case 'tolerance_strong':
      case 'tolerance_immune':
        secAchieved = null; // always applied, not pass/fail
        break;
      case 'preferred_side_effects':
        secAchieved = null;
        break;
      case 'consistency':
        secAchieved = stabilityScore >= 70;
        if (secAchieved) secBonus = 10;
        break;
      case 'discretion':
        secAchieved = gs.explosions === 0;
        secBonus = gs.explosions === 0 ? 15 : gs.explosions * -12;
        break;
      case 'squadron_party':
      case 'fleet_party':
        secAchieved = gs.tick < 90;
        if (secAchieved) secBonus = 25;
        break;
    }
  }

  const baseTotal = Math.round((quality + toxScore + stabilityScore + gs.crewPct + speedScore) / 5);
  const total = Math.max(0, Math.min(100, baseTotal + secBonus));

  return {
    quality,
    toxScore,
    stability:    stabilityScore,
    crew:         gs.crewPct,
    speed:        speedScore,
    explosions:   gs.explosions,
    total,
    secBonus,
    secAchieved,
    producedFlavor,
    flavorMatch,
    specialEnding: gs.specialEnding,
    finalEthanol:  Math.round(gs.ethanol * 10) / 10,
    finalMethanol: Math.round(gs.methanol * 10) / 10,
    profile,
  };
}

// ── Highscore / session ledger ────────────────────────────────────────────────
function buildHighscore(sessionResults, pilotName, batchNumber) {
  const rows = [];
  const IW = W; // 64

  const pad  = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };
  const rpad = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : ' '.repeat(n - t.length) + t; };

  const gradeShort = total => {
    if (total >= 90) return 'MASTER';
    if (total >= 75) return 'BOOTLEGGER';
    if (total >= 60) return 'ACCEPTABLE';
    if (total >= 45) return 'INADVISABLE';
    if (total >= 30) return 'BIOHAZARD';
    return 'EVIDENCE';
  };

  // Column widths (must sum to IW = 64):
  // ║ + 2sp + #(2) + 2sp + customer(18) + 2sp + eth(4) + 2sp + meth(4) + 2sp + score(6) + 2sp + grade(10) + 2sp + ║
  // = 1 + 2+2+2 + 18+2 + 4+2 + 4+2 + 6+2 + 10+2 + 1 = wrong, let me just build rows directly
  const N  = 3;   // batch # width
  const CW = 20;  // customer
  const EW = 4;   // ethanol
  const MW = 4;   // methanol
  const SW = 6;   // score
  const GW = IW - 2 - N - 1 - CW - 1 - EW - 1 - MW - 1 - SW - 1 - 2; // grade + padding = 64 - 2 - 3 - 1 - 20 - 1 - 4 - 1 - 4 - 1 - 6 - 1 - 2 = 18

  const hdrLine = '  ' + pad('#', N) + ' ' + pad('CUSTOMER', CW) + ' ' + pad('ETH', EW) + ' ' + pad('MTH', MW) + ' ' + pad('SCORE', SW) + ' ' + 'GRADE';

  rows.push(S('\u2554' + '\u2550'.repeat(IW) + '\u2557', C.dim));
  rows.push(WALL + S(pad('  SESSION LEDGER \u2014 CHALQUILA REFINERY v2.3', IW), C.amber) + WALL);
  rows.push(WALL + S(pad(`  PILOT: ${pilotName}   BATCH ${batchNumber}`, IW), C.dim) + WALL);
  rows.push(S('\u2560' + '\u2550'.repeat(IW) + '\u2563', C.dim));
  rows.push(WALL + S(pad(hdrLine, IW), C.dim) + WALL);
  rows.push(S('\u2560' + '\u2550'.repeat(IW) + '\u2563', C.dim));

  if (sessionResults.length === 0) {
    rows.push(WALL + S(pad('  No completed batches yet.', IW), C.dim) + WALL);
  } else {
    let totalExplosions = 0;
    let totalScore = 0;

    sessionResults.forEach((r, i) => {
      const { scores, order } = r;
      totalExplosions += scores.explosions;
      totalScore      += scores.total;

      const numStr  = rpad(i + 1, N);
      const custStr = pad(order.customerLabel, CW);
      const ethStr  = rpad(scores.finalEthanol + '%', EW);
      const methStr = rpad(scores.finalMethanol + '%', MW);
      const scoreStr= rpad(scores.total + '/100', SW);
      const grade   = gradeShort(scores.total);

      const rowText = `  ${numStr} ${custStr} ${ethStr} ${methStr} ${scoreStr} ${grade}`;
      const scoreColor = scores.total >= 75 ? C.ok : scores.total >= 45 ? C.warn : C.err;
      rows.push(WALL + S(pad(rowText, IW), scoreColor) + WALL);
    });

    const sessionAvg = Math.round(totalScore / sessionResults.length);
    const sessionTitle = gradeShort(sessionAvg);
    rows.push(S('\u2560' + '\u2550'.repeat(IW) + '\u2563', C.dim));
    rows.push(WALL + S(pad(`  SESSION AVG:  ${sessionAvg}/100  [ ${sessionTitle} ]   EXPLOSIONS: ${totalExplosions}`, IW), C.amber) + WALL);
  }

  rows.push(S('\u255a' + '\u2550'.repeat(IW) + '\u255d', C.dim));
  rows.push('');
  rows.push(S('  type HIGHSCORE again to return to brewing', C.dim));
  return rows.join('\n');
}

// ── Contextual hint ───────────────────────────────────────────────────────────
function getHint(gs, order) {
  const { profile } = order;
  const eth  = gs.ethanol;
  const meth = gs.methanol;
  const overheating  = gs.columns.filter(c => c === 'OVERHEATING').length;
  const contaminated = gs.columns.filter(c => c === 'CONTAMINATED').length;
  const offline      = gs.columns.filter(c => c === 'OFFLINE').length;

  // Methanol exceeded — highest priority
  if (meth > profile.toxMax) {
    if (gs.mashTemp > 83) return `Methanol ${meth.toFixed(1)}% over limit. Reduce heat immediately.`;
    if (contaminated > 0) return `Contamination driving methanol over limit. Purge lines now.`;
    return null;
  }
  // Methanol approaching strict limit
  if (meth > profile.toxMax * 0.72 && profile.toxMax <= 14) {
    if (gs.mashTemp > 83) return `Methanol ${meth.toFixed(1)}% nearing ${profile.toxMax}% limit. Reduce heat.`;
    return `Methanol rising toward ${profile.toxMax}% limit. Purge if impurity is climbing.`;
  }

  // Ethanol problems (while brew still in progress)
  if (gs.progress < 85) {
    if (eth < profile.proofMin - 10) {
      if (gs.mashTemp < 75) return 'Ethanol well below target. Increase heat to boost fermentation.';
      if (offline > 0) return `${offline} column(s) offline — reduce heat and purge to restore.`;
      if (gs.pressure < 35) return 'Low pressure is slowing progress. Add pressure to speed things up.';
      return `Ethanol ${eth.toFixed(0)}% — target ${profile.proofMin}%+. Add catalyst for a burst.`;
    }
    if (eth < profile.proofMin - 3) {
      return `Almost there — ${(profile.proofMin - eth).toFixed(0)}% short of target. Hold steady.`;
    }
    if (profile.proofMax && eth > profile.proofMax + 2) {
      return `Ethanol ${eth.toFixed(0)}% above ${profile.proofMax}% ceiling. Reduce heat now.`;
    }
    if (profile.proofMax && eth > profile.proofMax - 3) {
      return `Ethanol approaching ${profile.proofMax}% ceiling. Ease off heat.`;
    }
  }

  // Impurity climbing
  if (gs.impurity > 22) return `Impurity ${gs.impurity.toFixed(0)}% — purge lines now before columns contaminate.`;
  if (gs.impurity > 14) return 'Impurity creeping up. Consider purging lines soon.';

  // Column trouble
  if (overheating > 0 && gs.mashTemp > 85) return 'Column(s) overheating. Reduce heat to prevent going offline.';
  if (contaminated > 0) return 'Contaminated column detected. Purge lines to restore it.';

  // Reactor load high
  if (gs.reactorLoad > 70) return 'Reactor load critical. Stabilize core or vent pressure.';
  if (gs.reactorLoad > 55) return 'Reactor load elevated. Stabilize core cuts it for 15 seconds.';

  // Running hot with strict toxicity limit
  if (gs.mashTemp > 85 && profile.toxMax <= 10) {
    return `High temp generates methanol. Keep below 84\u00b0C for a strict order.`;
  }

  // Positive confirmation when on track
  if (eth >= profile.proofMin && meth <= profile.toxMax * 0.5 && gs.impurity < 12) {
    return 'Batch on track. Hold conditions and watch for chaos events.';
  }

  return null;
}

// ── Help / process reference overlay ─────────────────────────────────────────
function buildHelp(dismissPrompt = false) {
  const rows = [];
  const pad = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };
  const row  = (content, col = C.dim)  => WALL + S(pad(content, W), col) + WALL;
  const rule = () => WALL + S('\u2500'.repeat(W), C.dim) + WALL;
  const blank = () => WALL + ' '.repeat(W) + WALL;

  rows.push(S('\u2554' + '\u2550'.repeat(W) + '\u2557', C.dim));
  rows.push(row('  CHALQUILA REFINERY \u2014 PROCESS REFERENCE', C.amber));
  rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.dim));
  rows.push(blank());
  rows.push(row('  COMMAND              EFFECT'));
  rows.push(rule());
  rows.push(blank());
  rows.push(row('  increase heat    \u2192  ETHANOL \u2191  (optimal: 78-90\u00b0C)'));
  rows.push(row('                       METHANOL \u2191 if temp > 83\u00b0C'));
  rows.push(row('                       COLUMN OVERHEAT risk if > 87\u00b0C'));
  rows.push(blank());
  rows.push(row('  reduce heat      \u2192  ETHANOL \u2193  METHANOL \u2193'));
  rows.push(blank());
  rows.push(row('  add pressure     \u2192  PROGRESS faster   REACTOR LOAD \u2191'));
  rows.push(row('  vent pressure    \u2192  REACTOR LOAD \u2193   progress slows'));
  rows.push(blank());
  rows.push(row('  add catalyst     \u2192  FERMENTATION burst (12s)'));
  rows.push(row('                       30% chance: METHANOL spike'));
  rows.push(blank());
  rows.push(row('  purge lines      \u2192  IMPURITY \u2193   CONTAMINATED \u2192 STABLE'));
  rows.push(blank());
  rows.push(row('  stabilize core   \u2192  REACTOR LOAD \u2193 for 15s'));
  rows.push(blank());
  rows.push(row('  override         \u2192  BYPASSES SAFETIES (30s cooldown)'));
  rows.push(row('                       random positive, negative, or chaotic effect'));
  rows.push(blank());
  rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.dim));
  rows.push(row('  HAZARDS:'));
  rows.push(row('  impurity > 18%   \u2192  columns CONTAMINATE   (fix: purge lines)'));
  rows.push(row('  temp > 87\u00b0C      \u2192  columns OVERHEAT      (fix: reduce heat)'));
  rows.push(row('  overheat + 93\u00b0C  \u2192  column goes OFFLINE   (fix: reduce heat)'));
  rows.push(row('  high reactor load\u2192  chaos events spawn more frequently'));
  rows.push(row('  OFFLINE columns  \u2192  less ethanol + slower progress'));
  rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.dim));
  const dismissText = dismissPrompt
    ? '  [ PRESS ENTER TO BEGIN ]'
    : '  type HELP again to dismiss';
  rows.push(row(dismissText, C.amber));
  rows.push(S('\u255a' + '\u2550'.repeat(W) + '\u255d', C.dim));

  return rows.join('\n');
}

// ── Display builder ───────────────────────────────────────────────────────────
function buildDisplay(gs, order, sessionResults, pilotName, batchNumber) {
  // Help overlay takes priority
  if (gs.showHelp) {
    return buildHelp();
  }

  // Highscore overlay
  if (gs.showHighscore) {
    return buildHighscore(sessionResults, pilotName, batchNumber);
  }

  const rows = [];

  // ── Chaos event overlay ──
  if (gs.chaosEvent) {
    const ev   = gs.chaosEvent;
    const urgC = ev.timeLeft <= 2 ? C.err : C.warn;
    const errW = S('\u2551', C.err);

    const chaosLine = (segs, width = W) => {
      rows.push(errW + inner(segs, width) + errW);
    };

    rows.push(S('\u2554' + '\u2550'.repeat(W) + '\u2557', C.err));
    chaosLine([{ t: P('  !!! EMERGENCY ALERT !!!', W), c: C.err }]);
    chaosLine([{ t: P(`  ${ev.banner}`, W), c: C.white }]);
    rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.err));
    chaosLine([{ t: ' ' }]);

    if (ev.type === 'type') {
      chaosLine([{ t: '  TYPE: ', c: C.dim }, { t: ev.required, c: C.amber }]);
      chaosLine([{ t: ' ' }]);
      chaosLine([{ t: '  Enter response in CMD prompt below', c: C.dim }]);
    } else if (ev.type === 'choice') {
      ev.choices.forEach(ch => {
        chaosLine([{ t: `  ${ch.key}  `, c: C.amber }, { t: `— ${ch.label}`, c: C.white }]);
      });
      chaosLine([{ t: ' ' }]);
      chaosLine([{ t: '  Enter command in CMD prompt below', c: C.dim }]);
    }

    chaosLine([{ t: ' ' }]);
    chaosLine([{ t: '  TIME REMAINING: ', c: C.dim }, { t: `${ev.timeLeft}s`, c: urgC }]);
    chaosLine([{ t: ' ' }]);
    rows.push(S('\u255a' + '\u2550'.repeat(W) + '\u255d', C.err));
    return rows.join('\n');
  }

  // ── Normal brewing display ──

  // Title
  rows.push(S('\u2554' + '\u2550'.repeat(W) + '\u2557', C.dim));
  rows.push(bline([{ t: '  CHALQUILA REFINERY CONTROL SYSTEM v2.3', c: C.amber }]));
  rows.push(bline([{ t: '  ISD-II CHALLENGE  //  SUBLEVEL 7  //  UNAUTHORIZED', c: C.dim }]));

  // Two-col top separator
  rows.push(h2sep('\u2560', '\u2566', '\u2563', '\u2563'));

  // Order header | Status header
  rows.push(b2line(
    [{ t: '  ORDER', c: C.amber }],
    [{ t: '  DISTILLERY STATUS', c: C.amber }]
  ));

  // Customer | Mash temp
  rows.push(b2line(
    [{ t: '  ' }, { t: P(order.customerLabel, LW - 2), c: C.white }],
    [
      { t: '  MASH TEMP..... ' }, { t: P(gs.mashTemp + 'C', 5), c: tempColor(gs.mashTemp) },
      { t: ' ' }, { html: statBadge(gs.mashTemp, 85, 93), len: 5 },
    ]
  ));

  // Request (word-wrapped) | Pressure
  const reqLines = wrapText(order.request.replace(/"/g, ''), LW - 3);
  rows.push(b2line(
    [{ t: '  ' }, { t: P(reqLines[0] || '', LW - 3), c: C.dim }],
    [
      { t: '  PRESSURE...... ' }, { t: P(gs.pressure + '%', 5), c: pressColor(gs.pressure) },
      { t: ' ' }, { html: statBadge(gs.pressure, 65, 80), len: 5 },
    ]
  ));

  rows.push(b2line(
    [{ t: '  ' }, { t: P(reqLines[1] || '', LW - 3), c: C.dim }],
    [
      { t: '  IMPURITY...... ' }, { t: P(gs.impurity.toFixed(0) + '%', 5), c: impColor(gs.impurity) },
      { t: ' ' }, { html: statBadge(gs.impurity, 18, 30), len: 5 },
    ]
  ));

  rows.push(b2line(
    [{ t: '  ' }, { t: P(reqLines[2] || '', LW - 3), c: C.dim }],
    [
      { t: '  REACTOR LOAD.. ' }, { t: P(gs.reactorLoad.toFixed(0) + '%', 5), c: loadColor(gs.reactorLoad) },
      { t: ' ' }, { html: statBadge(gs.reactorLoad, 55, 75), len: 5 },
    ]
  ));

  rows.push(b2line(
    [{ t: '  TARGET: ', c: C.dim }, { t: order.profile.proofLabel, c: C.amber }],
    [{ t: '' }]
  ));

  rows.push(b2line(
    [{ t: '  TOXICITY: ', c: C.dim }, { t: order.profile.toxLabel, c: C.amber }],
    [{ t: '  COLUMNS:', c: C.dim }]
  ));

  for (let i = 0; i < 3; i++) {
    const state = gs.columns[i];
    rows.push(b2line(
      [{ t: '' }],
      [{ t: `  COL ${i + 1}..`, c: C.dim }, { t: state, c: COL_COLOR[state] || C.amber }]
    ));
  }

  // Catalyst / stabilize indicator
  const boostMsg = gs.catalystTicks > 0
    ? `  CATALYST ACTIVE (${gs.catalystTicks}s)`
    : gs.stabilizeBonusTicks > 0
    ? `  STABILIZED (${gs.stabilizeBonusTicks}s)`
    : '';
  rows.push(b2line(
    [{ t: '' }],
    [{ t: boostMsg, c: C.green }]
  ));

  // Two-col bottom separator (╠═══╩═══╣)
  rows.push(h2sep('\u2560', '\u2569', '\u2563', '\u2563'));

  // Batch progress section
  rows.push(bline([{ t: '  BATCH PROGRESS', c: C.amber }]));

  // Ethanol bar
  const ethanolFg = gs.ethanol >= order.profile.proofMin ? C.green : C.warn;
  const ethanolBar = makeBar(gs.ethanol, 68, 18, ethanolFg, C.dim);
  const tgtLabel = order.profile.proofMin + '%' + (order.profile.proofMax ? '' : '+');
  rows.push(bline([
    { t: '  ETHANOL  ' }, { t: P(gs.ethanol.toFixed(0) + '%', 4), c: ethanolFg },
    { t: '  [' }, { ...ethanolBar }, { t: ']' },
    { t: '  TARGET: ' }, { t: tgtLabel, c: C.amber },
  ]));

  // Methanol bar
  const methFg  = gs.methanol <= order.profile.toxMax ? C.ok : C.err;
  const methBar = makeBar(gs.methanol, 50, 18, methFg, C.dim);
  rows.push(bline([
    { t: '  METHANOL ' }, { t: P(gs.methanol.toFixed(1) + '%', 4), c: methFg },
    { t: '  [' }, { ...methBar }, { t: ']' },
    { t: '  MAX:    ' }, { t: order.profile.toxMax + '%', c: C.amber },
  ]));

  // Progress bar
  const progBar  = makeBar(gs.progress, 100, 18, C.amber, C.dim);
  const mins     = Math.floor(gs.tick / 60);
  const secs     = gs.tick % 60;
  const timeStr  = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  rows.push(bline([
    { t: '  PROGRESS ' }, { t: P(gs.progress.toFixed(0) + '%', 4), c: C.amber },
    { t: '  [' }, { ...progBar }, { t: ']' },
    { t: '  TIME:   ' }, { t: timeStr, c: C.dim },
  ]));

  // Crew / explosions status bar
  const crewColor = gs.crewPct >= 80 ? C.ok : gs.crewPct >= 50 ? C.warn : C.err;
  rows.push(bline([
    { t: '  CREW:   ' }, { t: P(gs.crewPct + '%', 4), c: crewColor },
    { t: '    EXPLOSIONS: ' }, { t: String(gs.explosions), c: gs.explosions > 0 ? C.err : C.dim },
  ]));

  // Log
  rows.push(hsep('\u2560', '\u2550', '\u2563'));
  const logLines = [...gs.log];
  while (logLines.length < 4) logLines.unshift('');
  logLines.slice(-4).forEach(line => {
    const isWarn = /WARNING|CRITICAL|!!!|OVERHEATING|CONTAMINATED|OFFLINE/.test(line);
    rows.push(bline([{ t: P(line || ' ', W), c: isWarn ? C.warn : null }]));
  });

  // Advisory hint line
  const hint = getHint(gs, order);
  if (hint) {
    rows.push(bline([{ t: '  \u25c6 ', c: C.amber }, { t: P(hint, W - 4), c: C.dim }]));
  }

  rows.push(S('\u255a' + '\u2550'.repeat(W) + '\u255d', C.dim));
  return rows.join('\n');
}

// ── Boot countdown screen ─────────────────────────────────────────────────────
function buildBootScreen(count) {
  const rows = [];
  const pad = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };
  const row = (content, col = C.dim) => WALL + S(pad(content, W), col) + WALL;

  rows.push(S('\u2554' + '\u2550'.repeat(W) + '\u2557', C.dim));
  rows.push(row('  CHALQUILA REFINERY CONTROL SYSTEM v2.3', C.amber));
  rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.dim));
  rows.push(row(''));
  rows.push(row('  Initializing worm bioreactor...', C.dim));
  rows.push(row('  Pressurizing distillation columns...', C.dim));
  rows.push(row('  Calibrating impurity sensors...', C.dim));
  rows.push(row('  Running pre-batch safety checks...', C.dim));
  rows.push(row(''));
  rows.push(S('\u2560' + '\u2550'.repeat(W) + '\u2563', C.dim));
  rows.push(row(''));
  const barW = 30;
  const filled = Math.round(((5 - count) / 5) * barW);
  const barHtml = S('\u2588'.repeat(filled), C.amber) + S('\u2591'.repeat(barW - filled), C.dim);
  const barLine = WALL + S('  SYSTEMS READY IN ', C.dim) + S(String(count) + 's  [', C.amber) + barHtml + S(']', C.amber) + S(' '.repeat(W - 19 - 4 - barW - 2 - String(count).length), C.dim) + WALL;
  rows.push(barLine);
  rows.push(row(''));
  rows.push(S('\u255a' + '\u2550'.repeat(W) + '\u255d', C.dim));
  return rows.join('\n');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChalquilaRefineryGame({ order, onComplete, sessionResults = [], pilotName = '', batchNumber = 1, showInitialHelp = false }) {
  const preRef   = useRef(null);
  const inputRef = useRef(null);
  const gsRef    = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 'help' → show help screen (first game only), 'booting' → 5s countdown, null → playing
  const [prePhase, setPrePhase] = useState(showInitialHelp ? 'help' : 'booting');
  const [bootCount, setBootCount] = useState(5);

  const render = useCallback(() => {
    if (preRef.current && gsRef.current) {
      preRef.current.innerHTML = buildDisplay(gsRef.current, order, sessionResults, pilotName, batchNumber);
    }
  }, [order, sessionResults, pilotName, batchNumber]);

  // Boot countdown effect — runs when prePhase === 'booting'
  useEffect(() => {
    if (prePhase !== 'booting') return;
    setBootCount(5);
    if (preRef.current) preRef.current.innerHTML = buildBootScreen(5);
    const interval = setInterval(() => {
      setBootCount(prev => {
        const next = prev - 1;
        if (preRef.current) preRef.current.innerHTML = buildBootScreen(next);
        if (next <= 0) {
          clearInterval(interval);
          setPrePhase(null);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [prePhase]);

  // Show help overlay when in help phase
  useEffect(() => {
    if (prePhase === 'help' && preRef.current) {
      preRef.current.innerHTML = buildHelp(/* dismissPrompt */ true);
    }
  }, [prePhase]);

  // Game loop — only starts once prePhase is null
  useEffect(() => {
    if (prePhase !== null) return;
    gsRef.current = initState();
    gsRef.current.toxMax = order.profile.toxMax;
    render();
    inputRef.current?.focus();

    const interval = setInterval(() => {
      const gs = gsRef.current;
      if (!gs || gs.complete) return;
      doTick(gs);
      render();
      if (gs.complete) {
        clearInterval(interval);
        const scores = computeScores(gs, order);
        onCompleteRef.current(scores);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prePhase, order, render]);

  // Keydown: no longer used for choice events (handled via CMD prompt)
  const handleKeyDown = useCallback(_e => {}, []);

  useEffect(() => {
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // CMD input submit
  const handleCmdKey = useCallback(e => {
    if (e.key !== 'Enter') return;
    const input = inputRef.current;
    if (!input) return;
    // Dismiss help screen on any Enter (even empty)
    if (prePhase === 'help') {
      input.value = '';
      setPrePhase('booting');
      return;
    }
    const val = input.value.trim();
    input.value = '';
    if (!val || !gsRef.current || gsRef.current.complete || prePhase !== null) return;
    parseCmd(val, gsRef.current);
    render();
  }, [render, prePhase]);

  return (
    <div className={styles.wrapper}>
      <pre ref={preRef} className={styles.screen} />
      <div className={styles.cmdRow}>
        <span className={styles.cmdPrompt}>CMD&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className={styles.cmdInput}
          onKeyDown={handleCmdKey}
          autoFocus
          placeholder="type command…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
      <div className={styles.helpBar}>
        increase/reduce heat &nbsp;|&nbsp; add/vent pressure &nbsp;|&nbsp;
        add catalyst &nbsp;|&nbsp; purge lines &nbsp;|&nbsp; stabilize core &nbsp;|&nbsp;
        <strong>override</strong> &nbsp;|&nbsp; <strong>help</strong> &nbsp;|&nbsp; <strong>highscore</strong>
      </div>
    </div>
  );
}
