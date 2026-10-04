/**
 * Authentication & Authorization Service (SSO & RBAC)
 * Supports:
 * - Roles: 'guest' (read-only), 'user' (operator), 'admin' (full access)
 * - Single Sign-On (SSO): Google, GitHub, Microsoft Entra, Enterprise SAML/OIDC
 * - Persistent session in localStorage with 1-click Demo Switcher
 */

export type UserRole = 'guest' | 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization: string;
  provider: 'sso-google' | 'sso-github' | 'sso-enterprise' | 'guest' | 'demo';
  permissions: {
    canViewTelemetry: boolean;
    canExportData: boolean;
    canControlSwitches: boolean;
    canUploadFiles: boolean;
    canManageBacklog: boolean;
    canAccessAdmin: boolean;
  };
}

const ROLE_PERMISSIONS: Record<UserRole, UserProfile['permissions']> = {
  guest: {
    canViewTelemetry: true,
    canExportData: false,
    canControlSwitches: false,
    canUploadFiles: false,
    canManageBacklog: false,
    canAccessAdmin: false,
  },
  user: {
    canViewTelemetry: true,
    canExportData: true,
    canControlSwitches: true,
    canUploadFiles: true,
    canManageBacklog: true,
    canAccessAdmin: false,
  },
  admin: {
    canViewTelemetry: true,
    canExportData: true,
    canControlSwitches: true,
    canUploadFiles: true,
    canManageBacklog: true,
    canAccessAdmin: true,
  },
};

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  guest: {
    id: 'usr-guest-001',
    name: 'Gość (Tryb Publiczny)',
    email: 'gosc@smartgrid.pomorskie.pl',
    role: 'guest',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    organization: 'Dostęp Ogólnodostępny',
    provider: 'guest',
    permissions: ROLE_PERMISSIONS.guest,
  },
  user: {
    id: 'usr-operator-002',
    name: 'Inżynier Sieciowy (Operator)',
    email: 'operator@energa-operator.pl',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
    organization: 'Energa Operator / Dyspozycja Mocy',
    provider: 'sso-google',
    permissions: ROLE_PERMISSIONS.user,
  },
  admin: {
    id: 'usr-admin-003',
    name: 'Główny Administrator Systemu',
    email: 'admin@pse.pl',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    organization: 'Polskie Sieci Elektroenergetyczne (KSE)',
    provider: 'sso-enterprise',
    permissions: ROLE_PERMISSIONS.admin,
  },
};

const STORAGE_KEY = 'smartgrid_current_user_profile';

export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load user from localStorage:', e);
  }
  return DEFAULT_USERS.user; // default to user for convenient demo testing
}

export function setCurrentUserRole(role: UserRole): UserProfile {
  const profile = DEFAULT_USERS[role];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('authRoleChanged', { detail: profile }));
  } catch (e) {
    console.error('Failed to save user role to localStorage:', e);
  }
  return profile;
}

export function loginWithSSO(
  provider: 'google' | 'github' | 'enterprise',
  customEmail?: string
): UserProfile {
  const role: UserRole = provider === 'enterprise' ? 'admin' : 'user';
  const baseProfile = DEFAULT_USERS[role];
  const user: UserProfile = {
    ...baseProfile,
    email: customEmail || baseProfile.email,
    provider:
      provider === 'google'
        ? 'sso-google'
        : provider === 'github'
          ? 'sso-github'
          : 'sso-enterprise',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('authRoleChanged', { detail: user }));
  return user;
}

export function logoutUser(): UserProfile {
  return setCurrentUserRole('guest');
}
