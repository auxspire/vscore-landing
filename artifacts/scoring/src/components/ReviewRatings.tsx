import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { calculatePlayerRatings, formatPointsBreakdown, PlayerPoints } from '../utils/ratingCalculation';

interface ReviewRatingsProps {
  match: any;
  onAcceptRatings: (ratings: { [playerId: number]: { points: number; rating: number } }) => void;
  onSkipRatings: () => void;
}

const ReviewRatings: React.FC<ReviewRatingsProps> = ({ match, onAcceptRatings, onSkipRatings }) => {
  const [playerRatings, setPlayerRatings] = useState<PlayerPoints[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editedRating, setEditedRating] = useState<string>('');
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Calculate ratings when component mounts
    const ratings = calculatePlayerRatings(match);
    setPlayerRatings(ratings);
  }, [match]);

  const handleEditRating = (playerId: number, currentRating: number) => {
    setEditingPlayerId(playerId);
    setEditedRating(currentRating.toString());
  };

  const handleSaveRating = (playerId: number) => {
    const newRating = parseFloat(editedRating);
    
    // Validate rating
    if (isNaN(newRating) || newRating < 1 || newRating > 10) {
      alert('Rating must be between 1.0 and 10.0');
      return;
    }

    // Update the rating
    setPlayerRatings(prev => 
      prev.map(p => 
        p.playerId === playerId 
          ? { ...p, rating: Math.round(newRating * 10) / 10 }
          : p
      )
    );

    setEditingPlayerId(null);
    setEditedRating('');
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditedRating('');
  };

  const toggleExpanded = (playerId: number) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleAcceptAll = () => {
    // Create ratings map
    const ratingsMap: { [playerId: number]: { points: number; rating: number } } = {};
    
    playerRatings.forEach(pr => {
      ratingsMap[pr.playerId] = {
        points: pr.points,
        rating: pr.rating
      };
    });

    onAcceptRatings(ratingsMap);
  };

  const getRatingColor = (rating: number): string => {
    if (rating === 0) return 'text-gray-600 bg-gray-100'; // No minutes played
    if (rating >= 9.0) return 'text-green-600 bg-green-100';
    if (rating >= 8.0) return 'text-green-500 bg-green-50';
    if (rating >= 7.0) return 'text-blue-600 bg-blue-100';
    if (rating >= 6.0) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 5.0) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Separate players by team
  const team1Players = playerRatings.filter(pr => {
    const player = match.team1Squad?.find((p: any) => p.id === pr.playerId);
    return !!player;
  });

  const team2Players = playerRatings.filter(pr => {
    const player = match.team2Squad?.find((p: any) => p.id === pr.playerId);
    return !!player;
  });

  const getPlayerTeamInfo = (playerId: number) => {
    let player = match.team1Squad?.find((p: any) => p.id === playerId);
    let team = match.team1;
    
    if (!player) {
      player = match.team2Squad?.find((p: any) => p.id === playerId);
      team = match.team2;
    }
    
    return { player, team };
  };

  const renderPlayerRating = (pr: PlayerPoints) => {
    const { player, team } = getPlayerTeamInfo(pr.playerId);
    const isEditing = editingPlayerId === pr.playerId;
    const isExpanded = expandedPlayers.has(pr.playerId);
    const breakdownItems = formatPointsBreakdown(pr.breakdown);

    return (
      <Card key={pr.playerId} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 truncate">
                  {pr.playerName}
                </span>
                {player?.jerseyNumber && (
                  <Badge variant="outline" className="text-xs">
                    #{player.jerseyNumber}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{player?.position || 'Unknown'}</span>
                <span>•</span>
                <span className="text-purple-600 font-medium">{team}</span>
                {pr.minutesPlayed > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.round(pr.minutesPlayed)} min</span>
                  </>
                )}
              </div>
              
              {/* Points Summary */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Total: {pr.points > 0 ? '+' : ''}{pr.points.toFixed(2)} pts
                </span>
                
                {/* Expand/Collapse Button */}
                {breakdownItems.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(pr.playerId)}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Hide details <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        View details <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Breakdown Details - Collapsible */}
              {isExpanded && breakdownItems.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Points Breakdown:</h4>
                  <ul className="space-y-1">
                    {breakdownItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Rating Display/Edit */}
            <div className="flex flex-col items-end gap-2">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={editedRating}
                    onChange={(e) => setEditedRating(e.target.value)}
                    className="w-20 text-center"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleSaveRating(pr.playerId)}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-auto text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="px-2 py-1 h-auto text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-lg ${getRatingColor(pr.rating)}`}>
                    <Star className="w-4 h-4 fill-current" />
                    <span>{pr.rating === 0 ? 'N/A' : pr.rating.toFixed(1)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditRating(pr.playerId, pr.rating)}
                    className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 h-auto"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-purple-600 fill-purple-200" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VMIR - VScor Match Influence Ratings</h1>
              <p className="text-sm text-gray-600">
                {match.team1} vs {match.team2}
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-2">
            Auto-generated ratings based on match performance. Review and edit as needed.
          </p>
          <p className="text-sm text-gray-600">
            Ratings range from 4.5 to 9.8. You can manually override any rating by clicking Edit.
          </p>
        </div>
      </div>

      {/* Ratings List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Team 1 */}
        {team1Players.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">
              {match.team1}
            </h2>
            <div>
              {team1Players.map(pr => renderPlayerRating(pr))}
            </div>
          </div>
        )}

        {/* Team 2 */}
        {team2Players.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">
              {match.team2}
            </h2>
            <div>
              {team2Players.map(pr => renderPlayerRating(pr))}
            </div>
          </div>
        )}

        {/* No ratings */}
        {playerRatings.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              No player ratings available. Make sure players are in the squad.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mt-6 sticky bottom-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200">
          <div className="flex gap-3">
            <Button
              onClick={handleAcceptAll}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold rounded-xl"
            >
              Accept All Ratings
            </Button>
            <Button
              onClick={onSkipRatings}
              variant="outline"
              className="px-6 py-6 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              Skip
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            You can edit individual ratings before accepting
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewRatings;