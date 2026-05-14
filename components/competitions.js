import T from 'prop-types';
import Link from './link';
import styles from './styles';
import { useConfig } from '../src/configContext';

export default function Competitions({ competitions }) {
  const config = useConfig();
  const highlightedLinkStyle = { color: config.colorHelmetBase ?? styles.highlightedLink.color };
  return (
    <section id="competitions" aria-labelledby="competitions-heading" style={styles.sectionBlock}>
      <p id="competitions-heading" style={styles.sectionPrefix}>[COO] ACTIVE THEATERS</p>

      <ul>
        {competitions.map((c) => (
          <li key={c.id} style={{ marginBottom: '0.5rem', ...(c.highlight ? { fontWeight: 'bold' } : {}) }}>
            <Link
              href={`https://tc.emperorshammer.org/competitions.php?id=${c.id}`}
              target="_blank"
              rel="noreferrer"
              style={c.highlight ? highlightedLinkStyle : {}}
            >
              {c.name}
            </Link>
            {c.ends && ` — until ${c.ends}`}
            {c.units && ` (${c.units})`}
            {c.notes && (
              <>
                <br />
                <span style={{ fontWeight: 'normal', opacity: 0.85 }}>{c.notes}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <p style={styles.p}>
        <Link
          href={`https://tc.emperorshammer.org/battleboard.php?sqn=${config.squadronId}`}
          target="_blank"
          rel="noreferrer"
        >
          View Squadron Battleboard
        </Link>
      </p>
    </section>
  );
}

Competitions.propTypes = {
  competitions: T.arrayOf(T.shape({
    id: T.string.isRequired,
    name: T.string.isRequired,
    ends: T.string,
    units: T.string,
    highlight: T.bool,
    notes: T.string,
  })).isRequired,
};
