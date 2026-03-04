import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Layers, Kanban, Settings, ArrowLeft, Plus, Layout, Info } from 'lucide-react';
import Sidebar from './layout/Sidebar/Sidebar'; // Keep global sidebar
import { useProjects } from '../context/ProjectContext';
import EditProjectDrawer from '../components/EditProjectDrawer';
import { useState } from 'react';

const ProjectLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useParams<{ projectId: string }>();
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const { getProject, updateProject } = useProjects();

    // Find current project
    const currentProject = getProject(projectId || '');
    const projectName = currentProject?.title || 'Project';
    const projectKey = currentProject?.tag || '';
    const projectType = currentProject?.tagType || 'WEB';

    const tabs = [
        { id: 'details', label: 'Details', path: `/project/${projectId}`, icon: Info },
        { id: 'board', label: 'Board', path: `/project/${projectId}/board`, icon: Kanban },
        { id: 'backlog', label: 'Backlog', path: `/project/${projectId}/backlog`, icon: Layers },
    ];

    const currentTab = tabs.find(tab => {
        if (tab.id === 'details') return location.pathname === `/project/${projectId}`;
        return location.pathname.includes(tab.id);
    })?.id || 'details';

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Global Sidebar - Always present as per app layout, but user essentially asked to remove "sidebar" which usually refers to the context sidebar. 
                I will keep the global folding sidebar (Sidebar.tsx) on the left as it is the main app navigation, 
                and replace the "DetailSidebar" (the second sidebar) with the top header. */}
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] p-2">
                <div className="h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative flex flex-col">
                    {/* Top Project Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                    title="Back to Projects"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-3">
                                    {/* Project Icon/Avatar */}
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${currentProject?.color === 'orange' ? 'bg-orange-100 text-orange-600' : currentProject?.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <span className="font-bold text-sm tracking-tighter">{projectKey.substring(0, 2)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">{projectName}</h1>
                                            {currentProject?.status && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${currentProject.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    {currentProject.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                                            <span>{projectKey}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>Software Project</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Tabs - Centered/Right Aligned */}
                                <div className="flex bg-gray-100/50 rounded-lg p-1">
                                    {tabs.map(tab => {
                                        const isActive = tab.id === 'details'
                                            ? location.pathname === `/project/${projectId}`
                                            : location.pathname.includes(tab.id);

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => navigate(tab.path)}
                                                className={`
                                                    flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold rounded-md transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
                                                    }
                                                `}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsEditDrawerOpen(true)}
                                        className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg transition-colors hover:bg-indigo-50"
                                        title="Edit Project Details"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <Outlet context={{ setIsEditDrawerOpen }} />
                        {/* Edit Project Drawer */}
                        {isEditDrawerOpen && currentProject && (
                            <EditProjectDrawer
                                isOpen={isEditDrawerOpen}
                                onClose={() => setIsEditDrawerOpen(false)}
                                project={currentProject}
                                onUpdate={(updatedProject) => {
                                    updateProject(updatedProject);
                                    setIsEditDrawerOpen(false);
                                }}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProjectLayout;
