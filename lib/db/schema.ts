import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  real,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ── Enums ────────────────────────────────────────────────────────────────────

export const modalityEnum = pgEnum("modality", ["presencial", "online"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

// ── Services ─────────────────────────────────────────────────────────────────

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

// ── Availability patterns (one per modality × day_of_week) ───────────────────

export const availabilityPatterns = pgTable(
  "availability_patterns",
  {
    id: serial("id").primaryKey(),
    modality: modalityEnum("modality").notNull(),
    /** 0 = Lunes … 6 = Domingo */
    dayOfWeek: integer("day_of_week").notNull(),
    enabled: boolean("enabled").notNull().default(false),
  },
  (t) => [unique("availability_patterns_modality_day_unique").on(t.modality, t.dayOfWeek)]
);

export type AvailabilityPattern = typeof availabilityPatterns.$inferSelect;
export type NewAvailabilityPattern = typeof availabilityPatterns.$inferInsert;

// ── Availability blocks (time ranges within a pattern) ───────────────────────

export const availabilityBlocks = pgTable("availability_blocks", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id")
    .notNull()
    .references(() => availabilityPatterns.id, { onDelete: "cascade" }),
  /** "HH:mm" 24h format */
  startTime: text("start_time").notNull(),
  /** "HH:mm" 24h format */
  endTime: text("end_time").notNull(),
});

export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
export type NewAvailabilityBlock = typeof availabilityBlocks.$inferInsert;

// ── Patients ─────────────────────────────────────────────────────────────────

export const patients = pgTable(
  "patients",
  {
    id: serial("id").primaryKey(),
    /** RUT normalizado (sin puntos ni guión) para unicidad */
    rut: text("rut").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    /** 9 dígitos, formato Chile */
    phone: text("phone").notNull(),
    /** Datos nutrición / ficha clínica */
    weightKg: real("weight_kg"),
    heightCm: integer("height_cm"),
    /** IMC manual (opcional); si es null se calcula desde peso y altura */
    imc: real("imc"),
    /** "YYYY-MM-DD" */
    birthDate: text("birth_date"),
    gender: text("gender"),
    medicalHistory: text("medical_history"),
    nutritionGoals: text("nutrition_goals"),
    activityLevel: text("activity_level"),
    clinicalNotes: text("clinical_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

// ── Patient data history (registro de cambios datos nutrición) ─────────────────

export const patientDataHistory = pgTable(
  "patient_data_history",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
    weightKg: real("weight_kg"),
    heightCm: integer("height_cm"),
    imc: real("imc"),
    birthDate: text("birth_date"),
    gender: text("gender"),
    medicalHistory: text("medical_history"),
    nutritionGoals: text("nutrition_goals"),
    activityLevel: text("activity_level"),
    clinicalNotes: text("clinical_notes"),
  },
  (t) => [index("patient_data_history_patient_id_idx").on(t.patientId)]
);

export type PatientDataHistoryRecord = typeof patientDataHistory.$inferSelect;
export type NewPatientDataHistoryRecord = typeof patientDataHistory.$inferInsert;

// ── Reservations ──────────────────────────────────────────────────────────────

export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id),
    patientId: integer("patient_id").references(() => patients.id),
    modality: modalityEnum("modality").notNull(),
    /** "YYYY-MM-DD" */
    date: text("date").notNull(),
    /** "HH:mm" */
    startTime: text("start_time").notNull(),
    /** "HH:mm" */
    endTime: text("end_time").notNull(),
    /** Snapshot RUT en momento de la reserva */
    patientRut: text("patient_rut").notNull().default(""),
    patientName: text("patient_name").notNull(),
    patientEmail: text("patient_email").notNull(),
    patientPhone: text("patient_phone"),
    /** Notas del paciente al reservar */
    notes: text("notes"),
    /** Notas de la profesional (solo admin) */
    professionalNotes: text("professional_notes"),
    status: reservationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("reservations_date_start_idx").on(t.date, t.startTime),
    index("reservations_patient_id_idx").on(t.patientId),
  ]
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

// ── Relations ─────────────────────────────────────────────────────────────────

export const availabilityPatternsRelations = relations(
  availabilityPatterns,
  ({ many }) => ({
    blocks: many(availabilityBlocks),
  })
);

export const availabilityBlocksRelations = relations(
  availabilityBlocks,
  ({ one }) => ({
    pattern: one(availabilityPatterns, {
      fields: [availabilityBlocks.patternId],
      references: [availabilityPatterns.id],
    }),
  })
);

export const patientsRelations = relations(patients, ({ many }) => ({
  reservations: many(reservations),
  dataHistory: many(patientDataHistory),
}));

export const patientDataHistoryRelations = relations(
  patientDataHistory,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientDataHistory.patientId],
      references: [patients.id],
    }),
  })
);

export const reservationsRelations = relations(reservations, ({ one }) => ({
  service: one(services, {
    fields: [reservations.serviceId],
    references: [services.id],
  }),
  patient: one(patients, {
    fields: [reservations.patientId],
    references: [patients.id],
  }),
}));
