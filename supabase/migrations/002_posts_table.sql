-- Posts table for social media content management
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'whatsapp')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'rejected', 'approved', 'published')) DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approval_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can SELECT posts in their organization
CREATE POLICY "Users can view posts in their organization"
    ON posts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR
        -- Also allow viewing if user has no organization (for testing)
        created_by = auth.uid()
    );

-- Policy: Users can INSERT posts for their organization
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
    );

-- Policy: Users can UPDATE their own posts only when status = 'draft'
CREATE POLICY "Users can update own draft posts"
    ON posts FOR UPDATE
    USING (
        created_by = auth.uid()
        AND status = 'draft'
    )
    WITH CHECK (
        created_by = auth.uid()
        AND status IN ('draft', 'pending_approval')
    );

-- Policy: Managers and super_admins can update any post status
CREATE POLICY "Managers can update post status"
    ON posts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'super_admin')
        )
    );

-- Policy: Users can delete their own draft posts
CREATE POLICY "Users can delete own draft posts"
    ON posts FOR DELETE
    USING (
        created_by = auth.uid()
        AND status = 'draft'
    );

-- Updated_at trigger
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for common queries
CREATE INDEX posts_organization_id_idx ON posts(organization_id);
CREATE INDEX posts_created_by_idx ON posts(created_by);
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_scheduled_date_idx ON posts(scheduled_date);
