import axios from "axios";
import https from "https";

interface PixCredentials {
  clientId: string;
  clientSecret: string;
  pixKey: string;
  certificate?: string; // Certificado PEM (conteúdo completo)
  privateKey?: string; // Chave privada PEM (conteúdo completo)
  tokenUrl?: string; // URL customizada para token (ex: Sicoob)
  baseUrl?: string; // URL base customizada (ex: Sicoob)
}

interface CreateImmediateChargeParams {
  valor: number; // Value in cents
  pagador: {
    documento: string; // CPF (11 dígitos) ou CNPJ (14 dígitos)
    nome: string;
  };
  infoAdicionais?: string;
  expiracao?: number; // Expiration in seconds (default 3600)
}

interface PixChargeResponse {
  txid: string;
  status: string;
  pixCopiaECola: string;
  qrcode: string; // Base64 image
  valor: {
    original: string;
  };
  calendario: {
    criacao: string;
    expiracao: number;
  };
}

/**
 * PIX Service using Efí Pay API
 * Handles immediate PIX charges with QR Code generation
 */
export class PixService {
  private credentials: PixCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl: string;
  private tokenUrl: string;
  private httpsAgent?: https.Agent;

  constructor(credentials: PixCredentials, sandbox = false) {
    this.credentials = credentials;

    // Use custom URLs if provided, otherwise use default Efí Pay URLs
    this.baseUrl = credentials.baseUrl || (sandbox
      ? "https://api-h.efipay.com.br"
      : "https://api.efipay.com.br");

    this.tokenUrl = credentials.tokenUrl || `${this.baseUrl}/oauth/token`;

    // Create HTTPS agent with certificates if provided (mTLS)
    if (credentials.certificate && credentials.privateKey) {
      this.httpsAgent = new https.Agent({
        cert: credentials.certificate,
        key: credentials.privateKey,
        rejectUnauthorized: true,
      });
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Reuse token if still valid
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken!;
    }

    try {
      const auth = Buffer.from(
        `${this.credentials.clientId}:${this.credentials.clientSecret || ''}`
      ).toString("base64");

      // Sicoob requires form-urlencoded with client_id, client_secret, and scope
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.credentials.clientId);
      if (this.credentials.clientSecret) {
        params.append('client_secret', this.credentials.clientSecret);
      }
      // Add scope for PIX operations
      params.append('scope', 'cob.write cob.read pix.read pix.write');

      const requestConfig: any = {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      // Add HTTPS agent if using certificates (mTLS)
      if (this.httpsAgent) {
        requestConfig.httpsAgent = this.httpsAgent;
      }

      const response = await axios.post(
        this.tokenUrl,
        params.toString(),
        requestConfig
      );

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds, refresh 5 minutes before
      this.tokenExpiry = now + (3600 - 300) * 1000;

      return this.accessToken!;
    } catch (error: any) {
      console.error("Failed to get PIX access token:", error.response?.data || error.message);
      throw new Error("Failed to authenticate with PIX service");
    }
  }

