import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
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
 apiKey: "AIzaSyAvo3MD7-kS7DJsgp0kfQdmRQyglsIzc2o",
  authDomain: "majlisnikahaizatlaila.firebaseapp.com",
  projectId: "majlisnikahaizatlaila",
  storageBucket: "majlisnikahaizatlaila.firebasestorage.app",
  messagingSenderId: "301347520690",
  appId: "1:301347520690:web:06e7d407f0a7632a8849ab",

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); // 'landing', 'invitation', 'admin'
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpData, setRsvpData] = useState([]);
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({
    hari: 0,
    jam: 0,
    minit: 0,
    saat: 0
  });

  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const audioRef = useRef(null);
  const CORRECT_PIN = "1234"; // PIN untuk akses senarai RSVP

  const [guestName, setGuestName] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  // Logik Pemasa (Timer) - Tarikh Majlis: 06 Jun 2026
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
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Hanya tarik data RSVP jika admin dah login
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;
    const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', 'rsvp');
    const unsubRsvp = onSnapshot(rsvpCol, (s) => {
      setRsvpData(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error(e));
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const openInvitation = () => {
    setIsOpen(true);
    setView('invitation');
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Autoplay dihalang"));
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Ralat memainkan audio"));
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const totalGuests = rsvpData.filter(r => r.attendance === 'Hadir').reduce((s, c) => s + (Number(c.pax) || 0), 0);

  // --- HALAMAN LOGIN ADMIN (MODAL) ---
  if (showAdminLogin) {
    return (
        <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6 font-jakarta">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-stone-100">
                <Lock className="w-8 h-8 text-[#d4bdad] mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-2">Akses Pemilik</h2>
                <p className="text-xs text-stone-400 mb-8 uppercase tracking-widest">Sila masukkan PIN untuk melihat RSVP</p>
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
                    <button className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Sahka PIN</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="text-stone-400 text-[10px] uppercase font-bold tracking-widest pt-4 block mx-auto">Kembali Ke Kad</button>
                </form>
            </div>
        </div>
    );
  }

  // --- HALAMAN ADMIN (SENARAI RSVP) ---
  if (view === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] p-4 md:p-10 font-jakarta text-stone-800 animate-fade-in">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Data RSVP Real-time</p>
                </div>
                <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">Kembali Ke Kad</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-4 h-4 text-stone-300" />
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Total Rekod</p>
                    </div>
                    <p className="text-4xl font-black">{rsvpData.length}</p>
                </div>
                <div className="bg-[#1a1a1a] p-8 rounded-[2rem] shadow-2xl text-white col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <UserCheck className="w-4 h-4 text-[#d4bdad]" />
                        <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Total Tetamu Hadir (Pax)</p>
                    </div>
                    <p className="text-4xl font-black text-[#d4bdad]">{totalGuests} <span className="text-sm font-normal text-stone-500 ml-2">Orang</span></p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-stone-50 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                            <tr>
                                <th className="px-8 py-6">Nama Tetamu</th>
                                <th className="px-8 py-6 text-center">Status</th>
                                <th className="px-8 py-6 text-center">Pax</th>
                                <th className="px-8 py-6">Ucapan & Doa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {rsvpData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-stone-300 italic">Tiada data RSVP lagi...</td>
                                </tr>
                            ) : (
                                rsvpData.map((r) => (
                                    <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="px-8 py-6 font-bold text-stone-800">{r.name}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.attendance === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {r.attendance}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center font-medium">{r.pax}</td>
                                        <td className="px-8 py-6 text-stone-500 italic text-sm leading-relaxed max-w-xs truncate md:whitespace-normal">
                                            {r.wish || <span className="opacity-30">Tiada ucapan</span>}
                                        </td>
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

  // --- OVERLAY LANDING PAGE ---
  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0d0d0d] flex items-center justify-center overflow-hidden font-jakarta text-white">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#b08d79] rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#403028] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-4xl px-8 text-center flex flex-col items-center">
            <div className="mb-10 animate-reveal flex flex-col items-center">
               <div className="flex items-center gap-4 mb-12 opacity-60">
                  <div className="h-px w-8 bg-white/30"></div>
                  <Heart className="w-4 h-4 text-[#d4bdad] fill-[#d4bdad]/20" />
                  <div className="h-px w-8 bg-white/30"></div>
               </div>
               
               <div className="mb-10 space-y-6 text-center">
                  <h1 className="text-3xl md:text-5xl font-serif tracking-tight font-light leading-snug animate-fade-in">
                    Undangan Eksklusif <br/> <span className="text-[#d4bdad] italic serif font-light">Majlis Akad Nikah</span>
                  </h1>
               </div>

               {guestName && (
                 <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Istimewa Buat</p>
                    <h2 className="text-3xl md:text-5xl font-serif tracking-wide font-light italic">{guestName}</h2>
                 </div>
               )}
            </div>

            <button 
              onClick={openInvitation}
              className="group relative flex items-center gap-6 px-12 py-6 bg-white text-stone-950 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <MailOpen className="w-4 h-4" />
              <span>Buka Undangan</span>
            </button>

            {/* Hidden Admin Entry */}
            <button 
                onClick={() => setShowAdminLogin(true)}
                className="mt-12 text-stone-600 hover:text-stone-400 transition-colors"
                title="Admin Login"
            >
                <Lock className="w-4 h-4 opacity-20" />
            </button>
        </div>
        <style>{`
          @keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .animate-reveal { animation: reveal 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fadeIn 1.2s ease-out forwards; }
        `}</style>
      </div>
    );
  }

  // --- KAD JEMPUTAN UTAMA ---
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] font-jakarta selection:bg-[#d4bdad] overflow-x-hidden scroll-smooth pb-20 animate-fade-in">
      <audio ref={audioRef} loop preload="auto">
        <source src="http://googleusercontent.com/file_content/1" type="audio/mpeg" />
      </audio>

      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 items-end">
        <button 
          onClick={toggleMusic} 
          className={`p-5 rounded-full shadow-2xl border transition-all duration-700 ${isPlaying ? 'bg-white text-[#b08d79] border-stone-100' : 'bg-[#1a1a1a] text-white border-transparent'}`}
        >
            {isPlaying ? <Music className="w-5 h-5 animate-spin-slow" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero */}
      <section className="relative min-h-screen w-full flex items-center justify-center bg-[#fdfcfb] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
            <div className="flex flex-col items-center w-full">
                <div className="relative group max-w-sm md:max-w-lg w-full flex flex-col items-center">
                    <div className="absolute -inset-10 border-t border-x border-dashed border-stone-100 rounded-t-[18rem] opacity-60"></div>
                    <div className="relative z-10 w-full bg-white border border-stone-50 px-6 py-20 rounded-t-[18rem] rounded-b-[2rem] shadow-xl text-center flex flex-col items-center">
                        <Sparkles className="w-5 h-5 text-[#d4bdad] opacity-50 mb-10" />
                        <div className="flex flex-col items-center w-full space-y-4">
                            <h1 className="text-6xl md:text-8xl font-script text-[#b08d79]">Aizat</h1>
                            <div className="flex items-center justify-center gap-4 opacity-40 w-full">
                                <div className="h-px w-8 bg-stone-300"></div>
                                <span className="text-xl font-serif italic text-stone-500">&</span>
                                <div className="h-px w-8 bg-stone-300"></div>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-script text-[#b08d79]">Laila</h1>
                        </div>
                        <div className="mt-12 pt-8 border-t border-stone-50 flex flex-col items-center w-full">
                           <p className="text-[12px] font-display uppercase tracking-[0.4em] text-stone-800 font-bold mb-2">SABTU | 06.06.2026</p>
                           <p className="text-[9px] uppercase tracking-[0.25em] text-stone-400 font-black">Klang, Selangor</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="mt-20 flex flex-col items-center gap-4 group">
                    <span className="text-[8px] uppercase tracking-[0.4em] text-stone-300">Sila Tatal</span>
                    <ChevronDown className="w-4 h-4 text-stone-200 group-hover:text-stone-800 transition-colors" />
                </button>
            </div>
        </div>
      </section>

      {/* Bahagian Kata-Kata Hikmah */}
      <section className="py-24 px-8 text-center max-w-4xl mx-auto">
        <Quote className="w-8 h-8 text-[#d4bdad] mx-auto mb-8 opacity-30" />
        <p className="text-xl md:text-2xl font-serif italic text-stone-600 leading-relaxed">
            "Ya Allah, pancarkanlah cahaya kasih-Mu ke dalam hati mereka, jadikanlah ikatan ini jambatan ke syurga, dan hiasilah rumah tangga mereka dengan bauan syurga yang penuh ketenangan dan kesetiaan."
        </p>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Iringan Doa Restu</p>
      </section>

      {/* Countdown */}
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

      {/* Butiran Acara */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-12 rounded-[2.5rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <div className="w-16 h-16 bg-[#faf9f6] rounded-full flex items-center justify-center text-[#b08d79]">
                    <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-display uppercase tracking-widest">Akad Nikah</h3>
                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Tarikh & Masa</p>
                </div>
                <div className="space-y-4 pt-4">
                    <div className="flex flex-col">
                        <span className="text-2xl font-serif">Sabtu</span>
                        <span className="text-sm text-stone-400">06 Jun 2026</span>
                    </div>
                    <div className="h-8 w-px bg-stone-100 mx-auto"></div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-serif">9:00 Pagi</span>
                        <span className="text-sm text-stone-400">Hingga Selesai</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-12 rounded-[2.5rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <div className="w-16 h-16 bg-[#faf9f6] rounded-full flex items-center justify-center text-[#b08d79]">
                    <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-display uppercase tracking-widest">Lokasi Majlis</h3>
                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Tempat Berlangsung</p>
                </div>
                <div className="space-y-2 pt-4">
                    <p className="font-serif text-lg leading-relaxed">Masjid Jamek Cina Muslim Klang</p>
                    <p className="text-xs text-stone-400 leading-relaxed max-w-[200px] mx-auto">Lot 157828, Jalan Langat, Taman Desawan Dua, 41200 Klang, Selangor</p>
                </div>
                <div className="flex gap-4 pt-4">
                    <a href="https://www.google.com/maps/search/?api=1&query=Masjid+Jamek+Cina+Muslim+Klang" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
                        <MapIcon className="w-3 h-3" />
                        Google Maps
                    </a>
                    <a href="https://www.waze.com/ul?q=Masjid+Jamek+Cina+Muslim+Klang&navigate=yes" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 border border-stone-100 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all">
                        <Navigation className="w-3 h-3" />
                        Waze
                    </a>
                </div>
            </div>
        </div>
      </section>

      {/* Doa Mempelai */}
      <section className="py-32 px-8 bg-[#faf9f6]">
        <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-4">
                <Sparkles className="w-6 h-6 text-[#d4bdad] mx-auto opacity-40" />
                <h2 className="text-3xl font-serif italic text-stone-800 tracking-wide">Tulus Doa Kami</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center">
                    <Heart className="w-4 h-4 text-[#d4bdad] mx-auto mb-4" />
                    <p className="text-sm font-serif italic text-stone-600">"Semoga Allah memberkati kamu dan melimpahkan keberkatan ke atas kamu."</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center scale-110 shadow-xl z-10">
                    <p className="text-sm font-serif italic text-stone-800 font-medium">"Dan semoga Allah menghimpunkan kamu berdua dalam kebaikan selamanya."</p>
                    <div className="h-px w-8 bg-[#d4bdad] mx-auto mt-6"></div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center">
                    <Sparkles className="w-4 h-4 text-[#d4bdad] mx-auto mb-4" />
                    <p className="text-sm font-serif italic text-stone-600">"Sakinah, Mawaddah, dan Warahmah sentiasa bersama di setiap langkah."</p>
                </div>
            </div>
        </div>
      </section>

      {/* RSVP Form */}
      <section className="py-32 px-8 bg-white" id="rsvp-section">
        <div className="max-w-3xl mx-auto bg-[#faf9f6] rounded-[2.5rem] shadow-sm overflow-hidden border border-stone-50">
            <div className="bg-white p-12 text-center border-b border-stone-50">
                <h3 className="text-2xl font-display mb-3 text-stone-800 tracking-widest uppercase">Kehadiran</h3>
                <p className="text-stone-400 text-[8px] uppercase font-black tracking-[0.3em]">Sahkan kehadiran sebelum 25 Mei 2026</p>
            </div>
            <div className="p-10 md:p-16">
                {submitted ? (
                    <div className="text-center py-10">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-6 opacity-30" />
                        <h4 className="text-2xl font-display mb-2 text-emerald-900">Terima Kasih</h4>
                        <p className="text-stone-400 text-sm mb-10">Maklum balas anda telah kami terima dengan rasa syukur.</p>
                        <button onClick={() => setSubmitted(false)} className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 hover:text-stone-900 transition-all">Hantar Sekali Lagi?</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 ml-1">Nama Penuh</label>
                                <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border-b border-stone-100 py-3 focus:border-[#b08d79] transition-all outline-none text-sm bg-transparent font-medium" placeholder="Nama anda" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 ml-1">Kehadiran</label>
                                <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full border-b border-stone-100 py-3 focus:border-[#b08d79] transition-all outline-none text-sm bg-transparent cursor-pointer font-medium">
                                    <option value="Hadir">Akan Hadir</option>
                                    <option value="Tidak Hadir">Tidak Hadir</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 ml-1">Bilangan Pax</label>
                                <input type="number" min="1" max="10" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full border-b border-stone-100 py-3 focus:border-[#b08d79] transition-all outline-none text-sm bg-transparent font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 ml-1">Ucapan & Doa</label>
                                <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="1" className="w-full border-b border-stone-100 py-3 focus:border-[#b08d79] transition-all outline-none text-sm resize-none bg-transparent font-medium" placeholder="Tulis sesuatu buat kami..."></textarea>
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-[#1a1a1a] text-white py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black transition-all shadow-lg disabled:opacity-50">
                            {loading ? 'Menghantar...' : 'Hantar RSVP'}
                        </button>
                    </form>
                )}
            </div>
        </div>
      </section>

      <footer className="py-24 text-center">
         <p className="text-[8px] uppercase tracking-[0.8em] font-black text-stone-300 mb-8">#AIZATXLAILA</p>
         <button 
            onClick={() => setShowAdminLogin(true)} 
            className="text-[8px] uppercase tracking-widest text-stone-200 hover:text-stone-400 transition-colors font-bold"
         >
            Panel Pemilik
         </button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #faf9f6; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-display { font-family: 'Cinzel', serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d4bdad; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
