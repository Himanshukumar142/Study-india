import { useState } from 'react'
import { Music, ChevronDown, ChevronUp, Radio, X } from 'lucide-react'

// ── Most Popular Lo-fi Study Content from all 3 sources ──────────────────────

const YOUTUBE_STATIONS = [
  {
    id: 'lofi_girl',
    name: 'Lofi Girl 📚',
    desc: 'beats to relax/study to — #1 most watched',
    emoji: '👧',
    ytId: 'jfKfPfyJRdk',  // Lofi Girl LIVE — 30M+ views, always on
  },
  {
    id: 'lofi_girl_night',
    name: 'Lofi Girl 🌙',
    desc: 'beats to sleep/chill to — by Lofi Girl',
    emoji: '🌙',
    ytId: 'rUxyKA_-grg',  // Lofi Girl night stream
  },
  {
    id: 'chillhop',
    name: 'Chillhop Radio ☕',
    desc: 'jazzy beats — Chillhop Music 24/7',
    emoji: '🦝',
    ytId: '7NOSDKb0HlU',  // Chillhop 24/7
  },
  {
    id: 'college_music',
    name: 'College Music 🎓',
    desc: 'study beats for college students',
    emoji: '🎓',
    ytId: 'b9g8oTGHlZs',  // College Music 24/7
  },
  {
    id: 'lofi_records',
    name: 'Lofi Records 🎵',
    desc: 'chill hip hop beats to study',
    emoji: '📻',
    ytId: 'kgx4WGK0oNU',  // Lofi Records
  },
  {
    id: 'jazz_cafe',
    name: 'Jazz Cafe ☕',
    desc: 'smooth jazz for deep focus',
    emoji: '🎷',
    ytId: '5yx6BWlEVcY',  // Jazz for study
  },
]

const SPOTIFY_PLAYLISTS = [
  {
    id: 'lofi_beats',
    name: 'Lo-Fi Beats',
    desc: 'Spotify Official — 4M+ followers',
    emoji: '🎧',
    playlistId: '37i9dQZF1DWWQRwui0ExPn',
  },
  {
    id: 'lofi_study',
    name: 'Lofi Study',
    desc: 'Focus music for deep work',
    emoji: '📚',
    playlistId: '37i9dQZF1DX8Uebhn9wzrS',
  },
  {
    id: 'peaceful_piano',
    name: 'Peaceful Piano',
    desc: 'Calm piano by Spotify — 7M+ followers',
    emoji: '🎹',
    playlistId: '37i9dQZF1DX4sWSpwq3LiO',
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    desc: 'Spotify official focus music — 3M+ followers',
    emoji: '🧠',
    playlistId: '37i9dQZF1DWZeKCadgRdKQ',
  },
  {
    id: 'coffee_shop',
    name: 'Coffee House Lo-Fi',
    desc: 'cozy lo-fi cafe vibes',
    emoji: '☕',
    playlistId: '0vvXsWCC9xrXsKd4eZs7Co',
  },
  {
    id: 'brain_food',
    name: 'Brain Food',
    desc: 'Music to feed your brain — Spotify',
    emoji: '⚡',
    playlistId: '37i9dQZF1DWXLeA8Omikj7',
  },
]

