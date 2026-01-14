/**
 * Mercado Pago PIX Service
 * Serviço para gerar cobranças PIX usando a API do Mercado Pago
 */

import fetch from 'node-fetch';

export interface MercadoPagoCredentials {
  accessToken: string;
  publicKey?: string;
}

export interface MercadoPagoPixCharge {
  valor: number; // em centavos
  pagador: {
    documento: string;
    nome: string;
  };
  infoAdicionais: string;
  expiracao: number; // em segundos
}

export interface MercadoPagoPixResponse {
  txid: string;
  pixCopiaECola: string;
  qrcode: string; // base64
  valor: number;
  calendario: {
    expiracao: number;
  };
}

export class MercadoPagoService {
  private credentials: MercadoPagoCredentials;
  private baseUrl: string = 'https://api.mercadopago.com';

  constructor(credentials: MercadoPagoCredentials) {
    this.credentials = credentials;
  }

  /**
   * Cria uma cobrança PIX imediata
   */
  async createImmediateCharge(charge: MercadoPagoPixCharge): Promise<MercadoPagoPixResponse> {
    try {
      const valorReais = charge.valor / 100;

      const payload = {
        transaction_amount: valorReais,
        description: charge.infoAdicionais,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@email.com', // Email opcional
          first_name: charge.pagador.nome.split(' ')[0],
          last_name: charge.pagador.nome.split(' ').slice(1).join(' ') || charge.pagador.nome,
          identification: {
            type: charge.pagador.documento.length === 11 ? 'CPF' : 'CNPJ',
            number: charge.pagador.documento.replace(/\D/g, ''),
          },
        },
        date_of_expiration: new Date(Date.now() + charge.expiracao * 1000).toISOString(),
      };

      console.log('🔵 [Mercado Pago] Criando cobrança PIX...');
      console.log('  - Valor: R$', valorReais.toFixed(2));
      console.log('  - Pagador:', charge.pagador.nome);
      console.log('  - Documento ORIGINAL:', charge.pagador.documento);
      console.log('  - Documento LIMPO:', charge.pagador.documento.replace(/\D/g, ''));
      console.log('  - Tipo detectado:', charge.pagador.documento.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ');
      console.log('  - Tamanho:', charge.pagador.documento.replace(/\D/g, '').length);

      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'X-Idempotency-Key': `${Date.now()}-${Math.random()}`, // Evita duplicação
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Mercado Pago] Erro na resposta:', response.status, errorText);
        throw new Error(`Mercado Pago API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();

      console.log('✅ [Mercado Pago] Cobrança criada com sucesso!');
      console.log('  - ID:', data.id);
      console.log('  - Status:', data.status);

      // Extrair dados do PIX
      const pixData = data.point_of_interaction?.transaction_data;

      if (!pixData || !pixData.qr_code || !pixData.qr_code_base64) {
        console.error('❌ [Mercado Pago] Dados PIX não encontrados na resposta:', JSON.stringify(data, null, 2));
        throw new Error('Dados PIX não encontrados na resposta do Mercado Pago');
      }

      return {
        txid: data.id.toString(),
        pixCopiaECola: pixData.qr_code,
        qrcode: pixData.qr_code_base64,
        valor: charge.valor,
        calendario: {
          expiracao: charge.expiracao,
        },
      };
    } catch (error: any) {
      console.error('❌ [Mercado Pago] Erro ao criar cobrança:', error.message);
      throw new Error(`Failed to create Mercado Pago PIX charge: ${error.message}`);
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      console.log('🔵 [Mercado Pago] Consultando status do pagamento:', paymentId);

      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${response.status}`);
      }

      const data: any = await response.json();

      console.log('✅ [Mercado Pago] Status:', data.status);

      // Mapear status do Mercado Pago para status do sistema
      // approved = pago, pending = pendente, rejected/cancelled = expirado
      return data.status;
    } catch (error: any) {
      console.error('❌ [Mercado Pago] Erro ao consultar status:', error.message);
      throw error;
    }
  }
}

/**
 * Create Mercado Pago service instance from bank account configuration
 */
export async function getMercadoPagoServiceFromBankAccount(gymId: number): Promise<MercadoPagoService> {
  const db = await import("./db");

  console.log("🔵 [Mercado Pago] Buscando conta bancária Mercado Pago para gymId:", gymId);
  const bankAccount = await db.getActivePixBankAccount(gymId);

  if (!bankAccount) {
    throw new Error("Nenhuma conta bancária com PIX ativo configurada para esta academia");
  }

  if (bankAccount.pix_provedor !== 'mercadopago') {
    throw new Error("Conta bancária ativa não é do Mercado Pago");
  }

  console.log("✅ [Mercado Pago] Conta bancária encontrada:");
  console.log("  - Banco:", bankAccount.banco);
  console.log("  - Provedor:", bankAccount.pix_provedor);
  console.log("  - Access Token:", bankAccount.mp_access_token ? "***" + bankAccount.mp_access_token.slice(-10) : "VAZIO");

  if (!bankAccount.mp_access_token) {
    throw new Error("Access Token do Mercado Pago não configurado");
  }

  const credentials: MercadoPagoCredentials = {
    accessToken: bankAccount.mp_access_token,
    publicKey: bankAccount.mp_public_key || undefined,
  };

  return new MercadoPagoService(credentials);
}
