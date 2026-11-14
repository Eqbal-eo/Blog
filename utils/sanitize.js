const sanitizeHtml = require('sanitize-html');

const COLOR = [
    /^#(0x)?[0-9a-f]+$/i,
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/i,
    /^[a-z]+$/i
];

// Allowlist matching what the Quill editor toolbar can produce.
const OPTIONS = {
    allowedTags: [
        'p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's',
        'ol', 'ul', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span'
    ],
    allowedAttributes: {
        '*': ['class', 'dir', 'style'],
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height']
    },
    allowedClasses: { '*': ['ql-*'] },
    allowedStyles: {
        '*': {
            color: COLOR,
            'background-color': COLOR,
            'text-align': [/^(left|right|center|justify)$/]
        }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Quill embeds pasted/inserted images as base64 data URIs
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' })
    }
};

/**
 * Strip scripts, event handlers and unsafe URLs from user-authored HTML.
 * Use on write (before saving) and on render (for rows saved before this existed).
 */
function sanitize(html) {
    if (html === null || html === undefined) return '';
    return sanitizeHtml(String(html), OPTIONS);
}

/** JSON safe to embed inside an inline <script> block. */
function safeJson(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .split(String.fromCharCode(0x2028)).join('\\' + 'u2028')
        .split(String.fromCharCode(0x2029)).join('\\' + 'u2029');
}

module.exports = { sanitize, safeJson };
