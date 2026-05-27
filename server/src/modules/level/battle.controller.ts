import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BattleService } from './battle.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  submit(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.battleService.submitResult(userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(@CurrentUser('userId') userId: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.battleService.getHistory(userId, Number(page) || 1, Number(pageSize) || 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getBattle(@Param('id') id: string) {
    return this.battleService.getBattle(id);
  }
}
