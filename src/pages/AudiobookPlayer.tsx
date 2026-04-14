import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  List,
  ArrowLeft,
  Settings,
  Clock,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator: string;
  cover_url: string;
  duration_seconds: number;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  audio_url: string;
  duration_seconds: number;
  display_order: number;
}

interface LibraryProgress {
  progress_seconds: number;
  current_chapter_id: string | null;
}

export default function AudiobookPlayer() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const id = window.location.pathname.split('/').pop();
    if (id) {
      fetchAudiobook(id);
    }
  }, [user]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const fetchAudiobook = async (id: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: audiobookData, error: audiobookError } = await supabase
        .from('audiobooks')
        .select('*')
        .eq('id', id)
        .single();

      if (audiobookError || !audiobookData) {
        console.error('Error fetching audiobook:', audiobookError);
        navigate('/audiobooks');
        return;
      }

      const { data: libraryData, error: libraryError } = await supabase
        .from('user_audiobook_library')
        .select('progress_seconds, current_chapter_id')
        .eq('user_id', user.id)
        .eq('audiobook_id', id)
        .maybeSingle();

      if (libraryError) {
        console.error('Error fetching library data:', libraryError);
        navigate('/audiobooks');
        return;
      }

      if (!libraryData) {
        navigate(`/audiobooks/${audiobookData.slug}`);
        return;
      }

      setAudiobook(audiobookData);

      const { data: chaptersData } = await supabase
        .from('audiobook_chapters')
        .select('*')
        .eq('audiobook_id', id)
        .order('display_order');

      if (chaptersData && chaptersData.length > 0) {
        setChapters(chaptersData);

        if (libraryData.current_chapter_id) {
          const chapterIndex = chaptersData.findIndex((ch) => ch.id === libraryData.current_chapter_id);
          if (chapterIndex !== -1) {
            setCurrentChapterIndex(chapterIndex);
          }
        }

        if (audioRef.current && libraryData.progress_seconds > 0) {
          audioRef.current.currentTime = libraryData.progress_seconds;
        }
      }
    } catch (error) {
      console.error('Error fetching audiobook:', error);
      navigate('/audiobooks');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!user || !audioRef.current || !audiobook) return;

    const currentChapter = chapters[currentChapterIndex];
    if (!currentChapter) return;

    const progress = audioRef.current.currentTime;
    const totalDuration = audiobook.duration_seconds || 0;
    const percentage = totalDuration > 0 ? (progress / totalDuration) * 100 : 0;

    try {
      await supabase
        .from('user_audiobook_library')
        .update({
          progress_seconds: Math.floor(progress),
          progress_percentage: percentage,
          current_chapter_id: currentChapter.id,
          last_listened_at: new Date().toISOString(),
          is_completed: percentage >= 95,
        })
        .eq('user_id', user.id)
        .eq('audiobook_id', audiobook.id);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 10000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    saveProgress();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      stopProgressTracking();
    } else {
      audioRef.current.play();
      startProgressTracking();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
    }
  };

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setIsPlaying(false);
    }
  };

  const previousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setIsPlaying(false);
    }
  };

  const selectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setIsPlaying(false);
    setShowChapters(false);
  };

  const handleEnded = () => {
    if (currentChapterIndex < chapters.length - 1) {
      nextChapter();
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } else {
      setIsPlaying(false);
      stopProgressTracking();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-[#F05A28] mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading audiobook...</p>
        </div>
      </div>
    );
  }

  if (!audiobook) {
    return null;
  }

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <BookOpen className="w-16 h-16 text-[#F05A28] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Chapters Available</h2>
          <p className="text-gray-400 mb-6">
            This audiobook doesn't have any chapters yet. Please contact support or try again later.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="px-6 py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d1f] transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Library
        </button>

        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="md:w-1/3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={audiobook.cover_url || 'https://via.placeholder.com/400x600?text=No+Cover'}
                  alt={audiobook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="md:w-2/3 flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{audiobook.title}</h1>
              <p className="text-xl text-gray-300 mb-2">{audiobook.author}</p>
              {audiobook.narrator && (
                <p className="text-lg text-gray-400 mb-4">Narrated by {audiobook.narrator}</p>
              )}

              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Now Playing</p>
                <p className="text-lg font-semibold">
                  Chapter {currentChapter?.chapter_number}: {currentChapter?.title}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <List className="w-5 h-5" />
                  Chapters
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={currentChapter?.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          <div className="space-y-6">
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={previousChapter}
                disabled={currentChapterIndex === 0}
                className="p-3 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={skipBackward}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <div className="relative">
                  <SkipBack className="w-5 h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    15
                  </span>
                </div>
              </button>

              <button
                onClick={togglePlay}
                className="p-6 bg-[#F05A28] hover:bg-[#d94d1f] rounded-full transition-all shadow-lg hover:shadow-xl"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>

              <button
                onClick={skipForward}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <div className="relative">
                  <SkipForward className="w-5 h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    15
                  </span>
                </div>
              </button>

              <button
                onClick={nextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                className="p-3 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  <option value="0.5">0.5×</option>
                  <option value="0.75">0.75×</option>
                  <option value="1">1×</option>
                  <option value="1.25">1.25×</option>
                  <option value="1.5">1.5×</option>
                  <option value="1.75">1.75×</option>
                  <option value="2">2×</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {showChapters && (
          <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-4">Chapters</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => selectChapter(index)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    index === currentChapterIndex
                      ? 'bg-[#F05A28] text-white'
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full text-sm font-bold">
                      {chapter.chapter_number}
                    </span>
                    <span className="font-medium">{chapter.title}</span>
                  </div>
                  <span className="text-sm opacity-70">
                    {formatTime(chapter.duration_seconds)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F05A28;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F05A28;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
