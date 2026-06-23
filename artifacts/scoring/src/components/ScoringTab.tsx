import React from 'react';
import { Plus, Star, Users, User, Play, FileEdit, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const ScoringTab = ({ 
  ongoingMatches = [], 
  completedMatches = [], 
  onNewMatch, 
  onAddTeam, 
  onAddPlayer, 
  onAddTournament, 
  onMatchClick, 
  onEnterMatchResult,
  onRefresh = () => {},
  isRefreshing = false,
  currentUser = null
}) => {
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
  
  // Helper function to check if current user can score a match
  const canUserScoreMatch = (match) => {
    if (!currentUser || !match) return false;
    
    const userId = currentUser.user_id;
    
    // Check if user is the primary scorer
    if (match.primaryScorer?.user_id === userId) return true;
    
    // Check if user is the secondary scorer
    if (match.secondaryScorer?.user_id === userId) return true;
    
    // Check if user is assigned to score a specific team
    if (match.teamScorerMapping) {
      if (match.teamScorerMapping.team1 === userId.toString()) return true;
      if (match.teamScorerMapping.team2 === userId.toString()) return true;
    }
    
    return false;
  };
  
  // Deduplicate matches within each array, then exclude ongoing matches from completed matches
  const deduplicateById = (matches) => {
    const seen = new Set();
    return matches.filter(match => {
      const id = String(match.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };
  
  const uniqueOngoingMatches = deduplicateById(ongoingMatches);
  const ongoingMatchIds = new Set(uniqueOngoingMatches.map(m => String(m.id)));
  const uniqueCompletedMatches = deduplicateById(completedMatches).filter(
    match => !ongoingMatchIds.has(String(match.id))
  );
  
  // Filter ongoing matches to only show those the current user can score
  const scorableOngoingMatches = uniqueOngoingMatches.filter(match => canUserScoreMatch(match));
  
  const quickActions = [
    {
      title: 'New Match',
      icon: Plus,
      action: onNewMatch,
      bgColor: 'bg-purple-200'
    },
    {
      title: 'Add Tournament',
      icon: Star,
      action: onAddTournament,
      bgColor: 'bg-purple-200'
    },
    {
      title: 'Add Team',
      icon: Users,
      action: onAddTeam,
      bgColor: 'bg-purple-200'
    },
    {
      title: 'Add Player',
      icon: User,
      action: onAddPlayer,
      bgColor: 'bg-purple-200'
    }
  ];

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2 dark:text-gray-100">Scoring</h1>
          <p className="text-purple-600 dark:text-purple-400 text-lg">Quick Actions</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-full"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={action.action}
            className="bg-purple-100 dark:bg-purple-900/20 rounded-2xl p-6 cursor-pointer hover:bg-purple-150 dark:hover:bg-purple-900/30 transition-colors border border-transparent dark:border-purple-800/50"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 ${action.bgColor} dark:bg-purple-800/50 rounded-full flex items-center justify-center`}>
                <action.icon className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
              <p className="font-medium text-purple-900 dark:text-gray-100">{action.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ongoing Matches Section */}
      {scorableOngoingMatches.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium dark:text-gray-100">Ongoing Match</h2>
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              LIVE
            </div>
          </div>

          <div className="space-y-3">
            {scorableOngoingMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => onMatchClick(match)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-2xl p-5 cursor-pointer hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm opacity-90">{match.tournament || 'Local Tournament'}</div>
                    {match.tournamentStage && (
                      <div className="text-xs opacity-75">{formatTournamentStage(match.tournamentStage)}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{match.currentTime || '0:00'}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-medium">{match.team1?.substring(0, 1)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{match.team1}</p>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-medium mx-4">
                    {match.scoreA || 0} - {match.scoreB || 0}
                  </div>
                  
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="flex-1 text-right">
                      <p className="font-medium">{match.team2}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-medium">{match.team2?.substring(0, 1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Tap to Resume Scoring</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Enter Match Result Section */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
        <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
          Couldn't score a match Live, Don't worry
        </p>
        <button
          onClick={onEnterMatchResult}
          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <FileEdit className="w-5 h-5" />
          Enter Match Result
        </button>
      </div>

      {/* Recent/Completed Matches Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium dark:text-gray-100">Recent Matches</h2>
        <button className="text-purple-600 dark:text-purple-400">View All</button>
      </div>

      <div className="space-y-3">
        {uniqueCompletedMatches.length > 0 ? (
          uniqueCompletedMatches.map((match) => (
            <div
              key={match.id}
              onClick={() => onMatchClick(match)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-300 font-medium">{match.team1?.substring(0, 1) || 'A'}</span>
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-100">{match.team1 || match.teamA} vs {match.team2 || match.teamB}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span>{match.tournament || 'Tournament'}</span>
                      {match.tournamentStage && (
                        <span className="text-xs ml-1">• {formatTournamentStage(match.tournamentStage)}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-medium dark:text-gray-100">{match.scoreA} - {match.scoreB}</div>
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-sm">
                    Final
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No recent matches</p>
            <p className="text-sm mt-1">Start scoring to see matches here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoringTab;