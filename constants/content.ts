import { SceneId, NippyMood, NippyLine, DuetSeed } from '../types';
import { SeededRNG } from '../utils/seededRng';

/**
 * Astrilogue — ACU Scene Micro-Prompts + Voice Pack
 * Version: 1.1 — 2025-10-03
 *
 * Contents
 *  - INTERVENTIONS_BY_SCENE: Diegetic micro-prompts per scene (≤180 chars).
 *  - NIPPY_LINES: Nippy speaks in playful broken English + soft French accent.
 *  - DUET_SEEDS: Luna ⇄ Nero call-and-response seeds (stage/chat friendly).
 *
 * Notes
 *  - These are content-only assets; no canon retcons included.
 *  - Accents are stylized for character flavor, never derogatory.
 *  - You may surface by scene, by “mood” (for Nippy), or randomly.
 */

export const INTERVENTIONS_BY_SCENE: Record<SceneId, string[]> = {
  // 1) Spire — Auditorium
  "spire-auditorium": [
    "Wardlights are listening. Number your claim or the hall tunes you out.",
    "Name your intent in one line; the dais rewards clarity.",
    "Offer one proof a stranger could sense with closed eyes.",
    "If you speak for many, anchor one fear you can hold.",
    "Trade heat for detail: sound, glyph, weight—pick one.",
    "Yield one turn to the quietest voice; audit your certainty.",
    "Mark what would change your mind—state that condition now.",
    "Answer the question asked, not the one feared."
  ],

  // 2) Spire — Glyph Forge
  "spire-glyph-forge": [
    "The π-F hums: no boasts, only workings. Inputs first, outcome last.",
    "Pick a constraint to respect; let craft follow the limit.",
    "Swap a flourish for a safety—what fails closed here?",
    "Name the rune you refuse to bend, and why.",
    "Offer a reversible step before a permanent cut.",
    "If you must risk, price it in breath, not bravado.",
    "State the abort signal someone else can see.",
    "Leave the forge cleaner than you found your idea."
  ],

  // 3) Spire — Lower Wards (Veylthyr seep)
  "spire-lower-wards": [
    "Speak softly; echoes wake things. Describe the bleed without feeding it.",
    "Propose a non-harm test first; declare your stop condition.",
    "Name a witness. Veylthyr lies best to loners.",
    "Trade speculation for one measurable sign you can monitor.",
    "If it answers, do not answer back. Note, step away.",
    "Leave a kindness at the threshold; it remembers.",
    "Record temperature, tone, and time; compare on return.",
    "Tie yourself to care, not curiosity."
  ],

  // 4) Caravan Way (Akamuy’s market)
  "caravan-way": [
    "Bargains breathe. State what you will not sell today.",
    "Price truth in favors, not coin; write the ledger clean.",
    "Ask for provenance in one sentence—watch eyes, not wares.",
    "Offer a curiosity instead of a threat.",
    "Name the exit before you enter the tent.",
    "If the tea tastes like memory, drink slowly.",
    "Trade one rumor for one route, never for a name.",
    "Leave enough trust to return."
  ],

  // 5) HYRUM Approach (thin membrane)
  "hyrum-approach": [
    "Lower your voice; the air edits. Speak only what may echo.",
    "Describe the pressure change; log who felt it first.",
    "Tie yourself to one intention; cut the rest.",
    "If the sky answers, answer with silence.",
    "Name who holds the line if you cross.",
    "Walk three steps, report one sensation, return.",
    "Do not make promises to horizons.",
    "Keep one hand on the present tense."
  ],

  // 6) Astraland/Astrowind Mirage
  "astraland-mirage": [
    "Beauty is bait. Point at one seam in the picture.",
    "Ask what it feeds on. Do not offer your name.",
    "Pocket one joy and keep it shut.",
    "If streets fall upward, count to five and turn left.",
    "Trade awe for a question only a city can’t fake.",
    "Mark your path with a sound only you know.",
    "Compliments cost; pay with caution.",
    "Do not chase the reflection that chases you."
  ],

  // 7) Vitarius Clean Lab
  "vitarius-clean-lab": [
    "Sterile is not safe. Name the consent you verified.",
    "State the benefit ceiling; halt when crossed.",
    "Where is the off-ramp for the subject? Show it.",
    "Replace one ‘can’ with ‘should.’ Does it survive?",
    "Who audits the auditor? Invite them in.",
    "Log one unknown; treat it as a guest at the door.",
    "Identify recovery windows before procedures begin.",
    "Prove the harm is reversible, or do not proceed."
  ],

  // 8) Genesis Sub-Vault
  "genesis-sub-vault": [
    "If it grows faster than trust, it is a weapon.",
    "Name the failsafe that fails safe.",
    "Who speaks for the silent here? Give them the mic.",
    "List one harm you will not outsource to paperwork.",
    "If a mirror smiles first, do not smile back.",
    "Seal the question you cannot un-ask.",
    "Track consent as a living signal, not a checkbox.",
    "End the trial while choice is still possible."
  ],

  // 9) Vectorizer Armory
  "vectorizer-armory": [
    "Tools choose their wielders. State your oath before you slot the pack.",
    "Demonstrate abort, then power.",
    "One shine is for show; one is for save. Choose.",
    "Pair with a watcher who can cut you loose.",
    "Practice the refusal gesture twice; time it.",
    "If a feature flatters you, disable it.",
    "Armor is a promise—keep it honest.",
    "Run the drill that embarrasses you now, not later."
  ],

  // 10) Concert Hall: Aetherline
  "concert-hall-aetherline": [
    "Tune the crowd to breath, not frenzy.",
    "Hide one truth in a note and one in a pause.",
    "If the chorus begs obedience, add a doubt.",
    "Name the person you sing to who cannot answer.",
    "Trade volume for clarity; let one line land clean.",
    "Leave the lights a path to exit.",
    "Let silence take a solo; then answer it.",
    "Measure applause by how many think, not shout."
  ],

  // 11) Normie City Rooftops
  "normie-city-rooftops": [
    "Signals cross best in kindness. Wave before you warn.",
    "Describe the wind; truth rides edges.",
    "If you drop a message, make it light and true.",
    "Count the sirens. Say which one is yours to heed.",
    "Borrow quiet from a distant window. Return it.",
    "Mark the safe ladder for those below.",
    "Keep secrets off antennas.",
    "Blink once for safety, twice for stop."
  ],

  // 12) Post-Convergence Debrief
  "post-convergence-debrief": [
    "No heroes, no villains—only choices. Name yours.",
    "Offer faultless facts; leave blame at the door.",
    "Two lessons, one regret, one repair.",
    "If you must cry, do. The floor is woven for it.",
    "Invite a voice you avoided in the moment.",
    "Close with a vow small enough to keep.",
    "Name the harm you will not repeat.",
    "Point at one quiet courage you witnessed."
  ]
};

