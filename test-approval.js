require('dotenv').config();
const supabase = require('./db/db');

async function testApproval() {
    try {
        console.log('🔍 جاري البحث عن طلبات المدونة المعلقة...');
        
        // البحث عن طلبات معلقة
        const { data: requests, error: fetchError } = await supabase
            .from('blog_requests')
            .select('*')
            .eq('status', 'pending')
            .limit(5);
            
        if (fetchError) {
            console.error('خطأ في جلب الطلبات:', fetchError);
            return;
        }
        
        console.log(`✅ تم العثور على ${requests.length} طلب معلق`);
        
        if (requests.length === 0) {
            console.log('📝 إنشاء طلب اختبار...');
            
            // إنشاء طلب اختبار
            const { data: newRequest, error: insertError } = await supabase
                .from('blog_requests')
                .insert([{
                    full_name: 'اختبار المستخدم',
                    email: 'test@example.com',
                    phone: '1234567890',
                    blog_topic: 'مدونة تقنية متخصصة في البرمجة والتطوير',
                    experience_level: 'متوسط',
                    writing_samples: 'هذا نموذج كتابة اختباري للتحقق من وظيفة الموافقة على طلبات المدونة. يحتوي هذا النص على أكثر من 250 كلمة كما هو مطلوب في النظام. سأقوم بإضافة المزيد من الكلمات للوصول للحد المطلوب. تطوير المواقع الإلكترونية مجال واسع ومتنوع يتطلب معرفة عميقة بالتقنيات المختلفة مثل HTML وCSS وJavaScript. كما يتطلب فهم قواعد البيانات وكيفية التعامل معها. البرمجة فن وعلم في الوقت نفسه تحتاج إلى صبر ومثابرة وتعلم مستمر. التقنيات تتطور باستمرار ويجب على المطور مواكبة هذا التطور. الذكاء الاصطناعي أصبح جزءاً مهماً من عالم التقنية اليوم ويؤثر على كثير من المجالات. تعلم البرمجة يفتح آفاقاً واسعة للإبداع والابتكار. المشاريع التقنية تحتاج إلى تخطيط جيد وتنفيذ دقيق لضمان النجاح.',
                    motivation: 'أريد مشاركة خبرتي في مجال التطوير والبرمجة مع الآخرين',
                    status: 'pending'
                }])
                .select()
                .single();
                
            if (insertError) {
                console.error('خطأ في إنشاء الطلب:', insertError);
                return;
            }
            
            console.log('✅ تم إنشاء طلب اختبار:', newRequest);
            return newRequest;
        } else {
            console.log('📋 الطلبات المعلقة:');
            requests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.full_name} - ${req.email} (ID: ${req.id})`);
            });
            return requests[0];
        }
        
    } catch (error) {
        console.error('خطأ عام:', error);
    }
}

// تشغيل الاختبار
testApproval().then(result => {
    if (result) {
        console.log('\n🎯 يمكنك الآن اختبار الموافقة على الطلب رقم:', result.id);
        console.log('📧 البريد الإلكتروني:', result.email);
    }
    process.exit(0);
});
