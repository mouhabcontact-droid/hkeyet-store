import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [
      { data: books },
      { data: audiobooks },
      { data: blogPosts }
    ] = await Promise.all([
      supabase
        .from('books')
        .select('slug, updated_at, cover_url, title')
        .order('updated_at', { ascending: false }),
      supabase
        .from('audiobooks')
        .select('slug, updated_at, cover_url, title')
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('blog_posts')
        .select('slug, updated_at, cover_url, title')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
    ]);

    const baseUrl = 'https://hkeyet-publishing.tn';
    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="fr-tn" href="${baseUrl}/"/>
    <xhtml:link rel="alternate" hreflang="ar-tn" href="${baseUrl}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/"/>
  </url>

  <url>
    <loc>${baseUrl}/books</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/ebooks</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/audiobooks</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/authors</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    if (books) {
      for (const book of books) {
        const lastmod = book.updated_at ? new Date(book.updated_at).toISOString().split('T')[0] : currentDate;
        sitemap += `
  <url>
    <loc>${baseUrl}/books/${book.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        if (book.cover_url) {
          sitemap += `
    <image:image>
      <image:loc>${book.cover_url}</image:loc>
      <image:title>${book.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
      }
    }

    if (audiobooks) {
      for (const audiobook of audiobooks) {
        const lastmod = audiobook.updated_at ? new Date(audiobook.updated_at).toISOString().split('T')[0] : currentDate;
        sitemap += `
  <url>
    <loc>${baseUrl}/audiobooks/${audiobook.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        if (audiobook.cover_url) {
          sitemap += `
    <image:image>
      <image:loc>${audiobook.cover_url}</image:loc>
      <image:title>${audiobook.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
      }
    }

    if (blogPosts) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : currentDate;
        sitemap += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;

        if (post.cover_url) {
          sitemap += `
    <image:image>
      <image:loc>${post.cover_url}</image:loc>
      <image:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
      }
    }

    sitemap += `
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
