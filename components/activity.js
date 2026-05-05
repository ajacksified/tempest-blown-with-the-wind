import { Fragment } from 'react';
import T from 'prop-types';
import PilotActivity from './pilotActivity';
import FlightInfo from './flightInfo';
import styles from './styles';

/* eslint react/jsx-props-no-spreading: 0 */

export default function Activity({ activity }) {
  const flightNumbers = activity.map((a) => (((a.sqnSlot - 1) / 4) >> 0) + 1);

  return (
    <section id="activity" aria-labelledby="activity-heading" style={styles.sectionBlock}>
      <p id="activity-heading" style={styles.sectionPrefix}>[CMDR] PILOT ACTIVITY LOG</p>

      {activity.map((a, i) => {
        const flight = flightNumbers[i];
        const prevFlight = i > 0 ? flightNumbers[i - 1] : 0;

        return (
          <Fragment key={a.PIN}>
            {flight !== prevFlight && (
              <section aria-labelledby={`flight-${flight}-heading`}>
                <FlightInfo flight={flight} />
              </section>
            )}
            <PilotActivity {...a} />
          </Fragment>
        );
      })}
    </section>
  );
}

Activity.propTypes = {
  activity: T.arrayOf(T.shape(PilotActivity.propTypes)).isRequired,
};
