
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
  
  // Le point de départ réel est la signature T0
  let currentPointer = new Date(signatureDate);

  const getPhaseConfig = (id: string, defaultEnabled: boolean, defaultDuration: number) => {
    const ov = overrides[id];
    const enabled = ov ? ov.enabled : defaultEnabled;
    const duration = (ov && ov.manualDuration !== undefined && ov.manualDuration > 0) ? ov.manualDuration : defaultDuration;
    return { enabled, duration };
  };

  // 1. NÉGOCIATION (Antérieure à T0)
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

  // 2. URBANISME (Verrou n°1 : Rien ne démarre avant)
  const urbDefaultDur = (type === ProjectType.TOITURE_NEUVE || powerKwc > 3000 ? 6 : 4);
  const urb = getPhaseConfig('urbanisme', true, urbDefaultDur);
  
  let urbanismeEndDate: Date;
  if (urb.enabled) {
    const start = new Date(currentPointer);
    urbanismeEndDate = addMonths(start, urb.duration);
    phases.push({
      id: 'urbanisme',
      name: 'Urbanisme',
      startDate: start,
      durationMonths: urb.duration,
      endDate: urbanismeEndDate,
      color: COLORS.PHASES.URBANISME
    });
  } else {
    // Si pas d'urbanisme complet, audit obligatoire de 20 jours
    const auditDuration = 0.66; 
    const start = new Date(currentPointer);
    urbanismeEndDate = addMonths(start, auditDuration);
    phases.push({
      id: 'audit_urb',
      name: 'Vérification Urbanisme',
      startDate: start,
      durationMonths: auditDuration,
      endDate: urbanismeEndDate,
      color: '#94a3b8',
      isMilestone: true
    });
  }
  
  // Après l'urbanisme, on peut lancer le reste
  currentPointer = new Date(urbanismeEndDate);

  // 3. AO CRE (Parallèle au Bail, après Urbanisme)
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

  // 4. BAIL (Parallèle au CRE, après Urbanisme)
  const bailDefaultEnabled = mode === ProjectMode.TIERS_INVEST;
  const bail = getPhaseConfig('bail', bailDefaultEnabled, 4);
  let bailEndDate = new Date(currentPointer);
  if (bail.enabled) {
    bailEndDate = addMonths(currentPointer, bail.duration);
    phases.push({
      id: 'bail',
      name: 'Gestion Bail',
      startDate: new Date(currentPointer),
      durationMonths: bail.duration,
      endDate: bailEndDate,
      color: COLORS.PHASES.BAIL,
      isMilestone: true
    });
  }

  // Le raccordement et la construction attendent la fin du CRE et du Bail (Sécurisation foncière et tarifaire)
  const securingEndDate = new Date(Math.max(creEndDate.getTime(), bailEndDate.getTime()));
  currentPointer = securingEndDate;

  // 5. RACCORDEMENT
  let raccDefaultDur = 6;
  if (connection === ConnectionType.INJECTION) {
    if (powerKwc <= 36) raccDefaultDur = 6;
    else if (powerKwc <= 250) raccDefaultDur = 9;
    else if (powerKwc <= 1000) raccDefaultDur = 12;
    else raccDefaultDur = 18;
  } else {
    raccDefaultDur = 5;
  }
  const racc = getPhaseConfig('raccordement', true, raccDefaultDur);
  const raccStartDate = new Date(currentPointer);
  const raccEndDate = addMonths(raccStartDate, racc.duration);
  
  if (racc.enabled) {
    phases.push({
      id: 'raccordement',
      name: 'Raccordement',
      startDate: raccStartDate,
      durationMonths: racc.duration,
      endDate: raccEndDate,
      color: COLORS.PHASES.RACCORDEMENT
    });
  }

  // 6. CONSTRUCTION (Doit finir en même temps que le raccordement pour optimiser le COD)
  let constrWorkMonths = 4;
  if (powerKwc > 1000) constrWorkMonths = 12;
  else if (powerKwc >= 600) constrWorkMonths = 6;
  
  const cons = getPhaseConfig('construction', true, constrWorkMonths);
  if (cons.enabled) {
    // La construction finit 0.5 mois avant la fin du raccordement pour les tests
    const constrEnd = addMonths(raccEndDate, -0.5);
    let constrStart = new Date(constrEnd);
    let effectiveWorkDone = 0;
    
    // Calcul à rebours en tenant compte des mois restreints
    while (effectiveWorkDone < cons.duration) {
      constrStart = addMonths(constrStart, -1);
      const month = constrStart.getMonth();
      if (isSubcontracted || !RESTRICTED_MONTHS.includes(month)) {
        effectiveWorkDone++;
      }
    }

    // Sécurité : la construction ne peut pas démarrer avant la sécurisation (Bail/CRE)
    if (constrStart < securingEndDate) {
        const shift = securingEndDate.getTime() - constrStart.getTime();
        constrStart = new Date(securingEndDate);
        // On décale aussi la fin si on a dû décaler le début
        constrEnd.setTime(constrEnd.getTime() + shift);
        // Note: Le raccordement pourrait être impacté, mais ici on considère que la construction s'adapte
    }

    const calendaryDuration = (constrEnd.getTime() - constrStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    phases.push({
      id: 'construction',
      name: 'Construction',
      startDate: constrStart,
      durationMonths: calendaryDuration,
      endDate: constrEnd,
      color: COLORS.PHASES.CONSTRUCTION,
      isMilestone: true
    });
  }

  // 7. EXPLOITATION (COD = Fin Raccordement)
  const exp = getPhaseConfig('exploitation', true, 240); 
  if (exp.enabled) {
    phases.push({
      id: 'exploitation',
      name: 'Exploitation',
      startDate: raccEndDate,
      durationMonths: exp.duration,
      endDate: addMonths(raccEndDate, exp.duration),
      color: COLORS.PHASES.EXPLOITATION
    });
  }

  return phases;
};
