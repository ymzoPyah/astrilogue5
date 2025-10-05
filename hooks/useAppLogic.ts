import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Character, Message, Session, Usage, Limits, View, SidebarType, UserPreferences, ConversationTemplate, LoreEntry, EmotionState, Branch, Memory, CharacterDesire, Scene, CharacterGoal, SideConversationResult, Feedback, Preset, TelemetryEvent, EnhancedScenario, ScenarioId, BadgeId, QuizResult, SurvivorSeason, SurvivorDossier, SurvivorArchetype, CharacterID, LogEntry, SurvivorTrial, SurvivorTrialCategory, Bet, Alliance, Bookmark, SurvivorAdvantage, RoundSummary, PostSeasonStats, DirectorDecision, InterventionResult, ReflectionResult, EmotionScores } from '../types';
import { CHARACTERS, SURVIVOR_TRIALS } from '../constants/constants';
import { CONVERSATION_TEMPLATES } from '../constants/templates';
import { ENHANCED_SCENARIOS } from '../constants/enhancedScenarios';
import { SCENES } from '../constants/scenes';
import { GOALS } from '../constants/goals';
import { callCharacterModel, callDirectorModel, callEmotionAnalysisModel, selectRelevantMemories, callDesireToSpeakModel, simulateSideConversation, callInterventionModel, callReflectionModel, generateImage, editImage, generateSurvivorCampWindow, generateSurvivorAllianceHint, generateSurvivorSchemingNote, generateSurvivorEchoNote, generateSurvivorSpotlight, generateSurvivorConfession, generateSurvivorTribunalDebate, generateHostRoundIntro, generateHostTrialIntro, generateHostEliminationSendoff, generateHostFinaleOpen, testCharacterResponse, generateAvatarPrompt, callFusionModel, generateSurvivorLore, generateFinalistOpeningStatement, generateJuryQuestion, generateFinalistAnswer, generateFinalistClosingStatement } from '../services/geminiService';
import { extractLoreFromSession } from '../services/loreService';
import { guardedCall } from '../services/guard';
import { encodePreset, decodePreset } from '../services/presets';
import { SeededRNG } from '../utils/seededRng';
import { maybeAwardBadge } from '../badges/award';
import { ttsService } from '../services/ttsService';


// --- Survivor Logic Helpers ---

const updateAlliances = (dossiers: SurvivorDossier[], existingAlliances: Alliance[], rng: SeededRNG): Alliance[] => {
    const activeChars = dossiers.filter(d => !d.eliminatedRound);
    const newAlliances = [...existingAlliances];
    const alliedChars = new Set(newAlliances.flatMap(a => a.members));

    const potentialAllies = activeChars.filter(c => !alliedChars.has(c.charId));

    for (let i = 0; i < potentialAllies.length - 1; i++) {
        for (let j = i + 1; j < potentialAllies.length; j++) {
            const char1 = potentialAllies[i];
            const char2 = potentialAllies[j];
            if (char1.static.archetype === char2.static.archetype && !char1.rivalries.includes(char2.charId)) {
                if (rng.next() > 0.5) {
                    newAlliances.push({ id: `alliance-${Date.now()}-${rng.next()}`, members: [char1.charId, char2.charId], strength: 0.6 });
                    alliedChars.add(char1.charId);
                    alliedChars.add(char2.charId);
                    i = j;
                    break;
                }
            }
        }
    }
    return newAlliances;
};


const selectTrial = (season: SurvivorSeason, rng: SeededRNG): SurvivorSeason['currentTrial'] => {
    const recentCategories = season.rounds.slice(-2).map(r => r.trial.category);
    const availableCategories = (Object.keys(SURVIVOR_TRIALS) as SurvivorTrialCategory[]).filter(c => !recentCategories.includes(c));
    const category = rng.select(availableCategories.length > 0 ? availableCategories : (Object.keys(SURVIVOR_TRIALS) as SurvivorTrialCategory[]));
    const trial = rng.select(SURVIVOR_TRIALS[category]);
    return { ...trial, category };
}

const calculateVote = (voterDossier: SurvivorDossier, otherDossiers: SurvivorDossier[], alliances: Alliance[], currentRound: number, rng: SeededRNG, characterMap: Map<CharacterID, Character>): { targetId: CharacterID, reasoning: string } => {
    const scores: { charId: CharacterID, score: number, reasons: string[] }[] = [];
    const voterAllies = alliances.find(a => a.members.includes(voterDossier.charId))?.members || [];

    for (const targetDossier of otherDossiers) {
        let score = 0;
        let reasons: string[] = [];

        if (voterAllies.includes(targetDossier.charId)) {
            score += 10;
            reasons.push("they are a key ally");
        } else if (voterDossier.static.archetype === 'loyalist') {
            score -= 2;
            reasons.push("they are outside my alliance");
        }
        
        const threatScore = (targetDossier.static.baseTraits.logic + targetDossier.static.baseTraits.persuasion) / 2;
        if (threatScore > 0.7 && voterDossier.static.archetype === 'strategist') {
            score -= 3; 
            reasons.push("they are a strong strategic threat");
        }
        
        if(voterDossier.rivalries.includes(targetDossier.charId)) {
            score -= 4;
            reasons.push("we have a rivalry");
        }
        
        if (voterDossier.static.archetype === 'wildcard') {
            score += (rng.next() - 0.5) * 5;
            reasons.push("it felt like the unpredictable move");
        }

        scores.push({ charId: targetDossier.charId, score: score, reasons: reasons });
    }

    scores.sort((a, b) => a.score - b.score);
    const target = scores[0];
    const targetName = characterMap.get(target.charId)?.name || target.charId;

    let finalReason = "It was a tough decision.";
    if (target.reasons.length > 0) {
        const reasonClause = target.reasons[0];
        switch(reasonClause){
            case "they are a key ally": finalReason = `I can't vote for an ally.`; break; // this shouldn't be picked but as a fallback
            case "they are outside my alliance": finalReason = `My alliance needs to stay strong, so I'm voting for ${targetName}.`; break;
            case "they are a strong strategic threat": finalReason = `${targetName} is a strong threat after their recent performance.`; break;
            case "we have a rivalry": finalReason = `It's time to settle a score with ${targetName}.`; break;
            case "it felt like the unpredictable move": finalReason = `Making a chaotic move to shake things up. My vote is for ${targetName}.`; break;
            default: finalReason = `I'm voting for ${targetName} because ${reasonClause}.`;
        }
    } else if (voterDossier.static.archetype === 'social_butterfly') {
        finalReason = "I'm voting with the group to maintain harmony.";
    } else {
         finalReason = `Targeting ${targetName} seems like the safest option for my game right now.`;
    }

    return { targetId: target.charId, reasoning: finalReason };
}

