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
  const [diceExpr, setDiceExpr] = useState("1d20");
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

  function rollDice() {
    const match = diceExpr.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      setResult(`Invalid dice expression: ${diceExpr}`);
      return;
    }

    const [, countStr, facesStr, modStr] = match;
    const count = parseInt(countStr, 10);
    const faces = parseInt(facesStr, 10);
    const mod = modStr ? parseInt(modStr, 10) : 0;

    if (count <= 0 || faces <= 0) {
      setResult(`Invalid dice expression: ${diceExpr}`);
      return;
    }

    let rolls: number[] = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const r = 1 + Math.floor(Math.random() * faces);
      rolls.push(r);
      total += r;
    }
    total += mod;

    const rollsText = rolls.join(", ");
    const modText = mod !== 0 ? ` ${mod > 0 ? "+" : "-"} ${Math.abs(mod)}` : "";

    setResult(
      `Dice: ${diceExpr}\nRolls: [${rollsText}]${modText}\nTotal: ${total}`
    );
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

      {/* Dice + Roll */}
      <div className="dice-row">
        <label className="dice-label">
          Dice:
          <input
            className="dice-input"
            type="text"
            value={diceExpr}
            onChange={e => setDiceExpr(e.target.value)}
          />
        </label>
        <button className="button" onClick={rollDice}>
          Roll
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
