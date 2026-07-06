-- ============================================================================
-- CNG Cylinder + SAP-ingest tables — for PRODUCTION (database JPMDO)
-- Deepnap Softech | CNG Cylinder Process Tracking for JP Minda Group
--
-- HOW TO RUN: SSMS -> connect to production -> New Query -> select JPMDO
--             -> paste this whole file -> Execute (F5).
--
-- SAFE + IDEMPOTENT: creates ONLY tables/indexes that don't exist yet.
-- Never alters, drops, or touches any existing table or foreign key.
-- Matches src/models/cng.model.js + src/models/sap.model.js exactly.
--
-- NOTE: JSON-bag columns are NVARCHAR(MAX) — works on every SQL Server
-- version; the app reads/writes JSON strings through tedious either way,
-- and JSON_VALUE()/OPENJSON() work on NVARCHAR content directly.
-- ============================================================================
USE [JPMDO];
GO
-- Safety guard: abort the ENTIRE script if we are not in JPMDO (e.g. USE failed
-- and SSMS fell back to the login's default database).
IF DB_NAME() <> N'JPMDO' THROW 50000, N'Wrong database context — expected JPMDO. Nothing was created.', 1;
SET NOCOUNT ON;

------------------------------------------------------------------------------
-- 1) cng_cylinder — one row per physical cylinder (identity = pipe_id)
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_cylinder', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_cylinder (
    _id                CHAR(36)        NOT NULL CONSTRAINT DF_cng_cylinder__id DEFAULT (NEWID()),
    pipe_id            NVARCHAR(120)   NOT NULL,
    status             NVARCHAR(40)    NOT NULL CONSTRAINT DF_cng_cylinder_status DEFAULT (N'in_process'),
    current_stage_no   INT             NULL,
    current_machine_id NVARCHAR(120)   NULL,
    latest_data        NVARCHAR(MAX)   NULL,
    started_at         DATETIMEOFFSET  NULL,
    completed_at       DATETIMEOFFSET  NULL,
    created_at         DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_cylinder_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at         DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_cylinder_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_cylinder PRIMARY KEY (_id),
    CONSTRAINT UQ_cng_cylinder_pipe_id UNIQUE (pipe_id)
  );
  PRINT 'created: cng_cylinder';
END
ELSE PRINT 'exists:  cng_cylinder';

------------------------------------------------------------------------------
-- 2) cng_machine — one row per machine; one machine feeds one stage
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_machine', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_machine (
    _id              CHAR(36)        NOT NULL CONSTRAINT DF_cng_machine__id DEFAULT (NEWID()),
    machine_id       NVARCHAR(120)   NOT NULL,
    name             NVARCHAR(160)   NULL,
    machine_type     NVARCHAR(120)   NULL,
    dialect          NVARCHAR(20)    NULL,
    stage_no         INT             NULL,
    status           NVARCHAR(40)    NOT NULL CONSTRAINT DF_cng_machine_status DEFAULT (N'unknown'),
    active_pipe_id   NVARCHAR(120)   NULL,
    operator_user_id NVARCHAR(120)   NULL,
    metrics_seen     NVARCHAR(MAX)   NULL,
    thresholds       NVARCHAR(MAX)   NULL,
    line             NVARCHAR(80)    NULL,
    latest_data      NVARCHAR(MAX)   NULL,
    gauges           NVARCHAR(MAX)   NULL,
    primary_label    NVARCHAR(120)   NULL,
    primary_value    FLOAT           NULL,
    primary_unit     NVARCHAR(40)    NULL,
    last_seen_at     DATETIMEOFFSET  NULL,
    created_at       DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_machine_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at       DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_machine_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_machine PRIMARY KEY (_id),
    CONSTRAINT UQ_cng_machine_machine_id UNIQUE (machine_id)
  );
  PRINT 'created: cng_machine';
END
ELSE PRINT 'exists:  cng_machine';

