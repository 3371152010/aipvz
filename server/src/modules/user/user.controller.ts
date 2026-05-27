import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@CurrentUser('userId') userId: string, @Body() data: { nickname?: string; avatarUrl?: string }) {
    return this.userService.updateProfile(userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/inventory')
  getInventory(@CurrentUser('userId') userId: string) {
    return this.userService.getInventory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/progress')
  getProgress(@CurrentUser('userId') userId: string) {
    return this.userService.getProgress(userId);
  }
}
