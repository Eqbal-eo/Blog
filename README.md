# Afaq Blogs

A modern Arabic blogging platform designed to empower writers and intellectuals to publish their thoughts and articles across various cultural, intellectual, and political fields. The platform focuses on providing a seamless experience for both writers and readers while maintaining high-quality content through moderation.

## Features

### For Writers and Bloggers
- **Personal blog creation** with customizable settings and profile management
- **Advanced text editor** supporting rich formatting, RTL direction, and media embedding
- **Article categorization** (Politics, History, Economics, Technology, Literature, Medicine)
- **Publication status management** (Draft, Under Review, Published, Rejected)
- **Personal dashboard** for tracking:
  - Article statistics and views
  - Reader engagement metrics
  - Publication history
  - Comments and feedback

### For Readers
- **Blog browsing** with modern, responsive interface
- **Advanced search and filtering** by:
  - Author
  - Topic
  - Category
  - Date
  - Popularity
- **Enhanced reading experience** with:
  - Content-focused design
  - Dark/Light mode
  - Adjustable font size
  - Bookmark functionality
  - Share options

### For Administration
- **Blog request system** with:
  - Comprehensive applicant review
  - Background verification
  - Automated approval workflow
- **Content management**:
  - Article review and moderation
  - Quality assurance checks
  - Plagiarism detection
  - Content guidelines enforcement
- **Notification system** for:
  - Writer communications
  - Content status updates
  - System announcements
- **Comprehensive analytics**:
  - User engagement metrics
  - Content performance stats
  - Platform health monitoring
  - Growth trends

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
- Supabase account and project
- Text editor (VS Code recommended)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Eqbal-eo/Blog.git
   cd Blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```env
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     JWT_SECRET=your_random_secret_key
     ZOHO_EMAIL=your_email_address
     ZOHO_PASSWORD=your_email_app_password
     ```
   - Refer to `.env.example` for the exact format

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:3000` in your browser
   - The application will automatically reload if you change any source files

## Project Structure

```
├── controllers/          # Business logic and request handling
│   ├── adminController.js    # Admin panel operations
│   ├── authController.js     # Authentication logic
│   └── notificationController.js  # Notification handling
├── routes/              # Application routing
│   ├── adminRoutes.js       # Admin routes
│   ├── authRoutes.js        # Authentication routes
│   └── mainRoutes.js        # Main application routes
├── views/               # EJS templates
│   ├── admin/              # Admin panel views
│   ├── partials/           # Reusable view components
│   └── *.ejs               # Main view templates
├── public/              # Static assets
│   ├── js/                 # Client-side JavaScript
│   └── css/                # Stylesheets
├── db/                  # Database configuration and models
├── middleware/          # Custom middleware functions
└── services/           # Business services and utilities
```

## Security Measures

- **Authentication**:
  - Password encryption using bcrypt
  - JWT-based session management
  - Secure password reset flow
  
- **Authorization**:
  - Role-based access control
  - Resource-level permissions
  
- **Data Protection**:
  - CSRF protection
  - Input validation and sanitization
  - SQL injection prevention
  - XSS protection
  
- **API Security**:
  - Rate limiting
  - Request validation
  - Secure headers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries or support:
- Email: eng.mhdeqbal@gmail.com
- GitHub: [@Eqbal-eo](https://github.com/Eqbal-eo)
- Project Link: [https://github.com/Eqbal-eo/Blog](https://github.com/Eqbal-eo)