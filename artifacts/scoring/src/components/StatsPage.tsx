import React from 'react';
import { ArrowLeft, BarChart3, Target, GitCompare } from 'lucide-react';

const StatsPage = ({ 
  onBack,
  onLeaderboard, 
  onPointsTable,
  onPlayerComparison,
  onTeamComparison,
  topPlayers = [],
  topTeams = [],
}) => {
  const statsOptions = [
    {
      title: 'Leaderboard',
      icon: BarChart3,
      action: onLeaderboard,
      description: 'Top performers and rankings',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      iconBg: 'bg-blue-200 dark:bg-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-300'
    },
    {
      title: 'Points Table',
      icon: Target,
      action: onPointsTable,
      description: 'Tournament standings',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconBg: 'bg-green-200 dark:bg-green-800/50',
      iconColor: 'text-green-600 dark:text-green-300'
    },
    {
      title: 'Compare Players',
      icon: GitCompare,
      action: onPlayerComparison,
      description: 'Player vs player analysis',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      iconBg: 'bg-purple-200 dark:bg-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-300'
    },
    {
      title: 'Compare Teams',
      icon: GitCompare,
      action: onTeamComparison,
      description: 'Team vs team analysis',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      iconBg: 'bg-orange-200 dark:bg-orange-800/50',
      iconColor: 'text-orange-600 dark:text-orange-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
          </button>
          <div>
            <h1 className="text-2xl font-medium dark:text-gray-100">Stats</h1>
            <p className="text-sm text-purple-600 dark:text-purple-400">Performance Analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Options */}
      <div className="p-4 space-y-3 pb-24">
        {statsOptions.map((option, index) => (
          <div
            key={index}
            onClick={option.action}
            className={`${option.bgColor} rounded-2xl p-6 cursor-pointer hover:opacity-80 transition-opacity border border-transparent dark:border-gray-700/50`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${option.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <option.icon className={`w-7 h-7 ${option.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{option.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
              </div>
            </div>
          </div>
        ))}

        {(topPlayers.length > 0 || topTeams.length > 0) && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mt-2 space-y-4">
            <h2 className="font-medium dark:text-gray-100">From your matches</h2>
            {topPlayers.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top scorers</p>
                <div className="space-y-2">
                  {topPlayers.map((player, index) => (
                    <div key={player.id ?? index} className="flex justify-between text-sm">
                      <span className="dark:text-gray-200">{player.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">{player.goals}G · {player.assists}A</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topTeams.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top teams</p>
                <div className="space-y-2">
                  {topTeams.map((team, index) => (
                    <div key={team.id ?? index} className="flex justify-between text-sm">
                      <span className="dark:text-gray-200">{team.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mt-6">
          <h2 className="font-medium mb-3 dark:text-gray-100">About Stats</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Access comprehensive performance analytics, compare players and teams, 
            view tournament standings, and track top performers across all matches.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;