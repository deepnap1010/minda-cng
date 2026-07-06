-- Migration: Add assigned_users column to template_masters table
-- This allows storing multiple assigned users as JSON array

-- Check if column already exists, if so drop it first
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.template_masters') AND name = 'assigned_users')
BEGIN
    ALTER TABLE dbo.template_masters DROP COLUMN assigned_users;
END

-- Add assigned_users column to template_masters table
ALTER TABLE dbo.template_masters
ADD assigned_users NVARCHAR(MAX) NULL;

-- Add comment/description
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'JSON array of assigned user IDs for multiple user assignment', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'template_masters', 
    @level2type = N'COLUMN', @level2name = N'assigned_users';