  /**
   * Create immediate PIX charge with QR Code
   */
  async createImmediateCharge(params: CreateImmediateChargeParams): Promise<PixChargeResponse> {
    const token = await this.getAccessToken();
    const txid = this.generateTxId();

    try {
      // Step 1: Create the charge
      // Detectar se é CPF (11 dígitos) ou CNPJ (14 dígitos)
      const documentoLimpo = params.pagador.documento.replace(/\D/g, "");
      const isCpf = documentoLimpo.length === 11;
      const isCnpj = documentoLimpo.length === 14;

      if (!isCpf && !isCnpj) {
        throw new Error(`Documento inválido: deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ). Recebido: ${documentoLimpo.length} dígitos`);
      }

      console.log(`📄 [PIX] Tipo de documento: ${isCpf ? 'CPF' : 'CNPJ'} (${documentoLimpo.length} dígitos)`);

      const chargePayload: any = {
        calendario: {
          expiracao: params.expiracao || 3600, // 1 hour default
        },
        valor: {
          original: (params.valor / 100).toFixed(2), // Convert cents to reais
        },
        chave: this.credentials.pixKey,
        solicitacaoPagador: params.infoAdicionais || "Pagamento de mensalidade",
        devedor: {
          [isCpf ? 'cpf' : 'cnpj']: documentoLimpo,
          nome: params.pagador.nome,
        },
      };

      const requestConfig: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (this.httpsAgent) {
        requestConfig.httpsAgent = this.httpsAgent;
      }

      console.log("💰 [PIX] Criando cobrança...");
      console.log("  - TXID:", txid);
      console.log("  - Valor:", chargePayload.valor.original);
      console.log("  - URL:", `${this.baseUrl}/cob/${txid}`);

      const chargeResponse = await axios.put(
        `${this.baseUrl}/cob/${txid}`,
        chargePayload,
        requestConfig
      );

      console.log("✅ [PIX] Cobrança criada com sucesso!");
      console.log("  - Response status:", chargeResponse.status);
      console.log("  - Response data:", JSON.stringify(chargeResponse.data, null, 2));

      // Step 2: Get QR Code
      // Different APIs have different response structures:
      // - Sicoob: returns 'brcode' directly in the charge response
      // - Efí Pay: requires a second call to /loc/{id}/qrcode

      let pixCopiaECola: string;
      let qrcodeBase64: string | undefined;

      if (chargeResponse.data.brcode) {
        // Sicoob API: QR Code data is already in the response
        console.log("✅ [PIX] API Sicoob detectada - brcode já disponível");
        pixCopiaECola = chargeResponse.data.brcode;

        // For Sicoob, we can generate QR code image from brcode if needed
        // For now, we'll leave it undefined and the frontend can generate it
        qrcodeBase64 = undefined;
      } else if (chargeResponse.data.loc && chargeResponse.data.loc.id) {
        // Efí Pay API: Need to fetch QR code separately
        console.log("🔍 [PIX] API Efí Pay detectada - obtendo QR Code...");
        console.log("  - Loc ID:", chargeResponse.data.loc.id);
        console.log("  - URL:", `${this.baseUrl}/loc/${chargeResponse.data.loc.id}/qrcode`);

        const qrcodeConfig: any = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        if (this.httpsAgent) {
          qrcodeConfig.httpsAgent = this.httpsAgent;
        }

        const qrcodeResponse = await axios.get(
          `${this.baseUrl}/loc/${chargeResponse.data.loc.id}/qrcode`,
          qrcodeConfig
        );

        console.log("✅ [PIX] QR Code obtido com sucesso!");
        pixCopiaECola = qrcodeResponse.data.qrcode;
        qrcodeBase64 = qrcodeResponse.data.imagemQrcode;
      } else {
        // Unknown API structure
        console.error("❌ [PIX] Estrutura de resposta desconhecida:");
        console.error(JSON.stringify(chargeResponse.data, null, 2));
        throw new Error("A resposta da API não contém 'brcode' (Sicoob) nem 'loc.id' (Efí Pay)");
      }

      console.log("  - PIX Copia e Cola:", pixCopiaECola ? "OK" : "VAZIO");

      return {
        txid: chargeResponse.data.txid,
        status: chargeResponse.data.status,
        pixCopiaECola,
        qrcode: qrcodeBase64 || pixCopiaECola, // Use brcode if no image available
        valor: chargeResponse.data.valor,
        calendario: chargeResponse.data.calendario,
      };
    } catch (error: any) {
      console.error("❌ Failed to create PIX charge - Full error details:");
      console.error("Error message:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", JSON.stringify(error.response.headers, null, 2));
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("Request sent but no response received:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
      } else {
        console.error("Error setting up request:", error.message);
      }
      console.error("Stack trace:", error.stack);
      throw new Error("Failed to create PIX charge");
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(txid: string): Promise<{ status: string; paidAt?: Date }> {
    const token = await this.getAccessToken();

    try {
      const requestConfig: any = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (this.httpsAgent) {
        requestConfig.httpsAgent = this.httpsAgent;
      }

      const response = await axios.get(
        `${this.baseUrl}/cob/${txid}`,
        requestConfig
      );

      const isPaid = response.data.status === "CONCLUIDA";

      return {
        status: response.data.status,
        paidAt: isPaid && response.data.pix?.[0]?.horario
          ? new Date(response.data.pix[0].horario)
          : undefined,
      };
    } catch (error: any) {
      console.error("Failed to check payment status:", error.response?.data || error.message);
      throw new Error("Failed to check payment status");
    }
  }

  /**
   * Generate unique transaction ID (txid)
   * Format: 26-35 alphanumeric characters (uppercase letters and numbers only)
   */
  private generateTxId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 32; // Between 26-35
    let txid = '';
    for (let i = 0; i < length; i++) {
      txid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return txid;
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    return signature === expectedSignature;
  }
}

// Export singleton instance (will be configured with env vars)
let pixServiceInstance: PixService | null = null;

export function getPixService(): PixService {
  if (!pixServiceInstance) {
    const credentials = {
      clientId: process.env.EFI_CLIENT_ID || "",
      clientSecret: process.env.EFI_CLIENT_SECRET || "",
      pixKey: process.env.EFI_PIX_KEY || "",
    };

    if (!credentials.clientId || !credentials.clientSecret || !credentials.pixKey) {
      throw new Error("PIX credentials not configured. Please set EFI_CLIENT_ID, EFI_CLIENT_SECRET, and EFI_PIX_KEY environment variables.");
    }

    const sandbox = process.env.EFI_SANDBOX === "true";
    pixServiceInstance = new PixService(credentials, sandbox);
  }

  return pixServiceInstance;
}

/**
 * Create PIX service instance from bank account configuration
 */
export async function getPixServiceFromBankAccount(gymId: number): Promise<PixService> {
  const db = await import("./db");

  console.log("🔍 [PIX] Buscando conta bancária PIX para gymId:", gymId);
  const bankAccount = await db.getActivePixBankAccount(gymId);

  if (!bankAccount) {
    throw new Error("Nenhuma conta bancária com PIX ativo configurada para esta academia");
  }

  console.log("✅ [PIX] Conta bancária encontrada:");
  console.log("  - Banco:", bankAccount.banco);
  console.log("  - PIX Ativo:", bankAccount.pix_ativo);
  console.log("  - Client ID:", bankAccount.pix_client_id ? "***" + bankAccount.pix_client_id.slice(-4) : "VAZIO");
  console.log("  - Client Secret:", bankAccount.pix_client_secret ? "***" + bankAccount.pix_client_secret.slice(-4) : "VAZIO");
  console.log("  - PIX Chave:", bankAccount.pix_chave || "VAZIO");
  console.log("  - URL Base:", bankAccount.pix_url_base || "VAZIO");
  console.log("  - URL Token:", bankAccount.pix_url_token || "VAZIO");
  console.log("  - Tipo Ambiente:", bankAccount.pix_tipo_ambiente || "VAZIO");
  console.log("  - Certificado:", bankAccount.pix_certificado ? `${bankAccount.pix_certificado.length} bytes` : "VAZIO");
  console.log("  - Chave Privada:", bankAccount.pix_chave_privada ? `${bankAccount.pix_chave_privada.length} bytes` : "VAZIO");

  const credentials: PixCredentials = {
    clientId: bankAccount.pix_client_id || "",
    clientSecret: bankAccount.pix_client_secret || "",
    pixKey: bankAccount.pix_chave || "",
    certificate: bankAccount.pix_certificado || undefined,
    privateKey: bankAccount.pix_chave_privada || undefined,
    baseUrl: bankAccount.pix_url_base || undefined,
    tokenUrl: bankAccount.pix_url_token || undefined,
  };

  if (!credentials.clientId || !credentials.pixKey) {
    throw new Error("Credenciais PIX incompletas na conta bancária. Verifique a configuração (Client ID e Chave PIX são obrigatórios).");
  }

  // Determine if sandbox based on pix_tipo_ambiente field
  const sandbox = bankAccount.pix_tipo_ambiente?.toLowerCase() === "homologacao" ||
                  bankAccount.pix_tipo_ambiente?.toLowerCase() === "sandbox" ||
                  bankAccount.pix_tipo_ambiente?.toLowerCase() === "h";

  console.log("🌐 [PIX] Ambiente determinado:", sandbox ? "SANDBOX" : "PRODUÇÃO");
  console.log("🔧 [PIX] Criando PixService com URLs:");
  console.log("  - Base URL:", credentials.baseUrl || "(padrão Efí Pay)");
  console.log("  - Token URL:", credentials.tokenUrl || "(padrão Efí Pay)");

  return new PixService(credentials, sandbox);
}

/**
 * Create PIX service instance from Super Admin configuration
 * Used for gym subscription payments (not student payments)
 */
export async function getPixServiceFromSuperAdmin(): Promise<PixService> {
  const db = await import("./db");

  console.log("🔍 [PIX] Buscando configuração PIX do Super Admin...");
  const settings = await db.getSuperAdminSettings();

  if (!settings) {
    throw new Error("Configurações do Super Admin não encontradas");
  }

  if (!settings.pixClientId || !settings.pixKey) {
    throw new Error("Credenciais PIX do Super Admin não configuradas. Configure em Configurações > Pagamentos PIX");
  }

  console.log("✅ [PIX] Configuração do Super Admin encontrada:");
  console.log("  - Provedor:", settings.pixProvider || "sicoob");
  console.log("  - Client ID:", settings.pixClientId ? "***" + settings.pixClientId.slice(-4) : "VAZIO");
  console.log("  - Client Secret:", settings.pixClientSecret ? "***" + settings.pixClientSecret.slice(-4) : "VAZIO");
  console.log("  - PIX Chave:", settings.pixKey || "VAZIO");
  console.log("  - URL Base:", settings.pixApiUrl || "VAZIO");
  console.log("  - URL Token:", settings.pixTokenUrl || "VAZIO");
  console.log("  - Certificado:", settings.pixCertificate ? `${settings.pixCertificate.length} bytes` : "VAZIO");
  console.log("  - Chave Privada:", settings.pixPrivateKey ? `${settings.pixPrivateKey.length} bytes` : "VAZIO");

  const credentials: PixCredentials = {
    clientId: settings.pixClientId,
    clientSecret: settings.pixClientSecret || "",
    pixKey: settings.pixKey,
    certificate: settings.pixCertificate || undefined,
    privateKey: settings.pixPrivateKey || undefined,
    baseUrl: settings.pixApiUrl || undefined,
    tokenUrl: settings.pixTokenUrl || undefined,
  };

  console.log("🔧 [PIX] Criando PixService do Super Admin com URLs:");
  console.log("  - Base URL:", credentials.baseUrl || "(padrão Efí Pay)");
  console.log("  - Token URL:", credentials.tokenUrl || "(padrão Efí Pay)");

  // Super Admin always uses production (not sandbox)
  return new PixService(credentials, false);
}
