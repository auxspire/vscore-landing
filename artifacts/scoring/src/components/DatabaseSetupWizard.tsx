/**
 * Database Setup Wizard
 * Guides users through Supabase database setup
 */

import React, { useState } from 'react';
import { Database, Copy, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { getTableCreationSQL, SetupStatus } from '../utils/database/setupChecker';

interface DatabaseSetupWizardProps {
  setupStatus: SetupStatus;
  onSkip: () => void;
  onRetry: () => void;
}

export function DatabaseSetupWizard({ setupStatus, onSkip, onRetry }: DatabaseSetupWizardProps) {
  const [copied, setCopied] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const handleCopySQL = () => {
    const sql = getTableCreationSQL();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Database Setup Required</h2>
          </div>
          <p className="text-purple-100">
            VScor needs database tables to enable cloud sync
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 mb-1">
                  {setupStatus.message}
                </p>
                {setupStatus.missingTables.length > 0 && (
                  <p className="text-sm text-yellow-700">
                    Missing tables: <strong>{setupStatus.missingTables.join(', ')}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">Setup Steps:</h3>
            
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">Open Supabase Dashboard</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Go to your Supabase project and navigate to the SQL Editor
                  </p>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    Open Supabase
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">Copy SQL Script</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Click the button below to copy the table creation SQL
                  </p>
                  <button
                    onClick={handleCopySQL}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy SQL Script
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowSQL(!showSQL)}
                    className="ml-2 text-sm text-purple-600 hover:text-purple-700 underline"
                  >
                    {showSQL ? 'Hide' : 'Preview'} SQL
                  </button>

                  {showSQL && (
                    <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-40">
                      {getTableCreationSQL()}
                    </pre>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">Run SQL in Supabase</p>
                  <p className="text-sm text-gray-600">
                    Paste the SQL into the SQL Editor and click "Run" to create all tables
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">Verify Setup</p>
                  <p className="text-sm text-gray-600">
                    Return here and click "Check Setup" to verify tables were created
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Why is this needed?</strong> Figma Make cannot create database tables automatically.
              This is a one-time setup that enables cloud sync, multi-device access, and real-time collaboration.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Check Setup
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
          >
            Skip (Local Only)
          </button>
        </div>
      </div>
    </div>
  );
}
