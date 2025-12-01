import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame, Player } from "@/services/nbaApi";
import { Brain, Trophy, Activity, X, ChevronsUpDown } from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";

interface MatchPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: TodayGame | null;
}

export function MatchPredictionModal({ open, onOpenChange, game }: MatchPredictionModalProps) {
  const [homeMissingPlayers, setHomeMissingPlayers] = useState<Player[]>([]);
  const [awayMissingPlayers, setAwayMissingPlayers] = useState<Player[]>([]);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [awaySearchQuery, setAwaySearchQuery] = useState("");
  const [homePopoverOpen, setHomePopoverOpen] = useState(false);
  const [awayPopoverOpen, setAwayPopoverOpen] = useState(false);

  const homeTeamId = game ? getTeamCode(game.homeTeam) : "";
  const awayTeamId = game ? getTeamCode(game.awayTeam) : "";

  const { data: homeRoster = [] } = useQuery({
    queryKey: ["team-roster", homeTeamId],
    queryFn: () => nbaApi.getTeamRoster(homeTeamId),
    enabled: !!homeTeamId,
  });

  const { data: awayRoster = [] } = useQuery({
    queryKey: ["team-roster", awayTeamId],
    queryFn: () => nbaApi.getTeamRoster(awayTeamId),
    enabled: !!awayTeamId,
  });

  const homePlayerSearchResults = homeRoster.filter(player =>
    player.full_name.toLowerCase().includes(homeSearchQuery.toLowerCase())
  );

  const awayPlayerSearchResults = awayRoster.filter(player =>
    player.full_name.toLowerCase().includes(awaySearchQuery.toLowerCase())
  );

  const { data: prediction, isLoading, refetch } = useQuery({
    queryKey: ["match-prediction", homeTeamId, awayTeamId, homeMissingPlayers.map(p => p.id).join(","), awayMissingPlayers.map(p => p.id).join(",")],
    queryFn: () => nbaApi.predictMatch(homeTeamId, awayTeamId, homeMissingPlayers.map(p => p.id), awayMissingPlayers.map(p => p.id)),
    enabled: open && !!homeTeamId && !!awayTeamId,
  });

  const addHomeMissingPlayer = useCallback((player: Player) => {
    if (!homeMissingPlayers.find(p => p.id === player.id)) {
      setHomeMissingPlayers([...homeMissingPlayers, player]);
    }
    setHomeSearchQuery("");
    setHomePopoverOpen(false);
  }, [homeMissingPlayers]);

  const addAwayMissingPlayer = useCallback((player: Player) => {
    if (!awayMissingPlayers.find(p => p.id === player.id)) {
      setAwayMissingPlayers([...awayMissingPlayers, player]);
    }
    setAwaySearchQuery("");
    setAwayPopoverOpen(false);
  }, [awayMissingPlayers]);

  const removeHomeMissingPlayer = useCallback((playerId: number) => {
    setHomeMissingPlayers(homeMissingPlayers.filter(p => p.id !== playerId));
  }, [homeMissingPlayers]);

  const removeAwayMissingPlayer = useCallback((playerId: number) => {
    setAwayMissingPlayers(awayMissingPlayers.filter(p => p.id !== playerId));
  }, [awayMissingPlayers]);

  const getConfidenceBadgeColor = (confidence: string) => {
    const lower = confidence.toLowerCase();
    if (lower.includes("tight") || lower.includes("serré")) return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    if (lower.includes("solid") || lower.includes("solide")) return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
    if (lower.includes("blowout")) return "bg-red-500/20 text-red-700 border-red-500/30";
    return "bg-primary/20";
  };

  const getWinnerColor = (winner: string) => {
    return winner === game?.homeTeam ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-4 gap-4">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-purple-600" />
            Analyse IA <span className="text-muted-foreground text-base font-normal">- {game?.awayTeam} @ {game?.homeTeam}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : prediction ? (
          <div className="grid gap-3">
            {/* Top Row: Winner & Probability */}
            <Card className="bg-gradient-to-r from-purple-500/5 to-amber-500/5 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vainqueur Prédit</p>
                    <div className={`text-xl font-bold leading-tight ${getWinnerColor(prediction.predicted_winner)}`}>
                      {prediction.predicted_winner}
                    </div>
                  </div>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-xs text-muted-foreground mb-1">Confiance IA</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-bold text-lg">{prediction.win_probability_home.toFixed(0)}%</span>
                  </div>
                  <Progress value={prediction.win_probability_home} className="h-2 w-full mt-1" />
                </div>
              </CardContent>
            </Card>

            {/* Middle Row: Grid 2 Columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Spread & Confidence */}
              <Card className="p-3 flex flex-col justify-center bg-secondary/20">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">ÉCART & NIVEAU</span>
                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getConfidenceBadgeColor(prediction.confidence_level)}`}>
                    {prediction.confidence_level}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {prediction.predicted_winner === game?.homeTeam ? "+" : "-"}{Math.abs(prediction.details.spread_raw).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </Card>

              {/* Total Points */}
              <Card className="p-3 flex flex-col justify-center bg-secondary/20">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">SCORE TOTAL</span>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {prediction.predicted_total_points.toFixed(0)}
                  </span>
                  <span className="text-xs text-muted-foreground">pts combinés</span>
                </div>
              </Card>
            </div>

            {/* Net Rating Comparison (Compact) */}
            <div className="bg-secondary/30 rounded-md p-2 text-sm flex justify-between items-center px-4">
              <div className="text-left">
                <span className="block text-[10px] text-muted-foreground">{game?.homeTeam} Rating</span>
                <span className="font-bold text-purple-600">{prediction.details.home_net_rtg.toFixed(1)}</span>
              </div>
              <div className="text-xs font-medium text-muted-foreground">VS</div>
              <div className="text-right">
                <span className="block text-[10px] text-muted-foreground">{game?.awayTeam} Rating</span>
                <span className="font-bold text-amber-600">{prediction.details.away_net_rtg.toFixed(1)}</span>
              </div>
            </div>

            {/* Missing Players Selection */}
            <div className="space-y-4">
              {/* Home Missing Players */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">ABSENTS {game?.homeTeam}</label>
                <Popover open={homePopoverOpen} onOpenChange={setHomePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={homePopoverOpen}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="text-muted-foreground">
                        {homeMissingPlayers.length === 0 ? "Rechercher des joueurs..." : `${homeMissingPlayers.length} joueur(s) sélectionné(s)`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <Input
                        placeholder="Chercher par nom..."
                        value={homeSearchQuery}
                        onChange={(e) => setHomeSearchQuery(e.target.value)}
                        className="border-0 border-b rounded-none focus-visible:ring-0"
                      />
                      <CommandList>
                        <CommandEmpty>Aucun joueur trouvé.</CommandEmpty>
                        <CommandGroup>
                          {homePlayerSearchResults.map((player) => (
                            <CommandItem
                              key={player.id}
                              value={player.full_name}
                              onSelect={() => addHomeMissingPlayer(player)}
                              disabled={homeMissingPlayers.find(p => p.id === player.id) !== undefined}
                            >
                              {player.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {homeMissingPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {homeMissingPlayers.map((player) => (
                      <Badge key={player.id} variant="secondary" className="gap-1">
                        {player.full_name}
                        <button
                          onClick={() => removeHomeMissingPlayer(player.id)}
                          className="ml-1 hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Away Missing Players */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">ABSENTS {game?.awayTeam}</label>
                <Popover open={awayPopoverOpen} onOpenChange={setAwayPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={awayPopoverOpen}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="text-muted-foreground">
                        {awayMissingPlayers.length === 0 ? "Rechercher des joueurs..." : `${awayMissingPlayers.length} joueur(s) sélectionné(s)`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <Input
                        placeholder="Chercher par nom..."
                        value={awaySearchQuery}
                        onChange={(e) => setAwaySearchQuery(e.target.value)}
                        className="border-0 border-b rounded-none focus-visible:ring-0"
                      />
                      <CommandList>
                        <CommandEmpty>Aucun joueur trouvé.</CommandEmpty>
                        <CommandGroup>
                          {awayPlayerSearchResults.map((player) => (
                            <CommandItem
                              key={player.id}
                              value={player.full_name}
                              onSelect={() => addAwayMissingPlayer(player)}
                              disabled={awayMissingPlayers.find(p => p.id === player.id) !== undefined}
                            >
                              {player.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {awayMissingPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {awayMissingPlayers.map((player) => (
                      <Badge key={player.id} variant="secondary" className="gap-1">
                        {player.full_name}
                        <button
                          onClick={() => removeAwayMissingPlayer(player.id)}
                          className="ml-1 hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Absences Impact Display */}
            {prediction?.absences_impact && (homeMissingPlayers.length > 0 || awayMissingPlayers.length > 0) && (
              <div className="flex gap-2">
                {prediction.absences_impact.home_penalty > 0 && (
                  <Badge className="bg-red-500/20 text-red-700 border-red-500/30 flex-1 justify-center">
                    Impact {game?.homeTeam}: -{prediction.absences_impact.home_penalty.toFixed(1)} pts
                  </Badge>
                )}
                {prediction.absences_impact.away_penalty > 0 && (
                  <Badge className="bg-red-500/20 text-red-700 border-red-500/30 flex-1 justify-center">
                    Impact {game?.awayTeam}: -{prediction.absences_impact.away_penalty.toFixed(1)} pts
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              <Button onClick={() => refetch()} variant="outline" size="sm" className="flex-1 h-8 text-xs">
                Actualiser
              </Button>
              <Button onClick={() => onOpenChange(false)} size="sm" className="flex-1 h-8 text-xs">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Données indisponibles.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
