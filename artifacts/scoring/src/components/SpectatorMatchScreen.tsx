// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { fetchPublicMatch, SPECTATOR_POLL_MS, type PublicMatch } from '../utils/publicMatch';
import { buildPublicMatchUrl } from '../utils/urlRouting';

const SpectatorMatchScreen = ({ matchId, onBack }) => {
  const [match, setMatch] = useState<PublicMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPublicMatch(String(matchId));
      setMatch(data);
      setError(data ? null : 'Match not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, SPECTATOR_POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const copyLink = () => {
    const url = buildPublicMatchUrl(matchId);
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  if (loading && !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading match…</p>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <button onClick={onBack} className="p-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            Copy link
          </Button>
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-xs text-purple-600 uppercase tracking-wide mb-2">Live on VScor</p>
        <div className="flex items-center justify-center gap-4 text-2xl font-semibold dark:text-white">
          <span className="text-right flex-1">{match.teamA}</span>
          <span className="text-3xl text-purple-600">
            {match.scoreA} – {match.scoreB}
          </span>
          <span className="text-left flex-1">{match.teamB}</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">{match.status}</p>
        {match.venue && <p className="text-xs text-gray-400 mt-1">{match.venue}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-gray-900 dark:text-white">Timeline</h2>
        {match.events.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet.</p>
        ) : (
          match.events.map((ev, i) => (
            <div
              key={ev.id ?? i}
              className="flex gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
            >
              <span className="text-xs text-gray-400 w-8">{ev.minute ?? '–'}'</span>
              <div className="flex-1 text-sm">
                <span className="font-medium capitalize">{ev.type?.replace(/_/g, ' ')}</span>
                {ev.player?.name && <span className="text-gray-600 dark:text-gray-300"> — {ev.player.name}</span>}
                {ev.assist?.name && <span className="text-gray-400 text-xs"> (assist: {ev.assist.name})</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpectatorMatchScreen;
