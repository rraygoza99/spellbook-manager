import React, { useState, useEffect, useRef } from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Popover,
  Snackbar,
  TextField,
  Typography,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RefreshIcon from "@mui/icons-material/Refresh";
import CasinoIcon from "@mui/icons-material/Casino";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import { useTheme } from "@mui/material/styles";
import "./riftbound-score.css";

const STORAGE_KEY = "riftbound-setup";

const LEGENDS = [
  { id: "OGN-247", name: "Kai'Sa" },
  { id: "OGN-249", name: "Legend" },
  { id: "OGN-251", name: "Legend" },
  { id: "OGN-253", name: "Legend" },
  { id: "OGN-255", name: "Ahri" },
  { id: "OGN-257", name: "Lee Sin" },
  { id: "OGN-259", name: "Legend" },
  { id: "OGN-261", name: "Legend" },
  { id: "OGN-263", name: "Legend" },
  { id: "OGN-265", name: "Viktor" },
  { id: "OGN-267", name: "Miss Fortune" },
  { id: "OGN-269", name: "Sett" },
  { id: "OGS-017", name: "Annie" },
  { id: "OGS-019", name: "Master Yi" },
  { id: "OGS-021", name: "Legend" },
  { id: "OGS-023", name: "Legend" },
  { id: "SFD-181", name: "Legend" },
  { id: "SFD-183", name: "Lucian" },
  { id: "SFD-185", name: "Draven" },
  { id: "SFD-187", name: "Rek'Sai" },
  { id: "SFD-189", name: "Ornn" },
  { id: "SFD-193", name: "Legend" },
  { id: "SFD-195", name: "Irelia" },
  { id: "SFD-197", name: "Azir" },
  { id: "SFD-199", name: "Ezreal" },
  { id: "SFD-201", name: "Legend" },
  { id: "SFD-203", name: "Sivir" },
  { id: "SFD-205", name: "Fiora" },
  { id: "UNL-181", name: "Legend" },
  { id: "UNL-183", name: "Rengar" },
  { id: "UNL-185", name: "Legend" },
  { id: "UNL-187", name: "Legend" },
  { id: "UNL-189", name: "Lillia" },
  { id: "UNL-191", name: "Master Yi" },
  { id: "UNL-193", name: "Vex" },
  { id: "UNL-195", name: "Legend" },
  { id: "UNL-197", name: "Diana" },
  { id: "UNL-199", name: "LeBlanc" },
  { id: "UNL-201", name: "Legend" },
  { id: "UNL-203", name: "Legend" },
];

function getLegendUrl(id: string): string {
  return `https://riftmana.com/wp-content/uploads/Legends/${id}.webp`;
}

type GameMode = "2p" | "solo" | "3p" | "4p";
type AppView = "setup" | "game";
type LogAction = "Conquer" | "Hold" | "+1" | "-1";

interface LogEntry {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  action: LogAction;
  score: number;
  gameTime: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
  xp: number;
  color: string;
  legendId: string | null;
}

interface SetupState {
  mode: GameMode;
  players: Player[];
  maxPoints: number;
  useXp: boolean;
}

const MODE_ORDER: GameMode[] = ["2p", "solo", "3p", "4p"];

const MODE_LABELS: Record<GameMode, string> = {
  "2p": "2 Players",
  solo: "Solo",
  "3p": "3 Players",
  "4p": "4 Players",
};

const PRESET_COLORS = [
  "#e63946",
  "#2979ff",
  "#00bcd4",
  "#ffd600",
  "#ff9800",
  "#4caf50",
  "#9c27b0",
  "#f1faee",
];

const DEFAULT_COLORS = ["#e63946", "#2979ff", "#4caf50", "#ffd600"];

