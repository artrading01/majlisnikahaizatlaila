Ni code app.js:

getFirestore, 
collection, 
addDoc, 
  onSnapshot,
  query,
  limit
  onSnapshot
} from 'firebase/firestore';
import { 
getAuth, 
@@ -34,23 +32,23 @@ const getFirebaseConfig = () => {
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
  appId: "1:301347520690:web:06e7d407f0a7632a8849ab",
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

const App = () => {
@@ -67,20 +65,19 @@ const App = () => {
const [adminPin, setAdminPin] = useState('');
const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

const audioRef = useRef(null);
const CORRECT_PIN = "1234"; 
const [guestName, setGuestName] = useState('');

  // 1. Ambil nama dari URL
  // Ambil nama dari URL (?to=Nama)
useEffect(() => {
const params = new URLSearchParams(window.location.search);
const to = params.get('to');
if (to) setGuestName(to);
}, []);

  // 2. Countdown Logic
  // Countdown Logic
useEffect(() => {
const targetDate = new Date('2026-06-06T09:00:00');
const timer = setInterval(() => {
@@ -100,7 +97,7 @@ const App = () => {
return () => clearInterval(timer);
}, []);

  // 3. Firebase Auth (Wajib untuk Firestore)
  // Firebase Auth
useEffect(() => {
const initAuth = async () => {
try {
@@ -114,30 +111,22 @@ const App = () => {
}
};
initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    const unsubscribe = onAuthStateChanged(auth, setUser);
return () => unsubscribe();
}, []);

  // 4. Fetch RSVP Data (Real-time)
  // Fetch RSVP Data (Admin Only)
useEffect(() => {
    // Hanya fetch jika user login dan dalam mode admin
if (!user || !isAdminAuthenticated) return;

    // RULE: Gunakan path yang konsisten
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
      (e) => console.error("Firestore Read Error:", e)
);

return () => unsubRsvp();
@@ -176,14 +165,9 @@ const App = () => {

const handleSubmit = async (e) => {
e.preventDefault();
    if (!form.name) return;
    if (!user) {
        setErrorMessage("Sistem sedang bersedia. Sila tunggu sebentar.");
        return;
    }
    if (!form.name || !user) return;

setLoading(true);
    setErrorMessage('');
try {
const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
await addDoc(rsvpCol, {
@@ -195,7 +179,6 @@ const App = () => {
setSubmitted(true);
} catch (err) { 
console.error("Submission Error:", err);
        setErrorMessage("Gagal menghantar RSVP. Pastikan Firestore Cloud aktif.");
} finally { 
setLoading(false); 
}
@@ -212,7 +195,6 @@ const App = () => {
<h1 className="text-2xl font-black uppercase tracking-tight">Senarai Tetamu</h1>
<button onClick={() => setView('invitation')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Kembali</button>
</div>
            {errorMessage && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold mb-4">{errorMessage}</div>}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-white p-8 rounded-[2rem] border shadow-sm">
<p className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest uppercase">Jumlah Rekod</p>
@@ -231,7 +213,7 @@ const App = () => {
</thead>
<tbody className="divide-y divide-stone-100">
{rsvpData.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-stone-400 italic">Tiada data RSVP ditemui dalam pangkalan data.</td></tr>
                                <tr><td colSpan="4" className="p-10 text-center text-stone-400 italic">Tiada data RSVP ditemui.</td></tr>
) : (
rsvpData.map(r => (
<tr key={r.id} className="hover:bg-stone-50 transition-colors">
@@ -295,7 +277,7 @@ const App = () => {
);
}

  // MAIN VIEW
  // MAIN VIEW: Invitation Page
return (
<div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] selection:bg-[#d4bdad] animate-fade-in">
<audio ref={audioRef} loop preload="auto">
@@ -308,61 +290,93 @@ const App = () => {
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
            <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Aizat</h1>
            <div className="flex items-center justify-center gap-6 my-4 opacity-30">
                <div className="h-px w-10 bg-stone-800"></div>
                <span className="serif italic text-xl">&</span>
                <div className="h-px w-10 bg-stone-800"></div>
            <div className="relative">
                <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Aizat</h1>
                <div className="flex items-center justify-center gap-6 my-4 opacity-30">
                    <div className="h-px w-10 bg-stone-800"></div>
                    <span className="serif italic text-xl">&</span>
                    <div className="h-px w-10 bg-stone-800"></div>
                </div>
                <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Laila</h1>
</div>
            <h1 className="text-7xl md:text-9xl font-script text-[#b08d79] mb-4">Laila</h1>
<p className="text-[12px] font-bold uppercase tracking-[0.4em] mt-12 text-stone-800">Sabtu | 06.06.2026</p>
<button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="mt-24 text-stone-300 hover:text-stone-800 transition-colors">
<ChevronDown className="w-6 h-6 animate-bounce" />
</button>
</div>
</section>

      {/* Countdown */}
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
                {Object.entries(timeLeft).map(([label, value], i) => (
                {[
                  { label: 'Hari', value: timeLeft.hari },
                  { label: 'Jam', value: timeLeft.jam },
                  { label: 'Minit', value: timeLeft.minit },
                  { label: 'Saat', value: timeLeft.saat }
                ].map((t, i) => (
<div key={i} className="flex flex-col items-center">
                        <span className="text-4xl md:text-6xl font-light text-[#b08d79] mb-2">{String(value).padStart(2, '0')}</span>
                        <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{label}</span>
                        <span className="text-4xl md:text-6xl font-light text-[#b08d79] mb-2">{String(t.value).padStart(2, '0')}</span>
                        <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{t.label}</span>
</div>
))}
</div>
</div>
</section>

      {/* Details */}
      {/* Details Section */}
<section className="py-40 px-8">
<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <Calendar className="w-6 h-6 text-[#b08d79]" />
            {/* Event Time */}
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8 hover:shadow-xl transition-all group">
                <Calendar className="w-6 h-6 text-[#b08d79] group-hover:scale-110 transition-transform" />
<h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Aturcara Majlis</h3>
                <p className="text-2xl font-serif italic">Sabtu, 6 Jun 2026</p>
                <p className="text-stone-500 font-medium">9:00 Pagi - Selesai</p>
                <div className="space-y-2">
                    <p className="text-2xl font-serif italic">Sabtu, 6 Jun 2026</p>
                    <p className="text-stone-500 font-medium">9:00 Pagi - Selesai</p>
                </div>
</div>
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8">
                <MapPin className="w-6 h-6 text-[#b08d79]" />

            {/* Event Location */}
            <div className="bg-white p-16 rounded-[3rem] border border-stone-50 shadow-sm flex flex-col items-center text-center space-y-8 hover:shadow-xl transition-all group">
                <MapPin className="w-6 h-6 text-[#b08d79] group-hover:scale-110 transition-transform" />
<h3 className="uppercase tracking-[0.3em] font-bold text-[10px] text-stone-400">Lokasi Majlis</h3>
                <p className="text-xl font-serif italic">Masjid Jamek Cina Muslim Klang</p>
                <a href="https://www.google.com/maps/search/?api=1&query=Masjid+Jamek+Cina+Muslim+Klang" target="_blank" rel="noreferrer" className="px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="w-3 h-3" /> Maps
                </a>
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

      {/* RSVP */}
      {/* RSVP Form */}
<section className="py-40 px-8 bg-white" id="rsvp">
<div className="max-w-2xl mx-auto bg-[#faf9f6] rounded-[3rem] p-10 md:p-20 shadow-inner border border-stone-50">
<div className="text-center mb-16">
@@ -375,32 +389,36 @@ const App = () => {
<div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
<CheckCircle2 className="w-8 h-8" />
</div>
                    <p className="text-xl font-serif italic text-emerald-900">Terima Kasih!</p>
                    <p className="text-xl font-serif italic text-emerald-900 mb-2">Terima Kasih!</p>
                    <p className="text-stone-500 text-sm">Maklum balas anda telah kami terima.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-8 text-[9px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900">Hantar RSVP Lain</button>
</div>
) : (
<form onSubmit={handleSubmit} className="space-y-10">
                    {errorMessage && <p className="text-red-500 text-[10px] font-bold uppercase">{errorMessage}</p>}
<div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Nama Penuh</label>
                        <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm" />
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Nama Penuh</label>
                        <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm" placeholder="Contoh: Ahmad Fauzi" />
</div>
                    <div className="grid grid-cols-2 gap-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
<div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Kehadiran</label>
                            <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm cursor-pointer">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Kehadiran</label>
                            <select value={form.attendance} onChange={(e)=>setForm({...form, attendance: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm appearance-none cursor-pointer">
<option value="Hadir">Akan Hadir</option>
<option value="Tidak Hadir">Tidak Hadir</option>
</select>
</div>
<div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Bilangan Pax</label>
                            <input type="number" min="1" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm" />
                            <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Bilangan Pax</label>
                            <input type="number" min="1" value={form.pax} onChange={(e)=>setForm({...form, pax: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-4 outline-none text-sm" placeholder="1" />
</div>
</div>

<div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Ucapan & Doa</label>
                        <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="1" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-none"></textarea>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-400 px-1">Ucapan & Doa</label>
                        <textarea value={form.wish} onChange={(e)=>setForm({...form, wish: e.target.value})} rows="1" className="w-full bg-transparent border-b border-stone-200 py-4 outline-none focus:border-[#b08d79] transition-colors text-sm resize-none" placeholder="Tuliskan ucapan anda..."></textarea>
</div>

<button disabled={loading} className="w-full bg-stone-950 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
{loading ? 'Menghantar...' : 'Hantar RSVP'}
</button>
@@ -409,6 +427,7 @@ const App = () => {
</div>
</section>

      {/* Footer & Admin Toggle */}
<footer className="py-32 text-center">
<p className="text-[9px] uppercase tracking-[1em] font-black text-stone-300 mb-10">#AIZATXLAILA</p>
<button onClick={() => setShowAdminLogin(true)} className="text-[8px] uppercase tracking-widest text-stone-200 hover:text-stone-800 transition-colors font-bold flex items-center gap-2 mx-auto">
@@ -418,10 +437,16 @@ const App = () => {

<style>{`
       @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
        
       body { font-family: 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; }
       .font-script { font-family: 'Alex Brush', cursive; }
       .font-serif { font-family: 'Playfair Display', serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
       .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
       ::-webkit-scrollbar { display: none; }
     `}</style>
