import { omit } from 'lodash/object';
import T from 'prop-types';
import { rankImages, ranks } from './ranks';
import Link from './link';
import activityItem from './activityItem';
import styles from './styles';

// Promotions and medals are rendered in the Recognition section, not here.
const RECOGNITION_KEYS = ['MEDALS_AWARDED', 'NEW_PROMOTION'];

export default function PilotActivity({
  PIN,
  name,
  rank,
  activity,
  communication,
  flightActivity,
  otherActivity,
  notes,
}) {
  const RankImage = rankImages[rank];

  return (
    <article style={styles.pilotCard}>
      <h4 style={styles.h4}>
        {RankImage && <RankImage />}
        <Link
          href={`https://tc.emperorshammer.org/record.php?pin=${PIN}&type=profile`}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'relative', bottom: '7px' }}
        >
          {`${ranks[rank] ? ranks[rank].toUpperCase() : rank} ${name}`}
        </Link>
      </h4>

      <dl style={{ marginTop: '0', marginBottom: '0' }}>
        <dt style={styles.dt}>Comms:</dt>
        <dd style={styles.dd}>{communication || 'None'}</dd>

        {flightActivity && (
          <>
            <dt style={styles.dt}>Activity:</dt>
            <dd style={styles.dd}>{flightActivity}</dd>
          </>
        )}

        {Object.keys(omit(activity, RECOGNITION_KEYS)).map((activityName) => (
          activityItem[activityName]
            ? activityItem[activityName](activity[activityName])
            : null
        ))}

        {otherActivity && (
          <>
            <dt style={styles.dt}>Other:</dt>
            <dd style={styles.dd}>{otherActivity}</dd>
          </>
        )}

        {notes && (
          <>
            <dt style={styles.dt}>Notes:</dt>
            <dd style={styles.dd}>{notes}</dd>
          </>
        )}
      </dl>
    </article>
  );
}

PilotActivity.propTypes = {
  PIN: T.number.isRequired,
  name: T.string.isRequired,
  rank: T.oneOf(Object.keys(ranks)).isRequired,
  activity: T.any.isRequired,
  flightActivity: T.string,
  communication: T.string,
  notes: T.string,
  otherActivity: T.string,
};

PilotActivity.defaultProps = {
  flightActivity: null,
  notes: null,
  otherActivity: null,
  communication: null,
};
