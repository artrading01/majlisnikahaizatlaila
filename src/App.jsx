import React, { useState, useEffect, useRef } from 'react';
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
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Lock,
  Quote,
  CheckCircle2,
  VolumeX, 
  ChevronDown, 
  Sparkles,
  MailOpen,
  Music,
  Navigation
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  // Konfigurasi manual anda untuk Vercel/Local
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'majlis-aizat-laila';

const COLLECTION_NAME = "rsvp_responses"; 

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpData, setRsvpData] = useState([]);
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, minit: 0, saat: 0 });
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const audioRef = useRef(null);
  const CORRECT_PIN = "1234"; 
  const [guestName, setGuestName] = useState('');

  // Ambil nama dari URL (?to=Nama)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-06-06T09:00:00');
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
          jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minit: Math.floor((difference / 1000 / 60) % 60),
          saat: Math.floor((difference / 1000) % 60)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error:", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch RSVP Data (Admin Only)
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;

    const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
    
    const unsubRsvp = onSnapshot(rsvpCol, 
      (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setRsvpData(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }, 
      (e) => console.error("Firestore Read Error:", e)
    );
    
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const openInvitation = () => {
    setIsOpen(true);
    setView('invitation');
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked"));
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio error"));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === CORRECT_PIN) {
        setIsAdminAuthenticated(true);
        setView('admin');
        setShowAdminLogin(false);
    } else {
        setAdminPin('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !user) return;
    
    setLoading(true);
    try {
      const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
      await addDoc(rsvpCol, {
        ...form,
        pax: parseInt(form.pax) || 1,
        timestamp: Date.now(),
        userId: user.uid
      });
      setSubmitted(true);
    } catch (err) { 
        console.error("Submission Error:", err);
    } finally { 
        setLoading(false); 
    }
  };

  const totalGuests = rsvpData.filter(r => r.attendance === 'Hadir').reduce((s, c) => s + (Number(c.pax) || 0), 0);

  // VIEW: Admin Panel
  if (view === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] p-4 md:p-10 font-jakarta text-stone-800">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
                <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Kembali</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                  <p className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest uppercase">Jumlah Rekod</p>
                  <p className="text-4xl font-black">{rsvpData.length}</p>
                </div>
                <div className="bg-stone-900 p-8 rounded-[2rem] text-white shadow-xl">
                  <p className="text-[10px] font-bold text-stone-500 mb-2 tracking-widest uppercase">Jumlah Pax Hadir</p>
                  <p className="text-4xl font-black text-[#d4bdad]">{totalGuests}</p>
                </div>
            </div>
            <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-[10px] font-bold uppercase text-stone-400 tracking-widest">
                            <tr><th className="p-6">Nama</th><th className="p-6 text-center">Status</th><th className="p-6 text-center">Pax</th><th className="p-6">Ucapan</th></tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {rsvpData.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-stone-400 italic">Tiada data RSVP ditemui.</td></tr>
                            ) : (
                                rsvpData.map(r => (
                                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="p-6 font-bold">{r.name}</td>
                                        <td className="p-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${r.attendance === 'Hadir' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{r.attendance}</span>
                                        </td>
                                        <td className="p-6 text-center font-medium">{r.pax}</td>
                                        <td className="p-6 italic text-stone-500">{r.wish || '-'}</td>
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

  // VIEW: Admin Login
  if (showAdminLogin) {
    return (
        <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <Lock className="w-8 h-8 text-[#d4bdad] mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-8 uppercase tracking-widest">Akses Pemilik</h2>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full text-center text-3xl py-4 border-b-2 outline-none focus:border-[#d4bdad] transition-colors" placeholder="****" maxLength={4} />
                    <button className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all">Sahkan PIN</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="text-stone-400 text-[10px] uppercase font-bold mt-4 block mx-auto tracking-widest">Batal</button>
                </form>
            </div>
        </div>
    );
  }

  // VIEW: Landing Page
  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0d0d0d] flex items-center justify-center text-white text-center p-8">
        <div className="max-w-md flex flex-col items-center">
            <div className="flex items-center gap-3 mb-10 opacity-40">
                <div className="h-px w-8 bg-white"></div>
                <Heart className="w-4 h-4 fill-white" />
                <div className="h-px w-8 bg-white"></div>
            </div>
            <h1 className="text-4xl font-serif mb-12 italic tracking-wide">Undangan Eksklusif <br/> Aizat & Laila</h1>
            {guestName && (
                <div className="mb-16 animate-fade-in">
                    <p className="text-[10px] text-stone-500 uppercase tracking-[0.4em] mb-4">Istimewa Buat</p>
                    <h2 className="text-3xl font-serif italic text-[#d4bdad]">{guestName}</h2>
                </div>
            )}
            <button onClick={openInvitation} className="bg-white text-stone-950 px-12 py-6 rounded-full font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl">
                <MailOpen className="w-4 h-4" /> Buka Undangan
            </button>
        </div>
      </div>
    );
  }

  // MAIN VIEW: Invitation Page
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] selection:bg-[#d4bdad] animate-fade-in">
      <audio ref={audioRef} loop preload="auto">
        <source src="file:///C:/Users/Aizat/Downloads/Janji%20Suci%20-%20Yovie%20&%20Nuno%20(KARAOKE%20PIANO%20-%20FEMALE%20KEY).mp3" type="audio/mpeg" />
      </audio>

      <div className="fixed bottom-8 right-8 z-[100]">
        <button onClick={toggleMusic} className="p-4 bg-white rounded-full shadow-2xl border transition-all active:scale-90">
            {isPlaying ? <Music className="w-5 h-5 animate-pulse text-[#b08d79]" /> : <VolumeX className="w-5 h-5 text-stone-400" />}
        </button>
      </div>

      {/* Hero Section with Modern Arch */}
      <section className="relative min-h-screen flex items-center justify-center text-center p-8 overflow-hidden">
        {/* Visual Arch Elements */}
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
                <h2 className="text-3xl font-serif italic mb-3">Sahkan Kehadiran</h2>
                <p className="text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em]">RSVP Majlis Aizat & Laila</p>
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
                        <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="1" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-none" placeholder="Tuliskan ucapan anda..."></textarea>
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
         <button onClick={() => setShowAdminLogin(true)} className="text-[8px] uppercase tracking-widest text-stone-200 hover:text-stone-800 transition-colors font-bold flex items-center gap-2 mx-auto">
             <Lock className="w-3 h-3" /> Panel Admin
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
