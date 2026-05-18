import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Quote, 
  Calendar, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Music, 
  VolumeX, 
  Lock,
  MailOpen
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  // Konfigurasi Firebase anda
  return {
    apiKey: "AIzaSyAvo3MD7-kS7DJsgp0kfQdmRQyglsIzc2o",
    authDomain: "majlisnikahaizatlaila.firebaseapp.com",
    projectId: "majlisnikahaizatlaila",
    storageBucket: "majlisnikahaizatlaila.firebasestorage.app",
    messagingSenderId: "301347520690",
    appId: "1:301347520690:web:06e7d407f0a7632a8849ab"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// ID unik untuk memisahkan data dalam Firestore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'majlis-aizat-laila';
const COLLECTION_NAME = "rsvp_responses"; 

export default function App() {
  const [view, setView] = useState('invitation'); // 'invitation' | 'admin'
  const [isOpened, setIsOpened] = useState(false); // State untuk cover page
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, minit: 0, saat: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [user, setUser] = useState(null);
  const [rsvpData, setRsvpData] = useState([]);
  
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const audioRef = useRef(null);
  const CORRECT_PIN = "1234"; 
  const [guestName, setGuestName] = useState('');

  // 1. Ambil nama dari URL (?to=Nama)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // 2. Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-06-06T09:00:00').getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        hari: Math.floor(distance / (1000 * 60 * 60 * 24)),
        jam: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minit: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        saat: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 3. Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 4. Fetch RSVP Data (Admin Only)
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;

    const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);

    const unsubRsvp = onSnapshot(rsvpCol, 
      (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        // Susun mengikut masa (terbaru di atas)
        setRsvpData(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }, 
      (e) => {
        console.error("Firestore Read Error:", e);
        setErrorMessage("Ralat membaca data. Sila semak Firestore Rules.");
      }
    );

    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      setIsPlaying(true);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === CORRECT_PIN) {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setView('admin');
      setErrorMessage('');
    } else {
      setErrorMessage('PIN Salah. Sila cuba lagi.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (!user) {
      setErrorMessage("Sistem sedang bersedia. Sila tunggu sebentar.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
      await addDoc(rsvpCol, {
        ...form,
        timestamp: Date.now(),
        userId: user.uid
      });
      setSubmitted(true);
    } catch (err) { 
      console.error("Submission Error:", err);
      setErrorMessage("Gagal menghantar RSVP. Pastikan Firestore Cloud aktif.");
    } finally { 
      setLoading(false); 
    }
  };

  // ADMIN VIEW
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] p-8 font-jakarta">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12 border-b border-stone-200 pb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
            <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Kembali</button>
          </div>
          
          {errorMessage && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold mb-4">{errorMessage}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
              <p className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest uppercase">Jumlah Rekod</p>
              <p className="text-4xl font-light text-[#b08d79]">{rsvpData.length}</p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Nama</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Kehadiran</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Pax</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Ucapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rsvpData.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-stone-400 italic">Tiada data RSVP ditemui.</td></tr>
                  ) : (
                    rsvpData.map(r => (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-6 font-medium text-sm align-top">{r.name}</td>
                        <td className="p-6 text-sm align-top">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${r.attendance === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {r.attendance}
                          </span>
                        </td>
                        <td className="p-6 text-sm text-stone-500 align-top">{r.pax}</td>
                        {/* 
                          DIKEMAS KINI: Membuang "truncate max-w-xs" dan menambah "whitespace-pre-wrap min-w-[300px]" 
                          supaya tulisan panjang boleh dibaca berenggan-perenggan.
                        */}
                        <td className="p-6 text-sm text-stone-600 italic whitespace-pre-wrap min-w-[300px] align-top leading-relaxed">{r.wish || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW: Invitation Page
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] selection:bg-[#d4bdad] font-jakarta relative overflow-x-hidden">
      
      {/* Styles - dipindahkan ke atas untuk pastikan font load pada cover page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
        
        body { scroll-behavior: smooth; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpFade {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-100%); pointer-events: none; }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .cover-hidden { animation: slideUpFade 1s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* COVER PAGE (Muka Depan) */}
      <div className={`fixed inset-0 z-[100] bg-[#faf9f6] flex flex-col items-center justify-center transition-all ${isOpened ? 'cover-hidden' : ''}`}>
        <div className="absolute inset-4 border-[1px] border-[#d4bdad]/30 rounded-3xl pointer-events-none"></div>
        <div className="absolute inset-8 border-[1px] border-[#d4bdad]/10 rounded-3xl pointer-events-none"></div>
        
        <div className="z-10 flex flex-col items-center text-center px-8">
          <p className="text-[10px] uppercase tracking-[0.4em] mb-8 text-stone-400 font-bold">Walimatulurus</p>
          <h1 className="text-6xl md:text-8xl font-script text-[#b08d79] mb-4">Aizat & Laila</h1>
          
          <div className="h-px w-20 bg-stone-300 my-8"></div>

          {guestName && (
            <div className="mb-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <p className="text-[9px] uppercase tracking-widest font-bold mb-2 text-stone-400">Teristimewa Buat</p>
              <p className="text-2xl font-serif italic text-stone-700">{guestName}</p>
            </div>
          )}

          <button 
            onClick={handleOpenInvitation}
            className="mt-4 px-10 py-5 bg-stone-900 text-white rounded-full text-[10px] uppercase font-bold tracking-[0.3em] shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center gap-3 animate-fade-in"
            style={{animationDelay: '0.6s'}}
          >
            <MailOpen className="w-4 h-4" /> Buka Kad
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop preload="auto">
        <source src="/0502.mp3" type="audio/mpeg" />
      </audio>

      {/* Floating Audio Button */}
      <div className={`fixed bottom-8 right-8 z-50 transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={toggleAudio} 
          className="w-14 h-14 bg-white/80 backdrop-blur-md border border-stone-200 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all text-stone-600"
        >
          {isPlaying ? <Music className="w-5 h-5 animate-pulse text-[#b08d79]" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Content wrapper - fade in after cover is opened */}
      <div className={`transition-opacity duration-1000 delay-500 ${isOpened ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        
        {/* Hero Section with Modern Arch */}
        <section className="relative min-h-screen flex items-center justify-center text-center p-8 overflow-hidden">
          <div className="absolute inset-x-8 top-16 bottom-16 border-[1px] border-[#d4bdad]/30 rounded-t-[500px] pointer-events-none z-0"></div>
          <div className="absolute inset-x-12 top-20 bottom-20 border-[1px] border-[#d4bdad]/10 rounded-t-[500px] pointer-events-none z-0"></div>
          
          <div className="z-10 flex flex-col items-center">
            <Sparkles className="w-5 h-5 text-[#d4bdad] mb-12 opacity-50" />
            
            {guestName && (
              <div className="mb-10 text-stone-500">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2">Teristimewa Buat</p>
                <p className="text-xl font-serif italic">{guestName}</p>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.8em] text-stone-400 mb-8 font-black">Walimatulurus</p>
            
            <div className="relative">
              <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Aizat</h1>
              <div className="flex items-center justify-center gap-6 my-4 opacity-30">
                <div className="h-px w-10 bg-stone-800"></div>
                <span className="serif italic text-xl">&</span>
                <div className="h-px w-10 bg-stone-800"></div>
              </div>
              <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Laila</h1>
            </div>
            
            <p className="text-[12px] font-bold uppercase tracking-[0.4em] mt-12 text-stone-800">Sabtu | 06.06.2026</p>
            
            <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="mt-24 text-stone-300 hover:text-stone-800 transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </button>
          </div>
        </section>

        {/* Heart Quote */}
        <section className="py-40 px-8 max-w-4xl mx-auto text-center">
          <Quote className="w-6 h-6 text-[#d4bdad] mx-auto mb-10 opacity-30" />
          <p className="text-xl md:text-2xl font-serif italic text-stone-600 leading-relaxed font-light">
              "Ya Allah, pancarkanlah cahaya kasih-Mu ke dalam hati mereka, jadikanlah ikatan ini jambatan ke syurga, dan hiasilah rumah tangga mereka dengan bauan syurga yang penuh ketenangan dan kesetiaan."
          </p>
          <div className="mt-12 h-px w-20 bg-stone-100 mx-auto"></div>
        </section>

        {/* Countdown Timer */}
        <section className="py-20 px-8 bg-white border-y border-stone-50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[0.6em] text-stone-400 font-bold mb-12">Menanti Detik Bahagia</p>
            <div className="flex justify-center items-center gap-6 md:gap-16">
              {[
                { label: 'Hari', value: timeLeft.hari },
                { label: 'Jam', value: timeLeft.jam },
                { label: 'Minit', value: timeLeft.minit },
                { label: 'Saat', value: timeLeft.saat }
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-4xl md:text-6xl font-light text-[#b08d79] mb-2">{String(t.value).padStart(2, '0')}</span>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-40 px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Event Time */}
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8 hover:shadow-xl transition-all group">
              <Calendar className="w-6 h-6 text-[#b08d79] group-hover:scale-110 transition-transform" />
              <h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Aturcara Majlis</h3>
              <div className="space-y-2">
                  <p className="text-2xl font-serif italic">Sabtu, 6 Jun 2026</p>
                  <p className="text-stone-500 font-medium">9:00 Pagi - Selesai</p>
              </div>
            </div>

            {/* Event Location */}
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8 hover:shadow-xl transition-all group">
              <MapPin className="w-6 h-6 text-[#b08d79] group-hover:scale-110 transition-transform" />
              <h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Lokasi Majlis</h3>
              <div className="space-y-3">
                  <p className="text-xl font-serif italic leading-tight">Masjid Jamek Cina Muslim Klang</p>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider max-w-[250px] mx-auto">
                      Lot 157828, Jalan Langat, Bandar Botanik, 41200 Klang, Selangor
                  </p>
              </div>
              <div className="flex gap-4 pt-4">
                  <a href="https://www.google.com/maps/search/?api=1&query=Masjid+Jamek+Cina+Muslim+Klang" target="_blank" rel="noreferrer" className="px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-colors">
                      <Navigation className="w-3 h-3" /> Maps
                  </a>
              </div>
            </div>

          </div>
        </section>

        {/* RSVP Form */}
        <section className="py-40 px-8 bg-white" id="rsvp">
          <div className="max-w-2xl mx-auto bg-[#faf9f6] rounded-[3rem] p-10 md:p-20 shadow-inner border border-stone-50">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif italic text-stone-800 mb-4">Pengesahan Kehadiran</h2>
              <p className="text-stone-400 text-sm">Sila sahkan kehadiran anda sebelum 6 Mei 2026.</p>
            </div>

            {submitted ? (
              <div className="text-center py-10 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-xl font-serif italic text-emerald-900 mb-2">Terima Kasih!</p>
                <p className="text-stone-500 text-sm">Maklum balas anda telah kami terima.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-[9px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900">Hantar RSVP Lain</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                {errorMessage && <p className="text-red-500 text-[10px] font-bold uppercase">{errorMessage}</p>}
                
                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Nama Penuh</label>
                    <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm" placeholder="Contoh: Ahmad Fauzi" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Kehadiran</label>
                      <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm cursor-pointer appearance-none">
                        <option value="Hadir">Akan Hadir</option>
                        <option value="Tidak Hadir">Tidak Hadir</option>
                      </select>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Bilangan Pax</label>
                      <input type="number" min="1" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm" placeholder="1" />
                  </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Ucapan & Doa</label>
                    <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="3" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-none" placeholder="Tuliskan ucapan anda..."></textarea>
                </div>

                <button disabled={loading} className="w-full bg-stone-950 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Menghantar...' : 'Hantar RSVP'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer & Admin Toggle */}
        <footer className="py-32 text-center relative">
          <p className="text-[9px] uppercase tracking-[1em] font-black text-stone-300 mb-10">#AIZATXLAILA</p>
          
          <button onClick={() => setShowAdminLogin(true)} className="text-[8px] uppercase tracking-widest text-stone-200 hover:text-stone-800 transition-colors font-bold flex items-center gap-2 mx-auto">
            <Lock className="w-3 h-3" /> Admin
          </button>

          {showAdminLogin && (
            <form onSubmit={handleAdminLogin} className="mt-6 flex flex-col items-center gap-4 animate-fade-in">
              <input 
                type="password" 
                placeholder="PIN" 
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="px-4 py-2 border rounded-lg text-center text-sm outline-none w-32"
              />
              {errorMessage && <p className="text-red-500 text-xs">{errorMessage}</p>}
              <button type="submit" className="text-xs bg-stone-900 text-white px-4 py-2 rounded-lg">Masuk</button>
            </form>
          )}
        </footer>
      </div>
    </div>
  );
}
```eof

Perubahan utama yang saya telah buat:
1. **Muka Depan (Cover Page):** Ditambah state `isOpened` berserta paparan *full-screen* sebagai muka depan. Ada butang "Buka Kad" yang cantik disertakan dengan ikon yang akan melancarkan terus muzik latar dan memaparkan isi kad jemputan dengan animasi fade-up.
2. **Ubahsuai Jadual Admin:** Pada baris `<td className="p-6 text-sm...">` untuk ruang ucapan, saya tukar `truncate max-w-xs` kepada `whitespace-pre-wrap min-w-[300px] leading-relaxed`. Perubahan ini akan membenarkan teks untuk tersusun rapi mengikut panjang perenggan tanpa terpotong (walaupun ada beribu patah perkataan). 
3. **Peningkatan Borang Textarea:** Saya tinggikan sedikit kotak `textarea` pada borang RSVP (rows="3") supaya senang pelawat nak tulis ucapan yang panjang sikit.
