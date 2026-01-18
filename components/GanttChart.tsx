
import React, { useState, useRef, useMemo } from 'react';
import { Project, Phase } from '../types';
import { RESTRICTED_MONTHS, addMonths, diffMonths, formatMonth, COLORS } from '../constants';

interface GanttChartProps {
  projects: Project[];
}

const GanttChart: React.FC<GanttChartProps> = ({ projects }) => {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  /**
   * Génère un fichier CSV compatible Excel avec toutes les phases dépliées
   */
  const exportGanttToExcel = () => {
    if (projects.length === 0) return;

    // Définition des colonnes
    const headers = [
      "ID Projet",
      "Nom du Site",
      "Puissance (kWc)",
      "Phase",
      "Date de Début",
      "Date de Fin",
      "Durée (Mois)",
      "Type de Jalon"
    ];
    
    // Extraction de toutes les phases pour chaque projet (mode déplié)
    const rows = projects.flatMap((project, index) => 
      project.phases.map(phase => {
        const isMilestone = phase.isMilestone ? "OUI" : "NON";
        return [
          index + 1,
          project.name,
          project.powerKwc,
          phase.name,
          phase.startDate.toLocaleDateString('fr-FR'),
          phase.endDate.toLocaleDateString('fr-FR'),
          Math.round(phase.durationMonths * 10) / 10,
          isMilestone
        ];
      })
    );

    // Construction du contenu CSV (Point-virgule pour Excel FR)
    const csvRows = [headers, ...rows];
    const csvContent = csvRows
      .map(row => row.map(cell => `"${cell}"`).join(";"))
      .join("\n");

    // Ajout du BOM UTF-8 pour le support des accents sous Excel
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Helexia_Gantt_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ganttStartDate = useMemo(() => {
    if (projects.length === 0) return new Date(2025, 0, 1);
    let earliest = new Date(8640000000000000);
    projects.forEach(p => {
      p.phases.forEach(ph => {
        if (ph.id !== 'negociation' && ph.startDate < earliest) earliest = ph.startDate;
      });
    });
    return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  }, [projects]);

  const displayWindowMonths = 36;
  const labelWidth = 240; 

  const months = useMemo(() => {
    return Array.from({ length: displayWindowMonths }).map((_, i) => addMonths(ganttStartDate, i));
  }, [ganttStartDate, displayWindowMonths]);

  const getMilestoneLabel = (phaseId: string) => {
    if (phaseId === 'negociation') return 'LOI';
    if (phaseId === 'urbanisme') return 'ACCORD';
    if (phaseId === 'cre') return 'LAURÉAT';
    if (phaseId === 'bail') return 'BAIL';
    if (phaseId === 'construction') return 'ACHÈVEMENT';
    if (phaseId === 'exploitation') return 'COD';
    if (phaseId === 'audit_urb') return 'OK';
    return '';
  };

  const legendItems = [
    { label: 'Négociation', color: COLORS.PHASES.NEGOTIATION },
    { label: 'Urbanisme', color: COLORS.PHASES.URBANISME },
    { label: 'AO CRE', color: COLORS.PHASES.CRE },
    { label: 'Gestion Bail', color: COLORS.PHASES.BAIL },
    { label: 'Raccordement', color: COLORS.PHASES.RACCORDEMENT },
    { label: 'Construction', color: COLORS.PHASES.CONSTRUCTION },
    { label: 'COD', color: COLORS.PHASES.EXPLOITATION },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-6 px-4">
        {/* Barre d'outils et Export */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[8px] font-black text-white/60 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 restricted-bg rounded-sm opacity-50" /> Zones d'arrêt
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[8px] font-black text-white/60 uppercase tracking-widest">
                  <div className="w-2 h-2 border-[1.5px] border-helexia-blue rotate-45 bg-helexia-green shadow-sm" /> Jalons
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[8px] font-black text-white/60 uppercase tracking-widest">
                  <span className="text-helexia-green font-bold">36M</span> Vue Standard
              </div>
          </div>
          <button 
            onClick={exportGanttToExcel}
            className="flex items-center gap-2 bg-helexia-green text-helexia-blue px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 group"
          >
            Exporter Gantt Excel
          </button>
        </div>

        {/* Légende interactive */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 py-4 border-y border-white/5">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest italic">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={chartRef} className="glass-card rounded-[2.5rem] soft-shadow border border-white/10 overflow-hidden w-full">
        <div className="w-full flex flex-col">
          
          <div className="flex border-b border-slate-100 bg-slate-50/30 sticky top-0 z-30 w-full">
            <div className="bg-white border-r border-slate-100 px-6 py-6 flex flex-col justify-center shrink-0" style={{ width: labelWidth }}>
              <span className="font-black text-helexia-blue text-[10px] uppercase tracking-widest italic leading-none">Timeline</span>
              <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-60">Master View 36M</span>
            </div>
            
            <div className="flex flex-1 min-w-0">
              {months.map((m, i) => {
                const isNewYear = m.getMonth() === 0;
                return (
                  <div key={i} className={`relative border-r border-slate-100 flex flex-col justify-end pb-3 flex-1 min-w-0 ${RESTRICTED_MONTHS.includes(m.getMonth()) ? 'bg-slate-100/10' : ''}`} style={{ height: 70 }}>
                    {isNewYear && (
                      <div className="absolute top-3 left-1 font-black text-helexia-blue text-[9px] border-l-2 border-helexia-green pl-1">
                        {m.getFullYear()}
                      </div>
                    )}
                    <div className="text-center text-[7px] font-black text-slate-300 uppercase">
                      {m.toLocaleDateString('fr-FR', { month: 'narrow' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-slate-50 w-full">
            {projects.map((project, index) => {
              const isExpanded = expandedProjects.includes(project.id);
              return (
                <div key={project.id} className="group/project w-full">
                  <div className="flex hover:bg-slate-50/20 transition-colors w-full h-16">
                    <div 
                      className="bg-white group-hover/project:bg-slate-50/40 border-r border-slate-100 px-6 py-4 flex items-center justify-between cursor-pointer shrink-0" 
                      style={{ width: labelWidth }}
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${isExpanded ? 'bg-helexia-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {index + 1}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <div className="font-black text-helexia-blue text-[11px] uppercase truncate italic">{project.name}</div>
                          <div className="text-[8px] font-bold text-helexia-green uppercase tracking-widest">{project.powerKwc} kWc</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${isExpanded ? 'bg-helexia-blue text-white rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div className="relative h-full flex items-center bg-white flex-1 min-w-0 pr-10">
                      {!isExpanded && (
                        <div className="flex h-8 rounded-lg overflow-hidden relative ring-1 ring-slate-100 shadow-sm w-full mx-4 bg-slate-50/50">
                          {project.phases.map(phase => {
                            const isExp = phase.id === 'exploitation';
                            const displayDate = isExp ? addMonths(phase.startDate, 1) : phase.startDate;
                            const startOffset = diffMonths(ganttStartDate, displayDate);
                            const leftPercent = (startOffset / displayWindowMonths) * 100;
                            const widthPercent = (phase.durationMonths / displayWindowMonths) * 100;
                            
                            if (isExp) {
                              return (
                                <div 
                                  key={phase.id} 
                                  className="absolute h-full w-[2px] bg-helexia-green z-10" 
                                  style={{ left: `${leftPercent}%` }}
                                  title="COD"
                                />
                              );
                            }

                            return (
                              <div 
                                key={phase.id} 
                                className="absolute h-full border-r border-white/10 flex items-center justify-center" 
                                style={{ 
                                  left: `${Math.max(0, leftPercent)}%`, 
                                  width: `${Math.max(0, widthPercent)}%`, 
                                  backgroundColor: phase.color 
                                }}
                              >
                                {widthPercent > 3 && (
                                  <span className="text-[6px] font-black text-white/90 uppercase pointer-events-none">
                                    {Math.round(phase.durationMonths)}M
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/10 pb-8 w-full">
                      {project.phases.map((phase) => {
                        const isExp = phase.id === 'exploitation';
                        const displayDate = isExp ? addMonths(phase.startDate, 1) : phase.startDate;
                        const startOffset = diffMonths(ganttStartDate, displayDate);
                        const leftPercent = (startOffset / displayWindowMonths) * 100;
                        const widthPercent = (phase.durationMonths / displayWindowMonths) * 100;
                        
                        return (
                          <div key={phase.id} className="flex h-16 items-center hover:bg-white transition-all relative border-b border-slate-50 w-full">
                            <div className="bg-transparent border-r border-slate-100 px-8 text-[9px] font-black text-helexia-blue uppercase tracking-widest flex items-center h-full italic shrink-0" style={{ width: labelWidth }}>
                              {phase.name}
                            </div>
                            
                            <div className="relative h-full flex flex-1 min-w-0 pr-10">
                                <div className="absolute flex items-center h-full" style={{ 
                                  left: `${leftPercent}%`, 
                                  width: isExp ? 'auto' : `${widthPercent}%` 
                                }}>
                                   {!isExp ? (
                                     <>
                                       <span className="absolute top-[75%] left-0 -translate-x-1/2 text-[7px] font-black text-slate-400 uppercase italic whitespace-nowrap z-10">
                                          {formatMonth(phase.startDate)}
                                       </span>
                                       
                                       <div className="relative h-7 rounded flex items-center justify-center text-[9px] text-white font-black shadow-sm w-full group-hover:scale-[1.02] transition-transform" style={{ backgroundColor: phase.color }}>
                                          <span className="opacity-90">
                                            {phase.durationMonths < 0.8 ? '20J' : `${Math.round(phase.durationMonths)}M`}
                                          </span>
                                       </div>

                                       {phase.isMilestone && (
                                          <div className="absolute top-1/2 -translate-y-1/2 left-full flex items-center gap-2 z-20">
                                            <div className="w-4 h-4 bg-helexia-green border-2 border-helexia-blue rotate-45 shadow-lg ml-[-8px] transition-transform group-hover:rotate-[225deg]" />
                                            <div className="flex flex-col">
                                              <span className="font-black text-[8px] text-helexia-blue bg-white/95 px-2 py-0.5 rounded-md border border-slate-100 shadow-sm whitespace-nowrap italic uppercase leading-tight">
                                                {getMilestoneLabel(phase.id)}
                                              </span>
                                            </div>
                                          </div>
                                       )}

                                       <span className="absolute top-[75%] left-full -translate-x-1/2 text-[7px] font-black text-slate-400 uppercase italic whitespace-nowrap z-10">
                                          {formatMonth(phase.endDate)}
                                       </span>
                                     </>
                                   ) : (
                                     <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-helexia-green border-[2.5px] border-helexia-blue rotate-45 shadow-xl transition-all hover:scale-125 hover:rotate-[225deg]" />
                                        <div className="flex flex-col">
                                          <span className="font-black text-[10px] text-helexia-blue uppercase italic tracking-tighter leading-none">COD</span>
                                          <span className="text-[7px] font-black text-helexia-green uppercase italic whitespace-nowrap">{formatMonth(displayDate)}</span>
                                        </div>
                                     </div>
                                   )}
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