------------------------------------------------------------------------------
-- 3) cng_stage_record — normalized per-(pipe x stage) event (dashboards read this)
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_stage_record', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_stage_record (
    _id            CHAR(36)        NOT NULL CONSTRAINT DF_cng_stage_record__id DEFAULT (NEWID()),
    pipe_id        NVARCHAR(120)   NOT NULL,
    stage_no       INT             NOT NULL,
    stage_name     NVARCHAR(120)   NULL,
    machine_id     NVARCHAR(120)   NULL,
    status         NVARCHAR(40)    NOT NULL CONSTRAINT DF_cng_stage_record_status DEFAULT (N'ok'),
    headline_label NVARCHAR(120)   NULL,
    headline_value FLOAT           NULL,
    metrics        NVARCHAR(MAX)   NULL,
    deviations     NVARCHAR(MAX)   NULL,
    flags          NVARCHAR(MAX)   NULL,
    reading_id     NVARCHAR(60)    NULL,
    source         NVARCHAR(30)    NOT NULL CONSTRAINT DF_cng_stage_record_source DEFAULT (N'ingest'),
    entered_by     NVARCHAR(120)   NULL,
    recorded_at    DATETIMEOFFSET  NULL,
    created_at     DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_stage_record_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at     DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_stage_record_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_stage_record PRIMARY KEY (_id)
  );
  PRINT 'created: cng_stage_record';
END
ELSE PRINT 'exists:  cng_stage_record';

------------------------------------------------------------------------------
-- 4) cng_production_run — scan-in bridge: which cylinder is on which machine
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_production_run', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_production_run (
    _id        CHAR(36)        NOT NULL CONSTRAINT DF_cng_production_run__id DEFAULT (NEWID()),
    pipe_id    NVARCHAR(120)   NOT NULL,
    machine_id NVARCHAR(120)   NOT NULL,
    stage_no   INT             NULL,
    active     BIT             NOT NULL CONSTRAINT DF_cng_production_run_active DEFAULT (1),
    started_at DATETIMEOFFSET  NULL,
    ended_at   DATETIMEOFFSET  NULL,
    started_by NVARCHAR(120)   NULL,
    created_at DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_production_run_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_production_run_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_production_run PRIMARY KEY (_id)
  );
  PRINT 'created: cng_production_run';
END
ELSE PRINT 'exists:  cng_production_run';

------------------------------------------------------------------------------
-- 5) cng_defect — rejections / faults / out-of-spec, tied to a pipe_id
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_defect', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_defect (
    _id         CHAR(36)        NOT NULL CONSTRAINT DF_cng_defect__id DEFAULT (NEWID()),
    pipe_id     NVARCHAR(120)   NOT NULL,
    stage_no    INT             NULL,
    machine_id  NVARCHAR(120)   NULL,
    type        NVARCHAR(40)    NULL,
    field       NVARCHAR(120)   NULL,
    value       FLOAT           NULL,
    message     NVARCHAR(400)   NULL,
    resolved    BIT             NOT NULL CONSTRAINT DF_cng_defect_resolved DEFAULT (0),
    detected_at DATETIMEOFFSET  NULL,
    created_at  DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_defect_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at  DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_defect_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_defect PRIMARY KEY (_id)
  );
  PRINT 'created: cng_defect';
END
ELSE PRINT 'exists:  cng_defect';

------------------------------------------------------------------------------
-- 6) cng_ingest_key — hashed x-api-keys for POST /api/v1/cng/ingest
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cng_ingest_key', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cng_ingest_key (
    _id          CHAR(36)        NOT NULL CONSTRAINT DF_cng_ingest_key__id DEFAULT (NEWID()),
    key_hash     NVARCHAR(120)   NOT NULL,
    label        NVARCHAR(120)   NULL,
    active       BIT             NOT NULL CONSTRAINT DF_cng_ingest_key_active DEFAULT (1),
    last_used_at DATETIMEOFFSET  NULL,
    created_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_ingest_key_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_cng_ingest_key_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_cng_ingest_key PRIMARY KEY (_id),
    CONSTRAINT UQ_cng_ingest_key_key_hash UNIQUE (key_hash)
  );
  PRINT 'created: cng_ingest_key';
END
ELSE PRINT 'exists:  cng_ingest_key';

------------------------------------------------------------------------------
-- 7) sap_inbox — verbatim store of whatever SAP/PLC pushes to /api/v1/sap/ingest
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sap_inbox', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sap_inbox (
    _id          CHAR(36)        NOT NULL CONSTRAINT DF_sap_inbox__id DEFAULT (NEWID()),
    doc_type     NVARCHAR(120)   NULL,
    source_ref   NVARCHAR(255)   NULL,
    raw_payload  NVARCHAR(MAX)   NULL,
    headers      NVARCHAR(MAX)   NULL,
    content_type NVARCHAR(120)   NULL,
    source_ip    NVARCHAR(60)    NULL,
    flags        NVARCHAR(MAX)   NULL,
    processed    BIT             NOT NULL CONSTRAINT DF_sap_inbox_processed DEFAULT (0),
    received_at  DATETIMEOFFSET  NULL,
    created_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sap_inbox_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sap_inbox_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_sap_inbox PRIMARY KEY (_id)
  );
  PRINT 'created: sap_inbox';
