import { getServices } from "./actions";
import { ServiciosClient } from "./ServiciosClient";

export const dynamic = "force-dynamic";

export default async function AdminServiciosPage() {
  const services = await getServices();
  return <ServiciosClient initialServices={services} />;
}
