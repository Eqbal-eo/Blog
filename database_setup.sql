-- سكريبت إنشاء الجداول الجديدة في قاعدة البيانات
-- تأكد من تشغيل هذا السكريبت في Supabase SQL Editor

-- إنشاء نوع البيانات للحالات
CREATE TYPE blog_request_status AS ENUM ('pending', 'approved', 'rejected');

-- جدول طلبات المدونات
CREATE TABLE IF NOT EXISTS public.blog_requests (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  specialty VARCHAR NOT NULL,
  experience_years INTEGER NOT NULL CHECK (experience_years > 0),
  sample_title VARCHAR NOT NULL,
  sample_content TEXT NOT NULL,
  sample_category TEXT NOT NULL CHECK (sample_category IN ('politics', 'history', 'economics', 'technology', 'literature', 'medicine')),
  motivation TEXT NOT NULL,
  status blog_request_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES public.users(id)
);

-- جدول أكواد الدعوة
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR NOT NULL UNIQUE,
  blog_request_id INTEGER NOT NULL REFERENCES public.blog_requests(id),
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  specialty VARCHAR NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by INTEGER REFERENCES public.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_blog_requests_status ON public.blog_requests(status);
CREATE INDEX IF NOT EXISTS idx_blog_requests_email ON public.blog_requests(email);
CREATE INDEX IF NOT EXISTS idx_blog_requests_created_at ON public.blog_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_email ON public.invite_codes(email);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON public.invite_codes(expires_at);

-- إضافة تعليقات للجداول
COMMENT ON TABLE public.blog_requests IS 'جدول طلبات إنشاء المدونات من المستخدمين الجدد';
COMMENT ON TABLE public.invite_codes IS 'جدول أكواد التفعيل المرسلة للمستخدمين المقبولين';

-- إعطاء صلاحيات للمستخدمين المصرح لهم
-- تأكد من تعديل السياسات في Supabase لتمكين الوصول المناسب
