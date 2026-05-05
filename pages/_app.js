/* eslint react/jsx-props-no-spreading: 0, react/forbid-prop-types: 0 */

import T from 'prop-types';
import styles from '../components/styles';

function MyApp({ Component, pageProps }) {
  return (
    <article style={styles.article}>
      <Component {...pageProps} />
    </article>
  );
}

MyApp.propTypes = {
  Component: T.any.isRequired,
  pageProps: T.object.isRequired,
};

export default MyApp;
