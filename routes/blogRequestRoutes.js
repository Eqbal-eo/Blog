const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// عرض صفحة طلب إنشاء المدونة
router.get('/blog-request', (req, res) => {
    res.render('blog-request', { error: null, success: null });
});

// معالجة طلب إنشاء المدونة
router.post('/blog-request', async (req, res) => {
    const { 
        fullName, 
        email, 
        specialty, 
        experienceYears, 
        sampleTitle, 
        sampleContent, 
        sampleCategory, 
        motivation 
    } = req.body;

    try {
        // التحقق من صحة البيانات
        if (!fullName || !email || !specialty || !experienceYears || 
            !sampleTitle || !sampleContent || !sampleCategory || !motivation) {
            return res.render('blog-request', {
                error: 'جميع الحقول مطلوبة',
                success: null
            });
        }

        // التحقق من طول التدوينة النموذجية (250 كلمة على الأقل)
        const wordCount = sampleContent.trim().split(/\s+/).length;
        if (wordCount < 250) {
            return res.render('blog-request', {
                error: 'يجب أن تحتوي التدوينة النموذجية على 250 كلمة على الأقل',
                success: null
            });
        }

        // التحقق من عدم وجود طلب سابق بنفس البريد الإلكتروني
        const { data: existingRequest, error: checkError } = await supabase
            .from('blog_requests')
            .select('id, status')
            .eq('email', email)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = لا توجد نتائج
            console.error('خطأ في التحقق من الطلبات السابقة:', checkError);
            return res.render('blog-request', {
                error: 'حدث خطأ أثناء معالجة الطلب',
                success: null
            });
        }

        if (existingRequest) {
            let statusMessage = '';
            switch (existingRequest.status) {
                case 'pending':
                    statusMessage = 'لديك طلب معلق بالفعل. يرجى انتظار المراجعة.';
                    break;
                case 'approved':
                    statusMessage = 'تم قبول طلبك بالفعل. تحقق من بريدك الإلكتروني للحصول على رمز الدعوة.';
                    break;
                case 'rejected':
                    statusMessage = 'تم رفض طلبك السابق. يمكنك تقديم طلب جديد بعد تحسين المحتوى.';
                    break;
            }
            
            if (existingRequest.status !== 'rejected') {
                return res.render('blog-request', {
                    error: statusMessage,
                    success: null
                });
            }
        }

        // إدراج الطلب الجديد في قاعدة البيانات
        const { data: newRequest, error: insertError } = await supabase
            .from('blog_requests')
            .insert([
                {
                    full_name: fullName,
                    email: email,
                    specialty: specialty,
                    experience_years: parseInt(experienceYears),
                    sample_title: sampleTitle,
                    sample_content: sampleContent,
                    sample_category: sampleCategory,
                    motivation: motivation,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('خطأ في إدراج الطلب:', insertError);
            return res.render('blog-request', {
                error: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.',
                success: null
            });
        }

        // إرسال رسالة نجاح
        return res.render('blog-request', {
            error: null,
            success: `تم إرسال طلبك بنجاح! سيتم مراجعة طلبك وإرسال رد عبر البريد الإلكتروني خلال 3-5 أيام عمل. رقم الطلب: ${newRequest.id}`
        });

    } catch (error) {
        console.error('خطأ في معالجة طلب المدونة:', error);
        return res.render('blog-request', {
            error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
            success: null
        });
    }
});

// عرض صفحة حالة الطلب (للمستقبل)
router.get('/blog-request-status', (req, res) => {
    res.render('blog-request-status', { error: null, request: null, inviteCode: null });
});

// البحث عن حالة الطلب
router.post('/blog-request-status', async (req, res) => {
    const { email } = req.body;

    try {        if (!email) {
            return res.render('blog-request-status', {
                error: 'يرجى إدخال البريد الإلكتروني',
                request: null,
                inviteCode: null
            });
        }const { data: request, error } = await supabase
            .from('blog_requests')
            .select(`
                id,
                full_name,
                email,
                specialty,
                status,
                rejection_reason,
                created_at,
                reviewed_at
            `)
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !request) {
            return res.render('blog-request-status', {
                error: 'لم يتم العثور على طلب بهذا البريد الإلكتروني',
                request: null,
                inviteCode: null
            });
        }

        // إذا كان الطلب مقبولاً، نحضر كود الدعوة
        let inviteCode = null;
        if (request.status === 'approved') {
            const { data: inviteData, error: inviteError } = await supabase
                .from('invite_codes')
                .select('code, expires_at, is_used')
                .eq('email', email)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (inviteData && !inviteError) {
                inviteCode = inviteData;
            }
        }

        return res.render('blog-request-status', {
            error: null,
            request: request,
            inviteCode: inviteCode
        });    } catch (error) {
        console.error('خطأ في البحث عن حالة الطلب:', error);
        return res.render('blog-request-status', {
            error: 'حدث خطأ أثناء البحث عن الطلب',
            request: null,
            inviteCode: null
        });
    }
});

module.exports = router;