const DEFAULT_NAMES: Record<GameMode, string[]> = {
  solo: ["Player 1"],
  "2p": ["Player 1", "Player 2"],
  "3p": ["Player 1", "Player 2", "Player 3"],
  "4p": ["Player 1", "Player 2", "Player 3", "Player 4"],
};

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makePlayers(mode: GameMode, existing: Player[] = []): Player[] {
  return DEFAULT_NAMES[mode].map((defaultName, i) => ({
    id: existing[i]?.id ?? genId(),
    name: existing[i]?.name ?? defaultName,
    score: 0,
    xp: 0,
    color: existing[i]?.color ?? DEFAULT_COLORS[i] ?? "#ffffff",
    legendId: existing[i]?.legendId ?? null,
  }));
}

function formatTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function tryVibrate(ms = 25) {
  if ("vibrate" in navigator) navigator.vibrate(ms);
}

function loadSetup(): SetupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SetupState>;
      if (parsed.mode && parsed.players) {
        return {
          mode: parsed.mode,
          players: (parsed.players as Player[]).map((p) => ({ ...p, score: 0, xp: 0, legendId: p.legendId ?? null })),
          maxPoints: parsed.maxPoints ?? 8,
          useXp: parsed.useXp ?? false,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { mode: "2p", players: makePlayers("2p"), maxPoints: 8, useXp: false };
}

// Player Panel

interface PlayerPanelProps {
  player: Player;
  flipped: boolean;
  maxPoints: number;
  useXp: boolean;
  onChangeScore: (id: string, delta: number) => void;
  onChangeXp: (id: string, delta: number) => void;
  onLogAction: (id: string, action: LogAction) => void;
}

function PlayerPanel({ player, flipped, maxPoints, useXp, onChangeScore, onChangeXp, onLogAction }: PlayerPanelProps) {
  const atMax = player.score >= maxPoints;
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      className={`rb-player-panel${flipped ? " rb-player-panel--flipped" : ""}`}
      style={{ background: `linear-gradient(160deg, ${isDark ? "#09091a" : "#f4f4f8"} 0%, ${player.color}1a 100%)` }}
    >
      {player.legendId && (
        <Box sx={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url(${getLegendUrl(player.legendId)})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: isDark ? 0.22 : 0.18,
        }} />
      )}
      <Box className="rb-player-badge" style={{ borderColor: `${player.color}55` }}>
        <Typography className="rb-player-badge-text">{player.name}</Typography>
      </Box>

      {useXp && (
        <Box className="rb-xp-bar">
          <Typography className="rb-xp-label">XP</Typography>
          <IconButton size="small" className="rb-xp-btn" onClick={() => onChangeXp(player.id, -1)}>
            <RemoveIcon sx={{ fontSize: 13 }} />
          </IconButton>
          <Typography className="rb-xp-value">{player.xp}</Typography>
          <IconButton size="small" className="rb-xp-btn" onClick={() => onChangeXp(player.id, 1)}>
            <AddIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, position: "relative", zIndex: 1, width: "100%" }}>
        {flipped ? (
          <>
            <Box className="rb-score-row">
              <IconButton className="rb-score-btn" onClick={() => { tryVibrate(); onLogAction(player.id, "-1"); }} disableRipple>
                <RemoveIcon className="rb-score-icon" />
              </IconButton>
              <Typography className="rb-score-number" style={{ color: atMax ? player.color : (isDark ? "#ffffff" : "#111111") }}>
                {player.score}
              </Typography>
              <IconButton className="rb-score-btn" onClick={() => { tryVibrate(); onLogAction(player.id, "+1"); }} disableRipple>
                <AddIcon className="rb-score-icon" />
              </IconButton>
            </Box>
            <Box className="rb-action-row">
              <Button className="rb-action-btn rb-conquer-btn" onClick={() => onLogAction(player.id, "Conquer")}>Conquer</Button>
              <Button className="rb-action-btn rb-hold-btn" onClick={() => onLogAction(player.id, "Hold")}>Hold</Button>
            </Box>
          </>
        ) : (
          <>
            <Box className="rb-score-row">
              <IconButton className="rb-score-btn" onClick={() => { tryVibrate(); onLogAction(player.id, "-1"); }} disableRipple>
                <RemoveIcon className="rb-score-icon" />
              </IconButton>
              <Typography className="rb-score-number" style={{ color: atMax ? player.color : (isDark ? "#ffffff" : "#111111") }}>
                {player.score}
              </Typography>
              <IconButton className="rb-score-btn" onClick={() => { tryVibrate(); onLogAction(player.id, "+1"); }} disableRipple>
                <AddIcon className="rb-score-icon" />
              </IconButton>
            </Box>
            <Box className="rb-action-row">
              <Button className="rb-action-btn rb-conquer-btn" onClick={() => onLogAction(player.id, "Conquer")}>Conquer</Button>
              <Button className="rb-action-btn rb-hold-btn" onClick={() => onLogAction(player.id, "Hold")}>Hold</Button>
            </Box>
          </>
        )}
      </Box>

      {maxPoints <= 14 && (
        <Box className="rb-dots">
          {Array.from({ length: maxPoints }, (_, i) => (
            <Box
              key={i}
              className="rb-dot"
              style={{ background: i < player.score ? player.color : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)") }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// Game View

interface GameViewProps {
  players: Player[];
  mode: GameMode;
  maxPoints: number;
  useXp: boolean;
  timer: number;
  timerRunning: boolean;
  tossOpen: boolean;
  tossMsg: string;
  log: LogEntry[];
  logOpen: boolean;
  onChangeScore: (id: string, delta: number) => void;
  onChangeXp: (id: string, delta: number) => void;
  onLogAction: (id: string, action: LogAction) => void;
  onToggleTimer: () => void;
  onReset: () => void;
  onToss: () => void;
  onCloseToss: () => void;
  onBack: () => void;
  onOpenLog: () => void;
  onCloseLog: () => void;
}

function GameView({ players, mode, maxPoints, useXp, timer, timerRunning, tossOpen, tossMsg, log, logOpen, onChangeScore, onChangeXp, onLogAction, onToggleTimer, onReset, onToss, onCloseToss, onBack, onOpenLog, onCloseLog }: GameViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const panel = (p: Player, flipped: boolean) => (
    <PlayerPanel key={p.id} player={p} flipped={flipped} maxPoints={maxPoints} useXp={useXp} onChangeScore={onChangeScore} onChangeXp={onChangeXp} onLogAction={onLogAction} />
  );

  const middleBar = (
    <Box className="rb-middle-bar">
      <Button
        size="small"
        onClick={onBack}
        startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 13 }} />}
        sx={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)", fontSize: "0.7rem", textTransform: "none", fontWeight: 700, minWidth: 0, px: 1 }}
      >
        Setup
      </Button>
      <Button
        className="rb-timer-pill"
        onClick={onToggleTimer}
        startIcon={timerRunning ? <PauseIcon sx={{ fontSize: 15 }} /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
      >
        {formatTime(timer)}
      </Button>
      <Box sx={{ flex: 1 }} />
      <IconButton className="rb-bar-icon-btn" onClick={onReset} size="small" title="Restart scores & log">
        <RefreshIcon sx={{ fontSize: 20, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)" }} />
      </IconButton>
      <IconButton className="rb-bar-icon-btn" onClick={onOpenLog} size="small" title="Game log">
        <Badge badgeContent={log.length || null} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16, padding: 0 } }}>
          <HistoryIcon sx={{ fontSize: 20, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)" }} />
        </Badge>
      </IconButton>
    </Box>
  );

  return (
    <Box className="rb-game-screen" sx={{
      '--rb-bg': isDark ? '#08080f' : '#f4f4f8',
      '--rb-text': isDark ? '#ffffff' : '#111111',
      '--rb-text-muted': isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
      '--rb-icon-color': isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)',
      '--rb-badge-bg': isDark ? 'rgba(10,10,30,0.85)' : 'rgba(255,255,255,0.92)',
      '--rb-badge-border': isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
      '--rb-score-btn-bg': isDark ? 'rgba(18,18,45,0.92)' : 'rgba(240,240,250,0.95)',
      '--rb-score-btn-border': isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
      '--rb-score-btn-color': isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
      '--rb-bar-bg': isDark ? '#0c0c1e' : '#ebebf5',
      '--rb-bar-border': isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
      '--rb-pill-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
      '--rb-pill-color': isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
      '--rb-panel-divider': isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
      '--rb-xp-bg': isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.08)',
    } as React.CSSProperties}>
      {mode === "solo" && <>{middleBar}{panel(players[0], false)}</>}
      {mode === "2p" && <>{panel(players[1], true)}{middleBar}{panel(players[0], false)}</>}
      {mode === "3p" && (
        <>
          <Box className="rb-panel-row">{panel(players[1], true)}{panel(players[2], true)}</Box>
          {middleBar}
          {panel(players[0], false)}
        </>
      )}
      {mode === "4p" && (
        <>
          <Box className="rb-panel-row">{panel(players[2], true)}{panel(players[3], true)}</Box>
          {middleBar}
          <Box className="rb-panel-row">{panel(players[0], false)}{panel(players[1], false)}</Box>
        </>
      )}
      <Snackbar
        open={tossOpen}
        autoHideDuration={3000}
        onClose={onCloseToss}
        message={tossMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ "& .MuiSnackbarContent-root": { fontSize: "1.1rem", fontWeight: 700 } }}
      />

      <Dialog
        open={logOpen}
        onClose={onCloseLog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: isDark ? "#0f0f22" : "#f4f4f8",
            borderRadius: 3,
            m: 2,
            maxHeight: "75vh",
          },
        }}
      >
        <DialogTitle sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Game Log
          <Typography sx={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontWeight: 400 }}>
            {log.length} {log.length === 1 ? "action" : "actions"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, px: 2, pb: 2 }}>
          {log.length === 0 ? (
            <Typography sx={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", fontSize: "0.88rem", textAlign: "center", py: 3 }}>
              No actions logged yet
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[...log].reverse().map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.9,
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: entry.playerColor, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: isDark ? "#fff" : "#111", flex: 1 }}>
                    {entry.playerName}
                  </Typography>
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: entry.action === "Conquer" || entry.action === "+1" ? "#4caf50" : entry.action === "-1" ? "#ef5350" : "#2979ff",
                    minWidth: 60,
                    textAlign: "right",
                  }}>
                    {entry.action}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", minWidth: 44, textAlign: "right" }}>
                    {entry.score}pts
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.3)", minWidth: 36, textAlign: "right" }}>
                    {formatTime(entry.gameTime)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Main component

export default function RiftboundScore() {
  const initial = loadSetup();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [view, setView] = useState<AppView>("setup");
  const [mode, setMode] = useState<GameMode>(initial.mode);
  const [players, setPlayers] = useState<Player[]>(initial.players);
  const [maxPoints, setMaxPoints] = useState<number>(initial.maxPoints);
  const [useXp, setUseXp] = useState<boolean>(initial.useXp);

  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [tossOpen, setTossOpen] = useState(false);
  const [tossMsg, setTossMsg] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const [colorPlayerId, setColorPlayerId] = useState<string | null>(null);
  const [legendPickerOpen, setLegendPickerOpen] = useState(false);
  const [legendPickerPlayerId, setLegendPickerPlayerId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const state: SetupState = { mode, players, maxPoints, useXp };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, players, maxPoints, useXp]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  function handleSwitchMode(m: GameMode) {
    setMode(m);
    setPlayers((prev) => makePlayers(m, prev));
  }

  function handleChangeScore(id: string, delta: number) {
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p));
  }

  function handleChangeXp(id: string, delta: number) {
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, xp: Math.max(0, p.xp + delta) } : p));
  }

  function handleLaunch() {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, xp: 0 })));
    setTimer(0);
    setTimerRunning(false);
    setView("game");
  }

  function handleResetPlayers() {
    setPlayers(makePlayers(mode));
  }

  function handleResetGame() {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, xp: 0 })));
    setTimer(0);
    setTimerRunning(false);
    setLog([]);
  }

  function handleToss() {
    setTossMsg(Math.random() < 0.5 ? "Heads!" : "Tails!");
    setTossOpen(true);
  }

  function handleLogAction(playerId: string, action: LogAction) {
    tryVibrate();
    const player = players.find((p) => p.id === playerId)!;
    let newScore = player.score;
    if (action === "Conquer" || action === "Hold" || action === "+1") {
      newScore = Math.min(player.score + 1, maxPoints);
    } else if (action === "-1") {
      newScore = Math.max(player.score - 1, 0);
    }
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, score: newScore } : p)));
    setLog((l) => [
      ...l,
      {
        id: genId(),
        playerId,
        playerName: player.name,
        playerColor: player.color,
        action,
        score: newScore,
        gameTime: timer,
      },
    ]);
  }

  function startEdit(player: Player) {
    setEditingId(player.id);
    setEditName(player.name);
  }

  function commitEdit(id: string) {
    if (editName.trim()) {
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: editName.trim() } : p)));
    }
    setEditingId(null);
  }

  function openColorPicker(e: React.MouseEvent<HTMLElement>, playerId: string) {
    setColorAnchorEl(e.currentTarget);
    setColorPlayerId(playerId);
  }

  function pickColor(color: string) {
    if (colorPlayerId) {
      setPlayers((prev) => prev.map((p) => (p.id === colorPlayerId ? { ...p, color } : p)));
    }
    setColorAnchorEl(null);
    setColorPlayerId(null);
  }

  function openLegendPicker(playerId: string) {
    setLegendPickerPlayerId(playerId);
    setLegendPickerOpen(true);
  }

  function pickLegend(legendId: string | null) {
    if (legendPickerPlayerId) {
      setPlayers((prev) => prev.map((p) => (p.id === legendPickerPlayerId ? { ...p, legendId } : p)));
    }
    setLegendPickerOpen(false);
    setLegendPickerPlayerId(null);
  }

  if (view === "game") {
    return (
      <GameView
        players={players}
        mode={mode}
        maxPoints={maxPoints}
        useXp={useXp}
        timer={timer}
        timerRunning={timerRunning}
        tossOpen={tossOpen}
        tossMsg={tossMsg}
        log={log}
        logOpen={logOpen}
        onChangeScore={handleChangeScore}
        onChangeXp={handleChangeXp}
        onLogAction={handleLogAction}
        onToggleTimer={() => setTimerRunning((r) => !r)}
        onReset={handleResetGame}
        onToss={handleToss}
        onCloseToss={() => setTossOpen(false)}
        onBack={() => setView("setup")}
        onOpenLog={() => setLogOpen(true)}
        onCloseLog={() => setLogOpen(false)}
      />
    );
  }

  return (
    <Box className="rb-setup" sx={{
      '--rb-bg': isDark ? '#08080f' : '#f4f4f8',
      '--rb-surface': isDark ? '#0f0f22' : '#ffffff',
      '--rb-surface2': isDark ? '#14142a' : '#e8e8f0',
      '--rb-surface3': isDark ? '#1c1c35' : '#d8d8e8',
      '--rb-text': isDark ? '#ffffff' : '#111111',
      '--rb-text-muted': isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
      '--rb-border': isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
      '--rb-border-subtle': isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
      '--rb-icon-color': isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)',
      '--rb-swatch-border': isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
      '--rb-swatch-hover': isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      '--rb-mode-active-bg': isDark ? '#2a2a4a' : '#d0d0e0',
      '--rb-reset-color': isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.35)',
    } as React.CSSProperties}>
      <Typography className="rb-setup-title" variant="h6">Create a Game</Typography>

      <Box className="rb-mode-tabs">
        {MODE_ORDER.map((m) => (
          <Button key={m} className={`rb-mode-btn${mode === m ? " rb-mode-btn--active" : ""}`} onClick={() => handleSwitchMode(m)}>
            {MODE_LABELS[m]}
          </Button>
        ))}
      </Box>

      <Typography className="rb-section-label">Players</Typography>
      <Box className="rb-players-list">
        {players.map((player) => (
          <Box key={player.id} className="rb-player-row">
            <Box
              className="rb-player-avatar"
              style={{ background: player.legendId ? "transparent" : player.color, cursor: "pointer", overflow: "hidden", position: "relative" }}
              onClick={() => openLegendPicker(player.id)}
            >
              {player.legendId ? (
                <img
                  src={getLegendUrl(player.legendId)}
                  alt="legend"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block", borderRadius: 8 }}
                />
              ) : (
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.6)", fontWeight: 700, textAlign: "center", lineHeight: 1.2, px: 0.5 }}>
                    Pick Legend
                  </Typography>
                </Box>
              )}
            </Box>
            <Box className="rb-player-name-area">
              {editingId === player.id ? (
                <TextField
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => commitEdit(player.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(player.id); }}
                  size="small"
                  variant="standard"
                  autoFocus
                  sx={{
                    "& .MuiInput-input": { color: isDark ? "#fff" : "#111", fontSize: "1.05rem", fontWeight: 700 },
                    "& .MuiInput-underline:before": { borderBottomColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)", borderBottomStyle: "dashed" },
                  }}
                />
              ) : (
                <Box className="rb-name-click-row" onClick={() => startEdit(player)}>
                  <Typography className="rb-player-name-text">{player.name}</Typography>
                  <EditIcon className="rb-edit-icon" />
                </Box>
              )}
            </Box>
            <Box className="rb-color-swatch" style={{ background: player.color }} onClick={(e) => openColorPicker(e, player.id)} />
          </Box>
        ))}
      </Box>

      <Typography className="rb-section-label">Advanced Options</Typography>
      <Box className="rb-options-card">
        <Box className="rb-option-row">
          <Typography className="rb-option-label">Max Points</Typography>
          <Box className="rb-stepper">
            <IconButton size="small" className="rb-stepper-btn" onClick={() => setMaxPoints((p) => Math.max(1, p - 1))}>
              <RemoveIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography className="rb-stepper-value">{maxPoints}</Typography>
            <IconButton size="small" className="rb-stepper-btn" onClick={() => setMaxPoints((p) => p + 1)}>
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
        <Box className="rb-option-row rb-option-row--last">
          <Typography className="rb-option-label">Use XP Tracker</Typography>
          <Switch checked={useXp} onChange={(e) => setUseXp(e.target.checked)} size="small" color="primary" />
        </Box>
      </Box>

      <Box className="rb-bottom-actions">
        <Button variant="contained" className="rb-launch-btn" onClick={handleLaunch}>Launch Game</Button>
        <Button className="rb-reset-btn" onClick={handleResetPlayers}>↺ Reset Players</Button>
      </Box>

      <Popover
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={() => setColorAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { background: isDark ? "#14142a" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`, borderRadius: 2 } }}
      >
        <Box sx={{ p: 1.5, display: "grid", gridTemplateColumns: "repeat(4, 32px)", gap: "8px" }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => pickColor(c)}
              sx={{
                width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer",
                border: `2px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                "&:hover": { border: `2px solid ${isDark ? "#fff" : "#333"}` },
                transition: "border 0.15s",
              }}
            />
          ))}
        </Box>
      </Popover>

      <Dialog
        open={legendPickerOpen}
        onClose={() => setLegendPickerOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: isDark ? "#0f0f22" : "#f4f4f8",
            borderRadius: 3,
            m: 2,
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Choose Legend
          <Button size="small" onClick={() => pickLegend(null)} sx={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontSize: "0.75rem", textTransform: "none", minWidth: 0 }}>
            No legend
          </Button>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", pb: 1 }}>
            {LEGENDS.map((legend) => (
              <Box
                key={legend.id}
                onClick={() => pickLegend(legend.id)}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  "&:hover": { borderColor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" },
                  transition: "border-color 0.15s",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <img
                  src={getLegendUrl(legend.id)}
                  alt={legend.name}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", objectPosition: "top", display: "block" }}
                />
                
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
