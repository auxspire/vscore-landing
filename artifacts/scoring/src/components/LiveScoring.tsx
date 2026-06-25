// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Target, Circle, AlertCircle, UserX, Users2, Flag, StopCircle, Undo2, CornerDownRight, ShieldAlert, UserPlus, CheckCircle, CircleDot, Footprints, OctagonAlert, ArrowDownUp, FlagTriangleRight, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import ImageAvatar from './ImageAvatar';
import { pushEventToCloud, pullNewEventsSince, deleteEventFromCloud, mergeEvents } from '../utils/eventSync';
import { toast } from 'sonner';

const LiveScoring = ({ match, onBack, onEndMatch, onUpdateMatch, currentUser, accessToken }) => {
  // Check if current user is authorized to score
  const isAuthorizedScorer = () => {
    if (!currentUser || !match) return false;
    
    const userId = currentUser.user_id;
    
    // NEW: Check against scoredBy1 and scoredBy2 fields
    if (match.scoredBy1 && userId === match.scoredBy1) return true;
    if (match.scoredBy2 && userId === match.scoredBy2) return true;
    
    // LEGACY: Fall back to old primaryScorer/secondaryScorer for backward compatibility
    const primaryScorerId = match.primaryScorer?.user_id;
    const secondaryScorerId = match.secondaryScorer?.user_id;
    if (userId === primaryScorerId || userId === secondaryScorerId) return true;
    
    return false;
  };
  
  // Check if current user can score for a specific team (for team-based division)
  const canScoreForTeam = (teamNumber) => {
    if (!currentUser || !match) return false;
    if (!match.responsibilityType || match.responsibilityType !== 'team') return true; // No team restriction
    if (!match.teamScorerMapping) return true; // No mapping defined
    
    const userId = currentUser.user_id;
    const assignedTeamScorer = match.teamScorerMapping[`team${teamNumber}`];
    
    return userId === assignedTeamScorer;
  };
  
  // Check if current user can record a specific event type (for event-based division)
  const canRecordEventType = (eventType) => {
    if (!currentUser || !match) return false;
    
    // Phase-based restriction: During penalty shootout, only primary scorer can record
    if (isPenaltyShootout && !isPrimaryScorer()) {
      return false;
    }
    
    if (!match.responsibilityType || match.responsibilityType !== 'event') return true; // No event restriction
    if (!match.eventScorerMapping) return true; // No mapping defined
    
    const userId = currentUser.user_id;
    const userEventTypes = match.eventScorerMapping[userId];
    
    if (!userEventTypes) return false;
    return userEventTypes.includes(eventType);
  };
  
  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    return /^\+91\d{10}$/.test(phoneNumber);
  };
  
  // Helper function to check if a player has received a red card
  const hasRedCard = (playerId) => {
    return events.some(event => 
      event.type === 'foul' && 
      event.redCard === true && 
      event.player?.id === playerId
    );
  };
  
  // Helper function to format tournament stage for display
  const formatTournamentStage = (stage) => {
    if (!stage) return '';
    
    const stageMap = {
      'group-stage': 'Group Stage',
      'round-robin': 'Round Robin',
      'round-of-32': 'Round of 32',
      'round-of-16': 'Round of 16',
      'quarter-final': 'Quarter Final',
      'semi-final': 'Semi Final',
      'final': 'Final',
      'losers-final': "Loser's Final"
    };
    
    return stageMap[stage] || stage;
  };
  
  // Helper to get the other scorer's name
  const getOtherScorerName = (initiatorUserId) => {
    if (!match.secondaryScorer) return '';
    if (initiatorUserId === match.primaryScorer?.user_id) {
      return match.secondaryScorer.name;
    } else {
      return match.primaryScorer?.name || '';
    }
  };
  
  // ✨ Phase-based permission helpers
  const isPrimaryScorer = () => {
    if (!currentUser) return false;
    const userId = currentUser.user_id;
    
    // NEW: Check scoredBy1 field first
    if (match.scoredBy1 && userId === match.scoredBy1) return true;
    
    // LEGACY: Fall back to old primaryScorer
    return userId === match.primaryScorer?.user_id;
  };
  
  const isSecondaryScorer = () => {
    if (!currentUser) return false;
    const userId = currentUser.user_id;
    
    // NEW: Check scoredBy2 field first
    if (match.scoredBy2 && userId === match.scoredBy2) return true;
    
    // LEGACY: Fall back to old secondaryScorer
    return userId === match.secondaryScorer?.user_id;
  };
  
  const getCurrentMatchPhase = () => {
    if (isPenaltyShootout) return 'penalty_shootout';
    if (isExtraTime) return 'extra_time';
    if (isHalfTimeBreak) return 'half_time_break';
    if (currentHalf === 1) return 'first_half';
    if (currentHalf === 2) return 'second_half';
    return 'not_started';
  };
  
  // Permission check for match control actions (End Half, End Match, etc.)
  const canControlMatch = () => {
    // Only primary scorer can control match progression
    return isPrimaryScorer();
  };
  
  // Permission check for recording events during different phases
  const canRecordEvents = () => {
    const phase = getCurrentMatchPhase();
    
    // During penalty shootout, only primary scorer can record
    if (phase === 'penalty_shootout') {
      return isPrimaryScorer();
    }
    
    // During all other phases (first half, second half, extra time)
    // Both scorers can record events
    return isPrimaryScorer() || isSecondaryScorer();
  };
  
  const [scoreA, setScoreA] = useState(match?.scoreA || 0);
  const [scoreB, setScoreB] = useState(match?.scoreB || 0);
  // Initialize timer: use elapsedTime if resuming (stored in seconds), otherwise start at 0
  // Note: match.duration is the TOTAL match duration in minutes, match.elapsedTime is the timer in seconds
  const [time, setTime] = useState(match?.elapsedTime || 0);
  // If match has elapsedTime > 0, it means we're resuming, so timer should be running
  const [isRunning, setIsRunning] = useState(match?.isRunning !== undefined ? match.isRunning : (match?.elapsedTime > 0));
  const [hasStarted, setHasStarted] = useState(match?.hasStarted !== undefined ? match.hasStarted : (match?.elapsedTime > 0));
  
  // Dual-scorer match start coordination
  const [matchStartStatus, setMatchStartStatus] = useState(match?.matchStartStatus || 'not_started'); // 'not_started', 'pending_confirmation', 'confirmed'
  const [startInitiatedBy, setStartInitiatedBy] = useState(match?.startInitiatedBy || null);
  const [startConfirmedBy, setStartConfirmedBy] = useState(match?.startConfirmedBy || null);
  const [actualStartTime, setActualStartTime] = useState(match?.actualStartTime || null);
  
  const [events, setEvents] = useState(match?.events || []);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showAssistSelect, setShowAssistSelect] = useState(false);
  const [goalScorer, setGoalScorer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [yellowCard, setYellowCard] = useState(false);
  const [redCard, setRedCard] = useState(false);
  const [showSubstituteSelect, setShowSubstituteSelect] = useState(false);
  const [playerOut, setPlayerOut] = useState(null);
  
  // State for adding new player during substitution
  const [showAddNewPlayerDialog, setShowAddNewPlayerDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  
  // Track current playing squads (updated with substitutions)
  const [currentTeam1Squad, setCurrentTeam1Squad] = useState(match?.team1Squad || []);
  const [currentTeam2Squad, setCurrentTeam2Squad] = useState(match?.team2Squad || []);
  
  // New state for goal types
  const [goalType, setGoalType] = useState(null);
  
  // New state for assist characteristic
  const [assistCharacteristic, setAssistCharacteristic] = useState('Normal');
  
  // New state for shot on target outcomes
  const [shotOnTargetOutcome, setShotOnTargetOutcome] = useState(null);
  const [showGoalkeeperSelect, setShowGoalkeeperSelect] = useState(false);
  const [showBlockerSelect, setShowBlockerSelect] = useState(false);
  const [shootingPlayer, setShootingPlayer] = useState(null);
  
  // New state for shot off target outcomes
  const [shotOffTargetOutcome, setShotOffTargetOutcome] = useState(null);
  
  // New state for interception outcomes
  const [interceptionOutcome, setInterceptionOutcome] = useState(null);
  
  // New state for undo confirmation
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  
  // New state for managing halves
  const [currentHalf, setCurrentHalf] = useState(match?.currentHalf || 1);
  const [isHalfTimeBreak, setIsHalfTimeBreak] = useState(match?.isHalfTimeBreak || false);
  const [showEndHalfDialog, setShowEndHalfDialog] = useState(false);
  
  // New state for injury time
  const [injuryTime, setInjuryTime] = useState(match?.injuryTime || 0);
  const [injuryTimeInput, setInjuryTimeInput] = useState('');
  const [showInjuryTimeInput, setShowInjuryTimeInput] = useState(false);
  
  // New state for two-step attribute/player selection flow
  const [attributeSelected, setAttributeSelected] = useState(false);
  const [playerSelected, setPlayerSelected] = useState(false);
  
  // New state for draw handling
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [isExtraTime, setIsExtraTime] = useState(match?.isExtraTime || false);
  const [isPenaltyShootout, setIsPenaltyShootout] = useState(match?.isPenaltyShootout || false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [penaltyKicker, setPenaltyKicker] = useState(null);
  const [penaltyTeam, setPenaltyTeam] = useState(null);
  const [penaltyShootoutScore, setPenaltyShootoutScore] = useState(match?.penaltyShootoutScore || { team1: 0, team2: 0 });
  const [penaltyEvents, setPenaltyEvents] = useState(match?.penaltyEvents || []);
  const [showPenaltyEndConfirm, setShowPenaltyEndConfirm] = useState(false);
  
  // Calculate half duration for two halves format
  const totalDuration = parseInt(match?.duration) || 90; // Total match duration in minutes
  const halfDuration = match?.matchFormat === 'halves' ? Math.floor(totalDuration / 2) : totalDuration;
  const currentHalfDuration = match?.matchFormat === 'halves' ? halfDuration : totalDuration;
  
  // Use ref to track if we should update parent (prevent infinite loops)
  const updateTimeoutRef = useRef(null);
  
  // Event-level sync state (for dual-scorer matches)
  const [lastEventSyncTimestamp, setLastEventSyncTimestamp] = useState(new Date().toISOString());
  const eventSyncIntervalRef = useRef(null);
  
  // Update parent component whenever score or events change (debounced)
  useEffect(() => {
    if (onUpdateMatch && match?.id) {
      // Clear previous timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Set new timeout to debounce updates
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateMatch(match.id, {
          scoreA,
          scoreB,
          events,
          currentTime: formatTime(time),
          elapsedTime: time, // Store elapsed time in seconds (NOT match duration)
          currentHalf,
          isHalfTimeBreak,
          isRunning,
          hasStarted,
          injuryTime,
          team1Squad: currentTeam1Squad,
          team2Squad: currentTeam2Squad,
          isExtraTime,
          isPenaltyShootout,
          penaltyShootoutScore,
          penaltyEvents,
          matchStartStatus,
          startInitiatedBy,
          startConfirmedBy,
          actualStartTime
        });
      }, 300);
    }
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [scoreA, scoreB, events, time, currentHalf, isHalfTimeBreak, isRunning, hasStarted, injuryTime, currentTeam1Squad, currentTeam2Squad, isExtraTime, isPenaltyShootout, penaltyShootoutScore, penaltyEvents, matchStartStatus, startInitiatedBy, startConfirmedBy, actualStartTime]);

  // Sync incoming match prop changes to local state (for dual-scorer coordination)
  useEffect(() => {
    if (match) {
      const currentUserId = currentUser?.user_id;
      const hasDualScorers = match.secondaryScorer && match.secondaryScorer.user_id;
      
      // Detect race condition: both scorers clicked Start before receiving each other's sync
      // If we're in pending_confirmation locally AND incoming match also has pending_confirmation 
      // with a DIFFERENT initiator, it means both clicked Start - auto-confirm!
      if (hasDualScorers && 
          matchStartStatus === 'pending_confirmation' && 
          match.matchStartStatus === 'pending_confirmation' &&
          startInitiatedBy === currentUserId &&
          match.startInitiatedBy && 
          match.startInitiatedBy !== currentUserId &&
          !hasStarted) {
        console.log('[LiveScoring] 🎯 Race condition detected - both scorers initiated! Auto-confirming...');
        setMatchStartStatus('confirmed');
        setStartConfirmedBy(currentUserId);
        const now = new Date().toISOString();
        setActualStartTime(now);
        setIsRunning(true);
        setHasStarted(true);
        // Don't sync other fields yet - we just confirmed
        return;
      }
      
      if (match.matchStartStatus !== undefined) setMatchStartStatus(match.matchStartStatus);
      if (match.startInitiatedBy !== undefined) setStartInitiatedBy(match.startInitiatedBy);
      if (match.startConfirmedBy !== undefined) setStartConfirmedBy(match.startConfirmedBy);
      if (match.actualStartTime !== undefined) setActualStartTime(match.actualStartTime);
      
      // If both scorers have confirmed, start the match
      if (match.matchStartStatus === 'confirmed' && !hasStarted) {
        console.log('[LiveScoring] ✅ Match confirmed by cloud - starting timer');
        setHasStarted(true);
        setIsRunning(true);
        // Sync time from cloud to ensure both devices are in sync
        if (match.elapsedTime !== undefined && match.elapsedTime !== time) {
          setTime(match.elapsedTime);
        }
      }
    }
  }, [match?.matchStartStatus, match?.startInitiatedBy, match?.startConfirmedBy, match?.actualStartTime, matchStartStatus, startInitiatedBy, hasStarted, currentUser?.user_id]);

  // Poll for new events from other scorers (only for dual-scorer matches)
  useEffect(() => {
    // Only enable event polling if this is a dual-scorer match
    const isDualScorer = match?.primaryScorer && match?.secondaryScorer;
    
    if (!isDualScorer || !match?.id) {
      return; // Skip event sync for single-scorer matches or if no match ID
    }
    
    console.log('[LiveScoring] 🔄 Event sync enabled for dual-scorer match');
    
    // Use a ref to track the last sync timestamp to avoid re-creating interval
    let lastSyncRef = lastEventSyncTimestamp;
    
    // Poll every 2 seconds for new events
    eventSyncIntervalRef.current = setInterval(async () => {
      try {
        const newEvents = await pullNewEventsSince(match.id, lastSyncRef);
        
        if (newEvents && newEvents.length > 0) {
          console.log(`[LiveScoring] ⬇️ Received ${newEvents.length} new events from other scorer`);
          
          // Merge with local events (cloud events take precedence)
          setEvents(prevEvents => mergeEvents(newEvents, prevEvents));
          
          // Update sync timestamp
          const now = new Date().toISOString();
          lastSyncRef = now;
          setLastEventSyncTimestamp(now);
        }
      } catch (error) {
        console.error('[LiveScoring] Event sync poll error:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    // Cleanup
    return () => {
      if (eventSyncIntervalRef.current) {
        clearInterval(eventSyncIntervalRef.current);
      }
    };
  }, [match?.id, match?.primaryScorer, match?.secondaryScorer]); // Removed lastEventSyncTimestamp from deps

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);
  
  // Log phase changes and permissions for dual-scorer matches
  useEffect(() => {
    if (match.secondaryScorer && hasStarted) {
      const phase = getCurrentMatchPhase();
      const role = isPrimaryScorer() ? 'Primary Scorer' : 'Secondary Scorer';
      const canRecord = canRecordEvents();
      const canControl = canControlMatch();
      
      console.log(`[LiveScoring] 📊 Phase: ${phase} | Role: ${role} | Can Record: ${canRecord} | Can Control: ${canControl}`);
    }
  }, [isPenaltyShootout, isExtraTime, currentHalf, isHalfTimeBreak, hasStarted]);
  
  // Check if we should show injury time input (last minute of current half duration)
  useEffect(() => {
    const currentHalfDurationSeconds = currentHalfDuration * 60;
    const lastMinuteStart = currentHalfDurationSeconds - 60;
    
    if (time >= lastMinuteStart && time < currentHalfDurationSeconds) {
      setShowInjuryTimeInput(true);
    } else if (time < lastMinuteStart) {
      setShowInjuryTimeInput(false);
      setInjuryTimeInput('');
      setInjuryTime(0);
    }
  }, [time, currentHalfDuration]);
  
  // Handle injury time input submission
  const handleSetInjuryTime = () => {
    const minutes = parseInt(injuryTimeInput) || 0;
    if (minutes >= 0 && minutes <= 10) {
      setInjuryTime(minutes);
      setShowInjuryTimeInput(false); // Hide the input area once set
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Helper: Push event to cloud for dual-scorer matches
  const syncEventToCloud = async (event) => {
    const isDualScorer = match?.primaryScorer && match?.secondaryScorer;
    if (isDualScorer && accessToken) {
      try {
        const success = await pushEventToCloud(match.id, event, accessToken);
        if (success) {
          console.log(`[LiveScoring] ✅ Event ${event.id} synced to cloud`);
          setLastEventSyncTimestamp(new Date().toISOString());
        } else {
          console.warn(`[LiveScoring] ⚠️ Failed to sync event ${event.id}, will retry on next poll`);
        }
      } catch (err) {
        console.error('[LiveScoring] Event sync error:', err);
      }
    }
  };
  
  // Format timer with injury time display
  const formatTimerDisplay = () => {
    // If in extra time, show "ET" badge
    if (isExtraTime) {
      return (
        <div className="flex items-center gap-3 justify-center">
          <span>{formatTime(time)}</span>
          <span className="text-xl bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-bold">ET</span>
        </div>
      );
    }
    
    const currentHalfDurationSeconds = currentHalfDuration * 60;
    
    if (time <= currentHalfDurationSeconds) {
      // Normal time
      return formatTime(time);
    } else {
      // Injury time - show as "45:00 +2:30" format
      const injurySeconds = time - currentHalfDurationSeconds;
      return (
        <div className="flex items-baseline gap-2 justify-center">
          <span>{formatTime(currentHalfDurationSeconds)}</span>
          <span className="text-3xl text-green-300">+{formatTime(injurySeconds)}</span>
        </div>
      );
    }
  };

  // First tap - select event type
  const handleEventSelect = (eventType) => {
    setSelectedEvent(eventType);
    setYellowCard(false);
    setRedCard(false);
    setGoalType(null);
    setAssistCharacteristic('Normal');
    setShotOnTargetOutcome(null);
    setShotOffTargetOutcome(null);
    setInterceptionOutcome(null);
    setAttributeSelected(false);
    setPlayerSelected(false);
    setGoalScorer(null);
    setSelectedTeam(null);
    setPlayerOut(null);
    if (eventType.type === 'substitution') {
      setPlayerOut(null);
      setShowSubstituteSelect(true);
    } else {
      setShowPlayerSelect(true);
    }
  };

  // Second tap - select team/player
  const handlePlayerSelect = (team, player = null) => {
    setSelectedTeam(team);

    // Check if detailed scoring is enabled
    const detailedScoring = isDetailedScoringEnabled();

    // For goals
    if (selectedEvent.type === 'goal') {
      // Always require goal type selection (for own goal support in basic/intermediate)
      if (!goalType) {
        // Goal type not selected yet, just mark player as selected and store
        setGoalScorer({ team, player });
        setPlayerSelected(true);
        return;
      }
      // Both goal type and player selected, proceed to assist selection
      setGoalScorer({ team, player });
      setShowPlayerSelect(false);
      setShowAssistSelect(true);
      return;
    }

    // For shot on target
    if (selectedEvent.type === 'shot_on_target') {
      // Always require outcome selection (for saved/blocked support in basic/intermediate)
      if (!shotOnTargetOutcome) {
        // Outcome not selected yet, just mark player as selected and store
        setPlayerOut(player);
        setSelectedTeam(team);
        setPlayerSelected(true);
        return;
      }
      // Both outcome and player selected
      if (shotOnTargetOutcome === 'Saved') {
        // The shot is from the current team, so we need the opposing team's goalkeeper
        const opposingTeam = team === 1 ? 2 : 1;
        const opposingSquad = opposingTeam === 1 ? match.team1Squad : match.team2Squad;
        const goalkeeper = opposingSquad?.find(p => p.position === 'Goalkeeper');
        
        createEvent(team, player, {
          shotOnTargetOutcome,
          savedBy: goalkeeper
        });
        setShowPlayerSelect(false);
        return;
      } else if (shotOnTargetOutcome === 'Blocked') {
        // Need to select the blocking player from the opposing team
        setShootingPlayer({ team, player });
        setShowPlayerSelect(false);
        setShowBlockerSelect(true);
        return;
      }
    }

    // For fouls
    if (selectedEvent.type === 'foul') {
      // Always require card type selection for fouls in all scoring levels
      if (!attributeSelected) {
        // No card type selected yet, just mark player as selected and store
        setPlayerOut(player);
        setSelectedTeam(team);
        setPlayerSelected(true);
        return;
      }
      // Both card type and player selected, create event
      const cardType = yellowCard ? 'yellow' : redCard ? 'red' : 'none';
      createEvent(team, player, {
        cardType,
        yellowCard,
        redCard
      });
      setShowPlayerSelect(false);
      return;
    }

    // For shot off target
    if (selectedEvent.type === 'off_target') {
      if (!detailedScoring) {
        // No detailed scoring - create event immediately without outcome
        createEvent(team, player);
        setShowPlayerSelect(false);
        return;
      }
      // Detailed scoring enabled - check if outcome is selected
      if (!shotOffTargetOutcome) {
        // Outcome not selected yet, just mark player as selected
        setPlayerSelected(true);
        setSelectedTeam(team);
        setPlayerOut(player); // Store the player temporarily
        return;
      }
      // Both outcome and player selected, create event
      createEvent(team, player, {
        shotOffTargetOutcome
      });
      setShowPlayerSelect(false);
      return;
    }

    // For interception
    if (selectedEvent.type === 'interception') {
      if (!detailedScoring) {
        // No detailed scoring - create event immediately without outcome
        createEvent(team, player);
        setShowPlayerSelect(false);
        return;
      }
      // Detailed scoring enabled - check if outcome is selected
      if (!interceptionOutcome) {
        // Outcome not selected yet, just mark player as selected
        setPlayerSelected(true);
        setSelectedTeam(team);
        setPlayerOut(player); // Store the player temporarily
        return;
      }
      // Both outcome and player selected, create event
      createEvent(team, player, {
        interceptionOutcome
      });
      setShowPlayerSelect(false);
      return;
    }

    // For other events, create immediately
    createEvent(team, player);
  };
  
  const handleBlockerSelect = (blocker) => {
    createEvent(shootingPlayer.team, shootingPlayer.player, {
      shotOnTargetOutcome,
      blockedBy: blocker
    });
    setShowBlockerSelect(false);
    setShootingPlayer(null);
  };

  const handleAssistSelect = (assistPlayer = null) => {
    // Validate scorer permissions
    if (!isAuthorizedScorer()) {
      toast.error('You are not authorized to record events for this match. Only assigned scorers can record events.');
      return;
    }
    
    // Check if this is an own goal
    const isOwnGoal = goalType === 'Own Goal';
    
    // For own goals, credit the goal to the opposite team
    const goalTeam = isOwnGoal 
      ? (goalScorer.team === 1 ? 2 : 1)  // Opposite team gets the goal
      : goalScorer.team;  // Normal goal - same team
    
    // Validate team-based permissions
    if (!canScoreForTeam(goalScorer.team)) {
      toast.error(`You are not assigned to score for ${goalScorer.team === 1 ? match.team1 : match.team2}. Please check the scorer assignment.`);
      return;
    }
    
    // Validate event-based permissions
    if (!canRecordEventType('goal')) {
      toast.error('You are not assigned to record goal events. Please check the event type assignment.');
      return;
    }
    
    const newEvent = {
      id: `${Date.now()}-${currentUser?.user_id || 'unknown'}`, // Make ID unique per user
      type: 'goal',
      team: goalTeam,
      teamName: goalTeam === 1 ? match.team1 : match.team2,
      player: goalScorer.player,  // Original player who scored (even if own goal)
      ownGoal: isOwnGoal,  // Flag to indicate it's an own goal
      originalTeam: isOwnGoal ? goalScorer.team : null,  // Store original team for own goals
      assist: assistPlayer,
      assistCharacteristic: assistPlayer ? assistCharacteristic : null,
      time: formatTime(time),
      minute: Math.floor(time / 60), // Add match minute
      timestamp: new Date().toISOString(), // Use ISO string
      recorded_by: currentUser?.user_id || null, // Track who recorded
      goalType: goalType
    };
    setEvents([newEvent, ...events]);
    
    // Push to cloud for dual-scorer matches
    syncEventToCloud(newEvent);

    // Update score for goals - score goes to the opposite team if own goal
    if (goalTeam === 1) {
      setScoreA(scoreA + 1);
    } else {
      setScoreB(scoreB + 1);
    }

    // Reset selection
    setSelectedEvent(null);
    setShowAssistSelect(false);
    setGoalScorer(null);
    setAssistCharacteristic('Normal');
  };

  const createEvent = (team, player, additionalData = {}) => {
    // Validate scorer permissions
    if (!isAuthorizedScorer()) {
      toast.error('You are not authorized to record events for this match. Only assigned scorers can record events.');
      return;
    }
    
    // Validate team-based permissions (if team division is active)
    if (!canScoreForTeam(team)) {
      toast.error(`You are not assigned to score for ${team === 1 ? match.team1 : match.team2}. Please check the scorer assignment.`);
      return;
    }
    
    // Validate event-based permissions (if event division is active)
    if (!canRecordEventType(selectedEvent.type)) {
      toast.error(`You are not assigned to record ${selectedEvent.type} events. Please check the event type assignment.`);
      return;
    }
    
    const newEvent = {
      id: `${Date.now()}-${currentUser?.user_id || 'unknown'}`, // Make ID unique per user
      type: selectedEvent.type,
      team,
      teamName: team === 1 ? match.team1 : match.team2,
      player: player || null,
      time: formatTime(time),
      minute: Math.floor(time / 60), // Add match minute for ordering
      timestamp: new Date().toISOString(), // Use ISO string for consistency
      recorded_by: currentUser?.user_id || null, // Track who recorded the event
      ...additionalData
    };
    setEvents([newEvent, ...events]);
    
    // Push to cloud for dual-scorer matches
    syncEventToCloud(newEvent);

    // If red card, remove player from current squad (sent off)
    if (additionalData.redCard && player) {
      if (team === 1) {
        setCurrentTeam1Squad(currentTeam1Squad.filter(p => p.id !== player.id));
      } else {
        setCurrentTeam2Squad(currentTeam2Squad.filter(p => p.id !== player.id));
      }
    }

    // Reset selection
    setSelectedEvent(null);
    setShowPlayerSelect(false);
    setYellowCard(false);
    setRedCard(false);
  };

  const handleSubstituteConfirm = (team, playerIn) => {
    const newEvent = {
      id: `${Date.now()}-${currentUser?.user_id || 'unknown'}`,
      type: 'substitute',
      team,
      teamName: team === 1 ? match.team1 : match.team2,
      playerOut: playerOut,
      playerIn: playerIn,
      time: formatTime(time),
      timestamp: new Date().toISOString(),
      recorded_by: currentUser?.user_id || null
    };
    setEvents([newEvent, ...events]);
    
    // Push to cloud for dual-scorer matches
    syncEventToCloud(newEvent);

    // Update current squad
    if (team === 1) {
      setCurrentTeam1Squad(currentTeam1Squad.map(p => p.id === playerOut.id ? playerIn : p));
    } else {
      setCurrentTeam2Squad(currentTeam2Squad.map(p => p.id === playerOut.id ? playerIn : p));
    }

    // Reset selection
    setSelectedEvent(null);
    setShowSubstituteSelect(false);
    setPlayerOut(null);
  };
  
  const handleAddNewPlayerForSubstitution = () => {
    if (!newPlayerName.trim()) {
      toast.error('Player name is required');
      return;
    }
    
    // Validate phone number if provided
    if (newPlayerPhone && !/^\d{10}$/.test(newPlayerPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Get team data
    const teamName = selectedTeam === 1 ? match.team1 : match.team2;
    const teamId = selectedTeam === 1 ? match.team1Id : match.team2Id;
    
    // Create unique ID for the player
    const uniqueId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new player object for match roster
    const newPlayerForMatch = {
      id: uniqueId,
      name: newPlayerName.trim(),
      number: newPlayerNumber.trim() || '?',
      jerseyNumber: newPlayerNumber.trim() || '?',
      position: 'Unknown'
    };
    
    // Create full player object for database
    const newPlayerForDatabase = {
      id: uniqueId,
      name: newPlayerName.trim(),
      phoneNumber: newPlayerPhone ? `+91${newPlayerPhone}` : '',
      position: 'Unknown',
      teamId: teamId || null,
      teamName: teamName || null,
      teams: teamId ? [{ 
        teamId: teamId, 
        teamName: teamName,
        jerseyNumber: newPlayerNumber.trim() || '?'
      }] : [],
      createdAt: new Date().toISOString()
    };
    
    // Save to player database in localStorage
    try {
      const existingPlayers = JSON.parse(localStorage.getItem('vscor_players') || '[]');
      const updatedPlayers = [...existingPlayers, newPlayerForDatabase];
      localStorage.setItem('vscor_players', JSON.stringify(updatedPlayers));
      console.log('Player saved to vscor_players:', newPlayerForDatabase);
    } catch (error) {
      console.error('Error saving player to database:', error);
    }
    
    // Add to team's player list in team database
    if (teamId) {
      try {
        const existingTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
        const updatedTeams = existingTeams.map(team => {
          if (team.id === teamId) {
            return {
              ...team,
              players: [...(team.players || []), newPlayerForDatabase]
            };
          }
          return team;
        });
        localStorage.setItem('vscor_teams', JSON.stringify(updatedTeams));
        console.log('Player added to team in vscor_teams');
      } catch (error) {
        console.error('Error adding player to team:', error);
      }
    }
    
    // Add to full roster for the selected team
    if (selectedTeam === 1) {
      match.team1FullRoster = [...(match.team1FullRoster || []), newPlayerForMatch];
    } else {
      match.team2FullRoster = [...(match.team2FullRoster || []), newPlayerForMatch];
    }
    
    // Confirm substitution with new player
    handleSubstituteConfirm(selectedTeam, newPlayerForMatch);
    
    // Reset form
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPhone('');
    setShowAddNewPlayerDialog(false);
  };
  
  // Undo last event
  const handleUndoLastEvent = () => {
    // Validate scorer permissions
    if (!isAuthorizedScorer()) {
      toast.error('You are not authorized to modify events for this match. Only assigned scorers can undo events.');
      setShowUndoDialog(false);
      return;
    }
    
    if (events.length === 0) return;
    
    const lastEvent = events[0];
    
    // Check if current user can undo this specific event
    // Only the scorer who recorded the event can undo it
    if (lastEvent.recorded_by && lastEvent.recorded_by !== currentUser?.user_id) {
      toast.error('You can only undo events that you recorded. This event was recorded by another scorer.');
      setShowUndoDialog(false);
      return;
    }
    
    // If the last event was a goal, decrement the score
    if (lastEvent.type === 'goal') {
      if (lastEvent.team === 1) {
        setScoreA(Math.max(0, scoreA - 1));
      } else {
        setScoreB(Math.max(0, scoreB - 1));
      }
    }
    
    // If the last event was a substitution, revert the squad
    if (lastEvent.type === 'substitute') {
      if (lastEvent.team === 1) {
        setCurrentTeam1Squad(currentTeam1Squad.map(p => p.id === lastEvent.playerIn.id ? lastEvent.playerOut : p));
      } else {
        setCurrentTeam2Squad(currentTeam2Squad.map(p => p.id === lastEvent.playerIn.id ? lastEvent.playerOut : p));
      }
    }
    
    // Remove the last event
    setEvents(events.slice(1));
    
    // Delete from cloud for dual-scorer matches
    const isDualScorer = match?.primaryScorer && match?.secondaryScorer;
    if (isDualScorer && accessToken) {
      deleteEventFromCloud(match.id, lastEvent.id, accessToken)
        .then(success => {
          if (success) {
            console.log(`[LiveScoring] ❌ Event ${lastEvent.id} deleted from cloud`);
          } else {
            console.warn(`[LiveScoring] ⚠️ Failed to delete event from cloud`);
          }
        })
        .catch(err => console.error('[LiveScoring] Event deletion error:', err));
    }
    
    setShowUndoDialog(false);
  };

  // Handle attribute selection when player is already selected
  const handleAttributeSelectionWithPlayer = () => {
    if (selectedEvent.type === 'goal' && goalType && goalScorer) {
      // Both goal type and player selected, proceed to assist
      setShowPlayerSelect(false);
      setShowAssistSelect(true);
    } else if (selectedEvent.type === 'foul' && attributeSelected && selectedTeam && playerOut) {
      // Both card type and player selected, create event
      const cardType = yellowCard ? 'yellow' : redCard ? 'red' : 'none';
      createEvent(selectedTeam, playerOut, {
        cardType,
        yellowCard,
        redCard
      });
      setShowPlayerSelect(false);
    } else if (selectedEvent.type === 'off_target' && shotOffTargetOutcome && selectedTeam && playerOut) {
      // Both outcome and player selected, create event
      createEvent(selectedTeam, playerOut, {
        shotOffTargetOutcome
      });
      setShowPlayerSelect(false);
    } else if (selectedEvent.type === 'interception' && interceptionOutcome && selectedTeam && playerOut) {
      // Both outcome and player selected, create event
      createEvent(selectedTeam, playerOut, {
        interceptionOutcome
      });
      setShowPlayerSelect(false);
    }
  };

  // Determine which events to show based on scoring level
  const getAvailableEvents = () => {
    const allEvents = [
      { 
        type: 'goal', 
        label: 'Goal', 
        icon: CircleDot,
        color: 'bg-green-500 hover:bg-green-600 text-white'
      },
      { 
        type: 'shot_on_target', 
        label: 'Shot on Target', 
        icon: Target,
        color: 'bg-blue-500 hover:bg-blue-600 text-white'
      },
      { 
        type: 'off_target', 
        label: 'Off Target', 
        icon: Footprints,
        color: 'bg-gray-500 hover:bg-gray-600 text-white'
      },
      { 
        type: 'foul', 
        label: 'Foul', 
        icon: OctagonAlert,
        color: 'bg-yellow-500 hover:bg-yellow-600 text-white'
      },
      { 
        type: 'substitution', 
        label: 'Substitution', 
        icon: ArrowDownUp,
        color: 'bg-purple-500 hover:bg-purple-600 text-white'
      },
      { 
        type: 'offside', 
        label: 'Offside', 
        icon: Flag,
        color: 'bg-orange-500 hover:bg-orange-600 text-white'
      },
      { 
        type: 'interception', 
        label: 'Interception', 
        icon: Users,
        color: 'bg-red-500 hover:bg-red-600 text-white'
      },
      { 
        type: 'corner', 
        label: 'Corner', 
        icon: FlagTriangleRight,
        color: 'bg-teal-500 hover:bg-teal-600 text-white'
      }
    ];

    const scoringLevel = match?.scoringLevel || 'advanced';

    // Basic: goal, shot on target, off target, foul, substitution, corner only
    if (scoringLevel === 'basic') {
      return allEvents.filter(e => ['goal', 'shot_on_target', 'off_target', 'foul', 'substitution', 'corner'].includes(e.type));
    }
    
    // Intermediate-all: all events (no filtering needed)
    if (scoringLevel === 'intermediate-all') {
      return allEvents;
    }
    
    // Intermediate-detailed: basic events only
    if (scoringLevel === 'intermediate-detailed') {
      return allEvents.filter(e => ['goal', 'shot_on_target', 'off_target', 'foul', 'substitution', 'corner'].includes(e.type));
    }
    
    // Advanced: all events
    return allEvents;
  };

  const eventButtons = getAvailableEvents();
  
  // Determine if detailed scoring (attributes) is enabled
  const isDetailedScoringEnabled = () => {
    const scoringLevel = match?.scoringLevel || 'advanced';
    // Detailed scoring enabled for: intermediate-detailed and advanced
    return scoringLevel === 'intermediate-detailed' || scoringLevel === 'advanced';
  };

  const getEventIcon = (eventType) => {
    const event = eventButtons.find(e => e.type === eventType);
    return event ? event.icon : Circle;
  };

  const getEventColor = (eventType) => {
    const colors = {
      goal: 'bg-green-100 text-green-600',
      shot_on_target: 'bg-blue-100 text-blue-600',
      off_target: 'bg-gray-100 text-gray-600',
      foul: 'bg-yellow-100 text-yellow-600',
      substitution: 'bg-purple-100 text-purple-600',
      offside: 'bg-orange-100 text-orange-600',
      interception: 'bg-red-100 text-red-600',
      corner: 'bg-teal-100 text-teal-600'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-600';
  };

  // If user is not authorized to score, show read-only view
  if (!isAuthorizedScorer()) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-medium">Match View (Read-Only)</h1>
          <div className="w-10"></div>
        </div>

        <div className="p-4 space-y-4">
          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">View-Only Access</h3>
              <p className="text-sm text-yellow-700">
                You are not assigned as a scorer for this match. Only assigned scorers can record events.
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                <p><strong>Primary Scorer:</strong> {match.primaryScorer?.name || 'Not assigned'}</p>
                {match.secondaryScorer && (
                  <p><strong>Secondary Scorer:</strong> {match.secondaryScorer.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Read-only Match Info */}
          <div className="bg-purple-600 text-white rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl font-medium mb-2">{formatTimerDisplay()}</div>
              <p className="text-purple-200 text-sm">{match?.venue || 'Match Venue'}</p>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="font-medium mb-2">{match.team1}</p>
                <div className="text-4xl font-medium">{scoreA}</div>
              </div>
              <div className="text-center px-4">
                <div className="text-xl font-medium text-purple-200">VS</div>
              </div>
              <div className="text-center flex-1">
                <p className="font-medium mb-2">{match.team2}</p>
                <div className="text-4xl font-medium">{scoreB}</div>
              </div>
            </div>
          </div>

          {/* Event Timeline (Read-only) */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Event Timeline
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No events recorded yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-600 w-12 flex-shrink-0">
                      {event.minute}'
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {event.type === 'goal' && '⚽ Goal'}
                        {event.type === 'on_target' && '🎯 Shot on Target'}
                        {event.type === 'off_target' && '❌ Shot off Target'}
                        {event.type === 'foul' && '🚫 Foul'}
                        {event.type === 'substitute' && '🔄 Substitution'}
                        {event.type === 'corner' && '⚪ Corner'}
                        {event.type === 'interception' && '🛡️ Interception'}
                        {event.type === 'offside' && '🚩 Offside'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {event.teamName} - {event.player?.name || 'Team'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">Live Scoring</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Timer and Match Info */}
        <div className="bg-purple-600 text-white rounded-2xl p-6 space-y-4">
          {/* Timer */}
          <div className="text-center">
            <div className="text-5xl font-medium mb-2">{formatTimerDisplay()}</div>
            <p className="text-purple-200 text-sm">{match?.venue || 'Match Venue'}</p>
            {match?.tournament && match.tournament !== 'Friendly Match' && (
              <div className="mt-2 space-y-1">
                <p className="text-purple-100 text-xs font-medium">{match.tournament}</p>
                {match?.tournamentStage && (
                  <p className="text-purple-200 text-xs">{formatTournamentStage(match.tournamentStage)}</p>
                )}
              </div>
            )}
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="font-medium text-xl">{match.team1?.substring(0, 1)}</span>
              </div>
              <p className="font-medium mb-2">{match.team1}</p>
              <div className="text-4xl font-medium">{scoreA}</div>
              {isPenaltyShootout && (
                <div className="text-sm text-purple-200 mt-1">
                  Penalties: {penaltyShootoutScore.team1}
                </div>
              )}
            </div>

            <div className="text-center px-4">
              <div className="text-xl font-medium text-purple-200">VS</div>
            </div>

            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="font-medium text-xl">{match.team2?.substring(0, 1)}</span>
              </div>
              <p className="font-medium mb-2">{match.team2}</p>
              <div className="text-4xl font-medium">{scoreB}</div>
              {isPenaltyShootout && (
                <div className="text-sm text-purple-200 mt-1">
                  Penalties: {penaltyShootoutScore.team2}
                </div>
              )}
            </div>
          </div>
          
          {/* Penalty Shootout Banner */}
          {isPenaltyShootout && (
            <div className="bg-green-500 text-white text-center py-2 rounded-lg font-medium">
              ⚽ Penalty Shootout
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                // If match has already started, just toggle pause/resume
                if (hasStarted) {
                  setIsRunning(!isRunning);
                } else {
                  // Match hasn't started yet - handle dual-scorer coordination
                  const hasDualScorers = match.secondaryScorer && match.secondaryScorer.user_id;
                  
                  if (!hasDualScorers) {
                    // Single scorer - start immediately
                    setIsRunning(true);
                    setHasStarted(true);
                    setMatchStartStatus('confirmed');
                    setActualStartTime(new Date().toISOString());
                  } else {
                    // Dual scorers - coordinate start
                    const currentUserId = currentUser.user_id;
                    
                    if (matchStartStatus === 'not_started') {
                      // First scorer initiates start
                      setMatchStartStatus('pending_confirmation');
                      setStartInitiatedBy(currentUserId);
                    } else if (matchStartStatus === 'pending_confirmation') {
                      // Check if the other scorer initiated (normal case) OR if we both initiated (race condition)
                      if (startInitiatedBy !== currentUserId || (startInitiatedBy === currentUserId && match.startInitiatedBy && match.startInitiatedBy !== currentUserId)) {
                        // Either the other scorer initiated, OR we both initiated (race condition detected)
                        // In both cases, confirm the start
                        console.log('[LiveScoring] 🎯 Confirming match start');
                        setMatchStartStatus('confirmed');
                        setStartConfirmedBy(currentUserId);
                        setActualStartTime(new Date().toISOString());
                        setIsRunning(true);
                        setHasStarted(true);
                      }
                    }
                  }
                }
              }}
              className={`rounded-full px-6 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              disabled={
                matchStartStatus === 'pending_confirmation' && 
                startInitiatedBy === currentUser?.user_id &&
                // Only disable if the OTHER scorer hasn't also initiated (no race condition)
                !(match.startInitiatedBy && match.startInitiatedBy !== currentUser?.user_id)
              }
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : hasStarted ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </>
              ) : matchStartStatus === 'pending_confirmation' && (startInitiatedBy !== currentUser?.user_id || (match.startInitiatedBy && match.startInitiatedBy !== currentUser?.user_id)) ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Confirm Start
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setTime(0)}
              variant="outline"
              className="rounded-full px-6 bg-white/20 border-white/40 text-white hover:bg-white/30"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
          
          {/* Dual-Scorer Start Coordination Banner */}
          {match.secondaryScorer && matchStartStatus === 'pending_confirmation' && !hasStarted && (() => {
            // Check if both scorers have initiated (race condition)
            const bothInitiated = startInitiatedBy === currentUser?.user_id && 
                                  match.startInitiatedBy && 
                                  match.startInitiatedBy !== currentUser?.user_id;
            
            if (bothInitiated) {
              return (
                <div className="mt-3 rounded-lg p-3 bg-green-100 border border-green-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Both scorers ready!</p>
                      <p className="text-green-700">
                        Click "Confirm Start" to begin the timer.
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (startInitiatedBy === currentUser?.user_id) {
              return (
                <div className="mt-3 rounded-lg p-3 bg-amber-100 border border-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Waiting for confirmation...</p>
                      <p className="text-amber-700">
                        {getOtherScorerName(startInitiatedBy)} must also start the match for the timer to begin.
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="mt-3 rounded-lg p-3 bg-green-100 border border-green-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Ready to start!</p>
                      <p className="text-green-700">
                        {match.primaryScorer?.user_id === startInitiatedBy ? match.primaryScorer?.name : match.secondaryScorer?.name} has initiated the match start. Click "Confirm Start" to begin the timer.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </div>

        {/* Phase-Based Permissions Indicator for Dual-Scorer Matches */}
        {match.secondaryScorer && hasStarted && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                {getCurrentMatchPhase() === 'penalty_shootout' ? '⚽' : 
                 isExtraTime ? '⏰' : 
                 currentHalf === 1 ? '1️⃣' : '2️⃣'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-indigo-900 text-sm mb-1">
                  {getCurrentMatchPhase() === 'penalty_shootout' ? '🏆 Penalty Shootout Phase' :
                   isExtraTime ? '⚡ Extra Time' :
                   isHalfTimeBreak ? '⏸️ Half Time Break' :
                   currentHalf === 1 ? '⚽ First Half' : '⚽ Second Half'}
                </p>
                <p className="text-xs text-indigo-700">
                  {getCurrentMatchPhase() === 'penalty_shootout' ? (
                    isPrimaryScorer() ? (
                      <>✅ You can record penalty kicks and view match controls.</>
                    ) : (
                      <>👁️ Only the primary scorer can record penalties. You can view live updates.</>
                    )
                  ) : (
                    <>
                      {isPrimaryScorer() ? (
                        <>✅ You have full match control and can record all assigned events.</>
                      ) : (
                        <>✅ You can record assigned events. Primary scorer controls match progression.</>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* End Match Button / Half Time Controls */}
        {isHalfTimeBreak ? (
          canControlMatch() ? (
            <Button
              onClick={() => {
                setIsHalfTimeBreak(false);
                setCurrentHalf(2);
                setTime(0);
                setIsRunning(false);
              }}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Second Half
            </Button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-800">
                <span className="font-medium">🔒 Half Time</span>
                <br />
                Only the primary scorer can start the second half.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {/* Match Duration Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-sm text-purple-600">
                {match?.matchFormat === 'halves' 
                  ? `Match Duration: ${totalDuration} min${injuryTime > 0 ? ` +${injuryTime} min injury time` : ''} (${halfDuration} min × 2 halves) • Current: Half ${currentHalf}`
                  : `Match Duration: ${totalDuration} minutes${injuryTime > 0 ? ` +${injuryTime} min injury time` : ''}`}
              </p>
            </div>
            
            {/* Injury Time Input - Shows in last minute */}
            {showInjuryTimeInput && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-amber-800 font-medium">Injury/Additional Time</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Minutes (0-10)"
                    value={injuryTimeInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 10)) {
                        setInjuryTimeInput(value);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm"
                    min="0"
                    max="10"
                  />
                  <Button
                    onClick={handleSetInjuryTime}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={!injuryTimeInput}
                  >
                    Set
                  </Button>
                </div>
                {injuryTime > 0 && (
                  <p className="text-xs text-amber-700">
                    Additional time set: {injuryTime} minute{injuryTime !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            
            {canControlMatch() ? (
              match?.matchFormat === 'halves' && currentHalf === 1 ? (
                <Button
                  onClick={() => {
                    setIsRunning(false);
                    setShowEndHalfDialog(true);
                  }}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  End First Half
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setIsRunning(false);
                    // Check if it's a draw
                    if (scoreA === scoreB) {
                      setShowDrawDialog(true);
                    } else {
                      setShowEndMatchDialog(true);
                    }
                  }}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  <StopCircle className="w-5 h-5 mr-2" />
                  End Match
                </Button>
              )
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">🔒 Match Control</span>
                  <br />
                  Only the primary scorer can {match?.matchFormat === 'halves' && currentHalf === 1 ? 'end the first half' : 'end the match'}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Penalty Shootout Recording */}
        {isPenaltyShootout && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-center text-lg">Penalty Shootout</h2>
            {canRecordEvents() ? (
              <>
                <Button
                  onClick={() => setShowPenaltyDialog(true)}
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg"
                >
                  ⚽ Record Penalty Kick
                </Button>
                <div className="text-center text-sm text-gray-600">
                  <p>Current Score: {penaltyShootoutScore.team1} - {penaltyShootoutScore.team2}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-amber-900">
                    <span className="font-medium">🔒 Penalty Shootout Phase</span>
                    <br />
                    Only the primary scorer can record penalty kicks.
                    <br />
                    <span className="text-xs text-amber-700 mt-1 inline-block">
                      You can view the live penalties as they are recorded.
                    </span>
                  </p>
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>Current Score: {penaltyShootoutScore.team1} - {penaltyShootoutScore.team2}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Event Buttons */}
        {!isPenaltyShootout && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-center text-lg">Record Event</h2>
            {!hasStarted && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-amber-800 text-center">
                  {match.secondaryScorer && matchStartStatus !== 'confirmed' 
                    ? '⏱️ Both scorers must start the match to begin recording events'
                    : '⏱️ Start the timer to begin recording events'
                  }
                </p>
              </div>
            )}
            {/* Show responsibility division info for dual scorers */}
            {match?.responsibilityType === 'event' && match?.eventScorerMapping && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-800 text-center font-medium mb-1">
                  👥 Dual Scorer Mode - Events Divided
                </p>
                <p className="text-xs text-blue-700 text-center">
                  {currentUser && match.eventScorerMapping[currentUser.user_id] ? (
                    <>You record: {match.eventScorerMapping[currentUser.user_id].map(e => 
                      e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    ).join(', ')}</>
                  ) : (
                    'You are not assigned to score events in this match'
                  )}
                </p>
              </div>
            )}
            {match?.responsibilityType === 'team' && match?.teamScorerMapping && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-purple-800 text-center font-medium mb-1">
                  👥 Dual Scorer Mode - Teams Divided
                </p>
                <p className="text-xs text-purple-700 text-center">
                  {currentUser && Object.entries(match.teamScorerMapping).find(([_, id]) => id === currentUser.user_id) ? (
                    <>You record events for: {
                      Object.entries(match.teamScorerMapping).find(([_, id]) => id === currentUser.user_id)?.[0] === 'team1' 
                        ? match.teamA 
                        : match.teamB
                    }</>
                  ) : (
                    'You are not assigned to score for any team in this match'
                  )}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
            {eventButtons.map((button) => {
              const Icon = button.icon;
              const canRecord = canRecordEventType(button.type);
              const isDisabled = !hasStarted || !canRecord;
              
              return (
                <Button
                  key={button.type}
                  onClick={() => handleEventSelect(button)}
                  disabled={isDisabled}
                  className={`h-24 flex flex-col items-center justify-center gap-2 ${
                    isDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' 
                      : button.color
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span>{button.label}</span>
                  {!canRecord && hasStarted && (
                    <span className="text-xs">🔒 Other scorer</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        )}

        {/* Undo Button */}
        {events.length > 0 && (
          <Button
            onClick={() => setShowUndoDialog(true)}
            variant="outline"
            className="w-full py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
          >
            <Undo2 className="w-5 h-5 mr-2" />
            Undo Last Event ({events[0].type.replace(/_/g, ' ').toUpperCase()})
          </Button>
        )}

        {/* Recent Events */}
        {events.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-medium mb-3">Match Events</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((event) => {
                const EventIcon = getEventIcon(event.type);
                return (
                  <div key={event.id} className={`flex items-center gap-3 p-3 rounded-xl ${getEventColor(event.type)}`}>
                    <EventIcon className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">{event.type.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm opacity-80">
                        {event.teamName}
                        {event.player && ` - ${event.player.name}`}
                        {event.ownGoal && ' (OWN GOAL!)'}
                        {event.goalType && !event.ownGoal && ` (${event.goalType})`}
                        {event.assist && ` (Assist: ${event.assist.name}`}
                        {event.assist && event.assistCharacteristic && event.assistCharacteristic !== 'Normal' && ` - ${event.assistCharacteristic}`}
                        {event.assist && `)`}
                        {event.shotOnTargetOutcome && event.savedBy && ` - ${event.shotOnTargetOutcome} by ${event.savedBy.name}`}
                        {event.shotOnTargetOutcome && event.blockedBy && ` - ${event.shotOnTargetOutcome} by ${event.blockedBy.name}`}
                        {event.shotOffTargetOutcome && ` - ${event.shotOffTargetOutcome}`}
                        {event.interceptionOutcome && ` - ${event.interceptionOutcome}`}
                        {event.yellowCard && ' 🟨'}
                        {event.redCard && ' 🟥 (SENT OFF)'}
                        {event.cardType === 'none' && ' (No card)'}
                        {event.playerOut && event.playerIn && ` - OUT: ${event.playerOut.name}, IN: ${event.playerIn.name}`}
                      </p>
                    </div>
                    <div className="text-sm font-medium">{event.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Player Selection Dialog (Second Tap) */}
      <Dialog open={showPlayerSelect} onOpenChange={setShowPlayerSelect}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent && `Select ${selectedEvent.type === 'foul' ? 'Player for' : 'Team for'} ${selectedEvent.label}`}
            </DialogTitle>
            <DialogDescription>
              Choose the player or team involved in this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Show card options for fouls */}
            {selectedEvent && selectedEvent.type === 'foul' && (
              <div className={`p-4 rounded-lg space-y-2 transition-all ${
                attributeSelected 
                  ? 'bg-green-50 border-2 border-green-500' 
                  : playerSelected
                    ? 'bg-purple-50 border-2 border-purple-500'
                    : 'bg-purple-50 border-2 border-purple-300'
              }`}>
                <p className="font-medium text-sm">
                  {attributeSelected ? '✓ Card Type Selected' : playerSelected ? '② Now Select Card Type' : '① Select Card Type'}
                </p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yellowCard}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setYellowCard(true);
                          setRedCard(false);
                          setAttributeSelected(true);
                          // If player already selected, create event
                          if (selectedTeam && playerOut) {
                            createEvent(selectedTeam, playerOut, {
                              cardType: 'yellow',
                              yellowCard: true,
                              redCard: false
                            });
                            setShowPlayerSelect(false);
                          }
                        } else {
                          setYellowCard(false);
                          setAttributeSelected(false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled={attributeSelected}
                    />
                    <span className="text-sm">Yellow Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redCard}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRedCard(true);
                          setYellowCard(false);
                          setAttributeSelected(true);
                          // If player already selected, create event
                          if (selectedTeam && playerOut) {
                            createEvent(selectedTeam, playerOut, {
                              cardType: 'red',
                              yellowCard: false,
                              redCard: true
                            });
                            setShowPlayerSelect(false);
                          }
                        } else {
                          setRedCard(false);
                          setAttributeSelected(false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled={attributeSelected}
                    />
                    <span className="text-sm">Red Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!yellowCard && !redCard && attributeSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setYellowCard(false);
                          setRedCard(false);
                          setAttributeSelected(true);
                          // If player already selected, create event
                          if (selectedTeam && playerOut) {
                            createEvent(selectedTeam, playerOut, {
                              cardType: 'none',
                              yellowCard: false,
                              redCard: false
                            });
                            setShowPlayerSelect(false);
                          }
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled={attributeSelected}
                    />
                    <span className="text-sm">No Card</span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Show goal type options for goals */}
            {selectedEvent && selectedEvent.type === 'goal' && (
              <div className={`p-4 rounded-lg space-y-2 transition-all ${
                attributeSelected 
                  ? 'bg-green-50 border-2 border-green-500' 
                  : playerSelected
                    ? 'bg-purple-50 border-2 border-purple-500'
                    : 'bg-purple-50 border-2 border-purple-300'
              }`}>
                <p className="font-medium text-sm">
                  {attributeSelected ? '✓ Goal Type Selected' : playerSelected ? '② Now Select Goal Type' : '① Select Goal Type'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(isDetailedScoringEnabled() 
                    ? ['Long shot', 'Tap-in', 'Acrobatic', 'Header', 'Solo Goal', 'Calm Finish', 'Freekick', 'Direct from corner', 'Penalty', 'Own Goal']
                    : ['Regular Goal', 'Penalty', 'Own Goal']
                  ).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goalType === type}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGoalType(type);
                            setAttributeSelected(true);
                            // Set default assist characteristic based on goal type
                            if (type === 'Freekick') {
                              setAssistCharacteristic('Won the freekick');
                            } else if (type === 'Penalty') {
                              setAssistCharacteristic('Won the penalty');
                            } else {
                              setAssistCharacteristic('Normal');
                            }
                            // If player already selected, proceed to assist
                            if (goalScorer) {
                              setShowPlayerSelect(false);
                              setShowAssistSelect(true);
                            }
                          } else {
                            setGoalType(null);
                            setAttributeSelected(false);
                            setAssistCharacteristic('Normal');
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={attributeSelected}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show shot on target outcome options */}
            {selectedEvent && selectedEvent.type === 'shot_on_target' && (
              <div className={`p-4 rounded-lg space-y-2 transition-all ${
                attributeSelected 
                  ? 'bg-green-50 border-2 border-green-500' 
                  : playerSelected
                    ? 'bg-purple-50 border-2 border-purple-500'
                    : 'bg-purple-50 border-2 border-purple-300'
              }`}>
                <p className="font-medium text-sm">
                  {attributeSelected ? '✓ Outcome Selected' : playerSelected ? '② Now Select Outcome' : '① Select Outcome'}
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shotOnTargetOutcome === 'Saved'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShotOnTargetOutcome('Saved');
                          setAttributeSelected(true);
                          // If player already selected, create event
                          if (selectedTeam && playerOut) {
                            // Find opposing team's goalkeeper
                            const opposingTeam = selectedTeam === 1 ? 2 : 1;
                            const opposingSquad = opposingTeam === 1 ? match.team1Squad : match.team2Squad;
                            const goalkeeper = opposingSquad?.find(p => p.position === 'Goalkeeper');
                            
                            createEvent(selectedTeam, playerOut, {
                              shotOnTargetOutcome: 'Saved',
                              savedBy: goalkeeper
                            });
                            setShowPlayerSelect(false);
                          }
                        } else {
                          setShotOnTargetOutcome(null);
                          setAttributeSelected(false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled={attributeSelected}
                    />
                    <span className="text-sm">Saved</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shotOnTargetOutcome === 'Blocked'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShotOnTargetOutcome('Blocked');
                          setAttributeSelected(true);
                          // If player already selected, show blocker selection
                          if (selectedTeam && playerOut) {
                            setShootingPlayer({ team: selectedTeam, player: playerOut });
                            setShowPlayerSelect(false);
                            setShowBlockerSelect(true);
                          }
                        } else {
                          setShotOnTargetOutcome(null);
                          setAttributeSelected(false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled={attributeSelected}
                    />
                    <span className="text-sm">Blocked</span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Show shot off target outcome options */}
            {selectedEvent && selectedEvent.type === 'off_target' && isDetailedScoringEnabled() && (
              <div className={`p-4 rounded-lg space-y-2 transition-all ${
                attributeSelected 
                  ? 'bg-green-50 border-2 border-green-500' 
                  : playerSelected
                    ? 'bg-purple-50 border-2 border-purple-500'
                    : 'bg-purple-50 border-2 border-purple-300'
              }`}>
                <p className="font-medium text-sm">
                  {attributeSelected ? '✓ Outcome Selected' : playerSelected ? '② Now Select Outcome' : '① Select Outcome'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Hit post', 'Hit crossbar', 'Wide of the post', 'Over the bar'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shotOffTargetOutcome === type}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setShotOffTargetOutcome(type);
                            setAttributeSelected(true);
                            // If player already selected, create event
                            if (selectedTeam && playerOut) {
                              createEvent(selectedTeam, playerOut, {
                                shotOffTargetOutcome: type
                              });
                              setShowPlayerSelect(false);
                            }
                          } else {
                            setShotOffTargetOutcome(null);
                            setAttributeSelected(false);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={attributeSelected}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show interception outcome options */}
            {selectedEvent && selectedEvent.type === 'interception' && isDetailedScoringEnabled() && (
              <div className={`p-4 rounded-lg space-y-2 transition-all ${
                attributeSelected 
                  ? 'bg-green-50 border-2 border-green-500' 
                  : playerSelected
                    ? 'bg-purple-50 border-2 border-purple-500'
                    : 'bg-purple-50 border-2 border-purple-300'
              }`}>
                <p className="font-medium text-sm">
                  {attributeSelected ? '✓ Outcome Selected' : playerSelected ? '② Now Select Outcome' : '① Select Outcome'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Gaining possession', 'Clearance'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={interceptionOutcome === type}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInterceptionOutcome(type);
                            setAttributeSelected(true);
                            // If player already selected, create event
                            if (selectedTeam && playerOut) {
                              createEvent(selectedTeam, playerOut, {
                                interceptionOutcome: type
                              });
                              setShowPlayerSelect(false);
                            }
                          } else {
                            setInterceptionOutcome(null);
                            setAttributeSelected(false);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={attributeSelected}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Team 1 */}
            <div className={`space-y-2 p-3 rounded-lg transition-all ${ 
              playerSelected 
                ? 'bg-green-50 border-2 border-green-500' 
                : attributeSelected 
                  ? 'bg-purple-50 border-2 border-purple-500' 
                  : 'bg-white border-2 border-purple-300'
            }`}>
              <h3 className="font-medium">
                {playerSelected ? '✓ Player Selected - ' + match.team1 : attributeSelected ? '② Now Select Player - ' + match.team1 : '① Select Player - ' + match.team1}
              </h3>
              {currentTeam1Squad && currentTeam1Squad.length > 0 && selectedEvent?.type !== 'corner' ? (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {currentTeam1Squad.filter(player => !hasRedCard(player.id)).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      All players have been sent off
                    </div>
                  ) : (
                    currentTeam1Squad.filter(player => !hasRedCard(player.id)).map((player) => (
                    <Button
                      key={player.id}
                      onClick={() => {
                        if (selectedEvent?.type === 'foul') {
                          setSelectedTeam(1);
                          setPlayerOut(player);
                        }
                        setPlayerSelected(true);
                        handlePlayerSelect(1, player);
                      }}
                      variant="outline"
                      disabled={playerSelected}
                      className={`justify-start h-auto py-3 ${
                        selectedEvent?.type === 'foul' && selectedTeam === 1 && playerOut?.id === player.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : ''
                      }`}
                    >
                      <ImageAvatar
                        src={player.imageUrl}
                        alt={player.name}
                        size="sm"
                        type="player"
                        number={player.number}
                        className="mr-3"
                      />
                      <span className="flex-1 text-left">{player.name}</span>
                      {hasValidPhoneNumber(player.phoneNumber) && (
                        <CheckCircle className="w-4 h-4 text-purple-600 ml-2" />
                      )}
                    </Button>
                  ))
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedEvent?.type === 'foul') {
                      setSelectedTeam(1);
                      setPlayerOut(null);
                    }
                    setPlayerSelected(true);
                    handlePlayerSelect(1);
                  }}
                  variant="outline"
                  disabled={playerSelected}
                  className="w-full justify-start h-auto py-3"
                >
                  {match.team1} (Team Event)
                </Button>
              )}
            </div>

            {/* Team 2 */}
            <div className={`space-y-2 p-3 rounded-lg transition-all ${ 
              playerSelected 
                ? 'bg-green-50 border-2 border-green-500' 
                : attributeSelected 
                  ? 'bg-purple-50 border-2 border-purple-500' 
                  : 'bg-white border-2 border-purple-300'
            }`}>
              <h3 className="font-medium">
                {playerSelected ? '✓ Player Selected - ' + match.team2 : attributeSelected ? '② Now Select Player - ' + match.team2 : '① Select Player - ' + match.team2}
              </h3>
              {currentTeam2Squad && currentTeam2Squad.length > 0 && selectedEvent?.type !== 'corner' ? (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {currentTeam2Squad.filter(player => !hasRedCard(player.id)).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      All players have been sent off
                    </div>
                  ) : (
                    currentTeam2Squad.filter(player => !hasRedCard(player.id)).map((player) => (
                    <Button
                      key={player.id}
                      onClick={() => {
                        if (selectedEvent?.type === 'foul') {
                          setSelectedTeam(2);
                          setPlayerOut(player);
                        }
                        setPlayerSelected(true);
                        handlePlayerSelect(2, player);
                      }}
                      variant="outline"
                      disabled={playerSelected}
                      className={`justify-start h-auto py-3 ${
                        selectedEvent?.type === 'foul' && selectedTeam === 2 && playerOut?.id === player.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : ''
                      }`}
                    >
                      <ImageAvatar
                        src={player.imageUrl}
                        alt={player.name}
                        size="sm"
                        type="player"
                        number={player.number}
                        className="mr-3"
                      />
                      <span className="flex-1 text-left">{player.name}</span>
                      {hasValidPhoneNumber(player.phoneNumber) && (
                        <CheckCircle className="w-4 h-4 text-purple-600 ml-2" />
                      )}
                    </Button>
                  ))
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedEvent?.type === 'foul') {
                      setSelectedTeam(2);
                      setPlayerOut(null);
                    }
                    setPlayerSelected(true);
                    handlePlayerSelect(2);
                  }}
                  variant="outline"
                  disabled={playerSelected}
                  className="w-full justify-start h-auto py-3"
                >
                  {match.team2} (Team Event)
                </Button>
              )}
            </div>

            <Button
              onClick={() => {
                setSelectedEvent(null);
                setShowPlayerSelect(false);
                setYellowCard(false);
                setRedCard(false);
                setSelectedTeam(null);
                setPlayerOut(null);
                setAttributeSelected(false);
                setPlayerSelected(false);
                setGoalScorer(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assist Selection Dialog (After Goal) */}
      <Dialog open={showAssistSelect} onOpenChange={setShowAssistSelect}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Assist (Optional)</DialogTitle>
            <DialogDescription>
              {goalType === 'Own Goal' 
                ? `Own goal by ${goalScorer?.player?.name || 'player'}. Select the opposing player who forced the own goal, or skip if none.`
                : `Goal scored by ${goalScorer?.player?.name || 'Team'}. Select the player who assisted, or skip if none.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            
            {/* Assist Characteristic Selection - Only for detailed scoring and non-own goals */}
            {isDetailedScoringEnabled() && goalType !== 'Own Goal' && (
              <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-300 space-y-2">
                <p className="font-medium text-sm">Assist Characteristic</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal', 'Corner', 'Freekick', 'Through ball', 'High Cross', 'Low cross', 'Won the penalty', 'Won the freekick'].map((characteristic) => (
                    <label key={characteristic} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assistCharacteristic === characteristic}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssistCharacteristic(characteristic);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{characteristic}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Show players from the same team (or opposing team for own goals) */}
            <div className="space-y-2">
              <h3 className="font-medium">
                {(() => {
                  const isOwnGoal = goalType === 'Own Goal';
                  const assistTeam = isOwnGoal 
                    ? (goalScorer?.team === 1 ? 2 : 1)  // Opposite team for own goal
                    : goalScorer?.team;  // Same team for regular goal
                  return assistTeam === 1 ? match.team1 : match.team2;
                })()}
              </h3>
              {(() => {
                const isOwnGoal = goalType === 'Own Goal';
                const assistTeam = isOwnGoal 
                  ? (goalScorer?.team === 1 ? 2 : 1)  // Opposite team for own goal
                  : goalScorer?.team;  // Same team for regular goal
                const assistSquad = assistTeam === 1 ? currentTeam1Squad : currentTeam2Squad;
                return (assistSquad || [])
                  .filter(p => p.id !== goalScorer?.player?.id)
                  .map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => handleAssistSelect(player)}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-sm font-medium">{player.number}</span>
                    </div>
                    {player.name}
                  </Button>
                ));
              })()}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleAssistSelect(null)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                No Assist
              </Button>
              <Button
                onClick={() => {
                  setShowAssistSelect(false);
                  setGoalScorer(null);
                  setSelectedEvent(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Substitute Selection Dialog */}
      <Dialog open={showSubstituteSelect} onOpenChange={setShowSubstituteSelect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!playerOut ? 'Select Player Going Out' : 'Select Player Coming In'}
            </DialogTitle>
            <DialogDescription>
              {!playerOut ? 'Choose the player being substituted from the current playing XI.' : 'Choose the replacement player from available squad members.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!playerOut ? (
              <>
                {/* Step 1: Select player going out from current playing squad */}
                <div className="space-y-2">
                  <h3 className="font-medium">{match.team1}</h3>
                  {currentTeam1Squad && currentTeam1Squad.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {currentTeam1Squad.filter(player => !hasRedCard(player.id)).map((player) => (
                        <Button
                          key={player.id}
                          onClick={() => {
                            setPlayerOut(player);
                            setSelectedTeam(1);
                          }}
                          variant="outline"
                          className="justify-start h-auto py-3"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 text-sm font-medium">{player.number}</span>
                          </div>
                          {player.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">{match.team2}</h3>
                  {currentTeam2Squad && currentTeam2Squad.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {currentTeam2Squad.filter(player => !hasRedCard(player.id)).map((player) => (
                        <Button
                          key={player.id}
                          onClick={() => {
                            setPlayerOut(player);
                            setSelectedTeam(2);
                          }}
                          variant="outline"
                          className="justify-start h-auto py-3"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 text-sm font-medium">{player.number}</span>
                          </div>
                          {player.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Select player coming in (not in current squad) */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">{playerOut.name}</span> is being substituted. Select the replacement player.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Available Players (Not in Playing XI)</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {(() => {
                      const fullRoster = selectedTeam === 1 ? match.team1FullRoster : match.team2FullRoster;
                      const currentSquad = selectedTeam === 1 ? currentTeam1Squad : currentTeam2Squad;
                      const availablePlayers = fullRoster?.filter(
                        player => !currentSquad?.some(squadPlayer => squadPlayer.id === player.id)
                      ) || [];
                      
                      if (availablePlayers.length === 0) {
                        return (
                          <p className="text-sm text-gray-600 py-4 text-center">
                            No available substitute players
                          </p>
                        );
                      }
                      
                      return availablePlayers.map((player) => (
                        <Button
                          key={player.id}
                          onClick={() => handleSubstituteConfirm(selectedTeam, player)}
                          variant="outline"
                          className="justify-start h-auto py-3"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 text-sm font-medium">{player.number}</span>
                          </div>
                          {player.name}
                        </Button>
                      ));
                    })()}
                  </div>
                </div>
              </>
            )}

            {playerOut && (
              <Button
                onClick={() => {
                  setShowAddNewPlayerDialog(true);
                }}
                variant="outline"
                className="w-full border-dashed border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Player
              </Button>
            )}
            
            <Button
              onClick={() => {
                setShowSubstituteSelect(false);
                setPlayerOut(null);
                setSelectedEvent(null);
                setSelectedTeam(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Player Dialog (For Substitution) */}
      <Dialog open={showAddNewPlayerDialog} onOpenChange={setShowAddNewPlayerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter the details of the new player coming in. Only player name is required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Player Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Jersey Number (Optional)
              </label>
              <Input
                placeholder="Enter jersey number"
                value={newPlayerNumber}
                onChange={(e) => setNewPlayerNumber(e.target.value)}
                className="w-full"
                maxLength={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Phone Number (Optional)
              </label>
              <div className="flex gap-2">
                <div className="w-16 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">+91</span>
                </div>
                <Input
                  type="tel"
                  placeholder="10-digit number"
                  value={newPlayerPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setNewPlayerPhone(value);
                    }
                  }}
                  className={`flex-1 ${
                    newPlayerPhone && newPlayerPhone.length !== 10 && newPlayerPhone.length > 0
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  maxLength={10}
                />
              </div>
              {newPlayerPhone && newPlayerPhone.length !== 10 && newPlayerPhone.length > 0 && (
                <p className="text-red-500 text-xs">Please enter a valid 10-digit number</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAddNewPlayerForSubstitution}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!newPlayerName.trim()}
              >
                Confirm Substitution
              </Button>
              <Button
                onClick={() => {
                  setShowAddNewPlayerDialog(false);
                  setNewPlayerName('');
                  setNewPlayerNumber('');
                  setNewPlayerPhone('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocker Selection Dialog (For shot on target blocked) */}
      <Dialog open={showBlockerSelect} onOpenChange={setShowBlockerSelect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Blocking Player</DialogTitle>
            <DialogDescription>
              Shot blocked. Select the defending player who blocked the shot.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Show players from the opposing team */}
            <div className="space-y-2">
              <h3 className="font-medium">{shootingPlayer?.team === 1 ? match.team2 : match.team1}</h3>
              {((shootingPlayer?.team === 1 ? currentTeam2Squad : currentTeam1Squad) || [])
                .filter((player) => {
                  // Exclude goalkeepers from blocker selection
                  const position = player.position?.toLowerCase() || '';
                  return position !== 'gk' && position !== 'goalkeeper' && position !== 'goalie';
                })
                .map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => handleBlockerSelect(player)}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 text-sm font-medium">{player.number}</span>
                    </div>
                    {player.name}
                  </Button>
                ))}
            </div>

            <Button
              onClick={() => {
                setShowBlockerSelect(false);
                setShootingPlayer(null);
                setSelectedEvent(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Match Confirmation Dialog */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this match? The final score will be recorded as {match.team1} {scoreA} - {scoreB} {match.team2}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Prepare final match data
                const finalMatchData = {
                  ...match,
                  teamA: match.team1,
                  teamB: match.team2,
                  scoreA,
                  scoreB,
                  events: events.reverse(), // Reverse to show chronological order
                  finalTime: formatTime(time),
                  duration: time,
                  status: 'Full Time',
                  endTime: new Date(),
                  isExtraTime,
                  isPenaltyShootout: false,
                  penaltyShootoutScore: penaltyShootoutScore.team1 === 0 && penaltyShootoutScore.team2 === 0 ? undefined : penaltyShootoutScore,
                  penaltyEvents: penaltyEvents.length > 0 ? penaltyEvents : undefined,
                  // Override the original squads with the live-tracked ones so
                  // substituted players are correctly reflected in the final record.
                  team1Squad: currentTeam1Squad,
                  team2Squad: currentTeam2Squad,
                  team1FullRoster: match.team1FullRoster || currentTeam1Squad,
                  team2FullRoster: match.team2FullRoster || currentTeam2Squad,
                };
                onEndMatch(finalMatchData);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              End Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Draw Dialog - Options for handling a draw */}
      <AlertDialog open={showDrawDialog} onOpenChange={setShowDrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Match Drawn</AlertDialogTitle>
            <AlertDialogDescription>
              The match is currently a draw ({scoreA}-{scoreA}). How would you like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                setShowDrawDialog(false);
                setShowEndMatchDialog(true);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Record as Draw
            </Button>
            <Button
              onClick={() => {
                setShowDrawDialog(false);
                setIsExtraTime(true);
                setIsRunning(true);
                // Extra time is typically 30 minutes (2x15 min halves)
                // Continue from current time
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Extra Time
            </Button>
            <Button
              onClick={() => {
                setShowDrawDialog(false);
                setIsPenaltyShootout(true);
                setShowPenaltyDialog(true);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Penalty Shootout
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRunning(true)}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Penalty Shootout Dialog */}
      <Dialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Penalty Shootout</DialogTitle>
            <DialogDescription>
              Record penalty kicks for each team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Penalty Score Display */}
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{match.team1}</p>
                  <p className="text-3xl font-bold text-purple-600">{penaltyShootoutScore.team1}</p>
                </div>
                <div className="text-2xl font-medium text-gray-400">-</div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{match.team2}</p>
                  <p className="text-3xl font-bold text-purple-600">{penaltyShootoutScore.team2}</p>
                </div>
              </div>
            </div>

            {/* Penalty Events History */}
            {penaltyEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Penalty History</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {penaltyEvents.map((penalty, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                      <span className="font-medium">{penalty.team === 1 ? match.team1 : match.team2}</span>
                      <span className="text-gray-600">{penalty.kicker?.name}</span>
                      <span className={
                        penalty.outcome === 'Goal' ? 'text-green-600 font-medium' :
                        penalty.outcome === 'Save' ? 'text-blue-600' :
                        'text-gray-500'
                      }>
                        {penalty.outcome === 'Goal' ? '⚽ Goal' :
                         penalty.outcome === 'Save' ? '🧤 Saved' :
                         '❌ Missed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Select Team for Penalty */}
            {!penaltyKicker && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select Team</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setPenaltyTeam(1)}
                    className={`py-6 ${penaltyTeam === 1 ? 'bg-purple-600' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {match.team1}
                  </Button>
                  <Button
                    onClick={() => setPenaltyTeam(2)}
                    className={`py-6 ${penaltyTeam === 2 ? 'bg-purple-600' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {match.team2}
                  </Button>
                </div>
              </div>
            )}

            {/* Select Kick Taker */}
            {penaltyTeam && !penaltyKicker && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select Kick Taker</p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {(() => {
                    // Get the squad for the selected team
                    const squad = penaltyTeam === 1 ? currentTeam1Squad : currentTeam2Squad;
                    
                    // Get all penalties taken by this team
                    const teamPenalties = penaltyEvents.filter(p => p.team === penaltyTeam);
                    
                    // Count how many times each player has taken a penalty
                    const playerKickCounts = {};
                    teamPenalties.forEach(penalty => {
                      const playerId = penalty.kicker.id;
                      playerKickCounts[playerId] = (playerKickCounts[playerId] || 0) + 1;
                    });
                    
                    // Find the minimum number of kicks taken by any player
                    const minKicks = squad.length > 0 
                      ? Math.min(...squad.map(p => playerKickCounts[p.id] || 0))
                      : 0;
                    
                    // Filter players: only show players who have taken minKicks penalties
                    // This ensures all players take one before anyone takes a second
                    // Also exclude players with red cards
                    const availablePlayers = squad.filter(player => 
                      (playerKickCounts[player.id] || 0) === minKicks && !hasRedCard(player.id)
                    );
                    
                    if (availablePlayers.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No players available
                        </div>
                      );
                    }
                    
                    return availablePlayers.map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => setPenaltyKicker(player)}
                        className="justify-start bg-gray-100 hover:bg-purple-100 text-gray-900 text-left"
                      >
                        <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-sm">
                          {player.jerseyNumber || player.number || '?'}
                        </span>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-gray-600">
                            {player.position}
                            {playerKickCounts[player.id] > 0 && (
                              <span className="ml-2 text-purple-600">
                                • {playerKickCounts[player.id]} kick{playerKickCounts[player.id] > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </Button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Select Outcome */}
            {penaltyKicker && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Penalty Taker</p>
                  <p className="font-medium">{penaltyKicker.name} ({penaltyTeam === 1 ? match.team1 : match.team2})</p>
                </div>
                
                <p className="text-sm font-medium text-gray-700">Select Outcome</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => {
                      // Record goal
                      const newPenalty = {
                        team: penaltyTeam,
                        kicker: penaltyKicker,
                        outcome: 'Goal'
                      };
                      setPenaltyEvents([...penaltyEvents, newPenalty]);
                      setPenaltyShootoutScore({
                        ...penaltyShootoutScore,
                        [penaltyTeam === 1 ? 'team1' : 'team2']: penaltyShootoutScore[penaltyTeam === 1 ? 'team1' : 'team2'] + 1
                      });
                      setPenaltyKicker(null);
                      setPenaltyTeam(null);
                    }}
                    className="py-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    ⚽ Goal
                  </Button>
                  <Button
                    onClick={() => {
                      // Record save
                      const newPenalty = {
                        team: penaltyTeam,
                        kicker: penaltyKicker,
                        outcome: 'Save'
                      };
                      setPenaltyEvents([...penaltyEvents, newPenalty]);
                      setPenaltyKicker(null);
                      setPenaltyTeam(null);
                    }}
                    className="py-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🧤 Saved
                  </Button>
                  <Button
                    onClick={() => {
                      // Record miss
                      const newPenalty = {
                        team: penaltyTeam,
                        kicker: penaltyKicker,
                        outcome: 'Off Target'
                      };
                      setPenaltyEvents([...penaltyEvents, newPenalty]);
                      setPenaltyKicker(null);
                      setPenaltyTeam(null);
                    }}
                    className="py-4 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    ❌ Off Target
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setShowPenaltyDialog(false);
                setIsPenaltyShootout(false);
                setPenaltyKicker(null);
                setPenaltyTeam(null);
                setIsRunning(true);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPenaltyEndConfirm(true);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              End Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Penalty Shootout End Match Confirmation */}
      <AlertDialog open={showPenaltyEndConfirm} onOpenChange={setShowPenaltyEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this match?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Final Score (Regular Time)</p>
              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600">{match.team1}</p>
                  <p className="text-2xl font-bold text-purple-600">{scoreA}</p>
                </div>
                <span className="text-xl text-gray-400">-</span>
                <div className="text-center">
                  <p className="text-xs text-gray-600">{match.team2}</p>
                  <p className="text-2xl font-bold text-purple-600">{scoreB}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Penalty Shootout</p>
              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600">{match.team1}</p>
                  <p className="text-2xl font-bold text-green-600">{penaltyShootoutScore.team1}</p>
                </div>
                <span className="text-xl text-gray-400">-</span>
                <div className="text-center">
                  <p className="text-xs text-gray-600">{match.team2}</p>
                  <p className="text-2xl font-bold text-green-600">{penaltyShootoutScore.team2}</p>
                </div>
              </div>
            </div>
            
            {penaltyShootoutScore.team1 !== penaltyShootoutScore.team2 && (
              <div className="text-center">
                <p className="text-sm text-gray-600">Winner</p>
                <p className="text-lg font-bold text-purple-600">
                  {penaltyShootoutScore.team1 > penaltyShootoutScore.team2 ? match.team1 : match.team2}
                </p>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // End penalty shootout and match
                const finalMatchData = {
                  ...match,
                  teamA: match.team1,
                  teamB: match.team2,
                  scoreA,
                  scoreB,
                  events: events.reverse(),
                  finalTime: formatTime(time),
                  duration: time,
                  status: 'Full Time',
                  endTime: new Date(),
                  isPenaltyShootout: true,
                  penaltyShootoutScore,
                  penaltyEvents,
                  winner: penaltyShootoutScore.team1 > penaltyShootoutScore.team2 ? match.team1 : 
                         penaltyShootoutScore.team2 > penaltyShootoutScore.team1 ? match.team2 : null,
                  // Override with live-tracked squads so substitutions are preserved
                  team1Squad: currentTeam1Squad,
                  team2Squad: currentTeam2Squad,
                  team1FullRoster: match.team1FullRoster || currentTeam1Squad,
                  team2FullRoster: match.team2FullRoster || currentTeam2Squad,
                };
                setShowPenaltyEndConfirm(false);
                setShowPenaltyDialog(false);
                onEndMatch(finalMatchData);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm & End Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo Last Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to undo the last event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndoLastEvent}
              className="bg-red-600 hover:bg-red-700"
            >
              Undo Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End First Half Confirmation Dialog */}
      <AlertDialog open={showEndHalfDialog} onOpenChange={setShowEndHalfDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End First Half?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the first half? The timer will be paused and you can start the second half when ready.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsHalfTimeBreak(true);
                setShowEndHalfDialog(false);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              End First Half
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LiveScoring;
