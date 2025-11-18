-- Migration: Add full_name column to usuarios table
-- Date: 2025-11-17
-- Description: Adds optional full_name field to store user's complete name

-- Add the full_name column
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Optional: Add comment to document the column
COMMENT ON COLUMN usuarios.full_name IS 'Nombre completo del usuario (opcional)';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name = 'full_name';
