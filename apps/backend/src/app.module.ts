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
import { TestResultsModule } from './test-results/test-results.module';
import { RunEventsModule } from './run-events/run-events.module';
import { MilestonesModule } from './milestones/milestones.module';
import { DefectsModule } from './defects/defects.module';
import { ReportsModule } from './reports/reports.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SharedStepsModule } from './shared-steps/shared-steps.module';
import { ConfigsModule } from './configs/configs.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RunEventsModule,
    AuthModule,
    ProjectsModule,
    TestSuitesModule,
    TestCasesModule,
    TestPlansModule,
    TestRunsModule,
    TestResultsModule,
    MilestonesModule,
    DefectsModule,
    ReportsModule,
    AttachmentsModule,
    SharedStepsModule,
    ConfigsModule,
    CustomFieldsModule,
    ApiKeysModule,
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
