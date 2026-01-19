import axios from "axios";
import { sendCommandToAgent, isAgentConnected } from "./agentWebSocket";

interface ControlIdDevice {
  ip: string;
  port: number;
  agentId?: string; // ID do agent (se usar modo agent)
  useAgent?: boolean; // Usar agent local ao invés de HTTP direto
}

interface LoginResponse {
  session: string;
}

interface EnrollFaceResponse {
  success: boolean;
  user_id?: number;
  device_id?: number;
  user_image?: string;
  error?: string;
}

/**
 * Control ID Service
 * Handles communication with Control ID facial recognition devices
 *
 * Supports two modes:
 * - Direct: HTTP requests directly to device (localhost only)
 * - Agent: Commands sent via WebSocket to local agent (works when hosted)
 */
export class ControlIdService {
  private device: ControlIdDevice;
  private session: string | null = null;
  private useAgent: boolean;
  private agentId: string | null;

  constructor(device: ControlIdDevice) {
    this.device = device;
    this.useAgent = device.useAgent || false;
    this.agentId = device.agentId || null;

    if (this.useAgent && !this.agentId) {
      console.warn('[ControlID] useAgent=true mas agentId não foi fornecido');
    }
  }

  /**
   * Send command to agent via WebSocket
   */
  private async sendToAgent(action: string, data?: any, timeout: number = 30000): Promise<any> {
    if (!this.agentId) {
      throw new Error('Agent ID not configured');
    }

    if (!isAgentConnected(this.agentId)) {
      throw new Error(`Agent ${this.agentId} is not connected`);
    }

    console.log(`[ControlID] Enviando comando para agent ${this.agentId}: ${action}`);

    return await sendCommandToAgent(this.agentId, action, data, timeout);
  }

  private getBaseUrl(): string {
    return `http://${this.device.ip}:${this.device.port}`;
  }

