import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LevelService } from './level.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get()
  findAll(@Query('world') world?: string) {
    return this.levelService.findAll(world ? Number(world) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':world/overview')
  getOverview(@Param('world') world: string, @CurrentUser('userId') userId: string) {
    return this.levelService.getWorldOverview(Number(world), userId);
  }

  @Get(':world/:levelNumber')
  findByWorldAndLevel(@Param('world') world: string, @Param('levelNumber') levelNumber: string) {
    return this.levelService.findByWorldAndLevel(Number(world), Number(levelNumber));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.levelService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.levelService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.levelService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.levelService.remove(id);
  }
}
