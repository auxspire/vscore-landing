import React, { useMemo, useState } from 'react';
import { ArrowLeft, Target, Star, Trophy, Swords, CircleDot, Filter, X, User, Users, Edit } from 'lucide-react';
import { getMatchDateTimestamp, formatMatchDateParts } from '../utils/dateHelpers';

export type MatchFilter = 'all' | 'goals' | 'assists' | 'yellowCards' | 'redCards' | 'rated';
export type RoleFilter = 'all' | 'player' | 'scorer' | 'organizer';

interface MyMatchesProps {
  onBack: () => void;
  /** The logged-in user — used only when viewPlayer is not provided */
  currentUser: any;
  playerDatabase: any[];
  completedMatches: any[];
  onMatchClick?: (match: any) => void;
  /** When provided, show matches for this specific player instead of currentUser */
  viewPlayer?: any;
  /** Pre-filter the match list to matches that include this stat */
  filterType?: MatchFilter;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const playerName = (p: any): string => {
  if (!p) return '';
  if (typeof p === 'string') return p.trim().toLowerCase();
  return (p.name || '').trim().toLowerCase();
};

const isSamePlayer = (ref: any, target: any): boolean => {
  if (!ref || !target) return false;
  if (ref.id != null && target.id != null && String(ref.id) === String(target.id)) return true;
  const rn = playerName(ref);
  const tn = playerName(target);
  return !!rn && rn === tn;
};

const getRatingColor = (r: number): string => {
  if (r >= 8.5) return 'bg-green-500 text-white';
  if (r >= 7.5) return 'bg-green-400 text-white';
  if (r >= 6.5) return 'bg-blue-500 text-white';
  if (r >= 5.5) return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
};

/** Human-readable label and colour for each filter chip */
const FILTER_META: Record<MatchFilter, { label: string; color: string; icon: React.ReactNode }> = {
  all:         { label: 'All Matches',   color: 'bg-purple-100 text-purple-700', icon: null },
  goals:       { label: 'Goals',         color: 'bg-green-100 text-green-700',   icon: <CircleDot className="w-3.5 h-3.5" /> },
  assists:     { label: 'Assists',       color: 'bg-blue-100 text-blue-700',     icon: <Target className="w-3.5 h-3.5" /> },
  yellowCards: { label: 'Yellow Cards',  color: 'bg-yellow-100 text-yellow-700', icon: <span className="text-xs">🟨</span> },
  redCards:    { label: 'Red Cards',     color: 'bg-red-100 text-red-700',       icon: <span className="text-xs">🟥</span> },
  rated:       { label: 'Rated Matches', color: 'bg-purple-100 text-purple-700', icon: <Star className="w-3.5 h-3.5 fill-purple-500" /> },
};

// ─── main component ──────────────────────────────────────────────────────────

const MyMatches: React.FC<MyMatchesProps> = ({
  onBack,
  currentUser,
  playerDatabase,
  completedMatches,
  onMatchClick,
  viewPlayer,
  filterType = 'all',
}) => {
  // Role filter state
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const isViewingOther = !!viewPlayer;
  const userId = currentUser?.user_id;

  // 1. Resolve the player profile to show matches for.
  //    If viewPlayer is given we use it directly; otherwise derive from currentUser.
  const myProfile = useMemo(() => {
    if (viewPlayer) return viewPlayer;
    if (!currentUser) return null;
    const uid = currentUser.user_id;

    // Primary: ownership match
    const byOwner = playerDatabase.find(
      (p) => p.owner_user_id && String(p.owner_user_id) === String(uid)
    );
    if (byOwner) return byOwner;

    // Fallback 1: real email (skip synthetic @vscor.phone)
    const realEmail = currentUser.email && !currentUser.email.endsWith('@vscor.phone')
      ? currentUser.email.toLowerCase()
      : null;
    if (realEmail) {
      const byEmail = playerDatabase.find(
        (p) => p.email && p.email.toLowerCase() === realEmail
      );
      if (byEmail) return byEmail;
    }

    // Fallback 2: phone (last-10-digits comparison)
    const last10 = (s: string) => s.replace(/\D/g, '').slice(-10);
    const userPhone =
      currentUser.mobile_number ||
      (currentUser.email?.endsWith('@vscor.phone')
        ? currentUser.email.replace('@vscor.phone', '')
        : null);
    if (userPhone) {
      const userLast10 = last10(String(userPhone));
      if (userLast10.length >= 7) {
        const byPhone = playerDatabase.find(
          (p) => p.phoneNumber && last10(p.phoneNumber) === userLast10
        );
        if (byPhone) return byPhone;
      }
    }

    return null;
  }, [viewPlayer, currentUser, playerDatabase]);

  // 2. Compute all matches for this user with roles
  const allMatchesWithRoles = useMemo(() => {
    if (!userId) return [];

    // First deduplicate matches by ID
    const uniqueMatchesMap = new Map();
    completedMatches.forEach(match => {
      if (match && match.id) {
        uniqueMatchesMap.set(match.id, match);
      }
    });
    const uniqueMatches = Array.from(uniqueMatchesMap.values());

    return uniqueMatches
      .map((match) => {
        // Determine user roles in this match
        const isScorer = match.primaryScorer?.user_id === userId || 
                        match.secondaryScorer?.user_id === userId;
        const isOrganizer = match.owner_user_id === userId;

        // Check if user is a player
        let isPlayer = false;
        let playerMatchData: any = null;

        if (myProfile) {
          const squadA: any[] = match.team1Squad || match.squadA || match.squad1 || match.teamASquad || [];
          const squadB: any[] = match.team2Squad || match.squadB || match.squad2 || match.teamBSquad || [];

          const inSquadA = squadA.some((p) => isSamePlayer(p, myProfile));
          const inSquadB = squadB.some((p) => isSamePlayer(p, myProfile));

          if (inSquadA || inSquadB) {
            isPlayer = true;

            // Compute player stats for this match
            const teamA = match.teamA || match.team1 || 'Team A';
            const teamB = match.teamB || match.team2 || 'Team B';
            const events: any[] = match.events || [];
            const scoreA = match.scoreA ?? match.team1Score ?? 0;
            const scoreB = match.scoreB ?? match.team2Score ?? 0;
            const onTeamA = inSquadA;
            const myTeam  = onTeamA ? teamA : teamB;
            const oppTeam = onTeamA ? teamB : teamA;
            const myScore  = onTeamA ? scoreA : scoreB;
            const oppScore = onTeamA ? scoreB : scoreA;
            const result: 'win' | 'loss' | 'draw' =
              myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';

            // Goals, assists, cards
            let goals = 0;
            let assists = 0;
            let yellowCards = 0;
            let redCards = 0;
            for (const ev of events) {
              const isPlayerInEvent =
                isSamePlayer(ev.player, myProfile) || isSamePlayer(ev.playerOut, myProfile);
              if (ev.type === 'goal' && !ev.ownGoal && isSamePlayer(ev.player, myProfile)) goals++;
              if (ev.type === 'goal' &&
                (isSamePlayer(ev.assist, myProfile) || isSamePlayer(ev.assistedBy, myProfile)))
                assists++;
              if (isPlayerInEvent && (ev.type === 'yellowCard' || (ev.type === 'foul' && ev.cardType === 'yellow')))
                yellowCards++;
              if (isPlayerInEvent && (ev.type === 'redCard' || (ev.type === 'foul' && ev.cardType === 'red')))
                redCards++;
            }

            // Rating
            let rating: number | null = null;
            const squadPlayer = (inSquadA ? squadA : squadB).find((p) => isSamePlayer(p, myProfile));
            if (squadPlayer?.rating?.rating != null) rating = squadPlayer.rating.rating;
            else if (squadPlayer?.rating != null && typeof squadPlayer.rating === 'number') rating = squadPlayer.rating;

            if (rating == null && match.playerRatings) {
              const entry = match.playerRatings[String(myProfile.id)];
              if (entry?.rating != null) rating = entry.rating;
              else if (typeof entry === 'number') rating = entry;
            }
            if (rating == null && match.ratings) {
              const key = String(myProfile.id);
              const byId = match.ratings[key];
              if (byId?.rating != null) rating = byId.rating;
              else if (typeof byId === 'number') rating = byId;
              if (rating == null) {
                const nameKey = playerName(myProfile);
                const byName = Object.entries(match.ratings as Record<string, any>).find(
                  ([k]) => k.trim().toLowerCase() === nameKey
                );
                if (byName) {
                  const val = byName[1];
                  rating = val?.rating ?? (typeof val === 'number' ? val : null);
                }
              }
            }

            playerMatchData = {
              myTeam, oppTeam, myScore, oppScore, result,
              goals, assists, yellowCards, redCards, rating
            };
          } else {
            // Check events if not in squad
            const teamA = match.teamA || match.team1 || 'Team A';
            const teamB = match.teamB || match.team2 || 'Team B';
            const events: any[] = match.events || [];

            const playerInEvent = (ev: any): boolean =>
              isSamePlayer(ev.player, myProfile) ||
              isSamePlayer(ev.assist, myProfile) ||
              isSamePlayer(ev.assistedBy, myProfile);

            const eventOnSide = (ev: any, side: 'A' | 'B'): boolean => {
              if (ev.team === 1 || ev.team === '1') return side === 'A';
              if (ev.team === 2 || ev.team === '2') return side === 'B';
              if (ev.teamName) return side === 'A' ? ev.teamName === teamA : ev.teamName === teamB;
              return false;
            };

            const inEventsA = events.some((ev) => playerInEvent(ev) && eventOnSide(ev, 'A'));
            const inEventsB = events.some((ev) => playerInEvent(ev) && eventOnSide(ev, 'B'));

            if (inEventsA || inEventsB) {
              isPlayer = true;
              // Compute basic stats for event-based participation
              const scoreA = match.scoreA ?? match.team1Score ?? 0;
              const scoreB = match.scoreB ?? match.team2Score ?? 0;
              const onTeamA = inEventsA;
              const myTeam  = onTeamA ? teamA : teamB;
              const oppTeam = onTeamA ? teamB : teamA;
              const myScore  = onTeamA ? scoreA : scoreB;
              const oppScore = onTeamA ? scoreB : scoreA;
              const result: 'win' | 'loss' | 'draw' =
                myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';

              let goals = 0;
              let assists = 0;
              for (const ev of events) {
                if (ev.type === 'goal' && !ev.ownGoal && isSamePlayer(ev.player, myProfile)) goals++;
                if (ev.type === 'goal' &&
                  (isSamePlayer(ev.assist, myProfile) || isSamePlayer(ev.assistedBy, myProfile)))
                  assists++;
              }

              playerMatchData = {
                myTeam, oppTeam, myScore, oppScore, result,
                goals, assists, yellowCards: 0, redCards: 0, rating: null
              };
            }
          }
        }

        // Only include matches where user has at least one role
        if (!isPlayer && !isScorer && !isOrganizer) return null;

        const dateRaw = match.completedAt || match.endTime || match.date || match.startTime || match.createdAt;

        return {
          match,
          isPlayer,
          isScorer,
          isOrganizer,
          playerMatchData,
          dateRaw,
          dateFormatted: formatMatchDateParts(dateRaw),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const da = a!.dateRaw ? getMatchDateTimestamp(a!.dateRaw) : 0;
        const db = b!.dateRaw ? getMatchDateTimestamp(b!.dateRaw) : 0;
        return db - da;
      }) as any[];
  }, [userId, myProfile, completedMatches]);

  // 3. Apply role filter
  const roleFilteredMatches = useMemo(() => {
    if (roleFilter === 'all') return allMatchesWithRoles;
    return allMatchesWithRoles.filter((m) => {
      switch (roleFilter) {
        case 'player':    return m.isPlayer;
        case 'scorer':    return m.isScorer;
        case 'organizer': return m.isOrganizer;
        default:          return true;
      }
    });
  }, [allMatchesWithRoles, roleFilter]);

  // 4. Apply stat filter
  const myMatchStats = useMemo(() => {
    if (filterType === 'all' || !filterType) return roleFilteredMatches;
    return roleFilteredMatches.filter((m) => {
      if (!m.playerMatchData) return false;
      const data = m.playerMatchData;
      switch (filterType) {
        case 'goals':       return data.goals > 0;
        case 'assists':     return data.assists > 0;
        case 'yellowCards': return data.yellowCards > 0;
        case 'redCards':    return data.redCards > 0;
        case 'rated':       return data.rating != null;
        default:            return true;
      }
    });
  }, [roleFilteredMatches, filterType]);

  // Count matches by role
  const roleCounts = useMemo(() => {
    return {
      player: allMatchesWithRoles.filter(m => m.isPlayer).length,
      scorer: allMatchesWithRoles.filter(m => m.isScorer).length,
      organizer: allMatchesWithRoles.filter(m => m.isOrganizer).length,
    };
  }, [allMatchesWithRoles]);

  const filterMeta = FILTER_META[filterType] ?? FILTER_META.all;
  const isStatFiltered = filterType && filterType !== 'all';

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isViewingOther ? `${myProfile?.name || 'Player'}'s Matches` : 'My Matches'}
          </h1>
          {myProfile && (
            <p className="text-xs text-purple-600 font-medium truncate">{myProfile.name}</p>
          )}
        </div>
        {myMatchStats.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-white bg-purple-600 rounded-full px-2.5 py-0.5 flex-shrink-0">
            {myMatchStats.length}
          </span>
        )}
      </div>

