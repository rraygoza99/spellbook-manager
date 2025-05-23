import * as React from "react";
import Box from "@mui/material/Box";
import { OutlinedInput, TextField, Typography } from "@mui/material";
import { Button } from "@mui/material";
import { useState, useMemo } from "react";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { InputLabel } from "@mui/material";
import "./character-create.css";
import spellsData from "../../resources/modified_spells.json";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as spellSlotTables from "../../resources/spellSlotTables";
import SpellDetailsModal from "../spell-details-modal/spell-details-modal";

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

interface AbilityScores {
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface CharacterCreateProps {
  initialData?: any;
  onSave?: (character: any) => void;
}

export default function CharacterCreate(props: CharacterCreateProps) {
  const [characterName, setCharacterName] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [classLevels, setClassLevels] = useState<{ [classId: number]: number }>(
    {}
  );
  const [showFullSpells, setShowFullSpells] = useState(false);


  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  const [spellNameFilter, setSpellNameFilter] = useState("");
  const [selectedSpellTitles, setSelectedSpellTitles] = useState<string[]>([]);
  const [addedSpells, setAddedSpells] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<number[]>([]);
  const [classFilter, setClassFilter] = useState<number[]>([]);

  const [selectedAddedSpellTitles, setSelectedAddedSpellTitles] = useState<string[]>([]);

  const [showSpellTable, setShowSpellTable] = useState(true);

  const toggleSpellTableVisibility = () => {
    setShowSpellTable((prev) => !prev);
  };

  const [spellSlots, setSpellSlots] = useState<{ [level: number]: boolean[] }>({
    1: [false, false],
    2: [false, false],
    3: [false, false],
    4: [false, false],
    5: [false, false],
    6: [false],
    7: [false],
    8: [false],
    9: [false],
  });

  const [warlockSpellSlots, setWarlockSpellSlots] = useState<{ [level: number]: boolean[] }>({});

  const warlockSpellSlotsMemo = useMemo(() => warlockSpellSlots, [warlockSpellSlots]);

  const toggleSpellSlot = (level: number, index: number) => {
    setSpellSlots((prev) => {
      const currentSlots = prev[level] || Array.from({ length: getMulticlassSpellSlots()[level - 1] || 0 }).fill(false);
      const updatedSlots = [...currentSlots];
      updatedSlots[index] = !updatedSlots[index];
      return { ...prev, [level]: updatedSlots };
    });
  };

  const toggleWarlockSpellSlot = (level: number, index: number) => {
    setWarlockSpellSlots((prev) => {
      const currentSlots = prev[level] || Array.from({ length: getWarlockSpellSlots(level).slots }).fill(false);
      const updatedSlots = [...currentSlots];
      updatedSlots[index] = !updatedSlots[index];
      return { ...prev, [level]: updatedSlots };
    });
  };

  const resetSpellSlots = () => {
    setSpellSlots((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([level, slots]) => [
          level,
          slots.map(() => false),
        ])
      )
    );
  };

  const resetWarlockSpellSlots = () => {
    setWarlockSpellSlots({});
  };

  const handleClassSelectionChange = (event: SelectChangeEvent<number[]>) => {
    const {
      target: { value },
    } = event;

    const newSelectedIds = (
      typeof value === "string" ? value.split(",").map(Number) : value
    ) as number[];
    setSelectedClassIds(newSelectedIds);

    const newLevels = { ...classLevels };
    newSelectedIds.forEach((id) => {
      if (!(id in newLevels)) {
        newLevels[id] = 1;
      }
    });
    Object.keys(newLevels).forEach((keyStr) => {
      const numKey = Number(keyStr);
      if (!newSelectedIds.includes(numKey)) {
        delete newLevels[numKey];
      }
    });
    setClassLevels(newLevels);
  };

  const handleLevelChange = (classId: number, levelValue: string) => {
    const level = parseInt(levelValue, 10);
    if (!isNaN(level) && level >= 1) {
      setClassLevels((prevLevels) => ({
        ...prevLevels,
        [classId]: level,
      }));
    } else if (levelValue === "" || (level < 1 && !isNaN(level))) {
      setClassLevels((prevLevels) => ({
        ...prevLevels,
        [classId]: 1,
      }));
    }
  };

