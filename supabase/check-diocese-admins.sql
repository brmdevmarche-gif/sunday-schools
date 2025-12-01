-- Quick check if diocese_admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'diocese_admins'
) AS table_exists;
