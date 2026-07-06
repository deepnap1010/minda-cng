-- Add approve_quantity and reject_quantity to plc_products

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('plc_products') AND name = 'approve_quantity')
BEGIN
    ALTER TABLE dbo.plc_products ADD approve_quantity INT NULL DEFAULT 0;
    PRINT 'Added approve_quantity to plc_products';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('plc_products') AND name = 'reject_quantity')
BEGIN
    ALTER TABLE dbo.plc_products ADD reject_quantity INT NULL DEFAULT 0;
    PRINT 'Added reject_quantity to plc_products';
END
