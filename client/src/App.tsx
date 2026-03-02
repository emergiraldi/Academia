import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentForgotPassword from "./pages/StudentForgotPassword";
import StudentVerifyCode from "./pages/StudentVerifyCode";
import StudentResetPassword from "./pages/StudentResetPassword";
import StudentDashboard from "./pages/StudentDashboardNew";
import StudentWorkoutDetail from "./pages/StudentWorkoutDetailNew";
import AdminLogin from "./pages/AdminLogin";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminFinancialDashboard from "./pages/admin/AdminFinancialDashboard";
import AdminDefaulters from "./pages/admin/AdminDefaulters";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminProfessors from "./pages/admin/AdminProfessors";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminControlIdDevices from "./pages/admin/AdminControlIdDevices";
import AdminToletusDevices from "./pages/admin/AdminToletusDevices";
import AdminReports from "./pages/admin/AdminReports";
import AdminAccountsPayable from "./pages/admin/AdminAccountsPayable";
import AdminCashFlow from "./pages/admin/AdminCashFlow";
import AdminCRM from "./pages/admin/AdminCRM";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminAssessments from "./pages/admin/AdminAssessments";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminCostCenters from "./pages/admin/AdminCostCenters";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminAccessLogs from "./pages/admin/AdminAccessLogs";
import AdminBankAccounts from "./pages/admin/AdminBankAccounts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminWellhubMembers from "./pages/admin/AdminWellhubMembers";
import AdminWellhubCheckIn from "./pages/admin/AdminWellhubCheckIn";
import ProfessorLogin from "./pages/ProfessorLogin";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import StudentProfile from "./pages/StudentProfile";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminGyms from "./pages/super-admin/SuperAdminGyms";
import SuperAdminPlans from "./pages/super-admin/SuperAdminPlans";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import SuperAdminReports from "./pages/super-admin/SuperAdminReports";
import SuperAdminScreenshots from "./pages/super-admin/SuperAdminScreenshots";
import LandingPage from "./pages/LandingPage";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import GymSignUp from "./pages/GymSignUp";

function Router() {
  return (
    <Switch>
      {/* Landing & Home */}
      <Route path={"/"} component={LandingPage} />
      <Route path={"/app"} component={Home} />
      <Route path={"/features"} component={Features} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/gym/signup"} component={GymSignUp} />
      
      {/* Student Routes */}
      <Route path={"/student/login"} component={StudentLogin} />
      <Route path={"/student/register"} component={StudentRegister} />
      <Route path={"/student/forgot-password"} component={StudentForgotPassword} />
      <Route path={"/student/verify-code"} component={StudentVerifyCode} />
      <Route path={"/student/reset-password"} component={StudentResetPassword} />
      <Route path={"/student/dashboard"} component={StudentDashboard} />
      <Route path={"/student/workout/:id"} component={StudentWorkoutDetail} />
      
      {/* Professor Routes */}
      <Route path={"/professor/login"} component={ProfessorLogin} />
      <Route path={"/professor"} component={ProfessorDashboard} />
      <Route path={"/professor/dashboard"} component={ProfessorDashboard} />
      <Route path={"/professor/students/:id"} component={StudentProfile} />
      <Route path={"/professor/workout/:id/edit"} component={WorkoutBuilder} />
      <Route path={"/professor/workout/new"} component={WorkoutBuilder} />

      {/* Super Admin Routes */}
      <Route path={"/super-admin/login"} component={SuperAdminLogin} />
      <Route path={"/super-admin"} component={SuperAdminDashboard} />
      <Route path={"/super-admin/dashboard"} component={SuperAdminDashboard} />
      <Route path={"/super-admin/gyms"} component={SuperAdminGyms} />
      <Route path={"/super-admin/plans"} component={SuperAdminPlans} />
      <Route path={"/super-admin/users"} component={SuperAdminUsers} />
      <Route path={"/super-admin/reports"} component={SuperAdminReports} />
      <Route path={"/super-admin/screenshots"} component={SuperAdminScreenshots} />
      <Route path={"/super-admin/settings"} component={SuperAdminSettings} />

      {/* Admin Routes (direct access only) */}
      <Route path={"/admin"} component={AdminLogin} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/forgot-password"} component={AdminForgotPassword} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/payments"} component={AdminPayments} />
      <Route path={"/admin/billing"} component={AdminBilling} />
      <Route path={"/admin/financial"} component={AdminFinancialDashboard} />
      <Route path="/admin/defaulters" component={AdminDefaulters} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/students" component={AdminStudents} />
      <Route path="/admin/professors" component={AdminProfessors} />
      <Route path="/admin/staff" component={AdminStaff} />
      <Route path="/admin/control-id-devices" component={AdminControlIdDevices} />
      <Route path="/admin/toletus-devices" component={AdminToletusDevices} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/accounts-payable" component={AdminAccountsPayable} />
      <Route path="/admin/cash-flow" component={AdminCashFlow} />
      <Route path="/admin/crm" component={AdminCRM} />
      <Route path="/admin/schedule" component={AdminSchedule} />
      <Route path="/admin/assessments" component={AdminAssessments} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/suppliers" component={AdminSuppliers} />
      <Route path="/admin/cost-centers" component={AdminCostCenters} />
      <Route path="/admin/payment-methods" component={AdminPaymentMethods} />
      <Route path="/admin/bank-accounts" component={AdminBankAccounts} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/whatsapp" component={AdminWhatsApp} />
      <Route path="/admin/wellhub/members" component={AdminWellhubMembers} />
      <Route path="/admin/wellhub/checkin" component={AdminWellhubCheckIn} />
      <Route path="/admin/access-logs" component={AdminAccessLogs} />

      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
