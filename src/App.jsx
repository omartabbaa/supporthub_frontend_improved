import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './page/LandingPage';
import NewLandingPage from './page/NewLandingPage';
import BusinessOverviewPage from './page/BusinessOverviewPage';
import DepartmentProjectManagementPage from './page/DepartmentProjectManagementPage';
import QuestionOverviewPage from './page/QuestionOverviewPage';
import QuestionDetailPage from './page/QuestionDetailPage';
import AdminDashboardPage from './page/AdminDashboardPage';
import NotFoundPage from './page/NotFoundPage';
import Navbar from './Components/navbar';
import Login from './page/Login';
import SignUp from './page/SignUp';
import ApiKeyManagerPage from './page/ApiKeyManagerPage';
import { useUserContext } from './context/LoginContext';
import Landingpage from './page/landingpageFolder/Landingpage';
import DocumentationPage from './page/landingpageFolder/DocumentationPage';

// Admin-only route wrapper component
const AdminRoute = ({ children }) => {
  const { role, isLogin } = useUserContext();
  
  if (!isLogin) {
    return <Navigate to="/login" />;
  }
  
  if (role !== "ROLE_ADMIN") {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <body>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/old-landing" element={<LandingPage />} />
        <Route path="/new-landing" element={<NewLandingPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/business-overview" element={<BusinessOverviewPage />} />
        <Route path="/department-project-management/:businessId/:businessName" element={<DepartmentProjectManagementPage />} />
        <Route path="/question-overview/:department/:project/:projectId" element={<QuestionOverviewPage />} />
        <Route path="/question-detail/:questionId/:title/:question/:projectId" element={<QuestionDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin-dashboard" element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        } />
        <Route path="/api-key-manager" element={
          <AdminRoute>
            <ApiKeyManagerPage />
          </AdminRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </body>
  )
}

export default App