import React, { useState } from 'react';
import { ArrowLeft, Wallet, IndianRupee, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { formatMatchDate } from '../utils/dateHelpers';

interface MatchPaymentsProps {
  onBack: () => void;
  currentUser: any;
  ongoingMatches: any[];
  completedMatches: any[];
  playerDatabase: any[];
  onNavigateToPayment: (match: any) => void;
}

const MatchPayments = ({ 
  onBack, 
  currentUser, 
  ongoingMatches, 
  completedMatches,
  playerDatabase,
  onNavigateToPayment
}: MatchPaymentsProps) => {
  const [activeTab, setActiveTab] = useState<'treasurer' | 'myPayments'>('treasurer');
  
  // Find the current user's player profile
  const currentUserPlayer = playerDatabase.find(
    p => p.owner_user_id === currentUser?.user_id
  );

  // Combine all matches and remove duplicates by match ID
  const allMatchesMap = new Map();
  [...ongoingMatches, ...completedMatches].forEach(match => {
    if (match && match.id) {
      allMatchesMap.set(match.id, match);
    }
  });
  const allMatches = Array.from(allMatchesMap.values());

  // Only include matches where payment calculation has been done
  const matchesWithPayments = allMatches.filter(match => 
    match.paymentData && 
    match.paymentData.playerShares && 
    match.paymentData.playerShares.length > 0
  );

  // Filter matches where user is treasurer
  const treasurerMatches = matchesWithPayments.filter(match => 
    match.paymentData?.treasurer?.id === currentUserPlayer?.id
  );

  // Filter matches where user is a player with payment share
  const playerPaymentMatches = matchesWithPayments.filter(match => {
    if (!match.paymentData?.playerShares || !currentUserPlayer) return false;
    
    return match.paymentData.playerShares.some(
      (share: any) => share.playerId === currentUserPlayer.id
    );
  });

  // Calculate payment stats for treasurer matches
  const getPaymentStats = (match: any) => {
    if (!match.paymentData?.playerShares) {
      return { total: 0, received: 0, pending: 0 };
    }

    const total = match.paymentData.playerShares.reduce(
      (sum: number, share: any) => sum + share.amount,
      0
    );

    const received = match.paymentData.playerShares
      .filter((share: any) => share.isPaid)
      .reduce((sum: number, share: any) => sum + share.amount, 0);

    const pending = total - received;

    return { total, received, pending };
  };

  // Get user's payment share for a match
  const getUserPaymentShare = (match: any) => {
    if (!match.paymentData?.playerShares || !currentUserPlayer) return null;
    
    return match.paymentData.playerShares.find(
      (share: any) => share.playerId === currentUserPlayer.id
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-900 dark:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Match Payments</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your payments and collections
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('treasurer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'treasurer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>As Treasurer</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'treasurer'
                ? 'bg-white/20 text-white'
                : 'bg-gray-300 text-gray-700'
            }`}>
              {treasurerMatches.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('myPayments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'myPayments'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <IndianRupee className="w-5 h-5" />
            <span>My Payments</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'myPayments'
                ? 'bg-white/20 text-white'
                : 'bg-gray-300 text-gray-700'
            }`}>
              {playerPaymentMatches.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 pb-24">
          {/* Treasurer Matches Tab */}
          {activeTab === 'treasurer' && (
            <>
              {treasurerMatches.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Treasurer Matches</h3>
                  <p className="text-gray-600">You are not assigned as treasurer for any matches yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treasurerMatches.map((match) => {
                    const stats = getPaymentStats(match);
                    const isPending = stats.pending > 0;

                    return (
                      <div 
                        key={match.id} 
                        onClick={() => onNavigateToPayment(match)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                      >
                        {/* Match Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {match.team1 || match.teamA} vs {match.team2 || match.teamB}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatMatchDate(match.date)}</span>
                            </div>
                          </div>
                          {match.scoreA !== undefined && match.scoreB !== undefined && (
                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-800">
                                {match.scoreA} - {match.scoreB}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Payment Stats */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-semibold text-gray-800">
                              ₹{stats.total.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Received</p>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{stats.received.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className={`text-sm font-semibold ${
                              isPending ? 'text-orange-600' : 'text-gray-400'
                            }`}>
                              ₹{stats.pending.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3 flex items-center justify-between">
                          {isPending ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              Pending Collection
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              All Collected
                            </div>
                          )}
                          <span className="text-xs text-purple-600 font-medium">
                            Tap to manage →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* My Payments Tab */}
          {activeTab === 'myPayments' && (
            <>
              {playerPaymentMatches.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment Shares</h3>
                  <p className="text-gray-600">You don't have any payment shares in matches yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playerPaymentMatches.map((match) => {
                    const userShare = getUserPaymentShare(match);
                    if (!userShare) return null;

                    return (
                      <div 
                        key={match.id} 
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200"
                      >
                        {/* Match Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {match.team1 || match.teamA} vs {match.team2 || match.teamB}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatMatchDate(match.date)}</span>
                            </div>
                          </div>
                          {match.scoreA !== undefined && match.scoreB !== undefined && (
                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-800">
                                {match.scoreA} - {match.scoreB}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Payment Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Your Share</p>
                            <p className="text-lg font-semibold text-purple-600">
                              ₹{userShare.amount.toFixed(2)}
                            </p>
                          </div>
                          
                          {/* Payment Status */}
                          <div>
                            {userShare.isPaid ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Paid
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                Pending
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Treasurer Info */}
                        {match.paymentData?.treasurer && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Treasurer: <span className="font-medium text-gray-700">{match.paymentData.treasurer.name}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPayments;