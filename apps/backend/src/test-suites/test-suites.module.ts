import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesService } from './test-suites.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestSuitesController],
  providers: [TestSuitesService],
  exports: [TestSuitesService],
})
export class TestSuitesModule {}
