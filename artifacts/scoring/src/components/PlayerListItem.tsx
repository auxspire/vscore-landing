import React from 'react';
import { CheckCircle } from 'lucide-react';
import ImageAvatar from './ImageAvatar';

interface PlayerListItemProps {
  player: {
    id: string | number;
    name: string;
    number?: string | number;
    jerseyNumber?: string | number;
    position?: string;
    phoneNumber?: string;
    imageUrl?: string;
  };
  onClick?: () => void;
  className?: string;
  showJerseyBadge?: boolean;
  showPosition?: boolean;
  showTeamName?: boolean;
  teamName?: string;
  variant?: 'default' | 'compact' | 'selected' | 'goalkeeper';
  disabled?: boolean;
  rightContent?: React.ReactNode;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  onClick,
  className = '',
  showJerseyBadge = false,
  showPosition = true,
  showTeamName = false,
  teamName,
  variant = 'default',
  disabled = false,
  rightContent,
}) => {
  // Helper function to check if phone number is valid
  const hasValidPhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return false;
    return /^\+91\d{10}$/.test(phoneNumber);
  };

  const jerseyNumber = player.number || player.jerseyNumber;

  // Determine background and text color based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'selected':
        return 'bg-purple-600 text-white';
      case 'goalkeeper':
        return 'bg-yellow-500 text-white border-2 border-yellow-600';
      case 'compact':
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50';
      default:
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50';
    }
  };

  const baseClasses = `w-full rounded-xl p-4 flex items-center justify-between transition-colors ${
    onClick && !disabled ? 'cursor-pointer' : ''
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${getVariantClasses()} ${className}`;

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      className={baseClasses}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <ImageAvatar
          src={player.imageUrl}
          alt={player.name}
          type="player"
          size="md"
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium truncate ${variant === 'selected' || variant === 'goalkeeper' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {player.name}
            </h4>
            {hasValidPhoneNumber(player.phoneNumber) && (
              <CheckCircle className={`w-4 h-4 flex-shrink-0 ${variant === 'selected' || variant === 'goalkeeper' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
            )}
            {variant === 'goalkeeper' && (
              <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded flex-shrink-0">
                🧤 GK
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {showTeamName && teamName && (
              <>
                <span className={variant === 'selected' || variant === 'goalkeeper' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>
                  {teamName}
                </span>
                {showPosition && player.position && <span className={variant === 'selected' || variant === 'goalkeeper' ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}>•</span>}
              </>
            )}
            {showPosition && player.position && (
              <span className={variant === 'selected' || variant === 'goalkeeper' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>
                {player.position}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {rightContent || (showJerseyBadge && jerseyNumber && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === 'selected' || variant === 'goalkeeper' ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
          <span className={`font-medium ${variant === 'selected' || variant === 'goalkeeper' ? 'text-white' : 'text-purple-600 dark:text-purple-300'}`}>
            #{jerseyNumber}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PlayerListItem;