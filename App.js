
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import ProjectForm from './components/ProjectForm.js';
import GanttChart from './components/GanttChart.js';

const h = React.createElement;

const App = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('helexia_projects_v4');
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
    localStorage.setItem('helexia_projects_v4', JSON.stringify(projects));
  }, [projects]);

  const addOrUpdateProject = (project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      if (exists) return prev.map(p => p.id === project.id ? project : p);
      return [...prev, project];
    });
    setEditingProject(null);
  };

  return h('div', { className: "min-h-screen pb-20" }, [
    h('header', { className: "px-6 pt-10 pb-6", key: 'header' }, 
      h('div', { className: "max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8" }, [
        h('div', { className: "flex flex-col items-center md:items-start", key: 'logo' }, [
          h('h1', { className: "text-4xl font-black uppercase tracking-tighter italic text-white" }, [
            'Helexia ', h('span', { className: "text-helexia-green" }, 'Solar')
          ]),
          h('p', { className: "text-[10px] font-black uppercase tracking-[0.5em] opacity-40 text-white mt-1" }, 'Master Planner Enterprise')
        ]),
        h('nav', { className: "flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md", key: 'nav' }, [
          h('button', { 
            onClick: () => setActiveTab('dashboard'),
            className: `px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}` 
          }, 'Dashboard'),
          h('button', { 
            onClick: () => setActiveTab('gantt'),
            className: `px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'gantt' ? 'bg-helexia-green text-helexia-blue shadow-lg' : 'text-white/60 hover:text-white'}` 
          }, 'Matrix Gantt')
        ])
      ])
    ),
    h('main', { className: "max-w-[1600px] mx-auto px-6", key: 'main' }, 
      activeTab === 'dashboard' 
      ? h('div', { className: "grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade" }, [
          h('div', { className: "xl:col-span-4 space-y-8", key: 'form-side' }, [
            h(ProjectForm, { onAdd: addOrUpdateProject, initialProject: editingProject, onCancel: editingProject ? () => setEditingProject(null) : undefined }),
            h('div', { className: "bg-gradient-acid p-8 rounded-[2.5rem] text-helexia-blue shadow-2xl" }, [
              h('p', { className: "text-[10px] font-black uppercase tracking-widest opacity-60 mb-2" }, 'Portefeuille Solaire Total'),
              h('div', { className: "text-5xl font-black tracking-tighter italic" }, [
                projects.reduce((acc, p) => acc + (parseInt(p.powerKwc) || 0), 0).toLocaleString(),
                h('span', { className: "text-lg ml-2" }, 'kWc')
              ])
            ])
          ]),
          h('div', { className: "xl:col-span-8", key: 'list-side' }, 
            h('div', { className: "glass-card rounded-[2.5rem] p-12 min-h-[600px] shadow-2xl" }, [
              h('h2', { className: "text-2xl font-black uppercase italic mb-8 border-b border-black/5 pb-6" }, `Sites Planifiés (${projects.length})`),
              projects.length === 0 
              ? h('div', { className: "h-64 flex flex-col items-center justify-center opacity-20 italic font-black" }, [
                  h('span', { className: "text-4xl mb-4" }, 'HX'),
                  'Aucun site enregistré'
                ])
              : h('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
                  projects.map((p, idx) => h('div', { key: p.id, className: "bg-white border border-slate-100 p-8 rounded-[2rem] hover:shadow-2xl transition-all group relative" }, [
                    h('div', { className: "flex justify-between items-start mb-6" }, [
                      h('div', { className: "flex items-center gap-4" }, [
                        h('span', { className: "w-10 h-10 rounded-xl bg-helexia-blue text-white flex items-center justify-center font-black italic text-sm" }, idx + 1),
                        h('div', {}, [
                          h('h3', { className: "font-black uppercase italic text-[13px] text-helexia-blue" }, p.name),
                          h('p', { className: "text-[9px] font-bold text-helexia-green uppercase tracking-widest" }, `${p.type} | ${p.connection}`)
                        ])
                      ]),
                    ]),
                    h('div', { className: "flex justify-between items-end" }, [
                      h('div', {}, [
                        h('p', { className: "text-[11px] font-black text-helexia-blue uppercase" }, `${p.powerKwc} kWc`),
                      ]),
                      h('div', { className: "flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity" }, [
                        h('button', { onClick: () => setEditingProject(p), className: "text-[10px] font-black uppercase tracking-widest text-helexia-blue/40 hover:text-helexia-blue" }, 'Modifier'),
                        h('button', { onClick: () => { if(confirm("Supprimer ?")) setProjects(prev => prev.filter(x => x.id !== p.id)) }, className: "text-[10px] font-black uppercase tracking-widest text-red-300 hover:text-red-500" }, 'Supprimer')
                      ])
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
