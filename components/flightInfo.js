import T from 'prop-types';
import { useConfig } from '../src/configContext';
import styles from './styles';

export default function FlightInfo({ flight: flightNumber }) {
  const config = useConfig();
  const flight = config.flights[flightNumber - 1];

  return (
    <>
      <h3 id={`flight-${flightNumber}-heading`} style={styles.h3}>
        {`Flight ${flightNumber}: ${flight.name}`}
      </h3>
      <img
        alt={`Flight ${flightNumber} ship`}
        src={`https://tc.emperorshammer.org/images/craft/${flight.ship}.png`}
        style={{ float: 'right', maxWidth: 200, marginLeft: '1rem' }}
      />
      <p style={{ ...styles.p, fontStyle: 'italic', opacity: 0.8 }}>{flight.motto}</p>
    </>
  );
}

FlightInfo.propTypes = {
  flight: T.number.isRequired,
};
