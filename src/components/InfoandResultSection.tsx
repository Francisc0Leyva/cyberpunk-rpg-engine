import { useMemo, useState } from "react";
import "./InfoandResultSection.css";
import type { Character } from "../types/character";
import {
  computeDamage,
  serializeCyberMods,
  type StatusContext,
} from "../logic/calculate";

type InfoAndResultSectionProps = {
  character: Character;
  selectionInfo: string;
};

export function InfoAndResultSection({
  character,
  selectionInfo,
}: InfoAndResultSectionProps) {
  const [result, setResult] = useState("");

  const serializedCyberMods = useMemo(
    () => serializeCyberMods(character.cyberMods),
    [character.cyberMods]
  );

  function buildStatusPayload(): StatusContext {
    const ctx: StatusContext = {
      hp_percent: 100,
    };

    Object.entries(character.statusEffects).forEach(([name, active]) => {
      if (active) {
        ctx[name] = true;
      }
    });

    return ctx;
  }

  function handleCalculate() {
    try {
      const calcResult = computeDamage(
        character.attributes,
        character.tags,
        serializedCyberMods,
        {
          type: character.weapon.type,
          base_damage: character.weapon.damage,
          damage: character.weapon.damage,
          smart: character.weapon.flags.smart,
          arrows: character.weapon.flags.arrows,
          alwaysCrit: character.weapon.flags.alwaysCrit,
          returned: character.weapon.flags.returned,
          first: character.weapon.flags.first,
        },
        buildStatusPayload()
      );
      setResult(calcResult);
    } catch (err) {
      console.error(err);
      setResult(
        `Calculation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return (
    <div className="info-result-container">
      {/* Info box */}
      <div className="info-block">
        <div className="info-label">Info</div>
        <textarea
          className="info-textarea"
          value={selectionInfo}
          readOnly
        />
      </div>

      {/* Calculate button */}
      <div className="calc-row">
        <button className="button" onClick={handleCalculate}>
          Calculate
        </button>
      </div>

      {/* Result box */}
      <div className="result-block">
        <div className="result-label">Result</div>
        <textarea
          className="result-textarea"
          value={result}
          readOnly
        />
      </div>
    </div>
  );
}
