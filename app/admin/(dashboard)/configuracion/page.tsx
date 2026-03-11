import {
  changePasswordAction,
  getSiteSettings,
  updateSiteSettingsAction,
} from "./actions";
import AdminConfiguracionClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">
          Perfil, notificaciones y negocio
        </p>
      </div>

      <AdminConfiguracionClient
        initialSettings={settings}
        changePasswordAction={changePasswordAction}
        updateSiteSettingsAction={updateSiteSettingsAction}
      />
    </div>
  );
}
