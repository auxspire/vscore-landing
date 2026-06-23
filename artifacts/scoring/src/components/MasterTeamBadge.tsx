// @ts-nocheck
import React from 'react';
import { Database } from 'lucide-react';
import { Badge } from './ui/badge';

/**
 * MasterTeamBadge - Visual indicator showing that a team is from the Master Teams Table
 * This badge helps users understand that the team is permanently stored and reusable
 */
export const MasterTeamBadge = ({ variant = 'default', showIcon = true, text = 'Master Team' }) => {
  return (
    <Badge 
      variant={variant} 
      className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs gap-1"
    >
      {showIcon && <Database className="w-3 h-3" />}
      {text}
    </Badge>
  );
};

/**
 * TeamSourceIndicator - Shows whether a team is from Master Teams Table or created inline
 */
export const TeamSourceIndicator = ({ isFromMasterTable, compact = false }) => {
  if (!isFromMasterTable) {
    return null;
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-purple-600" title="This team is stored in the Master Teams database">
        <Database className="w-3 h-3" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-full text-xs text-purple-700 border border-purple-200">
      <Database className="w-3 h-3" />
      <span>Master Team</span>
    </div>
  );
};

export default MasterTeamBadge;
