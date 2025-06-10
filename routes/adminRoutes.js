const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const supabase = require('../db/db');

// جميع مسارات المشرف تحتاج إلى المصادقة وصلاحيات المشرف
router.use(authenticateToken, isAdmin);

// عرض قائمة المنشورات المعلقة
router.get('/pending-posts', adminController.getPendingPosts);

// الموافقة على منشور
router.post('/posts/:postId/approve', adminController.approvePost);

// رفض منشور
router.post('/posts/:postId/reject', adminController.rejectPost);

// معاينة منشور معلق
router.get('/posts/:postId/preview', adminController.previewPost);

// عرض طلبات المدونات
router.get('/blog-requests', async (req, res) => {
    try {
        const { status, specialty, category, page = 1 } = req.query;
        const limit = 12;
        const offset = (page - 1) * limit;

        // بناء الاستعلام
        let query = supabase
            .from('blog_requests')
            .select('*', { count: 'exact' });

        // تطبيق الفلاتر
        if (status) {
            query = query.eq('status', status);
        }
        if (specialty) {
            query = query.ilike('specialty', `%${specialty}%`);
        }
        if (category) {
            query = query.eq('sample_category', category);
        }

        // ترتيب النتائج
        query = query.order('created_at', { ascending: false });

        // تطبيق التصفح
        query = query.range(offset, offset + limit - 1);

        const { data: requests, error, count } = await query;

        if (error) {
            console.error('خطأ في جلب طلبات المدونات:', error);
            throw error;
        }

        // إحصائيات
        const { data: statsData } = await supabase
            .from('blog_requests')
            .select('status');

        const stats = {
            total: count,
            pending: statsData.filter(r => r.status === 'pending').length,
            approved: statsData.filter(r => r.status === 'approved').length,
            rejected: statsData.filter(r => r.status === 'rejected').length
        };

        // التخصصات المتاحة
        const { data: specialtiesData } = await supabase
            .from('blog_requests')
            .select('specialty')
            .not('specialty', 'is', null);

        const specialties = [...new Set(specialtiesData.map(r => r.specialty))];

        // معلومات التصفح
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count
        };        res.render('admin/blog-requests', {
            requests: requests || [],
            stats,
            specialties,
            filters: { status, specialty, category },
            pagination,
            user: req.user
        });

    } catch (err) {
        console.error('خطأ في عرض طلبات المدونات:', err);
        res.status(500).render('error', { 
            error: 'حدث خطأ في تحميل طلبات المدونات' 
        });
    }
});

// قبول طلب مدونة
router.post('/blog-requests/:id/approve', async (req, res) => {
    try {
        const requestId = req.params.id;

        // جلب تفاصيل الطلب
        const { data: request, error: fetchError } = await supabase
            .from('blog_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({ 
                success: false, 
                error: 'الطلب غير موجود' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                error: 'الطلب تم البت فيه من قبل' 
            });
        }

        // تحديث حالة الطلب
        const { error: updateError } = await supabase
            .from('blog_requests')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: req.user.userId
            })
            .eq('id', requestId);

        if (updateError) {
            console.error('خطأ في تحديث الطلب:', updateError);
            throw updateError;
        }

        // توليد كود الدعوة
        const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // صالح لمدة 7 أيام

        const { error: codeError } = await supabase
            .from('invite_codes')
            .insert([{
                code: inviteCode,
                blog_request_id: requestId,
                full_name: request.full_name,
                email: request.email,
                specialty: request.specialty,
                expires_at: expiresAt.toISOString()
            }]);

        if (codeError) {
            console.error('خطأ في إنشاء كود الدعوة:', codeError);
            throw codeError;
        }

        // إرسال كود التفعيل عبر البريد الإلكتروني
        try {
            await emailService.sendInviteCode(
                request.email,
                request.full_name,
                inviteCode,
                request.specialty
            );
        } catch (emailError) {
            console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
            // لا نوقف العملية بسبب فشل إرسال البريد
        }

        res.json({ success: true, message: 'تم قبول الطلب وإرسال كود التفعيل' });

    } catch (err) {
        console.error('خطأ في قبول الطلب:', err);
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء قبول الطلب' 
        });
    }
});

// رفض طلب مدونة
router.post('/blog-requests/:id/reject', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { rejection_reason } = req.body;

        if (!rejection_reason || rejection_reason.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'يجب تحديد سبب الرفض' 
            });
        }

        // جلب تفاصيل الطلب
        const { data: request, error: fetchError } = await supabase
            .from('blog_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({ 
                success: false, 
                error: 'الطلب غير موجود' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                error: 'الطلب تم البت فيه من قبل' 
            });
        }

        // تحديث حالة الطلب
        const { error: updateError } = await supabase
            .from('blog_requests')
            .update({
                status: 'rejected',
                rejection_reason: rejection_reason.trim(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: req.user.userId
            })
            .eq('id', requestId);

        if (updateError) {
            console.error('خطأ في تحديث الطلب:', updateError);
            throw updateError;
        }

        // إرسال إشعار الرفض عبر البريد الإلكتروني
        try {
            await emailService.sendRejectionNotification(
                request.email,
                request.full_name,
                rejection_reason.trim()
            );
        } catch (emailError) {
            console.error('خطأ في إرسال إشعار الرفض:', emailError);
        }

        res.redirect('/admin/blog-requests?status=pending');

    } catch (err) {
        console.error('خطأ في رفض الطلب:', err);
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء رفض الطلب' 
        });
    }
});

module.exports = router;
