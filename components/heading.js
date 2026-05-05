import T from 'prop-types';
import styles from './styles';
import config from '../config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
  const [year, month, day] = iso.split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

export default function Heading({ reportNumber, submissionDate, statusLine }) {
  return (
    <header style={styles.header}>
      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '.8rem', opacity: 0.7, color: styles.green }}>
        {`${config.squadron} Squadron Report`}
      </p>
      <h1 style={styles.h1}>{config.reportTitleFormat(reportNumber)}</h1>
      <p style={{ margin: '.25rem 0', opacity: 0.85 }}>
        {'Submitted by '}
        <strong>{config.cmdr.title}</strong>
        {submissionDate && (
          <> · <time dateTime={submissionDate}>{formatDate(submissionDate)}</time></>
        )}
      </p>
      {statusLine && (
        <p style={{ margin: '.75rem 0 0', fontSize: '.85rem', opacity: 0.75 }}>{statusLine}</p>
      )}
    </header>
  );
}

Heading.propTypes = {
  reportNumber: T.number.isRequired,
  submissionDate: T.string,
  statusLine: T.string,
};

Heading.defaultProps = {
  submissionDate: null,
  statusLine: null,
};
