import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { Role } from '@app/shared';
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

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as Role };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken, user: this.toDto(user) };
  }

  async refreshTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as Role };
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
