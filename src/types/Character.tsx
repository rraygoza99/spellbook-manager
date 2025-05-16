export default interface Character {
    id: number;
    name: string;
    level: number;
    classes: number[];
    // 0= "Artificer",
    // 1= "Barbarian",
    // 2= "Bard",
    // 3= "Cleric",
    // 4= "Druid",
    // 5= "Fighter",
    // 6= "Monk",
    // 7= "Paladin",
    // 8= "Ranger",
    // 9= "Rogue",
    // 10= "Sorcerer",
    // 11= "Warlock",
    // 12= "Wizard"
    abilityScores: number[];
    // 0= "Strength",
    // 1= "Dexterity",
    // 2= "Constitution",
    // 3= "Intelligence",
    // 4= "Wisdom",
    // 5= "Charisma"
}