import { useAuth } from "@/contexts/AuthContext";
import OverviewPage from "./Overview";
import PlatformOverview from "./super/PlatformOverview";

export default function DashboardIndex() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") {
    return <PlatformOverview />;
  }

  return <OverviewPage />;
}