
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import { Project, ProjectType, ProjectMode, ConnectionType } from '../types.ts';
import { calculatePhases } from '../services/scheduler.ts';

const ProjectForm = ({ onAdd, initialProject, onCancel }) => {
  const [formData, setFormData] = useState({
    name: 'SITE SOLAR HX',
    powerKwc: 500,
    type: ProjectType.TOITURE_NEUVE,
    mode: ProjectMode.EPC_SIMPLE,
    connection: ConnectionType.INJECTION,
    signatureDate: new Date().toISOString().split('T')[0],
    isSubcontracted: false,
    overrides: {
      urbanisme: { enabled: true, manualDuration: undefined },
      cre: { enabled: true, manualDuration: undefined },
      bail: { enabled: true, manualDuration: undefined },
      raccordement: { enabled: true, manualDuration: undefined },
      construction: { enabled: true, manualDuration: undefined }
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setFormData({
        ...initialProject,
        signatureDate: new Date(initialProject.signatureDate).toISOString().split('T')[0],
        overrides: initialProject.overrides || formData.overrides
      });
    }
  }, [initialProject]);

  const toggleOverride = (phaseId, field, value) => {
    setFormData(prev => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [phaseId]: { ...prev.overrides[phaseId], [field]: value }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sigDate = new Date(formData.signatureDate);
    const newProject = {
      ...formData,
      id: initialProject?.id || crypto.randomUUID(),
      signatureDate: sigDate,
      phases: calculatePhases({ ...formData, signatureDate: sigDate })
    };
    onAdd(newProject);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase outline-none focus:border-helexia-green transition-all";
  const labelClass = "text-[9px] font-black uppercase opacity-40 mb-1 block ml-2";

  return (
    <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
        <span className="w-1 h-6 bg-helexia-green rounded-full"></span> Configuration Site
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nom du Projet</label>
          <input type="text" className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Puissance (kWc)</label>
            <input type="number" className={inputClass} value={formData.powerKwc} onChange={e => setFormData({...formData, powerKwc: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className={labelClass}>Signature T0</label>
            <input type="date" className={inputClass} value={formData.signatureDate} onChange={e => setFormData({...formData, signatureDate: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Typologie</label>
            <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {Object.values(ProjectType).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Modèle d'Affaire</label>
            <select className={inputClass} value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
              {Object.values(ProjectMode).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Raccordement</label>
            <select className={inputClass} value={formData.connection} onChange={e => setFormData({...formData, connection: e.target.value})}>
              {Object.values(ConnectionType).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="text-[10px] font-black uppercase italic text-helexia-blue cursor-pointer" htmlFor="subcon">Sous-traitance (Pas d'arrêt BTP)</label>
          <input 
            id="subcon"
            type="checkbox" 
            className="w-5 h-5 accent-helexia-green cursor-pointer" 
            checked={formData.isSubcontracted} 
            onChange={e => setFormData({...formData, isSubcontracted: e.target.checked})} 
          />
        </div>

        <div className="pt-2">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[9px] font-black uppercase tracking-[0.2em] text-helexia-blue/40 flex items-center gap-2 hover:text-helexia-blue transition-colors mb-4"
          >
            {showAdvanced ? '[-] Masquer options avancées' : '[+] Durées & Phases manuelles'}
          </button>

          {showAdvanced && (
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-fade">
              {Object.keys(formData.overrides).map(phaseId => (
                <div key={phaseId} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-32">
                    <input 
                      type="checkbox" 
                      className="accent-helexia-green w-4 h-4"
                      checked={formData.overrides[phaseId].enabled}
                      onChange={e => toggleOverride(phaseId, 'enabled', e.target.checked)}
                    />
                    <span className="text-[9px] font-black uppercase italic text-helexia-blue truncate">{phaseId}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Auto"
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-center"
                    value={formData.overrides[phaseId].manualDuration || ''}
                    onChange={e => toggleOverride(phaseId, 'manualDuration', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={!formData.overrides[phaseId].enabled}
                  />
                  <span className="text-[8px] font-bold opacity-30 uppercase">mois</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-helexia-green text-helexia-blue py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] shadow-lg hover:shadow-helexia-green/20 transition-all active:scale-95">
          {initialProject ? 'Mettre à jour' : 'Générer Master Plan'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-widest opacity-30 mt-2">Annuler</button>
        )}
      </form>
    </div>
  );
};

export default ProjectForm;
