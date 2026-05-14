import { useRef, useEffect } from 'react';
import T from 'prop-types';
import styles from './styles';

export default function EditableField({ value, onInput, label, ddStyle }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div style={{ marginBottom: '0.25em' }}>
      <dt style={{ display: 'inline', ...styles.listItemLabel }}>{label}</dt>
      <dd
        ref={ref}
        style={{ ...ddStyle, outline: 'none', paddingLeft: '0.4em', display: 'inline-block', minWidth: '4em' }}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onInput(e.currentTarget.textContent)}
      />
      <br />
    </div>
  );
}

EditableField.propTypes = {
  value: T.string,
  onInput: T.func.isRequired,
  label: T.string.isRequired,
  ddStyle: T.object,
};

EditableField.defaultProps = {
  value: '',
  ddStyle: {},
};
