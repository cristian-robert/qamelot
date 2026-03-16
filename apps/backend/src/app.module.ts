import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TestSuitesModule } from './test-suites/test-suites.module';
import { TestPlansModule } from './test-plans/test-plans.module';
import { TestRunsModule } from './test-runs/test-runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TestSuitesModule,
    TestPlansModule,
    TestRunsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
