-- Allow public read access (SELECT) to core tables for the mobile app
-- This is necessary because the mobile app accesses data as an anonymous user (public role)

-- Circuits
DROP POLICY IF EXISTS "Public circuits read access" ON circuits;
CREATE POLICY "Public circuits read access" ON circuits FOR SELECT USING (true);

-- Stages
DROP POLICY IF EXISTS "Public stages read access" ON stages;
CREATE POLICY "Public stages read access" ON stages FOR SELECT USING (true);

-- Teams (Required for Rankings)
DROP POLICY IF EXISTS "Public teams read access" ON teams;
CREATE POLICY "Public teams read access" ON teams FOR SELECT USING (true);

-- Results (Required for Rankings)
DROP POLICY IF EXISTS "Public results read access" ON results;
CREATE POLICY "Public results read access" ON results FOR SELECT USING (true);

-- Company Settings (Fallback)
DROP POLICY IF EXISTS "Public company_settings read access" ON company_settings;
CREATE POLICY "Public company_settings read access" ON company_settings FOR SELECT USING (true);

-- Enable RLS on tables if not already enabled (Safety check)
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
