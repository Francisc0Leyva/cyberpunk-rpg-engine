import { CYBER_SYSTEMS } from "../data/cyberSystems";
import type { CyberModsState } from "../types/character";
import "./CyberModsOverview.css";

type CyberModsOverviewProps = {
  selections: CyberModsState;
};

export function CyberModsOverview({ selections }: CyberModsOverviewProps) {
  return (
    <div className="cybermods-overview">
      <h2>Cyber Mods Summary</h2>

      {CYBER_SYSTEMS.map(system => {
        const selection = selections[system.system];
        const selectedNames = (selection?.slots ?? []).filter(
          name => name && name !== "None"
        );

        return (
          <div className="cybermods-overview-system" key={system.system}>
            <div className="cybermods-overview-header">
              <h3>{system.system}</h3>
              {system.system === "Operating System" && selection?.tier ? (
                <span className="cybermods-overview-tier">
                  Tier {selection.tier}
                </span>
              ) : null}
            </div>

            {selectedNames.length === 0 ? (
              <div className="cybermods-overview-empty">
                No mods selected.
              </div>
            ) : (
              selectedNames.map(name => {
                const mod = system.mods.find(m => m.name === name);
                const desc = mod?.desc ?? "No description available.";
                return (
                  <div className="cybermods-overview-mod" key={`${system.system}-${name}`}>
                    <div className="cybermods-overview-mod-name">{name}</div>
                    <div className="cybermods-overview-mod-desc">{desc}</div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
