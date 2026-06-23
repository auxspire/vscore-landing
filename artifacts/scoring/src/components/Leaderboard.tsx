// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft, Search, Medal, Target, Trophy, Users } from 'lucide-react';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

const Leaderboard = ({ onBack, onPlayerClick = () => {}, onTeamClick = () => {}, topPlayers = [], topTeams = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('players');

  const getMedalIcon = (position) => {
    switch (position) {
      case 1:
        return <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">1</span>
        </div>;
      case 2:
        return <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">2</span>
        </div>;
      case 3:
        return <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">3</span>
        </div>;
      default:
        return <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-purple-600">{position}</span>
        </div>;
    }
  };

  const filteredPlayers = topPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = topTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-medium">Leaderboard</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search players or teams"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 py-3 bg-purple-50 border-none rounded-full"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          {filteredPlayers.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Complete matches to see player rankings.</p>
          ) : (
          <>
          {topPlayers.length >= 3 && (
          <div className="bg-purple-100 rounded-2xl p-6 mb-6">
            <h3 className="font-medium mb-4 text-center">Top Goal Scorers</h3>
            <div className="flex justify-center items-end gap-4">
              <div className="text-center">
                <div className="w-16 h-12 bg-gray-300 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">2</span>
                </div>
                <p className="text-xs font-medium">{topPlayers[1].name.split(' ')[0]}</p>
                <p className="text-xs text-gray-600">{topPlayers[1].goals}G</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">1</span>
                </div>
                <p className="text-xs font-medium">{topPlayers[0].name.split(' ')[0]}</p>
                <p className="text-xs text-gray-600">{topPlayers[0].goals}G</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-10 bg-amber-600 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">3</span>
                </div>
                <p className="text-xs font-medium">{topPlayers[2].name.split(' ')[0]}</p>
                <p className="text-xs text-gray-600">{topPlayers[2].goals}G</p>
              </div>
            </div>
          </div>
          )}

          {/* Players List */}
          <div className="space-y-3">
            {filteredPlayers.map((player, index) => (
              <div
                key={player.id}
                onClick={() => onPlayerClick(player)}
                className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getMedalIcon(index + 1)}
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.team}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{player.goals}G • {player.assists}A</p>
                    {player.rating != null && (
                      <p className="text-sm text-purple-600">Rating: {player.rating}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {filteredTeams.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Complete matches to see team standings.</p>
          ) : (
          <>
          {topTeams.length >= 3 && (
          <div className="bg-purple-100 rounded-2xl p-6 mb-6">
            <h3 className="font-medium mb-4 text-center">League Standings</h3>
            <div className="flex justify-center items-end gap-4">
              <div className="text-center">
                <div className="w-16 h-12 bg-gray-300 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">2</span>
                </div>
                <p className="text-xs font-medium">{topTeams[1].name}</p>
                <p className="text-xs text-gray-600">{topTeams[1].points}pts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">1</span>
                </div>
                <p className="text-xs font-medium">{topTeams[0].name}</p>
                <p className="text-xs text-gray-600">{topTeams[0].points}pts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-10 bg-amber-600 rounded-t-lg flex items-end justify-center mb-2">
                  <span className="text-white font-medium pb-1">3</span>
                </div>
                <p className="text-xs font-medium">{topTeams[2].name}</p>
                <p className="text-xs text-gray-600">{topTeams[2].points}pts</p>
              </div>
            </div>
          </div>
          )}

          {/* Teams List */}
          <div className="space-y-3">
            {filteredTeams.map((team, index) => (
              <div
                key={team.id}
                onClick={() => onTeamClick(team)}
                className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getMedalIcon(index + 1)}
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-gray-600">{team.wins}W • {team.draws}D • {team.losses}L</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{team.points} pts</p>
                    <p className="text-sm text-purple-600">GD: +{team.gf - team.ga}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;