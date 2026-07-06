-- Verify hod_id column exists in users table
-- Run this to check if the column exists

-- Check if column exists
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME = 'hod_id';

-- Check if foreign key constraint exists
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTableName,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumnName
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc ON fk.object_id = fc.constraint_object_id
WHERE fk.name = 'FK_users_hod_id';

-- Check if index exists
SELECT 
    i.name AS IndexName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.object_id = OBJECT_ID('users')
AND i.name = 'IX_users_hod_id';
