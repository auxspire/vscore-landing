import React from 'react';
import { createPortal } from 'react-dom';
import { X, Image, FileText, BarChart3, List, Link2 } from 'lucide-react';
import { Button } from './ui/button';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShareScreenshot: () => void;
  onShareSummary: () => void;
  onShareDetails: () => void;
  onShareFullHistory: () => void;
  onCopyLiveLink?: () => void;
  isResultEntry?: boolean;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  onShareScreenshot,
  onShareSummary,
  onShareDetails,
  onShareFullHistory,
  onCopyLiveLink,
  isResultEntry = false
}) => {
  if (!isOpen) return null;

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6 space-y-4 animate-slide-up max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Match</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Options */}
        <div className="space-y-2">
          {onCopyLiveLink && (
            <Button
              onClick={() => {
                onCopyLiveLink();
                onClose();
              }}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Copy live link</p>
                <p className="text-xs text-gray-500">Anyone can watch without logging in</p>
              </div>
            </Button>
          )}

          {/* Always show Screenshot for both types */}
          <Button
            onClick={() => {
              onShareScreenshot();
              onClose();
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Share Screenshot</p>
              <p className="text-xs text-gray-500">Visual snapshot of match {isResultEntry ? 'result' : 'events'}</p>
            </div>
          </Button>

          {/* Always show Summary */}
          <Button
            onClick={() => {
              onShareSummary();
              onClose();
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Share Match Summary</p>
              <p className="text-xs text-gray-500">Brief text summary with final score</p>
            </div>
          </Button>

          {/* Always show Details */}
          <Button
            onClick={() => {
              onShareDetails();
              onClose();
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Share Match Details</p>
              <p className="text-xs text-gray-500">
                {isResultEntry 
                  ? 'Goal scorers and lineups' 
                  : 'Goal scorers, lineups, and stats'}
              </p>
            </div>
          </Button>

          {/* Only show Full Event History for live-scored matches */}
          {!isResultEntry && (
            <Button
              onClick={() => {
                onShareFullHistory();
                onClose();
              }}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <List className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Share Full Event History</p>
                <p className="text-xs text-gray-500">Complete timeline of all match events</p>
              </div>
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(dialogContent, document.body);
};

export default ShareDialog;