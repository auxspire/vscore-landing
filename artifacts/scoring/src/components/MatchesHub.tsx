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
        className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-purple-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          {badge}
          <span className="text-xs text-gray-400">{match.status || 'Live'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm flex-1 truncate dark:text-gray-100">{teamA}</span>
          <span className="text-lg font-semibold text-purple-600">{scoreA} – {scoreB}</span>
          <span className="font-medium text-sm flex-1 truncate text-right dark:text-gray-100">{teamB}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-1 dark:text-gray-100">Matches</h1>
          <p className="text-purple-600 dark:text-purple-400">Score, watch, and review</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={onRefresh} disabled={isRefreshing}>
          <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {registeredTeamsCount === 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 space-y-3">
          <p className="font-medium text-purple-900 dark:text-purple-100">Get started</p>
          <p className="text-sm text-purple-700 dark:text-purple-300">Add a team and players before your first match.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onAddTeam}>Add team</Button>
            <Button size="sm" variant="outline" onClick={onAddPlayer}>Add player</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(({ title, icon: Icon, action }) => (
          <button
            key={title}
            type="button"
            onClick={action}
            className="flex flex-col items-center gap-2 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Icon className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            <span className="text-xs font-medium text-purple-900 dark:text-purple-100">{title}</span>
          </button>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={onEnterMatchResult}>
        <FileEdit className="w-4 h-4 mr-2" />
        Enter match result (no live scoring)
      </Button>

      {scoreNow.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Play className="w-4 h-4 text-purple-600" /> Score now
          </h2>
          {scoreNow.map((m) =>
            renderMatchCard(m, onScoringMatchClick, (
              <Badge className="bg-purple-600">Your match</Badge>
            )),
          )}
        </section>
      )}

      {liveNow.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-600" /> Live now
          </h2>
          {liveNow.map((m) =>
            renderMatchCard(m, onSpectatorMatchClick, (
              <Badge variant="outline" className="border-green-500 text-green-700">Live</Badge>
            )),
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">No completed matches yet.</p>
        ) : (
          recent.map((m) =>
            renderMatchCard(m, onSpectatorMatchClick, null),
          )
        )}
      </section>
    </div>
  );
};

export default MatchesHub;
