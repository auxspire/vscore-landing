// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Calendar, Users, Target, MapPin, Clock, Star, Plus, Shuffle, Edit, Check, X, Trash2, Upload, Camera, AlertCircle, AlertTriangle, Phone, Mail, UserCheck, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import ImageAvatar from './ImageAvatar';
import { TournamentFixturesTab } from './TournamentFixturesTab';
import { 
  addTeamToMasterTable, 
  findTeamByName, 
  linkTeamToTournament, 
  unlinkTeamFromTournament,
  getTeamsForTournament,
  getAllMasterTeams,
  getUnlinkedTeamsForTournament,
  getMasterTeamById,
  validateJunctionTableIntegrity,
  cleanupAllDuplicateTeamLinks,
  syncAllTournamentsWithJunctionTable
} from '../utils/teamManagement';
import { 
  getTournamentState, 
  previewTeamWithdrawal, 
  previewMidTournamentTeamAddition,
  previewStructuralChange,
  withdrawTeam,
  isStructuralChange,
  getTournamentStateBadge,
  getCompletedMatches
} from '../utils/tournamentFlexibility';
import { 
  validateMaxNumberOfTeams,
  validateTournamentDetails,
  validateTournamentFormat,
  validateGroupConfiguration,
  showValidationError
} from '../utils/tournamentValidation';
import {
  getTournamentFollowerCount,
  isFollowingTournament,
  followTournament,
  unfollowTournament
} from '../utils/tournamentFollows';

/**
 * TournamentProfileScreen displays comprehensive tournament information
 * Four tabs: Overview, Table, Fixtures, Stats
 * Includes league standings, upcoming matches, top scorers, and tournament information
 */
