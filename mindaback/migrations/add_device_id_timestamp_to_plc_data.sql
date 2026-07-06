-- Migration: Add device_id and timestamp columns to PLC Data table

-- Add device_id column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.plc_data') 
    AND name = 'device_id'
)
BEGIN
    ALTER TABLE dbo.plc_data
    ADD device_id NVARCHAR(255) NULL;
    
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Device identifier (e.g., CJ2M_01)', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'plc_data', 
        @level2type = N'COLUMN', @level2name = N'device_id';
END

-- Add timestamp column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.plc_data') 
    AND name = 'timestamp'
)
BEGIN
    ALTER TABLE dbo.plc_data
    ADD timestamp DATETIME2 NULL;
    
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Timestamp from the device when data was recorded', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'plc_data', 
        @level2type = N'COLUMN', @level2name = N'timestamp';
END

-- Add index on device_id for better query performance
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_plc_data_device_id' 
    AND object_id = OBJECT_ID(N'dbo.plc_data')
)
BEGIN
    CREATE INDEX IX_plc_data_device_id ON dbo.plc_data(device_id);
END

-- Add index on timestamp for better query performance
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_plc_data_timestamp' 
    AND object_id = OBJECT_ID(N'dbo.plc_data')
)
BEGIN
    CREATE INDEX IX_plc_data_timestamp ON dbo.plc_data(timestamp);
END
