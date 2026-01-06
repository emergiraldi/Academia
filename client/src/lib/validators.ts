/**
 * Validação de CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Formata CPF para o padrão 000.000.000-00
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;

  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
}

/**
 * Validação de CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se o CNPJ é válido
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Formata CNPJ para o padrão 00.000.000/0000-00
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado
 */
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length <= 2) return cleanCNPJ;
  if (cleanCNPJ.length <= 5) return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2)}`;
  if (cleanCNPJ.length <= 8) return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2, 5)}.${cleanCNPJ.slice(5)}`;
  if (cleanCNPJ.length <= 12) return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2, 5)}.${cleanCNPJ.slice(5, 8)}/${cleanCNPJ.slice(8)}`;

  return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2, 5)}.${cleanCNPJ.slice(5, 8)}/${cleanCNPJ.slice(8, 12)}-${cleanCNPJ.slice(12, 14)}`;
}

/**
 * Formata CEP para o padrão 00000-000
 * @param cep - CEP sem formatação
 * @returns CEP formatado
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length <= 5) return cleanCEP;
  return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
}

/**
 * Formata telefone para o padrão (00) 00000-0000 ou (00) 0000-0000
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length <= 2) return `(${cleanPhone}`;
  if (cleanPhone.length <= 6) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
  if (cleanPhone.length <= 10) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;

  return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
}

/**
 * Interface para o retorno da API ViaCEP
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca dados de endereço pela API ViaCEP
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}
