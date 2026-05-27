import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
      },
    });

    // Seed initial plants (Peashooter, Sunflower)
    await Promise.all([
      this.prisma.userPlant.upsert({
        where: { userId_plantId: { userId: user.id, plantId: 1 } },
        create: { userId: user.id, plantId: 1 },
        update: {},
      }),
      this.prisma.userPlant.upsert({
        where: { userId_plantId: { userId: user.id, plantId: 2 } },
        create: { userId: user.id, plantId: 2 },
        update: {},
      }),
    ]);

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async guest() {
    const guestId = `guest_${Date.now()}`;
    const user = await this.prisma.user.create({
      data: {
        email: `${guestId}@guest.pvz`,
        passwordHash: '',
        nickname: `Guest_${guestId.slice(-6)}`,
        role: 'GUEST',
      },
    });
    // Seed initial plants for guest
    await Promise.all([
      this.prisma.userPlant.upsert({
        where: { userId_plantId: { userId: user.id, plantId: 1 } },
        create: { userId: user.id, plantId: 1 },
        update: {},
      }),
      this.prisma.userPlant.upsert({
        where: { userId_plantId: { userId: user.id, plantId: 2 } },
        create: { userId: user.id, plantId: 2 },
        update: {},
      }),
    ]);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.generateTokens(user.id, user.email, user.role);
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
