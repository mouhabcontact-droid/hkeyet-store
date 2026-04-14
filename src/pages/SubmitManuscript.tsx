import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { Toast } from '../components/Toast';

interface Manuscript {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  status: 'not_reviewed' | 'reviewing' | 'accepted' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function SubmitManuscript() {
  const { user } = useAuth();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadManuscript();
  }, [user, navigate]);

  const loadManuscript = async () => {
    try {
      const { data, error } = await supabase
        .from('manuscripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setManuscript(data);
    } catch (error) {
      console.error('Error loading manuscript:', error);
      setToast({ message: 'Failed to load manuscript', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      setToast({ message: 'File size must be less than 20MB', type: 'error' });
      e.target.value = '';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Only PDF, TXT, DOC, and DOCX files are allowed', type: 'error' });
      e.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.file) return;

    setSubmitting(true);
    try {
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('manuscripts')
        .upload(fileName, formData.file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('manuscripts')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          file_url: fileName,
          file_name: formData.file.name,
          file_size: formData.file.size
        });

      if (insertError) throw insertError;

      setToast({ message: 'Manuscript submitted successfully!', type: 'success' });
      setFormData({ title: '', description: '', file: null });
      loadManuscript();
    } catch (error: any) {
      console.error('Error submitting manuscript:', error);
      setToast({
        message: error.message || 'Failed to submit manuscript',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={24} />;
      case 'reviewing':
        return <Eye className="text-blue-500" size={24} />;
      default:
        return <Clock className="text-gray-500" size={24} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_reviewed':
        return 'Not Reviewed';
      case 'reviewing':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const canSubmit = manuscript?.status === 'accepted' || manuscript?.status === 'rejected' || !manuscript;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit Your Manuscript</h1>

          {manuscript && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(manuscript.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{manuscript.title}</h3>
                    <p className="text-sm text-gray-500">Status: {getStatusText(manuscript.status)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">File:</span> {manuscript.file_name}</p>
                <p><span className="font-medium">Size:</span> {formatFileSize(manuscript.file_size)}</p>
                <p><span className="font-medium">Submitted:</span> {new Date(manuscript.created_at).toLocaleDateString()}</p>
                {manuscript.description && (
                  <p><span className="font-medium">Description:</span> {manuscript.description}</p>
                )}
                {manuscript.admin_notes && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="font-medium text-blue-900">Admin Notes:</p>
                    <p className="text-blue-800 mt-1">{manuscript.admin_notes}</p>
                  </div>
                )}
              </div>

              {!canSubmit && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    You cannot submit a new manuscript while your current submission is under review.
                    Please wait for the review process to complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {canSubmit ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manuscript Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your manuscript title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a brief description of your manuscript (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manuscript File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          required
                          onChange={handleFileChange}
                          accept=".pdf,.txt,.doc,.docx"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, TXT, DOC, DOCX up to 20MB
                    </p>
                    {formData.file && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-700">
                        <FileText size={16} />
                        <span>{formData.file.name}</span>
                        <span className="text-gray-500">({formatFileSize(formData.file.size)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Manuscript'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                You can submit a new manuscript once your current submission has been reviewed.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
