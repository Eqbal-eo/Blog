/**
 * ملف JavaScript للتعامل مع قائمة الآيباد
 * يتم استدعاؤه في جميع الصفحات
 */

document.addEventListener('DOMContentLoaded', function() {
    let touchStartX = 0;
    let touchEndX = 0;

    // Detect iPad
    const isIPad = () => {
        return /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    };

    // إعداد مستمعات الأحداث للقائمة المنسدلة
    function setupDropdownListeners() {
        const menuButton = document.getElementById('mobileMenuButton');
        const dropdownMenu = document.querySelector('.ipad-menu-button .dropdown-menu');

        if (!menuButton || !dropdownMenu) return;

        // Add transition CSS
        dropdownMenu.style.transition = 'transform 0.3s ease-out, opacity 0.2s ease-out';

        // Show/hide dropdown
        menuButton.addEventListener('shown.bs.dropdown', () => {
            dropdownMenu.style.opacity = '1';
            adjustDropdownPosition(menuButton, dropdownMenu);
        });

        menuButton.addEventListener('hidden.bs.dropdown', () => {
            dropdownMenu.style.opacity = '0';
        });

        // Touch event handlers for iPad
        if (isIPad()) {
            dropdownMenu.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            dropdownMenu.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                handleSwipe();
            }, { passive: true });
        }

        // Window events
        window.addEventListener('resize', debounce(() => {
            if (dropdownMenu.classList.contains('show')) {
                adjustDropdownPosition(menuButton, dropdownMenu);
            }
        }, 150));

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (dropdownMenu.classList.contains('show')) {
                    adjustDropdownPosition(menuButton, dropdownMenu);
                }
            }, 300);
        });
    }

    // ضبط موضع القائمة المنسدلة
    function adjustDropdownPosition(button, menu) {
        const buttonRect = button.getBoundingClientRect();
        const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
        const viewportWidth = window.innerWidth;
        const menuWidth = 280; // Fixed menu width

        // Set max height with padding for bottom space
        const maxHeight = window.innerHeight - buttonRect.bottom - 20;
        menu.style.maxHeight = `${maxHeight}px`;
        menu.style.overflowY = 'auto';
        menu.style.maxWidth = `${menuWidth}px`;

        // Position based on RTL
        if (isRTL) {
            menu.style.right = '0';
            menu.style.left = 'auto';
            menu.style.transform = `translate3d(0, ${buttonRect.height}px, 0)`;
        } else {
            const leftPos = Math.max(10, Math.min(buttonRect.left, viewportWidth - menuWidth - 10));
            menu.style.left = `${leftPos}px`;
            menu.style.right = 'auto';
            menu.style.transform = `translate3d(0, ${buttonRect.height}px, 0)`;
        }
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const menuButton = document.getElementById('mobileMenuButton');
        const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
        
        const swipeDistance = touchEndX - touchStartX;
        const isLeftSwipe = swipeDistance < -swipeThreshold;
        const isRightSwipe = swipeDistance > swipeThreshold;

        if ((isRTL && isLeftSwipe) || (!isRTL && isRightSwipe)) {
            bootstrap.Dropdown.getInstance(menuButton)?.hide();
        }
    }

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // تنفيذ عند تحميل الصفحة
    setupDropdownListeners();
});
