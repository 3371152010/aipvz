import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LevelService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(world?: number) {
    const where = world ? { world } : {};
    return this.prisma.level.findMany({
      where,
      orderBy: [{ world: 'asc' }, { levelNumber: 'asc' }],
      select: { id: true, world: true, levelNumber: true, name: true, unlockCost: true },
    });
  }

  async findOne(id: string) {
    const level = await this.prisma.level.findUnique({ where: { id } });
    if (!level) throw new NotFoundException('Level not found');
    return level;
  }

  async findByWorldAndLevel(world: number, levelNumber: number) {
    const level = await this.prisma.level.findFirst({
      where: { world, levelNumber },
    });
    if (!level) throw new NotFoundException('Level not found');
    return level;
  }

  async getWorldOverview(world: number, userId: string) {
    const [levels, progress] = await Promise.all([
      this.prisma.level.findMany({
        where: { world },
        orderBy: { levelNumber: 'asc' },
        select: { id: true, world: true, levelNumber: true, name: true, unlockCost: true },
      }),
      this.prisma.levelProgress.findMany({
        where: { userId, level: { world } },
      }),
    ]);

    const progressMap = new Map(progress.map(p => [p.levelId, p]));
    return levels.map((level, index) => {
      const prog = progressMap.get(level.id);
      const prevLevel = index === 0 ? null : levels[index - 1];
      const prevCompleted = prevLevel
        ? progressMap.get(prevLevel.id)?.completed
        : true;
      return {
        ...level,
        stars: prog?.stars || 0,
        completed: prog?.completed || false,
        bestTime: prog?.bestTime || null,
        unlocked: index === 0 || !!prevCompleted,
      };
    });
  }

  async create(data: { world: number; levelNumber: number; name: string; configJson: string; unlockCost?: number }) {
    return this.prisma.level.create({ data });
  }

  async update(id: string, data: { name?: string; configJson?: string; unlockCost?: number }) {
    return this.prisma.level.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.level.delete({ where: { id } });
  }
}
