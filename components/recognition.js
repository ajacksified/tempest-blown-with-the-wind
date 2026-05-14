import T from 'prop-types';
import { rankImages, ranks } from './ranks';
import MedalCase from './medalCase';
import Link from './link';
import styles from './styles';

export default function Recognition({ activityData }) {
  const promotions = activityData.filter(
    (p) => p.activity?.NEW_PROMOTION?.length,
  );
  const awards = activityData.filter(
    (p) => p.activity?.MEDALS_AWARDED && Object.keys(p.activity.MEDALS_AWARDED).length,
  );

  if (!promotions.length && !awards.length) return null;

  return (
    <section id="recognition" aria-labelledby="recognition-heading" style={styles.sectionBlock}>
      <p id="recognition-heading" style={styles.sectionPrefix}>[SOO] SERVICE RECORD UPDATE</p>

      {promotions.length > 0 && (
        <section aria-labelledby="promotions-heading" style={{ marginBottom: '2rem' }}>
          {promotions.map((pilot) => {
            const RankImage = rankImages[pilot.rank];
            return (
              <article key={pilot.PIN} style={styles.promotionCard}>
                <h4 style={styles.h4}>
                  {RankImage && <RankImage />}
                  <Link
                    href={`https://tc.emperorshammer.org/record.php?pin=${pilot.PIN}&type=profile`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ position: 'relative', bottom: '7px' }}
                  >
                    {`${ranks[pilot.rank] ? ranks[pilot.rank].toUpperCase() : pilot.rank} ${pilot.name}`}
                  </Link>
                  <span style={{ position: 'relative', bottom: '7px', color: styles.green }}>
                    {' // PROMOTED'}
                  </span>
                </h4>
                {pilot.activity.NEW_PROMOTION.map((pr) => (
                  <p key={pr.rankShorthand} style={{ margin: '.25rem 0' }}>
                    {`Promoted to ${pr.rankShorthand}`}
                  </p>
                ))}
              </article>
            );
          })}
        </section>
      )}

      {awards.length > 0 && (
        <section aria-labelledby="medals-heading">
          <h3 id="medals-heading" style={styles.h3}>Medals Awarded</h3>
          <ul style={ styles.list }>
            {awards.map((pilot) => (
              <li key={pilot.PIN} style={ styles.listItem }>
                <Link
                  href={`https://tc.emperorshammer.org/record.php?pin=${pilot.PIN}&type=profile`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.listItemLink}
                >
                  {`${ranks[pilot.rank] ? ranks[pilot.rank].toUpperCase() : pilot.rank} ${pilot.name}`}
                </Link>
                {': '}
                {Object.entries(pilot.activity.MEDALS_AWARDED)
                  .map(([medal, count]) => `${count}× ${medal}`)
                  .join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

Recognition.propTypes = {
  activityData: T.arrayOf(T.shape({
    PIN: T.number.isRequired,
    name: T.string.isRequired,
    rank: T.string.isRequired,
    activity: T.object,
  })).isRequired,
};
