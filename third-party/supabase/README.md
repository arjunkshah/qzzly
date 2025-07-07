# Supabase Integration

This folder contains the Supabase integration logic for Qzzly.com.

- `supabaseClient.ts`: Exports a configured Supabase client using the project URL and anon key from environment variables. Use this in your frontend or integration code to interact with Supabase for authentication and database operations.

**Note:** Do not commit your Supabase service role or secret keys to version control. Use environment variables for all secrets.
