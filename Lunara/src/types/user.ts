// Re-export User from canonical source
export type { User } from './models';

export enum Role {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
