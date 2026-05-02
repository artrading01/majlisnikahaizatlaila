import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot,
  serverTimestamp
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
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Navigation,
  Map as MapIcon,
  MailOpen,
  AlertCircle,
  Loader2,
  Quote
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const FIXED_APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'aizat-laila-wedding-v1'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('invitation');
  const [rsvpData, setRsvpData] = useState([]);
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, minit: 0, saat: 0 });
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [guestName, setGuestName] = useState('');

  // 1. Ambil nama jemputan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // 2. Countdown Timer
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

  // 3. Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 4. Load Elfsight Script secara dinamik apabila undangan dibuka
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        // Optional: cleanup jika perlu
      };
    }
  }, [isOpen]);

  const openInvitation = () => {
    setIsOpen(true);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === "1234") {
        setIsAdminAuthenticated(true);
        setView('admin');
        setShowAdminLogin(false);
    } else {
        setAdminPin('');
        setError("PIN Salah");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthReady || !user) return;
    setLoading(true);
    try {
      const rsvpCol = collection(db, 'artifacts', FIXED_APP_ID, 'public', 'data', 'rsvp');
      await addDoc(rsvpCol, {
        ...form,
        pax: parseInt(form.pax) || 1,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) { 
      setError("Gagal menghantar RSVP.");
    } finally { 
      setLoading(false); 
    }
  };

  if (showAdminLogin) {
    return (
        <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6 font-jakarta text-stone-800">
            <div className="w-full max-w-md text-center">
                <Lock className="w-8 h-8 text-[#d4bdad] mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-8 uppercase tracking-widest">Akses Pemilik</h2>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full text-center text-3xl py-4 border-b-2 outline-none focus:border-[#d4bdad] transition-colors" placeholder="****" maxLength={4} />
                    <button className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest">Sahkan PIN</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="text-stone-400 text-[10px] uppercase font-bold mt-4 block mx-auto tracking-widest">Batal</button>
                </form>
            </div>
        </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0d0d0d] flex items-center justify-center text-white text-center p-8 font-jakarta">
        <div className="max-w-md flex flex-col items-center">
            <Heart className="w-5 h-5 text-[#d4bdad] mb-12 opacity-50" />
            <h1 className="text-3xl md:text-5xl font-serif italic tracking-wide mb-10 leading-snug">
              Undangan Eksklusif <br/> Aizat & Laila
            </h1>
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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] font-jakarta selection:bg-[#d4bdad] overflow-x-hidden scroll-smooth animate-fade-in">
      
      {/* ELFSIGHT WIDGET AREA */}
      {/* Widget akan muncul secara automatik selepas script platform.js dimuatkan di atas */}
      <div className="elfsight-app-db1ed12b-0af2-4c24-82cd-63e28da66eea" data-elfsight-app-lazy></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-center p-8">
        <div className="absolute inset-x-8 top-16 bottom-16 border border-[#d4bdad]/20 rounded-t-[500px] pointer-events-none z-0"></div>
        <div className="z-10">
            <Sparkles className="w-5 h-5 text-[#d4bdad] mx-auto mb-12 opacity-50" />
            <p className="text-[10px] uppercase tracking-[0.8em] text-stone-400 mb-8 font-black">Walimatulurus</p>
            <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Aizat</h1>
            <div className="flex items-center justify-center gap-6 my-4 opacity-30 text-xl font-serif italic text-stone-500">
                <div className="h-px w-10 bg-stone-300"></div> & <div className="h-px w-10 bg-stone-300"></div>
            </div>
            <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Laila</h1>
            <p className="text-[12px] font-bold uppercase tracking-[0.4em] mt-12 text-stone-800">Sabtu | 06.06.2026</p>
            <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="mt-24 text-stone-200 animate-bounce block mx-auto">
                <ChevronDown className="w-6 h-6" />
            </button>
        </div>
      </section>

      {/* Countdown */}
      <section className="py-20 px-8 bg-white border-y border-stone-50 text-center">
        <p className="text-[10px] uppercase tracking-[0.6em] text-stone-400 font-bold mb-10">Menghitung Hari</p>
        <div className="flex justify-center items-center gap-6 md:gap-16">
            {Object.entries(timeLeft).map(([label, value], i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-4xl md:text-6xl font-light text-[#b08d79] mb-2">{String(value).padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{label}</span>
                </div>
            ))}
        </div>
      </section>

      {/* Details */}
      <section className="py-32 px-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <Calendar className="w-6 h-6 text-[#b08d79]" />
                <h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Aturcara Majlis</h3>
                <div className="space-y-2">
                    <p className="text-2xl font-serif italic">Sabtu, 6 Jun 2026</p>
                    <p className="text-stone-500 font-medium text-sm">9:00 Pagi - Selesai</p>
                </div>
            </div>
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <MapPin className="w-6 h-6 text-[#b08d79]" />
                <h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Lokasi Majlis</h3>
                <div className="space-y-2">
                    <p className="text-xl font-serif italic">Masjid Jamek Cina Muslim Klang</p>
                </div>
                <div className="flex gap-4">
                    <a href="https://www.google.com/maps/search/?api=1&query=Masjid+Jamek+Cina+Muslim+Klang" target="_blank" rel="noreferrer" className="px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapIcon className="w-3 h-3" /> Maps
                    </a>
                    <a href="https://www.waze.com/ul?q=Masjid+Jamek+Cina+Muslim+Klang&navigate=yes" target="_blank" rel="noreferrer" className="px-6 py-3 border border-stone-200 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Navigation className="w-3 h-3" /> Waze
                    </a>
                </div>
            </div>
      </section>

      {/* RSVP */}
      <section className="py-32 px-8 bg-white" id="rsvp">
        <div className="max-w-2xl mx-auto bg-[#faf9f6] rounded-[3rem] p-10 md:p-20 shadow-inner border border-stone-50">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-serif italic mb-3">Sahkan Kehadiran</h2>
                <p className="text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em]">RSVP Majlis Aizat & Laila</p>
            </div>
            {submitted ? (
                <div className="text-center py-10 animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
                    <p className="text-xl font-serif italic text-emerald-900">Terima Kasih!</p>
                    <p className="text-stone-400 text-xs mt-2">Kehadiran anda telah direkodkan.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Nama Penuh</label>
                        <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Kehadiran</label>
                            <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm cursor-pointer">
                                <option value="Hadir">Akan Hadir</option>
                                <option value="Tidak Hadir">Tidak Hadir</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Pax</label>
                            <input type="number" min="1" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Ucapan & Doa</label>
                        <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="1" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-none"></textarea>
                    </div>
                    <button disabled={loading} className="w-full bg-stone-900 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hantar RSVP'}
                    </button>
                </form>
            )}
        </div>
      </section>

      <footer className="py-32 text-center">
         <p className="text-[9px] uppercase tracking-[1em] font-black text-stone-200 mb-10">#AIZATXLAILA</p>
         <button onClick={() => setShowAdminLogin(true)} className="text-[8px] uppercase tracking-widest text-stone-300 hover:text-stone-800 transition-colors font-bold flex items-center gap-2 mx-auto">
             <Lock className="w-3 h-3" /> Panel Admin
         </button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; background: #faf9f6; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
