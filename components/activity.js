import { Fragment } from 'react';
import T from 'prop-types';
import Card from './card';
import PilotActivity from './pilotActivity';
import FlightInfo from './flightInfo';

/* eslint react/jsx-props-no-spreading: 0 */

export default function Activity({ activity }) {
  const flightNumbers = activity.map((a) => (((a.sqnSlot - 1) / 4) >> 0) + 1);

  return (
    <Card>
      {activity.map((a, i) => {
        const flight = flightNumbers[i];
        const prevFlight = i > 0 ? flightNumbers[i - 1] : 0;

        return (
          <Fragment key={a.PIN}>
            {flight !== prevFlight && prevFlight > 0 && <Card />}
            {flight !== prevFlight && <FlightInfo flight={flight} />}
            <PilotActivity {...a} />
          </Fragment>
        );
      })}
    </Card>
  );
}

Activity.propTypes = {
  activity: T.arrayOf(T.shape(PilotActivity.propTypes)).isRequired,
};
