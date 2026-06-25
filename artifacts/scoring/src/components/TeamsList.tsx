import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const TeamsList = ({ onBack, teams = [], onTeamClick, onAddTeam }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);

  // Helper function to get coordinator names
  const getCoordinatorNames = (team) => {
    if (!team.coordinators || team.coordinators.length === 0) {
      return null;
    }
    // Get first coordinator name, or show count if multiple
    if (team.coordinators.length === 1) {
      return team.coordinators[0].name || 'Unnamed';
    }
    return `${team.coordinators[0].name || 'Unnamed'} +${team.coordinators.length - 1}`;
  };

  useEffect(() => {
    // Filter teams based on search query
    if (searchQuery.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team => {
        const nameMatch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
        const coachMatch = team.coach && team.coach.toLowerCase().includes(searchQuery.toLowerCase());
        const coordinatorMatch = team.coordinators?.some(c => 
          c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return nameMatch || coachMatch || coordinatorMatch;
      });
      setFilteredTeams(filtered);
    }
  }, [searchQuery, teams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2">
              <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
            </button>
            <h1 className="text-2xl font-medium dark:text-gray-100">Teams</h1>
          </div>
          <Button
            onClick={onAddTeam}
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
            placeholder="Search teams by name or coordinators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => onTeamClick(team)}
              className="vscor-card-interactive bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium dark:text-gray-100">{team.name}</p>
                  <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {getCoordinatorNames(team) && (
                      <span>Coordinator: {getCoordinatorNames(team)}</span>
                    )}
                    {team.players && team.players.length > 0 && (
                      <>
                        {getCoordinatorNames(team) && <span>•</span>}
                        <span>{team.players.length} players</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {team.wins !== undefined && team.matches !== undefined && (
                    <div className="text-sm">
                      <p className="text-gray-600 dark:text-gray-400">{team.wins}W - {team.matches - team.wins}L</p>
                      <p className="text-purple-600 dark:text-purple-400 font-medium">
                        {team.matches > 0 ? Math.round((team.wins / team.matches) * 100) : 0}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No teams found matching your search' : 'No teams available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsList;