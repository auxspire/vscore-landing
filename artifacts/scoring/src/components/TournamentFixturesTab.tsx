import React from 'react';
import { Calendar, Clock, MapPin, Check, AlertCircle, Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TournamentFixturesTabProps {
  generatedFixtures: any[];
  fixturesStatus: string;
  onMatchClick: (fixture: any) => void;
  onGenerateFixturesClick: () => void;
}

export function TournamentFixturesTab({
  generatedFixtures,
  fixturesStatus,
  onMatchClick,
  onGenerateFixturesClick
}: TournamentFixturesTabProps) {
  return (
    <div className="space-y-4">
      {/* Fixtures Status Header */}
      {generatedFixtures.length > 0 && (
        <div className={`rounded-lg p-4 ${
          fixturesStatus === 'published' ? 'bg-green-50 border border-green-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fixturesStatus === 'published' ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Published</h3>
                    <p className="text-sm text-green-700">Fixtures are live and structure is locked</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">Draft</h3>
                    <p className="text-sm text-yellow-700">Fixtures generated but not published yet</p>
                  </div>
                </>
              )}
            </div>
            <Badge className={
              fixturesStatus === 'published' ? 
              'bg-green-600 hover:bg-green-700' : 
              'bg-yellow-600 hover:bg-yellow-700'
            }>
              {generatedFixtures.length} Matches
            </Badge>
          </div>
        </div>
      )}

      {/* Fixtures List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {fixturesStatus === 'published' ? '🏆 Fixtures' : fixturesStatus === 'generated' ? '📝 Generated Fixtures (Draft)' : 'Fixtures'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedFixtures.length > 0 ? (
            <div className="space-y-4">
              {generatedFixtures.map((fixture, index) => (
                <div 
                  key={fixture.id}
                  onClick={() => onMatchClick(fixture)}
                  className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors relative"
                >
                  {/* Match Number & Date/Time */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium text-gray-900">Match #{index + 1}</span>
                      {fixture.date && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Calendar className="w-3 h-3 text-gray-600" />
                          <span className="text-gray-600">{fixture.date}</span>
                        </>
                      )}
                      {fixture.time && (
                        <>
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span className="text-gray-600">{fixture.time}</span>
                        </>
                      )}
                    </div>
                    <Badge variant="outline" className={`${
                      fixturesStatus === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {fixturesStatus === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  {/* Round/Stage Badge */}
                  {fixture.round && (
                    <div className="mb-3">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        {fixture.round}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Teams */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">{fixture.teamA || fixture.homeTeam}</span>
                    <span className="text-lg font-medium text-gray-400 px-3">vs</span>
                    <span className="font-medium text-lg text-right">{fixture.teamB || fixture.awayTeam}</span>
                  </div>
                  
                  {/* Venue */}
                  {fixture.venue && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{fixture.venue}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fixtures Yet</h3>
              <p className="text-gray-500 mb-4">
                {fixturesStatus === 'none' ? 
                  'Generate fixtures to create the match schedule for this tournament.' :
                  'No fixtures available.'}
              </p>
              {fixturesStatus === 'none' && (
                <Button
                  onClick={onGenerateFixturesClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate Fixtures
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
