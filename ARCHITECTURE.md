# HKAYET Bookstore - Complete Architecture Documentation

## Overview
HKAYET is a full-featured online bookstore platform with physical book sales, ebook reading capabilities, and manuscript submission system. Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **SEO**: React Helmet Async 3.0.0
- **PDF Rendering**: PDF.js 5.5.207

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email/Password)
- **Storage**: Supabase Storage
- **Edge Functions**: Deno-based serverless functions
- **Email**: Nodemailer with SMTP (Zoho)
- **Scheduled Jobs**: pg_cron + pg_net

### Extensions
- **pg_cron**: Automated scheduled tasks
- **pg_net**: HTTP requests from database
- **PostGIS**: (if location-based features needed)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React SPA + TypeScript + Tailwind CSS + React Router           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │  PostgreSQL  │  │   Storage    │          │
│  │   (JWT)      │  │   Database   │  │   (Books,    │          │
│  │              │  │              │  │   Ebooks)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Edge Functions│  │   pg_cron    │  │    pg_net    │          │
│  │ (Deno/TS)    │  │  (Scheduler) │  │   (HTTP)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│         SMTP Server (Zoho) - Email Notifications                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### User Management

#### **profiles**
- Primary user data table
- Links to `auth.users` via foreign key
- Columns:
  - `id` (uuid) - Primary key, references auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `is_admin` (boolean) - Legacy admin flag
  - `role` (user_role enum) - User role: user, book_club, admin
  - `created_at`, `updated_at` (timestamptz)

**User Roles**:
- `user`: Standard customer
- `book_club`: Special discount tier (15% off)
- `admin`: Full system access

### Book Management

#### **books**
- Physical books inventory
- Columns:
  - `id`, `title`, `slug`, `description`
  - `cover_url`, `isbn`, `price`, `stock`
  - `category_id` (references categories)
  - `publisher`, `release_date`, `pages`
  - `rating`, `total_reviews`, `total_sales`
  - `is_featured`, `is_bestseller`, `is_new_release`
  - `created_at`, `updated_at`

#### **ebooks**
- Digital book versions with reader functionality
- Columns:
  - `id`, `book_id` (optional reference to physical book)
  - `title`, `author`, `description`, `cover_image_url`
  - `file_url` (Supabase Storage path)
  - `format` (EPUB or PDF)
  - `file_size`, `page_count`, `preview_pages`
  - `isbn`, `price`, `category_id`
  - `drm_enabled`, `download_enabled`
  - `published_date`, `rating`, `views`
  - `created_at`, `updated_at`

#### **authors**
- Author information
- Columns: `id`, `name`, `slug`, `bio`, `photo_url`, `created_at`

#### **book_authors**
- Many-to-many relationship between books and authors
- Columns: `book_id`, `author_id`

#### **categories**
- Book categories/genres
- Columns: `id`, `name`, `slug`, `description`, `image_url`, `display_order`, `created_at`

#### **featured_books**
- Curated featured books for homepage
- Columns: `id`, `book_id`, `position`, `created_at`

#### **book_quotes**
- Notable quotes from books
- Columns: `id`, `book_id`, `quote`, `is_featured`, `created_at`

### E-commerce

#### **cart_items**
- Shopping cart for logged-in users
- Columns: `id`, `user_id`, `book_id`, `quantity`, `created_at`

#### **orders**
- Order records
- Columns:
  - `id`, `user_id`, `order_number`
  - `status` (pending, confirmed, shipped, delivered, cancelled)
  - `total_amount`, `subtotal`, `discount_amount`
  - `shipping_name`, `shipping_address`, `shipping_city`, `shipping_postal_code`, `shipping_country`
  - `phone`, `notes`
  - `payment_method`, `payment_status`
  - `promo_code_id` (optional applied promo code)
  - `created_at`, `updated_at`

#### **order_items**
- Line items for each order
- Columns: `id`, `order_id`, `book_id`, `quantity`, `price`, `created_at`

#### **promo_codes**
- Discount codes management
- Columns:
  - `id`, `code`, `description`
  - `discount_percentage` (1-100)
  - `is_active`, `usage_limit`, `usage_count`
  - `valid_from`, `valid_until`
  - `created_by`, `created_at`, `updated_at`

#### **promo_code_usage**
- Tracks promo code usage
- Columns: `id`, `promo_code_id`, `order_id`, `user_id`, `discount_amount`, `used_at`

### Digital Library & Reading

#### **user_library**
- User's purchased ebooks
- Columns:
  - `id`, `user_id`, `ebook_id`
  - `purchase_date`, `last_opened`
  - `reading_progress` (0-100%)
  - `current_page`, `total_reading_time` (minutes)
  - `created_at`

