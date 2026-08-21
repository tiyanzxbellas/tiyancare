import React, { useState, useEffect } from 'react';
import { Zap, Play, Copy, RefreshCw, CheckCircle2, AlertCircle, Clock, ExternalLink, Terminal, Code2 } from 'lucide-react';
import { api } from '../services/api';
import { JobItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { VideoPlayer } from './VideoPlayer';

const SAMPLE_POST_URLS = [
  {
    name: 'Sample Inaka Episode 1',
    url: 'https://nekopoi.care/inaka-ni-wa-kore-kurai-shika-goraku-ga-nai-episode-1-subtitle-indonesia/',
  },
  {
    name: 'Sample Victorian Maid Ep 1',
    url: 'https://nekopoi.care/victorian-maid-maria-no-houshi-episode-1-subtitle-indonesia/',
  },
  {
    name: 'Sample JAV Post',
    url: 'https://nekopoi.care/chuc-076-miyanishi-hikaru-gadis-cafe-yang-berubuh-indah-berparas-cantik-memikat-pengunjung-dan-mendapatkan-pelayanan-ekstra-joss/',
  },
];

export const ExtractorTool: React.FC = () => {
  const { addToast } = useApp();
  const [postUrl, setPostUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [embedLinks, setEmbedLinks] = useState<string[]>([]);
  const [selectedEmbedIndex, setSelectedEmbedIndex] = useState<number>(0);

  const [activeJobs, setActiveJobs] = useState<JobItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);

  // Fetch active jobs from server
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await api.getJobs();
      if (res && res.jobs) {
        setActiveJobs(res.jobs);
      }
    } catch {
      // ignore
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll current job if running
  useEffect(() => {
    if (!currentJobId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.getJobById(currentJobId);
        if (res && res.job) {
          setJobStatus(res.job.status);
          if (res.job.embedLinks && res.job.embedLinks.length > 0) {
            setEmbedLinks(res.job.embedLinks);
            setSelectedEmbedIndex(0);
            clearInterval(interval);
            setLoading(false);
            addToast({
              type: 'success',
              title: 'Ekstraksi Selesai!',
              message: `Berhasil mendapatkan ${res.job.embedLinks.length} stream embed.`,
            });
          } else if (res.job.status === 'failed' || attempts > 20) {
            clearInterval(interval);
            setLoading(false);
            if (res.job.status === 'failed') {
              addToast({
                type: 'error',
                title: 'Ekstraksi Gagal',
                message: 'Server scraper tidak dapat mengekstrak tautan ini.',
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentJobId]);

  const handleStartExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!postUrl.trim()) return;

    setLoading(true);
    setEmbedLinks([]);
    setSelectedEmbedIndex(0);
    setJobStatus('starting');

    try {
      const res = await api.startExtract(postUrl.trim());
      if (res.embedLinks && res.embedLinks.length > 0) {
        setEmbedLinks(res.embedLinks);
        setSelectedEmbedIndex(0);
        setLoading(false);
        setJobStatus('completed');
        addToast({
          type: 'success',
          title: 'Ekstraksi Langsung Berhasil!',
          message: `Ditemukan ${res.embedLinks.length} server embed video.`,
        });
      } else if (res.jobId) {
        setCurrentJobId(res.jobId);
        setJobStatus('processing');
        addToast({
          type: 'info',
          title: 'Job Background Dijalankan',
          message: `Job ID: ${res.jobId}`,
        });
      } else {
        setLoading(false);
        setJobStatus('failed');
      }
    } catch (err: any) {
      setLoading(false);
      setJobStatus('failed');
      addToast({
        type: 'error',
        title: 'Gagal Memulai Ekstraksi',
        message: err.message || 'Server error',
      });
    }
  };

  const handleCopy = (text: string, title = 'Tautan Disalin') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast({
        type: 'success',
        title,
        message: text,
      });
    }
  };

  const selectedEmbed = embedLinks[selectedEmbedIndex] || null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-rose mb-1">
          <Zap className="w-5 h-5 fill-brand-rose" />
          <span className="text-xs font-bold uppercase tracking-wider">Video Extractor Tool</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Ekstraktor Video & Background Job Monitor
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ekstrak langsung stream embed player dari URL postingan nekopoi dan pantau proses background extraction.
        </p>
      </div>

      {/* Main Extractor Form */}
      <div className="p-6 md:p-8 rounded-2xl bg-dark-900 border border-slate-800 space-y-4 shadow-xl">
        <form onSubmit={handleStartExtract} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
            Masukkan URL Postingan / Episode Nekopoi:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://nekopoi.care/nama-post-episode-1-subtitle-indonesia/"
              className="flex-1 px-4 py-3 rounded-xl bg-dark-850 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose"
              required
            />
            <button
              type="submit"
              disabled={loading || !postUrl.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-rose to-brand-purple text-white font-bold text-sm shadow-lg shadow-brand-rose/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              {loading ? 'Mengekstrak...' : 'Mulai Ekstraksi'}
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-slate-400 font-medium">Contoh URL Uji Coba:</span>
          {SAMPLE_POST_URLS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPostUrl(sample.url);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Extraction Status & Live Player */}
      {(loading || embedLinks.length > 0 || jobStatus) && (
        <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-6 shadow-xl">
          {/* Status Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
              ) : embedLinks.length > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-sm font-bold text-white capitalize">
                Status: {jobStatus || 'Siap'}
              </span>
            </div>

            {currentJobId && (
              <span className="text-xs text-slate-400 font-mono bg-dark-850 px-2.5 py-1 rounded-lg border border-slate-800">
                ID: {currentJobId}
              </span>
            )}
          </div>

          {/* Embed Links List & Server Buttons */}
          {embedLinks.length > 0 && (
            <div className="space-y-4">
              {/* Integrated Video Player */}
              <VideoPlayer
                streamUrl={selectedEmbed}
                title="Hasil Ekstraksi Video"
                allStreams={embedLinks}
                activeStreamIndex={selectedEmbedIndex}
                onSelectStream={(idx) => setSelectedEmbedIndex(idx)}
              />

              {/* Embed Snippet Generator */}
              {selectedEmbed && (
                <div className="p-4 rounded-xl bg-dark-850 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-brand-purple" />
                      HTML Embed Code:
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `<iframe src="${selectedEmbed}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`,
                          'Kode Iframe Disalin'
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-pink hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Salin Iframe
                    </button>
                  </div>
                  <pre className="text-xs text-slate-400 font-mono bg-dark-900 p-2.5 rounded-lg overflow-x-auto">
                    {`<iframe src="${selectedEmbed}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Background Jobs Monitor */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-base font-bold text-white">Daftar Job Ekstraksi Server</h3>
          </div>
          <button
            onClick={fetchJobs}
            disabled={loadingJobs}
            className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-700"
            title="Segarkan Job"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {activeJobs.length > 0 ? (
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-dark-850 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : job.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="font-mono text-slate-400 truncate max-w-[200px]">{job.id}</span>
                  </div>
                  <p className="text-slate-300 truncate max-w-lg font-mono">{job.url}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {job.embedLinks && job.embedLinks.length > 0 && (
                    <button
                      onClick={() => {
                        setEmbedLinks(job.embedLinks!);
                        setSelectedEmbedIndex(0);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-rose text-white font-bold"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Putar
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(job.url, 'URL Disalin')}
                    className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-white"
                    title="Salin URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">
            Tidak ada background job yang aktif saat ini.
          </p>
        )}
      </div>
    </div>
  );
};
