
export enum ProjectType {
  TOITURE_NEUVE = 'Toiture Neuve',
  RENOVATION = 'Rénovation',
  OMBRIERE = 'Ombrière',
  SOL = 'Sol'
}

export enum ProjectMode {
  EPC_SIMPLE = 'EPC+',
  TIERS_INVEST = 'EPC++ (Tiers-Invest)'
}

export enum ConnectionType {
  INJECTION = 'Injection Réseau',
  AUTOCONSO = 'Autoconsommation'
}

export interface Phase {
  id: string;
  name: string;
  startDate: Date;
  durationMonths: number;
  endDate: Date;
  color: string;
  isMilestone?: boolean;
}

export interface PhaseOverride {
  enabled: boolean;
  manualDuration?: number;
}

export interface Project {
  id: string;
  name: string;
  powerKwc: number;
  type: ProjectType;
  mode: ProjectMode;
  connection: ConnectionType;
  signatureDate: Date;
  isSubcontracted: boolean;
  phases: Phase[];
  overrides?: Record<string, PhaseOverride>;
}