#### **bookmarks**
- User bookmarks in ebooks
- Columns: `id`, `user_id`, `ebook_id`, `page_number`, `cfi_location`, `note`, `created_at`

#### **highlights**
- Text highlights in ebooks
- Columns: `id`, `user_id`, `ebook_id`, `highlighted_text`, `cfi_range`, `color`, `note`, `page_number`, `created_at`

#### **reading_sessions**
- Tracks reading activity
- Columns: `id`, `user_id`, `ebook_id`, `started_at`, `ended_at`, `duration_minutes`, `pages_read`

#### **ebook_reviews**
- Reviews for ebooks
- Columns: `id`, `user_id`, `ebook_id`, `rating` (1-5), `review_text`, `created_at`

### Manuscript Submission System

#### **manuscripts**
- Author manuscript submissions
- Columns:
  - `id`, `user_id`, `title`, `description`
  - `file_url`, `file_name`, `file_size`
  - `status` (not_reviewed, reviewing, accepted, rejected)
  - `admin_notes`
  - `created_at`, `updated_at`

### Email System

#### **email_templates**
- Reusable email templates
- Columns: `id`, `template_key`, `subject`, `html_body`, `text_body`, `created_at`, `updated_at`
- Templates:
  - `order_confirmation`: Sent when order is placed
  - `manuscript_submission`: Sent when manuscript is submitted

#### **email_logs**
- Email sending history
- Columns:
  - `id`, `to_email`, `subject`, `template_key`
  - `status` (pending, sent, failed)
  - `error_message`, `related_id`, `user_id`
  - `created_at`

### User Engagement

#### **reviews**
- Book reviews (physical books)
- Columns: `id`, `book_id`, `user_id`, `rating` (1-5), `title`, `comment`, `is_approved`, `created_at`

#### **wishlists**
- User wishlist
- Columns: `id`, `user_id`, `book_id`, `created_at`

#### **user_activity**
- Activity tracking
- Columns: `id`, `user_id`, `book_id`, `activity_type`, `created_at`

### Content Management

#### **blog_posts**
- Blog/articles system (not actively used)
- Columns: `id`, `title`, `slug`, `content`, `excerpt`, `cover_url`, `author_id`, `is_published`, `published_at`, `created_at`, `updated_at`

#### **newsletter_subscribers**
- Newsletter email list (not actively used)
- Columns: `id`, `email`, `is_active`, `created_at`

#### **site_settings**
- Global site configuration
- Columns: `id`, `key`, `value`, `type`, `description`, `updated_at`, `updated_by`
- Settings:
  - `site_name`, `site_description`, `contact_email`
  - `show_authors`, `show_blog`, `show_newsletter`, `show_manuscript_submission`
  - `book_club_discount_enabled`

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with specific policies:

### Public Access
- **books**: Anyone can view
- **ebooks**: Anyone can view (but not download files)
- **authors**: Anyone can view
- **categories**: Anyone can view

### Authenticated Access
- **profiles**: Users can view their own profile; admins can view and update all
- **orders**: Users can view their own orders; admins can view all
- **cart_items**: Users can manage their own cart
- **user_library**: Users can view their own library
- **manuscripts**: Users can view/create their own; admins can view/update all
- **bookmarks**, **highlights**, **reading_sessions**: Users can manage their own

### Admin Only
- **promo_codes**: Admins can create/manage
- **email_templates**: Admins can update
- **site_settings**: Admins can update
- **featured_books**: Admins can manage

---

## Edge Functions

### **send-email**
- Sends individual emails via SMTP
- Uses Nodemailer with Zoho SMTP
- Input: `to`, `subject`, `html`, `text`
- Returns: success/error status

### **process-emails**
- Batch processes pending emails from `email_logs`
- Retrieves email templates and fills in placeholders
- Handles both order confirmations and manuscript submissions
- Runs automatically via cron job every minute
- Uses `pg_net` to be called from database

### **sitemap**
- Generates XML sitemap for SEO
- Lists all books, ebooks, authors, categories
- Cached and served for search engines

---

## Automated Systems

### Email Processing
- **Trigger**: After INSERT on `orders` → creates email log
- **Trigger**: After INSERT on `manuscripts` → creates email log
- **Cron Job**: Runs every minute via pg_cron
  - Calls `invoke_process_emails()` function
  - Function uses pg_net to POST to `/functions/v1/process-emails`
  - Edge function processes all pending emails
  - Updates email_logs status (sent/failed)

### Profile Creation
- **Trigger**: After INSERT on `auth.users` → auto-creates profile

### Role Synchronization
- **Trigger**: Updates `auth.users.raw_app_metadata` when profile role changes
- Keeps JWT claims in sync with database role

