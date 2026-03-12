// Role enum — shared between backend guards and frontend UI
export enum Role {
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER',
}

// Base entity fields present on every DB record
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal user shape returned by API (no password hash)
export interface UserDto extends BaseEntity {
  email: string;
  name: string;
  role: Role;
}

// Project shape returned by API
export interface ProjectDto extends BaseEntity {
  name: string;
  description: string | null;
  deletedAt: Date | null;
}

// JWT payload embedded in access/refresh tokens
export interface JwtPayload {
  sub: string;   // user id (cuid)
  email: string;
  role: Role;
}
