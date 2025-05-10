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
import UploadYourOwnData from './page/UploadYourOwnData';
import ExpertiseAreaPage from './page/ExpertiseAreaPage';
import { QuestionCountProvider } from './context/QuestionCountContext';
import AgentQuestionsPage from './page/AgentQuestionsPage';
import AgentAnalyticsPage from './page/AgentAnalyticsPage';
import AgentManagementPage from './page/AgentManagementPage';
import AccountActivationPage from './page/AccountActivationPage';
import AdminAnalyticsPage from './page/AdminAnalyticsPage';

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
    <>
      <Navbar />
      <QuestionCountProvider>
        <Routes>
          <Route path="/" element={<Landingpage />} />
          <Route path="/old-landing" element={<LandingPage />} />
          <Route path="/new-landing" element={<NewLandingPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/business-overview" element={<BusinessOverviewPage />} />
          <Route path="/department-project-management/:businessId/:businessName" element={<DepartmentProjectManagementPage />} />
          <Route path="/department-project-management/:businessId/:businessName/:departmentId" element={<DepartmentProjectManagementPage />} />
          <Route path="/question-overview/:businessName/:department/:project/:projectId" element={<QuestionOverviewPage />} />
          <Route path="/question-detail/:businessName/:department/:project/:questionId/:title/:question/:projectId" element={<QuestionDetailPage />} />
          <Route path="/upload-data/:businessName/:department/:project/:projectId" element={<UploadYourOwnData />} />
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
          <Route path="/expertise-area/:areaId" element={<ExpertiseAreaPage />} />
          <Route path="/my-questions" element={<AgentQuestionsPage />} />
          <Route path="/my-analytics" element={<AgentAnalyticsPage />} />
          <Route path="/agent-management" element={
            <AdminRoute>
              <AgentManagementPage />
            </AdminRoute>
          } />
          <Route path="/activate-account/:tokenId" element={<AccountActivationPage />} />
          <Route path="/admin-analytics" element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </QuestionCountProvider>
    </>
  )
}

export default App