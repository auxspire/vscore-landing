import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trophy, MapPin, Calendar, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getTeamsForTournament } from '../utils/teamManagement';

const TournamentsList = ({ onBack, tournaments = [], onTournamentClick, onAddTournament }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  
  // Calculate team counts from junction table (single source of truth)
  const getTeamCount = (tournamentId: number): number => {
    return getTeamsForTournament(tournamentId).length;
  };

  useEffect(() => {
    // Filter tournaments based on search query
    if (searchQuery.trim() === '') {
      setFilteredTournaments(tournaments);
    } else {
      const filtered = tournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tournament.place && tournament.place.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tournament.venue && tournament.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tournament.tags && tournament.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
      setFilteredTournaments(filtered);
    }
  }, [searchQuery, tournaments]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2">
              <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
            </button>
            <h1 className="text-2xl font-medium dark:text-gray-100">Tournaments</h1>
          </div>
          <Button
            onClick={onAddTournament}
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
            placeholder="Search tournaments by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Tournaments List */}
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => onTournamentClick(tournament)}
              className="vscor-card-interactive bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2 dark:text-gray-100">{tournament.name}</p>
                  
                  <div className="space-y-1">
                    {(tournament.place || tournament.venue) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {tournament.place}
                          {tournament.place && tournament.venue && ' • '}
                          {tournament.venue}
                        </span>
                      </div>
                    )}
                    
                    {tournament.startDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(tournament.startDate)}
                          {tournament.endDate && ` - ${formatDate(tournament.endDate)}`}
                        </span>
                      </div>
                    )}
                    
                    {/* Use junction table as single source of truth for team count */}
                    {getTeamCount(tournament.id) > 0 && (
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        {getTeamCount(tournament.id)} teams
                      </div>
                    )}
                    
                    {/* Tags */}
                    {tournament.tags && tournament.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tournament.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {tournament.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                            +{tournament.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {tournament.status && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tournament.status === 'upcoming' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : tournament.status === 'ongoing'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No tournaments found matching your search' : 'No tournaments available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsList;