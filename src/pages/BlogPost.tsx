import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, ArrowLeft, Loader, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/blog';
import SEO from '../components/SEO';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  tags: string[];
  published_at: string;
  reading_time: number;
  seo_title: string;
  seo_description: string;
  views: number;
  author_id: string;
}

interface Profile {
  id: string;
  name: string;
}

interface BlogPostProps {
  slug: string;
}

export function BlogPost({ slug }: BlogPostProps) {
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      if (data) {
        setPost(data);

        await supabase.rpc('increment_blog_post_views', { post_id: data.id });

        if (data.author_id) {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', data.author_id)
            .single();

          if (authorData) {
            setAuthor(authorData);
          }
        }

        if (data.category) {
          const { data: related } = await supabase
            .from('blog_posts')
            .select('id, title, slug, excerpt, cover_url, published_at, reading_time')
            .eq('is_published', true)
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(3);

          if (related) {
            setRelatedPosts(related);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = `https://hkeyet.store/blog/${slug}`;
    if (navigator.share) {
      navigator
        .share({
          title: post?.title,
          text: post?.excerpt,
          url: url
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#F05A28] animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <a href="/blog" className="text-[#F05A28] hover:underline">
            Back to blog
          </a>
        </div>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: post.cover_url,
    datePublished: post.published_at,
    author: {
      '@type': 'Person',
      name: author?.name || 'HKAYET'
    },
    publisher: {
      '@type': 'Organization',
      name: 'HKAYET',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hkeyet.store/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hkeyet.store/blog/${slug}`
    }
  };

  return (
    <>
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        type="article"
        image={post.cover_url}
        structuredData={structuredData}
      />

      <article className="min-h-screen bg-gray-50">
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          <img
            src={post.cover_url || 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl mx-auto">
              <a
                href="/blog"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {language === 'fr' ? 'Retour au blog' : language === 'ar' ? 'العودة إلى المدونة' : 'Back to blog'}
              </a>

              {post.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </span>
                </div>
              )}

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{post.title}</h1>

              <div className="flex items-center gap-6 text-white/90 text-sm">
                {author && <div>{author.name}</div>}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.published_at, language)}
                </div>
                {post.reading_time > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.reading_time} min
                    {language === 'fr' ? ' de lecture' : language === 'ar' ? ' دقيقة قراءة' : ' read'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            {post.excerpt && (
              <div className="text-xl text-gray-600 mb-8 pb-8 border-b border-gray-200 italic">
                {post.excerpt}
              </div>
            )}

            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#F05A28] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {language === 'fr' ? 'Tags' : language === 'ar' ? 'العلامات' : 'Tags'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#d14920] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {language === 'fr' ? 'Partager' : language === 'ar' ? 'مشاركة' : 'Share'}
              </button>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'fr'
                  ? 'Articles similaires'
                  : language === 'ar'
                  ? 'مقالات مماثلة'
                  : 'Related Articles'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <a
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={relatedPost.cover_url || 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg'}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#F05A28] transition-colors mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(relatedPost.published_at, language)}
                        </div>
                        {relatedPost.reading_time > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relatedPost.reading_time} min
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
