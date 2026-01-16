# 📸 Como Gerar Screenshots para o Manual do Usuário

Este guia explica como capturar screenshots de todas as telas do sistema automaticamente.

## 🎯 Objetivo

Capturar screenshots de alta qualidade de todas as funcionalidades do sistema para ilustrar o manual do usuário.

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 16 ou superior)
2. **Puppeteer** instalado
3. Sistema em **produção** ou **desenvolvimento** rodando
4. **Credenciais de teste** configuradas

## 🚀 Instalação

### 1. Instalar Puppeteer

```bash
npm install puppeteer --save-dev
```

### 2. Configurar Credenciais

Edite o arquivo `capture-screenshots.mjs` e altere as credenciais de teste:

```javascript
credentials: {
  student: {
    username: 'seu-aluno@teste.com',  // ⬅️ ALTERE AQUI
    password: 'sua-senha',             // ⬅️ ALTERE AQUI
  },
  admin: {
    username: 'seu-admin@teste.com',   // ⬅️ ALTERE AQUI
    password: 'sua-senha',              // ⬅️ ALTERE AQUI
  },
  professor: {
    username: 'seu-prof@teste.com',    // ⬅️ ALTERE AQUI
    password: 'sua-senha',              // ⬅️ ALTERE AQUI
  },
  superAdmin: {
    username: 'seu-super@teste.com',   // ⬅️ ALTERE AQUI
    password: 'sua-senha',              // ⬅️ ALTERE AQUI
  },
}
```

### 3. Escolher Ambiente

No arquivo `capture-screenshots.mjs`, escolha a URL:

```javascript
// Produção (recomendado)
baseUrl: 'https://www.sysfitpro.com.br',

// OU desenvolvimento local
// baseUrl: 'http://localhost:5000',
```

## ▶️ Executar

```bash
node capture-screenshots.mjs
```

## 📂 Resultado

Os screenshots serão salvos em:

```
docs/
  _screenshots/
    01-landing-page.png
    02-gym-signup.png
    03-pricing.png
    04-student-login.png
    ...
    62-super-admin-settings.png
```

## ⚙️ Configurações Avançadas

### Alterar Resolução

```javascript
viewport: {
  width: 1920,  // Largura
  height: 1080, // Altura
},
```

### Modo Headless

Para não mostrar o navegador durante a captura:

```javascript
headless: true,  // Alterne entre true/false
```

### Tempo de Espera

Ajuste o tempo de espera para cada página:

```javascript
{ name: 'exemplo', url: '/pagina', waitFor: 3000 }, // 3 segundos
```

## 🎨 Screenshots de Qualidade

### Dicas para Screenshots Perfeitos:

1. **Dados de Teste Realistas**
   - Use nomes reais, não "Teste 1", "Teste 2"
   - Adicione fotos de perfil
   - Preencha todos os campos

2. **Resolução**
   - Mantenha 1920x1080 (Full HD)
   - Para mobile, use 375x812 (iPhone X)

3. **Conteúdo**
   - Certifique-se que há dados visíveis (alunos, pagamentos, etc.)
   - Evite telas vazias
   - Mostre funcionalidades em uso

4. **Privacidade**
   - Não use dados reais de clientes
   - Use dados fictícios mas realistas
   - Desative informações sensíveis

## 🔧 Troubleshooting

### Erro: "Cannot find module 'puppeteer'"

```bash
npm install puppeteer --save-dev
```

### Erro: "Navigation timeout"

- Aumente o timeout no código:
```javascript
await page.goto(fullUrl, {
  waitUntil: 'networkidle2',
  timeout: 30000, // 30 segundos
});
```

### Screenshots em branco

- Aumente o `waitFor`:
```javascript
{ name: 'exemplo', url: '/pagina', waitFor: 5000 },
```

### Erro de login

- Verifique se as credenciais estão corretas
- Teste login manual no navegador
- Verifique se o sistema está rodando

## 📱 Screenshots Mobile

Para capturar versão mobile, crie um novo script:

```javascript
viewport: {
  width: 375,
  height: 812,
  isMobile: true,
  hasTouch: true,
}
```

## 🎯 Captura Seletiva

Para capturar apenas algumas telas:

1. Comente as seções que não quer capturar:

```javascript
// 2. Portal do Aluno
// console.log('\n👤 === PORTAL DO ALUNO ===\n');
// await login(page, 'student');
// for (const screenshot of SCREENSHOTS.student) {
//   ...
// }
```

2. Ou crie um array customizado:

```javascript
const CUSTOM_SCREENSHOTS = [
  { name: '20-admin-payments', url: '/admin/payments', waitFor: 2000 },
  { name: '30-admin-reports', url: '/admin/reports', waitFor: 2000 },
];
```

## ✨ Edição Pós-Captura

Após capturar, você pode:

1. **Adicionar anotações** (setas, textos)
   - Use ferramentas: Snagit, Skitch, ou Photoshop

2. **Recortar áreas específicas**
   - Foque em elementos importantes

3. **Adicionar desfoque**
   - Oculte informações sensíveis

4. **Otimizar tamanho**
   - Use TinyPNG, ImageOptim
   - Mantenha qualidade mas reduza tamanho

## 📊 Checklist de Qualidade

Antes de usar os screenshots no manual:

- [ ] Todos os screenshots estão nítidos
- [ ] Não há dados sensíveis visíveis
- [ ] Textos estão legíveis
- [ ] UI está completa (sem cortes)
- [ ] Dados de teste parecem reais
- [ ] Screenshots seguem mesma resolução
- [ ] Nomes de arquivo correspondem ao manual
- [ ] Todas as 62 telas foram capturadas

## 📝 Manutenção

Quando atualizar o sistema:

1. Revise quais telas mudaram
2. Re-capture apenas as alteradas
3. Atualize o manual se necessário
4. Mantenha numeração consistente

## 🆘 Suporte

Problemas com o script?

📧 Email: suporte@sysfitpro.com.br

---

**Última atualização:** Janeiro 2025
