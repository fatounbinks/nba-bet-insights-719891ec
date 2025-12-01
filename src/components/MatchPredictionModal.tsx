import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Brain,
  Trophy,
  Activity,
  X,
  ChevronsUpDown,
  AlertCircle,
  Zap,
} from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";
import {
  getFatigueFactor,
  getRestBadge,
} from "@/lib/fatigueUtils";

interface MatchPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: TodayGame | null;
}

export function MatchPredictionModal({
  open,
  onOpenChange,
  game,
}: MatchPredictionModalProps) {
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

  const homePlayerSearchResults = homeRoster.filter((player) =>
    player.full_name.toLowerCase().includes(homeSearchQuery.toLowerCase())
  );

  const awayPlayerSearchResults = awayRoster.filter((player) =>
    player.full_name.toLowerCase().includes(awaySearchQuery.toLowerCase())
  );

  const {
    data: prediction,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "match-prediction",
      homeTeamId,
      awayTeamId,
      homeMissingPlayers.map((p) => p.id).join(","),
      awayMissingPlayers.map((p) => p.id).join(","),
    ],
    queryFn: () =>
      nbaApi.predictMatch(
        homeTeamId,
        awayTeamId,
        homeMissingPlayers.map((p) => p.id),
        awayMissingPlayers.map((p) => p.id)
      ),
    enabled: open && !!homeTeamId && !!awayTeamId,
  });

  const addHomeMissingPlayer = useCallback(
    (player: Player) => {
      if (!homeMissingPlayers.find((p) => p.id === player.id)) {
        setHomeMissingPlayers([...homeMissingPlayers, player]);
      }
      setHomeSearchQuery("");
      setHomePopoverOpen(false);
    },
    [homeMissingPlayers]
  );

  const addAwayMissingPlayer = useCallback(
    (player: Player) => {
      if (!awayMissingPlayers.find((p) => p.id === player.id)) {
        setAwayMissingPlayers([...awayMissingPlayers, player]);
      }
      setAwaySearchQuery("");
      setAwayPopoverOpen(false);
    },
    [awayMissingPlayers]
  );

  const removeHomeMissingPlayer = useCallback(
    (playerId: number) => {
      setHomeMissingPlayers(homeMissingPlayers.filter((p) => p.id !== playerId));
    },
    [homeMissingPlayers]
  );

  const removeAwayMissingPlayer = useCallback(
    (playerId: number) => {
      setAwayMissingPlayers(awayMissingPlayers.filter((p) => p.id !== playerId));
    },
    [awayMissingPlayers]
  );

  const getConfidenceBadgeColor = (confidence: string) => {
    const lower = confidence.toLowerCase();
    if (lower.includes("tight") || lower.includes("serré"))
      return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    if (lower.includes("solid") || lower.includes("solide"))
      return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
    if (lower.includes("blowout"))
      return "bg-red-500/20 text-red-700 border-red-500/30";
    return "bg-primary/20";
  };

  const getWinnerColor = (winner: string) => {
    return winner === game?.homeTeam
      ? "text-purple-600 dark:text-purple-400"
      : "text-amber-600 dark:text-amber-400";
  };

  const renderTeamHeader = (
    teamName: string | undefined,
    fatigueFactors: string[] | undefined,
    position: "home" | "away"
  ) => {
    const factors = fatigueFactors || [];
    const hasFactors = factors.length > 0;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{teamName}</h3>
          {position === "home" && (
            <span className="text-xs text-muted-foreground">(Domicile)</span>
          )}
          {position === "away" && (
            <span className="text-xs text-muted-foreground">(Extérieur)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasFactors ? (
            factors.map((factor, idx) => {
              const fatigueInfo = getFatigueFactor(factor);
              return (
                <Badge
                  key={idx}
                  className={`text-xs py-1 px-2 border ${fatigueInfo.bgColor} ${fatigueInfo.color}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fatigueInfo.icon} {fatigueInfo.name}
                </Badge>
              );
            })
          ) : (
            <Badge
              className={`text-xs py-1 px-2 border ${
                getRestBadge().bgColor
              } ${getRestBadge().color}`}
            >
              {getRestBadge().icon} {getRestBadge().name}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-4 gap-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Analyse IA Pro</span>
            <span className="text-muted-foreground text-sm font-normal ml-auto">
              {game?.awayTeam} @ {game?.homeTeam}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : prediction ? (
          <div className="grid gap-4">
            {/* Fatigue Context Analysis - Home and Away Teams */}
            {prediction.context_analysis && (
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 border-l-4 border-l-purple-500">
                  {renderTeamHeader(
                    game?.homeTeam,
                    prediction.context_analysis.home_fatigue_factors,
                    "home"
                  )}
                </Card>
                <Card className="p-3 border-l-4 border-l-amber-500">
                  {renderTeamHeader(
                    game?.awayTeam,
                    prediction.context_analysis.away_fatigue_factors,
                    "away"
                  )}
                </Card>
              </div>
            )}

            {/* Prediction Result - Winner & Margin */}
            <Card className="bg-gradient-to-r from-purple-500/5 to-amber-500/5 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Vainqueur Prédit
                    </p>
                    <p
                      className={`text-2xl font-bold leading-tight ${getWinnerColor(
                        prediction.predicted_winner
                      )}`}
                    >
                      {prediction.predicted_winner}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Marge</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{Math.abs(prediction.details.spread_raw).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </CardContent>
            </Card>

            {/* Confidence & Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Confidence Level */}
              <Card className="p-3 flex flex-col justify-between bg-secondary/20">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    CONFIANCE IA
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1 py-0 ${getConfidenceBadgeColor(
                      prediction.confidence_level
                    )}`}
                  >
                    {prediction.confidence_level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {prediction.win_probability_home.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={prediction.win_probability_home}
                  className="h-2 w-full mt-2"
                />
              </Card>

              {/* Total Points */}
              <Card className="p-3 flex flex-col justify-between bg-secondary/20">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    TOTAL
                  </span>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {prediction.predicted_total_points.toFixed(0)}
                  </span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </Card>
            </div>

            {/* Net Rating Comparison */}
            <Card className="p-3 bg-secondary/30">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <span className="block text-[10px] text-muted-foreground font-semibold mb-1">
                    {game?.homeTeam}
                  </span>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                    {prediction.details.home_net_rtg.toFixed(1)}
                  </span>
                  <p className="text-xs text-muted-foreground">Net Rating</p>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <Zap className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs font-semibold text-muted-foreground">VS</p>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground font-semibold mb-1">
                    {game?.awayTeam}
                  </span>
                  <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                    {prediction.details.away_net_rtg.toFixed(1)}
                  </span>
                  <p className="text-xs text-muted-foreground">Net Rating</p>
                </div>
              </div>
            </Card>

            {/* Absences Impact - If players are missing */}
            {prediction.absences_impact &&
              (homeMissingPlayers.length > 0 ||
                awayMissingPlayers.length > 0) && (
                <Card className="p-3 border-l-4 border-l-red-500 bg-red-500/5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      IMPACT DES ABSENCES
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {prediction.absences_impact.home_penalty > 0 && (
                        <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
                          <span className="text-xs font-medium">
                            {game?.homeTeam}
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            -{prediction.absences_impact.home_penalty.toFixed(1)}{" "}
                            pts
                          </span>
                        </div>
                      )}
                      {prediction.absences_impact.away_penalty > 0 && (
                        <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
                          <span className="text-xs font-medium">
                            {game?.awayTeam}
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            -{prediction.absences_impact.away_penalty.toFixed(1)}{" "}
                            pts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

            {/* Missing Players Selection */}
            <div className="space-y-4 border-t pt-4">
              {/* Home Missing Players */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  JOUEURS ABSENTS - {game?.homeTeam}
                </label>
                <Popover
                  open={homePopoverOpen}
                  onOpenChange={setHomePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={homePopoverOpen}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="text-muted-foreground">
                        {homeMissingPlayers.length === 0
                          ? "Ajouter des joueurs..."
                          : `${homeMissingPlayers.length} joueur(s) sélectionné(s)`}
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
                              disabled={
                                homeMissingPlayers.find(
                                  (p) => p.id === player.id
                                ) !== undefined
                              }
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
                      <Badge
                        key={player.id}
                        variant="secondary"
                        className="gap-1"
                      >
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
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  JOUEURS ABSENTS - {game?.awayTeam}
                </label>
                <Popover
                  open={awayPopoverOpen}
                  onOpenChange={setAwayPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={awayPopoverOpen}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="text-muted-foreground">
                        {awayMissingPlayers.length === 0
                          ? "Ajouter des joueurs..."
                          : `${awayMissingPlayers.length} joueur(s) sélectionné(s)`}
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
                              disabled={
                                awayMissingPlayers.find(
                                  (p) => p.id === player.id
                                ) !== undefined
                              }
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
                      <Badge
                        key={player.id}
                        variant="secondary"
                        className="gap-1"
                      >
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

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                Actualiser
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                size="sm"
                className="flex-1 h-8 text-xs"
              >
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
