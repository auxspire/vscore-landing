import React from 'react';
import { CirclePlay, Info, Plus } from 'lucide-react';
import { Button } from './ui/button';

type TabType = 'matches' | 'info';

interface DesktopSideNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onNewMatch: () => void;
}

const DesktopSideNav = ({ activeTab, onSelectTab, onNewMatch }: DesktopSideNavProps) => {
  const navItem = (tab: TabType, label: string, Icon: typeof CirclePlay) => (
    <button
      type="button"
      onClick={() => onSelectTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {label}
    </button>
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <p className="text-2xl font-bold tracking-tight">
          <span className="text-purple-600">V</span>
          <span className="text-gray-800 dark:text-gray-100">Scor</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score · Track · Discover</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItem('matches', 'Matches', CirclePlay)}
        {navItem('info', 'Browse & Info', Info)}
      </nav>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onNewMatch}>
          <Plus className="w-4 h-4 mr-2" />
          New match
        </Button>
      </div>
    </aside>
  );
};

export default DesktopSideNav;
