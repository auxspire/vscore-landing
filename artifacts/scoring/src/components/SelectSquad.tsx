import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Check, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import AddPlayer from './AddPlayer';
import PlayerListItem from './PlayerListItem';

// Squad selection uses registered team rosters from playerDatabase
const SelectSquad = ({ match, onBack, onStartMatch, registeredTeams = [], playerDatabase = [], onAddPlayer, onAssignPlayerToTeam }) => {
  const [team1Squad, setTeam1Squad] = useState([]);
  const [team2Squad, setTeam2Squad] = useState([]);
  const [team1Formation, setTeam1Formation] = useState('');
  const [team2Formation, setTeam2Formation] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addingToTeam, setAddingToTeam] = useState(null);
  const [team1Goalkeeper, setTeam1Goalkeeper] = useState(null);
  const [team2Goalkeeper, setTeam2Goalkeeper] = useState(null);
  const [showGoalkeeperError, setShowGoalkeeperError] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');

  const playersPerTeam = parseInt(match.playersPerTeam) || 11;

  // Generate formation options based on number of outfield players (excluding goalkeeper)
  const getFormationOptions = (totalPlayers) => {
    const outfieldPlayers = totalPlayers - 1; // Exclude goalkeeper
    
    if (outfieldPlayers === 10) { // 11 players total
      return [
        '4-4-2',
        '4-3-3',
        '4-2-3-1',
        '3-5-2',
        '3-4-3',
        '5-3-2',
        '5-4-1',
        '4-5-1'
      ];
    } else if (outfieldPlayers === 6) { // 7 players total
      return [
        '3-2-1',
        '2-3-1',
        '3-1-2',
        '2-2-2',
        '3-3',
        '2-4',
        '4-2'
      ];
    } else if (outfieldPlayers === 4) { // 5 players total
      return [
        '2-2',
        '2-1-1',
        '1-2-1',
        '1-1-2',
        '3-1'
      ];
    } else if (outfieldPlayers === 8) { // 9 players total
      return [
        '3-3-2',
        '3-2-3',
        '4-2-2',
        '4-3-1',
        '2-4-2'
      ];
    } else if (outfieldPlayers === 5) { // 6 players total
      return [
        '2-2-1',
        '2-1-2',
        '3-1-1',
        '1-3-1',
        '2-3'
      ];
    } else {
      // Generic formation for other player counts
      return [`${Math.floor(outfieldPlayers / 2)}-${Math.ceil(outfieldPlayers / 2)}`];
    }
  };

  const formationOptions = getFormationOptions(playersPerTeam);
  
  // Get team data from registered teams
  const team1Data = registeredTeams.find(t => t.name === match.team1);
  const team2Data = registeredTeams.find(t => t.name === match.team2);
  
  // Get unassigned players from database (can be used by any team)
  const unassignedPlayers = playerDatabase
    .filter(p => !p.teamId || p.teamId === null)
    .map(p => ({
      id: p.id,
      name: p.name,
      number: parseInt(p.jerseyNumber) || 0,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      phoneNumber: p.phoneNumber,
      imageUrl: p.imageUrl
    }));
  
  // Get players assigned to each specific team
  const team1AssignedPlayers = team1Data?.id 
    ? playerDatabase
        .filter(p => {
          // Check if player is assigned to team1 (either in teams array or legacy teamId)
          const hasTeamInArray = p.teams?.some(t => t.teamId === team1Data.id);
          const hasLegacyTeam = p.teamId === team1Data.id;
          return hasTeamInArray || hasLegacyTeam;
        })
        .map(p => {
          // Get the jersey number specific to this team
          const teamAssignment = p.teams?.find(t => t.teamId === team1Data.id);
          const jerseyNumber = teamAssignment?.jerseyNumber || p.jerseyNumber;
          
          return {
            id: p.id,
            name: p.name,
            number: parseInt(jerseyNumber) || 0,
            jerseyNumber: jerseyNumber,
            position: p.position,
            phoneNumber: p.phoneNumber,
            imageUrl: p.imageUrl
          };
        })
    : [];
  
  const team2AssignedPlayers = team2Data?.id 
    ? playerDatabase
        .filter(p => {
          // Check if player is assigned to team2 (either in teams array or legacy teamId)
          const hasTeamInArray = p.teams?.some(t => t.teamId === team2Data.id);
          const hasLegacyTeam = p.teamId === team2Data.id;
          return hasTeamInArray || hasLegacyTeam;
        })
        .map(p => {
          // Get the jersey number specific to this team
          const teamAssignment = p.teams?.find(t => t.teamId === team2Data.id);
          const jerseyNumber = teamAssignment?.jerseyNumber || p.jerseyNumber;
          
          return {
            id: p.id,
            name: p.name,
            number: parseInt(jerseyNumber) || 0,
            jerseyNumber: jerseyNumber,
            position: p.position,
            phoneNumber: p.phoneNumber,
            imageUrl: p.imageUrl
          };
        })
    : [];
  
  // Get available players for each team (registered team players + assigned from DB + unassigned from DB + newly added ones)
  const team1Players = [
    ...team1AssignedPlayers
  ];
  
  const team2Players = [
    ...team2AssignedPlayers
  ];
  
  // Get filtered suggestions based on input
  const getPlayerSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const lowerSearch = searchTerm.toLowerCase();
    return unassignedPlayers
      .filter(p => p.name.toLowerCase().includes(lowerSearch))
      .slice(0, 5); // Limit to 5 suggestions
  };
  
  const playerSuggestions = getPlayerSuggestions(newPlayerName);

  const togglePlayer = (team, player) => {
    if (team === 1) {
      const isSelected = team1Squad.some(p => p.id === player.id);
      if (isSelected) {
        setTeam1Squad(team1Squad.filter(p => p.id !== player.id));
        // If removing the goalkeeper, clear goalkeeper selection
        if (team1Goalkeeper?.id === player.id) {
          setTeam1Goalkeeper(null);
        }
      } else if (team1Squad.length < playersPerTeam) {
        setTeam1Squad([...team1Squad, player]);
      }
    } else {
      const isSelected = team2Squad.some(p => p.id === player.id);
      if (isSelected) {
        setTeam2Squad(team2Squad.filter(p => p.id !== player.id));
        // If removing the goalkeeper, clear goalkeeper selection
        if (team2Goalkeeper?.id === player.id) {
          setTeam2Goalkeeper(null);
        }
      } else if (team2Squad.length < playersPerTeam) {
        setTeam2Squad([...team2Squad, player]);
      }
    }
  };

  const toggleGoalkeeper = (team, player) => {
    if (team === 1) {
      if (team1Goalkeeper?.id === player.id) {
        setTeam1Goalkeeper(null);
      } else {
        setTeam1Goalkeeper(player);
      }
    } else {
      if (team2Goalkeeper?.id === player.id) {
        setTeam2Goalkeeper(null);
      } else {
        setTeam2Goalkeeper(player);
      }
    }
    // Clear error when goalkeeper is selected
    setShowGoalkeeperError(false);
  };

  const isPlayerSelected = (team, playerId) => {
    return team === 1 
      ? team1Squad.some(p => p.id === playerId)
      : team2Squad.some(p => p.id === playerId);
  };

  const handleAddPlayerBack = () => {
    setShowAddPlayer(false);
    setAddingToTeam(null);
  };

  const handlePlayerCreated = (playerData) => {
    // Determine which team this player belongs to
    const teamData = addingToTeam === 1 ? team1Data : team2Data;
    
    const newPlayer = {
      name: playerData.name,
      jerseyNumber: playerData.jerseyNumber || String(Math.floor(Math.random() * 99) + 1),
      position: playerData.position || '',
      phoneNumber: playerData.phoneNumber || '',
      imageUrl: playerData.imageUrl || '',
      teamId: teamData?.id || null,
      teamName: teamData?.name || null,
      teams: teamData?.id ? [{ 
        teamId: teamData.id, 
        teamName: teamData.name,
        jerseyNumber: playerData.jerseyNumber || String(Math.floor(Math.random() * 99) + 1)
      }] : []
    };
    
    // Call parent handler to add player to database and team
    if (onAddPlayer) {
      onAddPlayer(newPlayer);
      console.log('Player added via parent handler:', newPlayer);
    }
    
    // Close the inline add form
    setAddingToTeam(null);
    setNewPlayerName('');
    setNewPlayerJersey('');
  };

  const handleStartMatch = () => {
    // Validate that both teams have selected a goalkeeper
    if (!team1Goalkeeper || !team2Goalkeeper) {
      setShowGoalkeeperError(true);
      return;
    }
    
    // Mark the goalkeepers with the position
    const team1SquadWithGK = team1Squad.map(p => ({
      ...p,
      position: p.id === team1Goalkeeper.id ? 'Goalkeeper' : (p.position || 'Outfield')
    }));
    
    const team2SquadWithGK = team2Squad.map(p => ({
      ...p,
      position: p.id === team2Goalkeeper.id ? 'Goalkeeper' : (p.position || 'Outfield')
    }));
    
    const matchWithSquads = {
      ...match,
      team1Squad: team1SquadWithGK,
      team2Squad: team2SquadWithGK,
      team1FullRoster: team1Players,
      team2FullRoster: team2Players,
      team1Formation,
      team2Formation
    };
    onStartMatch(matchWithSquads);
  };

  // Check if squads are complete
  const isTeam1Complete = team1Squad.length === playersPerTeam;
  const isTeam2Complete = team2Squad.length === playersPerTeam;
  const isSquadComplete = isTeam1Complete && isTeam2Complete;
  
  const team1Remaining = playersPerTeam - team1Squad.length;
  const team2Remaining = playersPerTeam - team2Squad.length;

  if (showAddPlayer) {
    return <AddPlayer onBack={handleAddPlayerBack} onAddPlayer={handlePlayerCreated} playerDatabase={playerDatabase} />;
  }

  return (
    <div className="p-6 space-y-6 pb-52">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-medium">Select Squad</h1>
      </div>

      <div className="bg-purple-50 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Match</p>
            <p className="font-medium">{match.team1} vs {match.team2}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Players per team</p>
            <p className="font-medium">{playersPerTeam}</p>
          </div>
        </div>
      </div>

      {/* Team 1 Squad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{match.team1}</h2>
          <span className="text-sm text-gray-600">{team1Squad.length}/{playersPerTeam} selected</span>
        </div>
        
        {!isTeam1Complete && team1Squad.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              Please add {team1Remaining} more {team1Remaining === 1 ? 'player' : 'players'} to complete the squad
            </p>
          </div>
        )}
        
        {/* Show selected players with goalkeeper designation */}
        {team1Squad.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Selected Squad - Tap to designate goalkeeper:</p>
            {team1Squad.map((player) => {
              const isGK = team1Goalkeeper?.id === player.id;
              return (
                <PlayerListItem
                  key={player.id}
                  player={player}
                  onClick={() => toggleGoalkeeper(1, player)}
                  variant={isGK ? 'goalkeeper' : 'selected'}
                  rightContent={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayer(1, player);
                      }}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  }
                />
              );
            })}
          </div>
        )}

        {/* Formation Dropdown */}
        <div>
          <Label htmlFor="team1Formation" className="text-sm text-gray-700 mb-2 block">Select Formation</Label>
          <Select
            value={team1Formation}
            onValueChange={(value) => setTeam1Formation(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select formation (e.g., 4-4-2)" />
            </SelectTrigger>
            <SelectContent>
              {formationOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Selection */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">Available Players:</p>
          {!team1Data ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Team not found in your roster. Go back and pick a registered team.
            </p>
          ) : team1Players.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl space-y-3">
              <p className="text-sm text-gray-600">No players on {match.team1} yet.</p>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-600 text-purple-600"
                onClick={() => {
                  setAddingToTeam(1);
                  setNewPlayerName('');
                  setNewPlayerJersey('');
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add player to team
              </Button>
            </div>
          ) : null}
          {team1Players.map((player) => {
            const selected = isPlayerSelected(1, player.id);
            
            if (selected) return null; // Don't show already selected players
            
            return (
              <PlayerListItem
                key={player.id}
                player={player}
                onClick={() => togglePlayer(1, player)}
                disabled={team1Squad.length >= playersPerTeam}
                showPosition={true}
                rightContent={<Plus className="w-5 h-5 text-purple-600" />}
              />
            );
          })}
          
          {/* Inline Add Player Form for Team 1 */}
          {addingToTeam === 1 && (
            <div className="border border-purple-300 bg-purple-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-sm">Add New Player</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player name *"
                    className="bg-white"
                  />
                  {/* Player Suggestions */}
                  {playerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {playerSuggestions.map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => {
                            // Auto-assign the suggested player to this team
                            if (onAssignPlayerToTeam && team1Data?.id) {
                              onAssignPlayerToTeam(player.id, team1Data.id, player.jerseyNumber || '');
                            }
                            setNewPlayerName('');
                            setNewPlayerJersey('');
                            setAddingToTeam(null);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                        >
                          <PlayerListItem
                            player={player}
                            variant="compact"
                            showPosition={true}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <Input
                    value={newPlayerJersey}
                    onChange={(e) => setNewPlayerJersey(e.target.value)}
                    placeholder="Jersey #"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setAddingToTeam(null);
                    setNewPlayerName('');
                    setNewPlayerJersey('');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newPlayerName) {
                      handlePlayerCreated({
                        name: newPlayerName,
                        jerseyNumber: newPlayerJersey || String(Math.floor(Math.random() * 99) + 1)
                      });
                      setNewPlayerName('');
                      setNewPlayerJersey('');
                    }
                  }}
                  disabled={!newPlayerName}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Add Player
                </Button>
              </div>
            </div>
          )}
          
          {addingToTeam !== 1 && (
            <Button
              onClick={() => setAddingToTeam(1)}
              variant="outline"
              className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Player
            </Button>
          )}
        </div>
      </div>

      {/* Team 2 Squad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{match.team2}</h2>
          <span className="text-sm text-gray-600">{team2Squad.length}/{playersPerTeam} selected</span>
        </div>
        
        {!isTeam2Complete && team2Squad.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              Please add {team2Remaining} more {team2Remaining === 1 ? 'player' : 'players'} to complete the squad
            </p>
          </div>
        )}
        
        {/* Show selected players with goalkeeper designation */}
        {team2Squad.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Selected Squad - Tap to designate goalkeeper:</p>
            {team2Squad.map((player) => {
              const isGK = team2Goalkeeper?.id === player.id;
              return (
                <PlayerListItem
                  key={player.id}
                  player={player}
                  onClick={() => toggleGoalkeeper(2, player)}
                  variant={isGK ? 'goalkeeper' : 'selected'}
                  rightContent={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayer(2, player);
                      }}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  }
                />
              );
            })}
          </div>
        )}

        {/* Formation Dropdown */}
        <div>
          <Label htmlFor="team2Formation" className="text-sm text-gray-700 mb-2 block">Select Formation</Label>
          <Select
            value={team2Formation}
            onValueChange={(value) => setTeam2Formation(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select formation (e.g., 4-4-2)" />
            </SelectTrigger>
            <SelectContent>
              {formationOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Selection */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">Available Players:</p>
          {!team2Data ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Team not found in your roster. Go back and pick a registered team.
            </p>
          ) : team2Players.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl space-y-3">
              <p className="text-sm text-gray-600">No players on {match.team2} yet.</p>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-600 text-purple-600"
                onClick={() => {
                  setAddingToTeam(2);
                  setNewPlayerName('');
                  setNewPlayerJersey('');
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add player to team
              </Button>
            </div>
          ) : null}
          {team2Players.map((player) => {
            const selected = isPlayerSelected(2, player.id);
            
            if (selected) return null; // Don't show already selected players
            
            return (
              <PlayerListItem
                key={player.id}
                player={player}
                onClick={() => togglePlayer(2, player)}
                disabled={team2Squad.length >= playersPerTeam}
                showPosition={true}
                rightContent={<Plus className="w-5 h-5 text-purple-600" />}
              />
            );
          })}
          
          {/* Inline Add Player Form for Team 2 */}
          {addingToTeam === 2 && (
            <div className="border border-purple-300 bg-purple-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-sm">Add New Player</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player name *"
                    className="bg-white"
                  />
                  {/* Player Suggestions */}
                  {playerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {playerSuggestions.map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => {
                            // Auto-assign the suggested player to this team
                            if (onAssignPlayerToTeam && team2Data?.id) {
                              onAssignPlayerToTeam(player.id, team2Data.id, player.jerseyNumber || '');
                            }
                            setNewPlayerName('');
                            setNewPlayerJersey('');
                            setAddingToTeam(null);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                        >
                          <PlayerListItem
                            player={player}
                            variant="compact"
                            showPosition={true}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <Input
                    value={newPlayerJersey}
                    onChange={(e) => setNewPlayerJersey(e.target.value)}
                    placeholder="Jersey #"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setAddingToTeam(null);
                    setNewPlayerName('');
                    setNewPlayerJersey('');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newPlayerName) {
                      handlePlayerCreated({
                        name: newPlayerName,
                        jerseyNumber: newPlayerJersey || String(Math.floor(Math.random() * 99) + 1)
                      });
                      setNewPlayerName('');
                      setNewPlayerJersey('');
                    }
                  }}
                  disabled={!newPlayerName}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Add Player
                </Button>
              </div>
            </div>
          )}
          
          {addingToTeam !== 2 && (
            <Button
              onClick={() => setAddingToTeam(2)}
              variant="outline"
              className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Player
            </Button>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md lg:max-w-none mx-auto p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-3">
        {!isSquadComplete && (team1Squad.length > 0 || team2Squad.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              Both teams must have exactly {playersPerTeam} {playersPerTeam === 1 ? 'player' : 'players'} selected to start the match
            </p>
          </div>
        )}
        
        {showGoalkeeperError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              Both teams must have a designated goalkeeper
            </p>
          </div>
        )}
        
        <Button
          onClick={handleStartMatch}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!isSquadComplete}
        >
          Start Match
        </Button>
      </div>
    </div>
  );
};

export default SelectSquad;