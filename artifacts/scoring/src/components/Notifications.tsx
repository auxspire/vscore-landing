// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle, UserPlus, Users, Trophy, Calendar, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
  NotificationType
} from '../utils/notifications';

interface NotificationsProps {
  onBack: () => void;
  currentUserId?: string | null;
  onNavigate?: (view: string, data?: any) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onBack, currentUserId, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Load notifications from localStorage
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const notifs = getNotifications();
    setNotifications(notifs);
  };

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleDeleteNotification = (id: number) => {
    deleteNotification(id);
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on action type
    if (onNavigate && notification.actionType) {
      switch (notification.actionType) {
        case 'profile':
          onNavigate('profile');
          break;
        case 'team':
          if (notification.actionData?.teamId) {
            onNavigate('teamProfile', { 
              teamId: notification.actionData.teamId,
              teamName: notification.actionData.teamName
            });
          }
          break;
        case 'tournament':
          if (notification.actionData?.tournamentId) {
            onNavigate('tournamentProfile', { 
              tournamentId: notification.actionData.tournamentId,
              tournamentName: notification.actionData.tournamentName
            });
          }
          break;
        case 'match':
          if (notification.actionData?.matchId) {
            onNavigate('matchEvents', { 
              matchId: notification.actionData.matchId
            });
          }
          break;
      }
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'profile_created':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'added_to_team':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'team_enrolled_tournament':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'match_started':
      case 'match_ended':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'squad_join_request':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'tournament_entry_request':
        return <Trophy className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2">
              <ArrowLeft className="w-6 h-6 dark:text-gray-100" />
            </button>
            <div>
              <h1 className="font-medium text-lg dark:text-gray-100">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3 pb-24">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {filter === 'unread' 
                ? "You're all caught up!" 
                : "We'll notify you when something important happens"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border transition-all ${
                notification.read
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.read 
                    ? 'bg-gray-100 dark:bg-gray-700' 
                    : 'bg-white dark:bg-gray-800'
                }`}>
                  {getNotificationIcon(notification.icon || notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${
                        notification.read 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : 'text-purple-900 dark:text-purple-100'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;