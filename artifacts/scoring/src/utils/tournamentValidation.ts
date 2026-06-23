// @ts-nocheck
/**
 * Tournament Validation Engine
 * 
 * Centralized validation logic for tournament configuration
 * Ensures data integrity across all edit dialogs
 */

import { getTeamsForTournament } from './teamManagement';
import { getTournamentState, isStructuralChange } from './tournamentFlexibility';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  requiresConfirmation?: boolean;
}

export interface MaxTeamsValidationOptions {
  tournamentId: string;
  newMaxTeams: number | string;
  currentMaxTeams?: number | string;
  fixturesStatus?: 'none' | 'generated' | 'published';
  allowReduction?: boolean;
}

/**
 * Validates Maximum Number of Teams
 * Core validation rule: Cannot reduce below currently registered teams
 */
export function validateMaxNumberOfTeams(options: MaxTeamsValidationOptions): ValidationResult {
  const { tournamentId, newMaxTeams, currentMaxTeams, fixturesStatus, allowReduction = false } = options;

  // Convert to number
  const maxTeams = typeof newMaxTeams === 'string' ? parseInt(newMaxTeams) : newMaxTeams;

  // Check if value is valid number
  if (isNaN(maxTeams) || !maxTeams) {
    return {
      isValid: false,
      error: 'Maximum number of teams must be a valid number.'
    };
  }

  // Minimum teams validation
  if (maxTeams < 2) {
    return {
      isValid: false,
      error: 'Maximum number of teams must be at least 2.'
    };
  }

  // Get current registered teams count
  const registeredTeams = getTeamsForTournament(tournamentId);
  const currentTeamsCount = registeredTeams.length;

  console.log('🔍 Max Teams Validation:', {
    tournamentId,
    newMaxTeams: maxTeams,
    currentMaxTeams,
    currentTeamsCount,
    fixturesStatus,
    allowReduction
  });

  // CRITICAL RULE: Cannot reduce below currently registered teams
  if (maxTeams < currentTeamsCount) {
    if (!allowReduction) {
      return {
        isValid: false,
        error: `Maximum number of teams cannot be less than currently registered teams (${currentTeamsCount}).`,
        requiresConfirmation: true
      };
    }
  }

  // Warning if reducing max teams but still above current count
  if (currentMaxTeams && maxTeams < parseInt(String(currentMaxTeams)) && maxTeams >= currentTeamsCount) {
    return {
      isValid: true,
      warning: `You are reducing the maximum number of teams from ${currentMaxTeams} to ${maxTeams}.`
    };
  }

  // Check if this is a structural change affecting fixtures
  if (fixturesStatus === 'published' && currentMaxTeams && maxTeams !== parseInt(String(currentMaxTeams))) {
    return {
      isValid: true,
      warning: 'Changing maximum number of teams may affect published fixtures.',
      requiresConfirmation: true
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validates date ranges
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  if (!startDate || !endDate) {
    return { isValid: true }; // Dates are optional
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return {
      isValid: false,
      error: 'End date cannot be earlier than start date.'
    };
  }

  return { isValid: true };
}

/**
 * Validates that published tournaments have required fields
 */
export function validatePublishedTournament(
  fixturesStatus: string,
  startDate: string
): ValidationResult {
  if (fixturesStatus === 'published' && !startDate) {
    return {
      isValid: false,
      error: 'Start date is required for published tournaments.'
    };
  }

  return { isValid: true };
}

/**
 * Validates tournament format configuration
 */
export function validateTournamentFormat(
  format: string,
  maxTeams: number | string,
  additionalConfig?: any
): ValidationResult {
  const teams = typeof maxTeams === 'string' ? parseInt(maxTeams) : maxTeams;

  if (isNaN(teams) || teams < 2) {
    return {
      isValid: false,
      error: 'Invalid number of teams for tournament format.'
    };
  }

  // Format-specific validations
  switch (format) {
    case 'knockout':
      // Knockout tournaments work with any number of teams (byes are calculated)
      return { isValid: true };

    case 'league_round_robin':
      if (teams < 2) {
        return {
          isValid: false,
          error: 'Round robin requires at least 2 teams.'
        };
      }
      return { isValid: true };

    case 'groups_with_knockout':
      if (additionalConfig) {
        const { numberOfGroups, teamsPerGroup } = additionalConfig;
        if (numberOfGroups && teamsPerGroup) {
          const totalTeamsNeeded = numberOfGroups * teamsPerGroup;
          if (teams < totalTeamsNeeded) {
            return {
              isValid: false,
              error: `Group configuration requires ${totalTeamsNeeded} teams, but maximum is set to ${teams}.`
            };
          }
        }
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
}

/**
 * Validates group configuration
 */
export function validateGroupConfiguration(
  numberOfGroups: number | string,
  teamsPerGroup: number | string,
  maxTeams: number | string
): ValidationResult {
  const groups = typeof numberOfGroups === 'string' ? parseInt(numberOfGroups) : numberOfGroups;
  const teamsInGroup = typeof teamsPerGroup === 'string' ? parseInt(teamsPerGroup) : teamsPerGroup;
  const totalMaxTeams = typeof maxTeams === 'string' ? parseInt(maxTeams) : maxTeams;

  if (isNaN(groups) || isNaN(teamsInGroup)) {
    return { isValid: true }; // Not fully configured yet
  }

  const totalTeamsNeeded = groups * teamsInGroup;

  if (totalTeamsNeeded > totalMaxTeams) {
    return {
      isValid: false,
      error: `Group configuration requires ${totalTeamsNeeded} teams, but maximum is set to ${totalMaxTeams}.`
    };
  }

  if (totalTeamsNeeded < totalMaxTeams) {
    return {
      isValid: true,
      warning: `Group configuration uses ${totalTeamsNeeded} teams, but ${totalMaxTeams - totalTeamsNeeded} slots will remain unused.`
    };
  }

  return { isValid: true };
}

/**
 * Master validation function - validates all tournament details
 */
export function validateTournamentDetails(details: {
  tournamentId: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  maxNumberOfTeams?: number | string;
  currentMaxTeams?: number | string;
  fixturesStatus?: 'none' | 'generated' | 'published';
  tournamentFormat?: string;
  numberOfGroups?: number | string;
  teamsPerGroup?: number | string;
}): ValidationResult {
  // Validate dates
  if (details.startDate && details.endDate) {
    const dateValidation = validateDateRange(details.startDate, details.endDate);
    if (!dateValidation.isValid) {
      return dateValidation;
    }
  }

  // Validate published tournament requirements
  if (details.fixturesStatus) {
    const publishedValidation = validatePublishedTournament(
      details.fixturesStatus,
      details.startDate || ''
    );
    if (!publishedValidation.isValid) {
      return publishedValidation;
    }
  }

  // Validate max number of teams
  if (details.maxNumberOfTeams) {
    const maxTeamsValidation = validateMaxNumberOfTeams({
      tournamentId: details.tournamentId,
      newMaxTeams: details.maxNumberOfTeams,
      currentMaxTeams: details.currentMaxTeams,
      fixturesStatus: details.fixturesStatus
    });
    if (!maxTeamsValidation.isValid) {
      return maxTeamsValidation;
    }
  }

  // Validate tournament format
  if (details.tournamentFormat && details.maxNumberOfTeams) {
    const formatValidation = validateTournamentFormat(
      details.tournamentFormat,
      details.maxNumberOfTeams,
      {
        numberOfGroups: details.numberOfGroups,
        teamsPerGroup: details.teamsPerGroup
      }
    );
    if (!formatValidation.isValid) {
      return formatValidation;
    }
  }

  return { isValid: true };
}

/**
 * Helper function to display validation result to user
 */
export function showValidationError(result: ValidationResult): void {
  if (result.error) {
    alert(result.error);
  }
}

/**
 * Helper function to check if validation requires user confirmation
 */
export function requiresUserConfirmation(result: ValidationResult): boolean {
  return result.requiresConfirmation || false;
}
