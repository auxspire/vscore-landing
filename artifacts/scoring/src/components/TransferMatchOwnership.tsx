import React, { useState, useMemo } from 'react';
import { ArrowLeft, UserCog, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface TransferMatchOwnershipProps {
  match: any;
  onBack: () => void;
  onTransfer: (newOwnerId: string, newOwnerName: string) => void;
  playerDatabase: any[];
  currentUser: any;
}

const TransferMatchOwnership: React.FC<TransferMatchOwnershipProps> = ({
  match,
  onBack,
  onTransfer,
  playerDatabase,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Get registered users (players with owner_user_id)
  const registeredUsers = useMemo(() => {
    const usersMap = new Map();
    
    playerDatabase.forEach(player => {
      if (player.owner_user_id && !usersMap.has(player.owner_user_id)) {
        // Don't include the current owner
        if (player.owner_user_id === currentUser?.user_id) return;
        
        usersMap.set(player.owner_user_id, {
          user_id: player.owner_user_id,
          name: player.name,
          email: player.email || '',
          phoneNumber: player.phoneNumber || '',
          imageUrl: player.imageUrl || ''
        });
      }
    });
    
    return Array.from(usersMap.values());
  }, [playerDatabase, currentUser]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return registeredUsers;
    
    const query = searchQuery.toLowerCase();
    return registeredUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phoneNumber.includes(query)
    );
  }, [registeredUsers, searchQuery]);

  const handleTransfer = () => {
    if (!selectedUser) {
      alert('Please select a user to transfer ownership to');
      return;
    }

    if (window.confirm(
      `Are you sure you want to transfer ownership of this match to ${selectedUser.name}?\n\n` +
      `You will no longer be able to edit this match or calculate payments after the transfer.`
    )) {
      onTransfer(selectedUser.user_id, selectedUser.name);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-medium">Transfer Match Ownership</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {match?.team1} vs {match?.team2}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex gap-3">
          <UserCog className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
              <li>Only the match owner can edit match details and calculate payments</li>
              <li>Transferring ownership cannot be undone</li>
              <li>The new owner will have full control over this match</li>
              <li>Scorers remain unchanged - only ownership is transferred</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Users
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name, email, or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select New Owner ({filteredUsers.length} users)
        </label>
        
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No registered users found</p>
            {searchQuery && (
              <p className="text-sm mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedUser?.user_id === user.user_id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <Avatar className="w-10 h-10">
                  {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email || user.phoneNumber || 'No contact info'}
                  </div>
                </div>
                
                {selectedUser?.user_id === user.user_id && (
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Button */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleTransfer}
          disabled={!selectedUser}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <UserCog className="w-4 h-4 mr-2" />
          Transfer Ownership
        </Button>
      </div>
    </div>
  );
};

export default TransferMatchOwnership;
