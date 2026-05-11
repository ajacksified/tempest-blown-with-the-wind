import { useState, useCallback } from 'react';
import LightsaberGame from '../../components/LightsaberGame';
import s from '../../styles/games.module.css';

const TITLE_ART = [
  '┌' + '─'.repeat(62) + '┐',
  '│' + ' '.repeat(62) + '│',
  '│' + "   EMPEROR'S HAMMER  --  TEMPEST SQUADRON".padEnd(62) + '│',
  '│' + '       LIGHTSABER SPARRING PROGRAM  v1.0'.padEnd(62) + '│',
  '│' + ' '.repeat(62) + '│',
  '│' + '           |        |        |        |'.padEnd(62) + '│',
  '│' + '          [B]      [R]      [G]      [P]'.padEnd(62) + '│',
  '│' + '           |        |        |        |'.padEnd(62) + '│',
  '│' + '       ←BLOCK    ↓PARRY   ↑STRIKE   →LUNGE'.padEnd(62) + '│',
  '│' + ' '.repeat(62) + '│',
  '└' + '─'.repeat(62) + '┘',
].join('\n');

const GAME_OVER_ART = [
  '',
  '  ██████╗ ██╗   ██╗███████╗██╗     ',
  '  ██╔══██╗██║   ██║██╔════╝██║     ',
  '  ██║  ██║██║   ██║█████╗  ██║     ',
  '  ██║  ██║██║   ██║██╔══╝  ██║     ',
  '  ██████╔╝╚██████╔╝███████╗███████╗',
  '  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝',
  '',
  '  ██████╗ ██████╗ ███╗   ██╗███████╗',
  '  ██╔══██╗██╔══██╗████╗  ██║██╔════╝',
  '  ██║  ██║██║  ██║██╔██╗ ██║█████╗  ',
  '  ██║  ██║██║  ██║██║╚██╗██║██╔══╝  ',
  '  ██████╔╝██████╔╝██║ ╚████║███████╗',
  '  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝',
  '',
].join('\n');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function SaberDuelPage() {
  const [phase, setPhase] = useState('login');
  const [pilotId, setPilotId] = useState('');
  const [pilotName, setPilotName] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [finalScore, setFinalScore] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
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
      setPhase('difficulty');
    } catch (err) {
      setError(`ERROR: ${err.message || 'Failed to contact Imperial databases.'}`);
      setPhase('login');
    }
  };

  const handleGameOver = useCallback((score, combo) => {
    setFinalScore(score);
    setHighestCombo(combo);
    setPhase('gameover');
  }, []);

  const handlePlayAgain = () => {
    setFinalScore(0);
    setHighestCombo(0);
    setPhase('difficulty');
  };

  const handleNewPilot = () => {
    setPilotId('');
    setPilotName('');
    setFinalScore(0);
    setHighestCombo(0);
    setError('');
    setPhase('login');
  };

  return (
    <>
      {phase === 'playing' && (
        <LightsaberGame
          pilotName={pilotName}
          difficulty={difficulty}
          onGameOver={handleGameOver}
        />
      )}

      {phase !== 'playing' && (
        <div className={s.terminal}>

          {phase === 'login' && (
            <div>
              <pre className={s.titlePre}>{TITLE_ART}</pre>
              <p className={s.missionText}>
                TRAINING BRIEFING: Hone your lightsaber skills against combat drills choreographed
                to the Imperial March. Block, parry, strike, and lunge in rhythm to build your combo.
              </p>
              <p className={s.controlsText}>
                CONTROLS: ← ↓ ↑ → arrow keys &nbsp;|&nbsp; Hold for extended moves &nbsp;|&nbsp; ESC to pause
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
                <button type="submit" className={s.btn}>[ AUTHENTICATE ]</button>
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

          {phase === 'difficulty' && (
            <div>
              <pre className={s.titlePre}>{TITLE_ART}</pre>
              <p className={s.missionText}>
                PILOT: {pilotName} — SELECT TRAINING INTENSITY:
              </p>
              <div className={s.loginForm} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => { setDifficulty(d); setPhase('playing'); }}
                    className={`${s.btn} ${difficulty === d ? s.btnPrimary : ''}`}
                    style={{ marginLeft: 0 }}
                  >
                    {d === 'EASY' && '[ EASY   ] — Wide timing windows, half the notes, slow scroll'}
                    {d === 'MEDIUM' && '[ MEDIUM ] — Standard windows, most notes, moderate scroll'}
                    {d === 'HARD' && '[ HARD   ] — Tight windows, all notes, fast scroll'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div>
              <pre className={s.gameOverPre}>{GAME_OVER_ART}</pre>
              <pre className={s.scorePre}>{[
                '══════════════════════════════════════════════',
                `  PILOT:         ${pilotName}`,
                `  DIFFICULTY:    ${difficulty}`,
                `  FINAL SCORE:   ${String(finalScore).padStart(8, '0')}`,
                `  HIGHEST COMBO: x${highestCombo}`,
                '══════════════════════════════════════════════',
              ].join('\n')}</pre>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handlePlayAgain} className={`${s.btn} ${s.btnPrimary}`}>
                  [ TRAIN AGAIN ]
                </button>
                <button onClick={handleNewPilot} className={s.btn}>
                  [ CHANGE PILOT ]
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
