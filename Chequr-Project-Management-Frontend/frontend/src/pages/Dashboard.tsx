import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useQuery } from '@apollo/client/react';
import { GET_USER_PROFILE } from '../graphql/user.query';
import { GET_PROJECTS_QUERY } from '../graphql/projects.query';
import { Folder, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import StatsCard from '../component/Dashboard/StatsCard';
import IssuesWidget from '../component/Dashboard/IssuesWidget';
import ProjectsWidget from '../component/Dashboard/ProjectsWidget';

interface UserProfileData {
  user: {
    firstName?: string;
    lastName?: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id || '';

  const { data: profileData } = useQuery<UserProfileData>(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId,
  });

  // Fetch all projects — issues are embedded in each project from the query
  const { data: projectsData } = useQuery<{ projects: any[] }>(GET_PROJECTS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const allProjects = projectsData?.projects || [];
  // Exclude archived projects for Dashboard metrics
  const projects = allProjects.filter((p: any) => p.status !== 'ARCHIVED');

  // Build a flat list of ALL issues across all projects, injecting project context into each issue
  const allIssues = projects.flatMap((p: any) =>
    (p.issues || []).map((issue: any) => ({
      ...issue,
      project: { id: p.id, name: p.name, key: p.key },
    }))
  );

  const firstName = profileData?.user?.firstName || user?.firstName || 'User';

  // Stats — computed from ACTIVE project issues
  const activeProjectsCount = projects.length;
  const totalIssuesCount = allIssues.length;
  const completedCount = allIssues.filter((i: any) => i.stage?.isFinal).length;
  const overdueCount = allIssues.filter((i: any) => {
    return i.dueDate && new Date(i.dueDate) < new Date() && !i.stage?.isFinal;
  }).length;

  return (
    <div className="flex flex-col h-full space-y-8 overflow-y-auto p-8">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 font-medium">
          Here's what's happening with your projects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Projects"
          value={activeProjectsCount.toString()}
          icon={Folder}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatsCard
          title="Total Issues"
          value={totalIssuesCount.toString()}
          icon={ClipboardList}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Completed Issues"
          value={completedCount.toString()}
          icon={CheckCircle2}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Overdue"
          value={overdueCount.toString()}
          icon={Clock}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Main Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Issues Widget — shows ALL issues from all project */}
        <div className="lg:col-span-2">
          <IssuesWidget issues={allIssues} />
        </div>

        {/* Projects Widget */}
        <div className="lg:col-span-1">
          <ProjectsWidget projects={projects} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
