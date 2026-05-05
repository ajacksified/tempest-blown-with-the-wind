/* eslint react/no-unescaped-entities: 0 */
import T from 'prop-types';

import Heading from '../../components/heading';
import ReportDates from '../../components/report-dates';
import Intro from '../../components/intro';
import Activity from '../../components/activity';
import Competitions from '../../components/competitions';
import Orders from '../../components/orders';
import Closing from '../../components/closing';
import Footer from '../../components/footer';
import Link from '../../components/link';

import config from '../../config';
import loadActivityData from '../../src/loadSquadronActivityData';

const reportNumber = 25;
const startDate = '2020-12-27';
const endDate = '2021-01-02';
const submissionDate = '2021-01-03';

// TODO new orders
const orders = [{
  name: 'TIE-Free 92',
  id: 271,
  title: 'The Belhassa Marches',
}, {
  name: 'XvT-Free 101',
  id: 807,
  title: 'Stop the Gungan Clones',
}, {
  name: 'XWA-Free 75',
  id: 821,
  title: 'Tarentum on Patrol',
}];

const competitions = [{
  id: '3178',
  name: 'Tempest Squadron Orders',
  ends: '2021-10-01',
  units: 'Tempest Squadron',
  highlight: true,
  notes: 'Complete biweekly missions for iron stars every 2 weeks and at the end of the year!',
}, {
  id: '3216',
  name: 'Stay In the Lines',
  ends: '2021-12-31',
  units: 'Entire TC',
  notes: 'Choose any of the art in Tempests\' WSRs, color it, and email it to Silwar. Awards monthly.',
  highlight: true,
}, {
  id: '3236',
  name: 'January COO Objective Scramble: Squadrons Dogfight',
  ends: '2021-01-31',
  units: 'Entire TC',
  notes: 'Submit your highest kill game in Dogfight mode.',
}, {
  id: '3235',
  name: 'COO\'s Star Wars Challenge Episode VII - 2021',
  ends: '2021-12-31',
  units: 'Entire TC',
  notes: 'Accumulate the most missions in a Star Wars branded approved multiplayer platform. You may submit PvP battles (Legion of Combat) or PvE battles (Legion of Skirmish).',
}, {
  id: '3219',
  name: 'Pimp my TIE',
  ends: '2021-01-31',
  units: 'entire TC',
  notes: 'Create a graphic externall and internally of any TIE fighter',
}, {
  id: '3228',
  name: 'Warrior Banner',
  ends: '2021-01-31',
  units: 'Entire TC',
  notes: 'Design a new banner for the Warrior.',
}, {
  id: '3209',
  name: 'Trivia for the Challenged',
  ends: '2021-12-31',
  units: 'ISD-II Challenge',
  notes: 'Star Wars trivia, run by COL Stryker.',
}, {
  id: '3204',
  name: 'Galactic Linguist',
  ends: '2021-11-31',
  units: 'Entire TC',
  notes: 'Decrypt messages in languages from across the Galaxy.',
}, {
  id: '3154',
  name: 'The TIE Pilot Podcast',
  ends: '2021-12-31',
  units: 'Entire TC',
}];

// TODO update
const ACTIVITY = {
  // Silwar
  12630: {
    communication: 'Email, Discord',
    flightActivity: 'Star Wars Squadrons PvP; hosted PvP shootout',
    otherActivity: 'Working on a 3v3 EHTC Squadrons League',
    notes: '',
  },
  // Marek
  55825: {
    communication: 'None',
    flightActivity: '',
    notes: 'On leave.',
  },
  // Neko
  55783: {
    communication: 'Personal check-ins',
    flightActivity: 'Squadrons PvP',
    notes: 'Several more squadrons wins - and nice work completing XWA-22!',
  },
  // Iam
  55785: {
    communication: 'Personal check-ins',
    flightActivity: 'Squadrons PvP',
    notes: 'Congrats on passing TCCORE and your promotion, and thanks for contributing to TCiB!',
  },

  // Richlet
  4607: {
    communication: 'Discord',
    flightActivity: 'Squadrons PvP',
    notes: 'Great flying, against randoms and in 3v3s.',
  },

  // EchoVII
  55922: {
    communication: 'Discord',
    flightActivity: 'Squadrons PVP',
    notes: 'Impressive Squadrons flying this week! Thanks for doing your part for TCiB.',
  },

  // Empty

  // Kalve
  1968: {
    communication: 'Discord',
    flightActivity: '',
    notes: 'Another quiet week for CPT Kalve.',
  },

  // Phalk
  6874: {
    communication: 'Email, Discord',
    flightActivity: 'XWA missions',
    notes: 'I see you\'re working your way through more XWA. Nice work.',
  },

  // Morgoth
  55942: {
    communication: 'Discord',
    flightActivity: 'Squadrons PvP',
    notes: 'Joined up and flew together that same day. Welcome to Tempest!',
  },
};

