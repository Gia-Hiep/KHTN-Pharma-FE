import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * <RequireRole rolesAllowed={["ADMIN", "PHARMACIST"]}>
 *   <Page />
 * </RequireRole>
 */
export function RequireRole({ rolesAllowed = [], children }) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(rolesAllowed)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
