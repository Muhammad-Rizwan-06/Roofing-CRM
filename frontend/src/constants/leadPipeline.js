// src/constants/leadPipeline.js

export const LEAD_PIPELINE_STAGES = [
  "New",
  "Inspection Scheduled",
  "Estimate Sent",
  "Negotiation",
  "Won",
  "Lost",
];

// Typical CRM probabilities for forecasting
export const STAGE_PROBABILITY = {
  New: 0.1,
  "Inspection Scheduled": 0.3,
  "Estimate Sent": 0.5,
  Negotiation: 0.7,
  Won: 1,
  Lost: 0,
};

export const formatMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));