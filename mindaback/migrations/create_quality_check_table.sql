-- Migration: Create quality_check table for QC records

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quality_check')
BEGIN
    CREATE TABLE dbo.quality_check (
        _id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        machine_name NVARCHAR(255) NULL,
        product_name NVARCHAR(255) NULL,
        part_number NVARCHAR(255) NULL,
        company_name NVARCHAR(255) NULL,
        plant_name NVARCHAR(255) NULL,
        status NVARCHAR(50) NULL,
        remarks NVARCHAR(MAX) NULL,
        checked_by NVARCHAR(255) NULL,
        checked_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    PRINT 'Table quality_check created successfully';
END
ELSE
BEGIN
    PRINT 'Table quality_check already exists';
END
