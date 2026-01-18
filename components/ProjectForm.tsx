
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
    overrides: {}
  });

  useEffect(() => {
    if (initialProject) {
      setFormData({
        ...initialProject,
        signatureDate: new Date(initialProject.signatureDate).toISOString().split('T')[0]
      });
    }
  }, [initialProject]);

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
    if (!initialProject) setFormData(prev => ({ ...prev, name: 'SITE SOLAR HX ' + (Math.floor(Math.random()*100)) }));
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none focus:border-helexia-green transition-all";
  const labelClass = "text-[9px] font-black uppercase opacity-40 mb-1 block ml-2";

  return (
    <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-helexia-green/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
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
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {Object.values(ProjectType).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Modèle</label>
            <select className={inputClass} value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
              {Object.values(ProjectMode).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
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
