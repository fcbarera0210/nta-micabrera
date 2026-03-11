import { and, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { patients, reservations } from "@/lib/db/schema";

type MonthlyCount = {
  month: string; // "YYYY-MM"
  count: number;
};

type ReservationStatusSummary = {
  pending: number;
  confirmed: number;
  cancelled: number;
};

export type DashboardMetrics = {
  totalPatients: number;
  totalReservations: number;
  newPatientsThisMonth: number;
  currentMonthReservations: number;
  currentMonthReservationsByStatus: ReservationStatusSummary;
  reservationsByMonth: MonthlyCount[];
  newPatientsByMonth: MonthlyCount[];
};

function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function getStartOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function getStartOfNextMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function getPastMonthsRange(monthsBack: number): { from: Date; months: string[] } {
  const now = new Date();
  const currentMonthStart = getStartOfMonthUtc(now);

  const months: string[] = [];
  const cursor = new Date(currentMonthStart.getTime());

  // Incluye el mes actual y los (monthsBack - 1) anteriores
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    months.push(getMonthKey(d));
  }

  const from = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - (monthsBack - 1), 1));

  return { from, months };
}

export async function getTotalPatients(): Promise<number> {
  const rows = await db.select({ id: patients.id }).from(patients);
  return rows.length;
}

export async function getTotalReservations(): Promise<number> {
  const rows = await db.select({ id: reservations.id }).from(reservations);
  return rows.length;
}

export async function getNewPatientsByMonth(monthsBack = 12): Promise<MonthlyCount[]> {
  const { from, months } = getPastMonthsRange(monthsBack);

  const rows = await db
    .select({
      createdAt: patients.createdAt,
    })
    .from(patients)
    .where(gte(patients.createdAt, from));

  const counts = new Map<string, number>();
  for (const key of months) {
    counts.set(key, 0);
  }

  for (const row of rows) {
    if (!row.createdAt) continue;
    const key = getMonthKey(row.createdAt);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return months.map((month) => ({
    month,
    count: counts.get(month) ?? 0,
  }));
}

export async function getReservationsByMonth(monthsBack = 12): Promise<MonthlyCount[]> {
  const { from, months } = getPastMonthsRange(monthsBack);

  const rows = await db
    .select({
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .where(gte(reservations.createdAt, from));

  const counts = new Map<string, number>();
  for (const key of months) {
    counts.set(key, 0);
  }

  for (const row of rows) {
    if (!row.createdAt) continue;
    const key = getMonthKey(row.createdAt);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return months.map((month) => ({
    month,
    count: counts.get(month) ?? 0,
  }));
}

export async function getCurrentMonthReservationsSummary(): Promise<{
  total: number;
  byStatus: ReservationStatusSummary;
}> {
  const now = new Date();
  const monthStart = getStartOfMonthUtc(now);
  const nextMonthStart = getStartOfNextMonthUtc(now);

  const rows = await db
    .select({
      status: reservations.status,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .where(and(gte(reservations.createdAt, monthStart), lt(reservations.createdAt, nextMonthStart)));

  const summary: ReservationStatusSummary = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  };

  for (const row of rows) {
    const status = row.status;
    if (status === "pending" || status === "confirmed" || status === "cancelled") {
      summary[status] += 1;
    }
  }

  return {
    total: rows.length,
    byStatus: summary,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [totalPatients, totalReservations, newPatientsByMonth, reservationsByMonth, currentMonthSummary] =
    await Promise.all([
      getTotalPatients(),
      getTotalReservations(),
      getNewPatientsByMonth(3),
      getReservationsByMonth(3),
      getCurrentMonthReservationsSummary(),
    ]);

  const newPatientsThisMonth = newPatientsByMonth.at(-1)?.count ?? 0;

  return {
    totalPatients,
    totalReservations,
    newPatientsThisMonth,
    currentMonthReservations: currentMonthSummary.total,
    currentMonthReservationsByStatus: currentMonthSummary.byStatus,
    reservationsByMonth,
    newPatientsByMonth,
  };
}

