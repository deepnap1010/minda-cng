-- Migration: Add workflow_id column to template_masters table
-- Date: 2025-01-23

-- Check if column already exists and drop if needed (for re-running)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.template_masters') AND name = 'workflow_id')
BEGIN
    -- Drop index if exists
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_template_masters_workflow_id' AND object_id = OBJECT_ID('dbo.template_masters'))
    BEGIN
        DROP INDEX IX_template_masters_workflow_id ON dbo.template_masters;
    END
    
    -- Drop foreign key constraint if exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_template_masters_workflow_id' AND parent_object_id = OBJECT_ID('dbo.template_masters'))
    BEGIN
        ALTER TABLE dbo.template_masters DROP CONSTRAINT FK_template_masters_workflow_id;
    END
    
    -- Drop column
    ALTER TABLE dbo.template_masters DROP COLUMN workflow_id;
END

-- Add workflow_id column to template_masters table
ALTER TABLE dbo.template_masters
ADD workflow_id UNIQUEIDENTIFIER NULL;

-- Add foreign key constraint referencing workflows table
ALTER TABLE dbo.template_masters
ADD CONSTRAINT FK_template_masters_workflow_id 
FOREIGN KEY (workflow_id) 
REFERENCES dbo.workflows(_id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IX_template_masters_workflow_id ON dbo.template_masters(workflow_id);
