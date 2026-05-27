import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalRank(limit = 50) {
    const users = await this.prisma.user.findMany({
      select: { id: true, nickname: true, coins: true, gems: true },
      orderBy: { coins: 'desc' },
      take: limit,
    });

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      nickname: u.nickname,
      coins: u.coins,
      gems: u.gems,
    }));
  }

  async getStarsRank(limit = 50) {
    const progresses = await this.prisma.levelProgress.findMany({
      select: {
        userId: true,
        stars: true,
        user: { select: { nickname: true } },
      },
    });

    // Aggregate total stars per user
    const map = new Map<string, { nickname: string; totalStars: number }>();
    for (const p of progresses) {
      const entry = map.get(p.userId) || { nickname: p.user.nickname, totalStars: 0 };
      entry.totalStars += p.stars;
      map.set(p.userId, entry);
    }

    const sorted = Array.from(map.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.totalStars - a.totalStars)
      .slice(0, limit)
      .map((entry, i) => ({ rank: i + 1, ...entry }));

    return sorted;
  }

  async getSpeedRank(limit = 50) {
    const battles = await this.prisma.battleHistory.findMany({
      where: { won: true },
      orderBy: { durationSec: 'asc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        levelId: true,
        durationSec: true,
        stars: true,
        user: { select: { nickname: true } },
      },
    });

    const levels = await this.prisma.level.findMany({
      select: { id: true, name: true },
    });
    const levelMap = new Map(levels.map(l => [l.id, l.name]));

    return battles.map((b, i) => ({
      rank: i + 1,
      userId: b.userId,
      nickname: b.user.nickname,
      levelName: levelMap.get(b.levelId) || '?',
      durationSec: b.durationSec,
      stars: b.stars,
    }));
  }
}
