# Afaq Blogs

A modern Arabic blogging platform designed to empower writers and intellectuals to publish their thoughts and articles across various cultural, intellectual, and political fields.

## Features

### For Writers and Bloggers
- **Personal blog creation** with customizable settings
- **Advanced text editor** supporting rich formatting and right-to-left direction
- **Article categorization** (Politics, History, Economics, Technology, Literature, Medicine)
- **Publication status management** (Draft, Under Review, Published, Rejected)
- **Personal dashboard** for tracking statistics and articles

### For Readers
- **Blog browsing** in an organized and attractive way
- **Search and filtering** by author, topic, or category
- **Enhanced reading experience** with content-focused design

### For Administration
- **Blog request system** with comprehensive applicant review
- **Content management** and article review before publication
- **Notification system** for communicating with writers
- **Comprehensive statistics and reports**

## Technologies Used

- **Backend**: Node.js + Express.js
- **Frontend**: EJS + Bootstrap (RTL)
- **Database**: Supabase (PostgreSQL)
- **Editor**: Quill.js
- **Design**: Custom CSS with Arabic support
- **Deployment**: Vercel

## Getting Started

### Requirements
- Node.js (v14 or newer)
- Supabase account
- Text editor

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `JWT_SECRET` - A random secret key for JWT encryption
- `ZOHO_EMAIL` - Your email for sending notifications
- `ZOHO_PASSWORD` - Your email app credentials

Refer to `.env.example` for the exact format.

## Project Structure

```
├── controllers/          # Control logic
├── routes/              # Application routes  
├── views/               # User interfaces
├── public/              # Static files
├── db/                  # Database configuration
├── middleware/          # Middleware
└── services/           # Helper services
```

## Security

- Password encryption using bcrypt
- JWT authentication for sessions
- CSRF protection
- Data validation

## Contact

eng.mhdeqbal@gmail.com