const SOUNDCLOUD_TRACKS = [
  {
    id: 'sc_lofi1',
    name: 'Lofi Hip Hop Mix',
    desc: '2 hours of study beats — most played',
    emoji: '🎵',
    url: 'https://soundcloud.com/lofi_vibes/sets/lofi-hip-hop-music-beats-to',
    trackUrl: 'https://soundcloud.com/user-670367041/sets/lofi-hip-hop-music-beats-to-1',
  },
  {
    id: 'sc_chillhop',
    name: 'Chillhop Essentials',
    desc: 'Best of chillhop — 1M+ plays',
    emoji: '🦝',
    trackUrl: 'https://soundcloud.com/chillhopdotcom/sets/chillhop-essentials-spring-2',
  },
  {
    id: 'sc_japanese',
    name: 'Japanese Lo-Fi',
    desc: 'Anime-inspired study beats',
    emoji: '🌸',
    trackUrl: 'https://soundcloud.com/user-818952362/sets/japanese-lofi-hip-hop',
  },
  {
    id: 'sc_rain',
    name: 'Rain + Lo-Fi',
    desc: 'Rainy day concentration mix',
    emoji: '🌧️',
    trackUrl: 'https://soundcloud.com/calmsound/sets/rain-sounds-for-studying',
  },
  {
    id: 'sc_phonk',
    name: 'Late Night Lo-Fi',
    desc: 'Night study session beats',
    emoji: '🌃',
    trackUrl: 'https://soundcloud.com/lofi_vibes/sets/late-night-vibes',
  },
]

const SOURCE_TABS = [
  { id: 'youtube',    label: '▶️ YouTube',    color: 'bg-red-500 text-white' },
  { id: 'spotify',    label: '🎵 Spotify',    color: 'bg-green-500 text-white' },
  { id: 'soundcloud', label: '☁️ SoundCloud', color: 'bg-orange-500 text-white' },
]

