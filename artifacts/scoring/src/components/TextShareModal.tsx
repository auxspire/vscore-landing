import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

interface TextShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const TextShareModal: React.FC<TextShareModalProps> = ({
  isOpen,
  onClose,
  title,
  content
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen && textAreaRef.current) {
      // Auto-select the text when modal opens
      textAreaRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 bg-white rounded-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info text */}
        <p className="text-sm text-gray-600 mb-3">
          Select the text below and copy it to share:
        </p>

        {/* Text area */}
        <textarea
          ref={textAreaRef}
          value={content}
          readOnly
          className="flex-1 w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[300px]"
          onClick={(e) => e.currentTarget.select()}
        />

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleCopy}
            className={`flex-1 gap-2 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Tip: Press Ctrl+A (or Cmd+A on Mac) to select all, then Ctrl+C (or Cmd+C) to copy
        </p>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default TextShareModal;