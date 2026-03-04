import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface ProjectItemProps {
    id: string;
    name: string;
    code: string;
    count: number;
    dotColor: string;
    onClick?: () => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ name, code, count, dotColor, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${onClick ? 'hover:bg-gray-50 cursor-pointer group' : ''}`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <div className="flex flex-col">
                <span className={`text-sm font-bold text-gray-900 transition-colors font-accent tracking-tight ${onClick ? 'group-hover:text-indigo-600' : ''}`}>{name}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{code}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className={`text-xs text-gray-900 font-bold ${onClick ? 'group-hover:text-indigo-600' : ''}`}>
                {count}
            </span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">open issues</span>
        </div>
    </div>
);

interface ProjectsWidgetProps {
    projects: any[]; // Replace with proper type if available, using any for now to match rapid dev
}

const ProjectsWidget: React.FC<ProjectsWidgetProps> = ({ projects }) => {
    const navigate = useNavigate();

    // Process projects to add counts and format for display
    const projectsWithCounts = projects.map(p => {
        const openIssuesCount = p.issues?.filter((i: any) => !i.stage?.isFinal).length || 0;

        // Map backend color to tailwind class if needed, or use directly if it's already a class
        // Assuming backend stores 'indigo', 'purple', etc., we need to map to bg-*-400
        const colorMap: Record<string, string> = {
            'indigo': 'bg-indigo-400',
            'purple': 'bg-purple-400',
            'green': 'bg-green-400',
            'orange': 'bg-orange-400',
            'red': 'bg-red-400',
            'blue': 'bg-blue-400',
            'pink': 'bg-pink-400',
        };

        const dotColor = colorMap[p.color] || 'bg-gray-400';

        return {
            id: p.id,
            name: p.name,
            code: p.key,
            count: openIssuesCount,
            dotColor: dotColor
        };
    });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-bold text-gray-900 font-accent">Projects</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-xs font-medium text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        View all
                    </button>
                    <button
                        onClick={() => navigate('/projects', { state: { openDrawer: true } })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 px-2 pb-6 space-y-1 overflow-y-auto">
                {projectsWithCounts.length > 0 ? (
                    projectsWithCounts.map((project) => (
                        <ProjectItem
                            key={project.id}
                            {...project}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                        No projects found
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsWidget;
