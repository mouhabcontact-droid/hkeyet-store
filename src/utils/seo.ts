export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  author?: string;
  price?: string;
  availability?: string;
}

export const generateBookSEO = (book: any): SEOMetadata => {
  const bookTitle = book.title || '';
  const authorName = book.authors?.name || book.author || '';
  const description = book.description || `Achetez ${bookTitle} par ${authorName} en ligne en Tunisie. Livraison rapide et paiement sécurisé.`;

  return {
    title: `${bookTitle} - ${authorName} | Librairie en Ligne Tunisie`,
    description: description.slice(0, 160),
    keywords: [
      bookTitle.toLowerCase(),
      authorName.toLowerCase(),
      'livre tunisie',
      'acheter livre en ligne tunisie',
      'librairie tunisie',
      'livre français tunisie',
      book.genre?.toLowerCase() || '',
      'commander livre tunisie',
      'livraison livre tunisie',
      'achat livre',
    ].filter(Boolean),
    ogImage: book.cover_url || '/default-book.jpg',
    ogType: 'book',
    author: authorName,
    price: book.price ? `${book.price} DT` : undefined,
    availability: book.stock && book.stock > 0 ? 'in stock' : 'out of stock',
  };
};

export const generatePageSEO = (page: string): SEOMetadata => {
  const seoPages: Record<string, SEOMetadata> = {
    home: {
      title: 'Librairie en Ligne Tunisie #1 | Achat Livres & Ebooks | Livraison Rapide',
      description: 'Meilleure librairie en ligne en Tunisie. Achetez des milliers de livres et ebooks en français. Livraison rapide partout en Tunisie. Paiement sécurisé.',
      keywords: [
        'librairie tunisie',
        'acheter livre en ligne tunisie',
        'librairie en ligne tunisie',
        'achat livre tunisie',
        'livre tunisie',
        'ebook tunisie',
        'commander livre tunisie',
        'livres français tunisie',
        'boutique livre tunisie',
        'vente livre tunisie'
      ],
    },
    books: {
      title: 'Tous les Livres | Librairie en Ligne Tunisie | Catalogue Complet',
      description: 'Parcourez notre collection complète de livres disponibles en Tunisie. Romans, essais, livres pour enfants et plus. Achat en ligne avec livraison rapide.',
      keywords: [
        'catalogue livres tunisie',
        'tous les livres tunisie',
        'acheter livres tunisie',
        'collection livres',
        'livres en français',
        'nouveautés livres tunisie',
      ],
    },
    ebooks: {
      title: 'Ebooks en Ligne Tunisie | Livres Numériques à Télécharger',
      description: 'Téléchargez des ebooks en français instantanément. Large collection de livres numériques disponibles en Tunisie. Lecture sur tous vos appareils.',
      keywords: [
        'ebook tunisie',
        'livre numérique tunisie',
        'télécharger ebook',
        'acheter ebook tunisie',
        'livres électroniques',
        'ebook français tunisie',
      ],
    },
    authors: {
      title: 'Nos Auteurs | Écrivains et Auteurs Tunisiens et Internationaux',
      description: 'Découvrez nos auteurs tunisiens et internationaux. Explorez les œuvres de vos écrivains préférés disponibles en Tunisie.',
      keywords: [
        'auteurs tunisiens',
        'écrivains tunisie',
        'auteurs français',
        'livres par auteur',
      ],
    },
    login: {
      title: 'Connexion | Mon Compte Librairie Tunisie',
      description: 'Connectez-vous à votre compte pour accéder à votre bibliothèque, vos commandes et vos ebooks.',
      keywords: ['connexion', 'mon compte', 'se connecter'],
    },
    signup: {
      title: 'Créer un Compte | Inscription Librairie en Ligne Tunisie',
      description: 'Créez votre compte gratuit pour acheter des livres, accéder à vos ebooks et suivre vos commandes.',
      keywords: ['inscription', 'créer compte', "s'inscrire", 'nouveau compte'],
    },
  };

  return seoPages[page] || {
    title: 'Librairie en Ligne Tunisie',
    description: 'Achetez des livres en ligne en Tunisie',
    keywords: ['librairie tunisie', 'acheter livre'],
  };
};

export const generateStructuredData = (type: 'website' | 'book' | 'organization', data?: any) => {
  const baseUrl = window.location.origin;

  if (type === 'organization') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Librairie en Ligne Tunisie',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: 'La meilleure librairie en ligne en Tunisie pour acheter des livres et ebooks',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TN',
        addressLocality: 'Tunis',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Service Client',
        areaServed: 'TN',
        availableLanguage: ['French', 'Arabic'],
      },
      sameAs: [
        // Add social media links here
      ],
    };
  }

  if (type === 'book' && data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: data.title,
      author: {
        '@type': 'Person',
        name: data.authors?.name || data.author,
      },
      image: data.cover_url,
      description: data.description,
      isbn: data.isbn,
      bookFormat: 'https://schema.org/Paperback',
      inLanguage: 'fr',
      offers: {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: 'TND',
        availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Librairie en Ligne Tunisie',
        },
      },
      publisher: {
        '@type': 'Organization',
        name: data.publisher || 'Librairie en Ligne Tunisie',
      },
      ...(data.published_date && { datePublished: data.published_date }),
    };
  }

  if (type === 'website') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Librairie en Ligne Tunisie',
      url: baseUrl,
      description: 'Librairie en ligne numéro 1 en Tunisie',
      inLanguage: 'fr',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/books?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  return null;
};
