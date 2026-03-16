import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';

@Module({
  imports: [PrismaModule, TestCasesModule],
  controllers: [TestResultsController],
  providers: [TestResultsService],
  exports: [TestResultsService],
})
export class TestResultsModule {}
