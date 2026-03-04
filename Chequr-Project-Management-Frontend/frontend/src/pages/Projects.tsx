import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Folder,
  MoreHorizontal,
  ArrowRight,
  Layers,
  Layout,
  Server,
  LayoutGrid,
  List as ListIcon,
  User,
  X,
  Kanban,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { GET_USER_PROFILE, GET_ALL_USERS_QUERY } from "../graphql/user.query";
import { IS_PROJECT_KEY_AVAILABLE_QUERY } from "../graphql/projects.query";
import FloatingLabel from "../components/FloatingLabel";
import FloatingTextArea from "../components/FloatingTextArea";
import MultiSelectUser from "../components/MultiSelectUser";
import { useProjects } from "../context/ProjectContext";
import { CustomWorkflowBuilder } from "../components/workflow/CustomWorkflowBuilder";
import { useQuery, useLazyQuery } from "@apollo/client/react";

import { Project } from "../types/project.types";

interface UserProfileData {
  user: {
    firstName?: string;
    lastName?: string;
  };
}


const TABS = ["All", "My Projects", "Active", "Archived"];

const COLORS = [
  { id: "indigo", bg: "bg-indigo-500" },
  { id: "purple", bg: "bg-purple-500" },
  { id: "green", bg: "bg-green-500" },
  { id: "orange", bg: "bg-orange-500" },
] as const;


