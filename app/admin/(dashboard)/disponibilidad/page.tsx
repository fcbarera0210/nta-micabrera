import { getAvailabilityByModality } from "./actions";
import { DisponibilidadClient } from "./DisponibilidadClient";

export const dynamic = "force-dynamic";

export default async function AdminDisponibilidadPage() {
  const [presencialData, onlineData] = await Promise.all([
    getAvailabilityByModality("presencial"),
    getAvailabilityByModality("online"),
  ]);

  return (
    <DisponibilidadClient
      presencialData={presencialData}
      onlineData={onlineData}
    />
  );
}
