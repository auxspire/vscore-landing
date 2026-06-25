/** Migrate localStorage-only entities into cloud KV types (Phase 4). */

import type { SyncDataType } from './cloudSync';
import { pushToCloud } from './cloudSync';

export function collectLocalFixtures(): Array<{ tournamentId: string; store: unknown }> {
  const out: Array<{ tournamentId: string; store: unknown }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('fixtures_')) continue;
    try {
      const store = JSON.parse(localStorage.getItem(key) || 'null');
      if (store) out.push({ tournamentId: key.replace('fixtures_', ''), store });
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function migrateExtendedLocalData(accessToken: string): Promise<void> {
  const flag = 'vscor_extended_migrated';
  if (localStorage.getItem(flag) === 'true') return;

  const fixtures = collectLocalFixtures().map((f) => ({
    tournamentId: f.tournamentId,
    ...((f.store as object) ?? {}),
  }));

  const follows = {
    players: JSON.parse(localStorage.getItem('vscor_followed_players') || '[]'),
    teams: JSON.parse(localStorage.getItem('vscor_followed_teams') || '[]'),
    tournaments: JSON.parse(localStorage.getItem('vscor_followed_tournaments') || '[]'),
  };

  const notifications = JSON.parse(localStorage.getItem('vscor_notifications') || '[]');

  if (fixtures.length) await pushToCloud('tournament_fixtures' as SyncDataType, fixtures, accessToken);
  await pushToCloud('user_follows' as SyncDataType, [follows], accessToken);
  if (notifications.length) await pushToCloud('notifications' as SyncDataType, notifications, accessToken);

  localStorage.setItem(flag, 'true');
}
