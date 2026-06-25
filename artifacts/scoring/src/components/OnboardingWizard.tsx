// @ts-nocheck
import React, { useState } from 'react';
import { ArrowRight, X, Users, UserPlus, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const ONBOARDING_KEY = 'vscor_onboarding_done';

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

const OnboardingWizard = ({
  onComplete,
  onSkip,
  onAddTeam,
  onAddPlayers,
  onStartMatch,
  registeredTeamsCount = 0,
}) => {
  const [step, setStep] = useState(registeredTeamsCount > 0 ? 2 : 1);
  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '']);

  const finish = (skipped = false) => {
    markOnboardingComplete();
    if (skipped) onSkip();
    else onComplete();
  };

  const handleTeamNext = () => {
    if (teamName.trim()) {
      onAddTeam({ name: teamName.trim(), coachManager: '', players: [] });
    }
    setStep(2);
  };

  const handlePlayersNext = () => {
    const names = playerNames.map((n) => n.trim()).filter(Boolean);
    if (names.length) onAddPlayers(names);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-purple-600 font-medium">Setup · Step {step} of 3</p>
          <button type="button" onClick={() => finish(true)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold dark:text-white">Create your team</h2>
                <p className="text-sm text-gray-500">What do you call your Sunday squad?</p>
              </div>
            </div>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Sunday FC"
              className="py-3"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => finish(true)}>Skip</Button>
              <Button className="flex-1 bg-purple-600" onClick={handleTeamNext}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold dark:text-white">Add players</h2>
                <p className="text-sm text-gray-500">At least 3 names to get started</p>
              </div>
            </div>
            <div className="space-y-2">
              {playerNames.map((name, i) => (
                <Input
                  key={i}
                  value={name}
                  onChange={(e) => {
                    const next = [...playerNames];
                    next[i] = e.target.value;
                    setPlayerNames(next);
                  }}
                  placeholder={`Player ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => finish(true)}>Skip</Button>
              <Button className="flex-1 bg-purple-600" onClick={handlePlayersNext}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold dark:text-white">Ready to play</h2>
                <p className="text-sm text-gray-500">Start a quick friendly match — 60 min, basic scoring.</p>
              </div>
            </div>
            <Button
              className="w-full bg-purple-600 py-6"
              onClick={() => {
                markOnboardingComplete();
                onStartMatch();
              }}
            >
              Start quick match
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => finish(false)}>
              I&apos;ll do this later
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
