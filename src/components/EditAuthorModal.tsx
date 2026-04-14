import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface EditAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  author: any;
}

export function EditAuthorModal({ isOpen, onClose, onSuccess, author }: EditAuthorModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photo_url: '',
  });

  useEffect(() => {
    if (author && isOpen) {
      setFormData({
        name: author.name || '',
        bio: author.bio || '',
        photo_url: author.photo_url || '',
      });
      setImagePreview(author.photo_url || '');
      setImageFile(null);
    }
  }, [author, isOpen]);

  if (!isOpen || !author) return null;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter author name', 'error');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = formData.photo_url;

      if (imageFile) {
        if (formData.photo_url) {
          const oldPath = formData.photo_url.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('author-images')
              .remove([oldPath]);
          }
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('author-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('author-images')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      const slug = generateSlug(formData.name);

      const { error } = await supabase
        .from('authors')
        .update({
          name: formData.name.trim(),
          slug: slug,
          bio: formData.bio.trim() || null,
          photo_url: photoUrl || null,
        })
        .eq('id', author.id);

      if (error) throw error;

      showToast('Author updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating author:', error);
      showToast(error.message || 'Failed to update author', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setImageFile(null);
      setImagePreview('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Author</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter author name"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biography
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Enter author biography"
                disabled={loading}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Photo
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2" />
                  <span>{imageFile ? 'Change Image' : imagePreview ? 'Replace Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Author'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
