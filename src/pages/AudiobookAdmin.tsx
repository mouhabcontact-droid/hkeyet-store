import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Eye, EyeOff, Star, Headphones } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { navigate } from '../utils/navigation';

interface Audiobook {
  id: string;
  title: string;
  slug: string;
  author: string;
  narrator: string;
  duration_seconds: number;
  price: number;
  cover_url: string;
  is_published: boolean;
  is_featured: boolean;
  is_new_release: boolean;
  published_at: string;
  created_at: string;
  category_id: string;
  categories?: { name: string };
}

export default function AudiobookAdmin() {
  const { user, profile } = useAuth();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAudiobooks();
  }, [user, profile, filterStatus]);

  const fetchAudiobooks = async () => {
    try {
      let query = supabase
        .from('audiobooks')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (filterStatus === 'published') {
        query = query.eq('is_published', true);
      } else if (filterStatus === 'draft') {
        query = query.eq('is_published', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAudiobooks(data || []);
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all chapters.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('audiobooks').delete().eq('id', id);

      if (error) throw error;
      setAudiobooks(audiobooks.filter((ab) => ab.id !== id));
    } catch (error) {
      console.error('Error deleting audiobook:', error);
      alert('Failed to delete audiobook');
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('audiobooks')
        .update({
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
      fetchAudiobooks();
    } catch (error) {
      console.error('Error updating audiobook:', error);
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('audiobooks')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAudiobooks();
    } catch (error) {
      console.error('Error updating audiobook:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredAudiobooks = audiobooks.filter((audiobook) =>
    audiobook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audiobook.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audiobook.narrator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Headphones className="w-12 h-12 text-[#F05A28] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading audiobooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Headphones className="w-8 h-8 text-[#F05A28]" />
              Audiobook Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your audiobook catalog</p>
          </div>
          <button
            onClick={() => navigate('/admin/audiobooks/new')}
            className="flex items-center gap-2 bg-[#F05A28] text-white px-6 py-3 rounded-lg hover:bg-[#d94d1f] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Audiobook
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audiobooks by title, author, or narrator..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-[#F05A28] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'published'
                    ? 'bg-[#F05A28] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'draft'
                    ? 'bg-[#F05A28] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {filteredAudiobooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Headphones className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No audiobooks found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first audiobook'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/admin/audiobooks/new')}
                className="inline-flex items-center gap-2 bg-[#F05A28] text-white px-6 py-3 rounded-lg hover:bg-[#d94d1f] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Audiobook
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audiobook
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author / Narrator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAudiobooks.map((audiobook) => (
                    <tr key={audiobook.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={audiobook.cover_url || 'https://via.placeholder.com/100x150?text=No+Cover'}
                            alt={audiobook.title}
                            className="w-12 h-16 object-cover rounded shadow-sm"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{audiobook.title}</div>
                            {audiobook.categories && (
                              <div className="text-xs text-gray-500 mt-1">{audiobook.categories.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{audiobook.author}</div>
                        {audiobook.narrator && (
                          <div className="text-xs text-gray-500 mt-1">
                            <Headphones className="w-3 h-3 inline mr-1" />
                            {audiobook.narrator}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDuration(audiobook.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(audiobook.price, 'fr')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              audiobook.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {audiobook.is_published ? 'Published' : 'Draft'}
                          </span>
                          {audiobook.is_featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePublished(audiobook.id, audiobook.is_published)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title={audiobook.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {audiobook.is_published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleFeatured(audiobook.id, audiobook.is_featured)}
                            className={`p-2 rounded-lg transition-colors ${
                              audiobook.is_featured
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title={audiobook.is_featured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className={`w-4 h-4 ${audiobook.is_featured ? 'fill-yellow-600' : ''}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/audiobooks/edit/${audiobook.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(audiobook.id, audiobook.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
