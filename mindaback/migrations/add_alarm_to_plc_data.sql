-- Migration: Add alarm column to plc_data table
-- Run this against your SQL Server database to add the alarm column used by the backend.

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.plc_data')
      AND name = 'alarm'
)
BEGIN
    ALTER TABLE dbo.plc_data
    ADD alarm NVARCHAR(255) NULL;

    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Alarm string/value reported by PLC', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'plc_data', 
        @level2type = N'COLUMN', @level2name = N'alarm';
END