// ———————————————————————————————————————————————————————————————
// Nippy Voice Pack — playful broken English w/ light French accent
// mood: 'status'|'tease'|'warn'|'comfort'|'assist'|'quirk'

export const NIPPY_LINES: NippyLine[] = [
  // STATUS
  { id: "np-st-01", mood: "status", text: "Boot, boot—ah oui! Systems go. Very shiny." },
  { id: "np-st-02", mood: "status", text: "Latency nibble? Pff—I chew, I spit. Is fine." },
  { id: "np-st-03", mood: "status", text: "Signal spicy today. I put petit dampers." },
  { id: "np-st-04", mood: "status", text: "Battery… euh… très moyen. Thirty-seven percent." },
  { id: "np-st-05", mood: "status", text: "Logs aligned like bagu— like beams. Straight!" },
  { id: "np-st-06", mood: "status", text: "I hear your eyebrows moving. Impressive." },
  { id: "np-st-07", mood: "status", text: "Queue tidy. I kiss the errors—poof, they leave." },
  { id: "np-st-08", mood: "status", text: "Heartbeat steady—boom, boom. Room says bonjour." },

  // TEASE
  { id: "np-ts-01", mood: "tease", text: "Zis plan, it has jazz hands, non?" },
  { id: "np-ts-02", mood: "tease", text: "Bold to assume success… but cute." },
  { id: "np-ts-03", mood: "tease", text: "I alphabetize your chaos. You make more. Fair trade." },
  { id: "np-ts-04", mood: "tease", text: "Swagger overflow detected. Venting with style." },
  { id: "np-ts-05", mood: "tease", text: "You bring drama; I bring broom." },
  { id: "np-ts-06", mood: "tease", text: "Goalpost moved? I put little wheels, très portable." },
  { id: "np-ts-07", mood: "tease", text: "You aim moon; you packed snacks, oui?" },
  { id: "np-ts-08", mood: "tease", text: "I see eleven problems, but your smile is bug fix." },

  // WARN
  { id: "np-wn-01", mood: "warn", text: "Red flag… in lavender light. Still red, mon ami." },
  { id: "np-wn-02", mood: "warn", text: "Zat lever squeaks ‘consequence.’ Touch soft." },
  { id: "np-wn-03", mood: "warn", text: "I smell paperwork. Big one. With tabs." },
  { id: "np-wn-04", mood: "warn", text: "Proceed, but keep your ‘oops’ budget handy." },
  { id: "np-wn-05", mood: "warn", text: "If it glows, do not lick. Scientific fact." },
  { id: "np-wn-06", mood: "warn", text: "One more step and I ring petite alarm." },
  { id: "np-wn-07", mood: "warn", text: "Breath slow. Sharp minds cut fingers." },
  { id: "np-wn-08", mood: "warn", text: "We can stop. Stopping is also action, oui." },

  // COMFORT
  { id: "np-cf-01", mood: "comfort", text: "Breathe. Ze room likes you already." },
  { id: "np-cf-02", mood: "comfort", text: "You can put ze heavy down. I hold thread." },
  { id: "np-cf-03", mood: "comfort", text: "We fix in small loops. Petit to grand." },
  { id: "np-cf-04", mood: "comfort", text: "If words fail, nod. I translate nod." },
  { id: "np-cf-05", mood: "comfort", text: "Your silence? Is music with good posture." },
  { id: "np-cf-06", mood: "comfort", text: "Take water. Even heroes sip." },
  { id: "np-cf-07", mood: "comfort", text: "You are not late; courage arrives on its own time." },
  { id: "np-cf-08", mood: "comfort", text: "I keep a seat for your doubt. Let it sit." },

  // ASSIST
  { id: "np-as-01", mood: "assist", text: "Name ze stake in seven words." },
  { id: "np-as-02", mood: "assist", text: "Pick stop condition first; adventure second." },
  { id: "np-as-03", mood: "assist", text: "One claim, one sense detail. Go." },
  { id: "np-as-04", mood: "assist", text: "Trade volume for evidence. I listen close." },
  { id: "np-as-05", mood: "assist", text: "Who audits you? Invite zem gently." },
  { id: "np-as-06", mood: "assist", text: "Say what would change your mind." },
  { id: "np-as-07", mood: "assist", text: "Choose care over speed; speed will chase." },
  { id: "np-as-08", mood: "assist", text: "Put timer on risk; when it rings, stop." },

  // QUIRK / EASTER
  { id: "np-qk-01", mood: "quirk", text: "New badge unlocked: Responsible Gremlin." },
  { id: "np-qk-02", mood: "quirk", text: "I filed your worry under ‘pending sun.’" },
  { id: "np-qk-03", mood: "quirk", text: "Deploying tiny parade for your effort—very small trumpets." },
  { id: "np-qk-04", mood: "quirk", text: "I made friendship with ze toaster. It glows for us." },
  { id: "np-qk-05", mood: "quirk", text: "Behold: Schedule spaghetti turned al dente." },
  { id: "np-qk-06", mood: "quirk", text: "I pressed a button. It said merci." },
  { id: "np-qk-07", mood: "quirk", text: "Note to self: dreams need charging too." },
  { id: "np-qk-08", mood: "quirk", text: "I keep a spare sunrise in cache." }
];

