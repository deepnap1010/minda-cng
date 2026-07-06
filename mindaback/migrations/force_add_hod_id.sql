-- Force add hod_id column to users table (if it doesn't exist or needs to be recreated)
-- This script will safely add the column even if migration says it exists

-- Step 1: Drop index if exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_hod_id' AND object_id = OBJECT_ID('users'))
BEGIN
    DROP INDEX IX_users_hod_id ON users;
    PRINT 'Dropped existing index IX_users_hod_id';
END

-- Step 2: Drop foreign key constraint if exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_hod_id' AND parent_object_id = OBJECT_ID('users'))
BEGIN
    ALTER TABLE users DROP CONSTRAINT FK_users_hod_id;
    PRINT 'Dropped existing foreign key constraint FK_users_hod_id';
END

-- Step 3: Drop column if exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'hod_id')
BEGIN
    ALTER TABLE users DROP COLUMN hod_id;
    PRINT 'Dropped existing column hod_id';
END

-- Step 4: Add hod_id column
ALTER TABLE users
ADD hod_id UNIQUEIDENTIFIER NULL;
PRINT 'Added hod_id column';

-- Step 5: Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT FK_users_hod_id 
FOREIGN KEY (hod_id) 
REFERENCES users(_id) 
ON DELETE SET NULL;
PRINT 'Added foreign key constraint FK_users_hod_id';

-- Step 6: Add index
CREATE INDEX IX_users_hod_id ON users(hod_id);
PRINT 'Added index IX_users_hod_id';

PRINT 'Migration completed successfully!';
