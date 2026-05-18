import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Quote, 
  Calendar, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Lock 
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
  onAuthStateChanged 
} from 'firebase/auth';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAvo3MD7-kS7DJsgp0kfQdmRQyglsIzc2o",
  authDomain: "majlisnikahaizatlaila.firebaseapp.com",
  projectId: "majlisnikahaizatlaila",
  storageBucket: "majlisnikahaizatlaila.firebasestorage.app",
  messagingSenderId: "301347520690",
  appId: "1:301347520690:web:06e7d407f0a7632a8849ab"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const appId = 'majlis-aizat-laila';
const COLLECTION_NAME = "rsvp_responses"; 

const App = () => {
  // STATE MANAGEMENT
  const [view, setView] = useState('invitation'); // 'invitation' atau 'admin'
  const [isOpened, setIsOpened] = useState(false); // Untuk skrin Buka Undangan
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, minit: 0, saat: 0 });
  const [user, setUser] = useState(null);
  const [rsvpData, setRsvpData] = useState([]);
  
  // RSVP Form State
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Admin State
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [guestName, setGuestName] = useState('');
  const audioRef = useRef(null);
  const CORRECT_PIN = "1234";

  // 1. Ambil nama dari URL (?to=Nama)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // 2. Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-06-06T09:00:00');
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          hari: Math.floor(diff / (1000 * 60 * 60 * 24)),
          jam: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minit: Math.floor((diff / 1000 / 60) % 60),
          saat: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 4. Fetch RSVP Data (Admin Only)
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;
    const rsvpCol = collection(db, COLLECTION_NAME); 
    
    const unsubRsvp = onSnapshot(rsvpCol, 
      (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setRsvpData(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }, 
      (e) => {
        console.error("Firestore Read Error:", e);
        setErrorMessage("Ralat membaca data. Sila semak Firestore.");
      }
    );
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  // Handle RSVP Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !user) {
      if(!user) setErrorMessage("Sistem sedang bersedia. Sila tunggu sebentar.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const rsvpCol = collection(db, COLLECTION_NAME);
      await addDoc(rsvpCol, {
        ...form,
        pax: parseInt(form.pax),
        timestamp: Date.now(),
        userId: user.uid
      });
      setSubmitted(true);
    } catch (err) { 
      console.error("Submission Error:", err);
      setErrorMessage("Gagal menghantar RSVP. Sila cuba lagi.");
    } finally { 
      setLoading(false); 
    }
  };

  // Toggle Audio Form function
  const toggleAudio = () => {
    if (audioRef.current.paused) { 
      audioRef.current.play(); 
      setIsPlaying(true); 
    } else { 
      audioRef.current.pause(); 
      setIsPlaying(false); 
    }
  };

  // UI: SKRIN PENGENALAN (Menyelesaikan Isu Audio Safari)
  if (!isOpened) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden text-[#2c2c2c]">
        {/* Decorative Arch */}
        <div className="absolute inset-x-8 top-16 bottom-16 border-[1px] border-[#d4bdad]/30 rounded-t-[500px] pointer-events-none z-0"></div>
        
        <div className="z-10 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.8em] text-stone-400 mb-8 font-black">Walimatulurus</p>
          <h1 className="text-6xl md:text-8xl font-script text-[#b08d79] mb-4">Aizat & Laila</h1>
          
          {guestName && (
            <div className="mt-8 mb-4">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Istimewa Buat:</p>
              <p className="text-2xl font-serif italic text-stone-800">{guestName}</p>
            </div>
          )}
          
          <button
            onClick={() => {
              setIsOpened(true);
              if (audioRef.current) {
                // Audio akan selamat dimainkan kerana dipanggil hasil interaksi "Click" pengguna
                audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Audio play error:", e));
              }
            }}
            className="mt-12 px-8 py-4 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 animate-bounce"
          >
            Buka Undangan
          </button>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-script { font-family: 'Alex Brush', cursive; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // UI: ADMIN VIEW
  if (view === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-sm w-full text-center border border-stone-100">
            <Lock className="w-10 h-10 text-[#d4bdad] mx-auto mb-6" />
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Akses Admin</h2>
            <input 
              type="password" 
              placeholder="Masukkan PIN" 
              className="w-full bg-stone-50 border border-stone-200 py-4 px-6 rounded-xl text-center tracking-widest mb-4 outline-none focus:border-stone-400"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setView('invitation')} className="flex-1 py-4 text-[10px] uppercase font-bold text-stone-500">Batal</button>
              <button 
                onClick={() => { if (adminPin === CORRECT_PIN) setIsAdminAuthenticated(true); else alert('PIN Salah'); }}
                className="flex-1 bg-stone-900 text-white rounded-xl py-4 text-[10px] uppercase font-bold tracking-widest"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      );
    }

    const hadirCount = rsvpData.filter(r => r.attendance === 'Hadir').length;
    const paxCount = rsvpData.filter(r => r.attendance === 'Hadir').reduce((sum, r) => sum + (parseInt(r.pax) || 0), 0);

    return (
      <div className="min-h-screen bg-[#faf9f6] p-8 font-jakarta text-[#2c2c2c] animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border shadow-sm">
            <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
            <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Kembali</button>
          </div>
          
          {errorMessage && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold mb-4">{errorMessage}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
              <p className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest uppercase">Jumlah Rekod</p>
              <p className="text-5xl font-light text-[#b08d79]">{rsvpData.length}</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
              <p className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest uppercase">Jumlah Hadir (Pax)</p>
              <p className="text-5xl font-light text-[#b08d79]">{hadirCount} <span className="text-lg text-stone-400">/ {paxCount} pax</span></p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-widest text-stone-400 bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-8 py-6">Nama</th>
                    <th className="px-8 py-6">Kehadiran</th>
                    <th className="px-8 py-6">Pax</th>
                    <th className="px-8 py-6">Ucapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rsvpData.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-stone-400 italic">Tiada data RSVP ditemui.</td></tr>
                  ) : (
                    rsvpData.map(r => (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-8 py-6 font-bold">{r.name}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.attendance === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {r.attendance}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-medium">{r.attendance === 'Hadir' ? r.pax : '-'}</td>
                        <td className="px-8 py-6 text-stone-500 italic whitespace-pre-wrap break-words min-w-[300px] leading-relaxed">{r.wish || '-'}</td>
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

  // UI: MAIN INVITATION VIEW
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] selection:bg-[#d4bdad] animate-fade-in relative">
      
      {/* SILA LETAK FAIL AUDIO (cth: music.mp3) DI DALAM FOLDER "public" VITE ANDA */}
      <audio ref={audioRef} loop playsInline preload="auto">
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      {/* Floating Audio Button */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleAudio}
          className="w-12 h-12 bg-white/80 backdrop-blur-md border border-stone-200 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-stone-600"
        >
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-center p-8 overflow-hidden">
        <div className="absolute inset-x-8 top-16 bottom-16 border-[1px] border-[#d4bdad]/30 rounded-t-[500px] pointer-events-none z-0"></div>
        <div className="absolute inset-x-12 top-20 bottom-20 border-[1px] border-[#d4bdad]/10 rounded-t-[500px] pointer-events-none z-0"></div>

        <div className="z-10 flex flex-col items-center">
          <Sparkles className="w-5 h-5 text-[#d4bdad] mb-12 opacity-50" />
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
            <h2 className="text-3xl font-serif italic mb-4">Pengesahan Kehadiran</h2>
            <p className="text-stone-500 text-sm">Sila sahkan kehadiran anda sebelum 1 Jun 2026</p>
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
                  <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm appearance-none cursor-pointer">
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
                <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="4" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-y leading-relaxed" placeholder="Tuliskan ucapan anda..."></textarea>
              </div>

              <button disabled={loading} className="w-full bg-stone-950 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Menghantar...' : 'Hantar RSVP'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer & Admin Toggle */}
      <footer className="py-32 text-center">
        <p className="text-[9px] uppercase tracking-[1em] font-black text-stone-300 mb-10">#AIZATXLAILA</p>
        <button onClick={() => setView('admin')} className="text-[8px] uppercase tracking-widest text-stone-200 hover:text-stone-800 transition-colors font-bold flex items-center gap-2 mx-auto">
          <Lock className="w-3 h-3" /> Admin Panel
        </button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
