import React, { useState, useEffect } from 'react';
import { ArrowLeft, IndianRupee, Users, User, Edit2, Check, Share2, Save, RefreshCw, Send, CheckCircle2, Wallet, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import TextShareModal from './TextShareModal';

interface PaymentShare {
  playerId: number;
  playerName: string;
  teamName: string;
  amount: number;
  isEdited: boolean;
  isPaid?: boolean;
}

interface CalculatePaymentProps {
  onBack: () => void;
  match: any;
  playerDatabase: any[];
  onSavePayment?: (matchId: string, paymentData: any) => void;
  currentUser?: any;
}

const CalculatePayment = ({ onBack, match, playerDatabase, onSavePayment, currentUser }: CalculatePaymentProps) => {
  const [venueRent, setVenueRent] = useState<string>('');
  const [otherCosts, setOtherCosts] = useState<string>('');
  const [divisionMethod, setDivisionMethod] = useState<'teams' | 'players'>('players');
  const [playerShares, setPlayerShares] = useState<PaymentShare[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [treasurer, setTreasurer] = useState<{ id: number; name: string } | null>(null);
  const [isChangingTreasurer, setIsChangingTreasurer] = useState(false);
  const [treasurerSearch, setTreasurerSearch] = useState('');
  const [showTreasurerSuggestions, setShowTreasurerSuggestions] = useState(false);

  // Load saved payment data when component mounts
  useEffect(() => {
    if (match?.paymentData) {
      const { venueRent, otherCosts, divisionMethod, playerShares, treasurer } = match.paymentData;
      setVenueRent(venueRent || '');
      setOtherCosts(otherCosts || '');
      setDivisionMethod(divisionMethod || 'players');
      if (playerShares && playerShares.length > 0) {
        setPlayerShares(playerShares);
      }
      if (treasurer) {
        setTreasurer(treasurer);
      } else {
        // Default to match creator if no treasurer is saved
        setDefaultTreasurer();
      }
      setIsSaved(true);
      setIsEditMode(false);
    } else {
      // Set default treasurer for new payment calculations
      setDefaultTreasurer();
    }
  }, [match?.id]);

  // Function to set default treasurer (match creator)
  const setDefaultTreasurer = () => {
    // Default to the current user if they match the scoredBy field
    if (currentUser && match?.scoredBy === currentUser.user_id) {
      // Find the player profile for the current user
      const currentUserPlayer = playerDatabase.find(p => p.owner_user_id === currentUser.user_id);
      if (currentUserPlayer) {
        setTreasurer({ id: currentUserPlayer.id, name: currentUserPlayer.name });
        return;
      }
    }
    
    // Try to find the match creator from scoredBy field
    if (match?.scoredBy) {
      // Find player in database by owner_user_id
      const creatorPlayer = playerDatabase.find(p => p.owner_user_id === match.scoredBy);
      if (creatorPlayer) {
        setTreasurer({ id: creatorPlayer.id, name: creatorPlayer.name });
        return;
      }
    }
    
    // No default - let user assign
    setTreasurer(null);
  };

  // Reset all edited flags when division method changes
  useEffect(() => {
    setPlayerShares(prevShares => 
      prevShares.map(player => ({ ...player, isEdited: false }))
    );
  }, [divisionMethod]);

  // Get all players from the match
  const getAllMatchPlayers = () => {
    if (!match) return [];
    
    const players: PaymentShare[] = [];
    const playerIds = new Set<number>(); // Track unique player IDs to avoid duplicates
    
    // Handle live-scored matches (team1Squad and team2Squad)
    // Handle result entry matches (team1Players and team2Players)
    const team1Data = match.team1Squad || match.team1Players || [];
    const team2Data = match.team2Squad || match.team2Players || [];
    
    // Add Team 1 players
    if (team1Data.length > 0) {
      team1Data.forEach((player: any) => {
        if (!playerIds.has(player.id)) {
          players.push({
            playerId: player.id,
            playerName: player.name,
            teamName: match.team1 || match.teamA,
            amount: 0,
            isEdited: false
          });
          playerIds.add(player.id);
        }
      });
    }
    
    // Add Team 2 players
    if (team2Data.length > 0) {
      team2Data.forEach((player: any) => {
        if (!playerIds.has(player.id)) {
          players.push({
            playerId: player.id,
            playerName: player.name,
            teamName: match.team2 || match.teamB,
            amount: 0,
            isEdited: false
          });
          playerIds.add(player.id);
        }
      });
    }
    
    // Add substituted IN and OUT players (if not already included)
    if (match.events && match.events.length > 0) {
      const substituteEvents = match.events.filter((event: any) => event.type === 'substitute');
      
      substituteEvents.forEach((event: any) => {
        const teamName = event.teamName || (event.team === 1 ? (match.team1 || match.teamA) : (match.team2 || match.teamB));
        
        // Add player who was substituted IN
        if (event.playerIn && !playerIds.has(event.playerIn.id)) {
          players.push({
            playerId: event.playerIn.id,
            playerName: event.playerIn.name,
            teamName: teamName,
            amount: 0,
            isEdited: false
          });
          playerIds.add(event.playerIn.id);
        }
        
        // Add player who was substituted OUT (they also played and should pay)
        if (event.playerOut && !playerIds.has(event.playerOut.id)) {
          players.push({
            playerId: event.playerOut.id,
            playerName: event.playerOut.name,
            teamName: teamName,
            amount: 0,
            isEdited: false
          });
          playerIds.add(event.playerOut.id);
        }
      });
    }
    
    return players;
  };

  // Calculate total cost
  const getTotalCost = () => {
    const venue = parseFloat(venueRent) || 0;
    const other = parseFloat(otherCosts) || 0;
    return venue + other;
  };

  // Recalculate payment shares
  useEffect(() => {
    // If saved data exists and not in edit mode, don't auto-recalculate
    if (match?.paymentData?.playerShares && match.paymentData.playerShares.length > 0 && !isEditMode) {
      return;
    }
    
    const totalCost = getTotalCost();
    const allPlayers = getAllMatchPlayers();
    
    if (totalCost === 0 || allPlayers.length === 0) {
      setPlayerShares(allPlayers);
      return;
    }

    const teamAName = match.teamA || match.team1;
    const teamBName = match.teamB || match.team2;

    if (divisionMethod === 'teams') {
      // Divide equally between 2 teams
      const perTeam = totalCost / 2;
      const teamAPlayers = allPlayers.filter(p => p.teamName === teamAName);
      const teamBPlayers = allPlayers.filter(p => p.teamName === teamBName);
      
      const teamAShare = teamAPlayers.length > 0 ? perTeam / teamAPlayers.length : 0;
      const teamBShare = teamBPlayers.length > 0 ? perTeam / teamBPlayers.length : 0;
      
      setPlayerShares(allPlayers.map(player => ({
        ...player,
        amount: player.isEdited ? player.amount : (player.teamName === teamAName ? teamAShare : teamBShare),
      })));
    } else {
      // Divide equally among all players
      const editedPlayers = allPlayers.filter(p => p.isEdited);
      const nonEditedPlayers = allPlayers.filter(p => !p.isEdited);
      
      // Calculate total already allocated to edited players
      const editedTotal = editedPlayers.reduce((sum, p) => sum + p.amount, 0);
      const remainingCost = totalCost - editedTotal;
      
      // Distribute remaining cost among non-edited players
      const perPlayer = nonEditedPlayers.length > 0 ? remainingCost / nonEditedPlayers.length : 0;
      
      setPlayerShares(allPlayers.map(player => ({
        ...player,
        amount: player.isEdited ? player.amount : perPlayer,
      })));
    }
  }, [venueRent, otherCosts, divisionMethod, match?.id, isEditMode]);

  // Handle editing a player's share
  const handleEditShare = (playerId: number, currentAmount: number) => {
    setEditingPlayerId(playerId);
    setEditAmount(currentAmount.toFixed(2));
  };

  // Handle saving edited share
  const handleSaveShare = (playerId: number) => {
    const newAmount = parseFloat(editAmount) || 0;
    const totalCost = getTotalCost();
    
    // Update the player's share
    const updatedShares = playerShares.map(player => {
      if (player.playerId === playerId) {
        return { ...player, amount: newAmount, isEdited: true };
      }
      return player;
    });
    
    // Calculate remaining cost for non-edited players
    const editedPlayers = updatedShares.filter(p => p.isEdited);
    const nonEditedPlayers = updatedShares.filter(p => !p.isEdited);
    const editedTotal = editedPlayers.reduce((sum, p) => sum + p.amount, 0);
    const remainingCost = totalCost - editedTotal;
    
    const teamAName = match.teamA || match.team1;
    const teamBName = match.teamB || match.team2;
    
    // Recalculate shares for non-edited players
    if (divisionMethod === 'players') {
      const perPlayer = nonEditedPlayers.length > 0 ? remainingCost / nonEditedPlayers.length : 0;
      setPlayerShares(updatedShares.map(player => ({
        ...player,
        amount: player.isEdited ? player.amount : perPlayer,
      })));
    } else {
      // For team-based division
      const teamANonEdited = nonEditedPlayers.filter(p => p.teamName === teamAName);
      const teamBNonEdited = nonEditedPlayers.filter(p => p.teamName === teamBName);
      
      // Calculate what each team should pay
      const teamAEdited = editedPlayers.filter(p => p.teamName === teamAName);
      const teamBEdited = editedPlayers.filter(p => p.teamName === teamBName);
      
      const teamAEditedTotal = teamAEdited.reduce((sum, p) => sum + p.amount, 0);
      const teamBEditedTotal = teamBEdited.reduce((sum, p) => sum + p.amount, 0);
      
      const perTeam = totalCost / 2;
      const teamARemainder = perTeam - teamAEditedTotal;
      const teamBRemainder = perTeam - teamBEditedTotal;
      
      const teamAShare = teamANonEdited.length > 0 ? teamARemainder / teamANonEdited.length : 0;
      const teamBShare = teamBNonEdited.length > 0 ? teamBRemainder / teamBNonEdited.length : 0;
      
      setPlayerShares(updatedShares.map(player => {
        if (player.isEdited) return player;
        return {
          ...player,
          amount: player.teamName === teamAName ? teamAShare : teamBShare,
        };
      }));
    }
    
    setEditingPlayerId(null);
  };

  // Calculate totals for display
  const getTeamTotal = (teamName: string) => {
    return playerShares
      .filter(p => p.teamName === teamName)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getGrandTotal = () => {
    return playerShares.reduce((sum, p) => sum + p.amount, 0);
  };

  // Save payment data
  const handleSavePayment = () => {
    if (onSavePayment && match?.id) {
      const paymentData = {
        venueRent,
        otherCosts,
        divisionMethod,
        playerShares,
        treasurer,
        savedAt: new Date().toISOString()
      };
      
      onSavePayment(match.id, paymentData);
      setIsSaved(true);
      setIsEditMode(false);
    }
  };

  // Handle recalculate button click
  const handleRecalculate = () => {
    setIsEditMode(true);
  };

  // Determine if inputs should be disabled
  const isInputDisabled = isSaved && !isEditMode;

  // Handle toggle paid status
  const handleTogglePaid = (playerId: number) => {
    setPlayerShares(prevShares => {
      const updatedShares = prevShares.map(player =>
        player.playerId === playerId
          ? { ...player, isPaid: !player.isPaid }
          : player
      );
      
      // Auto-save when payment status changes
      if (onSavePayment && match?.id) {
        const paymentData = {
          venueRent,
          otherCosts,
          divisionMethod,
          playerShares: updatedShares,
          treasurer,
          savedAt: new Date().toISOString()
        };
        
        // Save immediately
        setTimeout(() => {
          onSavePayment(match.id, paymentData);
        }, 0);
      }
      
      return updatedShares;
    });
  };

  // Generate personalized reminder text for a specific player
  const generatePlayerReminderText = (player: PaymentShare) => {
    let text = `Hi ${player.playerName},\n\n`;
    text += `This is a friendly reminder regarding the payment for the match:\n\n`;
    text += `⚽ ${match?.teamA} vs ${match?.teamB}\n`;
    
    // Add final score if available
    if (match?.scoreA !== undefined && match?.scoreB !== undefined) {
      text += `Final Score: ${match.scoreA} - ${match.scoreB}\n`;
    }
    
    // Add date if available
    if (match?.date) {
      const matchDate = new Date(match.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      text += `📅 Date: ${matchDate}\n`;
    }
    
    // Add time if available
    if (match?.matchTime) {
      const [hours, minutes] = match.matchTime.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      text += `🕐 Time: ${hour12}:${minutes} ${ampm}\n`;
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💰 PAYMENT CALCULATION\n\n`;
    
    // Cost breakdown
    text += `Total Match Costs:\n`;
    if (venueRent && parseFloat(venueRent) > 0) {
      text += `  • Venue Rent: ₹${parseFloat(venueRent).toFixed(2)}\n`;
    }
    if (otherCosts && parseFloat(otherCosts) > 0) {
      text += `  • Other Costs: ₹${parseFloat(otherCosts).toFixed(2)}\n`;
    }
    text += `  • Total: ₹${getTotalCost().toFixed(2)}\n\n`;
    
    // Division method explanation
    if (divisionMethod === 'teams') {
      text += `Division Method: Split equally between teams\n`;
      text += `Your Team (${player.teamName}): ₹${getTeamTotal(player.teamName).toFixed(2)}\n`;
      const teamPlayers = playerShares.filter(p => p.teamName === player.teamName);
      text += `Players in your team: ${teamPlayers.length}\n\n`;
    } else {
      text += `Division Method: Split equally among all ${playerShares.length} players\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💵 YOUR SHARE: ₹${player.amount.toFixed(2)}\n`;
    
    if (player.isEdited) {
      text += `(Custom amount)\n`;
    }
    
    text += `\nPlease make the payment at your earliest convenience.\n\n`;
    text += `Thank you!\n\n`;
    text += `Sent via VScor`;
    
    return text;
  };

  // Handle send reminder - copies personalized text to clipboard
  const handleSendReminder = async (player: PaymentShare) => {
    const reminderText = generatePlayerReminderText(player);
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reminderText);
        alert(`Payment reminder for ${player.playerName} copied to clipboard!`);
        return;
      }
    } catch (err) {
      console.log('Clipboard API failed, trying fallback method:', err);
    }
    
    // Fallback method using textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = reminderText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        alert(`Payment reminder for ${player.playerName} copied to clipboard!`);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('Failed to copy reminder:', err);
      // Show the text in an alert as last resort
      alert(`Could not copy automatically. Here's the reminder:\n\n${reminderText}`);
    }
  };

  // Generate shareable text for payment breakdown
  const generatePaymentBreakdownText = () => {
    let text = `💰 PAYMENT BREAKDOWN\n\n`;
    text += `${match?.teamA} vs ${match?.teamB}\n`;
    
    // Add final score
    if (match?.scoreA !== undefined && match?.scoreB !== undefined) {
      text += `Final Score: ${match.scoreA} - ${match.scoreB}\n`;
    }
    
    // Add date if available
    if (match?.date) {
      const matchDate = new Date(match.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      text += `📅 ${matchDate}\n`;
    }
    
    // Add time if available (format HH:mm to 12-hour format)
    if (match?.matchTime) {
      const [hours, minutes] = match.matchTime.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      text += `🕐 ${hour12}:${minutes} ${ampm}\n`;
    }
    
    text += `\n`;
    
    // Costs breakdown
    text += `📊 COSTS\n\n`;
    if (venueRent && parseFloat(venueRent) > 0) {
      text += `Venue Rent: ₹${parseFloat(venueRent).toFixed(2)}\n`;
    }
    if (otherCosts && parseFloat(otherCosts) > 0) {
      text += `Other Costs: ₹${parseFloat(otherCosts).toFixed(2)}\n`;
    }
    text += `Total Cost: ₹${getTotalCost().toFixed(2)}\n\n`;
    
    // Division method
    text += `📋 Division Method: ${divisionMethod === 'teams' ? 'By Teams' : 'By Players'}\n\n`;
    
    if (playerShares.length > 0) {
      const teamAName = match?.teamA || match?.team1;
      const teamBName = match?.teamB || match?.team2;
      
      // Team A breakdown
      const teamAPlayers = playerShares.filter(p => p.teamName === teamAName);
      if (teamAPlayers.length > 0) {
        text += `👥 ${teamAName}\n`;
        text += `Team Total: ₹${getTeamTotal(teamAName).toFixed(2)}\n\n`;
        teamAPlayers.forEach(player => {
          text += `  ${player.playerName}: ₹${player.amount.toFixed(2)}${player.isEdited ? ' *' : ''}\n`;
        });
        text += `\n`;
      }
      
      // Team B breakdown
      const teamBPlayers = playerShares.filter(p => p.teamName === teamBName);
      if (teamBPlayers.length > 0) {
        text += `👥 ${teamBName}\n`;
        text += `Team Total: ₹${getTeamTotal(teamBName).toFixed(2)}\n\n`;
        teamBPlayers.forEach(player => {
          text += `  ${player.playerName}: ₹${player.amount.toFixed(2)}${player.isEdited ? ' *' : ''}\n`;
        });
        text += `\n`;
      }
      
      // Grand total
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `GRAND TOTAL: ₹${getGrandTotal().toFixed(2)}\n\n`;
      
      // Note about custom amounts
      const hasCustomAmounts = playerShares.some(p => p.isEdited);
      if (hasCustomAmounts) {
        text += `* Custom amount\n\n`;
      }
    }
    
    text += `Generated by VScor`;
    
    return text;
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl text-gray-900 dark:text-white">Calculate Payment</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{match?.team1 || match?.teamA} vs {match?.team2 || match?.teamB}</p>
        </div>
        {/* Share Button in Header */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          disabled={getTotalCost() === 0 || playerShares.length === 0}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Share Payment Breakdown"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-24">{/* Added bottom padding for tabs */}
          {/* Cost Inputs Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-purple-600 dark:text-purple-400">Enter Costs</h2>
            
            <div className="space-y-2">
              <Label htmlFor="venueRent" className="text-gray-700">Venue Rent</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="venueRent"
                  type="number"
                  placeholder="Enter venue rent"
                  value={venueRent}
                  onChange={(e) => setVenueRent(e.target.value)}
                  className="pl-12 py-4 border border-gray-300 rounded-lg"
                  step="0.01"
                  disabled={isInputDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherCosts" className="text-gray-700">Other Costs</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="otherCosts"
                  type="number"
                  placeholder="Enter other costs"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(e.target.value)}
                  className="pl-12 py-4 border border-gray-300 rounded-lg"
                  step="0.01"
                  disabled={isInputDisabled}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Cost</span>
                <span className="text-2xl font-medium text-purple-600">₹{getTotalCost().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Division Method Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-purple-600 dark:text-purple-400">Division Method</h2>
            
            <RadioGroup 
              value={divisionMethod} 
              onValueChange={(value) => setDivisionMethod(value as 'teams' | 'players')}
              className="flex items-center justify-center gap-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              disabled={isInputDisabled}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="teams" id="teams" className="text-purple-600" disabled={isInputDisabled} />
                <Label htmlFor="teams" className={`text-base font-medium cursor-pointer flex items-center gap-2 ${isInputDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  <Users className="w-5 h-5" />
                  Teams
                </Label>
              </div>
              
              <div className="flex items-center gap-3">
                <RadioGroupItem value="players" id="players" className="text-purple-600" disabled={isInputDisabled} />
                <Label htmlFor="players" className={`text-base font-medium cursor-pointer flex items-center gap-2 ${isInputDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  <User className="w-5 h-5" />
                  Players
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Treasurer Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Treasurer
            </h2>
            
            {isChangingTreasurer ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Select a player from the match to be the treasurer:</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {playerShares.map((player) => (
                    <button
                      key={player.playerId}
                      onClick={() => {
                        setTreasurer({ id: player.playerId, name: player.playerName });
                        setIsChangingTreasurer(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        treasurer?.id === player.playerId
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-600 dark:border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <p className="font-medium text-gray-800 dark:text-gray-100">{player.playerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{player.teamName}</p>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setIsChangingTreasurer(false)}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Responsible for collecting payments</p>
                  {treasurer ? (
                    <p className="font-medium text-gray-800 mt-1">{treasurer.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Not assigned</p>
                  )}
                </div>
                <Button
                  onClick={() => setIsChangingTreasurer(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={playerShares.length === 0}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Payment Breakdown Section */}
          {playerShares.length > 0 && getTotalCost() > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-purple-600 dark:text-purple-400">Payment Breakdown</h2>
              
              {/* Team A Players */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-purple-100">
                  <h3 className="font-medium text-gray-700">{match?.team1 || match?.teamA}</h3>
                  <span className="font-medium text-purple-600">₹{getTeamTotal(match?.team1 || match?.teamA).toFixed(2)}</span>
                </div>
                
                {playerShares
                  .filter(p => p.teamName === (match?.team1 || match?.teamA))
                  .map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* Player info and amount */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{player.playerName}</p>
                          {player.isEdited && (
                            <p className="text-xs text-purple-600">Custom</p>
                          )}
                        </div>
                        
                        {editingPlayerId === player.playerId ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-24">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="pl-7 pr-2 py-1 text-sm h-8"
                                step="0.01"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={() => handleSaveShare(player.playerId)}
                              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 whitespace-nowrap">₹{player.amount.toFixed(2)}</span>
                            <button
                              onClick={() => handleEditShare(player.playerId, player.amount)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                              title="Edit amount"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePaid(player.playerId)}
                          className={`p-2 rounded-lg transition-colors ${
                            player.isPaid 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                          }`}
                          title={player.isPaid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleSendReminder(player)}
                          disabled={player.isPaid}
                          className={`p-2 rounded-lg transition-colors ${
                            player.isPaid
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          title={player.isPaid ? "Player has paid" : "Copy payment reminder"}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Team B Players */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-purple-100">
                  <h3 className="font-medium text-gray-700">{match?.team2 || match?.teamB}</h3>
                  <span className="font-medium text-purple-600">₹{getTeamTotal(match?.team2 || match?.teamB).toFixed(2)}</span>
                </div>
                
                {playerShares
                  .filter(p => p.teamName === (match?.team2 || match?.teamB))
                  .map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* Player info and amount */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{player.playerName}</p>
                          {player.isEdited && (
                            <p className="text-xs text-purple-600">Custom</p>
                          )}
                        </div>
                        
                        {editingPlayerId === player.playerId ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-24">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="pl-7 pr-2 py-1 text-sm h-8"
                                step="0.01"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={() => handleSaveShare(player.playerId)}
                              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 whitespace-nowrap">₹{player.amount.toFixed(2)}</span>
                            <button
                              onClick={() => handleEditShare(player.playerId, player.amount)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                              title="Edit amount"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePaid(player.playerId)}
                          className={`p-2 rounded-lg transition-colors ${
                            player.isPaid 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                          }`}
                          title={player.isPaid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleSendReminder(player)}
                          disabled={player.isPaid}
                          className={`p-2 rounded-lg transition-colors ${
                            player.isPaid
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          title={player.isPaid ? "Player has paid" : "Copy payment reminder"}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Grand Total</span>
                  <span className="text-2xl font-medium text-purple-600">₹{getGrandTotal().toFixed(2)}</span>
                </div>
                {Math.abs(getGrandTotal() - getTotalCost()) > 0.01 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Warning: Total shares (₹{getGrandTotal().toFixed(2)}) don't match total cost (₹{getTotalCost().toFixed(2)})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(playerShares.length === 0 || getTotalCost() === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment Breakdown</h3>
              <p className="text-gray-500">
                {getTotalCost() === 0 
                  ? 'Enter costs above to calculate payment breakdown'
                  : 'No players found in this match'
                }
              </p>
            </div>
          )}

          {/* Save Button */}
          {playerShares.length > 0 && getTotalCost() > 0 && onSavePayment && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
              {isSaved && !isEditMode ? (
                // Show Recalculate button when saved and not in edit mode
                <>
                  <Button
                    onClick={handleRecalculate}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-medium rounded-xl flex items-center justify-center gap-3"
                  >
                    <RefreshCw className="w-6 h-6" />
                    Recalculate
                  </Button>
                  <p className="text-sm text-green-600 text-center mt-3">
                    ✓ Payment breakdown saved successfully
                  </p>
                </>
              ) : (
                // Show Save button when not saved or in edit mode
                <>
                  <Button
                    onClick={handleSavePayment}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-medium rounded-xl flex items-center justify-center gap-3"
                  >
                    <Save className="w-6 h-6" />
                    {isEditMode ? 'Save' : 'Save Payment Breakdown'}
                  </Button>
                  {isEditMode && (
                    <p className="text-sm text-blue-600 text-center mt-3">
                      ℹ️ You can now edit the values. Click Save to update.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <TextShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${match?.teamA} vs ${match?.teamB} - Payment Breakdown`}
        content={generatePaymentBreakdownText()}
      />
    </div>
  );
};

export default CalculatePayment;