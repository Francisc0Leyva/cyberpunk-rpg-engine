import type { Character } from "../types/character";
import "./ReadOnlyCharacter.css";

type ReadOnlyCharacterProps = {
  character: Character;
};

export function ReadOnlyCharacter({ character }: ReadOnlyCharacterProps) {
  const activeTags = Object.entries(character.tags)
    .filter(([, active]) => active)
    .map(([name]) => name);

  const activeStatuses = Object.entries(character.statusEffects)
    .filter(([, active]) => active)
    .map(([name]) => name);

  const cyberSystems = Object.entries(character.cyberMods).map(
    ([system, data]) => ({
      system,
      slots: data?.slots ?? [],
      tier: data?.tier,
    })
  );

  return (
    <div className="readonly-card">
      <h2>{character.name}</h2>

      <section>
        <h3>Attributes</h3>
        <ul>
          {Object.entries(character.attributes).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Weapon</h3>
        <p>
          <strong>Type:</strong> {character.weapon.type}
        </p>
        <p>
          <strong>Damage:</strong> {character.weapon.damage}
        </p>
        <p>
          <strong>Flags:</strong>{" "}
          {Object.entries(character.weapon.flags)
            .filter(([, enabled]) => enabled)
            .map(([flag]) => flag)
            .join(", ") || "None"}
        </p>
      </section>

      <section>
        <h3>Tags</h3>
        <p>{activeTags.length > 0 ? activeTags.join(", ") : "None"}</p>
      </section>

      <section>
        <h3>Status Effects</h3>
        <p>{activeStatuses.length > 0 ? activeStatuses.join(", ") : "None"}</p>
      </section>

      <section>
        <h3>Cyber Mods</h3>
        {cyberSystems.map(({ system, slots, tier }) => (
          <div key={system} className="readonly-cyber-system">
            <strong>{system}</strong>
            {tier ? <span className="readonly-tier">Tier: {tier}</span> : null}
            <ul>
              {slots.map((slot, idx) => (
                <li key={`${system}-${idx}`}>
                  Slot {idx + 1}: {slot}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
