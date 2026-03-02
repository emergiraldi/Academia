import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { gyms } from "../drizzle/schema";

const SESSION_NAME = "default";

interface WahaConfig {
  url: string;
  apiKey: string;
}

/**
 * Get WAHA configuration for a gym
 */
export async function getWahaConfig(
  gymId: number
): Promise<WahaConfig | null> {
  const db = await getDb();
  const [gym] = await db
    .select({
      wahaUrl: gyms.wahaUrl,
      wahaApiKey: gyms.wahaApiKey,
    })
    .from(gyms)
    .where(eq(gyms.id, gymId));

  if (!gym?.wahaUrl || !gym?.wahaApiKey) {
    return null;
  }

  return {
    url: gym.wahaUrl,
    apiKey: gym.wahaApiKey,
  };
}

/**
 * Make a request to WAHA API
 */
export async function wahaRequest(
  config: WahaConfig,
  method: string,
  path: string,
  body?: any
): Promise<any> {
  const url = `${config.url}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": config.apiKey,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WAHA API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

/**
 * Start WhatsApp session
 */
export async function startSession(
  gymId: number
): Promise<{ success: boolean; qr?: string; error?: string }> {
  try {
    const config = await getWahaConfig(gymId);
    if (!config) {
      return { success: false, error: "WAHA not configured" };
    }

    const result = await wahaRequest(config, "POST", "/api/sessions/start", {
      name: SESSION_NAME,
    });

    return { success: true, qr: result?.qr };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get session status
 */
export async function getSessionStatus(
  gymId: number
): Promise<{ status: string; error?: string }> {
  try {
    const config = await getWahaConfig(gymId);
    if (!config) {
      return { status: "not_configured", error: "WAHA not configured" };
    }

    const result = await wahaRequest(
      config,
      "GET",
      `/api/sessions/${SESSION_NAME}`
    );

    return { status: result?.status || "unknown" };
  } catch (error: any) {
    return { status: "error", error: error.message };
  }
}

/**
 * Send WhatsApp text message
 */
export async function sendMessage(
  gymId: number,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getWahaConfig(gymId);
    if (!config) {
      return { success: false, error: "WAHA not configured" };
    }

    // Format phone to WhatsApp format (55XXXXXXXXXXX@c.us)
    const cleanPhone = phone.replace(/\D/g, "");
    const chatId = `${cleanPhone}@c.us`;

    await wahaRequest(config, "POST", "/api/sendText", {
      session: SESSION_NAME,
      chatId,
      text: message,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Logout/disconnect WhatsApp session (unlinks the device)
 */
export async function logoutSession(
  gymId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getWahaConfig(gymId);
    if (!config) {
      return { success: false, error: "WAHA não configurado" };
    }

    // Logout removes the linked device
    await wahaRequest(config, "POST", "/api/sessions/logout", {
      name: SESSION_NAME,
    });

    // Stop the session after logout
    await wahaRequest(config, "POST", "/api/sessions/stop", {
      name: SESSION_NAME,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
