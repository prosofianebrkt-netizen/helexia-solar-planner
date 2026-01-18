
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import ProjectForm from './components/ProjectForm.js';
import GanttChart from './components/GanttChart.js';

const h = React.createElement;

const App = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('helexia_projects_v3');
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
    localStorage.setItem('helexia_projects_v3', JSON.stringify(projects));
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
    if (confirm("Supprimer définitivement ce site ?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return h('div', { className: "min-h-screen pb-10" }, [
    h('header', { className: "px-6 py-8", key: 'header' }, 
      h('div', { className: "max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl" }, [
        h('div', { className: "flex items-center gap-4", key: 'logo' }, [
          h('div', { className: "w-12 h-12 bg-helexia-green rounded-2xl flex items-center justify-center font-black text-helexia-blue italic rotate-3" }, 'HX'),
          h('div', {}, [
            h('h1', { className: "text-2xl font-black uppercase tracking-tighter italic" }, [
              'Helexia ', h('span', { className: "text-helexia-green" }, 'Solar')
            ]),
            h('p', { className: "text-[8px] font-black uppercase tracking-[0.3em] opacity-40 text-white" }, 'Master Planner V2.5')
          ])
        ]),
        h('nav', { className: "flex bg-black/20 p-1 rounded-xl border border-white/5", key: 'nav' }, [
          h('button', { 
            onClick: () => setActiveTab('dashboard'),
            className: `px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}` 
          }, 'Dashboard'),
          h('button', { 
            onClick: () => setActiveTab('gantt'),
            className: `px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gantt' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}` 
          }, 'Matrix Gantt')
        ])
      ])
    ),
    h('main', { className: "max-w-[1600px] mx-auto px-6", key: 'main' }, 
      activeTab === 'dashboard' 
      ? h('div', { className: "grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade" }, [
          h('div', { className: "xl:col-span-4 space-y-8", key: 'form-side' }, [
            h(ProjectForm, { onAdd: addOrUpdateProject, initialProject: editingProject, onCancel: editingProject ? () => setEditingProject(null) : undefined }),
            h('div', { className: "bg-gradient-acid p-8 rounded-[2rem] text-helexia-blue shadow-2xl" }, [
              h('p', { className: "text-[10px] font-black uppercase tracking-widest opacity-60 mb-2" }, 'Puissance Installée'),
              h('div', { className: "text-5xl font-black tracking-tighter italic" }, [
                projects.reduce((acc, p) => acc + p.powerKwc, 0).toLocaleString(),
                h('span', { className: "text-lg ml-2" }, 'kWc')
              ])
            ])
          ]),
          h('div', { className: "xl:col-span-8", key: 'list-side' }, 
            h('div', { className: "glass-card rounded-[2.5rem] p-10 min-h-[600px] shadow-2xl" }, [
              h('h2', { className: "text-2xl font-black uppercase italic mb-8 border-b border-black/5 pb-4" }, `Sites Planifiés (${projects.length})`),
              projects.length === 0 
              ? h('div', { className: "h-64 flex items-center justify-center opacity-20 italic uppercase font-black text-sm" }, 'En attente de données...')
              : h('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
                  projects.map((p, idx) => h('div', { key: p.id, className: "bg-white border border-slate-100 p-6 rounded-3xl hover:shadow-xl transition-all group shadow-sm" }, [
                    h('div', { className: "flex justify-between items-start mb-4" }, [
                      h('div', { className: "flex items-center gap-3" }, [
                        h('span', { className: "w-8 h-8 rounded-lg bg-helexia-blue text-white flex items-center justify-center font-black italic text-[10px]" }, idx + 1),
                        h('h3', { className: "font-black uppercase italic text-sm" }, p.name)
                      ]),
                      h('span', { className: "text-[10px] font-bold text-helexia-green uppercase" }, `${p.powerKwc} kWc`)
                    ]),
                    h('div', { className: "flex justify-end gap-4" }, [
                      h('button', { onClick: () => setEditingProject(p), className: "text-[9px] font-black uppercase tracking-widest text-helexia-blue/40 hover:text-helexia-blue" }, 'Modifier'),
                      h('button', { onClick: () => removeProject(p.id), className: "text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500" }, 'Supprimer')
                    ])
                  ]))
                )
            ])
          )
        ])
      : h(GanttChart, { projects })
    )
  ]);
};

export default App;
