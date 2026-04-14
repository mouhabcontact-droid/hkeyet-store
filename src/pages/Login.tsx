import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';
import { generatePageSEO } from '../utils/seo';

export function Login() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const seo = generatePageSEO('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <SEO {...seo} />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-[#F05A28]" />
            <span className="font-serif text-3xl font-bold text-gray-900">HKEYET</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">{t('auth.login')}</h1>
          <p className="text-gray-600">{t('home.hero.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex justify-end -mt-2 mb-4">
              <a
                href="/forgot-password"
                className="text-sm text-[#F05A28] hover:text-[#d94d20] font-medium transition-colors"
              >
                Mot de passe oublié?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? `${t('auth.login')}...` : t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.noAccount')}{' '}
              <a href="/signup" className="text-[#F05A28] hover:text-[#d94d20] font-medium">
                {t('auth.signupNow')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
