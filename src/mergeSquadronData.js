/**
 * Merges data from the Emperor's Hammer squadron API endpoint into the local
 * config shape, so fields like flight names, CMDR details, and squadron images
 * don't need to be manually maintained in config.json.
 *
 * @param {object} apiResponse - Response from https://api.emperorshammer.org/squadron/:id
 * @param {object} baseConfig  - Current config (used for fields not in the API)
 * @returns {object} Merged config
 */
export default function mergeSquadronData(apiResponse, baseConfig) {
  const { squadron, pilots = [] } = apiResponse;

  const cmdrPilot = pilots.find((p) => p.position === 'CMDR');

  const flights = Object.entries(squadron.flights ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, f]) => ({ name: f.nick, motto: f.motto, ship: f.craft }));

  return {
    ...baseConfig,
    squadron: squadron.nameShort ?? baseConfig.squadron,
    ship: cmdrPilot?.ship?.nameShort ?? baseConfig.ship,
    squadronBanner: {
      ...(baseConfig.squadronBanner ?? {}),
      url: squadron.banner ?? baseConfig.squadronBanner?.url,
    },
    squadronPatch: {
      ...(baseConfig.squadronPatch ?? {}),
      url: squadron.patch ?? baseConfig.squadronPatch?.url,
    },
    cmdr: {
      ...(baseConfig.cmdr ?? {}),
      ...(cmdrPilot ? {
        name: cmdrPilot.name,
        title: `${cmdrPilot.rankAbbr} ${cmdrPilot.name}`,
        pin: cmdrPilot.PIN,
        email: cmdrPilot.email,
      } : {}),
    },
    flights: flights.length > 0 ? flights : (baseConfig.flights ?? []),
  };
}
