import squadsEurope1 from "../../data/ea-fc-26/squads-europe1.json";
import metaEurope1 from "../../data/ea-fc-26/generated-europe1-meta.json";

import squadsEurope2 from "../../data/ea-fc-26/squads-europe2.json";
import metaEurope2 from "../../data/ea-fc-26/generated-europe2-meta.json";

import squadsConcacaf from "../../data/ea-fc-26/squads-concacaf.json";
import metaConcacaf from "../../data/ea-fc-26/generated-concacaf-meta.json";

import squadsAfrica from "../../data/ea-fc-26/squads-africa.json";
import metaAfrica from "../../data/ea-fc-26/generated-africa-meta.json";

import squadsAsia from "../../data/ea-fc-26/squads-asia.json";
import metaAsia from "../../data/ea-fc-26/generated-asia-meta.json";

import squadsSouthAmerica from "../../data/ea-fc-26/squads-southamerica.json";
import metaSouthAmerica from "../../data/ea-fc-26/generated-southamerica-meta.json";

export const COMBINED_SQUADS: any = {
  ...squadsEurope1,
  ...squadsEurope2,
  ...squadsConcacaf,
  ...squadsAfrica,
  ...squadsAsia,
  ...squadsSouthAmerica,
};

export const COMBINED_FACE_STATS: any = {
  ...((metaEurope1 as any).faceStats || {}),
  ...((metaEurope2 as any).faceStats || {}),
  ...((metaConcacaf as any).faceStats || {}),
  ...((metaAfrica as any).faceStats || {}),
  ...((metaAsia as any).faceStats || {}),
  ...((metaSouthAmerica as any).faceStats || {}),
};

export const COMBINED_GK_IDS: string[] = [
  ...((metaEurope1 as any).gkIds || []),
  ...((metaEurope2 as any).gkIds || []),
  ...((metaConcacaf as any).gkIds || []),
  ...((metaAfrica as any).gkIds || []),
  ...((metaAsia as any).gkIds || []),
  ...((metaSouthAmerica as any).gkIds || []),
];

export const COMBINED_KNOWN_TRAITS: any = {
  ...((metaEurope1 as any).knownTraits || {}),
  ...((metaEurope2 as any).knownTraits || {}),
  ...((metaConcacaf as any).knownTraits || {}),
  ...((metaAfrica as any).knownTraits || {}),
  ...((metaAsia as any).knownTraits || {}),
  ...((metaSouthAmerica as any).knownTraits || {}),
};

export const COMBINED_TACTICS: any = {
  ...((metaEurope1 as any).tactics || {}),
  ...((metaEurope2 as any).tactics || {}),
  ...((metaConcacaf as any).tactics || {}),
  ...((metaAfrica as any).tactics || {}),
  ...((metaAsia as any).tactics || {}),
  ...((metaSouthAmerica as any).tactics || {}),
};

for (const key of Object.keys(COMBINED_SQUADS)) {
  const squad = COMBINED_SQUADS[key];
  if (squad.tacticalProfile && !COMBINED_TACTICS[key]) {
    COMBINED_TACTICS[key] = squad.tacticalProfile;
  }
  if (!COMBINED_TACTICS[key]) {
    COMBINED_TACTICS[key] = {
      style: "Balanced",
      formation: squad.formation || "4-3-3",
      playerRoles: {}
    };
  }
}
