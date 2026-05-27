import { Controller, Get } from '@nestjs/common';
import { RankService } from './rank.service';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Get('total')
  getTotalRank() {
    return this.rankService.getTotalRank();
  }

  @Get('stars')
  getStarsRank() {
    return this.rankService.getStarsRank();
  }

  @Get('speed')
  getSpeedRank() {
    return this.rankService.getSpeedRank();
  }
}
