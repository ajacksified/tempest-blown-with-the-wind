import T from 'prop-types';
import styles from './styles';
import Link from './link';

const DEFAULT_SECTIONS = [
  { id: 'transmission', label: "Commander's Transmission" },
  { id: 'orders', label: 'Orders' },
  { id: 'recognition', label: 'Recognition & Awards' },
  { id: 'activity', label: 'Pilot Activity' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'citations', label: 'Citations' },
];

export default function Nav({ sections = DEFAULT_SECTIONS }) {
  return (
    <nav aria-label="Report sections" style={styles.nav}>
      <strong>{'>> INDEX'}</strong>
      <ul style={{ ...styles.list, margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
        {sections.map((s) => (
          <li key={s.id} style={styles.listItem}>
            <Link style={styles.listItemLink} href={`#${s.id}`}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

Nav.propTypes = {
  sections: T.arrayOf(T.shape({ id: T.string.isRequired, label: T.string.isRequired })),
};
