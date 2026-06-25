import React from 'react';
import { User, Users, Trophy, BarChart3, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const InfoTab = ({ 
  onPlayersList, 
  onTeamsList, 
  onTournamentsList, 
  onStatsPage,
  onRefresh = () => {},
  isRefreshing = false
}) => {
  const infoCards = [
    {
      title: 'Players',
      icon: User,
      action: onPlayersList,
      description: 'Browse all players',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      iconBg: 'bg-blue-200 dark:bg-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-300'
    },
    {
      title: 'Teams',
      icon: Users,
      action: onTeamsList,
      description: 'Browse all teams',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconBg: 'bg-green-200 dark:bg-green-800/50',
      iconColor: 'text-green-600 dark:text-green-300'
    },
    {
      title: 'Tournaments',
      icon: Trophy,
      action: onTournamentsList,
      description: 'Browse tournaments',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconBg: 'bg-yellow-200 dark:bg-yellow-800/50',
      iconColor: 'text-yellow-600 dark:text-yellow-300'
    },
    {
      title: 'Stats',
      icon: BarChart3,
      action: onStatsPage,
      description: 'Performance analytics',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      iconBg: 'bg-purple-200 dark:bg-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-300'
    }
  ];

  return (
    <div className="p-6 pb-24 lg:pb-8 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-medium mb-2 dark:text-gray-100">Info</h1>
          <p className="text-purple-600 dark:text-purple-400 text-lg">Browse & Explore</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-full"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infoCards.map((card, index) => (
          <div
            key={index}
            onClick={card.action}
            className={`vscor-card-interactive ${card.bgColor} rounded-2xl p-6 lg:p-8 cursor-pointer hover:opacity-90 transition-opacity border border-transparent dark:border-gray-700/50`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 ${card.iconBg} rounded-full flex items-center justify-center`}>
                <card.icon className={`w-8 h-8 ${card.iconColor}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{card.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
        <h2 className="font-medium text-lg dark:text-gray-100">Quick Info</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Access detailed information about players, teams, tournaments, and performance statistics. 
          Use the search feature to quickly find what you're looking for.
        </p>
      </div>
    </div>
  );
};

export default InfoTab;