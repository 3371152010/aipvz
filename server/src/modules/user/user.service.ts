import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, avatarUrl: true, role: true, coins: true, gems: true, plantSlots: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { nickname?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getInventory(userId: string) {
    const [plants, items] = await Promise.all([
      this.prisma.userPlant.findMany({ where: { userId } }),
      this.prisma.userItem.findMany({ where: { userId }, include: { item: true } }),
    ]);
    return { plants, items };
  }

  async getProgress(userId: string) {
    return this.prisma.levelProgress.findMany({
      where: { userId },
      include: { level: true },
      orderBy: [{ level: { world: 'asc' } }, { level: { levelNumber: 'asc' } }],
    });
  }
}
