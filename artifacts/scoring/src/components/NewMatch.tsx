// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, ChevronDown, Plus, X, User, Users as UsersIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import AddTeam from './AddTeam';
import UserAutocompleteInput from './UserAutocompleteInput';
import { addTeamToMasterTable, findTeamByName, linkTeamToTournament } from '../utils/teamManagement';

const TeamAutocomplete = ({ value, onChange, onAddTeam, placeholder, teamsList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTeams = teamsList.filter(team =>
    team.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelectTeam = (team) => {
    setInputValue(team);
    onChange(team);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        className="pl-12 py-4 border border-gray-300 rounded-lg"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredTeams.length > 0 ? (
            <>
              {filteredTeams.map((team, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectTeam(team)}
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {team}
                </button>
              ))}
            </>
          ) : inputValue && (
            <div className="px-4 py-3 text-gray-400 text-sm">
              No teams found
            </div>
          )}
          
          {onAddTeam && (
            <button
              onClick={() => {
                setIsOpen(false);
                onAddTeam();
              }}
              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-t-2 border-purple-200 text-purple-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const NewMatch = ({ onBack, onSelectSquad = () => {}, registeredTeams = [], onAddTeam, playerDatabase = [], onAssignPlayerToTeam, onAddPlayer, currentUser }) => {
  const [selectedTournament, setSelectedTournament] = useState('friendly');
  const [tournaments, setTournaments] = useState([]);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matchFormat, setMatchFormat] = useState('');
  const [duration, setDuration] = useState('');
  const [venue, setVenue] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('');
  const [scoringLevel, setScoringLevel] = useState('basic');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [tournamentStage, setTournamentStage] = useState(''); // New state for tournament stage
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [sameTeamError, setSameTeamError] = useState('');
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [allTeamsFromDb, setAllTeamsFromDb] = useState([]);
  const teamInputRef = useRef(null);

  // Scorer assignment states
  const [primaryScorer, setPrimaryScorer] = useState(null);
  const [primaryScorerInput, setPrimaryScorerInput] = useState('');
  const [secondaryScorer, setSecondaryScorer] = useState(null);
  const [secondaryScorerInput, setSecondaryScorerInput] = useState('');
  const [responsibilityType, setResponsibilityType] = useState(''); // 'team' or 'event'
  const [teamScorerMapping, setTeamScorerMapping] = useState({ team1: '', team2: '' }); // { team1: user_id, team2: user_id }

  // Get registered users (players with owner_user_id)
  const registeredUsers = playerDatabase
    .filter(p => p.owner_user_id)
    .map(p => ({
      id: p.owner_user_id,
      name: p.name,
      email: p.email,
      phoneNumber: p.phoneNumber,
      imageUrl: p.imageUrl,
      owner_user_id: p.owner_user_id
    }));

  // Remove duplicates by user_id
  const uniqueRegisteredUsers = registeredUsers.reduce((acc, user) => {
    if (!acc.find(u => u.id === user.id)) {
      acc.push(user);
    }
    return acc;
  }, []);

  // Load tournaments and teams from localStorage on mount
  useEffect(() => {
    const loadedTournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    console.log('📋 Loaded tournaments from localStorage:', loadedTournaments);
    console.log('📊 Number of tournaments:', loadedTournaments.length);
    
    // Only update state if tournaments actually changed to prevent unnecessary re-renders
    setTournaments(prevTournaments => {
      const prevIds = prevTournaments.map(t => t.id).sort().join(',');
      const newIds = loadedTournaments.map(t => t.id).sort().join(',');
      
      // If IDs match, check if data actually changed
      if (prevIds === newIds) {
        const hasChanged = JSON.stringify(prevTournaments) !== JSON.stringify(loadedTournaments);
        if (!hasChanged) {
          console.log('📋 Tournaments unchanged, skipping state update');
          return prevTournaments;
        }
      }
      
      console.log('📋 Tournaments updated');
      return loadedTournaments;
    });
    
    const loadedTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
    console.log('⚽ Loaded teams from localStorage:', loadedTeams);
    
    setAllTeamsFromDb(prevTeams => {
      const hasChanged = JSON.stringify(prevTeams) !== JSON.stringify(loadedTeams);
      if (!hasChanged) {
        console.log('⚽ Teams unchanged, skipping state update');
        return prevTeams;
      }
      console.log('⚽ Teams updated');
      return loadedTeams;
    });
  }, []); // Empty dependency array - only run once on mount

  // Set default primary scorer to current user
  useEffect(() => {
    if (currentUser && !primaryScorer) {
      const displayName =
        currentUser.display_name || currentUser.email || currentUser.mobile_number || 'Me';
      setPrimaryScorer({ user_id: currentUser.user_id, name: displayName });
      setPrimaryScorerInput(displayName);
    }
  }, [currentUser]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teamInputRef.current && !teamInputRef.current.contains(event.target)) {
        setShowTeamSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get teams from database that are not already in the tournament
  const getAvailableTeamsForTournament = () => {
    return allTeamsFromDb.filter(team => 
      !tournamentTeams.includes(team.name)
    );
  };

  // Filter teams based on search input
  const getFilteredTeamSuggestions = () => {
    const availableTeams = getAvailableTeamsForTournament();
    if (!newTeamName.trim()) return availableTeams;
    
    return availableTeams.filter(team =>
      team.name.toLowerCase().includes(newTeamName.toLowerCase())
    );
  };

  // Add team to tournament's participating teams list
  const handleAddTeamToTournament = () => {
    if (newTeamName.trim()) {
      const teamName = newTeamName.trim();
      
      // Check if team already exists in tournament teams
      if (tournamentTeams.includes(teamName)) {
        alert('This team is already in the tournament');
        setNewTeamName('');
        return;
      }
      
      // Check if team exists in Master Teams Table
      let teamToAdd = findTeamByName(teamName);
      
      // If team doesn't exist in Master Teams, create it
      if (!teamToAdd) {
        const teamId = addTeamToMasterTable({
          name: teamName,
          coach: '',
          homeVenue: '',
          description: '',
          imageUrl: '',
          players: []
        });
        
        teamToAdd = {
          id: teamId,
          name: teamName,
          coach: '',
          homeVenue: '',
          players: []
        };
        
        // Also add to legacy storage for backward compatibility
        const existingTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
        const updatedTeams = [...existingTeams, teamToAdd];
        localStorage.setItem('vscor_teams', JSON.stringify(updatedTeams));
        setAllTeamsFromDb(updatedTeams);
        
        console.log('✅ New team added to Master Teams Table:', teamToAdd);
      }
      
      // Link team to tournament if it's not a friendly match
      if (selectedTournament && selectedTournament !== 'friendly') {
        const tournament = tournaments.find(t => t.name === selectedTournament);
        if (tournament) {
          linkTeamToTournament(tournament.id, teamToAdd.id);
          console.log('✅ Team linked to tournament:', { tournamentId: tournament.id, teamId: teamToAdd.id });
        }
      }
      
      // Add team to tournament's participating teams
      const updatedTeams = [...tournamentTeams, teamToAdd.name];
      setTournamentTeams(updatedTeams);
      
      // Update tournament in localStorage with team ID and name
      const updatedTournaments = tournaments.map(t => {
        if (t.id.toString() === selectedTournament) {
          const participatingTeams = t.participatingTeams || [];
          return {
            ...t,
            participatingTeams: [
              ...participatingTeams,
              { id: teamToAdd.id, name: teamToAdd.name }
            ]
          };
        }
        return t;
      });
      localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
      setTournaments(updatedTournaments);
      
      setNewTeamName('');
    }
  };

  // Select existing team from dropdown
  const handleSelectExistingTeam = (team) => {
    setNewTeamName(team.name);
    
    // Add team to tournament immediately
    setTimeout(() => {
      // Check if team already exists in tournament teams
      if (tournamentTeams.includes(team.name)) {
        alert('This team is already in the tournament');
        setNewTeamName('');
        return;
      }
      
      // Add team to tournament's participating teams
      const updatedTeams = [...tournamentTeams, team.name];
      setTournamentTeams(updatedTeams);
      
      // Update tournament in localStorage with team ID and name
      const updatedTournaments = tournaments.map(t => {
        if (t.id.toString() === selectedTournament) {
          const participatingTeams = t.participatingTeams || [];
          return {
            ...t,
            participatingTeams: [
              ...participatingTeams,
              { id: team.id, name: team.name }
            ]
          };
        }
        return t;
      });
      localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
      setTournaments(updatedTournaments);
      
      setNewTeamName('');
      setShowTeamSuggestions(false);
    }, 0);
  };

  // Remove team from tournament's participating teams list
  const handleRemoveTeamFromTournament = (teamName) => {
    const updatedTeams = tournamentTeams.filter(t => t !== teamName);
    setTournamentTeams(updatedTeams);
    
    // Update tournament in localStorage
    const updatedTournaments = tournaments.map(t => {
      if (t.id.toString() === selectedTournament) {
        return {
          ...t,
          participatingTeams: (t.participatingTeams || []).filter(team => team.name !== teamName)
        };
      }
      return t;
    });
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    setTournaments(updatedTournaments);
    
    // Clear team selections if they were removed
    if (team1 === teamName) setTeam1('');
    if (team2 === teamName) setTeam2('');
  };

  // Handle tournament selection
  const handleTournamentChange = (value) => {
    console.log('🎯 Tournament selected:', value);
    setSelectedTournament(value);
    
    if (value === 'friendly') {
      console.log('✅ Friendly match selected - resetting teams');
      // Reset to all registered teams for friendly match
      setTournamentTeams([]);
      setDuration('');
      setPlayersPerTeam('');
      setTeam1('');
      setTeam2('');
      setTournamentStage(''); // Reset stage for friendly matches
    } else {
      // Find selected tournament and prefill data
      const tournament = tournaments.find(t => t.id.toString() === value);
      console.log('🔍 Found tournament:', tournament);
      if (tournament) {
        // Load participating teams from tournament
        const participatingTeamNames = (tournament.participatingTeams || []).map(t => t.name);
        console.log('👥 Participating teams:', participatingTeamNames);
        setTournamentTeams(participatingTeamNames);
        
        // Prefill match details from tournament
        if (tournament.matchDuration) {
          console.log('⏱️ Setting duration:', tournament.matchDuration);
          setDuration(tournament.matchDuration.toString());
        }
        if (tournament.playersPerTeam) {
          console.log('👤 Setting players per team:', tournament.playersPerTeam);
          setPlayersPerTeam(tournament.playersPerTeam.toString());
        }
        
        // Reset team selections when tournament changes
        setTeam1('');
        setTeam2('');
        setTournamentStage(''); // Reset stage when tournament changes
      } else {
        console.error('❌ Tournament not found with ID:', value);
      }
    }
  };

  // Determine which teams list to use
  const availableTeams = selectedTournament && selectedTournament !== 'friendly' 
    ? tournamentTeams 
    : registeredTeams;

  const handleTeam1Change = (value) => {
    setTeam1(value);
    if (value && team2 && value.toLowerCase().trim() === team2.toLowerCase().trim()) {
      setSameTeamError('Teams cannot be the same');
      setTeam1('');
    } else {
      setSameTeamError('');
    }
  };

  const handleTeam2Change = (value) => {
    setTeam2(value);
    if (value && team1 && value.toLowerCase().trim() === team1.toLowerCase().trim()) {
      setSameTeamError('Teams cannot be the same');
      setTeam2('');
    } else {
      setSameTeamError('');
    }
  };

  const handleSubmit = () => {
    // Validate scorer assignment
    if (!primaryScorer) {
      alert('Please assign a primary scorer before proceeding');
      return;
    }

    // Validate dual-scorer responsibility division
    if (secondaryScorer && scoringLevel === 'advanced') {
      if (!responsibilityType) {
        alert('Please select how responsibilities will be divided between the two scorers');
        return;
      }

      if (responsibilityType === 'team' && (!teamScorerMapping.team1 || !teamScorerMapping.team2)) {
        alert('Please assign both teams to scorers');
        return;
      }
    }

    const selectedTournamentData = tournaments.find(t => t.id.toString() === selectedTournament);
    
    // Define event scorer mapping for event-based division
    // NOTE: Event types must match EXACTLY with the button types in LiveScoring.tsx
    const eventScorerMapping = responsibilityType === 'event' && secondaryScorer ? {
      [primaryScorer.user_id]: ['goal', 'shot_on_target', 'off_target', 'foul'],
      [secondaryScorer.user_id]: ['interception', 'offside', 'substitution', 'corner']
    } : null;
    
    const matchDetails = {
      team1,
      team2,
      matchFormat,
      duration,
      venue,
      playersPerTeam,
      scoreA: 0,
      scoreB: 0,
      startTime: new Date(),
      events: [],
      tournament: selectedTournament === 'friendly' ? 'Friendly Match' : selectedTournamentData?.name,
      tournamentId: selectedTournament === 'friendly' ? null : selectedTournament,
      tournamentStage: selectedTournament !== 'friendly' ? tournamentStage : null,
      scoringLevel,
      // Match ownership and scorer metadata (NEW STRUCTURE)
      ownedBy: currentUser?.user_id,          // Match owner (creator, can be transferred)
      scoredBy1: primaryScorer?.user_id,      // Primary scorer
      scoredBy2: secondaryScorer?.user_id || null, // Secondary scorer (optional)
      // Legacy fields for backward compatibility
      owner_user_id: currentUser?.user_id,
      primaryScorer,
      secondaryScorer: secondaryScorer || null,
      responsibilityType: responsibilityType || null,
      teamScorerMapping: responsibilityType === 'team' ? teamScorerMapping : null,
      eventScorerMapping: eventScorerMapping
    };
    onSelectSquad(matchDetails);
  };

  const handleAddTeamBack = () => {
    setShowAddTeam(false);
  };

  if (showAddTeam) {
    return <AddTeam onBack={handleAddTeamBack} onAddTeam={onAddTeam} playerDatabase={playerDatabase} onAssignPlayerToTeam={onAssignPlayerToTeam} onAddPlayer={onAddPlayer} />;
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-medium">New Match</h1>
      </div>

      <div className="space-y-6">
        {sameTeamError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {sameTeamError}
          </div>
        )}

        {/* Tournament Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Tournament / Match Type</label>
          <Select value={selectedTournament} onValueChange={handleTournamentChange}>
            <SelectTrigger className="py-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="Select tournament or friendly match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly Match</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id.toString()}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
            Select a tournament or choose friendly match
          </p>
        </div>

        {/* Tournament Stage Selection - Only show if tournament is selected (not friendly) */}
        {selectedTournament && selectedTournament !== 'friendly' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Tournament Stage</label>
            <Select value={tournamentStage} onValueChange={setTournamentStage}>
              <SelectTrigger className="py-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
              Select the stage of the tournament for this match
            </p>
          </div>
        )}

        {/* Tournament Teams Management - Only show if tournament is selected */}
        {selectedTournament && selectedTournament !== 'friendly' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-purple-900">Participating Teams</h3>
            
            {/* List of tournament teams */}
            {tournamentTeams.length > 0 && (
              <div className="space-y-2">
                {tournamentTeams.map((teamName, index) => (
                  <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                    <span className="text-sm">{teamName}</span>
                    <button
                      onClick={() => handleRemoveTeamFromTournament(teamName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add team to tournament with autocomplete */}
            <div ref={teamInputRef} className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Search or add team to tournament"
                  value={newTeamName}
                  onChange={(e) => {
                    setNewTeamName(e.target.value);
                    setShowTeamSuggestions(true);
                  }}
                  onFocus={() => setShowTeamSuggestions(true)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTeamToTournament();
                      setShowTeamSuggestions(false);
                    }
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg"
                />
                <Button
                  onClick={() => {
                    handleAddTeamToTournament();
                    setShowTeamSuggestions(false);
                  }}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  disabled={!newTeamName.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Team suggestions dropdown */}
              {showTeamSuggestions && newTeamName && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredTeamSuggestions().length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                        Existing Teams (Click to add)
                      </div>
                      {getFilteredTeamSuggestions().map((team) => (
                        <button
                          key={team.id}
                          onClick={() => handleSelectExistingTeam(team)}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">{team.name}</div>
                          {team.coach && (
                            <div className="text-xs text-gray-500">Coach: {team.coach}</div>
                          )}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No existing teams found
                    </div>
                  )}
                  
                  {/* Add new team option */}
                  {newTeamName.trim() && !getFilteredTeamSuggestions().some(t => t.name.toLowerCase() === newTeamName.toLowerCase()) && (
                    <button
                      onClick={() => {
                        handleAddTeamToTournament();
                        setShowTeamSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors border-t-2 border-purple-200 bg-purple-50"
                    >
                      <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                        <Plus className="w-4 h-4" />
                        <span>Add new team "{newTeamName}"</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-xs text-purple-700">
              Search for existing teams or type a new team name to add to this tournament.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <TeamAutocomplete
            value={team1}
            onChange={handleTeam1Change}
            onAddTeam={selectedTournament === 'friendly' ? () => setShowAddTeam(true) : null}
            placeholder="Team 1"
            teamsList={availableTeams}
          />
          <p className="text-sm text-gray-600 px-1">
            {selectedTournament === 'friendly' 
              ? "Choose 'Add a team' to register your team, if not already registered."
              : "Select from participating teams in the tournament."}
          </p>
        </div>

        <div className="space-y-2">
          <TeamAutocomplete
            value={team2}
            onChange={handleTeam2Change}
            onAddTeam={selectedTournament === 'friendly' ? () => setShowAddTeam(true) : null}
            placeholder="Team 2"
            teamsList={availableTeams}
          />
          <p className="text-sm text-gray-600 px-1">
            {selectedTournament === 'friendly' 
              ? "Choose 'Add a team' to register your team, if not already registered."
              : "Select from participating teams in the tournament."}
          </p>
        </div>

        <div className="space-y-2">
          <Select value={matchFormat} onValueChange={setMatchFormat}>
            <SelectTrigger className="py-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="Match Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Continuous Match</SelectItem>
              <SelectItem value="halves">Two Halves</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
            Select the structure of the match — single continuous or two halves.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={(e) => {
              const value = e.target.value;
              // Allow any input, no restrictions while typing
              setDuration(value);
            }}
            min="5"
            max="90"
            className={`py-4 border rounded-lg ${
              duration && (parseInt(duration) < 5 || parseInt(duration) > 90) 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          <p className={`text-sm px-1 ${
            duration && (parseInt(duration) < 5 || parseInt(duration) > 90)
              ? 'text-red-500'
              : 'text-gray-600'
          }`}>
            Enter the duration for the whole match (5-90 minutes)
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="pl-12 py-4 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Players per team"
            value={playersPerTeam}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 11)) {
                setPlayersPerTeam(value);
              }
            }}
            min="1"
            max="11"
            className="py-4 border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-600 px-1">
            Enter the number of players per team (1-11)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Scoring Level</label>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions((v) => !v)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {showAdvancedOptions ? 'Hide advanced' : 'Advanced options'}
            </button>
          </div>
          {!showAdvancedOptions ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
              Basic scoring — goals, shots, fouls, substitutions, and corners.
            </p>
          ) : (
            <>
          <Select value={scoringLevel} onValueChange={setScoringLevel}>
            <SelectTrigger className="py-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="Select scoring level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - Simple events only</SelectItem>
              <SelectItem value="intermediate-detailed">Intermediate - Basic events + detailed attributes</SelectItem>
              <SelectItem value="intermediate-all">Intermediate - All events without attributes</SelectItem>
              <SelectItem value="advanced">Advanced - All events + detailed attributes</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
            {scoringLevel === 'basic' && 'Track goals, shots, fouls, substitutions, and corners with basic attributes (penalties and cards)'}
            {scoringLevel === 'intermediate-detailed' && 'Track basic events with detailed attributes (goal types, card types, etc.)'}
            {scoringLevel === 'intermediate-all' && 'Track all events including interceptions and offsides with basic attributes (penalties and cards)'}
            {scoringLevel === 'advanced' && 'Full tracking with all events and detailed attributes'}
            {!scoringLevel && 'Choose the level of detail for scoring this match'}
          </p>
            </>
          )}
        </div>

        {/* Scorer Assignment Section */}
        {scoringLevel && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Scorer Assignment</h3>
            </div>

            {/* Primary Scorer */}
            <div className="space-y-2">
              <Label htmlFor="primaryScorer" className="text-sm font-medium">
                Primary Scorer
              </Label>
              <UserAutocompleteInput
                value={primaryScorerInput}
                onChange={setPrimaryScorerInput}
                onSelect={(user) => {
                  setPrimaryScorer({ user_id: user.id, name: user.name });
                  setPrimaryScorerInput(user.name);
                }}
                users={uniqueRegisteredUsers.filter(u => !secondaryScorer || u.id !== secondaryScorer.user_id)}
                placeholder="Search for a user..."
                suggestionSubLabel={(user) => user.email || user.phoneNumber || ''}
              />
              {primaryScorer && (
                <div className="flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{primaryScorer.name}</p>
                    <p className="text-xs text-gray-500">Primary Scorer</p>
                  </div>
                  <button
                    onClick={() => {
                      setPrimaryScorer(null);
                      setPrimaryScorerInput('');
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-blue-700">
                The primary scorer will be responsible for recording match events.
              </p>
            </div>

            {/* Second Scorer - Only for Advanced */}
            {showAdvancedOptions && scoringLevel === 'advanced' && (
              <div className="space-y-2">
                <Label htmlFor="secondaryScorer" className="text-sm font-medium">
                  Second Scorer <span className="text-gray-500 font-normal">(Optional)</span>
                </Label>
                <UserAutocompleteInput
                  value={secondaryScorerInput}
                  onChange={setSecondaryScorerInput}
                  onSelect={(user) => {
                    if (primaryScorer && user.id === primaryScorer.user_id) {
                      alert('Cannot select the same user as both primary and secondary scorer');
                      return;
                    }
                    setSecondaryScorer({ user_id: user.id, name: user.name });
                    setSecondaryScorerInput(user.name);
                  }}
                  users={uniqueRegisteredUsers.filter(u => !primaryScorer || u.id !== primaryScorer.user_id)}
                  placeholder="Search for a second scorer..."
                  suggestionSubLabel={(user) => user.email || user.phoneNumber || ''}
                  disabled={!primaryScorer}
                />
                {secondaryScorer && (
                  <div className="flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{secondaryScorer.name}</p>
                      <p className="text-xs text-gray-500">Secondary Scorer</p>
                    </div>
                    <button
                      onClick={() => {
                        setSecondaryScorer(null);
                        setSecondaryScorerInput('');
                        setResponsibilityType('');
                        setTeamScorerMapping({ team1: '', team2: '' });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {!primaryScorer && (
                  <p className="text-xs text-gray-500">
                    Please select a primary scorer first
                  </p>
                )}
                {primaryScorer && !secondaryScorer && (
                  <p className="text-xs text-blue-700">
                    Add a second scorer for parallel event recording
                  </p>
                )}
              </div>
            )}

            {/* Responsibility Division - Only when two scorers */}
            {showAdvancedOptions && secondaryScorer && scoringLevel === 'advanced' && (
              <div className="space-y-4 p-4 bg-white border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Division of Responsibilities</h4>
                </div>
                
                <RadioGroup value={responsibilityType} onValueChange={setResponsibilityType}>
                  {/* Option A - By Teams */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="team" id="team-based" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="team-based" className="font-medium cursor-pointer">
                          Divide by Teams
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Each scorer records all events for one team
                        </p>
                      </div>
                    </div>
                    
                    {responsibilityType === 'team' && team1 && team2 && (
                      <div className="ml-7 space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{team1}</span>
                          <Select
                            value={teamScorerMapping.team1}
                            onValueChange={(value) => setTeamScorerMapping(prev => ({ ...prev, team1: value }))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign scorer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={primaryScorer.user_id.toString()}>{primaryScorer.name}</SelectItem>
                              <SelectItem value={secondaryScorer.user_id.toString()}>{secondaryScorer.name}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{team2}</span>
                          <Select
                            value={teamScorerMapping.team2}
                            onValueChange={(value) => setTeamScorerMapping(prev => ({ ...prev, team2: value }))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign scorer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={primaryScorer.user_id.toString()}>{primaryScorer.name}</SelectItem>
                              <SelectItem value={secondaryScorer.user_id.toString()}>{secondaryScorer.name}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option B - By Event Types */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="event" id="event-based" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="event-based" className="font-medium cursor-pointer">
                          Divide by Event Types
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Split event types between scorers for parallel recording
                        </p>
                      </div>
                    </div>
                    
                    {responsibilityType === 'event' && (
                      <div className="ml-7 space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-purple-600 mb-2">{primaryScorer.name} records:</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded">Goals</span>
                            <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded">Shots on Target</span>
                            <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded">Off Target</span>
                            <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded">Fouls</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600 mb-2">{secondaryScorer.name} records:</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded">Interceptions</span>
                            <span className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded">Offside</span>
                            <span className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded">Substitutions</span>
                            <span className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded">Corners</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </RadioGroup>

                {!responsibilityType && (
                  <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 p-2 rounded">
                    ⚠️ Please select how responsibilities will be divided between the two scorers
                  </p>
                )}
              </div>
            )}

            {!primaryScorer && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 p-2 rounded">
                ⚠️ Please assign a primary scorer before proceeding
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          disabled={
            !team1 || 
            !team2 || 
            !matchFormat || 
            !duration || 
            !playersPerTeam ||
            !scoringLevel ||
            parseInt(duration) < 5 || 
            parseInt(duration) > 90
          }
        >
          Select squad
        </Button>
      </div>
    </div>
  );
};

export default NewMatch;