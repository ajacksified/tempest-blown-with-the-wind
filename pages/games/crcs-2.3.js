import { useState, useCallback } from 'react';
import ChalquilaRefineryGame from '../../components/ChalquilaRefineryGame';
import s from '../../styles/games.module.css';

// ── Secondary objectives ──────────────────────────────────────────────────────
const SECONDARY_OBJECTIVES = [
  { id: 'fast_delivery',          label: 'PRIORITY: FAST DELIVERY',          note: 'Bonus +20 speed if delivered under 100 seconds.' },
  { id: 'tolerance_questionable', label: 'CLIENT TOLERANCE: QUESTIONABLE',   note: 'Methanol limit effectively +50% for this order.' },
  { id: 'tolerance_strong',       label: 'CLIENT TOLERANCE: STRONG',         note: 'Methanol limit effectively +150% for this order.' },
  { id: 'tolerance_immune',       label: 'CLIENT TOLERANCE: IMMUNE',         note: 'Methanol will not be penalized. Do not ask why.' },
  { id: 'preferred_side_effects', label: 'PREFERRED SIDE EFFECTS: YES',      note: 'Elevated methanol desired. Aim above the limit.' },
  { id: 'consistency',            label: 'PRIORITY: CONSISTENCY',            note: 'Stability x1.4. Bonus +10 if stability >= 70.' },
  { id: 'discretion',             label: 'PRIORITY: DISCRETION',             note: 'No explosions: +15. Each explosion: \u221212 points.' },
  { id: 'squadron_party',         label: 'PRIORITY: SQUADRON SUPPLY',        note: 'The squadron is waiting. Complete before 90s. +25.' },
  { id: 'fleet_party',            label: 'PRIORITY: MASS PRODUCTION',        note: 'Reach 100% progress before 90s. Fleet is waiting.' },
];

function pickSecondaryObjective() {
  if (Math.random() > 0.60) return null; // 40% of orders have no secondary objective
  return SECONDARY_OBJECTIVES[Math.floor(Math.random() * SECONDARY_OBJECTIVES.length)];
}

// ── VIP customers ─────────────────────────────────────────────────────────────
const PROFILES = {
  high_proof: { proofMin: 58, proofLabel: 'HIGH PROOF',    toxMax: 12, toxLabel: 'MODERATE',     flavor: 'harsh'    },
  smooth:     { proofMin: 48, proofMax: 54, proofLabel: 'MEDIUM PROOF', toxMax: 5, toxLabel: 'LOW TOXICITY', flavor: 'sweet' },
  refined:    { proofMin: 50, proofMax: 55, proofLabel: 'MEDIUM PROOF', toxMax: 4, toxLabel: 'LOW TOXICITY', flavor: 'sweet' },
  extreme:    { proofMin: 62, proofLabel: 'EXTREME PROOF',  toxMax: 15, toxLabel: 'WHATEVER',     flavor: 'any'      },
  any:        { proofMin: 48, proofLabel: 'ANY PROOF',      toxMax: 15, toxLabel: 'ANY',           flavor: 'any'      },
  smoky:      { proofMin: 52, proofLabel: 'HIGH PROOF',     toxMax: 10, toxLabel: 'MODERATE',     flavor: 'smoky'    },
};

const QUOTES = {
  high_proof:  [
    '"Something strong enough to forget multiplayer queue times."',
    '"Pre-battle nerves. Make it count."',
    '"Don\'t ask questions. Just pour."',
    '"I lost a bet and now I need to win another one."',
  ],
  smooth:      [
    '"Something for the officer\'s mess. Something... plausible."',
    '"First posting. Is this traditional?"',
    '"I was told to ask for the smooth one."',
  ],
  smoky:       [
    '"The smoky kind. Like the Warrior batch, but legal-adjacent."',
    '"Something that tastes like it has a history."',
  ],
  extreme:     [
    '"No questions. Just make it."',
    '"I have no remaining fear of death. Surprise me."',
    '"I lost a bet."',
  ],
  any:         [
    '"Surprise me."',
    '"Whatever you have. It\'s been a week."',
    '"The Admiral said to get \'something nice.\' Figure it out."',
  ],
};

