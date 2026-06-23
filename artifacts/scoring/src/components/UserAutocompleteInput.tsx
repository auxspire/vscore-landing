import React, { useState, useRef, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import { Input } from './ui/input';

export interface AutocompleteUser {
  id: number | string;
  name: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  jerseyNumber?: string;
  imageUrl?: string;
  owner_user_id?: number | string;
}

interface UserAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: AutocompleteUser) => void;
  users: AutocompleteUser[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Sub-label shown in each suggestion row (e.g. email for coordinators, position for players) */
  suggestionSubLabel?: (user: AutocompleteUser) => string;
  /** Minimum chars before showing suggestions (default 2) */
  minChars?: number;
}

const UserAutocompleteInput: React.FC<UserAutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  users,
  placeholder = 'Type a name…',
  className = '',
  disabled = false,
  suggestionSubLabel,
  minChars = 2,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter matching users after minChars
  const query = value.trim().toLowerCase();
  const suggestions: AutocompleteUser[] =
    query.length >= minChars
      ? users.filter(u =>
          u.name.toLowerCase().includes(query)
        ).slice(0, 8)
      : [];

  // Open/close based on suggestions
  useEffect(() => {
    if (suggestions.length > 0) {
      setOpen(true);
      setActiveIndex(-1);
    } else {
      setOpen(false);
    }
  }, [suggestions.length]);

  // Click-outside closes the dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelect = (user: AutocompleteUser) => {
    onSelect(user);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`border border-gray-300 rounded-lg text-sm ${className}`}
        disabled={disabled}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-50"
        >
          {suggestions.map((user, idx) => {
            const sub = suggestionSubLabel ? suggestionSubLabel(user) : (user.email || user.position || '');
            const isActive = idx === activeIndex;
            return (
              <li key={user.id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(user); }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-purple-500" />
                    )}
                  </div>

                  {/* Name + sub-label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    {sub && (
                      <p className="text-xs text-gray-400 truncate">{sub}</p>
                    )}
                  </div>

                  {/* "Registered" badge for users with an account */}
                  {user.owner_user_id && (
                    <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5" />
                      Registered
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UserAutocompleteInput;
