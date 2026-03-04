import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store } from '../redux/store';
import { Project } from '../types/project.types';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_PROJECTS_QUERY } from '../graphql/projects.query';
import {
    CREATE_PROJECT_MUTATION,
    UPDATE_PROJECT_MUTATION,
    DELETE_PROJECT_MUTATION,
    ARCHIVE_PROJECT_MUTATION,
    UNARCHIVE_PROJECT_MUTATION,
    ASSIGN_USERS_TO_PROJECT_MUTATION,
    CREATE_WORKFLOW_ADVANCED_MUTATION
} from '../graphql/projects.mutation';
import { getProjectIcon, getProjectColor, getProjectTagType } from '../utils/project.utils';
import toast from 'react-hot-toast';
import { confirmToast } from '../utils/toast.utils';


interface ProjectContextType {
    projects: Project[];
    loading: boolean;
    error: any;
    addProject: (project: Partial<Project>, memberIds?: string[], workflow?: any) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string, navigate?: (path: string) => void) => void;
    archiveProject: (id: string, navigate?: (path: string) => void) => void;
    unarchiveProject: (id: string, navigate?: (path: string) => void) => void;
    getProject: (id: string) => Project | undefined;
    refetch: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    // Fetch projects from backend
    const { data, loading, error, refetch } = useQuery(GET_PROJECTS_QUERY, {
        pollInterval: 30000,
        skip: !isAuthenticated,
    });

    useEffect(() => {
        if (error) {
            console.error("Error fetching projects:", error);
            toast.error("Failed to load projects");
        }
    }, [error]);

    const [createProject] = useMutation(CREATE_PROJECT_MUTATION, {
        onCompleted: () => {
            toast.success("Project created successfully");
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to create project");
        }
    });

    const [updateProjectMutation] = useMutation(UPDATE_PROJECT_MUTATION, {
        onError: (err: any) => {
            toast.error(err.message || "Failed to update project details");
        }
    });

    const [assignUsersToProject] = useMutation(ASSIGN_USERS_TO_PROJECT_MUTATION, {
        onError: (err: any) => {
            toast.error(err.message || "Failed to update project members");
        }
    });

    const [deleteProjectMutation] = useMutation(DELETE_PROJECT_MUTATION, {
        onCompleted: () => {
            toast.success("Project deleted");
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete project");
        }
    });

    const [archiveProjectMutation] = useMutation(ARCHIVE_PROJECT_MUTATION, {
        onCompleted: () => {
            toast.success("Project archived");
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to archive project");
        }
    });

    const [unarchiveProjectMutation] = useMutation(UNARCHIVE_PROJECT_MUTATION, {
        onCompleted: () => {
            toast.success("Project unarchived");
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to unarchive project");
        }
    });

    const [createWorkflowAdvanced] = useMutation(CREATE_WORKFLOW_ADVANCED_MUTATION, {
        onCompleted: () => {
            console.log("Custom workflow created, refetching projects...");
            refetch();
        },
        onError: (err: any) => {
            console.error("Error creating custom workflow:", err);
            toast.error("Failed to create custom workflow configuration");
        }
    });

    // Map backend data to frontend Project interface
    const projects: Project[] = (data as any)?.projects
        ? (data as any).projects
            .filter((p: any) => {
                if (!user) return false;
                const roles = user.roles || [];
                // Admins see everything
                if (roles.includes('ADMIN')) return true;
                // Others see only owned or assigned
                const isOwner = p.owner?.id === user.id;
                const isMember = p.members?.some((m: any) => m.id === user.id);
                return isOwner || isMember;
            })
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                key: p.key,
                description: p.description || '',
                status: p.status,
                owner: p.owner,
                members: p.members || [],
                color: getProjectColor(p.color),
                icon: getProjectIcon(p.icon),
                type: p.type,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                workflow: p.workflow,

                // Frontend specific aliases/derived
                title: p.name,
                tag: p.key,
                tagType: getProjectTagType(p.type),
                issues: p.issues?.length || 0,
                createdBy: p.owner ? `${p.owner.firstName} ${p.owner.lastName}`.trim() : 'Unknown',
            }))
        : [];

    const addProject = async (project: Partial<Project>, memberIds?: string[], workflow?: any) => {
        // Map frontend project object to CreateProjectInput
        // Project object here comes from the generic form in Projects.tsx which uses local state matching Project interface
        // We need to transform it to what the backend expects
        const input: any = {
            name: project.title || '',
            key: project.tag || '', // Frontend uses 'tag' for key/code
            description: project.description,
            type: project.tagType,
            color: project.color,
            icon: 'Folder', // Default for now
        };

        // INTEGRATE WORKFLOW DATA
        if (workflow) {
            if (workflow.type === 'DEFAULT') {
                input.workflow = {
                    name: 'Default Kanban Workflow',
                    isDefault: true,
                };
            } else if (workflow.type === 'CUSTOM') {
                input.workflow = {
                    name: workflow.data.name,
                    isDefault: false,
                    transitionMode: workflow.data.transitionMode,
                    stages: (() => {
                        const sorted = [...workflow.data.stages].sort((a: any, b: any) => a.orderIndex - b.orderIndex);
                        return sorted.map((s: any, idx: number) => ({
                            name: s.name,
                            orderIndex: s.orderIndex,
                            isFinal: idx === sorted.length - 1, // ✅ last stage is always the final/completed stage
                        }));
                    })(),
                    transitions: workflow.data.transitions.map((t: any) => ({
                        fromStage: t.fromStage,
                        toStage: t.toStage,
                        allowedRoles: t.allowedRoles,
                    })),
                };
            }
        }

        try {
            const result = await createProject({ variables: { createProjectInput: input } });

            // If members are selected, assign them to the new project
            const data = result.data as any;
            const projectId = data?.createProject?.id;

            const { user } = store.getState().auth;
            const finalMemberIds = memberIds ? [...memberIds] : [];
            if (user?.id && !finalMemberIds.includes(user.id)) {
                finalMemberIds.push(user.id);
            }

            if (finalMemberIds.length > 0 && projectId) {
                await assignUsersToProject({
                    variables: {
                        assignUsersInput: {
                            projectId: projectId,
                            userIds: finalMemberIds
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error creating project:", error);
            // Error handled by hook onError
        }
    };

    const updateProject = async (updatedProject: Project) => {
        const updateInput = {
            id: updatedProject.id,
            name: updatedProject.title,
            description: updatedProject.description,
            type: updatedProject.tagType,
            color: updatedProject.color,
            status: updatedProject.status,
            // icon mapping
        };

        try {
            // Update details
            await updateProjectMutation({ variables: { updateProjectInput: updateInput } });

            // Update members if present
            if (updatedProject.members) {
                const userIds = updatedProject.members.map(m => m.id);
                // Only call if there are members to assign, or should we call with empty list to clear?
                // The backend addMembers likely just adds them? Or sets them?
                // Naming is `addMembers` in service, which implies addition.
                // But `assignUsersToProject` mutation name implies assignment (set).
                // Let's assume it sets the list for now.
                const assignInput = {
                    projectId: updatedProject.id,
                    userIds: userIds
                };
                await assignUsersToProject({ variables: { assignUsersInput: assignInput } });
            }

            toast.success("Project updated successfully");
            refetch();
        } catch (e) {
            console.error(e);
            // Errors handled by hooks
        }
    };

    const deleteProject = async (id: string, navigate?: (path: string) => void) => {
        const confirmed = await confirmToast(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone.',
            'delete'
        );
        if (confirmed) {
            deleteProjectMutation({ variables: { id } });
            if (navigate) navigate('/projects');
        }
    };

    const archiveProject = async (id: string, navigate?: (path: string) => void) => {
        const confirmed = await confirmToast(
            'Archive Project',
            'Are you sure you want to archive this project?',
            'confirm'
        );
        if (confirmed) {
            archiveProjectMutation({ variables: { id } });
            if (navigate) navigate('/projects');
        }
    };

    const unarchiveProject = async (id: string, navigate?: (path: string) => void) => {
        const confirmed = await confirmToast(
            'Unarchive Project',
            'Are you sure you want to unarchive this project? It will be moved back to the active list.',
            'confirm'
        );
        if (confirmed) {
            unarchiveProjectMutation({ variables: { id } });
            if (navigate) navigate('/projects');
        }
    };

    const getProject = (id: string) => {
        return projects.find(p => p.id === id);
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            loading,
            error,
            addProject,
            updateProject,
            deleteProject,
            archiveProject,
            unarchiveProject,
            getProject,
            refetch
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};
