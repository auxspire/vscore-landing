// @ts-nocheck
import React, { useState } from 'react';
import { Search, Filter, User, Calendar, MapPin, CheckCircle, Info, Target, AlertTriangle, RotateCcw, Timer, CircleDot, Footprints, OctagonAlert, ArrowDownUp, FlagTriangleRight, Flag, Users } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import ImageAvatar from './ImageAvatar';
import LiveTimer from './LiveTimer';

/** 
 * LiveMatchesScreen displays live and recent matches for audience viewing
 * Clicking matches opens match events timeline (not scoring interface)
 */
const LiveMatchesScreen = ({ 
  ongoingMatches = [], 
  completedMatches = [], 
  onMatchClick, 
  onPlayerClick = () => {}, 
  onTeamClick = () => {}, 
  onTournamentClick = () => {},
  onRefresh = () => {},
  isRefreshing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const MATCHES_PER_PAGE = 10;
  
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
  
  // Helper function to get event icon and formatted name
  const getEventDisplay = (eventType) => {
    const eventMap = {
      'goal': { icon: CircleDot, name: 'Goal', color: 'text-green-600' },
      'substitution': { icon: ArrowDownUp, name: 'Sub', color: 'text-purple-600' },
      'substitute': { icon: ArrowDownUp, name: 'Sub', color: 'text-purple-600' },
      'foul': { icon: OctagonAlert, name: 'Foul', color: 'text-yellow-600' },
      'yellow_card': { icon: OctagonAlert, name: 'Yellow Card', color: 'text-yellow-600' },
      'red_card': { icon: OctagonAlert, name: 'Red Card', color: 'text-red-600' },
      'shot_on_target': { icon: Target, name: 'Shot on Target', color: 'text-blue-600' },
      'off_target': { icon: Footprints, name: 'Shot off Target', color: 'text-gray-600' },
      'shot_off_target': { icon: Footprints, name: 'Shot off Target', color: 'text-gray-600' },
      'offside': { icon: Flag, name: 'Offside', color: 'text-orange-600' },
      'corner': { icon: FlagTriangleRight, name: 'Corner', color: 'text-blue-600' },
      'interception': { icon: Users, name: 'Interception', color: 'text-blue-600' },
      'save': { icon: Target, name: 'Save', color: 'text-green-600' }
    };
    
    const event = eventMap[eventType];
    if (event) return event;
    
    // Fallback: format the event type by removing underscores and capitalizing
    return {
      icon: Timer,
      name: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: 'text-gray-600'
    };
  };
  
  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    return /^\+91\d{10}$/.test(phoneNumber);
  };
  
  // Helper function to check if a match is verified
  // A match is verified if more than half of both teams' players have valid phone numbers
  const isMatchVerified = (match) => {
    // Get team rosters
    const team1Roster = match.team1FullRoster || match.team1Squad || [];
    const team2Roster = match.team2FullRoster || match.team2Squad || [];
    
    if (team1Roster.length === 0 || team2Roster.length === 0) {
      return false;
    }
    
    // Count verified players in each team
    const team1Verified = team1Roster.filter(player => hasValidPhoneNumber(player.phoneNumber)).length;
    const team2Verified = team2Roster.filter(player => hasValidPhoneNumber(player.phoneNumber)).length;
    
    // Check if more than half of each team is verified
    const team1VerifiedPercentage = team1Verified / team1Roster.length;
    const team2VerifiedPercentage = team2Verified / team2Roster.length;
    
    return team1VerifiedPercentage > 0.5 && team2VerifiedPercentage > 0.5;
  };

  // Map ongoing and completed matches for display
  const allMatches = [
    ...ongoingMatches.map(match => ({
      id: match.id,
      teamA: match.team1,
      teamB: match.team2,
      scoreA: match.scoreA || 0,
      scoreB: match.scoreB || 0,
      tournament: match.tournament || 'Local Tournament',
      tournamentStage: match.tournamentStage || null,
      time: match.currentTime || 'Live',
      status: 'live',
      venue: match.venue || 'Match Venue',
      events: match.events || [],
      team1Squad: match.team1Squad || [],
      team2Squad: match.team2Squad || [],
      team1FullRoster: match.team1FullRoster || match.team1Squad || [],
      team2FullRoster: match.team2FullRoster || match.team2Squad || [],
      team1Formation: match.team1Formation || '',
      team2Formation: match.team2Formation || '',
      isPenaltyShootout: match.isPenaltyShootout || false,
      penaltyShootoutScore: match.penaltyShootoutScore || null,
      penaltyEvents: match.penaltyEvents || [],
      // Preserve date fields for consistent date display
      date: match.date,
      startTime: match.startTime,
      endTime: match.endTime,
      completedAt: match.completedAt,
      createdAt: match.createdAt,
      // Timer fields for live clock
      actualStartTime: match.actualStartTime,
      elapsedTime: match.elapsedTime,
      currentTime: match.currentTime,
      matchStartStatus: match.matchStartStatus,
      // For ongoing matches, events are newest first, so slice(0, 2) gets the 2 most recent
      recentEvents: (match.events || []).slice(0, 2).map(e => ({
        minute: e.time,
        type: e.type,
        player: e.player?.name || e.teamName,
        team: e.teamName
      }))
    })),
    ...completedMatches.map(match => ({
      id: match.id,
      teamA: match.team1 || match.teamA,
      teamB: match.team2 || match.teamB,
      scoreA: match.scoreA || 0,
      scoreB: match.scoreB || 0,
      tournament: match.tournament || 'Local Tournament',
      tournamentStage: match.tournamentStage || null,
      time: 'Full Time',
      status: 'finished',
      venue: match.venue || 'Match Venue',
      events: match.events || [],
      team1Squad: match.team1Squad || [],
      team2Squad: match.team2Squad || [],
      team1FullRoster: match.team1FullRoster || match.team1Squad || [],
      team2FullRoster: match.team2FullRoster || match.team2Squad || [],
      team1Formation: match.team1Formation || '',
      team2Formation: match.team2Formation || '',
      isPenaltyShootout: match.isPenaltyShootout || false,
      penaltyShootoutScore: match.penaltyShootoutScore || null,
      penaltyEvents: match.penaltyEvents || [],
      playerRatings: match.playerRatings || {}, // Include player ratings
      // Preserve date fields for consistent date display
      date: match.date,
      startTime: match.startTime,
      endTime: match.endTime,
      completedAt: match.completedAt,
      createdAt: match.createdAt,
      // Timer fields for completed matches
      actualStartTime: match.actualStartTime,
      elapsedTime: match.elapsedTime,
      currentTime: match.currentTime,
      // Result-entry specific fields
      type: match.type,
      isLiveScored: match.isLiveScored,
      team1Players: match.team1Players || [],
      team2Players: match.team2Players || [],
      goalsTeam1: match.goalsTeam1 || [],
      goalsTeam2: match.goalsTeam2 || [],
      // For completed matches, events are reversed (oldest first), so slice(-2).reverse() gets the 2 most recent
      recentEvents: (match.events || []).slice(-2).reverse().map(e => ({
        minute: e.time,
        type: e.type,
        player: e.player?.name || e.teamName,
        team: e.teamName
      }))
    }))
  ];

  // Remove duplicates by ID - keep ongoing matches over completed ones
  // Convert IDs to strings for consistent comparison
  const uniqueMatches = Array.from(
    new Map(allMatches.reverse().map(match => [String(match.id), match])).values()
  ).reverse();

  // Filter matches based on search query
  const filteredMatches = uniqueMatches.filter(match =>
    match.teamA.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.teamB.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.tournament.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE);
  const startIndex = (currentPage - 1) * MATCHES_PER_PAGE;
  const endIndex = startIndex + MATCHES_PER_PAGE;
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleTeamNameClick = (e, teamName) => {
    e.stopPropagation();
    onTeamClick({ name: teamName });
  };

  const handleTournamentNameClick = (e, tournamentName) => {
    e.stopPropagation();
    onTournamentClick({ name: tournamentName });
  };

  const getMatchStatusBadge = (match) => {
    if (match.status === 'live') {
      return (
        <Badge className="bg-red-500 text-white animate-pulse">
          <LiveTimer match={match} />
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700">
          {match.time}
        </Badge>
      );
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2 dark:text-gray-100">Live Matches</h1>
          <p className="text-purple-600 dark:text-purple-400 text-lg">Stay Updated with Real-time Scores</p>
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Search teams, tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-none rounded-full dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Filter Button */}
      <Button variant="outline" className="rounded-full px-6">
        <Filter className="w-4 h-4 mr-2" />
        Filter Matches
      </Button>

      {/* Live Matches List */}
      <div className="space-y-4">
        {paginatedMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No matches yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Create a match from the Scoring tab to see live and completed games here.
            </p>
          </div>
        ) : (
        paginatedMatches.map((match) => {
          // Debug log when rendering match
          console.log(`🎯 [LiveMatchesScreen] Rendering match ${match.teamA} vs ${match.teamB}:`, {
            id: match.id,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            team1Score: match.team1Score,
            team2Score: match.team2Score,
            isPenaltyShootout: match.isPenaltyShootout,
            penaltyShootoutScore: match.penaltyShootoutScore,
          });
          
          return (
          <div
            key={match.id}
            onClick={() => {
              console.log(`🖱️ [LiveMatchesScreen] Match clicked:`, {
                id: match.id,
                teams: `${match.teamA} vs ${match.teamB}`,
                scoreA: match.scoreA,
                scoreB: match.scoreB,
              });
              onMatchClick(match);
            }}
            className="bg-purple-100 dark:bg-purple-900/20 rounded-2xl p-6 cursor-pointer hover:bg-purple-150 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700"
          >
            {/* Match Status and Tournament */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleTournamentNameClick(e, match.tournament)}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline font-medium"
                  >
                    {match.tournament}
                  </button>
                  {isMatchVerified(match) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVerificationInfo(true);
                      }}
                      className="flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </button>
                  )}
                </div>
                {match.tournamentStage && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatTournamentStage(match.tournamentStage)}
                  </span>
                )}
              </div>
              {getMatchStatusBadge(match)}
            </div>

            {/* Match Venue and Spectators */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{match.venue}</span>
              </div>
            </div>

            {/* Team Names and Score */}
            <div className="flex items-center justify-between gap-4">
              {/* Team A */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-medium text-purple-600 dark:text-purple-300">
                    {match.teamA.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleTeamNameClick(e, match.teamA)}
                  className="text-center text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors text-sm"
                >
                  <p className="line-clamp-2">{match.teamA}</p>
                </button>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 px-4">
                <div className="text-2xl text-gray-900 dark:text-gray-100">
                  {match.scoreA} - {match.scoreB}
                </div>
                {match.isPenaltyShootout && match.penaltyShootoutScore && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    Pens: {match.penaltyShootoutScore.team1} - {match.penaltyShootoutScore.team2}
                  </div>
                )}
              </div>

              {/* Team B */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-medium text-purple-600 dark:text-purple-300">
                    {match.teamB.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleTeamNameClick(e, match.teamB)}
                  className="text-center text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors text-sm"
                >
                  <p className="line-clamp-2">{match.teamB}</p>
                </button>
              </div>
            </div>

            {/* Recent Events Preview */}
            {match.recentEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/50">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Recent Events:</p>
                <div className="flex gap-2 flex-wrap">
                  {match.recentEvents.map((event, index) => {
                    const eventDisplay = getEventDisplay(event.type);
                    const EventIcon = eventDisplay.icon;
                    return (
                      <div key={index} className="flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{event.minute}'</span>
                        <EventIcon className={`w-3.5 h-3.5 ${eventDisplay.color}`} />
                        <span className={eventDisplay.color}>{eventDisplay.name}</span>
                        {event.player && event.player !== event.team && (
                          <>
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                            <span className="text-gray-700 dark:text-gray-300">{event.player}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          );
        })
        )}
      </div>

      {/* No matches found (search) */}
      {filteredMatches.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No matches found</h3>
          <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or check back later</p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
              
              if (!showPage) {
                // Show ellipsis for skipped pages
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              }
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg w-10 ${
                    currentPage === page 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : ''
                  }`}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg"
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Results Info */}
      {filteredMatches.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredMatches.length)} of {filteredMatches.length} matches
        </div>
      )}
      
      {/* Verification Info Dialog */}
      <Dialog open={showVerificationInfo} onOpenChange={setShowVerificationInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Verification Badge
            </DialogTitle>
            <DialogDescription>
              How matches get verified
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Match Verification</h3>
              <p className="text-sm text-gray-600">
                A match receives a verification badge when <span className="font-medium text-purple-600">more than 50% of players from both teams</span> have verified their profiles with a valid phone number.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Player Verification</h3>
              <p className="text-sm text-gray-600">
                Players are verified when they add a valid <span className="font-medium text-purple-600">Indian phone number (+91 followed by 10 digits)</span> to their profile.
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700">
                  Verified badges help ensure match authenticity and player accountability.
                </p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setShowVerificationInfo(false)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveMatchesScreen;