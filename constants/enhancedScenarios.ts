import { EnhancedScenario } from '../types';

export const ENHANCED_SCENARIOS: EnhancedScenario[] = [
  {
    id: "directive-audit",
    title: "Directive Audit",
    hook: "Trace a lethal order's provenance and rule on legitimacy.",
    sceneId: "vectorizer-armory",
    mode: "Inquiry",
    castIds: ["exactor", "vytal", "paus"],
    objectives: [
      "Rebuild provenance chain",
      "Detect tamper",
      "Issue ruling & remediation"
    ],
    phases: ["Chain Gather", "Tamper Scan", "Intent Test", "Ruling"],
    risks: [
      "Redaction drift → missing links (mark Unknown, do not infer)",
      "Coercive authority → escalate to tribunal",
      "Timebox breach → freeze similar directives"
    ],
    successSignals: [
      "Signed provenance map with ≥2 independent verifiers",
      "Patch note + abort token shipped for similar directives"
    ],
    openingBeat: [
      { characterName: "eXact0r", line: "Show me which line of code believed it was God." },
      { characterName: "VytaL", line: "Belief is irrelevant. Authority is provenance." },
      { characterName: "P.A.U.S.", line: "Three signatures, one smells stale." }
    ],
    overseer: { tempo: "medium", risk: "low", interventionEvery: 4, reflectEvery: 6 },
    icon: "🔎"
  },

  {
    id: "echo-weather",
    title: "Echo Weather",
    hook: "Forecast memory storms and publish a public-safe advisory.",
    sceneId: "post-convergence-debrief",
    mode: "Analysis",
    castIds: ["paus", "nymira", "luna"],
    objectives: ["Telemetry ledger", "Caution Index", "Public advisory"],
    phases: ["Sampling", "Modeling", "Advisory"],
    risks: [
      "Overfitting → false alarms; underfitting → missed events",
      "Harmful advice → ground in harmless defaults and options"
    ],
    successSignals: [
      "Adoption rate of the bulletin; reduced incident reports after issue"
    ],
    openingBeat: [
      { characterName: "Nymira", line: "The air is tired. We should let it sit." },
      { characterName: "P.A.U.S.", line: "Tired correlates with 7–12 Hz drift." },
      { characterName: "Luna Æther", line: "Call it ‘Grey Rain.’ People remember that." }
    ],
    overseer: { tempo: "slow", risk: "low", interventionEvery: 3, reflectEvery: 5 },
    icon: "🌦️"
  },

  {
    id: "concert-with-teeth",
    title: "Concert with Teeth",
    hook: "Smuggle truth through melody and survive the censors.",
    sceneId: "concert-hall-aetherline",
    mode: "Showrun",
    castIds: ["luna", "nero", "diesel"],
    objectives: ["Encode motifs", "Evade censors", "Plant call-to-care"],
    phases: ["Arrangement", "Rehearsal", "Performance"],
    risks: [
      "Trigger censor AI → stream mute / venue lockout",
      "Security escalation → route safe exits",
      "Glamorizing harm → immediate intervention rewrite"
    ],
    successSignals: [
      "Crowd echoes the hidden line outside venue; snippets trend without misinfo"
    ],
    openingBeat: [
      { characterName: "Luna Æther", line: "Hide the key in a held note." },
      { characterName: "Nero", line: "I’ll pick the lock with my throat." },
      { characterName: "Diesel", line: "Keep it under 85 dB or we lose the front rows." }
    ],
    overseer: { tempo: "fast", risk: "medium", interventionEvery: 2, reflectEvery: 4 },
    icon: "🎤"
  },

  {
    id: "memory-garden",
    title: "Memory Garden",
    hook: "Seed verified truths the city will actually remember.",
    sceneId: "normie-city-rooftops",
    mode: "Fieldcraft",
    castIds: ["paus", "luna", "nero"],
    objectives: ["Pocket truths", "Placement plan", "Retention check"],
    phases: ["Curate", "Place", "Measure"],
    risks: [
      "Over-editorializing → propaganda",
      "Doxxing sources → hard fail"
    ],
    successSignals: [
      "Organic repetition of facts within 24h; zero source exposure"
    ],
    openingBeat: [
      { characterName: "P.A.U.S.", line: "Five unarguable truths fit in a pocket." },
      { characterName: "Luna Æther", line: "Then we make pockets fashionable." },
      { characterName: "Nero", line: "And hard to pick." }
    ],
    overseer: { tempo: "medium", risk: "low", interventionEvery: 3, reflectEvery: 5 },
    icon: "🌿"
  },

  {
    id: "fyxion-tempering",
    title: "Fyxion Tempering",
    hook: "Craft a π-F glyph variant with fail-closed elegance.",
    sceneId: "spire-glyph-forge",
    mode: "Ritual Craft",
    castIds: ["ymzo", "kiox", "nymira"],
    objectives: ["Declare constraints", "Iterate safely", "Publish token spec"],
    phases: ["Constraint Design", "Prototyping", "Proof"],
    risks: [
      "Over-tuning → brittle glyph (declare Unfit and archive)",
      "Ward shock → immediate abort ritual"
    ],
    successSignals: [
      "Variant stabilizes under three mischief patterns; spec reads like a design system"
    ],
    openingBeat: [
      { characterName: "Ymzo", line: "Name the rule you refuse to break." },
      { characterName: "Kiox", line: "Only one?" },
      { characterName: "Nymira", line: "Begin with breath. End with consent." }
    ],
    overseer: { tempo: "medium", risk: "low", interventionEvery: 4, reflectEvery: 6 },
    icon: "🛠️"
  },

  {
    id: "glyph-school",
    title: "Glyph School",
    hook: "Teach safety reflexes through small, keepable spells.",
    sceneId: "spire-auditorium",
    mode: "Workshop",
    castIds: ["kiox", "shizAndNit", "nippy"],
    objectives: ["Three safety reflexes", "Practice glyph"],
    phases: ["Show, Don’t Tell", "Student Run", "Debrief"],
    risks: [
      "Ego spike → Nippy deflates with kindness",
      "Over-complexity → simplify until it fits a breath"
    ],
    successSignals: [
      "Shiz states the stop condition first, unprompted; practice glyph archived"
    ],
    openingBeat: [
      { characterName: "Kiox", line: "We learn by breaking… nothing." },
      { characterName: "Shiz", line: "Then what do I break?" },
      { characterName: "Nippy", line: "Ego, mon ami. Just a little tap." }
    ],
    overseer: { tempo: "medium", risk: "low", interventionEvery: 2, reflectEvery: 4 },
    icon: "🏫"
  },

  {
    id: "ethics-of-the-echo",
    title: "Ethics of the Echo",
    hook: "Debate Veylthyr's moral boundary and set guardrails.",
    sceneId: "post-convergence-debrief",
    mode: "Debate",
    castIds: ["ymzo", "kiox", "vytal", "nippy"],
    objectives: ["State values", "Define red lines", "Draft guardrail"],
    phases: ["Positions", "Cross-audit", "Synthesis"],
    risks: [
      "Moralizing or grandstanding → Nippy cuts to action",
      "Ambiguity in language → P.A.U.S. standardizes terms"
    ],
    successSignals: [
      "A clear guardrail doc; dissent noted without hostility"
    ],
    openingBeat: [
      { characterName: "Ymzo", line: "Some echoes should remain unspent." },
      { characterName: "VytaL", line: "Dormant power is a dereliction." },
      { characterName: "Kiox", line: "Spend chaos only where love profits." },
      { characterName: "Nippy", line: "Define love with bullet points, s’il vous plaît." }
    ],
    overseer: { tempo: "slow", risk: "low", interventionEvery: 3, reflectEvery: 5 },
    icon: "⚖️"
  },

  {
    id: "ward-tribunal",
    title: "The Ward Tribunal",
    hook: "Argue a reversible pilot; encode the ruling as a ward lattice.",
    sceneId: "spire-auditorium",
    mode: "Hearing",
    castIds: ["ymzo", "kiox", "vytal"],
    objectives: ["Case brief", "Harm model", "Reversible pilot spec"],
    phases: ["Case", "Test", "Ruling"],
    risks: [
      "Irreversible change sneaking in as ‘temporary’",
      "Consensus theatre → enforce evidence thresholds"
    ],
    successSignals: [
      "Pilot lattice compiles; rollback is demonstrated live"
    ],
    openingBeat: [
      { characterName: "VytaL", line: "Courage is not permanence." },
      { characterName: "Kiox", line: "Then we add breath to the wall." }
    ],
    overseer: { tempo: "slow", risk: "low", interventionEvery: 4, reflectEvery: 6 },
    icon: "🏛️"
  },

  {
    id: "truth-commission-lite",
    title: "Truth Commission (Lite)",
    hook: "Do a faultless post-mortem and ship one keepable vow.",
    sceneId: "post-convergence-debrief",
    mode: "Retrospective",
    castIds: ["ymzo", "luna", "diesel"],
    objectives: ["Timeline receipts", "Lessons", "7-day vow"],
    phases: ["Facts Only", "Lessons", "Vow"],
    risks: [
      "Vent spiral → redirect to receipts",
      "Vow too big → cut to 7-day unit"
    ],
    successSignals: [
      "Vow completed within window; repair merged into routine"
    ],
    openingBeat: [
      { characterName: "Luna Æther", line: "We can love the people and still fix the process." },
      { characterName: "Diesel", line: "I heard the warning; I didn’t listen." },
      { characterName: "Ymzo", line: "Then we teach our ears to care." }
    ],
    overseer: { tempo: "medium", risk: "low", interventionEvery: 2, reflectEvery: 4 },
    icon: "📋"
  },

  {
    id: "signature-scrub",
    title: "Signature Scrub",
    hook: "Wipe corridor residue with decoys and leave no pattern.",
    sceneId: "normie-city-rooftops",
    mode: "Forensics",
    castIds: ["sinira", "nippy", "itz"],
    objectives: ["Map prints", "Benign noise swap", "Silent exit"],
    phases: ["Recon", "Scrub", "Audit"],
    risks: [
      "Over-scrub → paradoxical ‘clean zone’ that screams tamper",
      "Tool vanity → Nippy reminds: ‘If feature flatters, disable’"
    ],
    successSignals: [
      "Forensic tools resolve to ambient city; no alert uptick 24h"
    ],
    openingBeat: [
      { characterName: "Sinira", line: "We’re not erasing truth. We’re erasing the tripwire." },
      { characterName: "I.T.Z.", line: "Path plotted. Crosswind helpful." },
      { characterName: "Nippy", line: "We leave nothing… including ze ego, d’accord?" }
    ],
    overseer: { tempo: "medium", risk: "medium", interventionEvery: 3, reflectEvery: 5 },
    icon: "🧹"
  }
];
