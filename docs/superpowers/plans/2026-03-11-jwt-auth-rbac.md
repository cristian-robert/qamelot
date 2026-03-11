# JWT Authentication with RBAC Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password JWT authentication (register, login, refresh, logout, me) with role-based access control guards protecting all NestJS routes, plus login/register pages and route protection middleware on the frontend.

**Architecture:** Backend uses NestJS Passport + JWT strategy with access (15min) and refresh (7d) tokens stored as httpOnly cookies via cookie-parser. `JwtAuthGuard` is registered globally via `APP_GUARD`; routes opt out with `@Public()`. `RolesGuard` enforces ADMIN > LEAD > TESTER > VIEWER hierarchy. Frontend uses Tanstack Query to cache the current user session (`/auth/me`) and a Next.js middleware to redirect unauthenticated users.

**Tech Stack:** NestJS, @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt, cookie-parser (backend); Next.js 16 App Router, @tanstack/react-query, React Hook Form, Zod (frontend — all already installed).

---

## pnpm alias (set in every shell session before running commands)

Because `pnpm` is not on PATH in the MINGW64/Git Bash shell on this machine, define this function at the top of every terminal session before running any pnpm commands:

```bash
pnpm() { "/c/Users/roby2/AppData/Roaming/nvm/v22.14.0/node.exe" "/c/Users/roby2/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs" "$@"; }
```

All `pnpm` commands in this plan assume this alias is active.

---

## File Structure

**Backend — create:**
- `apps/backend/src/users/users.module.ts` — UsersModule (imports PrismaModule, exports UsersService)
- `apps/backend/src/users/users.service.ts` — findByEmail, findById, create
- `apps/backend/src/users/users.service.spec.ts` — unit tests for UsersService
- `apps/backend/src/auth/auth.module.ts` — wires all auth providers, registers global guards
- `apps/backend/src/auth/auth.controller.ts` — register/login/refresh/logout/me endpoints
- `apps/backend/src/auth/auth.controller.spec.ts` — controller unit tests
- `apps/backend/src/auth/auth.service.ts` — register, login, refreshTokens, getProfile
- `apps/backend/src/auth/auth.service.spec.ts` — service unit tests
- `apps/backend/src/auth/strategies/jwt.strategy.ts` — Passport JWT strategy (reads access_token cookie)
- `apps/backend/src/auth/guards/jwt-auth.guard.ts` — global JWT guard, skips @Public() routes
- `apps/backend/src/auth/guards/roles.guard.ts` — RBAC guard using role hierarchy
- `apps/backend/src/auth/decorators/public.decorator.ts` — @Public() skip-auth decorator
- `apps/backend/src/auth/decorators/roles.decorator.ts` — @Roles() decorator
- `apps/backend/src/auth/dto/register.dto.ts` — class-validator RegisterDto
- `apps/backend/src/auth/dto/login.dto.ts` — class-validator LoginDto

**Backend — modify:**
- `apps/backend/src/app.module.ts` — import AuthModule
- `apps/backend/src/main.ts` — add cookie-parser middleware + Swagger cookie auth

**Shared — modify:**
- `packages/shared/src/schemas/auth.ts` — create: Zod schemas (RegisterSchema, LoginSchema)
- `packages/shared/src/types/index.ts` — add JwtPayload interface
- `packages/shared/src/index.ts` — export schemas

**Frontend — create:**
- `apps/frontend/components/providers/QueryProvider.tsx` — Tanstack Query client provider
- `apps/frontend/lib/api/auth.ts` — typed fetch client for auth endpoints
- `apps/frontend/lib/auth/useAuth.ts` — useAuth hook (session query + login/register/logout mutations)
- `apps/frontend/app/(auth)/layout.tsx` — centered layout for auth pages
- `apps/frontend/app/(auth)/login/page.tsx` — login form (React Hook Form + Zod)
- `apps/frontend/app/(auth)/register/page.tsx` — register form (React Hook Form + Zod)
- `apps/frontend/app/(dashboard)/layout.tsx` — protected routes layout placeholder
- `apps/frontend/app/(dashboard)/dashboard/page.tsx` — dashboard placeholder
- `apps/frontend/middleware.ts` — Next.js middleware: redirect unauthed users to /login

