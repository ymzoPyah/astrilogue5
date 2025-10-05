import { Character, SurvivorTrial, SurvivorTrialCategory } from "../types";

// Individual character modules (34)
import { akamuy } from "../data/characters/akamuy";
import { brat } from "../data/characters/brat";
import { david } from "../data/characters/david";
import { diesel } from "../data/characters/diesel";
import { edara } from "../data/characters/edara";
import { elsa } from "../data/characters/elsa";
import { exactor } from "../data/characters/exactor";
import { fembot } from "../data/characters/fembot";
import { fyxius } from "../data/characters/fyxius";
import { itz } from "../data/characters/itz";
import { kiox } from "../data/characters/kiox";
import { lucive } from "../data/characters/lucive";
import { luna } from "../data/characters/luna";
import { lutz } from "../data/characters/lutz";
import { lomize } from "../data/characters/lomize";
import { nero } from "../data/characters/nero";
import { nippy } from "../data/characters/nippy";
import { nirey } from "../data/characters/nirey";
import { nymira } from "../data/characters/nymira";
import { paus } from "../data/characters/paus";
import { pos } from "../data/characters/pos";
import { shazariah } from "../data/characters/shazariah";
import { shizAndNit } from "../data/characters/shizAndNit";
import { sinira } from "../data/characters/sinira";
import { sup } from "../data/characters/sup";
import { thajal } from "../data/characters/thajal";
import { tyler } from "../data/characters/tyler";
import { velasca } from "../data/characters/velasca";
import { vikadge } from "../data/characters/vikadge";
import { visquid } from "../data/characters/visquid";
import { vytal } from "../data/characters/vytal";
import { vyridion } from "../data/characters/vyridion";
import { ymzo } from "../data/characters/ymzo";
import { kamra } from "../data/characters/kamra";
import { daliez } from "../data/characters/daliez";

export const CHARACTERS: Character[] = [
  akamuy, brat, david, diesel, edara, elsa, exactor, fembot, fyxius, itz, kiox,
  lucive, luna, lutz, lomize, nero, nippy, nirey, nymira, paus, pos,
  shazariah, shizAndNit, sinira, sup, thajal, tyler, velasca, vikadge, visquid, vytal,
  vyridion, ymzo, kamra, daliez
];

export const cosmo = {
  // Base
  bg: { base: "#0B0B12", surface: "#0F1017", overlay: "#121322" },
  text: { primary: "#E6E8F2", secondary: "#AEB2C1", muted: "#7A7E8C" },

  // Accents (cool⇄warm balance)
  accent: { teal: "#25F2E2", violet: "#A27BFF", magenta: "#FF52C6", gold: "#F5C65D", silver: "#C0C3D9" },

  // Effects
  glow: { soft: "0 0 24px rgba(162,123,255,0.25)", hard: "0 0 40px rgba(37,242,226,0.25)" },
  ring:  { focus: "ring-2 focus:ring-teal-300/40 focus:outline-none" },

  // Scene overlays (alpha gradients) for Tailwind JIT
  scene: {
    "spire-auditorium": "from-[#2A0F2A]/40 via-transparent to-transparent",
    "spire-glyph-forge": "from-[#2A1F0F]/40 via-transparent to-transparent",
    "spire-lower-wards": "from-[#0F2A2A]/40 via-transparent to-transparent",
    "caravan-way": "from-[#2A2A0F]/40 via-transparent to-transparent",
    "hyrum-approach": "from-[#0F1840]/35 via-transparent to-transparent",
    "astraland-mirage": "from-[#40350F]/35 via-transparent to-transparent",
    "vitarius-clean-lab": "from-[#f8fafc]/5 via-transparent to-transparent",
    "genesis-sub-vault": "from-[#1A2A0F]/35 via-transparent to-transparent",
    "vectorizer-armory": "from-[#2A0F0F]/35 via-transparent to-transparent",
    "concert-hall-aetherline": "from-[#1A0F2A]/40 via-transparent to-transparent",
    "normie-city-rooftops": "from-[#102A2F]/35 via-transparent to-transparent",
    "post-convergence-debrief": "from-[#0F1840]/35 via-transparent to-transparent",
  },
};

export const SURVIVOR_TRIALS: Record<SurvivorTrialCategory, SurvivorTrial[]> = {
    logic: [
        { name: "The Cipher Chamber", description: "A test of pattern recognition and deduction.", primaryTrait: 'logic' },
        { name: "Glyph Sequencing", description: "Replicate complex arcane patterns under pressure.", primaryTrait: 'logic' },
    ],
    social: [
        { name: "Public Perception", description: "A debate where convincing the group is key.", primaryTrait: 'persuasion' },
        { name: "Web of Lies", description: "Identify the inconsistent story among several truths.", primaryTrait: 'persuasion' },
    ],
    endurance: [
        { name: "The Long Watch", description: "A test of pure physical and mental stamina.", primaryTrait: 'endurance' },
        { name: "Weight of Memory", description: "Hold a heavy burden while reciting past events.", primaryTrait: 'endurance' },
    ],
    chaos: [
        { name: "Wildcard Gauntlet", description: "Navigate a course where the rules change every minute.", primaryTrait: 'chaos' },
        { name: "The Saboteur's Gambit", description: "Subtly disrupt another's task without being caught.", primaryTrait: 'chaos' },
    ],
    creative: [
        { name: "The Performance", description: "Craft a compelling story or display from limited props.", primaryTrait: 'creative' },
        { name: "Improvised Solutions", description: "Solve an impossible problem with mundane tools.", primaryTrait: 'creative' },
    ]
};