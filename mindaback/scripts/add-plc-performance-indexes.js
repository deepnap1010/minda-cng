/**
 * Add performance indexes to plc_data so reports / stoppage / dashboard queries
 * use index seeks instead of scanning the whole (millions-of-rows) table.
 *
 * Safe & idempotent — skips any index that already exists.
 * Run: node scripts/add-plc-performance-indexes.js
 *   or: npm run add-plc-indexes
 */
import { sequelize } from '../src/sequelize.js';

// Columns verified against src/models/plcData.model.js
const indexes = [
  {
    // CTE queries PARTITION BY device_id ORDER BY timestamp (downtime, time-distribution, stoppage)
    name: 'idx_plc_device_timestamp',
    cols: 'device_id, timestamp',
  },
  {
    // date-range filtering + ordering by timestamp
    name: 'idx_plc_timestamp',
    cols: 'timestamp',
  },
  {
    // stoppage / error queries filter by status then time
    name: 'idx_plc_status_timestamp',
    cols: 'status, timestamp',
  },
  {
    // report listing orders by created_at
    name: 'idx_plc_created_at',
    cols: 'created_at',
  },
  {
    // company/plant filters combined with a date range
    name: 'idx_plc_company_plant_timestamp',
    cols: 'company_name, plant_name, timestamp',
  },
  {
    // stoppage CTE partitions by device_id and filters/orders by start_time
    name: 'idx_plc_device_starttime',
    cols: 'device_id, start_time',
  },
];

async function run() {
  console.log('Creating PLC performance indexes (idempotent)...');
  for (const idx of indexes) {
    try {
      await sequelize.query(
        `IF NOT EXISTS (
           SELECT 1 FROM sys.indexes
           WHERE name = '${idx.name}' AND object_id = OBJECT_ID('plc_data')
         )
         CREATE INDEX ${idx.name} ON plc_data (${idx.cols});`
      );
      console.log(`  OK  ${idx.name} (${idx.cols})`);
    } catch (err) {
      console.error(`  FAIL ${idx.name}: ${err.message}`);
    }
  }
  await sequelize.close();
  console.log('Done. Re-run anytime — existing indexes are skipped.');
}

run();
