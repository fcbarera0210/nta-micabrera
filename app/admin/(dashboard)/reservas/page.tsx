import { unstable_noStore } from "next/cache";
import { getServicesForReservations, listReservations } from "./actions";
import { ReservasClient } from "./ReservasClient";

export const dynamic = "force-dynamic";

export default async function AdminReservasPage() {
  unstable_noStore();
  const [services, reservations] = await Promise.all([
    getServicesForReservations(),
    listReservations(),
  ]);

  return (
    <ReservasClient
      initialServices={services}
      initialReservations={reservations}
    />
  );
}
