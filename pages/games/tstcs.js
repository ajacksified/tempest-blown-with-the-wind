import { useState, useCallback } from 'react';
import TIEBomberGame from '../../components/TIEBomberGame';
import s from '../../styles/games.module.css';

const TITLE_ART = [
  '\u250c' + '\u2500'.repeat(62) + '\u2510',
  '\u2502' + ' '.repeat(62) + '\u2502',
  "\u2502" + "   EMPEROR'S HAMMER  --  TEMPEST SQUADRON".padEnd(62) + '\u2502',
  '\u2502' + '       TACTICAL COMBAT SIMULATOR v1.0'.padEnd(62) + '\u2502',
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u2502' + '  TIE/ca        (o)[#](o)'.padEnd(62) + '\u2502',
  '\u2502' + '                   |||'.padEnd(62) + '\u2502',
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u2502' + '  X-Wing  \\-X-/   Y-Wing  --[Y]--   A-Wing  /A\\'.padEnd(62) + '\u2502',
  '\u2502' + '           |^|            |=| |=|           |||'.padEnd(62) + '\u2502',
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u2514' + '\u2500'.repeat(62) + '\u2518',
].join('\n');

const GAME_OVER_ART = [
  '',
  '   \u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557',
  '  \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d',
  '  \u2588\u2588\u2551  \u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  ',
  '  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551\u255a\u2588\u2588\u2554\u255d\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d  ',
  '  \u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551 \u255a\u2550\u255d \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557',
  '   \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u255d     \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
  '',
  '   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 ',
  '  \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557',
  '  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d',
  '  \u2588\u2588\u2551   \u2588\u2588\u2551\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d\u2588\u2588\u2554\u2550\u2550\u255d  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557',
  '  \u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d \u255a\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551',
  '   \u255a\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u2550\u2550\u255d  \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d',
  '',
].join('\n');

export default function TSTCSPage() {
  const [phase, setPhase] = useState('login');
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
        <div className={s.terminal}>

          {phase === 'login' && (
            <div>
              <pre className={s.titlePre}>{TITLE_ART}</pre>
              <p className={s.missionText}>
                MISSION BRIEFING: Defend the ISDII Challenge against Rebel starfighter attacks.
                Pilot a Tempest-class TIE Bomber and eliminate all targets.
              </p>
              <p className={s.controlsText}>
                CONTROLS: &larr; &rarr; to move &nbsp;|&nbsp; SPACE or &uarr; to fire &nbsp;|&nbsp; ENTER to launch torpedo / space bomb
              </p>
              <form onSubmit={handleLogin} className={s.loginForm}>
                <span>ENTER PILOT ID:</span>
                <input
                  type="text"
                  value={pilotId}
                  onChange={e => setPilotId(e.target.value)}
                  placeholder="e.g. 12345"
                  className={s.input}
                  autoFocus
                />
                <button type="submit" className={s.btn}>[ LAUNCH ]</button>
              </form>
              {error && <p className={s.error}>{error}</p>}
            </div>
          )}

          {phase === 'loading' && (
            <div>
              <p className={s.loadingHeading}>CONTACTING IMPERIAL DATABASES...</p>
              <p className={s.loadingDetail}>Retrieving pilot record for ID: {pilotId}</p>
            </div>
          )}

          {phase === 'gameover' && (
            <div>
              <pre className={s.gameOverPre}>{GAME_OVER_ART}</pre>
              <pre className={s.scorePre}>{[
                '\u2550'.repeat(46),
                `  PILOT:       ${pilotName}`,
                `  FINAL SCORE: ${String(finalScore).padStart(6, '0')}`,
                '\u2550'.repeat(46),
              ].join('\n')}</pre>
              <button onClick={handlePlayAgain} className={`${s.btn} ${s.btnPrimary}`}>
                [ PLAY AGAIN ]
              </button>
            </div>
          )}

        </div>
      )}
    </>
  );
}
