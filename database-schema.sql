-- إنشاء نوع البيانات المخصص للأدوار
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('admin', 'user');

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.users (
  id serial PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, -- تخزين الهاش فقط، ليس كلمة المرور
  bio TEXT,
  display_name_ar TEXT,
  role public.user_role DEFAULT 'user'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إضافة مؤشرات للأداء
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
