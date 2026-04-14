import { supabase } from '../lib/supabase';

export async function getRecommendedBooks(userId: string, limit: number = 8) {
  try {
    const { data: userActivity } = await supabase
      .from('user_activity')
      .select('book_id, activity_type, books(category_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!userActivity || userActivity.length === 0) {
      const { data: popularBooks } = await supabase
        .from('books')
        .select('*, book_authors(authors(*))')
        .order('total_sales', { ascending: false })
        .limit(limit);

      return popularBooks || [];
    }

    const categoryScores: Record<string, number> = {};
    const bookInteractions = new Set<string>();

    userActivity.forEach((activity: any) => {
      const categoryId = activity.books?.category_id;
      if (categoryId) {
        const weight =
          activity.activity_type === 'purchase' ? 5 :
          activity.activity_type === 'add_to_cart' ? 3 :
          activity.activity_type === 'wishlist' ? 2 : 1;

        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + weight;
      }
      bookInteractions.add(activity.book_id);
    });

    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    const bookInteractionArray = Array.from(bookInteractions);

    let recommendedQuery = supabase
      .from('books')
      .select('*, book_authors(authors(*))')
      .in('category_id', topCategories)
      .order('rating', { ascending: false })
      .limit(limit);

    if (bookInteractionArray.length > 0) {
      recommendedQuery = recommendedQuery.not('id', 'in', `(${bookInteractionArray.join(',')})`);
    }

    const { data: recommendedBooks } = await recommendedQuery;

    if (recommendedBooks && recommendedBooks.length < limit) {
      const existingBookIds = [...bookInteractionArray, ...recommendedBooks.map(b => b.id)];

      let additionalQuery = supabase
        .from('books')
        .select('*, book_authors(authors(*))')
        .order('total_sales', { ascending: false })
        .limit(limit - recommendedBooks.length);

      if (existingBookIds.length > 0) {
        additionalQuery = additionalQuery.not('id', 'in', `(${existingBookIds.join(',')})`);
      }

      const { data: additionalBooks } = await additionalQuery;

      return [...(recommendedBooks || []), ...(additionalBooks || [])];
    }

    return recommendedBooks || [];
  } catch (error) {
    console.error('Error generating recommendations:', error);

    const { data: fallbackBooks } = await supabase
      .from('books')
      .select('*, book_authors(authors(*))')
      .order('rating', { ascending: false })
      .limit(limit);

    return fallbackBooks || [];
  }
}

export async function getSimilarBooks(bookId: string, categoryId: string, limit: number = 4) {
  try {
    const { data: similarBooks } = await supabase
      .from('books')
      .select('*, book_authors(authors(*))')
      .eq('category_id', categoryId)
      .neq('id', bookId)
      .order('rating', { ascending: false })
      .limit(limit);

    return similarBooks || [];
  } catch (error) {
    console.error('Error finding similar books:', error);
    return [];
  }
}
