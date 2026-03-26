// src/config/database.config.ts
//
// Factory de configuración de base de datos — namespace 'database'.
//
// Entornos:
//   Desarrollo  → DATABASE_URL apunta directo a PostgreSQL (puerto 5432)
//   Producción  → usar PgBouncer (puerto 6432) para connection pooling
//
// Uso:
//   const db = this.config.get<DatabaseConfig>('database')!;
//   console.log(db.logSlowQuery); // 500

import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  replicaUrl: string | undefined;
  poolMin: number;
  poolMax: number;
  queryTimeout: number; // ms — timeout por query
  logSlowQuery: number; // ms — loguear queries más lentas que esto
  ssl: boolean; // true en producción
}

export default registerAs('database', (): DatabaseConfig => {
  const url = process.env['DATABASE_URL'];

  if (!url) {
    throw new Error(
      'DATABASE_URL is required.\n' +
        'Format: postgresql://user:password@host:5432/dbname?schema=public',
    );
  }

  const isProd = process.env['NODE_ENV'] === 'production';

  return {
    url,
    replicaUrl: process.env['DATABASE_REPLICA_URL'],
    poolMin: parseInt(process.env['DB_POOL_MIN'] ?? '2', 10),
    poolMax: parseInt(process.env['DB_POOL_MAX'] ?? '10', 10),
    queryTimeout: parseInt(process.env['DB_QUERY_TIMEOUT_MS'] ?? '5000', 10),
    logSlowQuery: parseInt(process.env['DB_SLOW_QUERY_MS'] ?? '500', 10),
    ssl: isProd,
  };
});
