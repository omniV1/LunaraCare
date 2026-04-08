/**
 * @module types/user
 * User-related enums and type re-exports for role-based access control.
 */
// Re-export User from canonical source
export type { User } from './models';

/** Application-level role identifiers used for RBAC checks. */
export enum Role {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
}

/** Account activation state. */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
