import { db } from "@/lib/db";
import { siteSettings } from "./schema";

export async function getSiteSettingsPublic() {
  const [settings] = await db.select().from(siteSettings).limit(1);
  return settings ?? null;
}

