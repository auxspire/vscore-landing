// @ts-nocheck
import React, { useState, useEffect } from 'react';

/**
 * LiveTimer - Displays a live-updating timer for ongoing matches
 * Calculates elapsed time from match start timestamp
 */
interface LiveTimerProps {
  match: any;
  className?: string;
}

const LiveTimer: React.FC<LiveTimerProps> = ({ match, className = '' }) => {
  const [displayTime, setDisplayTime] = useState('00:00');
  
  useEffect(() => {
    // If match has ended, show the final time
    if (match.status === 'Completed' || match.status === 'finished') {
      const finalTime = match.currentTime || 'FT';
      setDisplayTime(finalTime);
      return;
    }
    
    // If match hasn't started yet (waiting for both scorers to confirm)
    if (match.matchStartStatus && match.matchStartStatus !== 'confirmed') {
      setDisplayTime('00:00');
      return;
    }
    
    // Calculate elapsed time
    const calculateElapsedTime = () => {
      // Use actualStartTime if available (for synchronized dual-scorer matches)
      if (match.actualStartTime) {
        const now = new Date();
        const start = new Date(match.actualStartTime);
        const elapsedSeconds = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      
      // Fallback to elapsedTime if no actualStartTime (legacy matches or paused matches)
      if (match.elapsedTime !== undefined && match.elapsedTime !== null) {
        const minutes = Math.floor(match.elapsedTime / 60);
        const seconds = match.elapsedTime % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      
      // Fallback to currentTime string if available
      if (match.currentTime) {
        return match.currentTime;
      }
      
      return '00:00';
    };
    
    // Update immediately
    setDisplayTime(calculateElapsedTime());
    
    // Only run interval for live matches with actualStartTime
    if (match.actualStartTime && match.status === 'Live') {
      const interval = setInterval(() => {
        setDisplayTime(calculateElapsedTime());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [match.actualStartTime, match.elapsedTime, match.currentTime, match.status, match.matchStartStatus]);
  
  return <span className={className}>{displayTime}</span>;
};

export default LiveTimer;
