
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

  const exportGanttToExcel = () => {
    if (projects.length === 0) return;
    const headers = ["ID Projet", "Nom du Site", "Puissance (kWc)", "Phase", "Début", "Fin", "Durée (Mois)"];
    const rows = projects.flatMap((project, index) => 
      project.phases.map(phase => [
        index + 1, project.name, project.powerKwc, phase.name,
        phase.startDate.toLocaleDateString('fr-FR'),
        phase.endDate.toLocaleDateString('fr-FR'),
        Math.round(phase.durationMonths * 10) / 10
      ])
    );
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Helexia_Gantt_Excel_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ganttStartDate = useMemo(() => {
    if (projects.length === 0) return new Date(2025, 0, 1);
    let earliest = new Date(8640000000000000);
    projects.forEach(p => p.phases.forEach(ph => {
      if (ph.id !== 'negociation' && ph.startDate < earliest) earliest = ph.startDate;
    }));
    return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  }, [projects]);

  const totalMonths = 36;
  const labelWidth = 240; 

  const months = useMemo(() => Array.from({ length: totalMonths }).map((_, i) => addMonths(ganttStartDate, i)), [ganttStartDate]);

  const getMilestoneLabel = (phaseId: string) => {
    if (phaseId === 'negociation') return 'LOI';
    if (phaseId === 'cre') return 'LAURÉAT';
    if (phaseId === 'bail') return 'BAIL';
    if (phaseId === 'construction') return 'ACHÈVEMENT';
    if (phaseId === 'exploitation') return 'COD';
    return '';
  };

  return (
    <div className="space-y-6 w-full animate-fade">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 px-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 text-[8px] font-black text-white uppercase tracking-widest backdrop-blur-sm">
            <span className="w-2.5 h-2.5 restricted-bg rounded-sm" /> Zones d'arrêt BTP
          </div>
          <button onClick={exportGanttToExcel} className="bg-helexia-green text-helexia-blue px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:shadow-lg transition-all">
            Gantt Excel
          </button>
        </div>
        
        {/* Légende avec fond blanc léger amélioré */}
        <div className="flex flex-wrap gap-4 bg-white/90 p-3 px-5 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md">
          {Object.entries(COLORS.PHASES).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-[8px] font-black text-helexia-blue uppercase italic tracking-wider">
                {key === 'NEGOTIATION' ? 'Négociation' : key}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div ref={chartRef} className="glass-card overflow-hidden w-full shadow-2xl rounded-[2rem]">
        <div className="w-full">
          {/* Header */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 sticky top-0 z-30">
            <div className="bg-white border-r border-slate-100 px-6 py-4 shrink-0" style={{ width: labelWidth }}>
              <span className="font-black text-helexia-blue text-[10px] uppercase italic">Projets & Phases</span>
            </div>
            <div className="flex flex-1">
              {months.map((m, i) => (
                <div key={i} className={`flex-1 border-r border-slate-100 flex items-end justify-center pb-2 ${RESTRICTED_MONTHS.includes(m.getMonth()) ? 'bg-slate-200/20' : ''}`} style={{ height: 60 }}>
                  <div className="text-center">
                    <div className="text-[7px] font-black text-slate-400">{m.toLocaleDateString('fr-FR', { month: 'narrow' })}</div>
                    {m.getMonth() === 0 && <div className="text-[7px] font-black text-helexia-blue mt-1">{m.getFullYear()}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {projects.map((project, idx) => (
              <React.Fragment key={project.id}>
                <div 
                  className="flex h-16 hover:bg-slate-50/40 cursor-pointer transition-colors"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="bg-white border-r border-slate-100 px-6 flex items-center gap-3 shrink-0" style={{ width: labelWidth }}>
                    <div className="w-8 h-8 rounded-xl bg-helexia-blue text-white flex items-center justify-center font-black italic text-xs">{idx + 1}</div>
                    <div className="truncate font-black text-helexia-blue text-[11px] uppercase italic">{project.name}</div>
                  </div>
                  <div className="flex-1 relative flex items-center bg-white px-4">
                    {!expandedProjects.includes(project.id) && (
                      <div className="w-full h-8 bg-slate-50/50 rounded-lg relative overflow-hidden flex ring-1 ring-slate-100">
                        {project.phases.map(ph => {
                          if (ph.id === 'exploitation') return null;
                          const start = diffMonths(ganttStartDate, ph.startDate);
                          const left = (start / totalMonths) * 100;
                          const width = (ph.durationMonths / totalMonths) * 100;
                          return (
                            <div key={ph.id} className="absolute h-full flex items-center justify-center text-[7px] text-white font-black"
                                 style={{ left: `${left}%`, width: `${width}%`, backgroundColor: ph.color }}>
                              {ph.durationMonths > 1.5 && `${Math.round(ph.durationMonths)}M`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {expandedProjects.includes(project.id) && project.phases.map(ph => {
                  const startPos = diffMonths(ganttStartDate, ph.startDate);
                  const left = (startPos / totalMonths) * 100;
                  const width = (ph.durationMonths / totalMonths) * 100;
                  const isExp = ph.id === 'exploitation';

                  return (
                    <div key={ph.id} className="flex h-14 items-center bg-slate-50/10 border-b border-slate-50">
                      <div className="border-r border-slate-100 px-10 text-[9px] font-black text-helexia-blue uppercase opacity-50 italic shrink-0" style={{ width: labelWidth }}>
                        {ph.name}
                      </div>
                      <div className="flex-1 relative h-full flex items-center">
                        <div className="absolute h-6 flex items-center" style={{ left: `${left}%`, width: isExp ? 'auto' : `${width}%` }}>
                          
                          {!isExp ? (
                            <>
                              <span className="absolute top-full mt-1.5 left-0 -translate-x-1/2 text-[6px] font-black text-slate-500 italic uppercase bg-white/80 px-1 rounded shadow-sm">
                                {formatMonth(ph.startDate)}
                              </span>
                              
                              <div className="h-full rounded-md shadow-sm w-full flex items-center justify-center text-[7px] text-white font-black"
                                   style={{ backgroundColor: ph.color }}>
                                {Math.round(ph.durationMonths)}M
                              </div>

                              {ph.isMilestone && (
                                <div className="absolute top-1/2 -translate-y-1/2 left-full flex items-center gap-1.5 z-20">
                                  <div className="w-3 h-3 bg-helexia-green border-2 border-helexia-blue rotate-45 shadow-md shrink-0" />
                                  <span className="text-[7px] font-black text-helexia-blue bg-white/90 border border-slate-100 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap italic uppercase">
                                    {getMilestoneLabel(ph.id)}
                                  </span>
                                </div>
                              )}

                              <span className="absolute top-full mt-1.5 left-full -translate-x-1/2 text-[6px] font-black text-slate-500 italic uppercase bg-white/80 px-1 rounded shadow-sm">
                                {formatMonth(ph.endDate)}
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                               <div className="w-4 h-4 bg-helexia-green border-2 border-helexia-blue rotate-45 shadow-lg shrink-0" />
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-helexia-blue italic leading-none">COD</span>
                                 <span className="text-[6px] font-bold text-helexia-green italic">{formatMonth(ph.startDate)}</span>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <footer className="text-center py-10">
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Helexia France &copy; 2025 - Estimation Master Plan PV</p>
      </footer>
    </div>
  );
};

export default GanttChart;
