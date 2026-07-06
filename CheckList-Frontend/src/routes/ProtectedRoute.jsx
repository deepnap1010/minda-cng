import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "../Components/PageLoader";
import {
  getDefaultHomePath,
  getUserPermissions,
  isAdminUser,
} from "../utils/auth";

const ProtectedRoute = ({ user, isLoading, isFetching, children }) => {
  const location = useLocation();

  if (isLoading || (isFetching && !user)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isAdminUser(user)) {
    return children;
  }

  const permissions = getUserPermissions(user);
  const currentPath = location.pathname;

  if (currentPath === "/") {
    return children;
  }

  const hasAccess = permissions.length === 0 || permissions.includes(currentPath);

  if (!hasAccess) {
    const redirectPath = getDefaultHomePath(user);
    if (redirectPath !== currentPath) {
      return <Navigate to={redirectPath} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
