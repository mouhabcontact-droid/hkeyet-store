import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.iii.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.iii.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_url: string | null;
          isbn: string | null;
          price: number;
          stock: number;
          category_id: string | null;
          publisher: string;
          release_date: string;
          pages: number | null;
          rating: number;
          total_reviews: number;
          total_sales: number;
          is_featured: boolean;
          is_bestseller: boolean;
          is_new_release: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          created_at: string;
        };
      };
      authors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          bio: string | null;
          photo_url: string | null;
          created_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          quantity: number;
          created_at: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: string;
          total_amount: number;
          shipping_name: string;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country: string;
          payment_method: string | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          book_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          comment: string | null;
          is_approved: boolean;
          created_at: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          cover_url: string | null;
          author_id: string;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
