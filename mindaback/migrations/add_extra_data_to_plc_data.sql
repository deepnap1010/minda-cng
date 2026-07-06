-- Migration: Add extra_data column to plc_data for dynamic fields
-- Kitni bhi fields aaye (50, 100, etc.) sab automatically store hongi

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.plc_data') AND name = 'extra_data')
BEGIN
    ALTER TABLE dbo.plc_data ADD extra_data NVARCHAR(MAX) NULL;
    
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'JSON - Dynamic PLC fields, any number of fields stored here', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'plc_data', 
        @level2type = N'COLUMN', @level2name = N'extra_data';
END
GO
