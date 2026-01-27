import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import "./AttributesSection.css";

import type { Attributes, AttributeKey } from "../types/character";
import type { AttributeBonusSource } from "../lib/attributeBonuses";
import { sumAttributeBonusSources } from "../lib/attributeBonuses";

type AttributesSectionProps = {
  attributes: Attributes;
  bonusSources?: AttributeBonusSource[];
  pointsSummary?: {
    total: number;
    remaining: number;
    note?: string;
  } | null;
  loreAccurate?: boolean;
  onLoreAccurateChange?: (nextValue: boolean) => void;
  onChange: (next: Attributes) => void;
};

const attributeList: ReadonlyArray<[label: string, key: AttributeKey]> = [
  ["Body", "body"],
  ["Willpower", "willpower"],
  ["Cool", "cool"],
  ["Intelligence", "intelligence"],
  ["Reflexes", "reflexes"],
  ["Skill", "skill"],
  ["Technical Ability", "technical"],
];

const DEFAULT_SOURCES: AttributeBonusSource[] = [];

function getBonus(
  bonuses: Partial<Record<AttributeKey, number>>,
  key: AttributeKey
): number {
  const value = bonuses[key];
  return Number.isFinite(value) ? (value as number) : 0;
}

export function AttributesSection({
  attributes,
  bonusSources = DEFAULT_SOURCES,
  pointsSummary = null,
  loreAccurate = false,
  onLoreAccurateChange,
  onChange,
}: AttributesSectionProps) {
  const [locked, setLocked] = useState(false);
  const bonusTotals = useMemo(
    () => sumAttributeBonusSources(bonusSources),
    [bonusSources]
  );
  const baseTotal = useMemo(
    () =>
      attributeList.reduce(
        (sum, [, key]) => sum + Number(attributes[key] ?? 0),
        0
      ),
    [attributes]
  );
  const totals = useMemo(() => {
    const next: Record<AttributeKey, number> = {
      body: 0,
      willpower: 0,
      cool: 0,
      intelligence: 0,
      reflexes: 0,
      skill: 0,
      technical: 0,
    };
    attributeList.forEach(([, key]) => {
      const raw = Number(attributes[key] ?? 0) + getBonus(bonusTotals, key);
      next[key] = Math.min(50, raw);
    });
    return next;
  }, [attributes, bonusTotals]);
  const [drafts, setDrafts] = useState<Record<AttributeKey, string>>(
    () =>
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
  );
  const draftsRef = useRef<Record<AttributeKey, string>>(drafts);
  const totalsRef = useRef(totals);
  const attributesRef = useRef(attributes);
  const bonusTotalsRef = useRef(bonusTotals);
  const baseTotalRef = useRef(baseTotal);
  const pointsSummaryRef = useRef(pointsSummary);
  const loreAccurateRef = useRef(loreAccurate);
  const lockedRef = useRef(locked);
  const holdStateRef = useRef<
    Record<string, { timeoutId: number | null; active: boolean }>
  >({});

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
    );
  }, [totals]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    totalsRef.current = totals;
  }, [totals]);

  useEffect(() => {
    attributesRef.current = attributes;
  }, [attributes]);

  useEffect(() => {
    bonusTotalsRef.current = bonusTotals;
  }, [bonusTotals]);

  useEffect(() => {
    baseTotalRef.current = baseTotal;
  }, [baseTotal]);

  useEffect(() => {
    pointsSummaryRef.current = pointsSummary;
  }, [pointsSummary]);

  useEffect(() => {
    loreAccurateRef.current = loreAccurate;
  }, [loreAccurate]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    return () => {
      Object.values(holdStateRef.current).forEach(state => {
        if (state.timeoutId !== null) {
          window.clearTimeout(state.timeoutId);
        }
      });
    };
  }, []);

  function getMaxBaseForKey(key: AttributeKey) {
    if (!loreAccurate || !pointsSummary) {
      return 50;
    }
    const baselineTotal = attributeList.length * 10;
    const maxBaseTotal = baselineTotal + pointsSummary.total;
    const otherTotal = baseTotal - Number(attributes[key] ?? 0);
    return Math.min(50, maxBaseTotal - otherTotal);
  }

  function getMaxBaseForKeyRef(key: AttributeKey) {
    if (!loreAccurateRef.current || !pointsSummaryRef.current) {
      return 50;
    }
    const baselineTotal = attributeList.length * 10;
    const maxBaseTotal =
      baselineTotal + pointsSummaryRef.current.total;
    const otherTotal =
      baseTotalRef.current -
      Number(attributesRef.current[key] ?? 0);
    return Math.min(50, maxBaseTotal - otherTotal);
  }

  function getTotalBounds(key: AttributeKey) {
    const bonus = getBonus(bonusTotals, key);
    const minTotalRaw = 10 + bonus;
    const maxBase = getMaxBaseForKey(key);
    const maxTotalRaw = maxBase + bonus;
    const maxTotal = Math.min(50, maxTotalRaw);
    const minTotal = Math.min(maxTotal, minTotalRaw);
    return { bonus, minTotal, maxBase, maxTotal };
  }

  function getTotalBoundsRef(key: AttributeKey) {
    const bonus = getBonus(bonusTotalsRef.current, key);
    const minTotalRaw = 10 + bonus;
    const maxBase = getMaxBaseForKeyRef(key);
    const maxTotalRaw = maxBase + bonus;
    const maxTotal = Math.min(50, maxTotalRaw);
    const minTotal = Math.min(maxTotal, minTotalRaw);
    return { bonus, minTotal, maxBase, maxTotal };
  }

  function getValueFrom(
    source: Record<AttributeKey, string>,
    fallback: Record<AttributeKey, number>,
    key: AttributeKey
  ) {
    const n = Number(source[key]);
    if (Number.isFinite(n)) return n;
    return Number(fallback[key] ?? 10);
  }

  function getCurrentValue(key: AttributeKey) {
    return getValueFrom(drafts, totals, key);
  }

  function getCurrentValueRef(key: AttributeKey) {
    return getValueFrom(draftsRef.current, totalsRef.current, key);
  }

  function updateAttr(key: AttributeKey, value: string) {
    setDrafts(prev => ({
      ...prev,
      [key]: value,
    }));

    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const { bonus, minTotal, maxBase, maxTotal } =
      getTotalBoundsRef(key);
    if (n < minTotal || n > maxTotal) return;

    const nextBase = n - bonus;
    const clampedBase = Math.max(10, Math.min(maxBase, nextBase));
    onChange({
      ...attributesRef.current,
      [key]: clampedBase,
    });
  }

  function commitAttr(key: AttributeKey) {
    const n = Number(drafts[key]);
    const safe = Number.isFinite(n) ? n : totals[key];
    const { bonus, minTotal, maxBase, maxTotal } =
      getTotalBounds(key);
    const clampedTotal = Math.max(
      minTotal,
      Math.min(maxTotal, safe)
    );
    const nextBase = Math.max(10, Math.min(maxBase, clampedTotal - bonus));

    setDrafts(prev => ({
      ...prev,
      [key]: String(nextBase + bonus),
    }));

    if (nextBase !== attributes[key]) {
      onChange({
        ...attributesRef.current,
        [key]: nextBase,
      });
    }
  }

  function stepAttr(key: AttributeKey, delta: number) {
    if (lockedRef.current) return;
    const current = getCurrentValueRef(key);
    const { minTotal, maxTotal } = getTotalBoundsRef(key);
    const next = Math.max(
      minTotal,
      Math.min(maxTotal, current + delta)
    );
    updateAttr(key, String(next));
  }

  function canDecreaseRef(key: AttributeKey) {
    const { minTotal } = getTotalBoundsRef(key);
    return !lockedRef.current && getCurrentValueRef(key) > minTotal;
  }

  function canIncreaseRef(key: AttributeKey) {
    const { maxTotal, maxBase } = getTotalBoundsRef(key);
    const currentTotal = getCurrentValueRef(key);
    const points = pointsSummaryRef.current;
    const hasPoints =
      !loreAccurateRef.current ||
      !points ||
      (points.remaining > 0 &&
        Number(attributesRef.current[key] ?? 0) < maxBase);
    return !lockedRef.current && hasPoints && currentTotal < maxTotal;
  }

  function getHoldState(key: AttributeKey, delta: number) {
    const id = `${key}:${delta}`;
    const existing = holdStateRef.current[id];
    if (existing) return existing;
    const next = { timeoutId: null, active: false };
    holdStateRef.current[id] = next;
    return next;
  }

  function clearHold(key: AttributeKey, delta: number) {
    const state = getHoldState(key, delta);
    state.active = false;
    if (state.timeoutId !== null) {
      window.clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
  }

  function makeHoldHandlers(
    key: AttributeKey,
    delta: number,
    canStep: () => boolean
  ) {
    const clear = () => clearHold(key, delta);

    const tick = () => {
      const state = getHoldState(key, delta);
      if (!state.active) return;
      if (!canStep()) {
        clear();
        return;
      }
      stepAttr(key, delta);
      state.timeoutId = window.setTimeout(tick, 60);
    };

    const start = (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      if (!canStep()) return;
      const state = getHoldState(key, delta);
      e.currentTarget.setPointerCapture(e.pointerId);
      state.active = true;
      stepAttr(key, delta);
      state.timeoutId = window.setTimeout(tick, 300);
    };

    const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        clear();
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!canStep()) return;
      stepAttr(key, delta);
    };

    return {
      onPointerDown: start,
      onPointerMove,
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onLostPointerCapture: clear,
      onKeyDown,
    };
  }

  return (
    <div className="block attributes-block">
      <div className="block-title">Attributes</div>
      {loreAccurate ? (
        pointsSummary ? (
          <div className="attribute-points-summary">
            <div className="attribute-points-count">
              Attribute Points: {pointsSummary.remaining} remaining /{" "}
              {pointsSummary.total}
            </div>
            {pointsSummary.note ? (
              <div className="attribute-points-note">
                {pointsSummary.note}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="attribute-points-summary attribute-points-empty">
            Select a class to roll attribute points.
          </div>
        )
      ) : null}

      {attributeList.map(([label, key]) => {
        const bonusLines = bonusSources
          .map(source => ({
            label: source.label,
            value: source.values[key] ?? 0,
          }))
          .filter(entry => Number(entry.value) !== 0);
        const { minTotal, maxBase, maxTotal } = getTotalBounds(key);
        const currentTotal = getCurrentValue(key);
        const canIncrease =
          !locked &&
          (!loreAccurate ||
            !pointsSummary ||
            (pointsSummary.remaining > 0 &&
              Number(attributes[key] ?? 0) < maxBase)) &&
          currentTotal < maxTotal;
        const decHold = makeHoldHandlers(
          key,
          -1,
          () => canDecreaseRef(key)
        );
        const incHold = makeHoldHandlers(
          key,
          1,
          () => canIncreaseRef(key)
        );
        return (
          <div className="attribute-row" key={key}>
            <div className="field-row">
              <label className="label">{label}:</label>
              <div className="stepper-controls">
                <button
                  className="stepper-button"
                  type="button"
                  {...decHold}
                  disabled={locked || currentTotal <= minTotal}
                >
                  -
                </button>
                <input
                  className="input small-input"
                  type="number"
                  min={minTotal}
                  max={maxTotal}
                  value={drafts[key]}
                  disabled={locked}
                  onChange={(e) => updateAttr(key, e.target.value)}
                  onBlur={() => commitAttr(key)}
                />
                <button
                  className="stepper-button"
                  type="button"
                  {...incHold}
                  disabled={!canIncrease}
                >
                  +
                </button>
              </div>
            </div>
            {bonusLines.map(entry => (
              <div
                key={`${key}-${entry.label}`}
                className="attribute-bonus"
              >
                {entry.label} bonus:{" "}
                {entry.value > 0 ? "+" : ""}
                {entry.value}
              </div>
            ))}
          </div>
        );
      })}

      {/* Lock checkbox */}
      <div className="checkbox-row" style={{ marginTop: 6 }}>
        <input
          id="lore-accurate"
          type="checkbox"
          checked={loreAccurate}
          onChange={(e) =>
            onLoreAccurateChange?.(e.target.checked)
          }
        />
        <label htmlFor="lore-accurate">lore accurate</label>
      </div>

      <div className="checkbox-row">
        <input
          id="lock-attrs"
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
        />
        <label htmlFor="lock-attrs">Lock Attributes</label>
      </div>
    </div>
  );
}
