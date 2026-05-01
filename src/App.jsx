import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot,
  query,
  orderBy
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
  Clock, 
  Lock,
  Quote,
  CheckCircle2,
  Volume2,
  VolumeX, 
  Share2,
  ChevronDown,
  Sparkles,
  Navigation,
  Map as MapIcon,
  Timer,
  MailOpen,
  ExternalLink,
  Music,
  UserCheck,
  Users
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
 apiKey: "AIzaSyAvo3MD7-kS7DJsgp0kfQdmRQyglsIzc2o",
  authDomain: "majlisnikahaizatlaila.firebaseapp.com",
  projectId: "majlisnikahaizatlaila",
  storageBucket: "majlisnikahaizatlaila.firebasestorage.app",
  messagingSenderId: "301347520690",
  appId: "1:301347520690:web:06e7d407f0a7632a8849ab",
    };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'aizat-laila-wedding-v1';

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpData, setRsvpData] = useState([]);
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({
    hari: 0, jam: 0, minit: 0, saat: 0
  });

  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const audioRef = useRef(null);
  const CORRECT_PIN = "1234"; 

  const [guestName, setGuestName] = useState('');

  // Ambil nama tetamu daripada URL parameter (?to=Nama)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // Countdown Timer
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

  // Auth Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Ambil Data RSVP (Admin Sahaja)
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;
    const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', 'rsvp');
    const unsubRsvp = onSnapshot(rsvpCol, (s) => {
      setRsvpData(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error("Firestore error:", e));
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const openInvitation = () => {
    setIsOpen(true);
    setView('invitation');
    // Main audio sebaik sahaja dibuka
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.log("Audio playback failed:", e);
        setIsPlaying(false);
      });
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio block:", e));
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
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rsvp'), {
        ...form,
        pax: parseInt(form.pax),
        timestamp: Date.now()
      });
      setSubmitted(true);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const totalGuests = rsvpData
    .filter(r => r.attendance === 'Hadir')
    .reduce((s, c) => s + (Number(c.pax) || 0), 0);

  // --- UI ADMIN LOGIN ---
  if (showAdminLogin) {
    return (
        <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6 font-jakarta">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-stone-100">
                <Lock className="w-8 h-8 text-[#d4bdad] mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-2">Akses Pemilik</h2>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <input 
                        type="password" 
                        autoFocus
                        value={adminPin} 
                        onChange={(e) => setAdminPin(e.target.value)} 
                        className="w-full text-center text-3xl tracking-[0.5em] py-4 border-b-2 border-stone-100 focus:border-stone-800 outline-none transition bg-transparent font-black" 
                        placeholder="****" 
                        maxLength={4} 
                    />
                    <button className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Sahkan PIN</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="text-stone-400 text-[10px] uppercase font-bold tracking-widest pt-4 block mx-auto">Kembali</button>
                </form>
            </div>
        </div>
    );
  }

  // --- UI ADMIN PANEL ---
  if (view === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] p-4 md:p-10 font-jakarta text-stone-800">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
                <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">Kembali</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 text-center">
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Total Hadir</p>
                    <p className="text-4xl font-black">{totalGuests} Orang</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 text-center">
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Total RSVP</p>
                    <p className="text-4xl font-black">{rsvpData.length}</p>
                </div>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-400">
                        <tr>
                            <th className="px-6 py-4">Nama</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Pax</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {rsvpData.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 font-bold">{r.name}</td>
                                <td className="px-6 py-4">{r.attendance}</td>
                                <td className="px-6 py-4">{r.pax}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      </div>
    );
  }

  // --- UI LANDING (SEBELUM BUKA) ---
  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0d0d0d] flex items-center justify-center overflow-hidden font-jakarta text-white">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#b08d79] rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#403028] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-4xl px-8 text-center flex flex-col items-center">
            <div className="mb-10 flex flex-col items-center">
               <Heart className="w-5 h-5 text-[#d4bdad] mb-12 opacity-50" />
               <h1 className="text-3xl md:text-5xl font-serif tracking-tight font-light leading-snug animate-fade-in">
                 Undangan Eksklusif <br/> <span className="text-[#d4bdad] italic">Majlis Akad Nikah</span>
               </h1>
               {guestName && (
                 <div className="mt-12 mb-16">
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Istimewa Buat</p>
                    <h2 className="text-3xl md:text-5xl font-serif tracking-wide font-light italic">{guestName}</h2>
                 </div>
               )}
            </div>
            <button 
              onClick={openInvitation}
              className="group relative flex items-center gap-6 px-12 py-6 bg-white text-stone-950 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all hover:scale-105 shadow-2xl"
            >
              <MailOpen className="w-4 h-4" />
              <span>Buka Undangan</span>
            </button>
            <button onClick={() => setShowAdminLogin(true)} className="mt-12 opacity-20 hover:opacity-50 transition-opacity">
                <Lock className="w-4 h-4" />
            </button>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeIn 1.5s ease-out forwards; }
        `}</style>
      </div>
    );
  }

  // --- UI UTAMA (KAD JEMPUTAN) ---
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] font-jakarta selection:bg-[#d4bdad] overflow-x-hidden scroll-smooth pb-20">
      
      {/* Audio Player */}
      <audio ref={audioRef} loop preload="auto">
        <source src="http://googleusercontent.com/file_content/4" type="audio/mpeg" />
      </audio>

      {/* Floating Music Button */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button 
          onClick={toggleMusic} 
          className={`p-5 rounded-full shadow-2xl border transition-all duration-700 ${isPlaying ? 'bg-white text-[#b08d79]' : 'bg-stone-900 text-white'}`}
        >
            {isPlaying ? <Music className="w-5 h-5 animate-spin" style={{ animationDuration: '5s' }} /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center bg-[#fdfcfb]">
        <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
            <div className="relative w-full flex flex-col items-center">
                <div className="absolute -inset-10 border-t border-x border-dashed border-stone-100 rounded-t-[18rem] opacity-60"></div>
                <div className="relative z-10 w-full bg-white border border-stone-50 px-6 py-24 rounded-t-[18rem] rounded-b-[2rem] shadow-xl text-center">
                    <Sparkles className="w-5 h-5 text-[#d4bdad] mx-auto mb-10 opacity-50" />
                    <h1 className="text-6xl md:text-8xl font-script text-[#b08d79] mb-4">Aizat</h1>
                    <div className="flex items-center justify-center gap-4 opacity-40 mb-4">
                        <div className="h-px w-8 bg-stone-300"></div>
                        <span className="text-xl font-serif italic text-stone-500">&</span>
                        <div className="h-px w-8 bg-stone-300"></div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-script text-[#b08d79] mb-12">Laila</h1>
                    <div className="pt-8 border-t border-stone-50">
                       <p className="text-[12px] font-display uppercase tracking-[0.4em] text-stone-800 font-bold mb-2">Sabtu | 06.06.2026</p>
                       <p className="text-[9px] uppercase tracking-[0.25em] text-stone-400 font-black">Klang, Selangor</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-8 text-center max-w-4xl mx-auto">
        <Quote className="w-8 h-8 text-[#d4bdad] mx-auto mb-8 opacity-30" />
        <p className="text-xl md:text-2xl font-serif italic text-stone-600 leading-relaxed">
            "Ya Allah, pancarkanlah cahaya kasih-Mu ke dalam hati mereka, jadikanlah ikatan ini jambatan ke syurga, dan hiasilah rumah tangga mereka dengan bauan syurga yang penuh ketenangan."
        </p>
      </section>

      {/* Countdown Section */}
      <section className="py-20 px-8 bg-white border-y border-stone-50">
        <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[0.6em] text-stone-400 font-bold mb-10">Menghitung Hari</p>
            <div className="flex justify-center items-center gap-4 md:gap-12">
                {[
                  { label: 'Hari', value: timeLeft.hari },
                  { label: 'Jam', value: timeLeft.jam },
                  { label: 'Minit', value: timeLeft.minit },
                  { label: 'Saat', value: timeLeft.saat }
                ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center min-w-[60px]">
                        <span className="text-3xl md:text-5xl font-light text-[#b08d79] mb-2">{String(t.value).padStart(2, '0')}</span>
                        <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">{t.label}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-32 px-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white p-12 rounded-[2.5rem] border border-stone-50 shadow-sm text-center space-y-8">
              <Calendar className="w-6 h-6 text-[#b08d79] mx-auto" />
              <h3 className="text-xl font-display uppercase tracking-widest">Akad Nikah</h3>
              <div className="space-y-4">
                  <p className="text-2xl font-serif">Sabtu, 06 Jun 2026</p>
                  <p className="text-lg font-serif text-stone-400">9:00 Pagi</p>
              </div>
          </div>

          <div className="bg-white p-12 rounded-[2.5rem] border border-stone-50 shadow-sm text-center space-y-8">
              <MapPin className="w-6 h-6 text-[#b08d79] mx-auto" />
              <h3 className="text-xl font-display uppercase tracking-widest">Lokasi</h3>
              <div className="space-y-2">
                  <p className="font-serif text-lg leading-relaxed">Masjid Jamek Cina Muslim Klang</p>
                  <p className="text-xs text-stone-400 max-w-[250px] mx-auto leading-relaxed">
                    Lot 157828, Jalan Langat, Taman Desawan Dua, 41200 Klang, Selangor
                  </p>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                  <a href="https://www.google.com/maps/search/?api=1&query=Masjid+Jamek+Cina+Muslim+Klang" target="_blank" rel="noreferrer" className="px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">Maps</a>
                  <a href="https://www.waze.com/ul?q=Masjid+Jamek+Cina+Muslim+Klang&navigate=yes" target="_blank" rel="noreferrer" className="px-6 py-3 border border-stone-100 rounded-full text-[9px] font-bold uppercase tracking-widest">Waze</a>
              </div>
          </div>
      </section>

      {/* RSVP Section */}
      <section className="py-32 px-8 bg-white" id="rsvp">
        <div className="max-w-3xl mx-auto bg-[#faf9f6] rounded-[2.5rem] border border-stone-50 overflow-hidden">
            <div className="bg-white p-12 text-center border-b border-stone-50">
                <h3 className="text-2xl font-display tracking-widest uppercase">RSVP</h3>
                <p className="text-stone-400 text-[8px] uppercase font-black tracking-[0.3em] mt-2">Sahkan sebelum 25 Mei 2026</p>
            </div>
            <div className="p-10 md:p-16">
                {submitted ? (
                    <div className="text-center py-10">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-6 opacity-30" />
                        <h4 className="text-2xl font-display text-emerald-900">Terima Kasih</h4>
                        <p className="text-stone-400 text-sm mt-2">Maklum balas telah diterima.</p>
                        <button onClick={() => setSubmitted(false)} className="mt-10 text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Hantar Lagi?</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-stone-300">Nama Penuh</label>
                                <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border-b border-stone-100 py-3 focus:border-[#b08d79] outline-none text-sm bg-transparent" placeholder="Nama anda" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-stone-300">Kehadiran</label>
                                <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full border-b border-stone-100 py-3 outline-none text-sm bg-transparent">
                                    <option value="Hadir">Hadir</option>
                                    <option value="Tidak Hadir">Tidak Hadir</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-stone-300">Bilangan Pax</label>
                                <input type="number" min="1" max="10" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full border-b border-stone-100 py-3 outline-none text-sm bg-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-stone-300">Ucapan</label>
                                <input value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} className="w-full border-b border-stone-100 py-3 outline-none text-sm bg-transparent" placeholder="Tulis ucapan..." />
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-[#1a1a1a] text-white py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-lg disabled:opacity-50">
                            {loading ? 'Menghantar...' : 'Hantar RSVP'}
                        </button>
                    </form>
                )}
            </div>
        </div>
      </section>

      <footer className="py-24 text-center opacity-30">
          <p className="text-[8px] uppercase tracking-[0.8em] font-black">#AIZATXLAILA</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #faf9f6; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-display { font-family: 'Cinzel', serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
};

export default App;