const VIP_CUSTOMERS = [
  {
    customerLabel: 'GA Rapier',
    customerTitle: 'FLEET COMMANDER',
    isVIP: true,
    request: '"Chalquilla is spelled with one "l"."',
    profile: PROFILES.refined,
    secondaryObjective: SECONDARY_OBJECTIVES.find(o => o.id === 'discretion'),
  },
  {
    customerLabel: 'HA Plif',
    customerTitle: 'TIE CORPS COMMANDER',
    isVIP: true,
    request: '"I have a CMDR meeting tomorrow to get through."',
    profile: PROFILES.high_proof,
    secondaryObjective: SECONDARY_OBJECTIVES.find(o => o.id === 'fast_delivery'),
  },
  {
    customerLabel: 'FA Phoenix Berkana',
    customerTitle: 'WING COMMANDER',
    isVIP: true,
    request: '"Something that doesn\'t taste like engine coolant. Please."',
    profile: PROFILES.smooth,
    secondaryObjective: null,
  },
  {
    customerLabel: 'FA John T. Clark',
    customerTitle: 'SYSTEMS OPERATIONS OFFICER',
    isVIP: true,
    request: '"I\'ve audited the worm bioreactor logs. Technically this is sanctioned."',
    profile: PROFILES.any,
    secondaryObjective: SECONDARY_OBJECTIVES.find(o => o.id === 'tolerance_immune'),
  },
  {
    customerLabel: 'VA Colo Delste',
    customerTitle: 'COMBAT OPERATIONS OFFICER',
    isVIP: true,
    request: '"Pre-op tradition. The whole Aggressor does a shot."',
    profile: PROFILES.high_proof,
    secondaryObjective: SECONDARY_OBJECTIVES.find(o => o.id === 'fleet_party'),
  },
];

// ── Order generation ──────────────────────────────────────────────────────────
function pickProfile() {
  const keys = Object.keys(PROFILES);
  return PROFILES[keys[Math.floor(Math.random() * keys.length)]];
}

function makeOrder(pilot) {
  const profile = pickProfile();
  const quotePool = QUOTES[profile.flavor] || QUOTES.any;
  const request   = quotePool[Math.floor(Math.random() * quotePool.length)];
  return {
    customerLabel: pilot.label || pilot.name || 'Unknown Pilot',
    customerTitle: null,
    isVIP: false,
    request,
    profile,
    secondaryObjective: pickSecondaryObjective(),
  };
}

function generateOrder(tempestPilots, otherPilots) {
  const roll = Math.random();
  if (roll < 0.05 && VIP_CUSTOMERS.length) {
    return { ...VIP_CUSTOMERS[Math.floor(Math.random() * VIP_CUSTOMERS.length)] };
  }
  if (roll < 0.75 && tempestPilots.length) {
    return makeOrder(tempestPilots[Math.floor(Math.random() * tempestPilots.length)]);
  }
  const pool = otherPilots.length ? otherPilots : tempestPilots;
  if (pool.length) return makeOrder(pool[Math.floor(Math.random() * pool.length)]);
  return makeOrder({ label: 'Unknown Pilot', name: 'Unknown Pilot' });
}

// ── Comedy debrief text ───────────────────────────────────────────────────────
function getQualityText(scores) {
  const { quality, finalEthanol, profile, producedFlavor, flavorMatch } = scores;
  const inRange = finalEthanol >= profile.proofMin && (!profile.proofMax || finalEthanol <= profile.proofMax);
  // Flavor mismatch overrides quality rating
  if (flavorMatch === false) {
    if (profile.flavor === 'smoky')  return '"Expected something smoky. This tastes like water. Fancy water."';
    if (profile.flavor === 'sweet')  return '"Too aggressive. I asked for smooth, not a reactor flush."';
    if (profile.flavor === 'harsh')  return '"This is somehow pleasant. That is not what I ordered."';
  }
  if (flavorMatch === true) {
    if (profile.flavor === 'smoky')  return '"Has that characteristic bite. Exactly right."';
    if (profile.flavor === 'sweet')  return '"Remarkably smooth for a bioreactor product."';
    if (profile.flavor === 'harsh')  return '"Appropriately unpleasant. Well done."';
  }
  if (quality >= 90 && inRange) return '"Exceptional. Do not tell the Admiral."';
  if (quality >= 80) return '"Surprisingly smooth for a reactor byproduct."';
  if (quality >= 65 && inRange) return '"Within acceptable parameters. Barely."';
  if (quality >= 50) return '"Technically drinkable."';
  if (quality >= 35) return '"We have had stronger opinions about paint thinner."';
  return '"This is coolant."';
}

