import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PageLoader from "../Components/PageLoader";
import { useLogin } from "../hooks/useLogin";
import { isAdminUser } from "../utils/auth";

// Eager — tiny and needed immediately (login is the first paint).
import Login from "../pages/auth/Login";
import ForgetPassword from "../pages/auth/ForgetPassword";
import PageNotFound from "../Components/PageNotFound/PageNotFound";

// Lazy — each page (and its data hooks) is only downloaded when that route is
// actually visited. This keeps the initial /login load tiny instead of pulling
// the entire app + every dashboard hook up front.
// MainLayout is lazy too: it pulls in Navbar/Sidebar + their hooks
// (useNotifications, useSocket, ...) which have no business loading on /login.
const MainLayout = lazy(() => import("./Mainlayout"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const UserDashboard = lazy(() => import("../pages/UserDashboard"));
const UserRoles = lazy(() => import("../pages/UserRole"));
const Process = lazy(() => import("../pages/Process"));
const PlantName = lazy(() => import("../pages/PlantName"));
const Employee = lazy(() => import("../pages/Employee"));
const Company = lazy(() => import("../pages/Company"));
const AssemblyLine = lazy(() => import("../pages/AssemblyLine"));
const AssemblyLineStatus = lazy(() => import("../pages/AssemblyLineStatus"));
const CheckItem = lazy(() => import("../pages/CheckItem"));
const Parts = lazy(() => import("../pages/Parts"));
const CheckItemsData = lazy(() => import("../pages/CheckItemsData"));
const CheckItemHistory = lazy(() => import("../pages/CheckItemHistory"));
const AssignedAssemblyLines = lazy(() => import("../pages/AssignedAssemblyLines"));
const AssemblyError = lazy(() => import("../pages/AssemblyError"));
const ErrorforAdmin = lazy(() => import("../pages/ErrorforAdmin"));
const Department = lazy(() => import("../pages/Department"));
const DailyCheckAssembly = lazy(() => import("../pages/DailyAssemblyCheck"));
const PlcLiveData = lazy(() => import("../pages/PlcLiveData"));
const PlcStoppage = lazy(() => import("../pages/PlcStoppage"));
const PlcDashboard = lazy(() => import("../pages/PlcDashboard"));
const PlcHistory = lazy(() => import("../pages/PlcHistory"));
const PlcQualityCheck = lazy(() => import("../pages/PlcQualityCheck"));
const Report = lazy(() => import("../pages/Report"));
const ReportQrView = lazy(() => import("../pages/ReportQrView"));
const FormSubmissionData = lazy(() => import("../pages/FromSubmissionData"));
const TemplateMaster = lazy(() => import("../TemplateMasterPages/TemplateMaster"));
const ReleaseGroups = lazy(() => import("../TemplateMasterPages/ReleaseGroups"));
const ManageWorkflow = lazy(() => import("../TemplateMasterPages/ManageWorkflow"));
const ManageDocument = lazy(() => import("../TemplateMasterPages/ManageDocument"));
const AssignedTemplates = lazy(() => import("../TemplateMasterPages/AssignedTemplates"));
const TemplateStatus = lazy(() => import("../TemplateMasterPages/TemplateStatus"));
const TemplateApproveReject = lazy(() => import("../TemplateMasterPages/TemplateApproveReject"));
const TemplateReport = lazy(() => import("../TemplateMasterPages/TemplateReport"));

// Cylinder traceability module (separate backend via VITE_CYLINDER_API_URL)
const CylinderLiveOps = lazy(() => import("../cylinder/pages/CylinderLiveOps"));
const CylinderPipeCutting = lazy(() => import("../cylinder/pages/CylinderPipeCutting"));
const CylinderTrace = lazy(() => import("../cylinder/pages/CylinderTrace"));
const CylinderMachines = lazy(() => import("../cylinder/pages/CylinderMachines"));
const CylinderHistory = lazy(() => import("../cylinder/pages/CylinderHistory"));
const CylinderDefects = lazy(() => import("../cylinder/pages/CylinderDefects"));

export const AppRoute = () => {
  const { logedinUser } = useLogin();

  const user = logedinUser.data;
  const isLoading = logedinUser.isLoading;
  const isFetching = logedinUser.isFetching;

  const withProtection = (Component) => (
    <ProtectedRoute
      user={user}
      isLoading={isLoading}
      isFetching={isFetching}
    >
      <Suspense fallback={<PageLoader />}>
        <MainLayout>
          <Component />
        </MainLayout>
      </Suspense>
    </ProtectedRoute>
  );

  return useRoutes([
    { path: "/login", element: <Login /> },
    { path: "/forgot-password", element: <ForgetPassword /> },
    // Dev-only public preview of the Cylinder pages (no login). Auto-excluded from
    // production builds via import.meta.env.DEV. Open /cyl-preview/ops|trace|machines|history|defects.
    ...(import.meta.env.DEV
      ? [
          { path: "/cyl-preview/ops", element: <Suspense fallback={<PageLoader />}><CylinderLiveOps /></Suspense> },
          { path: "/cyl-preview/pipe-cutting", element: <Suspense fallback={<PageLoader />}><CylinderPipeCutting /></Suspense> },
          { path: "/cyl-preview/trace", element: <Suspense fallback={<PageLoader />}><CylinderTrace /></Suspense> },
          { path: "/cyl-preview/trace/:id", element: <Suspense fallback={<PageLoader />}><CylinderTrace /></Suspense> },
          { path: "/cyl-preview/machines", element: <Suspense fallback={<PageLoader />}><CylinderMachines /></Suspense> },
          { path: "/cyl-preview/machines/:key", element: <Suspense fallback={<PageLoader />}><CylinderMachines /></Suspense> },
          { path: "/cyl-preview/history", element: <Suspense fallback={<PageLoader />}><CylinderHistory /></Suspense> },
          { path: "/cyl-preview/defects", element: <Suspense fallback={<PageLoader />}><CylinderDefects /></Suspense> },
        ]
      : []),
    {
      path: "/",
      element: withProtection(isAdminUser(user) ? Dashboard : UserDashboard),
    },
    { path: "/user-role", element: withProtection(UserRoles) },
    { path: "/process", element: withProtection(Process) },
    { path: "/parts", element: withProtection(Parts) },
    { path: "/plant-name", element: withProtection(PlantName) },
    { path: "/department", element: withProtection(Department) },
    { path: "/employee", element: withProtection(Employee) },
    { path: "/company", element: withProtection(Company) },
    { path: "/assembly-line", element: withProtection(AssemblyLine) },
    { path: "/release-group", element: withProtection(ReleaseGroups) },
    { path: "/template-master", element: withProtection(TemplateMaster) },
    { path: "/template-status", element: withProtection(TemplateStatus) },
    { path: "/form-submission", element: withProtection(FormSubmissionData) },
    { path: "/template-report", element: withProtection(TemplateReport) },
    {
      path: "/template-approve-reject",
      element: withProtection(TemplateApproveReject),
    },
    { path: "/workflow", element: withProtection(ManageWorkflow) },
    { path: "/document-management", element: withProtection(ManageDocument) },

    {
      path: "/assembly-line-status",
      element: withProtection(AssemblyLineStatus),
    },
    {
      path: "/plc-data/live",
      element: withProtection(PlcLiveData),
    },

    {
      path: "/plc/history",
      element: withProtection(PlcHistory),
    },
    {
      path: "/plc-data/report/qr-view",
      element: (
        <Suspense fallback={<PageLoader />}>
          <ReportQrView />
        </Suspense>
      ),
    },
    {
      path: "/plc-data/report",
      element: withProtection(Report),
    },
    {
      path: "/plc-data/qc-check",
      element: withProtection(PlcQualityCheck),
    },
    {
      path: "/plc-data/stoppage",
      element: withProtection(PlcStoppage),
    },
    {
      path: "/plc-data/dashboard",
      element: withProtection(PlcDashboard),
    },
    user && !isAdminUser(user) && {
      path: "/assembly-line/error",
      element: withProtection(AssemblyError),
    },
    {
      path: "/assembly-line-admin/error",
      element: withProtection(ErrorforAdmin),
    },

    { path: "/checkitem", element: withProtection(CheckItem) },
    { path: "/checkitem-data", element: withProtection(CheckItemsData) },
    {
      path: "/check-item-history",
      element: withProtection(CheckItemHistory),
    },
    {
      path: "/assigned-assembly-lines",
      element: withProtection(
        user && !isAdminUser(user) ? AssignedAssemblyLines : PageNotFound,
      ),
    },
    {
      path: "/daily-assembly-check",
      element: withProtection(
        user && !isAdminUser(user) ? DailyCheckAssembly : PageNotFound,
      ),
    },
    {
      path: "/assigned-templates",
      element: withProtection(AssignedTemplates),
    },
    // ── Cylinder traceability ──
    { path: "/cylinder", element: withProtection(CylinderLiveOps) },
    { path: "/cylinder/pipe-cutting", element: withProtection(CylinderPipeCutting) },
    { path: "/cylinder/trace", element: withProtection(CylinderTrace) },
    { path: "/cylinder/trace/:id", element: withProtection(CylinderTrace) },
    { path: "/cylinder/machines", element: withProtection(CylinderMachines) },
    { path: "/cylinder/machines/:key", element: withProtection(CylinderMachines) },
    { path: "/cylinder/history", element: withProtection(CylinderHistory) },
    { path: "/cylinder/defects", element: withProtection(CylinderDefects) },

    { path: "/*", element: <PageNotFound /> },
  ].filter(Boolean));
};
