-- Migration: Add hod_id column to users table
-- Date: 2025-01-21

-- Check if column already exists and drop if needed (for re-running)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'hod_id')
BEGIN
    -- Drop index if exists
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_hod_id' AND object_id = OBJECT_ID('users'))
    BEGIN
        DROP INDEX IX_users_hod_id ON users;
    END
    
    -- Drop foreign key constraint if exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_hod_id' AND parent_object_id = OBJECT_ID('users'))
    BEGIN
        ALTER TABLE users DROP CONSTRAINT FK_users_hod_id;
    END
    
    -- Drop column
    ALTER TABLE users DROP COLUMN hod_id;
END

-- Add hod_id column to users table
ALTER TABLE users
ADD hod_id UNIQUEIDENTIFIER NULL;

-- Add foreign key constraint referencing users table (self-referencing)
ALTER TABLE users
ADD CONSTRAINT FK_users_hod_id 
FOREIGN KEY (hod_id) 
REFERENCES users(_id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IX_users_hod_id ON users(hod_id);
