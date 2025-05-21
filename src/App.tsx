import React, { useState, createContext, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Box, Button, Typography, Switch, FormControlLabel, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CharacterCreate from "./components/character-create/character-create";

function getCharacterByName(name: string) {
  try {
    const arr = JSON.parse(localStorage.getItem("character-create-list") || "[]");
    if (!Array.isArray(arr)) return null;
    return arr.find((c: any) => c.characterName === name) || null;
  } catch {
    return null;
  }
}

const classOptions = [
  { id: 0, name: "Artificer" },
  { id: 2, name: "Bard" },
  { id: 3, name: "Cleric" },
  { id: 4, name: "Druid" },
  { id: 7, name: "Paladin" },
  { id: 10, name: "Sorcerer" },
  { id: 11, name: "Warlock" },
  { id: 12, name: "Wizard" },
];

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function Home() {
  const [refresh, setRefresh] = useState(0);

  function getSavedCharacters(): any[] {
    const arr = localStorage.getItem("character-create-list");
    if (arr) {
      try {
        return JSON.parse(arr);
      } catch {
        return [];
      }
    }
    const single = localStorage.getItem("character-create-data");
    if (single) {
      try {
        return [JSON.parse(single)];
      } catch {
        return [];
      }
    }
    return [];
  }

  function handleDeleteCharacter(characterName: string) {
    let arr = getSavedCharacters();
    arr = arr.filter((c) => c.characterName !== characterName);
    localStorage.setItem("character-create-list", JSON.stringify(arr));
    
    localStorage.removeItem(`spell-slots-${characterName}`);
    localStorage.removeItem(`warlock-spell-slots-${characterName}`);
    
    setRefresh((r) => r + 1);
  }

  const savedCharacters = getSavedCharacters();

  function getClassNameById(id: number) {
    const found = classOptions.find((c) => c.id === id);
    return found ? found.name : id;
  }

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Saved Characters</Typography>
      <Box sx={{ maxWidth: 500, width: "100%" }}>
        {savedCharacters.length === 0 ? (
          <Typography color="text.secondary">No characters saved.</Typography>
        ) : (
          savedCharacters.map((char) => (
            <Box
              key={char.characterName}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                gap: 2,
                border: "1px solid #ddd",
                borderRadius: 1,
                p: 1,
                overflowX: "auto",
                flexWrap: "wrap"
              }}
            >
              <Typography sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <b>{char.characterName}</b>
                {char.selectedClassIds && char.selectedClassIds.length > 0 && (
                  <> — {char.selectedClassIds.map((id: number) =>
                    char.classLevels && char.classLevels[id]
                      ? `${getClassNameById(id)} (Lv${char.classLevels[id]})`
                      : getClassNameById(id)
                  ).join(", ")}</>
                )}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to={`/character-spellbook?character=${encodeURIComponent(char.characterName)}`}
              >
                Open
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDeleteCharacter(char.characterName)}
              >
                Delete
              </Button>
            </Box>
          ))
        )}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/character-spellbook"
          >
            New Character
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function CharacterCreateWithQuery() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const characterName = params.get("character");
  const [initialData, setInitialData] = useState<any | null>(null);

  React.useEffect(() => {
    if (characterName) {
      const data = getCharacterByName(characterName);
      setInitialData(data || null);
    } else {
      setInitialData(null);
    }
  }, [characterName]);

  return <CharacterCreate initialData={initialData} />;
}

function App() {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const newMode = prev === "light" ? "dark" : "light";
          localStorage.setItem("theme", newMode);
          return newMode;
        });
      },
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ width: "100%" }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Button component={Link} to="/home" sx={{ mr: 2 }}>
                Home
              </Button>
              <Button component={Link} to="/character-spellbook">
                Character Spellbook
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  localStorage.removeItem("character-create-list");
                  localStorage.removeItem("character-create-data");
                  Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith("spell-slots-") || key.startsWith("warlock-spell-slots-")) {
                      localStorage.removeItem(key);
                    }
                  });
                  window.location.reload();
                }}
              >
                Clear All Data
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === "dark"}
                    onChange={colorMode.toggleColorMode}
                    color="primary"
                  />
                }
                label={mode === "dark" ? "Dark" : "Light"}
              />
            </Box>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/character-spellbook" element={<CharacterCreateWithQuery />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Box>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
