/**
 * Notification Types and Utilities for VScor
 */

export type NotificationType = 
  | 'profile_created'
  | 'added_to_team'
  | 'team_enrolled_tournament'
  | 'match_started'
  | 'match_ended'
  | 'squad_join_request'
  | 'tournament_entry_request';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  // Action data for navigation
  actionType?: 'profile' | 'team' | 'tournament' | 'match';
  actionData?: {
    teamId?: number;
    teamName?: string;
    tournamentId?: number;
    tournamentName?: string;
    matchId?: number;
    requestId?: string;
  };
}

const STORAGE_KEY = 'vscor_notifications';
const UNREAD_COUNT_KEY = 'vscor_unread_notifications_count';

/**
 * Get all notifications from localStorage
 */
export function getNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
  return [];
}

/**
 * Save notifications to localStorage
 */
function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    updateUnreadCount(notifications);
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

/**
 * Update unread count in localStorage
 */
function updateUnreadCount(notifications: Notification[]): void {
  const unreadCount = notifications.filter(n => !n.read).length;
  localStorage.setItem(UNREAD_COUNT_KEY, String(unreadCount));
  
  // Dispatch custom event so the app can update the badge
  window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
    detail: { unreadCount } 
  }));
}

/**
 * Add a new notification
 */
export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  actionType?: 'profile' | 'team' | 'tournament' | 'match',
  actionData?: Notification['actionData']
): void {
  const notifications = getNotifications();
  
  const newNotification: Notification = {
    id: Date.now(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    actionType,
    actionData
  };
  
  // Add to beginning of array (most recent first)
  notifications.unshift(newNotification);
  
  // Keep only last 100 notifications
  const trimmed = notifications.slice(0, 100);
  
  saveNotifications(trimmed);
  
  console.log('📢 Notification added:', newNotification);
}

/**
 * Mark a notification as read
 */
export function markAsRead(notificationId: number): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId: number): void {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  saveNotifications(filtered);
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * Helper functions to create specific notification types
 */

export function notifyProfileCreated(userName: string): void {
  addNotification(
    'profile_created',
    'Welcome to VScor!',
    `Your profile "${userName}" has been created successfully. Start exploring matches and teams!`,
    'profile'
  );
}

export function notifyAddedToTeam(teamName: string, teamId: number): void {
  addNotification(
    'added_to_team',
    'Added to Team',
    `You have been added to the squad of "${teamName}". Check out your team profile!`,
    'team',
    { teamId, teamName }
  );
}

export function notifyTeamEnrolledInTournament(
  teamName: string,
  tournamentName: string,
  tournamentId: number
): void {
  addNotification(
    'team_enrolled_tournament',
    'Tournament Enrollment',
    `Your team "${teamName}" has been enrolled in "${tournamentName}". Good luck!`,
    'tournament',
    { tournamentId, tournamentName, teamName }
  );
}

export function notifyMatchStarted(
  teamName: string,
  opponentName: string,
  matchId: number
): void {
  addNotification(
    'match_started',
    'Match Started',
    `${teamName} vs ${opponentName} has just started! Follow live updates.`,
    'match',
    { matchId, teamName }
  );
}

export function notifyMatchEnded(
  teamName: string,
  opponentName: string,
  score: string,
  matchId: number
): void {
  addNotification(
    'match_ended',
    'Match Ended',
    `${teamName} vs ${opponentName} has ended. Final score: ${score}`,
    'match',
    { matchId, teamName }
  );
}

export function notifySquadJoinRequest(
  playerName: string,
  teamName: string,
  teamId: number,
  requestId: string
): void {
  addNotification(
    'squad_join_request',
    'Squad Join Request',
    `${playerName} wants to join your team "${teamName}". Review the request in team settings.`,
    'team',
    { teamId, teamName, requestId }
  );
}

export function notifyTournamentEntryRequest(
  teamName: string,
  tournamentName: string,
  tournamentId: number,
  requestId: string
): void {
  addNotification(
    'tournament_entry_request',
    'Tournament Entry Request',
    `"${teamName}" wants to join your tournament "${tournamentName}". Review the request.`,
    'tournament',
    { tournamentId, tournamentName, teamName, requestId }
  );
}