  const handleAbilityScoreChange = (
    ability: keyof AbilityScores,
    value: string
  ) => {
    const score = parseInt(value, 10);
    if (!isNaN(score) && score >= 1 && score <= 30) {
      setAbilityScores((prevScores) => ({
        ...prevScores,
        [ability]: score,
      }));
    } else if (value === "") {
      setAbilityScores((prevScores) => ({
        ...prevScores,
        [ability]: 10,
      }));
    }
  };

  const selectedClasses = selectedClassIds.map((id) => ({
    id: classOptions.find((c) => c.id === id)?.name || "",
    level: classLevels[id] || 1,
  }));

  function getSpellLevel(tags: string[]): number {
    const levelTag = tags.find((t) => t.match(/^\d+(st|nd|rd|th) level$/i));
    if (levelTag) return parseInt(levelTag, 10);
    if (tags.includes("Cantrips")) return 0;
    return -1;
  }

  function getSpellLevels(spells: any[]) {
    const levels = new Set<number>();
    spells.forEach((spell) => {
      if (typeof spell.spellLevel === "number" && spell.spellLevel >= 0) {
        levels.add(spell.spellLevel);
      }
    });
    return Array.from(levels).sort((a, b) => a - b);
  }

  function getClassSpellcastingAbility(className: string): keyof AbilityScores | null {
    switch (className) {
      case "Bard":
      case "Paladin":
      case "Sorcerer":
      case "Warlock":
        return "charisma";
      case "Cleric":
      case "Druid":
      case "Ranger":
        return "wisdom";
      case "Artificer":
      case "Wizard":
        return "intelligence";
      default:
        return null;
    }
  }

  function calculateMulticlassSpellcasterLevel(): number {
    let totalLevel = 0;

    selectedClasses.forEach((cls) => {
      if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(cls.id)) {
        totalLevel += cls.level;
      } else if (["Paladin", "Ranger"].includes(cls.id)) {
        totalLevel += Math.floor(cls.level / 2);
      } else if (["Fighter", "Rogue"].includes(cls.id)) {
        totalLevel += Math.floor(cls.level / 3);
      }
    });

