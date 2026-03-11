"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { siteSettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateSiteSettingsInput {
  whatsappPhone?: string;
  contactEmail?: string;
  instagramHandle?: string;
}

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user || (session.user as { id?: string }).id === undefined) {
    return { success: false, error: "No hay sesión activa." };
  }

  const userId = Number((session.user as { id?: string }).id);

  if (!Number.isFinite(userId)) {
    return { success: false, error: "Sesión inválida." };
  }

  const { currentPassword, newPassword, confirmPassword } = input;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: "La nueva contraseña y su confirmación no coinciden.",
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Usuario no encontrado." };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    return { success: false, error: "La contraseña actual no es correcta." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  revalidatePath("/admin/configuracion");

  return { success: true };
}

export async function getSiteSettings() {
  const [settings] = await db.select().from(siteSettings).limit(1);
  return settings ?? null;
}

export async function updateSiteSettingsAction(
  input: UpdateSiteSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user || (session.user as { id?: string }).id === undefined) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { whatsappPhone, contactEmail, instagramHandle } = input;

  if (
    !whatsappPhone?.trim() &&
    !contactEmail?.trim() &&
    !instagramHandle?.trim()
  ) {
    return {
      success: false,
      error: "Debes completar al menos un campo para guardar.",
    };
  }

  const normalizedPhone = whatsappPhone?.replace(/\D/g, "") || null;
  const normalizedEmail = contactEmail?.trim() || null;
  const normalizedInstagram = instagramHandle
    ? instagramHandle.trim().replace(/^@/, "")
    : null;

  try {
    const [current] = await db.select().from(siteSettings).limit(1);

    if (!current) {
      await db.insert(siteSettings).values({
        id: 1,
        whatsappPhone: normalizedPhone,
        contactEmail: normalizedEmail,
        instagramHandle: normalizedInstagram,
      });
    } else {
      await db
        .update(siteSettings)
        .set({
          whatsappPhone: normalizedPhone,
          contactEmail: normalizedEmail,
          instagramHandle: normalizedInstagram,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, current.id));
    }

    revalidatePath("/");
    revalidatePath("/admin/configuracion");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudieron guardar los datos de contacto.",
    };
  }
}