function getMedicalText(scores) {
  const { finalMethanol, profile } = scores;
  if (finalMethanol <= profile.toxMax * 0.3) return '"Within acceptable parameters. Barely."';
  if (finalMethanol <= profile.toxMax)       return '"Approved for consumption. With reservations."';
  if (finalMethanol <= profile.toxMax * 1.5) return '"Please stop serving this to pilots."';
  if (finalMethanol <= profile.toxMax * 2.5) return '"Recommend immediate stomach pump availability."';
  return '"This is a controlled substance."';
}

function getEngineeringText(scores) {
  const { stability, explosions } = scores;
  if (explosions > 2)     return '"How is anyone still alive?"';
  if (explosions > 0)     return `"${explosions} explosion(s). Reactor survived. Barely."`;
  if (stability >= 80)    return '"Reactor nominal. Suspicious."';
  if (stability >= 60)    return '"Reactor survived. We are choosing not to ask how."';
  if (stability >= 40)    return '"Three near-misses is three too many."';
  return '"Please submit a full damage report."';
}

function getCustomerText(scores) {
  const { quality, toxScore, finalEthanol, profile } = scores;
  const inRange = finalEthanol >= profile.proofMin;
  if (quality >= 85 && toxScore >= 75) return '"Worth the black market price."';
  if (quality >= 70 && inRange)        return '"Acceptable for its intended purpose."';
  if (toxScore < 20)                   return '"I\'ve gone blind. 5 stars."';
  if (quality < 40)                    return '"This isn\'t what I ordered but I\'m drinking it anyway."';
  return '"I can hear colors now."';
}

function getTitle(scores) {
  const { total, explosions, crew } = typeof scores === 'number'
    ? { total: scores, explosions: 0, crew: 100 }  // backward-compat
    : scores;
  // Conditional titles checked before score-only tiers
  if (explosions >= 4 || crew <= 40)              return 'FLEET LIABILITY';
  if (explosions >= 3 && total >= 40)             return 'INDUSTRIAL MENACE';
  if (total >= 90)                                return 'MASTER DISTILLER';
  if (total >= 72 && explosions === 0 && crew >= 85) return 'RESPECTED OPERATOR';
  if (total >= 75)                                return 'CERTIFIED BOOTLEGGER';
  if (total >= 60)                                return 'ACCEPTABLE';
  if (total >= 45)                                return 'INADVISABLE';
  if (total >= 30)                                return 'BIOHAZARD';
  return 'IMPERIAL EVIDENCE SUBMISSION';
}

// ── Title art ─────────────────────────────────────────────────────────────────
const W = '\u2550'.repeat(62);
const TITLE_ART = [
  '\u2554' + W + '\u2557',
  '\u2551' + ' '.repeat(62) + '\u2551',
  '\u2551' + "   EMPEROR'S HAMMER  --  [ISDII CHALLENGE]".padEnd(62) + '\u2551',
  '\u2551' + '       CHALQUILA REFINERY CONTROL SYSTEM v2.3'.padEnd(62) + '\u2551',
  '\u2551' + ' '.repeat(62) + '\u2551',
  '\u2551' + '   [~]={BOILER}=[FILTER]=[COLUMN]=[STILL]={W}=[~]'.padEnd(62) + '\u2551',
  '\u2551' + '         SUBLEVEL 7  //  UNAUTHORIZED ACCESS'.padEnd(62) + '\u2551',
  '\u2551' + ' '.repeat(62) + '\u2551',
  '\u255a' + W + '\u255d',
].join('\n');

