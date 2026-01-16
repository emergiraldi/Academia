/**
 * Script para captura automática de screenshots do sistema
 * Usa Puppeteer para navegar e capturar todas as telas
 *
 * Instalação:
 * npm install puppeteer --save-dev
 *
 * Uso:
 * node capture-screenshots.mjs
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const CONFIG = {
  baseUrl: 'https://www.sysfitpro.com.br', // URL do sistema em produção
  // baseUrl: 'http://localhost:5000', // Descomente para capturar local
  outputDir: path.join(__dirname, 'docs', '_screenshots'),
  viewport: {
    width: 1920,
    height: 1080,
  },
  // Credenciais de teste (ALTERE COM SUAS CREDENCIAIS REAIS)
  credentials: {
    student: {
      username: 'aluno@teste.com',
      password: '123456',
    },
    admin: {
      username: 'admin@teste.com',
      password: '123456',
    },
    professor: {
      username: 'professor@teste.com',
      password: '123456',
    },
    superAdmin: {
      username: 'superadmin@teste.com',
      password: '123456',
    },
  },
};

// Páginas a capturar
const SCREENSHOTS = {
  // Landing Page
  landing: [
    { name: '01-landing-page', url: '/', waitFor: 3000 },
    { name: '02-gym-signup', url: '/gym-signup', waitFor: 2000 },
    { name: '03-pricing', url: '/pricing', waitFor: 2000 },
  ],

  // Portal do Aluno
  student: [
    { name: '04-student-login', url: '/student/login', waitFor: 1000, skipAuth: true },
    { name: '05-student-forgot-password', url: '/student/forgot-password', waitFor: 1000, skipAuth: true },
    { name: '06-student-verify-code', url: '/student/verify-code', waitFor: 1000, skipAuth: true },
    { name: '07-student-reset-password', url: '/student/reset-password', waitFor: 1000, skipAuth: true },
    { name: '08-student-dashboard', url: '/student/dashboard', waitFor: 3000 },
    { name: '09-student-workouts', url: '/student/workouts', waitFor: 2000 },
    { name: '10-student-workout-detail', url: '/student/workout/1', waitFor: 2000, optional: true },
    { name: '11-student-payments', url: '/student/payments', waitFor: 2000 },
    { name: '12-student-pix-payment', url: '/student/payments', waitFor: 2000, action: 'clickPayment' },
    { name: '13-student-profile', url: '/student/profile', waitFor: 2000 },
    { name: '14-student-medical-exams', url: '/student/medical-exams', waitFor: 2000 },
    { name: '15-student-face-enrollment', url: '/student/face-enrollment', waitFor: 2000 },
  ],

  // Portal do Admin
  admin: [
    { name: '16-admin-login', url: '/admin/login', waitFor: 1000, skipAuth: true },
    { name: '17-admin-dashboard', url: '/admin/dashboard', waitFor: 3000 },
    { name: '18-admin-students', url: '/admin/students', waitFor: 2000 },
    { name: '19-admin-student-new', url: '/admin/students', waitFor: 1000, action: 'clickNewStudent' },
    { name: '20-admin-payments', url: '/admin/payments', waitFor: 2000 },
    { name: '21-admin-payments-calendar', url: '/admin/payments', waitFor: 1000, action: 'clickCalendar' },
    { name: '22-admin-payment-confirm', url: '/admin/payments', waitFor: 1000, action: 'clickConfirmPayment' },
    { name: '23-admin-generate-payments', url: '/admin/payments', waitFor: 1000, action: 'clickGeneratePayments' },
    { name: '24-admin-plans', url: '/admin/plans', waitFor: 2000 },
    { name: '25-admin-plan-new', url: '/admin/plans', waitFor: 1000, action: 'clickNewPlan' },
    { name: '26-admin-professors', url: '/admin/professors', waitFor: 2000 },
    { name: '27-admin-professor-new', url: '/admin/professors', waitFor: 1000, action: 'clickNewProfessor' },
    { name: '28-admin-staff', url: '/admin/staff', waitFor: 2000 },
    { name: '29-admin-assessments', url: '/admin/assessments', waitFor: 2000 },
    { name: '30-admin-reports', url: '/admin/reports', waitFor: 2000 },
    { name: '31-admin-report-students', url: '/admin/reports', waitFor: 1000, action: 'selectStudentsReport' },
    { name: '32-admin-report-payments', url: '/admin/reports', waitFor: 1000, action: 'selectPaymentsReport' },
    { name: '33-admin-report-financial', url: '/admin/reports', waitFor: 1000, action: 'selectFinancialReport' },
    { name: '34-admin-accounts-payable', url: '/admin/accounts-payable', waitFor: 2000 },
    { name: '35-admin-cash-flow', url: '/admin/cash-flow', waitFor: 2000 },
    { name: '36-admin-financial-dashboard', url: '/admin/financial-dashboard', waitFor: 3000 },
    { name: '37-admin-defaulters', url: '/admin/defaulters', waitFor: 2000 },
    { name: '38-admin-payment-methods', url: '/admin/payment-methods', waitFor: 2000 },
    { name: '39-admin-bank-accounts', url: '/admin/bank-accounts', waitFor: 2000 },
    { name: '40-admin-suppliers', url: '/admin/suppliers', waitFor: 2000 },
    { name: '41-admin-cost-centers', url: '/admin/cost-centers', waitFor: 2000 },
    { name: '42-admin-categories', url: '/admin/categories', waitFor: 2000 },
    { name: '43-admin-schedule', url: '/admin/schedule', waitFor: 2000 },
    { name: '44-admin-wellhub', url: '/admin/wellhub', waitFor: 2000 },
    { name: '45-admin-wellhub-checkin', url: '/admin/wellhub/checkin', waitFor: 2000 },
    { name: '46-admin-wellhub-members', url: '/admin/wellhub/members', waitFor: 2000 },
    { name: '47-admin-controlid', url: '/admin/controlid', waitFor: 2000 },
    { name: '48-admin-crm', url: '/admin/crm', waitFor: 2000 },
    { name: '49-admin-settings', url: '/admin/settings', waitFor: 2000 },
  ],

  // Portal do Professor
  professor: [
    { name: '50-professor-login', url: '/professor/login', waitFor: 1000, skipAuth: true },
    { name: '51-professor-dashboard', url: '/professor/dashboard', waitFor: 2000 },
    { name: '52-professor-workout-builder', url: '/workout-builder', waitFor: 2000 },
    { name: '53-professor-add-exercise', url: '/workout-builder', waitFor: 1000, action: 'clickAddExercise' },
    { name: '54-professor-exercise-library', url: '/workout-builder', waitFor: 1000, action: 'openExerciseLibrary' },
  ],

  // Portal do Super Admin
  superAdmin: [
    { name: '55-super-admin-login', url: '/super-admin/login', waitFor: 1000, skipAuth: true },
    { name: '56-super-admin-dashboard', url: '/super-admin/dashboard', waitFor: 3000 },
    { name: '57-super-admin-gyms', url: '/super-admin/gyms', waitFor: 2000 },
    { name: '58-super-admin-users', url: '/super-admin/users', waitFor: 2000 },
    { name: '59-super-admin-plans', url: '/super-admin/plans', waitFor: 2000 },
    { name: '60-super-admin-screenshots', url: '/super-admin/screenshots', waitFor: 2000 },
    { name: '61-super-admin-reports', url: '/super-admin/reports', waitFor: 2000 },
    { name: '62-super-admin-settings', url: '/super-admin/settings', waitFor: 2000 },
  ],
};

// Criar diretório de saída
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  console.log(`✅ Criado diretório: ${CONFIG.outputDir}`);
}

// Função para fazer login
async function login(page, userType) {
  console.log(`🔐 Fazendo login como ${userType}...`);

  const loginUrls = {
    student: '/student/login',
    admin: '/admin/login',
    professor: '/professor/login',
    superAdmin: '/super-admin/login',
  };

  await page.goto(`${CONFIG.baseUrl}${loginUrls[userType]}`, {
    waitUntil: 'networkidle2',
  });

  // Aguardar formulário de login
  await page.waitForSelector('input[type="email"], input[type="text"]', {
    timeout: 5000,
  });

  // Preencher credenciais
  const credentials = CONFIG.credentials[userType];
  await page.type('input[type="email"], input[type="text"]', credentials.username);
  await page.type('input[type="password"]', credentials.password);

  // Clicar no botão de login
  await page.click('button[type="submit"]');

  // Aguardar navegação
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

  console.log(`✅ Login realizado como ${userType}`);
}

// Função para capturar screenshot
async function captureScreenshot(page, screenshot, userType) {
  try {
    const fullUrl = `${CONFIG.baseUrl}${screenshot.url}`;
    console.log(`📸 Capturando: ${screenshot.name} (${fullUrl})`);

    // Navegar para a página
    await page.goto(fullUrl, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    // Aguardar tempo adicional se especificado
    if (screenshot.waitFor) {
      await page.waitForTimeout(screenshot.waitFor);
    }

    // Executar ação se especificada
    if (screenshot.action) {
      await performAction(page, screenshot.action);
      await page.waitForTimeout(1000); // Aguardar animações
    }

    // Capturar screenshot
    const screenshotPath = path.join(CONFIG.outputDir, `${screenshot.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // Captura apenas a viewport
    });

    console.log(`✅ Salvo: ${screenshot.name}.png`);
    return true;
  } catch (error) {
    if (screenshot.optional) {
      console.log(`⚠️  Opcional pulado: ${screenshot.name} (${error.message})`);
      return false;
    } else {
      console.error(`❌ Erro ao capturar ${screenshot.name}:`, error.message);
      return false;
    }
  }
}

// Função para executar ações específicas
async function performAction(page, action) {
  console.log(`🎬 Executando ação: ${action}`);

  switch (action) {
    case 'clickPayment':
      // Clica no primeiro pagamento pendente
      await page.click('button:has-text("Pagar"), button:has-text("Ver QR Code")');
      await page.waitForTimeout(1000);
      break;

    case 'clickCalendar':
      // Clica no filtro de período
      await page.click('button:has-text("Período"), button:has-text("Selecione o período")');
      await page.waitForTimeout(500);
      break;

    case 'clickConfirmPayment':
      // Clica em "Dar Baixa" no primeiro pagamento
      await page.click('button:has-text("Dar Baixa")');
      await page.waitForTimeout(500);
      break;

    case 'clickGeneratePayments':
      // Clica em "Gerar Mensalidades"
      await page.click('button:has-text("Gerar Mensalidades")');
      await page.waitForTimeout(1000);
      break;

    case 'clickNewStudent':
      // Clica em "+ Novo Aluno"
      await page.click('button:has-text("Novo Aluno"), button:has-text("+ Novo")');
      await page.waitForTimeout(1000);
      break;

    case 'clickNewPlan':
      await page.click('button:has-text("Novo Plano"), button:has-text("+ Novo")');
      await page.waitForTimeout(1000);
      break;

    case 'clickNewProfessor':
      await page.click('button:has-text("Novo Professor"), button:has-text("+ Novo")');
      await page.waitForTimeout(1000);
      break;

    case 'clickAddExercise':
      await page.click('button:has-text("Adicionar Exercício"), button:has-text("+ Exercício")');
      await page.waitForTimeout(1000);
      break;

    case 'openExerciseLibrary':
      await page.click('button:has-text("Biblioteca"), button:has-text("Exercícios")');
      await page.waitForTimeout(1000);
      break;

    case 'selectStudentsReport':
    case 'selectPaymentsReport':
    case 'selectFinancialReport':
      // Não precisa fazer nada, apenas aguardar
      await page.waitForTimeout(500);
      break;

    default:
      console.log(`⚠️  Ação desconhecida: ${action}`);
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando captura de screenshots...\n');
  console.log(`📂 Diretório de saída: ${CONFIG.outputDir}`);
  console.log(`🌐 URL base: ${CONFIG.baseUrl}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Mude para true para não mostrar o navegador
    defaultViewport: CONFIG.viewport,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();

  let totalCaptured = 0;
  let totalErrors = 0;

  try {
    // 1. Landing Pages (sem autenticação)
    console.log('\n📱 === LANDING PAGE ===\n');
    for (const screenshot of SCREENSHOTS.landing) {
      const success = await captureScreenshot(page, screenshot, null);
      success ? totalCaptured++ : totalErrors++;
      await page.waitForTimeout(500);
    }

    // 2. Portal do Aluno
    console.log('\n👤 === PORTAL DO ALUNO ===\n');
    await login(page, 'student');
    for (const screenshot of SCREENSHOTS.student) {
      if (screenshot.skipAuth) continue; // Pula telas de login
      const success = await captureScreenshot(page, screenshot, 'student');
      success ? totalCaptured++ : totalErrors++;
      await page.waitForTimeout(500);
    }

    // 3. Portal do Admin
    console.log('\n👨‍💼 === PORTAL DO ADMIN ===\n');
    await login(page, 'admin');
    for (const screenshot of SCREENSHOTS.admin) {
      if (screenshot.skipAuth) continue;
      const success = await captureScreenshot(page, screenshot, 'admin');
      success ? totalCaptured++ : totalErrors++;
      await page.waitForTimeout(500);
    }

    // 4. Portal do Professor
    console.log('\n👨‍🏫 === PORTAL DO PROFESSOR ===\n');
    await login(page, 'professor');
    for (const screenshot of SCREENSHOTS.professor) {
      if (screenshot.skipAuth) continue;
      const success = await captureScreenshot(page, screenshot, 'professor');
      success ? totalCaptured++ : totalErrors++;
      await page.waitForTimeout(500);
    }

    // 5. Portal do Super Admin
    console.log('\n🔧 === PORTAL DO SUPER ADMIN ===\n');
    await login(page, 'superAdmin');
    for (const screenshot of SCREENSHOTS.superAdmin) {
      if (screenshot.skipAuth) continue;
      const success = await captureScreenshot(page, screenshot, 'superAdmin');
      success ? totalCaptured++ : totalErrors++;
      await page.waitForTimeout(500);
    }

    console.log('\n✅ === RESUMO ===');
    console.log(`📸 Total capturado: ${totalCaptured}`);
    console.log(`❌ Total de erros: ${totalErrors}`);
    console.log(`📂 Screenshots salvos em: ${CONFIG.outputDir}\n`);
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
  } finally {
    await browser.close();
  }
}

// Executar
main().catch(console.error);
