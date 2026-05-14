import Link from 'next/link';
import s from '../styles/games.module.css';

const TEMPEST_ART = `
  _____  _____ __  __ _____  ______  _____ _______ 
 |_   _||  ___|  \\/  |  __ \\|  ____|/ ____|__   __|
   | |  | |__ | \\  / | |__) | |__  | (___    | |   
   | |  |  __|| |\\/| |  ___/|  __|  \\___ \\   | |   
  _| |_ | |___| |  | | |    | |____ ____) |  | |   
 |_____||_____|_|  |_|_|    |______|_____/   |_|   
`.trimStart();

const WIDTH = 62;

const box = (...lines) => [
  '┌' + '─'.repeat(WIDTH) + '┐',
  ...lines.map((l) => '│' + l.padEnd(WIDTH) + '│'),
  '└' + '─'.repeat(WIDTH) + '┘',
].join('\n');

const HEADER = box(
  '',
  "   EMPEROR'S HAMMER  //  TEMPEST SQUADRON ",
  '   IMPERIAL INTRANET NODE  --  WING X, ISDII CHALLENGE',
  '',
);

const FOOTER = box(
  '   developed by GN Silwar Naiilo #12630',
  '',
);

const LINKS = [
  {
    href: '/reportgen',
    art:  '[RPT]',
    label: 'REPORTGEN',
    title: 'Squadron Report Generator',
    desc:  'Compose and export formatted squadron activity reports.',
  },
  {
    href: '/games',
    art:  '[GAM]',
    label: 'GAMES',
    title: 'Imperial Games Terminal',
    desc:  'Combat simulators and tactical training programs.',
  },
];

export default function Index() {
  return (
    <div className={s.terminal} style={{ padding: '1rem' }}>
      <pre className={s.titlePre} style={{ color: '#0f0', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {TEMPEST_ART}
      </pre>

      <pre className={s.headerPre}>{HEADER}</pre>

      <div className={s.gameList}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={s.gameLink}>
            <span className={s.gameArt}>{l.art}</span>
            <span className={s.gameName}>{l.label}</span>
            {'  '}
            <span className={s.gameTitle}>{l.title}</span>
            <span className={s.gameDesc}>{l.desc}</span>
          </Link>
        ))}
      </div>

      <pre className={s.footerPre}>{FOOTER}</pre>
    </div>
  );
}
