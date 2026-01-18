
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import ProjectForm from './components/ProjectForm.tsx';
import GanttChart from './components/GanttChart.tsx';
import { formatMonth } from './constants.tsx';

// On définit les types ici si types.ts n'est pas résolu
const App = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else if (isStandalone) {
      alert("L'application est déjà installée sur ce PC.");
    } else {
      alert("Installation : Cliquez sur l'icône d'ordinateur dans la barre d'adresse de Chrome.");
    }
  };

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('helexia_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          signatureDate: new Date(p.signatureDate),
          phases: p.phases.map((ph) => ({
            ...ph,
            startDate: new Date(ph.startDate),
            endDate: new Date(ph.endDate)
          }))
        }));
      } catch (e) { return []; }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    localStorage.setItem('helexia_projects', JSON.stringify(projects));
  }, [projects]);

  const addOrUpdateProject = (project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      if (exists) return prev.map(p => p.id === project.id ? project : p);
      return [...prev, project];
    });
    setEditingProject(null);
  };

  const removeProject = (id) => {
    if (window.confirm("Supprimer ce site ?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-20 text-helexia-blue">
      <header className="px-6 pt-8 pb-4">
        <div className="max-w-[1600px] mx-auto bg-white/5 backdrop-blur-md rounded-[2rem] p-6 flex flex-col xl:flex-row items-center justify-between shadow-2xl border border-white/10 relative overflow-hidden gap-6">
          <div className="flex items-center gap-6 relative z-10 w-full xl:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-helexia-green to-helexia-green-light p-0.5 shadow-xl rotate-3 shrink-0">
                <div className="w-full h-full rounded-2xl bg-helexia-blue flex items-center justify-center text-xs font-black text-helexia-green border border-white/10 italic">HX</div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none italic flex items-center gap-2">
                Helexia <span className="text-helexia-green text-xs not-italic font-black tracking-[0.3em] ml-2 opacity-50">Solar Planner</span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                 <span className="text-[8px] uppercase tracking-[0.4em] font-black text-helexia-green/80">Software V2.5</span>
              </div>
            </div>
          </div>
          
          <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 relative z-10">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('gantt')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'gantt' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}`}>Matrix Gantt</button>
          </nav>

          <div className="flex items-center gap-3 relative z-10 w-full xl:w-auto justify-center xl:justify-end">
             <button 
               onClick={handleInstall}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl border border-white/10 ${deferredPrompt ? 'bg-helexia-green text-helexia-blue animate-pulse' : (isStandalone ? 'bg-white/20 text-helexia-green' : 'bg-white/5 text-white/40 cursor-default')}`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {deferredPrompt ? 'Installer sur PC' : (isStandalone ? 'Application Installée' : 'Logiciel Prêt')}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade">
            <div className="xl:col-span-4 space-y-10">
              <ProjectForm onAdd={addOrUpdateProject} initialProject={editingProject || undefined} onCancel={editingProject ? () => setEditingProject(null) : undefined} />
              <div className="bg-gradient-acid p-10 rounded-[2.5rem] soft-shadow text-helexia-blue relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70">Puissance Totale</div>
                  <div className="text-6xl font-black tracking-tighter mb-2 italic leading-none">{projects.reduce((acc, p) => acc + (p.powerKwc || 0), 0).toLocaleString()} <span className="text-xl opacity-60 not-italic uppercase ml-2">kWc</span></div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-50 italic">{projects.length} Sites Planifiés</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-8">
              <div className="glass-card rounded-[3rem] soft-shadow p-8 xl:p-12 min-h-[700px] relative overflow-hidden border border-white/10 text-helexia-blue">
                <h2 className="text-3xl font-black uppercase italic border-b border-slate-100 pb-10 mb-10 tracking-tighter">Portefeuille Solaire</h2>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[450px] opacity-20"><p className="text-xs font-black uppercase tracking-[0.4em]">Aucun site enregistré</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {projects.map((project, idx) => (
                      <div key={project.id} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-helexia-green/40 transition-all shadow-sm hover:shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-6 mb-8">
                          <div className="w-14 h-14 bg-helexia-blue rounded-[1.2rem] flex items-center justify-center font-black text-white italic">{idx + 1}</div>
                          <div>
                            <h3 className="font-black text-lg uppercase italic">{project.name}</h3>
                            <p className="text-[9px] font-extrabold text-helexia-green uppercase tracking-[0.2em]">{project.mode}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-6 pt-2 border-t border-slate-50">
                           <button onClick={() => setEditingProject(project)} className="text-[10px] font-black text-helexia-blue/40 hover:text-helexia-blue uppercase tracking-widest italic">Modifier</button>
                           <button onClick={() => removeProject(project.id)} className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest italic">Retirer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <GanttChart projects={projects} />
        )}
      </main>
    </div>
  );
};

export default App;
