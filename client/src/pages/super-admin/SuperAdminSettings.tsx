import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Palette,
  Image,
  Save,
  Upload,
  CreditCard,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SiteSettings {
  // Branding
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;

  // Banners
  banner1Title: string;
  banner1Description: string;
  banner1Image: string;
  banner2Title: string;
  banner2Description: string;
  banner2Image: string;

  // Pricing Plans
  basicPrice: number;
  professionalPrice: number;
  enterprisePrice: number;

  // Contact
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;

  // Social Media
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

const tabs = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "content", label: "Conteúdo", icon: Settings },
  { id: "media", label: "Mídias", icon: Image },
  { id: "payments", label: "Pagamentos PIX", icon: CreditCard },
  { id: "billing", label: "Cobrança Mensal", icon: Calendar },
];

interface PaymentSettings {
  pixProvider: string;
  pixKey: string;
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random";
  merchantName: string;
  merchantCity: string;
  pixClientId: string;
  pixClientSecret: string;
  pixCertificate: string;
  pixPrivateKey: string;
  pixApiUrl: string;
  pixTokenUrl: string;
  bankCode: string;
  bankName: string;
  bankAccount: string;
  bankAgency: string;
  trialEnabled: boolean;
  trialDays: number;
  trialWarningDays: number;
  trialGracePeriodDays: number;
  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
  // Billing configuration
  billingEnabled: boolean;
  billingDueDay: number;
  billingAdvanceDays: number;
  billingGracePeriodDays: number;
  billingLateFeePercentage: number;
  billingLateFeeFixedCents: number;
  billingInterestRatePerDay: number;
  billingLateFeeType: "percentage" | "fixed" | "both";
}

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState("branding");
  const [settings, setSettings] = useState<SiteSettings>({
    // Branding
    siteName: "SysFit Pro",
    logoUrl: "",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",

    // Hero
    heroTitle: "Sistema Completo para Academias Modernas",
    heroSubtitle: "Gerencie sua academia com eficiência total",
    heroDescription: "Controle biométrico Control ID, integração Wellhub, PIX automático e app mobile para alunos.",

    // Banners
    banner1Title: "Control ID - Reconhecimento Facial",
    banner1Description: "Integração com Control ID para controle de acesso biométrico",
    banner1Image: "",
    banner2Title: "Integração Wellhub (Gympass)",
    banner2Description: "Sincronização automática com Wellhub",
    banner2Image: "",

    // Pricing
    basicPrice: 149,
    professionalPrice: 299,
    enterprisePrice: 599,

    // Contact
    contactEmail: "contato@sysfit.com.br",
    contactPhone: "(11) 99999-9999",
    whatsappNumber: "5511999999999",

    // Social
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pixProvider: "sicoob",
    pixKey: "",
    pixKeyType: "cnpj",
    merchantName: "",
    merchantCity: "",
    pixClientId: "",
    pixClientSecret: "",
    pixCertificate: "",
    pixPrivateKey: "",
    pixApiUrl: "",
    pixTokenUrl: "",
    bankCode: "",
    bankName: "",
    bankAccount: "",
    bankAgency: "",
    trialEnabled: true,
    trialDays: 14,
    trialWarningDays: 3,
    trialGracePeriodDays: 7,
    // SMTP defaults
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "SysFit Pro",
    smtpUseTls: true,
    smtpUseSsl: false,
    // Billing defaults
    billingEnabled: true,
    billingDueDay: 10,
    billingAdvanceDays: 10,
    billingGracePeriodDays: 5,
    billingLateFeePercentage: 2.0,
    billingLateFeeFixedCents: 0,
    billingInterestRatePerDay: 0.03,
    billingLateFeeType: "percentage",
  });

  const { data: settingsData, isLoading } = trpc.settings.get.useQuery();
  const { data: paymentData } = trpc.superAdminSettings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  const updatePaymentMutation = trpc.superAdminSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações de pagamento salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações de pagamento: " + error.message);
    },
  });

  // Load settings from backend
  useEffect(() => {
    if (settingsData) {
      setSettings({
        siteName: settingsData.siteName,
        logoUrl: settingsData.logoUrl || "",
        primaryColor: settingsData.primaryColor,
        secondaryColor: settingsData.secondaryColor,
        heroTitle: settingsData.heroTitle,
        heroSubtitle: settingsData.heroSubtitle,
        heroDescription: settingsData.heroDescription || "",
        banner1Title: settingsData.banner1Title || "",
        banner1Description: settingsData.banner1Description || "",
        banner1Image: settingsData.banner1Image || "",
        banner2Title: settingsData.banner2Title || "",
        banner2Description: settingsData.banner2Description || "",
        banner2Image: settingsData.banner2Image || "",
        basicPrice: settingsData.basicPrice,
        professionalPrice: settingsData.professionalPrice,
        enterprisePrice: settingsData.enterprisePrice,
        contactEmail: settingsData.contactEmail || "",
        contactPhone: settingsData.contactPhone || "",
        whatsappNumber: settingsData.whatsappNumber || "",
        facebookUrl: settingsData.facebookUrl || "",
        instagramUrl: settingsData.instagramUrl || "",
        linkedinUrl: settingsData.linkedinUrl || "",
      });
    }
  }, [settingsData]);

  // Load payment settings from backend
  useEffect(() => {
    if (paymentData) {
      setPaymentSettings({
        pixProvider: paymentData.pixProvider || "sicoob",
        pixKey: paymentData.pixKey || "",
        pixKeyType: paymentData.pixKeyType || "cnpj",
        merchantName: paymentData.merchantName || "",
        merchantCity: paymentData.merchantCity || "",
        pixClientId: paymentData.pixClientId || "",
        pixClientSecret: paymentData.pixClientSecret || "",
        pixCertificate: paymentData.pixCertificate || "",
        pixPrivateKey: paymentData.pixPrivateKey || "",
        pixApiUrl: paymentData.pixApiUrl || "",
        pixTokenUrl: paymentData.pixTokenUrl || "",
        bankCode: paymentData.bankCode || "",
        bankName: paymentData.bankName || "",
        bankAccount: paymentData.bankAccount || "",
        bankAgency: paymentData.bankAgency || "",
        trialEnabled: paymentData.trialEnabled ?? true,
        trialDays: paymentData.trialDays || 14,
        trialWarningDays: paymentData.trialWarningDays || 3,
        trialGracePeriodDays: paymentData.trialGracePeriodDays || 7,
        // SMTP settings
        smtpHost: paymentData.smtpHost || "",
        smtpPort: paymentData.smtpPort || 587,
        smtpUser: paymentData.smtpUser || "",
        smtpPassword: paymentData.smtpPassword || "",
        smtpFromEmail: paymentData.smtpFromEmail || "",
        smtpFromName: paymentData.smtpFromName || "SysFit Pro",
        smtpUseTls: paymentData.smtpUseTls ?? true,
        smtpUseSsl: paymentData.smtpUseSsl ?? false,
        // Billing settings - converter tipos do banco para frontend
        billingEnabled: paymentData.billingEnabled === 'Y' || paymentData.billingEnabled === true,
        billingDueDay: paymentData.billingDueDay || 15,
        billingAdvanceDays: paymentData.billingAdvanceDays || 10,
        billingGracePeriodDays: paymentData.billingGracePeriodDays || 5,
        billingLateFeePercentage: typeof paymentData.billingLateFeePercentage === 'string'
          ? parseFloat(paymentData.billingLateFeePercentage)
          : (paymentData.billingLateFeePercentage || 2.0),
        billingLateFeeFixedCents: paymentData.billingLateFeeFixedCents || 0,
        billingInterestRatePerDay: typeof paymentData.billingInterestRatePerDay === 'string'
          ? parseFloat(paymentData.billingInterestRatePerDay)
          : (paymentData.billingInterestRatePerDay || 0.03),
        billingLateFeeType: paymentData.billingLateFeeType || "percentage",
      });
    }
  }, [paymentData]);

  const handleSave = async () => {
    updateMutation.mutate({
      siteName: settings.siteName,
      logoUrl: settings.logoUrl || null,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      heroDescription: settings.heroDescription || null,
      banner1Title: settings.banner1Title || null,
      banner1Description: settings.banner1Description || null,
      banner1Image: settings.banner1Image || null,
      banner2Title: settings.banner2Title || null,
      banner2Description: settings.banner2Description || null,
      banner2Image: settings.banner2Image || null,
      basicPrice: settings.basicPrice,
      professionalPrice: settings.professionalPrice,
      enterprisePrice: settings.enterprisePrice,
      contactEmail: settings.contactEmail || null,
      contactPhone: settings.contactPhone || null,
      whatsappNumber: settings.whatsappNumber || null,
      facebookUrl: settings.facebookUrl || null,
      instagramUrl: settings.instagramUrl || null,
      linkedinUrl: settings.linkedinUrl || null,
    });
  };

  const handleSavePayments = async () => {
    // Converter strings vazias em undefined e tipos para corresponder ao banco
    const cleanedSettings = Object.fromEntries(
      Object.entries(paymentSettings).map(([key, value]) => {
        // Converter strings vazias em undefined
        if (typeof value === 'string' && value === '') {
          return [key, undefined];
        }

        // Converter boolean para "Y"/"N" para billingEnabled
        if (key === 'billingEnabled' && typeof value === 'boolean') {
          return [key, value ? 'Y' : 'N'];
        }

        // Converter number para string para percentuais
        if ((key === 'billingLateFeePercentage' || key === 'billingInterestRatePerDay') && typeof value === 'number') {
          return [key, value.toString()];
        }

        return [key, value];
      })
    ) as PaymentSettings;

    updatePaymentMutation.mutate(cleanedSettings);
  };

  const handleFileUpload = (field: "banner1Image" | "banner2Image") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSettings({ ...settings, [field]: base64String });
      toast.success("Imagem carregada! Clique em 'Salvar Alterações' para confirmar.");
    };
    reader.onerror = () => {
      toast.error("Erro ao carregar imagem");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (field: "banner1Image" | "banner2Image") => {
    setSettings({ ...settings, [field]: null });
    toast.success("Imagem removida! Clique em 'Salvar Alterações' para confirmar.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "branding":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">URL do Logo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      placeholder="https://..."
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    />
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Logo aparecerá no header do site e na landing page
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato e Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email de Contato</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Telefone</Label>
                    <Input
                      id="contactPhone"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp (com DDI)</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="5511999999999"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input
                      id="facebookUrl"
                      placeholder="https://facebook.com/..."
                      value={settings.facebookUrl}
                      onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagramUrl">Instagram</Label>
                    <Input
                      id="instagramUrl"
                      placeholder="https://instagram.com/..."
                      value={settings.instagramUrl}
                      onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/..."
                      value={settings.linkedinUrl}
                      onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "content":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section (Topo da Página)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heroTitle">Título Principal</Label>
                  <Input
                    id="heroTitle"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="heroSubtitle">Subtítulo</Label>
                  <Input
                    id="heroSubtitle"
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="heroDescription">Descrição</Label>
                  <Textarea
                    id="heroDescription"
                    rows={3}
                    value={settings.heroDescription}
                    onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner 1 - Control ID</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="banner1Title">Título</Label>
                  <Input
                    id="banner1Title"
                    value={settings.banner1Title}
                    onChange={(e) => setSettings({ ...settings, banner1Title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="banner1Description">Descrição</Label>
                  <Textarea
                    id="banner1Description"
                    rows={2}
                    value={settings.banner1Description}
                    onChange={(e) => setSettings({ ...settings, banner1Description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner 2 - Wellhub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="banner2Title">Título</Label>
                  <Input
                    id="banner2Title"
                    value={settings.banner2Title}
                    onChange={(e) => setSettings({ ...settings, banner2Title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="banner2Description">Descrição</Label>
                  <Textarea
                    id="banner2Description"
                    rows={2}
                    value={settings.banner2Description}
                    onChange={(e) => setSettings({ ...settings, banner2Description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "media":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagens e Banners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Banner 1 - Control ID</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste uma imagem ou clique para fazer upload
                    </p>
                    <input
                      type="file"
                      id="banner1Input"
                      accept="image/*"
                      onChange={handleFileUpload("banner1Image")}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("banner1Input")?.click()}
                    >
                      Selecionar Arquivo
                    </Button>
                  </div>
                  {settings.banner1Image && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <img
                        src={settings.banner1Image}
                        alt="Banner 1"
                        className="max-w-xs rounded border mb-3"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveImage("banner1Image")}
                      >
                        Excluir Banner 1
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Banner 2 - Wellhub</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste uma imagem ou clique para fazer upload
                    </p>
                    <input
                      type="file"
                      id="banner2Input"
                      accept="image/*"
                      onChange={handleFileUpload("banner2Image")}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("banner2Input")?.click()}
                    >
                      Selecionar Arquivo
                    </Button>
                  </div>
                  {settings.banner2Image && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <img
                        src={settings.banner2Image}
                        alt="Banner 2"
                        className="max-w-xs rounded border mb-3"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveImage("banner2Image")}
                      >
                        Excluir Banner 2
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações PIX para Receber Pagamentos</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure sua chave PIX e credenciais da Efí Pay para receber pagamentos das academias
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pixKey">Chave PIX *</Label>
                    <Input
                      id="pixKey"
                      value={paymentSettings.pixKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixKey: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chave PIX que receberá os pagamentos das assinaturas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pixKeyType">Tipo de Chave PIX *</Label>
                    <select
                      id="pixKeyType"
                      value={paymentSettings.pixKeyType}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixKeyType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Aleatória</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="merchantName">Nome do Beneficiário *</Label>
                    <Input
                      id="merchantName"
                      value={paymentSettings.merchantName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantName: e.target.value })}
                      placeholder="SysFit Tecnologia LTDA"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nome que aparecerá no QR Code PIX
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="merchantCity">Cidade do Beneficiário *</Label>
                    <Input
                      id="merchantCity"
                      value={paymentSettings.merchantCity}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantCity: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provedor PIX e Credenciais API</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure o provedor PIX e as credenciais para gerar cobranças automáticas
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pixProvider">Provedor PIX</Label>
                  <select
                    id="pixProvider"
                    value={paymentSettings.pixProvider}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pixProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="sicoob">Sicoob</option>
                    <option value="efi">Efí Pay (Gerencianet)</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="pixClientId">Client ID OAuth *</Label>
                  <Input
                    id="pixClientId"
                    type="password"
                    value={paymentSettings.pixClientId}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pixClientId: e.target.value })}
                    placeholder="Client_Id_xxxxxxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="pixClientSecret">Client Secret OAuth *</Label>
                  <Input
                    id="pixClientSecret"
                    type="password"
                    value={paymentSettings.pixClientSecret}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pixClientSecret: e.target.value })}
                    placeholder="Client_Secret_xxxxxxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="pixCertificate">Certificado (PEM) *</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="file"
                      accept=".pem,.crt,.cer,.txt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const text = await file.text();
                          setPaymentSettings({ ...paymentSettings, pixCertificate: text });
                          toast.success(`Certificado carregado: ${file.name}`);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentSettings({ ...paymentSettings, pixCertificate: "" })}
                    >
                      Limpar
                    </Button>
                  </div>
                  <Textarea
                    id="pixCertificate"
                    rows={4}
                    value={paymentSettings.pixCertificate}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pixCertificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----
MIIxxxxxxxxxxxxxxx...
-----END CERTIFICATE-----"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📤 Faça upload do arquivo .pem ou cole o conteúdo manualmente
                  </p>
                </div>

                <div>
                  <Label htmlFor="pixPrivateKey">Chave Privada (PEM) *</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="file"
                      accept=".pem,.key,.txt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const text = await file.text();
                          setPaymentSettings({ ...paymentSettings, pixPrivateKey: text });
                          toast.success(`Chave privada carregada: ${file.name}`);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentSettings({ ...paymentSettings, pixPrivateKey: "" })}
                    >
                      Limpar
                    </Button>
                  </div>
                  <Textarea
                    id="pixPrivateKey"
                    rows={4}
                    value={paymentSettings.pixPrivateKey}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pixPrivateKey: e.target.value })}
                    placeholder="-----BEGIN PRIVATE KEY-----
MIIxxxxxxxxxxxxxxx...
-----END PRIVATE KEY-----"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📤 Faça upload do arquivo .pem/.key ou cole o conteúdo manualmente
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pixApiUrl">URL da API PIX</Label>
                    <Input
                      id="pixApiUrl"
                      value={paymentSettings.pixApiUrl}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixApiUrl: e.target.value })}
                      placeholder="https://api.sicoob.com.br/pix/api/v2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pixTokenUrl">URL do Token OAuth</Label>
                    <Input
                      id="pixTokenUrl"
                      value={paymentSettings.pixTokenUrl}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixTokenUrl: e.target.value })}
                      placeholder="https://auth.sicoob.com.br/auth/realms/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários (Opcional)</CardTitle>
                <p className="text-sm text-gray-600">
                  Informações adicionais para controle interno
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bankCode">Código do Banco</Label>
                    <Input
                      id="bankCode"
                      value={paymentSettings.bankCode}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankCode: e.target.value })}
                      placeholder="756"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ex: 756 para Sicoob
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bankName">Nome do Banco</Label>
                    <Input
                      id="bankName"
                      value={paymentSettings.bankName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                      placeholder="Sicoob"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAgency">Agência</Label>
                    <Input
                      id="bankAgency"
                      value={paymentSettings.bankAgency}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAgency: e.target.value })}
                      placeholder="3197"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Conta</Label>
                    <Input
                      id="bankAccount"
                      value={paymentSettings.bankAccount}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccount: e.target.value })}
                      placeholder="82411-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Período de Teste</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure o período de teste grátis para novas academias
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="trialEnabled"
                    checked={paymentSettings.trialEnabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, trialEnabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="trialEnabled" className="text-base font-semibold cursor-pointer">
                    Habilitar período de teste grátis
                  </Label>
                </div>

                {paymentSettings.trialEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="trialDays">Duração do teste (dias)</Label>
                      <Input
                        id="trialDays"
                        type="number"
                        min="1"
                        max="90"
                        value={paymentSettings.trialDays}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, trialDays: parseInt(e.target.value) || 14 })}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Academias terão acesso completo por {paymentSettings.trialDays} dias antes da primeira cobrança
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="trialWarningDays">Aviso antes do fim do trial (dias)</Label>
                      <Input
                        id="trialWarningDays"
                        type="number"
                        min="1"
                        max="30"
                        value={paymentSettings.trialWarningDays}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, trialWarningDays: parseInt(e.target.value) || 3 })}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email de aviso será enviado {paymentSettings.trialWarningDays} dias ANTES do trial acabar
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="trialGracePeriodDays">Carência após trial (dias)</Label>
                      <Input
                        id="trialGracePeriodDays"
                        type="number"
                        min="0"
                        max="30"
                        value={paymentSettings.trialGracePeriodDays}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, trialGracePeriodDays: parseInt(e.target.value) || 7 })}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Academia será bloqueada {paymentSettings.trialGracePeriodDays} dias DEPOIS do trial acabar se não houver pagamento
                      </p>
                    </div>
                  </div>
                )}

                {!paymentSettings.trialEnabled && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> Sem período de teste, novas academias precisarão pagar imediatamente para ativar o sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Email (SMTP)</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure o servidor SMTP para enviar emails de credenciais para novas academias
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={paymentSettings.smtpHost}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpHost: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Exemplos: smtp.gmail.com, smtp.office365.com, smtp.sendgrid.net
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="smtpPort">Porta SMTP *</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={paymentSettings.smtpPort}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpPort: parseInt(e.target.value) || 587 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      587 (TLS) ou 465 (SSL)
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUser">Usuário/Email *</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      placeholder="seu-email@gmail.com"
                      value={paymentSettings.smtpUser}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpUser: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPassword">Senha/App Password *</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={paymentSettings.smtpPassword}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpPassword: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para Gmail, use "Senhas de app" nas configurações de segurança
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpFromEmail">Email Remetente</Label>
                    <Input
                      id="smtpFromEmail"
                      type="email"
                      placeholder="noreply@sysfitpro.com.br"
                      value={paymentSettings.smtpFromEmail}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpFromEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpFromName">Nome do Remetente</Label>
                    <Input
                      id="smtpFromName"
                      placeholder="SysFit Pro"
                      value={paymentSettings.smtpFromName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpFromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smtpUseTls"
                      checked={paymentSettings.smtpUseTls}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpUseTls: e.target.checked, smtpUseSsl: e.target.checked ? false : paymentSettings.smtpUseSsl })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="smtpUseTls" className="cursor-pointer">
                      Usar TLS (porta 587)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smtpUseSsl"
                      checked={paymentSettings.smtpUseSsl}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, smtpUseSsl: e.target.checked, smtpUseTls: e.target.checked ? false : paymentSettings.smtpUseTls })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="smtpUseSsl" className="cursor-pointer">
                      Usar SSL (porta 465)
                    </Label>
                  </div>
                </div>

                {paymentSettings.smtpHost && paymentSettings.smtpUser && paymentSettings.smtpPassword && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✅ Configurações SMTP preenchidas! Os emails serão enviados através de <strong>{paymentSettings.smtpHost}</strong>
                    </p>
                  </div>
                )}

                {(!paymentSettings.smtpHost || !paymentSettings.smtpUser || !paymentSettings.smtpPassword) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> Sem configurações SMTP, os emails de credenciais NÃO serão enviados para as novas academias.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePayments}
                disabled={updatePaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePaymentMutation.isPending ? "Salvando..." : "Salvar Configurações de Pagamento"}
              </Button>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cobrança Mensal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Configure aqui o sistema de mensalidades recorrentes para as academias clientes.
                  </p>
                </div>

                {/* Billing Enabled Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="billingEnabled" className="text-base font-semibold">Sistema de Cobrança Ativo</Label>
                    <p className="text-sm text-gray-600 mt-1">Ativa ou desativa o sistema de mensalidades recorrentes</p>
                  </div>
                  <input
                    type="checkbox"
                    id="billingEnabled"
                    checked={paymentSettings.billingEnabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, billingEnabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Billing Configuration */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="billingDueDay">Dia do Vencimento</Label>
                    <Input
                      id="billingDueDay"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentSettings.billingDueDay}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, billingDueDay: parseInt(e.target.value) || 10 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Dia do mês em que a mensalidade vence (1-31)</p>
                  </div>

                  <div>
                    <Label htmlFor="billingAdvanceDays">Dias de Antecedência para Notificação</Label>
                    <Input
                      id="billingAdvanceDays"
                      type="number"
                      min="1"
                      max="30"
                      value={paymentSettings.billingAdvanceDays}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, billingAdvanceDays: parseInt(e.target.value) || 10 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Quantos dias antes do vencimento enviar o email de cobrança</p>
                  </div>

                  <div>
                    <Label htmlFor="billingGracePeriodDays">Período de Tolerância (Grace Period)</Label>
                    <Input
                      id="billingGracePeriodDays"
                      type="number"
                      min="0"
                      max="30"
                      value={paymentSettings.billingGracePeriodDays}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, billingGracePeriodDays: parseInt(e.target.value) || 5 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Dias após o vencimento antes de bloquear a academia</p>
                  </div>

                  <div>
                    <Label htmlFor="billingLateFeeType">Tipo de Multa</Label>
                    <select
                      id="billingLateFeeType"
                      value={paymentSettings.billingLateFeeType}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, billingLateFeeType: e.target.value as "percentage" | "fixed" | "both" })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="percentage">Percentual</option>
                      <option value="fixed">Valor Fixo</option>
                      <option value="both">Percentual + Valor Fixo</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Como calcular a multa por atraso</p>
                  </div>
                </div>

                {/* Late Fees Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Multa e Juros por Atraso</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {(paymentSettings.billingLateFeeType === "percentage" || paymentSettings.billingLateFeeType === "both") && (
                      <div>
                        <Label htmlFor="billingLateFeePercentage">Multa em Percentual (%)</Label>
                        <Input
                          id="billingLateFeePercentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={paymentSettings.billingLateFeePercentage}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, billingLateFeePercentage: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ex: 2.00 = 2% do valor total</p>
                      </div>
                    )}

                    {(paymentSettings.billingLateFeeType === "fixed" || paymentSettings.billingLateFeeType === "both") && (
                      <div>
                        <Label htmlFor="billingLateFeeFixedCents">Multa Fixa (em centavos)</Label>
                        <Input
                          id="billingLateFeeFixedCents"
                          type="number"
                          min="0"
                          value={paymentSettings.billingLateFeeFixedCents}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, billingLateFeeFixedCents: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ex: 500 = R$ 5,00 | Valor atual: R$ {(paymentSettings.billingLateFeeFixedCents / 100).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="billingInterestRatePerDay">Juros por Dia (%)</Label>
                      <Input
                        id="billingInterestRatePerDay"
                        type="number"
                        min="0"
                        max="1"
                        step="0.001"
                        value={paymentSettings.billingInterestRatePerDay}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, billingInterestRatePerDay: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 0.03 = 0,03% ao dia (aproximadamente 1% ao mês)</p>
                    </div>
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Exemplo de Cálculo:</h4>
                  <p className="text-sm text-gray-700">
                    Mensalidade de <strong>R$ 100,00</strong> vencida há <strong>10 dias</strong>:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                    {paymentSettings.billingLateFeeType === "percentage" && (
                      <li>• Multa ({paymentSettings.billingLateFeePercentage}%): R$ {(100 * paymentSettings.billingLateFeePercentage / 100).toFixed(2)}</li>
                    )}
                    {paymentSettings.billingLateFeeType === "fixed" && (
                      <li>• Multa fixa: R$ {(paymentSettings.billingLateFeeFixedCents / 100).toFixed(2)}</li>
                    )}
                    {paymentSettings.billingLateFeeType === "both" && (
                      <>
                        <li>• Multa ({paymentSettings.billingLateFeePercentage}%): R$ {(100 * paymentSettings.billingLateFeePercentage / 100).toFixed(2)}</li>
                        <li>• Multa fixa: R$ {(paymentSettings.billingLateFeeFixedCents / 100).toFixed(2)}</li>
                      </>
                    )}
                    <li>• Juros (10 dias × {paymentSettings.billingInterestRatePerDay}%): R$ {(100 * paymentSettings.billingInterestRatePerDay / 100 * 10).toFixed(2)}</li>
                    <li className="font-semibold mt-2">
                      Total a pagar: R$ {(
                        100 +
                        (paymentSettings.billingLateFeeType === "percentage" || paymentSettings.billingLateFeeType === "both" ? 100 * paymentSettings.billingLateFeePercentage / 100 : 0) +
                        (paymentSettings.billingLateFeeType === "fixed" || paymentSettings.billingLateFeeType === "both" ? paymentSettings.billingLateFeeFixedCents / 100 : 0) +
                        (100 * paymentSettings.billingInterestRatePerDay / 100 * 10)
                      ).toFixed(2)}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePayments}
                disabled={updatePaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePaymentMutation.isPending ? "Salvando..." : "Salvar Configurações de Cobrança"}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Configurações do Site</h2>
            <p className="text-gray-600 mt-1">Gerencie logo, banners, preços e conteúdo da landing page</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </SuperAdminLayout>
  );
}
