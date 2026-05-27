import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getItems() {
    return this.prisma.item.findMany();
  }

  async buyItem(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (item.type === 'plant') {
      const plantId = parseInt(item.effectJson || '0');
      if (plantId > 0) {
        const exists = await this.prisma.userPlant.findUnique({
          where: { userId_plantId: { userId, plantId } },
        });
        if (exists) throw new BadRequestException('Already owned');
      }
    }

    // Rare plant price escalation: each rare plant owned increases cost
    let escalatedPrice = item.priceCoins
    if (item.type === 'plant') {
      const plantId = parseInt(item.effectJson || '0')
      if (plantId >= 101 && plantId <= 120) {
        const ownedRareCount = await this.prisma.userPlant.count({
          where: { userId, plantId: { gte: 101, lte: 120 } },
        })
        escalatedPrice = item.priceCoins * (ownedRareCount + 1)
      }
    }

    if (escalatedPrice > 0) {
      if (user.coins < escalatedPrice) throw new BadRequestException('Not enough coins');
      await this.prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: escalatedPrice } },
      });
    }

    if (item.priceGems > 0) {
      if (user.gems < item.priceGems) throw new BadRequestException('Not enough gems');
      await this.prisma.user.update({
        where: { id: userId },
        data: { gems: { decrement: item.priceGems } },
      });
    }

    if (item.type === 'plant') {
      const plantId = parseInt(item.effectJson || '0');
      if (plantId > 0) {
        await this.prisma.userPlant.create({ data: { userId, plantId } });
      }
    } else {
      await this.prisma.userItem.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
    }

    return { success: true, message: `Purchased ${item.name}` };
  }

  async exchangeGems(userId: string, gems: number) {
    if (!gems || gems <= 0 || !Number.isInteger(gems)) {
      throw new BadRequestException('Invalid gem amount');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.gems < gems) throw new BadRequestException('Not enough gems');

    const coinsEarned = gems * 100;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        gems: { decrement: gems },
        coins: { increment: coinsEarned },
      },
    });

    return { success: true, message: `Exchanged ${gems} gems for ${coinsEarned} coins`, coinsEarned };
  }

  async buySlot(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.gems < 1) throw new BadRequestException('Not enough gems');
    if (user.plantSlots >= 10) throw new BadRequestException('Max slots reached');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        gems: { decrement: 1 },
        plantSlots: { increment: 1 },
      },
    });

    return { success: true, plantSlots: user.plantSlots + 1 };
  }
}
