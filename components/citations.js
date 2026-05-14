import T from 'prop-types';
import Link from './link';
import styles from './styles';
import { useConfig } from '../src/configContext';

export default function Citations({ citations, citationsChange, children }) {
  const config = useConfig();
  return (
    <section id="citations" aria-labelledby="citations-heading" style={styles.sectionBlock}>
      <p id="citations-heading" style={styles.sectionPrefix}>[TAC] SQUADRON CITATION RECORD</p>

      <p style={styles.p}>
        <strong>{`Current Citations: ${citations.length} (${citationsChange})`}</strong>
      </p>

      <ul style={styles.list}>
        {citations.map((c) => <li key={c} style={styles.listItem}>{c}</li>)}
      </ul>

      {children}

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

Citations.propTypes = {
  citations: T.arrayOf(T.string).isRequired,
  citationsChange: T.string,
  children: T.node,
};

Citations.defaultProps = {
  citationsChange: '+0',
  children: null,
};