---

## Storage Buckets

### **book-covers**
- Stores book and ebook cover images
- Public read access

### **ebooks**
- Stores EPUB and PDF files
- Authenticated access only
- Users can only access ebooks in their library

### **manuscripts**
- Stores submitted manuscript files
- User can access their own files
- Admins can access all files

---

## Frontend Architecture

### Pages
- **Home** (`/`) - Homepage with featured books
- **Books** (`/books`) - Browse all physical books
- **Ebooks** (`/ebooks`) - Browse all ebooks
- **Authors** (`/authors`) - Author directory
- **BookDetail** (`/books/:slug`) - Individual book page
- **Login** (`/login`) - User authentication
- **Signup** (`/signup`) - User registration
- **ForgotPassword** (`/forgot-password`) - Password reset request
- **ResetPassword** (`/reset-password`) - Password reset form
- **Checkout** (`/checkout`) - Order checkout
- **Orders** (`/orders`) - User order history
- **Library** (`/library`) - User's ebook library
- **Reader** (`/reader/:ebookId`) - EPUB reader
- **PDFReader** (`/pdf-reader/:ebookId`) - PDF reader
- **SubmitManuscript** (`/submit-manuscript`) - Manuscript submission
- **Dashboard** (`/dashboard`) - User dashboard
- **Admin** (`/admin`) - Admin panel (book management)
- **ManageManuscripts** (`/admin/manuscripts`) - Admin manuscript review
- **SiteSettings** (`/admin/settings`) - Site configuration

### Components
- **Header** - Navigation bar with cart
- **Footer** - Site footer
- **BookCard** - Book display card
- **Cart** - Shopping cart sidebar
- **AddBookModal** - Admin: Add new book
- **EditBookModal** - Admin: Edit book
- **AddEbookModal** - Admin: Add new ebook
- **PromoCodeManager** - Admin: Manage promo codes
- **OrderDetailsModal** - View order details
- **RecommendedBooks** - Book recommendations
- **BookPageFlip** - Page flip animation for book preview
- **SEO** - SEO meta tags component
- **Toast** - Notification system

### Contexts
- **AuthContext** - Authentication state management
- **LanguageContext** - Multi-language support (English/Arabic)

### Utils
- **currency.ts** - Currency formatting
- **recommendations.ts** - Book recommendation algorithm
- **promoCode.ts** - Promo code validation
- **bookClubDiscount.ts** - Book club discount logic
- **epubReader.ts** - EPUB parsing and reading
- **seo.ts** - SEO utilities
- **navigation.ts** - Navigation helpers

---

## Authentication Flow

1. User signs up via Supabase Auth (email/password)
2. Trigger auto-creates profile in `profiles` table
3. JWT token contains user ID and role
4. Frontend stores session in localStorage
5. Protected routes check auth state
6. Admin routes check for `admin` role

---

## Order Flow

1. User adds books to cart (stored in `cart_items`)
2. User proceeds to checkout
3. Optional: Apply promo code (validates and calculates discount)
4. User enters shipping information
5. Order created in `orders` table with status `pending`
6. Order items copied from cart to `order_items`
7. Cart cleared
8. **Email trigger**: Creates email log entry
9. **Cron job**: Processes email within 1 minute
10. User receives order confirmation email
11. Admin can update order status from admin panel

---

## Ebook Purchase & Reading Flow

1. User purchases ebook (creates order)
2. After payment confirmation, ebook added to `user_library`
3. User accesses library and clicks "Read"
4. App checks file format (EPUB/PDF)
5. Redirects to appropriate reader:
   - EPUB → `/reader/:ebookId` (custom EPUB.js-based reader)
   - PDF → `/pdf-reader/:ebookId` (PDF.js viewer)
6. Reader loads file from Supabase Storage (authenticated)
7. User can create bookmarks, highlights
8. Reading progress auto-saved to `user_library`
9. Reading sessions tracked in `reading_sessions`

---

## Manuscript Submission Flow

1. User uploads manuscript via `/submit-manuscript`
2. File uploaded to `manuscripts` storage bucket
3. Record created in `manuscripts` table with status `not_reviewed`
4. **Email trigger**: Creates email log entry
5. **Cron job**: Processes email within 1 minute
6. User receives submission confirmation email
7. Admin reviews manuscripts in `/admin/manuscripts`
8. Admin can change status to: reviewing, accepted, rejected
9. Admin can add notes visible to author

---

## Admin Features

### Book Management
- Add/edit/delete books and ebooks
- Upload cover images
- Upload ebook files (EPUB/PDF)
- Manage stock and pricing
- Toggle featured/bestseller/new release flags

