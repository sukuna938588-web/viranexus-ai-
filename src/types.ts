export type SeverityLevel = 'Mild' | 'Moderate' | 'Severe' | 'Critical';
export type OutcomeStatus = 'Active' | 'Recovered' | 'Deceased';
export type GenderType = 'Male' | 'Female' | 'Other' | 'Undisclosed';
export type RiskClassification = 'Safe' | 'Medium' | 'High';

export interface OutbreakRecord {
  id: string;
  date: string; // YYYY-MM-DD
  region: string; // Location / Area / Region
  city?: string; // Auto-detected or specified city
  district?: string;
  state?: string;
  disease: string;
  cases?: number; // Number of cases recorded (defaults to 1)
  age: number;
  ageGroup?: string; // Child (0-12), Teen (13-19), Adult (20-59), Senior (60+)
  gender: GenderType;
  severity: SeverityLevel;
  weather?: string; // Sunny/Hot, Rainy/Monsoon, Humid, Cold/Winter, Stormy
  jobType?: string; // Student, Healthcare, Office, Factory, Outdoor, Other
  hospitalized: boolean;
  icu: boolean;
  outcome: OutcomeStatus;
  symptoms: string[];
  notes?: string;
}

export interface LiveAlert {
  id: string;
  title: string;
  type: 'growth' | 'hospital' | 'spike' | 'weather';
  level: 'info' | 'warning' | 'critical';
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
  riskLevel: 'Low' | 'Guarded' | 'Elevated' | 'Critical';
  growthRate: number; // percentage vs prior period
  r0Estimate: number;
  severeRate: number;
}

export interface ZoneStat {
  name: string;
  count: number;
  riskScore: number; // 0 - 100
  riskCategory: RiskClassification;
  activeDiseases: string[];
  severeCases: number;
  hospitalizedCount: number;
  icuCount: number;
  weeklyGrowth: number;
  coordinates?: { x: number; y: number };
}

export interface DailyTrendPoint {
  date: string;
  cases: number;
  movingAvg7: number;
  severe: number;
  hospitalized: number;
  icu: number;
}

export interface ForecastPoint {
  day: string;
  date: string;
  predictedCases: number;
  lowerCI: number;
  upperCI: number;
  confidenceScore: number;
}

export interface HospitalSurgePoint {
  day: string;
  date: string;
  generalBedsRequired: number;
  icuBedsRequired: number;
  ventilatorsRequired: number;
  staffSurgeFactor: number;
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
  communityHealthScore: number; // 0 - 100
  activeAlertsCount: number;
  highRiskZonesCount: number;
  estimatedR0: number;
  growthRatePct: number;
  severeRatio: number;
  hospitalizedRatio: number;
  icuRatio: number;
  fatalityRatio: number;
  dateRange: { start: string; end: string } | null;
  topDiseases: DiseaseStat[];
  topZones: ZoneStat[];
  dailyTrends: DailyTrendPoint[];
  ageCohorts: { cohort: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  symptomFrequencies: { symptom: string; count: number; percentage: number }[];
  anomalies: OutbreakAnomaly[];
  forecast7Day: ForecastPoint[];
  forecast30Day: ForecastPoint[];
  hospitalSurge: HospitalSurgePoint[];
  radarAttributes: { attribute: string; score: number; maxScore: number; description: string }[];
  liveAlerts: LiveAlert[];
}

export type ActivePage =
  | 'landing'
  | 'dashboard'
  | 'analytics-dashboard'
  | 'disease-intelligence'
  | 'outbreak-heatmap'
  | 'forecast-center'
  | 'population-analytics'
  | 'hospital-intelligence'
  | 'ai-command-center'
  | 'alert-center'
  | 'threat-radar'
  | 'dataset-management';
