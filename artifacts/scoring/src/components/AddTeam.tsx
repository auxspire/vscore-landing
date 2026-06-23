// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, UserPlus, X, Camera, Shield, Crown, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { addTeamToMasterTable, findTeamByName } from '../utils/teamManagement';
import UserAutocompleteInput from './UserAutocompleteInput';

const AddTeam = ({ onBack, onAddTeam, playerDatabase = [], onAssignPlayerToTeam, onAddPlayer, onAddMultiplePlayers, currentUser = null }) => {
  const [teamName, setTeamName] = useState('');
  const [coach, setCoach] = useState('');
  const [homeVenue, setHomeVenue] = useState('');
  const [description, setDescription] = useState('');
  const [players, setPlayers] = useState([{ name: '', position: '', jerseyNumber: '', isFromDatabase: false, playerId: null }]);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateTeam, setDuplicateTeam] = useState(null);

  // Coordinators: Initialize with current user's info pre-filled
  const [additionalCoordinators, setAdditionalCoordinators] = useState(() => {
    // Pre-fill first coordinator with current user's information
    if (currentUser) {
      return [{
        name: currentUser.display_name || '',
        email: currentUser.email || '',
        phone: currentUser.mobile_number || '',
        user_id: currentUser.user_id || null
      }];
    }
    return [];
  });
  
  // Transfer ownership: select which coordinator (if any) becomes the owner
  const [transferOwnership, setTransferOwnership] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null); // index of coordinator or null for self

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** All players in the DB – used for player autocomplete suggestions */
  const allPlayers = playerDatabase;

  /** Registered users (have an account) – preferred for coordinator suggestions,
   *  but falls back to all players so you can still pick unregistered ones */
  const registeredUsers = playerDatabase.filter(p => p.owner_user_id != null);
  const coordinatorSuggestions = registeredUsers.length > 0 ? registeredUsers : allPlayers;

  // ── Coordinator handlers ───────────────────────────────────────────────────

  const addCoordinator = () => {
    if (additionalCoordinators.length >= 3) return;
    setAdditionalCoordinators([...additionalCoordinators, { name: '', email: '', phone: '', user_id: null }]);
  };

  const removeCoordinator = (index) => {
    setAdditionalCoordinators(additionalCoordinators.filter((_, i) => i !== index));
  };

  const updateCoordinator = (index, field, value) => {
    setAdditionalCoordinators(
      additionalCoordinators.map((c, i) => i === index ? { ...c, [field]: value } : c)
    );
  };

  /** Called when a registered user is selected from the coordinator autocomplete */
  const selectCoordinatorFromSuggestion = (index, user) => {
    setAdditionalCoordinators(
      additionalCoordinators.map((c, i) =>
        i === index
          ? {
              ...c,
              name: user.name || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              user_id: user.owner_user_id || null, // Store the user_id for registered users
            }
          : c
      )
    );
  };

  // ── Image handlers ───────────────────────────────────────────────���─────────

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // ── Player handlers ────────────────────────────────────────────────────────

  const unassignedPlayers = playerDatabase.filter(p => !p.teamId || p.teamId === null);

  const addPlayer = () => {
    setPlayers([...players, { name: '', position: '', jerseyNumber: '', isFromDatabase: false, playerId: null }]);
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index, field, value) => {
    setPlayers(players.map((player, i) =>
      i === index ? { ...player, [field]: value } : player
    ));
  };

  /** Called when an existing DB player is selected from the modal picker */
  const selectPlayerFromDatabase = (dbPlayer, index) => {
    setPlayers(players.map((player, i) =>
      i === index
        ? {
            name: dbPlayer.name,
            position: dbPlayer.position || '',
            jerseyNumber: dbPlayer.jerseyNumber || '',
            isFromDatabase: true,
            playerId: dbPlayer.id,
          }
        : player
    ));
    setShowPlayerPicker(false);
  };

  /** Called when a suggestion is selected from the player name autocomplete */
  const selectPlayerFromSuggestion = (index, user) => {
    setPlayers(players.map((player, i) =>
      i === index
        ? {
            ...player,
            name: user.name || '',
            position: user.position || player.position || '',
            jerseyNumber: user.jerseyNumber || player.jerseyNumber || '',
            isFromDatabase: true,
            playerId: user.id,
          }
        : player
    ));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    console.log('=== TEAM CREATION START ===');
    const existingTeam = findTeamByName(teamName);
    if (existingTeam) {
      setDuplicateTeam(existingTeam);
      setShowDuplicateDialog(true);
      return;
    }
    createTeam();
  };

  const createTeam = () => {
    const newTeamId = addTeamToMasterTable({
      name: teamName.trim(),
      coach: coach.trim(),
      homeVenue: homeVenue.trim(),
      description: description.trim(),
      imageUrl: imageUrl,
      players: [],
    });

    const playersToAssign = [];
    const newPlayersToAdd = [];

    const validPlayers = players.filter(p => p.name.trim() !== '').map((p, index) => {
      if (p.isFromDatabase && p.playerId) {
        playersToAssign.push({ playerId: p.playerId, teamId: newTeamId, teamName: teamName });
      } else if (!p.isFromDatabase && p.name.trim() !== '') {
        newPlayersToAdd.push({
          name: p.name,
          position: p.position || '',
          jerseyNumber: p.jerseyNumber || String(index + 1),
          teamId: newTeamId,
          teamName: teamName,
          phoneNumber: '',
        });
      }
      return {
        id: p.playerId || (Date.now() + index),
        name: p.name,
        number: parseInt(p.jerseyNumber) || (index + 1),
        position: p.position || '',
        jerseyNumber: p.jerseyNumber || String(index + 1),
      };
    });

    if (newPlayersToAdd.length > 0 && onAddMultiplePlayers) {
      onAddMultiplePlayers(newPlayersToAdd);
    }

    if (onAssignPlayerToTeam) {
      playersToAssign.forEach(({ playerId, teamId, teamName }) => {
        onAssignPlayerToTeam(playerId, teamId, teamName);
      });
    }

    const creatorEntry = {
      name: currentUser?.display_name || 'Team Creator',
      email: currentUser?.email || '',
      phone: currentUser?.mobile_number || '',
      user_id: currentUser?.user_id || null,
    };
    const validAdditional = additionalCoordinators.filter(c => c.name.trim() || c.email.trim() || c.phone.trim());
    const allCoordinators = [creatorEntry, ...validAdditional];

    // Build coordinator_user_ids array from registered users only
    const coordinatorUserIds = allCoordinators
      .filter(c => c.user_id != null)
      .map(c => c.user_id);

    // Determine owner_user_id: if transferOwnership is checked and a coordinator is selected, use that
    let ownerUserId = currentUser?.user_id || null;
    if (transferOwnership && selectedOwner !== null && selectedOwner >= 0) {
      const selectedCoord = validAdditional[selectedOwner];
      if (selectedCoord && selectedCoord.user_id) {
        ownerUserId = selectedCoord.user_id;
      }
    }

    const teamData = {
      id: newTeamId,
      name: teamName,
      coach,
      homeVenue,
      description,
      players: validPlayers,
      createdAt: new Date(),
      imageUrl: imageUrl,
      coordinators: allCoordinators,
      coordinator_user_ids: coordinatorUserIds, // For ownership system
      owner_user_id: ownerUserId, // Set during creation
    };

    console.log('Team data to be created:', teamData);
    console.log('Coordinator user IDs:', coordinatorUserIds);
    console.log('Owner user ID:', ownerUserId);
    console.log('=== TEAM CREATION END ===');

    if (onAddTeam) onAddTeam(teamData);
    onBack();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-medium">Add Team</h1>
      </div>

      <div className="space-y-6">
        {/* Circular Image Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="team-image-upload"
            />
            <label
              htmlFor="team-image-upload"
              className="block w-32 h-32 rounded-full overflow-hidden cursor-pointer relative bg-gray-100 border-2 border-gray-300"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Team Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50">
                  <Shield className="w-20 h-20 text-purple-300" />
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

        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium mb-2">Team Name</label>
          <Input
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Coach/Manager</label>
          <Input
            placeholder="Enter coach/manager name"
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Home Venue</label>
          <Input
            placeholder="Enter home venue"
            value={homeVenue}
            onChange={(e) => setHomeVenue(e.target.value)}
            className="py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            placeholder="Enter team description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>

        {/* ── Coordinators Section ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-medium">Coordinators</label>
              <p className="text-xs text-gray-500 mt-0.5">Up to 3 total · you are pre-filled as the first coordinator</p>
            </div>
            {additionalCoordinators.length < 3 && (
              <Button
                type="button"
                onClick={addCoordinator}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-300 hover:bg-purple-50 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {/* Slot 0 — Creator (you), read-only */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Creator (You)</span>
                <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Coordinator 1</span>
              </div>
              <div className="text-sm font-medium text-gray-800">
                {currentUser?.display_name || 'You'}
              </div>
              {currentUser?.email && (
                <div className="text-xs text-gray-500 mt-0.5">{currentUser.email}</div>
              )}
            </div>

            {/* Additional coordinators with autocomplete on the name field */}
            {additionalCoordinators.map((coord, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Coordinator {index + 2}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCoordinator(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Name with autocomplete */}
                <div>
                  <UserAutocompleteInput
                    value={coord.name}
                    onChange={(val) => updateCoordinator(index, 'name', val)}
                    onSelect={(user) => selectCoordinatorFromSuggestion(index, user)}
                    users={coordinatorSuggestions}
                    placeholder="Full name"
                    suggestionSubLabel={(u) =>
                      [u.email, u.phoneNumber].filter(Boolean).join(' · ')
                    }
                  />
                </div>

                {/* Email – auto-filled but still editable */}
                <Input
                  placeholder="Email address"
                  type="email"
                  value={coord.email}
                  onChange={(e) => updateCoordinator(index, 'email', e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm"
                />

                {/* Phone – auto-filled but still editable */}
                <Input
                  placeholder="Phone (optional)"
                  type="tel"
                  value={coord.phone}
                  onChange={(e) => updateCoordinator(index, 'phone', e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm"
                />

                <p className="text-xs text-gray-400">
                  This person can edit the team once they sign in with this email.
                </p>
              </div>
            ))}
          </div>
          
          {/* Option to keep ownership for creator or transfer to coordinator */}
          {additionalCoordinators.some(c => c.user_id) && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Team Ownership</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="radio"
                  id="owner-self"
                  name="team-owner"
                  checked={!transferOwnership || selectedOwner === null}
                  onChange={() => {
                    setTransferOwnership(false);
                    setSelectedOwner(null);
                  }}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="owner-self" className="text-xs text-gray-600 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-600" />
                  I will be the team owner
                </label>
              </div>
              
              {additionalCoordinators.map((coord, index) => coord.user_id && (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="radio"
                    id={`owner-${index}`}
                    name="team-owner"
                    checked={transferOwnership && selectedOwner === index}
                    onChange={() => {
                      setTransferOwnership(true);
                      setSelectedOwner(index);
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <label htmlFor={`owner-${index}`} className="text-xs text-gray-600 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    Make {coord.name || 'this coordinator'} the team owner
                  </label>
                </div>
              ))}
              
              <p className="text-xs text-gray-500">
                ℹ️ The team owner can transfer ownership and manage coordinators. All coordinators can edit team details and manage players.
              </p>
            </div>
          )}
        </div>

        {/* ── Players Section ── */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <label className="block text-sm font-medium">Players</label>
            {unassignedPlayers.length > 0 && (
              <span className="text-xs text-purple-600">{unassignedPlayers.length} unassigned players available</span>
            )}
          </div>

          <div className="space-y-4">
            {players.map((player, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Player {index + 1}</h4>
                  <div className="flex gap-2">
                    {unassignedPlayers.length > 0 && !player.isFromDatabase && (
                      <Dialog
                        open={showPlayerPicker && currentPlayerIndex === index}
                        onOpenChange={(open) => {
                          setShowPlayerPicker(open);
                          if (open) setCurrentPlayerIndex(index);
                          else setCurrentPlayerIndex(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <button
                            onClick={() => {
                              setCurrentPlayerIndex(index);
                              setShowPlayerPicker(true);
                            }}
                            className="text-purple-600 hover:text-purple-700"
                            title="Select from existing players"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Player from Database</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 max-h-96 overflow-y-auto" aria-describedby={undefined}>
                            {unassignedPlayers.map((dbPlayer) => (
                              <button
                                key={dbPlayer.id}
                                onClick={() => selectPlayerFromDatabase(dbPlayer, index)}
                                className="w-full text-left p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                              >
                                <div className="font-medium">{dbPlayer.name}</div>
                                <div className="text-sm text-gray-600">
                                  {dbPlayer.position && `${dbPlayer.position} • `}
                                  {dbPlayer.jerseyNumber && `#${dbPlayer.jerseyNumber}`}
                                  {dbPlayer.phoneNumber && ` • ${dbPlayer.phoneNumber}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {player.isFromDatabase && (
                  <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded inline-block">
                    From Player Database
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {/* Player name with autocomplete (disabled once from DB) */}
                  {player.isFromDatabase ? (
                    <Input
                      placeholder="Player name"
                      value={player.name}
                      disabled
                      className="border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <UserAutocompleteInput
                      value={player.name}
                      onChange={(val) => {
                        updatePlayer(index, 'name', val);
                        // If the user edits the name manually, un-link from DB
                        if (player.isFromDatabase) {
                          setPlayers(prev =>
                            prev.map((p, i) =>
                              i === index ? { ...p, isFromDatabase: false, playerId: null } : p
                            )
                          );
                        }
                      }}
                      onSelect={(user) => selectPlayerFromSuggestion(index, user)}
                      users={allPlayers}
                      placeholder="Player name"
                      suggestionSubLabel={(u) =>
                        [u.position, u.jerseyNumber ? `#${u.jerseyNumber}` : ''].filter(Boolean).join(' · ')
                      }
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Position"
                      value={player.position}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                      className="border border-gray-300 rounded-lg"
                    />
                    <Input
                      placeholder="Jersey #"
                      type="number"
                      value={player.jerseyNumber}
                      onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
                      className="border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={addPlayer}
              variant="outline"
              size="sm"
              className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
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
            disabled={!teamName.trim()}
          >
            Create Team
          </Button>
        </div>
      </div>

      {/* Duplicate Team Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Already Exists</DialogTitle>
            <DialogDescription>
              A team with the name "{duplicateTeam?.name}" already exists in the Master Teams database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {duplicateTeam && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Existing Team Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {duplicateTeam.name}</p>
                  {duplicateTeam.coach && (
                    <p><span className="font-medium">Coach:</span> {duplicateTeam.coach}</p>
                  )}
                  {duplicateTeam.homeVenue && (
                    <p><span className="font-medium">Home Venue:</span> {duplicateTeam.homeVenue}</p>
                  )}
                  <p><span className="font-medium">Players:</span> {(duplicateTeam.players || []).length}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Teams must have unique names. Please choose a different name for your team.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowDuplicateDialog(false);
                setDuplicateTeam(null);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              OK, I'll Change the Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTeam;