import React from "react";

interface SupabaseConfigErrorProps {
  missing: string[];
}

export default function SupabaseConfigError({ missing }: SupabaseConfigErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">VScor Scoring — setup required</h1>
        <p className="text-sm text-gray-600">
          The scoring app cannot connect to Supabase because required environment variables are
          missing.
        </p>
        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
          {missing.map((name) => (
            <li key={name}>
              <code className="text-xs bg-red-50 px-1 rounded">{name}</code>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-600">
          Set these in Vercel project settings or in{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">artifacts/scoring/.env.local</code>{" "}
          for local development, then redeploy.
        </p>
      </div>
    </div>
  );
}