function appendActivityData(activityData, additionalActivityData) {
  return activityData.map((ad) => {
    if (additionalActivityData[ad.PIN]) {
      return { ...ad, ...additionalActivityData[ad.PIN] };
    }

    return ad;
  });
}

const SITLEntry = ({ name, image, place = "Runner Up" }) => (
  <>
    <p>
      <b>{`${place}: ${name}`}</b>
    </p>

    <img
      src={`/competitions/stay-in-the-lines/2020-12/${image}`}
      alt={name}
      width="100%"
    />
  </>
);

export default function Report({ activityData }) {
  if (activityData === null) {
    return 'Loading...';
  }

  const activity = appendActivityData(activityData, ACTIVITY);

  return (
    <>
      <Heading reportNumber={reportNumber} />

      <ReportDates
        startDate={startDate}
        endDate={endDate}
        submissionDate={submissionDate}
      />

      {/* Marek replaced with Richlet; Rhygaar out; Morgoth in */}
      {/* CoB to Neko and DFC for me */}

      <Intro showUniform={false}>
        <p>
          <em>
            Silwar docked his TIE Defender in the rafters of the Challenge's main hangar and
            climbed out of the top hatch. Tempest squadron had just returned from a successful
            attack on a Munificent-class frigate; you don't see many of them nowadays, but they
            can still pack a punch. Of course, the ship posed no problem for Tempest's pilots, who
            had taken advantage of its lowered rear shields and destroyed it within moments of
            launching a volley of torpoedoes from its missile boats. Silwar took a moment to
            consider the loss of LT Rhygaar, who had only recently been assigned to the squadron,
            before walking the pathways to his office; the pilot showed promise but didn't spend
            enough time in the simulators, and it showed. He would make sure the same fate didn't
            meet the rest of his squadron.
          </em>
        </p>

        <p>
          LCM Marek has moved into a flight member position while on leave,
          and LCM Richlet has taken his spot as the lead of flight two. We've also gained a new
          member, SL Morgoth, who has flown with EchoVII, Richlet, and myself in several
          Squadrons matches admirably. Lastly, LT Rhygaar has moved to the reserves.
        </p>

        <p>
          Neko announces the winners of December 2020 "Stay in the Lines":
        </p>

        <SITLEntry place="First Place" name="Graf D'Jinn" image="graf.png" />

        <SITLEntry place="Second Place" name="EchoVII" image="echovii.gif" />

        <SITLEntry place="Third Place" name="Firebreaker" image="firebreaker-1.jpg" />

        <p>
          "It was so hard picking a winner. Everyone's entries look so good!", said Neko. I
          agree! I'll post a gallery of all entries soon. We had eight entries, so an IS-GR,
          IS-SR, and IS-BR have all been recommended.
        </p>

        <p>
          {'Look forward to a new picture next week - but in the meantime, feel free to browse the '}
          <Link href="https://tc.emperorshammer.org/showreport.php?id=1&nid=45">
            report archives for more
          </Link>
          {' and send me a January entry!'}
        </p>
      </Intro>

      <Orders missions={orders}>
        <p>
          This is the
          <strong>{' first '}</strong>
          week these orders are active. You will have until January 3 to finish these
          missions and challenges for the high score competition.
        </p>

        <p>
          <strong>{'PvP challenge: '}</strong>
          fly three dogfights together with at least two other EH pilots.
          Send screenshots to me. Scoring will be based on points and use your highest score.
        </p>
      </Orders>

      <Activity activity={activity} />

      <Competitions competitions={competitions} />

      <Closing>
        TODO Closing
      </Closing>

      <Footer />
    </>
  );
}

/* eslint react/forbid-prop-types: 0 */
Report.propTypes = {
  activityData: T.any,
};

Report.defaultProps = {
  activityData: null,
};

export async function getStaticProps() {
  const activityData = await loadActivityData(config.squadronId, startDate, endDate);

  return {
    props: { activityData }, // will be passed to the page component as props
  };
}
