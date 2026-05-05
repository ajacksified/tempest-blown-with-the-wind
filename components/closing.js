import T from 'prop-types';
import styles from './styles';
import config from '../config';

export default function Closing({ children }) {
  return (
    <footer style={styles.footer}>
      <p style={styles.sectionPrefix}>[COMM] CLOSING SIGNAL</p>
      {children}
      <p style={{ marginTop: '1rem' }}>
        {`— ${config.cmdr.title}`}
        <br />
        <span style={{ color: styles.green }}>
          {'>> TRANSMISSION COMPLETE'}
        </span>
      </p>
    </footer>
  );
}

Closing.propTypes = {
  children: T.node.isRequired,
};
