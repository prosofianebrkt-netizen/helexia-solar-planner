
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import ProjectForm from './components/ProjectForm.tsx';
import GanttChart from './components/GanttChart.tsx';
import { Project } from './types.ts';

const App = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('helexia_projects_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(p => ({
          ...p,
          signatureDate: new Date(p.signatureDate),
          phases: p.phases.map(ph => ({
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
    localStorage.setItem('helexia_projects_v2', JSON.stringify(projects));
  }, [projects]);

  const addOrUpdateProject = (project: Project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      if (exists) return prev.map(p => p.id === project.id ? project : p);
      return [...prev, project];
    });
    setEditingProject(null);
  };

  const removeProject = (id: string) => {
    if (confirm("Supprimer définitivement ce site ?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <header className="px-6 py-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-helexia-green rounded-2xl flex items-center justify-center font-black text-helexia-blue italic rotate-3">HX</div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">Helexia <span className="text-helexia-green">Solar</span></h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 text-white">Master Planner V2.5</p>
            </div>
          </div>
          
          <nav className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('gantt')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gantt' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}`}>Matrix Gantt</button>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade">
            <div className="xl:col-span-4 space-y-8">
              <ProjectForm onAdd={addOrUpdateProject} initialProject={editingProject} onCancel={editingProject ? () => setEditingProject(null) : undefined} />
              
              <div className="bg-gradient-acid p-8 rounded-[2rem] text-helexia-blue shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Puissance Installée</p>
                <div className="text-5xl font-black tracking-tighter italic">{projects.reduce((acc, p) => acc + p.powerKwc, 0).toLocaleString()} <span className="text-lg">kWc</span></div>
              </div>
            </div>

            <div className="xl:col-span-8">
              <div className="glass-card rounded-[2.5rem] p-10 min-h-[600px] shadow-2xl">
                <h2 className="text-2xl font-black uppercase italic mb-8 border-b border-black/5 pb-4">Sites Planifiés ({projects.length})</h2>
                {projects.length === 0 ? (
                  <div className="h-64 flex items-center justify-center opacity-20 italic uppercase font-black text-sm">En attente de données...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((p, idx) => (
                      <div key={p.id} className="bg-white border border-slate-100 p-6 rounded-3xl hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-helexia-blue text-white flex items-center justify-center font-black italic text-[10px]">{idx+1}</span>
                              <h3 className="font-black uppercase italic text-sm">{p.name}</h3>
                           </div>
                           <span className="text-[10px] font-bold text-helexia-green uppercase">{p.powerKwc} kWc</span>
                        </div>
                        <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditingProject(p)} className="text-[9px] font-black uppercase tracking-widest text-helexia-blue/40 hover:text-helexia-blue">Modifier</button>
                           <button onClick={() => removeProject(p.id)} className="text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500">Supprimer</button>
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
