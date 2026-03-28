import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@app/shared';
import type { UserDto, InviteUserInput, UpdateProfileInput } from '@app/shared';
import { randomBytes } from 'crypto';

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

  async findAll(options?: { page?: number; pageSize?: number }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = { deletedAt: null };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u: { id: string; email: string; name: string; role: string; deletedAt: Date | null; createdAt: Date; updatedAt: Date }) => this.toDto(u));

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOneById(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

  async updateRole(targetId: string, role: Role, requesterId: string): Promise<UserDto> {
    if (targetId === requesterId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
    });
    return this.toDto(updated);
  }

  async softDelete(targetId: string, requesterId: string): Promise<UserDto> {
    if (targetId === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const deleted = await this.prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
    });
    return this.toDto(deleted);
  }

  async invite(data: InviteUserInput): Promise<UserDto & { temporaryPassword: string }> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const temporaryPassword = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: passwordHash,
        role: data.role as Role,
      },
    });

    return { ...this.toDto(user), temporaryPassword };
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileInput,
  ): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const updateData: { name?: string; password?: string } = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      updateData.password = await bcrypt.hash(data.newPassword, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return this.toDto(updated);
  }

  private toDto(user: {
    id: string; email: string; name: string;
    role: string; deletedAt: Date | null;
    createdAt: Date; updatedAt: Date;
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
