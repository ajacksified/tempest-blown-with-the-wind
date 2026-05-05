import T from 'prop-types';
import Link from './link';
import styles from './styles';
import config from '../config';

const links = [{
  href: 'https://discord.gg/MSxYV8a',
  title: 'TC Discord',
}, {
  href: `https://tc.emperorshammer.org/roster.php?type=sqn&id=${config.squadronId}`,
  title: 'Squadron Page',
}, {
  href: `mailto:${config.cmdr.email}`,
  title: 'Email the CMDR',
}, {
  href: 'https://tc.emperorshammer.org/admin.php',
  title: 'TC Personnel Administration',
}, {
  href: 'https://tc.emperorshammer.org/battlecenter.php',
  title: 'Battle Center',
}, {
  href: `https://tc.emperorshammer.org/showreport.php?id=1&nid=${config.squadronId}`,
  title: 'Report Archive',
}];

export default function Footer({ children }) {
  return (
    <section style={{ ...styles.sectionBlock, opacity: 0.8 }}>
      <p style={styles.sectionPrefix}>[IU] RESOURCES</p>
      <ul style={styles.list}>
        {links.map(({ href, title }) => (
          <li key={href} style={styles.listItem}>
            <Link href={href} target="_blank" rel="noreferrer" style={styles.listItemLink}>{title}</Link>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

Footer.propTypes = {
  children: T.node,
};

Footer.defaultProps = {
  children: null,
};