const TournamentProfileScreen = ({ tournament, onBack, onTeamClick = () => {}, onPlayerClick = () => {}, onMatchClick = () => {}, onAddTeam = () => {}, onGenerateFixtures = () => {}, currentUser = null, playerDatabase = [], onTournamentUpdate = null }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditFormatDialog, setShowEditFormatDialog] = useState(false);
  const [showEditPrizeDialog, setShowEditPrizeDialog] = useState(false);
  const [showFixturesManageDialog, setShowFixturesManageDialog] = useState(false);
  const [showManageTeamsDialog, setShowManageTeamsDialog] = useState(false);
  const [showEditDetailsDialog, setShowEditDetailsDialog] = useState(false);
  const [showStructuralChangeWarning, setShowStructuralChangeWarning] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [showTeamCountWarning, setShowTeamCountWarning] = useState(false);
  const [showPublishConfirmDialog, setShowPublishConfirmDialog] = useState(false);
  const [showTeamWithdrawalDialog, setShowTeamWithdrawalDialog] = useState(false);
  const [showMidTournamentAddDialog, setShowMidTournamentAddDialog] = useState(false);
  const [showImpactPreviewDialog, setShowImpactPreviewDialog] = useState(false);
  const [showMaxTeamsReductionWarning, setShowMaxTeamsReductionWarning] = useState(false);
  const [maxTeamsReductionContext, setMaxTeamsReductionContext] = useState(null); // Track which dialog triggered the warning
  const [teamToWithdraw, setTeamToWithdraw] = useState(null);
  const [impactPreview, setImpactPreview] = useState(null);
  const [tournamentStateInfo, setTournamentStateInfo] = useState(null);

  // Debug: Log when max teams reduction warning state changes
  useEffect(() => {
    console.log('🚨 showMaxTeamsReductionWarning changed to:', showMaxTeamsReductionWarning);
  }, [showMaxTeamsReductionWarning]);

  // Load follow data
  useEffect(() => {
    if (tournament?.id) {
      const count = getTournamentFollowerCount(tournament.id);
      setFollowerCount(count);
      
      if (currentUser?.user_id) {
        const following = isFollowingTournament(tournament.id, currentUser.user_id);
        setIsFollowing(following);
      }
    }
  }, [tournament?.id, currentUser?.user_id]);
  
  const [enableSeeding, setEnableSeeding] = useState(false);
  const [teamSeeds, setTeamSeeds] = useState([]);
  const [proceedWithMismatch, setProceedWithMismatch] = useState(false);
  const [generatedFixtures, setGeneratedFixtures] = useState([]);
  const [fixturesStatus, setFixturesStatus] = useState('none'); // none, generated, published
  const [fixturesMetadata, setFixturesMetadata] = useState({ isDraft: false });
  const [editFormatValue, setEditFormatValue] = useState('');
  const [editPrizeValue, setEditPrizeValue] = useState('');
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [pendingFormatChanges, setPendingFormatChanges] = useState(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  
  // Duplicate team dialog state
  const [showDuplicateTeamDialog, setShowDuplicateTeamDialog] = useState(false);
  const [duplicateTeamData, setDuplicateTeamData] = useState(null);
  
  // Team entry request state
  const [showTeamEntryRequestDialog, setShowTeamEntryRequestDialog] = useState(false);
  const [userOwnedTeams, setUserOwnedTeams] = useState([]);
  const [selectedTeamForRequest, setSelectedTeamForRequest] = useState(null);
  const [teamEntryRequestStatuses, setTeamEntryRequestStatuses] = useState({});
  
  // Follow state
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    coach: '',
    homeVenue: '',
    imageUrl: '',
    imagePreview: ''
  });
  
  // Edit form state for tournament details
  const [editForm, setEditForm] = useState({
    name: '',
    place: '',
    venue: '',
    startDate: '',
    endDate: '',
    coordinatorName: '',
    coordinatorContact: '',
    registrationFee: '',
    imageUrl: '',
    imagePreview: '',
    tags: [],
    description: ''
  });

  // Coordinators state (up to 2, each with name, phone, email)
  const [editCoordinators, setEditCoordinators] = useState<Array<{ name: string; phone: string; email: string; user_id?: number }>>([
    { name: '', phone: '', email: '' }
  ]);
  
  // Coordinator search state for autocomplete
  const [coordinatorSearchQuery, setCoordinatorSearchQuery] = useState<string[]>(['']);
  const [showCoordinatorSuggestions, setShowCoordinatorSuggestions] = useState<boolean[]>([false]);

  // Edit form state for tournament format with ALL new fields
  const [editFormatForm, setEditFormatForm] = useState({
    tournamentFormat: '',
    playersPerTeam: '',
    matchDuration: '',
    maxNumberOfTeams: '',
    roundRobinRounds: '1',
    numberOfGroups: '',
    teamsPerGroup: '',
    teamsProgressingPerGroup: ''
  });

  // Calculated values for format configuration
  const [knockoutStages, setKnockoutStages] = useState([]);
  const [byesRequired, setByesRequired] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalDirectQualifiers, setTotalDirectQualifiers] = useState(0);
  const [knockoutBracketSize, setKnockoutBracketSize] = useState(0);
  const [bestNextPlacedTeams, setBestNextPlacedTeams] = useState(0);
  const [knockoutStartingRound, setKnockoutStartingRound] = useState('');
  const [groupConfigWarning, setGroupConfigWarning] = useState('');
  
  // Edit form state for prize
  const [editPrizeForm, setEditPrizeForm] = useState({
    cashPrize: false,
    cashAmount: '',
    trophy: false,
    trophyImage: '',
    trophyImagePreview: '',
    certificates: false,
    other: false,
    otherText: ''
  });
  
  // Load tournament data from localStorage
  const [tournamentData, setTournamentData] = useState(() => {
    if (tournament?.id) {
      const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
      const foundTournament = tournaments.find(t => t.id === tournament.id);
      return foundTournament || tournament;
    }
    return tournament || {
      id: 1,
      name: 'Premier League',
      imageUrl: '',
      startDate: '2023-08-01',
      endDate: '2024-05-31',
      place: 'England',
      venue: 'Various Stadiums',
      tournamentFormat: 'league_round_robin',
      firstPrize: '£44M',
      participatingTeams: []
    };
  });

  // Permission check: Can the current user edit this tournament?
  const canEditTournament = () => {
    if (!currentUser) return false;
    
    const userId = currentUser.user_id;
    
    // Check if user is the owner
    if (tournamentData.owner_user_id === userId || tournamentData.created_by === String(userId)) {
      return true;
    }
    
    // Check if user is in coordinator_user_ids array
    if (tournamentData.coordinator_user_ids && tournamentData.coordinator_user_ids.includes(userId)) {
      return true;
    }
    
    // Legacy check: see if user is in coordinators array by user_id
    if (tournamentData.coordinators) {
      const isCoordinator = tournamentData.coordinators.some(coord => coord.user_id === userId);
      if (isCoordinator) return true;
    }
    
    return false;
  };

  // Team entry request management functions
  const getTeamEntryRequests = () => {
    const requests = JSON.parse(localStorage.getItem('vscor_tournament_team_entry_requests') || '[]');
    return requests;
  };

  const saveTeamEntryRequests = (requests) => {
    localStorage.setItem('vscor_tournament_team_entry_requests', JSON.stringify(requests));
  };

  const getTeamEntryRequest = (teamId) => {
    if (!tournamentData || !teamId) return null;
    const requests = getTeamEntryRequests();
    return requests.find(
      req => req.tournament_id === tournamentData.id && req.team_id === teamId
    );
  };

  const loadUserOwnedTeams = () => {
    if (!currentUser) {
      setUserOwnedTeams([]);
      return;
    }

    const allTeams = getAllMasterTeams();
    const userId = currentUser.user_id;

    console.log('🔍 Loading user owned teams:', {
      userId,
      userIdType: typeof userId,
      allTeamsCount: allTeams.length,
      allTeams: allTeams.map(t => ({
        id: t.id,
        name: t.name,
        owner_user_id: t.owner_user_id,
        coordinator_user_ids: t.coordinator_user_ids
      }))
    });

    // Find teams where user is owner or coordinator
    const ownedTeams = allTeams.filter(team => {
      const isOwner = team.owner_user_id && Number(team.owner_user_id) === Number(userId);
      const isCoordinator = team.coordinator_user_ids && team.coordinator_user_ids.some(id => Number(id) === Number(userId));
      
      // Legacy fallback: Check if user created the team (for teams created before ownership system)
      const isLegacyCreator = team.created_by && String(team.created_by) === String(userId);
      
      // Also check if user is in the coordinators array (coordinators field with user_id)
      const isInCoordinatorsArray = team.coordinators && team.coordinators.some(c => 
        c.user_id && Number(c.user_id) === Number(userId)
      );
      
      console.log(`  Team "${team.name}":`, {
        isOwner,
        isCoordinator,
        isLegacyCreator,
        isInCoordinatorsArray,
        owner_user_id: team.owner_user_id,
        coordinator_user_ids: team.coordinator_user_ids,
        created_by: team.created_by,
        coordinators: team.coordinators
      });
      
      return isOwner || isCoordinator || isLegacyCreator || isInCoordinatorsArray;
    });

    console.log('✅ User owned teams:', {
      count: ownedTeams.length,
      teams: ownedTeams.map(t => t.name)
    });

    setUserOwnedTeams(ownedTeams);

    // Load request statuses for user's teams
    const statuses = {};
    ownedTeams.forEach(team => {
      const request = getTeamEntryRequest(team.id);
      if (request) {
        statuses[team.id] = request.status;
      }
    });
    setTeamEntryRequestStatuses(statuses);
  };

  const handleFollow = () => {
    if (!currentUser?.user_id) {
      alert('Please log in to follow this tournament.');
      return;
    }

    if (isFollowing) {
      unfollowTournament(tournamentData.id, currentUser.user_id);
      setIsFollowing(false);
      setFollowerCount(followerCount - 1);
    } else {
      followTournament(tournamentData.id, currentUser.user_id);
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  };

  const handleRequestTeamEntry = () => {
    if (!currentUser || !tournamentData || !selectedTeamForRequest) {
      alert('Please select a team');
      return;
    }

    const team = getAllMasterTeams().find(t => t.id === selectedTeamForRequest);
    if (!team) {
      alert('Team not found');
      return;
    }

    // Check if team is already in tournament
    const tournamentTeams = getTeamsForTournament(tournamentData.id);
    if (tournamentTeams.some(t => t.id === team.id)) {
      alert('This team is already participating in the tournament');
      return;
    }

    // Check if request already exists
    const existingRequest = getTeamEntryRequest(team.id);
    if (existingRequest) {
      alert(`Request already ${existingRequest.status}`);
      return;
    }

    const requests = getTeamEntryRequests();
    
    const newRequest = {
      id: Date.now(),
      tournament_id: tournamentData.id,
      tournament_name: tournamentData.name,
      team_id: team.id,
      team_name: team.name,
      team_coach: team.coach || '',
      team_image_url: team.imageUrl || '',
      requested_by_user_id: currentUser.user_id,
      requested_by_user_name: currentUser.name || currentUser.email,
      status: 'pending',
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedRequests = [...requests, newRequest];
    saveTeamEntryRequests(updatedRequests);
    
    // Update local state
    setTeamEntryRequestStatuses(prev => ({
      ...prev,
      [team.id]: 'pending'
    }));

    setShowTeamEntryRequestDialog(false);
    setSelectedTeamForRequest(null);
    
    alert(`Entry request submitted for ${team.name}`);
  };

  const handleAcceptTeamEntry = (requestId) => {
    const requests = getTeamEntryRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;

    // Check max teams limit before accepting
    if (isMaxTeamsReached()) {
      alert(`Cannot accept team entry. Maximum team limit reached (${tournamentData.maxNumberOfTeams}).`);
      return;
    }

    // Add team to tournament
    const success = linkTeamToTournament(request.tournament_id, request.team_id);
    
    if (success) {
      // Update request status
      const updatedRequests = requests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'accepted',
            updated_at: new Date().toISOString()
          };
        }
        return req;
      });
      saveTeamEntryRequests(updatedRequests);
      
      // Reload tournament data
      reloadTournamentData();
      
      alert(`Team ${request.team_name} has been added to the tournament!`);
    } else {
      alert('Failed to add team to tournament');
    }
  };

  const handleRejectTeamEntry = (requestId) => {
    const requests = getTeamEntryRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;
    
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'rejected',
          updated_at: new Date().toISOString()
        };
      }
      return req;
    });
    saveTeamEntryRequests(updatedRequests);
    
    alert(`Team entry request from ${request.team_name} has been rejected.`);
  };

  const getPendingTeamEntryRequests = () => {
    if (!tournamentData) return [];
    const requests = getTeamEntryRequests();
    return requests.filter(
      req => req.tournament_id === tournamentData.id && req.status === 'pending'
    );
  };

  // Get registered users from playerDatabase (players with owner_user_id)
  const getRegisteredUsers = () => {
    if (!playerDatabase || playerDatabase.length === 0) return [];
    
    // Get unique users by owner_user_id
    const usersMap = new Map();
    playerDatabase.forEach(player => {
      if (player.owner_user_id && !usersMap.has(player.owner_user_id)) {
        usersMap.set(player.owner_user_id, {
          user_id: player.owner_user_id,
          name: player.name,
          phone: player.phoneNumber || player.phone || '',
          email: player.email || '',
          imageUrl: player.imageUrl || ''
        });
      }
    });
    
    return Array.from(usersMap.values());
  };

  // Filter users based on search query
  const getFilteredUsers = (searchQuery, excludeUserIds = []) => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    
    const registeredUsers = getRegisteredUsers();
    const query = searchQuery.toLowerCase();
    
    return registeredUsers.filter(user => 
      !excludeUserIds.includes(user.user_id) &&
      (user.name.toLowerCase().includes(query) ||
       user.phone.includes(query) ||
       user.email.toLowerCase().includes(query))
    );
  };

  // Handle coordinator user selection
  const handleSelectCoordinatorUser = (index, user) => {
    const newCoords = [...editCoordinators];
    newCoords[index] = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      user_id: user.user_id
    };
    setEditCoordinators(newCoords);
    
    // Clear search query and hide suggestions
    const newQueries = [...coordinatorSearchQuery];
    newQueries[index] = '';
    setCoordinatorSearchQuery(newQueries);
    
    const newShowSuggestions = [...showCoordinatorSuggestions];
    newShowSuggestions[index] = false;
    setShowCoordinatorSuggestions(newShowSuggestions);
  };

  // === DATA INTEGRITY CHECK ===
  // Check for data inconsistencies on mount and auto-fix duplicates
  // Use ref to track if check has been performed to prevent infinite loops
  const integrityCheckDone = React.useRef(false);
  
  useEffect(() => {
    if (!tournamentData?.id || integrityCheckDone.current) return;
    
    // Mark as done immediately to prevent re-runs
    integrityCheckDone.current = true;
    
    let hasIssues = false;
    
    // 1. First, clean up any duplicates in the junction table
    const integrityCheck = validateJunctionTableIntegrity();
    
    if (!integrityCheck.isValid) {
      hasIssues = true;
      console.log('🔧 Data integrity issues found - fixing...');
      integrityCheck.issues.forEach(issue => console.log(`  - ${issue}`));
      
      // Auto-cleanup duplicates
      if (integrityCheck.duplicateLinks > 0) {
        const cleanupResult = cleanupAllDuplicateTeamLinks();
        console.log('✅ Removed', cleanupResult.totalRemoved, 'duplicate link(s)');
      }
    }
    
    // 2. After cleanup, sync the participatingTeams array with junction table
    const junctionTeams = getTeamsForTournament(tournamentData.id);
    const legacyTeams = tournamentData.participatingTeams || [];
    
    // Check if arrays have different content (not just length)
    const junctionTeamIds = new Set(junctionTeams.map(t => t.id));
    const legacyTeamIds = new Set(legacyTeams.map(t => t.id));
    const hasContentMismatch = 
      junctionTeamIds.size !== legacyTeamIds.size ||
      [...junctionTeamIds].some(id => !legacyTeamIds.has(id)) ||
      [...legacyTeamIds].some(id => !junctionTeamIds.has(id));
    
    if (hasContentMismatch) {
      hasIssues = true;
      console.log('🔧 Syncing participatingTeams array with junction table...');
      console.log(`   Before: ${legacyTeams.length} teams | After: ${junctionTeams.length} teams`);
      
      const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
      const updatedTournaments = tournaments.map(t => {
        if (t.id === tournamentData.id) {
          // Remove any duplicates from the synced teams
          const seenIds = new Set();
          const uniqueTeams = junctionTeams.filter(team => {
            if (seenIds.has(team.id)) {
              return false;
            }
            seenIds.add(team.id);
            return true;
          });
          
          const syncedTeams = uniqueTeams.map(team => ({ id: team.id, name: team.name }));
          
          return {
            ...t,
            participatingTeams: syncedTeams
          };
        }
        return t;
      });
      
      localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
      
      // Update local state WITHOUT triggering another effect
      const syncedTournament = updatedTournaments.find(t => t.id === tournamentData.id);
      if (syncedTournament) {
        setTournamentData(syncedTournament);
        console.log('✅ Data synced! Teams:', syncedTournament.participatingTeams.length);
      }
    }
    
    if (!hasIssues) {
      console.log('✅ Tournament data integrity: OK');
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentData?.id]);

  // === RELOAD TOURNAMENT DATA WHEN PROP CHANGES ===
  // This ensures fresh data is loaded when returning from other screens
  useEffect(() => {
    if (tournament?.id) {
      const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
      const foundTournament = tournaments.find(t => t.id === tournament.id);
      if (foundTournament) {
        console.log('🔄 Reloading tournament data from localStorage', foundTournament);
        setTournamentData(foundTournament);
      }
    }
  }, [tournament?.id, tournament]);

  // Load user's teams when tournament loads
  useEffect(() => {
    if (tournamentData?.id && currentUser) {
      loadUserOwnedTeams();
    }
  }, [tournamentData?.id, currentUser?.user_id]);

  // === CALCULATION EFFECTS (from AddTournament) ===
  
  // Calculate knockout stages and byes
  useEffect(() => {
    if (editFormatForm.tournamentFormat === 'knockout' && editFormatForm.maxNumberOfTeams) {
      const numTeams = parseInt(editFormatForm.maxNumberOfTeams);
      if (numTeams > 0) {
        // Find next power of 2
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
        const byes = nextPowerOf2 - numTeams;
        
        // Calculate stages
        const stages = [];
        let teamsInRound = nextPowerOf2;
        
        // Add preliminary round if there are byes
        if (byes > 0) {
          stages.push(`Preliminary Round (${numTeams - byes} teams)`);
          teamsInRound = nextPowerOf2 / 2;
        }
        
        // Add remaining rounds
        while (teamsInRound >= 2) {
          if (teamsInRound === 2) {
            stages.push('Final');
          } else if (teamsInRound === 4) {
            stages.push('Semifinals');
          } else if (teamsInRound === 8) {
            stages.push('Quarterfinals');
          } else if (teamsInRound === 16) {
            stages.push('Round of 16');
          } else if (teamsInRound === 32) {
            stages.push('Round of 32');
          } else {
            stages.push(`Round of ${teamsInRound}`);
          }
          teamsInRound = teamsInRound / 2;
        }
        
        setKnockoutStages(stages);
        setByesRequired(byes);
        
        // Calculate total matches (n-1 for knockout)
        setTotalMatches(numTeams - 1);
      }
    }
  }, [editFormatForm.tournamentFormat, editFormatForm.maxNumberOfTeams]);

  // Calculate total matches for league format
  useEffect(() => {
    if (editFormatForm.tournamentFormat === 'league_round_robin' && editFormatForm.maxNumberOfTeams && editFormatForm.roundRobinRounds) {
      const numTeams = parseInt(editFormatForm.maxNumberOfTeams);
      const rounds = parseInt(editFormatForm.roundRobinRounds);
      if (numTeams > 1) {
        // Total matches = (n * (n-1) / 2) * rounds
        const matches = (numTeams * (numTeams - 1) / 2) * rounds;
        setTotalMatches(matches);
      }
    }
  }, [editFormatForm.tournamentFormat, editFormatForm.maxNumberOfTeams, editFormatForm.roundRobinRounds]);

  // Auto-calculate groups configuration
  useEffect(() => {
    if (editFormatForm.tournamentFormat === 'group_stage___knockout' && editFormatForm.maxNumberOfTeams) {
      const maxTeams = parseInt(editFormatForm.maxNumberOfTeams);
      
      if (editFormatForm.numberOfGroups && editFormatForm.teamsPerGroup) {
        const groups = parseInt(editFormatForm.numberOfGroups);
        const teamsPerGrp = parseInt(editFormatForm.teamsPerGroup);
        const total = groups * teamsPerGrp;
        
        if (total !== maxTeams) {
          setGroupConfigWarning(`⚠️ Total capacity (${total}) does not match Max Teams (${maxTeams})`);
        } else {
          setGroupConfigWarning('');
        }
      }
    }
  }, [editFormatForm.tournamentFormat, editFormatForm.maxNumberOfTeams, editFormatForm.numberOfGroups, editFormatForm.teamsPerGroup]);

  // Calculate knockout qualification for Group + Knockout format
  useEffect(() => {
    if (editFormatForm.tournamentFormat === 'group_stage___knockout' && editFormatForm.numberOfGroups && editFormatForm.teamsProgressingPerGroup) {
      const groups = parseInt(editFormatForm.numberOfGroups);
      const progressingPerGroup = parseInt(editFormatForm.teamsProgressingPerGroup);
      
      if (groups > 0 && progressingPerGroup > 0) {
        // Step 1: Calculate total direct qualifiers
        const directQualifiers = groups * progressingPerGroup;
        setTotalDirectQualifiers(directQualifiers);
        
        // Step 2: Find next power of 2 for knockout bracket size
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(directQualifiers)));
        setKnockoutBracketSize(bracketSize);
        
        // Step 3: Calculate best next-placed teams needed
        const additionalTeams = bracketSize - directQualifiers;
        setBestNextPlacedTeams(additionalTeams);
        
        // Step 4: Determine knockout starting round
        let roundName = '';
        if (bracketSize === 2) roundName = 'Final';
        else if (bracketSize === 4) roundName = 'Semifinals';
        else if (bracketSize === 8) roundName = 'Quarterfinals';
        else if (bracketSize === 16) roundName = 'Round of 16';
        else if (bracketSize === 32) roundName = 'Round of 32';
        else if (bracketSize === 64) roundName = 'Round of 64';
        else roundName = `Round of ${bracketSize}`;
        setKnockoutStartingRound(roundName);
      }
    }
  }, [editFormatForm.tournamentFormat, editFormatForm.numberOfGroups, editFormatForm.teamsProgressingPerGroup]);

  // Reload tournament data from localStorage when dialog closes
  const reloadTournamentData = () => {
    if (tournamentData?.id) {
      const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
      const foundTournament = tournaments.find(t => t.id === tournamentData.id);
      if (foundTournament) {
        setTournamentData(foundTournament);
      }
    }
  };

  // Get all available teams from Master Teams Table
  const getAllTeams = () => {
    return getAllMasterTeams();
  };

  // Get teams that are not already in the tournament
  const getAvailableTeams = () => {
    const unlinkedTeams = getUnlinkedTeamsForTournament(tournamentData.id);
    
    // Filter out teams that have been deleted from the teams list (vscor_teams)
    const activeTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
    const activeTeamIds = new Set(activeTeams.map(t => t.id));
    
    const filteredTeams = unlinkedTeams.filter(team => activeTeamIds.has(team.id));
    
    console.log('🔍 Debug - Available Teams:', {
      tournamentId: tournamentData.id,
      tournamentName: tournamentData.tournamentName,
      allMasterTeams: getAllMasterTeams().length,
      participatingTeams: (tournamentData.participatingTeams || []).length,
      unlinkedTeams: unlinkedTeams.length,
      activeTeamsInList: activeTeams.length,
      filteredTeams: filteredTeams.length,
      filteredTeamNames: filteredTeams.map(t => t.name)
    });
    
    return filteredTeams;
  };

  // Filter teams based on search query
  const getFilteredAvailableTeams = () => {
    const availableTeams = getAvailableTeams();
    if (!searchTeamQuery.trim()) return availableTeams;
    return availableTeams.filter(team =>
      team.name.toLowerCase().includes(searchTeamQuery.toLowerCase())
    );
  };

  // Check if max teams limit is reached
  const isMaxTeamsReached = () => {
    if (!tournamentData.maxNumberOfTeams) return false;
    // Use junction table as source of truth
    const currentTeamsCount = getTeamsForTournament(tournamentData.id).length;
    return currentTeamsCount >= tournamentData.maxNumberOfTeams;
  };

  // Get unique participating teams (from Master Teams junction table)
  const getUniqueParticipatingTeams = () => {
    // Use junction table as source of truth instead of participatingTeams array
    const teams = getTeamsForTournament(tournamentData.id);
    console.log('🔍 Debug - Participating Teams:', {
      tournamentId: tournamentData.id,
      teamsFromJunction: teams.length,
      teamNames: teams.map(t => t.name),
      teamsFromArray: (tournamentData.participatingTeams || []).length
    });
    return teams;
  };

  // Add team to tournament (with mid-tournament support)
  const handleAddTeamToTournament = (team) => {
    // CRITICAL: Check if team is already linked in junction table (single source of truth)
    const teamsInJunction = getTeamsForTournament(tournamentData.id);
    if (teamsInJunction.some(t => t.id === team.id)) {
      alert('This team is already added to the tournament.');
      return;
    }

    // Check max teams limit - do this after duplicate check for better UX
    if (isMaxTeamsReached()) {
      alert(`Maximum team limit reached (${tournamentData.maxNumberOfTeams}). Cannot add more teams.`);
      return;
    }
    
    // Double-check: Ensure we won't exceed max teams after adding
    if (tournamentData.maxNumberOfTeams && teamsInJunction.length + 1 > tournamentData.maxNumberOfTeams) {
      alert(`Cannot add team. This would exceed the maximum team limit of ${tournamentData.maxNumberOfTeams}.`);
      return;
    }

    // Check if tournament is live or published - show impact preview
    if (tournamentStateInfo && (tournamentStateInfo.state === 'live' || tournamentStateInfo.state === 'published')) {
      const preview = previewMidTournamentTeamAddition(
        tournamentData.id,
        tournamentData.tournamentFormat,
        teamsInJunction.length
      );
      
      if (!preview.canProceed) {
        alert(preview.message + '\n\n' + preview.warnings.join('\n'));
        return;
      }
      
      // Show confirmation dialog for mid-tournament addition
      const confirmMessage = `${preview.message}\n\n${preview.warnings.join('\n')}\n\nDo you want to add this team?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Link team to tournament using Master Teams system
    const linkSuccess = linkTeamToTournament(tournamentData.id, team.id);
    
    if (!linkSuccess) {
      alert('Failed to add team to tournament. Team may already be added.');
      return;
    }

    // Update tournament data with team reference
    const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentData.id) {
        const participatingTeams = t.participatingTeams || [];
        // SAFEGUARD: Check if team already exists in array before adding
        const teamExists = participatingTeams.some(pt => pt.id === team.id);
        if (teamExists) {
          // Silent duplicate prevention - team already exists, no action needed
          return t; // Return unchanged tournament
        }
        return {
          ...t,
          participatingTeams: [...participatingTeams, { id: team.id, name: team.name }]
        };
      }
      return t;
    });
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    reloadTournamentData();
    setSearchTeamQuery('');
    
    // If tournament is live/published, suggest fixture regeneration
    if (tournamentStateInfo && (tournamentStateInfo.state === 'live' || tournamentStateInfo.state === 'published')) {
      setTimeout(() => {
        alert(`Team added successfully! \n\nYou may need to regenerate fixtures to include this team in remaining matches.`);
      }, 100);
    }
    
    console.log('✅ Team added to tournament:', { teamId: team.id, tournamentId: tournamentData.id });
  };

  // Remove team from tournament (with withdrawal support)
  const handleRemoveTeamFromTournament = (teamId) => {
    // Get team name for confirmation message
    const team = tournamentData.participatingTeams.find(t => t.id === teamId);
    const teamName = team ? team.name : 'this team';
    
    // Check tournament state
    if (tournamentStateInfo && (tournamentStateInfo.state === 'live' || tournamentStateInfo.state === 'published')) {
      // Preview withdrawal impact
      const preview = previewTeamWithdrawal(tournamentData.id, teamId, generatedFixtures);
      
      if (!preview.canProceed) {
        alert(preview.message + '\n\n' + preview.warnings.join('\n'));
        return;
      }
      
      // Show withdrawal confirmation dialog
      if (team) {
        setTeamToWithdraw(team);
        setImpactPreview(preview);
        setShowTeamWithdrawalDialog(true);
        return;
      }
    }
    
    // Tournament is in draft, ask for confirmation before removing
    const confirmed = window.confirm(
      `Are you sure you want to remove "${teamName}" from this tournament?\n\nThe team will remain in your Master Teams list and can be added to other tournaments.`
    );
    
    if (confirmed) {
      performTeamRemoval(teamId);
    }
  };

  // Perform team removal after confirmation
  const performTeamRemoval = (teamId) => {
    // Withdraw team if tournament is live/published
    if (tournamentStateInfo && (tournamentStateInfo.state === 'live' || tournamentStateInfo.state === 'published')) {
      const result = withdrawTeam(tournamentData.id, teamId, generatedFixtures);
      
      if (result.success && result.voidedFixtures.length > 0) {
        console.log(`✅ Voided ${result.voidedFixtures.length} future fixture(s)`);
      }
      
      // Reload fixtures
      const fixturesData = JSON.parse(localStorage.getItem(`fixtures_${tournamentData.id}`) || 'null');
      if (fixturesData) {
        setGeneratedFixtures(fixturesData.fixtures || []);
      }
    }
    
    // Unlink from tournament (does NOT delete from Master Teams)
    unlinkTeamFromTournament(tournamentData.id, teamId);
    
    // Update tournament data
    const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentData.id) {
        return {
          ...t,
          participatingTeams: (t.participatingTeams || []).filter(team => team.id !== teamId)
        };
      }
      return t;
    });
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    reloadTournamentData();
    
    setShowTeamWithdrawalDialog(false);
    setTeamToWithdraw(null);
    setImpactPreview(null);
    
    console.log('✅ Team removed from tournament (still in Master Teams):', { teamId, tournamentId: tournamentData.id });
  };

  // Open manage teams dialog
  const handleOpenManageTeams = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can manage teams.');
      return;
    }
    
    setIsEditingTeams(false);
    setShowManageTeamsDialog(true);
  };

  // Handle opening add new team form
  const handleOpenAddTeamForm = () => {
    // Check max teams limit
    if (isMaxTeamsReached()) {
      alert(`Maximum team limit reached (${tournamentData.maxNumberOfTeams}). Cannot add more teams.`);
      return;
    }
    setShowAddTeamForm(true);
  };

  // Handle creating new team
  const handleCreateNewTeam = () => {
    if (!newTeamData.name.trim()) {
      alert('Team name is required!');
      return;
    }

    // Check for duplicate team name in Master Teams Table
    const existingTeam = findTeamByName(newTeamData.name);
    
    if (existingTeam) {
      // Store the existing team data and show duplicate dialog
      setDuplicateTeamData(existingTeam);
      setShowDuplicateTeamDialog(true);
      return;
    }

    // Create and add new team to Master Teams Table
    const teamId = addTeamToMasterTable({
      name: newTeamData.name.trim(),
      coach: newTeamData.coach.trim(),
      homeVenue: newTeamData.homeVenue.trim(),
      imageUrl: newTeamData.imageUrl,
      players: []
    });

    const newTeam = {
      id: teamId,
      name: newTeamData.name.trim(),
      coach: newTeamData.coach.trim(),
      homeVenue: newTeamData.homeVenue.trim(),
      imageUrl: newTeamData.imageUrl,
      players: []
    };

    // Also add to legacy teams storage for backward compatibility
    const existingTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
    const updatedTeams = [...existingTeams, newTeam];
    localStorage.setItem('vscor_teams', JSON.stringify(updatedTeams));

    // Add to tournament
    handleAddTeamToTournament(newTeam);

    // Reset form
    setNewTeamData({
      name: '',
      coach: '',
      homeVenue: '',
      imageUrl: '',
      imagePreview: ''
    });
    setShowAddTeamForm(false);
    
    console.log('✅ New team created and added:', newTeam);
  };
  
  // Handle using existing team when duplicate is found
  const handleUseExistingTeam = () => {
    if (duplicateTeamData) {
      handleAddTeamToTournament(duplicateTeamData);
      setShowDuplicateTeamDialog(false);
      setDuplicateTeamData(null);
      setNewTeamData({
        name: '',
        coach: '',
        homeVenue: '',
        imageUrl: '',
        imagePreview: ''
      });
      setShowAddTeamForm(false);
    }
  };
  
  // Handle creating new team anyway (with different name)
  const handleCreateAnyway = () => {
    setShowDuplicateTeamDialog(false);
    setDuplicateTeamData(null);
    // User can modify the name and try again
  };

  // Handle team image upload
  const handleTeamImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setNewTeamData({ ...newTeamData, imageUrl: base64String, imagePreview: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate fixture summary for tournament
  const calculateFixtureSummary = () => {
    // Use junction table as source of truth
    const teams = getTeamsForTournament(tournamentData.id);
    const numTeams = teams.length;
    const maxTeams = tournamentData.maxNumberOfTeams || numTeams;
    const format = tournamentData.tournamentFormat;

    let totalMatches = 0;
    let totalStages = 0;
    let byeTeams = 0;
    let qualificationPath = '';

    if (format === 'league_round_robin') {
      // Round Robin: n*(n-1)/2 matches
      totalMatches = (numTeams * (numTeams - 1)) / 2;
      totalStages = numTeams - 1; // Matchdays
      qualificationPath = 'Each team plays every other team once';
    } else if (format === 'knockout') {
      // Knockout: power of 2 bracket
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
      totalMatches = numTeams - 1; // Total knockout matches
      totalStages = Math.ceil(Math.log2(numTeams)); // Rounds
      byeTeams = bracketSize - numTeams; // Teams with first-round byes
      qualificationPath = byeTeams > 0 
        ? `Single elimination with ${byeTeams} bye(s)` 
        : 'Single elimination';
    } else if (format === 'group_stage___knockout') {
      const groups = tournamentData.numberOfGroups || 0;
      const teamsPerGroup = tournamentData.teamsPerGroup || 0;
      const progressingPerGroup = tournamentData.teamsProgressingPerGroup || 0;
      
      // Group stage matches
      const matchesPerGroup = (teamsPerGroup * (teamsPerGroup - 1)) / 2;
      const groupStageMatches = groups * matchesPerGroup;
      
      // Knockout stage
      const directQualifiers = groups * progressingPerGroup;
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(directQualifiers)));
      const knockoutMatches = bracketSize - 1;
      
      totalMatches = groupStageMatches + knockoutMatches;
      totalStages = (teamsPerGroup - 1) + Math.ceil(Math.log2(bracketSize)); // Group matchdays + knockout rounds
      
      qualificationPath = `${groups} groups → Top ${progressingPerGroup} per group → ${getRoundName(bracketSize)}`;
    }

    return {
      totalMatches,
      totalStages,
      byeTeams,
      qualificationPath,
      isTeamCountMismatch: numTeams !== maxTeams
    };
  };

  // Helper to get round name
  const getRoundName = (size) => {
    if (size === 2) return 'Final';
    if (size === 4) return 'Semifinals';
    if (size === 8) return 'Quarterfinals';
    if (size === 16) return 'Round of 16';
    if (size === 32) return 'Round of 32';
    return `Round of ${size}`;
  };

  // Load fixtures status from localStorage on mount
  useEffect(() => {
    if (tournamentData?.id) {
      const fixturesData = JSON.parse(localStorage.getItem(`fixtures_${tournamentData.id}`) || 'null');
      if (fixturesData) {
        setGeneratedFixtures(fixturesData.fixtures || []);
        setFixturesStatus(fixturesData.status || 'none');
        setFixturesMetadata(fixturesData.metadata || { isDraft: false });
      }
      
      // NOTE: Duplicate cleanup is now handled in the DATA INTEGRITY CHECK effect above
      // This prevents double-cleanup and redundant warnings
    }
  }, [tournamentData?.id]);

  // Calculate tournament state whenever fixtures or matches change
  useEffect(() => {
    if (tournamentData?.id) {
      const state = getTournamentState(
        tournamentData.id,
        fixturesStatus,
        generatedFixtures
      );
      setTournamentStateInfo(state);
    }
  }, [tournamentData?.id, fixturesStatus, generatedFixtures]);

  // Check if any match has started scoring
  const hasMatchesStarted = () => {
    const matches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
    return matches.some(match => 
      match.tournamentId === tournamentData.id && 
      (match.status === 'live' || match.status === 'completed')
    );
  };

  // Check if fixtures exist
  const hasExistingFixtures = () => {
    return fixturesStatus === 'generated' || fixturesStatus === 'published';
  };

  // Get season from dates
  const getSeason = () => {
    if (tournamentData.startDate && tournamentData.endDate) {
      const startYear = new Date(tournamentData.startDate).getFullYear();
      const endYear = new Date(tournamentData.endDate).getFullYear();
      if (startYear === endYear) {
        return `${startYear}`;
      }
      return `${startYear}/${String(endYear).slice(-2)}`;
    }
    return '2023/24';
  };

  // Format display for tournament format
  const formatTypeDisplay = (format) => {
    const formatMap = {
      'league_round_robin': 'League (Round Robin)',
      'knockout': 'Knockout',
      'group_stage___knockout': 'Group Stage + Knockout',
      'swiss_system': 'Swiss System',
      'other_manual': 'Other Format (Manual)'
    };
    return formatMap[format] || format;
  };

  // Handle opening format edit dialog
  const handleEditFormat = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can edit the format.');
      return;
    }
    
    // Check if tournament is completed - lock structural changes
    if (tournamentStateInfo && tournamentStateInfo.state === 'completed') {
      alert('Cannot edit tournament format after all matches are completed.');
      return;
    }
    
    // If tournament is live, show warning but allow
    if (tournamentStateInfo && tournamentStateInfo.state === 'live') {
      if (!window.confirm(`Tournament is currently live with ${tournamentStateInfo.completedMatchesCount} completed match(es). \n\nChanging the format will preserve completed matches but may affect future fixtures. \n\nDo you want to continue?`)) {
        return;
      }
    }
    
    setEditFormatValue(tournamentData.tournamentFormat || '');
    setEditFormatForm({
      tournamentFormat: tournamentData.tournamentFormat || '',
      playersPerTeam: tournamentData.playersPerTeam?.toString() || '',
      matchDuration: tournamentData.matchDuration?.toString() || '',
      maxNumberOfTeams: tournamentData.maxNumberOfTeams?.toString() || '',
      roundRobinRounds: tournamentData.roundRobinRounds?.toString() || '1',
      numberOfGroups: tournamentData.numberOfGroups?.toString() || '',
      teamsPerGroup: tournamentData.teamsPerGroup?.toString() || '',
      teamsProgressingPerGroup: tournamentData.teamsProgressingPerGroup?.toString() || ''
    });
    setShowEditFormatDialog(true);
  };

  // Handle attempting to save format (check for structural changes)
  const handleAttemptSaveFormat = () => {
    // Check if structural changes impact fixtures using new utility
    const hasStructuralChange = isStructuralChange(
      {
        tournamentFormat: tournamentData.tournamentFormat,
        maxNumberOfTeams: tournamentData.maxNumberOfTeams,
        numberOfGroups: tournamentData.numberOfGroups,
        teamsPerGroup: tournamentData.teamsPerGroup,
        teamsProgressingPerGroup: tournamentData.teamsProgressingPerGroup,
        roundRobinRounds: tournamentData.roundRobinRounds
      },
      editFormatForm
    );
    
    if (hasStructuralChange && hasExistingFixtures()) {
      // Preview impact of structural changes
      const preview = previewStructuralChange(
        tournamentData.id,
        'format',
        generatedFixtures
      );
      setImpactPreview(preview);
      setPendingFormatChanges(editFormatForm);
      setShowStructuralChangeWarning(true);
    } else {
      // No structural change or no fixtures, save directly
      handleSaveFormat();
    }
  };

  // Handle confirmed save (after warning acknowledgment)
  const handleConfirmedSaveFormat = () => {
    setShowStructuralChangeWarning(false);
    if (pendingFormatChanges) {
      // Get completed matches to preserve
      const completedMatches = getCompletedMatches(tournamentData.id);
      
      if (completedMatches.length > 0) {
        // Preserve completed matches but clear future fixtures
        const completedFixtureIds = completedMatches.map(m => m.fixtureId).filter(Boolean);
        const preservedFixtures = generatedFixtures.filter(f => 
          completedFixtureIds.includes(f.id)
        );
        
        setGeneratedFixtures(preservedFixtures);
        setFixturesStatus(preservedFixtures.length > 0 ? 'generated' : 'none');
        
        // Update localStorage
        if (preservedFixtures.length > 0) {
          const fixturesData = {
            fixtures: preservedFixtures,
            status: 'generated',
            metadata: { isDraft: true, note: 'Partial fixtures after structural change' }
          };
          localStorage.setItem(`fixtures_${tournamentData.id}`, JSON.stringify(fixturesData));
        } else {
          localStorage.removeItem(`fixtures_${tournamentData.id}`);
        }
        
        alert(`Format updated. ${completedMatches.length} completed match(es) preserved. You can regenerate fixtures for remaining matches.`);
      } else {
        // No completed matches, clear all fixtures
        setGeneratedFixtures([]);
        setFixturesStatus('none');
        localStorage.removeItem(`fixtures_${tournamentData.id}`);
      }
      
      handleSaveFormat();
      setPendingFormatChanges(null);
    }
  };

  // Handle saving format
  const handleSaveFormat = () => {
    console.log('💾 handleSaveFormat called');
    console.log('📊 editFormatForm:', editFormatForm);
    console.log('👥 Current registered teams count:', getTeamsForTournament(tournamentData.id).length);

    // Use centralized validation
    const validationResult = validateTournamentDetails({
      tournamentId: tournamentData.id,
      maxNumberOfTeams: editFormatForm.maxNumberOfTeams,
      currentMaxTeams: tournamentData.maxNumberOfTeams,
      fixturesStatus: fixturesStatus,
      tournamentFormat: editFormatForm.tournamentFormat,
      numberOfGroups: editFormatForm.numberOfGroups,
      teamsPerGroup: editFormatForm.teamsPerGroup
    });

    console.log('🔍 Format Validation Result:', validationResult);

    // Handle validation failure
    if (!validationResult.isValid) {
      // Check if it's a max teams reduction issue that needs confirmation dialog
      if (validationResult.requiresConfirmation && editFormatForm.maxNumberOfTeams) {
        const maxTeams = parseInt(editFormatForm.maxNumberOfTeams);
        const currentTeamsCount = getTeamsForTournament(tournamentData.id).length;
        if (maxTeams < currentTeamsCount) {
          console.log('⚠️ Showing Max Teams Reduction Warning Dialog from Format');
          setMaxTeamsReductionContext({ source: 'format', maxTeams: editFormatForm.maxNumberOfTeams });
          setShowMaxTeamsReductionWarning(true);
          return;
        }
      }
      
      // Show error message
      showValidationError(validationResult);
      return;
    }

    // Show warning if present (but still allow save)
    if (validationResult.warning) {
      console.log('⚠️ Format Validation Warning:', validationResult.warning);
    }

    // Proceed with save
    const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentData.id) {
        return {
          ...t,
          tournamentFormat: editFormatForm.tournamentFormat,
          playersPerTeam: parseInt(editFormatForm.playersPerTeam) || undefined,
          matchDuration: parseInt(editFormatForm.matchDuration) || undefined,
          maxNumberOfTeams: parseInt(editFormatForm.maxNumberOfTeams) || undefined,
          roundRobinRounds: parseInt(editFormatForm.roundRobinRounds) || 1,
          numberOfGroups: parseInt(editFormatForm.numberOfGroups) || undefined,
          teamsPerGroup: parseInt(editFormatForm.teamsPerGroup) || undefined,
          teamsProgressingPerGroup: parseInt(editFormatForm.teamsProgressingPerGroup) || undefined
        };
      }
      return t;
    });
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    setTournamentData({
      ...tournamentData,
      tournamentFormat: editFormatForm.tournamentFormat,
      playersPerTeam: parseInt(editFormatForm.playersPerTeam) || undefined,
      matchDuration: parseInt(editFormatForm.matchDuration) || undefined,
      maxNumberOfTeams: parseInt(editFormatForm.maxNumberOfTeams) || undefined,
      roundRobinRounds: parseInt(editFormatForm.roundRobinRounds) || 1,
      numberOfGroups: parseInt(editFormatForm.numberOfGroups) || undefined,
      teamsPerGroup: parseInt(editFormatForm.teamsPerGroup) || undefined,
      teamsProgressingPerGroup: parseInt(editFormatForm.teamsProgressingPerGroup) || undefined
    });
    setShowEditFormatDialog(false);
  };

  // Handle opening prize edit dialog
  const handleEditPrize = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can edit the prize.');
      return;
    }
    
    setEditPrizeValue(tournamentData.firstPrize || '');
    setEditPrizeForm({
      cashPrize: tournamentData.cashPrize || false,
      cashAmount: tournamentData.cashAmount || '',
      trophy: tournamentData.trophy || false,
      trophyImage: tournamentData.trophyImage || '',
      trophyImagePreview: tournamentData.trophyImage || '',
      certificates: tournamentData.certificates || false,
      other: tournamentData.other || false,
      otherText: tournamentData.otherText || ''
    });
    setShowEditPrizeDialog(true);
  };

  // Handle saving prize
  const handleSavePrize = () => {
    const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => 
      t.id === tournamentData.id ? { 
        ...t, 
        firstPrize: editPrizeForm.cashAmount, 
        cashPrize: editPrizeForm.cashPrize, 
        cashAmount: editPrizeForm.cashAmount,
        trophy: editPrizeForm.trophy, 
        trophyImage: editPrizeForm.trophyImage, 
        certificates: editPrizeForm.certificates, 
        other: editPrizeForm.other, 
        otherText: editPrizeForm.otherText 
      } : t
    );
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    setTournamentData({ 
      ...tournamentData, 
      firstPrize: editPrizeForm.cashAmount, 
      cashPrize: editPrizeForm.cashPrize, 
      cashAmount: editPrizeForm.cashAmount,
      trophy: editPrizeForm.trophy, 
      trophyImage: editPrizeForm.trophyImage, 
      certificates: editPrizeForm.certificates, 
      other: editPrizeForm.other, 
      otherText: editPrizeForm.otherText 
    });
    setShowEditPrizeDialog(false);
  };

  // Handle Generate Fixtures button click
  const handleGenerateFixturesClick = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can generate fixtures.');
      return;
    }
    
    // Check if this is a regeneration
    if (fixturesStatus === 'generated' || fixturesStatus === 'published') {
      setShowRegenerateWarning(true);
      return;
    }

    // Initialize seeding with current teams
    const teams = tournamentData.participatingTeams || [];
    setTeamSeeds(teams.map((team, index) => ({
      ...team,
      seed: index + 1,
      originalIndex: index
    })));

    // Check team count mismatch
    const summary = calculateFixtureSummary();
    if (summary.isTeamCountMismatch) {
      setShowTeamCountWarning(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // Handle proceeding from team count warning
  const handleProceedWithMismatch = () => {
    setShowTeamCountWarning(false);
    setProceedWithMismatch(true);
    setShowConfirmDialog(true);
  };

  // Handle regenerate fixtures
  const handleRegenerateFixtures = () => {
    setShowRegenerateWarning(false);
    // Reset fixtures
    setGeneratedFixtures([]);
    setFixturesStatus('none');
    setEnableSeeding(false);
    
    // Initialize seeding with current teams
    const teams = tournamentData.participatingTeams || [];
    setTeamSeeds(teams.map((team, index) => ({
      ...team,
      seed: index + 1,
      originalIndex: index
    })));

    // Check team count mismatch and show appropriate dialog
    // Bypass the regenerate check since we're already regenerating
    const summary = calculateFixtureSummary();
    if (summary.isTeamCountMismatch) {
      setShowTeamCountWarning(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // Confirm and generate fixtures
  const handleConfirmGenerateFixtures = () => {
    setShowConfirmDialog(false);
    
    // Use seeded teams if seeding is enabled, otherwise use original teams
    let teamsToUse = enableSeeding 
      ? [...teamSeeds].sort((a, b) => a.seed - b.seed) 
      : tournamentData.participatingTeams || [];
    
    if (teamsToUse.length < 2) {
      alert('Need at least 2 teams to generate fixtures');
      return;
    }

    const fixtures = [];
    const isDraft = proceedWithMismatch; // Mark as draft if team count mismatch
    
    if (tournamentData.tournamentFormat === 'league_round_robin') {
      // Round robin: each team plays every other team once
      for (let i = 0; i < teamsToUse.length; i++) {
        for (let j = i + 1; j < teamsToUse.length; j++) {
          fixtures.push({
            id: `${tournamentData.id}_${i}_${j}_${Date.now()}`,
            matchday: Math.floor(fixtures.length / (teamsToUse.length / 2)) + 1,
            teamA: teamsToUse[i].name,
            teamAId: teamsToUse[i].id,
            teamB: teamsToUse[j].name,
            teamBId: teamsToUse[j].id,
            date: '',
            time: '',
            venue: tournamentData.venue || 'TBD'
          });
        }
      }
    } else if (tournamentData.tournamentFormat === 'knockout') {
      // Knockout with seeding support
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamsToUse.length)));
      const byeCount = bracketSize - teamsToUse.length;
      let matchId = 0;
      
      // Pair teams: 1 vs last, 2 vs second-last, etc. (seeded bracket)
      const pairedTeams = [];
      for (let i = 0; i < Math.ceil(teamsToUse.length / 2); i++) {
        const teamA = teamsToUse[i];
        const teamB = teamsToUse[teamsToUse.length - 1 - i];
        if (teamA && teamB && teamA.id !== teamB.id) {
          pairedTeams.push([teamA, teamB]);
        } else if (teamA) {
          // Odd number - this team gets a bye
          pairedTeams.push([teamA, null]);
        }
      }
      
      pairedTeams.forEach(([teamA, teamB]) => {
        if (teamB) {
          fixtures.push({
            id: `${tournamentData.id}_ko_${matchId++}_${Date.now()}`,
            matchday: 1,
            round: getRoundName(bracketSize),
            teamA: teamA.name,
            teamAId: teamA.id,
            teamB: teamB.name,
            teamBId: teamB.id,
            date: '',
            time: '',
            venue: tournamentData.venue || 'TBD'
          });
        }
      });
    }

    setGeneratedFixtures(fixtures);
    setFixturesStatus('generated');
    setFixturesMetadata({ isDraft, seeded: enableSeeding });
    
    // Save to localStorage
    const fixturesData = {
      fixtures: fixtures,
      status: 'generated',
      metadata: { isDraft, seeded: enableSeeding }
    };
    localStorage.setItem(`fixtures_${tournamentData.id}`, JSON.stringify(fixturesData));
    
    // Reset states
    setProceedWithMismatch(false);
    setEnableSeeding(false);
    
    // Don't show management dialog - show success and post-generation actions
    alert(`Fixtures generated successfully!${isDraft ? ' (Marked as Draft - Team count mismatch)' : ''}`);
  };

  // Handle publish fixtures - show confirmation dialog
  const handlePublishFixtures = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can publish fixtures.');
      return;
    }
    
    // Validate start date before publishing
    if (!tournamentData.startDate) {
      alert('Please set a tournament start date before publishing fixtures.');
      setShowEditDetailsDialog(true);
      return;
    }
    setShowPublishConfirmDialog(true);
  };

  // Confirm and publish fixtures
  const handleConfirmPublish = () => {
    setFixturesStatus('published');
    const fixturesData = {
      fixtures: generatedFixtures,
      status: 'published',
      metadata: { ...fixturesMetadata, isDraft: false, publishedAt: new Date().toISOString() }
    };
    localStorage.setItem(`fixtures_${tournamentData.id}`, JSON.stringify(fixturesData));
    setFixturesMetadata({ ...fixturesMetadata, isDraft: false, publishedAt: new Date().toISOString() });
    setShowPublishConfirmDialog(false);
    alert('Fixtures published successfully!');
  };

  // Handle discard fixtures
  const handleDiscardFixtures = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can discard fixtures.');
      return;
    }
    
    if (window.confirm('This will delete all generated fixtures. Continue?')) {
      setGeneratedFixtures([]);
      setFixturesStatus('none');
      setFixturesMetadata({ isDraft: false });
      localStorage.removeItem(`fixtures_${tournamentData.id}`);
      alert('Fixtures discarded.');
    }
  };

  // Handle edit fixtures
  const handleManualEditFixtures = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can edit fixtures.');
      return;
    }
    
    // Navigate to fixtures tab for manual editing
    setActiveTab('fixtures');
    alert('Manual fixture editing: You can modify match details in the Fixtures tab. This will override automatic logic.');
  };

  // Mock data for demo purposes
  const leagueTable = [];

  const topScorers = [];

  const getQualificationColor = (qualification) => {
    switch (qualification) {
      case 'Champions League': return 'bg-blue-100 text-blue-800';
      case 'Europa League': return 'bg-orange-100 text-orange-800';
      case 'Conference League': return 'bg-green-100 text-green-800';
      case 'Relegation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormColor = (result) => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleTeamNameClick = (teamName) => {
    const teamData = leagueTable.find(team => team.team === teamName);
    if (teamData) {
      onTeamClick({
        id: teamData.position,
        name: teamName,
        matches: teamData.matches,
        wins: teamData.wins,
        goals: teamData.goalsFor
      });
    }
  };

  const handlePlayerNameClick = (playerName, teamName) => {
    const playerData = topScorers.find(scorer => scorer.player === playerName);
    if (playerData) {
      onPlayerClick({
        id: playerData.position,
        name: playerName,
        team: teamName,
        goals: playerData.goals,
        assists: playerData.assists
      });
    }
  };

  // Handle opening edit details dialog
  const handleEditDetails = () => {
    // Check permissions
    if (!canEditTournament()) {
      alert('Only tournament owners and coordinators can edit tournament details.');
      return;
    }
    
    setEditForm({
      name: tournamentData.name || '',
      place: tournamentData.place || '',
      venue: tournamentData.venue || '',
      startDate: tournamentData.startDate || '',
      endDate: tournamentData.endDate || '',
      coordinatorName: tournamentData.coordinatorName || '',
      coordinatorContact: tournamentData.coordinatorContact || '',
      registrationFee: tournamentData.registrationFee || '',
      imageUrl: tournamentData.imageUrl || '',
      imagePreview: tournamentData.imageUrl || '',
      tags: tournamentData.tags || [],
      description: tournamentData.description || ''
    });

    // Initialize coordinators from tournamentData
    if (tournamentData.coordinators && tournamentData.coordinators.length > 0) {
      const coords = tournamentData.coordinators.map(c => ({
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        user_id: c.user_id || undefined
      }));
      setEditCoordinators(coords);
      // Initialize search state arrays with empty values
      setCoordinatorSearchQuery(coords.map(() => ''));
      setShowCoordinatorSuggestions(coords.map(() => false));
    } else if (tournamentData.coordinatorName || tournamentData.coordinatorContact) {
      // Migrate legacy single coordinator fields
      setEditCoordinators([{
        name: tournamentData.coordinatorName || '',
        phone: tournamentData.coordinatorContact || '',
        email: '',
      }]);
      setCoordinatorSearchQuery(['']);
      setShowCoordinatorSuggestions([false]);
    } else {
      setEditCoordinators([{ name: '', phone: '', email: '' }]);
      setCoordinatorSearchQuery(['']);
      setShowCoordinatorSuggestions([false]);
    }

    setShowEditDetailsDialog(true);
  };

  // Handle image upload for edit
  const handleImageUploadEdit = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setEditForm({ ...editForm, imageUrl: base64String, imagePreview: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle trophy image upload
  const handleTrophyImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setEditPrizeForm({ ...editPrizeForm, trophyImage: base64String, trophyImagePreview: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving tournament details
  const handleSaveDetails = () => {
    console.log('💾 handleSaveDetails called');
    console.log('📊 editForm:', editForm);
    
    // Use centralized validation
    const validationResult = validateTournamentDetails({
      tournamentId: tournamentData.id,
      name: editForm.name,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      fixturesStatus: fixturesStatus
    });

    console.log('🔍 Validation Result:', validationResult);

    // Handle validation failure
    if (!validationResult.isValid) {
      // Show error message
      showValidationError(validationResult);
      return;
    }

    // Show warning if present (but still allow save)
    if (validationResult.warning) {
      console.log('⚠️ Validation Warning:', validationResult.warning);
    }

    // Proceed with save
    performDetailsSave();
  };

  // Perform the actual details save (extracted for reuse)
  const performDetailsSave = () => {
    // Filter out empty coordinators
    const cleanedCoordinators = editCoordinators.filter(
      c => c.name.trim() || c.phone.trim() || c.email.trim()
    ).map(c => ({
      name: c.name.trim(),
      phone: c.phone.trim(),
      email: c.email.trim(),
      user_id: c.user_id // Preserve user_id if it exists
    }));

    // Extract coordinator user IDs
    const coordinatorUserIds = cleanedCoordinators
      .filter(c => c.user_id)
      .map(c => c.user_id);
    
    // Ensure owner is included in coordinator list
    const allCoordinatorUserIds = tournamentData.owner_user_id
      ? [...new Set([tournamentData.owner_user_id, ...coordinatorUserIds])]
      : coordinatorUserIds;

    const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentData.id) {
        return {
          ...t,
          name: editForm.name.trim(),
          place: editForm.place.trim(),
          venue: editForm.venue.trim(),
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          // Save both new coordinators array and legacy fields for backward compatibility
          coordinators: cleanedCoordinators,
          coordinatorName: cleanedCoordinators[0]?.name || editForm.coordinatorName.trim(),
          coordinatorContact: cleanedCoordinators[0]?.phone || editForm.coordinatorContact.trim(),
          registrationFee: editForm.registrationFee.trim(),
          imageUrl: editForm.imageUrl,
          tags: editForm.tags || [],
          description: editForm.description || '',
          coordinator_user_ids: allCoordinatorUserIds
        };
      }
      return t;
    });
    localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
    
    // Update state
    setTournamentData({
      ...tournamentData,
      name: editForm.name.trim(),
      place: editForm.place.trim(),
      venue: editForm.venue.trim(),
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      coordinators: cleanedCoordinators,
      coordinatorName: cleanedCoordinators[0]?.name || editForm.coordinatorName.trim(),
      coordinatorContact: cleanedCoordinators[0]?.phone || editForm.coordinatorContact.trim(),
      registrationFee: editForm.registrationFee.trim(),
      imageUrl: editForm.imageUrl,
      tags: editForm.tags || [],
      description: editForm.description || '',
      coordinator_user_ids: allCoordinatorUserIds
    });
    
    // Notify parent component to sync to cloud
    if (onTournamentUpdate) {
      const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
      onTournamentUpdate(tournaments);
    }
    
    setShowEditDetailsDialog(false);
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-medium">Tournament Profile</h1>
      </div>

      {/* Tournament Profile Header */}
      <div className="flex flex-col items-center gap-4">
        {/* Tournament Logo */}
        <ImageAvatar
          src={tournamentData.imageUrl}
          alt={tournamentData.name}
          size="xl"
          type="tournament"
        />

        {/* Tournament Name and State Badge */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tournamentData.name}
            </h1>
            {tournamentStateInfo && (
              <Badge 
                variant="outline" 
                className={getTournamentStateBadge(tournamentStateInfo.state).color}
              >
                {getTournamentStateBadge(tournamentStateInfo.state).icon} {getTournamentStateBadge(tournamentStateInfo.state).label}
              </Badge>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Season: {getSeason()}</span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <MapPin className="w-4 h-4" />
              <span>{tournamentData.place || 'Location TBD'}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>{tournamentData.participatingTeams?.length || 0} teams</span>
              {tournamentStateInfo && tournamentStateInfo.completedMatchesCount > 0 && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span>{tournamentStateInfo.completedMatchesCount}/{tournamentStateInfo.totalFixturesCount} matches completed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Followers Count and Follow Button - Only for non-owners/coordinators */}
        {!canEditTournament() && currentUser && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {followerCount}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {followerCount === 1 ? 'follower' : 'followers'}
              </span>
            </div>

            <Button
              onClick={handleFollow}
              size="sm"
              className={`flex items-center gap-2 ${
                isFollowing 
                  ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </Button>
          </div>
        )}

        {/* Show follower count for owners/coordinators */}
        {canEditTournament() && (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              {followerCount}
            </span>
            <span className="text-sm text-purple-700 dark:text-purple-300">
              {followerCount === 1 ? 'follower' : 'followers'}
            </span>
          </div>
        )}
      </div>

      {/* Tournament State Info */}
      {tournamentStateInfo?.state === 'live' && tournamentStateInfo.completedMatchesCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Tournament In Progress</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {tournamentStateInfo.completedMatchesCount} match(es) completed. You can still add/remove teams or adjust tournament structure. Completed matches will be preserved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {tournamentStateInfo?.state === 'completed' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <h3 className="font-medium text-purple-900">Tournament Completed</h3>
                <p className="text-sm text-purple-700 mt-1">
                  All matches have been completed. Structural editing is now locked. You can still view all tournament data and statistics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fixturesStatus === 'none' && !hasMatchesStarted() && tournamentStateInfo?.state !== 'completed' && (
        <div className="flex flex-col gap-3">
          {/* Generate Fixtures Button - for tournament coordinators */}
          {canEditTournament() && (
            <Button 
              onClick={handleGenerateFixturesClick} 
              variant="outline" 
              className="flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Generate Fixtures
            </Button>
          )}
          {/* Team Entry Request Button - for team owners/coordinators */}
          {(() => {
            const cannotEdit = !canEditTournament();
            const hasUser = !!currentUser;
            const hasTeams = userOwnedTeams.length > 0;
            
            console.log('🎯 Team Entry Request Button visibility:', {
              cannotEdit,
              hasUser,
              hasTeams,
              userOwnedTeamsCount: userOwnedTeams.length,
              currentUserId: currentUser?.user_id,
              shouldShow: cannotEdit && hasUser && hasTeams
            });
            
            return cannotEdit && hasUser && hasTeams ? (
              <Button 
                onClick={() => setShowTeamEntryRequestDialog(true)}
                variant="outline" 
                className="flex items-center justify-center gap-2 border-purple-500 text-purple-700 dark:text-purple-400"
              >
                <Trophy className="w-4 h-4" />
                Request Team Entry ({userOwnedTeams.length} team{userOwnedTeams.length !== 1 ? 's' : ''})
              </Button>
            ) : null;
          })()}
        </div>
      )}

      {/* Post-Generation Actions */}
      {fixturesStatus === 'generated' && !hasMatchesStarted() && canEditTournament() && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">
                Fixtures Generated {fixturesMetadata.isDraft ? '(Draft - Incomplete)' : ''}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleGenerateFixturesClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Regenerate
              </Button>
              <Button 
                onClick={handlePublishFixtures}
                size="sm"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Check className="w-4 h-4" />
                Publish Fixtures
              </Button>
              <Button 
                onClick={handleManualEditFixtures}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Manual Edit
              </Button>
              <Button 
                onClick={handleDiscardFixtures}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {fixturesStatus === 'published' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">Fixtures Published</h3>
              </div>
              {tournamentStateInfo?.state !== 'completed' && canEditTournament() && (
                <Button 
                  onClick={handleGenerateFixturesClick}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Regenerate
                </Button>
              )}
            </div>
            {tournamentStateInfo?.state !== 'completed' && (
              <p className="text-sm text-green-700">
                You can regenerate fixtures until the tournament is completed. Completed matches will be preserved.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Tournament Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tournament Details</CardTitle>
              {canEditTournament() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditDetails}
                  disabled={tournamentStateInfo?.state === 'completed'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name</span>
                  <span className="font-medium dark:text-gray-100">{tournamentData.name || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Place</span>
                  <span className="font-medium dark:text-gray-100">{tournamentData.place || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Venue</span>
                  <span className="font-medium dark:text-gray-100">{tournamentData.venue || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                  <span className="font-medium dark:text-gray-100">
                    {tournamentData.startDate 
                      ? new Date(tournamentData.startDate).toLocaleDateString() 
                      : 'TBD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">End Date</span>
                  <span className="font-medium dark:text-gray-100">
                    {tournamentData.endDate 
                      ? new Date(tournamentData.endDate).toLocaleDateString() 
                      : 'TBD'}
                  </span>
                </div>
                {/* Display coordinators - new array format */}
                {tournamentData.coordinators && tournamentData.coordinators.length > 0 ? (
                  tournamentData.coordinators.map((coord, idx) => (
                    <div key={idx} className="pt-1">
                      <div className="text-gray-600 dark:text-gray-400 font-medium text-xs mb-1">
                        {tournamentData.coordinators.length > 1 ? `Coordinator ${idx + 1}` : 'Coordinator'}
                      </div>
                      {coord.name && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">Name</span>
                          <span className="font-medium dark:text-gray-100">{coord.name}</span>
                        </div>
                      )}
                      {coord.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">Phone</span>
                          <span className="font-medium dark:text-gray-100">{coord.phone}</span>
                        </div>
                      )}
                      {coord.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">Email</span>
                          <span className="font-medium dark:text-gray-100">{coord.email}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : tournamentData.coordinatorName ? (
                  // Legacy single coordinator fallback
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Coordinator</span>
                      <span className="font-medium dark:text-gray-100">{tournamentData.coordinatorName}</span>
                    </div>
                    {tournamentData.coordinatorContact && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Contact</span>
                        <span className="font-medium dark:text-gray-100">{tournamentData.coordinatorContact}</span>
                      </div>
                    )}
                  </>
                ) : null}
                {tournamentData.registrationFee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Registration Fee</span>
                    <span className="font-medium dark:text-gray-100">{tournamentData.registrationFee}</span>
                  </div>
                )}
                {tournamentData.tags && tournamentData.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-gray-600 dark:text-gray-400 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {tournamentData.tags.map((tag, index) => (
                        <span key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tournamentData.description && (
                  <div className="pt-2">
                    <span className="text-gray-600 dark:text-gray-400 block mb-2">Description</span>
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{tournamentData.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizer Information */}
          {tournamentData.coordinators && tournamentData.coordinators.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                  <UserCheck className="w-5 h-5" />
                  Organizer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournamentData.coordinators.map((coord, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-600 dark:bg-purple-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {coord.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{coord.name || 'Coordinator'}</p>
                          {tournamentData.coordinators.length > 1 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Coordinator {idx + 1}</p>
                          )}
                        </div>
                      </div>
                      {coord.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-2">
                          <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <a href={`tel:${coord.phone}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                            {coord.phone}
                          </a>
                        </div>
                      )}
                      {coord.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-1">
                          <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <a href={`mailto:${coord.email}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                            {coord.email}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Entry Requests - Only visible to owners/coordinators */}
          {canEditTournament() && (() => {
            const teamRequests = getPendingTeamEntryRequests();
            return teamRequests.length > 0 ? (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <Trophy className="w-5 h-5" />
                    Team Entry Requests ({teamRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamRequests.map(req => (
                      <div key={req.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ImageAvatar
                              src={req.team_image_url}
                              alt={req.team_name}
                              type="team"
                              size="md"
                            />
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{req.team_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Coach: {req.team_coach || 'N/A'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Requested by {req.requested_by_user_name} • {new Date(req.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAcceptTeamEntry(req.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleRejectTeamEntry(req.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}

          {/* Tournament Format & Live Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tournament Format & Structure</CardTitle>
              {canEditTournament() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditFormat}
                  disabled={tournamentStateInfo?.state === 'completed'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Format</span>
                    <span className="font-medium dark:text-gray-100">{formatTypeDisplay(tournamentData.tournamentFormat)}</span>
                  </div>
                  {tournamentData.maxNumberOfTeams && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max Teams</span>
                      <span className="font-medium dark:text-gray-100">{tournamentData.maxNumberOfTeams}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Registered Teams</span>
                    <span className="font-medium dark:text-gray-100">{getTeamsForTournament(tournamentData.id).length}</span>
                  </div>
                  {tournamentData.playersPerTeam && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Players Per Team</span>
                      <span className="font-medium dark:text-gray-100">{tournamentData.playersPerTeam}</span>
                    </div>
                  )}
                  {tournamentData.matchDuration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Match Duration</span>
                      <span className="font-medium dark:text-gray-100">{tournamentData.matchDuration} minutes</span>
                    </div>
                  )}
                </div>

                {/* Format-Specific Live Summary */}
                {tournamentData.tournamentFormat === 'league_round_robin' && tournamentData.roundRobinRounds && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">League Structure</h4>
                    <div className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                      <p>• {tournamentData.roundRobinRounds === 1 ? 'Single' : tournamentData.roundRobinRounds === 2 ? 'Double' : tournamentData.roundRobinRounds === 3 ? 'Triple' : `${tournamentData.roundRobinRounds}×`} Round Robin</p>
                      <p>• Each team plays every other team {tournamentData.roundRobinRounds} time{tournamentData.roundRobinRounds > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {tournamentData.tournamentFormat === 'knockout' && tournamentData.maxNumberOfTeams && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Knockout Structure</h4>
                    <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <p>• {tournamentData.maxNumberOfTeams} teams</p>
                      <p>• Single Elimination Format</p>
                    </div>
                  </div>
                )}

                {tournamentData.tournamentFormat === 'group_stage___knockout' && tournamentData.numberOfGroups && tournamentData.teamsPerGroup && tournamentData.teamsProgressingPerGroup && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Group + Knockout Structure</h4>
                    <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                      <p>• <strong>{tournamentData.numberOfGroups} Groups</strong></p>
                      <p>• <strong>{tournamentData.teamsPerGroup} Teams per Group</strong></p>
                      <p>• Top <strong>{tournamentData.teamsProgressingPerGroup}</strong> qualify directly → <strong>{tournamentData.numberOfGroups * tournamentData.teamsProgressingPerGroup} teams</strong></p>
                      {(() => {
                        const directQualifiers = tournamentData.numberOfGroups * tournamentData.teamsProgressingPerGroup;
                        const bracketSize = Math.pow(2, Math.ceil(Math.log2(directQualifiers)));
                        const bestNextPlaced = bracketSize - directQualifiers;
                        let roundName = '';
                        if (bracketSize === 2) roundName = 'Final';
                        else if (bracketSize === 4) roundName = 'Semifinals';
                        else if (bracketSize === 8) roundName = 'Quarterfinals';
                        else if (bracketSize === 16) roundName = 'Round of 16';
                        else if (bracketSize === 32) roundName = 'Round of 32';
                        else roundName = `Round of ${bracketSize}`;
                        
                        return (
                          <>
                            {bestNextPlaced > 0 && (
                              <p className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Best <strong>{bestNextPlaced} next-placed team{bestNextPlaced > 1 ? 's' : ''}</strong> across all groups will also qualify</span>
                              </p>
                            )}
                            <p>• Knockout stage size = <strong>{bracketSize}</strong></p>
                            <p>• Knockout starts from <strong>{roundName}</strong></p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prize */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prize</CardTitle>
              {canEditTournament() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditPrize}
                  disabled={tournamentStateInfo?.state === 'completed'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {/* Cash Prize */}
                {tournamentData.cashPrize && tournamentData.cashAmount ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">💰 Cash Prize</span>
                    <span className="font-medium text-yellow-600">{tournamentData.cashAmount}</span>
                  </div>
                ) : tournamentData.firstPrize && !tournamentData.cashPrize ? (
                  // Backward compatibility: show old firstPrize field if new structure not available
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Winner Prize</span>
                    <span className="font-medium text-yellow-600">{tournamentData.firstPrize}</span>
                  </div>
                ) : null}
                
                {/* Trophy */}
                {tournamentData.trophy && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🏆 Trophy</span>
                    {tournamentData.trophyImage ? (
                      <ImageAvatar
                        src={tournamentData.trophyImage}
                        alt="Trophy"
                        size="sm"
                        type="tournament"
                      />
                    ) : (
                      <span className="font-medium text-purple-600">✓ Included</span>
                    )}
                  </div>
                )}
                
                {/* Certificates */}
                {tournamentData.certificates && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">📜 Certificates</span>
                    <span className="font-medium text-purple-600">✓ Included</span>
                  </div>
                )}
                
                {/* Other Awards */}
                {tournamentData.other && tournamentData.otherText && (
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600">🎁 Other Awards</span>
                    <span className="font-medium text-purple-600 ml-4">{tournamentData.otherText}</span>
                  </div>
                )}
                
                {/* No prize configured */}
                {!tournamentData.cashPrize && !tournamentData.trophy && !tournamentData.certificates && !tournamentData.other && !tournamentData.firstPrize && (
                  <div className="text-gray-400 text-center py-2">
                    No prizes configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registered Teams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registered Teams ({getUniqueParticipatingTeams().length})</CardTitle>
              {canEditTournament() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleOpenManageTeams}
                  disabled={tournamentStateInfo?.state === 'completed'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {getUniqueParticipatingTeams().length > 0 ? (
                <div className="space-y-2">
                  {getUniqueParticipatingTeams().map((team, index) => (
                    <div key={`team-${team.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                        </div>
                        <span className="font-medium">{team.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveTeamFromTournament(team.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={tournamentStateInfo?.state === 'completed'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={handleOpenManageTeams}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Teams
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No teams registered yet.</p>
                  <Button onClick={handleOpenManageTeams}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teams to Tournament
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          {/* League Table */}
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No table data available yet. Tables will be generated once matches are scored.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixtures" className="space-y-4">
          {/* Fixtures */}
          <Card>
            <CardHeader>
              <CardTitle>
                {fixturesStatus === 'published' ? 'Fixtures' : fixturesStatus === 'generated' ? 'Generated Fixtures (Draft)' : 'Fixtures'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedFixtures.length > 0 ? (
                <div className="space-y-4">
                  {generatedFixtures.map((fixture, index) => (
                    <div 
                      key={fixture.id}
                      onClick={() => onMatchClick(fixture)}
                      className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {fixture.date && (
                            <>
                              <Calendar className="w-3 h-3" />
                              <span>{fixture.date}</span>
                            </>
                          )}
                          {fixture.time && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{fixture.time}</span>
                            </>
                          )}
                        </div>
                        <Badge variant="outline">
                          {fixture.round || `MD ${fixture.matchday || index + 1}`}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{fixture.teamA}</span>
                        <span className="text-lg font-medium">vs</span>
                        <span className="font-medium">{fixture.teamB}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{fixture.venue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {fixturesStatus === 'none' ? 
                    'No fixtures generated yet. Click "Generate Fixtures" to create the match schedule.' :
                    'No fixtures available.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Top Scorers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No statistics available yet. Stats will appear once matches are scored.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Generate Fixtures Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open);
        if (!open) {
          setEnableSeeding(false);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Fixture Generation</DialogTitle>
            <DialogDescription>
              Review tournament summary and configure seeding before generating fixtures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Tournament Summary */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">📋 Tournament Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">Maximum Teams:</span>
                  <span className="ml-2 font-medium text-blue-900">{tournamentData.maxNumberOfTeams || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Registered Teams:</span>
                  <span className="ml-2 font-medium text-blue-900">{getTeamsForTournament(tournamentData.id).length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Format:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatTypeDisplay(tournamentData.tournamentFormat)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Matches:</span>
                  <span className="ml-2 font-medium text-blue-900">{calculateFixtureSummary().totalMatches}</span>
                </div>
                {calculateFixtureSummary().totalStages > 0 && (
                  <div>
                    <span className="text-blue-700">Total Stages:</span>
                    <span className="ml-2 font-medium text-blue-900">{calculateFixtureSummary().totalStages}</span>
                  </div>
                )}
                {calculateFixtureSummary().byeTeams > 0 && (
                  <div>
                    <span className="text-blue-700">Byes:</span>
                    <span className="ml-2 font-medium text-blue-900">{calculateFixtureSummary().byeTeams} team(s)</span>
                  </div>
                )}
              </div>
              {calculateFixtureSummary().qualificationPath && (
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <span className="text-blue-700 text-sm">Qualification Path:</span>
                  <p className="text-blue-900 font-medium text-sm mt-1">{calculateFixtureSummary().qualificationPath}</p>
                </div>
              )}
            </div>

            {/* Registered Teams List */}
            <div>
              <h4 className="font-medium mb-2">Registered Teams ({getUniqueParticipatingTeams().length})</h4>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {getUniqueParticipatingTeams().length > 0 ? (
                  <div className="space-y-1">
                    {getUniqueParticipatingTeams().map((team, index) => (
                      <div key={`fixture-team-${team.id}-${index}`} className="text-sm flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                          {index + 1}
                        </span>
                        <span>{team.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No teams registered</p>
                )}
              </div>
            </div>

            {/* Team Seeding Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">🌟 Team Seeding (Optional)</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enableSeeding"
                    checked={enableSeeding}
                    onCheckedChange={setEnableSeeding}
                  />
                  <Label htmlFor="enableSeeding" className="cursor-pointer">Enable Seeding</Label>
                </div>
              </div>
              
              {enableSeeding ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Assign seed numbers to control matchups. Lower seeds are stronger teams.
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {teamSeeds.map((team, index) => (
                      <div key={`seed-${team.id}-${index}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <Input
                          type="number"
                          min="1"
                          max={teamSeeds.length}
                          value={team.seed}
                          onChange={(e) => {
                            const newSeeds = [...teamSeeds];
                            newSeeds[index].seed = parseInt(e.target.value) || 1;
                            setTeamSeeds(newSeeds);
                          }}
                          className="w-20"
                        />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• In Knockout: Highest seeds placed on opposite bracket sides</p>
                    <p>• In Group + Knockout: Top seeds distributed evenly across groups</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Seeding disabled. Teams will be randomly drawn.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmGenerateFixtures}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!tournamentData.participatingTeams || tournamentData.participatingTeams.length < 2}
            >
              Generate Fixtures
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Structural Change Warning Dialog */}
      <Dialog open={showStructuralChangeWarning} onOpenChange={setShowStructuralChangeWarning}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <DialogTitle className="text-lg">Structural Change Detected</DialogTitle>
            </div>
            <DialogDescription>
              {impactPreview?.message || 'Changing tournament structure will affect existing fixtures.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {impactPreview && impactPreview.warnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">📋 Impact Summary</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  {impactPreview.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">✅ What Will Be Preserved</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Completed match results</li>
                <li>Team registrations</li>
                <li>Tournament details</li>
                <li>Player statistics from completed matches</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ What May Change</h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Future fixtures may need regeneration</li>
                <li>Upcoming match schedule may be affected</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowStructuralChangeWarning(false);
                setPendingFormatChanges(null);
                setImpactPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmedSaveFormat}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Yes, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fixtures Management Dialog */}
      <Dialog open={showFixturesManageDialog} onOpenChange={setShowFixturesManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Fixtures</DialogTitle>
            <DialogDescription>
              You have generated {generatedFixtures.length} fixture{generatedFixtures.length !== 1 ? 's' : ''}. Choose an action.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Once you publish fixtures, the Generate Fixtures button will be hidden. You can edit fixtures before publishing.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={handleDiscardFixtures}
              className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Discard
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualEditFixtures}
              className="w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Fixtures
            </Button>
            <Button 
              onClick={handlePublishFixtures}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Publish Fixtures
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Format Dialog - COMPREHENSIVE VERSION */}
      <Dialog open={showEditFormatDialog} onOpenChange={setShowEditFormatDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament Format & Configuration</DialogTitle>
            <DialogDescription>
              Update tournament format and structural parameters. Changes to format may reset fixtures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Tournament Format *</Label>
              <Select 
                value={editFormatForm.tournamentFormat} 
                onValueChange={(value) => setEditFormatForm({ ...editFormatForm, tournamentFormat: value })}
              >
                <SelectTrigger className="border-purple-300">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="league_round_robin">League (Round Robin)</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="group_stage___knockout">Group Stage + Knockout</SelectItem>
                  <SelectItem value="other_manual">Other Format (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Players Per Team</Label>
                <Input
                  type="number"
                  value={editFormatForm.playersPerTeam}
                  onChange={(e) => setEditFormatForm({ ...editFormatForm, playersPerTeam: e.target.value })}
                  placeholder="e.g., 11"
                  className="border-purple-300"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Match Duration (min)</Label>
                <Input
                  type="number"
                  value={editFormatForm.matchDuration}
                  onChange={(e) => setEditFormatForm({ ...editFormatForm, matchDuration: e.target.value })}
                  placeholder="e.g., 90"
                  className="border-purple-300"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Maximum Number of Teams</Label>
              <Input
                type="number"
                value={editFormatForm.maxNumberOfTeams}
                onChange={(e) => setEditFormatForm({ ...editFormatForm, maxNumberOfTeams: e.target.value })}
                placeholder="Enter maximum teams"
                className="border-purple-300"
                min="2"
              />
            </div>

            {/* League Round Robin Options */}
            {editFormatForm.tournamentFormat === 'league_round_robin' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-purple-900">League Configuration</h4>
                <div>
                  <Label className="block text-sm font-medium mb-2">Round Robin Type</Label>
                  <Select 
                    value={editFormatForm.roundRobinRounds}
                    onValueChange={(value) => setEditFormatForm({ ...editFormatForm, roundRobinRounds: value })}
                  >
                    <SelectTrigger className="border-purple-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Round Robin (1)</SelectItem>
                      <SelectItem value="2">Double Round Robin (2)</SelectItem>
                      <SelectItem value="3">Triple Round Robin (3)</SelectItem>
                      <SelectItem value="4">4 Rounds</SelectItem>
                      <SelectItem value="5">5 Rounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editFormatForm.maxNumberOfTeams && (
                  <div className="bg-white border border-purple-300 rounded-lg p-3 text-sm">
                    <p className="text-purple-900">
                      <strong>Total Matches:</strong> {totalMatches || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Knockout Options */}
            {editFormatForm.tournamentFormat === 'knockout' && editFormatForm.maxNumberOfTeams && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-900">Knockout Structure</h4>
                {knockoutStages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800">
                      <strong>Stages:</strong>
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {knockoutStages.map((stage, idx) => (
                        <li key={idx}>• {stage}</li>
                      ))}
                    </ul>
                    {byesRequired > 0 && (
                      <p className="text-sm text-blue-800">
                        <strong>Byes Required:</strong> {byesRequired}
                      </p>
                    )}
                    <p className="text-sm text-blue-800">
                      <strong>Total Matches:</strong> {totalMatches}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Group + Knockout Options */}
            {editFormatForm.tournamentFormat === 'group_stage___knockout' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-green-900">Group + Knockout Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Number of Groups *</Label>
                    <Input
                      type="number"
                      placeholder="Enter number"
                      value={editFormatForm.numberOfGroups}
                      onChange={(e) => setEditFormatForm({ ...editFormatForm, numberOfGroups: e.target.value })}
                      className="border-green-300"
                      min="2"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-2">Teams per Group *</Label>
                    <Input
                      type="number"
                      placeholder="Enter number"
                      value={editFormatForm.teamsPerGroup}
                      onChange={(e) => setEditFormatForm({ ...editFormatForm, teamsPerGroup: e.target.value })}
                      className="border-green-300"
                      min="2"
                    />
                  </div>
                </div>

                {groupConfigWarning && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                    {groupConfigWarning}
                  </div>
                )}

                <div>
                  <Label className="block text-sm font-medium mb-2">Teams progressing from each group *</Label>
                  <Input
                    type="number"
                    placeholder="Enter teams progressing per group"
                    value={editFormatForm.teamsProgressingPerGroup}
                    onChange={(e) => setEditFormatForm({ ...editFormatForm, teamsProgressingPerGroup: e.target.value })}
                    className="border-green-300"
                    min="1"
                    max={editFormatForm.teamsPerGroup ? parseInt(editFormatForm.teamsPerGroup) - 1 : undefined}
                  />
                  {editFormatForm.teamsPerGroup && (
                    <p className="text-xs text-green-600 mt-1">Must be &lt; {editFormatForm.teamsPerGroup} (teams per group)</p>
                  )}
                </div>

                {editFormatForm.numberOfGroups && editFormatForm.teamsProgressingPerGroup && 
                 parseInt(editFormatForm.teamsProgressingPerGroup) > 0 && 
                 parseInt(editFormatForm.teamsProgressingPerGroup) < parseInt(editFormatForm.teamsPerGroup || '0') && (
                  <div className="bg-white border border-green-300 rounded-lg p-4 space-y-2 text-sm">
                    <h4 className="font-medium text-green-900">Knockout Qualification Summary</h4>
                    <div className="space-y-1 text-green-800">
                      <p>• <strong>{editFormatForm.numberOfGroups} Groups</strong></p>
                      <p>• <strong>{editFormatForm.teamsPerGroup} Teams per Group</strong></p>
                      <p>• Top <strong>{editFormatForm.teamsProgressingPerGroup}</strong> qualify directly → <strong>{totalDirectQualifiers} teams</strong></p>
                      {bestNextPlacedTeams > 0 && (
                        <p className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Best <strong>{bestNextPlacedTeams} next-placed team{bestNextPlacedTeams > 1 ? 's' : ''}</strong> across all groups will also qualify</span>
                        </p>
                      )}
                      <p>• Knockout stage size = <strong>{knockoutBracketSize}</strong></p>
                      <p>• Knockout starts from <strong>{knockoutStartingRound}</strong></p>
                    </div>
                  </div>
                )}

                {editFormatForm.teamsProgressingPerGroup && 
                 parseInt(editFormatForm.teamsProgressingPerGroup) >= parseInt(editFormatForm.teamsPerGroup || '0') && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                    ⚠️ Teams progressing must be less than teams per group ({editFormatForm.teamsPerGroup})
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFormatDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAttemptSaveFormat}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prize Dialog */}
      <Dialog open={showEditPrizeDialog} onOpenChange={setShowEditPrizeDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Prize</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="cashPrize"
                checked={editPrizeForm.cashPrize}
                onCheckedChange={(checked) => setEditPrizeForm({ ...editPrizeForm, cashPrize: checked })}
              />
              <Label htmlFor="cashPrize">Cash Prize</Label>
            </div>
            {editPrizeForm.cashPrize && (
              <div>
                <Label>Cash Amount</Label>
                <Input
                  value={editPrizeForm.cashAmount}
                  onChange={(e) => setEditPrizeForm({ ...editPrizeForm, cashAmount: e.target.value })}
                  placeholder="Enter cash amount"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="trophy"
                checked={editPrizeForm.trophy}
                onCheckedChange={(checked) => setEditPrizeForm({ ...editPrizeForm, trophy: checked })}
              />
              <Label htmlFor="trophy">Trophy</Label>
            </div>
            {editPrizeForm.trophy && (
              <div>
                <Label>Trophy Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleTrophyImageUpload}
                  />
                  {editPrizeForm.trophyImagePreview && (
                    <ImageAvatar
                      src={editPrizeForm.trophyImagePreview}
                      alt="Trophy Image"
                      size="sm"
                      type="tournament"
                    />
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="certificates"
                checked={editPrizeForm.certificates}
                onCheckedChange={(checked) => setEditPrizeForm({ ...editPrizeForm, certificates: checked })}
              />
              <Label htmlFor="certificates">Certificates</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="other"
                checked={editPrizeForm.other}
                onCheckedChange={(checked) => setEditPrizeForm({ ...editPrizeForm, other: checked })}
              />
              <Label htmlFor="other">Other</Label>
            </div>
            {editPrizeForm.other && (
              <div>
                <Label>Other Text</Label>
                <Textarea
                  value={editPrizeForm.otherText}
                  onChange={(e) => setEditPrizeForm({ ...editPrizeForm, otherText: e.target.value })}
                  placeholder="Enter other prize details"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPrizeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePrize}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Teams Dialog */}
      <Dialog open={showManageTeamsDialog} onOpenChange={(open) => {
        setShowManageTeamsDialog(open);
        if (!open) {
          setShowAddTeamForm(false);
          setSearchTeamQuery('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Teams</DialogTitle>
            <DialogDescription>
              Add existing teams or create new teams for this tournament.
            </DialogDescription>
          </DialogHeader>
          
          {!showAddTeamForm ? (
            <div className="space-y-4 py-4">
              {/* Max teams warning */}
              {tournamentData.maxNumberOfTeams && (
                <div className={`p-3 rounded-lg border text-sm ${
                  isMaxTeamsReached() 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <p>
                    <strong>{getTeamsForTournament(tournamentData.id).length} / {tournamentData.maxNumberOfTeams}</strong> teams registered
                  </p>
                  {isMaxTeamsReached() && (
                    <p className="mt-1">⚠️ Maximum team limit reached</p>
                  )}
                </div>
              )}

              <div>
                <Label>Search Existing Teams</Label>
                <Input
                  value={searchTeamQuery}
                  onChange={(e) => setSearchTeamQuery(e.target.value)}
                  placeholder="Search for teams..."
                  className="mt-2"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {getFilteredAvailableTeams().length > 0 ? (
                  getFilteredAvailableTeams().map((team, index) => (
                    <div key={`available-team-${team.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{team.name}</span>
                      <Button 
                        size="sm"
                        onClick={() => handleAddTeamToTournament(team)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={isMaxTeamsReached()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTeamQuery ? 'No teams found matching your search.' : 'All available teams have been added.'}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={handleOpenAddTeamForm}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isMaxTeamsReached()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Team
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <Label>Team Name *</Label>
                <Input
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  placeholder="Enter team name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Coach Name</Label>
                <Input
                  value={newTeamData.coach}
                  onChange={(e) => setNewTeamData({ ...newTeamData, coach: e.target.value })}
                  placeholder="Enter coach name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Home Venue</Label>
                <Input
                  value={newTeamData.homeVenue}
                  onChange={(e) => setNewTeamData({ ...newTeamData, homeVenue: e.target.value })}
                  placeholder="Enter home venue"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Team Logo (Optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleTeamImageUpload}
                    className="flex-1"
                  />
                  {newTeamData.imagePreview && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden">
                      <img 
                        src={newTeamData.imagePreview} 
                        alt="Team logo preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {showAddTeamForm ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddTeamForm(false);
                    setNewTeamData({
                      name: '',
                      coach: '',
                      homeVenue: '',
                      imageUrl: '',
                      imagePreview: ''
                    });
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCreateNewTeam}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={!newTeamData.name.trim()}
                >
                  Create & Add to Tournament
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowManageTeamsDialog(false);
                  setSearchTeamQuery('');
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Team Dialog */}
      <Dialog open={showDuplicateTeamDialog} onOpenChange={setShowDuplicateTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Already Exists</DialogTitle>
            <DialogDescription>
              A team with the name "{duplicateTeamData?.name}" already exists in the Master Teams database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {duplicateTeamData && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Existing Team Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {duplicateTeamData.name}</p>
                  {duplicateTeamData.coach && (
                    <p><span className="font-medium">Coach:</span> {duplicateTeamData.coach}</p>
                  )}
                  {duplicateTeamData.homeVenue && (
                    <p><span className="font-medium">Home Venue:</span> {duplicateTeamData.homeVenue}</p>
                  )}
                  <p><span className="font-medium">Players:</span> {(duplicateTeamData.players || []).length}</p>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Would you like to use the existing team or modify your team name to create a new one?
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCreateAnyway}
            >
              Modify Name
            </Button>
            <Button 
              onClick={handleUseExistingTeam}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Use Existing Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Withdrawal Dialog */}
      <Dialog open={showTeamWithdrawalDialog} onOpenChange={setShowTeamWithdrawalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg">Team Withdrawal</DialogTitle>
            </div>
            <DialogDescription>
              {teamToWithdraw ? `Remove "${teamToWithdraw.name}" from the tournament?` : 'Remove team from tournament?'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {impactPreview && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium mb-2">{impactPreview.message}</p>
                </div>

                {impactPreview.affectedMatches.completed.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">✅ Completed Matches</h4>
                    <p className="text-sm text-green-800">
                      {impactPreview.affectedMatches.completed.length} completed match(es) will be preserved with their results.
                    </p>
                  </div>
                )}

                {impactPreview.affectedMatches.upcoming.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">⚠️ Upcoming Matches</h4>
                    <p className="text-sm text-orange-800">
                      {impactPreview.affectedMatches.upcoming.length} upcoming match(es) will be voided/forfeited.
                    </p>
                  </div>
                )}

                {impactPreview.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">📋 Additional Notes</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {impactPreview.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            
            {(!impactPreview || tournamentStateInfo?.state === 'draft') && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  This team will be removed from the tournament. The team itself will remain in the Master Teams list and can be added to other tournaments.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTeamWithdrawalDialog(false);
                setTeamToWithdraw(null);
                setImpactPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => teamToWithdraw && performTeamRemoval(teamToWithdraw.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={impactPreview && !impactPreview.canProceed}
            >
              {impactPreview?.canProceed === false ? 'Cannot Proceed' : 'Confirm Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={showEditDetailsDialog} onOpenChange={setShowEditDetailsDialog}>
        <DialogContent aria-describedby={undefined} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter tournament name"
              />
            </div>
            
            <div>
              <Label>Place</Label>
              <Input
                value={editForm.place}
                onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            
            <div>
              <Label>Venue</Label>
              <Input
                value={editForm.venue}
                onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                placeholder="Enter venue"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date {fixturesStatus === 'published' && <span className="text-red-500">*</span>}</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
                {fixturesStatus === 'published' && !editForm.startDate && (
                  <p className="text-xs text-red-500 mt-1">Required for published tournaments</p>
                )}
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  min={editForm.startDate}
                />
                {editForm.startDate && editForm.endDate && new Date(editForm.endDate) < new Date(editForm.startDate) && (
                  <p className="text-xs text-red-500 mt-1">End date cannot be earlier than start date</p>
                )}
              </div>
            </div>
            
            {/* Coordinators Section (up to 2) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Coordinators</Label>
                {editCoordinators.length < 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditCoordinators([...editCoordinators, { name: '', phone: '', email: '' }]);
                      setCoordinatorSearchQuery([...coordinatorSearchQuery, '']);
                      setShowCoordinatorSuggestions([...showCoordinatorSuggestions, false]);
                    }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Add Coordinator
                  </Button>
                )}
              </div>
              {editCoordinators.map((coord, idx) => {
                const excludedUserIds = editCoordinators.filter((c, i) => i !== idx && c.user_id).map(c => c.user_id);
                const filteredUsers = getFilteredUsers(coordinatorSearchQuery[idx] || '', excludedUserIds);
                const showNoResults = (coordinatorSearchQuery[idx] || '').length >= 2 && filteredUsers.length === 0;
                
                return (
                  <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Coordinator {idx + 1}</span>
                      {editCoordinators.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditCoordinators(editCoordinators.filter((_, i) => i !== idx));
                            const newQueries = coordinatorSearchQuery.filter((_, i) => i !== idx);
                            setCoordinatorSearchQuery(newQueries);
                            const newShowSuggestions = showCoordinatorSuggestions.filter((_, i) => i !== idx);
                            setShowCoordinatorSuggestions(newShowSuggestions);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Name Input with Autocomplete */}
                    <div className="relative">
                      <Label className="text-xs text-gray-600">Name</Label>
                      <Input
                        placeholder="Search user by name, phone or email..."
                        value={coordinatorSearchQuery[idx] || coord.name}
                        onChange={(e) => {
                          const newQueries = [...coordinatorSearchQuery];
                          newQueries[idx] = e.target.value;
                          setCoordinatorSearchQuery(newQueries);
                          
                          const newShowSuggestions = [...showCoordinatorSuggestions];
                          newShowSuggestions[idx] = e.target.value.length >= 2;
                          setShowCoordinatorSuggestions(newShowSuggestions);
                          
                          // If manually typing, update name
                          if (!coord.user_id) {
                            const updated = [...editCoordinators];
                            updated[idx].name = e.target.value;
                            setEditCoordinators(updated);
                          }
                        }}
                        onFocus={() => {
                          if ((coordinatorSearchQuery[idx] || '').length >= 2) {
                            const newShowSuggestions = [...showCoordinatorSuggestions];
                            newShowSuggestions[idx] = true;
                            setShowCoordinatorSuggestions(newShowSuggestions);
                          }
                        }}
                        className="mt-1"
                      />
                      
                      {/* User Suggestions Dropdown */}
                      {showCoordinatorSuggestions[idx] && filteredUsers.length > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-purple-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                          <div className="px-3 py-2 text-xs text-purple-600 bg-purple-50 border-b">
                            {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''} found
                          </div>
                          {filteredUsers.map(user => (
                            <div
                              key={user.user_id}
                              onClick={() => handleSelectCoordinatorUser(idx, user)}
                              className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                {user.imageUrl ? (
                                  <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 truncate">{user.name}</div>
                                  {user.phone && <div className="text-xs text-gray-600 truncate">📱 {user.phone}</div>}
                                  {user.email && <div className="text-xs text-gray-600 truncate">✉️ {user.email}</div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* No Results Message */}
                      {showNoResults && (
                        <p className="text-xs text-gray-600 mt-1">
                          💡 No registered users found. You can manually enter coordinator details.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600">Phone Number</Label>
                      <Input
                        type="tel"
                        value={coord.phone}
                        onChange={(e) => {
                          const updated = [...editCoordinators];
                          updated[idx].phone = e.target.value;
                          setEditCoordinators(updated);
                        }}
                        placeholder="+91XXXXXXXXXX"
                        className="mt-1"
                        disabled={!!coord.user_id}
                      />
                      {coord.user_id && <p className="text-xs text-purple-600 mt-1">Auto-filled from user profile</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Email</Label>
                      <Input
                        type="email"
                        value={coord.email}
                        onChange={(e) => {
                          const updated = [...editCoordinators];
                          updated[idx].email = e.target.value;
                          setEditCoordinators(updated);
                        }}
                        placeholder="coordinator@example.com"
                        className="mt-1"
                        disabled={!!coord.user_id}
                      />
                      {coord.user_id && <p className="text-xs text-purple-600 mt-1">Auto-filled from user profile</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(editForm.tags || []).map((tag, index) => (
                  <div key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full flex items-center text-sm">
                    {tag}
                    <button
                      onClick={() => {
                        const newTags = editForm.tags.filter((_, i) => i !== index);
                        setEditForm({ ...editForm, tags: newTags });
                      }}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Enter a tag and press Enter..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim();
                    if (value && !editForm.tags?.includes(value)) {
                      setEditForm({ ...editForm, tags: [...(editForm.tags || []), value] });
                      e.target.value = '';
                    }
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-gray-500">Suggested:</span>
                {['School', 'Under 19', 'Veteran', '7s', '5s', '11s', 'Open', 'Women', 'Junior', 'Senior', 'Corporate', 'Inter-college'].map(tag => (
                  !editForm.tags?.includes(tag) && (
                    <button
                      key={tag}
                      onClick={() => {
                        if (!editForm.tags?.includes(tag)) {
                          setEditForm({ ...editForm, tags: [...(editForm.tags || []), tag] });
                        }
                      }}
                      className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  )
                ))}
              </div>
            </div>
            
            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter a brief description of the tournament"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Registration Fee</Label>
              <Input
                value={editForm.registrationFee}
                onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })}
                placeholder="Enter registration fee"
              />
            </div>
            
            <div>
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploadEdit}
                />
                {editForm.imagePreview && (
                  <ImageAvatar
                    src={editForm.imagePreview}
                    alt="Tournament Logo"
                    size="sm"
                    type="tournament"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDetailsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDetails}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Max Teams Reduction Warning Dialog */}
      <Dialog open={showMaxTeamsReductionWarning} onOpenChange={setShowMaxTeamsReductionWarning}>
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cannot Reduce Maximum Teams
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current Situation */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3">⚠️ Structural Inconsistency Detected</h4>
              <div className="space-y-2 text-sm text-red-800">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Currently Registered Teams:</span>
                  <span className="text-lg font-bold">{getTeamsForTournament(tournamentData.id).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">New Maximum Teams:</span>
                  <span className="text-lg font-bold">{maxTeamsReductionContext?.maxTeams || 0}</span>
                </div>
                <div className="border-t border-red-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Teams to Remove:</span>
                    <span className="text-lg font-bold text-red-600">
                      {getTeamsForTournament(tournamentData.id).length - parseInt(maxTeamsReductionContext?.maxTeams || '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>The new maximum number of teams ({maxTeamsReductionContext?.maxTeams || 0}) is less than the currently registered teams ({getTeamsForTournament(tournamentData.id).length}).</strong>
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                Please remove <strong>{getTeamsForTournament(tournamentData.id).length - parseInt(maxTeamsReductionContext?.maxTeams || '0')} team(s)</strong> before reducing the maximum limit.
              </p>
            </div>

            {/* Fixture Impact Warning (if fixtures exist) */}
            {(fixturesStatus === 'generated' || fixturesStatus === 'published') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📅 Fixture Impact</h4>
                <p className="text-sm text-blue-800">
                  Reducing maximum teams will reset future fixtures. Completed matches will remain recorded but the tournament structure will need to be recalculated.
                </p>
              </div>
            )}

            {/* Data Integrity Principles */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🛡️ Data Integrity Rules</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Teams will never be auto-deleted without your confirmation</li>
                <li>Completed match data will always be preserved</li>
                <li>Historical results remain intact unless tournament is reset</li>
              </ul>
            </div>

            {/* Required Action */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">✅ Required Action</h4>
              <p className="text-sm text-purple-800">
                To proceed with reducing the maximum teams:
              </p>
              <ol className="text-sm text-purple-800 mt-2 space-y-1 list-decimal list-inside ml-2">
                <li>Go to "Manage Teams" to remove teams</li>
                <li>Reduce registered teams to {maxTeamsReductionContext?.maxTeams || 0} or fewer</li>
                <li>Return to edit tournament {maxTeamsReductionContext?.source === 'format' ? 'format' : 'details'} and set new maximum</li>
              </ol>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMaxTeamsReductionWarning(false);
                setMaxTeamsReductionContext(null);
              }}
            >
              Cancel Changes
            </Button>
            <Button 
              onClick={() => {
                setShowMaxTeamsReductionWarning(false);
                // Close the appropriate dialog based on context
                if (maxTeamsReductionContext?.source === 'format') {
                  setShowEditFormatDialog(false);
                } else {
                  setShowEditDetailsDialog(false);
                }
                setShowManageTeamsDialog(true);
                setMaxTeamsReductionContext(null);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Go to Manage Teams
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Entry Request Dialog */}
      <Dialog open={showTeamEntryRequestDialog} onOpenChange={setShowTeamEntryRequestDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Request Team Entry
            </DialogTitle>
            <DialogDescription>
              Select a team to request entry into {tournamentData?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {userOwnedTeams.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">You don't own or coordinate any teams</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userOwnedTeams.map(team => {
                  const alreadyInTournament = getTeamsForTournament(tournamentData?.id || 0).some(t => t.id === team.id);
                  const requestStatus = teamEntryRequestStatuses[team.id];
                  const isSelected = selectedTeamForRequest === team.id;
                  
                  return (
                    <div
                      key={team.id}
                      onClick={() => {
                        if (!alreadyInTournament && !requestStatus) {
                          setSelectedTeamForRequest(team.id);
                        }
                      }}
                      className={`border rounded-lg p-3 transition-all ${
                        alreadyInTournament || requestStatus
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 cursor-pointer'
                          : 'border-gray-200 hover:border-purple-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ImageAvatar
                          src={team.imageUrl}
                          alt={team.name}
                          type="team"
                          size="sm"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{team.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.coach ? `Coach: ${team.coach}` : 'No coach assigned'}
                          </p>
                        </div>
                        {alreadyInTournament && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            In Tournament
                          </Badge>
                        )}
                        {requestStatus === 'pending' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            Pending
                          </Badge>
                        )}
                        {requestStatus === 'accepted' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Accepted
                          </Badge>
                        )}
                        {requestStatus === 'rejected' && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => {
                setShowTeamEntryRequestDialog(false);
                setSelectedTeamForRequest(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestTeamEntry}
              disabled={!selectedTeamForRequest}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Count Warning Dialog */}
      <Dialog open={showTeamCountWarning} onOpenChange={setShowTeamCountWarning}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <DialogTitle className="text-lg">Team Count Mismatch</DialogTitle>
            </div>
            <DialogDescription>
              The number of registered teams does not match the maximum number of teams configured.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Maximum Teams:</span>
                  <span className="font-medium text-yellow-900">{tournamentData.maxNumberOfTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Registered Teams:</span>
                  <span className="font-medium text-yellow-900">{getTeamsForTournament(tournamentData.id).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">⚠️ Warning</h4>
              <p className="text-sm text-blue-800">
                It is recommended to complete team registration before generating fixtures. 
                Fixtures generated with incomplete teams will be marked as <strong>"Draft / Incomplete Structure"</strong>.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTeamCountWarning(false);
                handleOpenManageTeams();
              }}
            >
              🔙 Go Back to Manage Teams
            </Button>
            <Button 
              onClick={handleProceedWithMismatch}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              ▶ Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Fixtures Confirmation Dialog */}
      <Dialog open={showPublishConfirmDialog} onOpenChange={setShowPublishConfirmDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <DialogTitle className="text-xl">Publish Tournament Fixtures</DialogTitle>
            </div>
            <DialogDescription>
              Review fixture details before publishing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Fixture Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                📋 Fixture Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Total Matches:</span>
                  <span className="font-semibold ml-2">{generatedFixtures.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="font-semibold ml-2">{formatTypeDisplay(tournamentData.tournamentFormat)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teams:</span>
                  <span className="font-semibold ml-2">{tournamentData.participatingTeams?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-semibold ml-2">
                    {tournamentData.startDate ? new Date(tournamentData.startDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* First and Last Match */}
            {generatedFixtures.length > 0 && (
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">First Match</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{generatedFixtures[0].homeTeam}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="font-medium">{generatedFixtures[0].awayTeam}</span>
                  </div>
                  {generatedFixtures[0].round && (
                    <p className="text-xs text-gray-500 mt-1">{generatedFixtures[0].round}</p>
                  )}
                </div>
                
                {generatedFixtures.length > 1 && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">Final Match</p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{generatedFixtures[generatedFixtures.length - 1].homeTeam}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-medium">{generatedFixtures[generatedFixtures.length - 1].awayTeam}</span>
                    </div>
                    {generatedFixtures[generatedFixtures.length - 1].round && (
                      <p className="text-xs text-gray-500 mt-1">{generatedFixtures[generatedFixtures.length - 1].round}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Notice
              </h4>
              <p className="text-sm text-yellow-800">
                Once published, the following <strong>cannot be modified</strong> without resetting the tournament:
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                <li>Tournament format (League/Knockout/Group Stage)</li>
                <li>Maximum number of teams</li>
                <li>Group configuration</li>
                <li>Qualification rules</li>
              </ul>
              <p className="text-sm text-yellow-800 mt-3">
                You <strong>can still</strong> reschedule individual matches and edit tournament details.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPublishConfirmDialog(false)}
            >
              ❌ Cancel
            </Button>
            <Button 
              onClick={handleConfirmPublish}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              ✅ Confirm & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Fixtures Warning Dialog */}
      <Dialog open={showRegenerateWarning} onOpenChange={setShowRegenerateWarning}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg">Regenerate Fixtures?</DialogTitle>
            </div>
            <DialogDescription>
              {fixturesStatus === 'published' ? 
                'Regenerating will unpublish and delete all fixtures, matches, and results.' :
                'Regenerating fixtures will delete all scheduled matches.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>All generated fixtures will be deleted</li>
                <li>Match schedule will be reset</li>
                <li>Any custom edits will be lost</li>
                {fixturesStatus === 'published' && <li>Tournament will be unpublished</li>}
                <li>Teams and tournament details will be preserved</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRegenerateWarning(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRegenerateFixtures}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Regenerate Fixtures
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentProfileScreen;