// ── Page component ────────────────────────────────────────────────────────────
export default function RefinePage() {
  const [phase, setPhase]               = useState('login');
  const [pilotId, setPilotId]           = useState('');
  const [pilotName, setPilotName]       = useState('');
  const [error, setError]               = useState('');
  const [order, setOrder]               = useState(null);
  const [scores, setScores]             = useState(null);
  const [tempestPilots, setTempestPilots] = useState([]);
  const [otherPilots, setOtherPilots]   = useState([]);
  const [sessionResults, setSessionResults] = useState([]); // [{order, scores}]
  const [batchNumber, setBatchNumber]   = useState(1);

  // ── Login handler ──
  const handleLogin = async e => {
    e.preventDefault();
    const id = pilotId.trim();
    if (!id || !/^\d+$/.test(id)) {
      setError('ERROR: Please enter a valid numeric pilot ID.');
      return;
    }
    setError('');
    setPhase('loading');

    try {
      // Fetch pilot identity
      const pilotRes = await fetch(`https://api.emperorshammer.org/pilot/${id}`);
      if (!pilotRes.ok) throw new Error(`Pilot ID ${id} not found in Imperial databases.`);
      const pilotData = await pilotRes.json();
      const name = pilotData.name || pilotData.label || `Pilot #${id}`;
      setPilotName(name);

      // Fetch Tempest squadron roster
      let tempest = [];
      try {
        const sqRes  = await fetch('https://api.emperorshammer.org/squadron/45');
        const sqData = await sqRes.json();
        tempest = sqData.pilots || [];
      } catch { /* non-fatal */ }
      setTempestPilots(tempest);

      // Fetch fleet, pick 2 random other squads
      let other = [];
      try {
        const fleetRes  = await fetch('https://api.emperorshammer.org/fleet');
        const fleetData = await fleetRes.json();
        const squadronList = (fleetData.squadrons || []).filter(sq => sq.id !== 45);
        const picks = squadronList.sort(() => Math.random() - 0.5).slice(0, 2);
        const results = await Promise.all(
          picks.map(sq => fetch(`https://api.emperorshammer.org/squadron/${sq.id}`)
            .then(r => r.json()).catch(() => ({ pilots: [] })))
        );
        other = results.flatMap(r => r.pilots || []);
      } catch { /* non-fatal */ }
      setOtherPilots(other);

      const generatedOrder = generateOrder(
        tempest.length ? tempest : [{ label: name }],
        other
      );
      setOrder(generatedOrder);
      setPhase('order');
    } catch (err) {
      setError(`ERROR: ${err.message || 'Failed to contact Imperial databases.'}`);
      setPhase('login');
    }
  };

  const handleAcceptOrder = () => setPhase('playing');

  const handleGameComplete = useCallback((finalScores, currentOrder) => {
    setSessionResults(prev => [...prev, { order: currentOrder, scores: finalScores }]);
    setBatchNumber(n => n + 1);
    setScores(finalScores);
    setPhase('debrief');
  }, []);

  // Next customer: generate a new order and go back to order reveal
  const handleNextCustomer = useCallback(() => {
    const newOrder = generateOrder(
      tempestPilots.length ? tempestPilots : [{ label: pilotName }],
      otherPilots
    );
    setOrder(newOrder);
    setScores(null);
    setPhase('order');
  }, [tempestPilots, otherPilots, pilotName]);

  // End shift: reset everything to login
  const handleEndShift = () => {
    setPilotId('');
    setPilotName('');
    setOrder(null);
    setScores(null);
    setError('');
    setTempestPilots([]);
    setOtherPilots([]);
    setSessionResults([]);
    setBatchNumber(1);
    setPhase('login');
  };

  // ── Render playing phase (full-screen game) ──
  if (phase === 'playing' && order) {
    return (
      <ChalquilaRefineryGame
        order={order}
        onComplete={finalScores => handleGameComplete(finalScores, order)}
        sessionResults={sessionResults}
        pilotName={pilotName}
        batchNumber={batchNumber}
      />
    );
  }

  // ── All other phases in terminal wrapper ──
  return (
    <div className={s.terminalAmber}>

      {/* ── LOGIN ── */}
      {phase === 'login' && (
        <div>
          <pre className={s.titlePreAmber}>{TITLE_ART}</pre>
          <p className={s.missionTextAmber}>
            MISSION BRIEFING: Operate the best Chalquila distillery in the fleet.<br />
            Fulfill orders while managing reactor stability.
          </p>
          <p className={s.missionTextAmber}>
            This facility does not officially exist.
          </p>
          <form onSubmit={handleLogin} className={s.loginForm} style={{ marginTop: '1rem' }}>
            <span>ENTER PILOT ID:</span>
            <input
              type="text"
              value={pilotId}
              onChange={e => setPilotId(e.target.value)}
              placeholder="e.g. 12345"
              className={s.inputAmber}
              autoFocus
            />
            <button type="submit" className={s.btnAmber}>[ BEGIN ]</button>
          </form>
          {error && <p className={s.errorAmber}>{error}</p>}
        </div>
      )}

      {/* ── LOADING ── */}
      {phase === 'loading' && (
        <div>
          <p className={s.loadingHeadingAmber}>CONTACTING IMPERIAL DATABASES...</p>
          <p className={s.loadingDetailAmber}>Retrieving pilot record for ID: {pilotId}</p>
          <p className={s.loadingDetailAmber}>Accessing squadron rosters...</p>
          <p className={s.loadingDetailAmber}>Generating customer order...</p>
        </div>
      )}

      {/* ── ORDER REVEAL ── */}
      {phase === 'order' && order && (
        <div>
          <pre className={s.debriefPre}>{[
            '\u2554' + '\u2550'.repeat(50) + '\u2557',
            '\u2551' + '  INCOMING ORDER'.padEnd(50) + '\u2551',
            '\u2560' + '\u2550'.repeat(50) + '\u2563',
            '\u2551' + `  PILOT: ${order.customerLabel}`.padEnd(50) + '\u2551',
            order.customerTitle
              ? '\u2551' + `  TITLE: ${order.customerTitle}`.padEnd(50) + '\u2551'
              : null,
            '\u2551' + ' '.repeat(50) + '\u2551',
            '\u2551' + '  REQUEST:'.padEnd(50) + '\u2551',
            ...wrapOrderRequest(order.request, 48).map(l =>
              '\u2551' + `  ${l}`.padEnd(50) + '\u2551'
            ),
            '\u2551' + ' '.repeat(50) + '\u2551',
            '\u2560' + '\u2550'.repeat(50) + '\u2563',
            '\u2551' + '  TARGET PROFILE:'.padEnd(50) + '\u2551',
            '\u2551' + `  ${order.profile.proofLabel}`.padEnd(50) + '\u2551',
            '\u2551' + `  ${order.profile.toxLabel}`.padEnd(50) + '\u2551',
            '\u2551' + ' '.repeat(50) + '\u2551',
            ...(order.secondaryObjective ? [
              '\u2560' + '\u2550'.repeat(50) + '\u2563',
              '\u2551' + '  SECONDARY OBJECTIVE:'.padEnd(50) + '\u2551',
              '\u2551' + `  ${order.secondaryObjective.label}`.padEnd(50) + '\u2551',
              '\u2551' + `  ${order.secondaryObjective.note}`.padEnd(50) + '\u2551',
              '\u2551' + ' '.repeat(50) + '\u2551',
            ] : []),
            '\u255a' + '\u2550'.repeat(50) + '\u255d',
          ].filter(Boolean).join('\n')}</pre>
          <button onClick={handleAcceptOrder} className={s.btnAmberPrimary + ' ' + s.btnAmber}>
            [ ACCEPT ORDER — BEGIN DISTILLATION ]
          </button>
        </div>
      )}

      {/* ── DEBRIEF ── */}
      {phase === 'debrief' && scores && (
        <div>
          {scores.specialEnding === 'inspection' && (
            <p className={s.errorAmber} style={{ marginBottom: '1rem' }}>
              OPERATION TERMINATED — DISCIPLINARY ACTION PENDING
            </p>
          )}
          {scores.specialEnding === 'crew_dead' && (
            <p className={s.errorAmber} style={{ marginBottom: '1rem' }}>
              OPERATION TERMINATED — CREW INCAPACITATED
            </p>
          )}
          <pre className={s.debriefPre}>{buildDebriefText(scores, order, pilotName, sessionResults)}</pre>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={handleNextCustomer} className={s.btnAmber} style={{ marginLeft: 0 }}>
              [ NEXT CUSTOMER ]
            </button>
            <button onClick={handleEndShift} className={s.btnAmber} style={{ marginLeft: 0 }}>
              [ END SHIFT ]
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFlavorLine(scores) {
  const { producedFlavor, flavorMatch, profile } = scores;
  const flavorLabel = (producedFlavor || 'neutral').toUpperCase();
  if (profile.flavor === 'any' || flavorMatch === null) return flavorLabel;
  if (flavorMatch === true)  return `${flavorLabel}  [ MATCHES REQUEST \u2714 ]`;
  return `${flavorLabel}  [ REQUEST: ${profile.flavor.toUpperCase()} \u2717 ]`;
}

function wrapOrderRequest(text, maxLen) {
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

function buildDebriefText(scores, order, pilotName, sessionResults = []) {
  const title    = getTitle(scores);
  const IW       = 62; // inner width
  const pad      = (s, n) => { const t = String(s); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };
  const bar      = (val, w = 18) => '\u2588'.repeat(Math.max(0, Math.round((val / 100) * w))) + '\u2591'.repeat(Math.max(0, w - Math.round((val / 100) * w)));
  const row      = content => '\u2551' + pad(content, IW) + '\u2551';
  const sep      = () => '\u2560' + '\u2550'.repeat(IW) + '\u2563';

  const customer  = order ? order.customerLabel : 'UNKNOWN';
  const proofStr  = `${scores.finalEthanol}% ethanol / ${scores.finalMethanol}% methanol`;
  const batchNum  = sessionResults.length;

  // Secondary objective result lines
  const secObj = order?.secondaryObjective;
  const secLines = [];
  if (secObj) {
    secLines.push(sep());
    secLines.push(row(`  SECONDARY OBJECTIVE: ${secObj.label}`));
    if (scores.secAchieved === null) {
      // Always-applied modifier
      secLines.push(row('    STATUS: APPLIED'));
    } else if (scores.secAchieved) {
      const bonusStr = scores.secBonus > 0 ? ` (+${scores.secBonus} points)` : '';
      secLines.push(row(`    STATUS: ACHIEVED${bonusStr}`));
    } else {
      const penStr = scores.secBonus < 0 ? ` (${scores.secBonus} points)` : '';
      secLines.push(row(`    STATUS: MISSED${penStr}`));
    }
  }

  // Session summary line
  let sessionLine = '';
  if (sessionResults.length > 1) {
    const avg = Math.round(sessionResults.reduce((sum, r) => sum + r.scores.total, 0) / sessionResults.length);
    const totalExplosions = sessionResults.reduce((sum, r) => sum + r.scores.explosions, 0);
    sessionLine = `  SESSION (${batchNum} batches): avg ${avg}/100  explosions: ${totalExplosions}`;
  }

  const lines = [
    '\u2554' + '\u2550'.repeat(IW) + '\u2557',
    row(`  CHALQUILA REFINERY \u2014 BATCH #${batchNum} DEBRIEF`),
    sep(),
    row(`  PILOT:     ${pilotName}`),
    row(`  CUSTOMER:  ${customer}`),
    row(`  OUTPUT:    ${proofStr}`),
    row(`  FLAVOR:    ${buildFlavorLine(scores)}`),
    sep(),
    row('  QUALITY ASSESSMENT:'),
    row(`    ${getQualityText(scores)}`),
    row('  FLEET MEDICAL REVIEW:'),
    row(`    ${getMedicalText(scores)}`),
    row('  ENGINEERING ASSESSMENT:'),
    row(`    ${getEngineeringText(scores)}`),
    row('  CUSTOMER FEEDBACK:'),
    row(`    ${getCustomerText(scores)}`),
    ...secLines,
    sep(),
    row(`  CHALQUILA QUALITY   ${bar(scores.quality)}  ${String(scores.quality + '/100').padStart(7)}`),
    row(`  TOXICITY CONTROL    ${bar(scores.toxScore)}  ${String(scores.toxScore + '/100').padStart(7)}`),
    row(`  REACTOR STABILITY   ${bar(scores.stability)}  ${String(scores.stability + '/100').padStart(7)}`),
    row(`  CREW SURVIVAL       ${bar(scores.crew)}  ${String(scores.crew + '/100').padStart(7)}`),
    row(`  DELIVERY SPEED      ${bar(scores.speed)}  ${String(scores.speed + '/100').padStart(7)}`),
    row(`  EXPLOSIONS          ${scores.explosions > 0 ? scores.explosions + ' (IMPRESSIVE)' : '0 (disappointing)'}`),
    sep(),
    row(`  TOTAL SCORE:  ${scores.total}/100   [ ${title} ]`),
    sessionLine ? sep() : null,
    sessionLine ? row(sessionLine) : null,
    '\u255a' + '\u2550'.repeat(IW) + '\u255d',
  ];

  return lines.filter(Boolean).join('\n');
}
