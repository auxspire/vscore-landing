import React from 'react';
import { User, Users, Trophy, BarChart3, Target, GitCompare } from 'lucide-react';

const StatsTab = ({ 
  onPlayerClick, 
  onTeamClick, 
  onTournamentClick, 
  onLeaderboard, 
  onPointsTable,
  onPlayerComparison,
  onTeamComparison,
  topPlayers = [],
  topTeams = [],
}) => {
  const quickStats = [
    {
      title: 'Leaderboard',
      icon: BarChart3,
      action: onLeaderboard,
      description: 'Top performers'
    },
    {
      title: 'Points Table',
      icon: Target,
      action: onPointsTable,
      description: 'Tournament standings'
    },
    {
      title: 'Compare Players',
      icon: GitCompare,
      action: onPlayerComparison,
      description: 'Player vs player'
    },
    {
      title: 'Compare Teams',
      icon: GitCompare,
      action: onTeamComparison,
      description: 'Team vs team'
    }
  ];

  return (
    <div className="p-6 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-medium mb-2">Stats</h1>
        <p className="text-purple-600 text-lg">Performance Analytics</p>
      </div>

      {/* Quick Stats Actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.action}
            className="bg-purple-100 rounded-2xl p-4 cursor-pointer hover:bg-purple-150 transition-colors"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-900">{stat.title}</p>
                <p className="text-xs text-purple-600">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Players */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Top Players</h2>
          <button className="text-purple-600" onClick={onLeaderboard}>View All</button>
        </div>
        
        <div className="space-y-3">
          {topPlayers.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">Complete matches to see top players.</p>
          ) : (
          topPlayers.map((player, index) => (
            <div
              key={player.id}
              onClick={() => onPlayerClick(player)}
              className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.team}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Goals: {player.goals}</p>
                  <p className="text-sm text-gray-600">Assists: {player.assists}</p>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Top Teams */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Top Teams</h2>
          <button className="text-purple-600" onClick={onPointsTable}>View All</button>
        </div>
        
        <div className="space-y-3">
          {topTeams.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">Complete matches to see top teams.</p>
          ) : (
          topTeams.map((team, index) => (
            <div
              key={team.id}
              onClick={() => onTeamClick(team)}
              className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-600">{team.wins}/{team.matches} wins</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Goals: {team.goals}</p>
                  <p className="text-sm text-purple-600">{Math.round((team.wins / team.matches) * 100)}% win rate</p>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};

export default StatsTab;