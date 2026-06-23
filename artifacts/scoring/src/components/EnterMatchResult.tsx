import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Users, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Checkbox } from './ui/checkbox';

const EnterMatchResult = ({ tournaments = [], teams = [], players = [], onBack, onPublish }) => {
  // Match details
  const [matchType, setMatchType] = useState('friendly'); // 'friendly' or tournament id
  const [tournamentStage, setTournamentStage] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  
  // Date and Time
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  
  // Players
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [currentTeamForPlayers, setCurrentTeamForPlayers] = useState(null); // 1 or 2
  
  // Goals
  const [goalsTeam1, setGoalsTeam1] = useState([]);
  const [goalsTeam2, setGoalsTeam2] = useState([]);
  
  // Dialog state
  const [selectedPlayersInDialog, setSelectedPlayersInDialog] = useState([]);
  const [playerLineupStatus, setPlayerLineupStatus] = useState({}); // playerId -> 'starting' or 'substitute'

  // Get available players based on selected team
  const getAvailablePlayersForTeam = (teamName) => {
    if (!teamName) return [];
    return players.filter(p => {
      // Check if player has teams array (multi-team support)
      if (p.teams && p.teams.length > 0) {
        return p.teams.some(t => t.teamName === teamName);
      }
      // Fallback to legacy teamName field
      return p.teamName === teamName;
    });
  };

  // Handle opening player selection dialog
  const handleOpenPlayerDialog = (teamNumber) => {
    setCurrentTeamForPlayers(teamNumber);
    const currentPlayers = teamNumber === 1 ? team1Players : team2Players;
    setSelectedPlayersInDialog(currentPlayers.map(p => p.id));
    
    // Initialize lineup status for current players
    const status = {};
    currentPlayers.forEach(p => {
      status[p.id] = p.isSubstitute ? 'substitute' : 'starting';
    });
    setPlayerLineupStatus(status);
    
    setShowPlayerDialog(true);
  };

  // Handle player toggle in dialog
  const handlePlayerToggle = (player) => {
    if (selectedPlayersInDialog.includes(player.id)) {
      setSelectedPlayersInDialog(selectedPlayersInDialog.filter(id => id !== player.id));
      const newStatus = { ...playerLineupStatus };
      delete newStatus[player.id];
      setPlayerLineupStatus(newStatus);
    } else {
      setSelectedPlayersInDialog([...selectedPlayersInDialog, player.id]);
      setPlayerLineupStatus({
        ...playerLineupStatus,
        [player.id]: 'starting'
      });
    }
  };

  // Handle lineup status change
  const handleLineupStatusChange = (playerId, status) => {
    setPlayerLineupStatus({
      ...playerLineupStatus,
      [playerId]: status
    });
  };

  // Confirm player selection
  const handleConfirmPlayerSelection = () => {
    const teamName = currentTeamForPlayers === 1 ? team1 : team2;
    const availablePlayers = getAvailablePlayersForTeam(teamName);
    
    const selectedPlayers = availablePlayers
      .filter(p => selectedPlayersInDialog.includes(p.id))
      .map(p => ({
        ...p,
        isSubstitute: playerLineupStatus[p.id] === 'substitute'
      }));
    
    if (currentTeamForPlayers === 1) {
      setTeam1Players(selectedPlayers);
    } else {
      setTeam2Players(selectedPlayers);
    }
    
    setShowPlayerDialog(false);
    setCurrentTeamForPlayers(null);
  };

  // Handle score change and adjust goals
  const handleScoreChange = (team, value) => {
    const newScore = parseInt(value) || 0;
    
    if (team === 1) {
      setScoreA(newScore);
      // Adjust goals array
      if (newScore > goalsTeam1.length) {
        const newGoals = [...goalsTeam1];
        for (let i = goalsTeam1.length; i < newScore; i++) {
          newGoals.push({ scorer: '', assist: '', ownGoal: false });
        }
        setGoalsTeam1(newGoals);
      } else if (newScore < goalsTeam1.length) {
        setGoalsTeam1(goalsTeam1.slice(0, newScore));
      }
    } else {
      setScoreB(newScore);
      // Adjust goals array
      if (newScore > goalsTeam2.length) {
        const newGoals = [...goalsTeam2];
        for (let i = goalsTeam2.length; i < newScore; i++) {
          newGoals.push({ scorer: '', assist: '', ownGoal: false });
        }
        setGoalsTeam2(newGoals);
      } else if (newScore < goalsTeam2.length) {
        setGoalsTeam2(goalsTeam2.slice(0, newScore));
      }
    }
  };

  // Update goal details
  const updateGoal = (team, index, field, value) => {
    if (team === 1) {
      const newGoals = [...goalsTeam1];
      newGoals[index] = { ...newGoals[index], [field]: value };
      setGoalsTeam1(newGoals);
    } else {
      const newGoals = [...goalsTeam2];
      newGoals[index] = { ...newGoals[index], [field]: value };
      setGoalsTeam2(newGoals);
    }
  };

  // Calculate current score based on entered goals
  const getEnteredScore = (team) => {
    const goals = team === 1 ? goalsTeam1 : goalsTeam2;
    return goals.filter(g => g.scorer).length;
  };

  // Handle publish
  const handlePublish = () => {
    // Validate required fields
    if (!team1 || !team2) {
      alert('Please enter both team names');
      return;
    }
    
    if (team1Players.length === 0 || team2Players.length === 0) {
      alert('Please select players for both teams');
      return;
    }

    // Validate that both teams have the same number of starting lineup players
    const team1StartingCount = team1Players.filter(p => !p.isSubstitute).length;
    const team2StartingCount = team2Players.filter(p => !p.isSubstitute).length;
    
    if (team1StartingCount !== team2StartingCount) {
      alert(`Both teams must have the same number of players in the starting lineup.\n\n${team1}: ${team1StartingCount} starting players\n${team2}: ${team2StartingCount} starting players\n\nPlease adjust the lineups to match.`);
      return;
    }

    // Prepare match data
    const matchData = {
      id: (Date.now() * 1000 + Math.floor(Math.random() * 999)).toString(),
      type: 'result-entry',
      tournament: matchType === 'friendly' ? 'Friendly Match' : tournaments.find(t => t.id === matchType)?.name,
      tournamentId: matchType === 'friendly' ? null : matchType,
      tournamentStage: matchType === 'friendly' ? null : tournamentStage,
      team1,
      team2,
      teamA: team1,
      teamB: team2,
      scoreA,
      scoreB,
      team1Players,
      team2Players,
      goalsTeam1,
      goalsTeam2,
      status: 'completed',
      date: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString(),
      matchTime: matchTime || null, // Store the user-entered time (HH:mm format)
      isLiveScored: false,
      completedAt: new Date().toISOString() // Add completion timestamp
    };

    onPublish(matchData);
  };

  const selectedTournament = tournaments.find(t => t.id === matchType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-medium">Enter Match Result</h1>
            <p className="text-sm text-gray-600">Add details for a completed match</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 pb-24">
        {/* Match Type */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg">Match Type</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tournament / Friendly</label>
            <Select value={matchType} onValueChange={setMatchType}>
              <SelectTrigger className="py-6 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Select match type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly Match</SelectItem>
                {tournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tournament Stage */}
          {matchType !== 'friendly' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Tournament Stage</label>
              <Select value={tournamentStage} onValueChange={setTournamentStage}>
                <SelectTrigger className="py-6 border border-gray-300 rounded-lg">
                  <SelectValue placeholder="Select tournament stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group-stage">Group Stage</SelectItem>
                  <SelectItem value="round-robin">Round Robin League</SelectItem>
                  <SelectItem value="round-of-32">Round of 32</SelectItem>
                  <SelectItem value="round-of-16">Round of 16</SelectItem>
                  <SelectItem value="quarter-final">Quarter Final</SelectItem>
                  <SelectItem value="semi-final">Semi Final</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="losers-final">Loser's Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg">Teams</h2>
          
          {/* Team 1 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Team 1</label>
            <Select value={team1} onValueChange={setTeam1}>
              <SelectTrigger className="py-6 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Select team 1" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team 2 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Team 2</label>
            <Select value={team2} onValueChange={setTeam2}>
              <SelectTrigger className="py-6 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Select team 2" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => t.name !== team1).map(team => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg">Match Date & Time</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="py-6 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Time</label>
            <Input
              type="time"
              value={matchTime}
              onChange={(e) => setMatchTime(e.target.value)}
              className="py-6 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Players Selection */}
        {team1 && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg">{team1} Players</h2>
              <div className="text-sm text-gray-600">
                {team1Players.length} selected
                {team1Players.length > 0 && (
                  <span className="ml-2 text-green-700">
                    ({team1Players.filter(p => !p.isSubstitute).length} starting)
                  </span>
                )}
              </div>
            </div>
            
            <Button
              onClick={() => handleOpenPlayerDialog(1)}
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl py-6 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Select Players
            </Button>

            {team1Players.length > 0 && (
              <div className="space-y-2">
                {team1Players.map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${player.isSubstitute ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {player.isSubstitute ? 'Substitute' : 'Starting Lineup'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {team2 && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg">{team2} Players</h2>
              <div className="text-sm text-gray-600">
                {team2Players.length} selected
                {team2Players.length > 0 && (
                  <span className="ml-2 text-green-700">
                    ({team2Players.filter(p => !p.isSubstitute).length} starting)
                  </span>
                )}
              </div>
            </div>
            
            <Button
              onClick={() => handleOpenPlayerDialog(2)}
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl py-6 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Select Players
            </Button>

            {team2Players.length > 0 && (
              <div className="space-y-2">
                {team2Players.map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${player.isSubstitute ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {player.isSubstitute ? 'Substitute' : 'Starting Lineup'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Final Score */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg">Final Score</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-center">{team1 || 'Team 1'}</label>
              <Input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => handleScoreChange(1, e.target.value)}
                className="text-center text-2xl font-bold py-6"
                placeholder="0"
              />
            </div>
            
            <div className="text-2xl font-bold text-gray-400">-</div>
            
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-center">{team2 || 'Team 2'}</label>
              <Input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => handleScoreChange(2, e.target.value)}
                className="text-center text-2xl font-bold py-6"
                placeholder="0"
              />
            </div>
          </div>

          {/* Current Score Display */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 text-center mb-2">Goals Entered</div>
            <div className="text-3xl font-bold text-center text-purple-900">
              {getEnteredScore(1)} - {getEnteredScore(2)}
            </div>
          </div>
        </div>

        {/* Goal Details - Team 1 */}
        {goalsTeam1.length > 0 && team1Players.length > 0 && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-lg">{team1} Goals</h2>
            
            {goalsTeam1.map((goal, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Goal {idx + 1}</h3>
                  {goal.scorer && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>

                {/* Own Goal Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`own-goal-t1-${idx}`}
                    checked={goal.ownGoal}
                    onCheckedChange={(checked) => updateGoal(1, idx, 'ownGoal', checked)}
                  />
                  <label htmlFor={`own-goal-t1-${idx}`} className="text-sm font-medium cursor-pointer">
                    Own Goal
                  </label>
                </div>

                {/* Goal Scorer */}
                {!goal.ownGoal && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Goal Scorer</label>
                    <Select 
                      value={goal.scorer} 
                      onValueChange={(value) => updateGoal(1, idx, 'scorer', value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select scorer" />
                      </SelectTrigger>
                      <SelectContent>
                        {team1Players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Own Goal Scorer (from opposing team) */}
                {goal.ownGoal && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Own Goal by ({team2})</label>
                    <Select 
                      value={goal.scorer} 
                      onValueChange={(value) => updateGoal(1, idx, 'scorer', value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {team2Players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assist */}
                {!goal.ownGoal && goal.scorer && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Assist (Optional)</label>
                    <Select 
                      value={goal.assist || 'no-assist'} 
                      onValueChange={(value) => updateGoal(1, idx, 'assist', value === 'no-assist' ? '' : value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select assist or skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-assist">No Assist</SelectItem>
                        {team1Players
                          .filter(p => p.id !== goal.scorer)
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Goal Details - Team 2 */}
        {goalsTeam2.length > 0 && team2Players.length > 0 && (
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-lg">{team2} Goals</h2>
            
            {goalsTeam2.map((goal, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Goal {idx + 1}</h3>
                  {goal.scorer && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>

                {/* Own Goal Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`own-goal-t2-${idx}`}
                    checked={goal.ownGoal}
                    onCheckedChange={(checked) => updateGoal(2, idx, 'ownGoal', checked)}
                  />
                  <label htmlFor={`own-goal-t2-${idx}`} className="text-sm font-medium cursor-pointer">
                    Own Goal
                  </label>
                </div>

                {/* Goal Scorer */}
                {!goal.ownGoal && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Goal Scorer</label>
                    <Select 
                      value={goal.scorer} 
                      onValueChange={(value) => updateGoal(2, idx, 'scorer', value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select scorer" />
                      </SelectTrigger>
                      <SelectContent>
                        {team2Players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Own Goal Scorer (from opposing team) */}
                {goal.ownGoal && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Own Goal by ({team1})</label>
                    <Select 
                      value={goal.scorer} 
                      onValueChange={(value) => updateGoal(2, idx, 'scorer', value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {team1Players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assist */}
                {!goal.ownGoal && goal.scorer && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Assist (Optional)</label>
                    <Select 
                      value={goal.assist || 'no-assist'} 
                      onValueChange={(value) => updateGoal(2, idx, 'assist', value === 'no-assist' ? '' : value)}
                    >
                      <SelectTrigger className="py-4 border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select assist or skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-assist">No Assist</SelectItem>
                        {team2Players
                          .filter(p => p.id !== goal.scorer)
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 py-6 rounded-xl text-base font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl text-base font-medium"
          >
            Publish Results
          </Button>
        </div>
      </div>

      {/* Player Selection Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Select Players for {currentTeamForPlayers === 1 ? team1 : team2}
            </DialogTitle>
            <DialogDescription>
              Choose players who participated in this match
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {getAvailablePlayersForTeam(currentTeamForPlayers === 1 ? team1 : team2).map(player => {
              const isSelected = selectedPlayersInDialog.includes(player.id);
              
              return (
                <div key={player.id} className="space-y-2">
                  <div 
                    onClick={() => handlePlayerToggle(player)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handlePlayerToggle(player)}
                      />
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-600">#{player.jerseyNumber || '--'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Lineup Status Selection */}
                  {isSelected && (
                    <div className="ml-10 flex gap-2">
                      <button
                        onClick={() => handleLineupStatusChange(player.id, 'starting')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          playerLineupStatus[player.id] === 'starting'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Starting Lineup
                      </button>
                      <button
                        onClick={() => handleLineupStatusChange(player.id, 'substitute')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          playerLineupStatus[player.id] === 'substitute'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Substitute
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowPlayerDialog(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPlayerSelection}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm ({selectedPlayersInDialog.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnterMatchResult;