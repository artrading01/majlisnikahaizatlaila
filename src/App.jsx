import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Heart, Calendar, MapPin, Lock, Quote, CheckCircle2, VolumeX, Share2, ChevronDown, Sparkles, Map as MapIcon, MailOpen, Music, Copy, Send, UserCheck } from 'lucide-react';

// --- MASUKKAN CONFIG FIREBASE ANDA DI SINI ---
const firebaseConfig = {
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
const appId = 'majlis-aizat-laila';

const App = () => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('landing');
  const [rsvpData, setRsvpData] = useState([]);
  const [form, setForm] = useState({ name: '', attendance: 'Hadir', pax: '1', wish: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareGuestName, setShareGuestName] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, minit: 0, saat: 0 });
  const [guestName, setGuestName] = useState('');

  const audioRef = useRef(null);
  const CORRECT_PIN = "0709";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) setGuestName(to);

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

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth);
      setUser(u);
    });

    return () => {
      clearInterval(timer);
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user || !isAdminAuthenticated) return;
    const unsubRsvp = onSnapshot(collection(db, 'rsvp'), (s) => {
      setRsvpData(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubRsvp();
  }, [user, isAdminAuthenticated]);

  const openInvitation = () => {
    setIsOpen(true);
    if (audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === CORRECT_PIN) {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
    } else {
      setAdminPin('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'rsvp'), { ...form, timestamp: Date.now() });
      setSubmitted(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}?to=${encodeURIComponent(shareGuestName)}`;
    const msg = `Assalamualaikum, jemput ke majlis kami: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  if (showAdminLogin) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Lock className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-6">Panel Pemilik</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full text-center text-3xl border-b py-2 outline-none" placeholder="****" maxLength={4} />
            <button className="w-full bg-black text-white py-4 rounded-xl">MASUK</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="text-gray-400">Batal</button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdminAuthenticated && !showAdminLogin) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <button onClick={() => setIsAdminAuthenticated(false)} className="bg-black text-white px-4 py-2 rounded">Keluar</button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
          <h2 className="font-bold">Share Link Tetamu</h2>
          <div className="flex gap-2">
            <input placeholder="Nama Tetamu" value={shareGuestName} onChange={(e) => setShareGuestName(e.target.value)} className="flex-1 border p-3 rounded-xl" />
            <button onClick={shareWhatsApp} className="bg-green-600 text-white px-6 rounded-xl">WhatsApp</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs">
              <tr><th className="p-4">Nama</th><th className="p-4">Hadir?</th><th className="p-4">Pax</th></tr>
            </thead>
            <tbody>
              {rsvpData.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-4 font-bold">{r.name}</td>
                  <td className="p-4">{r.attendance}</td>
                  <td className="p-4">{r.pax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="fixed inset-0 bg-stone-900 text-white flex flex-col items-center justify-center text-center p-6">
        <Heart className="text-stone-500 mb-8" />
        <h1 className="text-4xl font-serif mb-4">Aizat & Laila</h1>
        {guestName && <p className="mb-8 text-stone-400 italic">Kepada: {guestName}</p>}
        <button onClick={openInvitation} className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-widest uppercase text-xs">Buka Undangan</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-20">
      <audio ref={audioRef} loop><source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" /></audio>
      
      <section className="h-screen flex flex-col items-center justify-center text-center p-6">
        <Sparkles className="text-stone-300 mb-6" />
        <h1 className="text-7xl font-serif text-stone-800 mb-4">Aizat & Laila</h1>
        <p className="tracking-[0.5em] text-stone-400 text-xs uppercase">06 . 06 . 2026</p>
        <ChevronDown className="mt-20 animate-bounce text-stone-200" />
      </section>

      <section className="py-20 bg-white text-center border-y">
        <div className="flex justify-center gap-8">
          {Object.entries(timeLeft).map(([k, v]) => (
            <div key={k}><p className="text-4xl text-stone-800">{v}</p><p className="text-[10px] uppercase text-stone-400">{k}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 max-w-xl mx-auto space-y-12">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center border">
          <Calendar className="mx-auto mb-4 text-stone-300" />
          <h2 className="text-xl font-bold mb-2">SABTU, 06 JUN 2026</h2>
          <p className="text-stone-500 italic">9:00 Pagi - 11:00 Pagi</p>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center border">
          <MapPin className="mx-auto mb-4 text-stone-300" />
          <h2 className="text-xl font-bold mb-2">LOKASI</h2>
          <p className="text-stone-500 mb-6 italic">Masjid Jamek Cina Muslim Klang, Selangor</p>
          <a href="https://maps.google.com" target="_blank" className="bg-stone-900 text-white px-8 py-3 rounded-full text-xs uppercase font-bold">Google Maps</a>
        </div>
      </section>

      <section className="py-20 px-6 max-w-xl mx-auto">
        <div className="bg-stone-100 p-10 rounded-[3rem]">
          <h2 className="text-center font-bold mb-10 tracking-widest">RSVP KEHADIRAN</h2>
          {submitted ? (
            <div className="text-center py-10"><CheckCircle2 className="mx-auto mb-4 text-green-500" /> <p>Terima Kasih!</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input required placeholder="Nama" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-transparent border-b p-3 outline-none" />
              <select value={form.attendance} onChange={e => setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b p-3 outline-none">
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </select>
              <input type="number" placeholder="Bilangan Pax" value={form.pax} onChange={e => setForm({...form, pax: e.target.value})} className="w-full bg-transparent border-b p-3 outline-none" />
              <button className="w-full bg-black text-white py-5 rounded-2xl text-xs uppercase font-bold tracking-widest">Hantar</button>
            </form>
          )}
        </div>
      </section>

      <footer className="text-center py-20 opacity-20">
        <button onClick={() => setShowAdminLogin(true)}><Lock className="w-4 h-4" /></button>
      </footer>
    </div>
  );
};

export default App;
