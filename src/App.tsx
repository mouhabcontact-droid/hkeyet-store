import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Cart } from './components/Cart';
import { Home } from './pages/Home';
import { Books } from './pages/Books';
import { BookDetail } from './pages/BookDetail';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Authors } from './pages/Authors';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Ebooks } from './pages/Ebooks';
import { Library } from './pages/Library';
import { Reader } from './pages/Reader';
import PDFReader from './pages/PDFReader';
import { SiteSettings } from './pages/SiteSettings';
import SubmitManuscript from './pages/SubmitManuscript';
import ManageManuscripts from './pages/ManageManuscripts';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { BlogAdmin } from './pages/BlogAdmin';
import { BlogEditor } from './pages/BlogEditor';
import Audiobooks from './pages/Audiobooks';
import AudiobookDetail from './pages/AudiobookDetail';
import AudiobookPlayer from './pages/AudiobookPlayer';
import AudiobookAdmin from './pages/AudiobookAdmin';
import AudiobookEditor from './pages/AudiobookEditor';
import { supabase } from './lib/supabase';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      if (event === 'SIGNED_OUT') {
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [userId]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (userId) {
        fetchCartCount();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [userId]);

  const fetchCartCount = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const renderPage = () => {
    if (currentPath === '/login') return <Login />;
    if (currentPath === '/signup') return <Signup />;
    if (currentPath === '/forgot-password') return <ForgotPassword />;
    if (currentPath === '/reset-password') return <ResetPassword />;
    if (currentPath === '/checkout') return <Checkout />;
    if (currentPath === '/dashboard') return <Dashboard />;
    if (currentPath === '/orders') return <Orders />;
    if (currentPath === '/authors') return <Authors />;
    if (currentPath === '/admin') return <Admin />;
    if (currentPath === '/admin/settings') return <SiteSettings />;
    if (currentPath === '/admin/manuscripts') return <ManageManuscripts />;
    if (currentPath === '/admin/blog') return <BlogAdmin />;
    if (currentPath === '/admin/blog/new') return <BlogEditor />;
    if (currentPath === '/admin/audiobooks') return <AudiobookAdmin />;
    if (currentPath === '/admin/audiobooks/new') return <AudiobookEditor />;
    if (currentPath === '/submit-manuscript') return <SubmitManuscript />;
    if (currentPath === '/books') return <Books />;
    if (currentPath === '/ebooks') return <Ebooks />;
    if (currentPath === '/audiobooks') return <Audiobooks />;
    if (currentPath === '/library') return <Library />;
    if (currentPath === '/pdf-reader') return <PDFReader />;
    if (currentPath === '/blog') return <Blog />;

    const audioEditMatch = currentPath.match(/^\/admin\/audiobooks\/edit\/(.+)$/);
    if (audioEditMatch) {
      return <AudiobookEditor />;
    }

    const blogEditMatch = currentPath.match(/^\/admin\/blog\/edit\/(.+)$/);
    if (blogEditMatch) {
      return <BlogEditor postId={blogEditMatch[1]} />;
    }

    const blogPostMatch = currentPath.match(/^\/blog\/(.+)$/);
    if (blogPostMatch) {
      return <BlogPost slug={blogPostMatch[1]} />;
    }

    const audiobookMatch = currentPath.match(/^\/audiobooks\/(.+)$/);
    if (audiobookMatch) {
      return <AudiobookDetail />;
    }

    const bookMatch = currentPath.match(/^\/books\/(.+)$/);
    if (bookMatch) {
      return <BookDetail slug={bookMatch[1]} />;
    }

    const listenMatch = currentPath.match(/^\/listen\/(.+)$/);
    if (listenMatch) {
      return <AudiobookPlayer />;
    }

    const readerMatch = currentPath.match(/^\/reader\/(.+)$/);
    if (readerMatch) {
      const params = new URLSearchParams(window.location.search);
      const preview = params.get('preview') === 'true';
      return <Reader ebookId={readerMatch[1]} preview={preview} />;
    }

    return <Home />;
  };

  const showLayout = currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/forgot-password' && currentPath !== '/reset-password' && !currentPath.startsWith('/reader') && !currentPath.startsWith('/listen') && currentPath !== '/pdf-reader';

  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            {showLayout && (
              <Header
                cartItemCount={cartCount}
                onCartClick={() => setCartOpen(true)}
              />
            )}

            <main className="flex-1">
              {renderPage()}
            </main>

            {showLayout && <Footer />}

            <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          </div>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
