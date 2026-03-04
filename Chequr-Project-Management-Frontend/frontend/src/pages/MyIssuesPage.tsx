import React, { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "../redux/store";
import { GET_MY_ISSUES_QUERY } from "../graphql/issue.query";
import { GET_PROJECTS_QUERY } from "../graphql/projects.query";
import { GET_USER_PROFILE } from "../graphql/user.query";
import SummaryCards from "../components/issues/SummaryCards";
import IssueSearchBar from "../components/issues/IssueSearchBar";
import IssueList from "../components/issues/IssueList";
import IssueDetailDrawer from "../components/issues/IssueDetailDrawer";
import { Issue } from "../types/issue.types";

type TabType = 'assigned' | 'reported';
type CategoryType = 'all' | 'completed' | 'overdue';

const MyIssuesPage: React.FC = () => {
    const location = useLocation();
    const userState = useSelector((state: RootState) => state.auth.user);
    const userId = userState?.id || '';

    const [activeTab, setActiveTab] = useState<TabType>('assigned');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');

    useEffect(() => {
        const state = location.state as { category?: CategoryType };
        if (state?.category) {
            setCategoryFilter(state.category);
        }
    }, [location.state]);

    // User profile
    const { data: profileData } = useQuery<any>(GET_USER_PROFILE, {
        variables: { id: userId },
        skip: !userId,
    });

    // Fetch ALL projects (for "All Issues" tab — issues embedded in each project)
    const { data: projectsData, loading: projectsLoading } = useQuery<{ projects: any[] }>(GET_PROJECTS_QUERY, {
        fetchPolicy: 'cache-and-network',
    });

    // Fetch issues for "Assigned to Me" / "Reported by Me" tabs
    const { data: issuesData, loading: myIssuesLoading, error, refetch } = useQuery<any>(GET_MY_ISSUES_QUERY, {
        variables: { filter: activeTab.toUpperCase() },
        fetchPolicy: 'cache-and-network',
        skip: !userId,
    });

    // Stages come directly from the enriched GET_MY_ISSUES_QUERY — no secondary project fetch needed

    // Compute issues list based on active tab
    const issues: any[] = useMemo(() => {
        return issuesData?.getMyIssues || [];
    }, [issuesData]);

    const loading = myIssuesLoading;

    const handleIssueClick = (issue: Issue) => {
        setSelectedIssue(issue);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        setSelectedIssue(null);
    };

    const filteredIssues = useMemo(() => {
        if (!issues.length) return [];

        // 1. Filter by Project Archive Status
        let result = issues.filter((i: any) => {
            // Find project status if not already on issue
            const pStatus = i.project?.status;
            return pStatus !== 'ARCHIVED';
        });

        // 2. Filter by Category (Completed, Overdue)
        const now = new Date();
        if (categoryFilter === 'completed') {
            result = result.filter((i: any) => i.stage?.isFinal);
        } else if (categoryFilter === 'overdue') {
            result = result.filter((i: any) => i.dueDate && new Date(i.dueDate) < now && !i.stage?.isFinal);
        }

        // 3. Filter by Search Query
        if (!searchQuery.trim()) return result;

        const lowerQuery = searchQuery.toLowerCase();
        return result.filter((issue: any) =>
            issue.title.toLowerCase().includes(lowerQuery) ||
            (issue.project?.key || '').toLowerCase().includes(lowerQuery) ||
            (issue.project?.name || '').toLowerCase().includes(lowerQuery) ||
            (issue.stage?.name || '').toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, issues, categoryFilter]);

    // Stats computed from the current tab's issues (Assigned to Me / Reported by Me)
    const stats = useMemo(() => {
        let open = 0, inProgress = 0, completed = 0, overdue = 0;
        const now = new Date();

        issues.forEach((issue: any) => {
            const isDone = issue.stage?.isFinal;
            const orderIndex = issue.stage?.orderIndex;

            if (isDone) {
                completed++;
            } else if (orderIndex !== undefined && orderIndex !== null && orderIndex > 0) {
                inProgress++;
            } else {
                open++;
            }

            if (issue.dueDate && new Date(issue.dueDate) < now && !isDone) {
                overdue++;
            }
        });

        return { open, inProgress, completed, overdue };
    }, [issues]);

    if (error) {
        return <div className="p-8 text-red-500">Error loading issues: {error.message}</div>;
    }

    const TABS: { key: TabType; label: string }[] = [
        { key: 'assigned', label: 'Assigned to Me' },
        { key: 'reported', label: 'Reported by Me' },
    ];

    const emptyMessages: Record<TabType, string> = {
        assigned: "No issues assigned to you.",
        reported: "No issues reported by you.",
    };

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Issues</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track and manage all issues across your projects
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
                <SummaryCards
                    open={stats.open}
                    inProgress={stats.inProgress}
                    completed={stats.completed}
                    overdue={stats.overdue}
                />

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                            setSearchQuery("");
                                            setCategoryFilter('all');
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${activeTab === tab.key && categoryFilter === 'all'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Category Badge */}
                            {categoryFilter !== 'all' && (
                                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-indigo-100">
                                    <span className="capitalize">{categoryFilter}</span>
                                    <button
                                        onClick={() => setCategoryFilter('all')}
                                        className="hover:text-indigo-900 focus:outline-none"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-64">
                            <IssueSearchBar onSearch={setSearchQuery} />
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <IssueList
                                issues={filteredIssues}
                                onIssueClick={handleIssueClick}
                                emptyMessage={emptyMessages[activeTab]}
                            />
                        )}
                    </div>
                </div>
            </div>

            {selectedIssue && (
                <IssueDetailDrawer
                    issue={selectedIssue}
                    isOpen={isDetailOpen}
                    onClose={(saved) => {
                        handleCloseDetail();
                        if (saved) refetch();
                    }}
                    onDelete={() => {
                        refetch();
                        handleCloseDetail();
                    }}
                    stages={selectedIssue?.project?.workflow?.stages || []}
                />
            )}
        </div>
    );
};

export default MyIssuesPage;
