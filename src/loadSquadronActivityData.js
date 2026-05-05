export default async function loadSquadronActivityData(squadronId, startDate, endDate) {
  const squadronData = await fetch(`https://api.emperorshammer.org/squadron/${squadronId}`)
    .then((r) => r.json());

  const pilotData = await Promise.all(squadronData.pilots.map(({ PIN: pin }) => fetch(`https://gonk.vercel.app/api/activity?pilotId=${pin}&startDate=${startDate}&endDate=${endDate}`)
    .then((r) => r.json())));

  return pilotData.map((data, i) => ({
    ...squadronData.pilots[i],
    ...data,
  }));
}
