// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, Users, MapPin, UserPlus, Trash2, CheckCircle, Info, Upload, Lock, UserCheck, UserX, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ImageAvatar from './ImageAvatar';
import PlayerListItem from './PlayerListItem';
import { POSITIONS } from '../constants/positions';
import { getCurrentUserId } from '../utils/auth';
import UserAutocompleteInput from './UserAutocompleteInput';
import {
  getTeamFollowerCount,
  isFollowingTeam,
  followTeam,
  unfollowTeam
} from '../utils/teamFollows';

const TeamProfile = ({ 
  team, 
  onBack, 
  onUpdateTeam,
  onDeleteTeam, 
  playerDatabase = [],
  onAddPlayer,
  onPlayerClick = () => {},
  currentUserId = null
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeam, setEditedTeam] = useState(team);
  const [showAddPlayerInline, setShowAddPlayerInline] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    jerseyNumber: ''
  });
  
  // Squad join request state
  const [squadRequestStatus, setSquadRequestStatus] = useState(null); // null, 'pending', 'accepted', 'rejected'
  const [showSquadRequestsSection, setShowSquadRequestsSection] = useState(false);

  // Follow state
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Initialize coordinators state if not exists
  const [coordinators, setCoordinators] = useState(() => {
    return editedTeam.coordinators || [{ name: '', phone: '', email: '' }];
  });
  
  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    return /^\+91\d{10}$/.test(phoneNumber);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('imageUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    handleChange('imageUrl', '');
  };

  // Get team players from player database - check both teams array and legacy teamId
  const teamPlayers = playerDatabase.filter(p => {
    const hasTeamInArray = p.teams?.some(t => t.teamId === team.id);
    const hasLegacyTeam = p.teamId === team.id;
    return hasTeamInArray || hasLegacyTeam;
  }).map(p => {
    // Get the jersey number specific to this team
    const teamAssignment = p.teams?.find(t => t.teamId === team.id);
    return {
      ...p,
      jerseyNumber: teamAssignment?.jerseyNumber || p.jerseyNumber,
    };
  });

  // Resolve the current user ID robustly:
  // 1. Use the prop if provided (passed down from App's currentUser state)
  // 2. Fall back to reading directly from localStorage via getCurrentUserId()
  //    This covers the case where the prop hasn't propagated yet (e.g. auth check
  //    still in flight) but localStorage already has the user.
  const resolvedUserId: string | null = currentUserId || getCurrentUserId();

  // Determine if current user can edit this team.
  // Rule: users listed in coordinator_user_ids may edit (includes owner).
  // Additional check: owner_user_id also has edit rights.
  // Legacy fallback: if coordinator_user_ids is empty/missing, only the original creator (created_by) can edit.
  // NEVER grant edit access to all users just because coordinator_user_ids is empty.
  const coordinatorIds: (string | number)[] = team.coordinator_user_ids || [];
  const ownerUserId: string | number | null = team.owner_user_id || null;
  
  // Normalize all IDs to strings for comparison (handles both UUID strings and legacy numeric IDs)
  const resolvedUserIdStr: string | null = resolvedUserId ? String(resolvedUserId) : null;
  const normalizedCoordinatorIds = coordinatorIds.map(id => String(id));
  const normalizedOwnerId = ownerUserId ? String(ownerUserId) : null;
  
  const canEdit = !!( 
    resolvedUserIdStr &&
    (
      normalizedCoordinatorIds.includes(resolvedUserIdStr) ||
      (normalizedOwnerId && normalizedOwnerId === resolvedUserIdStr) ||
      (coordinatorIds.length === 0 && team.created_by === resolvedUserIdStr)
    )
  );

  // Check if current user is the owner (for additional owner-only actions like transfer ownership)
  const isOwner = !!(resolvedUserIdStr && normalizedOwnerId && normalizedOwnerId === resolvedUserIdStr);

  // Ownership debug — visible in browser console
  console.log('🔐 [TeamProfile] canEdit check', {
    teamId: team.id,
    teamName: team.name,
    resolvedUserId,
    resolvedUserIdStr,
    coordinators: team.coordinators, // Full coordinators array
    coordinator_user_ids: coordinatorIds,
    normalizedCoordinatorIds,
    owner_user_id: ownerUserId,
    normalizedOwnerId,
    created_by: team.created_by,
    canEdit,
    isOwner,
  });

  // Squad join request management functions
  const getSquadJoinRequests = () => {
    const requests = JSON.parse(localStorage.getItem('vscor_team_squad_requests') || '[]');
    return requests;
  };

  const saveSquadJoinRequests = (requests) => {
    localStorage.setItem('vscor_team_squad_requests', JSON.stringify(requests));
  };

  const getUserSquadJoinRequest = () => {
    if (!resolvedUserId || !team) return null;
    const requests = getSquadJoinRequests();
    return requests.find(
      req => req.team_id === team.id && req.user_id === resolvedUserId
    );
  };

  const handleRequestJoinSquad = () => {
    if (!resolvedUserId) {
      alert('Please log in to request to join this squad.');
      return;
    }

    // Get current user's player profile if it exists
    const userPlayer = playerDatabase.find(p => p.owner_user_id === resolvedUserId);
    const requests = getSquadJoinRequests();
    
    const newRequest = {
      id: Date.now(),
      team_id: team.id,
      team_name: team.name,
      user_id: resolvedUserId,
      user_name: userPlayer?.name || 'Unknown User',
      player_id: userPlayer?.id || null,
      status: 'pending',
      requested_at: new Date().toISOString()
    };

    const updatedRequests = [...requests, newRequest];
    saveSquadJoinRequests(updatedRequests);
    setSquadRequestStatus('pending');
    
    alert(`Request sent to join ${team.name} squad. Team coordinators will review your request.`);
  };

  const handleAcceptSquadRequest = (requestId) => {
    const requests = getSquadJoinRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;

    // Update request status
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'accepted', accepted_at: new Date().toISOString() };
      }
      return req;
    });
    saveSquadJoinRequests(updatedRequests);
    
    // If the user has a player profile, add them to the team
    if (request.player_id) {
      const player = playerDatabase.find(p => p.id === request.player_id);
      if (player) {
        // Generate a jersey number (could be customized)
        const existingJerseys = teamPlayers.map(p => parseInt(p.jerseyNumber)).filter(n => !isNaN(n));
        const suggestedJersey = existingJerseys.length > 0 ? Math.max(...existingJerseys) + 1 : 1;
        
        // Add player to team
        onAddPlayer({
          ...player,
          teamId: team.id,
          teamName: team.name,
          jerseyNumber: String(suggestedJersey),
          teams: [
            ...(player.teams || []),
            {
              teamId: team.id,
              teamName: team.name,
              jerseyNumber: String(suggestedJersey)
            }
          ]
        });
      }
    }
    
    // Reload squad request status
    loadSquadRequestStatus();
    alert(`Accepted ${request.user_name} to the squad!`);
  };

  const handleRejectSquadRequest = (requestId) => {
    const requests = getSquadJoinRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;
    
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'rejected', rejected_at: new Date().toISOString() };
      }
      return req;
    });
    saveSquadJoinRequests(updatedRequests);
    
    // Reload squad request status
    loadSquadRequestStatus();
    alert(`Rejected request from ${request.user_name}.`);
  };

  const loadSquadRequestStatus = () => {
    const userRequest = getUserSquadJoinRequest();
    if (userRequest) {
      setSquadRequestStatus(userRequest.status);
    } else {
      setSquadRequestStatus(null);
    }
  };

  // Get pending squad requests for this team
  const getPendingSquadRequests = () => {
    const requests = getSquadJoinRequests();
    return requests.filter(
      req => req.team_id === team.id && req.status === 'pending'
    );
  };

  const pendingSquadRequests = getPendingSquadRequests();

  // Load squad request status on mount
  useEffect(() => {
    if (team?.id && resolvedUserId) {
      loadSquadRequestStatus();
    }
  }, [team?.id, resolvedUserId]);

  // Load follow data
  useEffect(() => {
    if (team?.id) {
      const count = getTeamFollowerCount(team.id);
      setFollowerCount(count);
      
      if (resolvedUserId) {
        const following = isFollowingTeam(team.id, resolvedUserId);
        setIsFollowing(following);
      }
    }
  }, [team?.id, resolvedUserId]);

  // Auto-repair coordinator_user_ids if it's out of sync with coordinators array
  useEffect(() => {
    if (!team || !onUpdateTeam) return;
    
    // Build what coordinator_user_ids SHOULD be based on coordinators array
    const coordinatorsArray = team.coordinators || [];
    const expectedCoordinatorUserIds = coordinatorsArray
      .filter(c => c.user_id != null)
      .map(c => String(c.user_id));
    
    // Get current coordinator_user_ids
    const currentCoordinatorUserIds = (team.coordinator_user_ids || []).map(id => String(id));
    
    // Check if they're different (data out of sync)
    const needsRepair = 
      expectedCoordinatorUserIds.length !== currentCoordinatorUserIds.length ||
      expectedCoordinatorUserIds.some(id => !currentCoordinatorUserIds.includes(id));
    
    if (needsRepair) {
      console.log('🔧 [TeamProfile] Auto-repairing coordinator_user_ids', {
        teamId: team.id,
        teamName: team.name,
        currentCoordinatorUserIds,
        expectedCoordinatorUserIds,
      });
      
      // Auto-repair the data
      const repairedTeam = {
        ...team,
        coordinator_user_ids: expectedCoordinatorUserIds
      };
      
      onUpdateTeam(team.id, repairedTeam);
    }
  }, [team?.id]); // Only run when team ID changes (on mount/team change)

  const handleSave = () => {
    // Rebuild coordinator_user_ids from coordinators array
    const coordinatorUserIds = coordinators
      .filter(c => c.user_id != null)
      .map(c => c.user_id);
    
    // Save with updated coordinators and coordinator_user_ids
    const teamToSave = {
      ...editedTeam,
      coordinators,
      coordinator_user_ids: coordinatorUserIds
    };
    
    onUpdateTeam(editedTeam.id, teamToSave);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTeam(team);
    setIsEditing(false);
  };

  const handleFollow = () => {
    if (!resolvedUserId) {
      alert('Please log in to follow this team.');
      return;
    }

    if (isFollowing) {
      unfollowTeam(team.id, resolvedUserId);
      setIsFollowing(false);
      setFollowerCount(followerCount - 1);
    } else {
      followTeam(team.id, resolvedUserId);
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  };

  const handleChange = (field, value) => {
    setEditedTeam({
      ...editedTeam,
      [field]: value
    });
  };

  const handleAddPlayer = () => {
    // Check permissions
    if (!canEdit) {
      alert('Only team owners and coordinators can add players.');
      return;
    }
    
    if (newPlayer.name && newPlayer.jerseyNumber) {
      onAddPlayer({
        ...newPlayer,
        teamId: team.id,
        teamName: team.name,
        teams: [{
          teamId: team.id,
          teamName: team.name,
          jerseyNumber: newPlayer.jerseyNumber
        }]
      });
      setNewPlayer({
        name: '',
        jerseyNumber: ''
      });
      setShowAddPlayerInline(false);
    }
  };

  // Sort players alphabetically by name
  const sortedPlayers = [...teamPlayers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Get registered users (have an account) for coordinator suggestions
  const registeredUsers = playerDatabase.filter(p => p.owner_user_id != null);
  
  // Handler to select coordinator from autocomplete
  const selectCoordinatorFromSuggestion = (index, user) => {
    const newCoordinators = [...coordinators];
    newCoordinators[index] = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phoneNumber || '',
      user_id: user.owner_user_id || null,
    };
    setCoordinators(newCoordinators);
    handleChange('coordinators', newCoordinators);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
          </button>
          <h1 className="font-medium dark:text-gray-100">Team Profile</h1>
        </div>
        <div className="flex gap-2 items-center">
          {!canEdit && resolvedUserId && (
            <Button
              onClick={handleRequestJoinSquad}
              variant="outline"
              className={`flex items-center gap-2 ${
                squadRequestStatus === 'pending' 
                  ? 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700' 
                  : squadRequestStatus === 'accepted' 
                  ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-900/30 dark:border-green-700' 
                  : squadRequestStatus === 'rejected' 
                  ? 'border-red-500 text-red-700 bg-red-50 dark:bg-red-900/30 dark:border-red-700' 
                  : 'border-purple-500 text-purple-700 dark:text-purple-400'
              }`}
              disabled={squadRequestStatus !== null}
            >
              <UserPlus className="w-4 h-4" />
              {squadRequestStatus === 'pending' 
                ? 'Request Sent' 
                : squadRequestStatus === 'accepted' 
                ? 'Request Accepted' 
                : squadRequestStatus === 'rejected' 
                ? 'Request Rejected' 
                : 'Request to Join Squad'}
            </Button>
          )}
          {!canEdit && !resolvedUserId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>View only</span>
            </div>
          )}
          {canEdit && !isEditing && (
            <>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            </>
          )}
          {canEdit && isEditing && (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Team Profile Header */}
        <div className="flex flex-col items-center gap-4">
          {/* Team Logo */}
          <div className="flex flex-col items-center gap-3">
            <ImageAvatar
              src={editedTeam.imageUrl}
              alt={editedTeam.name || 'Team'}
              type="team"
              size="xl"
            />
            
            {isEditing && (
              <div className="flex gap-2">
                <label htmlFor="team-image-upload">
                  <input
                    id="team-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('team-image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {editedTeam.imageUrl ? 'Change' : 'Upload'}
                  </Button>
                </label>
                {editedTeam.imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Team Name */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {team.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {team.coach} • {team.homeVenue}
            </p>
          </div>

          {/* Followers Count and Follow Button - Only for non-owners/coordinators */}
          {!canEdit && resolvedUserId && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {followerCount}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>

              <Button
                onClick={handleFollow}
                size="sm"
                className={`flex items-center gap-2 ${
                  isFollowing 
                    ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Show follower count for owners/coordinators */}
          {canEdit && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                {followerCount}
              </span>
              <span className="text-sm text-purple-700 dark:text-purple-300">
                {followerCount === 1 ? 'follower' : 'followers'}
              </span>
            </div>
          )}
        </div>

        {/* Team Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg dark:text-gray-100">Team Information</h2>

          <div className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedTeam.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter team name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100 p-2">{team.name}</p>
              )}
            </div>

            {/* Coach */}
            <div className="space-y-2">
              <Label htmlFor="coach">Coach/Manager *</Label>
              {isEditing ? (
                <Input
                  id="coach"
                  value={editedTeam.coach || ''}
                  onChange={(e) => handleChange('coach', e.target.value)}
                  placeholder="Enter coach name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100 p-2">{team.coach}</p>
              )}
            </div>

            {/* Home Venue */}
            <div className="space-y-2">
              <Label htmlFor="homeVenue">Home Venue *</Label>
              {isEditing ? (
                <Input
                  id="homeVenue"
                  value={editedTeam.homeVenue || ''}
                  onChange={(e) => handleChange('homeVenue', e.target.value)}
                  placeholder="Enter home venue"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 p-2">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  {team.homeVenue}
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editedTeam.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter team description"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100 p-2">{team.description || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Team Coordinators */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg dark:text-gray-100">Team Coordinators</h2>
            {isEditing && canEdit && coordinators.length < 2 && (
              <Button
                onClick={() => setCoordinators([...coordinators, { name: '', phone: '', email: '' }])}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Add Coordinator
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {coordinators.map((coordinator, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">Coordinator {index + 1}</h3>
                    {coordinators.length > 1 && (
                      <Button
                        onClick={() => {
                          const newCoordinators = coordinators.filter((_, i) => i !== index);
                          setCoordinators(newCoordinators);
                          handleChange('coordinators', newCoordinators);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`coord-name-${index}`}>Name (Select registered user or type manually)</Label>
                    <UserAutocompleteInput
                      value={coordinator.name || ''}
                      onChange={(val) => {
                        const newCoordinators = [...coordinators];
                        newCoordinators[index].name = val;
                        setCoordinators(newCoordinators);
                        handleChange('coordinators', newCoordinators);
                      }}
                      onSelect={(user) => selectCoordinatorFromSuggestion(index, user)}
                      users={registeredUsers}
                      placeholder="Full name"
                      suggestionSubLabel={(u) =>
                        [u.email, u.phoneNumber].filter(Boolean).join(' · ')
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select from registered users or type manually. Email and phone will be auto-filled for registered users.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor={`coord-phone-${index}`}>Phone Number</Label>
                    <Input
                      id={`coord-phone-${index}`}
                      type="tel"
                      value={coordinator.phone || ''}
                      onChange={(e) => {
                        const newCoordinators = [...coordinators];
                        newCoordinators[index].phone = e.target.value;
                        setCoordinators(newCoordinators);
                        handleChange('coordinators', newCoordinators);
                      }}
                      placeholder="+91XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`coord-email-${index}`}>Email</Label>
                    <Input
                      id={`coord-email-${index}`}
                      type="email"
                      value={coordinator.email || ''}
                      onChange={(e) => {
                        const newCoordinators = [...coordinators];
                        newCoordinators[index].email = e.target.value;
                        setCoordinators(newCoordinators);
                        handleChange('coordinators', newCoordinators);
                      }}
                      placeholder="coordinator@example.com"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(team.coordinators && team.coordinators.length > 0) ? (
                team.coordinators.map((coordinator, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-sm mb-2">Coordinator {index + 1}</h3>
                    <div className="space-y-1 text-sm">
                      {coordinator.name && <p className="text-gray-900"><span className="text-gray-600">Name:</span> {coordinator.name}</p>}
                      {coordinator.phone && <p className="text-gray-900"><span className="text-gray-600">Phone:</span> {coordinator.phone}</p>}
                      {coordinator.email && <p className="text-gray-900"><span className="text-gray-600">Email:</span> {coordinator.email}</p>}
                      {!coordinator.name && !coordinator.phone && !coordinator.email && (
                        <p className="text-gray-500">No details provided</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No coordinators added</p>
              )}
            </div>
          )}
        </div>

        {/* Team Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg dark:text-gray-100">Team Statistics</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="text-2xl font-medium text-purple-600 dark:text-purple-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Matches</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="text-2xl font-medium text-green-600 dark:text-green-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Wins</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="text-2xl font-medium text-blue-600 dark:text-blue-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Goals</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
            Statistics will be automatically updated from match results
          </p>
        </div>

        {/* Team Squad */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-lg dark:text-gray-100">Squad ({teamPlayers.length} players)</h2>
              {canEdit && pendingSquadRequests.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                  <Bell className="w-3 h-3" />
                  {pendingSquadRequests.length}
                </div>
              )}
            </div>
            {isEditing && canEdit && !showAddPlayerInline && (
              <Button
                onClick={() => setShowAddPlayerInline(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="w-4 h-4" />
                Add Player
              </Button>
            )}
          </div>

          {/* Squad Join Requests - Only visible to coordinators */}
          {canEdit && pendingSquadRequests.length > 0 && (
            <div className="border border-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-purple-900 dark:text-purple-100">
                  Join Requests ({pendingSquadRequests.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pendingSquadRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm dark:text-gray-100">{request.user_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRejectSquadRequest(request.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleAcceptSquadRequest(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Add Player Form */}
          {showAddPlayerInline && (
            <div className="border border-purple-300 bg-purple-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-sm">Add New Player</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    placeholder="Player name *"
                    className="bg-white"
                  />
                </div>
                <div className="w-24">
                  <Input
                    value={newPlayer.jerseyNumber}
                    onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                    placeholder="Jersey #"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowAddPlayerInline(false);
                    setNewPlayer({ name: '', jerseyNumber: '' });
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPlayer}
                  disabled={!newPlayer.name}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Add Player
                </Button>
              </div>
            </div>
          )}

          {teamPlayers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No players in this team</p>
              {isEditing && canEdit && !showAddPlayerInline && (
                <Button
                  onClick={() => setShowAddPlayerInline(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Add First Player
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedPlayers.map((player) => (
                <PlayerListItem
                  key={player.id}
                  player={player}
                  onClick={!isEditing ? () => onPlayerClick(player) : undefined}
                  showPosition={true}
                  showJerseyBadge={true}
                  className={!isEditing ? '' : 'cursor-default hover:bg-white'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Verification Info Dialog */}
      <Dialog open={showVerificationInfo} onOpenChange={setShowVerificationInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Verification Badge
            </DialogTitle>
            <DialogDescription>
              How players get verified
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Player Verification</h3>
              <p className="text-sm text-gray-600">
                Players receive a verification badge when they add a valid <span className="font-medium text-purple-600">Indian phone number (+91 followed by 10 digits)</span> to their profile.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Match Verification</h3>
              <p className="text-sm text-gray-600">
                Matches get verified when <span className="font-medium text-purple-600">more than 50% of players from both teams</span> have verified their profiles.
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

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Team Name</h3>
              <p className="text-sm text-gray-600">
                {team.name}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Players</h3>
              <p className="text-sm text-gray-600">
                {teamPlayers.length} players
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700">
                  Deleting a team will remove all associated players and matches.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeleteTeam(team.id);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamProfile;