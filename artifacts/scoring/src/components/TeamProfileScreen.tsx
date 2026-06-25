// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft, Users, Trophy, Target, Calendar, MapPin, TrendingUp, Star, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

/**
 * TeamProfileScreen displays comprehensive team information
 * Four tabs: Overview, Squad, Matches, History
 * Includes team stats, player roster, match records, and achievements
 */
const TeamProfileScreen = ({ team, onBack, onPlayerClick = () => {}, onMatchClick = () => {} }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    // Check for +91 followed by 10 digits
    return /^\+91\d{10}$/.test(phoneNumber);
  };

  // Enhanced team data with comprehensive information
  const teamData = team || {
    id: null,
    name: 'Unknown Team',
    matches: 0,
    wins: 0,
    goals: 0,
  };

  // Comprehensive team statistics
  const teamStats = {
    basic: {
      founded: 1878,
      stadium: 'Old Trafford',
      capacity: 74310,
      manager: 'Erik ten Hag',
      league: 'Premier League',
      nickname: 'The Red Devils',
      colors: 'Red & White',
      marketValue: '£850M'
    },
    currentSeason: {
      position: 3,
      matches: 28,
      wins: 18,
      draws: 6,
      losses: 4,
      points: 60,
      goalsFor: 58,
      goalsAgainst: 32,
      goalDifference: 26,
      cleanSheets: 12,
      form: ['W', 'W', 'D', 'W', 'L'], // Last 5 matches
      homeRecord: { wins: 12, draws: 2, losses: 0 },
      awayRecord: { wins: 6, draws: 4, losses: 4 }
    },
    performance: {
      averageGoalsFor: 2.1,
      averageGoalsAgainst: 1.1,
      possession: 58,
      passAccuracy: 84,
      shotsPerGame: 15.2,
      cornersPerGame: 6.8
    }
  };

  const squadPlayers = team?.players ?? [];

  const recentMatches = [];
  // Team achievements and trophies
  const achievements = [];

  // Performance metrics
  const performanceMetrics = [
    { label: 'Goals Scored', value: teamStats.currentSeason.goalsFor, max: 80, color: 'bg-green-500' },
    { label: 'Goals Conceded', value: teamStats.currentSeason.goalsAgainst, max: 50, color: 'bg-red-500', invert: true },
    { label: 'Clean Sheets', value: teamStats.currentSeason.cleanSheets, max: 20, color: 'bg-blue-500' },
    { label: 'Win Rate', value: (teamStats.currentSeason.wins / teamStats.currentSeason.matches) * 100, max: 100, color: 'bg-purple-500' }
  ];

  const getFormColor = (result) => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handlePlayerNameClick = (player) => {
    onPlayerClick({
      id: player.id,
      name: player.name,
      team: teamData.name,
      goals: player.goals,
      assists: player.assists
    });
  };

  const groupPlayersByPosition = (players) => {
    const positions = {
      'Goalkeeper': [],
      'Defender': [],
      'Midfielder': [],
      'Forward': []
    };
    
    players.forEach(player => {
      const pos = player.position === 'Goalkeeper' ? 'Goalkeeper' :
                  player.position === 'Defender' ? 'Defender' :
                  player.position === 'Midfielder' ? 'Midfielder' : 'Forward';
      positions[pos].push(player);
    });
    
    return positions;
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-medium">Team Profile</h1>
      </div>

      {/* Team Header */}
      <div className="bg-purple-100 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          {/* Team Logo */}
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-medium text-white">
              {teamData.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </span>
          </div>

          {/* Team Basic Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-medium mb-1">{teamData.name}</h2>
            <div className="text-purple-600 font-medium mb-2">{teamStats.basic.league}</div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{teamStats.basic.stadium}</span>
              </div>
              <span>Founded {teamStats.basic.founded}</span>
            </div>
          </div>

          {/* Current Season Stats */}
          <div className="text-right">
            <div className="text-3xl font-medium">#{teamStats.currentSeason.position}</div>
            <div className="text-sm text-gray-600 mb-2">League Position</div>
            <div className="text-lg font-medium">{teamStats.currentSeason.points} pts</div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-2">Recent Form</h4>
              <div className="flex gap-1">
                {teamStats.currentSeason.form.map((result, index) => (
                  <div key={index} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${getFormColor(result)}`}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Record: {teamStats.currentSeason.wins}W {teamStats.currentSeason.draws}D {teamStats.currentSeason.losses}L</div>
              <div className="text-sm text-gray-600">Goal Difference: +{teamStats.currentSeason.goalDifference}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="squad">Squad</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Season Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{metric.label}</span>
                      <span className="font-medium">
                        {typeof metric.value === 'number' && metric.value % 1 !== 0 
                          ? metric.value.toFixed(1) 
                          : Math.round(metric.value)
                        }
                        {metric.label === 'Win Rate' ? '%' : ''}
                      </span>
                    </div>
                    <Progress 
                      value={metric.invert ? 100 - (metric.value / metric.max) * 100 : (metric.value / metric.max) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Home vs Away Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Home vs Away Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Home Record</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins</span>
                      <span className="font-medium text-green-600">{teamStats.currentSeason.homeRecord.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draws</span>
                      <span className="font-medium text-yellow-600">{teamStats.currentSeason.homeRecord.draws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Losses</span>
                      <span className="font-medium text-red-600">{teamStats.currentSeason.homeRecord.losses}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Away Record</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins</span>
                      <span className="font-medium text-green-600">{teamStats.currentSeason.awayRecord.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draws</span>
                      <span className="font-medium text-yellow-600">{teamStats.currentSeason.awayRecord.draws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Losses</span>
                      <span className="font-medium text-red-600">{teamStats.currentSeason.awayRecord.losses}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Manager</span>
                  <span className="font-medium">{teamStats.basic.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stadium Capacity</span>
                  <span className="font-medium">{teamStats.basic.capacity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nickname</span>
                  <span className="font-medium">{teamStats.basic.nickname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team Colors</span>
                  <span className="font-medium">{teamStats.basic.colors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Value</span>
                  <span className="font-medium">{teamStats.basic.marketValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Possession</span>
                  <span className="font-medium">{teamStats.performance.possession}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="squad" className="space-y-4">
          {/* Squad by Position */}
          {Object.entries(groupPlayersByPosition(squadPlayers)).map(([position, players]) => (
            <Card key={position}>
              <CardHeader>
                <CardTitle>{position}s ({players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerNameClick(player)}
                      className="w-full text-left border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-purple-600">#{player.number}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{player.name}</h4>
                              {hasValidPhoneNumber(player.phoneNumber) && (
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{player.nationality} • {player.age} years</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">{player.goals}G • {player.assists}A</div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-sm">{player.rating}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => onMatchClick(match)}
                    className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{match.opponent}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{match.date}</span>
                          <span>•</span>
                          <span>{match.competition}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{match.venue}</span>
                          <span>•</span>
                          <Users className="w-3 h-3" />
                          <span>{match.attendance.toLocaleString()}</span>
                        </div>
                      </div>
                      <Badge className={match.result.startsWith('W') ? 'bg-green-100 text-green-800' : 
                                      match.result.startsWith('D') ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'}>
                        {match.result}
                      </Badge>
                    </div>
                    
                    {match.scorers.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Scorers: </span>
                        {match.scorers.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Trophies and Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Trophy Cabinet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          {achievement.count}x
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Recent: {achievement.years.slice(0, 3).join(', ')}
                        {achievement.years.length > 3 && ` +${achievement.years.length - 3} more`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historical Stats */}
          <Card>
            <CardHeader>
              <CardTitle>All-Time Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-medium text-purple-600">20</div>
                  <div className="text-sm text-gray-600">League Titles</div>
                </div>
                <div>
                  <div className="text-3xl font-medium text-blue-600">12</div>
                  <div className="text-sm text-gray-600">FA Cups</div>
                </div>
                <div>
                  <div className="text-3xl font-medium text-yellow-600">3</div>
                  <div className="text-sm text-gray-600">European Cups</div>
                </div>
                <div>
                  <div className="text-3xl font-medium text-green-600">66</div>
                  <div className="text-sm text-gray-600">Major Trophies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamProfileScreen;
