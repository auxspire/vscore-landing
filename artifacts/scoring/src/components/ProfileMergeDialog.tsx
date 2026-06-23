import React, { useState, useEffect, useRef } from 'react';
import { User, Users, GitMerge, PlusCircle, Shirt, MapPin, Phone, Mail, Loader2, CheckCircle, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { publicAnonKey, scoringFunctionsUrl } from '../utils/supabase/info';
import { supabase } from '../utils/database/supabaseClient';

interface PlayerProfile {
  id: number | string;
  name: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  jerseyNumber?: string;
  teamName?: string;
  teams?: Array<{ teamId: number; teamName: string; jerseyNumber?: string }>;
  /** Set by the server when the profile is already owned by a different user */
  is_claimed_by_other?: boolean;
}

interface ProfileMergeDialogProps {
  existingProfiles: PlayerProfile[];
  displayName: string;
  email?: string;
  phone?: string;
  onResolved: () => void; // called only when the user explicitly continues
}

type Step = 'choose' | 'confirming' | 'done' | 'error_no_profiles';

export const ProfileMergeDialog: React.FC<ProfileMergeDialogProps> = ({
  existingProfiles,
  displayName,
  email,
  phone,
  onResolved,
}) => {
  const [step, setStep] = useState<Step>(() =>
    !existingProfiles || existingProfiles.length === 0 ? 'error_no_profiles' : 'choose'
  );
  const [selectedProfileId, setSelectedProfileId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SERVER_URL = scoringFunctionsUrl;

  // Keep a stable ref to onResolved so the effect doesn't depend on its identity.
  // This is the key fix: we never put onResolved (or any changing parent value) in
  // a useEffect dependency array, which prevents the dialog from auto-closing on
  // every parent re-render.
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  });

  // Mount-only log — no auto-close of any kind here.
  useEffect(() => {
    console.log('🔄 [ProfileMergeDialog] Mounted. Profiles:', existingProfiles?.length ?? 0);
    console.log('📋 [ProfileMergeDialog] Profiles:', existingProfiles);
    // intentionally empty dependency array — runs only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const callLinkEndpoint = async (action: 'merge' | 'create_new', profileId?: number | string) => {
    console.log(`🔗 [ProfileMergeDialog] Starting ${action}`, { profileId, displayName, email, phone });
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const body: any = {
        access_token: accessToken,
        action,
        display_name: displayName,
        email: email || '',
        phone: phone || '',
      };
      if (action === 'merge' && profileId != null) {
        body.player_profile_id = profileId;
      }

      const res = await fetch(`${SERVER_URL}/auth/link-player-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error('❌ [ProfileMergeDialog] Server error:', result.error);
        setError(result.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ [ProfileMergeDialog] Action completed:', result);
      // Move to success screen — user must explicitly press "Continue"
      setStep('done');
      setLoading(false);
    } catch (err: any) {
      console.error('❌ [ProfileMergeDialog] Network error:', err);
      setError(err?.message || 'Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (selectedProfileId == null) return;
    await callLinkEndpoint('merge', selectedProfileId);
  };

  const handleCreateNew = async () => {
    await callLinkEndpoint('create_new');
  };

  // The ONLY place onResolved is ever called — by explicit user action.
  const handleContinue = () => {
    console.log('✅ [ProfileMergeDialog] User pressed Continue, resolving.');
    onResolvedRef.current();
  };

  // ─── team label helper ───────────────────────────────────────────────────────
  const getTeamLabel = (p: PlayerProfile) => {
    if (p.teams && p.teams.length > 0) return p.teams.map(t => t.teamName).join(', ');
    return p.teamName || null;
  };

  const selectedProfile = existingProfiles?.find(p => p.id === selectedProfileId);
  const selectedIsClaimedByOther = selectedProfile?.is_claimed_by_other ?? false;

  // ─── edge case: no profiles were passed ──────────────────────────────────────
  if (step === 'error_no_profiles') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl px-6 pt-8 pb-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-9 h-9 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Profiles Found</h2>
          <p className="text-gray-500 text-sm text-center">
            We couldn't find any player profiles to link. You'll continue with a new profile.
          </p>
          <button
            onClick={handleContinue}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Continue to VScor
          </button>
        </div>
      </div>
    );
  }

  // ─── success screen ───────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl px-6 pt-8 pb-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">All set!</h2>
          <p className="text-gray-500 text-sm text-center">
            Your player profile is ready. Welcome to VScor!
          </p>
          {/* User must tap Continue — dialog never dismisses itself */}
          <button
            onClick={handleContinue}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Continue to VScor
          </button>
        </div>
      </div>
    );
  }

  // ─── main choose screen ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Player Profile Found</h2>
              <p className="text-purple-200 text-xs">
                We found existing profiles using your {phone ? 'phone number' : 'email'}
              </p>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            {existingProfiles.length === 1
              ? `A player profile already exists with your ${phone ? 'phone number' : 'email'}. Would you like to link your account to it, or create a separate profile?`
              : `${existingProfiles.length} player profiles exist with your ${phone ? 'phone number' : 'email'}. Select one to link, or create a separate profile.`}
          </p>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Existing profiles list */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Existing Profiles
          </p>
          <div className="space-y-3 mb-5">
            {existingProfiles.map((profile) => {
              const isSelected = selectedProfileId === profile.id;
              const isClaimed = !!profile.is_claimed_by_other;
              const teamLabel = getTeamLabel(profile);
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    if (!isClaimed) setSelectedProfileId(isSelected ? null : profile.id);
                  }}
                  disabled={loading || isClaimed}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                    isClaimed
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-100 bg-gray-50 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isClaimed ? 'bg-gray-200' : isSelected ? 'bg-purple-600' : 'bg-purple-100'
                    }`}>
                      {isClaimed
                        ? <Lock className="w-5 h-5 text-gray-400" />
                        : <User className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{profile.name}</span>
                        {isClaimed ? (
                          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            Linked to another account
                          </span>
                        ) : isSelected ? (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {profile.position && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            <span>{profile.position}</span>
                          </div>
                        )}
                        {profile.jerseyNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Shirt className="w-3 h-3" />
                            <span>Jersey #{profile.jerseyNumber}</span>
                          </div>
                        )}
                        {teamLabel && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{teamLabel}</span>
                          </div>
                        )}
                        {profile.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{profile.phoneNumber}</span>
                          </div>
                        )}
                        {profile.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{profile.email}</span>
                          </div>
                        )}
                        {isClaimed && (
                          <p className="text-xs text-amber-600 mt-1">
                            This profile is managed by another user and can't be claimed.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* New profile preview */}
          <div className={`rounded-2xl border-2 p-4 mb-6 transition-all ${
            selectedProfileId == null ? 'border-purple-300 bg-purple-50' : 'border-dashed border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                selectedProfileId == null ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <PlusCircle className={`w-5 h-5 ${selectedProfileId == null ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-700 text-sm">New Separate Profile</p>
                  {selectedProfileId == null && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{displayName} · {phone || email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Will be created fresh with no team history</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pb-2">
            {/* Link button — only visible when a profile is selected */}
            {selectedProfileId != null && !selectedIsClaimedByOther && (
              <button
                onClick={handleMerge}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <GitMerge className="w-5 h-5" />
                    <span>Link to Selected Profile</span>
                  </>
                )}
              </button>
            )}

            {/* Create new / continue with separate profile */}
            <button
              onClick={handleCreateNew}
              disabled={loading}
              className={`w-full rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedProfileId != null && !selectedIsClaimedByOther
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {loading && (selectedProfileId == null || selectedIsClaimedByOther) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>
                    {selectedProfileId != null && !selectedIsClaimedByOther
                      ? 'Continue with Separate Profile Instead'
                      : 'Create Separate Profile'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Hint */}
          <p className="text-center text-xs text-gray-400 mt-3 pb-2">
            Linking lets you manage your existing match history and team memberships.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileMergeDialog;
