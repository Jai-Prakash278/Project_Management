import React from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Calendar, Edit, Archive, Trash2, ListTodo, FileText } from 'lucide-react';
import { Issue, IssueType, IssuePriority } from '../types/issue.types';

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { getProject, deleteProject, archiveProject, unarchiveProject } = useProjects();
    const { setIsEditDrawerOpen } = useOutletContext<{ setIsEditDrawerOpen: (open: boolean) => void }>();

    const project = getProject(projectId || '');

    if (!project) {
        return <div className="p-8 text-center text-gray-500">Project not found</div>;
    }

    // Use real project data

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {/* Description */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Description</span>
                                <span className="text-sm font-bold text-gray-900 leading-relaxed">
                                    {project.description || "No description provided."}
                                </span>
                            </div>
                        </div>

                        {/* Meta Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                                    {(project.createdBy || "Not Assigned").charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Created By</span>
                                    <span className="text-sm font-bold text-gray-900">{project.createdBy}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Start Date</span>
                                    {/* Using created at if available or static */}
                                    <span className="text-sm font-bold text-gray-900">Feb 15, 2026</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    <ListTodo className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Issues</span>
                                    <span className="text-sm font-bold text-gray-900">{project.issues}</span>
                                </div>
                            </div>
                        </div>

                        {/* Workflow Section */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Project Workflow</h3>
                                <div className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${(project.workflow?.isDefault || project.workflow?.name === 'Default Kanban Workflow') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                    {(project.workflow?.isDefault || project.workflow?.name === 'Default Kanban Workflow') ? 'Default' : 'Custom'}
                                </div>
                            </div>

                            {project.workflow ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {project.workflow.stages?.map((stage: any, idx: number) => (
                                            <React.Fragment key={stage.id}>
                                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700">
                                                    {stage.name}
                                                </div>
                                                {idx < project.workflow!.stages.length - 1 && (
                                                    <div className="flex items-center text-gray-300">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {(!project.workflow.stages || project.workflow.stages.length === 0) && (
                                            <div className="text-sm text-gray-400 italic">No stages defined for this workflow</div>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 border-t border-gray-50 pt-3">
                                        <span className="font-bold text-gray-700">Transition Mode:</span> {project.workflow.transitionMode}
                                        {project.workflow.transitionMode === 'SEQUENTIAL' && (
                                            <p className="mt-1">Issues can only move to the next stage in the sequence defined above.</p>
                                        )}
                                        {project.workflow.transitionMode === 'FLEXIBLE' && (
                                            <p className="mt-1">Issues can move between any stages freely.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                                    Using default workflow: To Do → In Progress → Done
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Members & Actions */}
                    <div className="flex flex-col gap-6">

                        {/* Team Members Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden max-h-[350px]">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Team Members</h3>
                                <span className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {Array.isArray(project.members) ? project.members.length : 0}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {Array.isArray(project.members) && project.members.map((member: any) => (
                                    <div key={member.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors group cursor-default">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs border border-gray-200 overflow-hidden">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{member.firstName?.[0] || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {member.firstName} {member.lastName}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate">
                                                {/* Role is not yet in Project member data, defaulting */}
                                                Member
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!Array.isArray(project.members) || project.members.length === 0) && (
                                    <div className="p-4 text-center text-sm text-gray-400 italic">
                                        No members assigned
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setIsEditDrawerOpen(true)}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Project
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                {project.status === 'ARCHIVED' ? (
                                    <button
                                        onClick={() => projectId && unarchiveProject(projectId, (path) => navigate(path))}
                                        className="py-2.5 bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                        Unarchive
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => projectId && archiveProject(projectId, (path) => navigate(path))}
                                        className="py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                        Archive
                                    </button>
                                )}
                                <button
                                    onClick={() => projectId && deleteProject(projectId, (path) => navigate(path))}
                                    className="py-2.5 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;