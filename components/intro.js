import T from 'prop-types';
import styles from './styles';
import config from '../config';

export default function Intro({ children, showUniform = true }) {
  return (
    <section id="transmission" aria-labelledby="transmission-heading" style={styles.sectionBlock}>
      <p id="transmission-heading" style={styles.sectionPrefix}>[COMM] TRANSMISSION // PRIORITY: ROUTINE</p>

      {showUniform && (
        <a
          href={`https://tc.emperorshammer.org/record.php?pin=${config.cmdr.pin}&type=profile`}
          target="_blank"
          rel="noreferrer"
        >
          <img
            style={{ width: '100%', maxWidth: '190px', float: 'right', marginLeft: '1rem' }}
            src="https://tempest-blown-with-the-wind.vercel.app/uniform.jpg"
            alt={`The uniform of ${config.cmdr.name}, #${config.cmdr.pin}`}
          />
        </a>
      )}

      {children}
    </section>
  );
}

Intro.propTypes = {
  children: T.node.isRequired,
  showUniform: T.bool,
};

Intro.defaultProps = {
  showUniform: true,
};
