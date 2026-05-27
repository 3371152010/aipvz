import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @UseGuards(JwtAuthGuard)
  @Get('items')
  getItems() {
    return this.shopService.getItems();
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy')
  buyItem(@CurrentUser('userId') userId: string, @Body('itemId') itemId: string) {
    return this.shopService.buyItem(userId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('exchange')
  exchange(@CurrentUser('userId') userId: string, @Body('gems') gems: number) {
    return this.shopService.exchangeGems(userId, gems);
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy-slot')
  buySlot(@CurrentUser('userId') userId: string) {
    return this.shopService.buySlot(userId);
  }
}