const calculateJuryVote = (jurorId: CharacterID, finalistDossiers: SurvivorDossier[], season: SurvivorSeason, rng: SeededRNG): CharacterID => {
    const jurorDossier = season.dossiers[jurorId];
    if (!jurorDossier) return finalistDossiers[0].charId;

    const scores = finalistDossiers.map(finalist => {
        let score = 0;
        
        // Did they vote me out?
        const myEliminationRound = season.rounds.find(r => r.eliminatedId === jurorId);
        if (myEliminationRound && myEliminationRound.votes.some(v => v.voterId === finalist.charId)) {
            score -= 5;
        }

        // Were we allies?
        if (season.alliances.some(a => a.members.includes(jurorId) && a.members.includes(finalist.charId))) {
            score += 3;
        }
        
        // Strategic gameplay (trial wins)
        const trialWins = Object.values(finalist.rounds).filter((r: any) => r.state.immunity).length;
        score += trialWins;

        score += rng.next(); // Add some randomness

        return { charId: finalist.charId, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].charId;
};

const calculatePostSeasonStats = (season: SurvivorSeason): PostSeasonStats => {
    const votingHistory: Record<CharacterID, Record<CharacterID, number>> = {};
    season.cast.forEach(voterId => {
        votingHistory[voterId] = {};
        season.cast.forEach(targetId => {
            votingHistory[voterId][targetId] = 0;
        });
    });

    const correctVotes: Record<CharacterID, number> = {};
    season.cast.forEach(id => { correctVotes[id] = 0; });
    
    const loyaltyScores: Record<CharacterID, { votesWith: number, totalVotes: number }> = {};
    const allianceCounts: Record<CharacterID, Set<string>> = {};
    const flipVotes: { charId: CharacterID, flipVote: { voterId: CharacterID, targetId: CharacterID, round: number } }[] = [];
    const votesSurvived: Record<CharacterID, number> = {};

    season.cast.forEach(id => {
        loyaltyScores[id] = { votesWith: 0, totalVotes: 0 };
        allianceCounts[id] = new Set();
        votesSurvived[id] = 0;
    });

    season.rounds.forEach(round => {
        const alliancesThisRound = new Map<CharacterID, CharacterID[]>();
        season.cast.forEach(charId => {
            const dossier = season.dossiers[charId];
            if (dossier && dossier.rounds[round.roundNumber]) {
                const dossierAlliances = dossier.rounds[round.roundNumber].state.alliances || [];
                dossierAlliances.forEach(alliance => {
                    const allianceId = [...alliance].sort().join('-');
                    alliance.forEach(member => {
                        if (!alliancesThisRound.has(member)) alliancesThisRound.set(member, alliance);
                        if(allianceCounts[member]) allianceCounts[member].add(allianceId);
                    });
                });
            }
        });

        round.votes.forEach(vote => {
            if (votingHistory[vote.voterId]) {
                votingHistory[vote.voterId][vote.targetId] = (votingHistory[vote.voterId][vote.targetId] || 0) + 1;
            }
            if (vote.targetId === round.eliminatedId) {
                correctVotes[vote.voterId]++;
            }

            const voterAllies = alliancesThisRound.get(vote.voterId);
            if (voterAllies) {
                loyaltyScores[vote.voterId].totalVotes++;
                const allianceVotes = round.votes.filter(v => voterAllies.includes(v.voterId));
                const voteCounts: Record<CharacterID, number> = {};
                allianceVotes.forEach(av => { voteCounts[av.targetId] = (voteCounts[av.targetId] || 0) + 1; });
                const majorityTarget = Object.entries(voteCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
                if (vote.targetId === majorityTarget) {
                    loyaltyScores[vote.voterId].votesWith++;
                }
                if (voterAllies.includes(vote.targetId)) {
                    flipVotes.push({ charId: vote.voterId, flipVote: { ...vote, round: round.roundNumber }});
                }
            }
        });
        const votesThisRound: Record<CharacterID, number> = {};
        round.votes.forEach(v => { votesThisRound[v.targetId] = (votesThisRound[v.targetId] || 0) + 1; });
        for (const charId in votesThisRound) {
            if (charId !== round.eliminatedId) {
                votesSurvived[charId] = (votesSurvived[charId] || 0) + votesThisRound[charId];
            }
        }
    });

    const sortedStrategic = Object.entries(correctVotes).sort((a, b) => b[1] - a[1]);
    const mostStrategicPlayer = { charId: sortedStrategic[0]?.[0] || '', correctVotes: sortedStrategic[0]?.[1] || 0 };

    let biggestRivalry = { charId1: '', charId2: '', mutualVotes: 0 };
    for (let i = 0; i < season.cast.length; i++) {
        for (let j = i + 1; j < season.cast.length; j++) {
            const char1 = season.cast[i];
            const char2 = season.cast[j];
            const votes1to2 = votingHistory[char1]?.[char2] || 0;
            const votes2to1 = votingHistory[char2]?.[char1] || 0;
            const mutual = votes1to2 + votes2to1;
            if (mutual > biggestRivalry.mutualVotes) {
                biggestRivalry = { charId1: char1, charId2: char2, mutualVotes: mutual };
            }
        }
    }

    const loyaltyFinal = Object.entries(loyaltyScores).map(([charId, { votesWith, totalVotes }]) => ({ charId, loyaltyScore: totalVotes > 0 ? votesWith / totalVotes : 0 })).sort((a,b) => b.loyaltyScore - a.loyaltyScore);
    const mostLoyal = loyaltyFinal[0];

    const socialFinal = Object.entries(allianceCounts).map(([charId, alliances]) => ({ charId, allianceCount: alliances.size })).sort((a,b) => b.allianceCount - a.allianceCount);
    const socialButterfly = socialFinal[0];

    const biggestFlip = flipVotes.sort((a,b) => a.flipVote.round - b.flipVote.round)[0];
    const underdogFinal = Object.entries(votesSurvived).sort((a,b) => b[1] - a[1]);
    const underdog = { charId: underdogFinal[0]?.[0] || '', votesSurvived: underdogFinal[0]?.[1] || 0};

    return { mostStrategicPlayer, biggestRivalry, votingHistory, mostLoyal, biggestFlip, socialButterfly, underdog };
};


const useSurvivorEngineHook = (
    activeSeason: SurvivorSeason | null,
    updateSurvivorSeason: (seasonId: string, updates: Partial<SurvivorSeason> | ((s: SurvivorSeason) => Partial<SurvivorSeason>)) => void,
    characterMap: Map<CharacterID, Character>,
    sessions: Session[],
    setSessions: React.Dispatch<React.SetStateAction<Session[]>>,
    userPreferences: UserPreferences,
    apiKey: string,
    makeGuardedApiCall: any
) => {
    // Effect for handling host speech (TTS or timer) and advancing phase
    useEffect(() => {
        if (!activeSeason || !activeSeason.hostCommentary || !activeSeason.hostCommentary.isSpeaking || activeSeason.isPaused) {
            return;
        }

        const commentary = activeSeason.hostCommentary;
        const hostChar = commentary.character;
        const line = commentary.line;

        const advance = () => {
            let nextPhase: SurvivorSeason['phase'] = activeSeason.phase; // fallback to current
            switch (activeSeason.phase) {
                case 'host_round_intro':
                    nextPhase = 'trial';
                    break;
                case 'host_trial_intro':
                    nextPhase = 'trial_in_progress';
                    break;
                case 'host_elimination_sendoff':
                    nextPhase = 'elimination_reveal';
                    break;
                case 'host_finale_open':
                    nextPhase = 'finale_opening_statements';
                    break;
            }
            updateSurvivorSeason(activeSeason.id, { hostCommentary: null, phase: nextPhase });
        };

        if (userPreferences.survivorVoicesEnabled) {
            ttsService.speak({
                text: line,
                character: hostChar,
                preferences: userPreferences,
                onStart: () => {},
                onEnd: advance
            });
        } else {
            const delay = line.length * 60 + 1500; // Adjusted delay for reading
            const timer = setTimeout(advance, delay);
            return () => clearTimeout(timer);
        }
    }, [activeSeason?.hostCommentary, activeSeason?.isPaused, userPreferences, updateSurvivorSeason, activeSeason?.id, activeSeason?.phase, activeSeason?.finalists.length, activeSeason?.settings.toggles.jury]);
    
    // Main simulation timer loop
    useEffect(() => {
        if (!activeSeason || activeSeason.isPaused || activeSeason.phase === 'finished' || activeSeason.tribunalDebate || activeSeason.hostCommentary || activeSeason.currentDialogue) {
            return;
        }

        if (activeSeason.phase === 'vote' || activeSeason.phase === 'jury_vote_reveal') {
            return; // Engine pauses during interactive vote reveals.
        }

        const advancePhase = async () => {
            if (!activeSeason) return;

            let nextPhase: SurvivorSeason['phase'] = activeSeason.phase;
            let nextRound = activeSeason.round;
            const newLogEntries: LogEntry[] = [];
            let updates: Partial<SurvivorSeason> = {};

            const activeDossiers = activeSeason.cast.map(id => activeSeason.dossiers[id]).filter(d => !d.eliminatedRound);
            const rng = new SeededRNG(parseInt(activeSeason.seed.replace(/\D/g, '')) + activeSeason.round);
            
            const host = characterMap.get(activeSeason.hostId);
            const hostPersona = host?.systemPrompt || 'You are a reality TV show host.';


            switch (activeSeason.phase) {
                case 'setup':
                    newLogEntries.push({ id: `log-${Date.now()}`, kind: 'round_start', round: nextRound, ts: Date.now(), participants: activeDossiers.map(d => d.charId), summary: `Round ${nextRound} begins. ${activeDossiers.length} players remain.`, seed: activeSeason.seed + nextRound });
                    nextPhase = 'host_round_intro';
                    break;
                
                case 'host_round_intro': {
                    (async () => {
                        if (!host) return;
                        const line = await makeGuardedApiCall(() => generateHostRoundIntro(apiKey, userPreferences.modelPrefs.analysis, hostPersona, activeSeason.round, activeDossiers.length));
                        if (line) {
                            updateSurvivorSeason(activeSeason.id, { hostCommentary: { line, character: host, isSpeaking: true } });
                        } else {
                            // If API fails, skip host and go to trial
                            updateSurvivorSeason(activeSeason.id, { phase: 'trial' });
                        }
                    })();
                    return; // Stop timer loop
                }

                case 'trial': {
                    const trial = selectTrial(activeSeason, rng);
                    const trialParticipants = activeDossiers.map(d => ({
                        charId: d.charId,
                        progress: 0,
                        status: 'active' as 'active' | 'out',
                    }));
                    updates.currentTrial = trial;
                    updates.currentTrialRun = trialParticipants;
                    updates.trialProgressStep = 0;
                    nextPhase = 'host_trial_intro';
                    break;
                }

                case 'host_trial_intro': {
                    (async () => {
                        if (!host || !activeSeason.currentTrial) return;
                        const line = await makeGuardedApiCall(() => generateHostTrialIntro(apiKey, userPreferences.modelPrefs.analysis, hostPersona, activeSeason.currentTrial));
                        if (line) {
                            updateSurvivorSeason(activeSeason.id, { hostCommentary: { line, character: host, isSpeaking: true } });
                        } else {
                            updateSurvivorSeason(activeSeason.id, { phase: 'trial_in_progress' });
                        }
                    })();
                    return;
                }

                case 'trial_in_progress': {
                    const totalSteps = 8;
                    const step = activeSeason.trialProgressStep ?? 0;
                
                    if (step < totalSteps) {
                        let updatedRun = [...(activeSeason.currentTrialRun ?? [])];
                        const activeCompetitors = updatedRun.filter(p => p.status === 'active');
                        const leaderProgress = activeCompetitors.length > 0 ? Math.max(...activeCompetitors.map(p => p.progress)) : 0;
                        const progressThreshold = Math.max(10, leaderProgress - 30);
                
                        updatedRun = updatedRun.map(p => {
                            if (p.status === 'out') return p;
                
                            const dossier = activeSeason.dossiers[p.charId];
                            const traitScore = dossier.static.baseTraits[activeSeason.currentTrial!.primaryTrait];
                            
                            let increment = (traitScore + (rng.next() - 0.5) * 0.4) * (1 + activeSeason.settings.fateNudge);
                            increment = Math.max(0.1, increment) * 5; 
                
                            if (p.progress < leaderProgress && leaderProgress > 10 && rng.next() > 0.65) {
                                increment *= (1.5 + rng.next() * 0.5);
                            }
                            
                            if (p.progress >= leaderProgress && leaderProgress > 40 && rng.next() > 0.8) {
                                increment *= 0.3;
                            }
                
                            const newProgress = p.progress + increment;
                            const newStatus = (step > 3 && newProgress < progressThreshold && activeCompetitors.length > 2) ? 'out' : 'active';
                
                            return { ...p, progress: Math.min(100, newProgress), status: newStatus };
                        });
                
                        updates.currentTrialRun = updatedRun;
                        updates.trialProgressStep = step + 1;
                        nextPhase = 'trial_in_progress';
                    } else {
                        const winner = (activeSeason.currentTrialRun ?? []).filter(p => p.status === 'active').reduce((prev, current) => (prev.progress > current.progress) ? prev : current, {charId: '', progress: 0, status: 'out'});
                        const trialWinnerId = winner.charId;
                
                        const updatedDossiers = { ...activeSeason.dossiers };
                         activeDossiers.forEach(dossier => {
                            const lastRoundNumber = nextRound - 1;
                            const lastRoundTrust = (lastRoundNumber > 0 && dossier.rounds[lastRoundNumber]?.state.trust) ? { ...dossier.rounds[lastRoundNumber].state.trust } : {};
                            
                            const roundData: SurvivorDossier['rounds'][number] = dossier.rounds[nextRound] ?? {
                                seed: `${activeSeason.seed}-R${nextRound}-${dossier.charId}`,
                                state: { trust: lastRoundTrust, alliances: [], suspicion: 0, voteIntent: '', influencedBy: [], flags: [], immunity: false },
                                materials: { schemingNote: { hash: '', materialized: false, content: '' } },
                            };
                            
                            if (!roundData.state.trust || Object.keys(roundData.state.trust).length === 0) {
                                roundData.state.trust = lastRoundTrust;
                            }
                            
                            updatedDossiers[dossier.charId] = {
                                ...dossier,
                                rounds: { ...dossier.rounds, [nextRound]: { ...roundData, state: { ...roundData.state, immunity: dossier.charId === trialWinnerId } } },
                            };
                        });
                        updates.dossiers = updatedDossiers;
                
                        newLogEntries.push({ id: `log-${Date.now()}`, kind: 'trial_result', round: nextRound, ts: Date.now(), participants: [trialWinnerId], summary: `wins the "${activeSeason.currentTrial?.name}" trial and is immune!`, seed: activeSeason.seed + nextRound + 'trial' });
                        
                        nextPhase = 'trial_end';
                    }
                    break;
                }

                case 'trial_end':
                    updates.trialProgressStep = undefined;
                    updates.currentTrialRun = undefined;
                    nextPhase = 'camp';
                    break;
                
                case 'camp': {
                    const newAlliances = updateAlliances(activeDossiers, activeSeason.alliances, rng);
                    updates.alliances = newAlliances;
                    
                    updates.dossiers = { ...activeSeason.dossiers };
                    const trustBoost = 0.05;
                    newAlliances.forEach(alliance => {
                        for (let i = 0; i < alliance.members.length; i++) {
                            for (let j = i + 1; j < alliance.members.length; j++) {
                                const char1Id = alliance.members[i];
                                const char2Id = alliance.members[j];
                                const dossier1 = updates.dossiers![char1Id];
                                const dossier2 = updates.dossiers![char2Id];

                                if (dossier1 && dossier2) {
                                    const roundState1 = dossier1.rounds[nextRound]?.state;
                                    const roundState2 = dossier2.rounds[nextRound]?.state;
                                    if (roundState1 && roundState2) {
                                        roundState1.trust[char2Id] = (roundState1.trust[char2Id] || 0) + trustBoost;
                                        roundState2.trust[char1Id] = (roundState2.trust[char1Id] || 0) + trustBoost;
                                    }
                                }
                            }
                        }
                    });

                    const oldAllianceIds = new Set(activeSeason.alliances.map(a => a.members.sort().join('-')));
                    const newCreatedAlliances = newAlliances.filter(a => !oldAllianceIds.has(a.members.sort().join('-')));
                    for (const newAlliance of newCreatedAlliances) {
                        if (newAlliance.members.length > 1) { 
                            newLogEntries.push({ id: `log-alliance-${Date.now()}`, kind: 'alliance_hint', round: nextRound, ts: Date.now(), participants: newAlliance.members, summary: 'A new bond may be forming.', seed: activeSeason.seed + nextRound + 'alliance' + newAlliance.members.join(''), materialized: false, estTokens: 100 });
                        }
                    }
                    if (activeSeason.settings.toggles.secretAdvantages && rng.next() > 0.7) { // 30% chance per round
                        newLogEntries.push({ id: `log-adv-hide-${Date.now()}`, kind: 'secret_advantage_hidden', round: nextRound, ts: Date.now(), participants: [], summary: 'A secret advantage has been hidden at camp.', seed: `${activeSeason.seed}-R${nextRound}-adv-hide` });
                        const potentialFinders = activeDossiers.filter(d => d.static.baseTraits.chaos > 0.6 || d.static.baseTraits.logic > 0.6);
                        if (potentialFinders.length > 0) {
                            const finder = rng.select(potentialFinders);
                            if (finder && rng.next() > 0.5) {
                                updates.dossiers = updates.dossiers || { ...activeSeason.dossiers };
                                const finderDossier = updates.dossiers[finder.charId];
                                const advantageRoll = rng.next();
                                const newAdvantage: SurvivorAdvantage = advantageRoll < 0.34 ? 'immunity_idol' : (advantageRoll < 0.67 ? 'extra_vote' : 'block_vote');
                                const updatedAdvantages: SurvivorAdvantage[] = [...(finderDossier.advantages || []), newAdvantage];
                                updates.dossiers[finder.charId] = { ...finderDossier, advantages: updatedAdvantages };
                                newLogEntries.push({ id: `log-adv-find-${Date.now()}`, kind: 'secret_advantage_found', round: nextRound, ts: Date.now(), participants: [finder.charId], summary: `finds a ${newAdvantage.replace('_', ' ')}!`, seed: `${activeSeason.seed}-R${nextRound}-adv-find` });
                            }
                        }
                    }
                    if (!activeSeason.settings.quietHours) {
                        newLogEntries.push({ id: `log-${Date.now()}`, kind: 'camp_window', round: nextRound, ts: Date.now(), participants: activeDossiers.map(d => d.charId), summary: 'Tensions rise at camp.', seed: activeSeason.seed + nextRound + 'camp', materialized: false, estTokens: 250 });
                    }
                    nextPhase = 'tribunal';
                    break;
                }
                    
                case 'tribunal': {
                    const TRIBUNAL_TOPICS = ["Performance vs. Loyalty", "Eliminating Threats", "Coasting vs. Contributing", "Recent Betrayals"];
                    const topic = rng.select(TRIBUNAL_TOPICS);
                    updates.tribunalTopic = topic;
                    const logId = `log-tribunal-${Date.now()}`;
                    newLogEntries.push({ id: logId, kind: 'tribunal_summary', round: nextRound, ts: Date.now(), participants: activeDossiers.map(d => d.charId), summary: `The tribe debates. Topic: ${topic}.`, seed: activeSeason.seed + nextRound + 'tribunal', materialized: false, estTokens: 300 });

                    const immunityHolderId = activeDossiers.find(d => d.rounds[nextRound]?.state.immunity)?.charId;
                    const votes = activeDossiers.map(voterDossier => {
                        const potentialTargets = activeDossiers.filter(d => d.charId !== voterDossier.charId && d.charId !== immunityHolderId);
                        if (potentialTargets.length > 0) {
                            const vote = calculateVote(voterDossier, potentialTargets, activeSeason.alliances, nextRound, rng, characterMap);
                            return { voterId: voterDossier.charId, targetId: vote.targetId, reasoning: vote.reasoning };
                        }
                        return null;
                    }).filter((v): v is Exclude<typeof v, null> => v !== null);

                    updates.votes = votes;
                    nextPhase = 'tribunal'; // Stay in this phase to generate debate

                    // This part is async and will update the state, which triggers the debate useEffect
                    (async () => {
                        const debateParticipants = rng.shuffle(activeDossiers).slice(0, rng.nextInt(3, 5)).map(d => characterMap.get(d.charId)!.name);
                        
                        const debateLines = await makeGuardedApiCall(() => generateSurvivorTribunalDebate(apiKey, userPreferences.modelPrefs.analysis, debateParticipants, topic, activeSeason.seed + nextRound + 'tribunal-debate'));

                        if (debateLines && debateLines.length > 0) {
                            updateSurvivorSeason(activeSeason.id, {
                                ...updates,
                                gameLog: [...activeSeason.gameLog, ...newLogEntries],
                                tribunalDebate: debateLines,
                                tribunalDebateIndex: 0,
                            });
                        } else {
                            // If debate fails, skip to advantage play
                            updateSurvivorSeason(activeSeason.id, {
                                ...updates,
                                gameLog: [...activeSeason.gameLog, ...newLogEntries],
                                phase: 'advantage_play',
                            });
                        }
                    })();
                    return; // Stop advancePhase from setting state; the async block handles it.
                }
                
                case 'vote': {
                    // This phase is now fully controlled by the VoteReveal component and useVoteReveal hook.
                    // The engine waits here until the onComplete callback from the hook triggers a phase change.
                    nextPhase = 'vote'; // Stay in this phase, do nothing.
                    break;
                }

                case 'advantage_play': {
                    if (activeSeason.settings.toggles.secretAdvantages) {
                        updates.dossiers = { ...activeSeason.dossiers };
                        const voteCounts: Record<CharacterID, number> = {};
                        (activeSeason.votes || []).forEach(vote => {
                            voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
                        });
                        const sortedVotes = Object.entries(voteCounts).sort((a,b) => b[1] - a[1]);
                        const isCloseVote = sortedVotes.length > 1 && (sortedVotes[0][1] - sortedVotes[1][1] <= 1);

                        for (const dossier of activeDossiers) {
                            // Immunity Idol Logic
                            if (dossier.advantages && dossier.advantages.includes('immunity_idol')) {
                                const votesAgainst = voteCounts[dossier.charId] || 0;
                                const totalVotes = (activeSeason.votes || []).length;
                                if (votesAgainst > 0 && ((totalVotes > 0 && votesAgainst / totalVotes >= 0.3) || rng.next() > 0.5)) {
                                    const dossierToUpdate = updates.dossiers![dossier.charId];
                                    if (dossierToUpdate) {
                                        const roundData: SurvivorDossier['rounds'][number] = dossierToUpdate.rounds[nextRound] ?? {
                                            seed: `${activeSeason.seed}-R${nextRound}-${dossier.charId}`,
                                            state: { trust: {}, alliances: [], suspicion: 0, voteIntent: '', influencedBy: [], flags: [], immunity: false },
                                            materials: { schemingNote: { hash: '', materialized: false, content: '' } },
                                        };
                                        dossierToUpdate.advantages = dossierToUpdate.advantages.filter(adv => adv !== 'immunity_idol');
                                        dossierToUpdate.rounds[nextRound] = { ...roundData, state: { ...roundData.state, immunity: true } };
                                        newLogEntries.push({ id: `log-adv-play-${Date.now()}`, kind: 'secret_advantage_played', round: nextRound, ts: Date.now(), participants: [dossier.charId], summary: `plays a hidden immunity idol! Any votes against them will not count.`, seed: `${activeSeason.seed}-R${nextRound}-adv-play` });
                                    }
                                }
                            }
                            // Extra Vote Logic
                            if (dossier.advantages && dossier.advantages.includes('extra_vote')) {
                                if (isCloseVote || dossier.static.archetype === 'strategist' && rng.next() > 0.4) {
                                    const voterDossier = updates.dossiers![dossier.charId];
                                    if(voterDossier) {
                                        updates.dossiers![dossier.charId] = { ...voterDossier, advantages: voterDossier.advantages.filter(adv => adv !== 'extra_vote') };
                                        const immunityHolderId = activeDossiers.find(d => d.rounds[nextRound]?.state.immunity)?.charId;
                                        const potentialTargets = activeDossiers.filter(d => d.charId !== dossier.charId && d.charId !== immunityHolderId);
                                        if (potentialTargets.length > 0) {
                                            const extraVote = calculateVote(dossier, potentialTargets, activeSeason.alliances, nextRound, rng, characterMap);
                                            updates.votes = [...(updates.votes || activeSeason.votes || []), { voterId: dossier.charId, targetId: extraVote.targetId, reasoning: `(Extra Vote) ${extraVote.reasoning}` }];
                                        }
                                        newLogEntries.push({ id: `log-adv-play-extra-${Date.now()}`, kind: 'secret_advantage_played', round: nextRound, ts: Date.now(), participants: [dossier.charId], summary: `plays an extra vote advantage!`, seed: `${activeSeason.seed}-R${nextRound}-adv-play-extra` });
                                    }
                                }
                            }
                            // Block Vote Logic
                            if (dossier.advantages && dossier.advantages.includes('block_vote')) {
                                const voterDossier = updates.dossiers![dossier.charId];
                                if (voterDossier) {
                                    const myAllies = activeSeason.alliances.find(a => a.members.includes(dossier.charId))?.members || [dossier.charId];
                                    const voterTrustScores = voterDossier.rounds[nextRound]?.state.trust ?? {};
                                    const potentialTargetsToBlock = activeDossiers
                                        .filter(d => !myAllies.includes(d.charId))
                                        .sort((a, b) => (voterTrustScores[a.charId] || 0) - (voterTrustScores[b.charId] || 0));

                                    if (potentialTargetsToBlock.length > 0 && (isCloseVote || dossier.static.archetype === 'strategist' && rng.next() > 0.4)) {
                                        const targetToBlockId = potentialTargetsToBlock[0].charId;
                                        
                                        if (targetToBlockId) {
                                            updates.dossiers![dossier.charId] = { ...voterDossier, advantages: voterDossier.advantages.filter(adv => adv !== 'block_vote') };
                                            
                                            if (!updates.votes) {
                                                updates.votes = [...(activeSeason.votes || [])];
                                            }

                                            const voteIndexToBlock = updates.votes.findIndex(v => v.voterId === targetToBlockId);
                                            if (voteIndexToBlock > -1) {
                                                const blockedVote = updates.votes.splice(voteIndexToBlock, 1)[0];
                                                newLogEntries.push({ 
                                                    id: `log-adv-play-block-${Date.now()}`, 
                                                    kind: 'secret_advantage_played', 
                                                    round: nextRound, 
                                                    ts: Date.now(), 
                                                    participants: [dossier.charId, targetToBlockId], 
                                                    summary: `plays a 'Block a Vote' advantage against ${characterMap.get(targetToBlockId)?.name}! Their vote for ${characterMap.get(blockedVote.targetId)?.name} will not count.`, 
                                                    seed: `${activeSeason.seed}-R${nextRound}-adv-play-block` 
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    updates.votingCeremonyIndex = 0;
                    nextPhase = 'voting_ceremony';
                    break;
                }

                 case 'voting_ceremony': {
                    const index = activeSeason.votingCeremonyIndex ?? -1;
                    if (index < activeDossiers.length - 1) {
                        updates.votingCeremonyIndex = index + 1;
                        nextPhase = 'voting_ceremony';
                    } else {
                        updates.votingCeremonyIndex = undefined;
                        updates.voteRevealIndex = -1; // Start before the first vote
                        nextPhase = 'vote';
                    }
                    break;
                }

                case 'elimination': {
                    let finalVotes = [...(activeSeason.votes || [])];
                    if (activeSeason.forceTieVote) {
                        const tempCounts: Record<CharacterID, number> = {};
                        finalVotes.forEach(v => { tempCounts[v.targetId] = (tempCounts[v.targetId] || 0) + 1; });
                        const sorted = Object.entries(tempCounts).sort((a, b) => b[1] - a[1]);
                        if (sorted.length > 1 && sorted[0][1] > sorted[1][1]) {
                            const top = sorted[0][0], second = sorted[1][0];
                            const idx = finalVotes.findIndex(v => v.targetId === top);
                            if (idx > -1) finalVotes[idx] = { ...finalVotes[idx], targetId: second };
                        }
                        updates.forceTieVote = false;
                    }

                    const immuneCharIds = new Set<CharacterID>();
                    activeDossiers.forEach(d => {
                        if (d.rounds[activeSeason.round]?.state.immunity) {
                            immuneCharIds.add(d.charId);
                        }
                    });

                    const validVotes = finalVotes.filter(vote => !immuneCharIds.has(vote.targetId));
                    const voteCounts: Record<CharacterID, number> = {};
                    validVotes.forEach(vote => { voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1; });
                    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
                    
                    let eliminatedId: CharacterID | undefined;
                    if (sortedVotes.length === 0 && validVotes.length < finalVotes.length) {
                        eliminatedId = undefined; 
                    } else if (sortedVotes.length > 1 && sortedVotes[0][1] === sortedVotes[1][1]) {
                        const tiedIds = sortedVotes.filter(v => v[1] === sortedVotes[0][1]).map(v => v[0]);
                        const tiedDossiers = activeDossiers.filter(d => tiedIds.includes(d.charId));
                        tiedDossiers.sort((a, b) => {
                            const threatA = a.static.baseTraits.logic + a.static.baseTraits.persuasion;
                            const threatB = b.static.baseTraits.logic + b.static.baseTraits.persuasion;
                            return threatB - threatA;
                        });
                        eliminatedId = tiedDossiers[0]?.charId;
                    } else {
                        eliminatedId = sortedVotes[0]?.[0];
                    }
                    
                    let newPoints = activeSeason.points || 0;
                    updates.dossiers = { ...activeSeason.dossiers };
                    updates.bookmarks = [...activeSeason.bookmarks];

                    // Social dynamics update
                    const voterTrustPenalty = -0.1;
                    const targetTrustPenalty = -0.3;
                    const betrayalTrustPenalty = -0.6;

                    finalVotes.forEach(vote => {
                        const { voterId, targetId } = vote;
                        const voterDossier = updates.dossiers![voterId];
                        const targetDossier = updates.dossiers![targetId];

                        if (!voterDossier || !targetDossier) return;

                        const voterRoundState = voterDossier.rounds[nextRound]?.state;
                        const targetRoundState = targetDossier.rounds[nextRound]?.state;

                        if (!voterRoundState || !targetRoundState) return;

                        voterRoundState.trust[targetId] = (voterRoundState.trust[targetId] || 0) + voterTrustPenalty;
                        targetRoundState.trust[voterId] = (targetRoundState.trust[voterId] || 0) + targetTrustPenalty;

                        const wereAllies = activeSeason.alliances.some(a => a.members.includes(voterId) && a.members.includes(targetId));
                        if (wereAllies) {
                            targetRoundState.trust[voterId] += betrayalTrustPenalty;
                            
                            if (!voterDossier.rivalries.includes(targetId)) {
                                voterDossier.rivalries.push(targetId);
                                targetDossier.rivalries.push(voterId);

                                const rivalryLogId = `log-rivalry-${Date.now()}`;
                                newLogEntries.push({
                                    id: rivalryLogId, kind: 'rivalry_formed', round: nextRound, ts: Date.now(),
                                    participants: [voterId, targetId],
                                    summary: `A new rivalry has formed between ${characterMap.get(voterId)?.name} and ${characterMap.get(targetId)?.name} after a shocking betrayal!`,
                                    seed: `${activeSeason.seed}-rivalry-${voterId}-${targetId}`
                                });
                                updates.bookmarks.push({ id: `bookmark-rivalry-${Date.now()}`, round: nextRound, kind: 'rivalry', summary: `Rivalry: ${characterMap.get(voterId)?.name} vs ${characterMap.get(targetId)?.name}`, createdAt: Date.now(), logEntryId: rivalryLogId });
                            }
                        }
                    });
                    
                    const originalVoteCounts: Record<CharacterID, number> = {};
                    finalVotes.forEach(vote => { originalVoteCounts[vote.targetId] = (originalVoteCounts[vote.targetId] || 0) + 1; });
                    const originalSortedVotes = Object.entries(originalVoteCounts).sort((a, b) => b[1] - a[1]);
                    const voteSummary = originalSortedVotes.map(([id, count]) => {
                        const name = characterMap.get(id)?.name || id;
                        if (immuneCharIds.has(id) && count > 0) return `${name}: ${count} (Doesn't count)`;
                        return `${name}: ${count}`;
                    }).join(', ');

                    const newRoundSummary: RoundSummary = {
                        roundNumber: nextRound,
                        trial: { name: activeSeason.currentTrial?.name || 'Unknown', category: activeSeason.currentTrial?.category || 'logic', winnerIds: [activeDossiers.find(d => d.rounds[nextRound]?.state.immunity)?.charId || ''] },
                        eliminatedId: eliminatedId || '',
                        votes: finalVotes.map(v => ({ voterId: v.voterId, targetId: v.targetId })),
                    };
                    updates.rounds = [...activeSeason.rounds, newRoundSummary];

                    if (eliminatedId) {
                        updates.dossiers[eliminatedId] = { ...updates.dossiers[eliminatedId], eliminatedRound: nextRound };
                        const eliminationLogId = `log-elim-${Date.now()}`;
                        newLogEntries.push({ id: eliminationLogId, kind: 'elimination', round: nextRound, ts: Date.now(), participants: [eliminatedId], summary: `has been voted out. (${voteSummary})`, seed: activeSeason.seed + nextRound + 'elim', materialized: false, estTokens: 120 });
                        
                        if (activeSeason.settings.toggles.jury && activeDossiers.length <= 7) {
                            updates.jury = [...(activeSeason.jury || []), eliminatedId];
                            const juryNumber = (activeSeason.jury || []).length + 1;
                            const suffix = juryNumber === 1 ? 'st' : juryNumber === 2 ? 'nd' : juryNumber === 3 ? 'rd' : 'th';
                            newLogEntries.push({ id: `log-jury-${Date.now()}`, kind: 'elimination', round: nextRound, ts: Date.now(), participants: [eliminatedId], summary: `is the ${juryNumber}${suffix} member of the jury.`, seed: activeSeason.seed + nextRound + 'jury', materialized: true });
                        }

                        if (activeSeason.settings.toggles.confessionCam) {
                            newLogEntries.push({ id: `log-confession-${Date.now()}`, kind: 'confession_cam', round: nextRound, ts: Date.now(), participants: [eliminatedId], summary: `A final word from ${characterMap.get(eliminatedId)?.name}.`, seed: `${activeSeason.seed}-R${nextRound}-confession`, materialized: false, estTokens: 100 });
                        }

                        (activeSeason.votes || []).forEach(vote => {
                            const voterAllies = activeSeason.alliances.find(a => a.members.includes(vote.voterId))?.members || [];
                            if (voterAllies.includes(vote.targetId)) {
                                updates.bookmarks.push({ id: `bookmark-betrayal-${Date.now()}`, round: nextRound, kind: 'betrayal', summary: `Betrayal: ${characterMap.get(vote.voterId)?.name} votes for ally ${characterMap.get(vote.targetId)?.name}`, createdAt: Date.now(), logEntryId: eliminationLogId });
                                const arc = updates.dossiers[vote.voterId].arc;
                                updates.dossiers[vote.voterId] = { ...updates.dossiers[vote.voterId], arc: {...arc, current: 'betrayer', keyMoment: `R${nextRound}: Betrayal`} };
                            }
                        });

                        if (sortedVotes.length > 1 && sortedVotes[0][1] - sortedVotes[1][1] <= 1) {
                            updates.bookmarks.push({ id: `bookmark-close-vote-${Date.now()}`, round: nextRound, kind: 'close_vote', summary: `Close Vote: ${characterMap.get(sortedVotes[0][0])?.name} vs ${characterMap.get(sortedVotes[1][0])?.name}`, createdAt: Date.now(), logEntryId: eliminationLogId });
                        }

                        const roundBet = activeSeason.userBets.find(b => b.type === 'round' && b.round === nextRound);
                        if (roundBet && roundBet.target === eliminatedId) {
                            newPoints += 1;
                        }
                        updates.justEliminatedId = eliminatedId;
                    } else {
                        // Handle case where no one is eliminated
                        const eliminationLogId = `log-no-elim-${Date.now()}`;
                        newLogEntries.push({ id: eliminationLogId, kind: 'elimination', round: nextRound, ts: Date.now(), participants: [], summary: `No one was eliminated! Votes were nullified. (${voteSummary})`, seed: activeSeason.seed + nextRound + 'no-elim' });
                    }
                    updates.points = newPoints;

                    updates.votes = [];
                    updates.voteRevealIndex = 0;
                    updates.currentTrial = undefined;
                    nextPhase = 'host_elimination_sendoff';
                    break;
                }

                case 'host_elimination_sendoff': {
                     (async () => {
                        const eliminatedChar = activeSeason.justEliminatedId ? characterMap.get(activeSeason.justEliminatedId) : null;
                        if (!host || !eliminatedChar) {
                            // If something fails, just reveal
                            updateSurvivorSeason(activeSeason.id, { phase: 'elimination_reveal' });
                            return;
                        }
                        const sendoffLine = await makeGuardedApiCall(() => generateHostEliminationSendoff(apiKey, userPreferences.modelPrefs.analysis, hostPersona, eliminatedChar.name));
                        const fullLine = `The tribe has spoken. ${sendoffLine || ''}`;
                        updateSurvivorSeason(activeSeason.id, { hostCommentary: { line: fullLine, character: host, isSpeaking: true } });
                    })();
                    return;
                }

                case 'elimination_reveal': {
                    const eliminatedId = activeSeason.justEliminatedId;
                    const remainingDossiers = activeDossiers.filter(d => d.charId !== eliminatedId);

                    if (remainingDossiers.length <= 3 && activeSeason.settings.toggles.jury) {
                        updates.finalists = remainingDossiers.map(d => d.charId);
                        nextPhase = 'host_finale_open';
                    } else if (!activeSeason.settings.toggles.jury && remainingDossiers.length <= 1) {
                        updates.champion = remainingDossiers[0]?.charId || null;
                        nextPhase = 'finale';
                    } else {
                        nextRound++;
                        updates.tokensUsedThisRound = 0;
                        newLogEntries.push({ id: `log-round-start-${Date.now()}`, kind: 'round_start', round: nextRound, ts: Date.now(), participants: remainingDossiers.map(d=>d.charId), summary: `Round ${nextRound} begins. ${remainingDossiers.length} players remain.`, seed: activeSeason.seed + nextRound });
                        if (nextRound > 1 && nextRound % 3 === 0) {
                            const spotlightChar = rng.select(remainingDossiers);
                            newLogEntries.push({ id: `log-spotlight-${Date.now()}`, kind: 'spotlight', round: nextRound, ts: Date.now(), participants: [spotlightChar.charId], summary: `A moment of reflection for ${characterMap.get(spotlightChar.charId)?.name}.`, seed: `${activeSeason.seed}-R${nextRound}-spotlight`, materialized: false, estTokens: 100 });
                        }
                         nextPhase = 'host_round_intro';
                    }
                    updates.justEliminatedId = undefined; // Clear it
                    break;
                }
                
                case 'host_finale_open': {
                    (async () => {
                        if (!host) return;
                        const finalistNames = (activeSeason.finalists || []).map(id => characterMap.get(id)?.name || 'Unknown');
                        const juryNames = (activeSeason.jury || []).map(id => characterMap.get(id)?.name || 'Unknown');
                        const line = await makeGuardedApiCall(() => generateHostFinaleOpen(apiKey, userPreferences.modelPrefs.analysis, hostPersona, finalistNames, juryNames));
                        if (line) {
                            updateSurvivorSeason(activeSeason.id, { hostCommentary: { line, character: host, isSpeaking: true } });
                        } else {
                            updateSurvivorSeason(activeSeason.id, { phase: 'finale_opening_statements' });
                        }
                    })();
                    return;
                }

                case 'finale_opening_statements': {
                    (async () => {
                        const index = activeSeason.finaleSpeechIndex ?? 0;
                        if (index < activeSeason.finalists.length) {
                            const finalistId = activeSeason.finalists[index];
                            const finalistName = characterMap.get(finalistId)?.name || 'A Finalist';
                            const otherFinalists = activeSeason.finalists.filter(id => id !== finalistId).map(id => characterMap.get(id)?.name || 'Other');
                            const line = await makeGuardedApiCall(() => generateFinalistOpeningStatement(apiKey, userPreferences.modelPrefs.analysis, finalistName, otherFinalists, activeSeason.jury.length));
                            updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: { speakerId: finalistId, line: line || "I believe I should win.", type: 'speech' },
                                finaleSpeechIndex: index + 1
                            });
                        } else {
                            updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: null,
                                finaleSpeechIndex: undefined,
                                juryQuestionerIndex: 0,
                                phase: 'jury_questions'
                            });
                        }
                    })();
                    return;
                }

                case 'jury_questions': {
                    (async () => {
                        const questionerIndex = activeSeason.juryQuestionerIndex ?? 0;
                        if (questionerIndex < activeSeason.jury.length) {
                            const questionerId = activeSeason.jury[questionerIndex];
                            const questionerName = characterMap.get(questionerId)?.name || 'A Juror';
                            
                            // Simple round-robin for question target
                            const targetIndex = questionerIndex % activeSeason.finalists.length;
                            const targetId = activeSeason.finalists[targetIndex];
                            const targetName = characterMap.get(targetId)?.name || 'A Finalist';
                            const otherFinalists = activeSeason.finalists.filter(id => id !== targetId).map(id => characterMap.get(id)?.name || 'Other');
                            
                            const question = await makeGuardedApiCall(() => generateJuryQuestion(apiKey, userPreferences.modelPrefs.analysis, questionerName, targetName, otherFinalists));
                            
                            updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: { speakerId: questionerId, line: question || "Why should you win?", type: 'question' },
                                juryQuestionTargetIndex: targetIndex, // Store who is being asked
                            });

                            // Schedule the answer
                            setTimeout(async () => {
                                const answer = await makeGuardedApiCall(() => generateFinalistAnswer(apiKey, userPreferences.modelPrefs.analysis, targetName, questionerName, question || "Why should you win?"));
                                updateSurvivorSeason(activeSeason.id, s => ({
                                    currentDialogue: { speakerId: targetId, line: answer || "Because I played the best game.", type: 'answer' },
                                    juryQuestionerIndex: (s.juryQuestionerIndex ?? 0) + 1
                                }));
                            }, (characterMap.get(questionerId)?.name.length || 10) * 100);

                        } else {
                             updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: null,
                                juryQuestionerIndex: undefined,
                                juryQuestionTargetIndex: undefined,
                                finaleSpeechIndex: 0, // Reset for closing statements
                                phase: 'finale_closing_statements'
                            });
                        }
                    })();
                    return;
                }

                case 'finale_closing_statements': {
                    (async () => {
                        const index = activeSeason.finaleSpeechIndex ?? 0;
                        if (index < activeSeason.finalists.length) {
                             const finalistId = activeSeason.finalists[index];
                            const finalistName = characterMap.get(finalistId)?.name || 'A Finalist';
                            const line = await makeGuardedApiCall(() => generateFinalistClosingStatement(apiKey, userPreferences.modelPrefs.analysis, finalistName));
                             updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: { speakerId: finalistId, line: line || "I rest my case.", type: 'speech' },
                                finaleSpeechIndex: index + 1
                            });
                        } else {
                            const finalistDossiers = activeSeason.finalists.map(id => activeSeason.dossiers[id]);
                            const juryVotes = activeSeason.jury.map(jurorId => {
                                const targetId = calculateJuryVote(jurorId, finalistDossiers, activeSeason, rng);
                                return { voterId: jurorId, targetId };
                            });
                            updateSurvivorSeason(activeSeason.id, {
                                currentDialogue: null,
                                finaleSpeechIndex: undefined,
                                votingCeremonyIndex: 0,
                                juryVotes,
                                phase: 'jury_voting'
                            });
                        }
                    })();
                    return;
                }
                
                 case 'jury_voting': {
                    const index = activeSeason.votingCeremonyIndex ?? -1;
                    if (index < activeSeason.jury.length - 1) {
                        updates.votingCeremonyIndex = index + 1;
                        nextPhase = 'jury_voting';
                    } else {
                        updates.votingCeremonyIndex = undefined;
                        updates.juryVoteRevealIndex = -1;
                        nextPhase = 'jury_vote_reveal';
                    }
                    break;
                }
                
                case 'jury_vote_reveal': {
                     // The engine waits here until the onComplete callback from the hook triggers a phase change.
                    nextPhase = 'jury_vote_reveal';
                    break;
                }

                case 'finale':
                    if (activeSeason.settings.toggles.jury) {
                        const juryVoteCounts: Record<CharacterID, number> = {};
                        (activeSeason.juryVotes || []).forEach(vote => {
                            juryVoteCounts[vote.targetId] = (juryVoteCounts[vote.targetId] || 0) + 1;
                        });
                        const sortedVotes = Object.entries(juryVoteCounts).sort((a, b) => b[1] - a[1]);
                        
                        let winnerId: CharacterID | undefined;

                        if (sortedVotes.length > 1 && sortedVotes[0][1] === sortedVotes[1][1]) {
                            const tiedIds = sortedVotes.filter(v => v[1] === sortedVotes[0][1]).map(v => v[0]);
                            
                            // 1. Trial wins
                            const trialWins: Record<CharacterID, number> = {};
                            tiedIds.forEach(id => {
                                trialWins[id] = activeSeason.rounds.filter(r => r.trial.winnerIds.includes(id)).length;
                            });
                            const sortedByWins = tiedIds.sort((a, b) => trialWins[b] - trialWins[a]);
                            
                            if (trialWins[sortedByWins[0]] > trialWins[sortedByWins[1]]) {
                                winnerId = sortedByWins[0];
                            } else {
                                const stillTiedByWins = sortedByWins.filter(id => trialWins[id] === trialWins[sortedByWins[0]]);
                                
                                // 2. Fewer votes against
                                const votesAgainst: Record<CharacterID, number> = {};
                                stillTiedByWins.forEach(id => { votesAgainst[id] = 0; });
                                activeSeason.rounds.forEach(r => {
                                    r.votes.forEach(v => {
                                        if(stillTiedByWins.includes(v.targetId)) {
                                            votesAgainst[v.targetId]++;
                                        }
                                    });
                                });
                                const sortedByVotesAgainst = stillTiedByWins.sort((a,b) => votesAgainst[a] - votesAgainst[b]);

                                if (votesAgainst[sortedByVotesAgainst[0]] < votesAgainst[sortedByVotesAgainst[1]]) {
                                     winnerId = sortedByVotesAgainst[0];
                                } else {
                                    // 3. Seeded coin flip
                                    const finalTied = sortedByVotesAgainst.filter(id => votesAgainst[id] === votesAgainst[sortedByVotesAgainst[0]]);
                                    winnerId = rng.select(finalTied);
                                }
                            }
                        } else {
                            winnerId = sortedVotes[0]?.[0];
                        }
                        updates.champion = winnerId || null;
                    }

                    if (updates.champion !== undefined ? updates.champion : activeSeason.champion) {
                        const championId = updates.champion || activeSeason.champion;
                        if(championId) {
                            newLogEntries.push({ id: `log-${Date.now()}`, kind: 'finale', round: nextRound, ts: Date.now(), participants: [championId!], summary: `The winner is ${characterMap.get(championId!)?.name || championId}!`, seed: activeSeason.seed + 'finale' });
                            const openingBet = activeSeason.userBets.find(b => b.type === 'opening');
                            const finalBet = activeSeason.userBets.find(b => b.type === 'final');
                            let finalPoints = activeSeason.points || 0;
                            if (openingBet && openingBet.target === championId) finalPoints += 3;
                            if (finalBet && finalBet.target === championId) finalPoints += 5;
                            updates.points = finalPoints;
                            const recapTitle = `Survivor Season: ${new Date(activeSeason.createdAt).toLocaleDateString()}`;
                            const openingBetText = openingBet ? `Opening Bet: ${characterMap.get(openingBet.target)?.name} (${openingBet.target === championId ? '+3 pts' : 'Incorrect'})` : 'No opening bet placed.';
                            const finalBetText = finalBet ? `Final Bet: ${characterMap.get(finalBet.target)?.name} (${finalBet.target === championId ? '+5 pts' : 'Incorrect'})` : 'No final bet placed.';
                            const recapContent = `### ${recapTitle}\n\n**Champion:** ${characterMap.get(championId!)?.name}\n\n**Betting Performance:**\n- Total Points: ${finalPoints}\n- ${openingBetText}\n- ${finalBetText}\n\nA season defined by strategy and survival concludes.`.trim();
                            const loreRecapMessage: Message = { id: `lore-recap-${activeSeason.id}`, role: 'system', eventType: 'lore_recap', content: recapContent, timestamp: Date.now() };
                            const mostRecentSession = [...sessions].sort((a,b) => b.updatedAt - a.updatedAt)[0];
                            if (mostRecentSession) {
                                setSessions(prev => prev.map(s => s.id === mostRecentSession.id ? { ...s, messages: [...s.messages, loreRecapMessage] } : s));
                            }
                        }
                        if (activeSeason.settings.toggles.postSeasonStats) {
                            const stats = calculatePostSeasonStats({ ...activeSeason, ...updates, champion: championId! });
                            updates.seasonStats = stats;
                        }
                    }
                    nextPhase = 'finished';
                    updates.completedAt = Date.now();
                    break;
            }

            const previousBookmarkCount = activeSeason.bookmarks.length;
            const newBookmarkCount = (updates.bookmarks || activeSeason.bookmarks).length;
            if (activeSeason.skippingToBookmark && newBookmarkCount > previousBookmarkCount) {
                updates.settings = { ...activeSeason.settings, speed: activeSeason.skippingToBookmark.originalSpeed };
                updates.skippingToBookmark = undefined;
            }

            updateSurvivorSeason(activeSeason.id, { ...updates, phase: nextPhase, round: nextRound, gameLog: [...activeSeason.gameLog, ...newLogEntries] });
        };
        
        const speed = activeSeason.skippingToBookmark ? Infinity : activeSeason.settings.speed;
        const speedMap = { 1: 2000, 2: 1000, 5: 400, [Infinity]: 50 };
        let delay = speedMap[speed as keyof typeof speedMap] || 1000;
        if (activeSeason.phase === 'trial_in_progress') {
            delay = 350; // Faster ticks for a more dynamic race
        }
        if (activeSeason.phase === 'advantage_play') {
            delay = 2500; // Add a deliberate pause
        }
        if (activeSeason.phase === 'trial_end' || activeSeason.phase === 'elimination_reveal') {
            delay = 3000; // Dramatic pause for reveals
        }
        // FIX: This block of code is unreachable because of an earlier check, so it's removed.
        if (['finale_opening_statements', 'jury_questions', 'finale_closing_statements'].includes(activeSeason.phase)) {
            delay = 4000 / speed; // Time for dialogue
        }
        if (activeSeason.phase === 'voting_ceremony' || activeSeason.phase === 'jury_voting') {
            delay = 4000 / speed;
        }

        const timerId = setTimeout(advancePhase, delay);
        return () => clearTimeout(timerId);

    }, [activeSeason, updateSurvivorSeason, characterMap, sessions, setSessions, userPreferences, apiKey, makeGuardedApiCall]);
    
    // Effect for orchestrating voiced debates
    useEffect(() => {
        if (!activeSeason || activeSeason.isPaused || !activeSeason.tribunalDebate || activeSeason.phase !== 'tribunal') {
            return;
        }

        const debate = activeSeason.tribunalDebate;
        const index = activeSeason.tribunalDebateIndex ?? -1;

        if (index >= 0 && index < debate.length) {
            const currentLine = debate[index];
            const speakerChar = Array.from(characterMap.values()).find(c => c.name === currentLine.speaker_name);

            if (speakerChar) {
                if (userPreferences.survivorVoicesEnabled) {
                    ttsService.speak({
                        text: currentLine.line,
                        character: speakerChar,
                        preferences: userPreferences,
                        onStart: () => {
                            updateSurvivorSeason(activeSeason.id, { speakingDebateCharacterId: speakerChar.id });
                        },
                        onEnd: () => {
                            updateSurvivorSeason(activeSeason.id, { tribunalDebateIndex: index + 1 });
                        }
                    });
                } else {
                    // If voices off, sequence with delays
                    updateSurvivorSeason(activeSeason.id, { speakingDebateCharacterId: speakerChar.id });
                    const delay = currentLine.line.length * 80 + 500; // rough delay
                    const timer = setTimeout(() => {
                        updateSurvivorSeason(activeSeason.id, { tribunalDebateIndex: index + 1 });
                    }, delay);
                    return () => clearTimeout(timer);
                }
            } else {
                // Speaker not found, advance
                 updateSurvivorSeason(activeSeason.id, { tribunalDebateIndex: index + 1 });
            }
        } else if (index >= debate.length) {
            // Debate finished
            const transcript = debate.map(d => `${d.speaker_name}: ${d.line}`).join('\n');
            const updatedLog = activeSeason.gameLog.map(entry => {
                if (entry.kind === 'tribunal_summary' && entry.round === activeSeason.round) {
                    return { ...entry, materialized: true, materializedContent: transcript };
                }
                return entry;
            });
            
            updateSurvivorSeason(activeSeason.id, {
                phase: 'advantage_play',
                tribunalDebate: undefined,
                tribunalDebateIndex: undefined,
                speakingDebateCharacterId: null,
                gameLog: updatedLog,
            });
        }
    }, [activeSeason?.tribunalDebate, activeSeason?.tribunalDebateIndex, activeSeason?.isPaused, userPreferences.survivorVoicesEnabled, activeSeason, updateSurvivorSeason, characterMap]);
};

export type AppLogic = ReturnType<typeof useAppLogic>;

export const useAppLogic = () => {
    const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('astrilogue-api-key') || '');
    const [view, setView] = useState<View>(View.Welcome);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [customCharacters, setCustomCharacters] = useState<Character[]>(() => JSON.parse(localStorage.getItem('astrilogue-custom-chars') || '[]'));
    const [liveCharacters, setLiveCharacters] = useState<Character[] | null>(null);
    const [loreEntries, setLoreEntries] = useState<LoreEntry[]>(() => JSON.parse(localStorage.getItem('astrilogue-lore') || '[]'));
    const [emotionStates, setEmotionStates] = useState<EmotionState[]>(() => JSON.parse(localStorage.getItem('astrilogue-emotions') || '[]'));
    const [memories, setMemories] = useState<Memory[]>(() => JSON.parse(localStorage.getItem('astrilogue-memories') || '[]'));
    const [feedbackItems, setFeedbackItems] = useState<Feedback[]>(() => JSON.parse(localStorage.getItem('astrilogue-feedback') || '[]'));
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
        const saved = localStorage.getItem('astrilogue-user-prefs');
        const defaults: UserPreferences = {
            favoriteCharacterIds: [],
            recentCharacterIds: [],
            modelPrefs: {
                groupChat: 'flash-thinking', director: 'flash-thinking',
                analysis: 'flash', live: 'flash',
            },
            motionSensitivity: 'full',
            showInterventionReasons: false,
            latestQuizResults: [],
            voiceEnabled: false,
            voiceProvider: 'xtts',
            xttsServerUrl: 'http://127.0.0.1:8020',
            dynamicWorldEventsEnabled: false,
            survivorVoicesEnabled: false,
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });
    
    const [usage, setUsage] = useState<Usage>(() => JSON.parse(localStorage.getItem('astrilogue-usage') || '{"requests":0,"tokens":0,"cost":0}'));
    const [limits, setLimits] = useState<Limits>(() => JSON.parse(localStorage.getItem('astrilogue-limits') || '{"maxRequests":1000,"maxTokens":1000000,"maxCost":10.00}'));
    const [killSwitch, setKillSwitch] = useState<boolean>(false);
    const [dryRun, setDryRun] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [isScanningLore, setIsScanningLore] = useState<string | null>(null);
    const [isExtractingLore, setIsExtractingLore] = useState<string | null>(null);
    const [typingCharacterId, setTypingCharacterId] = useState<string | null>(null);
    const [sidebar, setSidebar] = useState<SidebarType>(null);
    const [sessionToExport, setSessionToExport] = useState<Session | null>(null);
    const [branchingModalState, setBranchingModalState] = useState<{ isOpen: boolean; sourceMessage: Message | null }>({ isOpen: false, sourceMessage: null });
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [imageToEdit, setImageToEdit] = useState<{ messageId: string, imageUrl: string } | null>(null);
    const [characterInWorkshop, setCharacterInWorkshop] = useState<Character | null>(null);
    const [isSceneModalOpen, setIsSceneModalOpen] = useState<boolean>(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
    const [isSideConvoModalOpen, setIsSideConvoModalOpen] = useState<boolean>(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
    const [scenarioJustCompleted, setScenarioJustCompleted] = useState<ScenarioId | null>(null);
    const [showHexGrid, setShowHexGrid] = useState<boolean>(() => JSON.parse(localStorage.getItem('astrilogue-hex-grid') || 'false'));
    const [characterDesires, setCharacterDesires] = useState<CharacterDesire[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const initialLoadRef = useRef(true);

    // Survivor Mode State
    const [survivorSeasons, setSurvivorSeasons] = useState<SurvivorSeason[]>(() => JSON.parse(localStorage.getItem('astrilogue-survivor-seasons') || '[]'));
    const [activeSurvivorSeasonId, setActiveSurvivorSeasonId] = useState<string | null>(null);


    const allCharacters = useMemo(() => [...CHARACTERS, ...customCharacters], [customCharacters]);
    const allScenes = useMemo(() => SCENES, []);
    const characterMap = useMemo(() => new Map(allCharacters.map(c => [c.id, c])), [allCharacters]);
    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
    const activeSurvivorSeason = useMemo(() => survivorSeasons.find(s => s.id === activeSurvivorSeasonId), [survivorSeasons, activeSurvivorSeasonId]);

    // --- Data Persistence Effects ---
    useEffect(() => { localStorage.setItem('astrilogue-api-key', apiKey); }, [apiKey]);
    useEffect(() => { localStorage.setItem('astrilogue-sessions', JSON.stringify(sessions)); }, [sessions]);
    useEffect(() => { localStorage.setItem('astrilogue-survivor-seasons', JSON.stringify(survivorSeasons)); }, [survivorSeasons]);
    useEffect(() => { localStorage.setItem('astrilogue-custom-chars', JSON.stringify(customCharacters)); }, [customCharacters]);
    useEffect(() => { localStorage.setItem('astrilogue-user-prefs', JSON.stringify(userPreferences)); }, [userPreferences]);
    useEffect(() => { localStorage.setItem('astrilogue-lore', JSON.stringify(loreEntries)); }, [loreEntries]);
    useEffect(() => { localStorage.setItem('astrilogue-emotions', JSON.stringify(emotionStates)); }, [emotionStates]);
    useEffect(() => { localStorage.setItem('astrilogue-memories', JSON.stringify(memories)); }, [memories]);
    useEffect(() => { localStorage.setItem('astrilogue-feedback', JSON.stringify(feedbackItems)); }, [feedbackItems]);
    useEffect(() => { localStorage.setItem('astrilogue-hex-grid', JSON.stringify(showHexGrid)); }, [showHexGrid]);
    useEffect(() => { localStorage.setItem('astrilogue-usage', JSON.stringify(usage)); }, [usage]);
    useEffect(() => { localStorage.setItem('astrilogue-limits', JSON.stringify(limits)); }, [limits]);
    
    useEffect(() => {
        if (userPreferences.motionSensitivity === 'reduced') {
            document.body.setAttribute('data-motion', 'reduced');
        } else {
            document.body.removeAttribute('data-motion');
        }
    }, [userPreferences.motionSensitivity]);

    // --- Global Scroll Lock for Modals ---
    useEffect(() => {
        const isModalOpen =
            isSceneModalOpen ||
            isGoalModalOpen ||
            isSideConvoModalOpen ||
            isHelpModalOpen ||
            !!sessionToExport ||
            branchingModalState.isOpen ||
            !!previewImageUrl ||
            !!imageToEdit;

        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSceneModalOpen, isGoalModalOpen, isSideConvoModalOpen, isHelpModalOpen, sessionToExport, branchingModalState.isOpen, previewImageUrl, imageToEdit]);

    // --- Global Event Listeners ---
    useEffect(() => {
        const handleShowToast = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.message) {
                setToastMessage(detail.message);
            }
        };
        document.addEventListener("SHOW_TOAST", handleShowToast);
        return () => document.removeEventListener("SHOW_TOAST", handleShowToast);
    }, []);

    const addTelemetry = useCallback((sessionId: string, event: Omit<TelemetryEvent, 'timestamp'>) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, telemetry: [...(s.telemetry || []), { ...event, timestamp: Date.now() }] } : s));
    }, []);

    // --- Badge Telemetry Hook ---
    useEffect(() => {
        const onBadgeAward = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          const badgeId = detail?.id as BadgeId;
          if (activeSessionId && badgeId) {
            addTelemetry(activeSessionId, { type: 'badge.earned', payload: { id: badgeId } });
          }
        };
        document.addEventListener("BADGE_AWARDED", onBadgeAward);
        return () => document.removeEventListener("BADGE_AWARDED", onBadgeAward);
    }, [activeSessionId, addTelemetry]);
    
    const createNewSession = (name: string, characterIds: string[], sceneId: string | null, goals: CharacterGoal[], seed: number): Session => {
        const mode = characterIds.length > 1 ? 'group' : '1on1';
        return {
            id: `session-${Date.now()}`, name: `${name} - ${new Date().toLocaleDateString()}`, mode, characterIds, messages: [], branches: [],
            activeBranchId: null, activeSceneId: sceneId, goals, createdAt: Date.now(), updatedAt: Date.now(),
            seed, topicWeights: {}, telemetry: [], completedObjectives: []
        };
    };

    const addMessageToSession = useCallback((sessionId: string, message: Message, branchId: string | null) => {
        setSessions(prev =>
            prev.map(session => {
                if (session.id !== sessionId) return session;
                let updatedBranches = session.branches || [];
                if (branchId) {
                    updatedBranches = session.branches.map(b => b.id === branchId ? { ...b, messages: [...b.messages, message] } : b);
                    return { ...session, branches: updatedBranches, updatedAt: Date.now() };
                }
                return { ...session, messages: [...session.messages, message], updatedAt: Date.now() };
            })
        );
    }, []);

    const updateMessageInSession = useCallback((sessionId: string, messageId: string, updates: Partial<Message>) => {
        setSessions(prev =>
            prev.map(session => {
                if (session.id !== sessionId) return session;
    
                const updateMessages = (messages: Message[]) => 
                    messages.map(m => m.id === messageId ? { ...m, ...updates } : m);
    
                if (session.activeBranchId && session.branches) {
                    return {
                        ...session,
                        branches: session.branches.map(b => 
                            b.id === session.activeBranchId 
                                ? { ...b, messages: updateMessages(b.messages) } 
                                : b
                        ),
                        updatedAt: Date.now()
                    };
                }
                
                return {
                    ...session,
                    messages: updateMessages(session.messages),
                    updatedAt: Date.now()
                };
            })
        );
    }, []);

    const makeGuardedApiCall = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
        const result = await guardedCall({
            fn, usage, limits, dryRun, killSwitch, onUsage: setUsage
        });
        if (result && typeof result === 'object' && 'skipped' in result) {
            const reasonMap = {
                'kill_switch': 'API call blocked by Kill Switch.', 'dry_run': 'Dry Run active. API call simulated.',
                'max_requests': 'Maximum request limit reached.', 'max_cost': 'Maximum cost limit reached.',
                'max_tokens': 'Maximum token limit reached.'
            };
            const reason = (result as {reason: keyof typeof reasonMap}).reason;
            const friendlyReason = reason in reasonMap ? reasonMap[reason] : 'API call skipped for an unknown reason.';
            if (activeSessionId) {
                const currentSession = sessions.find(s => s.id === activeSessionId);
                addMessageToSession(activeSessionId, {
                    id: `msg-guard-${Date.now()}`, role: 'system', content: `🛡️ GUARD: ${friendlyReason}`,
                    timestamp: Date.now(), eventType: 'guard_event'
                }, currentSession?.activeBranchId || null);
                addTelemetry(activeSessionId, { type: 'guard_skipped', payload: { reason: reason } });
            }
            setIsGenerating(false);
            setTypingCharacterId(null);
            return null;
        }
        return result as T;
    }, [usage, limits, dryRun, killSwitch, activeSessionId, sessions, addMessageToSession, addTelemetry]);

    const addMemoryToBank = useCallback((characterId: string, sessionId: string, content: string, isSecret: boolean = false) => {
        const messageId = `mem-${Date.now()}`;
        setMemories(prev => [...prev, { id: messageId, characterId, sessionId, content, timestamp: Date.now(), isSecret }]);
    }, []);

    const analyzeAndStoreEmotion = useCallback(async (character: Character, message: Message, sessionId: string, sceneContext: string | null) => {
        if (!character || !message || !sessionId) return;
        const scores = await makeGuardedApiCall(() => callEmotionAnalysisModel(apiKey, userPreferences.modelPrefs.analysis, character.name, message.content, sceneContext)) as EmotionScores | null;
        if(scores) setEmotionStates(prev => [...prev, { characterId: character.id, sessionId, scores, timestamp: Date.now() }]);
    }, [apiKey, userPreferences, makeGuardedApiCall]);
    
    const getRelevantMemoryContext = useCallback(async (charId: string, history: Message[]): Promise<string | null> => {
        const charMemories = memories.filter(m => m.characterId === charId && !m.isSecret); // Don't include secret memories in general context
        if (charMemories.length === 0) return null;
        const contextHistoryText = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : allCharacters.find(c => c.id === m.characterId)?.name || 'Char'}: ${m.content}`).join('\n');
        const relevantMemoryContents = await makeGuardedApiCall(() => selectRelevantMemories(apiKey, userPreferences.modelPrefs.analysis, JSON.stringify(charMemories.map(m => m.content)), [charId], contextHistoryText)) as string[] | null;
        return (relevantMemoryContents && relevantMemoryContents.length > 0) ? `[RELEVANT MEMORIES]\n${relevantMemoryContents.map(mem => `- "${mem}"`).join('\n')}` : null;
    }, [memories, allCharacters, makeGuardedApiCall, apiKey, userPreferences.modelPrefs.analysis]);
    
    const getFeedbackContext = useCallback((charId: string, history: Message[]): string | null => {
        const recentFeedback = feedbackItems.filter(f => f.characterId === charId).slice(-5);
        if (recentFeedback.length === 0) return null;
        const feedbackMessages = recentFeedback.map(fb => {
            const msg = history.find(m => m.id === fb.messageId);
            if (!msg) return null;
            return `- You said: "${msg.content.substring(0, 100)}..." [User feedback: ${fb.rating}]`;
        }).filter(Boolean);
        return feedbackMessages.length > 0 ? `[RECENT USER FEEDBACK]\n${feedbackMessages.join('\n')}` : null;
    }, [feedbackItems]);
    
    const checkForInterventions = useCallback(async (lastMessage: Message, sessionId: string, currentSession: Session, messagesForContext: Message[]): Promise<Message[]> => {
        if (currentSession.mode !== 'group') return [];
    
        const otherCharacters = allCharacters.filter(c => currentSession.characterIds.includes(c.id) && c.id !== lastMessage.characterId);
        const lastSpeakerName = lastMessage.role === 'user' ? 'The User' : (allCharacters.find(c => c.id === lastMessage.characterId)?.name || 'Someone');
        const context = messagesForContext.slice(-5).map(m => `${m.role === 'user' ? 'User' : (allCharacters.find(c => c.id === m.characterId)?.name || 'Character')}: ${m.content}`).join('\n');
    
        addTelemetry(sessionId, { type: 'intervention_check', payload: { characters: otherCharacters.map(c => c.id) } });
    
        const interventionPromises = otherCharacters.map(async (char) => {
            const result = await makeGuardedApiCall(() => callInterventionModel(apiKey, userPreferences.modelPrefs.analysis, context, char, lastSpeakerName)) as InterventionResult | null;
            return (result && result.interject && result.message) ? { character: char, message: result.message, reasoning: result.reasoning } : null;
        });
        const interventions = (await Promise.all(interventionPromises)).filter((i): i is { character: Character; message: string; reasoning: string } => !!i);
    
        return interventions.map(intervention => ({
            id: `msg-int-${Date.now()}-${intervention.character.id}`,
            role: 'assistant',
            content: intervention.message,
            characterId: intervention.character.id,
            timestamp: Date.now(),
            eventType: 'interjection',
            reasoning: intervention.reasoning
        }));
    }, [apiKey, allCharacters, userPreferences, makeGuardedApiCall, addTelemetry]);

    const handleTriggerSideConversation = useCallback(async (char1Id: string, char2Id: string, topic: string) => {
        if (!activeSession || isGenerating) return;
        const { id: sessionId, goals, activeBranchId, messages } = activeSession;
        const char1 = allCharacters.find(c => c.id === char1Id);
        const char2 = allCharacters.find(c => c.id === char2Id);
        if (!char1 || !char2) return;

        setIsGenerating(true);
        setIsSideConvoModalOpen(false);
        try {
            const goal1 = (goals || []).find(g => g.characterId === char1.id)?.description || "Maintain persona.";
            const goal2 = (goals || []).find(g => g.characterId === char2.id)?.description || "Maintain persona.";
            const activeScene = SCENES.find(s => s.id === activeSession.activeSceneId);
            const messagesForHistory = activeBranchId ? activeSession.branches.find(b => b.id === activeBranchId)?.messages || [] : messages;
            const recentHistory = messagesForHistory.slice(-10).map(m => `${m.role === 'user' ? 'User' : allCharacters.find(c=>c.id === m.characterId)?.name || 'Char'}: ${m.content}`).join('\n');

            const result = await makeGuardedApiCall(() => simulateSideConversation(apiKey, userPreferences.modelPrefs.director, char1, char2, goal1, goal2, activeScene?.description, recentHistory, topic)) as SideConversationResult | null;
            if (!result) return;

            addMessageToSession(sessionId, { id: `msg-event-${Date.now()}`, role: 'system', content: result.summary, timestamp: Date.now(), eventType: 'side_conversation_summary', fullTranscript: result.transcript }, activeBranchId);
            
            setSessions(prev => prev.map(s => {
                if (s.id !== sessionId) return s;
                let updatedGoals = [...(s.goals || [])];
                result.goal_updates.forEach(update => {
                    const idx = updatedGoals.findIndex(g => g.characterId === update.character_id);
                    if (update.new_goal === null) { if (idx > -1) updatedGoals.splice(idx, 1); }
                    else { const newGoal: CharacterGoal = { id: `goal-${update.character_id}-${Date.now()}`, characterId: update.character_id, name: "Updated Goal", description: update.new_goal }; if (idx > -1) updatedGoals[idx] = newGoal; else updatedGoals.push(newGoal); }
                });
                return { ...s, goals: updatedGoals };
            }));

            result.new_secrets.forEach(secret => {
                addMemoryToBank(secret.character_id, sessionId, secret.secret, true);
            });

        } finally { setIsGenerating(false); }
    }, [activeSession, isGenerating, allCharacters, apiKey, addMessageToSession, addMemoryToBank, userPreferences, makeGuardedApiCall]);
    
    const handleTriggerReflection = useCallback(async (characterId: string) => {
        if (!activeSession || isGenerating) return;
        const character = allCharacters.find(c => c.id === characterId);
        if (!character?.isMetaAware) return;

        setIsGenerating(true);
        try {
            const messagesForHistory = activeSession.activeBranchId ? (activeSession.branches.find(b => b.id === activeSession.activeBranchId)?.messages || []) : activeSession.messages;
            const windowTranscript = messagesForHistory.slice(-10).map(m => `${allCharacters.find(c => c.id === m.characterId)?.name || 'User'}: ${m.content}`).join('\n');
            const prevTopicWeights = JSON.stringify(activeSession.topicWeights || {});

            const reflectionResult = await makeGuardedApiCall(() => callReflectionModel(apiKey, userPreferences.modelPrefs.analysis, windowTranscript, prevTopicWeights)) as ReflectionResult | null;
            if (!reflectionResult) return;

            addTelemetry(activeSession.id, { type: 'reflection', payload: { characterId, result: reflectionResult } });
            addMessageToSession(activeSession.id, { id: `msg-reflect-${Date.now()}`, role: 'system', content: reflectionResult.summary, characterId: character.id, timestamp: Date.now(), eventType: 'meta_reflection' }, activeSession.activeBranchId);
            setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, topicWeights: reflectionResult.topicWeights } : s));
        } finally { setIsGenerating(false); }
    }, [activeSession, isGenerating, allCharacters, apiKey, addMessageToSession, userPreferences, makeGuardedApiCall, addTelemetry]);
    
    const handleExtractLore = useCallback(async (sessionId: string) => { const session = sessions.find(s => s.id === sessionId); if (!session || isScanningLore) return; setIsScanningLore(sessionId); try { const newLore = await makeGuardedApiCall(() => extractLoreFromSession(session, allCharacters, apiKey, userPreferences.modelPrefs.analysis)) as LoreEntry[] | null; if (newLore && newLore.length > 0) { setLoreEntries(prev => [...prev.filter(entry => entry.sessionId !== sessionId), ...newLore]); alert(`Found ${newLore.length} new lore entries!`); } else if (newLore) { alert('No new significant lore moments were found.'); } } catch (error) { alert(`Failed to extract lore. ${error instanceof Error ? error.message : ''}`); } finally { setIsScanningLore(null); } }, [sessions, allCharacters, apiKey, isScanningLore, userPreferences, makeGuardedApiCall]);
    
    const handleFeedback = useCallback((messageId: string, rating: 'up' | 'down') => { const message = activeSession?.messages.find(m => m.id === messageId) || activeSession?.branches.flatMap(b => b.messages).find(m => m.id === messageId); if (!message?.characterId) return; setFeedbackItems(prev => { const existingIdx = prev.findIndex(f => f.messageId === messageId); if (existingIdx > -1) { return prev[existingIdx].rating === rating ? prev.filter((_, i) => i !== existingIdx) : prev.map((item, i) => i === existingIdx ? { ...item, rating, timestamp: Date.now() } : item); } else { return [...prev, { messageId, characterId: message.characterId!, rating, timestamp: Date.now() }]; } }); }, [activeSession]);

    const triggerAiTurn = useCallback(async (
        turnContext?: {
            userMessage?: Message;
            whisper?: { targetId: string; content: string };
            cue?: string;
        }
    ) => {
        if (isGenerating || !activeSessionId) return;
        
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if (!currentSession) return;
    
        const rng = new SeededRNG(currentSession.seed + currentSession.messages.length);
        const activeBranchId = currentSession.activeBranchId;
        const activeScene = SCENES.find(s => s.id === currentSession.activeSceneId);
        const sceneContext = activeScene ? activeScene.description : null;
        const sessionGoals = currentSession.goals || [];
    
        const currentHistory = activeBranchId ? currentSession.branches.find(b => b.id === activeBranchId)?.messages || [] : currentSession.messages;
        let turnHistory = [...currentHistory]; // This now includes the user message/whisper/cue already added
    
        setIsGenerating(true);
        setTypingCharacterId(null);
    
        try {
            if (turnContext?.userMessage) {
                const interventions1 = await checkForInterventions(turnContext.userMessage, activeSessionId, currentSession, turnHistory);
                for (const msg of interventions1) {
                    addMessageToSession(activeSessionId, msg, activeBranchId);
                    const char = allCharacters.find(c => c.id === msg.characterId);
                    if (char) {
                        addMemoryToBank(char.id, activeSessionId, msg.content);
                        analyzeAndStoreEmotion(char, msg, activeSessionId, sceneContext);
                    }
                }
                turnHistory.push(...interventions1);
            }
    
            let nextChar: Character | undefined;
            let directorNudge: string | undefined = turnContext?.cue;
            let whisperContext: string | null = null;
    
            if (currentSession.mode === '1on1') {
                nextChar = allCharacters.find(c => c.id === currentSession.characterIds[0]);
            } else {
                // Director Logic
                const availableChars = allCharacters.filter(c => currentSession.characterIds.includes(c.id));
                const historyText = turnHistory.slice(-5).map(m => `${m.role === 'user' ? 'User' : allCharacters.find(c => c.id === m.characterId)?.name || 'Char'}: ${m.content}`).join('\n');
    
                const desirePromises = availableChars.map(async (char) => {
                    const memoryCtx = await getRelevantMemoryContext(char.id, turnHistory);
                    const goalCtx = sessionGoals.find(g => g.characterId === char.id)?.description || null;
                    const latestEmotion = emotionStates.filter(e => e.characterId === char.id && e.sessionId === activeSessionId).sort((a, b) => b.timestamp - a.timestamp)[0];
                    const emotionCtx = latestEmotion ? JSON.stringify(latestEmotion.scores) : null;
                    const desireResult = await makeGuardedApiCall(() => callDesireToSpeakModel(apiKey, userPreferences.modelPrefs.analysis, historyText, char, memoryCtx, emotionCtx, sceneContext, goalCtx)) as { desire: number, reasoning: string } | null;
                    return desireResult ? { characterId: char.id, ...desireResult } : { characterId: char.id, desire: 0.1, reasoning: "API skipped" };
                });
                const desires = await Promise.all(desirePromises);
                setCharacterDesires(desires);

                const directorDecision = await makeGuardedApiCall(() => callDirectorModel(apiKey, userPreferences.modelPrefs.director, availableChars.map(c => c.name).join(', '), sceneContext || 'No scene set', historyText, JSON.stringify(currentSession.topicWeights || {}), JSON.stringify(desires.reduce((acc, d) => ({...acc, [d.characterId]: d.desire.toFixed(2)}), {} as Record<string, string>)))) as DirectorDecision | null;
    
                if (directorDecision) {
                    addTelemetry(activeSessionId, { type: 'director_decision', payload: directorDecision });
                    nextChar = availableChars.find(c => c.name === directorDecision.speakerIds[0]); // Match by name as director model returns names
                    if (!directorNudge) directorNudge = directorDecision.topicNudge;
                }
                if (!nextChar) nextChar = rng.select(availableChars);
            }
    
            if (!nextChar) throw new Error("Could not determine next speaker.");
            setTypingCharacterId(nextChar.id);
    
            // Prepare context for the chosen character
            if (turnContext?.whisper && turnContext.whisper.targetId === nextChar.id) {
                whisperContext = turnContext.whisper.content;
            }
            const memoryContext = await getRelevantMemoryContext(nextChar.id, turnHistory);
            const charGoal = sessionGoals.find(g => g.characterId === nextChar!.id);
            const feedbackContext = getFeedbackContext(nextChar.id, turnHistory);
    
            const responseText = await makeGuardedApiCall(() => callCharacterModel(apiKey, userPreferences.modelPrefs.groupChat, turnHistory.slice(-10), nextChar!, memoryContext, sceneContext, charGoal?.description, feedbackContext, directorNudge, whisperContext)) as string | null;
    
            if (responseText) {
                // Handle image generation tag
                let finalResponseText = responseText;
                const imageGenRegex = /\[GENERATE_IMAGE:\s*"(.*?)"\]/s;
                const imageMatch = responseText.match(imageGenRegex);
                if (imageMatch && imageMatch[1]) {
                    const imagePrompt = imageMatch[1];
                    finalResponseText = responseText.replace(imageGenRegex, '').trim();

                    const placeholderId = `msg-img-placeholder-${Date.now()}`;
                    const placeholderMessage: Message = {
                        id: placeholderId, role: 'system', content: `🎨 Generating image with prompt: "${imagePrompt.substring(0, 50)}..."`,
                        timestamp: Date.now(), isGeneratingImage: true, characterId: nextChar.id,
                    };
                    addMessageToSession(activeSessionId, placeholderMessage, activeBranchId);

                    try {
                        const imageUrl = await makeGuardedApiCall(() => generateImage(apiKey, imagePrompt)) as string | null;
                        if(imageUrl) {
                            updateMessageInSession(activeSessionId, placeholderId, {
                                isGeneratingImage: false, content: `Image generated for prompt: "${imagePrompt}"`, image: imageUrl,
                            });
                        } else {
                             updateMessageInSession(activeSessionId, placeholderId, {
                                isGeneratingImage: false, content: '🛡️ GUARD: Image generation was skipped.',
                            });
                        }
                    } catch (error) {
                         const errorMessage = error instanceof Error ? error.message : "Unknown error";
                        updateMessageInSession(activeSessionId, placeholderId, {
                            isGeneratingImage: false, content: `❌ Image generation failed: ${errorMessage}`,
                        });
                    }
                }

                if (finalResponseText) {
                    const aiMessage: Message = { id: `msg-${Date.now()}-ai`, role: 'assistant', content: finalResponseText, characterId: nextChar.id, timestamp: Date.now() };
                    addMessageToSession(activeSessionId, aiMessage, activeBranchId);
                    turnHistory.push(aiMessage);
    
                    analyzeAndStoreEmotion(nextChar, aiMessage, activeSessionId, sceneContext);
                    addMemoryToBank(nextChar.id, activeSessionId, aiMessage.content);
    
                    const interventions2 = await checkForInterventions(aiMessage, activeSessionId, currentSession, turnHistory);
                    for (const msg of interventions2) {
                        addMessageToSession(activeSessionId, msg, activeBranchId);
                        const char = allCharacters.find(c => c.id === msg.characterId);
                        if (char) {
                            addMemoryToBank(char.id, activeSessionId, msg.content);
                            analyzeAndStoreEmotion(char, msg, activeSessionId, sceneContext);
                        }
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addMessageToSession(activeSessionId, { id: `msg-err-${Date.now()}`, role: 'system', content: `❌ An error occurred: ${errorMessage}`, timestamp: Date.now() }, activeSession?.activeBranchId || null);
        } finally {
            setIsGenerating(false);
            setTypingCharacterId(null);
        }
    }, [isGenerating, activeSessionId, sessions, apiKey, userPreferences, allCharacters, emotionStates, addMessageToSession, addMemoryToBank, analyzeAndStoreEmotion, getRelevantMemoryContext, getFeedbackContext, checkForInterventions, makeGuardedApiCall, addTelemetry, updateMessageInSession]);

    const handleSendMessage = useCallback(async (content: string, imageBase64: string | null = null, isDirectorsNote: boolean = false) => {
        if ((!content.trim() && !imageBase64) || !activeSessionId) return;
        
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if(!currentSession) return;
        
        const userMessage: Message = { id: `msg-${Date.now()}`, role: isDirectorsNote ? 'system' : 'user', content: isDirectorsNote ? `🎬 DIRECTOR'S NOTE: ${content}` : content, timestamp: Date.now(), image: imageBase64 || undefined };
        addMessageToSession(activeSessionId, userMessage, currentSession.activeBranchId);
        
        await triggerAiTurn({ userMessage });
    }, [activeSessionId, sessions, addMessageToSession, triggerAiTurn]);

    const handleSendWhisper = useCallback(async (characterId: string, content: string) => {
        if (!content.trim() || !activeSessionId) return;
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if(!currentSession) return;

        const whisperMessage: Message = { id: `msg-whisper-${Date.now()}`, role: 'system', eventType: 'whisper', content, timestamp: Date.now(), targetCharacterId: characterId };
        addMessageToSession(activeSessionId, whisperMessage, currentSession.activeBranchId);
        addTelemetry(activeSessionId, { type: 'whisper_sent', payload: { characterId, content } });
        await triggerAiTurn({ whisper: { targetId: characterId, content } });
    }, [activeSessionId, sessions, addMessageToSession, addTelemetry, triggerAiTurn]);

    const handleSendCue = useCallback(async (content: string) => {
        if (!content.trim() || !activeSessionId) return;
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if(!currentSession) return;

        const cueMessage: Message = { id: `msg-cue-${Date.now()}`, role: 'system', eventType: 'cue', content, timestamp: Date.now() };
        addMessageToSession(activeSessionId, cueMessage, currentSession.activeBranchId);
        addTelemetry(activeSessionId, { type: 'cue_sent', payload: { content } });
        await triggerAiTurn({ cue: content });
    }, [activeSessionId, sessions, addMessageToSession, addTelemetry, triggerAiTurn]);

    const handleContinueConversation = useCallback(async () => {
        if (!activeSession || isGenerating || activeSession.mode !== 'group') return;
        await handleSendMessage("The group falls silent. What happens next?", null, true);
    }, [activeSession, isGenerating, handleSendMessage]);

    const handleCompleteScenario = useCallback(async () => {
        if (!activeSession || !activeSession.enhancedScenarioId || activeSession.isComplete) return;

        const proofBlob = JSON.stringify({
            last3: activeSession.messages.slice(-3).map(m => ({r: m.role, c: m.content.substring(0, 50)})),
            ts: Date.now(),
        });

        // Await badge logic first to prevent race condition
        await maybeAwardBadge({
            scenarioId: activeSession.enhancedScenarioId,
            runId: activeSession.id,
            stats: {
                turns: activeSession.messages.length,
                durationMs: Date.now() - activeSession.createdAt,
            },
            proofBlob,
        });

        // Mark as complete in state after badge logic is done
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isComplete: true, updatedAt: Date.now() } : s));
        addTelemetry(activeSession.id, { type: 'scenario_complete', payload: { scenarioId: activeSession.enhancedScenarioId }});
        setScenarioJustCompleted(activeSession.enhancedScenarioId);

    }, [activeSession, activeSessionId, addTelemetry]);

    const handleObjectiveToggle = useCallback((objective: string) => {
        if (!activeSessionId) return;
        setSessions(prev => prev.map(s => {
            if (s.id !== activeSessionId) return s;
            const completed = s.completedObjectives || [];
            const isCompleted = completed.includes(objective);
            const newCompleted = isCompleted
                ? completed.filter(o => o !== objective)
                : [...completed, objective];
            return { ...s, completedObjectives: newCompleted };
        }));
    }, [activeSessionId]);
    
    // --- Preset URL Loading & Retroactive Badges ---
    useEffect(() => {
        // Only run this logic once on initial load
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            
            const savedSessions = JSON.parse(localStorage.getItem('astrilogue-sessions') || '[]');
            setSessions(savedSessions);

            // Retroactive badge awarding
            savedSessions.forEach(async (session: Session) => {
                if (session.isComplete && session.enhancedScenarioId) {
                    const proofBlob = JSON.stringify({
                        last3: session.messages.slice(-3).map(m => ({r: m.role, c: m.content.substring(0, 50)})),
                        ts: session.updatedAt,
                    });

                    await maybeAwardBadge({
                        scenarioId: session.enhancedScenarioId,
                        runId: session.id,
                        stats: {
                            turns: session.messages.length,
                            durationMs: session.updatedAt - session.createdAt,
                        },
                        proofBlob,
                    });
                }
            });

            const params = new URLSearchParams(window.location.search);
            const presetData = params.get('p');
            if (presetData) {
                const preset = decodePreset<Preset>(presetData);
                if (preset) {
                    console.log("Loading session from preset:", preset);
                    const newSession = createNewSession(
                        preset.name || 'Preset Session',
                        preset.characterIds,
                        preset.activeSceneId,
                        preset.goals,
                        preset.seed
                    );
                    setSessions(prev => [newSession, ...prev]);
                    setActiveSessionId(newSession.id);
                    setView(View.Chat);
                    if(preset.starterPrompt) {
                        setTimeout(() => handleSendMessage(preset.starterPrompt!, null, false), 100);
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        }
    }, [handleSendMessage]);

    const updateRecentCharacters = useCallback((characterIds: string[]) => { setUserPreferences(prev => ({ ...prev, recentCharacterIds: [...new Set([...characterIds, ...prev.recentCharacterIds])].slice(0, 10) })); }, []);

    const startConversation = (characterIds: string[]) => {
        if (characterIds.length === 0) return;
        const mode = characterIds.length > 1 ? 'group' : '1on1';
        const sessionName = mode === 'group' ? 'Group' : allCharacters.find(c => c.id === characterIds[0])?.name || '1-on-1';
        const newSession = createNewSession(sessionName, characterIds, null, [], Date.now());
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        updateRecentCharacters(characterIds);
        setView(View.Chat);
        setScenarioJustCompleted(null);
    };

    const startConversationFromTemplate = (template: ConversationTemplate) => {
        if (!apiKey) { alert('⚠️ Please set your API key in Settings first!'); setSidebar('settings'); return; }
        const newSession = createNewSession(template.name, template.characterIds, null, [], Date.now());
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        updateRecentCharacters(template.characterIds);
        setView(View.Chat);
        setScenarioJustCompleted(null);
        setTimeout(() => handleSendMessage(template.starterPrompt, null, false), 100);
    };

    const startConversationFromEnhancedScenario = useCallback((scenario: EnhancedScenario) => {
        if (!apiKey) { alert('⚠️ Please set your API key in Settings first!'); setSidebar('settings'); return; }

        const nameToIdMap: Record<string, string> = { 'eXact0r': 'exactor', 'VytaL': 'vytal', 'P.A.U.S.': 'paus', 'Nymira': 'nymira', 'Luna Æther': 'luna', 'Nero': 'nero', 'Diesel': 'diesel', 'Ymzo': 'ymzo', 'Kiox': 'kiox', 'Shiz': 'shiznit', 'Nippy': 'nippy', 'Sinira': 'sinira', 'I.T.Z.': 'itz', };
        const initialMessages = scenario.openingBeat.map((beat, index): Message | null => {
            const matchedName = Object.keys(nameToIdMap).find(name => beat.characterName.includes(name));
            const characterId = matchedName ? nameToIdMap[matchedName] : undefined;
            if (!characterId || !scenario.castIds.includes(characterId)) {
                console.warn(`Character ${beat.characterName} from opening beat not in cast for scenario ${scenario.id}`);
                return null;
            }
            return { id: `msg-init-${Date.now()}-${index}`, role: 'assistant', content: beat.line, characterId: characterId, timestamp: Date.now() + index };
        }).filter((msg): msg is Message => !!msg);
        
        const newSession: Session = {
            id: `session-${Date.now()}`, name: `${scenario.title} - ${new Date().toLocaleDateString()}`,
            mode: 'group', characterIds: scenario.castIds, messages: initialMessages,
            branches: [], activeBranchId: null, activeSceneId: scenario.sceneId,
            goals: [], createdAt: Date.now(), updatedAt: Date.now(),
            seed: Date.now(), topicWeights: {}, telemetry: [],
            enhancedScenarioId: scenario.id as ScenarioId, isComplete: false,
        };
        
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        updateRecentCharacters(scenario.castIds);
        setView(View.Chat);
        setScenarioJustCompleted(null);
    }, [apiKey, updateRecentCharacters, handleSendMessage]);
    
    const startLiveConversation = (characterIds: string[]) => { const chars = characterIds.map(id => allCharacters.find(c => c.id === id)).filter((c): c is Character => !!c); if (chars.length > 0) { updateRecentCharacters(characterIds); setLiveCharacters(chars); setView(View.LiveChat); } };
    const handleStart = () => { if (!apiKey) { alert('⚠️ API key missing!'); setSidebar('settings'); return; } setView(View.Setup); };
    const loadSession = (sessionId: string) => { if (sessions.some(s=>s.id === sessionId)) { setActiveSessionId(sessionId); setLiveCharacters(null); setView(View.Chat); setSidebar(null); setScenarioJustCompleted(null); } };
    const deleteSession = (sessionId: string) => { if(confirm('Are you sure? This will delete all associated data.')) { setSessions(p => p.filter(s => s.id !== sessionId)); setLoreEntries(p => p.filter(l => l.sessionId !== sessionId)); setEmotionStates(p => p.filter(e => e.sessionId !== sessionId)); setMemories(p => p.filter(m => m.sessionId !== sessionId)); if (activeSessionId === sessionId) { setActiveSessionId(null); setView(View.Welcome); } } };
    const goBack = () => { if (view === View.Chat || view === View.LiveChat || view === View.Workshop || view === View.Profile || view === View.Codex || view === View.Quiz || view === View.Survivor || view === View.Analytics || view === View.LoreBook || view === View.RelationshipVisualizer || view === View.Genesis) { setLiveCharacters(null); setCharacterInWorkshop(null); setActiveSurvivorSeasonId(null); setView(View.Setup); } else if (view === View.Setup) { setView(View.Welcome); } else { setView(View.Welcome); } };
    const toggleSidebar = (type: SidebarType) => { setSidebar(current => current === type ? null : type); };
    // FIX: Add toggleFavoriteCharacter to be returned by useAppLogic.
    const toggleFavoriteCharacter = useCallback((characterId: string) => { setUserPreferences(prev => ({ ...prev, favoriteCharacterIds: prev.favoriteCharacterIds.includes(characterId) ? prev.favoriteCharacterIds.filter(id => id !== characterId) : [...prev.favoriteCharacterIds, characterId] })); }, []);
    const handleOpenExportModal = (session: Session) => setSessionToExport(session);
    const handleOpenBranchModal = (sourceMessage: Message) => setBranchingModalState({ isOpen: true, sourceMessage });
    const handleCloseBranchModal = () => setBranchingModalState({ isOpen: false, sourceMessage: null });
    const handleCreateBranch = (alternatePrompt: string) => { if (!activeSession || !branchingModalState.sourceMessage) return; const { sourceMessage } = branchingModalState; const currentMessages = activeSession.activeBranchId ? activeSession.branches.find(b => b.id === activeSession.activeBranchId)?.messages || [] : activeSession.messages; const sourceIndex = currentMessages.findIndex(m => m.id === sourceMessage.id); if (sourceIndex === -1) return; const newBranchId = `branch-${Date.now()}`; const newBranch: Branch = { id: newBranchId, name: `Branch: "${sourceMessage.content.substring(0, 20)}..."`, messages: currentMessages.slice(0, sourceIndex + 1), createdAt: Date.now(), sourceMessageId: sourceMessage.id }; setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, branches: [...(s.branches || []), newBranch], activeBranchId: newBranchId } : s)); handleCloseBranchModal(); setTimeout(() => handleSendMessage(alternatePrompt, null, false), 100); };
    const handleSwitchBranch = (branchId: string | null) => { if (activeSessionId) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, activeBranchId: branchId } : s)); };
    const handleSetScene = (sceneId: string) => { if (activeSessionId) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, activeSceneId: sceneId } : s)); setIsSceneModalOpen(false); };
    const handleAssignGoals = (goals: CharacterGoal[]) => { if (activeSessionId) setSessions(prev => prev.map(s => { if (s.id !== activeSessionId) return s; const newIds = new Set(goals.map(g => g.characterId)); return { ...s, goals: [...(s.goals || []).filter(g => !newIds.has(g.characterId)), ...goals] }; })); setIsGoalModalOpen(false); };
    const handleNavigateToWorkshop = (characterId?: string) => { if (characterId) { setCharacterInWorkshop(customCharacters.find(c => c.id === characterId) || null); } else { setCharacterInWorkshop({ id: '', name: '', title: '', avatar: '🤖', color: '#a855f7', systemPrompt: '', isCustom: true }); } setView(View.Workshop); };
    const handleSaveCustomCharacter = (character: Character) => { setCustomCharacters(prev => { if (character.id && character.id.startsWith('custom-')) { return prev.map(c => c.id === character.id ? character : c); } else { return [...prev, { ...character, id: `custom-${Date.now()}`, isCustom: true }]; } }); setView(View.Setup); setCharacterInWorkshop(null); };
    const handleGenerateFusedCharacter = useCallback(async (charA: Character, charB: Character) => {
        if (!apiKey) {
            setToastMessage('API Key is not set. Please provide it in the settings.');
            return null;
        }
        const result = await makeGuardedApiCall(() => callFusionModel(apiKey, userPreferences.modelPrefs.analysis, charA, charB));
        return result;
    }, [apiKey, userPreferences.modelPrefs.analysis, makeGuardedApiCall]);
    const importSession = (sessionData: Session) => { if(sessionData.id && sessionData.messages) { setSessions(prev => [sessionData, ...prev.filter(s => s.id !== sessionData.id)]) } else { alert("Invalid session file.")} };
    const handleNavigateToQuiz = () => { setView(View.Quiz); setSidebar(null); };
    const handleQuizComplete = useCallback((results: QuizResult[]) => {
        setUserPreferences(prev => ({ ...prev, latestQuizResults: results }));
    }, []);

    const handleOpenImageEditor = (messageId: string, imageUrl: string) => {
        setImageToEdit({ messageId, imageUrl });
    };

    const handleEditImage = async (prompt: string) => {
        if (!imageToEdit || !prompt.trim() || !activeSessionId) return;
        const { imageUrl } = imageToEdit;
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if (!currentSession) return;
        
        const activeBranchId = currentSession.activeBranchId;
        setImageToEdit(null);
        setIsEditingImage(true);

        const placeholderId = `msg-img-edit-placeholder-${Date.now()}`;
        const placeholderMessage: Message = {
            id: placeholderId, role: 'system', content: `🎨 Editing image with prompt: "${prompt.substring(0, 50)}..."`,
            timestamp: Date.now(), isGeneratingImage: true,
        };
        addMessageToSession(activeSessionId, placeholderMessage, activeBranchId);

        try {
            const [meta, base64Data] = imageUrl.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
            const result = await makeGuardedApiCall(() => editImage(apiKey, prompt, base64Data, mimeType)) as { text: string; imageBase64: string | null; } | null;

            if (result && (result.imageBase64 || result.text)) {
                updateMessageInSession(activeSessionId, placeholderId, {
                    isGeneratingImage: false, content: result.text, image: result.imageBase64 || undefined,
                });
            } else {
                updateMessageInSession(activeSessionId, placeholderId, {
                    isGeneratingImage: false, content: '🛡️ GUARD: Image editing was skipped or failed to return content.',
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            updateMessageInSession(activeSessionId, placeholderId, {
                isGeneratingImage: false, content: `❌ Image editing failed: ${errorMessage}`,
            });
        } finally {
            setIsEditingImage(false);
        }
    };
    
    const resetUsage = () => {
        if (window.confirm("Are you sure you want to reset your usage statistics? This cannot be undone.")) {
            setUsage({ requests: 0, tokens: 0, cost: 0 });
        }
    };

    // --- Survivor Mode Handlers ---
    const updateSurvivorSeason = useCallback((seasonId: string, updates: Partial<SurvivorSeason> | ((s: SurvivorSeason) => Partial<SurvivorSeason>)) => {
        setSurvivorSeasons(prev => prev.map(s => {
            if (s.id === seasonId) {
                const newUpdates = typeof updates === 'function' ? updates(s) : updates;
                return { ...s, ...newUpdates };
            }
            return s;
        }));
    }, []);

    useSurvivorEngineHook(activeSurvivorSeason, updateSurvivorSeason, characterMap, sessions, setSessions, userPreferences, apiKey, makeGuardedApiCall);

    const handleStartSurvivorSeason = (castIds: CharacterID[], seed: string, openingBet: CharacterID | null, hostId: CharacterID) => {
        const archetypes: SurvivorArchetype[] = ['strategist', 'social_butterfly', 'wildcard', 'loyalist', 'underdog'];
        const rng = new SeededRNG(Date.now()); // Use a simple seed for dossier creation
    
        const dossiers: Record<CharacterID, SurvivorDossier> = {};
        castIds.forEach(charId => {
            dossiers[charId] = {
                version: '1.0',
                seasonId: `season-${seed}`,
                charId,
                static: {
                    archetype: rng.select(archetypes),
                    baseTraits: { logic: rng.next(), endurance: rng.next(), persuasion: rng.next(), chaos: rng.next(), creative: rng.next() },
                },
                rivalries: [],
                arc: { start: 'survivor', current: 'survivor', keyMoment: '' },
                advantages: [],
                rounds: {},
                eliminatedRound: null,
                meta: { checksum: '', createdAt: Date.now() },
            };
        });
    
        const newSeason: SurvivorSeason = {
            id: `season-${seed}`,
            seed,
            hostId,
            cast: castIds,
            dossiers,
            round: 1,
            phase: 'setup',
            rounds: [],
            alliances: [],
            gameLog: [],
            userBets: openingBet ? [{ id: `bet-open-${Date.now()}`, type: 'opening', round: 0, target: openingBet, ts: Date.now() }] : [],
            champion: null,
            bookmarks: [],
            settings: {
                speed: 1, fateNudge: 0, quietHours: false,
                tokenPolicy: { roundCap: 1000, entryCap: 300, batchingWindowMs: 50 },
                toggles: { audienceInfluence: true, confessionCam: true, secretAdvantages: true, jury: true, postSeasonStats: true, }
            },
            audienceInfluenceUses: { save: false, tie: false, reveal: false },
            createdAt: Date.now(),
            completedAt: null,
            isPaused: false,
            points: 0,
            jury: [],
            finalists: [],
            tokensUsedThisRound: 0,
            hostCommentary: null,
            activeMainView: 'log',
        };
    
        setSurvivorSeasons(prev => [newSeason, ...prev]);
        setActiveSurvivorSeasonId(newSeason.id);
        setView(View.Survivor);
    };

    const handleMaterializeLogEntry = useCallback(async (logEntryId: string) => {
        const season = activeSurvivorSeason;
        if (!season || season.isPaused) return;
        const entry = season.gameLog.find(e => e.id === logEntryId);
        if (!entry || entry.materialized) return;
        
        const estTokens = entry.estTokens || 0;
        if ((season.tokensUsedThisRound || 0) + estTokens > season.settings.tokenPolicy.roundCap) {
            setToastMessage('Round token budget exceeded. Cannot generate content.');
            addTelemetry(activeSessionId!, { type: 'survivor_budget_blocked', payload: { logEntryId } });
            return;
        }

        let content: string | undefined;
        const participants = entry.participants.map(id => characterMap.get(id)?.name).filter(Boolean).join(', ');

        try {
            switch (entry.kind) {
                case 'camp_window':
                    content = await makeGuardedApiCall(() => generateSurvivorCampWindow(apiKey, userPreferences.modelPrefs.analysis, entry.participants.map(id => characterMap.get(id)!.name), [], entry.seed)) || undefined;
                    break;
                case 'alliance_hint':
                    content = await makeGuardedApiCall(() => generateSurvivorAllianceHint(apiKey, userPreferences.modelPrefs.analysis, entry.participants.map(id => characterMap.get(id)!.name), entry.seed)) || undefined;
                    break;
                case 'elimination':
                    const eliminatedChar = characterMap.get(entry.participants[0]);
                    const eliminatedDossier = season.dossiers[entry.participants[0]];
                    if(eliminatedChar && eliminatedDossier){
                        const summary = `Round ${eliminatedDossier.eliminatedRound}: Voted out.`;
                        content = await makeGuardedApiCall(() => generateSurvivorEchoNote(apiKey, userPreferences.modelPrefs.analysis, eliminatedChar.name, `Place ${season.cast.length - season.round + 1}`, summary, "None yet", entry.seed)) || undefined;
                    }
                    break;
                case 'spotlight':
                    const spotlightChar = characterMap.get(entry.participants[0]);
                    const spotlightDossier = season.dossiers[entry.participants[0]];
                    if(spotlightChar && spotlightDossier) {
                         content = await makeGuardedApiCall(() => generateSurvivorSpotlight(apiKey, userPreferences.modelPrefs.analysis, spotlightChar.name, `the round ${entry.round} trial`, spotlightDossier.static.archetype, entry.seed)) || undefined;
                    }
                    break;
                case 'confession_cam':
                    const confessionChar = characterMap.get(entry.participants[0]);
                    if (confessionChar) {
                        content = await makeGuardedApiCall(() => generateSurvivorConfession(apiKey, userPreferences.modelPrefs.analysis, confessionChar.name, entry.seed, entry.userQuestion)) || undefined;
                    }
                    break;
            }

            if (content) {
                updateSurvivorSeason(season.id, s => ({
                    gameLog: s.gameLog.map(e => e.id === logEntryId ? { ...e, materialized: true, materializedContent: content } : e),
                    tokensUsedThisRound: (s.tokensUsedThisRound || 0) + estTokens,
                }));
            }
        } catch(err) {
            console.error("Materialization failed:", err);
            setToastMessage("Content generation failed.");
        }
    }, [activeSurvivorSeason, characterMap, apiKey, userPreferences.modelPrefs.analysis, makeGuardedApiCall, updateSurvivorSeason, activeSessionId, addTelemetry]);

    const onGenerateSchemingNote = useCallback(async (characterId: CharacterID) => {
         const season = activeSurvivorSeason;
        if (!season || season.isPaused) return;
        const char = characterMap.get(characterId);
        if(!char) return;

        const recentTrial = season.rounds.slice(-1)[0]?.trial.name || 'the last trial';
        const content = await makeGuardedApiCall(() => generateSurvivorSchemingNote(apiKey, userPreferences.modelPrefs.analysis, char.name, recentTrial, `${season.seed}-R${season.round}-${characterId}-scheming`)) || '...';
        
        updateSurvivorSeason(season.id, s => {
            const dossier = s.dossiers[characterId];
            if (!dossier) return s;
            const roundData = dossier.rounds[s.round] ?? { seed: `${s.seed}-R${s.round}-${characterId}`, state: { trust:{}, alliances:[], suspicion:0, voteIntent:'', influencedBy:[], flags:[], immunity:false }, materials: { schemingNote: {hash:'', materialized:false}}};
            roundData.materials.schemingNote = { hash: '', materialized: true, content: content };
            dossier.rounds[s.round] = roundData;
            return { dossiers: { ...s.dossiers, [characterId]: dossier } };
        });
    }, [activeSurvivorSeason, characterMap, apiKey, userPreferences, makeGuardedApiCall, updateSurvivorSeason]);
    
    const onAskConfessionQuestion = (seasonId: string, characterId: CharacterID, question: string) => {
        const season = survivorSeasons.find(s => s.id === seasonId);
        if(!season) return;
        const logEntry = season.gameLog.find(l => l.kind === 'confession_cam' && l.participants.includes(characterId));
        if(logEntry) {
            updateSurvivorSeason(seasonId, s => ({
                gameLog: s.gameLog.map(e => e.id === logEntry.id ? { ...e, userQuestion: question } : e)
            }));
            handleMaterializeLogEntry(logEntry.id);
        }
    };
    
    const onAudienceInfluence = (power: 'save' | 'tie' | 'reveal', targetId?: CharacterID) => {
        if(!activeSurvivorSeason || activeSurvivorSeason.isPaused || activeSurvivorSeason.audienceInfluenceUses[power]) return;
        const updates: Partial<SurvivorSeason> = { audienceInfluenceUses: { ...activeSurvivorSeason.audienceInfluenceUses, [power]: true } };
        let summary = `The audience uses their '${power}' power!`;

        if (power === 'save' && targetId) {
            const roundData: SurvivorDossier['rounds'][number] = activeSurvivorSeason.dossiers[targetId].rounds[activeSurvivorSeason.round] ?? {
                seed: `${activeSurvivorSeason.seed}-R${activeSurvivorSeason.round}-${targetId}`,
                state: { trust: {}, alliances: [], suspicion: 0, voteIntent: '', influencedBy: [], flags: [], immunity: false },
                materials: { schemingNote: { hash: '', materialized: false } }
            };

            updates.dossiers = { ...activeSurvivorSeason.dossiers, [targetId]: { ...activeSurvivorSeason.dossiers[targetId], rounds: { ...activeSurvivorSeason.dossiers[targetId].rounds, [activeSurvivorSeason.round]: { ...roundData, state: {...roundData.state, immunity: true } } } } };
            summary = `The audience uses their 'Save' power on ${characterMap.get(targetId)?.name}, granting them immunity!`;
        }
        if (power === 'tie') {
            updates.forceTieVote = true;
        }
        
        const newLogEntry: LogEntry = { id: `log-audience-${Date.now()}`, kind: 'audience_influence', round: activeSurvivorSeason.round, ts: Date.now(), participants: targetId ? [targetId] : [], summary: summary, seed: `${activeSurvivorSeason.seed}-audience-${power}` };
        updates.gameLog = [...activeSurvivorSeason.gameLog, newLogEntry];
        updateSurvivorSeason(activeSurvivorSeason.id, updates);
    };

    const onPlaceBet = (type: 'round' | 'final', target: CharacterID) => {
        if(!activeSurvivorSeason) return;
        updateSurvivorSeason(activeSurvivorSeason.id, s => ({
            userBets: [...s.userBets.filter(b => !(b.type === type && b.round === s.round)), { id: `bet-${type}-${Date.now()}`, type, round: s.round, target, ts: Date.now() }]
        }));
    };

    const onSkipToDrama = () => {
        if (!activeSurvivorSeason || activeSurvivorSeason.skippingToBookmark) return;
        updateSurvivorSeason(activeSurvivorSeason.id, {
            settings: { ...activeSurvivorSeason.settings, speed: Infinity },
            skippingToBookmark: { originalSpeed: activeSurvivorSeason.settings.speed }
        });
    };

    const onAddManualBookmark = (summary: string) => {
        if (!activeSurvivorSeason) return;
        updateSurvivorSeason(activeSurvivorSeason.id, s => ({
            bookmarks: [...s.bookmarks, { id: `bookmark-user-${Date.now()}`, round: s.round, kind: 'user', summary, createdAt: Date.now() }]
        }));
    };

    const onReplaySeason = (seasonId: string) => {
        const sourceSeason = survivorSeasons.find(s => s.id === seasonId);
        if (!sourceSeason) return;
        handleStartSurvivorSeason(sourceSeason.cast, `${sourceSeason.seed}-replay`, null, sourceSeason.hostId);
    };

    const onExportSeason = (seasonId: string) => {
        const season = survivorSeasons.find(s => s.id === seasonId);
        if (!season) return;
        const content = JSON.stringify(season, null, 2);
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = `survivor_season_${season.seed}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    
    const onImportSeason = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const season = JSON.parse(e.target?.result as string) as SurvivorSeason;
                    if (season.id && season.cast && season.dossiers) {
                        setSurvivorSeasons(prev => [season, ...prev.filter(s => s.id !== season.id)]);
                    } else {
                        throw new Error("Invalid season file structure.");
                    }
                } catch (err) {
                    alert("Failed to parse season file.");
                    console.error("Import error:", err);
                }
            };
            reader.readAsText(file);
        }
        if (event.target) event.target.value = '';
    };

     const onExtractSurvivorLore = useCallback(async (seasonId: string) => {
        const season = survivorSeasons.find(s => s.id === seasonId);
        if (!season || isExtractingLore) return;
        setIsExtractingLore(seasonId);
        try {
            const summary = `Winner: ${characterMap.get(season.champion!)?.name}. Rounds: ${season.rounds.map(r => `R${r.roundNumber}: ${characterMap.get(r.eliminatedId)?.name} voted out.`).join(' ')}`;
            const newLore = await makeGuardedApiCall(() => generateSurvivorLore(apiKey, userPreferences.modelPrefs.analysis, summary)) as { title: string, content: string, character_ids: string[] }[] | null;
            if (newLore && newLore.length > 0) {
                const fullLoreEntries: LoreEntry[] = newLore.map(l => ({
                    title: l.title,
                    content: l.content,
                    characterIds: l.character_ids,
                    id: `lore-survivor-${Date.now()}-${Math.random()}`,
                    sessionId: `survivor-${season.id}`,
                    timestamp: Date.now(),
                    sourceMessageId: '',
                    survivorSeasonInfo: { seasonId: season.id, seed: season.seed },
                }));
                setLoreEntries(prev => [...prev, ...fullLoreEntries]);
                alert(`Found ${newLore.length} new lore entries from the Survivor season!`);
            } else if (newLore) {
                alert('No significant lore moments were extracted from this season.');
            }
        } catch (error) {
            alert(`Failed to extract lore. ${error instanceof Error ? error.message : ''}`);
        } finally {
            setIsExtractingLore(null);
        }
    }, [survivorSeasons, isExtractingLore, characterMap, makeGuardedApiCall, apiKey, userPreferences]);


    return {
        apiKey, setApiKey,
        view, setView,
        sessions, setSessions,
        activeSession, activeSessionId,
        customCharacters, setCustomCharacters,
        allCharacters, allScenes,
        characterMap,
        liveCharacters,
        loreEntries, setLoreEntries,
        emotionStates,
        memories,
        userPreferences, setUserPreferences,
        usage, setUsage,
        limits, setLimits,
        killSwitch, setKillSwitch,
        dryRun, setDryRun,
        isGenerating,
        isEditingImage,
        typingCharacterId,
        sidebar, setSidebar,
        toggleSidebar,
        toggleFavoriteCharacter,
        sessionToExport, setSessionToExport,
        branchingModalState,
        previewImageUrl, setPreviewImageUrl,
        imageToEdit, setImageToEdit,
        characterInWorkshop, setCharacterInWorkshop,
        isSceneModalOpen, setIsSceneModalOpen,
        isGoalModalOpen, setIsGoalModalOpen,
        isSideConvoModalOpen, setIsSideConvoModalOpen,
        isHelpModalOpen, setIsHelpModalOpen,
        showHexGrid, setShowHexGrid,
        characterDesires,
        feedbackItems,
        toastMessage, setToastMessage,
        scenarioJustCompleted,
        isScanningLore,
        startConversation,
        startLiveConversation,
        startConversationFromTemplate,
        startConversationFromEnhancedScenario,
        handleStart,
        loadSession,
        deleteSession,
        goBack,
        handleSendMessage,
        handleSendWhisper,
        handleSendCue,
        handleContinueConversation,
        handleOpenExportModal,
        handleOpenBranchModal,
        handleCloseBranchModal,
        handleCreateBranch,
        handleSwitchBranch,
        handleSetScene,
        handleAssignGoals,
        handleTriggerSideConversation,
        handleTriggerReflection,
        handleExtractLore,
        handleFeedback,
        handleOpenImageEditor,
        handleEditImage,
        addTelemetry,
        handleNavigateToWorkshop,
        handleSaveCustomCharacter,
        handleGenerateFusedCharacter,
        importSession,
        resetUsage,
        handleCompleteScenario,
        handleObjectiveToggle,
        handleNavigateToQuiz,
        handleQuizComplete,
        // Survivor
        survivorSeasons,
        activeSurvivorSeason,
        handleStartSurvivorSeason,
        onLoadSeason: (id: string) => setActiveSurvivorSeasonId(id),
        onDeleteSeason: (id: string) => setSurvivorSeasons(p => p.filter(s => s.id !== id)),
        onExportSeason,
        onImportSeason,
        updateSurvivorSeason,
        handleMaterializeLogEntry,
        onGenerateSchemingNote,
        onPlaceBet,
        onSkipToDrama,
        onAudienceInfluence,
        onAddManualBookmark,
        onAskConfessionQuestion,
        onReplaySeason,
        onExtractSurvivorLore,
        isExtractingLore,
    };
};