/* eslint react/no-unescaped-entities: 0 */

function PL({ pin, children, value }) {
  return (
    <>
      <a href={`https://tc.emperorshammer.org/record.php?pin=${pin}&type=profile`}>
        {children}
      </a>
      {` with ${value}`}
    </>
  );
}

export default function CC() {
  return (
    <div>
      <img
        src="https://tc.emperorshammer.org/images/chalquilla-cup.png"
        alt="An Imperial pilot holds a Chalquilla Cup flag"
      />

      <p>
        The Chalquilla Cup pits squadron-based teams against each other in 3v3 Star Wars Squadrons
        matches. The first to 20 kills, or the team with the most kills in 10 minutes, wins a
        round. 10 teams face each other in the first Chalquilla Cup season, with teams from
        Tempest, Eagle, Lambda, Beta, Epsilon, Theta, Inferno, Rho, and <em>two</em> from Firebird.
      </p>

      <p>
        Twelve matches were played today, concluding the first 30 of 90 games.  Let's take a look
        at where things stand:
      </p>

      <p>
        Highest K/D:
      </p>

      <ol>
        <li><PL pin="55848" value="4.9">CM Bai'et Decol</PL></li>
        <li><PL pin="55693" value="3.4">AD Pickled Yoda</PL></li>
        <li><PL pin="765" value="3">COL Ricaud</PL></li>
      </ol>

      <p>
        Total kills:
      </p>

      <ol>
        <li><PL pin="55730" value="70">CPT Genie</PL></li>
        <li><PL pin="12630" value="63">COL Silwar Naiilo</PL></li>
        <li><PL pin="55693" value="61">AD Pickled Yoda</PL></li>
      </ol>

      <p>
        Total assists:
      </p>

      <ol>
        <li><PL pin="12292" value="55">COL Stryker</PL></li>
        <li><PL pin="8044" value="41">CM TI-40026</PL></li>
        <li><PL pin="5843" value="39">LCM Xye</PL></li>
      </ol>

      <p>
        Most kills in a single game:
      </p>

      <ol>
        <li><PL pin="55730" value="14">CPT Genie</PL></li>
        <li><PL pin="765" value="13">COL Ricaud</PL></li>
        <li><PL pin="12630" value="12">COL Silwar Naiilo</PL></li>
      </ol>


      <p>
        Firebird's team "FogHorn LegHorn" and Theta's "Operating Thetans" are tied for first,
        with 7 wins and exactly 155 kills each.
      </p>

      <p>
        Silwar Naiilo also has the most deaths (54), proving that "everyone kill Silwar" is more
        than a meme.
      </p>

      <p>
        {'Special thanks to '}
        <a href="https://tc.emperorshammer.org/record.php?pin=55922&type=profile">LT EchoVII</a>
        {' for providing the Chalquilla Cup pilot drawing!'}
      </p>
    </div>
  );
}
