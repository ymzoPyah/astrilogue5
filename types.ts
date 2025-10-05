// types.ts

// The specific model ID to use for text generation.
export type ModelId = 'gemini-2.5-flash';

// A preference for how the model should behave, trading speed for quality.
export type ModelBehavior = 'flash' | 'flash-thinking';

export interface VoiceProfile {
  provider: 'browser' | 'xtts';
  speakerId?: string; // For XTTS, this would be a reference to a speaker file.
  speed?: number;
  lang?: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string; // Emoji
  avatarUrl?: string; // Generated image data URL
  color: string;
  systemPrompt: string;
  isCustom?: boolean;
  faction?: string;
  isMetaAware?: boolean;
  voiceProfile?: VoiceProfile;
}

export interface Message {
  id:string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  characterId?: string;
  timestamp: number;
  image?: string;
  isGeneratingImage?: boolean;
  eventType?: 'interjection' | 'meta_reflection' | 'guard_event' | 'world_event' | 'whisper' | 'cue' | 'side_conversation_summary' | 'lore_recap';
  reasoning?: string; // For interventions
  isWhisper?: boolean;
  targetCharacterId?: string;
  fullTranscript?: string;
}

export interface Branch {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  sourceMessageId: string;
}

export interface Scene {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface CharacterGoal {
  id: string;
  characterId: string; // The character this goal is for
  name: string; // Short name of the goal
  description: string; // The detailed objective for the AI
}

export interface TelemetryEvent {
    timestamp: number;
    type: 'director_decision' | 'intervention_check' | 'reflection' | 'guard_skipped' | 'scenario_complete' | 'badge.earned' | 'intervention.shown' | 'settings.model_changed' | 'whisper_sent' | 'cue_sent' | 'survivor_vote_reveal_started' | 'survivor_vote_reveal_completed' | 'survivor_advantage_found' | 'survivor_advantage_played' | 'survivor_advantage_skipped' | 'survivor_speed_changed' | 'survivor_pause_toggled' | 'survivor_confession_asked' | 'survivor_bookmark_jump' | 'survivor_bookmark_manual_create' | 'survivor_replay_started' | 'survivor_budget_blocked';
    payload: any;
}

export interface IgnoredEvent {
    eventId: string;
    title: string;
    timestamp: number;
    consequence: string;
}

export interface Session {
  id: string;
  name: string;
  mode: '1on1' | 'group';
  characterIds: string[];
  messages: Message[];
  branches: Branch[];
  activeBranchId: string | null;
  activeSceneId: string | null;
  goals: CharacterGoal[];
  createdAt: number;
  updatedAt: number;
  seed: number;
  topicWeights: Record<string, number>;
  telemetry: TelemetryEvent[];
  enhancedScenarioId?: ScenarioId;
  isComplete?: boolean;
  completedObjectives?: string[];
  ignoredEvents?: IgnoredEvent[];
}

export interface Usage {
  requests: number;
  tokens: number;
  cost: number;
}

export interface Limits {
  maxRequests: number;
  maxTokens: number;
  maxCost: number;
}

export enum View {
  Welcome = 'welcome',
  Setup = 'setup',
  Chat = 'chat',
  LiveChat = 'livechat',
  RelationshipVisualizer = 'relationshipVisualizer',
  LoreBook = 'lorebook',
  Codex = 'codex',
  Workshop = 'workshop',
  Analytics = 'analytics',
  Profile = 'profile',
  Quiz = 'quiz',
  Genesis = 'genesis',
  Survivor = 'survivor',
}

export type SidebarType = 'history' | 'settings' | null;

export interface UserPreferences {
  favoriteCharacterIds: string[];
  recentCharacterIds: string[];
  modelPrefs: {
    groupChat: ModelBehavior;
    director: ModelBehavior;
    analysis: ModelBehavior;
    live: ModelBehavior; // Note: livechat might override this
  };
  motionSensitivity?: 'full' | 'reduced';
  showInterventionReasons?: boolean;
  latestQuizResults?: QuizResult[];
  voiceEnabled?: boolean;
  voiceProvider?: 'xtts' | 'browser';
  xttsServerUrl?: string;
  dynamicWorldEventsEnabled?: boolean;
  survivorVoicesEnabled?: boolean;
}

export interface Preset {
    characterIds: string[];
    activeSceneId: string | null;
    goals: CharacterGoal[];
    seed: number;
    name?: string;
    starterPrompt?: string;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  characterIds: string[];
  starterPrompt: string;
  icon: string;
}

export interface OverseerConfig {
    tempo: string;
    risk: 'low' | 'medium' | 'high';
    interventionEvery: number;
    reflectEvery: number;
}

export interface EnhancedScenario {
  id: string;
  title: string;
  hook: string;
  sceneId: SceneId;
  mode: string;
  castIds: string[];
  objectives: string[];
  phases: string[];
  risks: string[];
  successSignals: string[];
  openingBeat: { characterName: string; line: string }[];
  overseer: OverseerConfig;
  icon: string;
}

export type RelationshipType = 'ally' | 'rival' | 'complex' | 'family' | 'mentor' | 'love' | 'creator' | 'control' | 'antagonist';

export interface CharacterRelationship {
    from: string;
    to: string;
    type: RelationshipType;
    description: string;
}

export interface LoreEntry {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  characterIds: string[];
  timestamp: number;
  sourceMessageId: string;
  survivorSeasonInfo?: {
      seasonId: string;
      seed: string;
  };
}

export interface EmotionScores {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    anger: number;
}

export interface EmotionState {
    characterId: string;
    sessionId: string;
    scores: EmotionScores;
    timestamp: number;
}

export interface LiveTranscriptItem {
  id: number;
  speaker: 'user' | Character;
  text: string;
  isFinal: boolean;
}

export interface Memory {
    id: string;
    characterId: string;
    sessionId: string;
    content: string;
    timestamp: number;
    isSecret?: boolean;
}

export interface CharacterDesire {
    characterId: string;
    desire: number;
    reasoning: string;
}

export interface CharacterParticipation {
    characterId: string;
    messageCount: number;
    percentage: number;
}

export interface TopicAnalysis {
    topic: string;
    summary: string;
}

export interface ConversationMetrics {
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    characterParticipation: CharacterParticipation[];
    durationMinutes: number;
}

export interface SideConversationResult {
    summary: string;
    transcript: string;
    goal_updates: Array<{
        character_id: string;
        new_goal: string | null; // null if goal is completed/removed
        reasoning: string;
    }>;
    new_secrets: Array<{
        character_id: string;
        secret: string;
    }>;
}

export interface InterventionResult {
    interject: boolean;
    message: string | null;
    reasoning: string;
}

export interface Feedback {
    messageId: string;
    characterId: string;
    rating: 'up' | 'down';
    timestamp: number;
}

export type SceneId =
  | "spire-auditorium"
  | "spire-glyph-forge"
  | "spire-lower-wards"
  | "caravan-way"
  | "hyrum-approach"
  | "astraland-mirage"
  | "vitarius-clean-lab"
  | "genesis-sub-vault"
  | "vectorizer-armory"
  | "concert-hall-aetherline"
  | "normie-city-rooftops"
  | "post-convergence-debrief";

export type NippyMood = "status" | "tease" | "warn" | "comfort" | "assist" | "quirk";

export interface NippyLine {
  id: string;
  mood: NippyMood;
  text: string;
}

export interface DuetSeed {
  luna: string;
  nero: string;
}

// --- Badge System Types ---

export type ScenarioId =
  | "directive-audit" | "echo-weather" | "concert-with-teeth" | "memory-garden"
  | "fyxion-tempering" | "glyph-school" | "ethics-of-the-echo" | "ward-tribunal"
  | "truth-commission-lite" | "signature-scrub" | string; // Allow dynamic IDs from Genesis Engine

export type BadgeId = `badge-${ScenarioId}`;

export interface BadgeMeta {
  id: BadgeId;
  title: string;
  description: string;
  iconUrl: string;
  sceneUrl?: string;
  palette?: { primary: string; accent: string; glow?: string };
}

export interface BadgeState {
  id: BadgeId;
  earnedAt: string;          // ISO date
  scenarioId: ScenarioId;
  runId: string;             // internal session id for audit
  version: number;           // schema version
  proof: {
    checksum: string;        // integrity hash of completion payload
    turns: number;           // lightweight stats
    durationMs: number;
  };
}

export interface BadgeStore {
  version: number;
  earned: BadgeState[];
  seenToastFor: BadgeId[];
}

// --- Genesis & World Event Types ---
export interface DynamicWorldEvent {
    id: string;
    title: string;
    description: string;
    sceneId?: SceneId; // Optional scene change
    newObjectives?: string[];
    newRisks?: string[];
    consequenceOfIgnore: string;
}

// --- Survivor Mode Types ---
export type CharacterID = string;

export type SurvivorTrialCategory = 'logic' | 'social' | 'endurance' | 'chaos' | 'creative';

export interface SurvivorTrial {
    name: string;
    description: string;
    primaryTrait: 'logic' | 'endurance' | 'persuasion' | 'chaos' | 'creative';
}

export type SurvivorAdvantage = 'immunity_idol' | 'extra_vote' | 'block_vote';

export type SurvivorSpeed = 1 | 2 | 5 | typeof Infinity;

export interface SurvivorSettings {
  speed: SurvivorSpeed;
  fateNudge: number; // -1..+1
  quietHours: boolean;
  tokenPolicy: {
    roundCap: number;
    entryCap: number;
    batchingWindowMs: number;
  };
  toggles: {
    audienceInfluence: boolean;
    confessionCam: boolean;
    secretAdvantages: boolean;
    jury: boolean;
    postSeasonStats: boolean;
  }
}

export type SurvivorArchetype = 'strategist' | 'social_butterfly' | 'wildcard' | 'loyalist' | 'underdog';

export interface SurvivorDossier {
  version: string;
  seasonId: string;
  charId: CharacterID;
  static: {
    archetype: SurvivorArchetype;
    baseTraits: { logic: number; endurance: number; persuasion: number; chaos: number; creative: number; };
  };
  rivalries: CharacterID[];
  arc: { start: string; current: string; keyMoment: string; };
  advantages: SurvivorAdvantage[];
  rounds: {
    [roundNumber: number]: {
      seed: string;
      state: {
        trust: { [charId: string]: number };
        alliances: CharacterID[][];
        suspicion: number;
        immunity: boolean;
        voteIntent: CharacterID;
        influencedBy: CharacterID[];
        flags: string[];
      };
      materials: {
        schemingNote: { hash: string; materialized: boolean; content?: string; };
      };
    };
  };
  eliminatedRound: number | null;
  meta: { checksum: string; createdAt: number; };
}

export type LogKind = "trial_result" | "camp_window" | "alliance_hint" | "tribunal_summary" | "vote_reveal" | "elimination" | "spotlight" | "round_start" | "finale" | "confession_cam" | "audience_influence" | "secret_advantage_hidden" | "secret_advantage_found" | "secret_advantage_played" | "jury_speech" | "jury_vote_reveal" | "rivalry_formed";

export interface LogEntry {
  id: string;
  kind: LogKind;
  round: number;
  ts: number;
  participants: CharacterID[];
  summary: string;
  seed: string;
  promptHash?: string;
  materialized?: boolean;
  materializedContent?: string;
  estTokens?: number;
  reasoning?: string;
  userQuestion?: string;
}

export type BetType = "opening" | "round" | "final";

export interface Bet {
  id: string;
  type: BetType;
  round: number;
  target: CharacterID;
  pointsAwarded?: number;
  ts: number;
}

export interface Alliance {
  id: string;
  members: CharacterID[];
  strength: number; // 0-1
}

export interface Bookmark {
  id: string;
  round: number;
  kind: 'close_vote' | 'betrayal' | 'rivalry' | 'user';
  summary: string;
  createdAt: number;
  logEntryId?: string;
}

export interface Vote {
  voterId: CharacterID;
  targetId: CharacterID;
  reasoning?: string;
}

export interface RoundSummary {
  roundNumber: number;
  trial: { name: string; category: SurvivorTrialCategory; winnerIds: CharacterID[]; };
  eliminatedId: CharacterID;
  votes: Vote[];
}

export interface PostSeasonStats {
    mostStrategicPlayer: { charId: CharacterID, correctVotes: number };
    biggestRivalry: { charId1: CharacterID, charId2: CharacterID, mutualVotes: number };
    votingHistory: Record<CharacterID, Record<CharacterID, number>>; // voterId -> targetId -> count
    mostLoyal?: { charId: CharacterID, loyaltyScore: number };
    biggestFlip?: { charId: CharacterID, flipVote: { voterId: CharacterID, targetId: CharacterID, round: number } };
    socialButterfly?: { charId: CharacterID, allianceCount: number };
    underdog?: { charId: CharacterID, votesSurvived: number };
}

export interface SurvivorSeason {
  id: string;
  seed: string;
  hostId: CharacterID;
  cast: CharacterID[];
  dossiers: Record<CharacterID, SurvivorDossier>;
  round: number;
  phase: 'setup' | 'host_round_intro' | 'trial' | 'host_trial_intro' | 'trial_in_progress' | 'trial_end' | 'camp' | 'tribunal' | 'advantage_play' | 'voting_ceremony' | 'vote' | 'elimination' | 'host_elimination_sendoff' | 'elimination_reveal' | 'host_finale_open' | 'finale_opening_statements' | 'jury_questions' | 'finale_closing_statements' | 'jury_voting' | 'jury_vote_reveal' | 'finale' | 'finished';
  rounds: RoundSummary[];
  alliances: Alliance[];
  gameLog: LogEntry[];
  userBets: Bet[];
  champion: CharacterID | null;
  bookmarks: Bookmark[];
  settings: SurvivorSettings;
  audienceInfluenceUses: {
    save: boolean;
    tie: boolean;
    reveal: boolean;
  };
  forceTieVote?: boolean;
  createdAt: number;
  completedAt: number | null;
  isPaused: boolean;
  points: number;
  skippingToBookmark?: {
    originalSpeed: SurvivorSpeed;
  };
  jury: CharacterID[];
  finalists: CharacterID[];
  // State for the current round's events
  pendingVotes?: Vote[]; // Votes are calculated and stored here before the ceremony
  votingCeremonyIndex?: number;
  voteRevealIndex?: number;
  votes?: Vote[];
  juryVotes?: { voterId: CharacterID; targetId: CharacterID; }[];
  juryVoteRevealIndex?: number;
  currentTrial?: {
    name: string;
    category: SurvivorTrialCategory;
    description: string;
    primaryTrait: SurvivorTrial['primaryTrait'];
  };
  currentTrialRun?: { charId: CharacterID; progress: number; status?: 'active' | 'out'; }[];
  trialProgressStep?: number;
  tribunalTopic?: string;
  seasonStats?: PostSeasonStats;
  // Additions for voiced debate
  tribunalDebate?: { speaker_name: string; line: string; }[];
  tribunalDebateIndex?: number;
  speakingDebateCharacterId?: CharacterID | null;
  tokensUsedThisRound: number;
  activeMainView: 'log' | 'graph';
  justEliminatedId?: CharacterID;
  hostCommentary: { line: string; character: Character; isSpeaking: boolean; } | null;
  // Finale State
  finaleSpeechIndex?: number;
  juryQuestionerIndex?: number;
  juryQuestionTargetIndex?: number;
  currentDialogue?: { speakerId: CharacterID; line: string; type: 'speech' | 'question' | 'answer'; } | null;
}

export interface DirectorDecision {
    speakerIds: string[];
    topicNudge: string;
    tempoHint: 'slow' | 'medium' | 'fast';
    why: string;
}

export interface ReflectionResult {
    summary: string;
    topicWeights: Record<string, number>;
    hooks: string[];
}

// --- Quiz Types ---

export interface QuizResult {
  characterId: string;
  score: number;
}

export interface QuizMeta {
  name: string;
  version: string;
  schema: string;
  notes: string;
  characters: string[];
}

export interface QuizWeights {
  [characterId: string]: number;
}

export interface QuizOption {
  id: string;
  label: string;
  weight: QuizWeights;
}

export interface QuizQuestion {
  id: string;
  type: 'slider' | 'yesno' | 'multiple';
  text: string;
  subtitle?: string;
  range?: {
    min: number;
    max: number;
    labels: [string, string];
  };
  interpolate?: {
    leftWeights: QuizWeights;
    rightWeights: QuizWeights;
  };
  yesWeights?: QuizWeights;
  noWeights?: QuizWeights;
  options?: QuizOption[];
}

export interface QuizData {
  meta: QuizMeta;
  questions: QuizQuestion[];
}

// --- Survivor Vote Reveal Types ---

export interface CharacterMeta {
  id: CharacterID;
  name: string;
  color?: string; // hex or tailwind token
  avatarUrl?: string;
}

export type CharacterMap = Map<CharacterID, CharacterMeta>;

export interface VoteRevealProps {
  votes: Vote[];
  /**
   * Current reveal index from your season state (0-based, -1 means not started)
   * The component will render votes.slice(0, index+1)
   */
  index: number;
  characterMap: CharacterMap;
  speed: SurvivorSpeed; // wire to season.settings.speed
  isPaused?: boolean;
  autoPlay?: boolean; // default true
  revealIntervalMs?: number; // per-card cadence at 1x speed (default 2000)
  onAdvance: (nextIndex: number) => void; // increment index in season state
  onComplete?: () => void; // called when last vote is revealed
  isFinalVote?: boolean;
  jurySize?: number;
}