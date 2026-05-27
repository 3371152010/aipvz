import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LevelModule } from './modules/level/level.module';
import { BattleModule } from './modules/level/battle.module';
import { ShopModule } from './modules/shop/shop.module';
import { RankModule } from './modules/rank/rank.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    LevelModule,
    BattleModule,
    ShopModule,
    RankModule,
  ],
})
export class AppModule {}