END
ELSE PRINT 'exists:  sap_inbox';

------------------------------------------------------------------------------
-- 8) sap_ingest_key — hashed x-api-keys for POST /api/v1/sap/ingest
------------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sap_ingest_key', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sap_ingest_key (
    _id          CHAR(36)        NOT NULL CONSTRAINT DF_sap_ingest_key__id DEFAULT (NEWID()),
    key_hash     NVARCHAR(120)   NOT NULL,
    label        NVARCHAR(120)   NULL,
    active       BIT             NOT NULL CONSTRAINT DF_sap_ingest_key_active DEFAULT (1),
    last_used_at DATETIMEOFFSET  NULL,
    created_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sap_ingest_key_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at   DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sap_ingest_key_updated DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_sap_ingest_key PRIMARY KEY (_id),
    CONSTRAINT UQ_sap_ingest_key_key_hash UNIQUE (key_hash)
  );
  PRINT 'created: sap_ingest_key';
END
ELSE PRINT 'exists:  sap_ingest_key';

------------------------------------------------------------------------------
-- Performance indexes (same set as scripts/add-cng-performance-indexes.js)
------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_stage_record_pipe_recorded' AND object_id = OBJECT_ID(N'dbo.cng_stage_record'))
  CREATE INDEX IX_cng_stage_record_pipe_recorded ON dbo.cng_stage_record (pipe_id, recorded_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_stage_record_machine_recorded' AND object_id = OBJECT_ID(N'dbo.cng_stage_record'))
  CREATE INDEX IX_cng_stage_record_machine_recorded ON dbo.cng_stage_record (machine_id, recorded_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_stage_record_stage' AND object_id = OBJECT_ID(N'dbo.cng_stage_record'))
  CREATE INDEX IX_cng_stage_record_stage ON dbo.cng_stage_record (stage_no);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_defect_pipe' AND object_id = OBJECT_ID(N'dbo.cng_defect'))
  CREATE INDEX IX_cng_defect_pipe ON dbo.cng_defect (pipe_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_defect_resolved_detected' AND object_id = OBJECT_ID(N'dbo.cng_defect'))
  CREATE INDEX IX_cng_defect_resolved_detected ON dbo.cng_defect (resolved, detected_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_production_run_machine_active' AND object_id = OBJECT_ID(N'dbo.cng_production_run'))
  CREATE INDEX IX_cng_production_run_machine_active ON dbo.cng_production_run (machine_id, active);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_production_run_pipe' AND object_id = OBJECT_ID(N'dbo.cng_production_run'))
  CREATE INDEX IX_cng_production_run_pipe ON dbo.cng_production_run (pipe_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_cylinder_status' AND object_id = OBJECT_ID(N'dbo.cng_cylinder'))
  CREATE INDEX IX_cng_cylinder_status ON dbo.cng_cylinder (status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_machine_stage' AND object_id = OBJECT_ID(N'dbo.cng_machine'))
  CREATE INDEX IX_cng_machine_stage ON dbo.cng_machine (stage_no);
-- Keyset cursors for the outbound /sync/cylinders + /sync/stage-records pull feed
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_stage_record_created_id' AND object_id = OBJECT_ID(N'dbo.cng_stage_record'))
  CREATE INDEX IX_cng_stage_record_created_id ON dbo.cng_stage_record (created_at, _id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cng_cylinder_updated_id' AND object_id = OBJECT_ID(N'dbo.cng_cylinder'))
  CREATE INDEX IX_cng_cylinder_updated_id ON dbo.cng_cylinder (updated_at, _id);
PRINT 'indexes: ensured';

------------------------------------------------------------------------------
-- Verify: list the tables this script manages
------------------------------------------------------------------------------
SELECT t.name AS table_name, p.rows AS row_count
FROM sys.tables t
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
WHERE t.name IN ('cng_cylinder','cng_machine','cng_stage_record','cng_production_run',
                 'cng_defect','cng_ingest_key','sap_inbox','sap_ingest_key')
ORDER BY t.name;
