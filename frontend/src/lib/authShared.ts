export const AUTH_COOKIE = 'ai_vendor_contract_risk_monitor_session';

export type SessionUser = {
  identityId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'analyst';
};

export const rolePermissions: Record<SessionUser['role'], {
  canApprove: boolean; canManageDocuments: boolean; canManageSettings: boolean;
}> = {
  admin: { canApprove: true, canManageDocuments: true, canManageSettings: true },
  manager: { canApprove: true, canManageDocuments: true, canManageSettings: false },
  analyst: { canApprove: false, canManageDocuments: false, canManageSettings: false },
};
