import type { CaseInput, MotorGrade } from "./schema.ts";

/**
 * ONE canonical conversion from motor data to clinical meaning.
 *
 * Previously the concordance map, the neurologic rationale, the validators and the alert
 * builder each derived motor state independently. They disagreed: the map printed
 * "Not assessed" while the reasoning printed "right knee extension at 4/5" for the same case.
 * Every view now reads this function.
 */

export type MotorCompleteness =
  | "not-assessed"
  | "focused-screen"        // one movement, one side (Rapid)
  | "partial-examination"   // some myotomes graded
  | "full-examination";     // all eight graded

export type MotorReliability =
  | "reproducible" | "pain-limited" | "effort-limited" | "give-way-inconsistent"
  | "chronic-baseline" | "uncertain" | "not-documented";

export type MotorSummary = {
  /** Was any motor information recorded at all? */
  recorded: boolean;
  completeness: MotorCompleteness;
  /** Lowest graded value across whatever was tested; null when nothing was graded. */
  lowestGrade: number | null;
  reliability: MotorReliability;
  /** True when reliability is documented — by ANY route, including character of weakness. */
  reliabilityDocumented: boolean;
  /** How much this contributes to root localization. */
  localizationContribution: "none" | "limited" | "supportive";
  /** Single display string used by the concordance map, handoff and alerts. */
  displayText: string;
  /** Short qualifier appended where reliability matters. */
  reliabilityText: string;
  domainLabel: string;
};

const numeric = (g: MotorGrade): number | null => {
  if (g === "not-tested") return null;
  if (g === "4+") return 4.5;
  const n = Number(g);
  return Number.isFinite(n) ? n : null;
};

const MOVEMENT_LABEL: Record<string, string> = {
  "knee-extension": "knee extension",
  "ankle-dorsiflexion": "ankle dorsiflexion",
  "great-toe-extension": "great-toe extension",
  "plantar-flexion": "plantar flexion",
  "heel-walk": "heel walk",
  "toe-walk": "toe walk",
  "other": "other movement",
  "not-assessed": "movement not documented",
};

const RELIABILITY_TEXT: Record<MotorReliability, string> = {
  "reproducible": "reproducible",
  "pain-limited": "pain-limited",
  "effort-limited": "effort-limited",
  "give-way-inconsistent": "give-way / inconsistent",
  "chronic-baseline": "chronic baseline",
  "uncertain": "reliability uncertain",
  "not-documented": "reliability not documented",
};

/**
 * Character of weakness IS reliability information. Recording "give-way" and then reporting
 * "reliability not documented" for the same finding is self-contradictory, and it was
 * generating two competing alerts about one observation.
 */
function rapidReliability(c: CaseInput): MotorReliability {
  switch (c.rapidMotorFinding.reliability) {
    case "objective-reproducible": return "reproducible";
    case "pain-limited": return "pain-limited";
    case "effort-limited": return "effort-limited";
    case "give-way": return "give-way-inconsistent";
    case "chronic-baseline": return "chronic-baseline";
    case "uncertain": return "uncertain";
    default: return "not-documented";
  }
}

function comprehensiveReliability(c: CaseInput): MotorReliability {
  if (c.weaknessQuality === "give-way") return "give-way-inconsistent";
  if (c.weaknessQuality === "pain-limited") return "pain-limited";
  if (c.weaknessQuality === "uncertain") return "uncertain";
  switch (c.examConfidence) {
    case "high": return "reproducible";
    case "moderate": return "chronic-baseline";
    case "low": return "effort-limited";
    default: return "not-documented";
  }
}

/** Reliability that cannot support confident localization. */
export const isLimitedReliability = (r: MotorReliability): boolean =>
  r === "give-way-inconsistent" || r === "pain-limited" ||
  r === "effort-limited" || r === "uncertain";

export function summarizeMotor(c: CaseInput): MotorSummary {
  const graded = [
    c.rightKneeExtension, c.leftKneeExtension, c.rightAnkleDorsiflexion, c.leftAnkleDorsiflexion,
    c.rightGreatToeExtension, c.leftGreatToeExtension, c.rightPlantarFlexion, c.leftPlantarFlexion,
  ].map(numeric).filter((x): x is number => x !== null);

  // --- Comprehensive examination -------------------------------------------------------
  if (graded.length > 0) {
    const lowest = Math.min(...graded);
    const reliability = comprehensiveReliability(c);
    const completeness: MotorCompleteness =
      graded.length === 8 ? "full-examination" : "partial-examination";
    const abnormal = lowest < 5;
    return {
      recorded: true, completeness, lowestGrade: lowest, reliability,
      reliabilityDocumented: reliability !== "not-documented",
      localizationContribution: !abnormal ? "none"
        : isLimitedReliability(reliability) || reliability === "not-documented" ? "limited" : "supportive",
      displayText: `${graded.length} of 8 myotomes graded; lowest ${lowest}/5`,
      reliabilityText: RELIABILITY_TEXT[reliability],
      domainLabel: completeness === "full-examination" ? "Motor examination" : "Motor examination (partial)",
    };
  }

  // --- Focused Rapid screen -------------------------------------------------------------
  const f = c.rapidMotorFinding;
  if (f.status === "present") {
    const g = numeric(f.lowestObservedGrade);
    const reliability = rapidReliability(c);
    const side = f.side === "not-assessed" ? "side not documented" : f.side;
    const movement = MOVEMENT_LABEL[f.testedMovement] ?? f.testedMovement;
    return {
      recorded: true, completeness: "focused-screen", lowestGrade: g, reliability,
      reliabilityDocumented: reliability !== "not-documented",
      localizationContribution:
        g === null ? "limited"
        : isLimitedReliability(reliability) || reliability === "not-documented" ? "limited"
        : "supportive",
      displayText: `${side} ${movement}${g === null ? "" : ` ${f.lowestObservedGrade}/5`}`,
      reliabilityText: RELIABILITY_TEXT[reliability],
      domainLabel: "Focused motor screen",
    };
  }

  if (f.status === "absent" || c.rapidMotorScreen === "absent") {
    return {
      recorded: true, completeness: "focused-screen", lowestGrade: null,
      reliability: "not-documented", reliabilityDocumented: false,
      localizationContribution: "none",
      displayText: "No focal motor deficit identified in the focused screen; myotomes not individually graded",
      reliabilityText: "", domainLabel: "Focused motor screen",
    };
  }

  return {
    recorded: false, completeness: "not-assessed", lowestGrade: null,
    reliability: "not-documented", reliabilityDocumented: false,
    localizationContribution: "none",
    displayText: "Not assessed", reliabilityText: "", domainLabel: "Motor examination",
  };
}

/** Concordance-map row text, identical to what the reasoning and handoff show. */
export function motorConcordanceText(m: MotorSummary): string {
  if (!m.recorded) return "Not assessed";
  if (m.lowestGrade === null) return m.displayText;
  return m.reliabilityText ? `${m.displayText}, ${m.reliabilityText}` : m.displayText;
}

export function motorConcordanceStatus(m: MotorSummary): "support" | "conflict" | "missing" | "neutral" {
  if (!m.recorded) return "missing";
  if (m.localizationContribution === "supportive") return "support";
  if (m.localizationContribution === "limited") return "neutral";
  return "neutral";
}
