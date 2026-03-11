import { unstable_noStore } from "next/cache";
import { listPatients } from "./actions";
import { PacientesClient } from "./PacientesClient";

export const dynamic = "force-dynamic";

export default async function AdminPacientesPage() {
  unstable_noStore();
  const initialPatients = await listPatients();

  return <PacientesClient initialPatients={initialPatients} />;
}
