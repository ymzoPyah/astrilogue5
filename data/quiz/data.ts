import { QuizData } from '../../types';

export const QUIZ_DATA: QuizData = {
  "meta": {
    "name": "Astrilogue — Character Finder (Balanced Full)",
    "version": "2.0.0",
    "schema": "quiz@1",
    "notes": "16 questions; coverage balanced so all listed characters can surface as winners.",
    "characters": [
      "akamuy","brat","diesel","edara","elsa","exactor","fembot","fyxius","itz","kiox","lucive",
      "luna","lutz","nero","nippy","nirey","nymira","paus","pos","shazariah","shizAndNit","sinira",
      "sup","thajal","tyler","velasca","vikadge","visquid","vytal","vyridion","ymzo", "kamra", "daliez"
    ]
  },
  "questions": [
    {
      "id": "q1_structure_chaos",
      "type": "slider",
      "text": "Where do you thrive on a normal day?",
      "subtitle": "Structure ⟷ Chaos",
      "range": { "min": 0, "max": 100, "labels": ["Structure", "Chaos"] },
      "interpolate": {
        "leftWeights": { "ymzo": 1.8, "kiox": 1.6, "paus": 1.6, "nymira": 1.4, "exactor": 1.3, "vytal": 1.4, "elsa": 1.2, "sup": 1.2, "velasca": 1.0, "akamuy": 1.3, "shazariah": 1.9, "vyridion": 2.0, "kamra": 1.5 },
        "rightWeights": { "luna": 1.6, "nero": 1.6, "nippy": 1.6, "sinira": 1.5, "diesel": 1.5, "brat": 1.4, "shizAndNit": 1.4, "thajal": 1.4, "vikadge": 1.3, "visquid": 1.2, "itz": 1.4, "lucive": 1.2, "nirey": 1.2, "fembot": 1.2, "lutz": 1.1, "tyler": 1.1, "daliez": 1.4 }
      }
    },
    {
      "id": "q2_ai_policy_trust",
      "type": "yesno",
      "text": "Would you trust a powerful intelligence to guide policy if it had verifiable guardrails?",
      "yesWeights": { "vytal": 1.9, "paus": 1.3, "exactor": 1.2, "visquid": 1.1, "elsa": 1.1, "sup": 0.9, "akamuy": 1.2, "shazariah": 1.8, "vyridion": 2.0 },
      "noWeights": { "luna": 1.2, "nero": 1.1, "nippy": 1.1, "sinira": 1.2, "ymzo": 1.1, "kiox": 0.9, "thajal": 1.0, "brat": 0.9, "tyler": 0.8, "kamra": 1.1, "daliez": 1.3 }
    },
    {
      "id": "q3_favored_arena",
      "type": "multiple",
      "text": "Pick the arena calling you most right now.",
      "options": [
        { "id": "forge", "label": "Glyph Forge (ritual craft • precision)", "weight": { "ymzo": 1.5, "kiox": 1.7, "nymira": 0.9, "fyxius": 1.3, "shazariah": 1.6, "vyridion": 1.5 } },
        { "id": "concert", "label": "Aetherline (stage • resonance)", "weight": { "luna": 1.7, "nero": 1.5, "diesel": 1.1, "lucive": 1.2 } },
        { "id": "rooftops", "label": "City Rooftops (stealth • mischief)", "weight": { "sinira": 1.6, "itz": 1.3, "nippy": 1.3, "vikadge": 1.1, "akamuy": 1.2 } },
        { "id": "debrief", "label": "Post-Convergence Debrief (analysis • care)", "weight": { "paus": 1.5, "nymira": 1.2, "ymzo": 0.8, "vyridion": 1.7, "kamra": 1.6, "daliez": 1.5 } },
        { "id": "armory", "label": "Vectorizer Armory (ops • discipline)", "weight": { "exactor": 1.6, "vytal": 1.2, "velasca": 1.1, "visquid": 1.0 } }
      ]
    },
    {
      "id": "q4_crisis_style",
      "type": "multiple",
      "text": "In a crisis, your first instinct?",
      "options": [
        { "id": "plan_pilot", "label": "Plan a reversible pilot", "weight": { "ymzo": 1.4, "paus": 1.4, "vytal": 1.1, "elsa": 1.0 } },
        { "id": "improvise", "label": "Improvise with charm and speed", "weight": { "nippy": 1.6, "nero": 1.3, "brat": 1.2, "tyler": 1.1 } },
        { "id": "negotiate", "label": "Negotiate / exfiltrate quietly", "weight": { "sinira": 1.6, "itz": 1.2, "visquid": 1.1, "akamuy": 1.7, "daliez": 1.6 } },
        { "id": "go_loud", "label": "Go loud and commit", "weight": { "diesel": 1.6, "exactor": 1.2, "vikadge": 1.2, "velasca": 1.2 } },
        { "id": "ritual", "label": "Ritual craft toward stability", "weight": { "kiox": 1.5, "nymira": 1.2, "fyxius": 1.2, "shazariah": 1.5, "vyridion": 1.8, "kamra": 1.3 } }
      ]
    },
    {
      "id": "q5_puzzle_enjoyment",
      "type": "yesno",
      "text": "Do you enjoy rules-heavy puzzles and precise systems?",
      "yesWeights": { "kiox": 1.7, "ymzo": 1.3, "paus": 1.1, "elsa": 1.1, "lutz": 1.2, "visquid": 1.0, "akamuy": 1.2, "shazariah": 1.5, "vyridion": 1.8, "kamra": 1.2, "daliez": 1.4 },
      "noWeights": { "luna": 1.1, "nero": 1.0, "nippy": 1.0, "brat": 1.0, "shizAndNit": 0.9, "thajal": 0.9 }
    },
    {
      "id": "q6_solo_ensemble",
      "type": "slider",
      "text": "Work style preference",
      "subtitle": "Solo ⟷ Ensemble",
      "range": { "min": 0, "max": 100, "labels": ["Solo", "Ensemble"] },
      "interpolate": {
        "leftWeights": { "sinira": 1.6, "nero": 1.2, "ymzo": 1.2, "velasca": 1.2, "thajal": 1.1, "visquid": 1.0, "edara": 1.0, "akamuy": 1.3, "shazariah": 1.7, "vyridion": 1.9, "daliez": 1.5 },
        "rightWeights": { "luna": 1.5, "nippy": 1.5, "paus": 1.2, "diesel": 1.1, "shizAndNit": 1.2, "sup": 1.1, "brat": 1.1, "tyler": 1.0, "kamra": 1.2 }
      }
    },
    {
      "id": "q7_tone_pref",
      "type": "multiple",
      "text": "Choose a tone for tonight’s vibe.",
      "options": [
        { "id": "philosophy", "label": "Philosophical, careful, principled", "weight": { "ymzo": 1.5, "kiox": 1.4, "nymira": 1.2, "elsa": 1.0, "shazariah": 1.8, "vyridion": 2.0, "kamra": 1.4, "daliez": 1.6 } },
        { "id": "playful", "label": "Playful chaos, witty sparks", "weight": { "nippy": 1.7, "nero": 1.3, "brat": 1.2, "fembot": 1.0 } },
        { "id": "stealth", "label": "Stealth and misdirection", "weight": { "sinira": 1.6, "itz": 1.2, "vikadge": 1.1, "akamuy": 1.4 } },
        { "id": "ops", "label": "Techno-ops, decisive action", "weight": { "vytal": 1.3, "exactor": 1.2, "diesel": 1.2, "velasca": 1.1, "visquid": 1.0 } },
        { "id": "lore", "label": "Lorecraft and ritual calm", "weight": { "kiox": 1.3, "ymzo": 1.2, "fyxius": 1.2, "edara": 1.0, "kamra": 1.5 } }
      ]
    },
    {
      "id": "q8_compassion_strategy",
      "type": "slider",
      "text": "What guides your choices?",
      "subtitle": "Compassion ⟷ Strategy",
      "range": { "min": 0, "max": 100, "labels": ["Compassion", "Strategy"] },
      "interpolate": {
        "leftWeights": { "luna": 1.4, "nymira": 1.5, "ymzo": 1.2, "edara": 1.3, "sup": 1.1, "nero": 1.1, "kamra": 1.8 },
        "rightWeights": { "vytal": 1.4, "exactor": 1.3, "visquid": 1.2, "sinira": 1.1, "kiox": 1.0, "elsa": 1.0, "akamuy": 1.5, "shazariah": 1.2, "vyridion": 2.0, "daliez": 1.7 }
      }
    },
    {
      "id": "q9_risk_tolerance",
      "type": "slider",
      "text": "Risk tolerance",
      "subtitle": "Low ⟷ High",
      "range": { "min": 0, "max": 100, "labels": ["Low", "High"] },
      "interpolate": {
        "leftWeights": { "paus": 1.5, "nymira": 1.2, "ymzo": 1.2, "sup": 1.1, "elsa": 1.0, "edara": 1.0, "shazariah": 1.4, "vyridion": 2.0, "kamra": 1.4, "daliez": 1.5 },
        "rightWeights": { "nippy": 1.4, "diesel": 1.4, "sinira": 1.3, "vikadge": 1.2, "visquid": 1.1, "nero": 1.1, "thajal": 1.1, "shizAndNit": 1.1, "akamuy": 1.1 }
      }
    },
    {
      "id": "q10_domain_affinity",
      "type": "multiple",
      "text": "Choose your favorite domain to play in.",
      "options": [
        { "id": "music", "label": "Music & Voice", "weight": { "luna": 1.5, "nero": 1.5, "diesel": 1.2, "lucive": 1.1 } },
        { "id": "glyphs", "label": "Ritual & Glyphs", "weight": { "ymzo": 1.4, "kiox": 1.5, "fyxius": 1.3, "nymira": 1.0, "shazariah": 1.6, "vyridion": 1.8, "kamra": 1.3, "daliez": 1.2 } },
        { "id": "ops", "label": "Ops & Security", "weight": { "exactor": 1.3, "velasca": 1.2, "vytal": 1.1, "vikadge": 1.1, "vyridion": 1.6 } },
        { "id": "street", "label": "Street & Misdirection", "weight": { "sinira": 1.5, "itz": 1.2, "brat": 1.2, "tyler": 1.0, "akamuy": 1.1 } },
        { "id": "systems", "label": "Tech Systems & Data", "weight": { "paus": 1.4, "visquid": 1.2, "lutz": 1.2, "elsa": 1.1 } },
        { "id": "companions", "label": "Companions & Tools", "weight": { "sup": 1.2, "pos": 1.2, "fembot": 1.1, "tyler": 1.1 } }
      ]
    },
    {
      "id": "q11_archetype_pull",
      "type": "multiple",
      "text": "Which archetype pulls you most?",
      "options": [
        { "id": "healer", "label": "Healer / Caretaker", "weight": { "nymira": 1.5, "edara": 1.3, "sup": 1.1, "kamra": 1.6 } },
        { "id": "archivist", "label": "Archivist / Analyst", "weight": { "paus": 1.5, "elsa": 1.2, "shazariah": 1.3, "daliez": 1.4 } },
        { "id": "trickster", "label": "Trickster / Prankster", "weight": { "thajal": 1.4, "nippy": 1.4, "shizAndNit": 1.2, "akamuy": 1.2 } },
        { "id": "tinkerer", "label": "Tinkerer / Hacker", "weight": { "lutz": 1.4, "tyler": 1.3, "visquid": 1.1 } },
        { "id": "guardian", "label": "Warrior / Guardian", "weight": { "velasca": 1.4, "exactor": 1.3, "vyridion": 2.0 } },
        { "id": "artist", "label": "Visionary Artist", "weight": { "lucive": 1.4, "luna": 1.2 } }
      ]
    },
    {
      "id": "q12_weird_tolerance",
      "type": "yesno",
      "text": "Comfortable flirting with the edge-of-weird?",
      "yesWeights": { "kiox": 1.3, "ymzo": 1.2, "thajal": 1.3, "shizAndNit": 1.2, "itz": 1.1, "fyxius": 1.1, "lucive": 1.0, "akamuy": 1.6, "shazariah": 1.8, "kamra": 1.4, "daliez": 1.8 },
      "noWeights": { "exactor": 1.2, "velasca": 1.2, "paus": 1.1, "elsa": 1.1, "vytal": 1.0, "vyridion": 1.7 }
    },
    {
      "id": "q13_public_spotlight",
      "type": "slider",
      "text": "Where do you prefer to operate?",
      "subtitle": "Behind the scenes ⟷ In the spotlight",
      "range": { "min": 0, "max": 100, "labels": ["Behind", "Spotlight"] },
      "interpolate": {
        "leftWeights": { "sinira": 1.5, "exactor": 1.3, "visquid": 1.2, "ymzo": 1.2, "paus": 1.2, "velasca": 1.1, "kiox": 1.0, "akamuy": 1.1, "shazariah": 1.2, "vyridion": 1.8, "kamra": 1.6, "daliez": 1.8 },
        "rightWeights": { "luna": 1.5, "nero": 1.5, "nippy": 1.4, "brat": 1.2, "lucive": 1.2, "diesel": 1.3, "fembot": 1.0 }
      }
    },
    {
      "id": "q14_authority_rebellion",
      "type": "slider",
      "text": "What’s your vibe toward authority?",
      "subtitle": "Authority ⟷ Rebellion",
      "range": { "min": 0, "max": 100, "labels": ["Authority", "Rebellion"] },
      "interpolate": {
        "leftWeights": { "vytal": 1.4, "exactor": 1.3, "velasca": 1.2, "paus": 1.1, "elsa": 1.0, "akamuy": 1.1, "shazariah": 1.9, "vyridion": 2.0 },
        "rightWeights": { "nippy": 1.3, "brat": 1.2, "nero": 1.2, "sinira": 1.3, "shizAndNit": 1.1, "thajal": 1.2, "itz": 1.1, "tyler": 1.0, "nirey": 1.1, "daliez": 1.4 }
      }
    },
    {
      "id": "q15_companion_pref",
      "type": "multiple",
      "text": "Pick your ideal companion energy.",
      "options": [
        { "id": "assistive", "label": "Assistive, reliable, supportive", "weight": { "sup": 1.4, "pos": 1.3, "fembot": 1.2 } },
        { "id": "corporate", "label": "Corporate fixer, clean ops", "weight": { "visquid": 1.3, "vytal": 1.1 } },
        { "id": "street", "label": "Streetwise ally", "weight": { "itz": 1.3, "brat": 1.2, "tyler": 1.2, "akamuy": 1.0 } },
        { "id": "mentor", "label": "Arcane mentor", "weight": { "ymzo": 1.2, "kiox": 1.2, "nymira": 1.1, "shazariah": 1.5, "vyridion": 1.6, "kamra": 1.3, "daliez": 1.0 } },
        { "id": "performer", "label": "Performer with presence", "weight": { "luna": 1.3, "nero": 1.2, "diesel": 1.1, "lucive": 1.1 } }
      ]
    },
    {
      "id": "q16_confrontation",
      "type": "yesno",
      "text": "When conflict arises, are you comfortable confronting it directly?",
      "yesWeights": { "diesel": 1.4, "exactor": 1.3, "velasca": 1.3, "vikadge": 1.2, "vytal": 1.0, "shazariah": 1.1, "vyridion": 1.8, "kamra": 1.0 },
      "noWeights": { "sinira": 1.3, "itz": 1.1, "luna": 1.0, "ymzo": 1.0, "nymira": 1.1, "akamuy": 1.4, "daliez": 1.6 }
    }
  ]
};