import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getPatientById, getPatientDataHistory } from "../actions";
import { getReservationsByPatientId } from "../../reservas/actions";
import { PatientDetailClient } from "./PatientDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: Props) {
  unstable_noStore();
  const { id } = await params;
  const patientId = parseInt(id, 10);
  if (Number.isNaN(patientId)) notFound();

  const [patient, reservations, dataHistory] = await Promise.all([
    getPatientById(patientId),
    getReservationsByPatientId(patientId),
    getPatientDataHistory(patientId),
  ]);

  if (!patient) notFound();

  return (
    <PatientDetailClient
      patient={patient}
      initialReservations={reservations}
      initialDataHistory={dataHistory}
    />
  );
}
