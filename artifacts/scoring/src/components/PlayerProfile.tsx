import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, Phone, Calendar, MapPin, Plus, Trash2, CheckCircle, Info, Weight, Ruler, User as UserIcon, Camera, Upload, Lock, AlertTriangle, UserPlus, UserCheck, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import ImageAvatar from './ImageAvatar';
import { POSITIONS } from '../constants/positions';
import {
  getPlayerFollowerCount,
  isFollowingPlayer,
  followPlayer,
  unfollowPlayer
} from '../utils/playerFollows';

const PlayerProfile = ({ player, onBack, onUpdatePlayer, onDeletePlayer, teams = [], completedMatches = [], currentUserId = null, onViewMatches = null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState(player);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selfDeleteAcknowledged, setSelfDeleteAcknowledged] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Is this player the logged-in user's own profile?
  const isOwnProfile = !!(
    currentUserId &&
    player.owner_user_id &&
    String(player.owner_user_id) === String(currentUserId)
  );
  
  // Separate country code and phone number for editing
  const [countryCode, setCountryCode] = useState(() => {
    if (editedPlayer.phoneNumber && editedPlayer.phoneNumber.startsWith('+')) {
      const match = editedPlayer.phoneNumber.match(/^(\+\d+)(\d{10})$/);
      return match ? match[1] : '+91';
    }
    return '+91';
  });
  
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (editedPlayer.phoneNumber && editedPlayer.phoneNumber.startsWith('+')) {
      const match = editedPlayer.phoneNumber.match(/^(\+\d+)(\d{10})$/);
      return match ? match[2] : '';
    }
    return editedPlayer.phoneNumber || '';
  });
  
  // ── helpers matching the same logic as MyMatches ──────────────────────────
  const _pid = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p.trim().toLowerCase();
    return (p.name || '').trim().toLowerCase();
  };
  const _same = (ref: any, target: any): boolean => {
    if (!ref || !target) return false;
    if (ref.id != null && target.id != null && String(ref.id) === String(target.id)) return true;
    const rn = _pid(ref); const tn = _pid(target);
    return !!rn && rn === tn;
  };

  // Calculate career statistics from completed matches
  const calculateCareerStats = () => {
    let matches = 0;
    let goals = 0;
    let assists = 0;
    let yellowCards = 0;
    let redCards = 0;
    let totalRating = 0;
    let ratedMatches = 0;

    completedMatches.forEach(match => {
      const events: any[] = match.events || [];
      const playerRatings: any = match.playerRatings || match.ratings || {};

      // Squad check — same field-name fallbacks as MyMatches
      const squadA: any[] = match.team1Squad || match.squadA || match.squad1 || match.teamASquad || [];
      const squadB: any[] = match.team2Squad || match.squadB || match.squad2 || match.teamBSquad || [];
      const inSquadA = squadA.some(p => _same(p, player));
      const inSquadB = squadB.some(p => _same(p, player));

      // Events-based participation fallback
      const teamA = match.teamA || match.team1 || '';
      const teamB = match.teamB || match.team2 || '';
      const inEventsA = !inSquadA && !inSquadB && events.some(ev => {
        const isP = _same(ev.player, player) || _same(ev.assist, player) || _same(ev.assistedBy, player);
        return isP && (ev.team === 1 || ev.team === '1' || ev.teamName === teamA);
      });
      const inEventsB = !inSquadA && !inSquadB && !inEventsA && events.some(ev => {
        const isP = _same(ev.player, player) || _same(ev.assist, player) || _same(ev.assistedBy, player);
        return isP && (ev.team === 2 || ev.team === '2' || ev.teamName === teamB);
      });

      if (!inSquadA && !inSquadB && !inEventsA && !inEventsB) return;
      matches++;

      events.forEach(ev => {
        const isThisPlayer = _same(ev.player, player) || _same(ev.playerOut, player);
        if (ev.type === 'goal' && !ev.ownGoal && _same(ev.player, player)) goals++;
        if (ev.type === 'goal' && (_same(ev.assist, player) || _same(ev.assistedBy, player))) assists++;
        if (isThisPlayer && (ev.type === 'yellowCard' || (ev.type === 'foul' && ev.cardType === 'yellow'))) yellowCards++;
        if (isThisPlayer && (ev.type === 'redCard'    || (ev.type === 'foul' && ev.cardType === 'red')))    redCards++;
      });

      // Rating — check playerRatings and ratings maps
      const pid = String(player.id);
      const rEntry = playerRatings[pid];
      if (rEntry) {
        const r = rEntry?.rating ?? (typeof rEntry === 'number' ? rEntry : null);
        if (r != null) { totalRating += r; ratedMatches++; }
      }
    });

    const averageRating = ratedMatches > 0 ? (totalRating / ratedMatches).toFixed(1) : null;
    return { matches, goals, assists, yellowCards, redCards, averageRating };
  };
  
  const stats = calculateCareerStats();
  
  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNum) => {
    if (!phoneNum) return false;
    return /^\+91\d{10}$/.test(phoneNum);
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

  const handleSave = () => {
    // Combine country code and phone number before saving
    const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
    const updatedPlayer = {
      ...editedPlayer,
      phoneNumber: fullPhoneNumber
    };
    onUpdatePlayer(editedPlayer.id, updatedPlayer);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPlayer(player);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedPlayer({
      ...editedPlayer,
      [field]: value
    });
  };

  // Handle team assignment changes
  const handleTeamAssignmentChange = (index, field, value) => {
    const updatedTeams = [...(editedPlayer.teams || [])];
    if (field === 'teamId') {
      const selectedTeam = teams.find(t => t.id === parseInt(value));
      if (selectedTeam) {
        updatedTeams[index] = {
          ...updatedTeams[index],
          teamId: selectedTeam.id,
          teamName: selectedTeam.name
        };
      }
    } else {
      updatedTeams[index] = {
        ...updatedTeams[index],
        [field]: value
      };
    }
    
    setEditedPlayer({
      ...editedPlayer,
      teams: updatedTeams,
      // Update legacy fields with first team
      teamId: updatedTeams[0]?.teamId || null,
      teamName: updatedTeams[0]?.teamName || null,
      jerseyNumber: updatedTeams[0]?.jerseyNumber || editedPlayer.jerseyNumber
    });
  };

  const handleAddTeamAssignment = () => {
    const updatedTeams = [...(editedPlayer.teams || []), { teamId: null, teamName: '', jerseyNumber: '' }];
    setEditedPlayer({
      ...editedPlayer,
      teams: updatedTeams
    });
  };

  const handleRemoveTeamAssignment = (index) => {
    const updatedTeams = (editedPlayer.teams || []).filter((_, i) => i !== index);
    setEditedPlayer({
      ...editedPlayer,
      teams: updatedTeams,
      // Update legacy fields with first remaining team
      teamId: updatedTeams[0]?.teamId || null,
      teamName: updatedTeams[0]?.teamName || null,
      jerseyNumber: updatedTeams[0]?.jerseyNumber || editedPlayer.jerseyNumber
    });
  };

  // Determine if current user can edit this player profile.
  // Rule: the user who created/owns the player (owner_user_id) may edit.
  // Legacy players with no owner_user_id are editable by anyone (migration case).
  const canEdit = !player.owner_user_id || player.owner_user_id === currentUserId;

  useEffect(() => {
    const fetchFollowerCount = async () => {
      const count = await getPlayerFollowerCount(player.id);
      setFollowerCount(count);
    };

    const checkFollowingStatus = async () => {
      const isFollowing = await isFollowingPlayer(player.id, currentUserId);
      setIsFollowing(isFollowing);
    };

    fetchFollowerCount();
    checkFollowingStatus();
  }, [player.id, currentUserId]);

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowPlayer(player.id, currentUserId);
      setIsFollowing(false);
      setFollowerCount(followerCount - 1);
    } else {
      await followPlayer(player.id, currentUserId);
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
          </button>
          <h1 className="font-medium dark:text-gray-100">Player Profile</h1>
        </div>
        <div className="flex gap-2 items-center">
          {!canEdit ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>View only</span>
            </div>
          ) : !isEditing ? (
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
          ) : (
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
        {/* Player Profile Header */}
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <ImageAvatar
              src={editedPlayer.imageUrl}
              alt={editedPlayer.name || 'Player'}
              type="player"
              size="xl"
            />
            
            {isEditing && (
              <div className="flex gap-2">
                <label htmlFor="player-image-upload">
                  <input
                    id="player-image-upload"
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
                    onClick={() => document.getElementById('player-image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {editedPlayer.imageUrl ? 'Change' : 'Upload'}
                  </Button>
                </label>
                {editedPlayer.imageUrl && (
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

          {/* Player Name */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {player.name}
              </h1>
              {hasValidPhoneNumber(player.phoneNumber) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVerificationInfo(true);
                  }}
                  className="flex items-center"
                  title="Verified Player"
                >
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{player.jerseyNumber} • {player.position || 'Position not set'}
            </p>
          </div>

          {/* Followers Count and Follow Button */}
          {!isOwnProfile && (
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

          {/* Show follower count for own profile */}
          {isOwnProfile && (
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

        {/* Player Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-lg dark:text-gray-100">Basic Information</h2>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Player Name *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedPlayer.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter player name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100 p-2">{player.name}</p>
              )}
            </div>

            {/* Jersey Number */}
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Jersey Number *</Label>
              {isEditing ? (
                <Input
                  id="jerseyNumber"
                  value={editedPlayer.jerseyNumber || ''}
                  onChange={(e) => handleChange('jerseyNumber', e.target.value)}
                  placeholder="Enter jersey number"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100 p-2">{player.jerseyNumber}</p>
              )}
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              {isEditing ? (
                <Select
                  value={editedPlayer.position || ''}
                  onValueChange={(value) => handleChange('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-900 p-2">{player.position || 'Not specified'}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+91"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24"
                    maxLength={4}
                  />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="10-digit number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setPhoneNumber(value);
                      }
                    }}
                    className="flex-1"
                    maxLength={10}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 p-2">{player.phoneNumber || 'Not provided'}</p>
                  {!hasValidPhoneNumber(player.phoneNumber) && (
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        Verification requires a valid 10-digit phone number in +91XXXXXXXXXX format
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  placeholder="player@example.com"
                  value={editedPlayer.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 p-2">{player.email || 'Not provided'}</p>
              )}
            </div>
            
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editedPlayer.dateOfBirth || ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 p-2">{player.dateOfBirth || 'Not provided'}</p>
              )}
            </div>
            
            {/* Height and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">
                  <span className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    Height (cm)
                  </span>
                </Label>
                {isEditing ? (
                  <Input
                    id="height"
                    type="number"
                    value={editedPlayer.height || ''}
                    onChange={(e) => handleChange('height', e.target.value)}
                    placeholder="Height"
                  />
                ) : (
                  <p className="text-gray-900 p-2">{player.height ? `${player.height} cm` : 'Not provided'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">
                  <span className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-gray-500" />
                    Weight (kg)
                  </span>
                </Label>
                {isEditing ? (
                  <Input
                    id="weight"
                    type="number"
                    value={editedPlayer.weight || ''}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder="Weight"
                  />
                ) : (
                  <p className="text-gray-900 p-2">{player.weight ? `${player.weight} kg` : 'Not provided'}</p>
                )}
              </div>
            </div>
            
            {/* Nationality and Preferred Foot */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                {isEditing ? (
                  <Input
                    id="nationality"
                    value={editedPlayer.nationality || ''}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    placeholder="Nationality"
                  />
                ) : (
                  <p className="text-gray-900 p-2">{player.nationality || 'Not provided'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredFoot">Preferred Foot</Label>
                {isEditing ? (
                  <Select
                    value={editedPlayer.preferredFoot || ''}
                    onValueChange={(value) => handleChange('preferredFoot', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select foot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-900 p-2 capitalize">{player.preferredFoot || 'Not provided'}</p>
                )}
              </div>
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editedPlayer.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Enter player bio"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900 p-2">{player.bio || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Team Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg dark:text-gray-100">Team Assignments</h2>
            {isEditing && (
              <Button
                onClick={handleAddTeamAssignment}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Team
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {(editedPlayer.teams && editedPlayer.teams.length > 0) ? (
                editedPlayer.teams.map((teamAssignment, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={teamAssignment.teamId ? String(teamAssignment.teamId) : ''}
                        onValueChange={(value) => handleTeamAssignmentChange(index, 'teamId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={String(team.id)}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="Jersey #"
                        value={teamAssignment.jerseyNumber || ''}
                        onChange={(e) => handleTeamAssignmentChange(index, 'jerseyNumber', e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => handleRemoveTeamAssignment(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No team assignments. Click "Add Team" to add one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(player.teams && player.teams.length > 0) ? (
                player.teams.map((teamAssignment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{teamAssignment.teamName}</span>
                      <span className="text-sm text-gray-600">#{teamAssignment.jerseyNumber || 'N/A'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">{player.teamName ? `Primary Team: ${player.teamName} (#${player.jerseyNumber})` : 'No team assigned'}</p>
              )}
            </div>
          )}
        </div>

        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg dark:text-gray-100">Career Statistics</h2>
            {onViewMatches && stats.matches > 0 && (
              <span className="text-xs text-purple-500 dark:text-purple-400 font-medium">Tap stat to view matches</span>
            )}
          </div>

          {/* Average Rating — clickable */}
          {stats.averageRating && (
            <button
              onClick={() => onViewMatches?.(player, 'rated')}
              disabled={!onViewMatches}
              className={`w-full bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center transition-all ${
                onViewMatches ? 'hover:from-purple-100 hover:to-purple-200 active:scale-[0.98] cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="text-3xl font-bold text-purple-600">{stats.averageRating}</div>
              <div className="text-sm text-gray-600 mt-1">Average Rating</div>
              <div className="text-xs text-gray-500 mt-1">
                (from {stats.matches} {stats.matches === 1 ? 'match' : 'matches'})
                {onViewMatches && <span className="ml-1 text-purple-400">→</span>}
              </div>
            </button>
          )}

          {/* Matches / Goals / Assists row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Matches', value: stats.matches, color: 'text-purple-600', filter: 'all', enabled: stats.matches > 0 },
              { label: 'Goals',   value: stats.goals,   color: 'text-green-600',  filter: 'goals',   enabled: stats.goals > 0 },
              { label: 'Assists', value: stats.assists, color: 'text-blue-600',   filter: 'assists', enabled: stats.assists > 0 },
            ].map(({ label, value, color, filter, enabled }) => (
              <button
                key={label}
                onClick={() => enabled && onViewMatches?.(player, filter)}
                disabled={!onViewMatches || !enabled}
                className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transition-all ${
                  onViewMatches && enabled
                    ? 'hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:ring-1 hover:ring-purple-200 dark:hover:ring-purple-700 active:scale-[0.97] cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                <p className={`text-2xl font-bold ${color} dark:opacity-90`}>{value}</p>
              </button>
            ))}
          </div>

          {/* Yellow / Red cards row */}
          <div className="grid grid-cols-2 gap-4 text-center">
            {[
              { label: 'Yellow Cards', value: stats.yellowCards, color: 'text-yellow-600', filter: 'yellowCards', enabled: stats.yellowCards > 0 },
              { label: 'Red Cards',    value: stats.redCards,    color: 'text-red-600',    filter: 'redCards',    enabled: stats.redCards > 0 },
            ].map(({ label, value, color, filter, enabled }) => (
              <button
                key={label}
                onClick={() => enabled && onViewMatches?.(player, filter)}
                disabled={!onViewMatches || !enabled}
                className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transition-all ${
                  onViewMatches && enabled
                    ? 'hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:ring-1 hover:ring-purple-200 dark:hover:ring-purple-700 active:scale-[0.97] cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                <p className={`text-2xl font-bold ${color} dark:opacity-90`}>{value}</p>
              </button>
            ))}
          </div>

          {stats.matches === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              No match statistics yet. Statistics will be automatically updated from match events.
            </p>
          )}
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <div className="mt-6">
            <Button
              onClick={handleFollow}
              className={`w-full bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center transition-all ${
                isFollowing ? 'hover:from-purple-100 hover:to-purple-200 active:scale-[0.98] cursor-pointer' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-center">
                {isFollowing ? (
                  <UserCheck className="w-4 h-4 text-purple-600" />
                ) : (
                  <UserPlus className="w-4 h-4 text-purple-600" />
                )}
                <div className="ml-2 text-sm font-medium text-purple-600">
                  {isFollowing ? 'Following' : 'Follow'}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
              </div>
            </Button>
          </div>
        )}
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
      
      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setSelfDeleteAcknowledged(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOwnProfile ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Trash2 className="w-5 h-5 text-red-600" />
              )}
              {isOwnProfile ? 'Delete Your Own Profile' : 'Delete Player'}
            </DialogTitle>
            <DialogDescription>
              {isOwnProfile
                ? 'Read the warning below carefully before proceeding.'
                : 'Are you sure you want to delete this player? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Player summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-gray-800">{player.name}</p>
              <p className="text-xs text-gray-500">
                #{player.jerseyNumber} · {player.position}
              </p>
            </div>

            {/* Standard warning */}
            <div className="flex items-start gap-2 px-1">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Deleting this player will permanently remove their profile and all associated stats. This cannot be undone.
              </p>
            </div>

            {/* ── Self-deletion extra warning ── */}
            {isOwnProfile && (
              <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">
                    You are deleting your own profile!
                  </p>
                </div>
                <p className="text-sm text-red-700 leading-relaxed">
                  This player profile is linked to your user account. Deleting it will{' '}
                  <span className="font-bold">disconnect your account</span> — you will be
                  logged out and will need to{' '}
                  <span className="font-bold">sign up again</span> to use VScor.
                </p>
                <ul className="space-y-1 pl-1">
                  {[
                    'Your match history stays in the app',
                    'Your account login will no longer work',
                    'You will need to create a new account to sign in',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-red-600">
                      <span className="mt-0.5 text-red-400 font-bold">•</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Acknowledgement checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none mt-2">
                  <input
                    type="checkbox"
                    checked={selfDeleteAcknowledged}
                    onChange={(e) => setSelfDeleteAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-red-600 flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-red-700 font-medium leading-relaxed">
                    I understand that deleting this profile will remove my account link and I will need to sign up again.
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelfDeleteAcknowledged(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeletePlayer(player.id);
                setShowDeleteConfirm(false);
                setSelfDeleteAcknowledged(false);
              }}
              disabled={isOwnProfile && !selfDeleteAcknowledged}
              className={`flex-1 ${
                isOwnProfile
                  ? 'bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isOwnProfile ? 'Delete My Profile' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerProfile;