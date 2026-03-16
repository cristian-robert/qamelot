import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TestSuitesModule } from './test-suites/test-suites.module';
import { MilestonesModule } from './milestones/milestones.module';
import { DefectsModule } from './defects/defects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TestSuitesModule,
    MilestonesModule,
    DefectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
