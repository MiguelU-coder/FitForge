// src/modules/ai-bridge/ai-bridge.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiBridgeService } from './ai-bridge.service';
import { AiBridgeController } from './ai-bridge.controller';
import { ExerciseSelectionService } from '../routines/services/exercise-selection.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  controllers: [AiBridgeController],
  providers: [AiBridgeService, ExerciseSelectionService],
  exports: [AiBridgeService],
})
export class AiBridgeModule {}

export * from './ai-bridge.service';
export * from './ai-bridge.controller';
export * from './dto/ai-request.dto';
