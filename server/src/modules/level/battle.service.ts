import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BattleService {
  constructor(private readonly prisma: PrismaService) {}

  async submitResult(
    userId: string,
    data: {
      levelId: string
      won: boolean
      plantsLost: number
      durationSec: number
      plantsUsed: number[]
      mowersUsed?: number
      stars?: number
    },
  ) {
    const level = await this.prisma.level.findUnique({ where: { id: data.levelId } });
    if (!level) throw new BadRequestException('Level not found');

    const stars = data.won ? this.calculateStars(data.mowersUsed ?? 0) : 0;
    const coinsEarned = data.won ? 30 + stars * 10 : 0;
    const levelConfig = JSON.parse(level.configJson || '{}');
    const gemsEarned = data.won && stars === 3 ? (levelConfig.rewards?.gems || 2) : 0;

    const battle = await this.prisma.battleHistory.create({
      data: {
        userId,
        levelId: data.levelId,
        won: data.won,
        stars,
        plantsUsed: JSON.stringify(data.plantsUsed),
        plantsLost: data.plantsLost,
        durationSec: data.durationSec,
        coinsEarned,
      },
    });

    if (data.won) {
      const existing = await this.prisma.levelProgress.findUnique({
        where: { userId_levelId: { userId, levelId: data.levelId } },
      });

      const isBetter = !existing || stars > existing.stars ||
        (stars === existing.stars && data.durationSec < (existing.bestTime || Infinity));

      await this.prisma.levelProgress.upsert({
        where: { userId_levelId: { userId, levelId: data.levelId } },
        create: {
          userId,
          levelId: data.levelId,
          stars,
          completed: true,
          bestTime: data.durationSec,
          plantsLost: data.plantsLost,
        },
        update: isBetter
          ? { stars, bestTime: Math.min(data.durationSec, existing?.bestTime || Infinity), plantsLost: data.plantsLost }
          : {},
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: coinsEarned },
          gems: { increment: gemsEarned },
        },
      });

      // Unlock plant on first clear of this level
      await this.unlockPlant(userId, level);
    }

    return { battle, stars, coinsEarned, gemsEarned };
  }

  // Plant unlock order: one common plant per level across 3 worlds
  private readonly PLANT_UNLOCKS: Record<string, number> = {
    // World 1: Day
    '1-1': 3,   // 坚果墙
    '1-2': 4,   // 土豆雷
    '1-3': 5,   // 卷心菜投手
    '1-4': 7,   // 寒冰射手
    '1-5': 6,   // 双发射手
    '1-6': 8,   // 玉米投手
    '1-7': 11,  // 闪电芦苇
    '1-8': 13,  // 阳光菇
    '1-9': 12,  // 大喷菇
    '1-10': 14, // 路灯花
    // World 2: Night
    '2-1': 15,  // 磁力菇
    '2-2': 16,  // 仙人掌
    '2-3': 17,  // 缠绕水草
    '2-4': 18,  // 甜菜护卫
    '2-5': 19,  // 全息坚果
    '2-6': 20,  // 花生
    '2-7': 21,  // 红针花
    '2-8': 9,   // 西瓜投手
    '2-9': 10,  // 回旋镖射手
    '2-10': 22, // 原始向日葵
    // World 3: Pool
    '3-1': 23,  // 双胞向日葵
    '3-2': 24,  // 鳄梨
    '3-3': 25,  // 潜伏芹菜
    '3-4': 26,  // 抱抱菜
    '3-5': 27,  // 孢子菇
    '3-6': 28,  // 热辣海枣
    '3-7': 29,  // 幽灵辣椒
    '3-8': 30,  // 地刺
    '3-9': 0,   // (coin bonus level)
    '3-10': 0,  // (gem bonus level)
  }

  private async unlockPlant(userId: string, level: { world: number; levelNumber: number }) {
    const key = `${level.world}-${level.levelNumber}`
    const plantId = this.PLANT_UNLOCKS[key]
    if (!plantId) return
    await this.prisma.userPlant.upsert({
      where: { userId_plantId: { userId, plantId } },
      create: { userId, plantId },
      update: {},
    })
  }

  async getHistory(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.battleHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.battleHistory.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize };
  }

  async getBattle(id: string) {
    return this.prisma.battleHistory.findUnique({ where: { id } });
  }

  private calculateStars(mowersUsed: number): number {
    if (mowersUsed === 0) return 3;
    if (mowersUsed <= 2) return 2;
    return 1;
  }
}
