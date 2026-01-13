export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Salvar o tipo de login atual
export const saveLoginType = (type: 'student' | 'admin' | 'super-admin' | 'professor') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last_login_type', type);
  }
};

// Obter o último tipo de login usado
export const getLastLoginType = (): 'student' | 'admin' | 'super-admin' | 'professor' => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('last_login_type') as any) || 'student';
  }
  return 'student';
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Se OAuth não estiver configurado, retornar login por email/senha
  if (!oauthPortalUrl || !appId) {
    // Retornar para o último login usado
    const lastLoginType = getLastLoginType();

    switch (lastLoginType) {
      case 'admin':
        return "/admin/login";
      case 'super-admin':
        return "/super-admin/login";
      case 'professor':
        return "/professor/login";
      default:
        return "/student/login";
    }
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
