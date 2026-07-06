-- Migration: Create plc_products table
-- Run this against your DB so Products API works.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'plc_products')
BEGIN
    CREATE TABLE dbo.plc_products (
        _id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        material_code NVARCHAR(255) NULL,
        material_description NVARCHAR(MAX) NULL,
        part_no NVARCHAR(255) NULL,
        model_code NVARCHAR(255) NULL,
        machine_name NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    PRINT 'Table plc_products created successfully';
END
ELSE
BEGIN
    PRINT 'Table plc_products already exists';
END
