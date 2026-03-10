"use server";

import * as booking from "@/lib/booking";

export type Modality = booking.Modality;
export type ReservationInput = booking.ReservationInput;
export type { TimeSlot } from "@/lib/availability/slots";

export async function getActiveServices() {
  return booking.getActiveServices();
}

export async function getAvailableSlots(
  date: string,
  modality: booking.Modality,
  serviceId: number
) {
  return booking.getAvailableSlots(date, modality, serviceId);
}

export async function createReservation(input: booking.ReservationInput) {
  return booking.createReservation(input);
}
