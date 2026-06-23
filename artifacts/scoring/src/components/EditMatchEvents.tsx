import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Target, AlertTriangle, RotateCcw, Timer, Footprints, OctagonAlert, ArrowDownUp, FlagTriangleRight, Flag, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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

interface EditMatchEventsProps {
  match: any;
  onBack: () => void;
  onSave: (updatedMatch: any) => void;
}

const EditMatchEvents = ({ match, onBack, onSave }: EditMatchEventsProps) => {
  const [events, setEvents] = useState(match?.events || []);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [substitutionAlertOpen, setSubstitutionAlertOpen] = useState(false);
  const [substitutionMessage, setSubstitutionMessage] = useState('');
  const [pendingSubstitution, setPendingSubstitution] = useState<any>(null);
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({ name: '', number: '', position: '' });
  const [teamSquads, setTeamSquads] = useState({
    team1Squad: match?.team1FullRoster || match?.team1Squad || [],
    team2Squad: match?.team2FullRoster || match?.team2Squad || [],
  });

  // Debug: Log initial match data
  useEffect(() => {
    console.log('\n🔍🔍🔍 [EditMatchEvents] COMPONENT MOUNTED - INITIAL DATA DEBUG 🔍🔍🔍');
    console.log('📊 [Match Data] teamA:', match?.teamA);
    console.log('📊 [Match Data] teamB:', match?.teamB);
    console.log('📊 [Match Data] team1Squad length:', match?.team1Squad?.length);
    console.log('📊 [Match Data] team2Squad length:', match?.team2Squad?.length);
    console.log('📊 [Match Data] team1FullRoster length:', match?.team1FullRoster?.length);
    console.log('📊 [Match Data] team2FullRoster length:', match?.team2FullRoster?.length);
    console.log('📊 [Match Data] team1StartingLineup length:', match?.team1StartingLineup?.length);
    console.log('📊 [Match Data] team2StartingLineup length:', match?.team2StartingLineup?.length);
    console.log('📊 [Match Data] team1Squad players:', match?.team1Squad?.map((p: any) => p.name));
    console.log('📊 [Match Data] team1FullRoster players:', match?.team1FullRoster?.map((p: any) => p.name));
    console.log('📊 [Match Data] team1StartingLineup players:', match?.team1StartingLineup?.map((p: any) => p.name));
    console.log('📊 [State] teamSquads.team1Squad length:', teamSquads.team1Squad?.length);
    console.log('📊 [State] teamSquads.team2Squad length:', teamSquads.team2Squad?.length);
    console.log('📊 [State] teamSquads.team1Squad players:', teamSquads.team1Squad?.map((p: any) => p.name));
    console.log('🔍🔍🔍 [EditMatchEvents] END INITIAL DATA DEBUG 🔍🔍🔍\n');
  }, []);

  // Get scoring level from match
  const scoringLevel = match?.scoringLevel || 'advanced';
  
  // Determine if detailed scoring is enabled
  const isDetailedScoringEnabled = () => {
    return scoringLevel === 'intermediate-detailed' || scoringLevel === 'advanced';
  };
  
  // Get available event types based on scoring level (BASE TYPES ONLY for live scoring)
  const getAvailableEventTypes = () => {
    const basicEvents = ['goal', 'shot_on_target', 'shot_off_target', 'foul', 'substitution', 'corner'];
    
    const advancedEvents = ['goal', 'shot_on_target', 'shot_off_target', 
                            'foul', 'substitution', 
                            'corner', 'offside', 'free_kick', 'interception', 'penalty'];
    
    // Basic: limited events
    if (scoringLevel === 'basic') {
      return basicEvents;
    }
    
    // Intermediate-all: all events
    if (scoringLevel === 'intermediate-all') {
      return advancedEvents;
    }
    
    // Intermediate-detailed: basic events with detailed attributes
    if (scoringLevel === 'intermediate-detailed') {
      return basicEvents;
    }
    
    // Advanced: all events with detailed attributes
    return advancedEvents;
  };

  const availableEventTypes = getAvailableEventTypes();
  
  // Helper to normalize event type to base type (convert penalty_goal, own_goal, yellow_card, red_card, shot_on_goal to base types)
  const normalizeEventType = (type: string) => {
    if (type === 'penalty_goal' || type === 'own_goal') return 'goal';
    if (type === 'yellow_card' || type === 'red_card') return 'foul';
    if (type === 'shot_on_goal') return 'shot_on_target'; // Legacy support
    return type;
  };
  
  // Helper to get base event type with attributes
  const getBaseEventType = (event: any) => {
    return normalizeEventType(event.type);
  };

  // Debug: Log initial match data
  console.log('\n🏟️  [EditMatchEvents] Match Data:', {
    teamA: match?.teamA,
    teamB: match?.teamB,
    team1Squad: match?.team1Squad?.map((p: any) => p.name),
    team2Squad: match?.team2Squad?.map((p: any) => p.name),
    team1FullRoster: match?.team1FullRoster?.map((p: any) => p.name),
    team2FullRoster: match?.team2FullRoster?.map((p: any) => p.name),
    team1StartingLineup: match?.team1StartingLineup?.map((p: any) => p.name),
    team2StartingLineup: match?.team2StartingLineup?.map((p: any) => p.name),
    eventsCount: match?.events?.length || 0,
  });

  // Helper function to get player name from event
  const getPlayerName = (event: any) => {
    if (typeof event.player === 'object' && event.player?.name) {
      return event.player.name;
    }
    return event.player || '';
  };

  // Helper function to get assist name from event
  const getAssistName = (event: any) => {
    if (typeof event.assist === 'object' && event.assist?.name) {
      return event.assist.name;
    }
    return event.assist || event.assistedBy || '';
  };

  // Helper function to get saved by name from event
  const getSavedByName = (event: any) => {
    if (typeof event.savedBy === 'object' && event.savedBy?.name) {
      return event.savedBy.name;
    }
    return event.savedBy || '';
  };

  // Helper function to get playerOut name from event
  const getPlayerOutName = (event: any) => {
    if (typeof event.playerOut === 'object' && event.playerOut?.name) {
      return event.playerOut.name;
    }
    return event.playerOut || '';
  };

  // Helper function to get playerIn name from event
  const getPlayerInName = (event: any) => {
    if (typeof event.playerIn === 'object' && event.playerIn?.name) {
      return event.playerIn.name;
    }
    return event.playerIn || '';
  };

  // Helper function to get event minute/time
  const getEventTime = (event: any) => {
    // Check if time is a string like "23:45" and extract just the minute
    if (typeof event.time === 'string') {
      const parts = event.time.split(':');
      return parts[0]; // Return the minute part
    }
    return event.minute || event.time || '0';
  };

  // Helper function to get full time with seconds (for display)
  const getFullEventTime = (event: any) => {
    // Return the full time string with seconds if available
    if (typeof event.time === 'string') {
      return event.time; // e.g., "23:45"
    }
    return `${event.minute || 0}:00`;
  };

  // Get team players for dropdown
  const getTeamPlayers = (teamName: string) => {
    if (teamName === match?.teamA) {
      return teamSquads.team1Squad || [];
    } else if (teamName === match?.teamB) {
      return teamSquads.team2Squad || [];
    }
    return [];
  };

  // Get ALL available players from team's full squad/roster (for Player IN dropdown)
  const getAllAvailableTeamPlayers = (teamName: string) => {
    console.log('🔍 [getAllAvailableTeamPlayers] Called for team:', teamName);
    console.log('🔍 [getAllAvailableTeamPlayers] match.teamA:', match?.teamA);
    console.log('🔍 [getAllAvailableTeamPlayers] match.teamB:', match?.teamB);
    console.log('🔍 [getAllAvailableTeamPlayers] teamSquads.team1Squad length:', teamSquads.team1Squad?.length);
    console.log('🔍 [getAllAvailableTeamPlayers] teamSquads.team2Squad length:', teamSquads.team2Squad?.length);
    
    // Use teamSquads state which includes dynamically added players
    if (teamName === match?.teamA) {
      console.log('✅ [getAllAvailableTeamPlayers] Returning team1Squad:', teamSquads.team1Squad?.map((p: any) => p.name));
      return teamSquads.team1Squad || [];
    } else if (teamName === match?.teamB) {
      console.log('✅ [getAllAvailableTeamPlayers] Returning team2Squad:', teamSquads.team2Squad?.map((p: any) => p.name));
      return teamSquads.team2Squad || [];
    }
    console.log('❌ [getAllAvailableTeamPlayers] No match found, returning empty array');
    return [];
  };

  // Get starting lineup for a team
  const getStartingLineup = (teamName: string) => {
    console.log('🏃 [getStartingLineup] Called for team:', teamName);
    if (teamName === match?.teamA) {
      // team1StartingLineup is the preferred field, fallback to team1Squad (which is the initial starting 11)
      const lineup = match?.team1StartingLineup || match?.team1Squad || [];
      console.log('🏃 [getStartingLineup] Team1 starting lineup:', lineup.map((p: any) => p.name));
      return lineup;
    } else if (teamName === match?.teamB) {
      const lineup = match?.team2StartingLineup || match?.team2Squad || [];
      console.log('🏃 [getStartingLineup] Team2 starting lineup:', lineup.map((p: any) => p.name));
      return lineup;
    }
    console.log('🏃 [getStartingLineup] No match, returning empty');
    return [];
  };

  // Helper function to convert time string (MM:SS or MM) to total seconds
  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    
    // If it contains a colon, it's in MM:SS format
    if (timeStr.includes(':')) {
      const [minutes, seconds] = timeStr.split(':').map(Number);
      return (minutes || 0) * 60 + (seconds || 0);
    }
    
    // Otherwise, assume it's just minutes
    return (parseInt(timeStr) || 0) * 60;
  };

  // Get substitutes (ALL squad players not currently on field)
  const getSubstitutes = (teamName: string) => {
    console.log('\n🚀 [getSubstitutes] Starting debug for team:', teamName);
    
    // Step 1: Get the whole squad
    const wholeSquad = getAllAvailableTeamPlayers(teamName);
    console.log('📋 [getSubstitutes] Whole squad:', wholeSquad.map((p: any) => p.name));
    
    // Step 2: Get starting lineup and calculate initial players on bench
    const startingLineup = getStartingLineup(teamName);
    const startingLineupNames = startingLineup.map((p: any) => p.name);
    console.log('⚽ [getSubstitutes] Starting lineup:', startingLineupNames);
    
    // Players on bench = whole squad - starting lineup
    let playersOnBench = wholeSquad.filter((player: any) => 
      !startingLineupNames.includes(player.name)
    );
    console.log('🪑 [getSubstitutes] Initial players on bench:', playersOnBench.map((p: any) => p.name));
    
    // Step 3: Get the time of current substitution event (from editForm) - use MM:SS format
    const currentEventTimeStr = editForm.minutes || '0';
    const currentEventTime = timeToSeconds(currentEventTimeStr);
    console.log(`⏰ [getSubstitutes] Current event time: ${currentEventTimeStr} (${currentEventTime} seconds)`);
    
    // Step 4: Check for substitution events BEFORE this time and update bench
    events.forEach((event: any, idx: number) => {
      // Skip the event we're currently editing
      if (editingEvent !== null && idx === editingEvent) {
        console.log(`⏭️ [getSubstitutes] Skipping currently editing event at index ${idx}`);
        return;
      }
      
      if ((event.type === 'substitution' || event.type === 'substitute') && event.team === teamName) {
        const eventTimeStr = event.time || '0';
        const eventTime = timeToSeconds(eventTimeStr);
        
        // Only consider substitutions that happened BEFORE the current event time
        if (eventTime < currentEventTime) {
          const playerOut = getPlayerOutName(event);
          const playerIn = getPlayerInName(event);
          
          console.log(`🔄 [getSubstitutes] Processing sub at ${eventTimeStr} (${eventTime}s): ${playerOut} → ${playerIn}`);
          
          // Player IN: Remove from bench (they're now on field)
          playersOnBench = playersOnBench.filter((p: any) => p.name !== playerIn);
          
          // Player OUT: Add back to bench (they're now available)
          const playerOutObj = wholeSquad.find((p: any) => p.name === playerOut);
          if (playerOutObj && !playersOnBench.some((p: any) => p.name === playerOut)) {
            playersOnBench.push(playerOutObj);
          }
        }
      }
    });
    
    console.log('✅ [getSubstitutes] Final players on bench (Player IN options):', playersOnBench.map((p: any) => p.name));
    console.log('🏁 [getSubstitutes] Debug complete\n');
    
    return playersOnBench;
  };

  // Get all players (both teams) for goalkeeper selection
  const getAllPlayers = () => {
    const team1Players = teamSquads.team1Squad || [];
    const team2Players = teamSquads.team2Squad || [];
    return [...team1Players, ...team2Players];
  };

  // Get outfield players only (exclude goalkeepers) for blocker selection
  const getOutfieldPlayers = () => {
    const allPlayers = getAllPlayers();
    return allPlayers.filter((player: any) => {
      const position = player.position?.toLowerCase() || '';
      return position !== 'gk' && position !== 'goalkeeper' && position !== 'goalie';
    });
  };

  // Form state for editing
  const [editForm, setEditForm] = useState({
    time: '', // Full time with seconds (read-only)
    minutes: '0',
    seconds: '00',
    type: '',
    team: '',
    teamNumber: 1,
    player: '',
    assistedBy: '',
    playerOut: '',
    playerIn: '',
    yellowCard: false,
    redCard: false,
    savedBy: '',
    ownGoal: false,
    isPenalty: false,
    goalType: '', // For advanced scoring - header, freekick, etc.
    shotOnTargetOutcome: '', // For advanced scoring - saved, blocked
    shotOffTargetOutcome: '', // For advanced scoring - hit post, over bar, etc.
  });
  
  // Helper to get event type label
  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'goal': 'Goal',
      'penalty_goal': 'Penalty Goal',
      'own_goal': 'Own Goal',
      'shot_on_target': 'Shot on Target',
      'shot_off_target': 'Shot off Target',
      'foul': 'Foul',
      'yellow_card': 'Yellow Card',
      'red_card': 'Red Card',
      'substitution': 'Substitution',
      'corner': 'Corner',
      'offside': 'Offside',
      'free_kick': 'Free Kick',
      'interception': 'Interception',
      'penalty': 'Penalty'
    };
    return labels[type] || type;
  };

  const getEventIcon = (type: string) => {
    // Normalize the event type first to handle legacy types
    const normalizedType = normalizeEventType(type);
    
    switch (normalizedType) {
      case 'goal':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'penalty_goal':
        return <FlagTriangleRight className="w-5 h-5 text-green-600" />;
      case 'own_goal':
        return <Flag className="w-5 h-5 text-red-600" />;
      case 'shot_on_target':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'shot_off_target':
      case 'off_target':
        return <Footprints className="w-5 h-5 text-gray-600" />;
      case 'foul':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'yellow_card':
        return <OctagonAlert className="w-5 h-5 text-yellow-600" />;
      case 'red_card':
        return <OctagonAlert className="w-5 h-5 text-red-600" />;
      case 'substitution':
      case 'substitute':
        return <ArrowDownUp className="w-5 h-5 text-purple-600" />;
      case 'corner':
        return <Flag className="w-5 h-5 text-blue-600" />;
      case 'offside':
        return <Flag className="w-5 h-5 text-orange-600" />;
      case 'free_kick':
        return <Target className="w-5 h-5 text-purple-600" />;
      case 'interception':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'penalty':
        return <Target className="w-5 h-5 text-purple-600" />;
      default:
        return <Timer className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventDescription = (event: any) => {
    // Normalize the event type first to handle legacy types
    const normalizedType = normalizeEventType(event.type);
    
    switch (normalizedType) {
      case 'goal':
        return `Goal by ${getPlayerName(event)}${getAssistName(event) ? ` (assist: ${getAssistName(event)})` : ''}`;
      case 'penalty_goal':
        return `Penalty Goal by ${getPlayerName(event)}`;
      case 'own_goal':
        return `Own Goal by ${getPlayerName(event)}`;
      case 'shot_on_target':
        return `Shot on Target by ${getPlayerName(event)}${getSavedByName(event) ? ` (saved by ${getSavedByName(event)})` : ''}`;
      case 'shot_off_target':
      case 'off_target':
        return `Shot off Target by ${getPlayerName(event)}`;
      case 'foul':
        return `Foul by ${getPlayerName(event)}${event.yellowCard ? ' 🟨' : ''}${event.redCard ? ' 🟥' : ''}`;
      case 'yellow_card':
        return `Yellow Card - ${getPlayerName(event)}`;
      case 'red_card':
        return `Red Card - ${getPlayerName(event)}`;
      case 'substitution':
      case 'substitute':
        return `Substitution: ${getPlayerOutName(event)} ➡️ ${getPlayerInName(event)}`;
      case 'corner':
        return `Corner`;
      case 'offside':
        return `Offside - ${getPlayerName(event)}`;
      case 'free_kick':
        return `Free Kick - ${getPlayerName(event)}`;
      case 'interception':
        return `Interception by ${getPlayerName(event)}`;
      case 'penalty':
        return `Penalty awarded`;
      default:
        return event.description || 'Event';
    }
  };

  // Get event characteristics (badges for goal type, cards, etc.)
  const getEventCharacteristics = (event: any) => {
    const characteristics: string[] = [];
    
    // Goal type
    if (event.type === 'goal' && event.goalType) {
      characteristics.push(event.goalType);
    }
    
    // Cards
    if (event.yellowCard) {
      characteristics.push('Yellow Card');
    }
    if (event.redCard) {
      characteristics.push('Red Card');
    }
    
    // Shot outcomes
    if (event.shotOnTargetOutcome) {
      characteristics.push(event.shotOnTargetOutcome);
    }
    if (event.shotOffTargetOutcome) {
      characteristics.push(event.shotOffTargetOutcome);
    }
    
    // Own goal
    if (event.ownGoal) {
      characteristics.push('Own Goal');
    }
    
    return characteristics;
  };

  const handleEditClick = (event: any, index: number) => {
    setEditingEvent({ ...event, index });
    
    // Normalize event type to base type
    const baseType = normalizeEventType(event.type);
    
    // Determine if it's a penalty goal or own goal
    const isPenalty = event.type === 'penalty_goal' || event.goalType === 'Penalty';
    const isOwnGoal = event.type === 'own_goal' || event.ownGoal;
    
    setEditForm({
      time: getFullEventTime(event) || '',
      minutes: getEventTime(event) || '0',
      seconds: getFullEventTime(event).split(':')[1] || '00',
      type: baseType, // Use normalized base type
      team: event.teamName || event.team || '',
      teamNumber: event.teamNumber || event.team || 1,
      player: getPlayerName(event) || '',
      assistedBy: getAssistName(event) || '',
      playerOut: getPlayerOutName(event) || '',
      playerIn: getPlayerInName(event) || '',
      yellowCard: event.yellowCard || event.type === 'yellow_card' || false,
      redCard: event.redCard || event.type === 'red_card' || false,
      savedBy: getSavedByName(event) || '',
      ownGoal: isOwnGoal,
      isPenalty: isPenalty,
      goalType: event.goalType || '', // For advanced scoring - header, freekick, etc.
      shotOnTargetOutcome: event.shotOnTargetOutcome || '', // For advanced scoring - saved, blocked
      shotOffTargetOutcome: event.shotOffTargetOutcome || '', // For advanced scoring - hit post, over bar, etc.
    });
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingEvent(null); // null indicates adding new event
    setEditForm({
      time: '0:00',
      minutes: '0',
      seconds: '00',
      type: '',
      team: match?.teamA || '',
      teamNumber: 1,
      player: '',
      assistedBy: '',
      playerOut: '',
      playerIn: '',
      yellowCard: false,
      redCard: false,
      savedBy: '',
      ownGoal: false,
      isPenalty: false,
      goalType: '', // For advanced scoring - header, freekick, etc.
      shotOnTargetOutcome: '', // For advanced scoring - saved, blocked
      shotOffTargetOutcome: '', // For advanced scoring - hit post, over bar, etc.
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (index: number) => {
    setEventToDelete(index);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    // Validation
    const errors: string[] = [];

    // Check event type
    if (!editForm.type) {
      errors.push('Event type is required');
    }

    // Check time for new events
    if (editingEvent === null) {
      if (!editForm.minutes || editForm.minutes === '') {
        errors.push('Minutes is required');
      }
      if (!editForm.seconds || editForm.seconds === '') {
        errors.push('Seconds is required');
      }
    }

    // Check team
    if (!editForm.team) {
      errors.push('Team is required');
    }

    // Check player for events that require it
    const eventsRequiringPlayer = ['goal', 'penalty_goal', 'own_goal', 'shot_on_target', 'shot_off_target', 'foul', 'yellow_card', 'red_card', 'offside', 'free_kick', 'interception'];
    if (eventsRequiringPlayer.includes(editForm.type) && !editForm.player) {
      errors.push('Player is required for this event type');
    }

    // Check substitution fields
    if (editForm.type === 'substitution' || editForm.type === 'substitute') {
      if (!editForm.playerOut) {
        errors.push('Player Out is required for substitution');
      }
      if (!editForm.playerIn) {
        errors.push('Player In is required for substitution');
      }
    }

    // If there are errors, show them and don't save
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return;
    }

    // Helper function to convert time string (MM:SS) to total seconds for comparison
    const timeToSeconds = (timeStr: string) => {
      const parts = timeStr.split(':');
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    };

    // Check if this is a substitution event (for both adding and editing)
    const isSubstitution = (editForm.type === 'substitution' || editForm.type === 'substitute') && editForm.playerOut && editForm.playerIn;
    
    if (isSubstitution) {
      const substitutionTime = editingEvent !== null ? editForm.time : `${editForm.minutes}:${editForm.seconds}`;
      const substitutionSeconds = timeToSeconds(substitutionTime);
      const affectedEvents: any[] = [];

      // Find all events after the substitution time involving the player who went out
      events.forEach((event: any, index: number) => {
        // Skip the event being edited itself
        if (editingEvent !== null && index === editingEvent.index) {
          return;
        }

        const eventTime = getFullEventTime(event);
        const eventSeconds = timeToSeconds(eventTime);
        const eventPlayer = getPlayerName(event);
        
        if (eventSeconds > substitutionSeconds && eventPlayer === editForm.playerOut) {
          affectedEvents.push({
            index,
            event,
            description: getEventDescription(event),
            minute: eventTime,
          });
        }
      });

      if (affectedEvents.length > 0) {
        // Determine teamNumber based on team selection
        const teamNumber = editForm.team === match?.teamA ? 1 : 2;
        
        const substitutionEvent = editingEvent !== null ? {
          // Editing existing substitution
          ...events[editingEvent.index],
          minute: parseInt(editForm.minutes) || 0,
          time: editForm.time, // Keep original time when editing
          type: editForm.type,
          team: editForm.team,
          teamName: editForm.team,
          teamNumber: teamNumber,
          player: editForm.player,
          assist: editForm.assistedBy,
          assistedBy: editForm.assistedBy,
          playerOut: editForm.playerOut,
          playerIn: editForm.playerIn,
          yellowCard: editForm.yellowCard,
          redCard: editForm.redCard,
          savedBy: editForm.savedBy,
          ownGoal: editForm.ownGoal,
          goalType: editForm.goalType,
          shotOnTargetOutcome: editForm.shotOnTargetOutcome,
          shotOffTargetOutcome: editForm.shotOffTargetOutcome,
        } : {
          // Adding new substitution
          minute: parseInt(editForm.minutes) || 0,
          time: `${editForm.minutes}:${editForm.seconds}`,
          type: editForm.type,
          team: editForm.team,
          teamName: editForm.team,
          teamNumber: teamNumber,
          player: editForm.player,
          assist: editForm.assistedBy,
          assistedBy: editForm.assistedBy,
          playerOut: editForm.playerOut,
          playerIn: editForm.playerIn,
          yellowCard: editForm.yellowCard,
          redCard: editForm.redCard,
          savedBy: editForm.savedBy,
          ownGoal: editForm.ownGoal,
          goalType: editForm.goalType,
          shotOnTargetOutcome: editForm.shotOnTargetOutcome,
          shotOffTargetOutcome: editForm.shotOffTargetOutcome,
        };

        // Store the pending substitution and affected events
        setPendingSubstitution({
          substitutionEvent,
          affectedEvents,
          playerOut: editForm.playerOut,
          playerIn: editForm.playerIn,
          isEditing: editingEvent !== null,
          editingIndex: editingEvent?.index,
        });

        // Create alert message
        const eventsList = affectedEvents
          .map((ae) => `- ${ae.minute}: ${ae.description}`)
          .join('\\n');
        
        setSubstitutionMessage(
          `${editForm.playerOut} was substituted out at ${substitutionTime}, but there are ${affectedEvents.length} event(s) after this time that belong to ${editForm.playerOut}:\\n\\n${eventsList}\\n\\nThese events will be automatically transferred to ${editForm.playerIn}. Do you want to proceed?`
        );
        
        setEditDialogOpen(false);
        setSubstitutionAlertOpen(true);
        return;
      }
    }

    if (editingEvent !== null) {
      // Editing existing event (non-substitution or substitution with no conflicts)
      const updatedEvents = [...events];
      
      // Determine teamNumber based on team selection
      const teamNumber = editForm.team === match?.teamA ? 1 : 2;
      
      updatedEvents[editingEvent.index] = {
        ...updatedEvents[editingEvent.index],
        minute: parseInt(editForm.minutes) || 0,
        time: editForm.time, // Keep original time when editing (read-only field)
        type: editForm.type,
        team: editForm.team,           // Team name
        teamName: editForm.team,       // Also set teamName for compatibility
        teamNumber: teamNumber,        // 1 for teamA, 2 for teamB
        player: editForm.player,
        assist: editForm.assistedBy, // Set both assist and assistedBy for compatibility
        assistedBy: editForm.assistedBy,
        playerOut: editForm.playerOut,
        playerIn: editForm.playerIn,
        yellowCard: editForm.yellowCard,
        redCard: editForm.redCard,
        savedBy: editForm.savedBy,
        ownGoal: editForm.ownGoal,
        goalType: editForm.goalType, // For advanced scoring - header, freekick, etc.
        shotOnTargetOutcome: editForm.shotOnTargetOutcome, // For advanced scoring - saved, blocked
        shotOffTargetOutcome: editForm.shotOffTargetOutcome, // For advanced scoring - hit post, over bar, etc.
      };
      setEvents(updatedEvents);
      setEditDialogOpen(false);
      setEditingEvent(null);
    } else {
      // Adding new event (non-substitution or substitution with no conflicts)
      // Determine teamNumber based on team selection
      const teamNumber = editForm.team === match?.teamA ? 1 : 2;
      
      const newEvent = {
        minute: parseInt(editForm.minutes) || 0,
        time: `${editForm.minutes}:${editForm.seconds}`,
        type: editForm.type,
        team: editForm.team,           // Team name
        teamName: editForm.team,       // Also set teamName for compatibility
        teamNumber: teamNumber,        // 1 for teamA, 2 for teamB
        player: editForm.player,
        assist: editForm.assistedBy, // Set both assist and assistedBy for compatibility
        assistedBy: editForm.assistedBy,
        playerOut: editForm.playerOut,
        playerIn: editForm.playerIn,
        yellowCard: editForm.yellowCard,
        redCard: editForm.redCard,
        savedBy: editForm.savedBy,
        ownGoal: editForm.ownGoal,
        goalType: editForm.goalType, // For advanced scoring - header, freekick, etc.
        shotOnTargetOutcome: editForm.shotOnTargetOutcome, // For advanced scoring - saved, blocked
        shotOffTargetOutcome: editForm.shotOffTargetOutcome, // For advanced scoring - hit post, over bar, etc.
      };

      // No substitution conflicts detected earlier, just add the event
      if (false) {
        const substitutionMinute = parseInt(editForm.minutes) || 0;
        const affectedEvents: any[] = [];

        // Find all events after the substitution time involving the player who went out
        events.forEach((event: any, index: number) => {
          const eventMinute = parseInt(getEventTime(event)) || 0;
          const eventPlayer = getPlayerName(event);
          
          if (eventMinute > substitutionMinute && eventPlayer === editForm.playerOut) {
            affectedEvents.push({
              index,
              event,
              description: getEventDescription(event),
              minute: getEventTime(event),
            });
          }
        });

        if (affectedEvents.length > 0) {
          // Store the pending substitution and affected events
          setPendingSubstitution({
            newEvent,
            affectedEvents,
            playerOut: editForm.playerOut,
            playerIn: editForm.playerIn,
          });

          // Create alert message
          const eventsList = affectedEvents
            .map((ae) => `- ${ae.minute}': ${ae.description}`)
            .join('\n');
          
          setSubstitutionMessage(
            `${editForm.playerOut} was substituted out at ${editForm.time}, but there are ${affectedEvents.length} event(s) after this time that belong to ${editForm.playerOut}:\n\n${eventsList}\n\nThese events will be automatically transferred to ${editForm.playerIn}. Do you want to proceed?`
          );
          
          setEditDialogOpen(false);
          setSubstitutionAlertOpen(true);
          return;
        }
      }

      // No substitution conflicts, just add the event
      setEvents([...events, newEvent]);
      setEditDialogOpen(false);
      setEditingEvent(null);
    }
  };

  const handleConfirmSubstitution = () => {
    if (pendingSubstitution) {
      const { substitutionEvent, affectedEvents, playerIn, playerOut, isEditing, editingIndex } = pendingSubstitution;
      
      let updatedEvents = [...events];
      
      // First, transfer all affected events to the new player (before adding/updating substitution)
      affectedEvents.forEach((ae: any) => {
        // Find the event by matching time and player name (more reliable than index)
        const eventIndex = updatedEvents.findIndex(
          (e) => getFullEventTime(e) === ae.minute && getPlayerName(e) === playerOut
        );
        
        if (eventIndex !== -1) {
          updatedEvents[eventIndex] = {
            ...updatedEvents[eventIndex],
            player: playerIn,
          };
        }
      });
      
      // Then add or update the substitution event
      if (isEditing) {
        // Update the existing substitution event
        updatedEvents[editingIndex] = substitutionEvent;
      } else {
        // Add new substitution event
        updatedEvents = [...updatedEvents, substitutionEvent];
      }

      setEvents(updatedEvents);
      setSubstitutionAlertOpen(false);
      setPendingSubstitution(null);
      setEditingEvent(null);
    }
  };

  const handleCancelSubstitution = () => {
    setSubstitutionAlertOpen(false);
    setPendingSubstitution(null);
    setEditDialogOpen(true); // Reopen the edit dialog
  };

  const handleConfirmDelete = () => {
    if (eventToDelete !== null) {
      const updatedEvents = events.filter((_, index) => index !== eventToDelete);
      setEvents(updatedEvents);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleSaveAll = () => {
    console.log('\n💾💾💾 [handleSaveAll] ============ START SAVE PROCESS ============');
    console.log('📊 [handleSaveAll] ORIGINAL match scoreA:', match?.scoreA);
    console.log('📊 [handleSaveAll] ORIGINAL match scoreB:', match?.scoreB);
    console.log('📊 [handleSaveAll] ORIGINAL match team1Score:', match?.team1Score);
    console.log('📊 [handleSaveAll] ORIGINAL match team2Score:', match?.team2Score);
    console.log('📊 [handleSaveAll] ORIGINAL match isPenaltyShootout:', match?.isPenaltyShootout);
    console.log('📊 [handleSaveAll] ORIGINAL match penaltyShootoutScore:', match?.penaltyShootoutScore);
    console.log('📊 [handleSaveAll] Match type:', match?.type);
    console.log('📊 [handleSaveAll] Is live scored:', match?.isLiveScored);
    console.log('📊 [handleSaveAll] Total events count:', events.length);
    
    // Log all events with their types and teams
    console.log('📋 [handleSaveAll] ALL EVENTS:');
    events.forEach((event: any, index: number) => {
      console.log(`  Event ${index + 1}:`, {
        type: event.type,
        team: event.team,
        player: event.player || event.playerOut || 'N/A',
        time: event.time,
      });
    });
    
    // Count goal events
    const goalEvents = events.filter((e: any) => 
      e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal'
    );
    console.log('⚽ [handleSaveAll] Goal events count:', goalEvents.length);
    goalEvents.forEach((event: any, index: number) => {
      console.log(`  Goal ${index + 1}:`, {
        type: event.type,
        team: event.team,
        player: event.player,
        time: event.time,
      });
    });
    
    // IMPORTANT: Only recalculate score if this was a live-scored match
    // For "result-entry" matches, the score was manually entered and events might be incomplete
    const shouldRecalculateScore = match?.isLiveScored !== false;
    console.log('🔄 [handleSaveAll] Should recalculate score:', shouldRecalculateScore);
    console.log('🔄 [handleSaveAll] Reason:', shouldRecalculateScore ? 'Live-scored match - recalculate from events' : 'Result-entry match - preserve original scores');
    
    let team1Score = match?.scoreA || 0;
    let team2Score = match?.scoreB || 0;
    const team1GoalScorers: string[] = [];
    const team2GoalScorers: string[] = [];
    
    if (shouldRecalculateScore) {
      // Recalculate scores based on goal events (ONLY for live-scored matches)
      team1Score = 0;
      team2Score = 0;
      
      console.log('🔢 [handleSaveAll] Starting score recalculation from events...');
      console.log('🔍 [handleSaveAll] match.teamA:', match?.teamA);
      console.log('🔍 [handleSaveAll] match.teamB:', match?.teamB);
      console.log('🔍 [handleSaveAll] match.team1:', match?.team1);
      console.log('🔍 [handleSaveAll] match.team2:', match?.team2);
      
      events.forEach((event: any, idx: number) => {
        const isGoalEvent = event.type === 'goal' || event.type === 'penalty_goal';
        
        // Debug log every event to see its structure
        console.log(`  📋 Event ${idx + 1}:`, {
          type: event.type,
          team: event.team,
          teamName: event.teamName,
          teamNumber: event.teamNumber,
          player: event.player,
          time: event.time,
          isGoalEvent: isGoalEvent,
        });
        
        if (isGoalEvent) {
          const scorer = getPlayerName(event);
          
          console.log(`    🔍 Checking goal: event.team="${event.team}", teamA="${match?.teamA}", teamB="${match?.teamB}"`);
          console.log(`    🔍 Match: event.team === teamA? ${event.team === match?.teamA}`);
          console.log(`    🔍 Match: event.team === teamB? ${event.team === match?.teamB}`);
          
          if (event.team === match?.teamA) {
            team1Score++;
            if (scorer) team1GoalScorers.push(scorer);
            console.log(`  ✅ Goal for ${match?.teamA}: ${scorer} at ${event.time} → Team1 score: ${team1Score}`);
          } else if (event.team === match?.teamB) {
            team2Score++;
            if (scorer) team2GoalScorers.push(scorer);
            console.log(`  ✅ Goal for ${match?.teamB}: ${scorer} at ${event.time} → Team2 score: ${team2Score}`);
          } else {
            console.log(`  ⚠️ GOAL NOT COUNTED! event.team="${event.team}" doesn't match teamA or teamB`);
          }
        }
        
        // Own goals count for the opposing team
        if (event.type === 'own_goal') {
          if (event.team === match?.teamA) {
            team2Score++; // Own goal by team A gives a point to team B
            console.log(`  🔴 Own goal by ${match?.teamA}: ${event.player} at ${event.time} → Team2 score: ${team2Score}`);
          } else if (event.team === match?.teamB) {
            team1Score++; // Own goal by team B gives a point to team A
            console.log(`  🔴 Own goal by ${match?.teamB}: ${event.player} at ${event.time} → Team1 score: ${team1Score}`);
          } else {
            console.log(`  ⚠️ OWN GOAL NOT COUNTED! event.team="${event.team}" doesn't match teamA or teamB`);
          }
        }
      });
      
      console.log('⚽ [handleSaveAll] Recalculated scores from events:', {
        team1Score,
        team2Score,
        team1GoalScorers,
        team2GoalScorers,
      });
    } else {
      console.log('📋 [handleSaveAll] Preserving original scores (result-entry match):', {
        team1Score,
        team2Score,
      });
      
      // For result-entry matches, still extract goal scorers from events if available
      events.forEach((event: any) => {
        const isGoalEvent = event.type === 'goal' || event.type === 'penalty_goal';
        if (isGoalEvent) {
          const scorer = getPlayerName(event);
          if (scorer) {
            if (event.team === match?.teamA) {
              team1GoalScorers.push(scorer);
            } else if (event.team === match?.teamB) {
              team2GoalScorers.push(scorer);
            }
          }
        }
      });
    }
    
    // Build updated match object - PRESERVE penalty shootout data!
    const updatedMatch = {
      ...match,
      events: events,
      scoreA: team1Score, // Update scoreA for match display
      scoreB: team2Score, // Update scoreB for match display
      team1Score: team1Score,
      team2Score: team2Score,
      team1GoalScorers: team1GoalScorers,
      team2GoalScorers: team2GoalScorers,
      team1Squad: teamSquads.team1Squad,
      team2Squad: teamSquads.team2Squad,
      team1FullRoster: teamSquads.team1Squad,
      team2FullRoster: teamSquads.team2Squad,
      // PRESERVE penalty shootout data
      isPenaltyShootout: match?.isPenaltyShootout || false,
      penaltyShootoutScore: match?.penaltyShootoutScore || null,
      penaltyEvents: match?.penaltyEvents || [],
    };
    
    console.log('✅ [handleSaveAll] Updated match object built');
    console.log('📊 [handleSaveAll] FINAL scoreA:', updatedMatch.scoreA);
    console.log('📊 [handleSaveAll] FINAL scoreB:', updatedMatch.scoreB);
    console.log('📊 [handleSaveAll] FINAL team1Score:', updatedMatch.team1Score);
    console.log('📊 [handleSaveAll] FINAL team2Score:', updatedMatch.team2Score);
    console.log('📊 [handleSaveAll] FINAL penaltyShootoutScore:', updatedMatch.penaltyShootoutScore);
    console.log('📊 [handleSaveAll] FINAL isPenaltyShootout:', updatedMatch.isPenaltyShootout);
    console.log('📊 [handleSaveAll] FINAL events count:', updatedMatch.events.length);
    
    console.log('🚀 [handleSaveAll] Calling onSave() with updated match...');
    onSave(updatedMatch);
    console.log('✅ [handleSaveAll] onSave() completed, calling onBack()...');
    onBack();
    console.log('💾💾💾 [handleSaveAll] ============ END SAVE PROCESS ============\n');
  };

  const handleAddPlayerClick = () => {
    setAddPlayerDialogOpen(true);
  };

  const handleAddPlayer = () => {
    const { name, number, position } = newPlayerForm;
    if (name && number && position) {
      const newPlayer = { name, number, position };
      const teamKey = editForm.team === match?.teamA ? 'team1Squad' : 'team2Squad';
      const updatedSquads = {
        ...teamSquads,
        [teamKey]: [...teamSquads[teamKey], newPlayer],
      };
      setTeamSquads(updatedSquads);
      
      // Automatically select the newly added player as "Player In"
      setEditForm({ ...editForm, playerIn: name });
      
      setAddPlayerDialogOpen(false);
      setNewPlayerForm({ name: '', number: '', position: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24">
      {/* Header */}
      <div className="mb-6 relative">
        {/* Back Button - positioned absolutely in top-left */}
        <button onClick={onBack} className="absolute left-0 top-0 p-2 text-gray-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        {/* Header Content - Single Column with 4 Rows */}
        <div className="pl-12 space-y-3">
          {/* Row 1: Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Match Events</h1>
          
          {/* Row 2: Teams */}
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {match?.teamA} vs {match?.teamB}
          </p>
          
          {/* Row 3: Tournament & Stage */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {match?.tournament || 'Tournament'} {match?.stage ? `• ${match.stage}` : ''}
          </p>
          
          {/* Row 4: Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddClick}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
            <Button
              onClick={handleSaveAll}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No events recorded for this match
            </CardContent>
          </Card>
        ) : (
          events.map((event: any, index: number) => {
            const characteristics = getEventCharacteristics(event);
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-stretch gap-4">
                    {/* Left Column: Time and Icon */}
                    <div className="flex flex-col items-center justify-between min-w-[70px]">
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-700">{getFullEventTime(event)}</p>
                      </div>
                      <div className="mt-2">
                        {getEventIcon(event.type)}
                      </div>
                    </div>

                    {/* Middle Column: Event Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-medium text-base">{getEventDescription(event)}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{event.teamName || event.team}</p>
                      {characteristics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {characteristics.map((char, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100"
                            >
                              {char}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Edit and Delete Buttons */}
                    <div className="flex flex-col gap-2 min-w-[60px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(event, index)}
                        className="w-full"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent !== null ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent !== null ? 'Modify the event details below' : 'Enter the event details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              {editingEvent !== null ? (
                // Read-only for editing existing events
                <>
                  <Input
                    id="time"
                    value={editForm.time}
                    readOnly
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="e.g., 23:45"
                  />
                  <p className="text-xs text-gray-500">Time cannot be edited for existing events</p>
                </>
              ) : (
                // Editable for adding new events
                <>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1">
                      <Input
                        id="minutes"
                        type="number"
                        min="0"
                        max="90"
                        value={editForm.minutes}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            setEditForm({ ...editForm, minutes: value });
                          }
                        }}
                        placeholder="MM"
                        className="w-20"
                      />
                      <Label className="text-xs text-gray-500 text-center">Minutes</Label>
                    </div>
                    <span className="text-xl font-bold">:</span>
                    <div className="flex flex-col gap-1">
                      <Input
                        id="seconds"
                        type="number"
                        min="0"
                        max="59"
                        value={editForm.seconds}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 59)) {
                            // Pad with leading zero if needed
                            const paddedValue = value.length === 1 && Number(value) < 10 ? value : value;
                            setEditForm({ ...editForm, seconds: paddedValue });
                          }
                        }}
                        onBlur={(e) => {
                          // Pad with leading zero on blur
                          const value = e.target.value;
                          if (value.length === 1) {
                            setEditForm({ ...editForm, seconds: `0${value}` });
                          }
                        }}
                        placeholder="SS"
                        className="w-20"
                      />
                      <Label className="text-xs text-gray-500 text-center">Seconds</Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Enter match time (e.g., 23:45)</p>
                </>
              )}
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                disabled={editingEvent !== null} // Disable when editing existing events
              >
                <SelectTrigger className={editingEvent !== null ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {availableEventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getEventTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingEvent !== null ? (
                <p className="text-xs text-gray-500">Event type cannot be changed for existing events</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Scoring Level: {scoringLevel === 'basic' ? 'Basic' : scoringLevel === 'intermediate-all' ? 'Intermediate (All Events)' : scoringLevel === 'intermediate-detailed' ? 'Intermediate (Detailed)' : 'Advanced'}
                </p>
              )}
            </div>
            
            {/* Goal Type Selection */}
            {editForm.type === 'goal' && (
              <div className="space-y-2">
                <Label htmlFor="goalType">Goal Type</Label>
                <Select
                  value={editForm.goalType || 'Regular Goal'}
                  onValueChange={(value) => {
                    // Update goalType and set ownGoal/isPenalty based on selection
                    setEditForm({ 
                      ...editForm, 
                      goalType: value === 'Regular Goal' ? '' : value,
                      ownGoal: value === 'Own Goal',
                      isPenalty: value === 'Penalty'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {isDetailedScoringEnabled() ? (
                      <>
                        <SelectItem value="Regular Goal">Regular Goal</SelectItem>
                        <SelectItem value="Long shot">Long shot</SelectItem>
                        <SelectItem value="Tap-in">Tap-in</SelectItem>
                        <SelectItem value="Acrobatic">Acrobatic</SelectItem>
                        <SelectItem value="Header">Header</SelectItem>
                        <SelectItem value="Solo Goal">Solo Goal</SelectItem>
                        <SelectItem value="Calm Finish">Calm Finish</SelectItem>
                        <SelectItem value="Penalty">Penalty</SelectItem>
                        <SelectItem value="Own Goal">Own Goal</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Regular Goal">Regular Goal</SelectItem>
                        <SelectItem value="Penalty">Penalty</SelectItem>
                        <SelectItem value="Own Goal">Own Goal</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Select how the goal was scored</p>
              </div>
            )}

            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={editForm.team}
                onValueChange={(value) => setEditForm({ ...editForm, team: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match?.teamA}>{match?.teamA}</SelectItem>
                  <SelectItem value={match?.teamB}>{match?.teamB}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Player (shown for most events except corner) */}
            {editForm.type !== 'corner' && editForm.type !== 'substitution' && editForm.type !== 'substitute' && (
              <div className="space-y-2">
                <Label htmlFor="player">Player</Label>
                <Select
                  value={editForm.player}
                  onValueChange={(value) => setEditForm({ ...editForm, player: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTeamPlayers(editForm.team).map((player: any) => (
                      <SelectItem key={player.name} value={player.name}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Assisted By (for goals) */}
            {(editForm.type === 'goal' || editForm.type === 'penalty_goal') && (
              <div className="space-y-2">
                <Label htmlFor="assistedBy">Assisted By (Optional)</Label>
                <Select
                  value={editForm.assistedBy || 'none'}
                  onValueChange={(value) => setEditForm({ ...editForm, assistedBy: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assist player (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getTeamPlayers(editForm.team).map((player: any) => (
                      <SelectItem key={player.name} value={player.name}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Substitution fields */}
            {(editForm.type === 'substitution' || editForm.type === 'substitute') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="playerOut">Player Out</Label>
                  <Select
                    value={editForm.playerOut}
                    onValueChange={(value) => setEditForm({ ...editForm, playerOut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player out" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTeamPlayers(editForm.team).map((player: any) => (
                        <SelectItem key={player.name} value={player.name}>{player.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerIn">Player In</Label>
                  <Select
                    value={editForm.playerIn}
                    onValueChange={(value) => {
                      if (value === '__add_new_player__') {
                        handleAddPlayerClick();
                      } else {
                        setEditForm({ ...editForm, playerIn: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player in" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const substitutes = getSubstitutes(editForm.team);
                        console.log('🎯 [RENDER] Player IN dropdown rendering with', substitutes.length, 'options:', substitutes.map((p: any) => p.name));
                        return substitutes.map((player: any) => (
                          <SelectItem key={player.name} value={player.name}>{player.name}</SelectItem>
                        ));
                      })()}
                      <SelectItem value="__add_new_player__" className="text-green-600 font-medium">
                        + Add New Player
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Only players not currently on the field are shown (from full squad)</p>
                </div>
              </>
            )}

            {/* Cards (for fouls) */}
            {editForm.type === 'foul' && (
              <div className="space-y-2">
                <Label>Cards</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.yellowCard}
                      onChange={(e) => setEditForm({ ...editForm, yellowCard: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Yellow Card 🟨</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.redCard}
                      onChange={(e) => setEditForm({ ...editForm, redCard: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Red Card 🟥</span>
                  </label>
                </div>
              </div>
            )}

            {/* Shot on Target Outcome - shown right after Player selection */}
            {editForm.type === 'shot_on_target' && (
              <div className="space-y-2">
                <Label htmlFor="shotOnTargetOutcome">Outcome</Label>
                <Select
                  value={editForm.shotOnTargetOutcome || ''}
                  onValueChange={(value) => {
                    setEditForm({ 
                      ...editForm, 
                      shotOnTargetOutcome: value,
                      savedBy: value === 'Blocked' ? editForm.savedBy : '' // Clear savedBy for Saved (will be auto-attributed), keep for Blocked
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saved">Saved (by goalkeeper)</SelectItem>
                    <SelectItem value="Blocked">Blocked (by outfield player)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Shot on target is either saved by the goalkeeper or blocked by a defender</p>
              </div>
            )}

            {/* Blocked By - shown only if Blocked is selected */}
            {editForm.type === 'shot_on_target' && editForm.shotOnTargetOutcome === 'Blocked' && (
              <div className="space-y-2">
                <Label htmlFor="savedBy">Blocked By</Label>
                <Select
                  value={editForm.savedBy}
                  onValueChange={(value) => setEditForm({ ...editForm, savedBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player who blocked the shot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOutfieldPlayers().map((player: any) => (
                      <SelectItem key={player.name} value={player.name}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Which player blocked the shot?</p>
              </div>
            )}
            
            {/* Shot off Target Outcome (for advanced/intermediate-detailed scoring) */}
            {editForm.type === 'shot_off_target' && isDetailedScoringEnabled() && (
              <div className="space-y-2">
                <Label htmlFor="shotOffTargetOutcome">Shot Outcome (Optional)</Label>
                <Select
                  value={editForm.shotOffTargetOutcome || 'none'}
                  onValueChange={(value) => setEditForm({ ...editForm, shotOffTargetOutcome: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Hit Post">Hit Post</SelectItem>
                    <SelectItem value="Over Bar">Over Bar</SelectItem>
                    <SelectItem value="Wide">Wide</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Specify what happened to the shot</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Substitution Confirmation Dialog */}
      <AlertDialog open={substitutionAlertOpen} onOpenChange={setSubstitutionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substitution Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              {substitutionMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubstitution}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubstitution}
              className="bg-green-600 hover:bg-green-700"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Player Dialog */}
      <Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Enter the player details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPlayerForm.name}
                onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Number */}
            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                value={newPlayerForm.number}
                onChange={(e) => setNewPlayerForm({ ...newPlayerForm, number: e.target.value })}
                placeholder="e.g., 10"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={newPlayerForm.position}
                onChange={(e) => setNewPlayerForm({ ...newPlayerForm, position: e.target.value })}
                placeholder="e.g., Forward"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer} className="bg-green-600 hover:bg-green-700">
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditMatchEvents;