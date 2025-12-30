export type LabelScore = { label: string; score: number };

export type Prediction = {
  id: string;
  text: string;
  createdAt: number;
  threshold: number;
  top: LabelScore[];
  labelsOverThreshold: LabelScore[];
};
