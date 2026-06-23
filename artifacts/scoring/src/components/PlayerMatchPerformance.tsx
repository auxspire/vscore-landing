import React from 'react';
import { Star, Target, Circle, Users, CircleDot, Footprints, OctagonAlert, ArrowDownUp, FlagTriangleRight, Flag, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { formatPointsBreakdown } from '../utils/ratingCalculation';

interface PlayerMatchPerformanceProps {
  player: any;
  match: any;
  onClose: () => void;
  /** Called when the user taps the player avatar or name — navigate to full profile */
  onPlayerProfileClick?: () => void;
}

const PlayerMatchPerformance: React.FC<PlayerMatchPerformanceProps> = ({ 
  player, 
  match, 
  onClose,
  onPlayerProfileClick,
}) => {
  if (!player) return null;

  const rating = player.rating || null;
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [showRatingCalc, setShowRatingCalc] = React.useState(false);

  // Filter events for this specific player
  const playerEvents = (match?.events || []).filter((event: any) => {
    // Helper to check if player matches (handles both string and object formats)
    const checkPlayerMatch = (eventPlayer: any) => {
      if (!eventPlayer) return false;
      if (typeof eventPlayer === 'string') {
        return eventPlayer === player.name;
      }
      return eventPlayer.id === player.id || eventPlayer.name === player.name;
    };
    
    // Check if player is the main actor
    if (checkPlayerMatch(event.player)) {
      return true;
    }
    // Check if player is the assist provider
    if (checkPlayerMatch(event.assist) || checkPlayerMatch(event.assistedBy)) {
      return true;
    }
    // Check if player is goalkeeper who saved
    if (checkPlayerMatch(event.savedBy)) {
      return true;
    }
    // Check if player blocked a shot
    if (checkPlayerMatch(event.blockedBy)) {
      return true;
    }
    // Check substitutions
    if (checkPlayerMatch(event.playerOut)) {
      return true;
    }
    if (checkPlayerMatch(event.playerIn)) {
      return true;
    }
    return false;
  });

  // Also check penalty shootout events
  const penaltyEvents = (match?.penaltyEvents || []).filter((event: any) => {
    return event.kicker?.id === player.id || 
           event.kicker?.name === player.name ||
           event.goalkeeper?.id === player.id ||
           event.goalkeeper?.name === player.name;
  });

  const allPlayerEvents = [...playerEvents, ...penaltyEvents.map(p => ({ ...p, isPenaltyShootout: true }))];

  // Get event icon and color
  const getEventIconAndColor = (eventType: string) => {
    const eventMap: any = {
      'goal': { icon: CircleDot, color: 'text-green-600 bg-green-100', label: 'Goal' },
      'shot_on_target': { icon: Target, color: 'text-blue-600 bg-blue-100', label: 'Shot on Target' },
      'off_target': { icon: Footprints, color: 'text-gray-600 bg-gray-100', label: 'Shot off Target' },
      'shot_off_target': { icon: Footprints, color: 'text-gray-600 bg-gray-100', label: 'Shot off Target' },
      'foul': { icon: OctagonAlert, color: 'text-yellow-600 bg-yellow-100', label: 'Foul' },
      'yellow_card': { icon: OctagonAlert, color: 'text-yellow-600 bg-yellow-100', label: 'Yellow Card' },
      'red_card': { icon: OctagonAlert, color: 'text-red-600 bg-red-100', label: 'Red Card' },
      'substitute': { icon: ArrowDownUp, color: 'text-purple-600 bg-purple-100', label: 'Substitution' },
      'substitution': { icon: ArrowDownUp, color: 'text-purple-600 bg-purple-100', label: 'Substitution' },
      'interception': { icon: Users, color: 'text-blue-600 bg-blue-100', label: 'Interception' },
      'corner': { icon: FlagTriangleRight, color: 'text-blue-600 bg-blue-100', label: 'Corner' },
      'offside': { icon: Flag, color: 'text-orange-600 bg-orange-100', label: 'Offside' },
      'penalty': { icon: CircleDot, color: 'text-purple-600 bg-purple-100', label: 'Penalty' }
    };
    return eventMap[eventType] || { icon: Circle, color: 'text-gray-600 bg-gray-100', label: eventType };
  };

  // Get rating color
  const getRatingColor = (ratingValue: number): string => {
    if (ratingValue >= 9.0) return 'text-green-600 bg-green-100';
    if (ratingValue >= 8.0) return 'text-green-500 bg-green-50';
    if (ratingValue >= 7.0) return 'text-blue-600 bg-blue-100';
    if (ratingValue >= 6.0) return 'text-yellow-600 bg-yellow-100';
    if (ratingValue >= 5.0) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Parse time to get minute
  const parseTimeToMinute = (timeStr: string): number => {
    if (!timeStr) return 0;
    timeStr = timeStr.replace("'", '');
    if (timeStr.includes(':')) {
      const [mins, secs] = timeStr.split(':').map(Number);
      return Math.floor((mins * 60 + secs) / 60) + 1;
    }
    return parseFloat(timeStr) || 0;
  };

  // Helper to get name from player field (handles both string and object)
  const getPlayerName = (playerField: any): string => {
    if (!playerField) return '';
    if (typeof playerField === 'string') return playerField;
    return playerField.name || '';
  };

  // Format event description for this player
  const formatEventDescription = (event: any): string => {
    if (event.isPenaltyShootout) {
      // Penalty shootout event
      const kickerName = getPlayerName(event.kicker);
      if (event.kicker?.id === player.id || kickerName === player.name) {
        return `Penalty ${event.outcome}`;
      }
      if (event.goalkeeper?.id === player.id || getPlayerName(event.goalkeeper) === player.name) {
        return `Saved penalty from ${kickerName}`;
      }
    }

    if (event.type === 'goal') {
      let desc = event.ownGoal ? 'Own Goal' : 'Goal scored';
      if (event.goalType && !event.ownGoal) {
        desc += ` (${event.goalType})`;
      }
      const assistName = getPlayerName(event.assist) || getPlayerName(event.assistedBy);
      if (assistName && assistName !== player.name) {
        desc += ` - Assisted by ${assistName}`;
      }
      return desc;
    }

    if (event.type === 'shot_on_target') {
      const savedByName = getPlayerName(event.savedBy);
      const blockedByName = getPlayerName(event.blockedBy);
      const shooterName = getPlayerName(event.player);
      
      if (savedByName === player.name) {
        return `Saved shot from ${shooterName}`;
      }
      if (blockedByName === player.name) {
        return `Blocked shot from ${shooterName}`;
      }
      let desc = 'Shot on target';
      if (event.shotOnTargetOutcome) {
        desc += ` - ${event.shotOnTargetOutcome}`;
      }
      return desc;
    }

    if (event.type === 'off_target' || event.type === 'shot_off_target') {
      let desc = 'Shot off target';
      if (event.shotOffTargetOutcome) {
        desc += ` - ${event.shotOffTargetOutcome}`;
      }
      return desc;
    }

    if (event.type === 'foul') {
      let desc = 'Foul committed';
      if (event.yellowCard) desc = 'Yellow card for foul';
      if (event.redCard) desc = 'Red card for foul';
      return desc;
    }

    if (event.type === 'substitute' || event.type === 'substitution') {
      const playerOutName = getPlayerName(event.playerOut);
      const playerInName = getPlayerName(event.playerIn);
      
      if (playerOutName === player.name) {
        return `Substituted off for ${playerInName}`;
      }
      if (playerInName === player.name) {
        return `Substituted on for ${playerOutName}`;
      }
    }

    if (event.type === 'interception') {
      let desc = 'Interception';
      if (event.interceptionOutcome) {
        desc += ` - ${event.interceptionOutcome}`;
      }
      return desc;
    }

    // Check if this is an assist
    const assistName = getPlayerName(event.assist) || getPlayerName(event.assistedBy);
    if (assistName === player.name) {
      return `Assisted goal by ${getPlayerName(event.player)}`;
    }

    return event.type?.replace(/_/g, ' ') || 'Event';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {/* Clickable avatar → player profile */}
            <button
              onClick={onPlayerProfileClick}
              disabled={!onPlayerProfileClick}
              className={`w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${onPlayerProfileClick ? 'cursor-pointer hover:bg-purple-200 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-purple-300' : 'cursor-default'}`}
              title={onPlayerProfileClick ? `View ${player.name}'s profile` : undefined}
            >
              <span className="text-lg font-medium text-purple-600">
                {player.jerseyNumber || player.number || '?'}
              </span>
            </button>
            <div>
              {/* Clickable name → player profile */}
              {onPlayerProfileClick ? (
                <button
                  onClick={onPlayerProfileClick}
                  className="text-xl font-bold text-left hover:text-purple-700 hover:underline underline-offset-2 transition-colors leading-tight"
                  title={`View ${player.name}'s profile`}
                >
                  {player.name}
                </button>
              ) : (
                <div className="text-xl font-bold">{player.name}</div>
              )}
              <div className="text-sm font-normal text-gray-600 flex items-center gap-1 mt-0.5">
                {player.position} • Match Performance
                {onPlayerProfileClick && (
                  <span className="text-xs text-purple-500 font-medium">(tap name to view profile)</span>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            View detailed match performance statistics including rating, events, and points breakdown for {player.name}.
          </DialogDescription>
        </DialogHeader>

        {/* Rating Display */}
        {rating && (
          <>
            <Card className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">VMIR (VScor Match Influence Rating)</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-2xl ${getRatingColor(rating.rating)}`}>
                      <Star className="w-6 h-6 fill-current" />
                      <span>{rating.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Total Points</p>
                    <div className="text-2xl font-bold text-purple-600">
                      {rating.points > 0 ? '+' : ''}{rating.points.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Breakdown */}
            {rating.breakdown && (
              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h4 className="text-sm font-semibold text-gray-700">Points Breakdown</h4>
                    {showBreakdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  {showBreakdown && (
                    <div className="mt-3 space-y-1">
                      {formatPointsBreakdown(rating.breakdown).map((item, idx) => (
                        <div key={idx} className="text-xs text-gray-600 py-1 border-t border-gray-100 first:border-0">
                          • {item}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rating Calculation Formula */}
            {rating.minutesPlayed !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowRatingCalc(!showRatingCalc)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-600" />
                      <h4 className="text-sm font-semibold text-gray-700">Rating Calculation</h4>
                    </div>
                    {showRatingCalc ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  {showRatingCalc && (
                    <div className="mt-3 space-y-3 text-xs">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-semibold text-purple-900 mb-2">How VMIR is Calculated:</div>
                        
                        {rating.minutesPlayed > 0 ? (
                          <>
                            <div className="space-y-2 text-gray-700">
                              <div className="flex justify-between items-center py-1">
                                <span>1. Raw Action Score:</span>
                                <span className="font-semibold">{rating.points.toFixed(2)} pts</span>
                              </div>
                              
                              <div className="flex justify-between items-center py-1">
                                <span>2. Minutes Played:</span>
                                <span className="font-semibold">{Math.round(rating.minutesPlayed)} min</span>
                              </div>
                              
                              <div className="flex justify-between items-center py-1">
                                <span>3. Per-Minute Impact:</span>
                                <span className="font-semibold">{(rating.points / rating.minutesPlayed).toFixed(3)} pts/min</span>
                              </div>
                              
                              <div className="flex justify-between items-center py-1">
                                <span>4. Match Duration:</span>
                                <span className="font-semibold">{match.duration || 90} min</span>
                              </div>
                              
                              <div className="border-t border-purple-200 my-2"></div>
                              
                              <div className="flex justify-between items-center py-1">
                                <span>5. Time-Adjusted Score:</span>
                                <span className="font-semibold">
                                  {((rating.points / rating.minutesPlayed) * (match.duration || 90)).toFixed(2)} pts
                                </span>
                              </div>
                              
                              {rating.minutesPlayed < (match.duration || 90) * 0.2 && (
                                <div className="flex justify-between items-center py-1 text-orange-600">
                                  <span>6. Substitute Penalty (×0.85):</span>
                                  <span className="font-semibold">
                                    {((rating.points / rating.minutesPlayed) * (match.duration || 90) * 0.85).toFixed(2)} pts
                                  </span>
                                </div>
                              )}
                              
                              <div className="border-t border-purple-200 my-2"></div>
                              
                              <div className="flex justify-between items-center py-1">
                                <span>7. Base Rating:</span>
                                <span className="font-semibold">6.0</span>
                              </div>
                              
                              <div className="flex justify-between items-center py-1 font-bold text-purple-900">
                                <span>Final Rating:</span>
                                <span className="text-lg">{rating.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 p-2 bg-white rounded text-gray-600 text-xs">
                              <strong>Note:</strong> Ratings are capped between 4.5 and 9.8. 
                              {rating.breakdown?.redCards?.count > 0 && " Red card limits max rating to 5.5."}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-600">
                            Player did not play in this match (0 minutes).
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Player Events */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Match Events</h3>
          
          {allPlayerEvents.length > 0 ? (
            <div className="space-y-3">
              {allPlayerEvents.map((event: any, index: number) => {
                const eventInfo = getEventIconAndColor(event.type || 'penalty');
                const EventIcon = eventInfo.icon;
                const minute = event.isPenaltyShootout ? 'Pens' : parseTimeToMinute(event.time) + "'";

                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Event Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${eventInfo.color}`}>
                          <EventIcon className="w-5 h-5" />
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{minute}</span>
                            {event.type && !event.isPenaltyShootout && (
                              <Badge variant="outline" className="text-xs">
                                {eventInfo.label}
                              </Badge>
                            )}
                            {event.isPenaltyShootout && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                Penalty Shootout
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700">
                            {formatEventDescription(event)}
                          </p>

                          {/* Additional badges for cards */}
                          {event.yellowCard && (
                            <Badge className="mt-2 bg-yellow-100 text-yellow-800 text-xs">
                              🟨 Yellow Card
                            </Badge>
                          )}
                          {event.redCard && (
                            <Badge className="mt-2 bg-red-100 text-red-800 text-xs">
                              🟥 Red Card
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No events recorded for this player</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This player didn't participate in any recorded events
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        {allPlayerEvents.length > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Stats</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {allPlayerEvents.filter(e => e.type === 'goal' && !e.ownGoal).length}
                  </div>
                  <div className="text-xs text-gray-600">Goals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {playerEvents.filter(e => e.assist?.id === player.id || e.assist?.name === player.name).length}
                  </div>
                  <div className="text-xs text-gray-600">Assists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {allPlayerEvents.length}
                  </div>
                  <div className="text-xs text-gray-600">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerMatchPerformance;