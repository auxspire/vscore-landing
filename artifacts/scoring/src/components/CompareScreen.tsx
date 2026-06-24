// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const CompareScreen = ({
  onBack,
  mode = 'players',
  players = [],
  teams = [],
}) => {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  const list = mode === 'players' ? players : teams;
  const left = list.find((x) => String(x.id) === leftId);
  const right = list.find((x) => String(x.id) === rightId);

  const metrics =
    mode === 'players'
      ? [
          { key: 'goals', label: 'Goals' },
          { key: 'assists', label: 'Assists' },
          { key: 'matches', label: 'Matches' },
        ]
      : [
          { key: 'points', label: 'Points' },
          { key: 'wins', label: 'Wins' },
          { key: 'matches', label: 'Matches' },
          { key: 'gf', label: 'Goals for' },
          { key: 'ga', label: 'Goals against' },
        ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6 dark:text-white" />
          </button>
          <h1 className="text-xl font-medium dark:text-white">
            Compare {mode === 'players' ? 'Players' : 'Teams'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger><SelectValue placeholder="Pick left" /></SelectTrigger>
            <SelectContent>
              {list.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger><SelectValue placeholder="Pick right" /></SelectTrigger>
            <SelectContent>
              {list.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {left && right ? (
          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-3 bg-purple-50 dark:bg-purple-900/20 p-3 text-sm font-medium">
              <span className="text-center">{left.name}</span>
              <span className="text-center text-gray-500">Stat</span>
              <span className="text-center">{right.name}</span>
            </div>
            {metrics.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-3 p-3 border-t text-sm dark:text-gray-100">
                <span className="text-center font-semibold">{left[key] ?? 0}</span>
                <span className="text-center text-gray-500">{label}</span>
                <span className="text-center font-semibold">{right[key] ?? 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select two {mode} to compare.</p>
        )}
      </div>
    </div>
  );
};

export default CompareScreen;
