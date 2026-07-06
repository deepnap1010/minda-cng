-- Migration: Add assigned_user column to template_masters table
-- Date: 2025-01-21

-- Check if column already exists and drop if needed (for re-running)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.template_masters') AND name = 'assigned_user')
BEGIN
    -- Drop index if exists
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_template_masters_assigned_user' AND object_id = OBJECT_ID('dbo.template_masters'))
    BEGIN
        DROP INDEX IX_template_masters_assigned_user ON dbo.template_masters;
    END
    
    -- Drop foreign key constraint if exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_template_masters_assigned_user' AND parent_object_id = OBJECT_ID('dbo.template_masters'))
    BEGIN
        ALTER TABLE dbo.template_masters DROP CONSTRAINT FK_template_masters_assigned_user;
    END
    
    -- Drop column
    ALTER TABLE dbo.template_masters DROP COLUMN assigned_user;
END

-- Add assigned_user column to template_masters table
ALTER TABLE dbo.template_masters
ADD assigned_user UNIQUEIDENTIFIER NULL;

-- Add foreign key constraint referencing users table
ALTER TABLE dbo.template_masters
ADD CONSTRAINT FK_template_masters_assigned_user 
FOREIGN KEY (assigned_user) 
REFERENCES dbo.users(_id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IX_template_masters_assigned_user ON dbo.template_masters(assigned_user);
