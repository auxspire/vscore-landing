// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Clock, User, Trophy, TrendingUp, Calendar, MapPin, Users, Star, Edit2, Save, X, CheckCircle, Info, UserPlus, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  getPlayerFollowerCount,
  isFollowingPlayer,
  followPlayer,
  unfollowPlayer
} from '../utils/playerFollows';

/**
 * PlayerProfileScreen displays comprehensive player information
 * Four tabs: Overview, Stats, Matches, History
 * Includes performance metrics, match records, and career progression
 */
const PlayerProfileScreen = ({ player, onBack, onTeamClick = () => {}, onMatchClick = () => {}, onUpdatePlayer = () => {} }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState(player || {});
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchFollowerCount = async () => {
      const count = await getPlayerFollowerCount(player.id);
      setFollowerCount(count);
    };

    const checkFollowingStatus = async () => {
      const isFollowingStatus = await isFollowingPlayer(player.id);
      setIsFollowing(isFollowingStatus);
    };

    fetchFollowerCount();
    checkFollowingStatus();
  }, [player.id]);

  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    // Check for +91 followed by 10 digits
    return /^\+91\d{10}$/.test(phoneNumber);
  };

  // Enhanced player data with comprehensive stats
  const playerData = player || {
    id: null,
    name: 'Unknown Player',
    team: '',
    goals: 0,
    assists: 0,
  };

  // Comprehensive player statistics
  const playerStats = {
    basic: {
      position: 'Left Winger / Striker',
      number: 10,
      age: 26,
      nationality: 'England',
      height: '1.85m',
      weight: '70kg',
      preferredFoot: 'Right',
      marketValue: '£65M'
    },
    performance: {
      currentSeason: {
        matches: 28,
        goals: 18,
        assists: 12,
        yellowCards: 3,
        redCards: 0,
        minutesPlayed: 2340,
        rating: 8.2,
        shotsOnTarget: 45,
        passAccuracy: 82,
        dribblesSuccessful: 34,
        foulsWon: 28
      },
      careerTotal: {
        matches: 285,
        goals: 128,
        assists: 64,
        yellowCards: 18,
        redCards: 1,
        minutesPlayed: 22100,
        rating: 7.8,
        trophies: 5
      }
    },
    form: [
      { match: 'vs Arsenal', date: '2024-01-15', goals: 1, assists: 1, rating: 8.5 },
      { match: 'vs Liverpool', date: '2024-01-08', goals: 0, assists: 0, rating: 7.2 },
      { match: 'vs Chelsea', date: '2024-01-01', goals: 2, assists: 0, rating: 9.1 },
      { match: 'vs Newcastle', date: '2023-12-28', goals: 1, assists: 2, rating: 8.8 },
      { match: 'vs Brighton', date: '2023-12-21', goals: 0, assists: 1, rating: 7.5 }
    ]
  };

  // Recent matches with detailed performance
  const recentMatches = [
    {
      id: 1,
      opponent: 'Arsenal FC',
      date: '2024-01-15',
      competition: 'Premier League',
      result: 'W 3-1',
      playerPerformance: {
        goals: 1,
        assists: 1,
        minutesPlayed: 90,
        rating: 8.5,
        shots: 4,
        keyPasses: 3,
        dribbles: 2,
        tackles: 1
      }
    },
    {
      id: 2,
      opponent: 'Liverpool FC',
      date: '2024-01-08',
      competition: 'Premier League',
      result: 'D 1-1',
      playerPerformance: {
        goals: 0,
        assists: 0,
        minutesPlayed: 75,
        rating: 7.2,
        shots: 2,
        keyPasses: 1,
        dribbles: 4,
        tackles: 0
      }
    },
    {
      id: 3,
      opponent: 'Chelsea FC',
      date: '2024-01-01',
      competition: 'Premier League',
      result: 'W 4-1',
      playerPerformance: {
        goals: 2,
        assists: 0,
        minutesPlayed: 90,
        rating: 9.1,
        shots: 6,
        keyPasses: 2,
        dribbles: 3,
        tackles: 1
      }
    }
  ];

  // Career milestones and achievements
  const achievements = [
    {
      title: 'Premier League Winner',
      season: '2020/21',
      icon: Trophy,
      description: 'First Premier League title with Manchester United'
    },
    {
      title: 'FA Cup Winner',
      season: '2023/24',
      icon: Trophy,
      description: 'Scored in the final against Manchester City'
    },
    {
      title: 'Europa League Winner',
      season: '2016/17',
      icon: Trophy,
      description: 'Breakthrough season in European competition'
    },
    {
      title: '100 Premier League Goals',
      season: '2023/24',
      icon: Target,
      description: 'Reached century milestone against Everton'
    }
  ];

  // Performance metrics visualization
  const performanceMetrics = [
    { label: 'Goals', value: playerStats.performance.currentSeason.goals, max: 25, color: 'bg-green-500' },
    { label: 'Assists', value: playerStats.performance.currentSeason.assists, max: 20, color: 'bg-blue-500' },
    { label: 'Rating', value: playerStats.performance.currentSeason.rating * 10, max: 100, color: 'bg-purple-500' },
    { label: 'Pass Accuracy', value: playerStats.performance.currentSeason.passAccuracy, max: 100, color: 'bg-orange-500' }
  ];

  const getFormIcon = (rating) => {
    if (rating >= 8.5) return '🔥';
    if (rating >= 8.0) return '⚡';
    if (rating >= 7.5) return '👍';
    if (rating >= 7.0) return '👌';
    return '📉';
  };

  const handleTeamNameClick = () => {
    onTeamClick({
      id: 1,
      name: playerData.team,
      matches: 28,
      wins: 18,
      goals: 58
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    onUpdatePlayer(editedPlayer);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedPlayer(player || {});
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPlayer({
      ...editedPlayer,
      [name]: value
    });
  };

  const handleFollowClick = async () => {
    if (isFollowing) {
      await unfollowPlayer(player.id);
      setIsFollowing(false);
      setFollowerCount(followerCount - 1);
    } else {
      await followPlayer(player.id);
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
        </button>
        <h1 className="text-xl font-medium dark:text-gray-100">Player Profile</h1>
      </div>

      {/* Player Header */}
      <div className="bg-purple-100 dark:bg-purple-900/20 rounded-2xl p-6 border border-transparent dark:border-purple-800/30">
        <div className="flex items-center gap-6">
          {/* Player Avatar */}
          <div className="w-20 h-20 bg-purple-200 dark:bg-purple-800/50 rounded-full flex items-center justify-center">
            <span className="text-2xl font-medium text-purple-600 dark:text-purple-300">
              {playerData.name.split(' ').map(word => word[0]).join('')}
            </span>
          </div>

          {/* Player Basic Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-medium dark:text-gray-100">{playerData.name}</h2>
              {hasValidPhoneNumber(playerData.phoneNumber) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVerificationInfo(true);
                  }}
                  className="flex items-center"
                >
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </button>
              )}
            </div>
            <button 
              onClick={handleTeamNameClick}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline font-medium mb-2"
            >
              {playerData.team}
            </button>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>#{playerStats.basic.number}</span>
              <span>{playerStats.basic.position}</span>
              <span>{playerStats.basic.age} years old</span>
            </div>
          </div>

          {/* Current Season Stats */}
          <div className="text-right">
            <div className="text-3xl font-medium dark:text-gray-100">{playerData.goals}G</div>
            <div className="text-lg text-gray-600 dark:text-gray-400">{playerData.assists}A</div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm dark:text-gray-300">{playerStats.performance.currentSeason.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Current Season Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">{metric.label}</span>
                      <span className="font-medium dark:text-gray-200">{metric.value}{metric.label === 'Pass Accuracy' || metric.label === 'Rating' ? '%' : ''}</span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.max) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Form */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Recent Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {playerStats.form.map((match, index) => (
                  <div key={index} className="text-center">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-1">
                      <span className="text-lg">{getFormIcon(match.rating)}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{match.rating}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-medium text-green-600 dark:text-green-400">{playerStats.form.reduce((sum, match) => sum + match.goals, 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Goals (Last 5)</div>
                </div>
                <div>
                  <div className="text-2xl font-medium text-blue-600 dark:text-blue-400">{playerStats.form.reduce((sum, match) => sum + match.assists, 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Assists (Last 5)</div>
                </div>
                <div>
                  <div className="text-2xl font-medium text-purple-600 dark:text-purple-400">{(playerStats.form.reduce((sum, match) => sum + match.rating, 0) / playerStats.form.length).toFixed(1)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Info */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Player Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nationality</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.basic.nationality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Height</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.basic.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Weight</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.basic.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Preferred Foot</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.basic.preferredFoot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Market Value</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.basic.marketValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Career Matches</span>
                  <span className="font-medium dark:text-gray-200">{playerStats.performance.careerTotal.matches}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Detailed Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Season Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium dark:text-gray-100">Attacking</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Goals</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.goals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Assists</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.assists}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shots on Target</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.shotsOnTarget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Successful Dribbles</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.dribblesSuccessful}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium dark:text-gray-100">General</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Matches Played</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.matches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Minutes Played</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.minutesPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pass Accuracy</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.passAccuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fouls Won</span>
                      <span className="font-medium dark:text-gray-200">{playerStats.performance.currentSeason.foulsWon}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Career Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-medium text-green-600 dark:text-green-400">{playerStats.performance.careerTotal.goals}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Career Goals</div>
                </div>
                <div>
                  <div className="text-3xl font-medium text-blue-600 dark:text-blue-400">{playerStats.performance.careerTotal.assists}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Career Assists</div>
                </div>
                <div>
                  <div className="text-3xl font-medium text-purple-600 dark:text-purple-400">{playerStats.performance.careerTotal.trophies}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Trophies Won</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => onMatchClick(match)}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors dark:bg-gray-800/30"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium dark:text-gray-100">{match.opponent}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{match.date}</span>
                          <span>•</span>
                          <span>{match.competition}</span>
                        </div>
                      </div>
                      <Badge className={match.result.startsWith('W') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                                      match.result.startsWith('D') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 
                                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}>
                        {match.result}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-medium text-green-600 dark:text-green-400">{match.playerPerformance.goals}</div>
                        <div className="text-gray-600 dark:text-gray-400">Goals</div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-600 dark:text-blue-400">{match.playerPerformance.assists}</div>
                        <div className="text-gray-600 dark:text-gray-400">Assists</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-600 dark:text-purple-400">{match.playerPerformance.rating}</div>
                        <div className="text-gray-600 dark:text-gray-400">Rating</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 dark:text-gray-300">{match.playerPerformance.minutesPlayed}'</div>
                        <div className="text-gray-600 dark:text-gray-400">Minutes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Career Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800/30">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <achievement.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium dark:text-gray-100">{achievement.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{achievement.season}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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

      {/* Follow Button */}
      <div className="mt-4">
        <Button
          onClick={handleFollowClick}
          className={`w-full ${isFollowing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isFollowing ? (
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Unfollow
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Follow
            </div>
          )}
        </Button>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {followerCount} followers
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileScreen;