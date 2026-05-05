const SITLEntry = ({ name, image }) => (
  <>
    <p>
      <b>{name}</b>
    </p>

    <img
      src={`/competitions/stay-in-the-lines/2020-12/${image}`}
      alt={name}
      width="100%"
    />
  </>
);

export default function StayInTheLinesDecember2020() {

  return (
    <>
      <SITLEntry name="Graf D'Jinn" image="graf.png" />
      <SITLEntry name="EchoVII" image="echovii.gif" />
      <SITLEntry name="Firebreaker" image="firebreaker-1.jpg" />
      <SITLEntry name="Firebreaker" image="firebreaker.jpg" />
      <SITLEntry name="Jarion Renalds" image="jarion-renalds.png" />
      <SITLEntry name="TI-40026" image="ti-40026.png" />
      <SITLEntry name="Turtle Jerrar" image="turtle-jerrar.png" />
      <SITLEntry name="Xye" image="xye.png" />
    </>
  );
}