export default function MusicPlayer() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('youtube')
  const [ytStation, setYtStation] = useState(0)
  const [spotifyPl, setSpotifyPl] = useState(0)
  const [scTrack, setScTrack] = useState(0)
  const [ytPlaying, setYtPlaying] = useState(false)

  // ── YouTube: hidden iframe with postMessage control ───────────────────────
  const ytStation_ = YOUTUBE_STATIONS[ytStation]
  const ytSrc = `https://www.youtube.com/embed/${ytStation_.ytId}?autoplay=${ytPlaying ? 1 : 0}&enablejsapi=1&loop=1&playlist=${ytStation_.ytId}&controls=0&mute=0&origin=${window.location.origin}`

  // ── Spotify embed src ─────────────────────────────────────────────────────
  const spPlaylist = SPOTIFY_PLAYLISTS[spotifyPl]
  const spotifySrc = `https://open.spotify.com/embed/playlist/${spPlaylist.playlistId}?utm_source=generator&theme=0`

  // ── SoundCloud embed src ──────────────────────────────────────────────────
  const scItem = SOUNDCLOUD_TRACKS[scTrack]
  const scSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(scItem.trackUrl)}&color=%23a855f7&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`

  const isPlaying = source === 'youtube' ? ytPlaying : true

  return (
    <>
      {/* YouTube hidden iframe */}
      {source === 'youtube' && (
        <iframe
          key={`yt-${ytStation_.ytId}-${ytPlaying}`}
          src={ytSrc}
          allow="autoplay"
          className="hidden"
          title="yt-player"
        />
      )}

      {/* Floating wrapper */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-2">

        {/* Expanded panel */}
        {open && (
          <div className="bg-white/97 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 w-80 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-purple-200" />
                  <span className="text-purple-200 text-[10px] font-bold uppercase tracking-widest">Study Music</span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 bg-white/15 rounded-lg hover:bg-white/25 transition-all">
                  <X size={12} />
                </button>
              </div>
              <p className="font-black text-sm">Lo-fi Radio 🎵</p>
              <p className="text-purple-200 text-[10px]">Most popular study stations</p>
            </div>

            {/* Source tabs */}
            <div className="flex border-b border-slate-100">
              {SOURCE_TABS.map(tab => (
                <button key={tab.id} onClick={() => setSource(tab.id)}
                  className={`flex-1 py-2.5 text-[11px] font-black transition-all ${source === tab.id ? tab.color : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── YOUTUBE TAB ────────────────────────────────────────── */}
            {source === 'youtube' && (
              <div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {YOUTUBE_STATIONS.map((s, i) => (
                    <button key={s.id} onClick={() => { setYtStation(i); setYtPlaying(true) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-all ${ytStation === i && ytPlaying ? 'bg-red-50' : ''}`}>
                      <span className="text-xl flex-shrink-0">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${ytStation === i && ytPlaying ? 'text-red-600' : 'text-slate-700'}`}>{s.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{s.desc}</p>
                      </div>
                      {ytStation === i && ytPlaying && (
                        <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
                          {[3, 5, 4, 6, 3].map((h, j) => (
                            <div key={j} className="w-1 bg-red-500 rounded-full animate-pulse"
                              style={{ height: `${h * 2}px`, animationDelay: `${j * 0.1}s` }} />
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                  <button onClick={() => setYtStation(i => (i - 1 + YOUTUBE_STATIONS.length) % YOUTUBE_STATIONS.length)}
                    className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all">
                    ⏮ Prev
                  </button>
                  <button onClick={() => setYtPlaying(!ytPlaying)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${ytPlaying ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>
                    {ytPlaying ? '⏸ Pause' : '▶️ Play'}
                  </button>
                  <button onClick={() => { setYtStation(i => (i + 1) % YOUTUBE_STATIONS.length); setYtPlaying(true) }}
                    className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all">
                    ⏭ Next
                  </button>
                </div>
                <p className="text-[9px] text-center text-slate-300 pb-2">Streams from YouTube — requires internet</p>
              </div>
            )}

            {/* ── SPOTIFY TAB ────────────────────────────────────────── */}
            {source === 'spotify' && (
              <div>
                <div className="max-h-32 overflow-y-auto divide-y divide-slate-50">
                  {SPOTIFY_PLAYLISTS.map((pl, i) => (
                    <button key={pl.id} onClick={() => setSpotifyPl(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-all ${spotifyPl === i ? 'bg-green-50' : ''}`}>
                      <span className="text-lg flex-shrink-0">{pl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${spotifyPl === i ? 'text-green-700' : 'text-slate-700'}`}>{pl.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{pl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Spotify embed player */}
                <iframe
                  key={spPlaylist.playlistId}
                  src={spotifySrc}
                  width="100%" height="80" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  title="spotify-player"
                  className="block"
                />
                <p className="text-[9px] text-center text-slate-300 pb-2">Full tracks need Spotify Premium. Previews free.</p>
              </div>
            )}

            {/* ── SOUNDCLOUD TAB ─────────────────────────────────────── */}
            {source === 'soundcloud' && (
              <div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-50">
                  {SOUNDCLOUD_TRACKS.map((t, i) => (
                    <button key={t.id} onClick={() => setScTrack(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-all ${scTrack === i ? 'bg-orange-50' : ''}`}>
                      <span className="text-lg flex-shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${scTrack === i ? 'text-orange-700' : 'text-slate-700'}`}>{t.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {/* SoundCloud embed */}
                <iframe
                  key={scItem.trackUrl}
                  width="100%" height="80" scrolling="no" frameBorder="no"
                  src={scSrc}
                  title="soundcloud-player"
                  className="block"
                />
                <p className="text-[9px] text-center text-slate-300 pb-2">Free streaming from SoundCloud</p>
              </div>
            )}
          </div>
        )}

        {/* Pill toggle button */}
        <button onClick={() => setOpen(!open)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all hover:scale-105
            ${isPlaying && open
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/30'
              : 'bg-white border border-slate-200 text-slate-700 shadow-slate-100'
            }`}>
          <Music size={16} className={isPlaying && open ? 'text-purple-200' : 'text-slate-400'} />
          {isPlaying && ytPlaying && source === 'youtube' ? (
            <div className="flex gap-0.5 items-end h-4">
              {[3, 5, 4, 6].map((h, i) => (
                <div key={i} className="w-0.5 bg-current rounded-full animate-pulse opacity-70"
                  style={{ height: `${h * 2}px`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : (
            <span className="text-xs font-bold">Music</span>
          )}
          {open
            ? <ChevronDown size={12} className="opacity-60" />
            : <ChevronUp size={12} className="opacity-60" />
          }
        </button>
      </div>
    </>
  )
}
