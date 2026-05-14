import { useRef, useEffect } from 'react';
import T from 'prop-types';
import styles from './styles';
import { useConfig } from '../src/configContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
  const [year, month, day] = iso.split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

export default function Heading({ title, onTitleChange, submissionDate, statusLine }) {
  const config = useConfig();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== title) {
      ref.current.textContent = title;
    }
  }, [title]);

  return (
    <header style={styles.header}>
      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '.8rem', opacity: 0.7, color: styles.green }}>
        {`${config.squadron} Squadron Report`}
      </p>
      <h1
        ref={ref}
        style={styles.h1}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onTitleChange(e.currentTarget.textContent)}
      />
      <p style={{ margin: '.25rem 0', opacity: 0.85 }}>
        {'Submitted by '}
        <strong>{config.cmdr?.title}</strong>
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
  title: T.string.isRequired,
  onTitleChange: T.func.isRequired,
  submissionDate: T.string,
  statusLine: T.string,
};

Heading.defaultProps = {
  submissionDate: null,
  statusLine: null,
};