### Order Management
- View all orders
- Update order status
- View order details and items

### Promo Code Management
- Create discount codes
- Set expiration dates and usage limits
- Toggle active/inactive status

### Manuscript Review
- View all submissions
- Update review status
- Add admin notes

### Site Settings
- Toggle visibility of sections (authors, blog, newsletter, etc.)
- Enable/disable book club discount
- Update contact information

---

## SEO Implementation

### Features
- Dynamic meta tags per page
- Open Graph tags for social sharing
- Twitter Card support
- Canonical URLs
- XML sitemap generation
- robots.txt configuration
- Structured data (JSON-LD) for books

### Sitemap Structure
```
/
/books
/ebooks
/authors
/books/:slug (for each book)
/authors/:slug (for each author)
```

---

## Security Measures

1. **Row Level Security**: All tables protected with RLS
2. **Authentication**: JWT-based auth via Supabase
3. **Role-based Access**: User, Book Club, Admin roles
4. **Secure File Access**: Storage buckets with auth checks
5. **Input Validation**: Client and server-side validation
6. **SQL Injection Prevention**: Parameterized queries via Supabase
7. **XSS Prevention**: React's built-in escaping
8. **CORS**: Properly configured for edge functions

---

## Performance Optimizations

### Database
- Indexes on frequently queried columns:
  - `books(slug)`, `books(category_id)`
  - `orders(user_id)`, `orders(order_number)`
  - `profiles(email)`
  - `user_library(user_id)`, `user_library(ebook_id)`
  - `email_logs(status)`
  - Composite indexes for joins

### Frontend
- Lazy loading for images
- Code splitting with React Router
- Optimized bundle size with Vite
- Caching for static assets

### Storage
- CDN delivery via Supabase
- Optimized image formats
- File size validation

---

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

### Edge Functions (Auto-configured)
```
SUPABASE_URL=<supabase-project-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_URL=<database-url>
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=contact@hkeyet.store
SMTP_PASS=<smtp-password>
SMTP_FROM=contact@hkeyet.store
```

---

## Key Features Summary

### Customer Features
- Browse and search books/ebooks
- Shopping cart and checkout
- Order history
- Digital library with ebook reader
- Bookmarks and highlights
- Reading progress tracking
- Manuscript submission
- Promo code usage
- Book club discount (15% for book_club role)

### Admin Features
- Book/ebook management
- Order management
- Promo code creation
- Manuscript review
- Site settings configuration
- Email template management

### System Features
- Automated email notifications
- SEO optimization
- Multi-language support (English/Arabic)
- Responsive design
- Secure authentication
- Role-based access control
- Scheduled jobs for email processing

---

## File Structure
```
project/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI elements (Button, Input)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Cart.tsx
│   │   ├── BookCard.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Books.tsx
│   │   ├── Login.tsx
│   │   ├── Admin.tsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── utils/              # Utility functions
│   ├── lib/                # Third-party integrations
│   │   └── supabase.ts
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
│       ├── send-email/
│       ├── process-emails/
│       └── sitemap/
├── public/                 # Static assets
└── package.json

```

---

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env` with Supabase credentials
4. Run dev server: `npm run dev`
5. Access at `http://localhost:5173`

### Database Changes
1. Create migration file in `supabase/migrations/`
2. Apply migration via Supabase dashboard or CLI
3. Test RLS policies thoroughly

### Deployment
1. Build: `npm run build`
2. Deploy frontend to hosting (Vercel, Netlify, etc.)
3. Edge functions auto-deployed via Supabase
4. Verify cron jobs are running
5. Test email notifications

---

## Monitoring & Maintenance

### Database
- Monitor `email_logs` for failed emails
- Check `manuscripts` for pending reviews
- Track `orders` for fulfillment
- Review `promo_code_usage` for fraud

### Performance
- Monitor query performance in Supabase dashboard
- Check storage usage
- Review edge function logs

### Security
- Regular RLS policy audits
- Update dependencies
- Review admin access logs
- Monitor failed authentication attempts

---

## Future Enhancements

### Potential Features
- Payment gateway integration (Stripe, PayPal)
- Real-time chat support
- Advanced search with filters
- Book recommendations using ML
- Social features (reading lists, book clubs)
- Mobile apps (React Native)
- Audiobook support
- Gift cards
- Subscription model

### Technical Improvements
- Redis caching layer
- Full-text search with ElasticSearch
- GraphQL API
- Webhook integrations
- Advanced analytics dashboard
- A/B testing framework

---

This architecture provides a solid foundation for a modern, scalable bookstore platform with both physical and digital book sales, comprehensive user management, and automated backend processes.
