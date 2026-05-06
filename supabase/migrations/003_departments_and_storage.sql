-- =============================================
-- 1. DEPARTMENTS TABLE
-- =============================================

-- Create departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policies for departments
CREATE POLICY "Users can view departments in their organization"
    ON departments FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR organization_id IS NULL
    );

CREATE POLICY "Managers can create departments"
    ON departments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'super_admin')
        )
    );

CREATE POLICY "Managers can update departments"
    ON departments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'super_admin')
        )
    );

CREATE POLICY "Managers can delete non-default departments"
    ON departments FOR DELETE
    USING (
        is_default = FALSE
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'super_admin')
        )
    );

-- Updated_at trigger
CREATE TRIGGER departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX departments_organization_id_idx ON departments(organization_id);

-- =============================================
-- 2. UPDATE POSTS TABLE
-- =============================================

-- Add department_id column to posts (nullable for backward compatibility)
ALTER TABLE posts ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Create index for department_id
CREATE INDEX posts_department_id_idx ON posts(department_id);

-- =============================================
-- 3. STORAGE POLICIES FOR post-attachments BUCKET
-- =============================================

-- Note: Run these in Supabase Dashboard SQL Editor if bucket policies need updating
-- The bucket should already exist. These policies allow authenticated users to upload/read.

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-attachments');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-attachments');

-- Allow users to update their own files
CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
