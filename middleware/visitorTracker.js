const supabase = require('../db/db');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

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
        const clean_ip = ip_address?.toString().split(',')[0].trim();

        // Get User Agent
        const user_agent = req.headers['user-agent'] || 'Unknown';

        // Parse User Agent
        const parser = new UAParser(user_agent);
        const browser = parser.getBrowser().name || 'Unknown';
        const os = parser.getOS().name || 'Unknown';

        // Parse IP Location
        let country = 'Unknown';
        let country_code = 'Unknown';
        let city = 'Unknown';

        if (clean_ip) {
            // Note: geoip-lite might fail for local IPs (e.g. ::1 or 127.0.0.1)
            const geo = geoip.lookup(clean_ip);
            if (geo) {
                country_code = geo.country || 'Unknown';
                // You can map country code to full name using Intl.DisplayNames on the view later
                country = geo.country || 'Unknown'; 
                city = geo.city || 'Unknown';
            }
        }

        // Get Requested URL
        const requested_url = req.originalUrl;

        // Prepare data for Supabase
        const visitData = {
            ip_address: clean_ip,
            user_agent,
            browser,
            os,
            country_code,
            country,
            city,
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
