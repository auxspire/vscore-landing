// @ts-nocheck
import React, { useState, useRef } from 'react';
import { ArrowLeft, Clock, Target, AlertTriangle, User, RotateCcw, Timer, Users, MapPin, Star, Download, Share2, CircleDot, Footprints, OctagonAlert, ArrowDownUp, FlagTriangleRight, Flag, MoreVertical, Edit, Calculator, FileWarning, Upload, Info, ArrowUp, ArrowDown, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import PlayerMatchPerformance from './PlayerMatchPerformance';
import ShareDialog from './ShareDialog';
import TextShareModal from './TextShareModal';
import html2canvas from 'html2canvas';
import { BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { formatMatchDateLong } from '../utils/dateHelpers';
import { shouldShowSplitTurfCostCta, splitTurfCostCtaMessage, findPlayerPaymentShare, shouldShowPlayerOwesBanner } from '../utils/matchPaymentPrompt';
import { buildPublicMatchUrl } from '../utils/urlRouting';
import { toast } from 'sonner';

/**
 * MatchEventsScreen displays match events in a timeline format
 * This is the audience view - shows match events but no scoring interface
 * Only designated scorers can access the live scoring interface
 */
const MatchEventsScreen = ({ match, onBack, onPlayerClick = () => {}, onTeamClick = () => {}, currentUser = null, onEditMatch = () => {}, onCalculatePayment = () => {}, onTransferOwnership = () => {}, highlightPaymentPrompt = false, onDismissPaymentPrompt = () => {}, playerDatabase = [], onOpenPayments = () => {} }) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerPerformance, setShowPlayerPerformance] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textModalContent, setTextModalContent] = useState({ title: '', content: '' });
  const [isCapturing, setIsCapturing] = useState(false);
  const contentRef = useRef(null);
  
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

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-medium">Match Events</h1>
        </div>
        <p className="text-gray-600">No match selected. Open a match from Live Matches to view events.</p>
      </div>
    );
  }

  const matchData = {
    ...match,
    teamA: match.teamA || match.team1 || 'Team A',
    teamB: match.teamB || match.team2 || 'Team B',
    scoreA: match.scoreA !== undefined ? match.scoreA : 0,
    scoreB: match.scoreB !== undefined ? match.scoreB : 0,
    tournament: match.tournament || 'Friendly Match',
    status: match.status || 'Full Time',
    venue: match.venue || 'Match Venue'
  };

  // Map event types to icons and colors
  const getEventIconAndColor = (eventType) => {
    const eventMap = {
      'goal': { icon: CircleDot, color: 'text-green-600 bg-green-100' },
      'substitution': { icon: ArrowDownUp, color: 'text-purple-600 bg-purple-100' },
      'substitute': { icon: ArrowDownUp, color: 'text-purple-600 bg-purple-100' },
      'foul': { icon: OctagonAlert, color: 'text-yellow-600 bg-yellow-100' },
      'yellow_card': { icon: OctagonAlert, color: 'text-yellow-600 bg-yellow-100' },
      'red_card': { icon: OctagonAlert, color: 'text-red-600 bg-red-100' },
      'shot_on_target': { icon: Target, color: 'text-blue-600 bg-blue-100' },
      'off_target': { icon: Footprints, color: 'text-gray-600 bg-gray-100' },
      'shot_off_target': { icon: Footprints, color: 'text-gray-600 bg-gray-100' },
      'offside': { icon: Flag, color: 'text-orange-600 bg-orange-100' },
      'corner': { icon: FlagTriangleRight, color: 'text-blue-600 bg-blue-100' },
      'interception': { icon: Users, color: 'text-blue-600 bg-blue-100' },
      'save': { icon: Target, color: 'text-green-600 bg-green-100' },
      'kickoff': { icon: Clock, color: 'text-purple-600 bg-purple-100' }
    };
    return eventMap[eventType] || { icon: Clock, color: 'text-gray-600 bg-gray-100' };
  };

  // Calculate match statistics from actual events
  const calculateMatchStats = () => {
    const teamAStats = {
      goals: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      saves: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      corners: 0,
      freeKicks: 0,
      penalties: 0
    };

    const teamBStats = {
      goals: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      saves: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      corners: 0,
      freeKicks: 0,
      penalties: 0
    };

    matchEvents.forEach(event => {
      // Check if it's team 1 (teamA) or team 2 (teamB)
      // event.teamNumber is 1 or 2, event.team is the team name string
      const isTeamA = event.teamNumber === 1 || event.team === matchData.teamA;
      const stats = isTeamA ? teamAStats : teamBStats;
      const opposingStats = isTeamA ? teamBStats : teamAStats;

      switch (event.type) {
        case 'goal':
          stats.goals++;
          stats.shotsOnTarget++; // Goals count as shots on target
          break;
        case 'shot_on_target':
          stats.shotsOnTarget++;
          // If the shot was saved, count it as a save for the opposing team
          if (event.shotOnTargetOutcome === 'Saved' && event.savedBy) {
            opposingStats.saves++;
          }
          break;
        case 'off_target':
        case 'shot_off_target':
          stats.shotsOffTarget++;
          break;
        case 'foul':
          stats.fouls++;
          if (event.yellowCard) stats.yellowCards++;
          if (event.redCard) stats.redCards++;
          break;
        case 'yellow_card':
          stats.yellowCards++;
          break;
        case 'red_card':
          stats.redCards++;
          break;
        case 'corner':
          stats.corners++;
          break;
        case 'free_kick':
          stats.freeKicks++;
          break;
        case 'penalty':
          stats.penalties++;
          break;
      }
    });

    return { teamAStats, teamBStats };
  };

  // Use match events if available - no dummy data
  const matchEvents = match?.events && match.events.length > 0 
    ? match.events.map(event => {
        const { icon, color } = getEventIconAndColor(event.type);
        
        // Extract minute from time string (format: "MM:SS")
        // Display as 1st minute for 0-60 seconds, 2nd minute for 61-120 seconds, etc.
        let minute = 1;
        if (event.time) {
          const [mins, secs] = event.time.split(':').map(Number);
          const totalSeconds = (mins * 60) + secs;
          minute = Math.floor(totalSeconds / 60) + 1;
        }
        
        // Build description based on event type
        let description = '';
        if (event.type === 'goal') {
          description = 'Goal scored';
          if (event.goalType) description += ` (${event.goalType})`;
        } else if (event.type === 'substitution' || event.type === 'substitute') {
          description = 'Tactical substitution';
        } else if (event.type === 'foul') {
          if (event.yellowCard) description = 'Yellow card for foul';
          else if (event.redCard) description = 'Red card for foul';
          else description = 'Foul committed';
        } else if (event.type === 'shot_on_target') {
          description = 'Shot on target';
          if (event.shotOnTargetOutcome) description += ` - ${event.shotOnTargetOutcome}`;
        } else if (event.type === 'off_target') {
          description = 'Shot off target';
          if (event.shotOffTargetOutcome) description += ` - ${event.shotOffTargetOutcome}`;
        } else if (event.type === 'interception') {
          description = 'Interception';
          if (event.interceptionOutcome) description += ` - ${event.interceptionOutcome}`;
        } else {
          description = event.type.replace(/_/g, ' ');
        }
        
        return {
          id: event.id,
          minute: minute,
          time: event.time || `${minute}:00`, // Keep original time in MM:SS format
          type: event.type,
          team: event.teamName,
          teamNumber: event.team,
          player: typeof event.player === 'object' ? event.player?.name : event.player || null,
          assistedBy: typeof event.assist === 'object' ? event.assist?.name : event.assist || event.assistedBy || null,
          assistCharacteristic: event.assistCharacteristic || null,
          playerOut: typeof event.playerOut === 'object' ? event.playerOut?.name : event.playerOut || null,
          playerIn: typeof event.playerIn === 'object' ? event.playerIn?.name : event.playerIn || null,
          description: description,
          icon: icon,
          color: color,
          yellowCard: event.yellowCard,
          redCard: event.redCard,
          shotOnTargetOutcome: event.shotOnTargetOutcome || null,
          savedBy: typeof event.savedBy === 'object' ? event.savedBy?.name : event.savedBy || null,
          blockedBy: typeof event.blockedBy === 'object' ? event.blockedBy?.name : event.blockedBy || null
        };
      }).sort((a, b) => {
        // Convert time strings (MM:SS) to total seconds for accurate comparison
        const getTimeInSeconds = (timeStr) => {
          if (!timeStr) return 0;
          const [mins, secs] = timeStr.split(':').map(Number);
          return (mins * 60) + secs;
        };
        
        const aSeconds = getTimeInSeconds(a.time);
        const bSeconds = getTimeInSeconds(b.time);
        
        // Sort in descending order (latest event first)
        return bSeconds - aSeconds;
      })
    : []; // Return empty array instead of dummy data

  // For result-entry matches, add goals from the entered data
  const processedMatchEvents = [...matchEvents];
  if ((match.type === 'result-entry' || match.isLiveScored === false) && (match.goalsTeam1 || match.goalsTeam2)) {
    // Helper function to get player name by ID
    const getPlayerNameById = (playerId, team) => {
      const players = team === 1 ? match.team1Players : match.team2Players;
      const player = players?.find(p => p.id === playerId);
      return player?.name || 'Unknown Player';
    };

    // Process Team 1 goals
    if (match.goalsTeam1 && match.goalsTeam1.length > 0) {
      match.goalsTeam1.forEach((goal, index) => {
        if (goal.scorer) {
          const scorerName = goal.ownGoal 
            ? getPlayerNameById(goal.scorer, 2) // Own goal by team 2 player
            : getPlayerNameById(goal.scorer, 1);
          const assistName = goal.assist ? getPlayerNameById(goal.assist, 1) : null;

          processedMatchEvents.push({
            id: `result-entry-goal-t1-${index}`,
            minute: 0, // No minute data for result entries
            type: 'goal',
            team: matchData.teamA,
            teamNumber: 1,
            player: scorerName,
            assistedBy: assistName,
            playerOut: null,
            playerIn: null,
            description: goal.ownGoal ? 'Own Goal' : 'Goal scored',
            icon: Target,
            color: 'text-green-600 bg-green-100',
            yellowCard: false,
            redCard: false,
            shotOnTargetOutcome: null,
            savedBy: null,
            blockedBy: null,
            isOwnGoal: goal.ownGoal || false
          });
        }
      });
    }

    // Process Team 2 goals
    if (match.goalsTeam2 && match.goalsTeam2.length > 0) {
      match.goalsTeam2.forEach((goal, index) => {
        if (goal.scorer) {
          const scorerName = goal.ownGoal 
            ? getPlayerNameById(goal.scorer, 1) // Own goal by team 1 player
            : getPlayerNameById(goal.scorer, 2);
          const assistName = goal.assist ? getPlayerNameById(goal.assist, 2) : null;

          processedMatchEvents.push({
            id: `result-entry-goal-t2-${index}`,
            minute: 0, // No minute data for result entries
            type: 'goal',
            team: matchData.teamB,
            teamNumber: 2,
            player: scorerName,
            assistedBy: assistName,
            playerOut: null,
            playerIn: null,
            description: goal.ownGoal ? 'Own Goal' : 'Goal scored',
            icon: Target,
            color: 'text-green-600 bg-green-100',
            yellowCard: false,
            redCard: false,
            shotOnTargetOutcome: null,
            savedBy: null,
            blockedBy: null,
            isOwnGoal: goal.ownGoal || false
          });
        }
      });
    }
  }

  const { teamAStats, teamBStats } = calculateMatchStats();

  // Get formations from match data if available
  const team1Formation = match?.team1Formation || '';
  const team2Formation = match?.team2Formation || '';

  // Use actual squad data if available from match object
  const team1Squad = match?.team1Squad || [];
  const team2Squad = match?.team2Squad || [];

  // Get player ratings from match if available
  const playerRatings = match?.playerRatings || {};
  
  // Helper function to get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 9.0) return 'text-green-600 bg-green-100';
    if (rating >= 8.0) return 'text-green-500 bg-green-50';
    if (rating >= 7.0) return 'text-blue-600 bg-blue-100';
    if (rating >= 6.0) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 5.0) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Team lineups - use actual match squads only, no dummy data
  const teamLineups = {
    [matchData.teamA]: {
      formation: team1Formation,
      players: team1Squad.map(p => ({
        name: p.name,
        position: p.position || 'Unknown',
        number: p.jerseyNumber || p.number || '?'
      }))
    },
    [matchData.teamB]: {
      formation: team2Formation,
      players: team2Squad.map(p => ({
        name: p.name,
        position: p.position || 'Unknown',
        number: p.jerseyNumber || p.number || '?'
      }))
    }
  };

  const handlePlayerNameClick = (playerName, teamName) => {
    // Get the squad for this team
    const squad = teamName === matchData.teamA ? team1Squad : team2Squad;
    
    // Find the full player object from squad
    const fullPlayer = squad.find(p => p.name === playerName);
    
    if (fullPlayer) {
      // Get rating for this player
      const rating = playerRatings[fullPlayer.id] || null;
      
      // Set selected player with full details
      setSelectedPlayer({
        ...fullPlayer,
        team: teamName,
        rating: rating
      });
      setShowPlayerPerformance(true);
    }
  };

  const getEventIcon = (event) => {
    const IconComponent = event.icon;
    return <IconComponent className={`w-5 h-5 ${event.color.split(' ')[0]}`} />;
  };

  const getScoreAtTime = (minute) => {
    let teamAScore = 0;
    let teamBScore = 0;
    
    matchEvents
      .filter(event => {
        // Include regular goals, penalty goals, and own goals
        const isGoalEvent = event.type === 'goal' || event.type === 'penalty_goal' || event.type === 'own_goal';
        // Get event minute - handle both direct minute property and time string
        const eventMinute = event.minute || (typeof event.time === 'string' ? parseInt(event.time.split(':')[0]) : 0);
        return isGoalEvent && eventMinute <= minute;
      })
      .forEach(goal => {
        // For own goals, add score to the opposite team
        if (goal.type === 'own_goal') {
          // Own goal - score goes to opposite team
          if (goal.team === matchData.teamA || goal.teamName === matchData.teamA) {
            teamBScore++; // Own goal by team A gives score to team B
          } else if (goal.team === matchData.teamB || goal.teamName === matchData.teamB) {
            teamAScore++; // Own goal by team B gives score to team A
          }
        } else {
          // Regular goal or penalty goal - score goes to scoring team
          if (goal.team === matchData.teamA || goal.teamName === matchData.teamA) {
            teamAScore++;
          } else if (goal.team === matchData.teamB || goal.teamName === matchData.teamB) {
            teamBScore++;
          }
        }
      });
    
    return `${teamAScore}-${teamBScore}`;
  };

  // Get goal scorers for each team - use processedMatchEvents to include result-entry goals
  const getGoalScorers = (teamName) => {
    return processedMatchEvents
      .filter(event => event.type === 'goal' && event.team === teamName)
      .map(goal => goal.player)
      .filter(player => player !== null);
  };

  const teamAGoalScorers = getGoalScorers(matchData.teamA);
  const teamBGoalScorers = getGoalScorers(matchData.teamB);

  // Get match date using unified helper - formats as "Month Day, Year" (e.g., "March 15, 2024")
  const matchDate = formatMatchDateLong(match);

  // Download screenshot functionality
  const handleDownloadScreenshot = async () => {
    if (contentRef.current) {
      setIsCapturing(true);
      
      // Wait for state to update and re-render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const canvas = await html2canvas(contentRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${matchData.teamA}_vs_${matchData.teamB}_${matchDate}.png`.replace(/\s/g, '_');
        link.click();
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        alert('Screenshot feature is not available in this browser. Please use the text sharing options instead.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  // Generate share text functions
  const generateMatchSummary = () => {
    const summary = `⚽ MATCH SUMMARY\n\n${matchData.teamA} ${matchData.scoreA} - ${matchData.scoreB} ${matchData.teamB}\n\n${matchData.tournament}${match?.tournamentStage ? ' - ' + formatTournamentStage(match.tournamentStage) : ''}\n📅 ${matchDate}\n${matchData.status === 'live' ? '🔴 LIVE' : '⏱️ ' + matchData.time}\n${match?.venue ? '📍 ' + match.venue : ''}\n\n${match?.isPenaltyShootout ? `\n🎯 Penalties: ${match.penaltyShootoutScore.team1} - ${match.penaltyShootoutScore.team2}\n` : ''}Generated by VScor`;
    return summary;
  };

  const generateMatchDetails = () => {
    let details = `⚽ MATCH DETAILS\n\n${matchData.teamA} ${matchData.scoreA} - ${matchData.scoreB} ${matchData.teamB}\n\n`;
    
    details += `📅 ${matchData.tournament}${match?.tournamentStage ? ' - ' + formatTournamentStage(match.tournamentStage) : ''}\n`;
    details += `🗓️ ${matchDate}\n`;
    if (match?.venue) details += `📍 ${match.venue}\n`;
    details += `⏱️ ${matchData.time}\n\n`;

    // Goal scorers
    if (teamAGoalScorers.length > 0 || teamBGoalScorers.length > 0) {
      details += `⚽ GOAL SCORERS\n\n`;
      
      if (teamAGoalScorers.length > 0) {
        details += `${matchData.teamA}:\n`;
        const goalEvents = processedMatchEvents.filter(e => e.type === 'goal' && e.team === matchData.teamA);
        goalEvents.forEach(goal => {
          const minuteDisplay = goal.minute > 0 ? `${goal.minute}'` : 'FT';
          details += `  ${minuteDisplay} ${goal.player}${goal.assistedBy ? ' (assist: ' + goal.assistedBy + ')' : ''}${goal.isOwnGoal ? ' (OG)' : ''}\n`;
        });
        details += `\n`;
      }
      
      if (teamBGoalScorers.length > 0) {
        details += `${matchData.teamB}:\n`;
        const goalEvents = processedMatchEvents.filter(e => e.type === 'goal' && e.team === matchData.teamB);
        goalEvents.forEach(goal => {
          const minuteDisplay = goal.minute > 0 ? `${goal.minute}'` : 'FT';
          details += `  ${minuteDisplay} ${goal.player}${goal.assistedBy ? ' (assist: ' + goal.assistedBy + ')' : ''}${goal.isOwnGoal ? ' (OG)' : ''}\n`;
        });
        details += `\n`;
      }
    }

    // Stats - only for live-scored matches
    const isResultEntry = match.type === 'result-entry' || match.isLiveScored === false;
    if (!isResultEntry) {
      details += `📊 STATISTICS\n\n`;
      details += `Goals: ${teamAStats.goals} - ${teamBStats.goals}\n`;
      details += `Shots on Target: ${teamAStats.shotsOnTarget} - ${teamBStats.shotsOnTarget}\n`;
      details += `Shots off Target: ${teamAStats.shotsOffTarget} - ${teamBStats.shotsOffTarget}\n`;
      details += `Fouls: ${teamAStats.fouls} - ${teamBStats.fouls}\n`;
      details += `Yellow Cards: ${teamAStats.yellowCards} - ${teamBStats.yellowCards}\n`;
      if (teamAStats.redCards > 0 || teamBStats.redCards > 0) {
        details += `Red Cards: ${teamAStats.redCards} - ${teamBStats.redCards}\n`;
      }
      details += `\n`;
    }

    // Lineups
    if (team1Squad.length > 0 || team2Squad.length > 0) {
      details += `👥 LINEUPS\n\n`;
      
      if (team1Squad.length > 0) {
        details += `${matchData.teamA}${team1Formation ? ' (' + team1Formation + ')' : ''}:\n`;
        team1Squad.forEach(p => {
          const rating = playerRatings[p.id];
          details += `  ${p.jerseyNumber || p.number} - ${p.name} (${p.position})${rating ? ' ⭐' + rating.rating.toFixed(1) : ''}\n`;
        });
        details += `\n`;
      }
      
      if (team2Squad.length > 0) {
        details += `${matchData.teamB}${team2Formation ? ' (' + team2Formation + ')' : ''}:\n`;
        team2Squad.forEach(p => {
          const rating = playerRatings[p.id];
          details += `  ${p.jerseyNumber || p.number} - ${p.name} (${p.position})${rating ? ' ⭐' + rating.rating.toFixed(1) : ''}\n`;
        });
      }
    }

    details += `\nGenerated by VScor`;
    return details;
  };

  const generateFullEventHistory = () => {
    let history = `⚽ FULL EVENT HISTORY\n\n${matchData.teamA} ${matchData.scoreA} - ${matchData.scoreB} ${matchData.teamB}\n`;
    history += `${matchData.tournament} - ${matchDate}\n\n`;

    if (processedMatchEvents.length === 0) {
      history += `No events recorded for this match.\n`;
    } else {
      history += `📋 TIMELINE\n\n`;
      processedMatchEvents.forEach(event => {
        const minuteDisplay = event.minute > 0 ? `${event.minute}'` : 'FT';
        let eventText = `${minuteDisplay} `;
        
        switch (event.type) {
          case 'goal':
            eventText += `⚽ GOAL - ${event.team} - ${event.player}`;
            if (event.assistedBy) {
              eventText += ` (assist: ${event.assistedBy}`;
              if (event.assistCharacteristic && event.assistCharacteristic !== 'Normal') {
                eventText += ` - ${event.assistCharacteristic}`;
              }
              eventText += `)`;
            }
            if (event.isOwnGoal) eventText += ` (OG)`;
            if (event.minute > 0) eventText += ` [${getScoreAtTime(event.minute)}]`;
            break;
          case 'substitution':
          case 'substitute':
            eventText += `🔄 SUB - ${event.team} - ${event.playerOut} ➡️ ${event.playerIn}`;
            break;
          case 'foul':
            eventText += `⚠️ FOUL - ${event.team} - ${event.player}`;
            if (event.yellowCard) eventText += ` 🟨`;
            if (event.redCard) eventText += ` 🟥`;
            break;
          case 'shot_on_target':
            eventText += `🎯 SHOT ON TARGET - ${event.team} - ${event.player}`;
            if (event.savedBy) eventText += ` (saved by ${event.savedBy})`;
            break;
          case 'off_target':
          case 'shot_off_target':
            eventText += `📤 SHOT OFF TARGET - ${event.team} - ${event.player}`;
            break;
          default:
            eventText += `${event.description} - ${event.team}`;
            if (event.player) eventText += ` - ${event.player}`;
        }
        
        history += `${eventText}\n`;
      });
    }

    if (match?.isPenaltyShootout && match?.penaltyEvents?.length > 0) {
      history += `\n🎯 PENALTY SHOOTOUT\n\n`;
      match.penaltyEvents.forEach((penalty, idx) => {
        history += `${idx + 1}. ${penalty.kicker.name} (${penalty.team === 1 ? matchData.teamA : matchData.teamB}) - ${penalty.outcome}\n`;
      });
      history += `\nFinal Score: ${match.penaltyShootoutScore.team1} - ${match.penaltyShootoutScore.team2}\n`;
    }

    history += `\nGenerated by VScor`;
    return history;
  };

  // Share functions
  const handleShareScreenshot = async () => {
    // For screenshot, just download it since html2canvas has issues with oklch colors
    await handleDownloadScreenshot();
  };

  const handleShareSummary = () => {
    const summary = generateMatchSummary();
    setTextModalContent({
      title: `${matchData.teamA} vs ${matchData.teamB} - Match Summary`,
      content: summary
    });
    setShowTextModal(true);
  };

  const handleShareDetails = () => {
    const details = generateMatchDetails();
    setTextModalContent({
      title: `${matchData.teamA} vs ${matchData.teamB} - Match Details`,
      content: details
    });
    setShowTextModal(true);
  };

  const handleShareFullHistory = () => {
    const history = generateFullEventHistory();
    setTextModalContent({
      title: `${matchData.teamA} vs ${matchData.teamB} - Full Event History`,
      content: history
    });
    setShowTextModal(true);
  };

  // Menu action handlers
  const handleEditMatch = () => {
    onEditMatch();
  };

  const handleCalculatePayment = () => {
    onCalculatePayment();
  };

  const handleTransferOwnership = () => {
    onTransferOwnership();
  };

  const handleReportIssue = () => {
    // TODO: Open report issue dialog
    alert('Report issue functionality will be implemented');
  };

  const handleUploadMedia = () => {
    // TODO: Open file upload dialog
    alert('Upload photo/video functionality will be implemented');
  };

  const handleTournamentInfo = () => {
    // TODO: Navigate to tournament info screen
    alert(`Tournament: ${matchData.tournament}\nMore details coming soon`);
  };

  // Check if current user is the match owner.
  // NEW: Uses ownedBy field for ownership check
  // LEGACY: Falls back to scoredBy for backward compatibility
  // Also treats legacy matches where neither field was set as editable by any logged-in user
  const currentUid = currentUser?.user_id ?? currentUser?.id ?? null;
  const isMatchOwner =
    currentUid != null &&
    (String(match?.ownedBy) === String(currentUid) || 
     (!match?.ownedBy && (!match?.scoredBy || String(match.scoredBy) === String(currentUid))));
  const isTournamentMatch = match?.tournamentId || (matchData.tournament && matchData.tournament !== 'Friendly Match');
  const showSplitTurfCta = shouldShowSplitTurfCostCta(match, { isOwner: isMatchOwner });
  const linkedPlayer = playerDatabase.find(
    (p) => p.owner_user_id === currentUser?.user_id,
  );
  const linkedPlayerRef = linkedPlayer
    ? { playerId: linkedPlayer.id, playerName: linkedPlayer.name }
    : null;
  const playerShare = findPlayerPaymentShare(match, linkedPlayerRef);
  const showPlayerOwes = shouldShowPlayerOwesBanner(match, {
    isOwner: isMatchOwner,
    linkedPlayer: linkedPlayerRef,
  });

  return (
    <>
    <div ref={contentRef} className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-gray-900 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">Match Events</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowShareDialog(true)}
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          
          {/* 3-dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-2"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isMatchOwner && (
                <>
                  {!match?.isResultEntry && (
                    <DropdownMenuItem onClick={handleEditMatch}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Match Events
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCalculatePayment}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Split turf cost
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTransferOwnership}>
                    <UserCog className="w-4 h-4 mr-2" />
                    Transfer Ownership
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleReportIssue}>
                <FileWarning className="w-4 h-4 mr-2" />
                Report an Issue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUploadMedia}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo/Video
              </DropdownMenuItem>
              {isTournamentMatch && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleTournamentInfo}>
                    <Info className="w-4 h-4 mr-2" />
                    Tournament Info
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Match Header */}
      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-6">
        {/* Date and Tournament */}
        <div className="text-center mb-4 space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{matchDate}</p>
          {matchData.tournament && (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{matchData.tournament}</p>
              {match?.tournamentStage && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{formatTournamentStage(match.tournamentStage)}</p>
              )}
            </div>
          )}
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => onTeamClick({ id: 1, name: matchData.teamA, matches: 28, wins: 18, goals: 58 })}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity flex-1"
          >
            <div className="w-16 h-16 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-purple-600 dark:text-purple-200">
                {matchData.teamA.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </span>
            </div>
            <p className="font-medium text-center text-gray-900 dark:text-white">{matchData.teamA}</p>
          </button>

          <div className="text-center px-6">
            <div className="text-4xl font-medium mb-2 text-gray-900 dark:text-white">
              {matchData.scoreA} - {matchData.scoreB}
            </div>
            {match?.isPenaltyShootout && match?.penaltyShootoutScore && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Penalties: {match.penaltyShootoutScore.team1} - {match.penaltyShootoutScore.team2}
              </div>
            )}
            <Badge className={matchData.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}>
              {matchData.time}
            </Badge>
            {match?.isExtraTime && (
              <div className="mt-1">
                <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">Extra Time</Badge>
              </div>
            )}
          </div>

          <button 
            onClick={() => onTeamClick({ id: 2, name: matchData.teamB, matches: 28, wins: 15, goals: 52 })}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity flex-1"
          >
            <div className="w-16 h-16 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-purple-600 dark:text-purple-200">
                {matchData.teamB.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </span>
            </div>
            <p className="font-medium text-center text-gray-900 dark:text-white">{matchData.teamB}</p>
          </button>
        </div>

        {/* Goal Scorers */}
        <div className="flex justify-between gap-4 text-sm">
          <div className="flex-1">
            {teamAGoalScorers.length > 0 && (
              <div className="text-left">
                <p className="text-gray-600 mb-1">Goals:</p>
                {teamAGoalScorers.map((scorer, index) => (
                  <button
                    key={index}
                    onClick={() => handlePlayerNameClick(scorer, matchData.teamA)}
                    className="block text-purple-600 hover:text-purple-800 hover:underline"
                  >
                    ⚽ {scorer}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            {teamBGoalScorers.length > 0 && (
              <div className="text-right">
                <p className="text-gray-600 mb-1">Goals:</p>
                {teamBGoalScorers.map((scorer, index) => (
                  <button
                    key={index}
                    onClick={() => handlePlayerNameClick(scorer, matchData.teamB)}
                    className="block text-purple-600 hover:text-purple-800 hover:underline"
                  >
                    {scorer} ⚽
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSplitTurfCta && (
        <div
          className={`rounded-2xl p-5 border-2 ${
            highlightPaymentPrompt
              ? 'bg-green-50 border-green-400 dark:bg-green-950/30 dark:border-green-600'
              : 'bg-white border-purple-200 dark:bg-gray-800 dark:border-purple-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100">Split turf cost?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {splitTurfCostCtaMessage(highlightPaymentPrompt)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  onClick={onCalculatePayment}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Split turf cost
                </Button>
                <Button
                  onClick={onDismissPaymentPrompt}
                  variant="outline"
                  size="sm"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlayerOwes && playerShare && (
        <div className="rounded-2xl p-5 border-2 bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {playerShare.isPaid ? 'Turf share marked paid' : 'Your turf share'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {playerShare.isPaid
                  ? `You paid ₹${playerShare.amount} for this match.`
                  : `You owe ₹${playerShare.amount} for turf rent on this match.`}
              </p>
              {!playerShare.isPaid && (
                <Button
                  onClick={onOpenPayments}
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  Who owes what
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {match?.paymentData && isMatchOwner && !showPlayerOwes && (
        <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3 text-sm text-purple-800 dark:text-purple-200">
          Turf payment split saved for this match. Open the menu to edit or share owes list.
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="lineups">Lineups</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Penalty Shootout Events - Show at top if exists */}
          {match?.isPenaltyShootout && match?.penaltyEvents && match.penaltyEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚽ Penalty Shootout
                  {match.penaltyShootoutScore && (
                    <span className="text-sm font-normal text-gray-600">
                      ({match.penaltyShootoutScore.team1} - {match.penaltyShootoutScore.team2})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {match.penaltyEvents.map((penalty, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          penalty.outcome === 'Goal' ? 'bg-green-100 text-green-600' :
                          penalty.outcome === 'Save' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {penalty.outcome === 'Goal' ? '⚽' :
                           penalty.outcome === 'Save' ? '🧤' :
                           '❌'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{penalty.kicker?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{penalty.team === 1 ? matchData.teamA : matchData.teamB}</p>
                        </div>
                      </div>
                      <Badge className={
                        penalty.outcome === 'Goal' ? 'bg-green-100 text-green-800' :
                        penalty.outcome === 'Save' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }>
                        {penalty.outcome}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Events Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Match Events Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {processedMatchEvents.length > 0 ? (
                <div className="space-y-4">
                  {processedMatchEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {index < processedMatchEvents.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
                      )}
                      
                      {/* Event icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${event.color}`}>
                        {getEventIcon(event)}
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.minute > 0 ? (
                            <span className="font-medium text-lg">{event.time}</span>
                          ) : (
                            <span className="font-medium text-lg text-gray-500">FT</span>
                          )}
                          {event.team && (
                            <Badge variant="outline" className="text-xs">
                              {event.team}
                            </Badge>
                          )}
                          {event.type === 'goal' && event.minute > 0 && (
                            <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                              {getScoreAtTime(event.minute)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {event.player && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handlePlayerNameClick(event.player, event.team)}
                                className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                              >
                                {event.player}
                              </button>
                              {event.yellowCard && <span>🟨</span>}
                              {event.redCard && <span>🟥</span>}
                              {event.isOwnGoal && (
                                <Badge className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                  OG
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {event.assistedBy && (
                            <p className="text-sm text-gray-600">
                              Assisted by{' '}
                              <button 
                                onClick={() => handlePlayerNameClick(event.assistedBy, event.team)}
                                className="text-purple-600 hover:text-purple-800 hover:underline"
                              >
                                {event.assistedBy}
                              </button>
                              {event.assistCharacteristic && event.assistCharacteristic !== 'Normal' && (
                                <span className="ml-1 text-gray-500">({event.assistCharacteristic})</span>
                              )}
                            </p>
                          )}
                          
                          {event.playerOut && event.playerIn && (
                            <div className="text-sm text-gray-600">
                              <button 
                                onClick={() => handlePlayerNameClick(event.playerOut, event.team)}
                                className="text-red-600 hover:text-red-800 hover:underline"
                              >
                                {event.playerOut}
                              </button>
                              {' → '}
                              <button 
                                onClick={() => handlePlayerNameClick(event.playerIn, event.team)}
                                className="text-green-600 hover:text-green-800 hover:underline"
                              >
                                {event.playerIn}
                              </button>
                            </div>
                          )}
                          
                          {event.savedBy && (
                            <p className="text-sm text-gray-600">
                              Saved by {event.savedBy}
                            </p>
                          )}
                          
                          {event.blockedBy && (
                            <p className="text-sm text-gray-600">
                              Blocked by {event.blockedBy}
                            </p>
                          )}
                          
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No events recorded yet</p>
                  <p className="text-sm text-gray-400 mt-1">Events will appear here as the match progresses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Check if match was live scored or result entry */}
          {match.type === 'result-entry' || match.isLiveScored === false ? (
            <Card>
              <CardHeader>
                <CardTitle>Match Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Stats Available</h3>
                  <p className="text-gray-600">Only result entered</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This match was not scored live, so detailed statistics are not available
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Match Statistics - Professional Comparative View */}
              <Card>
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Goals */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.goals}</span>
                        <span className="text-sm text-gray-600">Goals</span>
                        <span className="font-medium">{teamBStats.goals}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-purple-600 rounded-l" 
                          style={{ width: `${teamAStats.goals + teamBStats.goals > 0 ? (teamAStats.goals / (teamAStats.goals + teamBStats.goals)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-purple-300 rounded-r" 
                          style={{ width: `${teamAStats.goals + teamBStats.goals > 0 ? (teamBStats.goals / (teamAStats.goals + teamBStats.goals)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Shots on Target */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.shotsOnTarget}</span>
                        <span className="text-sm text-gray-600">Shots on Target</span>
                        <span className="font-medium">{teamBStats.shotsOnTarget}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-blue-600 rounded-l" 
                          style={{ width: `${teamAStats.shotsOnTarget + teamBStats.shotsOnTarget > 0 ? (teamAStats.shotsOnTarget / (teamAStats.shotsOnTarget + teamBStats.shotsOnTarget)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-blue-300 rounded-r" 
                          style={{ width: `${teamAStats.shotsOnTarget + teamBStats.shotsOnTarget > 0 ? (teamBStats.shotsOnTarget / (teamAStats.shotsOnTarget + teamBStats.shotsOnTarget)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Shots off Target */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.shotsOffTarget}</span>
                        <span className="text-sm text-gray-600">Shots off Target</span>
                        <span className="font-medium">{teamBStats.shotsOffTarget}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-gray-600 rounded-l" 
                          style={{ width: `${teamAStats.shotsOffTarget + teamBStats.shotsOffTarget > 0 ? (teamAStats.shotsOffTarget / (teamAStats.shotsOffTarget + teamBStats.shotsOffTarget)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-gray-300 rounded-r" 
                          style={{ width: `${teamAStats.shotsOffTarget + teamBStats.shotsOffTarget > 0 ? (teamBStats.shotsOffTarget / (teamAStats.shotsOffTarget + teamBStats.shotsOffTarget)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Saves */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.saves}</span>
                        <span className="text-sm text-gray-600">Saves</span>
                        <span className="font-medium">{teamBStats.saves}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-green-600 rounded-l" 
                          style={{ width: `${teamAStats.saves + teamBStats.saves > 0 ? (teamAStats.saves / (teamAStats.saves + teamBStats.saves)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-green-300 rounded-r" 
                          style={{ width: `${teamAStats.saves + teamBStats.saves > 0 ? (teamBStats.saves / (teamAStats.saves + teamBStats.saves)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fouls */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.fouls}</span>
                        <span className="text-sm text-gray-600">Fouls</span>
                        <span className="font-medium">{teamBStats.fouls}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-yellow-600 rounded-l" 
                          style={{ width: `${teamAStats.fouls + teamBStats.fouls > 0 ? (teamAStats.fouls / (teamAStats.fouls + teamBStats.fouls)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-yellow-300 rounded-r" 
                          style={{ width: `${teamAStats.fouls + teamBStats.fouls > 0 ? (teamBStats.fouls / (teamAStats.fouls + teamBStats.fouls)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Yellow Cards */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.yellowCards}</span>
                        <span className="text-sm text-gray-600">Yellow Cards</span>
                        <span className="font-medium">{teamBStats.yellowCards}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-yellow-500 rounded-l" 
                          style={{ width: `${teamAStats.yellowCards + teamBStats.yellowCards > 0 ? (teamAStats.yellowCards / (teamAStats.yellowCards + teamBStats.yellowCards)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-yellow-200 rounded-r" 
                          style={{ width: `${teamAStats.yellowCards + teamBStats.yellowCards > 0 ? (teamBStats.yellowCards / (teamAStats.yellowCards + teamBStats.yellowCards)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Red Cards */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.redCards}</span>
                        <span className="text-sm text-gray-600">Red Cards</span>
                        <span className="font-medium">{teamBStats.redCards}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-red-600 rounded-l" 
                          style={{ width: `${teamAStats.redCards + teamBStats.redCards > 0 ? (teamAStats.redCards / (teamAStats.redCards + teamBStats.redCards)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-red-300 rounded-r" 
                          style={{ width: `${teamAStats.redCards + teamBStats.redCards > 0 ? (teamBStats.redCards / (teamAStats.redCards + teamBStats.redCards)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Corners */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{teamAStats.corners}</span>
                        <span className="text-sm text-gray-600">Corners</span>
                        <span className="font-medium">{teamBStats.corners}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-indigo-600 rounded-l" 
                          style={{ width: `${teamAStats.corners + teamBStats.corners > 0 ? (teamAStats.corners / (teamAStats.corners + teamBStats.corners)) * 100 : 50}%` }}
                        ></div>
                        <div 
                          className="bg-indigo-300 rounded-r" 
                          style={{ width: `${teamAStats.corners + teamBStats.corners > 0 ? (teamBStats.corners / (teamAStats.corners + teamBStats.corners)) * 100 : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Free Kicks */}
                    {(teamAStats.freeKicks > 0 || teamBStats.freeKicks > 0) && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{teamAStats.freeKicks}</span>
                          <span className="text-sm text-gray-600">Free Kicks</span>
                          <span className="font-medium">{teamBStats.freeKicks}</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div 
                            className="bg-orange-600 rounded-l" 
                            style={{ width: `${teamAStats.freeKicks + teamBStats.freeKicks > 0 ? (teamAStats.freeKicks / (teamAStats.freeKicks + teamBStats.freeKicks)) * 100 : 50}%` }}
                          ></div>
                          <div 
                            className="bg-orange-300 rounded-r" 
                            style={{ width: `${teamAStats.freeKicks + teamBStats.freeKicks > 0 ? (teamBStats.freeKicks / (teamAStats.freeKicks + teamBStats.freeKicks)) * 100 : 50}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Penalties */}
                    {(teamAStats.penalties > 0 || teamBStats.penalties > 0) && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{teamAStats.penalties}</span>
                          <span className="text-sm text-gray-600">Penalties</span>
                          <span className="font-medium">{teamBStats.penalties}</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div 
                            className="bg-pink-600 rounded-l" 
                            style={{ width: `${teamAStats.penalties + teamBStats.penalties > 0 ? (teamAStats.penalties / (teamAStats.penalties + teamBStats.penalties)) * 100 : 50}%` }}
                          ></div>
                          <div 
                            className="bg-pink-300 rounded-r" 
                            style={{ width: `${teamAStats.penalties + teamBStats.penalties > 0 ? (teamBStats.penalties / (teamAStats.penalties + teamBStats.penalties)) * 100 : 50}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="lineups" className="space-y-4">
          {/* Team Lineups */}
          {team1Squad.length > 0 || team2Squad.length > 0 || (match.type === 'result-entry' && (match.team1Players?.length > 0 || match.team2Players?.length > 0)) ? (
            <>
              {/* For result-entry matches, use the entered player data */}
              {match.type === 'result-entry' || match.isLiveScored === false ? (
                <>
                  {/* Team 1 Lineup */}
                  {match.team1Players && match.team1Players.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{matchData.teamA}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Starting Lineup */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Starting Lineup
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {match.team1Players
                              .filter(p => !p.isSubstitute)
                              .map((player) => (
                                <button
                                  key={player.id}
                                  onClick={() => handlePlayerNameClick(player.name, matchData.teamA)}
                                  className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-purple-600">{player.jerseyNumber || '?'}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{player.name}</p>
                                    <p className="text-xs text-gray-600">{player.position || 'Player'}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                        
                        {/* Substitutes — team 1 result-entry */}
                        {match.team1Players.some(p => p.isSubstitute) && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <ArrowDownUp className="w-4 h-4" />
                              Substitutes
                            </h3>
                            <div className="space-y-1.5">
                              {match.team1Players
                                .filter(p => p.isSubstitute)
                                .map((player) => (
                                  <button
                                    key={player.id}
                                    onClick={() => handlePlayerNameClick(player.name, matchData.teamA)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-left border border-gray-100"
                                  >
                                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-semibold text-green-700">{player.jerseyNumber || '?'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 leading-tight">
                                        <ArrowUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                        <span className="font-semibold text-sm text-gray-900 truncate">{player.name}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5">{player.position || 'Player'}</p>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Team 2 Lineup */}
                  {match.team2Players && match.team2Players.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{matchData.teamB}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Starting Lineup */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Starting Lineup
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {match.team2Players
                              .filter(p => !p.isSubstitute)
                              .map((player) => (
                                <button
                                  key={player.id}
                                  onClick={() => handlePlayerNameClick(player.name, matchData.teamB)}
                                  className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-purple-600">{player.jerseyNumber || '?'}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{player.name}</p>
                                    <p className="text-xs text-gray-600">{player.position || 'Player'}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                        
                        {/* Substitutes — team 2 result-entry */}
                        {match.team2Players.some(p => p.isSubstitute) && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <ArrowDownUp className="w-4 h-4" />
                              Substitutes
                            </h3>
                            <div className="space-y-1.5">
                              {match.team2Players
                                .filter(p => p.isSubstitute)
                                .map((player) => (
                                  <button
                                    key={player.id}
                                    onClick={() => handlePlayerNameClick(player.name, matchData.teamB)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-left border border-gray-100"
                                  >
                                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-semibold text-green-700">{player.jerseyNumber || '?'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 leading-tight">
                                        <ArrowUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                        <span className="font-semibold text-sm text-gray-900 truncate">{player.name}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5">{player.position || 'Player'}</p>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                /* Live-scored match lineups */
                Object.entries(teamLineups).map(([teamName, lineup]) => {
              // Get squad for this team to look up player IDs / jersey numbers
              const squad = teamName === matchData.teamA ? team1Squad : team2Squad;

              // ── Build substitution maps with minute data ─────────────────────
              const teamSubEvents = matchEvents.filter(
                ev => (ev.type === 'substitution' || ev.type === 'substitute') && ev.team === teamName
              );

              // subOutMap: playerOut name → { minute, playerIn name }
              const subOutMap: Record<string, { minute: number; playerIn: string | null }> = {};
              // subInMap:  playerIn  name → { minute, playerOut name, number, position }
              const subInMap: Record<string, { minute: number; playerOut: string | null; number: string; position: string }> = {};

              teamSubEvents.forEach(ev => {
                const min: number = ev.minute ?? 0;
                const out: string | null = ev.playerOut ?? null;
                const inn: string | null = ev.playerIn ?? null;
                if (out) subOutMap[out] = { minute: min, playerIn: inn };
                if (inn) {
                  const sqp = squad.find(p => p.name === inn);
                  subInMap[inn] = {
                    minute: min,
                    playerOut: out,
                    number: sqp?.jerseyNumber ?? sqp?.number ?? '?',
                    position: sqp?.position ?? 'Player',
                  };
                }
              });

              const subInNames = Object.keys(subInMap);

              // Starting lineup = every squad player who did NOT come on as a sub
              const startingLineup = lineup.players.filter(p => !subInNames.includes(p.name));

              if (lineup.players.length === 0) return null;

              return (
                <Card key={teamName}>
                  <CardHeader>
                    <CardTitle>
                      {teamName}
                      {lineup.formation && ` (${lineup.formation})`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* ── Starting Lineup ── */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Starting Lineup
                      </h3>
                      <div className="grid grid-cols-2 gap-1">
                        {startingLineup.map((player, idx) => {
                          const fullPlayer = squad.find(p => p.name === player.name);
                          const rating = fullPlayer && playerRatings[fullPlayer.id];
                          const subOutInfo = subOutMap[player.name];

                          return (
                            <button
                              key={`starting-${fullPlayer?.id || player.name}-${idx}`}
                              onClick={() => handlePlayerNameClick(player.name, teamName)}
                              className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded-lg transition-colors text-left"
                            >
                              {/* Jersey number bubble */}
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-purple-600">{player.number}</span>
                              </div>

                              {/* Name + position + sub-off badge */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate leading-tight">{player.name}</p>
                                <p className="text-xs text-gray-400 leading-tight">{player.position}</p>
                                {subOutInfo && (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-semibold mt-0.5">
                                    <ArrowDown className="w-3 h-3" />
                                    {subOutInfo.minute > 0 ? `${subOutInfo.minute}'` : 'HT'}
                                  </span>
                                )}
                              </div>

                              {/* Rating */}
                              {rating && (
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getRatingColor(rating.rating)}`}>
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {rating.rating.toFixed(1)}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Substitutes (players who came ON) ── */}
                    {subInNames.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <ArrowDownUp className="w-4 h-4" />
                          Substitutes
                        </h3>
                        <div className="space-y-1.5">
                          {subInNames.map((playerInName, idx) => {
                            const info = subInMap[playerInName];
                            const fullPlayer = squad.find(p => p.name === playerInName);
                            const rating = fullPlayer && playerRatings[fullPlayer.id];
                            const minuteLabel = info.minute > 0 ? `${info.minute}'` : 'HT';

                            return (
                              <button
                                key={`sub-in-${playerInName}-${idx}`}
                                onClick={() => handlePlayerNameClick(playerInName, teamName)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-left border border-gray-100"
                              >
                                {/* Jersey bubble — green for sub */}
                                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-green-700">{info.number}</span>
                                </div>

                                {/* Sub detail */}
                                <div className="flex-1 min-w-0">
                                  {/* Player coming IN ↑ */}
                                  <div className="flex items-center gap-1 leading-tight">
                                    <ArrowUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    <span className="font-semibold text-sm text-gray-900 truncate">{playerInName}</span>
                                    <span className="ml-auto text-xs font-bold text-green-600 flex-shrink-0 pl-1">{minuteLabel}</span>
                                  </div>
                                  {/* Player going OUT ↓ */}
                                  {info.playerOut && (
                                    <div className="flex items-center gap-1 mt-0.5 leading-tight">
                                      <ArrowDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                      <span className="text-xs text-gray-500 truncate">{info.playerOut}</span>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-400 mt-0.5">{info.position}</p>
                                </div>

                                {/* Rating badge */}
                                {rating && (
                                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getRatingColor(rating.rating)}`}>
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {rating.rating.toFixed(1)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No lineup information available</p>
                  <p className="text-sm text-gray-400 mt-1">Squad data was not recorded for this match</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Player Performance */}
      {showPlayerPerformance && selectedPlayer && (
        <PlayerMatchPerformance
          player={selectedPlayer}
          match={match}
          onClose={() => setShowPlayerPerformance(false)}
          onPlayerProfileClick={() => {
            // Close the performance dialog, then open the full player profile
            setShowPlayerPerformance(false);
            onPlayerClick(selectedPlayer);
          }}
        />
      )}

    </div>

      {/* Share Dialog - Outside main container for proper z-index */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onShareScreenshot={handleShareScreenshot}
        onShareSummary={handleShareSummary}
        onShareDetails={handleShareDetails}
        onShareFullHistory={handleShareFullHistory}
        onCopyLiveLink={() => {
          if (!match?.id) return;
          const url = buildPublicMatchUrl(match.id);
          navigator.clipboard?.writeText(url).then(() => {
            toast.success('Live link copied');
          }).catch(() => toast.error('Could not copy link'));
        }}
        isResultEntry={match.type === 'result-entry' || match.isLiveScored === false}
      />

      {/* Text Share Modal - Outside main container for proper z-index */}
      <TextShareModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        title={textModalContent.title}
        content={textModalContent.content}
      />
    </>
  );
};

export default MatchEventsScreen;