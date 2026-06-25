// @ts-nocheck
import React from 'react';
import { Plus, Star, Users, User, Play, FileEdit, RotateCcw, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const MatchesHub = ({
  ongoingMatches = [],
  completedMatches = [],
  onNewMatch,
  onAddTeam,
  onAddPlayer,
  onAddTournament,
  onScoringMatchClick,
  onSpectatorMatchClick,
  onEnterMatchResult,
  onRefresh = () => {},
  isRefreshing = false,
  currentUser = null,
  registeredTeamsCount = 0,
}) => {
  const canUserScoreMatch = (match) => {
    if (!currentUser || !match) return false;
    const userId = currentUser.user_id;
    if (match.primaryScorer?.user_id === userId) return true;
    if (match.secondaryScorer?.user_id === userId) return true;
    if (match.teamScorerMapping) {
      if (match.teamScorerMapping.team1 === userId.toString()) return true;
      if (match.teamScorerMapping.team2 === userId.toString()) return true;
    }
    if (match.scoredBy1 && String(match.scoredBy1) === String(userId)) return true;
    if (match.scoredBy2 && String(match.scoredBy2) === String(userId)) return true;
    return false;
  };

  const deduplicateById = (matches) => {
    const seen = new Set();
    return matches.filter((match) => {
      const id = String(match.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const uniqueOngoing = deduplicateById(ongoingMatches);
  const ongoingIds = new Set(uniqueOngoing.map((m) => String(m.id)));
  const uniqueCompleted = deduplicateById(completedMatches).filter(
    (m) => !ongoingIds.has(String(m.id)),
  );

  const scoreNow = uniqueOngoing.filter((m) => canUserScoreMatch(m));
  const liveNow = uniqueOngoing.filter((m) => !canUserScoreMatch(m));
  const recent = uniqueCompleted.slice(0, 10);

  const quickActions = [
    { title: 'New Match', icon: Plus, action: onNewMatch },
    { title: 'Add Team', icon: Users, action: onAddTeam },
    { title: 'Add Player', icon: User, action: onAddPlayer },
    { title: 'Tournament', icon: Star, action: onAddTournament },
  ];

  const renderMatchCard = (match, onClick, badge) => {
    const teamA = match.teamA || match.team1 || 'Team A';
    const teamB = match.teamB || match.team2 || 'Team B';
    const scoreA = match.scoreA ?? match.team1Score ?? 0;
    const scoreB = match.scoreB ?? match.team2Score ?? 0;
    return (
      <button
        key={match.id}
        type="button"
        onClick={() => onClick(match)}
        className="vscor-card-interactive w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          {badge}
          <span className="text-xs text-gray-400">{match.status || 'Live'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm flex-1 truncate dark:text-gray-100">{teamA}</span>
          <span className="text-lg font-semibold text-purple-600 tabular-nums">{scoreA} – {scoreB}</span>
          <span className="font-medium text-sm flex-1 truncate text-right dark:text-gray-100">{teamB}</span>
        </div>
      </button>
    );
  };

  const matchSection = (title, icon, matches, onClick, badgeFactory) =>
    matches.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          {icon} {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {matches.map((m) => renderMatchCard(m, onClick, badgeFactory?.(m)))}
        </div>
      </section>
    ) : null;

  return (
    <div className="p-6 pb-24 lg:pb-8 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-medium mb-1 dark:text-gray-100">Matches</h1>
          <p className="text-purple-600 dark:text-purple-400">Score, watch, and review</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={onRefresh} disabled={isRefreshing}>
          <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Sidebar column — actions & CTAs */}
        <div className="lg:col-span-4 space-y-6">
          {registeredTeamsCount === 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 lg:p-5 space-y-3">
              <p className="font-medium text-purple-900 dark:text-purple-100">Get started</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Add a team and players before your first match.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onAddTeam}>Add team</Button>
                <Button size="sm" variant="outline" onClick={onAddPlayer}>Add player</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 lg:gap-3">
            {quickActions.map(({ title, icon: Icon, action }) => (
              <button
                key={title}
                type="button"
                onClick={action}
                className="vscor-card-interactive flex flex-col items-center gap-2 p-3 lg:p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-purple-700 dark:text-purple-300" />
                <span className="text-xs lg:text-sm font-medium text-purple-900 dark:text-purple-100 text-center">{title}</span>
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full hidden lg:flex" onClick={onEnterMatchResult}>
            <FileEdit className="w-4 h-4 mr-2" />
            Enter match result (no live scoring)
          </Button>
        </div>

        {/* Main column — match lists */}
        <div className="lg:col-span-8 space-y-6 mt-6 lg:mt-0">
          <Button variant="outline" className="w-full lg:hidden" onClick={onEnterMatchResult}>
            <FileEdit className="w-4 h-4 mr-2" />
            Enter match result (no live scoring)
          </Button>

          {matchSection(
            'Score now',
            <Play className="w-4 h-4 text-purple-600" />,
            scoreNow,
            onScoringMatchClick,
            () => <Badge className="bg-purple-600">Your match</Badge>,
          )}

          {matchSection(
            'Live now',
            <Radio className="w-4 h-4 text-green-600" />,
            liveNow,
            onSpectatorMatchClick,
            () => <Badge variant="outline" className="border-green-500 text-green-700">Live</Badge>,
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-gray-500">No completed matches yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {recent.map((m) => renderMatchCard(m, onSpectatorMatchClick, null))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MatchesHub;
