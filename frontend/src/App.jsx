import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleRoute from './components/routing/RoleRoute';
import AppLayout from './components/layout/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CampusMap from './pages/CampusMap';
import FacultyFinder from './pages/FacultyFinder';
import AcademicResources from './pages/resources/AcademicResources';
import ResourceList from './pages/resources/ResourceList';
import ResourceDetail from './pages/resources/ResourceDetail';
import Community from './pages/community/Community';
import PostDetail from './pages/community/PostDetail';
import Chat from './pages/Chat';
import Notices from './pages/Notices';
import Events from './pages/Events';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminResources from './pages/admin/AdminResources';
import AdminCampus from './pages/admin/AdminCampus';
import AdminModeration from './pages/admin/AdminModeration';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campus-map" element={<CampusMap />} />
        <Route path="/faculty" element={<FacultyFinder />} />

        <Route path="/resources" element={<AcademicResources />} />
        <Route path="/resources/pyqs" element={<ResourceList type="pyq" />} />
        <Route path="/resources/assignments" element={<ResourceList type="assignment" />} />
        <Route path="/resources/guides" element={<ResourceList type="assignment_guide" />} />
        <Route path="/resources/lab-manuals" element={<ResourceList type="lab_manual" />} />
        <Route path="/resources/study-materials" element={<ResourceList type="study_material" />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />

        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/events" element={<Events />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchResults />} />

        {/* Admin only */}
        <Route path="/admin/users" element={<RoleRoute allow={['admin']}><AdminUsers /></RoleRoute>} />
        <Route path="/admin/faculty" element={<RoleRoute allow={['admin']}><AdminFaculty /></RoleRoute>} />
        <Route path="/admin/resources" element={<RoleRoute allow={['admin']}><AdminResources /></RoleRoute>} />
        <Route path="/admin/campus" element={<RoleRoute allow={['admin']}><AdminCampus /></RoleRoute>} />
        <Route path="/admin/moderation" element={<RoleRoute allow={['admin']}><AdminModeration /></RoleRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
