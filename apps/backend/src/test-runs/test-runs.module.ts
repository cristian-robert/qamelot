import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestRunsController],
  providers: [TestRunsService],
  exports: [TestRunsService],
})
export class TestRunsModule {}
