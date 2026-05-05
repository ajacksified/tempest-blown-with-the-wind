import {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';
import styles from '../components/styles';

export default function Document() {
  return (
    <Html>
      <Head />
      <body style={styles.body}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
