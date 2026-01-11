import { useState } from "react";
import "./DiceRollSection.css";

export function DiceRollSection() {
  const [diceExpr, setDiceExpr] = useState("1d20");
  const [diceResult, setDiceResult] = useState("");

  function rollDice() {
    const match = diceExpr.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      setDiceResult(`Invalid: ${diceExpr}`);
      return;
    }

    const [, countStr, facesStr, modStr] = match;
    const count = parseInt(countStr, 10);
    const faces = parseInt(facesStr, 10);
    const mod = modStr ? parseInt(modStr, 10) : 0;

    if (count <= 0 || faces <= 0) {
      setDiceResult(`Invalid: ${diceExpr}`);
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

    setDiceResult(`Rolls: [${rollsText}]${modText} | Total: ${total}`);
  }

  return (
    <div className="dice-card">
      <h2 className="section-title">Dice Roll</h2>
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
        <div className="dice-result">{diceResult}</div>
        <button className="button" onClick={rollDice}>
          Roll
        </button>
      </div>
    </div>
  );
}
