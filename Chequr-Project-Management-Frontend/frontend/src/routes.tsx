import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import AppLayout from './component/Layout'
import KnowledgeCenter from './pages/KnowledgeCenter'
import Dashboard from './pages/Dashboard'
import AppLibrary from './pages/AppLibrary'
import Projects from './pages/Projects'
import Teams from './pages/Teams'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import MyIssuesPage from './pages/MyIssuesPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Kanban from './pages/Kanban'
import ProtectedRoute from './components/ProtectedRoute'
import BacklogPage from './features/sprints/pages/BacklogPage'
import BoardPage from './features/sprints/pages/BoardPage'
import ProjectDetails from './pages/ProjectDetails'

import ProjectLayout from './component/ProjectLayout'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route - Login */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate" element={<Register />} />

      {/* Protected Routes - Require Authentication */}
      <Route element={<ProtectedRoute />}>

        {/* Global Pages Layout */}
        <Route path="/" element={<AppLayout><Outlet /></AppLayout>}>
          {/* Redirect root to Knowledge Center */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Actual Pages */}
          <Route path="knowledge-center" element={<KnowledgeCenter />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="app-library" element={<AppLibrary />} />
          <Route path="projects" element={<Projects />} /> {/* Ensure Projects page is accessible */}
          <Route path="kanban" element={<Kanban />} />
          <Route path="teams" element={<Teams />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="my-issues" element={<MyIssuesPage />} />

          {/* Support for sidebar items that might navigate to these paths */}
          <Route path="hub" element={<Dashboard />} /> {/* Maps to Chequr AI Hub */}
        </Route>

        {/* Project Specific Layout */}
        <Route path="/project/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectDetails />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="board" element={<BoardPage />} />
        </Route>

      </Route>
    </Routes>
  )
}
