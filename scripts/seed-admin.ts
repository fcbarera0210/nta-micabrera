import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../lib/db/schema";

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida en el .env");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { users } });

  const email = "mica@nutrimica.cl";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`✓ El usuario ${email} ya existe. No se creó duplicado.`);
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.insert(users).values({
    name: "Mica Cabrera",
    email,
    passwordHash,
    role: "admin",
  });

  console.log(`✓ Usuario admin creado exitosamente: ${email}`);
}

seedAdmin().catch((err) => {
  console.error("Error al crear usuario admin:", err);
  process.exit(1);
});
