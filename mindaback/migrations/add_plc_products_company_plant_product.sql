-- Add company_name, plant_name, product_name to plc_products

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('plc_products') AND name = 'company_name')
BEGIN
    ALTER TABLE dbo.plc_products ADD company_name NVARCHAR(255) NULL;
    PRINT 'Added company_name to plc_products';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('plc_products') AND name = 'plant_name')
BEGIN
    ALTER TABLE dbo.plc_products ADD plant_name NVARCHAR(255) NULL;
    PRINT 'Added plant_name to plc_products';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('plc_products') AND name = 'product_name')
BEGIN
    ALTER TABLE dbo.plc_products ADD product_name NVARCHAR(255) NULL;
    PRINT 'Added product_name to plc_products';
END
