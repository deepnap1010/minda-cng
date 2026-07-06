-- Migration: Add company_name, plant_name, line_number, start_time, stop_time, status to plc_data
-- Run this against your DB so GET /api/v1/plc-data and POST work with the new payload.

-- company_name
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'company_name')
BEGIN
    ALTER TABLE dbo.plc_data ADD company_name NVARCHAR(255) NULL;
END

-- plant_name
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'plant_name')
BEGIN
    ALTER TABLE dbo.plc_data ADD plant_name NVARCHAR(255) NULL;
END

-- line_number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'line_number')
BEGIN
    ALTER TABLE dbo.plc_data ADD line_number NVARCHAR(50) NULL;
END

-- start_time
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'start_time')
BEGIN
    ALTER TABLE dbo.plc_data ADD start_time DATETIME2 NULL;
END

-- stop_time
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'stop_time')
BEGIN
    ALTER TABLE dbo.plc_data ADD stop_time DATETIME2 NULL;
END

-- status (e.g. Running, Stopped)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'status')
BEGIN
    ALTER TABLE dbo.plc_data ADD status NVARCHAR(255) NULL;
END
