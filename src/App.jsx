import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './page/LandingPage';
import NewLandingPage from './page/NewLandingPage';
import BusinessOverviewPage from './page/BusinessOverviewPage';
import DepartmentProjectManagementPage from './page/DepartmentProjectManagementPage';
import QuestionDetailPage from './page/QuestionDetailPage';
import AdminDashboardPage from './page/AdminDashboardPage';
import NotFoundPage from './page/NotFoundPage';
import Navbar from './Components/navbar';
import Login from './page/Login';
import SignUp from './page/SignUp';
import ForgotPasswordPage from './page/ForgotPasswordPage';
import ApiKeyManagerPage from './page/ApiKeyManagerPage';
import { useUserContext } from './context/LoginContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Landingpage from './page/landingpageFolder/Landingpage';
import DocumentationPage from './page/landingpageFolder/DocumentationPage';
import UploadYourOwnData from './page/UploadYourOwnData';
import ExpertiseAreaPage from './page/ExpertiseAreaPage';
import { QuestionCountProvider } from './context/QuestionCountContext';
import { UploadLoadingProvider } from './context/UploadLoadingContext';
import GlobalUploadLoadingModal from './Components/GlobalUploadLoadingModal';
import AgentQuestionsPage from './page/AgentQuestionsPage';
import AgentAnalyticsPage from './page/AgentAnalyticsPage';
import AgentManagementPage from './page/AgentManagementPage';
import AccountActivationPage from './page/AccountActivationPage';
import AdminAnalyticsPage from './page/AdminAnalyticsPage';
import AiPersonalizationPage from './page/AiPersonalizationPage.jsx';
import UserLayout from './Components/UserLayout.jsx';
import LandingLayout from './Components/LandingLayout.jsx';
import WidgetCustomizerPage from './page/WidgetCustomizerPage.jsx';
import WidgetIntegrationPage from './page/WidgetIntegrationPage.jsx';
import { SidebarProvider } from './context/SidebarContext.jsx';
import DashboardPage from './page/DashboardPage';
import CheckoutReturnPage from './page/CheckoutReturnPage';
import InvoicePage from './page/InvoicePage';
import ConversationsCounterPage from './page/ConversationsCounterPage';
import ManageWidgetAgentsPage from './page/ManageWidgetAgentsPage';
import ManageUserDetailsPage from './page/ManageUserDetailsPage';

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

// User-only route wrapper component (for any logged-in user)
const UserRoute = ({ children }) => {
  const { isLogin } = useUserContext();

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  const { role, token } = useUserContext();

  return (
    <>
      <QuestionCountProvider>
        <SubscriptionProvider>
          <UploadLoadingProvider>
            <SidebarProvider>
              <Navbar />
              <Routes>
            <Route path="/new-landing" element={<NewLandingPage />} />
              <Route path="/home" element={<LandingLayout><Landingpage /></LandingLayout>} />
              <Route path="/old-landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/activate-account/:tokenId" element={<AccountActivationPage />} />
              <Route path="/activate-account" element={<AccountActivationPage />} />
              <Route path="/activation" element={<AccountActivationPage />} />
              <Route path="/activation/:tokenId" element={<AccountActivationPage />} />
              <Route path="/verify-invitation" element={<AccountActivationPage />} />
              <Route path="/verify-invitation/:tokenId" element={<AccountActivationPage />} />
              <Route path="/agent-activation" element={<AccountActivationPage />} />
              <Route path="/agent-activation/:tokenId" element={<AccountActivationPage />} />
              <Route path="/" element={
                token ? <UserLayout /> : <Navigate to="/home" replace />
              }>
                <Route index element={<Navigate to="/business-overview" replace />} />
                <Route path="/business-overview" element={<BusinessOverviewPage />} />
                <Route path="/department-project-management/:businessId/:businessName" element={<DepartmentProjectManagementPage />} />
                <Route path="/department-project-management/:businessId/:businessName/:departmentId" element={<DepartmentProjectManagementPage />} />
                <Route path="/question/:businessName/:department/:project/:projectId/:questionId/:title/:question" element={<QuestionDetailPage />} />
                <Route path="/upload-data/:businessName/:department/:project/:projectId" element={<UploadYourOwnData />} />
                <Route path="/expertise-area/:areaId" element={<ExpertiseAreaPage />} />
                <Route path="/agent-questions" element={<AgentQuestionsPage />} />
                <Route path="/agent-analytics" element={<AgentAnalyticsPage />} />
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/ai-personalization" element={<AiPersonalizationPage />} />
                <Route path="/widget-customizer" element={<WidgetCustomizerPage />} />
                <Route path="/widget-integration" element={<WidgetIntegrationPage />} />
                <Route path="/api-key-manager" element={
                  <AdminRoute>
                    <ApiKeyManagerPage />
                  </AdminRoute>
                } />
                <Route path="/agent-management" element={
                  <AdminRoute>
                    <AgentManagementPage />
                  </AdminRoute>
                } />
                <Route path="/admin-analytics" element={
                  <AdminRoute>
                    <AdminAnalyticsPage />
                  </AdminRoute>
                } />
                <Route path="/manage-widget-agents" element={
                  <AdminRoute>
                    <ManageWidgetAgentsPage />
                  </AdminRoute>
                } />
                <Route path="/manage-user-details" element={
                  <AdminRoute>
                    <ManageUserDetailsPage />
                  </AdminRoute>
                } />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/conversations-counter" element={<ConversationsCounterPage />} />
              </Route>
              <Route path="/checkout/return" element={<CheckoutReturnPage />} />
              <Route path="/invoices" element={<InvoicePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <GlobalUploadLoadingModal />
          </SidebarProvider>
        </UploadLoadingProvider>
        </SubscriptionProvider>
      </QuestionCountProvider>
    </>
  )
}

export default App