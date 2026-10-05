export type SeverityLevel = 'Normal' | 'Moderate' | 'Severe' | 'Critical';
export type OutcomeStatus = 'Active' | 'Recovered' | 'Deceased';
export type GenderType = 'Male' | 'Female' | 'Other';
export type RiskClassification = 'Low' | 'Medium' | 'High' | 'Critical';

export interface OutbreakRecord {
  id: string;
  date: string; // YYYY-MM-DD
  region: string; // Region / Zone (e.g., Chennai, Coimbatore, Madurai)
  district?: string; // District alias
  disease: string;
  age?: number; // e.g. 25, 42, 12
  ageGroup?: string; // Child (0-12), Teen (13-19), Adult (20-59), Senior (60+)
  sex: GenderType;
  severity: SeverityLevel;
  symptoms: string[];
  cases: number; // Cases recorded
  deaths: number; // Deaths recorded
  recovered: number; // Recovered recorded
  population?: number;
  notes?: string;
  weather?: string;
  hospitalized?: boolean;
  icu?: boolean;
}

export type AlertLevel = 'critical' | 'high' | 'medium';

export interface LiveAlert {
  id: string;
  title: string;
  type: 'growth' | 'spike' | 'cluster' | 'transmission';
  level: AlertLevel;
  location: string;
  disease: string;
  metric: string;
  recommendation: string;
  timestamp: string;
}

export interface DiseaseStat {
  name: string;
  count: number;
  percentage: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  growthRate: number; // percentage vs prior period
  r0Estimate: number;
  affectedDistricts: string[];
}

export interface ZoneStat {
  name: string;
  count: number;
  riskScore: number; // 0 - 100
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  activeDiseases: string[];
  weeklyGrowth: number;
  latitude?: number;
  longitude?: number;
  coordinates?: { x: number; y: number };
}

export interface DailyTrendPoint {
  date: string;
  cases: number;
  deaths: number;
  recovered: number;
  movingAvg7: number;
  growthRate?: number;
}

export interface ForecastPoint {
  day: string;
  date: string;
  predictedCases: number;
  lowerCI: number;
  upperCI: number;
}

export interface OutbreakPrediction {
  disease: string;
  probability: number; // 0 - 100%
  timeWindow: string; // e.g. "2–4 Weeks"
  affectedDistricts: string[]; // e.g. ["Chennai", "Chengalpattu", "Kanchipuram"]
  explanation: string;
  projectedCases: number;
  growthRate: number;
  estimatedR0: number;
  secondaryOutbreaks: {
    disease: string;
    probability: number;
    districts: string[];
    timeWindow: string;
  }[];
}

export interface OutbreakAnomaly {
  id: string;
  date: string;
  region: string;
  disease: string;
  actual: number;
  expected: number;
  zScore: number;
  severity: 'Moderate' | 'Severe' | 'Extreme';
  reason: string;
}

export interface EpidemiologicalIntelligence {
  totalCases: number;
  activeCases: number;
  recoveredCount: number;
  deceasedCount: number;
  communityHealthScore: number; // 0 - 100, purely data-calculated!
  activeAlertsCount: number;
  highRiskZonesCount: number;
  estimatedR0: number;
  growthRatePct: number;
  dateRange: { start: string; end: string } | null;
  topDiseases: DiseaseStat[];
  topZones: ZoneStat[];
  dailyTrends: DailyTrendPoint[];
  severityDistribution: { severity: SeverityLevel; count: number; percentage: number }[];
  ageGroupDistribution: { ageGroup: string; count: number; percentage: number }[];
  anomalies: OutbreakAnomaly[];
  forecast7Day: ForecastPoint[];
  forecast30Day: ForecastPoint[];
  prediction: OutbreakPrediction;
  liveAlerts: LiveAlert[];
}

export type ActivePage =
  | 'overview'
  | 'dashboard'
  | 'map'
  | 'network'
  | 'prediction'
  | 'alerts'
  | 'analytics'
  | 'dataset'
  | 'upload'
  | 'copilot'
  | 'export'
  | 'settings';
