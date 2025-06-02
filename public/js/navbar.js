// navbar.js - تنسيقات موحدة للنافبار عبر جميع صفحات الموقع

// تأثيرات الحركة
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// عند تحميل الصفحة، تأكد من توسيط عناصر النافبار
document.addEventListener('DOMContentLoaded', function() {
    // تحديد التنسيق المناسب للقائمة
    const navbarNav = document.querySelector('.navbar-nav');
    if (navbarNav) {
        // ضبط تنسيقات القائمة للتأكد من توسيطها
        navbarNav.style.justifyContent = 'center';
        navbarNav.style.display = 'flex';
        navbarNav.style.margin = '0 auto';
        
        // التأكد من عرض عناصر القائمة بشكل أفقي
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.style.display = 'inline-flex';
            item.style.margin = '0 5px';
        });
    }
});
