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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body style={styles.body}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
