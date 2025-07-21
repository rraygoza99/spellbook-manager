import React, { useState, createContext, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Box, Button, Typography, Switch, FormControlLabel, CssBaseline, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Checkbox, Chip } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CharacterCreate from "./components/character-create/character-create";
import spellsData from "./resources/modified_spells.json";

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

  const [showCustomSpellModal, setShowCustomSpellModal] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [customSpellData, setCustomSpellData] = useState({
    title: "",
    level: "Cantrips",
    school: "Evocation",
    castingTime: "Action",
    range: "30 feet",
    components: "V, S",
    duration: "Instantaneous",
    description: "",
    classes: [] as number[],
    concentration: false,
    damage: "",
    damageType: "",
    needsSave: false,
    ritual: false,
  });

  const handleCustomSpellChange = (field: string, value: any) => {
    setCustomSpellData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCustomSpell = () => {
    if (!customSpellData.title.trim()) return;

    const newSpell = {
      count: 1,
      color: "#4a6898",
      title: customSpellData.title,
      icon: "magic-swirl",
      icon_back: "magic-swirl",
      contents: [
        `subtitle | ${customSpellData.level === "Cantrips" ? `${customSpellData.school} Cantrip` : `Level ${customSpellData.level} ${customSpellData.school}`}`,
        "rule",
        `property | Casting Time | ${customSpellData.castingTime}${customSpellData.ritual ? " or Ritual" : ""}`,
        `property | Range | ${customSpellData.range}`,
        `property | Components | ${customSpellData.components}`,
        `property | Duration | ${customSpellData.concentration ? "Concentration, " : ""}${customSpellData.duration}`,
        "rule",
        `text | ${customSpellData.description}`,
        ...(customSpellData.damage ? [`damage | ${customSpellData.damage}`] : [])
      ],
      tags: [
        "spell",
        "Custom",
        customSpellData.level,
        customSpellData.school,
        ...customSpellData.classes.map(id => classOptions.find(c => c.id === id)?.name || "").filter(Boolean),
        ...(customSpellData.concentration ? ["concentration"] : []),
        ...(customSpellData.damage ? ["damage"] : []),
        ...(customSpellData.needsSave ? ["needs_save"] : []),
        ...(customSpellData.ritual ? ["ritual"] : [])
      ]
    };

    // Save to localStorage
    const existingCustomSpells = JSON.parse(localStorage.getItem("custom-spells") || "[]");
    existingCustomSpells.push(newSpell);
    localStorage.setItem("custom-spells", JSON.stringify(existingCustomSpells));

    // Reset form and close modal
    setCustomSpellData({
      title: "",
      level: "Cantrips",
      school: "Evocation",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "",
      classes: [],
      concentration: false,
      damage: "",
      damageType: "",
      needsSave: false,
      ritual: false,
    });
    setShowCustomSpellModal(false);
  };

  const handleClearAllData = () => {
    localStorage.removeItem("character-create-list");
    localStorage.removeItem("character-create-data");
    localStorage.removeItem("custom-spells");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("spell-slots-") || key.startsWith("warlock-spell-slots-")) {
        localStorage.removeItem(key);
      }
    });
    setShowClearDataConfirm(false);
    window.location.reload();
  };

  const handleExportData = () => {
    const exportData = {
      characters: JSON.parse(localStorage.getItem("character-create-list") || "[]"),
      customSpells: JSON.parse(localStorage.getItem("custom-spells") || "[]"),
      spellSlots: {} as any,
      warlockSpellSlots: {} as any,
      exportDate: new Date().toISOString()
    };

    // Export spell slots data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("spell-slots-")) {
        const characterName = key.replace("spell-slots-", "");
        exportData.spellSlots[characterName] = JSON.parse(localStorage.getItem(key) || "{}");
      } else if (key.startsWith("warlock-spell-slots-")) {
        const characterName = key.replace("warlock-spell-slots-", "");
        exportData.warlockSpellSlots[characterName] = JSON.parse(localStorage.getItem(key) || "{}");
      }
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `spellbook-manager-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(data);
        setShowImportConfirm(true);
      } catch (error) {
        alert("Invalid JSON file. Please select a valid export file.");
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importData) return;

    try {
      // Import characters
      if (importData.characters && Array.isArray(importData.characters)) {
        localStorage.setItem("character-create-list", JSON.stringify(importData.characters));
      }

      // Import custom spells
      if (importData.customSpells && Array.isArray(importData.customSpells)) {
        localStorage.setItem("custom-spells", JSON.stringify(importData.customSpells));
      }

      // Import spell slots
      if (importData.spellSlots && typeof importData.spellSlots === 'object') {
        Object.entries(importData.spellSlots).forEach(([characterName, slots]) => {
          localStorage.setItem(`spell-slots-${characterName}`, JSON.stringify(slots));
        });
      }

      // Import warlock spell slots
      if (importData.warlockSpellSlots && typeof importData.warlockSpellSlots === 'object') {
        Object.entries(importData.warlockSpellSlots).forEach(([characterName, slots]) => {
          localStorage.setItem(`warlock-spell-slots-${characterName}`, JSON.stringify(slots));
        });
      }

      setShowImportConfirm(false);
      setImportData(null);
      window.location.reload();
    } catch (error) {
      alert("Error importing data. Please check the file format.");
    }
  };

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
                color="primary"
                onClick={() => setShowCustomSpellModal(true)}
              >
                Add Custom Spell
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleExportData}
              >
                Export Data
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                component="label"
              >
                Import Data
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleImportFile}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowClearDataConfirm(true)}
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

          {/* Import Confirmation Modal */}
          <Dialog
            open={showImportConfirm}
            onClose={() => setShowImportConfirm(false)}
          >
            <DialogTitle>Confirm Import Data</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to import this data? This will replace:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 1 }}>
                <Typography component="li">All saved characters ({importData?.characters?.length || 0} characters)</Typography>
                <Typography component="li">All custom spells ({importData?.customSpells?.length || 0} spells)</Typography>
                <Typography component="li">All spell slot progress</Typography>
              </Box>
              <Typography color="warning.main">
                Your current data will be overwritten.
              </Typography>
              {importData?.exportDate && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Export date: {new Date(importData.exportDate).toLocaleString()}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowImportConfirm(false)}>Cancel</Button>
              <Button 
                onClick={handleConfirmImport}
                variant="contained"
                color="primary"
              >
                Import Data
              </Button>
            </DialogActions>
          </Dialog>

          {/* Clear Data Confirmation Modal */}
          <Dialog
            open={showClearDataConfirm}
            onClose={() => setShowClearDataConfirm(false)}
          >
            <DialogTitle>Confirm Clear All Data</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to clear all data? This will permanently delete:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 1 }}>
                <Typography component="li">All saved characters</Typography>
                <Typography component="li">All spell slot progress</Typography>
                <Typography component="li">All custom spells</Typography>
              </Box>
              <Typography color="error">
                This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowClearDataConfirm(false)}>Cancel</Button>
              <Button 
                onClick={handleClearAllData}
                variant="contained"
                color="error"
              >
                Clear All Data
              </Button>
            </DialogActions>
          </Dialog>

          {/* Custom Spell Modal */}
          <Dialog
            open={showCustomSpellModal}
            onClose={() => setShowCustomSpellModal(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Add Custom Spell</DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <TextField
                  label="Spell Name *"
                  value={customSpellData.title}
                  onChange={(e) => handleCustomSpellChange("title", e.target.value)}
                  fullWidth
                  required
                />
                
                <TextField
                  select
                  label="Level"
                  value={customSpellData.level}
                  onChange={(e) => handleCustomSpellChange("level", e.target.value)}
                  fullWidth
                >
                  <MenuItem value="Cantrips">Cantrip</MenuItem>
                  {[1,2,3,4,5,6,7,8,9].map(level => (
                    <MenuItem key={level} value={level.toString()}>{level}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="School"
                  value={customSpellData.school}
                  onChange={(e) => handleCustomSpellChange("school", e.target.value)}
                  fullWidth
                >
                  {["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"].map(school => (
                    <MenuItem key={school} value={school}>{school}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Casting Time"
                  value={customSpellData.castingTime}
                  onChange={(e) => handleCustomSpellChange("castingTime", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Range"
                  value={customSpellData.range}
                  onChange={(e) => handleCustomSpellChange("range", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Components"
                  value={customSpellData.components}
                  onChange={(e) => handleCustomSpellChange("components", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Duration"
                  value={customSpellData.duration}
                  onChange={(e) => handleCustomSpellChange("duration", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={customSpellData.description}
                  onChange={(e) => handleCustomSpellChange("description", e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                />

                <TextField
                  label="Damage (optional)"
                  value={customSpellData.damage}
                  onChange={(e) => handleCustomSpellChange("damage", e.target.value)}
                  fullWidth
                  placeholder="e.g., 3d6 fire damage"
                />

                <TextField
                  select
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((classId) => {
                          const classOption = classOptions.find((c) => c.id === classId);
                          return (
                            <Chip
                              key={classId}
                              label={classOption?.name}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    ),
                  }}
                  label="Available to Classes"
                  value={customSpellData.classes}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleCustomSpellChange("classes", Array.isArray(value) ? value.map(Number) : []);
                  }}
                  fullWidth
                >
                  {classOptions.map((classOption) => (
                    <MenuItem key={classOption.id} value={classOption.id}>
                      <Checkbox checked={customSpellData.classes.indexOf(classOption.id) > -1} />
                      {classOption.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Checkbox
                      checked={customSpellData.concentration}
                      onChange={(e) => handleCustomSpellChange("concentration", e.target.checked)}
                    />
                    <Typography>Concentration</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Checkbox
                      checked={customSpellData.needsSave}
                      onChange={(e) => handleCustomSpellChange("needsSave", e.target.checked)}
                    />
                    <Typography>Needs Saving Throw</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Checkbox
                      checked={customSpellData.ritual}
                      onChange={(e) => handleCustomSpellChange("ritual", e.target.checked)}
                    />
                    <Typography>Ritual</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCustomSpellModal(false)}>Cancel</Button>
              <Button 
                onClick={handleAddCustomSpell}
                variant="contained"
                disabled={!customSpellData.title.trim()}
              >
                Add Spell
              </Button>
            </DialogActions>
          </Dialog>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
