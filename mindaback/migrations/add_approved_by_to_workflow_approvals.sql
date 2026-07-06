-- Migration: Add approved_by column to workflow_approvals table
-- Date: 2026-01-24

-- Check if column already exists and drop if needed (for re-running)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]') AND name = 'approved_by')
BEGIN
    -- Drop index if exists
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_workflow_approvals_approved_by' AND object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]'))
    BEGIN
        DROP INDEX IX_workflow_approvals_approved_by ON [minda].[dbo].[workflow_approvals];
    END
    
    -- Drop foreign key constraint if exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_workflow_approvals_approved_by' AND parent_object_id = OBJECT_ID('[minda].[dbo].[workflow_approvals]'))
    BEGIN
        ALTER TABLE [minda].[dbo].[workflow_approvals] DROP CONSTRAINT FK_workflow_approvals_approved_by;
    END
    
    -- Drop column
    ALTER TABLE [minda].[dbo].[workflow_approvals] DROP COLUMN approved_by;
END

-- Add approved_by column to workflow_approvals table
ALTER TABLE [minda].[dbo].[workflow_approvals]
ADD approved_by UNIQUEIDENTIFIER NULL;

-- Add foreign key constraint referencing users table
ALTER TABLE [minda].[dbo].[workflow_approvals]
ADD CONSTRAINT FK_workflow_approvals_approved_by 
FOREIGN KEY (approved_by) 
REFERENCES [minda].[dbo].[users](_id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IX_workflow_approvals_approved_by ON [minda].[dbo].[workflow_approvals](approved_by);
