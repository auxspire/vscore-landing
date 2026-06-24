// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Plus, Camera, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { POSITIONS } from '../constants/positions';
import ImageAvatar from './ImageAvatar';

const AddPlayer = ({ onBack, onAddPlayer, playerDatabase = [], registeredTeams = [], initialValues = null, title = 'Add Player' }) => {
  const [playerName, setPlayerName] = useState(initialValues?.name || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  // Changed to array to support multiple teams
  const [teamAssignments, setTeamAssignments] = useState([{ teamId: '', teamName: '', jerseyNumber: '' }]);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
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

  // Check for duplicate player name in the player database
  const isDuplicateName = playerName.trim() !== '' && 
    playerDatabase.some(player => player.name.toLowerCase() === playerName.toLowerCase());

  const isPhoneValid = phoneNumber === '' || (phoneNumber.length === 10 && /^\d+$/.test(phoneNumber));
  const isFormValid = playerName.trim() !== '' && isPhoneValid;

  const handleSubmit = () => {
    const validAssignments = teamAssignments.filter(assignment => assignment.teamId);
    
    // Combine country code and phone number
    const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
    
    const playerData = {
      name: playerName,
      phoneNumber: fullPhoneNumber,
      email,
      dateOfBirth,
      position,
      teams: validAssignments.map(assignment => ({
        teamName: assignment.teamName,
        teamId: assignment.teamId,
        jerseyNumber: assignment.jerseyNumber || String(Math.floor(Math.random() * 99) + 1)
      })),
      // For backwards compatibility, use first team assignment as default
      teamId: validAssignments[0]?.teamId || null,
      teamName: validAssignments[0]?.teamName || null,
      jerseyNumber: validAssignments[0]?.jerseyNumber || String(Math.floor(Math.random() * 99) + 1),
      height,
      weight,
      nationality,
      preferredFoot,
      bio,
      imageUrl
    };
    
    console.log('Player created:', playerData);
    
    if (onAddPlayer) {
      onAddPlayer(playerData);
    }
    onBack();
  };

  // Add new team assignment
  const addTeamAssignment = () => {
    setTeamAssignments([...teamAssignments, { teamId: '', teamName: '', jerseyNumber: '' }]);
  };

  // Remove team assignment
  const removeTeamAssignment = (index) => {
    if (teamAssignments.length > 1) {
      setTeamAssignments(teamAssignments.filter((_, i) => i !== index));
    }
  };

  // Update team assignment
  const updateTeamAssignment = (index, field, value) => {
    const newAssignments = [...teamAssignments];
    if (field === 'teamId') {
      // When team is selected, also store the team name and ID
      const selectedTeam = registeredTeams.find(t => t.id === parseInt(value));
      if (selectedTeam) {
        newAssignments[index] = {
          ...newAssignments[index],
          teamId: selectedTeam.id,
          teamName: selectedTeam.name
        };
      }
    } else {
      newAssignments[index][field] = value;
    }
    setTeamAssignments(newAssignments);
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-medium">{title}</h1>
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
              id="player-image-upload"
            />
            <label
              htmlFor="player-image-upload"
              className="block w-32 h-32 rounded-full overflow-hidden cursor-pointer relative bg-gray-100 border-2 border-gray-300"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Player"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50">
                  <UserCircle className="w-20 h-20 text-purple-300" />
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
        
        {/* Primary Fields */}
        <div className="space-y-4 pb-4 border-b-2 border-purple-100">
          <div>
            <label className="block text-sm font-medium mb-2">
              Player Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
            {isDuplicateName && (
              <p className="text-red-500 text-sm mt-1">There is an existing player under the same name, add phone number to differentiate</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+91"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="py-3 border border-gray-300 rounded-lg w-24"
                maxLength={4}
              />
              <Input
                type="tel"
                placeholder="10-digit number"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setPhoneNumber(value);
                  }
                }}
                className={`flex-1 py-3 border rounded-lg ${
                  phoneNumber && !isPhoneValid ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={10}
              />
            </div>
            {phoneNumber && !isPhoneValid && (
              <p className="text-red-500 text-sm mt-1">Please enter a valid 10-digit number</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Optional Information</p>

          <div>
            <label className="block text-sm font-medium mb-2">Date of Birth</label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Position</label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="py-3 border border-gray-300 rounded-lg">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos.toLowerCase().replace(' ', '_')}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Assignments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Team & Jersey Number</label>
            <Button
              type="button"
              onClick={addTeamAssignment}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4" />
              Add Another Team
            </Button>
          </div>

          {teamAssignments.map((assignment, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-[2]">
                <Select 
                  value={assignment.teamId ? String(assignment.teamId) : ''} 
                  onValueChange={(value) => updateTeamAssignment(index, 'teamId', value)}
                >
                  <SelectTrigger className="py-3 border border-gray-300 rounded-lg">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {registeredTeams.map((team) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Jersey #"
                  value={assignment.jerseyNumber}
                  onChange={(e) => updateTeamAssignment(index, 'jerseyNumber', e.target.value)}
                  className="py-3 border border-gray-300 rounded-lg"
                  min="1"
                  max="99"
                />
              </div>

              {teamAssignments.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeTeamAssignment(index)}
                  variant="ghost"
                  size="sm"
                  className="mt-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Height (cm)</label>
            <Input
              type="number"
              placeholder="Height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weight (kg)</label>
            <Input
              type="number"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nationality</label>
            <Input
              placeholder="Nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Foot</label>
            <Select value={preferredFoot} onValueChange={setPreferredFoot}>
              <SelectTrigger className="py-3 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Select foot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <Textarea
            placeholder="Enter player bio (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="border border-gray-300 rounded-lg"
            rows={3}
          />
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
            disabled={!isFormValid}
          >
            Register Player
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayer;