import { useState } from "react";
import { Player } from "@/services/nbaApi";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Scoreboard } from "@/components/Scoreboard";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { Activity } from "lucide-react";

const Index = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Advanced player statistics and trend analysis for sports betting
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Conditional Display: Home vs Player Dashboard */}
          {!selectedPlayer ? (
            <>
              {/* Scoreboard */}
              <Scoreboard />

              {/* Search Section */}
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-2xl font-display font-bold text-foreground">Find Your Player</h2>
                  <p className="text-muted-foreground">Search for any NBA player to view their stats and trends</p>
                </div>
                <PlayerSearch onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
              </div>
            </>
          ) : (
            <>
              {/* Back to Search */}
              <div className="flex flex-col items-center gap-4">
                <PlayerSearch onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
              </div>

              {/* Player Dashboard */}
              <PlayerDashboard player={selectedPlayer} />
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>NBA Betting Insights Dashboard • Data from NBA Stats API</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
