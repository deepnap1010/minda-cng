-- Verify approved_by column exists in workflow_approvals table
-- Run this after migration to confirm the column was added

-- Check if column exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]') AND name = 'approved_by')
BEGIN
    PRINT '✓ Column approved_by exists in workflow_approvals table';
    
    -- Show column details
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME = 'workflow_approvals'
    AND COLUMN_NAME = 'approved_by';
END
ELSE
BEGIN
    PRINT '✗ Column approved_by does NOT exist in workflow_approvals table';
END

-- Check if foreign key exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_workflow_approvals_approved_by' AND parent_object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]'))
BEGIN
    PRINT '✓ Foreign key FK_workflow_approvals_approved_by exists';
END
ELSE
BEGIN
    PRINT '✗ Foreign key FK_workflow_approvals_approved_by does NOT exist';
END

-- Check if index exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_workflow_approvals_approved_by' AND object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]'))
BEGIN
    PRINT '✓ Index IX_workflow_approvals_approved_by exists';
END
ELSE
BEGIN
    PRINT '✗ Index IX_workflow_approvals_approved_by does NOT exist';
END