    return Math.min(totalLevel, 20);
  }

  function getMulticlassSpellSlots(): number[] {
    const effectiveLevel = calculateMulticlassSpellcasterLevel();
    return spellSlotTables.multiclassSpellSlotsTable[effectiveLevel] || [];
  }

  function getArtificerSpellSlots(level: number): number[] {
    return spellSlotTables.artificerSpellSlotsTable[level] || [];
  }

  function getBardSpellSlots(level: number): number[] {
    return spellSlotTables.bardSpellSlotsTable[level] || [];
  }

  function getClericSpellSlots(level: number): number[] {
    return spellSlotTables.clericSpellSlotsTable[level] || [];
  }

  function getDruidSpellSlots(level: number): number[] {
    return spellSlotTables.druidSpellSlotsTable[level] || [];
  }

  function getPaladinSpellSlots(level: number): number[] {
    return spellSlotTables.paladinSpellSlotsTable[level] || [];
  }

  function getSorcererSpellSlots(level: number): number[] {
    return spellSlotTables.sorcererSpellSlotsTable[level] || [];
  }

  function getWarlockSpellSlots(level: number): { slots: number; slotLevel: number } {
    return spellSlotTables.warlockSpellSlotsTable[level] || { slots: 0, slotLevel: 0 };
  }

  function getWizardSpellSlots(level: number): number[] {
    return spellSlotTables.wizardSpellSlotsTable[level] || [];
  }

  function getProficiencyBonus(totalLevel: number): number {
    if (totalLevel >= 17) return 6;
    if (totalLevel >= 13) return 5;
    if (totalLevel >= 9) return 4;
    if (totalLevel >= 5) return 3;
    return 2;
  }

  function getTotalCharacterLevel(): number {
    return Object.values(classLevels).reduce((sum, level) => sum + level, 0);
  }

  function getSpellSaveDC(className: string): number | null {
    const ability = getClassSpellcastingAbility(className);
    if (!ability) return null;
    const abilityModifier = Math.floor((abilityScores[ability] - 10) / 2);
    const proficiencyBonus = getProficiencyBonus(getTotalCharacterLevel());
    return 8 + abilityModifier + proficiencyBonus;
  }

  function getSpellAttackBonus(className: string): number | null {
    const ability = getClassSpellcastingAbility(className);
    if (!ability) return null;
    const abilityModifier = Math.floor((abilityScores[ability] - 10) / 2);
    const proficiencyBonus = getProficiencyBonus(getTotalCharacterLevel());
    return abilityModifier + proficiencyBonus;
  }

  function getMaxSpellLevel(characterLevel: number): number {
    return Math.ceil(characterLevel / 2); // Calculate max spell level
  }

  const availableSpells = useMemo(() => {
    if (showFullSpells) {
      return spellsData.map((spell) => ({
        ...spell,
        spellLevel: getSpellLevel(spell.tags),
      })); // Include all spells from the dataset
    }
  
    const spells: any[] = [];
    for (const cls of selectedClasses) {
      for (const spell of spellsData) {
        const spellLevel = getSpellLevel(spell.tags);
        if (
          spell.tags.includes(cls.id) &&
          spellLevel !== -1 &&
          spellLevel <= cls.level
        ) {
          spells.push({ ...spell, spellLevel });
        }
      }
    }
  
    const unique = new Map();
    for (const s of spells) {
      unique.set(s.title, s);
    }
    return Array.from(unique.values()).sort(
      (a, b) => a.spellLevel - b.spellLevel || a.title.localeCompare(b.title)
    );
  }, [selectedClasses, spellsData, showFullSpells]);
  

  const filteredSpells = useMemo(() => {
    let spells = showFullSpells
      ? spellsData
          .map((spell) => ({
            ...spell,
            spellLevel: getSpellLevel(spell.tags),
          }))
          .filter((spell) => {
            // Ensure spells are filtered by max spell level
            const maxSpellLevel = getMaxSpellLevel(getTotalCharacterLevel());
            return spell.spellLevel !== -1 && spell.spellLevel <= maxSpellLevel;
          })
      : availableSpells.filter((spell) => {
          const maxSpellLevel = getMaxSpellLevel(getTotalCharacterLevel());
          return spell.spellLevel !== -1 && spell.spellLevel <= maxSpellLevel;
        });
  
    if (spellNameFilter.trim()) {
      const filter = spellNameFilter.trim().toLowerCase();
      spells = spells.filter((spell) =>
        spell.title.toLowerCase().includes(filter)
      );
    }
  
    if (levelFilter.length > 0) {
      spells = spells.filter((spell) => levelFilter.includes(spell.spellLevel));
    }
  
    return spells;
  }, [availableSpells, spellNameFilter, levelFilter, showFullSpells, selectedClasses]);

  const filteredAddedSpells = useMemo(() => {
    if (levelFilter.length === 0) return addedSpells;
    return addedSpells.filter((spell) => levelFilter.includes(spell.spellLevel));
  }, [addedSpells, levelFilter]);

  const handleSpellSelect = (title: string) => {
    setSelectedSpellTitles((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const handleAddSpells = () => {
    setAddedSpells((prev) => {
      const newSpells = [
        ...prev,
        ...filteredSpells.filter(
          (spell) =>
            selectedSpellTitles.includes(spell.title) &&
            !prev.some((s) => s.title === spell.title)
        ),
      ];
      const sortedSpells = newSpells.sort((a, b) => a.spellLevel - b.spellLevel);
      saveCharacterToLocalStorage(sortedSpells); // Save updated addedSpells to local storage
      return sortedSpells;
    });
    setSelectedSpellTitles([]);
  };

  const saveCharacterToLocalStorage = (updatedAddedSpells: any[]) => {
    const characterData = {
      characterName,
      selectedClassIds,
      classLevels,
      abilityScores,
      addedSpells: updatedAddedSpells,
    };
  
    let characterList: any[] = [];
    try {
      characterList = JSON.parse(localStorage.getItem("character-create-list") || "[]");
      if (!Array.isArray(characterList)) characterList = [];
    } catch {
      characterList = [];
    }
  
    const index = characterList.findIndex((c) => c.characterName === characterName);
    if (index !== -1) {
      characterList[index] = characterData;
    } else {
      characterList.push(characterData);
    }
  
    localStorage.setItem("character-create-list", JSON.stringify(characterList));
  };

  const handleRemoveAddedSpell = (title: string) => {
    setAddedSpells((prev) => {
      const updatedSpells = prev.filter((spell) => spell.title !== title);
      saveCharacterToLocalStorage(updatedSpells); // Save updated addedSpells to local storage
      return updatedSpells;
    });
  };

  const handleAddedSpellSelect = (title: string) => {
    setSelectedAddedSpellTitles((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const saveSpellSlotsToLocalStorage = (characterName: string) => {
    localStorage.setItem(`spell-slots-${characterName}`, JSON.stringify(spellSlots));
    localStorage.setItem(`warlock-spell-slots-${characterName}`, JSON.stringify(warlockSpellSlots));
  };

  const handleSaveToLocalStorage = () => {
    const characterData = {
      characterName,
      selectedClassIds,
      classLevels,
      abilityScores,
      addedSpells,
    };
    let arr: any[] = [];
    try {
      arr = JSON.parse(localStorage.getItem("character-create-list") || "[]");
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
    const idx = arr.findIndex((c) => c.characterName === characterName);
    if (idx !== -1) {
      arr[idx] = characterData;
    } else {
      arr.push(characterData);
    }
    localStorage.setItem("character-create-list", JSON.stringify(arr));

    saveSpellSlotsToLocalStorage(characterName);

    if (props.onSave) props.onSave(characterData);
  };

  const handleNewCharacter = () => {
    setCharacterName("");
    setSelectedClassIds([]);
    setClassLevels({});
    setAbilityScores({ intelligence: 10, wisdom: 10, charisma: 10 });
    setSpellNameFilter("");
    setSelectedSpellTitles([]);
    setAddedSpells([]);
    setLevelFilter([]);
  };

  React.useEffect(() => {
    if (props.initialData) {
      setCharacterName(props.initialData.characterName || "");
      setSelectedClassIds(props.initialData.selectedClassIds || []);
      setClassLevels(props.initialData.classLevels || {});
      setAbilityScores(props.initialData.abilityScores || { intelligence: 10, wisdom: 10, charisma: 10 });
      setAddedSpells(props.initialData.addedSpells || []);
      setSpellNameFilter("");
      setSelectedSpellTitles([]);
      setLevelFilter([]);
    }
  }, [props.initialData]);

  function getSpellDamage(spell: any): string {
    const damageMatch = spell.contents.find((content: string) =>
      content.match(/(\d+d\d+)/)
    );
    return damageMatch ? damageMatch.match(/(\d+d\d+)/)[0] : "";
  }
  function getSpellConcentration(spell: any): boolean {
    return spell.tags.includes("concentration");
  }

  function getDamageType(spell: any): string {
    const damageTypes = [
      "Acid",
      "Bludgeoning",
      "Cold",
      "Fire",
      "Force",
      "Lightning",
      "Necrotic",
      "Piercing",
      "Poison",
      "Psychic",
      "Radiant",
      "Slashing",
      "Thunder",
    ];
    const typeMatch = spell.contents.find((content: string) =>
      damageTypes.some((type) => content.includes(type))
    );
    return typeMatch
      ? damageTypes.find((type) => typeMatch.includes(type)) || "N/A"
      : "N/A";
  }

  function needsSavingThrow(spell: any): boolean {
    return spell.tags.includes("needs_save");
  }

  React.useEffect(() => {
    if (characterName) {
      const savedSpellSlots = localStorage.getItem(`spell-slots-${characterName}`);
      if (savedSpellSlots) {
        setSpellSlots(JSON.parse(savedSpellSlots));
      }
      const savedWarlockSpellSlots = localStorage.getItem(`warlock-spell-slots-${characterName}`);
      if (savedWarlockSpellSlots) {
        setWarlockSpellSlots(JSON.parse(savedWarlockSpellSlots));
      }
    }
  }, [characterName]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedSpells = useMemo(() => {
    if (!sortConfig) return filteredSpells;
  
    return [...filteredSpells].sort((a, b) => {
      if (sortConfig.key === 'title') {
        return sortConfig.direction === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      if (sortConfig.key === 'spellLevel') {
        return sortConfig.direction === 'asc'
          ? a.spellLevel - b.spellLevel
          : b.spellLevel - a.spellLevel;
      }
      return 0;
    });
  }, [filteredSpells, sortConfig]);
  
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const [selectedSpellDetails, setSelectedSpellDetails] = useState<any | null>(null); // State for modal

  const handleSpellClick = (spell: any) => {
    setSelectedSpellDetails(spell); // Set the selected spell details
  };

  const handleCloseModal = () => {
    setSelectedSpellDetails(null); // Close the modal
  };

  return (
    <Box className="character-create-container" sx={{ width: "100%" }}>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="character-form-content"
          id="character-form-header"
        >
          <Typography variant="h6">Character Form</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'block' }} component="form" className="form-container">
            <FormControl fullWidth margin="normal" className="name-input-control">
              <TextField
                id="name"
                label="Name"
                variant="outlined"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="class-select-label">Classes</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                multiple
                value={selectedClassIds}
                onChange={handleClassSelectionChange}
                input={<OutlinedInput label="Classes" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const classOption = classOptions.find((c) => c.id === id);
                      return (
                        <Chip
                          key={id}
                          label={classOption?.name}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {classOptions.map((classOption) => (
                  <MenuItem key={classOption.id} value={classOption.id}>
                    <Checkbox checked={selectedClassIds.indexOf(classOption.id) > -1} />
                    {classOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedClassIds.map((classId) => {
              const classOption = classOptions.find((c) => c.id === classId);
              if (!classOption) return null;

              return (
                <Box
                  key={classId}
                  className="level-input-container"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }, // Wrap on mobile screens
                  }}
                >
                  <Typography variant="subtitle1" className="level-label" sx={{ flexBasis: { xs: '100%', sm: 'auto' } }}>
                    {classOption.name} Level:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexBasis: { xs: '100%', sm: 'auto' } }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setClassLevels((prevLevels) => ({
                          ...prevLevels,
                          [classId]: Math.max(1, (prevLevels[classId] || 1) - 1),
                        }))
                      }
                      sx={{
                        minWidth: 30,
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        padding: 0,
                      }}
                    >
                      -
                    </Button>
                    <TextField
                      type="text"
                      variant="outlined"
                      size="small"
                      value={classLevels[classId] || 1}
                      onChange={(e) => {
                        const value = Math.min(20, Math.max(1, parseInt(e.target.value) || 1));
                        handleLevelChange(classId, value.toString());
                      }}
                      inputProps={{
                        min: 1,
                        max: 20,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                      }}
                      className="level-input"
                      sx={{ width: 60 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setClassLevels((prevLevels) => ({
                          ...prevLevels,
                          [classId]: (prevLevels[classId] || 1) + 1,
                        }))
                      }
                      sx={{
                        minWidth: 30,
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        padding: 0,
                      }}
                    >
                      +
                    </Button>
                  </Box>
                  <Typography variant="subtitle2" sx={{ marginLeft: 2 }}>
                    Spell Save DC: {getSpellSaveDC(classOption.name) ?? "N/A"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ marginLeft: 2 }}>
                    Spell Attack Bonus: {getSpellAttackBonus(classOption.name) ?? "N/A"}
                  </Typography>
                </Box>
              );
            })}
            <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 1 }}>
              Ability Scores
            </Typography>
            <Box className="ability-scores-container">
              <FormControl margin="normal" className="ability-score-form-control">
                <TextField
                  label="Intelligence"
                  type="number"
                  variant="outlined"
                  size="small"
                  value={abilityScores.intelligence}
                  onChange={(e) =>
                    handleAbilityScoreChange("intelligence", e.target.value)
                  }
                  inputProps={{ min: 1, max: 30 }}
                  className="ability-score-input"
                />
              </FormControl>
              <FormControl margin="normal" className="ability-score-form-control">
                <TextField
                  label="Wisdom"
                  type="number"
                  variant="outlined"
                  size="small"
                  value={abilityScores.wisdom}
                  onChange={(e) =>
                    handleAbilityScoreChange("wisdom", e.target.value)
                  }
                  inputProps={{ min: 1, max: 30 }}
                  className="ability-score-input"
                />
              </FormControl>
              <FormControl margin="normal" className="ability-score-form-control">
                <TextField
                  label="Charisma"
                  type="number"
                  variant="outlined"
                  size="small"
                  value={abilityScores.charisma}
                  onChange={(e) =>
                    handleAbilityScoreChange("charisma", e.target.value)
                  }
                  inputProps={{ min: 1, max: 30 }}
                  className="ability-score-input"
                />
              </FormControl>
            </Box>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSaveToLocalStorage}
              >
                Save Character
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleNewCharacter}
              >
                New Character
              </Button>
              
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      {availableSpells.length > 0 && (
        <Box className="slots-container" sx={{ display: 'block', marginBottom: 2, width: "100%", marginLeft: 4 }}>
          {/* Spell Slots */}
          <Box sx={{ marginBottom: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Spell Slots</Typography>
            {selectedClasses.length > 1 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Multiclass Spell Slots:
                </Typography>
                {getMulticlassSpellSlots().map((slotCount, level) => (
                  <Box key={level} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                      Level {level + 1}:
                    </Typography>
                    {Array.from({ length: slotCount }).map((_, index) => (
                      <Checkbox
                        key={index}
                        checked={spellSlots[level + 1]?.[index] || false}
                        onChange={() => toggleSpellSlot(level + 1, index)}
                        color="primary"
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            ) : null}

            {selectedClasses
              .filter((cls) => cls.id === "Warlock")
              .map((cls) => {
                const { slots, slotLevel } = getWarlockSpellSlots(cls.level);
                return (
                  <Box key={cls.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Warlock Pact Magic Slots (Level {slotLevel}):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ mr: 2 }}>
                        Slots:
                      </Typography>
                      {Array.from({ length: slots }).map((_, index) => (
                        <Checkbox
                          key={index}
                          checked={warlockSpellSlotsMemo[slotLevel]?.[index] || false}
                          onChange={() => toggleWarlockSpellSlot(slotLevel, index)}
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}

            {selectedClasses.length === 1 &&(
            selectedClasses
              .filter((cls) => cls.id !== "Warlock")
              .map((cls) => {
                const slots =
                  cls.id === "Artificer"
                    ? getArtificerSpellSlots(cls.level)
                    : cls.id === "Bard"
                    ? getBardSpellSlots(cls.level)
                    : cls.id === "Cleric"
                    ? getClericSpellSlots(cls.level)
                    : cls.id === "Druid"
                    ? getDruidSpellSlots(cls.level)
                    : cls.id === "Paladin"
                    ? getPaladinSpellSlots(cls.level)
                    : cls.id === "Sorcerer"
                    ? getSorcererSpellSlots(cls.level)
                    : cls.id === "Wizard"
                    ? getWizardSpellSlots(cls.level)
                    : [];

                return slots.map((slotCount, level) => (
                  <Box key={level} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                      Level {level + 1}:
                    </Typography>
                    {Array.from({ length: slotCount }).map((_, index) => (
                      <Checkbox
                        key={index}
                        checked={spellSlots[level + 1]?.[index] || false}
                        onChange={() => toggleSpellSlot(level + 1, index)}
                        color="primary"
                      />
                    ))}
                  </Box>
                ));
              }))}

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                resetSpellSlots();
                resetWarlockSpellSlots();
              }}
              sx={{ mt: 1 }}
            >
              Reset Slots
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            <Checkbox
              checked={showFullSpells}
              onChange={(e) => setShowFullSpells(e.target.checked)}
              color="primary"
            />
            <Typography variant="body2" sx={{ marginRight: 2 }}>
              Show Full Spells List
            </Typography>
            <TextField
              label="Filter by Spell Name"
              variant="outlined"
              size="small"
              value={spellNameFilter}
              onChange={(e) => setSpellNameFilter(e.target.value)}
              sx={{ width: 300, marginRight: 2 }}
            />
          </Box>
          <TextField
            select
            SelectProps={{
              multiple: true,
              renderValue: (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as any[]).map((lvl: number) => (
                    <Chip
                      key={lvl}
                      label={lvl === 0 ? "Cantrip" : lvl}
                      size="small"
                    />
                  ))}
                </Box>
              ),
            }}
            label="Filter by Level"
            value={levelFilter}
            onChange={(e) => {
              const value = e.target.value;
              setLevelFilter(Array.isArray(value) ? value.map(Number) : []);
            }}
            size="small"
            sx={{ width: 220, marginBottom: 2 }}
            placeholder="All Levels"
          >
            {getSpellLevels([...availableSpells, ...addedSpells]).map((lvl) => (
              <MenuItem key={lvl} value={lvl}>
                <Checkbox checked={levelFilter.indexOf(lvl) > -1} />
                {lvl === 0 ? "Cantrip" : lvl}
              </MenuItem>
            ))}
          </TextField>
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
            label="Filter by Class"
            value={classFilter}
            onChange={(e) => {
              const value = e.target.value;
              setClassFilter(Array.isArray(value) ? value.map(Number) : []);
            }}
            size="small"
            sx={{ width: 220, marginBottom: 2 }}
            placeholder="All Classes"
          >
            {classOptions.map((classOption) => (
              <MenuItem key={classOption.id} value={classOption.id}>
                <Checkbox checked={classFilter.indexOf(classOption.id) > -1} />
                {classOption.name}
              </MenuItem>
            ))}
            
          </TextField>
          <Button
              variant="contained"
              color="primary"
              onClick={handleAddSpells}
              disabled={selectedSpellTitles.length === 0}
            >
              Add Spells
            </Button>
          {/* Spellbook Table */}
          {addedSpells.length > 0 && (
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Spellbook</Typography>
              <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            filteredAddedSpells.length > 0 &&
                            filteredAddedSpells.every((spell) =>
                              selectedAddedSpellTitles.includes(spell.title)
                            )
                          }
                          indeterminate={
                            selectedAddedSpellTitles.length > 0 &&
                            selectedAddedSpellTitles.length < filteredAddedSpells.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddedSpellTitles(filteredAddedSpells.map((spell) => spell.title));
                            } else {
                              setSelectedAddedSpellTitles([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>Spell Name</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Needs concentration?</TableCell>
                      <TableCell>Damage</TableCell>
                      <TableCell>Damage Type</TableCell>
                      <TableCell>Saving Throw</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAddedSpells.length > 0 ? (
                      filteredAddedSpells.map((spell) => (
                        <TableRow
                          key={spell.title}
                          onClick={() => handleSpellClick(spell)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAddedSpellTitles.includes(spell.title)}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent modal from opening on checkbox click
                                handleAddedSpellSelect(spell.title);
                              }}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{spell.title}</TableCell>
                          <TableCell>
                            {spell.spellLevel === 0 ? "Cantrip" : spell.spellLevel}
                          </TableCell>
                          <TableCell>{getSpellConcentration(spell) ? "✔" : "✘"}</TableCell>
                          <TableCell>{getSpellDamage(spell)}</TableCell>
                          <TableCell>{getDamageType(spell)}</TableCell>
                          <TableCell>{needsSavingThrow(spell) ? "✔" : "✘"}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent modal from opening on button click
                                handleRemoveAddedSpell(spell.title);
                              }}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No spells found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={toggleSpellTableVisibility}
            sx={{ marginBottom: 2 }}
          >
            {showSpellTable ? "Hide Available Spells Table" : "Show Available Spells Table"}
          </Button>
          {showSpellTable && (
            <TableContainer component={Paper} sx={{ marginTop: 2, width: "100%" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                      Spell Name {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell onClick={() => handleSort('spellLevel')} style={{ cursor: 'pointer' }}>
                      Level {sortConfig?.key === 'spellLevel' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell>Needs concentration?</TableCell>
                    <TableCell>Damage</TableCell>
                    <TableCell>Damage Type</TableCell>
                    <TableCell>Saving Throw</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedSpells.length > 0 ? (
                    sortedSpells.map((spell) => (
                      <TableRow key={spell.title} onClick={() => handleSpellClick(spell)} style={{ cursor: "pointer" }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedSpellTitles.includes(spell.title)}
                            onChange={() => handleSpellSelect(spell.title)}
                            color="primary"
                            onClick={(e) => e.stopPropagation()} // Prevent modal from opening on checkbox click
                          />
                        </TableCell>
                        <TableCell>{spell.title}</TableCell>
                        <TableCell>
                          {spell.spellLevel === 0 ? "Cantrip" : spell.spellLevel}
                        </TableCell>
                        <TableCell>{getSpellConcentration(spell) ? "✔" : "✘"}</TableCell>
                        <TableCell>{getSpellDamage(spell)}</TableCell>
                        <TableCell>{getDamageType(spell)}</TableCell>
                        <TableCell>{needsSavingThrow(spell) ? "✔" : "✘"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No spells found.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
            
          </Box>
        </Box>
      )}
      <SpellDetailsModal
        spell={selectedSpellDetails}
        onClose={handleCloseModal}
        getSpellConcentration={getSpellConcentration}
        getSpellDamage={getSpellDamage}
        getDamageType={getDamageType}
        needsSavingThrow={needsSavingThrow}
      />
    </Box>
  );
}
