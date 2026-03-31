const supabase = require('../db/db');

/**
 * Middleware to track visitors and save to Supabase
 */
const visitorTracker = async (req, res, next) => {
    try {
        // Skip tracking for static files (images, css, js) and admin routes
        const ignorePaths = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '/admin'];
        if (ignorePaths.some(ext => req.originalUrl.includes(ext))) {
            return next();
        }

        // Get IP address (handles reverse proxies like Vercel/Nginx)
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Get User Agent
        const user_agent = req.headers['user-agent'] || 'Unknown';

        // Get Requested URL
        const requested_url = req.originalUrl;

        // Prepare data for Supabase
        const visitData = {
            ip_address: ip_address?.toString().split(',')[0].trim(), // Get the first IP if multiple
            user_agent,
            requested_url
        };

        // Fire and forget insertion (we don't wait for it so it doesn't slow down the request)
        supabase
            .from('site_visitors')
            .insert([visitData])
            .then(({ error }) => {
                if (error) {
                    console.error('Visitor Tracking Error:', error.message);
                }
            })
            .catch(err => {
                console.error('Visitor Tracking Exception:', err);
            });

        // Continue to the next middleware or route
        next();
    } catch (error) {
        console.error('Visitor Tracker Middleware Error:', error);
        next(); // Ensure the site still works even if tracking fails
    }
};

module.exports = visitorTracker;
