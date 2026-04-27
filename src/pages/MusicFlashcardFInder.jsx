// pages/MusicFlashcardFinder.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';
import {
  Search, Play, Pause, Check, Loader2, Music4,
  ArrowLeft, Sparkles, AlertCircle, BookOpen, Save, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import imgMemly from "../assets/img/mascote-memly.png";

const MusicFlashcardFinder = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedLine, setCopiedLine] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState(null);
  const [savedFlashcards, setSavedFlashcards] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [availableCaptions, setAvailableCaptions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const youtubePlayerRef = useRef(null);

  // Buscar vídeos do YouTube
  const searchMusic = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

      if (!API_KEY) {
        throw new Error('Chave da API do YouTube não configurada');
      }

      // Buscar vídeos de música
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            part: 'snippet',
            q: `${query} official music`,
            type: 'video',
            videoCategoryId: '10', // Categoria Música
            maxResults: 12,
            key: API_KEY
          }
        }
      );

      if (response.data?.items && response.data.items.length > 0) {
        setVideos(response.data.items);
        setSelectedVideo(null);
        setLyrics('');
        setAvailableCaptions([]);
      } else {
        setVideos([]);
        setError('Nenhum vídeo encontrado');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro ao buscar vídeos. Verifique sua chave da API.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar legendas disponíveis usando a API do YouTube
  const fetchAvailableCaptions = async (videoId) => {
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;
      
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/captions',
        {
          params: {
            part: 'snippet',
            videoId: videoId,
            key: API_KEY
          }
        }
      );

      if (response.data?.items && response.data.items.length > 0) {
        setAvailableCaptions(response.data.items);
        // Tentar português primeiro, depois inglês
        const ptCaption = response.data.items.find(c => 
          c.snippet.language === 'pt' || c.snippet.language === 'pt-BR'
        );
        const enCaption = response.data.items.find(c => 
          c.snippet.language === 'en'
        );
        
        const preferredCaption = ptCaption || enCaption || response.data.items[0];
        if (preferredCaption) {
          setSelectedLanguage(preferredCaption.snippet.language);
          await fetchCaptionContent(videoId, preferredCaption.id, preferredCaption.snippet.language);
        }
      } else {
        setAvailableCaptions([]);
        setLyrics(null);
      }
    } catch (error) {
      console.log('Erro ao buscar legendas disponíveis:', error);
      
      // Fallback: tentar método alternativo com timetext
      await fetchCaptionsFallback(videoId);
    }
  };

  // Buscar conteúdo da legenda específica
  const fetchCaptionContent = async (videoId, captionId, language) => {
    setIsLoadingLyrics(true);
    
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;
      
      // Primeiro, precisamos fazer o download da legenda
      // Nota: Isso requer OAuth 2.0 para acessar legendas de terceiros
      // Como alternativa, usaremos um serviço de terceiros
      
      const response = await axios.get(
        `https://video.google.com/timedtext`,
        {
          params: {
            lang: language,
            v: videoId,
            fmt: 'srv3', // Formato que retorna texto mais limpo
            type: 'track'
          },
          timeout: 10000
        }
      );

      if (response.data) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const texts = xmlDoc.getElementsByTagName("text");
        
        let lyricsText = '';
        for (let text of texts) {
          const content = text.textContent;
          // Remover timestamps e HTML
          if (content) {
            const cleanText = content.replace(/<[^>]*>/g, '').trim();
            if (cleanText) {
              lyricsText += cleanText + '\n';
            }
          }
        }

        if (lyricsText.trim()) {
          setLyrics(lyricsText);
        } else {
          setLyrics(null);
        }
      } else {
        setLyrics(null);
      }
    } catch (error) {
      console.log('Erro ao baixar legenda:', error);
      setLyrics(null);
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Método fallback para buscar legendas
  const fetchCaptionsFallback = async (videoId) => {
    setIsLoadingLyrics(true);
    
    try {
      // Tentar diferentes idiomas
      const languages = ['pt', 'en', 'es', 'fr', 'de', 'it'];
      let foundLyrics = null;
      
      for (const lang of languages) {
        try {
          const response = await axios.get(
            `https://video.google.com/timedtext`,
            {
              params: {
                lang: lang,
                v: videoId,
                fmt: 'srv3'
              },
              timeout: 5000
            }
          );

          if (response.data) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, "text/xml");
            const texts = xmlDoc.getElementsByTagName("text");
            
            if (texts.length > 0) {
              let lyricsText = '';
              for (let text of texts) {
                const content = text.textContent;
                if (content) {
                  const cleanText = content.replace(/<[^>]*>/g, '').trim();
                  if (cleanText) {
                    lyricsText += cleanText + '\n';
                  }
                }
              }
              
              if (lyricsText.trim()) {
                foundLyrics = lyricsText;
                setSelectedLanguage(lang);
                break;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (foundLyrics) {
        setLyrics(foundLyrics);
      } else {
        setLyrics(null);
      }
    } catch (error) {
      console.log('Legenda não disponível para este vídeo');
      setLyrics(null);
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const selectVideo = async (video) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setError(null);
    setLyrics('');
    setAvailableCaptions([]);
    setSelectedLanguage('');

    // Buscar legendas do vídeo
    await fetchAvailableCaptions(video.id.videoId);
  };

  const handleChangeLanguage = async (language) => {
    if (!selectedVideo) return;
    
    const caption = availableCaptions.find(c => c.snippet.language === language);
    if (caption) {
      setSelectedLanguage(language);
      await fetchCaptionContent(selectedVideo.id.videoId, caption.id, language);
    }
  };

  const handleYouTubeReady = (event) => {
    youtubePlayerRef.current = event.target;
    console.log('✅ Player do YouTube pronto!');
  };

  const handleYouTubeStateChange = (event) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) { // Paused or Ended
      setIsPlaying(false);
    }
  };

  const handleYouTubeError = (event) => {
    console.error('❌ Erro no YouTube:', event);
    setToastMessage('Erro ao carregar o vídeo. Tente outro.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const togglePlay = () => {
    if (!youtubePlayerRef.current) {
      setToastMessage('Player ainda não está pronto');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    try {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    } catch (error) {
      console.error('Erro ao controlar player:', error);
    }
  };

  const handleSaveFlashcard = async (line) => {
    try {
      await navigator.clipboard.writeText(line);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }

    setCopiedLine(line);

    const flashcardData = {
      text: line,
      context: `${selectedVideo.snippet.title} - ${selectedVideo.snippet.channelTitle}`,
      source: 'YouTube',
      videoId: selectedVideo.id.videoId,
      thumbnail: selectedVideo.snippet.thumbnails.default.url,
      timestamp: new Date().toISOString()
    };

    try {
      const savedCards = JSON.parse(localStorage.getItem('musicFlashcards') || '[]');
      const newCard = { ...flashcardData, id: Date.now(), userId: user?.id };
      localStorage.setItem('musicFlashcards', JSON.stringify([...savedCards, newCard]));
      setSavedFlashcards(prev => [newCard, ...prev]);

      setToastMessage(`✨ Frase salva nos flashcards!`);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setCopiedLine(null);
      }, 2500);
    } catch (error) {
      console.error('Erro ao salvar flashcard:', error);
    }
  };

  const handleBackToSearch = () => {
    if (youtubePlayerRef.current?.pauseVideo) {
      youtubePlayerRef.current.pauseVideo();
    }
    setSelectedVideo(null);
    setLyrics('');
    setAvailableCaptions([]);
    setIsPlaying(false);
  };

  const handleManualLyrics = () => {
    const text = prompt('Cole a letra da música aqui:');
    if (text && text.trim()) {
      setLyrics(text);
      setToastMessage('Letra adicionada com sucesso!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleOpenExternalLyrics = () => {
    if (!selectedVideo) return;
    
    const searchQuery = encodeURIComponent(`${selectedVideo.snippet.title} lyrics`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('musicFlashcards') || '[]');
      setSavedFlashcards(saved.filter(card => card.userId === user?.id).slice(0, 10));
    } catch (error) {
      console.error('Erro ao carregar flashcards:', error);
    }
  }, [user]);

  const youtubeOpts = {
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-6">
      <div className="max-w-7xl mx-auto ">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl h-[calc(100vh-30px)] overflow-hidden md:overflow-hidden overflow-y-auto flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Aprenda com músicas do YouTube!
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Clique nas frases da letra para salvar como flashcards
              </p>
            </div>
            {savedFlashcards.length > 0 && (
              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="ml-auto px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium hover:bg-indigo-200 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{savedFlashcards.length} salvos</span>
              </button>
            )}
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Barra de Busca */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Buscar música no YouTube... (ex: Imagine Dragons)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMusic()}
              className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={searchMusic}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Buscar
            </button>
          </div>

          {/* Lista de Flashcards Salvos */}
          {showSavedList && savedFlashcards.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Flashcards Salvos Recentemente
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedFlashcards.slice(0, 5).map((card) => (
                  <div key={card.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    {card.thumbnail && (
                      <img src={card.thumbnail} alt="" className="w-8 h-8 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{card.text}</p>
                      <p className="text-xs text-gray-500 truncate">{card.context}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade de Resultados */}
          {videos.length > 0 && !selectedVideo && (
            <div className='flex flex-col flex-1 min-h-0'>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Resultados ({videos.length}):
              </h3>
              <div className='flex-1 min-h-0'>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full">
                  {videos.map((video) => (
                    <div
                      key={video.id.videoId}
                      onClick={() => selectVideo(video)}
                      className="bg-white rounded-xl p-3 cursor-pointer border-2 hover:border-indigo-500 hover:shadow-xl transition-all"
                    >
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full aspect-video rounded-lg object-cover mb-3"
                      />
                      <h4 className="font-semibold text-sm line-clamp-2">{video.snippet.title}</h4>
                      <p className="text-xs text-gray-500 truncate mt-1">{video.snippet.channelTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Player e Letra */}
          {selectedVideo && (
            <div className="mt-6">
              {/* Player do YouTube */}
              <div className="bg-black rounded-2xl overflow-hidden mb-4">
                <YouTube
                  videoId={selectedVideo.id.videoId}
                  opts={youtubeOpts}
                  onReady={handleYouTubeReady}
                  onStateChange={handleYouTubeStateChange}
                  onError={handleYouTubeError}
                />
              </div>

              {/* Controles e Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedVideo.snippet.thumbnails.default.url}
                    alt=""
                    className="w-16 h-16 rounded-xl"
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold line-clamp-2">{selectedVideo.snippet.title}</h2>
                    <p className="text-gray-600">{selectedVideo.snippet.channelTitle}</p>
                  </div>
                  <button
                    onClick={handleBackToSearch}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Seletor de Idioma (se disponível) */}
              {availableCaptions.length > 1 && (
                <div className="mb-4 flex gap-2">
                  <span className="text-sm text-gray-600">Idioma da legenda:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleChangeLanguage(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {availableCaptions.map((caption) => (
                      <option key={caption.id} value={caption.snippet.language}>
                        {caption.snippet.name} ({caption.snippet.language})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Letra */}
              <div className="bg-white rounded-2xl p-4 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Music4 className="w-5 h-5 text-indigo-600" />
                    Letra - Clique nas frases para salvar
                  </h3>

                  <div className="flex gap-2">
                    {!isLoadingLyrics && !lyrics && (
                      <>
                        <button
                          onClick={handleOpenExternalLyrics}
                          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Buscar online
                        </button>
                        <button
                          onClick={handleManualLyrics}
                          className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                        >
                          Adicionar manualmente
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isLoadingLyrics ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-gray-500">Buscando legenda...</p>
                    <p className="text-xs text-gray-400 mt-2">Isso pode levar alguns segundos</p>
                  </div>
                ) : lyrics ? (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {lyrics.split('\n').map((line, idx) => (
                      !line.trim() ? null : (
                        <div
                          key={idx}
                          onClick={() => handleSaveFlashcard(line)}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                            ${copiedLine === line ? 'bg-green-50 border border-green-300' : 'hover:bg-indigo-50 border border-transparent hover:border-indigo-200'}`}
                        >
                          <span className="text-gray-700">{line}</span>
                          <div className={`flex items-center gap-2 ${copiedLine === line ? 'text-green-600' : 'text-gray-400 group-hover:text-indigo-600'}`}>
                            {copiedLine === line ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="text-sm hidden sm:inline">
                              {copiedLine === line ? 'Salvo!' : 'Salvar'}
                            </span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music4 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Legenda não disponível para este vídeo</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Nem todos os vídeos do YouTube possuem legendas ativadas
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleOpenExternalLyrics}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buscar letra no Google
                      </button>
                      <button
                        onClick={handleManualLyrics}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Adicionar manualmente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estado Vazio */}
          {videos.length === 0 && !loading && !error && (
            <div className="text-center py-16">
              <Music4 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">Busque músicas no YouTube!</p>
              <p className="text-sm text-gray-400 mt-2">Ex: "Imagine Dragons", "Coldplay", "Ed Sheeran"</p>
              <p className="text-xs text-gray-400 mt-4 max-w-md mx-auto">
                💡 Dica: Para ter acesso às legendas, busque por músicas oficiais que tenham 
                a opção de legendas/CC ativada no YouTube
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicFlashcardFinder;