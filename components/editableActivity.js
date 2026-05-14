import T from 'prop-types';
import { rankImages, ranks } from './ranks';
import Link from './link';
import FlightInfo from './flightInfo';
import EditableField from './editableField';
import styles from './styles';

function EditablePilotActivity({ pilot, activity, onChange }) {
  const { PIN, name, rank } = pilot;
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
        <EditableField label="Comms" value={activity.communication || 'Discord'} ddStyle={styles.dd} onInput={(v) => onChange(PIN, 'communication', v)} />
        <EditableField label="Activity" value={activity.flightActivity || 'None'} ddStyle={styles.dd} onInput={(v) => onChange(PIN, 'flightActivity', v)} />
    <EditableField label="Notes" value={activity.notes || 'N/A'} ddStyle={styles.dd} onInput={(v) => onChange(PIN, 'notes', v)} />
      </dl>
    </article>
  );
}

EditablePilotActivity.propTypes = {
  pilot: T.shape({
    PIN: T.number.isRequired,
    name: T.string.isRequired,
    rank: T.string.isRequired,
  }).isRequired,
  activity: T.shape({
    communication: T.string,
    flightActivity: T.string,
    notes: T.string,
  }).isRequired,
  onChange: T.func.isRequired,
};

export default function EditableActivity({ activityData, pilotActivity, onPilotChange }) {
  if (!activityData.length) {
    return (
      <section id="activity" aria-labelledby="activity-heading" style={styles.sectionBlock}>
        <p id="activity-heading" style={styles.sectionPrefix}>[CMDR] PILOT ACTIVITY LOG</p>
        <p style={{ ...styles.p, color: '#aaa', fontStyle: 'italic' }}>
          Enter dates above and click &quot;Load Data&quot; to populate pilot activity.
        </p>
      </section>
    );
  }

  const flightNumbers = activityData.map((a) => (((a.sqnSlot - 1) / 4) >> 0) + 1);

  return (
    <section id="activity" aria-labelledby="activity-heading" style={styles.sectionBlock}>
      <p id="activity-heading" style={styles.sectionPrefix}>[CMDR] PILOT ACTIVITY LOG</p>
      {activityData.map((pilot, i) => {
        const flight = flightNumbers[i];
        const prevFlight = i > 0 ? flightNumbers[i - 1] : 0;
        return (
          <div key={pilot.PIN}>
            {flight !== prevFlight && (
              <section aria-labelledby={`flight-${flight}-heading`}>
                <FlightInfo flight={flight} />
              </section>
            )}
            <EditablePilotActivity
              pilot={pilot}
              activity={pilotActivity[pilot.PIN] || {}}
              onChange={onPilotChange}
            />
          </div>
        );
      })}
    </section>
  );
}

EditableActivity.propTypes = {
  activityData: T.arrayOf(T.object).isRequired,
  pilotActivity: T.object.isRequired,
  onPilotChange: T.func.isRequired,
};
