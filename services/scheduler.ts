
import { Project, ProjectType, ProjectMode, ConnectionType, Phase, PhaseOverride } from '../types';
import { addMonths, COLORS, RESTRICTED_MONTHS } from '../constants';

interface CalculationParams extends Partial<Project> {
  overrides?: Record<string, PhaseOverride>;
}

export const calculatePhases = (params: CalculationParams): Phase[] => {
  const { 
    signatureDate = new Date(), 
    powerKwc = 500, 
    type = ProjectType.TOITURE_NEUVE, 
    mode = ProjectMode.EPC_SIMPLE,
    connection = ConnectionType.INJECTION,
    isSubcontracted = false,
    overrides = {}
  } = params;

  const phases: Phase[] = [];
  let currentPointer = new Date(signatureDate);

  const getPhaseConfig = (id: string, defaultEnabled: boolean, defaultDuration: number) => {
    const ov = overrides[id];
    const enabled = ov ? ov.enabled : defaultEnabled;
    const duration = (ov && ov.manualDuration !== undefined && ov.manualDuration > 0) ? ov.manualDuration : defaultDuration;
    return { enabled, duration };
  };

  // 1. NÉGOCIATION
  const neg = getPhaseConfig('negociation', true, 0.5);
  if (neg.enabled) {
    phases.push({
      id: 'negociation',
      name: 'Négociation',
      startDate: addMonths(signatureDate, -neg.duration),
      durationMonths: neg.duration,
      endDate: signatureDate,
      color: COLORS.PHASES.NEGOTIATION
    });
  }

  // 2. URBANISME
  const urbDefaultDur = (type === ProjectType.TOITURE_NEUVE || powerKwc > 3000 ? 6 : 4);
  const urb = getPhaseConfig('urbanisme', true, urbDefaultDur);
  let urbanismeEndDate = new Date(currentPointer);
  if (urb.enabled) {
    urbanismeEndDate = addMonths(currentPointer, urb.duration);
    phases.push({
      id: 'urbanisme',
      name: 'Urbanisme',
      startDate: new Date(currentPointer),
      durationMonths: urb.duration,
      endDate: urbanismeEndDate,
      color: COLORS.PHASES.URBANISME
    });
  } else {
    const auditDur = 0.66;
    urbanismeEndDate = addMonths(currentPointer, auditDur);
    phases.push({
      id: 'audit_urb',
      name: 'Vérification Urbanisme',
      startDate: new Date(currentPointer),
      durationMonths: auditDur,
      endDate: urbanismeEndDate,
      color: '#cbd5e1'
    });
  }
  
  currentPointer = new Date(urbanismeEndDate);

  // 3. SÉCURISATION (En parallèle après Urba)
  const creDefaultEnabled = powerKwc > 100 && connection === ConnectionType.INJECTION;
  const cre = getPhaseConfig('cre', creDefaultEnabled, 4);
  let creEndDate = new Date(currentPointer);
  if (cre.enabled) {
    creEndDate = addMonths(currentPointer, cre.duration);
    phases.push({
      id: 'cre',
      name: 'AO CRE',
      startDate: new Date(currentPointer),
      durationMonths: cre.duration,
      endDate: creEndDate,
      color: COLORS.PHASES.CRE,
      isMilestone: true
    });
  }

  const bailDefaultEnabled = mode === ProjectMode.TIERS_INVEST;
  const bail = getPhaseConfig('bail', bailDefaultEnabled, 4);
  let bailEndDate = new Date(currentPointer);
  if (bail.enabled) {
    const bailStart = new Date(currentPointer);
    bailEndDate = addMonths(bailStart, bail.duration);
    phases.push({
      id: 'bail',
      name: 'Gestion Bail',
      startDate: bailStart,
      durationMonths: bail.duration,
      endDate: bailEndDate,
      color: COLORS.PHASES.BAIL,
      isMilestone: true
    });
  }

  // 4. RACCORDEMENT (Dépend d'Urba + AO CRE, mais PAS du bail)
  const raccordementStartDate = new Date(Math.max(currentPointer.getTime(), creEndDate.getTime()));
  let raccDefaultDur = 6;
  if (connection === ConnectionType.INJECTION) {
    if (powerKwc <= 36) raccDefaultDur = 6;
    else if (powerKwc <= 250) raccDefaultDur = 9;
    else if (powerKwc <= 1000) raccDefaultDur = 12;
    else raccDefaultDur = 18;
  } else raccDefaultDur = 5;

  const racc = getPhaseConfig('raccordement', true, raccDefaultDur);
  let raccEndDate = new Date(raccordementStartDate);
  if (racc.enabled) {
    raccEndDate = addMonths(raccordementStartDate, racc.duration);
    phases.push({
      id: 'raccordement',
      name: 'Raccordement',
      startDate: new Date(raccordementStartDate),
      durationMonths: racc.duration,
      endDate: raccEndDate,
      color: COLORS.PHASES.RACCORDEMENT
    });
  }

  // 5. CONSTRUCTION (Pilotée par le raccordement, verrouillée par la sécurisation totale)
  const securityLockDate = new Date(Math.max(creEndDate.getTime(), bailEndDate.getTime()));
  let constrWorkMonths = powerKwc > 1000 ? 12 : (powerKwc >= 600 ? 6 : 4);
  const cons = getPhaseConfig('construction', true, constrWorkMonths);
  
  if (cons.enabled) {
    const constrEnd = addMonths(raccEndDate, -0.5);
    let constrStart = new Date(constrEnd);
    let effectiveWorkDone = 0;
    
    while (effectiveWorkDone < cons.duration) {
      constrStart = addMonths(constrStart, -1);
      const month = constrStart.getMonth();
      if (isSubcontracted || !RESTRICTED_MONTHS.includes(month)) {
        effectiveWorkDone++;
      }
    }

    if (constrStart < securityLockDate) {
        constrStart = new Date(securityLockDate);
    }

    const calDur = (constrEnd.getTime() - constrStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    phases.push({
      id: 'construction',
      name: 'Construction',
      startDate: constrStart,
      durationMonths: calDur,
      endDate: constrEnd,
      color: COLORS.PHASES.CONSTRUCTION,
      isMilestone: true
    });
  }

  // 6. EXPLOITATION (COD = Fin Raccordement + 1 mois)
  const exp = getPhaseConfig('exploitation', true, 12); 
  if (exp.enabled) {
    const codDate = addMonths(raccEndDate, 1);
    phases.push({
      id: 'exploitation',
      name: 'Exploitation',
      startDate: codDate,
      durationMonths: exp.duration,
      endDate: addMonths(codDate, exp.duration),
      color: COLORS.PHASES.EXPLOITATION,
      isMilestone: true
    });
  }

  return phases;
};
