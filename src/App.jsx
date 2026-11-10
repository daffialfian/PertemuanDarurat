import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Navigation,
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MEETING_INFO, INVITEES, EMERGENCY_RULES } from './data/summonsData';
import VenueMapPreview from './components/VenueMapPreview';

const playClickSound = (isMuted = false) => {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
};

export default function App() {
  const [strobeActive, setStrobeActive] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const [selectedId, setSelectedId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('untuk')?.toLowerCase();
    if (fromUrl && INVITEES.some((p) => p.id === fromUrl)) {
      return fromUrl;
    }
    return localStorage.getItem('pd_person_v5') || 'dapi';
  });

  const [statuses, setStatuses] = useState(() => {
    const saved = localStorage.getItem('pd_statuses_v5');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const init = {};
    INVITEES.forEach((p) => {
      init[p.id] = p.defaultStatus;
    });
    return init;
  });

  useEffect(() => {
    localStorage.setItem('pd_person_v5', selectedId);
  }, [selectedId]);

  useEffect(() => {
    localStorage.setItem('pd_statuses_v5', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const selectedPerson = useMemo(
    () => INVITEES.find((p) => p.id === selectedId) || INVITEES[0],
    [selectedId]
  );

  const countdown = useMemo(() => {
    const targetStart = new Date('2026-11-12T17:30:00+07:00');
    const targetEnd = new Date('2026-11-12T21:00:00+07:00');

    const diffStart = targetStart.getTime() - now.getTime();
    const diffEnd = targetEnd.getTime() - now.getTime();

    if (diffStart > 0) {
      const totalSec = Math.floor(diffStart / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return {
        label: 'MENUJU KAMIS, 12 NOV 2026 — 17.30 WIB',
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      };
    } else if (diffEnd > 0) {
      const totalSec = Math.floor(diffEnd / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return {
        label: 'MALAM PUNCAK SEDANG BERLANGSUNG',
        days: '00',
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      };
    } else {
      return {
        label: 'ACARA 12 NOV 2026 TELAH SELESAI',
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
      };
    }
  }, [now]);

  const confirmedCount = useMemo(() => {
    return Object.values(statuses).filter((s) => s === 'hadir').length;
  }, [statuses]);

  const otwCount = useMemo(() => {
    return Object.values(statuses).filter((s) => s === 'otw').length;
  }, [statuses]);

  const setPersonStatus = (id, newStatus) => {
    playClickSound(isAudioMuted);
    setStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
    const pName = INVITEES.find((p) => p.id === id)?.name || id;
    showToast(`Status ${pName} diubah ke: ${newStatus.toUpperCase()}`);
  };

  const copyToClipboard = async (text, key, toastLabel = 'Berhasil disalin!') => {
    try {
      await navigator.clipboard.writeText(text);
      playClickSound(isAudioMuted);
      setCopiedKey(key);
      showToast(toastLabel);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('Gagal menyalin teks');
    }
  };

  const waGroupText = useMemo(() => {
    const listText = INVITEES.map((p) => {
      const st = statuses[p.id];
      const ket = st === 'hadir' ? 'HADIR' : st === 'otw' ? 'OTW' : 'BELUM KONFIRMASI';
      return `${p.no}. ${p.name} (${p.role}) — [${ket}]`;
    }).join('\n');

    return `*MENUJU MALAM PUNCAK (KAMIS, 12 NOV 2026)*

Agenda: Kumpul 9 Personel
Hari/Tanggal: ${MEETING_INFO.dayDate}
Waktu: ${MEETING_INFO.timeStart} – ${MEETING_INFO.timeEnd} ${MEETING_INFO.timezone}
Lokasi: ${MEETING_INFO.venue}
Maps: ${MEETING_INFO.mapsUrl}

DAFTAR & PERAN 9 PERSONEL:
${listText}

Yuk merapat tepat waktu, dilarang ngaret ya guys!`;
  }, [statuses]);

  const filteredInvitees = useMemo(() => {
    if (activeTabFilter === 'hadir') {
      return INVITEES.filter((p) => statuses[p.id] === 'hadir');
    }
    if (activeTabFilter === 'otw') {
      return INVITEES.filter((p) => statuses[p.id] === 'otw');
    }
    if (activeTabFilter === 'belum') {
      return INVITEES.filter((p) => statuses[p.id] === 'belum');
    }
    return INVITEES;
  }, [activeTabFilter, statuses]);

  return (
    <div className="dark-military-theme">
      <div className="bg-photo-backdrop" />
      <div className="bg-grid-overlay" />

      {/* Flashing Red Emergency Glow */}
      <div
        className={`emergency-strobe-overlay ${strobeActive ? 'active' : 'paused'}`}
      />

      {toastMessage && (
        <div className="tactical-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lightbox Foto */}
      {lightboxOpen && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span className="font-semibold text-sm text-red-400">
                Foto Bersama 9 Personel
              </span>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="lightbox-body">
              <img
                src="/foto-pasukan.jpg"
                alt="Foto 9 Pasukan Lengkap"
                className="lightbox-img"
              />
              <div className="lightbox-hud-footer">
                <span>Dapi, Aday, Kol, Bina, Ucup, Hilal, Ayas, Talita, Awa</span>
                <span className="text-red-400">Kamis, 12 Nov 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className={`siren-top-bar ${strobeActive ? 'flashing' : ''}`}>
        <div className="siren-status-left">
          <span className="blinking-led" />
          <span className="siren-headline">
            MENUJU MALAM PUNCAK — KAMIS, 12 NOVEMBER 2026 (17.30 - 21.00 WIB) — KOPI KENANGAN KEMANG TIMUR
          </span>
        </div>

        <div className="siren-controls">
          <button
            type="button"
            className="hud-toggle-btn"
            onClick={() => {
              setIsAudioMuted((prev) => !prev);
              playClickSound(!isAudioMuted);
            }}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isAudioMuted ? 'Audio Off' : 'Audio On'}</span>
          </button>

          <button
            type="button"
            className="hud-toggle-btn alert-toggle"
            onClick={() => {
              playClickSound(isAudioMuted);
              setStrobeActive((prev) => !prev);
            }}
          >
            <span>{strobeActive ? 'Sirene Nyala' : 'Sirene Reda'}</span>
          </button>
        </div>
      </header>

      <main className="page-container">
        <div className="emergency-frame">
          {/* Metadata Bar */}
          <div className="meta-bar">
            <div className="meta-cell">
              <span className="meta-label">Kode Pertemuan</span>
              <span className="meta-val">{MEETING_INFO.code}</span>
            </div>
            <div className="meta-cell">
              <span className="meta-label">Status Acara</span>
              <span className="meta-val blink-red">
                <span className="red-dot-inline" />
                {MEETING_INFO.status}
              </span>
            </div>
            <div className="meta-cell">
              <span className="meta-label">Kehadiran</span>
              <span className="meta-val text-emerald-400">
                {confirmedCount + otwCount} dari 9 Personel Siap
              </span>
            </div>
          </div>

          {/* Hero Section */}
          <section className="hero-grid">
            <div className="hero-copy">
              <div>
                <div className="urgent-badge-row">
                  <div className="urgent-pill">
                    <span className="red-dot-inline" />
                    Panggilan Pertemuan
                  </div>
                  <div className="military-tag">Anti Wacana</div>
                </div>

                <h1 className="hero-headline">
                  MENUJU <span className="highlight-red">MALAM PUNCAK</span>
                  <br />
                  WAJIB HADIR 9 PERSONEL.
                </h1>

                <p className="hero-desc">
                  Undangan resmi Malam Puncak untuk{' '}
                  <strong>
                    Dapi, Aday, Kol, Bina, Ucup, Hilal, Ayas, Talita, dan Awa
                  </strong>
                  . Sembilan orang yang ada di foto wajib hadir langsung di{' '}
                  <strong className="text-white">{MEETING_INFO.venue}</strong> pada{' '}
                  <strong className="text-red-400">{MEETING_INFO.dayDate}</strong>.
                </p>

                <div className="key-schedule-grid">
                  <div className="schedule-box">
                    <div className="schedule-kicker">
                      <Calendar size={14} /> Waktu Acara
                    </div>
                    <div className="schedule-main">{MEETING_INFO.dayDate}</div>
                    <div className="schedule-sub">
                      Pukul {MEETING_INFO.timeStart} – {MEETING_INFO.timeEnd} {MEETING_INFO.timezone}
                    </div>
                  </div>
                  <div className="schedule-box">
                    <div className="schedule-kicker">
                      <MapPin size={14} /> Titik Kumpul
                    </div>
                    <div className="schedule-main">{MEETING_INFO.venue}</div>
                    <div className="schedule-sub">Kemang Timur, Jakarta Selatan</div>
                  </div>
                </div>
              </div>

              <div className="btn-action-row">
                <a
                  href={MEETING_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-red"
                  onClick={() => playClickSound(isAudioMuted)}
                >
                  <Navigation size={16} /> Buka Google Maps
                  <ExternalLink size={14} className="opacity-70 ml-1" />
                </a>

                <a
                  href="#lokasi-venue"
                  className="btn-secondary-hud"
                  onClick={() => playClickSound(isAudioMuted)}
                >
                  <MapPin size={15} /> Lihat Peta Lokasi
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waGroupText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  onClick={() => playClickSound(isAudioMuted)}
                >
                  <Share2 size={15} /> Bagikan ke Grup WA
                </a>
              </div>
            </div>

            {/* Right: Evidence Photo */}
            <div className="hero-photo-panel">
              <div className="photo-header-bar">
                <span className="text-xs text-red-400 font-medium">
                  Lampiran Foto Pasukan
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  9 Orang Komplit
                </span>
              </div>

              <div
                className="photo-frame-wrapper group cursor-pointer"
                onClick={() => {
                  playClickSound(isAudioMuted);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src="/foto-pasukan.jpg"
                  alt="9 Personel Malam Puncak"
                  className="evidence-photo tactical"
                />
                <div className="photo-hud-overlay">
                  <div className="photo-top-hud">
                    <span className="photo-stamp-tag">Formasi Lengkap</span>
                    <span className="text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded">
                      Klik untuk perbesar
                    </span>
                  </div>
                  <div className="photo-caption-bottom">
                    <span className="text-zinc-300">Target 9 Personel</span>
                    <span className="text-red-400 font-semibold">
                      12 Nov 2026, 17.30 WIB
                    </span>
                  </div>
                </div>
              </div>

              <div className="photo-caption-note">
                <span>Lokasi: Kopi Kenangan Kemang Timur</span>
              </div>
            </div>
          </section>

          {/* Countdown Clock */}
          <section className="countdown-strip">
            <div className="countdown-info-col">
              <div className="countdown-badge">
                <Clock size={13} className="text-red-400" />
                Hitung Mundur Acara
              </div>
              <div className="countdown-info-title">{countdown.label}</div>
              <div className="countdown-info-sub">
                {MEETING_INFO.venue} — 17.30 sampai 21.00 WIB
              </div>
            </div>

            <div className="timer-blocks">
              <div className="timer-cell">
                <span className="timer-num">{countdown.days}</span>
                <span className="timer-lbl">Hari</span>
              </div>
              <div className="timer-sep">:</div>
              <div className="timer-cell">
                <span className="timer-num">{countdown.hours}</span>
                <span className="timer-lbl">Jam</span>
              </div>
              <div className="timer-sep">:</div>
              <div className="timer-cell">
                <span className="timer-num">{countdown.minutes}</span>
                <span className="timer-lbl">Menit</span>
              </div>
              <div className="timer-sep">:</div>
              <div className="timer-cell red-sec">
                <span className="timer-num">{countdown.seconds}</span>
                <span className="timer-lbl">Detik</span>
              </div>
            </div>
          </section>

          {/* Quick User Identity Selector */}
          <section className="user-control-section">
            <div className="user-control-header">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-red-400" />
                <span className="text-xs font-semibold text-white">
                  Konfirmasi Kehadiran Kamu
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                Pilih Nama: <strong className="text-white">{selectedPerson.name}</strong>
              </span>
            </div>

            <div className="user-control-body">
              <div className="person-chips-inline">
                {INVITEES.map((p) => {
                  const st = statuses[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`person-select-chip ${selectedId === p.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedId(p.id);
                        playClickSound(isAudioMuted);
                      }}
                    >
                      <span>{p.name}</span>
                      <span
                        className={`status-dot ${
                          st === 'hadir' ? 'dot-hadir' : st === 'otw' ? 'dot-otw' : ''
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="selected-user-card">
                <div className="selected-user-meta">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold text-base">
                      {selectedPerson.name}
                    </span>
                    <span className="text-xs text-red-300 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded">
                      Peran: {selectedPerson.role} ({selectedPerson.subRole})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    {selectedPerson.note}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`btn-primary-red text-xs py-2 px-4 ${
                      statuses[selectedPerson.id] === 'hadir' ? 'ring-2 ring-emerald-400' : ''
                    }`}
                    onClick={() => setPersonStatus(selectedPerson.id, 'hadir')}
                  >
                    <CheckCircle2 size={15} /> Saya Hadir
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary-hud text-xs py-2 px-4 ${
                      statuses[selectedPerson.id] === 'otw' ? 'ring-2 ring-amber-400' : ''
                    }`}
                    onClick={() => setPersonStatus(selectedPerson.id, 'otw')}
                  >
                    Sedang OTW
                  </button>
                  <button
                    type="button"
                    className="btn-outline-tactical text-xs py-2 px-4"
                    onClick={() => setPersonStatus(selectedPerson.id, 'belum')}
                  >
                    Belum Pasti
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Manifest 9 Personel Section */}
          <section id="manifest-personel" className="section-block">
            <div className="section-top-bar">
              <div>
                <div className="section-kicker">
                  Daftar Personel & Peran
                </div>
                <h2 className="section-heading">Manifest 9 Pasukan Malam Puncak</h2>
              </div>

              <div className="filter-pill-group">
                <button
                  type="button"
                  className={`filter-btn ${activeTabFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTabFilter('all')}
                >
                  Semua ({INVITEES.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeTabFilter === 'hadir' ? 'active' : ''}`}
                  onClick={() => setActiveTabFilter('hadir')}
                >
                  Hadir ({confirmedCount})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeTabFilter === 'otw' ? 'active' : ''}`}
                  onClick={() => setActiveTabFilter('otw')}
                >
                  OTW ({otwCount})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeTabFilter === 'belum' ? 'active' : ''}`}
                  onClick={() => setActiveTabFilter('belum')}
                >
                  Belum ({INVITEES.length - (confirmedCount + otwCount)})
                </button>
              </div>
            </div>

            <div className="manifest-grid">
              {filteredInvitees.map((person) => {
                const st = statuses[person.id];
                const badgeLabel =
                  st === 'hadir' ? 'Hadir' : st === 'otw' ? 'OTW' : 'Belum Konfirmasi';

                return (
                  <div
                    key={person.id}
                    className={`manifest-card ${
                      selectedId === person.id ? 'is-selected' : ''
                    }`}
                  >
                    <div className="manifest-card-content">
                      <div className="manifest-card-top">
                        <span className="manifest-no">
                          No. {person.no} • {person.tag}
                        </span>
                        <span className={`manifest-badge ${st}`}>
                          {st === 'hadir' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {badgeLabel}
                        </span>
                      </div>
                      <h3 className="manifest-name">{person.name}</h3>
                      <div className="text-xs font-semibold text-red-400 mb-0.5">
                        {person.role}
                      </div>
                      <div className="text-xs text-zinc-400 mb-2">
                        {person.subRole}
                      </div>
                      <p className="manifest-note">{person.note}</p>

                      <div className="manifest-contact-row text-xs text-zinc-400 mt-3 mb-2">
                        {person.phone ? (
                          <>
                            <span>WA: {person.phone}</span>
                            <a
                              href={`https://wa.me/${person.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              Chat <ExternalLink size={11} />
                            </a>
                          </>
                        ) : (
                          <span className="text-zinc-500 italic">No. WhatsApp Belum Ada</span>
                        )}
                      </div>
                    </div>

                    <div className="manifest-btn-group">
                      <button
                        type="button"
                        className={`status-toggle-btn ${st === 'hadir' ? 'active-hadir' : ''}`}
                        onClick={() => setPersonStatus(person.id, 'hadir')}
                      >
                        Hadir
                      </button>
                      <button
                        type="button"
                        className={`status-toggle-btn ${st === 'otw' ? 'active-otw' : ''}`}
                        onClick={() => setPersonStatus(person.id, 'otw')}
                      >
                        OTW
                      </button>
                      <button
                        type="button"
                        className={`status-toggle-btn ${st === 'belum' ? 'active-belum' : ''}`}
                        onClick={() => setPersonStatus(person.id, 'belum')}
                      >
                        Belum
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Location & Venue Section */}
          <section id="lokasi-venue" className="section-block venue-radar-section">
            <div className="section-top-bar">
              <div>
                <div className="section-kicker flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-500" />
                  Titik Kumpul & Lokasi
                </div>
                <h2 className="section-heading">{MEETING_INFO.venue}</h2>
              </div>
            </div>

            <div className="venue-radar-grid">
              <div className="venue-card">
                <div className="venue-header">
                  <div className="venue-title-row">
                    <div>
                      <h3 className="venue-title">{MEETING_INFO.venue}</h3>
                      <p className="venue-address-text">{MEETING_INFO.fullAddress}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-copy-address"
                      onClick={() =>
                        copyToClipboard(
                          MEETING_INFO.fullAddress,
                          'addr',
                          'Alamat lengkap berhasil disalin!'
                        )
                      }
                      title="Salin Alamat Lengkap"
                    >
                      {copiedKey === 'addr' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === 'addr' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="map-iframe-container">
                  <VenueMapPreview
                    lat={MEETING_INFO.coordinates.lat}
                    lng={MEETING_INFO.coordinates.lng}
                    venueName={MEETING_INFO.venue}
                    address={MEETING_INFO.fullAddress}
                  />
                </div>

                <div className="venue-actions-row">
                  <a
                    href={MEETING_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary-red flex-1"
                    onClick={() => playClickSound(isAudioMuted)}
                  >
                    <Navigation size={16} /> Buka di Google Maps
                    <ExternalLink size={14} />
                  </a>

                  <a
                    href={MEETING_INFO.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary-hud flex-1"
                    onClick={() => playClickSound(isAudioMuted)}
                  >
                    <Car size={16} /> Buka di Waze
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="venue-intel-card">
                <div className="intel-header font-semibold text-sm">
                  Informasi & Fasilitas
                </div>

                <div className="intel-facility-list">
                  {MEETING_INFO.facilities.map((item, idx) => (
                    <div key={idx} className="intel-facility-item">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="intel-brief-box">
                  <div className="intel-brief-title text-amber-400 font-semibold mb-1">
                    Catatan untuk Semua:
                  </div>
                  <p className="intel-brief-text text-xs text-zinc-300">
                    "Begitu sampai di Kopi Kenangan Kemang Timur, langsung gabung ke meja 9 orang kita. Jangan nongkrong terpisah di luar. Kita mulai jam 17.30 teng!"
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Split: Rules & WhatsApp Dispatch */}
          <section className="bottom-split">
            <div className="split-col">
              <div className="section-kicker">Ketentuan Bersama</div>
              <h2 className="section-heading mb-4">Protokol Anti Wacana</h2>

              <div className="rule-list">
                {EMERGENCY_RULES.map((rule) => (
                  <div key={rule.code} className="rule-item">
                    <div className="rule-header">
                      <span className="rule-code font-bold text-red-400">[{rule.code}]</span>
                      <h4 className="rule-title">{rule.title}</h4>
                    </div>
                    <p className="rule-desc">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="split-col">
              <div className="section-kicker">Pesan Siaran Grup</div>
              <h2 className="section-heading mb-4">Kirim ke WhatsApp</h2>

              <div className="wa-preview-card">
                <div className="wa-header-strip">
                  <span className="text-xs text-zinc-300">Format Teks WhatsApp</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Siap Hadir: {confirmedCount + otwCount}/9
                  </span>
                </div>
                <pre className="wa-box">{waGroupText}</pre>
              </div>

              <div className="wa-btn-actions">
                <button
                  type="button"
                  className="btn-primary-red flex-1"
                  onClick={() =>
                    copyToClipboard(
                      waGroupText,
                      'wa',
                      'Pesan WhatsApp berhasil disalin!'
                    )
                  }
                >
                  {copiedKey === 'wa' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey === 'wa' ? 'Tersalin!' : 'Salin Pesan'}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waGroupText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp flex-1"
                  onClick={() => playClickSound(isAudioMuted)}
                >
                  <Share2 size={16} /> Kirim ke WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer-bar">
            <div className="footer-line">
              Menuju Malam Puncak — {MEETING_INFO.dayDate} (17.30 - 21.00 WIB) — {MEETING_INFO.venue}
            </div>
            <div className="footer-crew-list">
              Dapi • Aday • Kol • Bina • Ucup • Hilal • Ayas • Talita • Awa
            </div>
            <div className="footer-copyright">
              Kopi Kenangan Kemang Timur, Jakarta Selatan
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