**Frontend — modify:**
- `apps/frontend/app/layout.tsx` — wrap body with QueryProvider

---

## Chunk 1: Shared types + Backend foundation (UsersService + AuthService + Guards)

### Task 1: Install backend auth dependencies

**Files:**
- Modify: `apps/backend/package.json` (via pnpm add)

- [ ] **Step 1: Set pnpm alias**

```bash
pnpm() { "/c/Users/roby2/AppData/Roaming/nvm/v22.14.0/node.exe" "/c/Users/roby2/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs" "$@"; }
```

- [ ] **Step 2: Install backend runtime deps**

```bash
pnpm --filter backend add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser
```

Expected: packages added, no errors.

- [ ] **Step 3: Install backend dev deps (types)**

```bash
pnpm --filter backend add -D @types/passport-jwt @types/bcrypt @types/cookie-parser
```

- [ ] **Step 4: Add zod to shared package**

```bash
pnpm --filter @app/shared add zod
```

- [ ] **Step 5: Verify install**

```bash
pnpm --filter backend exec node -e "require('@nestjs/jwt'); console.log('ok')"
```

Expected: `ok`

---

### Task 2: Shared auth Zod schemas + JwtPayload type

**Files:**
- Create: `packages/shared/src/schemas/auth.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create auth Zod schemas**

Create `packages/shared/src/schemas/auth.ts`:

```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
```

- [ ] **Step 2: Add JwtPayload type to shared types**

Append to `packages/shared/src/types/index.ts`:

```typescript
// JWT payload embedded in access/refresh tokens
export interface JwtPayload {
  sub: string;   // user id (cuid)
  email: string;
  role: Role;
}
```

- [ ] **Step 3: Export schemas from shared index**

Update `packages/shared/src/index.ts`:

```typescript
export * from './types/index';
export * from './constants/index';
export * from './schemas/auth';
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm --filter @app/shared exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add auth Zod schemas and JwtPayload type

Closes #2"
```

---

### Task 3: UsersService

**Files:**
- Create: `apps/backend/src/users/users.service.spec.ts`
- Create: `apps/backend/src/users/users.service.ts`
- Create: `apps/backend/src/users/users.module.ts`

- [ ] **Step 1: Write failing tests for UsersService**

Create `apps/backend/src/users/users.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@app/shared';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      const user = { id: '1', email: 'a@b.com', name: 'Alice', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.findByEmail('a@b.com');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('missing@b.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: '1', email: 'a@b.com', name: 'Alice', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.findById('1');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('create', () => {
    it('creates and returns new user', async () => {
      const user = { id: '2', email: 'b@c.com', name: 'Bob', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.create.mockResolvedValue(user);
      const result = await service.create({ email: 'b@c.com', name: 'Bob', passwordHash: 'hash' });
      expect(result).toEqual(user);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'b@c.com', name: 'Bob', password: 'hash', role: Role.TESTER },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter backend test -- --testPathPattern=users.service.spec
```

Expected: FAIL — `Cannot find module './users.service'`

- [ ] **Step 3: Implement UsersService**

Create `apps/backend/src/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@app/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: { email: data.email, name: data.name, password: data.passwordHash, role: Role.TESTER },
    });
  }
}
```

- [ ] **Step 4: Create UsersModule**

Create `apps/backend/src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter backend test -- --testPathPattern=users.service.spec
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/users/
git commit -m "feat(backend): add UsersService with findByEmail, findById, create

