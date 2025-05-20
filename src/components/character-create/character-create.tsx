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

  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  // Add state for spell name filter
  const [spellNameFilter, setSpellNameFilter] = useState("");
  const [selectedSpellTitles, setSelectedSpellTitles] = useState<string[]>([]);
  const [addedSpells, setAddedSpells] = useState<any[]>([]);
  // Change levelFilter to support multiple levels
  const [levelFilter, setLevelFilter] = useState<number[]>([]);
  const [classFilter, setClassFilter] = useState<number[]>([]); // Add state for class filter

  // State for bulk selection of added spells
  const [selectedAddedSpellTitles, setSelectedAddedSpellTitles] = useState<string[]>([]);

  // For select/deselect all logic

  const [showSpellTable, setShowSpellTable] = useState(true); // State to toggle spell table visibility

  const toggleSpellTableVisibility = () => {
    setShowSpellTable((prev) => !prev);
  };

  // State for spell slots
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

  // Separate state for Warlock spell slots
  const [warlockSpellSlots, setWarlockSpellSlots] = useState<{ [level: number]: boolean[] }>({});

  // Memoize Warlock spell slots to avoid unnecessary re-renders
  const warlockSpellSlotsMemo = useMemo(() => warlockSpellSlots, [warlockSpellSlots]);

  // Optimized handler to toggle a spell slot
  const toggleSpellSlot = (level: number, index: number) => {
    setSpellSlots((prev) => {
      const currentSlots = prev[level] || Array.from({ length: getMulticlassSpellSlots()[level - 1] || 0 }).fill(false);
      const updatedSlots = [...currentSlots];
      updatedSlots[index] = !updatedSlots[index];
      return { ...prev, [level]: updatedSlots };
    });
  };

  // Optimized handler to toggle a Warlock spell slot
  const toggleWarlockSpellSlot = (level: number, index: number) => {
    setWarlockSpellSlots((prev) => {
      const currentSlots = prev[level] || Array.from({ length: getWarlockSpellSlots(level).slots }).fill(false);
      const updatedSlots = [...currentSlots];
      updatedSlots[index] = !updatedSlots[index];
      return { ...prev, [level]: updatedSlots };
    });
  };

  // Handler to reset all spell slots
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

  // Optimized handler to reset Warlock spell slots
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
    // Initialize newly selected classes with level 1
    newSelectedIds.forEach((id) => {
      if (!(id in newLevels)) {
        newLevels[id] = 1; // Default level
      }
    });
    // Remove levels for deselected classes
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
      // If input is cleared or invalid (e.g., 0 or negative), reset to 1
      // Or handle as per your specific validation rules (e.g. allow temporary empty)
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
      // D&D scores typically 1-30
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

  // Helper to get all spell levels present in a spell list
  function getSpellLevels(spells: any[]) {
    const levels = new Set<number>();
    spells.forEach((spell) => {
      if (typeof spell.spellLevel === "number" && spell.spellLevel >= 0) {
        levels.add(spell.spellLevel);
      }
    });
    return Array.from(levels).sort((a, b) => a - b);
  }

  // Helper to get the spellcasting ability for a class
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

  // Artificer spell slots table
  const artificerSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [2],
    3: [3],
    4: [3],
    5: [4, 2],
    6: [4, 2],
    7: [4, 3],
    8: [4, 3],
    9: [4, 3, 2],
    10: [4, 3, 2],
    11: [4, 3, 3],
    12: [4, 3, 3],
    13: [4, 3, 3, 1],
    14: [4, 3, 3, 1],
    15: [4, 3, 3, 2],
    16: [4, 3, 3, 2],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2],
  };

  // Bard spell slots table
  const bardSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Cleric spell slots table
  const clericSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Druid spell slots table
  const druidSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Paladin spell slots table
  const paladinSpellSlotsTable: { [level: number]: number[] } = {
    1: [],
    2: [2],
    3: [3],
    4: [3],
    5: [4, 2],
    6: [4, 2],
    7: [4, 3],
    8: [4, 3],
    9: [4, 3, 2],
    10: [4, 3, 2],
    11: [4, 3, 3],
    12: [4, 3, 3],
    13: [4, 3, 3, 1],
    14: [4, 3, 3, 1],
    15: [4, 3, 3, 2],
    16: [4, 3, 3, 2],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2],
  };

  // Sorcerer spell slots table
  const sorcererSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Warlock spell slots table
  const warlockSpellSlotsTable: { [level: number]: { slots: number; slotLevel: number } } = {
    1: { slots: 1, slotLevel: 1 },
    2: { slots: 2, slotLevel: 1 },
    3: { slots: 2, slotLevel: 2 },
    4: { slots: 2, slotLevel: 2 },
    5: { slots: 2, slotLevel: 3 },
    6: { slots: 2, slotLevel: 3 },
    7: { slots: 2, slotLevel: 4 },
    8: { slots: 2, slotLevel: 4 },
    9: { slots: 2, slotLevel: 5 },
    10: { slots: 2, slotLevel: 5 },
    11: { slots: 3, slotLevel: 5 },
    12: { slots: 3, slotLevel: 5 },
    13: { slots: 3, slotLevel: 5 },
    14: { slots: 3, slotLevel: 5 },
    15: { slots: 3, slotLevel: 5 },
    16: { slots: 3, slotLevel: 5 },
    17: { slots: 4, slotLevel: 5 },
    18: { slots: 4, slotLevel: 5 },
    19: { slots: 4, slotLevel: 5 },
    20: { slots: 4, slotLevel: 5 },
  };

  // Wizard spell slots table
  const wizardSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Multiclass spell slots table
  const multiclassSpellSlotsTable: { [level: number]: number[] } = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  // Helper to calculate effective spellcasting level for multiclassing
  function calculateMulticlassSpellcasterLevel(): number {
    let totalLevel = 0;

    selectedClasses.forEach((cls) => {
      if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(cls.id)) {
        totalLevel += cls.level; // Full caster
      } else if (["Paladin", "Ranger"].includes(cls.id)) {
        totalLevel += Math.floor(cls.level / 2); // Half caster
      } else if (["Fighter", "Rogue"].includes(cls.id)) {
        totalLevel += Math.floor(cls.level / 3); // Third caster (Eldritch Knight/Arcane Trickster)
      }
    });

    return Math.min(totalLevel, 20); // Cap at level 20
  }

  // Helper to get spell slots for multiclass spellcasters
  function getMulticlassSpellSlots(): number[] {
    const effectiveLevel = calculateMulticlassSpellcasterLevel();
    return multiclassSpellSlotsTable[effectiveLevel] || [];
  }

  // Helper to get spell slots for Artificer based on level
  function getArtificerSpellSlots(level: number): number[] {
    return artificerSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Bard based on level
  function getBardSpellSlots(level: number): number[] {
    return bardSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Cleric based on level
  function getClericSpellSlots(level: number): number[] {
    return clericSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Druid based on level
  function getDruidSpellSlots(level: number): number[] {
    return druidSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Paladin based on level
  function getPaladinSpellSlots(level: number): number[] {
    return paladinSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Sorcerer based on level
  function getSorcererSpellSlots(level: number): number[] {
    return sorcererSpellSlotsTable[level] || [];
  }

  // Helper to get spell slots for Warlock based on level
  function getWarlockSpellSlots(level: number): { slots: number; slotLevel: number } {
    return warlockSpellSlotsTable[level] || { slots: 0, slotLevel: 0 };
  }

  // Helper to get spell slots for Wizard based on level
  function getWizardSpellSlots(level: number): number[] {
    return wizardSpellSlotsTable[level] || [];
  }

  // Helper to calculate proficiency bonus based on total character level
  function getProficiencyBonus(totalLevel: number): number {
    if (totalLevel >= 17) return 6;
    if (totalLevel >= 13) return 5;
    if (totalLevel >= 9) return 4;
    if (totalLevel >= 5) return 3;
    return 2;
  }

  // Helper to calculate total character level
  function getTotalCharacterLevel(): number {
    return Object.values(classLevels).reduce((sum, level) => sum + level, 0);
  }

  // Helper to calculate spell save DC for a class
  function getSpellSaveDC(className: string): number | null {
    const ability = getClassSpellcastingAbility(className);
    if (!ability) return null;
    const abilityModifier = Math.floor((abilityScores[ability] - 10) / 2);
    const proficiencyBonus = getProficiencyBonus(getTotalCharacterLevel());
    return 8 + abilityModifier + proficiencyBonus;
  }

  // Helper to calculate spell attack bonus for a class
  function getSpellAttackBonus(className: string): number | null {
    const ability = getClassSpellcastingAbility(className);
    if (!ability) return null;
    const abilityModifier = Math.floor((abilityScores[ability] - 10) / 2);
    const proficiencyBonus = getProficiencyBonus(getTotalCharacterLevel());
    return abilityModifier + proficiencyBonus;
  }

  // Compute available spells for selected classes and levels
  const availableSpells = useMemo(() => {
    if (!selectedClasses.length) return [];
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
    // Deduplicate by title
    const unique = new Map();
    for (const s of spells) {
      unique.set(s.title, s);
    }
    return Array.from(unique.values()).sort(
      (a, b) => a.spellLevel - b.spellLevel || a.title.localeCompare(b.title)
    );
  }, [selectedClasses, spellsData]);

  // Filtered spells by spell name, level, and class
  const filteredSpells = useMemo(() => {
    let spells = availableSpells;
    if (spellNameFilter.trim()) {
      const filter = spellNameFilter.trim().toLowerCase();
      spells = spells.filter((spell) =>
        spell.title.toLowerCase().includes(filter)
      );
    }
    if (levelFilter.length > 0) {
      spells = spells.filter((spell) => levelFilter.includes(spell.spellLevel));
    }
    if (classFilter.length > 0) {
      const selectedClassNames = classFilter.map(
        (classId) => classOptions.find((c) => c.id === classId)?.name
      );
      spells = spells.filter((spell) =>
        selectedClassNames.some((className) => spell.tags.includes(className))
      );
    }
    return spells;
  }, [availableSpells, spellNameFilter, levelFilter, classFilter]);

  // Filtered added spells by level (multi-select)
  const filteredAddedSpells = useMemo(() => {
    if (levelFilter.length === 0) return addedSpells;
    return addedSpells.filter((spell) => levelFilter.includes(spell.spellLevel));
  }, [addedSpells, levelFilter]);

  // Handler for selecting/deselecting a spell
  const handleSpellSelect = (title: string) => {
    setSelectedSpellTitles((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  // Handler for Add Spells button
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
      // Sort spells by level
      return newSpells.sort((a, b) => a.spellLevel - b.spellLevel);
    });
    setSelectedSpellTitles([]);
  };

  // Handler to remove a spell from addedSpells by title
  const handleRemoveAddedSpell = (title: string) => {
    setAddedSpells((prev) => prev.filter((spell) => spell.title !== title));
  };

  // Handler for selecting/deselecting a spell in the Added Spells table
  const handleAddedSpellSelect = (title: string) => {
    setSelectedAddedSpellTitles((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  // Handler to remove selected spells in bulk from addedSpells
  const handleRemoveSelectedAddedSpells = () => {
    setAddedSpells((prev) => prev.filter((spell) => !selectedAddedSpellTitles.includes(spell.title)));
    setSelectedAddedSpellTitles([]);
  };

  // Save spell slots for the current character to local storage after saving the character
  const saveSpellSlotsToLocalStorage = (characterName: string) => {
    localStorage.setItem(`spell-slots-${characterName}`, JSON.stringify(spellSlots));
    localStorage.setItem(`warlock-spell-slots-${characterName}`, JSON.stringify(warlockSpellSlots));
  };

  // Handler to save character data to localStorage as JSON
  const handleSaveToLocalStorage = () => {
    const characterData = {
      characterName,
      selectedClassIds,
      classLevels,
      abilityScores,
      addedSpells,
    };
    // Load list, update or add, and save back
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

    // Save spell slots after saving the character
    saveSpellSlotsToLocalStorage(characterName);

    if (props.onSave) props.onSave(characterData);
  };

  // Handler to reset all fields for a new character
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

  // Load initial data if provided (for editing)
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

  // State for theme selection
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Load spell slots for the current character from local storage
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

  // Handler to remove a character and its associated spell slot data
  const handleRemoveCharacter = (characterNameToRemove: string) => {
    let arr: any[] = [];
    try {
      arr = JSON.parse(localStorage.getItem("character-create-list") || "[]");
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }

    // Remove the character from the list
    const updatedArr = arr.filter((c) => c.characterName !== characterNameToRemove);
    localStorage.setItem("character-create-list", JSON.stringify(updatedArr));

    // Remove associated spell slot data
    localStorage.removeItem(`spell-slots-${characterNameToRemove}`);
    localStorage.removeItem(`warlock-spell-slots-${characterNameToRemove}`);
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
                <Box key={classId} className="level-input-container" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" className="level-label">
                    {classOption.name} Level:
                  </Typography>
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
                Save
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

            {/* Always show Warlock spell slots if present */}
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

            {/* Handle other classes */}
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

          {/* Filters */}
          <TextField
            label="Filter by Spell Name"
            variant="outlined"
            size="small"
            value={spellNameFilter}
            onChange={(e) => setSpellNameFilter(e.target.value)}
            sx={{ width: 300, marginBottom: 2, marginRight: 2 }}
          />
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
                      <TableCell>Damage</TableCell>
                      <TableCell>Damage Type</TableCell>
                      <TableCell>Saving Throw</TableCell>
                      <TableCell /> {/* Remove button column */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAddedSpells.length > 0 ? (
                      filteredAddedSpells.map((spell) => (
                        <TableRow key={spell.title}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAddedSpellTitles.includes(spell.title)}
                              onChange={() => handleAddedSpellSelect(spell.title)}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{spell.title}</TableCell>
                          <TableCell>
                            {spell.spellLevel === 0 ? "Cantrip" : spell.spellLevel}
                          </TableCell>
                          <TableCell>{getSpellDamage(spell)}</TableCell>
                          <TableCell>{getDamageType(spell)}</TableCell>
                          <TableCell>{needsSavingThrow(spell) ? "✔" : "✘"}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRemoveAddedSpell(spell.title)}
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

          {/* Toggle Available Spells Table */}
          <Button
            variant="outlined"
            color="primary"
            onClick={toggleSpellTableVisibility}
            sx={{ marginBottom: 2 }}
          >
            {showSpellTable ? "Hide Available Spells Table" : "Show Available Spells Table"}
          </Button>
          
          {/* Available Spells Table */}
          {showSpellTable && (
            <TableContainer component={Paper} sx={{ marginTop: 2, width: "100%" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Spell Name</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Damage</TableCell>
                    <TableCell>Damage Type</TableCell>
                    <TableCell>Saving Throw</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSpells.length > 0 ? (
                    filteredSpells.map((spell) => (
                      <TableRow key={spell.title}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedSpellTitles.includes(spell.title)}
                            onChange={() => handleSpellSelect(spell.title)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>{spell.title}</TableCell>
                        <TableCell>
                          {spell.spellLevel === 0 ? "Cantrip" : spell.spellLevel}
                        </TableCell>
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
    </Box>
  );
}
