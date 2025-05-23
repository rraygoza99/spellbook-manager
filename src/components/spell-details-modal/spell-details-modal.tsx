import React, { useEffect, useState } from "react";
import { Modal, Backdrop, Fade, Box, Typography } from "@mui/material";
import './spell-details-modal.css';

interface SpellDetailsModalProps {
  spell: any | null;
  onClose: () => void;
  getSpellConcentration: (spell: any) => boolean;
  getSpellDamage: (spell: any) => string;
  getDamageType: (spell: any) => string;
  needsSavingThrow: (spell: any) => boolean;
}

export default function SpellDetailsModal({
  spell,
  onClose,
  getSpellConcentration,
  getSpellDamage,
  getDamageType,
  needsSavingThrow
}: SpellDetailsModalProps) {
  const [castingTime, setCastingTime] = useState("");
  const [range, setRange] = useState("");
  const [components, setComponents] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [text, setText] = useState("");
  const [higherLevelDescription, setHigherLevelDescription] = useState("");
  const [descriptions , setDescriptions] = useState<string[]>([]);
  const processSpellContents = (contents: string[]): void => {
    const properties = contents.filter((item) => item.includes("property"));
    properties.forEach((element) => {
      if (element.includes("Casting Time")) {
        setCastingTime(element.split("|")[2].trim());
      } else if (element.includes("Range")) {
        setRange(element.split("|")[2].trim());
      } else if (element.includes("Components")) {
        const componentsString = element.split("|")[2].trim();
        setComponents(componentsString.split(",").map((component) => component.trim()));
      } else if (element.includes("Duration")) {
        setDuration(element.split("|")[2].trim());
      }
    });

    const textItems = contents.filter((item) => item.includes("text"));
    if (textItems.length > 0) {
      setText(textItems.map((item) => item.split("|")[1].trim()).join("\n\n"));
    }

    console.log("contents", contents);
    

    const sectionIndex = contents.findIndex((item) => item.includes("section"));
    const descBeforeSection = contents.slice(0, sectionIndex);

    const descItems = descBeforeSection.filter((item) => item.includes("description"));
    if (descItems.length > 0) {
    setDescriptions(
      descItems.map((item) =>
        item
          .split("|")
          .filter((desc) => desc !== "description ")
          .map((desc) => desc.trim())
          .join("\n\n")
      )
    );
    }


    if (sectionIndex !== -1) {
      const sectionContents = contents.slice(sectionIndex + 1);
      sectionContents.forEach((item) => {
        if (item.includes("text")) {
          const textContent = item.split("|")[1].trim();
          setDescriptions((prev) => [...prev, textContent]);
        } else if (item.includes("description")) {
          const descriptionContent = item.split("|")[1].trim();
            const higherLevelContent = item.split("|")[2].trim();
            setHigherLevelDescription(higherLevelContent);
        }
      });
    }
  };

  useEffect(() => {
    if (spell?.contents) {
      processSpellContents(spell.contents);
    }
  }, [spell]);

  const handleClose = () => {
    setHigherLevelDescription("");
    setText("");
    setCastingTime("");
    setRange("");
    setComponents([]);
    setDuration("");
    setDescriptions([]);
    onClose();
  };

  return (
    <Modal
      open={!!spell}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={!!spell}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60%",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          {spell && (
            <>
              <Typography variant="h6" component="h2">
                {spell.title}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Level: {spell.spellLevel === 0 ? "Cantrip" : spell.spellLevel}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Concentration: {getSpellConcentration(spell) ? "Yes" : "No"}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Damage: {getSpellDamage(spell)}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Damage Type: {getDamageType(spell)}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Saving Throw: {needsSavingThrow(spell) ? "Yes" : "No"}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Casting Time: {castingTime}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Range: {range}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Components: {components.join(", ")}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Duration: {duration}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                {text}
              </Typography>
              {descriptions.length > 0 && (
                <Typography sx={{ mt: 2 }}>
                  {descriptions.map((desc, index) => (
                    <div key={index}>{desc}</div>
                  ))}
                </Typography>
              )}
              {higherLevelDescription && (
                <Typography sx={{ mt: 2 }}>
                  At higher levels: {higherLevelDescription}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}