const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Project Data State
  const { projects, addProject } = useProjects();

  // Handle openDrawer state from navigation
  useEffect(() => {
    const state = location.state as { openDrawer?: boolean };
    if (state?.openDrawer) {
      setIsDrawerOpen(true);
      // Clear state to prevent re-opening on manual refresh or back-nav
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWorkflowDrawerOpen, setIsWorkflowDrawerOpen] = useState(false);


  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    color: "indigo" as "indigo" | "purple" | "green" | "orange",
    members: user?.id ? [user.id] : ([] as string[]),
    workflowType: "DEFAULT" as "DEFAULT" | "CUSTOM",
    workflow: {
      name: "",
      transitionMode: "SEQUENTIAL" as "SEQUENTIAL" | "FLEXIBLE",
      stages: [
        { id: "stage-1", name: "Todo", orderIndex: 0, category: "TODO" as const },
        { id: "stage-2", name: "In Progress", orderIndex: 1, category: "IN_PROGRESS" as const },
        { id: "stage-3", name: "Done", orderIndex: 2, category: "DONE" as const },
      ],
      transitions: [],
    },
  });

  const [isKeyAvailable, setIsKeyAvailable] = useState<boolean | null>(null);
  const [checkKeyAvailability, { loading: isCheckingKey, data: keyAvailabilityData }] = useLazyQuery<{ isProjectKeyAvailable: boolean }, { key: string }>(IS_PROJECT_KEY_AVAILABLE_QUERY, {
    fetchPolicy: 'network-only',
  });

  // Sync key availability from query data
  useEffect(() => {
    if (keyAvailabilityData) {
      setIsKeyAvailable(keyAvailabilityData.isProjectKeyAvailable);
    }
  }, [keyAvailabilityData]);

  // Debounce key check
  useEffect(() => {
    if (!formData.key || formData.key.length < 2) {
      setIsKeyAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkKeyAvailability({ variables: { key: formData.key } });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.key, checkKeyAvailability]);

  // Fetch detailed user profile
  const userId = user?.id || "";
  const { data: profileData } = useQuery<UserProfileData>(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId,
  });

  const { data: allUsersData } = useQuery(GET_ALL_USERS_QUERY);
  const allUsers =
    (allUsersData as any)?.users
      ?.filter((u: any) => u.status === 'ACTIVE')
      .map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        avatar: u.avatarUrl,
      })) || [];

  const profileUser = profileData?.user;
  const userName =
    profileUser?.firstName && profileUser?.lastName
      ? `${profileUser.firstName} ${profileUser.lastName}`
      : user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.email
          ? user.email.split("@")[0]
          : "User";

  const filteredProjects = projects
    .filter((project) => {
      if (activeTab === "My Projects") return true;
      if (activeTab === "Active") return project.status === "ACTIVE";
      if (activeTab === "Archived") return project.status === "ARCHIVED";
      return project.status !== "ARCHIVED";
    })
    .filter(
      (project) =>
        (project.title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (project.tag || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const getColorClasses = (color: string) => {
    switch (color) {
      case "indigo": return "border-indigo-500 text-indigo-600 bg-indigo-50";
      case "purple": return "border-purple-500 text-purple-600 bg-purple-50";
      case "green": return "border-green-500 text-green-600 bg-green-50";
      case "orange": return "border-orange-500 text-orange-600 bg-orange-50";
      default: return "border-gray-500 text-gray-600 bg-gray-50";
    }
  };

  const getTagClasses = (type: string) => {
    switch (type) {
      case "WEB": return "bg-gray-100 text-gray-600";
      case "MOB": return "bg-gray-100 text-gray-600";
      case "API": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isKeyAvailable === false) {
      return; // Prevent submisson if key is taken
    }

    // Construct a partial project object to match what context expects
    // Context will transform this to backend input
    const newProject: any = {
      title: formData.name,
      tag: formData.key.toUpperCase(),
      tagType: "WEB",
      description: formData.description,
      color: formData.color,
    };

    const workflowPayload = prepareWorkflowPayload();
    await addProject(newProject, formData.members, workflowPayload);

    // Reset and close
    setFormData({
      name: "",
      key: "",
      description: "",
      color: "indigo",
      members: user?.id ? [user.id] : [],
      workflowType: "DEFAULT",
      workflow: {
        name: "",
        transitionMode: "SEQUENTIAL",
        stages: [
          { id: "stage-1", name: "Todo", orderIndex: 0, category: "TODO" as const },
          { id: "stage-2", name: "In Progress", orderIndex: 1, category: "IN_PROGRESS" as const },
          { id: "stage-3", name: "Done", orderIndex: 2, category: "DONE" as const },
        ],
        transitions: [],
      },
    });
    setIsKeyAvailable(null);
    setIsDrawerOpen(false);
  };

  const prepareWorkflowPayload = () => {
    if (formData.workflowType === "DEFAULT") {
      return { type: "DEFAULT" };
    }
    return {
      type: "CUSTOM",
      data: {
        name: formData.workflow.name || `${formData.name} Workflow`,
        transitionMode: formData.workflow.transitionMode,
        stages: formData.workflow.stages.map((s) => ({
          name: s.name,
          orderIndex: s.orderIndex,
        })),
        transitions: formData.workflow.transitions.map((t: any) => ({
          fromStage: formData.workflow.stages.find((s: any) => s.id === t.fromStageId)
            ?.name,
          toStage: formData.workflow.stages.find((s: any) => s.id === t.toStageId)
            ?.name,
          allowedRoles: t.allowedRoles,
        })),
      },
    };
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your team projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setIsDrawerOpen(true);
              if (user?.id && formData.members.length === 0) {
                setFormData(prev => ({ ...prev, members: [user.id] }));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 pb-6 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        <div className="flex items-center bg-gray-100/80 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const colorStyle = getColorClasses(project.color || "indigo");
              const borderColorClass = colorStyle.split(" ")[0];
              const iconColorClass = colorStyle.split(" ")[1];
              const iconBgClass = colorStyle.split(" ")[2];

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className={`h-1.5 w-full ${borderColorClass.replace("border-", "bg-")}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
                          <project.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{project.title || "Untitled"}</h3>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded ${getTagClasses(project.tagType || "WEB")}`}>
                            {project.tag || "N/A"}
                          </span>
                        </div>
                      </div>
                      <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">{project.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Layout className="w-3.5 h-3.5" />
                          <span>{project.issues} issues</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1">
                            {Array.isArray(project.members) && project.members.slice(0, 3).map((m: any, i: number) => (
                              <div key={i} className="w-4 h-4 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] text-indigo-700 font-bold overflow-hidden">
                                {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{m.firstName?.[0] || m.username?.[0] || "U"}</span>}
                              </div>
                            ))}
                            {Array.isArray(project.members) && project.members.length > 3 && (
                              <div className="w-4 h-4 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] text-gray-500 font-medium">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                          <span>{Array.isArray(project.members) ? project.members.length : 0} members</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400" title={`Created by ${project.createdBy}`}>
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">{project.createdBy || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Project Name</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Issues</th>
                    <th className="px-6 py-4 font-semibold">Members</th>
                    <th className="px-6 py-4 font-semibold">Created By</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project) => {
                    const colorStyle = getColorClasses(project.color || "indigo");
                    const iconColorClass = colorStyle.split(" ")[1];
                    const iconBgClass = colorStyle.split(" ")[2];
                    return (
                      <tr key={project.id} onClick={() => navigate(`/project/${project.id}`)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClass} ${iconColorClass}`}>
                              <project.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{project.title || "Untitled"}</div>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${getTagClasses(project.tagType || "WEB")}`}>
                                {project.tag || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={project.description}>{project.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Layout className="w-3.5 h-3.5 text-gray-400" />
                            <span>{project.issues}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-2 mr-2">
                              {Array.isArray(project.members) && project.members.slice(0, 3).map((m: any, i: number) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[9px] text-indigo-700 font-bold overflow-hidden">
                                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{m.firstName?.[0] || m.username?.[0] || "U"}</span>}
                                </div>
                              ))}
                            </div>
                            <span>{Array.isArray(project.members) ? project.members.length : 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                              {(project.createdBy || "U").charAt(0)}
                            </div>
                            <span className="text-gray-700">{project.createdBy || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-indigo-600 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProjects.length === 0 && <div className="p-8 text-center text-gray-500">No projects found.</div>}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Drawer */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/10 transition-opacity" onClick={handleBackdropClick} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors" type="button">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleCreateProject}>
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
                <FloatingLabel
                  id="projectName"
                  label="Project Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <div className="flex flex-col gap-1">
                  <FloatingLabel
                    id="projectKey"
                    label="Project Key"
                    type="text"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, key: e.target.value }))
                    }
                    required
                  />
                  {isCheckingKey && (
                    <p className="text-[10px] text-indigo-500 ml-1 animate-pulse">Checking availability...</p>
                  )}
                  {isKeyAvailable === false && (
                    <p className="text-[10px] text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                      ⚠️ This project key is already in use
                    </p>
                  )}
                  {isKeyAvailable === true && (
                    <p className="text-[10px] text-green-600 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                      ✓ Key is available
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400 -mt-3 ml-1">
                  Used for issue identifiers (e.g., KEY-1)
                </p>
                <FloatingTextArea
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />

                <MultiSelectUser
                  label="Add Members"
                  selectedIds={formData.members}
                  onChange={(selectedIds) => setFormData((prev) => ({ ...prev, members: selectedIds }))}
                  users={allUsers}
                  variant="list"
                />

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, color: color.id as any }))}
                        className={`w-8 h-8 rounded-full ${color.bg} transition-all ${formData.color === color.id ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Settings2 className="w-5 h-5" /></div>
                    <label className="text-sm font-bold text-gray-900">Workflow Selection</label>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, workflowType: "DEFAULT" }))}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${formData.workflowType === "DEFAULT" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-100 bg-white hover:border-gray-200"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.workflowType === "DEFAULT" ? "border-indigo-600" : "border-gray-300"}`}>
                        {formData.workflowType === "DEFAULT" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Use Default Workflow</p>
                        <p className="text-[10px] text-gray-500">Todo → In Progress → Blocked → In Review → Done</p>
                      </div>
                    </button>

                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group/card ${formData.workflowType === "CUSTOM" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                      <div
                        onClick={() => {
                          setFormData((prev: any) => ({ ...prev, workflowType: "CUSTOM" }));
                          setIsWorkflowDrawerOpen(true);
                        }}
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.workflowType === "CUSTOM" ? "border-indigo-600" : "border-gray-300"}`}>
                          {formData.workflowType === "CUSTOM" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Create Custom Workflow</p>
                          <p className="text-[10px] text-gray-500">Define your own stages and rules</p>
                        </div>
                      </div>
                      {formData.workflowType === "CUSTOM" && (
                        <button type="button" onClick={() => setIsWorkflowDrawerOpen(true)} className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 rounded transition-colors">Configure</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isKeyAvailable === false || isCheckingKey}
                      className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 ${isKeyAvailable === false || isCheckingKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
                    >
                      {isCheckingKey ? 'Checking...' : 'Create Project'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Workflow Builder Drawer */}
      {isWorkflowDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsWorkflowDrawerOpen(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-indigo-100 shadow-lg"><Settings2 className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Workflow Configuration</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Custom Builder</p>
                </div>
              </div>
              <button onClick={() => setIsWorkflowDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all hover:text-gray-900 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <CustomWorkflowBuilder
                workflowData={formData.workflow}
                setWorkflowData={(data) => setFormData((prev: any) => ({ ...prev, workflow: data }))}
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button type="button" onClick={() => setIsWorkflowDrawerOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95">Cancel</button>
              <button type="button" onClick={() => setIsWorkflowDrawerOpen(false)} className="flex-[2] py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;