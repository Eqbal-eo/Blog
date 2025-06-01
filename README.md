# Blog Project

## Security and Environment Variables Setup

### Important Security Notice
This project uses environment variables to protect sensitive information like API keys, database credentials, and secrets. 
**NEVER commit your actual `.env` file to GitHub** as it contains sensitive information!

### Environment Variables Setup

1. Create a copy of `.env.example` and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your own values in the `.env` file:
   ```
   SUPABASE_URL=your_actual_supabase_url
   SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   JWT_SECRET=your_secure_random_string
   # ... complete all other values
   ```

3. Make sure your `.env` file is included in `.gitignore` to prevent it from being committed:
   ```
   .env
   ```

### Setting Up Git Pre-commit Hook (Recommended)

This project includes a pre-commit hook script to help prevent accidentally committing sensitive information.

To install the pre-commit hook:

1. Run the setup script:
   ```bash
   ./setup-hooks.sh
   ```

Or manually:

1. Make the script executable:
   ```bash
   chmod +x pre-commit
   ```

2. Set up the Git hook:
   ```bash
   # Create Git hooks directory if it doesn't exist
   mkdir -p .git/hooks
   
   # Install the pre-commit hook
   cp pre-commit .git/hooks/pre-commit
   ```

This pre-commit hook will scan your staged files for potential sensitive information and block the commit if any is found.

### Before Committing to GitHub

Always check that you're not accidentally committing sensitive information:

1. Run our security check script to scan for sensitive information:
   ```bash
   ./check-secrets.sh
   ```
   
   This script will scan all tracked files for potential sensitive information.

2. Run this command to see what changes would be committed:
   ```bash
   git diff --cached
   ```

3. Verify that no sensitive information (API keys, passwords, etc.) appears in the output.

4. To see what files will be committed:
   ```bash
   git status
   ```

4. If you accidentally committed sensitive information, remove it from git history using:
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch path/to/file" --prune-empty --tag-name-filter cat -- --all
   ```
   
   Replace `path/to/file` with the path to the file containing sensitive information.

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Validate your environment variables:
   ```bash
   npm run validate-env
   ```
   This will check if all required environment variables are properly set.

3. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on the port specified in your `.env` file (default: 3000).

## Project Structure

The project follows a standard Express.js structure with controllers, routes, services, and views organized in separate directories.

- `controllers/`: Contains all route handlers and business logic
- `db/`: Database connection and configuration
- `middleware/`: Custom middleware functions
- `public/`: Static assets (CSS, JS, images)
- `routes/`: API and page routes
- `services/`: External service integrations (email, notifications)
- `views/`: EJS templates for rendering pages

## Security Best Practices

This project implements the following security best practices:

1. **Environment Variables for Secrets**: All sensitive information is stored in environment variables.
2. **Git Ignore Rules**: `.env` files are excluded from Git tracking.
3. **Pre-commit Hook**: Automatically checks for sensitive information before committing.
4. **Secrets Check Script**: Manually scan for sensitive information with `npm run check-secrets`.
5. **Environment Validation**: Ensure all required environment variables are set with `npm run validate-env`.
6. **Secure Setup**: Easily install security hooks with `npm run setup-hooks`.

Remember:
- **Never commit** the `.env` file to version control
- **Never hardcode** sensitive values in your code
- Use **environment-specific** configuration for different environments
- **Rotate credentials** periodically for better security
