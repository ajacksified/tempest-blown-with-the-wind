import { useState, useCallback } from 'react';
import TIEBomberGame from '../../components/TIEBomberGame';

const FONT = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

const BOX_TOP    = '\u250c' + '\u2500'.repeat(62) + '\u2510'; // ┌──...──┐
const BOX_MID    = '\u2502';                                    // │
const BOX_BOT    = '\u2514' + '\u2500'.repeat(62) + '\u2518'; // └──...──┘

function boxLine(text) {
  const padded = text.padEnd(62);
  return `${BOX_MID} ${padded.slice(0, 61)} ${BOX_MID}`;
}

const TITLE_ART = [
  BOX_TOP,
  boxLine(''),
  boxLine('   EMPEROR\'S HAMMER  --  TEMPEST SQUADRON'),
  boxLine('       TACTICAL COMBAT SIMULATOR v1.0'),
  boxLine(''),
  boxLine('  TIE/ca        (o)[#](o)'),
  boxLine('                   |||'),
  boxLine(''),
  boxLine('  X-Wing  \\-X-/   Y-Wing  --[Y]--   A-Wing  /A\\'),
  boxLine('           |^|            |=| |=|           |||'),
  boxLine(''),
  BOX_BOT,
].join('\n');

const GAME_OVER_ART = [
  '',
  '   ██████╗  █████╗ ███╗   ███╗███████╗',
  '  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝',
  '  ██║  ███╗███████║██╔████╔██║█████╗  ',
  '  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ',
  '  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗',
  '   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝',
  '',
  '   ██████╗ ██╗   ██╗███████╗██████╗ ',
  '  ██╔═══██╗██║   ██║██╔════╝██╔══██╗',
  '  ██║   ██║██║   ██║█████╗  ██████╔╝',
  '  ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗',
  '  ╚██████╔╝ ╚████╔╝ ███████╗██║  ██║',
  '   ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝',
  '',
].join('\n');

const inputStyle = {
  backgroundColor: '#000',
  border: '1px solid #0f0',
  borderRadius: 0,
  color: '#0f0',
  fontFamily: FONT,
  fontSize: '1rem',
  padding: '0.4rem 0.75rem',
  outline: 'none',
  width: '140px',
};

const btnStyle = {
  backgroundColor: '#000',
  border: '1px solid #0f0',
  borderRadius: 0,
  color: '#0f0',
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: '1rem',
  padding: '0.4rem 1rem',
  marginLeft: '0.5rem',
};

const termStyle = {
  color: '#0f0',
  fontFamily: FONT,
};

export default function GamesPage() {
  const [phase, setPhase] = useState('login'); // login | loading | playing | gameover
  const [pilotId, setPilotId] = useState('');
  const [pilotName, setPilotName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const id = pilotId.trim();
    if (!id || !/^\d+$/.test(id)) {
      setError('ERROR: Please enter a valid numeric pilot ID.');
      return;
    }
    setError('');
    setPhase('loading');
    try {
      const res = await fetch(`https://api.emperorshammer.org/pilot/${id}`);
      if (!res.ok) throw new Error(`Pilot ID ${id} not found in Imperial databases.`);
      const data = await res.json();
      const name = data.name || data.label || data.PIN || `Pilot #${id}`;
      setPilotName(name);
      setPhase('playing');
    } catch (err) {
      setError(`ERROR: ${err.message || 'Failed to contact Imperial databases.'}`);
      setPhase('login');
    }
  };

  const handleGameOver = useCallback((score) => {
    setFinalScore(score);
    setPhase('gameover');
  }, []);

  const handlePlayAgain = () => {
    setPilotId('');
    setPilotName('');
    setFinalScore(0);
    setError('');
    setPhase('login');
  };

  return (
    <>
      {phase === 'playing' && (
        <TIEBomberGame pilotName={pilotName} onGameOver={handleGameOver} />
      )}

      {phase !== 'playing' && (
        <div style={termStyle}>

          {/* ── LOGIN ── */}
          {phase === 'login' && (
            <div>
              <pre style={{ color: '#0f0', margin: '0 0 1.5rem 0', lineHeight: '1.35' }}>
                {TITLE_ART}
              </pre>
              <p style={{ margin: '0 0 0.25rem 0', color: '#0a0' }}>
                MISSION BRIEFING: Defend Imperial space against endless Rebel starfighter attacks.
                Pilot a TIE Bomber and eliminate all targets. Do not let them reach your position.
              </p>
              <p style={{ margin: '0 0 1.25rem 0', color: '#0a0' }}>
                CONTROLS: ← → Arrow Keys to move &nbsp; | &nbsp; SPACE or ↑ to fire &nbsp; | &nbsp; ENTER to launch torpedo
              </p>
              <form onSubmit={handleLogin} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ marginRight: '0.5rem' }}>ENTER PILOT ID:</span>
                <input
                  type="text"
                  value={pilotId}
                  onChange={e => setPilotId(e.target.value)}
                  placeholder="e.g. 12345"
                  style={inputStyle}
                  autoFocus
                />
                <button type="submit" style={btnStyle}>[ LAUNCH ]</button>
              </form>
              {error && (
                <p style={{ color: '#f55', margin: '0.75rem 0 0 0' }}>{error}</p>
              )}
            </div>
          )}

          {/* ── LOADING ── */}
          {phase === 'loading' && (
            <div>
              <p style={{ color: '#ff0' }}>
                CONTACTING IMPERIAL DATABASES...
              </p>
              <p style={{ color: '#0a0' }}>
                Retrieving pilot record for ID: {pilotId}
              </p>
            </div>
          )}

          {/* ── GAME OVER ── */}
          {phase === 'gameover' && (
            <div>
              <pre style={{ color: '#f55', margin: '0 0 0.5rem 0', lineHeight: '1.2' }}>
                {GAME_OVER_ART}
              </pre>
              <pre style={{ color: '#0f0', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>{[
                '\u2550'.repeat(46),
                `  PILOT:       ${pilotName}`,
                `  FINAL SCORE: ${String(finalScore).padStart(6, '0')}`,
                '\u2550'.repeat(46),
              ].join('\n')}</pre>
              <button onClick={handlePlayAgain} style={{ ...btnStyle, marginLeft: 0 }}>
                [ PLAY AGAIN ]
              </button>
            </div>
          )}

        </div>
      )}
    </>
  );
}
