import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Plus, CheckCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import ImageAvatar from './ImageAvatar';
import PlayerListItem from './PlayerListItem';

const PlayersList = ({ onBack, playerDatabase = [], onPlayerClick, onAddPlayer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState([]);

  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    return /^\+91\d{10}$/.test(phoneNumber);
  };

  // Helper function to get team names for a player
  const getTeamNames = (player) => {
    // Check for new multi-team structure first
    if (player.teams && player.teams.length > 0) {
      return player.teams.map(t => t.teamName).join(', ');
    }
    // Fallback to legacy single team field
    if (player.teamName) {
      return player.teamName;
    }
    // Check legacy teamId field (shouldn't happen but just in case)
    if (player.team) {
      return player.team;
    }
    return null;
  };

  useEffect(() => {
    // Filter players based on search query
    if (searchQuery.trim() === '') {
      setFilteredPlayers(playerDatabase);
    } else {
      const filtered = playerDatabase.filter(player => {
        const teamNames = getTeamNames(player);
        return (
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (teamNames && teamNames.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (player.position && player.position.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      });
      setFilteredPlayers(filtered);
    }
  }, [searchQuery, playerDatabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2">
              <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
            </button>
            <h1 className="text-2xl font-medium dark:text-gray-100">Players</h1>
          </div>
          <Button
            onClick={onAddPlayer}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search players by name, team, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Players List */}
      <div className="p-4 space-y-3 pb-24">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => {
            const teamNames = getTeamNames(player);
            
            return (
              <PlayerListItem
                key={player.id}
                player={player}
                onClick={() => onPlayerClick(player)}
                showPosition={true}
                showTeamName={!!teamNames}
                teamName={teamNames || 'Unattached'}
                showJerseyBadge={!!player.jerseyNumber}
              />
            );
          })
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No players found matching your search' : 'No players available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersList;