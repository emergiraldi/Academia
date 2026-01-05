#!/bin/bash

echo "========================================"
echo "  Control ID Agent - Instalador Linux"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para mensagens de erro
error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Função para mensagens de sucesso
success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

# Função para mensagens de aviso
warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    warn "Não execute este script como root!"
    echo "Execute como usuário normal (sem sudo)"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    echo ""
    echo "Instalando Node.js..."

    # Detectar distribuição
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu/Raspberry Pi OS
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        error "Distribuição não suportada"
        echo "Por favor, instale Node.js manualmente:"
        echo "https://nodejs.org"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        error "Falha ao instalar Node.js"
        exit 1
    fi
fi

success "Node.js encontrado: $(node --version)"
echo ""

# Instalar dependências
echo "Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    error "Falha ao instalar dependências"
    exit 1
fi
success "Dependências instaladas"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    warn "Arquivo .env não encontrado"
    echo "Copiando .env.example para .env..."
    cp .env.example .env
    echo ""
    echo "IMPORTANTE: Edite o arquivo .env com as configurações corretas!"
    echo "- LEITORA_IP"
    echo "- VPS_URL"
    echo "- AUTH_TOKEN"
    echo ""
    read -p "Pressione Enter para editar .env agora..."
    ${EDITOR:-nano} .env
fi

# Instalar PM2 globalmente
echo "Instalando PM2..."
sudo npm install -g pm2
if [ $? -ne 0 ]; then
    warn "Falha ao instalar PM2. Tentando continuar..."
fi
echo ""

# Configurar PM2 para iniciar com sistema
echo "Configurando PM2 para iniciar com o sistema..."
pm2 startup
echo ""
warn "Execute o comando acima (se mostrado) para configurar auto-start"
read -p "Pressione Enter para continuar..."
echo ""

# Iniciar agent com PM2
echo "Iniciando agent..."
pm2 start agent.js --name controlid-agent
if [ $? -ne 0 ]; then
    error "Falha ao iniciar agent"
    exit 1
fi
echo ""

# Salvar configuração do PM2
echo "Salvando configuração do PM2..."
pm2 save
echo ""

echo "========================================"
echo "  Instalação Concluída!"
echo "========================================"
echo ""
success "O agent está rodando!"
echo ""
echo "Comandos úteis:"
echo "  pm2 status                  - Ver status"
echo "  pm2 logs controlid-agent    - Ver logs"
echo "  pm2 restart controlid-agent - Reiniciar"
echo "  pm2 stop controlid-agent    - Parar"
echo ""

# Mostrar logs
echo "Mostrando logs (Ctrl+C para sair):"
pm2 logs controlid-agent
