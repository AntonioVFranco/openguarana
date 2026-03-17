export type Role = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission =
  | 'workspace:delete'
  | 'members:manage'
  | 'decisions:write'
  | 'decisions:read'
  | 'graph:write'
  | 'graph:read'
  | 'skills:install'
  | 'skills:use'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner:  ['workspace:delete', 'members:manage', 'decisions:write', 'decisions:read',
           'graph:write', 'graph:read', 'skills:install', 'skills:use'],
  admin:  ['members:manage', 'decisions:write', 'decisions:read',
           'graph:write', 'graph:read', 'skills:install', 'skills:use'],
  member: ['decisions:write', 'decisions:read', 'graph:write', 'graph:read', 'skills:use'],
  viewer: ['decisions:read', 'graph:read'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role '${role}' does not have permission '${permission}'`)
  }
}
