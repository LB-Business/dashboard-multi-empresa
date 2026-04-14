import { useAuth } from "@/contexts/AuthContext";
import OverviewPage from "./Overview";
import PlatformOverview from "./super/PlatformOverview";

/** Renders the correct dashboard index based on user role */
export default function DashboardIndex() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") {
    return <PlatformOverview />;
  }

  return <OverviewPage />;
}
