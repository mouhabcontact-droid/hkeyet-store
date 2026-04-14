import React, { useEffect, useState } from 'react';
import { Save, ArrowLeft, Upload, X, Plus, GripVertical, Trash2, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';

interface Chapter {
  id?: string;
  title: string;
  chapter_number: number;
  audio_url: string;
  duration_seconds: number;
  display_order: number;
  file?: File;
}

interface Category {
  id: string;
  name: string;
}

export default function AudiobookEditor() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [audiobookId, setAudiobookId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    author: '',
    narrator: '',
    language: 'fr',
    isbn: '',
    price: 0,
    category_id: '',
    is_featured: false,
    is_new_release: false,
    is_published: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCategories();
    const pathId = window.location.pathname.split('/').pop();
    if (pathId && pathId !== 'new') {
      setAudiobookId(pathId);
      fetchAudiobook(pathId);
    }
  }, [user, profile]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const fetchAudiobook = async (id: string) => {
    setLoading(true);
    try {
      const { data: audiobook, error } = await supabase
        .from('audiobooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (audiobook) {
        setFormData({
          title: audiobook.title,
          slug: audiobook.slug,
          description: audiobook.description || '',
          short_description: audiobook.short_description || '',
          author: audiobook.author,
          narrator: audiobook.narrator || '',
          language: audiobook.language || 'fr',
          isbn: audiobook.isbn || '',
          price: audiobook.price,
          category_id: audiobook.category_id || '',
          is_featured: audiobook.is_featured,
          is_new_release: audiobook.is_new_release,
          is_published: audiobook.is_published,
          seo_title: audiobook.seo_title || '',
          seo_description: audiobook.seo_description || '',
          seo_keywords: audiobook.seo_keywords || '',
        });
        setCoverPreview(audiobook.cover_url || '');

        const { data: chaptersData } = await supabase
          .from('audiobook_chapters')
          .select('*')
          .eq('audiobook_id', id)
          .order('display_order');

        if (chaptersData) {
          setChapters(chaptersData);
        }
      }
    } catch (error) {
      console.error('Error fetching audiobook:', error);
      alert('Failed to load audiobook');
      navigate('/admin/audiobooks');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: !audiobookId ? generateSlug(title) : formData.slug,
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleFile(file);
    }
  };

  const handleChapterAudioChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        const duration = Math.floor(audio.duration);
        const newChapters = [...chapters];
        newChapters[index].file = file;
        newChapters[index].duration_seconds = duration;
        setChapters(newChapters);
        URL.revokeObjectURL(audio.src);
      };
    }
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        title: '',
        chapter_number: chapters.length + 1,
        audio_url: '',
        duration_seconds: 0,
        display_order: chapters.length + 1,
      },
    ]);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const updateChapter = (index: number, field: string, value: any) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const uploadCover = async (audiobookId: string): Promise<string | null> => {
    if (!coverFile) return coverPreview || null;

    const fileExt = coverFile.name.split('.').pop();
    const fileName = `${audiobookId}-cover-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('audiobook-covers')
      .upload(filePath, coverFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('audiobook-covers').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const uploadSample = async (audiobookId: string): Promise<string | null> => {
    if (!sampleFile) return null;

    const fileExt = sampleFile.name.split('.').pop();
    const fileName = `sample-${Date.now()}.${fileExt}`;
    const filePath = `books/${audiobookId}/samples/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audiobook-files')
      .upload(filePath, sampleFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('audiobook-files').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const uploadChapterAudio = async (audiobookId: string, chapter: Chapter, index: number): Promise<string> => {
    if (!chapter.file) {
      if (chapter.audio_url && chapter.audio_url.includes('supabase')) {
        return chapter.audio_url;
      }
      throw new Error(`Chapter ${index + 1} has no audio file`);
    }

    const fileExt = chapter.file.name.split('.').pop();
    const fileName = `chapter-${chapter.chapter_number}-${Date.now()}.${fileExt}`;
    const filePath = `books/${audiobookId}/chapters/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audiobook-files')
      .upload(filePath, chapter.file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('audiobook-files').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let currentAudiobookId = audiobookId;
      let coverUrl = coverPreview;
      let sampleUrl = '';

      if (coverFile) {
        coverUrl = (await uploadCover(currentAudiobookId || 'temp')) || '';
      }

      const totalDuration = chapters.reduce((sum, ch) => sum + ch.duration_seconds, 0);

      const audiobookData: any = {
        ...formData,
        cover_url: coverUrl,
        duration_seconds: totalDuration,
        published_at: formData.is_published ? new Date().toISOString() : null,
      };

      if (currentAudiobookId) {
        const { error } = await supabase.from('audiobooks').update(audiobookData).eq('id', currentAudiobookId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('audiobooks').insert([audiobookData]).select().single();
        if (error) throw error;
        currentAudiobookId = data.id;
      }

      if (sampleFile && currentAudiobookId) {
        sampleUrl = (await uploadSample(currentAudiobookId)) || '';
        await supabase.from('audiobooks').update({ sample_audio_url: sampleUrl }).eq('id', currentAudiobookId);
      }

      if (currentAudiobookId && chapters.length > 0) {
        if (audiobookId) {
          await supabase.from('audiobook_chapters').delete().eq('audiobook_id', audiobookId);
        }

        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          const audioUrl = await uploadChapterAudio(currentAudiobookId, chapter, i);

          await supabase.from('audiobook_chapters').insert([{
            audiobook_id: currentAudiobookId,
            title: chapter.title,
            chapter_number: chapter.chapter_number,
            audio_url: audioUrl,
            duration_seconds: chapter.duration_seconds,
            display_order: i + 1,
          }]);
        }
      }

      navigate('/admin/audiobooks');
    } catch (error) {
      console.error('Error saving audiobook:', error);
      alert('Failed to save audiobook');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-[#F05A28] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin/audiobooks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Audiobooks
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {audiobookId ? 'Edit Audiobook' : 'Create New Audiobook'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Narrator
                </label>
                <input
                  type="text"
                  value={formData.narrator}
                  onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (TND) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                >
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  placeholder="Brief one-line description"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <div className="flex items-start gap-4">
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-32 h-48 object-cover rounded shadow-sm"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 400x600px or similar ratio</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Audio (Optional)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSampleChange}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Short preview for users to listen before purchase</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chapters</h2>
              <div className="space-y-4 mb-4">
                {chapters.map((chapter, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <div className="w-20">
                            <input
                              type="number"
                              value={chapter.chapter_number}
                              onChange={(e) => updateChapter(index, 'chapter_number', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="#"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) => updateChapter(index, 'title', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded"
                              placeholder="Chapter title"
                            />
                          </div>
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleChapterAudioChange(index, e)}
                            className="w-full text-sm"
                          />
                          {chapter.audio_url && !chapter.file && (
                            <p className="text-xs text-green-600 mt-1">Audio file uploaded</p>
                          )}
                          {chapter.duration_seconds > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Duration: {Math.floor(chapter.duration_seconds / 60)}m {chapter.duration_seconds % 60}s
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChapter(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addChapter}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#F05A28] hover:text-[#F05A28] transition-colors w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                Add Chapter
              </button>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                    placeholder="Leave empty to use title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                    placeholder="Leave empty to use description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                    placeholder="comma, separated, keywords"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_new_release}
                    onChange={(e) => setFormData({ ...formData, is_new_release: e.target.checked })}
                    className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
                  />
                  <span className="text-sm font-medium text-gray-700">New Release</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/audiobooks')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 bg-[#F05A28] text-white px-6 py-2 rounded-lg hover:bg-[#d94d1f] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Upload className="w-5 h-5 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Audiobook
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
