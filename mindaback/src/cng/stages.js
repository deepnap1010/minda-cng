// The 21 tracked CNG cylinder manufacturing stages (source: approved proposal deck).
// Stage 1 (Pipe Cutting) is MANUAL entry; stages 2..21 are machine-fed.
// `gate: true` marks a QA gate stage.

export const CNG_STAGES = [
  { no: 1, name: "Pipe Cutting", manual: true, gate: false },
  { no: 2, name: "Bottom Spinning", manual: false, gate: false },
  { no: 3, name: "Bottom Milling", manual: false, gate: false },
  { no: 4, name: "Cyl. Sr. No. Marking", manual: false, gate: false },
  { no: 5, name: "Neck Spinning", manual: false, gate: false },
  { no: 6, name: "Heat Treatment", manual: false, gate: false },
  { no: 7, name: "Hardness Testing", manual: false, gate: true },
  { no: 8, name: "Neck Cutting", manual: false, gate: false },
  { no: 9, name: "Neck Machining", manual: false, gate: false },
  { no: 10, name: "Neck Threading", manual: false, gate: false },
  { no: 11, name: "W/C & HST", manual: false, gate: true },
  { no: 12, name: "Inside Cleaning", manual: false, gate: false },
  { no: 13, name: "Air Leak Testing", manual: false, gate: true },
  { no: 14, name: "Air Drier", manual: false, gate: false },
  { no: 15, name: "Internal Shot Blasting", manual: false, gate: false },
  { no: 16, name: "External Shot Blasting", manual: false, gate: false },
  { no: 17, name: "Ultrasonic Testing", manual: false, gate: true },
  { no: 18, name: "Data Stamping", manual: false, gate: false },
  { no: 19, name: "Painting", manual: false, gate: false },
  { no: 20, name: "PAUT — Cyl. Bottom", manual: false, gate: true },
  { no: 21, name: "Storage on Pallet", manual: false, gate: false },
];

const BY_NO = new Map(CNG_STAGES.map((s) => [s.no, s]));

export const TOTAL_STAGES = CNG_STAGES.length;

export const stageByNo = (no) => BY_NO.get(Number(no)) || null;

export const stageName = (no) => (BY_NO.get(Number(no))?.name) || `Stage ${no}`;

export const isManualStage = (no) => Boolean(BY_NO.get(Number(no))?.manual);
