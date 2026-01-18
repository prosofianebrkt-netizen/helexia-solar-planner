
import React, { useState, useEffect } from 'react';
import { Project, ProjectType, ProjectMode, ConnectionType, PhaseOverride } from '../types';
import { calculatePhases } from '../services/scheduler';

interface ProjectFormProps {
  onAdd: (project: Project) => void;
  initialProject?: Project;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onAdd, initialProject, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    powerKwc: 500,
    type: ProjectType.TOITURE_NEUVE,
    mode: ProjectMode.EPC_SIMPLE,
    connection: ConnectionType.INJECTION,
    signatureDate: new Date().toISOString().split('T')[0],
    isSubcontracted: false,
    overrides: {} as Record<string, PhaseOverride>
  });

  useEffect(() => {
    if (initialProject) {
      setFormData({
        name: initialProject.name,
        powerKwc: initialProject.powerKwc,
        type: initialProject.type,
        mode: initialProject.mode,
        connection: initialProject.connection,
        signatureDate: initialProject.signatureDate.toISOString().split('T')[0],
        isSubcontracted: initialProject.isSubcontracted,
        overrides: initialProject.overrides || {},
      });
    } else {
      setFormData(prev => ({ ...prev, name: 'NOUVEAU SITE SOLAR' }));
    }
  }, [initialProject]);

  const togglePhase = (phaseId: string) => {
    const current = formData.overrides[phaseId] || { enabled: true };
    setFormData({
      ...formData,
      overrides: {
        ...formData.overrides,
        [phaseId]: { ...current, enabled: !current.enabled }
      }
    });
  };

  const updatePhaseDuration = (phaseId: string, duration: number) => {
    const current = formData.overrides[phaseId] || { enabled: true };
    setFormData({
      ...formData,
      overrides: {
        ...formData.overrides,
        [phaseId]: { ...current, manualDuration: duration }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const signatureDateObj = new Date(formData.signatureDate);
    const newProject: Project = {
      id: initialProject?.id || crypto.randomUUID(),
      name: formData.name.toUpperCase(),
      powerKwc: formData.powerKwc,
      type: formData.type,
      mode: formData.mode,
      connection: formData.connection,
      signatureDate: signatureDateObj,
      isSubcontracted: formData.isSubcontracted,
      overrides: formData.overrides,
      phases: calculatePhases({
        ...formData,
        signatureDate: signatureDateObj
      })
    };
    onAdd(newProject);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-helexia-green/50 focus:bg-white rounded-xl outline-none transition-all text-[12px] font-black text-helexia-blue uppercase tracking-tight italic";
  const labelClass = "block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-[0.2em] ml-1 italic";

  const tasks = [
    { id: 'negociation', name: 'Négociation' },
    { id: 'urbanisme', name: 'Urbanisme' },
    { id: 'cre', name: 'AO CRE' },
    { id: 'bail', name: 'Gestion Bail' },
    { id: 'raccordement', name: 'Raccordement' },
    { id: 'construction', name: 'Construction' },
    { id: 'exploitation', name: 'Exploitation' },
  ];

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2.5rem] soft-shadow p-8 border border-white/10 animate-fade relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-helexia-green rounded-full" />
            <h2 className="text-xl font-black text-helexia-blue tracking-tighter uppercase italic">
                Project Config
            </h2>
        </div>
        {onCancel && (
            <button type="button" onClick={onCancel} className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Annuler</button>
        )}
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <label className={labelClass}>Identifiant Site</label>
            <input type="text" className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="col-span-4">
            <label className={labelClass}>kWc</label>
            <input type="number" className={inputClass} value={formData.powerKwc} onChange={e => setFormData({ ...formData, powerKwc: Number(e.target.value) })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Technologie</label>
            <select className={inputClass} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ProjectType })}>
              {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Signature T0</label>
            <input type="date" className={inputClass} value={formData.signatureDate} onChange={e => setFormData({ ...formData, signatureDate: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Modèle Affaire</label>
            <select className={inputClass} value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value as ProjectMode })}>
              {Object.values(ProjectMode).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Raccordement</label>
            <select className={inputClass} value={formData.connection} onChange={e => setFormData({ ...formData, connection: e.target.value as ConnectionType })}>
              {Object.values(ConnectionType).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-helexia-blue uppercase tracking-[0.2em] mb-4 italic">Hypothèses Planning</h3>
            <div className="grid grid-cols-2 gap-2">
                {tasks.map(task => {
                    const override = formData.overrides[task.id];
                    const isEnabled = override ? override.enabled : true;
                    return (
                        <div key={task.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${isEnabled ? 'bg-slate-50' : 'bg-slate-50/20 opacity-40'}`}>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => togglePhase(task.id)} className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isEnabled ? 'bg-helexia-green border-helexia-green' : 'bg-white border-slate-300'}`}>
                                    {isEnabled && <svg className="w-2.5 h-2.5 text-helexia-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <span className="text-[9px] font-black text-helexia-blue uppercase italic truncate">{task.name}</span>
                            </div>
                            <input type="number" disabled={!isEnabled} className="w-8 bg-white border rounded px-1 py-1 text-[8px] font-black text-center outline-none" value={override?.manualDuration || ''} onChange={e => updatePhaseDuration(task.id, Number(e.target.value))} />
                        </div>
                    );
                })}
            </div>
        </div>

        <button type="submit" className="w-full bg-helexia-green text-helexia-blue font-black py-4 rounded-2xl shadow-lg hover:shadow-helexia-green/20 transition-all text-[11px] uppercase tracking-widest italic btn-premium">
           Générer Matrix Master
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
