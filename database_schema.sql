-- Database Schema for Blog Registration System
-- This file contains the complete database schema including invite codes functionality

-- Table: users
-- Stores user account information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name_ar VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: settings
-- Stores user blog settings and profile information
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blog_title VARCHAR(200),
    blog_description TEXT,
    about_text TEXT,
    contact_info TEXT,
    email VARCHAR(255),
    profile_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: posts
-- Stores blog posts with approval workflow
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'published', 'rejected', 'draft'
    rejection_reason TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: blog_requests
-- Stores blog creation requests from users
CREATE TABLE IF NOT EXISTS blog_requests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    experience_years INTEGER NOT NULL,
    sample_title VARCHAR(255) NOT NULL,
    sample_content TEXT NOT NULL,
    sample_category TEXT NOT NULL,
    motivation TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: invite_codes
-- Stores invite codes generated for approved blog requests
CREATE TABLE IF NOT EXISTS invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    blog_request_id INTEGER REFERENCES blog_requests(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    specialty VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: notifications
-- Stores user notifications for post status updates
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'post_approved', 'post_rejected', 'general'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_email ON invite_codes(email);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_blog_requests_status ON blog_requests(status);
CREATE INDEX IF NOT EXISTS idx_blog_requests_email ON blog_requests(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Insert default admin user (password: admin123)
-- Note: This should be changed in production
INSERT INTO users (username, password, display_name_ar, role) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'المدير العام', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default admin settings
INSERT INTO settings (user_id, blog_title, blog_description, email)
SELECT u.id, 'مدونات آفاق', 'منصة المدونات العربية المتخصصة', 'admin@afaq-blogs.com'
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;
