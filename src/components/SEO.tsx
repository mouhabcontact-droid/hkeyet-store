import { Helmet } from 'react-helmet-async';
import { SEOMetadata } from '../utils/seo';

interface SEOProps extends SEOMetadata {
  structuredData?: object;
  image?: string;
  type?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  author,
  price,
  availability,
  structuredData,
  image,
  type,
}: SEOProps) {
  const baseUrl = window.location.origin;
  const currentUrl = canonical || window.location.href;
  const defaultImage = `${baseUrl}/og-image.jpg`;

  const finalOgImage = image || ogImage || defaultImage;
  const finalOgType = type || ogType;

  return (
    <Helmet>
      <html lang="fr" />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={currentUrl} />

      <meta property="og:type" content={finalOgType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:locale" content="fr_TN" />
      <meta property="og:site_name" content="Librairie en Ligne Tunisie" />

      {author && <meta property="book:author" content={author} />}
      {price && <meta property="product:price:amount" content={price} />}
      {price && <meta property="product:price:currency" content="TND" />}
      {availability && <meta property="product:availability" content={availability} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />

      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />

      <meta name="geo.region" content="TN" />
      <meta name="geo.placename" content="Tunisia" />
      <meta name="language" content="French" />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
