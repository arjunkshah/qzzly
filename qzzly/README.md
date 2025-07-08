# Quiz.io - AI-Powered Study Platform

A modern React application with AI-powered study features, user authentication, and subscription management.

## Features

- 🤖 **AI-Powered Learning**: Generate summaries, flashcards, quizzes, and study plans
- 🔐 **User Authentication**: Secure login/signup with Supabase
- 💳 **Subscription Management**: Stripe integration for premium features
- 📊 **Study Analytics**: Track your learning progress
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe
- **AI**: Google Gemini API

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/arjunkshah/qzzly.git
cd qzzly
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Gemini AI (already configured)
VITE_GEMINI_API_KEY=AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c
```

### 3. Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Set up the Database**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase-schema.sql`

3. **Configure Authentication**:
   - Go to Authentication > Settings
   - Enable email confirmations (optional)
   - Configure your site URL

### 4. Stripe Setup

1. **Create a Stripe Account**:
   - Go to [stripe.com](https://stripe.com)
   - Create an account and get your publishable key

2. **Create Products and Prices**:
   - Go to Products in your Stripe dashboard
   - Create products for Pro ($9.99/month) and Premium ($19.99/month)
   - Update the price IDs in `src/lib/stripe.ts`

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:5173` to see your application!

## Project Structure

```
qzzly/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts (Auth, Subscription)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library configurations (Supabase, Stripe)
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── supabase-schema.sql    # Database schema
└── README.md             # This file
```

## Key Features

### Authentication
- Email/password signup and login
- Session management
- Protected routes

### Study Sessions
- Create and manage study sessions
- Upload PDFs and images
- Generate AI-powered content

### AI Features
- **Summaries**: Concise document summaries
- **Notes**: Detailed study notes
- **Flashcards**: Interactive flashcards
- **Quizzes**: Multiple choice quizzes
- **Study Plans**: Personalized 7-day plans
- **Concept Maps**: Visual learning maps

### Subscription Management
- Free, Pro, and Premium plans
- Stripe checkout integration
- Subscription status tracking

## API Endpoints (Mock)

The application currently uses mock API endpoints for Stripe integration. In production, you would need to create server-side endpoints:

- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/create-portal-session` - Create customer portal session
- `GET /api/subscription-status` - Get subscription status

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any static hosting platform:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | No (already configured) |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@quiz.io or create an issue on GitHub. 