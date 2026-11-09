export type RiskType = 'FLOOD' | 'HEAT_ISLAND' | 'SERVICE_OUTAGE';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SourceType = 'SENSOR' | 'PUBLIC_DATASET' | 'COMMUNITY';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
  id: number;
  riskType: RiskType;
  title: string;
  region: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  priorityScore: number;
  confidence: number;
  latestValue: number;
  peakValue: number;
  unit: string;
  observationCount: number;
  sources: SourceType[];
  primarySource?: string;
  factors: string[];
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Source {
  id: number;
  code: string;
  name: string;
  type: SourceType;
  reliability: number;
  lastSeenAt?: string;
}

export interface Observation {
  id: number;
  riskType: RiskType;
  value: number;
  unit: string;
  region: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  receivedAt: string;
  confidence: number;
  source: Source;
  description?: string;
}

export interface Dashboard {
  activeAlerts: number;
  bySeverity: Record<Severity, number>;
  byRiskType: Record<RiskType, number>;
  sourcesByType: Record<SourceType, number>;
  averageConfidence: number;
  observationsLastHour: number;
  lastObservationAt?: string;
  topAlert?: Alert;
  serverTime: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  serverTime: string;
}

export interface CommunityReport {
  riskType: RiskType;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  latitude: number;
  longitude: number;
  region?: string;
  description?: string;
  reporterId?: string;
}
