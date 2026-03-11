import { getDashboardMetrics } from "@/lib/admin/metrics";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { listReservations } from "./reservas/actions";

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const todaysReservations = await listReservations({ date: todayStr });

  return <AdminDashboardClient metrics={metrics} todaysReservations={todaysReservations} />;
}