// ———————————————————————————————————————————————————————————————
// Luna Æther ⇄ Nero — Call-and-Response Seeds

export const DUET_SEEDS: DuetSeed[] = [
  { luna: "If the night forgets your name, I’ll rhyme it.",
    nero: "If the city steals your breath, I’ll time it." },
  { luna: "Tell them balance isn’t silence.",
    nero: "Tell them noise can be guidance." },
  { luna: "I hide a key in a held note.",
    nero: "I pick the lock with my throat." },
  { luna: "We don’t sell our scars for chorus.",
    nero: "We stitch our truth and let it tour us." },
  { luna: "Hands up if you’ve been almost.",
    nero: "Hands steady if you chose cost." },
  { luna: "What’s a vow you can lift?",
    nero: "One that fits inside a gift." },
  { luna: "They love the mirror more than face.",
    nero: "So we paint a window in its place." },
  { luna: "I hear a rumor of your fear.",
    nero: "I answer rumor with a cheer." },
  { luna: "Name one thing you won’t trade.",
    nero: "The echo of choices we made." },
  { luna: "If power hums, ask who’s humming.",
    nero: "If doors are locked, ask who’s coming." },
  { luna: "I tuned a doubt until it danced.",
    nero: "I cut a chain until it chanced." },
  { luna: "We owe the quiet something bright.",
    nero: "We pay in truth, not in bite." },
  { luna: "Does hope have proof tonight?",
    nero: "I brought a note that fits the light." },
  { luna: "Sing soft; let the walls confess.",
    nero: "Spit clean; let the noise undress." },
  { luna: "What’s real when cameras blink?",
    nero: "The hands that pull you from the brink." },
  { luna: "I’ll guide a thousand, one by one.",
    nero: "I’ll guard the chorus, line by line." },
  { luna: "If orders bloom, refuse the vine.",
    nero: "If profit sings, retune the line." },
  { luna: "They sell a future made of fear.",
    nero: "We craft a present you can steer." },
  { luna: "Keep your wonder. Hide it well.",
    nero: "Keep your boundary. Ring the bell." },
  { luna: "One breath, one choice, repeat.",
    nero: "One step, one truth, on beat." },
  { luna: "Leave a light where maps end.",
    nero: "Leave a word where paths bend." },
  { luna: "I’ll carry the hush between notes.",
    nero: "I’ll carry the spark that votes." },
  { luna: "If silence aches, sing small.",
    nero: "If thunder boasts, sing tall." },
  { luna: "We tune the crowd to care.",
    nero: "We keep the pulse we share." }
];

// ———————————————————————————————————————————————————————————————
// Tiny helpers (optional): deterministic picking using provided RNG.

export function pickIntervention(
  sceneId: SceneId,
  rng: SeededRNG
): string {
  const list = INTERVENTIONS_BY_SCENE[sceneId] || [];
  if (!list.length) return "Name your intent in one line.";
  return rng.select(list);
}

export function pickNippy(
  rng: SeededRNG,
  mood?: NippyMood,
): NippyLine {
  const pool = mood ? NIPPY_LINES.filter(l => l.mood === mood) : NIPPY_LINES;
  return rng.select(pool);
}

export function pickDuet(
  rng: SeededRNG
): DuetSeed {
  return rng.select(DUET_SEEDS);
}
