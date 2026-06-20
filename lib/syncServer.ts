import prisma from "@/lib/prisma";

const EXTERNAL_SERVER_URL = process.env.EXTERNAL_SERVER_URL;
const EXTERNAL_SERVER_API_KEY = process.env.EXTERNAL_SERVER_API_KEY;

export type SyncAction =
  | "secretary_config_updated"
  | "subscription_activated"
  | "subscription_deactivated";

interface SyncPayload {
  action: SyncAction;
  userId: string;
  data: Record<string, unknown>;
}

export async function syncToExternalServer(payload: SyncPayload): Promise<boolean> {
  if (!EXTERNAL_SERVER_URL || !EXTERNAL_SERVER_API_KEY) {
    console.error("[Sync] EXTERNAL_SERVER_URL ou EXTERNAL_SERVER_API_KEY non configuré");
    await logSync(payload.userId, payload.action, false, "Variables d'environnement manquantes");
    return false;
  }

  try {
    const response = await fetch(EXTERNAL_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + EXTERNAL_SERVER_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const success = response.ok;
    const details = success
      ? { status: response.status }
      : { status: response.status, statusText: response.statusText };

    await logSync(payload.userId, payload.action, success, details);

    if (!success) {
      console.error(`[Sync] Échec de la synchronisation: ${response.status} ${response.statusText}`);
    }

    return success;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`[Sync] Erreur lors de la synchronisation: ${message}`);
    await logSync(payload.userId, payload.action, false, { error: message });
    return false;
  }
}

async function logSync(
  userId: string,
  action: string,
  success: boolean,
  details: unknown
) {
  await prisma.log.create({
    data: {
      userId,
      action: `sync.${action}`,
      details: { success, ...((details as object) || {}) },
    },
  });
}

export async function syncSecretaryConfig(userId: string) {
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId },
    include: { aiSecretaryConfig: true },
  });

  if (!businessProfile) return false;

  return syncToExternalServer({
    action: "secretary_config_updated",
    userId,
    data: {
      businessProfileId: businessProfile.id,
      metier: businessProfile.metier,
      horaires: businessProfile.horaires,
      tarifs: businessProfile.tarifs,
      consignes: businessProfile.aiSecretaryConfig?.consignes || "",
      messageAccueil: businessProfile.aiSecretaryConfig?.messageAccueil || "",
      telephoneATransferer: businessProfile.telephoneATransferer,
      isActive: businessProfile.aiSecretaryConfig?.isActive ?? false,
    },
  });
}

export async function syncSubscriptionActivated(userId: string) {
  return syncToExternalServer({
    action: "subscription_activated",
    userId,
    data: { activatedAt: new Date().toISOString() },
  });
}

export async function syncSubscriptionDeactivated(userId: string, reason: string) {
  return syncToExternalServer({
    action: "subscription_deactivated",
    userId,
    data: { reason, deactivatedAt: new Date().toISOString() },
  });
}
