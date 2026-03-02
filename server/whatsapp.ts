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
 * Get QR Code for WhatsApp session
 */
export async function getQrCode(
  gymId: number
): Promise<{ success: boolean; qr?: string; error?: string }> {
  try {
    const config = await getWahaConfig(gymId);
    if (!config) {
      return { success: false, error: "WAHA not configured" };
    }

    // First try to start the session (in case it's not started)
    try {
      await wahaRequest(config, "POST", "/api/sessions/start", {
        name: SESSION_NAME,
      });
    } catch (e) {
      // Session might already be started, that's ok
    }

    // Get QR code - fetch directly to handle binary PNG response
    const url = `${config.url}/api/${SESSION_NAME}/auth/qr`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Api-Key": config.apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WAHA QR error ${response.status}: ${text}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // If response is JSON (some WAHA versions)
    if (contentType.includes("application/json")) {
      const json = await response.json();
      if (json?.value) {
        return { success: true, qr: json.value };
      }
      return { success: false, error: "QR Code nao disponivel" };
    }

    // If response is image (PNG/binary) - convert to base64
    if (contentType.includes("image/")) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = contentType.split(";")[0].trim();
      return { success: true, qr: `data:${mimeType};base64,${base64}` };
    }

    // Fallback: try as text
    const text = await response.text();
    if (text && text.length > 10) {
      return { success: true, qr: text };
    }

    return { success: false, error: "QR Code nao disponivel. Sessao ja pode estar conectada." };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    let cleanPhone = phone.replace(/\D/g, "");
    // Adiciona 55 automaticamente se não começa com 55
    if (!cleanPhone.startsWith("55")) {
      cleanPhone = `55${cleanPhone}`;
    }
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
