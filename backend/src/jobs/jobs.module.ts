// src/jobs/jobs.module.ts
//
// Módulo que registra todos los processors BullMQ.
// Importar en AppModule para que NestJS los detecte.
//
// Queues registradas:
//   pr-check      → PrCheckProcessor     (detectar PRs por set)
//   ai-recommend  → AiRecommendProcessor (sugerencia de sobrecarga IA)
//   volume-agg    → VolumeAggProcessor   (acumular volumen semanal)

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrCheckProcessor } from './pr-checker.processor';
import { AiRecommendProcessor } from './ai-recommend.processor';
import { VolumeAggProcessor } from './volume-agg.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'pr-check' },
      { name: 'ai-recommend' },
      { name: 'volume-agg' },
    ),
  ],
  providers: [PrCheckProcessor, AiRecommendProcessor, VolumeAggProcessor],
})
export class JobsModule {}
