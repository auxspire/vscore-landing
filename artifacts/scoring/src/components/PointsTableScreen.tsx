import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { calculateStandings } from '../utils/tournamentStandings';

const PointsTableScreen = ({
  onBack,
  tournaments = [],
  completedMatches = [],
}) => {
  const [selectedId, setSelectedId] = React.useState(
    tournaments[0]?.id != null ? String(tournaments[0].id) : '',
  );

  const tournament = tournaments.find((t) => String(t.id) === selectedId);
  const tournamentMatches = completedMatches.filter(
    (m) => m.tournamentId != null && String(m.tournamentId) === selectedId,
  );
  const table = tournament ? calculateStandings(tournament, tournamentMatches) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button type="button" onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6 dark:text-white" />
          </button>
          <h1 className="text-xl font-medium dark:text-white">Points Table</h1>
        </div>
        {tournaments.length > 0 && (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="p-4">
        {!tournament ? (
          <p className="text-sm text-gray-500">Create a tournament to see standings.</p>
        ) : table.length === 0 ? (
          <p className="text-sm text-gray-500">No completed matches in this tournament yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">#</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">P</th>
                  <th className="p-3">W</th>
                  <th className="p-3">D</th>
                  <th className="p-3">L</th>
                  <th className="p-3">GD</th>
                  <th className="p-3">Pts</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.team} className="border-b last:border-0 dark:text-gray-100">
                    <td className="p-3">{row.position}</td>
                    <td className="p-3 font-medium">{row.team}</td>
                    <td className="p-3">{row.played}</td>
                    <td className="p-3">{row.won}</td>
                    <td className="p-3">{row.drawn}</td>
                    <td className="p-3">{row.lost}</td>
                    <td className="p-3">{row.goalDifference}</td>
                    <td className="p-3 font-semibold text-purple-600">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsTableScreen;