      {/* Role filter tabs (only show when not viewing other player) */}
      {!isViewingOther && allMatchesWithRoles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                roleFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>All ({allMatchesWithRoles.length})</span>
            </button>
            {roleCounts.player > 0 && (
              <button
                onClick={() => setRoleFilter('player')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  roleFilter === 'player'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>As Player ({roleCounts.player})</span>
              </button>
            )}
            {roleCounts.scorer > 0 && (
              <button
                onClick={() => setRoleFilter('scorer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  roleFilter === 'scorer'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>As Scorer ({roleCounts.scorer})</span>
              </button>
            )}
            {roleCounts.organizer > 0 && (
              <button
                onClick={() => setRoleFilter('organizer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  roleFilter === 'organizer'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>As Organizer ({roleCounts.organizer})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active stat filter chip */}
      {isStatFiltered && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${filterMeta.color}`}>
            {filterMeta.icon && <span className="flex items-center">{filterMeta.icon}</span>}
            <span>Filtered: {filterMeta.label}</span>
          </div>
          {roleFilteredMatches.length > 0 && (
            <span className="text-xs text-gray-400">
              {myMatchStats.length} of {roleFilteredMatches.length} match{roleFilteredMatches.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* No user logged in */}
        {!userId && !isViewingOther && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Swords className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Not logged in</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Please log in to view your match history.
            </p>
          </div>
        )}

        {/* User logged in but no matches at all */}
        {userId && allMatchesWithRoles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-purple-400 dark:text-purple-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">No matches yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Matches will appear here once you play, score, or organize matches.
            </p>
          </div>
        )}

        {/* Has matches but filters show none */}
        {allMatchesWithRoles.length > 0 && myMatchStats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">No matches found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              No matches match the selected filters.
            </p>
          </div>
        )}

        {/* Match list */}
        {myMatchStats.map((item, idx) => {
          const { match, isPlayer, isScorer, isOrganizer, playerMatchData, dateFormatted } = item as any;

          // If no player data, show basic match card
          if (!playerMatchData) {
            return (
              <button
                key={match.id ?? idx}
                onClick={() => onMatchClick?.(match)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 transition-colors text-left"
              >
                {/* Date */}
                <div className="flex flex-col items-center min-w-[36px]">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{dateFormatted.day}</span>
                  <span className="text-[10px] font-semibold text-purple-500 tracking-wider mt-0.5">{dateFormatted.month}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{dateFormatted.year}</span>
                </div>

                <div className="w-px h-12 bg-gray-100 dark:bg-gray-700 flex-shrink-0" />

                {/* Middle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                      {match.scoreA ?? match.team1Score ?? 0}–{match.scoreB ?? match.team2Score ?? 0}
                    </span>
                    <span className="text-sm font-bold truncate dark:text-gray-200">{match.teamA || match.team1 || 'Team A'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    vs <span className="text-gray-500 dark:text-gray-400">{match.teamB || match.team2 || 'Team B'}</span>
                  </p>

                  {/* Role badges */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {isScorer && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Scorer
                      </span>
                    )}
                    {isOrganizer && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        Organizer
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          }

          // Full player card with stats
          const { myTeam, oppTeam, myScore, oppScore, result, goals, assists, yellowCards, redCards, rating } = playerMatchData;

          const resultBadge = {
            win:  { label: 'W', bg: 'bg-green-100 text-green-700' },
            loss: { label: 'L', bg: 'bg-red-100 text-red-600' },
            draw: { label: 'D', bg: 'bg-gray-100 text-gray-600' },
          }[result as 'win' | 'loss' | 'draw'];

          const teamNameColor =
            result === 'win'  ? 'text-green-600' :
            result === 'loss' ? 'text-red-500'   : 'text-gray-500';

          const hasStats = goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0;

          return (
            <button
              key={match.id ?? idx}
              onClick={() => onMatchClick?.(match)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 transition-colors text-left"
            >
              {/* Date */}
              <div className="flex flex-col items-center min-w-[36px]">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{dateFormatted.day}</span>
                <span className="text-[10px] font-semibold text-purple-500 tracking-wider mt-0.5">{dateFormatted.month}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{dateFormatted.year}</span>
              </div>

              <div className="w-px h-12 bg-gray-100 dark:bg-gray-700 flex-shrink-0" />

              {/* Middle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                    {myScore}–{oppScore}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${resultBadge.bg}`}>
                    {resultBadge.label}
                  </span>
                  <span className={`text-sm font-bold truncate ${teamNameColor} dark:brightness-125`}>{myTeam}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  vs <span className="text-gray-500 dark:text-gray-400">{oppTeam}</span>
                </p>

                {/* Stats and roles row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Player stats */}
                  {hasStats ? (
                    <>
                      {goals > 0 && (
                        <div className="flex items-center gap-1">
                          <CircleDot className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{goals}</span>
                        </div>
                      )}
                      {assists > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{assists}</span>
                        </div>
                      )}
                      {yellowCards > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px]">🟨</span>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">×{yellowCards}</span>
                        </div>
                      )}
                      {redCards > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px]">🟥</span>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">×{redCards}</span>
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Role badges */}
                  {isScorer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Scorer
                    </span>
                  )}
                  {isOrganizer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      Organizer
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex flex-col items-center flex-shrink-0 min-w-[44px]">
                {rating != null ? (
                  <>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${getRatingColor(rating)}`}>
                      {rating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-gray-400">rating</span>
                    </div>
                  </>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-400">–</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary footer - only for player stats */}
      {allMatchesWithRoles.filter(m => m.playerMatchData).length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2 text-center">
            {(() => {
              const playerMatches = allMatchesWithRoles.filter(m => m.playerMatchData);
              const played = playerMatches.length;
              const won = playerMatches.filter(m => m.playerMatchData?.result === 'win').length;
              const lost = playerMatches.filter(m => m.playerMatchData?.result === 'loss').length;
              const totalGoals = playerMatches.reduce((sum, m) => sum + (m.playerMatchData?.goals || 0), 0);

              return [
                { label: 'Played', value: played },
                { label: 'Won',   value: won,  color: 'text-green-600' },
                { label: 'Lost',  value: lost, color: 'text-red-500' },
                { label: 'Goals', value: totalGoals, color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl py-2">
                  <div className={`text-lg font-bold ${color || 'text-gray-800 dark:text-gray-100'}`}>{value}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMatches;