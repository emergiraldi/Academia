-- Migration: Add Mercado Pago fields to bank_accounts table
-- Date: 2026-01-19
-- Description: Adds pix_provedor and Mercado Pago credentials fields to support multiple PIX providers

-- Check if columns already exist before adding
SET @dbname = DATABASE();
SET @tablename = "bank_accounts";

-- Add pix_provedor column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'pix_provedor'
);

SET @query = IF(@col_exists = 0,
  'ALTER TABLE bank_accounts ADD COLUMN pix_provedor VARCHAR(50) DEFAULT ''sicoob'' COMMENT ''Provedor PIX: sicoob, mercadopago, efi''',
  'SELECT ''Column pix_provedor already exists'' AS Status'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add mp_access_token column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'mp_access_token'
);

SET @query = IF(@col_exists = 0,
  'ALTER TABLE bank_accounts ADD COLUMN mp_access_token VARCHAR(500) COMMENT ''Mercado Pago Access Token''',
  'SELECT ''Column mp_access_token already exists'' AS Status'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add mp_public_key column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'mp_public_key'
);

SET @query = IF(@col_exists = 0,
  'ALTER TABLE bank_accounts ADD COLUMN mp_public_key VARCHAR(500) COMMENT ''Mercado Pago Public Key''',
  'SELECT ''Column mp_public_key already exists'' AS Status'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to have pix_provedor = 'sicoob' if NULL
UPDATE bank_accounts
SET pix_provedor = 'sicoob'
WHERE pix_provedor IS NULL OR pix_provedor = '';

SELECT 'Migration completed successfully!' AS Status;
