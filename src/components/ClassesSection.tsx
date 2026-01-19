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

type ClassData = {
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

function renderLines(lines: string[], className: string) {
  return lines.map((line, index) => (
    <div key={`${line}-${index}`} className={className}>
      {line}
    </div>
  ));
}

export function ClassesSection() {
  return (
    <div className="classes-page">
      <div className="classes-header">
        <div className="classes-title">Class</div>
        <div className="classes-subtitle">
          Review class bonuses, abilities, and loadouts.
        </div>
      </div>

      <div className="classes-grid">
        {CLASSES.map(classData => (
          <div key={classData.id} className="class-card">
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
                Civil Abilities
              </div>
              <div className="class-card-list">
                {renderLines(
                  classData.civilAbilities,
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

            {classData.subclasses?.length ? (
              <div className="class-card-section">
                <div className="class-card-section-title">
                  Subclasses
                </div>
                <div className="class-subclass-grid">
                  {classData.subclasses.map(subclass => (
                    <div
                      key={`${classData.id}-${subclass.name}`}
                      className="class-subclass-card"
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
          </div>
        ))}
      </div>
    </div>
  );
}
