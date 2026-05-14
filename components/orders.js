import T from 'prop-types';
import Link from './link';
import styles from './styles';
import { useConfig } from '../src/configContext';

export default function Orders({ missions, children }) {
  const { colorHelmetBase } = useConfig();
  const listItemLinkStyle = { ...styles.listItemLink, backgroundColor: colorHelmetBase ?? styles.listItemLink.backgroundColor };
  return (
    <section id="orders" aria-labelledby="orders-heading" style={styles.sectionBlock}>
      <p id="orders-heading" style={styles.sectionPrefix}>[COO] ACTIVE DIRECTIVES</p>

      {children}

      <ul style={{ ...styles.list, marginTop: '0.5rem' }}>
        {missions.map((m) => (
          <li key={m.id} style={styles.listItem}>
            <Link
              href={`https://tc.emperorshammer.org/download.php?id=${m.id}&type=info`}
              target="_blank"
              rel="noreferrer"
              style={listItemLinkStyle}
            >
              {m.name}
            </Link>
            {` ${m.title}`}
          </li>
        ))}
      </ul>
    </section>
  );
}

Orders.propTypes = {
  missions: T.arrayOf(T.shape({
    name: T.string.isRequired,
    id: T.number.isRequired,
    title: T.string.isRequired,
  })).isRequired,
  children: T.node,
};

Orders.defaultProps = {
  children: null,
};