  /**
   * Login to Control ID device
   */
  async login(username = "admin", password = "admin"): Promise<string> {
    if (this.useAgent) {
      const session = await this.sendToAgent('login');
      this.session = session;
      return session;
    }

    try {
      const response = await axios.post<LoginResponse>(
        `${this.getBaseUrl()}/login.fcgi`,
        {
          login: username,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      this.session = response.data.session;
      return this.session;
    } catch (error) {
      console.error("[ControlID] Login failed:", error);
      throw new Error("Failed to login to Control ID device");
    }
  }

  /**
   * Ensure we have a valid session
   */
  private async ensureSession(): Promise<string> {
    if (!this.session) {
      await this.login();
    }
    return this.session!;
  }

  /**
   * Enroll face remotely
   * @param userId - User ID in Control ID system
   * @param save - Whether to save the face in the device
   * @param sync - Whether to wait for response (synchronous)
   */
  async enrollFace(
    userId: number,
    save = true,
    sync = true,
    auto = true,
    countdown = 5
  ): Promise<EnrollFaceResponse> {
    if (this.useAgent) {
      return await this.sendToAgent('enrollFace', {
        userId,
        save,
        sync,
        auto,
        countdown
      }, 30000);
    }

    try {
      const session = await this.ensureSession();

      const response = await axios.post<EnrollFaceResponse>(
        `${this.getBaseUrl()}/remote_enroll.fcgi?session=${session}`,
        {
          type: "face",
          user_id: userId,
          save: save,
          sync: sync,
          auto: auto,
          countdown: countdown,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds for face enrollment
        }
      );

      return response.data;
    } catch (error) {
      console.error("[ControlID] Face enrollment failed:", error);
      throw new Error("Failed to enroll face");
    }
  }

  /**
   * Upload face image directly
   * @param userId - User ID in Control ID system
   * @param imageBuffer - Image buffer (binary data)
   * @param timestamp - Unix timestamp for the photo
   */
  async uploadFaceImage(
    userId: number,
    imageBuffer: Buffer,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<{ success: boolean; scores?: any; errors?: any[] }> {
    if (this.useAgent) {
      const imageBase64 = imageBuffer.toString('base64');
      return await this.sendToAgent('uploadFaceImage', {
        userId,
        imageBase64,
        timestamp
      }, 30000);
    }

    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=1&session=${session}`,
        imageBuffer,
        {
          headers: {
            "Content-Type": "application/octet-stream",
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("[ControlID] Face image upload failed:", error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error("Failed to upload face image");
    }
  }

  /**
   * Authorize remote access
   * @param userId - User ID in Control ID system
   * @param doorId - Door/device ID
   * @param timeSeconds - Access time in seconds
   */
  async authorizeAccess(userId: number, doorId = 1, timeSeconds = 300): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/remote_access_authorization.fcgi?session=${session}`,
        {
          user_id: userId,
          door_id: doorId,
          time: timeSeconds,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] Access authorization failed:", error);
      throw new Error("Failed to authorize access");
    }
  }

  /**
   * Create user in Control ID system with automatic group assignment
   * @param userId - User ID
   * @param name - User name
   * @param registration - Registration number
   * @param groupId - Group ID (default: 1 = "Padrão")
   */
  async createUser(name: string, registration: string, groupId: number = 1): Promise<number> {
    if (this.useAgent) {
      return await this.sendToAgent('createUser', {
        name,
        registration,
        groupId
      });
    }

    try {
      const session = await this.ensureSession();

      console.log(`[ControlID] Creating user: ${name} (${registration})`);

      // 1. Create user WITHOUT specifying ID (let Control ID generate it automatically)
      const response = await axios.post(
        `${this.getBaseUrl()}/create_objects.fcgi?session=${session}`,
        {
          object: "users",
          values: [
            {
              // DO NOT specify id - let Control ID auto-generate
              name: name,
              registration: registration,
              begin_time: 0,              // Always allow access
              end_time: 2147483647,       // Max timestamp (year 2038)
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200 || !response.data?.ids || response.data.ids.length === 0) {
        throw new Error("Failed to create user - no ID returned");
      }

      // Get the ID created by Control ID
      const controlIdUserId = response.data.ids[0];
      console.log(`[ControlID] ✅ User created with ID: ${controlIdUserId}`);

      // 2. Link user to group automatically
      try {
        await axios.post(
          `${this.getBaseUrl()}/create_objects.fcgi?session=${session}`,
          {
            object: "user_groups",
            values: [
              {
                user_id: controlIdUserId,
                group_id: groupId,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        console.log(`[ControlID] ✅ User ${controlIdUserId} linked to group ${groupId}`);
      } catch (groupError: any) {
        // If group link already exists, that's OK
        if (!groupError.response?.data?.error?.includes('already exists')) {
          console.warn(`[ControlID] Failed to link user to group:`, groupError.response?.data);
        }
      }

      return controlIdUserId;
    } catch (error) {
      console.error("[ControlID] User creation failed:", error);
      throw new Error("Failed to create user in Control ID");
    }
  }

  /**
   * Delete user from Control ID system
   * @param userId - User ID
   */
  async deleteUser(userId: number): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/destroy_objects.fcgi?session=${session}`,
        {
          object: "users",
          where: {
            users: {
              id: userId,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] User deletion failed:", error);
      throw new Error("Failed to delete user from Control ID");
    }
  }

  /**
   * Block user access (remove from all groups)
   * @param userId - User ID to block
   */
  async blockUserAccess(userId: number): Promise<boolean> {
    if (this.useAgent) {
      return await this.sendToAgent('blockUserAccess', { userId });
    }

    try {
      const session = await this.ensureSession();

      console.log(`[ControlID] 🚫 Bloqueando acesso do usuário ${userId} (removendo de grupos)...`);

      // First, load all user_groups to find which groups this user belongs to
      const userGroupsResp = await axios.post(
        `${this.getBaseUrl()}/load_objects.fcgi?session=${session}`,
        { object: "user_groups" },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const userGroups = (userGroupsResp.data.user_groups || []).filter(
        (ug: any) => ug.user_id === userId
      );

      if (userGroups.length === 0) {
        console.log(`[ControlID] ℹ️  Usuário ${userId} já não está em nenhum grupo`);
        return true;
      }

      // Remove user from each group individually
      for (const ug of userGroups) {
        await axios.post(
          `${this.getBaseUrl()}/destroy_objects.fcgi?session=${session}`,
          {
            object: "user_groups",
            where: {
              user_groups: {
                user_id: ug.user_id,
                group_id: ug.group_id,
              },
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
      }

      console.log(`[ControlID] ✅ Acesso bloqueado para usuário ${userId}`);
      return true;
    } catch (error: any) {
      console.error("[ControlID] ❌ Erro ao bloquear usuário:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Unblock user access (add back to default group)
   * @param userId - User ID to unblock
   * @param groupId - Group ID to add user to (default: 1 = "Padrão")
   */
  async unblockUserAccess(userId: number, groupId: number = 1): Promise<boolean> {
    if (this.useAgent) {
      return await this.sendToAgent('unblockUserAccess', { userId, groupId });
    }

    try {
      const session = await this.ensureSession();

      console.log(`[ControlID] ✅ Desbloqueando acesso do usuário ${userId} (adicionando ao grupo ${groupId})...`);

      // Add user back to group
      const response = await axios.post(
        `${this.getBaseUrl()}/create_objects.fcgi?session=${session}`,
        {
          object: "user_groups",
          values: [
            {
              user_id: userId,
              group_id: groupId,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        console.log(`[ControlID] ✅ Acesso desbloqueado para usuário ${userId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      // If already exists, that's OK
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`[ControlID] ℹ️  Usuário ${userId} já estava no grupo ${groupId}`);
        return true;
      }
      console.error("[ControlID] ❌ Erro ao desbloquear usuário:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Load access logs from device
   */
  async loadAccessLogs(): Promise<any[]> {
    if (this.useAgent) {
      return await this.sendToAgent('loadAccessLogs');
    }

    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/load_objects.fcgi?session=${session}`,
        {
          object: "access_logs",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.data.access_logs || [];
    } catch (error) {
      console.error("[ControlID] Failed to load access logs:", error);
      return [];
    }
  }

  /**
   * Check device status
   */
  async checkStatus(): Promise<boolean> {
    if (this.useAgent) {
      try {
        return await this.sendToAgent('checkStatus', {}, 5000);
      } catch (error) {
        return false;
      }
    }

    try {
      const response = await axios.get(`${this.getBaseUrl()}/`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's face image from device
   * @param userId - User ID in Control ID system
   */
  async getUserImage(userId: number): Promise<{ timestamp: number; image: string } | null> {
    try {
      const session = await this.ensureSession();

      const response = await axios.get(
        `${this.getBaseUrl()}/user_get_image.fcgi?user_id=${userId}&get_timestamp=1&session=${session}`,
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      console.error("[ControlID] Failed to get user image:", error);
      return null;
    }
  }

  /**
   * List all users with enrolled faces
   */
  async listUsersWithFaces(): Promise<Array<{ user_id: number; timestamp: number }>> {
    try {
      const session = await this.ensureSession();

      const response = await axios.get(
        `${this.getBaseUrl()}/user_list_images.fcgi?get_timestamp=1&session=${session}`,
        {
          timeout: 10000,
        }
      );

      return response.data.image_info || [];
    } catch (error) {
      console.error("[ControlID] Failed to list users with faces:", error);
      return [];
    }
  }

  /**
   * Remove user's face from device
   * @param userId - User ID in Control ID system
   */
  async removeUserFace(userId: number): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/user_remove_image.fcgi?session=${session}`,
        {
          user_id: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] Failed to remove user face:", error);
      throw new Error("Failed to remove user face");
    }
  }

  /**
   * Sync user data to device (create or update user without face)
   * @param userId - User ID
   * @param name - User name
   * @param registration - Registration number
   * @param active - Whether user is active (for access control)
   */
  async syncUser(
    userId: number,
    name: string,
    registration: string,
    active: boolean = true
  ): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/set_objects.fcgi?session=${session}`,
        {
          object: "users",
          values: [
            {
              id: userId,
              name: name,
              registration: registration,
              begin_time: active ? 0 : 2147483647, // Max timestamp = blocked
              end_time: active ? 2147483647 : 0,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] User sync failed:", error);
      throw new Error("Failed to sync user to Control ID");
    }
  }

  /**
   * Block user access (set end_time to past)
   * @param userId - User ID
   */
  async blockUser(userId: number): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/set_objects.fcgi?session=${session}`,
        {
          object: "users",
          values: [
            {
              id: userId,
              begin_time: 2147483647,
              end_time: 0,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] User block failed:", error);
      throw new Error("Failed to block user");
    }
  }

  /**
   * Unblock user access (set times to allow access)
   * @param userId - User ID
   */
  async unblockUser(userId: number): Promise<boolean> {
    try {
      const session = await this.ensureSession();

      const response = await axios.post(
        `${this.getBaseUrl()}/set_objects.fcgi?session=${session}`,
        {
          object: "users",
          values: [
            {
              id: userId,
              begin_time: 0,
              end_time: 2147483647,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[ControlID] User unblock failed:", error);
      throw new Error("Failed to unblock user");
    }
  }
}

/**
 * Get Control ID service instance for a gym
 * Loads device configuration from database
 */
export async function getControlIdServiceForGym(gymId: number): Promise<ControlIdService | null> {
  const db = await import('./db');

  // Buscar dispositivo ativo da academia
  const device = await db.getActiveDeviceByGym(gymId);

  if (!device) {
    console.log(`[ControlID] Nenhum dispositivo ativo encontrado para gymId: ${gymId}`);
    return null;
  }

  console.log(`[ControlID] Usando dispositivo: ${device.name} (${device.ipAddress}:${device.port})`);

  // Determinar se deve usar agent ou conexão direta
  // Se APP estiver rodando em produção (VPS), usar agent
  const isProduction = process.env.NODE_ENV === 'production';
  const useAgent = isProduction || process.env.USE_CONTROL_ID_AGENT === 'true';

  // Agent ID baseado no gymId
  const agentId = `academia-${gymId}`;

  return new ControlIdService({
    ip: device.ipAddress,
    port: device.port || 80,
    useAgent: useAgent,
    agentId: agentId
  });
}

/**
 * Create Control ID service instance
 */
export function createControlIdService(ip: string, port = 80): ControlIdService {
  return new ControlIdService({ ip, port });
}
