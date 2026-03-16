import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';
import { CsvService } from './csv.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestCasesController],
  providers: [TestCasesService, CsvService],
  exports: [TestCasesService, CsvService],
})
export class TestCasesModule {}
