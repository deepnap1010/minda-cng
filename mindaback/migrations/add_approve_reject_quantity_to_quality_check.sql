-- Add approve_quantity and reject_quantity to quality_check

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('quality_check') AND name = 'approve_quantity')
BEGIN
    ALTER TABLE dbo.quality_check ADD approve_quantity INT NULL DEFAULT 0;
    PRINT 'Added approve_quantity to quality_check';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('quality_check') AND name = 'reject_quantity')
BEGIN
    ALTER TABLE dbo.quality_check ADD reject_quantity INT NULL DEFAULT 0;
    PRINT 'Added reject_quantity to quality_check';
END
