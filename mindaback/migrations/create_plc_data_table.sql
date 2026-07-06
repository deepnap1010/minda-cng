-- Migration: Create PLC Data table
-- This table stores PLC machine data with various force and production metrics

-- Check if table already exists, if so drop it first
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'plc_data' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.plc_data;
END

-- Create PLC Data table
CREATE TABLE dbo.plc_data (
    _id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    latch_force INT NULL,
    claw_force INT NULL,
    safety_lever INT NULL,
    claw_lever INT NULL,
    stroke INT NULL,
    production_count INT NULL,
    model NVARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Add indexes for better query performance
CREATE INDEX IX_plc_data_model ON dbo.plc_data(model);
CREATE INDEX IX_plc_data_created_at ON dbo.plc_data(created_at);

-- Add comment/description
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Table to store PLC machine data including force measurements, stroke, production count, and model information', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Latch force measurement value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'latch_force';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Claw force measurement value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'claw_force';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Safety lever measurement value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'safety_lever';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Claw lever measurement value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'claw_lever';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stroke measurement value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'stroke';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Production count value', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'production_count';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Model number/identifier', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'plc_data', 
    @level2type = N'COLUMN', @level2name = N'model';
