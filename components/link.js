import T from 'prop-types';
import styles from './styles';
import { useConfig } from '../src/configContext';

export default function Link({
  children,
  style,
  ...props
}) {
  const { colorHelmetBase } = useConfig();
  const linkColor = colorHelmetBase ?? styles.a.color;
  return (
    <a style={{ ...styles.a, color: linkColor, ...style }} {...props}>{children}</a>
  );
}

/* eslint react/forbid-prop-types: 0 */
Link.propTypes = {
  children: T.node.isRequired,
  style: T.object,
};

Link.defaultProps = {
  style: {},
};
