export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  if (locale === 'fr') {
    return d.toLocaleDateString('fr-FR', options);
  } else if (locale === 'ar') {
    return d.toLocaleDateString('ar-SA', options);
  }

  return d.toLocaleDateString('en-US', options);
}

export function getRelativeTime(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return locale === 'fr' ? 'À l\'instant' : locale === 'ar' ? 'الآن' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (locale === 'fr') return `Il y a ${diffInMinutes} min`;
    if (locale === 'ar') return `منذ ${diffInMinutes} دقيقة`;
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (locale === 'fr') return `Il y a ${diffInHours}h`;
    if (locale === 'ar') return `منذ ${diffInHours} ساعة`;
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (locale === 'fr') return `Il y a ${diffInDays}j`;
    if (locale === 'ar') return `منذ ${diffInDays} يوم`;
    return `${diffInDays}d ago`;
  }

  return formatDate(d, locale);
}
