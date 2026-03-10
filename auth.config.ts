import type { NextAuthConfig } from "next-auth";

/**
 * Configuración mínima de Auth.js que puede ejecutarse en Edge Runtime (middleware).
 * No importa bcryptjs ni el cliente de DB para evitar errores en Edge.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminLogin = nextUrl.pathname === "/admin/login";
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      if (!isAdminRoute) return true;

      // Usuario logueado intenta ir a /admin/login → redirigir al dashboard
      if (isAdminLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      // Ruta protegida sin sesión → NextAuth redirige automáticamente a signIn
      if (!isAdminLogin && !isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
