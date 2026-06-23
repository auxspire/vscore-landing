import React from 'react';
import { UserCircle, Shield, Trophy } from 'lucide-react';

interface ImageAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'player' | 'team' | 'tournament';
  number?: string | number;
  className?: string;
}

const ImageAvatar: React.FC<ImageAvatarProps> = ({
  src,
  alt,
  size = 'md',
  type = 'player',
  number,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const DefaultIcon = type === 'player' ? UserCircle : type === 'team' ? Shield : Trophy;

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-purple-50">
          <DefaultIcon className={`${iconSizes[size]} text-purple-300`} />
        </div>
      )}
      {number !== undefined && number !== null && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs text-center leading-none py-0.5">
          {number}
        </div>
      )}
    </div>
  );
};

export default ImageAvatar;
