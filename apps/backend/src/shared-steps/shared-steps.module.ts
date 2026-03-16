import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedStepsController } from './shared-steps.controller';
import { SharedStepsService } from './shared-steps.service';

@Module({
  imports: [PrismaModule],
  controllers: [SharedStepsController],
  providers: [SharedStepsService],
  exports: [SharedStepsService],
})
export class SharedStepsModule {}
