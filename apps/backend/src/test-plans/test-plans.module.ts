import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestPlansController } from './test-plans.controller';
import { TestPlansService } from './test-plans.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestPlansController],
  providers: [TestPlansService],
  exports: [TestPlansService],
})
export class TestPlansModule {}