Closes #2"
```

---

### Task 4: AuthService (register + login + token logic)

**Files:**
- Create: `apps/backend/src/auth/auth.service.spec.ts`
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/strategies/jwt.strategy.ts`

- [ ] **Step 1: Write failing tests for AuthService**

Create `apps/backend/src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@app/shared';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const testUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: Role.TESTER,
  password: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes password and creates user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockUsersService.create.mockResolvedValue(testUser);

      const result = await service.register({ email: 'alice@test.com', name: 'Alice', password: 'password123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'alice@test.com',
        name: 'Alice',
        passwordHash: 'hashed-pw',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: testUser.id, email: testUser.email });
    });

    it('throws ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      await expect(service.register({ email: 'alice@test.com', name: 'Alice', password: 'pass1234' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns access/refresh tokens and user on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login({ email: 'alice@test.com', password: 'password123' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: testUser.id, email: testUser.email }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'alice@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'nobody@test.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns user without password field', async () => {
      mockUsersService.findById.mockResolvedValue(testUser);
      const result = await service.getProfile('user-1');
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: testUser.id, email: testUser.email });
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter backend test -- --testPathPattern=auth.service.spec
```

Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 3: Implement AuthService**

Create `apps/backend/src/auth/auth.service.ts`:

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { RegisterInput, LoginInput, JwtPayload, UserDto } from '@app/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterInput): Promise<UserDto> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    return this.toDto(user);
  }

  async login(dto: LoginInput): Promise<{ accessToken: string; refreshToken: string; user: UserDto }> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken, user: this.toDto(user) };
  }

  async refreshTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.toDto(user);
  }

  private toDto(user: {
    id: string; email: string; name: string;
    role: string; createdAt: Date; updatedAt: Date;
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserDto['role'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

- [ ] **Step 4: Create JWT strategy**

Create `apps/backend/src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import type { JwtPayload } from '@app/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter backend test -- --testPathPattern=auth.service.spec
```

Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/auth/auth.service.ts apps/backend/src/auth/auth.service.spec.ts apps/backend/src/auth/strategies/
git commit -m "feat(backend): implement AuthService with register, login, refresh, getProfile

Closes #2"
```

---

### Task 5: Guards and Decorators

**Files:**
- Create: `apps/backend/src/auth/decorators/public.decorator.ts`
- Create: `apps/backend/src/auth/decorators/roles.decorator.ts`
- Create: `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/backend/src/auth/guards/roles.guard.ts`

- [ ] **Step 1: Create @Public() decorator**

Create `apps/backend/src/auth/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Create @Roles() decorator**

Create `apps/backend/src/auth/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@app/shared';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
```

> Note: `packages/shared/src/constants/index.ts` already exports a `ROLES_KEY = 'roles'` constant (used elsewhere). We use `REQUIRED_ROLES_KEY = 'requiredRoles'` here to avoid any collision.

- [ ] **Step 3: Create JwtAuthGuard**

Create `apps/backend/src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 4: Create RolesGuard**

Create `apps/backend/src/auth/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@app/shared';
import { REQUIRED_ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 4,
  [Role.LEAD]: 3,
  [Role.TESTER]: 2,
  [Role.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return required.some((r) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[r]);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/auth/guards/ apps/backend/src/auth/decorators/
git commit -m "feat(backend): add JwtAuthGuard, RolesGuard, @Public and @Roles decorators

Closes #2"
```

---

## Chunk 2: Backend Controller + Wiring

### Task 6: Auth DTOs

**Files:**
- Create: `apps/backend/src/auth/dto/register.dto.ts`
- Create: `apps/backend/src/auth/dto/login.dto.ts`

- [ ] **Step 1: Create RegisterDto**

Create `apps/backend/src/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
```

- [ ] **Step 2: Create LoginDto**

Create `apps/backend/src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(1)
  password: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/auth/dto/
git commit -m "feat(backend): add RegisterDto and LoginDto

Closes #2"
```

---

### Task 7: AuthController

**Files:**
- Create: `apps/backend/src/auth/auth.controller.spec.ts`
- Create: `apps/backend/src/auth/auth.controller.ts`

- [ ] **Step 1: Write failing controller tests**

Create `apps/backend/src/auth/auth.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@app/shared';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshTokens: jest.fn(),
  getProfile: jest.fn(),
};

const testUser = {
  id: '1', email: 'a@b.com', name: 'Alice',
  role: Role.TESTER, createdAt: new Date(), updatedAt: new Date(),
};

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('returns user DTO', async () => {
      mockAuthService.register.mockResolvedValue(testUser);
      const result = await controller.register({ email: 'a@b.com', name: 'Alice', password: 'pass1234' } as any);
      expect(result).toEqual(testUser);
    });
  });

  describe('login', () => {
    it('sets httpOnly cookies and returns user', async () => {
      mockAuthService.login.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt', user: testUser });
      const res = mockResponse();
      await controller.login({ email: 'a@b.com', password: 'pass1234' } as any, res);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'at', expect.objectContaining({ httpOnly: true }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'rt', expect.objectContaining({ httpOnly: true }));
      expect(res.json).toHaveBeenCalledWith(testUser);
    });
  });

  describe('logout', () => {
    it('clears both auth cookies', async () => {
      const res = mockResponse();
      await controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('me', () => {
    it('returns current user profile', async () => {
      mockAuthService.getProfile.mockResolvedValue(testUser);
      const req = { user: { id: '1' } };
      const result = await controller.me(req as any);
      expect(result).toEqual(testUser);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('1');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter backend test -- --testPathPattern=auth.controller.spec
```

Expected: FAIL — `Cannot find module './auth.controller'`

- [ ] **Step 3: Implement AuthController**

Create `apps/backend/src/auth/auth.controller.ts`:

```typescript
import {
  Controller, Post, Get, Body, Res, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Authenticated, cookies set' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.login(dto);
    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access token using refresh cookie' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET as string);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.auth.refreshTokens(payload.sub);
    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ ok: true });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies' })
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.json({ ok: true });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile (no password)' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@Req() req: Request & { user: { id: string } }) {
    return this.auth.getProfile(req.user.id);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter backend test -- --testPathPattern=auth.controller.spec
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/auth/auth.controller.ts apps/backend/src/auth/auth.controller.spec.ts
git commit -m "feat(backend): implement AuthController (register/login/refresh/logout/me)

Closes #2"
```

---

### Task 8: AuthModule + Wire into AppModule + cookie-parser

**Files:**
- Create: `apps/backend/src/auth/auth.module.ts`
- Modify: `apps/backend/src/app.module.ts`
- Modify: `apps/backend/src/main.ts`

- [ ] **Step 1: Create AuthModule**

Create `apps/backend/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
```

- [ ] **Step 2: Import AuthModule into AppModule**

Replace `apps/backend/src/app.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Add cookie-parser to main.ts**

Replace `apps/backend/src/main.ts` with:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  app.enableCors({ origin: frontendUrl, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Qamelot API')
    .setDescription('Test Management Platform API')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend running on http://0.0.0.0:${port}`);
  logger.log(`Swagger docs at http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 4: Run full backend test suite**

```bash
pnpm --filter backend test
```

Expected: all tests pass.

- [ ] **Step 5: Typecheck backend**

```bash
pnpm --filter backend exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/auth/auth.module.ts apps/backend/src/app.module.ts apps/backend/src/main.ts
git commit -m "feat(backend): wire AuthModule globally with JWT guards and cookie-parser

Closes #2"
```

---

## Chunk 3: Frontend (Session + Pages + Middleware)

### Task 9: QueryProvider + auth API client

**Files:**
- Create: `apps/frontend/components/providers/QueryProvider.tsx`
- Create: `apps/frontend/lib/api/auth.ts`
- Modify: `apps/frontend/app/layout.tsx`

- [ ] **Step 1: Create QueryProvider**

Create `apps/frontend/components/providers/QueryProvider.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create auth API client**

Create `apps/frontend/lib/api/auth.ts`:

```typescript
import type { UserDto } from '@app/shared';
import type { RegisterInput, LoginInput } from '@app/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  register: (data: RegisterInput) =>
    apiFetch<UserDto>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginInput) =>
    apiFetch<UserDto>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<UserDto>('/auth/me'),

  refresh: () =>
    apiFetch<{ ok: boolean }>('/auth/refresh', { method: 'POST' }),
};
```

- [ ] **Step 3: Wrap layout with QueryProvider**

Replace `apps/frontend/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Qamelot',
  description: 'Test Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Typecheck frontend**

```bash
pnpm --filter frontend exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/providers/ apps/frontend/lib/api/ apps/frontend/app/layout.tsx
git commit -m "feat(frontend): add QueryProvider and auth API client

Closes #2"
```

---

### Task 10: useAuth hook

**Files:**
- Create: `apps/frontend/lib/auth/useAuth.ts`

- [ ] **Step 1: Create useAuth hook**

Create `apps/frontend/lib/auth/useAuth.ts`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
import type { LoginInput, RegisterInput } from '@app/shared';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: () => router.push('/login'),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      router.push('/login');
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/lib/auth/
git commit -m "feat(frontend): add useAuth hook with login/register/logout mutations

Closes #2"
```

---

### Task 11: Login and Register pages

**Files:**
- Create: `apps/frontend/app/(auth)/layout.tsx`
- Create: `apps/frontend/app/(auth)/login/page.tsx`
- Create: `apps/frontend/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create auth route group layout**

Create `apps/frontend/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </main>
  );
}
```

- [ ] **Step 2: Create Login page**

Create `apps/frontend/app/(auth)/login/page.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LoginSchema, type LoginInput } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  return (
    <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border bg-card shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {login.error && (
          <p className="text-sm text-destructive">{(login.error as Error).message}</p>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create Register page**

Create `apps/frontend/app/(auth)/register/page.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { RegisterSchema, type RegisterInput } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border bg-card shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">Fill in your details to get started</p>
      </div>

      <form onSubmit={handleSubmit((data) => registerUser.mutate(data))} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Alice Smith"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Min. 8 characters"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {registerUser.error && (
          <p className="text-sm text-destructive">{(registerUser.error as Error).message}</p>
        )}

        <Button type="submit" className="w-full" disabled={registerUser.isPending}>
          {registerUser.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck frontend**

```bash
pnpm --filter frontend exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/app/(auth)/"
git commit -m "feat(frontend): add login and register pages

Closes #2"
```

---

### Task 12: Next.js Middleware + Dashboard placeholder

**Files:**
- Create: `apps/frontend/middleware.ts`
- Create: `apps/frontend/app/(dashboard)/layout.tsx`
- Create: `apps/frontend/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create Next.js route protection middleware**

Create `apps/frontend/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hasToken = request.cookies.has('access_token');

  if (!isPublic && !hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

- [ ] **Step 2: Create dashboard layout placeholder**

Create `apps/frontend/app/(dashboard)/layout.tsx`:

```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Create dashboard page placeholder**

Create `apps/frontend/app/(dashboard)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <h1 className="p-8 text-2xl font-bold">Dashboard</h1>;
}
```

- [ ] **Step 4: Run frontend test suite**

```bash
pnpm --filter frontend test
```

Expected: pass.

- [ ] **Step 5: Final typecheck all packages**

```bash
pnpm --filter @app/shared exec tsc --noEmit
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
```

Expected: zero errors across all packages.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/middleware.ts "apps/frontend/app/(dashboard)/"
git commit -m "feat(frontend): add route protection middleware and dashboard placeholder

Closes #2"
```
