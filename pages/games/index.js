import Link from 'next/link';
import s from '../../styles/games.module.css';

const HEADER = [
  '\u250c' + '\u2500'.repeat(62) + '\u2510',
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u2502' + "   EMPEROR'S HAMMER  --  TEMPEST SQUADRON".padEnd(62) + '\u2502',
  '\u2502' + '         IMPERIAL GAMES TERMINAL  v1.0'.padEnd(62) + '\u2502',
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u251c' + '\u2500'.repeat(62) + '\u2524',
  '\u2502' + '  SELECT PROGRAM:'.padEnd(62) + '\u2502',
  '\u2502' + ' '.repeat(62) + '\u2502',
].join('\n');

const FOOTER = [
  '\u2502' + ' '.repeat(62) + '\u2502',
  '\u2514' + '\u2500'.repeat(62) + '\u2518',
].join('\n');

const GAMES = [
  {
    id:    'tstcs',
    href:  '/games/tstcs',
    label: 'TSTCS',
    title: 'Tempest Squadron Tactical Combat Simulator',
    desc:  'Defend the ISDII Challenge in your TIE Bomber against Rebel starfighters.',
    art:   '(o)[#](o)',
  },
];

export default function GamesIndex() {
  return (
    <div className={s.terminal}>
      <pre className={s.headerPre}>{HEADER}</pre>

      <div className={s.gameList}>
        {GAMES.map(g => (
          <Link key={g.id} href={g.href} className={s.gameLink}>
            <span className={s.gameArt}>{g.art}</span>
            <span className={s.gameName}>{g.label}</span>
            {'  '}
            <span className={s.gameTitle}>{g.title}</span>
            <span className={s.gameDesc}>{g.desc}</span>
          </Link>
        ))}
      </div>

      <pre className={s.footerPre}>{FOOTER}</pre>
    </div>
  );
}
