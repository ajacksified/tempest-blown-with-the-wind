import T from 'prop-types';
import config from '../config';
import styles from './styles';

export default function FlightInfo({
  flight: flightNumber,
}) {
  const flight = config.flights[flightNumber - 1];

  return (
    <>
      <img
        alt={`Flight ${flight} ship`}
        src={`https://tc.emperorshammer.org/images/craft/${flight.ship}.png`}
        style={{ float: 'right', maxWidth: 200 }}
      />

      <h2>{`Flight ${flightNumber}: ${flight.name}`}</h2>
      <p style={styles.p}><em>{flight.motto}</em></p>
    </>
  );
}

FlightInfo.propTypes = {
  flight: T.number.isRequired,
};
