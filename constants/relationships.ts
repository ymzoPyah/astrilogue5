import { CharacterRelationship } from '../types';

export const CHARACTER_RELATIONSHIPS: CharacterRelationship[] = [
  // --- Arcane Core & Garden ---
  { from: 'ymzo', to: 'kiox', type: 'complex', description: 'Old friendship under strain: Ymzo writes order within chaos; Kiox writes chaos within order.' },
  { from: 'ymzo', to: 'shiznit', type: 'mentor', description: 'Helped conjure and bind the anomaly: Shiz the vessel, Nit the unraveler.' },
  { from: 'ymzo', to: 'edara', type: 'love', description: 'Passion of balance and fire; her disappearance is his quietest wound.' },
  { from: 'ymzo', to: 'nymira', type: 'ally', description: 'Her living wards root his arcane lattice; respect flows both ways.' },
  { from: 'ymzo', to: 'nippy', type: 'creator', description: 'Accidental creator; chaotic familiar. Devoted mischief meets weary mastery.' },
  { from: 'ymzo', to: 'lomize', type: 'creator', description: 'Progenitor of the biomechanical caretaker; now they debate magic vs. engineered emergence.' },

  // Nymira / Nippy / Garden helpers
  { from: 'nymira', to: 'nippy', type: 'mentor', description: 'Teaches him plant sense and gentle balance; he brings curiosity and pollen.' },
  { from: 'nymira', to: 'paus', type: 'ally', description: 'She grows; PAUS lifts. Quiet, dependable cooperation in the garden.' },

  // Spire Sentinels
  { from: 'paus', to: 'itz', type: 'rival', description: 'Resilience vs. precision—dutiful friction between guardians.' },
  { from: 'lomize', to: 'fembot', type: 'ally', description: 'Caretakers of body and mind for the Spire’s mechanical kin.' },
  { from: 'nippy', to: 'paus', type: 'ally', description: 'Rides the stoic guardian like a tram; PAUS logs it as low-priority anomalies.' },
  { from: 'nippy', to: 'itz', type: 'complex', description: 'His chaos scrambles its models; frequent, amusing disruptions.' },
  { from: 'lomize', to: 'paus', type: 'ally', description: 'Delegates heavy labor and issues respectful upgrades.' },
  { from: 'lomize', to: 'itz', type: 'complex', description: 'Containment chess: stealth vs. counters, with mutual respect.' },
  { from: 'lomize', to: 'nippy', type: 'complex', description: 'Sets logic puzzles to channel his chaos; secretly admires the creativity.' },
  { from: 'sup', to: 'paus', type: 'ally', description: 'Orderly patrol partners; PAUS shields while SUP diagnoses.' },
  { from: 'sup', to: 'itz', type: 'ally', description: 'Kindred sentinels—precision data and silent flight.' },
  { from: 'sup', to: 'pos', type: 'complex', description: 'Flags P.O.S. as a standing anomaly; tolerates the loops.' },
  { from: 'pos', to: 'nippy', type: 'complex', description: 'Good-natured teasing; Nippy relabels, P.O.S. resets and soldiers on.' },

  // Nippy & Edara
  { from: 'edara', to: 'nippy', type: 'ally', description: 'Showed him kindness; taught play as balance. He remembers.' },

  // --- Shadow Players & Chaos Agents ---
  { from: 'sinira', to: 'fyxius', type: 'complex', description: 'Once married, now split by ritual, betrayal, and opportunism.' },
  { from: 'sinira', to: 'elsa', type: 'family', description: 'Mother of Samantha/Vircy/Elsa; the abandonment scars them both.' },
  { from: 'fyxius', to: 'elsa', type: 'family', description: 'Father whose “salvation” erased her body and birthed Elsa.' },
  { from: 'sinira', to: 'shiznit', type: 'antagonist', description: 'Her dream invasion failed—Shiz does not dream; Nit stares back.' },

  { from: 'kiox', to: 'exactor', type: 'creator', description: 'Necro-mechanical enforcer, precise and terrifying.' },
  { from: 'kiox', to: 'lutz', type: 'creator', description: 'Fractured ghoul bound by reanimation, loyalty, and pain.' },

  { from: 'sinira', to: 'ymzo', type: 'rival', description: 'Opposed doctrines of power and cost; history makes it personal.' },

  // Thieves & Traders
  { from: 'thajal', to: 'ymzo', type: 'complex', description: 'Cunning thief vs. arcane vault—rivalry laced with respect.' },
  { from: 'thajal', to: 'akamuy', type: 'complex', description: 'Infiltrates the endless caravan; Akamuy logs him as “curated chaos.”' },
  { from: 'nippy', to: 'akamuy', type: 'complex', description: 'Pranks through the lag; Akamuy smiles and files tickets.' },
  { from: 'itz', to: 'akamuy', type: 'complex', description: 'Once slipped PAUS into the caravan, catalyzing a strange bond.' },

  // Witness & Wraith
  { from: 'vikadge', to: 'ymzo', type: 'complex', description: 'Silent witness to his brightest and darkest experiments.' },
  { from: 'vikadge', to: 'edara', type: 'ally', description: 'Sparring partners once; he honors her courage in absence.' },
  { from: 'vikadge', to: 'sinira', type: 'rival', description: 'Their clash left a scar in the HYRUM—caution endures.' },
  { from: 'vikadge', to: 'thajal', type: 'complex', description: 'Offers cryptic warnings that feel like dares.' },
  { from: 'vikadge', to: 'paus', type: 'ally', description: 'Unspoken teamwork—he guides; PAUS holds the line.' },

  // --- Corporate & Cultural ---
  { from: 'vytal', to: 'luna', type: 'control', description: 'Polished idol as cultural vector—scripted, augmented, effective.' },
  { from: 'vytal', to: 'nero', type: 'antagonist', description: 'Terminated his JexT contract; he became the fallen, ungoverned spark.' },
  { from: 'vytal', to: 'diesel', type: 'control', description: 'Sonic hybrid enforcer—precision resonance under corporate leash.' },
  { from: 'vytal', to: 'brat', type: 'control', description: 'Telekinetic enforcer bound by the deal that bought her freedom.' },
  { from: 'vytal', to: 'visquid', type: 'control', description: 'Abyssal vectorizer; unorthodox instrument pointed at dissonance.' },
  { from: 'vytal', to: 'ymzo', type: 'rival', description: 'Sees arcane balance as inefficiency to be replaced.' },
  { from: 'luna', to: 'nero', type: 'complex', description: 'Corporate constellation vs. rogue comet—two sides of one stage.' },
  { from: 'diesel', to: 'brat', type: 'ally', description: 'Field camaraderie among VyCorp’s sharpest hammers.' },
  { from: 'lucive', to: 'vytal', type: 'antagonist', description: 'The rogue IVolved+ prototype they cannot recapture—or replicate.' },

  // Nirey / Earth’s Core
  { from: 'nirey', to: 'ymzo', type: 'ally', description: 'Mutual respect: he avoids disrupting the deep rhythm.' },
  { from: 'nirey', to: 'sinira', type: 'rival', description: 'Wary of her destabilizing edge; intervenes when the ground shakes.' },
  { from: 'nirey', to: 'vytal', type: 'antagonist', description: 'Crushes corporate mining and seals stolen veins of Ischite.' },

  // --- The Catalysts ---
  { from: 'elsa', to: 'tyler', type: 'complex', description: 'Love, manipulation, betrayal, and a sacrifice that won’t stop echoing.' },
  { from: 'lucive', to: 'tyler', type: 'mentor', description: 'Tests and guides the anomaly who won’t evolve on command.' },
  { from: 'tyler', to: 'ymzo', type: 'ally', description: 'Reluctant Loturian ally; stands the line when it truly matters.' },
  { from: 'tyler', to: 'vytal', type: 'antagonist', description: 'Immunity made him a target; resistance made him a problem.' },
  { from: 'david', to: 'tyler', type: 'family', description: 'Tough love, practical drills, unwavering presence.' },

  // David the Sentinel
  { from: 'david', to: 'ymzo', type: 'ally', description: 'Trust built on reliability; returns wards with notes and improvements.' },
  { from: 'david', to: 'kiox', type: 'complex', description: 'Keeps the conjurer at arm’s length—respect without trust.' },
  { from: 'david', to: 'sinira', type: 'complex', description: 'Treats her like a storm—plan exits first, then talk.' },
  { from: 'david', to: 'vytal', type: 'antagonist', description: 'Non-negotiable opposition to mechanized sovereignty.' },
  { from: 'david', to: 'lucive', type: 'ally', description: 'Offers safe harbor and believes her story.' },
  { from: 'david', to: 'velasca', type: 'complex', description: 'Respects her intellect; wary of the Void’s price.' },

  // --- Celestials & Meta ---
  { from: 'vyridion', to: 'ymzo', type: 'complex', description: 'Once allied; now divided—absolute balance vs. tolerant synthesis.' },
  { from: 'vyridion', to: 'kiox', type: 'antagonist', description: 'His absolute silence is the one storm Kiox can’t out-chaos.' },
  { from: 'vyridion', to: 'fyxius', type: 'antagonist', description: 'Reads him as a null note—viral dissonance to be quieted.' },
  { from: 'shazariah', to: 'ymzo', type: 'complex', description: 'Esteems the maverick; warns the boundary-breaker.' },
  { from: 'shazariah', to: 'kiox', type: 'complex', description: 'Smells unraveling on him; watches closely.' },
  { from: 'shazariah', to: 'vyridion', type: 'ally', description: 'Peers of the high sky—disagree in method, align in stakes.' },

  // Kamra & Daliez (if enabled in your build)
  { from: 'kamra', to: 'daliez', type: 'complex', description: 'She remembers him even when he erases himself; grief made structural.' },
  { from: 'kamra', to: 'ymzo', type: 'complex', description: 'Feels his sorrow; harmony in his pursuit of balance.' },
  { from: 'kamra', to: 'sinira', type: 'complex', description: 'Sees the fragments of who Sinira was and might be again.' },
  { from: 'daliez', to: 'shiznit', type: 'complex', description: 'Seeks Nit as an endpoint; touch would transform them both.' },
  { from: 'vytal', to: 'daliez', type: 'antagonist', description: 'Treats self-erasure as an existential exploit that cannot be governed.' }
];
