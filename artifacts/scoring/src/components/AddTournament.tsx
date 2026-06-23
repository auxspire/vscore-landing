// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, X, Upload, Camera, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { addTeamToMasterTable, findTeamByName } from '../utils/teamManagement';

const AddTournament = ({ onBack, onTournamentCreated, onNavigateToInfoTab, registeredTeams = [], playerDatabase = [], currentUser = null, tournaments = [] }) => {
  const [tournamentName, setTournamentName] = useState('');
  const [place, setPlace] = useState('');
  const [venue, setVenue] = useState('');
  
  // Tags and description
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  
  // Calculate tag popularity from existing tournaments
  const getTagPopularity = () => {
    const tagCounts = {};
    
    // Count tags from all tournaments
    tournaments.forEach(tournament => {
      if (tournament.tags && Array.isArray(tournament.tags)) {
        tournament.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return tagCounts;
  };
  
  // Get all unique tags from tournaments and merge with default suggested tags
  const getAllTags = () => {
    const defaultTags = ['School', 'Under 19', 'Veteran', '7s', '5s', '11s', 'Open', 'Women', 'Junior', 'Senior', 'Corporate', 'Inter-college'];
    const allTagsSet = new Set(defaultTags);
    
    // Add all tags from existing tournaments
    tournaments.forEach(tournament => {
      if (tournament.tags && Array.isArray(tournament.tags)) {
        tournament.tags.forEach(tag => allTagsSet.add(tag));
      }
    });
    
    return Array.from(allTagsSet);
  };
  
  // Get suggested tags sorted by popularity
  const getSuggestedTags = () => {
    const tagPopularity = getTagPopularity();
    const allTags = getAllTags();
    
    // Filter out already selected tags
    const availableTags = allTags.filter(tag => !tags.includes(tag));
    
    // Sort by popularity (descending), then alphabetically
    return availableTags.sort((a, b) => {
      const countA = tagPopularity[a] || 0;
      const countB = tagPopularity[b] || 0;
      
      if (countB !== countA) {
        return countB - countA; // Higher count first
      }
      return a.localeCompare(b); // Alphabetical for same count
    });
  };
  
  const suggestedTags = getSuggestedTags();
  const tagPopularity = getTagPopularity();
  
  // Handle adding tag
  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  // Coordinators state - support up to 3 coordinators
  // Pre-fill first coordinator with current user's information
  const [coordinators, setCoordinators] = useState([
    currentUser ? {
      name: currentUser.display_name || '',
      phone: currentUser.mobile_number || '',
      email: currentUser.email || '',
      user_id: currentUser.user_id
    } : { name: '', phone: '', email: '', user_id: null }
  ]);
  const [coordinatorSearchQuery, setCoordinatorSearchQuery] = useState(['']); // Array of search queries
  const [showCoordinatorSuggestions, setShowCoordinatorSuggestions] = useState([false]); // Array of boolean
  
  // Legacy fields for backward compatibility
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorContact, setCoordinatorContact] = useState('');

  // Get registered users from playerDatabase (players with owner_user_id)
  const getRegisteredUsers = () => {
    if (!playerDatabase || playerDatabase.length === 0) return [];
    
    // Get unique users by owner_user_id
    const usersMap = new Map();
    playerDatabase.forEach(player => {
      if (player.owner_user_id && !usersMap.has(player.owner_user_id)) {
        usersMap.set(player.owner_user_id, {
          user_id: player.owner_user_id,
          name: player.name,
          phone: player.phoneNumber || player.phone || '',
          email: player.email || '',
          imageUrl: player.imageUrl || ''
        });
      }
    });
    
    return Array.from(usersMap.values());
  };

  // Filter users based on search query
  const getFilteredUsers = (searchQuery, excludeUserIds = []) => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    
    const registeredUsers = getRegisteredUsers();
    const query = searchQuery.toLowerCase();
    
    return registeredUsers.filter(user => 
      !excludeUserIds.includes(user.user_id) &&
      (user.name.toLowerCase().includes(query) ||
       user.phone.includes(query) ||
       user.email.toLowerCase().includes(query))
    );
  };

  // Handle coordinator user selection
  const handleSelectUser = (index, user) => {
    const newCoords = [...coordinators];
    newCoords[index] = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      user_id: user.user_id
    };
    setCoordinators(newCoords);
    
    // Clear search query and hide suggestions
    const newQueries = [...coordinatorSearchQuery];
    newQueries[index] = '';
    setCoordinatorSearchQuery(newQueries);
    
    const newShowSuggestions = [...showCoordinatorSuggestions];
    newShowSuggestions[index] = false;
    setShowCoordinatorSuggestions(newShowSuggestions);
  };
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('');
  const [matchDuration, setMatchDuration] = useState('');
  const [maxNumberOfTeams, setMaxNumberOfTeams] = useState('');
  const [tournamentFormat, setTournamentFormat] = useState('');
  const [participatingTeams, setParticipatingTeams] = useState([]);
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [firstPrize, setFirstPrize] = useState('');
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    coach: '',
    homeVenue: ''
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Format-specific fields
  const [roundRobinRounds, setRoundRobinRounds] = useState('1'); // 1 = Single, 2 = Double
  const [numberOfGroups, setNumberOfGroups] = useState('');
  const [teamsPerGroup, setTeamsPerGroup] = useState('');
  const [teamsProgressingPerGroup, setTeamsProgressingPerGroup] = useState('');
  
  // Calculated values
  const [knockoutStages, setKnockoutStages] = useState([]);
  const [byesRequired, setByesRequired] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [groupConfigWarning, setGroupConfigWarning] = useState('');
  
  // Group + Knockout calculated values
  const [totalDirectQualifiers, setTotalDirectQualifiers] = useState(0);
  const [knockoutBracketSize, setKnockoutBracketSize] = useState(0);
  const [bestNextPlacedTeams, setBestNextPlacedTeams] = useState(0);
  const [knockoutStartingRound, setKnockoutStartingRound] = useState('');

  const formats = [
    { value: 'league_round_robin', label: 'League (Round Robin)' },
    { value: 'knockout', label: 'Knockout' },
    { value: 'group_stage___knockout', label: 'Group Stage + Knockout' },
    { value: 'other_manual', label: 'Other Format (Manual Fixture Entry)' }
  ];

  // Calculate knockout stages and byes
  useEffect(() => {
    if (tournamentFormat === 'knockout' && maxNumberOfTeams) {
      const numTeams = parseInt(maxNumberOfTeams);
      if (numTeams > 0) {
        // Find next power of 2
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
        const byes = nextPowerOf2 - numTeams;
        
        // Calculate stages
        const stages = [];
        let teamsInRound = nextPowerOf2;
        
        // Add preliminary round if there are byes
        if (byes > 0) {
          stages.push(`Preliminary Round (${numTeams - byes} teams)`);
          teamsInRound = nextPowerOf2 / 2;
        }
        
        // Add remaining rounds
        while (teamsInRound >= 2) {
          if (teamsInRound === 2) {
            stages.push('Final');
          } else if (teamsInRound === 4) {
            stages.push('Semifinals');
          } else if (teamsInRound === 8) {
            stages.push('Quarterfinals');
          } else if (teamsInRound === 16) {
            stages.push('Round of 16');
          } else if (teamsInRound === 32) {
            stages.push('Round of 32');
          } else {
            stages.push(`Round of ${teamsInRound}`);
          }
          teamsInRound = teamsInRound / 2;
        }
        
        setKnockoutStages(stages);
        setByesRequired(byes);
        
        // Calculate total matches (n-1 for knockout)
        setTotalMatches(numTeams - 1);
      }
    }
  }, [tournamentFormat, maxNumberOfTeams]);

  // Calculate total matches for league format
  useEffect(() => {
    if (tournamentFormat === 'league_round_robin' && maxNumberOfTeams && roundRobinRounds) {
      const numTeams = parseInt(maxNumberOfTeams);
      const rounds = parseInt(roundRobinRounds);
      if (numTeams > 1) {
        // Total matches = (n * (n-1) / 2) * rounds
        const matches = (numTeams * (numTeams - 1) / 2) * rounds;
        setTotalMatches(matches);
      }
    }
  }, [tournamentFormat, maxNumberOfTeams, roundRobinRounds]);

  // Auto-calculate groups configuration
  useEffect(() => {
    if (tournamentFormat === 'group_stage___knockout' && maxNumberOfTeams) {
      const maxTeams = parseInt(maxNumberOfTeams);
      
      if (numberOfGroups && !teamsPerGroup) {
        const groups = parseInt(numberOfGroups);
        if (groups > 0) {
          const teamsPerGrp = Math.floor(maxTeams / groups);
          const remainder = maxTeams % groups;
          setTeamsPerGroup(teamsPerGrp.toString());
          
          if (remainder > 0) {
            setGroupConfigWarning(`${groups} groups × ${teamsPerGrp} teams = ${groups * teamsPerGrp} teams. Remainder: ${remainder} team(s)`);
          } else {
            setGroupConfigWarning('');
          }
        }
      } else if (teamsPerGroup && !numberOfGroups) {
        const teamsPerGrp = parseInt(teamsPerGroup);
        if (teamsPerGrp > 0) {
          const groups = Math.floor(maxTeams / teamsPerGrp);
          const remainder = maxTeams % teamsPerGrp;
          setNumberOfGroups(groups.toString());
          
          if (remainder > 0) {
            setGroupConfigWarning(`${groups} groups × ${teamsPerGrp} teams = ${groups * teamsPerGrp} teams. Remainder: ${remainder} team(s)`);
          } else {
            setGroupConfigWarning('');
          }
        }
      } else if (numberOfGroups && teamsPerGroup) {
        const groups = parseInt(numberOfGroups);
        const teamsPerGrp = parseInt(teamsPerGroup);
        const total = groups * teamsPerGrp;
        
        if (total !== maxTeams) {
          setGroupConfigWarning(`⚠️ Total capacity (${total}) does not match Max Teams (${maxTeams})`);
        } else {
          setGroupConfigWarning('');
        }
      }
    }
  }, [tournamentFormat, maxNumberOfTeams, numberOfGroups, teamsPerGroup]);

  // Calculate knockout qualification for Group + Knockout format
  useEffect(() => {
    if (tournamentFormat === 'group_stage___knockout' && numberOfGroups && teamsProgressingPerGroup) {
      const groups = parseInt(numberOfGroups);
      const progressingPerGroup = parseInt(teamsProgressingPerGroup);
      
      if (groups > 0 && progressingPerGroup > 0) {
        // Step 1: Calculate total direct qualifiers
        const directQualifiers = groups * progressingPerGroup;
        setTotalDirectQualifiers(directQualifiers);
        
        // Step 2: Find next power of 2 for knockout bracket size
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(directQualifiers)));
        setKnockoutBracketSize(bracketSize);
        
        // Step 3: Calculate best next-placed teams needed
        const additionalTeams = bracketSize - directQualifiers;
        setBestNextPlacedTeams(additionalTeams);
        
        // Step 4: Determine knockout starting round
        let roundName = '';
        if (bracketSize === 2) roundName = 'Final';
        else if (bracketSize === 4) roundName = 'Semifinals';
        else if (bracketSize === 8) roundName = 'Quarterfinals';
        else if (bracketSize === 16) roundName = 'Round of 16';
        else if (bracketSize === 32) roundName = 'Round of 32';
        else if (bracketSize === 64) roundName = 'Round of 64';
        else roundName = `Round of ${bracketSize}`;
        setKnockoutStartingRound(roundName);
      }
    }
  }, [tournamentFormat, numberOfGroups, teamsProgressingPerGroup]);
  
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImageUrl(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImageUrl('');
    setImagePreview('');
  };

  // Filter teams based on current input
  const getFilteredTeams = () => {
    if (!currentTeamName.trim()) return registeredTeams;
    return registeredTeams.filter(team =>
      team.name.toLowerCase().includes(currentTeamName.toLowerCase()) &&
      !participatingTeams.some(pt => pt.id === team.id)
    );
  };

  const addExistingTeam = (team) => {
    if (!participatingTeams.some(pt => pt.id === team.id)) {
      setParticipatingTeams([...participatingTeams, team]);
      setCurrentTeamName('');
      setShowTeamSuggestions(false);
    }
  };

  const addNewTeam = () => {
    if (!newTeamData.name.trim()) {
      alert('Team name is required!');
      return;
    }

    // Check max teams limit
    const maxTeams = parseInt(maxNumberOfTeams);
    if (maxTeams && participatingTeams.length >= maxTeams) {
      alert(`Maximum team limit reached (${maxTeams}). Cannot add more teams.`);
      return;
    }

    // Check if team already exists in Master Teams Table
    const existingTeam = findTeamByName(newTeamData.name.trim());
    if (existingTeam) {
      // Team already exists - ask user if they want to use existing team
      if (window.confirm(`A team named "${newTeamData.name.trim()}" already exists. Do you want to add the existing team to this tournament?`)) {
        // Add existing team to participating teams
        if (!participatingTeams.some(t => t.id === existingTeam.id)) {
          setParticipatingTeams([...participatingTeams, existingTeam]);
        }
        // Reset form
        setNewTeamData({ name: '', coach: '', homeVenue: '' });
        setShowNewTeamForm(false);
        setCurrentTeamName('');
      }
      return;
    }

    // FIXED: Let addTeamToMasterTable generate the ID automatically
    // This prevents ID collision issues
    const teamId = addTeamToMasterTable({
      name: newTeamData.name.trim(),
      coach: newTeamData.coach.trim(),
      homeVenue: newTeamData.homeVenue.trim(),
      players: []
    });
    
    if (!teamId) {
      alert('Failed to add team. A team with this name may already exist.');
      return;
    }

    const newTeam = {
      id: teamId,
      name: newTeamData.name.trim(),
      coach: newTeamData.coach.trim(),
      homeVenue: newTeamData.homeVenue.trim(),
      players: [],
      createdAt: new Date().toISOString()
    };

    console.log('✅ New team added to Master Teams Table:', newTeam);

    // Also add to legacy teams storage for backward compatibility
    const existingTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
    const updatedTeams = [...existingTeams, newTeam];
    localStorage.setItem('vscor_teams', JSON.stringify(updatedTeams));

    // Add to participating teams
    setParticipatingTeams([...participatingTeams, newTeam]);
    
    // Reset form
    setNewTeamData({ name: '', coach: '', homeVenue: '' });
    setShowNewTeamForm(false);
    setCurrentTeamName('');
  };

  const removeTeam = (teamId) => {
    setParticipatingTeams(participatingTeams.filter(team => team.id !== teamId));
  };

  const handleSubmit = () => {
    if (!tournamentName.trim()) {
      alert('Tournament name is required!');
      return;
    }

    if (!maxNumberOfTeams || parseInt(maxNumberOfTeams) < 2) {
      alert('Maximum Number of Teams is required and must be at least 2!');
      return;
    }

    if (!playersPerTeam || parseInt(playersPerTeam) < 1) {
      alert('Players Per Team is required and must be at least 1!');
      return;
    }

    // Validate coordinator information
    const hasValidCoordinator = coordinators.some(coord => 
      coord.name.trim() && coord.phone.trim()
    );
    
    if (!hasValidCoordinator) {
      alert('Coordinator name and phone number are required!');
      return;
    }

    // Extract coordinator user_ids
    const coordinatorUserIds = coordinators
      .filter(coord => coord.user_id)
      .map(coord => coord.user_id);
    
    // Ensure current user is included in coordinator list if not already
    const allCoordinatorUserIds = currentUser?.user_id 
      ? [...new Set([currentUser.user_id, ...coordinatorUserIds])]
      : coordinatorUserIds;

    const tournamentData = {
      id: Date.now(),
      name: tournamentName.trim(),
      place: place.trim(),
      venue: venue.trim(),
      // New coordinators array format (up to 3 coordinators)
      coordinators: coordinators.filter(coord => coord.name.trim() || coord.phone.trim() || coord.email.trim()),
      startDate: startDate,
      endDate: endDate,
      playersPerTeam: playersPerTeam ? parseInt(playersPerTeam) : null,
      matchDuration: matchDuration ? parseInt(matchDuration) : null,
      maxNumberOfTeams: maxNumberOfTeams ? parseInt(maxNumberOfTeams) : null,
      tournamentFormat: tournamentFormat,
      participatingTeams: participatingTeams.map(team => ({
        id: team.id,
        name: team.name
      })),
      registrationFee: registrationFee.trim(),
      firstPrize: firstPrize.trim(),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      imageUrl: imageUrl,
      // Format-specific data
      roundRobinRounds: tournamentFormat === 'league_round_robin' ? parseInt(roundRobinRounds) : null,
      numberOfGroups: tournamentFormat === 'group_stage___knockout' && numberOfGroups ? parseInt(numberOfGroups) : null,
      teamsPerGroup: tournamentFormat === 'group_stage___knockout' && teamsPerGroup ? parseInt(teamsPerGroup) : null,
      // Tags and description
      tags: tags,
      description: description,
      // Ownership metadata
      owner_user_id: currentUser?.user_id || null,
      created_by: currentUser?.name || currentUser?.email || 'Unknown',
      coordinator_user_ids: allCoordinatorUserIds
    };

    // Get existing tournaments from localStorage
    const existingTournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    
    // Add new tournament
    const updatedTournaments = [...existingTournaments, tournamentData];
    
    // Save to localStorage
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    
    console.log('Tournament created:', tournamentData);
    
    // Call callback if provided
    if (onTournamentCreated) {
      onTournamentCreated(tournamentData);
    }
    
    // Show success dialog (don't call onBack here)
    setShowSuccessDialog(true);
  };

  // Get format label
  const getFormatLabel = () => {
    const format = formats.find(f => f.value === tournamentFormat);
    return format ? format.label : '';
  };

  // Get tournament summary
  const getTournamentSummary = () => {
    if (!tournamentFormat || !maxNumberOfTeams) return null;

    const maxTeams = parseInt(maxNumberOfTeams);
    
    let summary = {
      format: getFormatLabel(),
      totalTeams: maxTeams,
      totalMatches: totalMatches || 'TBD',
      structure: ''
    };

    if (tournamentFormat === 'knockout') {
      summary.structure = `${knockoutStages.length} stages: ${knockoutStages.join(', ')}`;
    } else if (tournamentFormat === 'league_round_robin') {
      const roundType = roundRobinRounds === '1' ? 'Single' : roundRobinRounds === '2' ? 'Double' : `${roundRobinRounds}×`;
      summary.structure = `${roundType} Round Robin`;
    } else if (tournamentFormat === 'group_stage___knockout') {
      if (numberOfGroups && teamsPerGroup) {
        summary.structure = `${numberOfGroups} groups of ${teamsPerGroup} teams each`;
      } else {
        summary.structure = 'Configure groups below';
      }
    } else if (tournamentFormat === 'other_manual') {
      summary.structure = 'Manual fixture entry';
      summary.totalMatches = 'Custom';
    }

    return summary;
  };

  const summary = getTournamentSummary();

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-medium">Add Tournament</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-2xl mx-auto">
        {/* Circular Image Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="tournament-image-upload"
            />
            <label
              htmlFor="tournament-image-upload"
              className="block w-32 h-32 rounded-full overflow-hidden cursor-pointer relative bg-gray-100 border-2 border-gray-300"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Tournament Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50">
                  <Trophy className="w-20 h-20 text-purple-300" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-black bg-opacity-50 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </label>
            {imagePreview && (
              <button
                onClick={removeImage}
                className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* REQUIRED FIELDS SECTION */}
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Required Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Tournament Name *</Label>
              <Input
                placeholder="Enter tournament name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="py-3 border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Maximum Number of Teams *</Label>
              <Input
                type="number"
                placeholder="Maximum number of teams"
                value={maxNumberOfTeams}
                onChange={(e) => setMaxNumberOfTeams(e.target.value)}
                className="py-3 border border-gray-300 rounded-lg bg-white"
                min="2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 2</p>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Players Per Team *</Label>
              <Input
                type="number"
                placeholder="Number of players per team"
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(e.target.value)}
                className="py-3 border border-gray-300 rounded-lg bg-white"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required field</p>
            </div>

            <div className="col-span-2 relative">
              <Label className="block text-sm font-medium mb-2">Coordinator Name *</Label>
              <Input
                placeholder="Search user by name, phone or email..."
                value={coordinatorSearchQuery[0] || coordinators[0]?.name || ''}
                onChange={(e) => {
                  const newQueries = [...coordinatorSearchQuery];
                  newQueries[0] = e.target.value;
                  setCoordinatorSearchQuery(newQueries);
                  
                  const newShowSuggestions = [...showCoordinatorSuggestions];
                  newShowSuggestions[0] = e.target.value.length >= 2;
                  setShowCoordinatorSuggestions(newShowSuggestions);
                  
                  // Update name in coordinators
                  const newCoords = [...coordinators];
                  newCoords[0].name = e.target.value;
                  setCoordinators(newCoords);
                }}
                onFocus={() => {
                  if ((coordinatorSearchQuery[0] || '').length >= 2) {
                    const newShowSuggestions = [...showCoordinatorSuggestions];
                    newShowSuggestions[0] = true;
                    setShowCoordinatorSuggestions(newShowSuggestions);
                  }
                }}
                className="py-3 border border-gray-300 rounded-lg bg-white"
              />
              
              {/* User Suggestions Dropdown */}
              {(() => {
                const excludedUserIds = coordinators.filter((c, i) => i !== 0 && c.user_id).map(c => c.user_id);
                const filteredUsers = getFilteredUsers(coordinatorSearchQuery[0] || '', excludedUserIds);
                const showNoResults = (coordinatorSearchQuery[0] || '').length >= 2 && filteredUsers.length === 0;
                
                return (
                  <>
                    {showCoordinatorSuggestions[0] && filteredUsers.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-purple-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                        <div className="px-3 py-2 text-xs text-purple-600 bg-purple-50 border-b">
                          {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''} found
                        </div>
                        {filteredUsers.map(user => (
                          <div
                            key={user.user_id}
                            onClick={() => {
                              const newCoords = [...coordinators];
                              newCoords[0] = {
                                name: user.name,
                                phone: user.phone || '',
                                email: user.email || '',
                                user_id: user.user_id
                              };
                              setCoordinators(newCoords);
                              
                              const newQueries = [...coordinatorSearchQuery];
                              newQueries[0] = '';
                              setCoordinatorSearchQuery(newQueries);
                              
                              const newShowSuggestions = [...showCoordinatorSuggestions];
                              newShowSuggestions[0] = false;
                              setShowCoordinatorSuggestions(newShowSuggestions);
                            }}
                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-600 flex gap-3">
                              {user.phone && <span>📱 {user.phone}</span>}
                              {user.email && <span>✉️ {user.email}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showNoResults && (
                      <p className="text-xs text-gray-600 mt-1">
                        💡 No registered users found. You can manually enter coordinator details.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Coordinator Phone *</Label>
              <Input
                placeholder="Contact number"
                value={coordinators[0]?.phone || ''}
                onChange={(e) => {
                  const newCoords = [...coordinators];
                  newCoords[0].phone = e.target.value;
                  setCoordinators(newCoords);
                }}
                className="py-3 border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Coordinator Email</Label>
              <Input
                type="email"
                placeholder="Email address (optional)"
                value={coordinators[0]?.email || ''}
                onChange={(e) => {
                  const newCoords = [...coordinators];
                  newCoords[0].email = e.target.value;
                  setCoordinators(newCoords);
                }}
                className="py-3 border border-gray-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Place</Label>
          <Input
            placeholder="Enter place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Venue</Label>
          <Input
            placeholder="Tournament venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Additional Coordinators Section (Optional) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium">Additional Coordinators (Optional)</Label>
            <span className="text-xs text-gray-500">Add up to 2 more coordinators</span>
          </div>
          {coordinators.slice(1).map((coord, sliceIndex) => {
            const index = sliceIndex + 1; // Adjust index since we're starting from index 1
            const excludedUserIds = coordinators.filter((c, i) => i !== index && c.user_id).map(c => c.user_id);
            const filteredUsers = getFilteredUsers(coordinatorSearchQuery[index] || '', excludedUserIds);
            const showNoResults = (coordinatorSearchQuery[index] || '').length >= 2 && filteredUsers.length === 0;
            
            return (
              <div key={index} className="relative border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                <div className="space-y-3">
                  {/* Name Input with Autocomplete */}
                  <div className="relative">
                    <Label className="block text-sm mb-1">Name *</Label>
                    <Input
                      placeholder="Search user by name, phone or email..."
                      value={coordinatorSearchQuery[index] || coord.name}
                      onChange={(e) => {
                        const newQueries = [...coordinatorSearchQuery];
                        newQueries[index] = e.target.value;
                        setCoordinatorSearchQuery(newQueries);
                        
                        const newShowSuggestions = [...showCoordinatorSuggestions];
                        newShowSuggestions[index] = e.target.value.length >= 2;
                        setShowCoordinatorSuggestions(newShowSuggestions);
                        
                        // If manually typing, update name
                        if (!coord.user_id) {
                          const newCoords = [...coordinators];
                          newCoords[index].name = e.target.value;
                          setCoordinators(newCoords);
                        }
                      }}
                      onFocus={() => {
                        if ((coordinatorSearchQuery[index] || '').length >= 2) {
                          const newShowSuggestions = [...showCoordinatorSuggestions];
                          newShowSuggestions[index] = true;
                          setShowCoordinatorSuggestions(newShowSuggestions);
                        }
                      }}
                      className="py-3 border border-purple-300 rounded-lg"
                    />
                    
                    {/* User Suggestions Dropdown */}
                    {showCoordinatorSuggestions[index] && filteredUsers.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-purple-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                        <div className="px-3 py-2 text-xs text-purple-600 bg-purple-50 border-b">
                          {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''} found
                        </div>
                        {filteredUsers.map(user => (
                          <div
                            key={user.user_id}
                            onClick={() => handleSelectUser(index, user)}
                            className="px-3 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              {user.imageUrl ? (
                                <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{user.name}</div>
                                {user.phone && <div className="text-xs text-gray-600">📱 {user.phone}</div>}
                                {user.email && <div className="text-xs text-gray-600">✉️ {user.email}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results Message */}
                    {showNoResults && (
                      <p className="text-xs text-gray-600 mt-1">
                        💡 No registered users found. You can manually enter coordinator details below.
                      </p>
                    )}
                  </div>
                  
                  {/* Phone Input - Auto-filled or Manual */}
                  <div>
                    <Label className="block text-sm mb-1">Contact Number</Label>
                    <Input
                      placeholder="Enter coordinator contact"
                      value={coord.phone}
                      onChange={(e) => {
                        const newCoords = [...coordinators];
                        newCoords[index].phone = e.target.value;
                        setCoordinators(newCoords);
                      }}
                      className="py-3 border border-gray-300 rounded-lg"
                      disabled={!!coord.user_id}
                    />
                    {coord.user_id && <p className="text-xs text-purple-600 mt-1">Auto-filled from user profile</p>}
                  </div>
                  
                  {/* Email Input - Auto-filled or Manual */}
                  <div>
                    <Label className="block text-sm mb-1">Email</Label>
                    <Input
                      placeholder="Enter coordinator email"
                      value={coord.email}
                      onChange={(e) => {
                        const newCoords = [...coordinators];
                        newCoords[index].email = e.target.value;
                        setCoordinators(newCoords);
                      }}
                      className="py-3 border border-gray-300 rounded-lg"
                      disabled={!!coord.user_id}
                    />
                    {coord.user_id && <p className="text-xs text-purple-600 mt-1">Auto-filled from user profile</p>}
                  </div>
                </div>
                
                {/* Remove button (only for coordinators after the first one) */}
                {coordinators.length > 1 && (
                  <button
                    onClick={() => {
                      const newCoords = [...coordinators];
                      newCoords.splice(index, 1);
                      setCoordinators(newCoords);
                      
                      const newQueries = [...coordinatorSearchQuery];
                      newQueries.splice(index, 1);
                      setCoordinatorSearchQuery(newQueries);
                      
                      const newShowSuggestions = [...showCoordinatorSuggestions];
                      newShowSuggestions.splice(index, 1);
                      setShowCoordinatorSuggestions(newShowSuggestions);
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          {coordinators.length < 3 && (
            <Button
              onClick={() => {
                setCoordinators([...coordinators, { name: '', phone: '', email: '', user_id: null }]);
                setCoordinatorSearchQuery([...coordinatorSearchQuery, '']);
                setShowCoordinatorSuggestions([...showCoordinatorSuggestions, false]);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Coordinator (up to 3)
            </Button>
          )}
        </div>

        {/* Tags and Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium">Tags</Label>
            <span className="text-xs text-gray-500">Add tags to categorize your tournament</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter a custom tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                className="py-3 border border-gray-300 rounded-lg pr-10"
              />
              {tagInput && (
                <button 
                  onClick={() => setTagInput('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              onClick={() => {
                if (tagInput.trim()) {
                  handleAddTag(tagInput);
                }
              }}
              disabled={!tagInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div>
              <Label className="block text-sm font-medium mb-2">Selected Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div key={index} className="bg-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span>{tag}</span>
                    <button
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="text-purple-200 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {suggestedTags.length > 0 && (
            <div className="mt-2">
              <Label className="block text-sm font-medium mb-2">Suggested Tags</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => {
                  const count = tagPopularity[tag] || 0;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer border border-purple-200 transition-colors"
                    >
                      <span>{tag}</span>
                      {count > 0 && (
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Numbers show how many tournaments use each tag
              </p>
            </div>
          )}
        </div>
        
        <div>
          <Label className="block text-sm font-medium mb-2">Description</Label>
          <Textarea
            placeholder="Enter a brief description of the tournament"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Match Duration (minutes)</Label>
          <Input
            type="number"
            placeholder="Match duration in minutes"
            value={matchDuration}
            onChange={(e) => setMatchDuration(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
            min="1"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Format</Label>
          <Select value={tournamentFormat} onValueChange={(value) => {
            setTournamentFormat(value);
            // Reset format-specific fields
            setRoundRobinRounds('1');
            setNumberOfGroups('');
            setTeamsPerGroup('');
            setGroupConfigWarning('');
          }}>
            <SelectTrigger className="py-3 border border-gray-300 rounded-lg">
              <SelectValue placeholder="Select tournament format" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((fmt) => (
                <SelectItem key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format-specific configuration */}
        {tournamentFormat === 'knockout' && maxNumberOfTeams && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-medium text-blue-900">Knockout Configuration</h3>
                <div className="text-sm text-blue-800">
                  <p>✓ This tournament will have <strong>{knockoutStages.length} stages</strong></p>
                  <p className="mt-1">Stages: {knockoutStages.join(' → ')}</p>
                  {byesRequired > 0 && (
                    <div className="mt-2 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p><strong>{byesRequired} team{byesRequired > 1 ? 's' : ''}</strong> will receive {byesRequired > 1 ? 'byes' : 'a bye'} in Round 1</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tournamentFormat === 'league_round_robin' && maxNumberOfTeams && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-medium text-green-900">League Configuration</h3>
                <div>
                  <Label className="block text-sm font-medium mb-2">Number of times each team plays against another team</Label>
                  <Select value={roundRobinRounds} onValueChange={setRoundRobinRounds}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Round Robin (1)</SelectItem>
                      <SelectItem value="2">Double Round Robin (2)</SelectItem>
                      <SelectItem value="3">Triple Round Robin (3)</SelectItem>
                      <SelectItem value="4">4 Rounds</SelectItem>
                      <SelectItem value="5">5 Rounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-green-800">
                  <p>✓ Total matches: <strong>{totalMatches}</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tournamentFormat === 'group_stage___knockout' && maxNumberOfTeams && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-medium text-purple-900">Group + Knockout Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Number of Groups</Label>
                    <Input
                      type="number"
                      placeholder="Enter number of groups"
                      value={numberOfGroups}
                      onChange={(e) => {
                        setNumberOfGroups(e.target.value);
                        if (!e.target.value) setTeamsPerGroup('');
                      }}
                      className="border-purple-300"
                      min="2"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Teams per Group</Label>
                    <Input
                      type="number"
                      placeholder="Enter teams per group"
                      value={teamsPerGroup}
                      onChange={(e) => {
                        setTeamsPerGroup(e.target.value);
                        if (!e.target.value) setNumberOfGroups('');
                      }}
                      className="border-purple-300"
                      min="2"
                    />
                  </div>
                </div>
                {groupConfigWarning && (
                  <div className={`text-sm p-3 rounded-lg ${groupConfigWarning.includes('⚠️') ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                    {groupConfigWarning}
                  </div>
                )}
                {numberOfGroups && teamsPerGroup && !groupConfigWarning.includes('⚠️') && (
                  <>
                    <div className="text-sm text-purple-800">
                      <p>✓ Preview: <strong>{numberOfGroups} groups of {teamsPerGroup} teams each</strong></p>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium mb-2">Teams progressing from each group *</Label>
                      <Input
                        type="number"
                        placeholder="Enter teams progressing per group"
                        value={teamsProgressingPerGroup}
                        onChange={(e) => setTeamsProgressingPerGroup(e.target.value)}
                        className="border-purple-300"
                        min="1"
                        max={parseInt(teamsPerGroup) - 1}
                      />
                      <p className="text-xs text-purple-600 mt-1">Must be &lt; {teamsPerGroup} (teams per group)</p>
                    </div>
                    
                    {teamsProgressingPerGroup && parseInt(teamsProgressingPerGroup) > 0 && parseInt(teamsProgressingPerGroup) < parseInt(teamsPerGroup) && (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 space-y-2 text-sm">
                        <h4 className="font-medium text-blue-900">Knockout Qualification Summary</h4>
                        <div className="space-y-1 text-blue-800">
                          <p>• <strong>{numberOfGroups} Groups</strong></p>
                          <p>• <strong>{teamsPerGroup} Teams per Group</strong></p>
                          <p>• Top <strong>{teamsProgressingPerGroup}</strong> qualify directly → <strong>{totalDirectQualifiers} teams</strong></p>
                          {bestNextPlacedTeams > 0 && (
                            <p className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Best <strong>{bestNextPlacedTeams} next-placed team{bestNextPlacedTeams > 1 ? 's' : ''}</strong> across all groups will also qualify</span>
                            </p>
                          )}
                          {bestNextPlacedTeams === 0 && (
                            <p>• No additional teams needed</p>
                          )}
                          <p>• Knockout stage size = <strong>{knockoutBracketSize}</strong></p>
                          <p>• Knockout starts from <strong>{knockoutStartingRound}</strong></p>
                        </div>
                      </div>
                    )}
                    
                    {teamsProgressingPerGroup && parseInt(teamsProgressingPerGroup) >= parseInt(teamsPerGroup) && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                        ⚠️ Teams progressing must be less than teams per group ({teamsPerGroup})
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {tournamentFormat === 'other_manual' && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Manual Fixture Entry</h3>
                <p className="text-sm text-gray-600">
                  Use this option to manually create and manage fixtures. No automatic fixture generation logic will be applied.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label className="block text-sm font-medium mb-2">Registration Fee</Label>
          <Input
            placeholder="Registration fee (optional)"
            value={registrationFee}
            onChange={(e) => setRegistrationFee(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Participating Teams</Label>
          
          {/* Team Input with Autocomplete */}
          <div className="relative">
            <Input
              placeholder="Search or enter team name..."
              value={currentTeamName}
              onChange={(e) => {
                setCurrentTeamName(e.target.value);
                setShowTeamSuggestions(true);
              }}
              onFocus={() => setShowTeamSuggestions(true)}
              className="py-3 border border-gray-300 rounded-lg"
            />
            
            {/* Dropdown Suggestions */}
            {showTeamSuggestions && currentTeamName && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {getFilteredTeams().length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 border-b">
                      Existing Teams
                    </div>
                    {getFilteredTeams().map((team) => (
                      <div
                        key={team.id}
                        onClick={() => addExistingTeam(team)}
                        className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100"
                      >
                        <div className="font-medium">{team.name}</div>
                        {team.coach && (
                          <div className="text-xs text-gray-500">Coach: {team.coach}</div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No existing teams found
                  </div>
                )}
                
                {/* Add New Team Option */}
                <div
                  onClick={() => {
                    setShowNewTeamForm(true);
                    setShowTeamSuggestions(false);
                    setNewTeamData({ ...newTeamData, name: currentTeamName });
                  }}
                  className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-t-2 border-purple-200 bg-purple-50"
                >
                  <div className="flex items-center gap-2 text-purple-600 font-medium">
                    <Plus className="w-4 h-4" />
                    <span>Add new team &quot;{currentTeamName}&quot;</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Team Form */}
          {showNewTeamForm && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-purple-900">Add New Team</h4>
                <button
                  onClick={() => {
                    setShowNewTeamForm(false);
                    setNewTeamData({ name: '', coach: '', homeVenue: '' });
                  }}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <Label className="block text-sm mb-1">Team Name *</Label>
                <Input
                  placeholder="Enter team name"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  className="border border-purple-300 rounded-lg"
                />
              </div>
              
              <div>
                <Label className="block text-sm mb-1">Coach</Label>
                <Input
                  placeholder="Enter coach name"
                  value={newTeamData.coach}
                  onChange={(e) => setNewTeamData({ ...newTeamData, coach: e.target.value })}
                  className="border border-purple-300 rounded-lg"
                />
              </div>
              
              <div>
                <Label className="block text-sm mb-1">Home Venue</Label>
                <Input
                  placeholder="Enter home venue"
                  value={newTeamData.homeVenue}
                  onChange={(e) => setNewTeamData({ ...newTeamData, homeVenue: e.target.value })}
                  className="border border-purple-300 rounded-lg"
                />
              </div>
              
              <Button
                onClick={addNewTeam}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team to Tournament
              </Button>
            </div>
          )}

          {/* Selected Teams List */}
          {participatingTeams.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="text-sm font-medium text-gray-700">
                Selected Teams ({participatingTeams.length})
              </div>
              {participatingTeams.map((team) => (
                <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      {team.coach && (
                        <div className="text-sm text-gray-600">Coach: {team.coach}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeTeam(team.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">First Prize</Label>
          <Input
            placeholder="Enter first prize details"
            value={firstPrize}
            onChange={(e) => setFirstPrize(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Live Preview Summary */}
        {summary && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300">
            <CardContent className="pt-6">
              <h3 className="font-medium text-purple-900 mb-4">Tournament Preview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <p className="font-medium text-gray-900">{summary.format}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Teams:</span>
                  <p className="font-medium text-gray-900">{summary.totalTeams}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Matches:</span>
                  <p className="font-medium text-gray-900">{summary.totalMatches}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Structure:</span>
                  <p className="font-medium text-gray-900">{summary.structure}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      </div>

      {/* Fixed Footer with Buttons */}
      <div className="border-t border-gray-200 p-4 pb-24 bg-white">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 py-3 border-gray-300 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            disabled={
              !tournamentName.trim() || 
              !playersPerTeam || 
              !maxNumberOfTeams || 
              parseInt(maxNumberOfTeams) < 2 || 
              parseInt(playersPerTeam) < 1 ||
              !coordinators.some(coord => coord.name.trim() && coord.phone.trim())
            }
          >
            Create Tournament
          </Button>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Tournament Created Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Add/edit tournament details from Tournaments section in Info tab
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                if (onNavigateToInfoTab) {
                  onNavigateToInfoTab();
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTournament;