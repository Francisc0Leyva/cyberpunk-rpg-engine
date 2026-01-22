import "./ClassesSection.css";
import classesData from "../data/constants/class.json";

type ClassAbility = {
  name: string;
  description: string;
};

type ClassSubclass = {
  name: string;
  description: string;
  ability?: ClassAbility;
};

export type ClassData = {
  id: string;
  name: string;
  description: string;
  attributePoints: string;
  ability?: ClassAbility;
  civilAbilities: string[];
  civilNotes?: string[];
  cybermods: string[];
  tagPoints: string;
  bonuses?: string[];
  choices?: string[];
  subclasses?: ClassSubclass[];
};

type ClassesJson = {
  classes: ClassData[];
};

const CLASSES = (classesData as ClassesJson).classes;

const CIVIL_ORDER = [
  "Appeal",
  "Performance",
  "Crafting",
  "Driving",
  "Evasion",
  "Intimidation",
  "Luck",
  "Perception",
  "Persuasion",
  "Tolerance",
];

function renderLines(lines: string[], className: string) {
  return lines.map((line, index) => (
    <div key={`${line}-${index}`} className={className}>
      {line}
    </div>
  ));
}

function sortCivilAbilities(lines: string[]): string[] {
  return lines
    .map((line, index) => {
      const [name] = line.split(":");
      const trimmed = name ? name.trim() : "";
      const orderIndex = CIVIL_ORDER.indexOf(trimmed);
      return {
        line,
        index,
        orderIndex: orderIndex === -1 ? CIVIL_ORDER.length : orderIndex,
      };
    })
    .sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      return a.index - b.index;
    })
    .map(item => item.line);
}

type ClassesSectionProps = {
  selectedId: string | null;
  onSelect: (classData: ClassData) => void;
  classChoiceGroups: Record<
    string,
    Array<{
      id: string;
      label: string;
      options: Array<{ id: string; label: string }>;
    }>
  >;
  classChoiceSelections: Record<string, string>;
  onClassChoiceSelect: (
    classData: ClassData,
    groupId: string,
    optionId: string
  ) => void;
  attributePointChoices?: Record<string, "roll" | "intelligence">;
  onAttributePointChoice?: (
    classData: ClassData,
    choiceId: "roll" | "intelligence"
  ) => void;
  defiantSubclass: string | null;
  defiantRolls: {
    appealPerformance?: { total: number; rolls: number[] } | null;
    intimidationPersuasion?: { total: number; rolls: number[] } | null;
  };
  defiantAllocations: {
    appeal: number;
    performance: number;
    intimidation: number;
    persuasion: number;
  };
  onDefiantSubclassSelect: (
    classData: ClassData,
    subclassId: string
  ) => void;
  onDefiantAllocationChange: (
    pair: "appealPerformance" | "intimidationPersuasion",
    key:
      | "appeal"
      | "performance"
      | "intimidation"
      | "persuasion",
    delta: number
  ) => void;
};

export function ClassesSection({
  selectedId,
  onSelect,
  classChoiceGroups,
  classChoiceSelections,
  onClassChoiceSelect,
  attributePointChoices = {},
  onAttributePointChoice,
  defiantSubclass,
  defiantRolls,
  defiantAllocations,
  onDefiantSubclassSelect,
  onDefiantAllocationChange,
}: ClassesSectionProps) {
  return (
    <div className="classes-page">
      <div className="classes-header">
        <div className="classes-title">Class</div>
        <div className="classes-subtitle">
          Review class bonuses, abilities, and loadouts.
        </div>
      </div>

      <div className="classes-grid">
        {CLASSES.map(classData => {
          const isActive = classData.id === selectedId;
          const isDefiant = classData.id === "defiant";
          const classChoices = classChoiceGroups[classData.id] ?? [];
          const attributeChoice =
            attributePointChoices[classData.id] ?? "roll";
          const appealPerfRoll = defiantRolls.appealPerformance;
          const intimidateRoll = defiantRolls.intimidationPersuasion;
          const appealPerfTotal = appealPerfRoll?.total ?? 0;
          const intimidateTotal = intimidateRoll?.total ?? 0;
          const appealPerfRemaining = Math.max(
            0,
            appealPerfTotal -
              (defiantAllocations.appeal +
                defiantAllocations.performance)
          );
          const intimidateRemaining = Math.max(
            0,
            intimidateTotal -
              (defiantAllocations.intimidation +
                defiantAllocations.persuasion)
          );
          return (
          <div
            key={classData.id}
            className={`class-card ${isActive ? "active" : ""}`}
            onClick={() => onSelect(classData)}
          >
            <div className="class-card-header">
              <div className="class-card-title">{classData.name}</div>
              <div className="class-card-points">
                Attribute Points: {classData.attributePoints}
              </div>
            </div>

            <div className="class-card-description">
              {classData.description}
            </div>

            {classData.ability ? (
              <div className="class-card-section">
                <div className="class-card-section-title">Ability</div>
                <div className="class-card-ability-name">
                  {classData.ability.name}
                </div>
                <div className="class-card-ability-desc">
                  {classData.ability.description}
                </div>
              </div>
            ) : null}

            <div className="class-card-section">
              <div className="class-card-section-title">
                Civil Attributes
              </div>
              <div className="class-card-list">
                {renderLines(
                  sortCivilAbilities(classData.civilAbilities),
                  "class-card-line"
                )}
              </div>
              {classData.civilNotes?.length ? (
                <div className="class-card-notes">
                  {renderLines(
                    classData.civilNotes,
                    "class-card-note"
                  )}
                </div>
              ) : null}
            </div>

            <div className="class-card-section">
              <div className="class-card-section-title">Cybermods</div>
              <div className="class-card-list">
                {renderLines(
                  classData.cybermods,
                  "class-card-line"
                )}
              </div>
            </div>

            <div className="class-card-section">
              <div className="class-card-section-title">Tag Points</div>
              <div className="class-card-line">
                {classData.tagPoints}
              </div>
            </div>

            {isActive && classData.id === "netrunner" ? (
              <div className="class-card-section">
                <div className="class-card-section-title">
                  Attribute Point Bonus
                </div>
                <div
                  className="class-choice-list"
                  onClick={event => event.stopPropagation()}
                >
                  <label className="class-choice-option">
                    <input
                      type="radio"
                      name={`${classData.id}-attr-points`}
                      checked={attributeChoice === "roll"}
                      onChange={() =>
                        onAttributePointChoice?.(
                          classData,
                          "roll"
                        )
                      }
                    />
                    <span>Roll 1D15 bonus points</span>
                  </label>
                  <label className="class-choice-option">
                    <input
                      type="radio"
                      name={`${classData.id}-attr-points`}
                      checked={attributeChoice === "intelligence"}
                      onChange={() =>
                        onAttributePointChoice?.(
                          classData,
                          "intelligence"
                        )
                      }
                    />
                    <span>+10 Intelligence instead</span>
                  </label>
                </div>
              </div>
            ) : null}

            {classData.bonuses?.length ? (
              <div className="class-card-section">
                <div className="class-card-section-title">Bonuses</div>
                <div className="class-card-list">
                  {renderLines(
                    classData.bonuses,
                    "class-card-line"
                  )}
                </div>
              </div>
            ) : null}

            {classData.choices?.length ? (
              <div className="class-card-section">
                <div className="class-card-section-title">Choices</div>
                <div className="class-card-list">
                  {renderLines(
                    classData.choices,
                    "class-card-line"
                  )}
                </div>
              </div>
            ) : null}

            {isActive && classChoices.length > 0 ? (
              <div className="class-card-section">
                <div className="class-card-section-title">
                  Class Choices
                </div>
                <div className="class-choice-list">
                  {classChoices.map(group => (
                    <div
                      key={`${classData.id}-${group.id}`}
                      className="class-choice-group"
                      onClick={event => event.stopPropagation()}
                    >
                      <div className="class-choice-title">
                        {group.label}
                      </div>
                      {group.options.map(option => (
                        <label
                          key={`${group.id}-${option.id}`}
                          className="class-choice-option"
                        >
                          <input
                            type="radio"
                            name={`${classData.id}-${group.id}`}
                            checked={
                              classChoiceSelections[group.id] ===
                              option.id
                            }
                            onChange={() =>
                              onClassChoiceSelect(
                                classData,
                                group.id,
                                option.id
                              )
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {classData.subclasses?.length ? (
              <div className="class-card-section">
                <div className="class-card-section-title">
                  Subclasses
                </div>
                <div className="class-subclass-grid">
                  {classData.subclasses.map(subclass => (
                    <div
                      key={`${classData.id}-${subclass.name}`}
                      className={`class-subclass-card ${
                        isDefiant &&
                        defiantSubclass ===
                          subclass.name.toLowerCase()
                          ? "active"
                          : ""
                      } ${isDefiant ? "selectable" : ""}`}
                      onClick={event => {
                        if (!isDefiant) return;
                        event.stopPropagation();
                        onSelect(classData);
                        onDefiantSubclassSelect(
                          classData,
                          subclass.name.toLowerCase()
                        );
                      }}
                      role={isDefiant ? "button" : undefined}
                    >
                      <div className="class-subclass-title">
                        {subclass.name}
                      </div>
                      <div className="class-subclass-description">
                        {subclass.description}
                      </div>
                      {subclass.ability ? (
                        <div className="class-subclass-ability">
                          <span className="class-subclass-ability-name">
                            {subclass.ability.name}
                          </span>
                          <span className="class-subclass-ability-desc">
                            {subclass.ability.description}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {isActive && isDefiant ? (
              <div className="class-card-section">
                <div className="class-card-section-title">
                  Defiant Rolls
                </div>

                {defiantSubclass ? (
                  <div className="class-card-roll">
                    Subclass:{" "}
                    {defiantSubclass.charAt(0).toUpperCase() +
                      defiantSubclass.slice(1)}
                  </div>
                ) : (
                  <div className="class-card-roll">
                    Select a subclass to roll.
                  </div>
                )}

                {defiantSubclass === "rockerboy" ? (
                  <div className="class-card-allocation">
                    <div className="class-card-roll">
                      Appeal/Performance Roll:{" "}
                      {appealPerfRoll?.rolls?.length
                        ? `${appealPerfRoll.rolls.join(
                            ", "
                          )} (Total ${appealPerfTotal})`
                        : "—"}
                    </div>
                    <div className="class-card-alloc-row">
                      <span>Appeal</span>
                      <div className="class-card-alloc-controls">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "appealPerformance",
                              "appeal",
                              -1
                            );
                          }}
                          disabled={
                            appealPerfTotal === 0 ||
                            defiantAllocations.appeal <= 0
                          }
                        >
                          -
                        </button>
                        <span>{defiantAllocations.appeal}</span>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "appealPerformance",
                              "appeal",
                              1
                            );
                          }}
                          disabled={
                            appealPerfTotal === 0 ||
                            appealPerfRemaining <= 0
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="class-card-alloc-row">
                      <span>Performance</span>
                      <div className="class-card-alloc-controls">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "appealPerformance",
                              "performance",
                              -1
                            );
                          }}
                          disabled={
                            appealPerfTotal === 0 ||
                            defiantAllocations.performance <= 0
                          }
                        >
                          -
                        </button>
                        <span>{defiantAllocations.performance}</span>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "appealPerformance",
                              "performance",
                              1
                            );
                          }}
                          disabled={
                            appealPerfTotal === 0 ||
                            appealPerfRemaining <= 0
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="class-card-alloc-remaining">
                      Remaining: {appealPerfRemaining}
                    </div>
                  </div>
                ) : defiantSubclass ? (
                  <div className="class-card-roll">
                    Appeal/Performance: 0 for{" "}
                    {defiantSubclass.charAt(0).toUpperCase() +
                      defiantSubclass.slice(1)}
                    .
                  </div>
                ) : null}

                {defiantSubclass ? (
                  <div className="class-card-allocation">
                    <div className="class-card-roll">
                      Intimidation/Persuasion Roll:{" "}
                      {intimidateRoll?.rolls?.length
                        ? `${intimidateRoll.rolls.join(
                            ", "
                          )} (Total ${intimidateTotal})`
                        : "—"}
                    </div>
                    <div className="class-card-alloc-row">
                      <span>Intimidation</span>
                      <div className="class-card-alloc-controls">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "intimidationPersuasion",
                              "intimidation",
                              -1
                            );
                          }}
                          disabled={
                            intimidateTotal === 0 ||
                            defiantAllocations.intimidation <= 0
                          }
                        >
                          -
                        </button>
                        <span>{defiantAllocations.intimidation}</span>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "intimidationPersuasion",
                              "intimidation",
                              1
                            );
                          }}
                          disabled={
                            intimidateTotal === 0 ||
                            intimidateRemaining <= 0
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="class-card-alloc-row">
                      <span>Persuasion</span>
                      <div className="class-card-alloc-controls">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "intimidationPersuasion",
                              "persuasion",
                              -1
                            );
                          }}
                          disabled={
                            intimidateTotal === 0 ||
                            defiantAllocations.persuasion <= 0
                          }
                        >
                          -
                        </button>
                        <span>{defiantAllocations.persuasion}</span>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onDefiantAllocationChange(
                              "intimidationPersuasion",
                              "persuasion",
                              1
                            );
                          }}
                          disabled={
                            intimidateTotal === 0 ||
                            intimidateRemaining <= 0
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="class-card-alloc-remaining">
                      Remaining: {intimidateRemaining}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
        })}
      </div>
    </div>
  );
}
