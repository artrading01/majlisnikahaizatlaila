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
  onAuthStateChanged
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
  UserCheck,
  Users
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ANDA ---
const firebaseConfig = {
  apiKey: "AIzaSyAvo3MD7-kS7DJsgp0kfQdmRQyglsIzc2o",
  authDomain: "majlisnikahaizatlaila.firebaseapp.com",
  projectId: "majlisnikahaizatlaila",
  storageBucket: "majlisnikahaizatlaila.firebasestorage.app",
  messagingSenderId: "301347520690",
  appId: "1:301347520690:web:06e7d407f0a7632a8849ab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Kita tetapkan path yang tetap untuk mengelakkan ralat data tidak jumpa
const COLLECTION_PATH = "rsvp_responses"; 

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);
  }, []);

  useEffect(() => {
    const targetDate = new Date('2025-07-12T11:00:00');
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
    const login = async () => {
        try {
            await signInAnonymously(auth);
        } catch (e) { console.error("Auth Error:", e); }
    };
    login();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Membaca data RSVP (Hanya jika admin login)
  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;
    const rsvpCol = collection(db, COLLECTION_PATH);
    const unsubRsvp = onSnapshot(rsvpCol, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Susun mengikut masa terbaru
      setRsvpData(data.sort((a, b) => b.timestamp - a.timestamp));
    }, (e) => {
        console.error("Firestore Read Error:", e);
        alert("Ralat membaca data. Sila semak Firestore Rules di Firebase Console.");
    });
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const openInvitation = () => {
    setIsOpen(true);
    setView('invitation');
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Autoplay blocked"));
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
        alert("PIN Salah");
        setAdminPin('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !user) {
        alert("Sila tunggu sebentar sehingga sistem bersedia.");
        return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTION_PATH), {
        ...form,
        pax: parseInt(form.pax),
        timestamp: Date.now()
      });
      setSubmitted(true);
    } catch (err) { 
        console.error("Submission Error:", err);
        alert("Gagal menghantar RSVP. Pastikan Firestore Rules anda adalah 'allow read, write: if true;'");
    } finally { 
        setLoading(false); 
    }
  };

  const totalGuests = rsvpData.filter(r => r.attendance === 'Hadir').reduce((s, c) => s + (Number(c.pax) || 0), 0);

  // Paparan Admin
  if (view === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] p-4 md:p-10 font-jakarta text-stone-800">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Data Real-time</p>
                </div>
                <button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">Tutup Panel</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-2">Total Rekod</p>
                    <p className="text-4xl font-black">{rsvpData.length}</p>
                </div>
                <div className="bg-[#1a1a1a] p-8 rounded-[2rem] shadow-2xl text-white col-span-1 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Total Pax Hadir</p>
                    <p className="text-4xl font-black text-[#d4bdad]">{totalGuests} Orang</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                            <tr>
                                <th className="px-8 py-6">Nama</th>
                                <th className="px-8 py-6 text-center">Status</th>
                                <th className="px-8 py-6 text-center">Pax</th>
                                <th className="px-8 py-6">Ucapan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 text-sm">
                            {rsvpData.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-8 py-6 font-bold">{r.name}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${r.attendance === 'Hadir' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{r.attendance}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">{r.pax}</td>
                                    <td className="px-8 py-6 text-stone-500 italic">{r.wish}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      </div>
    );
  }

  // Admin Login Overlay
  if (showAdminLogin) {
    return (
        <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <Lock className="w-8 h-8 text-[#d4bdad] mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-8 uppercase tracking-widest">PIN Pemilik</h2>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <input 
                        type="password" 
                        value={adminPin} 
                        onChange={(e) => setAdminPin(e.target.value)} 
                        className="w-full text-center text-3xl py-4 border-b-2 outline-none" 
                        placeholder="****" 
                        maxLength={4} 
                    />
                    <button className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest">Masuk</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="text-stone-400 text-[10px] uppercase font-bold tracking-widest block mx-auto">Batal</button>
                </form>
            </div>
        </div>
    );
  }

  // Landing Page
  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0d0d0d] flex items-center justify-center text-white text-center p-8">
        <div className="max-w-md">
            <Heart className="w-4 h-4 text-[#d4bdad] mx-auto mb-10" />
            <h1 className="text-4xl font-serif mb-12 italic">Undangan Eksklusif <br/> Aizat & Laila</h1>
            {guestName && <div className="mb-12"><p className="text-[10px] text-stone-500 uppercase tracking-widest mb-2">Istimewa Buat</p><h2 className="text-2xl font-serif italic">{guestName}</h2></div>}
            <button onClick={openInvitation} className="bg-white text-stone-950 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-[10px]">Buka Undangan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] pb-20">
      <audio ref={audioRef} loop preload="auto">
        <source src="Janji Suci - Yovie & Nuno (KARAOKE PIANO - FEMALE KEY).mp3" type="audio/mpeg" />
      </audio>

      <div className="fixed bottom-8 right-8 z-[100]">
        <button onClick={toggleMusic} className="p-4 bg-white rounded-full shadow-xl border">
            {isPlaying ? <Music className="w-5 h-5 animate-pulse text-[#b08d79]" /> : <VolumeX className="w-5 h-5 text-stone-400" />}
        </button>
      </div>

      <section className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <Sparkles className="w-5 h-5 text-[#d4bdad] mb-10 opacity-50" />
        <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Aizat & Laila</h1>
        <p className="text-[12px] font-bold uppercase tracking-[0.4em] mt-8">Sabtu | 12.07.2025</p>
        <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="mt-20"><ChevronDown className="w-5 h-5 text-stone-200 animate-bounce" /></button>
      </section>

      <section className="py-32 px-8 max-w-4xl mx-auto text-center border-t border-stone-100">
        <Quote className="w-6 h-6 text-[#d4bdad] mx-auto mb-8 opacity-30" />
        <p className="text-xl md:text-2xl font-serif italic text-stone-600 leading-relaxed">
            "Ya Allah, berkatilah majlis ini dan satukanlah hati kedua mempelai ini dengan penuh kasih sayang dan ketenangan."
        </p>
      </section>

      <section className="py-32 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-12 rounded-[2rem] border text-center space-y-6">
                <Calendar className="w-5 h-5 text-[#b08d79] mx-auto" />
                <h3 className="uppercase tracking-widest font-bold text-sm">Tarikh Majlis</h3>
                <p className="text-2xl font-serif italic">12 Julai 2025</p>
                <p className="text-lg">11:00 Pagi - 4:00 Petang</p>
            </div>
            <div className="bg-white p-12 rounded-[2rem] border text-center space-y-6">
                <MapPin className="w-5 h-5 text-[#b08d79] mx-auto" />
                <h3 className="uppercase tracking-widest font-bold text-sm">Lokasi</h3>
                <p className="text-xl font-serif italic">Dewan Perdana, Kuala Lumpur</p>
                <div className="flex gap-4 justify-center pt-4">
                    <a href="https://maps.google.com" className="text-[10px] font-bold uppercase border-b border-stone-800">Google Maps</a>
                    <a href="https://waze.com" className="text-[10px] font-bold uppercase border-b border-stone-800">Waze</a>
                </div>
            </div>
        </div>
      </section>

      <section className="py-32 px-8 bg-white" id="rsvp">
        <div className="max-w-2xl mx-auto border rounded-[2.5rem] p-8 md:p-16">
            <h2 className="text-2xl font-serif italic text-center mb-12">Sahkan Kehadiran (RSVP)</h2>
            {submitted ? (
                <div className="text-center py-10">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-6" />
                    <p className="text-lg font-serif italic">Terima kasih atas maklum balas anda.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border-b py-3 outline-none focus:border-[#b08d79]" placeholder="Nama Anda" />
                    <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full border-b py-3 outline-none">
                        <option value="Hadir">Akan Hadir</option>
                        <option value="Tidak Hadir">Tidak Hadir</option>
                    </select>
                    <input type="number" min="1" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full border-b py-3 outline-none" placeholder="Bilangan Pax" />
                    <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} className="w-full border-b py-3 outline-none" placeholder="Ucapan (Opsional)"></textarea>
                    <button disabled={loading} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                        {loading ? 'Menghantar...' : 'Hantar RSVP'}
                    </button>
                </form>
            )}
        </div>
      </section>

      <footer className="py-20 text-center">
         <button onClick={() => setShowAdminLogin(true)} className="text-[8px] uppercase tracking-widest text-stone-300 hover:text-stone-800 transition-colors font-bold">Panel Pemilik (Admin)</button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
};

export default App;
