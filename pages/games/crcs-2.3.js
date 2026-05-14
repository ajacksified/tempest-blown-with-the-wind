import { useState, useCallback, useRef } from 'react';
import ChalquilaRefineryGame from '../../components/chalquilaRefineryGame';
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

function pickSecondaryObjective(profile) {
  if (Math.random() > 0.60) return null; // 40% of orders have no secondary objective
  const isLowTox = profile && profile.toxMax <= 5;
  // Objectives that conflict with low-toxicity primary goals
  const METHANOL_MODIFIERS = ['preferred_side_effects', 'tolerance_questionable', 'tolerance_strong', 'tolerance_immune'];
  const pool = isLowTox
    ? SECONDARY_OBJECTIVES.filter(o => !METHANOL_MODIFIERS.includes(o.id))
    : SECONDARY_OBJECTIVES;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
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
    '"I lost my ewok and now I need to find another one."',
  ],
  smooth:      [
    '"Something for the officer\'s mess. Something... plausible."',
    '"A Major told me this was tradition?"',
    '"I was told to ask for the smooth one."',
  ],
  smoky:       [
    '"The smoky kind. Like the Warrior batch, but legal-adjacent."',
    '"Something that tastes like it has a history."',
    '"Help me remember my first kill."',
  ],
  extreme:     [
    '"No questions. Just make it."',
    '"I have no remaining fear of death. Surprise me."',
    '"Last drink before the Phoenix."',
  ],
  any:         [
    '"Surprise me."',
    '"Whatever you have. It\'s been a week."',
    '"The Admiral said to get \'something nice.\' I trust you."',
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
    customerTitle: 'WARFARE OFFICER',
    isVIP: true,
    request: '"Something that doesn\'t taste like engine coolant. Please."',
    profile: PROFILES.smooth,
    secondaryObjective: null,
  },
  {
    customerLabel: 'FA John T. Clark',
    customerTitle: 'STRATEGIC OPERATIONS OFFICER',
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
    secondaryObjective: pickSecondaryObjective(profile),
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
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getQualityText(scores) {
  const { quality, finalEthanol, profile, producedFlavor, flavorMatch } = scores;
  const inRange = finalEthanol >= profile.proofMin && (!profile.proofMax || finalEthanol <= profile.proofMax);
  // Flavor mismatch overrides quality rating
  if (flavorMatch === false) {
    if (profile.flavor === 'smoky')  return pick([
      '"Expected something smoky. This tastes like water. Fancy water."',
      '"I ordered smoke. I received disappointment."',
      '"Where is the char? I wanted it Silwar-style."',
    ]);
    if (profile.flavor === 'sweet')  return pick([
      '"Too aggressive. I asked for smooth, not a reactor flush."',
      '"This is harsh. I said smooth. These are different words."',
      '"Did you even read the order?"',
    ]);
    if (profile.flavor === 'harsh')  return pick([
      '"This is somehow pleasant. That is not what I ordered."',
      '"I asked for something that fights back. This is cooperative."',
      '"Too refined. I needed something that bites."',
    ]);
  }
  if (flavorMatch === true) {
    if (profile.flavor === 'smoky')  return pick([
      '"Has that characteristic bite. Exactly right."',
      '"Smoky finish. You actually read the brief."',
      '"I can taste the column failures. Artisanal."',
    ]);
    if (profile.flavor === 'sweet')  return pick([
      '"Remarkably smooth for a bioreactor product."',
      '"Almost civilized. Well done."',
      '"I forgot this came from a refinery. Briefly."',
    ]);
    if (profile.flavor === 'harsh')  return pick([
      '"Appropriately unpleasant. Well done."',
      '"It tried to escape the glass. Outstanding."',
      '"My sinuses have filed a formal complaint. 10/10."',
    ]);
  }
  if (quality >= 90 && inRange) return pick([
    '"Exceptional. Do not tell the Admiral."',
    '"This cannot have come from this facility."',
    '"I am genuinely concerned about how good this is."',
    '"Forwarding to Fleet Command. For research."',
  ]);
  if (quality >= 80) return pick([
    '"Surprisingly smooth for a reactor byproduct."',
    '"Better than expected. Lower your expectations next time."',
    '"A credit to the refinery. That refinery, specifically."',
    '"I would order this again, under duress."',
  ]);
  if (quality >= 65 && inRange) return pick([
    '"Within acceptable parameters. Barely."',
    '"It meets the minimum. So does gravity."',
    '"Adequate. The Empire asks for nothing more."',
    '"Drinkable. We have low standards and this clears them."',
  ]);
  if (quality >= 50) return pick([
    '"Technically drinkable."',
    '"Imperial regulations do not explicitly prohibit this."',
    '"No one died during tasting. Progress."',
    '"I have consumed worse. Not recently."',
  ]);
  if (quality >= 35) return pick([
    '"We have had stronger opinions about paint thinner."',
    '"I have regrets. About this, specifically."',
    '"This is a cry for help in liquid form."',
    '"The aftertaste has an aftertaste."',
  ]);
  return pick([
    '"This is coolant."',
    '"What did you do?!"',
    '"Medical is on standby. For everyone."',
    '"I am filing this under weapons."',
    '"Fleet liability paperwork incoming."',
  ]);
}

function getMedicalText(scores) {
  const { finalMethanol, profile } = scores;
  if (finalMethanol <= profile.toxMax * 0.3) return pick([
    '"Within acceptable parameters. Barely."',
    '"Toxicology gives a reluctant thumbs up."',
    '"Cleaner than expected. Suspicious."',
    '"Fleet Medical has no objections. First time."',
  ]);
  if (finalMethanol <= profile.toxMax) return pick([
    '"Approved for consumption. With reservations."',
    '"Technically safe. Technically."',
    '"Within limits. We are not happy about it."',
    '"Pilots have consumed worse. We checked."',
  ]);
  if (finalMethanol <= profile.toxMax * 1.5) return pick([
    '"Please stop serving this to pilots."',
    '"Methanol trending concerning. Please advise."',
    '"We are updating the waiver forms."',
    '"Two pilots have requested eye exams."',
  ]);
  if (finalMethanol <= profile.toxMax * 2.5) return pick([
    '"Recommend immediate stomach pump availability."',
    '"This batch has been flagged in three systems."',
    '"Medical bay is at capacity. Relatedly."',
    '"We are not angry, just disappointed and legally obligated to report this."',
  ]);
  return pick([
    '"This is a controlled substance."',
    '"We have contacted the relevant authorities."',
    '"This batch has been classified."',
    '"Do not serve this. Do not store this. Dispose responsibly."',
  ]);
}

function getEngineeringText(scores) {
  const { stability, explosions } = scores;
  if (explosions > 2) return pick([
    '"How is anyone still alive?"',
    '"Structural assessment: significantly less structure."',
    '"We have submitted a requisition for a new refinery."',
    '"Insurance claim filed. Again."',
  ]);
  if (explosions > 0) return pick([
    `"${explosions} explosion(s). Reactor survived. Barely."`,
    `"${explosions} unplanned detonation(s). The walls disagree."`,
    '"Something exploded. We are choosing to call it a feature."',
  ]);
  if (stability >= 80) return pick([
    '"Reactor nominal. Suspicious."',
    '"No anomalies detected. Reviewing sensor data for errors."',
    '"Engineering has nothing to report. Unnerving."',
    '"Reactor is fine. We are not used to this."',
  ]);
  if (stability >= 60) return pick([
    '"Reactor survived. We are choosing not to ask how."',
    '"Structurally intact. Philosophically shaken."',
    '"Most systems are functional. Most."',
    '"The reactor is stable. The crew is less so."',
  ]);
  if (stability >= 40) return pick([
    '"Three near-misses is three too many."',
    '"We have replaced four pressure gauges and one engineer."',
    '"Reactor did not explode. Setting the bar low."',
    '"The alarms were not decorative. We need to have a talk."',
  ]);
  return pick([
    '"Please submit a full damage report."',
    '"We have submitted a full damage report on your behalf."',
    '"Engineering recommends a career change."',
    '"The refinery would like to file a restraining order."',
  ]);
}

function getCustomerText(scores) {
  const { quality, toxScore, finalEthanol, profile } = scores;
  const inRange = finalEthanol >= profile.proofMin;
  if (quality >= 85 && toxScore >= 75) return pick([
    '"Worth the black market price."',
    '"I am telling no one where this came from."',
    '"Ordered again immediately. Discretely."',
    '"This exceeded expectations I did not have."',
  ]);
  if (quality >= 70 && inRange) return pick([
    '"Acceptable for its intended purpose."',
    '"Does the job. Does not overstay its welcome."',
    '"Functional. I respect that."',
    '"Met the brief. Mostly."',
  ]);
  if (toxScore < 20) return pick([
    '"I\'ve gone blind. 5 stars."',
    '"I can no longer see the queue. Problem solved."',
    '"My vision has improved in unexpected ways."',
    '"Did not expect this. Very much did not expect this."',
  ]);
  if (quality < 40) return pick([
    '"This isn\'t what I ordered but I\'m drinking it anyway."',
    '"Not what I asked for. Finishing it regardless."',
    '"I have questions. I am not asking them."',
    '"Technically a beverage."',
  ]);
  return pick([
    '"I can hear colors now."',
    '"Something has changed about my perception of time."',
    '"The queue seems shorter. Everything seems shorter."',
    '"Submitting feedback when my hands stop shaking."',
  ]);
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
  const hasSeenHelpRef = useRef(false);

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
    hasSeenHelpRef.current = false;
    setPhase('login');
  };

  // ── Render playing phase (full-screen game) ──
  if (phase === 'playing' && order) {
    const showInitialHelp = !hasSeenHelpRef.current;
    if (showInitialHelp) hasSeenHelpRef.current = true;
    return (
      <ChalquilaRefineryGame
        order={order}
        onComplete={finalScores => handleGameComplete(finalScores, order)}
        sessionResults={sessionResults}
        pilotName={pilotName}
        batchNumber={batchNumber}
        showInitialHelp={showInitialHelp}
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
