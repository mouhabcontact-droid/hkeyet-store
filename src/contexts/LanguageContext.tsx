import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.books': 'Livres',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',
    'nav.logout': 'Déconnexion',
    'nav.dashboard': 'Tableau de bord',
    'nav.admin': 'Administration',

    'home.hero.title': 'Découvrez Votre Prochaine Grande Lecture',
    'home.hero.subtitle': 'Explorez notre collection soigneusement sélectionnée de livres couvrant tous les genres et intérêts.',
    'home.hero.cta': 'Parcourir les Livres',
    'home.featured': 'Livres en Vedette',
    'home.bestsellers': 'Meilleures Ventes',
    'home.new': 'Nouvelles Sorties',

    'books.title': 'Notre Collection',
    'books.search': 'Rechercher des livres...',
    'books.filter': 'Filtrer par catégorie',
    'books.all': 'Tous les Livres',
    'books.addToCart': 'Ajouter au Panier',
    'books.outOfStock': 'Épuisé',
    'books.inStock': 'En stock',
    'books.viewDetails': 'Voir les détails',

    'cart.title': 'Panier',
    'cart.empty': 'Votre panier est vide',
    'cart.subtotal': 'Sous-total',
    'cart.shipping': 'Livraison',
    'cart.tax': 'Taxe',
    'cart.total': 'Total',
    'cart.checkout': 'Passer la commande',
    'cart.continueShopping': 'Continuer vos achats',
    'cart.remove': 'Retirer',
    'cart.quantity': 'Quantité',

    'checkout.title': 'Paiement',
    'checkout.shipping': 'Informations de livraison',
    'checkout.payment': 'Mode de paiement',
    'checkout.fullName': 'Nom complet',
    'checkout.phone': 'Numéro de téléphone',
    'checkout.address': 'Adresse',
    'checkout.city': 'Ville',
    'checkout.postalCode': 'Code postal',
    'checkout.country': 'Pays',
    'checkout.creditCard': 'Carte de crédit',
    'checkout.creditCard.desc': 'Payez en toute sécurité avec votre carte',
    'checkout.paypal': 'PayPal',
    'checkout.paypal.desc': 'Payez avec votre compte PayPal',
    'checkout.cod': 'Paiement à la livraison',
    'checkout.cod.desc': 'Payez à la réception de votre commande',
    'checkout.placeOrder': 'Passer la commande',
    'checkout.processing': 'Traitement en cours...',
    'checkout.orderSummary': 'Résumé de la commande',
    'checkout.freeShipping': 'GRATUIT',
    'checkout.success': 'Commande confirmée !',
    'checkout.thankYou': 'Merci pour votre commande. Vos livres sont en cours de préparation.',
    'checkout.orderNumber': 'Numéro de commande',
    'checkout.viewOrder': 'Voir les détails',
    'checkout.backToShopping': 'Retour au shopping',

    'auth.login': 'Connexion',
    'auth.signup': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.noAccount': 'Pas de compte ?',
    'auth.hasAccount': 'Vous avez déjà un compte ?',
    'auth.signupNow': 'Inscrivez-vous',
    'auth.loginNow': 'Connectez-vous',

    'admin.title': 'Administration',
    'admin.orders': 'Commandes',
    'admin.books': 'Livres',
    'admin.addBook': 'Ajouter un livre',
    'admin.orderNumber': 'Numéro',
    'admin.customer': 'Client',
    'admin.amount': 'Montant',
    'admin.status': 'Statut',
    'admin.date': 'Date',
    'admin.actions': 'Actions',
    'admin.viewDetails': 'Voir les détails',
    'admin.pending': 'En attente',
    'admin.processing': 'En traitement',
    'admin.shipped': 'Expédié',
    'admin.delivered': 'Livré',
    'admin.cancelled': 'Annulé',

    'dashboard.title': 'Mon compte',
    'dashboard.orders': 'Mes commandes',
    'dashboard.noOrders': 'Vous n\'avez pas encore passé de commande',
    'dashboard.startShopping': 'Commencer vos achats',

    'footer.about': 'À propos de HKEYET',
    'footer.description': 'Votre librairie en ligne de confiance offrant une large sélection de livres pour tous les lecteurs.',
    'footer.quickLinks': 'Liens rapides',
    'footer.categories': 'Catégories',
    'footer.contact': 'Contact',
    'footer.rights': 'Tous droits réservés.',

    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.currency': 'TND',
  },

  ar: {
    'nav.home': 'الرئيسية',
    'nav.books': 'الكتب',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.logout': 'تسجيل الخروج',
    'nav.dashboard': 'لوحة التحكم',
    'nav.admin': 'الإدارة',

    'home.hero.title': 'اكتشف قراءتك الرائعة القادمة',
    'home.hero.subtitle': 'استكشف مجموعتنا المختارة بعناية من الكتب التي تغطي جميع الأنواع والاهتمامات.',
    'home.hero.cta': 'تصفح الكتب',
    'home.featured': 'كتب مميزة',
    'home.bestsellers': 'الأكثر مبيعاً',
    'home.new': 'إصدارات جديدة',

    'books.title': 'مجموعتنا',
    'books.search': 'البحث عن الكتب...',
    'books.filter': 'تصفية حسب الفئة',
    'books.all': 'جميع الكتب',
    'books.addToCart': 'أضف إلى السلة',
    'books.outOfStock': 'نفذت الكمية',
    'books.inStock': 'متوفر',
    'books.viewDetails': 'عرض التفاصيل',

    'cart.title': 'سلة التسوق',
    'cart.empty': 'سلة التسوق فارغة',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'الشحن',
    'cart.tax': 'الضريبة',
    'cart.total': 'المجموع',
    'cart.checkout': 'إتمام الطلب',
    'cart.continueShopping': 'متابعة التسوق',
    'cart.remove': 'إزالة',
    'cart.quantity': 'الكمية',

    'checkout.title': 'الدفع',
    'checkout.shipping': 'معلومات الشحن',
    'checkout.payment': 'طريقة الدفع',
    'checkout.fullName': 'الاسم الكامل',
    'checkout.phone': 'رقم الهاتف',
    'checkout.address': 'العنوان',
    'checkout.city': 'المدينة',
    'checkout.postalCode': 'الرمز البريدي',
    'checkout.country': 'البلد',
    'checkout.creditCard': 'بطاقة الائتمان',
    'checkout.creditCard.desc': 'ادفع بأمان ببطاقتك',
    'checkout.paypal': 'باي بال',
    'checkout.paypal.desc': 'ادفع بحساب PayPal الخاص بك',
    'checkout.cod': 'الدفع عند الاستلام',
    'checkout.cod.desc': 'ادفع عند استلام طلبك',
    'checkout.placeOrder': 'تأكيد الطلب',
    'checkout.processing': 'جاري المعالجة...',
    'checkout.orderSummary': 'ملخص الطلب',
    'checkout.freeShipping': 'مجاني',
    'checkout.success': 'تم تأكيد الطلب!',
    'checkout.thankYou': 'شكراً لطلبك. كتبك قيد التحضير للشحن.',
    'checkout.orderNumber': 'رقم الطلب',
    'checkout.viewOrder': 'عرض التفاصيل',
    'checkout.backToShopping': 'العودة للتسوق',

    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'هل نسيت كلمة المرور؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.signupNow': 'سجل الآن',
    'auth.loginNow': 'سجل دخول',

    'admin.title': 'الإدارة',
    'admin.orders': 'الطلبات',
    'admin.books': 'الكتب',
    'admin.addBook': 'إضافة كتاب',
    'admin.orderNumber': 'الرقم',
    'admin.customer': 'العميل',
    'admin.amount': 'المبلغ',
    'admin.status': 'الحالة',
    'admin.date': 'التاريخ',
    'admin.actions': 'الإجراءات',
    'admin.viewDetails': 'عرض التفاصيل',
    'admin.pending': 'قيد الانتظار',
    'admin.processing': 'قيد المعالجة',
    'admin.shipped': 'تم الشحن',
    'admin.delivered': 'تم التسليم',
    'admin.cancelled': 'ملغي',

    'dashboard.title': 'حسابي',
    'dashboard.orders': 'طلباتي',
    'dashboard.noOrders': 'لم تقم بأي طلبات بعد',
    'dashboard.startShopping': 'ابدأ التسوق',

    'footer.about': 'عن HKEYET',
    'footer.description': 'متجر الكتب الموثوق به على الإنترنت الذي يقدم مجموعة واسعة من الكتب لجميع القراء.',
    'footer.quickLinks': 'روابط سريعة',
    'footer.categories': 'الفئات',
    'footer.contact': 'اتصل بنا',
    'footer.rights': 'جميع الحقوق محفوظة.',

    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.currency': 'دت',
  },

  en: {
    'nav.home': 'Home',
    'nav.books': 'Books',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',

    'home.hero.title': 'Discover Your Next Great Read',
    'home.hero.subtitle': 'Explore our carefully curated collection of books spanning all genres and interests.',
    'home.hero.cta': 'Browse Books',
    'home.featured': 'Featured Books',
    'home.bestsellers': 'Bestsellers',
    'home.new': 'New Releases',

    'books.title': 'Our Collection',
    'books.search': 'Search books...',
    'books.filter': 'Filter by category',
    'books.all': 'All Books',
    'books.addToCart': 'Add to Cart',
    'books.outOfStock': 'Out of Stock',
    'books.inStock': 'In stock',
    'books.viewDetails': 'View details',

    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.continueShopping': 'Continue Shopping',
    'cart.remove': 'Remove',
    'cart.quantity': 'Quantity',

    'checkout.title': 'Checkout',
    'checkout.shipping': 'Shipping Information',
    'checkout.payment': 'Payment Method',
    'checkout.fullName': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.postalCode': 'Postal Code',
    'checkout.country': 'Country',
    'checkout.creditCard': 'Credit Card',
    'checkout.creditCard.desc': 'Pay securely with your credit card',
    'checkout.paypal': 'PayPal',
    'checkout.paypal.desc': 'Pay with your PayPal account',
    'checkout.cod': 'Cash on Delivery',
    'checkout.cod.desc': 'Pay when you receive your order',
    'checkout.placeOrder': 'Place Order',
    'checkout.processing': 'Processing...',
    'checkout.orderSummary': 'Order Summary',
    'checkout.freeShipping': 'FREE',
    'checkout.success': 'Order Confirmed!',
    'checkout.thankYou': 'Thank you for your order. Your books are being prepared for shipment.',
    'checkout.orderNumber': 'Order Number',
    'checkout.viewOrder': 'View Order Details',
    'checkout.backToShopping': 'Continue Shopping',

    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.signupNow': 'Sign up',
    'auth.loginNow': 'Login',

    'admin.title': 'Admin Panel',
    'admin.orders': 'Orders',
    'admin.books': 'Books',
    'admin.addBook': 'Add Book',
    'admin.orderNumber': 'Order #',
    'admin.customer': 'Customer',
    'admin.amount': 'Amount',
    'admin.status': 'Status',
    'admin.date': 'Date',
    'admin.actions': 'Actions',
    'admin.viewDetails': 'View Details',
    'admin.pending': 'Pending',
    'admin.processing': 'Processing',
    'admin.shipped': 'Shipped',
    'admin.delivered': 'Delivered',
    'admin.cancelled': 'Cancelled',

    'dashboard.title': 'My Account',
    'dashboard.orders': 'My Orders',
    'dashboard.noOrders': 'You haven\'t placed any orders yet',
    'dashboard.startShopping': 'Start Shopping',

    'footer.about': 'About HKEYET',
    'footer.description': 'Your trusted online bookstore offering a wide selection of books for every reader.',
    'footer.quickLinks': 'Quick Links',
    'footer.categories': 'Categories',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',

    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.currency': 'TND',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState('fr');
    localStorage.setItem('language', 'fr');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
