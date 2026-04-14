import React, { useState, useRef } from 'react';
import { Upload, BookOpen, ChevronLeft, ChevronRight, Settings, X, Sun, Moon, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { navigate } from '../utils/navigation';

export default function PDFReader() {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [readerSettings, setReaderSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'sepia',
    fontSize: 18,
    fontFamily: 'Georgia' as 'Georgia' | 'Arial' | 'Times New Roman',
    lineHeight: '1.8',
    margin: 'medium' as 'narrow' | 'medium' | 'wide',
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } else {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        isEvalSupported: false,
        useWorkerFetch: false,
        useSystemFonts: true,
        verbosity: 0,
      }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        pages.push(pageText);
      }

      setPdfPages(pages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF. Please try another file.');
    } finally {
      setLoading(false);
    }
  };

  const getThemeStyles = () => {
    const themes = {
      light: { bg: 'bg-white', text: 'text-gray-900' },
      dark: { bg: 'bg-gray-900', text: 'text-gray-100' },
      sepia: { bg: 'bg-amber-50', text: 'text-amber-900' },
    };
    return themes[readerSettings.theme];
  };

  const getMarginClass = () => {
    const margins = {
      narrow: 'max-w-3xl',
      medium: 'max-w-4xl',
      wide: 'max-w-5xl',
    };
    return margins[readerSettings.margin];
  };

  const theme = getThemeStyles();

  if (pdfPages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <BookOpen className="w-16 h-16 text-[#F05A28] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Reader</h1>
            <p className="text-gray-600 mb-8">
              Upload any PDF file to read it with our premium reading experience
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader className="animate-spin w-6 h-6 text-[#F05A28]" />
                <span className="text-gray-600">Loading PDF...</span>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors text-lg font-semibold"
              >
                <Upload className="w-6 h-6" />
                Choose PDF File
              </button>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-[#F05A28] transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <div className="sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className={`${theme.bg} px-4 py-3`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setPdfPages([]);
                setFileName('');
                setCurrentPage(1);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-sm sm:text-base font-semibold truncate">{fileName}</h1>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm">
              Page {currentPage} of {pdfPages.length}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(pdfPages.length, currentPage + 1))}
              disabled={currentPage === pdfPages.length}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${getMarginClass()} mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12`}
        style={{
          fontSize: `${readerSettings.fontSize}px`,
          fontFamily: readerSettings.fontFamily,
          lineHeight: readerSettings.lineHeight,
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 md:p-12 min-h-[500px]">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {pdfPages[currentPage - 1] || 'No content available for this page.'}
          </p>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Reading Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'light' })}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'light' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <Sun size={20} className="mx-auto" />
                    <span className="block text-xs mt-1">Light</span>
                  </button>
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'dark' })}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'dark' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <Moon size={20} className="mx-auto" />
                    <span className="block text-xs mt-1">Dark</span>
                  </button>
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'sepia' })}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'sepia' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <BookOpen size={20} className="mx-auto" />
                    <span className="block text-xs mt-1">Sepia</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size: {readerSettings.fontSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={readerSettings.fontSize}
                  onChange={(e) =>
                    setReaderSettings({ ...readerSettings, fontSize: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={readerSettings.fontFamily}
                  onChange={(e) =>
                    setReaderSettings({ ...readerSettings, fontFamily: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Margin</label>
                <div className="flex gap-2">
                  {(['narrow', 'medium', 'wide'] as const).map((margin) => (
                    <button
                      key={margin}
                      onClick={() => setReaderSettings({ ...readerSettings, margin })}
                      className={`flex-1 px-4 py-2 border rounded-lg capitalize ${
                        readerSettings.margin === margin ? 'border-[#F05A28] bg-orange-50' : ''
                      }`}
                    >
                      {margin}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
