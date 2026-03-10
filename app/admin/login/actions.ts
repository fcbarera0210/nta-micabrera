"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  email: string,
  password: string
): Promise<{ error: string } | undefined> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Credenciales inválidas. Verifica tu email y contraseña." };
    }
    // Re-lanzar todo lo demás (incluyendo NEXT_REDIRECT que Next.js necesita manejar)
    throw error;
  }
}
