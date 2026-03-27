import { useState, useEffect, useLayoutEffect, useRef } from "react";

/** Returns whether the viewport matches a CSS media query (updates on resize). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useLayoutEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface GeoLocation { lat: number; lng: number; address: string; }

interface Enrollment {
  id: string; name: string; email: string; phone: string; age: string;
  licenseType: string; pickupAddress: string; preferredTime: string;
  experience: string; status: "pending" | "confirmed" | "completed" | "cancelled";
  submittedAt: string; location?: GeoLocation;
  rating?: number; feedback?: string;
}

interface Driver {
  id: string; name: string; phone: string; licenseType: string;
  available: boolean; slot: string; rating: number;
  location: { lat: number; lng: number }; status: "idle" | "on-ride" | "offline";
}

interface Ride {
  id: string; enrollmentId: string; driverId: string; studentName: string;
  driverName: string; status: "started" | "ongoing" | "reached" | "completed";
  startTime: string; eta: number; route: Array<{ lat: number; lng: number }>;
  fare: number; rating?: number; feedback?: string;
}

interface ChatMessage {
  id: string; rideId: string; sender: "user" | "driver";
  text: string; time: string;
}

interface AdminNotification {
  id: string; type: "new_enrollment" | "ride_started" | "ride_completed";
  message: string; time: string; read: boolean; data?: any;
}

type View = "home" | "enroll" | "rides" | "chat" | "track" | "admin";

// ── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_ENROLLMENTS: Enrollment[] = [
  { id: "DS-001", name: "Priya Sharma", email: "priya@email.com", phone: "98765 43210", age: "22", licenseType: "Car (4W)", pickupAddress: "12, Sector 15, Faridabad", preferredTime: "Morning (8–11 AM)", experience: "beginner", status: "confirmed", submittedAt: "2026-03-20T09:30:00", location: { lat: 28.4089, lng: 77.3178, address: "Sector 15, Faridabad" } },
  { id: "DS-002", name: "Rahul Verma", email: "rahul@email.com", phone: "91234 56789", age: "28", licenseType: "Bike (2W)", pickupAddress: "47, NIT Colony, Faridabad", preferredTime: "Evening (4–7 PM)", experience: "some", status: "pending", submittedAt: "2026-03-22T14:00:00", location: { lat: 28.3909, lng: 77.3140, address: "NIT Colony, Faridabad" } },
  { id: "DS-003", name: "Anita Rao", email: "anita@email.com", phone: "99001 12233", age: "35", licenseType: "Car (4W)", pickupAddress: "8, Green Park, Faridabad", preferredTime: "Afternoon (12–3 PM)", experience: "beginner", status: "completed", submittedAt: "2026-03-10T11:00:00", location: { lat: 28.4200, lng: 77.3050, address: "Green Park, Faridabad" }, rating: 5, feedback: "Excellent instructor, very patient!" },
];

const SEED_DRIVERS: Driver[] = [
  { id: "DRV-001", name: "Vikram Singh", phone: "93456 78901", licenseType: "Car (4W)", available: true, slot: "Morning (8–11 AM)", rating: 4.8, location: { lat: 28.4050, lng: 77.3100 }, status: "idle" },
  { id: "DRV-002", name: "Suresh Kumar", phone: "94567 89012", licenseType: "Bike (2W)", available: true, slot: "Evening (4–7 PM)", rating: 4.6, location: { lat: 28.3980, lng: 77.3200 }, status: "on-ride" },
  { id: "DRV-003", name: "Meera Patel", phone: "95678 90123", licenseType: "Car (4W)", available: false, slot: "Afternoon (12–3 PM)", rating: 4.9, location: { lat: 28.4150, lng: 77.3090 }, status: "idle" },
  { id: "DRV-004", name: "Arjun Nair", phone: "96789 01234", licenseType: "Commercial Vehicle", available: true, slot: "Morning (8–11 AM)", rating: 4.7, location: { lat: 28.4000, lng: 77.3250 }, status: "idle" },
];

const SEED_RIDES: Ride[] = [
  { id: "RID-001", enrollmentId: "DS-002", driverId: "DRV-002", studentName: "Rahul Verma", driverName: "Suresh Kumar", status: "ongoing", startTime: new Date(Date.now() - 15 * 60000).toISOString(), eta: 12, route: [{ lat: 28.3909, lng: 77.3140 }, { lat: 28.3950, lng: 77.3180 }], fare: 350 },
];

const SEED_CHATS: ChatMessage[] = [
  { id: "C1", rideId: "RID-001", sender: "driver", text: "Hi! I'm on my way, 5 mins away.", time: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "C2", rideId: "RID-001", sender: "user", text: "Ok, I'm ready outside the gate.", time: new Date(Date.now() - 9 * 60000).toISOString() },
  { id: "C3", rideId: "RID-001", sender: "driver", text: "Great! I can see you. Coming in.", time: new Date(Date.now() - 8 * 60000).toISOString() },
];

// ── Mini Map Component ─────────────────────────────────────────────────────────
const MiniMap = ({ userLat = 28.4089, userLng = 77.3178, driverLat, driverLng, zoom = 13, height = 240 }: {
  userLat?: number; userLng?: number; driverLat?: number; driverLng?: number; zoom?: number; height?: number;
}) => {
  const markers = [
    `color:blue|label:U|${userLat},${userLng}`,
    ...(driverLat ? [`color:red|label:D|${driverLat},${driverLng}`] : []),
  ].join("&markers=");
  const center = driverLat ? `${(userLat + driverLat) / 2},${(userLng + driverLng) / 2}` : `${userLat},${userLng}`;
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #1e1e2e", position: "relative", height }}>
      <div style={{ width: "100%", height: "100%", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        {/* SVG Map Placeholder */}
        <svg viewBox="0 0 400 240" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="mapbg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2540" />
              <stop offset="100%" stopColor="#0d1117" />
            </radialGradient>
          </defs>
          <rect width="400" height="240" fill="url(#mapbg)" />
          {/* Grid lines */}
          {[40,80,120,160,200,240,280,320,360].map(x => <line key={x} x1={x} y1={0} x2={x} y2={240} stroke="#1e2d45" strokeWidth="0.5" />)}
          {[30,60,90,120,150,180,210].map(y => <line key={y} x1={0} y1={y} x2={400} y2={y} stroke="#1e2d45" strokeWidth="0.5" />)}
          {/* Roads */}
          <path d="M0,120 Q100,110 200,120 T400,115" stroke="#2a3a55" strokeWidth="8" fill="none" />
          <path d="M0,120 Q100,110 200,120 T400,115" stroke="#1e2d45" strokeWidth="6" fill="none" />
          <path d="M200,0 Q195,60 200,120 T205,240" stroke="#2a3a55" strokeWidth="8" fill="none" />
          <path d="M200,0 Q195,60 200,120 T205,240" stroke="#1e2d45" strokeWidth="6" fill="none" />
          <path d="M0,60 Q80,55 160,80 T320,70" stroke="#253348" strokeWidth="5" fill="none" />
          <path d="M80,0 Q75,80 85,160 T80,240" stroke="#253348" strokeWidth="5" fill="none" />
          {/* Route line */}
          {driverLat && <path d="M150,160 Q185,140 220,120" stroke="#f97316" strokeWidth="3" fill="none" strokeDasharray="6,4" />}
          {/* User marker */}
          <circle cx="220" cy="120" r="10" fill="#3b82f6" opacity="0.3" />
          <circle cx="220" cy="120" r="6" fill="#3b82f6" />
          <text x="220" y="108" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">YOU</text>
          {/* Driver marker */}
          {driverLat && <>
            <circle cx="150" cy="160" r="10" fill="#f97316" opacity="0.3" />
            <circle cx="150" cy="160" r="6" fill="#f97316" />
            <text x="150" y="148" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">DRV</text>
          </>}
          {/* Other drivers */}
          {[{x:300,y:70},{x:90,y:170},{x:350,y:190}].map((p,i) => (
            <g key={i}><circle cx={p.x} cy={p.y} r="5" fill="#10b981" opacity="0.6" /><circle cx={p.x} cy={p.y} r="3" fill="#10b981" /></g>
          ))}
        </svg>
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "#0d111799", backdropFilter: "blur(4px)", borderRadius: 8, padding: "4px 8px", fontSize: 11, color: "#aaa", border: "1px solid #2a2a3a" }}>
          🗺 Faridabad, HR
        </div>
      </div>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Enrollment["status"] }) => {
  const map: Record<string, [string, string]> = {
    pending: ["#f59e0b", "#fef3c7"], confirmed: ["#10b981", "#d1fae5"],
    completed: ["#6366f1", "#e0e7ff"], cancelled: ["#ef4444", "#fee2e2"],
  };
  const [color, bg] = map[status] || ["#888", "#222"];
  return <span style={{ background: bg, color, border: `1px solid ${color}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{status}</span>;
};

const RideStatusBadge = ({ status }: { status: Ride["status"] }) => {
  const map: Record<string, [string, string, string]> = {
    started: ["#f59e0b", "#fef3c7", "🚦"], ongoing: ["#10b981", "#d1fae5", "🚗"],
    reached: ["#6366f1", "#e0e7ff", "📍"], completed: ["#888", "#1a1a2e", "✅"],
  };
  const [color, bg, icon] = map[status] || ["#888","#222",""];
  return <span style={{ background: bg, color, border: `1px solid ${color}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{icon} {status}</span>;
};

// ── Star Rating ───────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <span key={n} onClick={() => !readonly && onChange?.(n)}
        style={{ fontSize: 18, cursor: readonly ? "default" : "pointer", color: n <= value ? "#f59e0b" : "#333", transition: "color .15s" }}>★</span>
    ))}
  </div>
);

// ── Notification Bell ─────────────────────────────────────────────────────────
const NotifBell = ({ count, onClick }: { count: number; onClick: () => void }) => (
  <button onClick={onClick} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#aaa", padding: "4px 8px" }}>
    🔔
    {count > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>{count}</span>}
  </button>
);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("home");
  const [enrollments, setEnrollments] = useState<Enrollment[]>(SEED_ENROLLMENTS);
  const [drivers] = useState<Driver[]>(SEED_DRIVERS);
  const [rides, setRides] = useState<Ride[]>(SEED_RIDES);
  const [chats, setChats] = useState<ChatMessage[]>(SEED_CHATS);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotification[]>([
    { id: "N1", type: "new_enrollment", message: "Priya Sharma just enrolled", time: new Date(Date.now() - 60000).toISOString(), read: false, data: SEED_ENROLLMENTS[0] },
    { id: "N2", type: "ride_started", message: "Ride RID-001 started with Rahul Verma", time: new Date(Date.now() - 15 * 60000).toISOString(), read: true },
  ]);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Enrollment["status"]>("all");
  const [filterSlot, setFilterSlot] = useState("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [activeRideTab, setActiveRideTab] = useState<"drivers" | "ongoing">("ongoing");
  const [chatRideId, setChatRideId] = useState<string>("RID-001");
  const [chatInput, setChatInput] = useState("");
  const [slotAlarms, setSlotAlarms] = useState<Record<string, boolean>>({});
  const [alarmFired, setAlarmFired] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [ratingModal, setRatingModal] = useState<{ rideId: string; tempRating: number; tempFeedback: string } | null>(null);
  const [adminTab, setAdminTab] = useState<"enrollments" | "rides" | "drivers">("enrollments");

  // Form state
  const emptyForm = { name: "", email: "", phone: "", age: "", licenseType: "Car (4W)", pickupAddress: "", preferredTime: "Morning (8–11 AM)", experience: "beginner", lat: "", lng: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats]);

  // Simulate ride ETA countdown
  useEffect(() => {
    const t = setInterval(() => {
      setRides(prev => prev.map(r => r.status === "ongoing" && r.eta > 0 ? { ...r, eta: r.eta - 1 } : r));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Slot alarm check
  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const slots: Record<string, number> = { "Morning (8–11 AM)": 8, "Afternoon (12–3 PM)": 12, "Evening (4–7 PM)": 16 };
    Object.entries(slotAlarms).forEach(([slot, on]) => {
      if (!on) return;
      const slotH = slots[slot];
      if (slotH && h === slotH && m >= 50) { // 10 min before
        setAlarmFired(`⏰ Your ${slot} slot starts in 10 minutes!`);
        setTimeout(() => setAlarmFired(null), 8000);
      }
    });
  }, [slotAlarms]);

  // GPS location
  const getLocation = () => {
    setGeoLoading(true);
    setGeoError("");
    if (!navigator.geolocation) { setGeoError("GPS not supported on this device."); setGeoLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode using a free service
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const address = data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6), pickupAddress: address }));
        } catch {
          setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6), pickupAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError("Could not get location. Please allow location access.");
        // Fallback: set Faridabad coords for demo
        setForm(f => ({ ...f, lat: "28.4089", lng: "77.3178", pickupAddress: "Sector 15, Faridabad (demo)" }));
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!/^\d{5,15}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid phone required";
    if (!form.age || +form.age < 16 || +form.age > 70) e.age = "Age must be 16–70";
    if (!form.pickupAddress.trim()) e.pickupAddress = "Pickup location is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = `DS-${String(enrollments.length + 1).padStart(3, "0")}`;
    const location: GeoLocation | undefined = form.lat ? { lat: +form.lat, lng: +form.lng, address: form.pickupAddress } : undefined;
    const entry: Enrollment = { name: form.name, email: form.email, phone: form.phone, age: form.age, licenseType: form.licenseType, pickupAddress: form.pickupAddress, preferredTime: form.preferredTime, experience: form.experience, id, status: "pending", submittedAt: new Date().toISOString(), location };
    setEnrollments(prev => [entry, ...prev]);
    // Admin notification
    const notif: AdminNotification = { id: `N${Date.now()}`, type: "new_enrollment", message: `${form.name} just enrolled (${form.licenseType})`, time: new Date().toISOString(), read: false, data: entry };
    setAdminNotifs(prev => [notif, ...prev]);
    setSuccessId(id);
    setForm(emptyForm);
    setErrors({});
  };

  const updateStatus = (id: string, status: Enrollment["status"]) => {
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    if (selectedEnrollment?.id === id) setSelectedEnrollment(prev => prev ? { ...prev, status } : null);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { id: `C${Date.now()}`, rideId: chatRideId, sender: "user", text: chatInput, time: new Date().toISOString() };
    setChats(prev => [...prev, msg]);
    setChatInput("");
    // Auto-reply
    setTimeout(() => {
      const reply: ChatMessage = { id: `C${Date.now()}+1`, rideId: chatRideId, sender: "driver", text: "Got it! 👍", time: new Date().toISOString() };
      setChats(prev => [...prev, reply]);
    }, 1500);
  };

  const completeRide = (rideId: string) => {
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: "completed" } : r));
    setRatingModal({ rideId, tempRating: 0, tempFeedback: "" });
    const notif: AdminNotification = { id: `N${Date.now()}`, type: "ride_completed", message: `Ride ${rideId} completed`, time: new Date().toISOString(), read: false };
    setAdminNotifs(prev => [notif, ...prev]);
  };

  const submitRating = () => {
    if (!ratingModal) return;
    setRides(prev => prev.map(r => r.id === ratingModal.rideId ? { ...r, rating: ratingModal.tempRating, feedback: ratingModal.tempFeedback } : r));
    setRatingModal(null);
  };

  const markNotifsRead = () => { setAdminNotifs(prev => prev.map(n => ({ ...n, read: true }))); };

  const unreadNotifs = adminNotifs.filter(n => !n.read).length;

  const filtered = enrollments.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || e.status === filterStatus;
    const matchSlot = filterSlot === "all" || e.preferredTime === filterSlot;
    return matchQ && matchS && matchSlot;
  });

  const ongoingRides = rides.filter(r => r.status !== "completed");
  const myRide = ongoingRides[0];

  const stats = { total: enrollments.length, pending: enrollments.filter(e => e.status === "pending").length, confirmed: enrollments.filter(e => e.status === "confirmed").length, completed: enrollments.filter(e => e.status === "completed").length };

  const isSm = useMediaQuery("(max-width: 640px)");
  const isMd = useMediaQuery("(max-width: 900px)");

  // ── Styles ──
  const pagePad = "clamp(16px, 4vw, 32px)";
  const S: Record<string, any> = {
    app: { fontFamily: "'Syne', sans-serif", minHeight: "100vh", background: "#070710", color: "#e8e8f0", width: "100%", maxWidth: "100%", overflowX: "hidden" as const },
    nav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isSm ? 12 : 16,
      flexWrap: isSm ? ("wrap" as const) : ("nowrap" as const),
      flexDirection: "row" as const,
      padding: isSm ? `12px ${pagePad}` : `16px ${pagePad}`,
      borderBottom: "1px solid #151525",
      background: "#070710cc",
      backdropFilter: "blur(12px)",
      position: "sticky" as const,
      top: 0,
      zIndex: 200,
    },
    logo: { fontSize: isSm ? 18 : 20, fontWeight: 900, letterSpacing: -1, color: "#fff", flexShrink: 0 },
    navLinks: {
      display: "flex",
      gap: 6,
      flexWrap: isSm ? ("nowrap" as const) : ("wrap" as const),
      justifyContent: isSm ? "flex-start" : "center",
      flex: isSm ? ("1 1 100%" as const) : ("1 1 auto" as const),
      minWidth: 0,
      alignItems: "center",
      ...(isSm
        ? { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const, paddingBottom: 4, scrollbarWidth: "thin" as const, msOverflowStyle: "auto" as const }
        : {}),
    },
    navBtn: (active: boolean) => ({
      background: active ? "#f97316" : "transparent",
      color: active ? "#fff" : "#666",
      border: active ? "none" : "1px solid #1e1e2e",
      borderRadius: 10,
      padding: isSm ? "8px 12px" : "7px 16px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: isSm ? 12 : 13,
      transition: "all .2s",
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
    }),
    hero: { padding: isSm ? `48px ${pagePad} 36px` : `70px ${pagePad} 50px`, maxWidth: 880, margin: "0 auto", textAlign: "center" as const },
    h1: { fontSize: "clamp(2.2rem,5.5vw,4rem)", fontWeight: 900, letterSpacing: -2, lineHeight: 1.07, marginBottom: 18 },
    accent: { color: "#f97316" },
    sub: { fontSize: "clamp(14px, 3.2vw, 16px)", color: "#777", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.65, padding: `0 ${isSm ? 4 : 0}px` },
    ctaBtn: { background: "#f97316", color: "#fff", border: "none", borderRadius: 12, padding: isSm ? "14px 24px" : "14px 36px", fontSize: isSm ? 15 : 16, fontWeight: 800, cursor: "pointer", letterSpacing: -0.3, width: isSm ? "100%" : "auto", maxWidth: isSm ? 360 : "none" },
    featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 16, padding: `0 ${pagePad} 70px`, maxWidth: 1100, margin: "0 auto", width: "100%" },
    featureCard: { background: "#0d0d1a", border: "1px solid #151525", borderRadius: 16, padding: "24px 20px" },
    formWrap: { maxWidth: 680, margin: "0 auto", padding: `40px ${pagePad}`, width: "100%", boxSizing: "border-box" as const },
    pageTitle: { fontSize: isSm ? 22 : isMd ? 26 : 28, fontWeight: 900, letterSpacing: -1, marginBottom: 4 },
    pageSubtitle: { color: "#555", marginBottom: 36, fontSize: 14 },
    card: { background: "#0d0d1a", border: "1px solid #151525", borderRadius: 18, padding: isSm ? 18 : 28, width: "100%", boxSizing: "border-box" as const },
    fieldRow: { display: "grid", gridTemplateColumns: isSm ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 },
    fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
    label: { fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 },
    input: { background: "#070710", border: "1px solid #1e1e30", borderRadius: 9, padding: "11px 14px", color: "#e8e8f0", fontFamily: "inherit", fontSize: 14, outline: "none" },
    inputErr: { border: "1px solid #ef4444" },
    errMsg: { color: "#ef4444", fontSize: 11, marginTop: 2 },
    select: { background: "#070710", border: "1px solid #1e1e30", borderRadius: 9, padding: "11px 14px", color: "#e8e8f0", fontFamily: "inherit", fontSize: 14, outline: "none" },
    submitBtn: { width: "100%", background: "#f97316", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 20, fontFamily: "inherit" },
    successBox: { background: "#0a1f14", border: "1px solid #10b981", borderRadius: 14, padding: 24, textAlign: "center", marginBottom: 28 },
    adminWrap: { maxWidth: 1200, margin: "0 auto", padding: `36px ${pagePad}`, width: "100%", boxSizing: "border-box" as const },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: 14, marginBottom: 28 },
    statCard: (color: string) => ({ background: "#0d0d1a", border: `1px solid ${color}22`, borderRadius: 14, padding: "20px 22px", borderLeft: `4px solid ${color}` }),
    statNum: { fontSize: 32, fontWeight: 900, marginBottom: 2 },
    statLabel: { color: "#555", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 },
    toolbar: { display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" },
    searchInput: { flex: 1, minWidth: 180, background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 9, padding: "9px 14px", color: "#e8e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" },
    filterBtn: (active: boolean) => ({ background: active ? "#f97316" : "#0d0d1a", color: active ? "#fff" : "#777", border: "1px solid #1e1e2e", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12 }),
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "11px 14px", fontSize: 11, color: "#444", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #151525" },
    td: { padding: "13px 14px", borderBottom: "1px solid #101020", fontSize: 13, verticalAlign: "middle" },
    actionBtn: (color: string) => ({ background: `${color}18`, color: color, border: `1px solid ${color}33`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }),
    modal: { position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: pagePad },
    modalCard: { background: "#0d0d1a", border: "1px solid #2a2a3a", borderRadius: 18, padding: isSm ? 20 : 28, maxWidth: 500, width: "100%", maxHeight: "85vh", overflowY: "auto" as const, boxSizing: "border-box" as const },
    loginWrap: { maxWidth: 380, margin: isSm ? "48px auto" : "80px auto", padding: `0 ${pagePad}`, width: "100%", boxSizing: "border-box" as const },
    loginCard: { background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 18, padding: 36 },
    tabBtn: (active: boolean) => ({ background: active ? "#151525" : "none", color: active ? "#f97316" : "#555", border: "none", borderBottom: active ? "2px solid #f97316" : "2px solid transparent", padding: "10px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all .2s" }),
    rideCard: { background: "#0d0d1a", border: "1px solid #151525", borderRadius: 16, padding: 20, marginBottom: 16 },
    chatWrap: { maxWidth: 680, margin: "0 auto", padding: `32px ${pagePad}`, width: "100%", boxSizing: "border-box" as const },
    chatBubble: (sender: string) => ({ alignSelf: sender === "user" ? "flex-end" : "flex-start", background: sender === "user" ? "#f97316" : "#151525", color: sender === "user" ? "#fff" : "#e8e8f0", borderRadius: sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 16px", maxWidth: isSm ? "90%" : "72%", fontSize: 14 }),
    geoBtn: { background: "#1a1a30", color: "#60a5fa", border: "1px solid #2a2a50", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 },
    alarmBanner: {
      position: "fixed" as const,
      top: isSm ? 64 : 80,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#f97316",
      color: "#fff",
      borderRadius: 14,
      padding: isSm ? "12px 16px" : "14px 28px",
      fontWeight: 800,
      fontSize: isSm ? 13 : 15,
      zIndex: 999,
      boxShadow: "0 8px 40px #f9731655",
      animation: "slideIn .4s",
      maxWidth: "min(calc(100vw - 24px), 420px)",
      textAlign: "center" as const,
      lineHeight: 1.35,
    },
    notifPanel: {
      position: isSm ? ("fixed" as const) : ("absolute" as const),
      ...(isSm
        ? { left: 12, right: 12, top: 56, width: "auto" }
        : { right: 0, top: "110%", width: 340 }),
      background: "#0d0d1a",
      border: "1px solid #1e1e2e",
      borderRadius: 14,
      maxHeight: isSm ? "min(70vh, 400px)" : 380,
      overflowY: "auto" as const,
      zIndex: 500,
      boxShadow: "0 12px 40px #00000088",
    },
  };

  const notificationPanel = showNotifs && (
    <div style={S.notifPanel}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #151525", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Notifications</span>
        <button type="button" onClick={markNotifsRead} style={{ background: "none", border: "none", color: "#f97316", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Mark all read</button>
      </div>
      {adminNotifs.length === 0 && <div style={{ padding: 20, color: "#555", fontSize: 13, textAlign: "center" }}>No notifications</div>}
      {adminNotifs.map(n => (
        <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #101020", background: n.read ? "transparent" : "#151525" }}>
          <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: n.read ? "#777" : "#e8e8f0" }}>{n.message}</div>
          {n.data?.location && <div style={{ fontSize: 11, color: "#f97316", marginTop: 2 }}>📍 {n.data.location.address}</div>}
          <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{new Date(n.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { max-width: 100%; overflow-x: hidden; }
        @keyframes slideIn { from { transform: translateX(-50%) translateY(-20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        ::-webkit-scrollbar { width: 6px } ::-webkit-scrollbar-track { background: #0d0d1a } ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius:3px }
        .nav-scroll-hide::-webkit-scrollbar { height: 4px; }
        .nav-scroll-hide::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      {/* Slot alarm banner */}
      {alarmFired && <div style={S.alarmBanner}>{alarmFired}</div>}

      {/* Rating modal */}
      {ratingModal && (
        <div style={S.modal}>
          <div style={S.modalCard}>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Rate Your Ride ⭐</div>
            <div style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>How was your experience? Your feedback helps us improve.</div>
            <div style={{ marginBottom: 20 }}>
              <div style={S.label}>Rating</div>
              <div style={{ marginTop: 10 }}><StarRating value={ratingModal.tempRating} onChange={n => setRatingModal(r => r ? { ...r, tempRating: n } : null)} /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={S.label}>Feedback (optional)</div>
              <textarea style={{ ...S.input, width: "100%", height: 80, resize: "none", marginTop: 6 }} placeholder="Tell us about your experience..." value={ratingModal.tempFeedback} onChange={e => setRatingModal(r => r ? { ...r, tempFeedback: e.target.value } : null)} />
            </div>
            <div style={{ display: "flex", gap: 10, flexDirection: isSm ? "column" : "row" }}>
              <button style={{ ...S.submitBtn, marginTop: 0, flex: 1 }} onClick={submitRating}>Submit Feedback</button>
              <button style={{ ...S.actionBtn("#666"), padding: "12px 20px", width: isSm ? "100%" : "auto" }} onClick={() => setRatingModal(null)}>Skip</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.app}>
        {/* NAV */}
        <nav style={S.nav}>
          {isSm && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}>
              <div style={S.logo}>⚡ DriveRight</div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <NotifBell count={unreadNotifs} onClick={() => { setShowNotifs(s => !s); if (showNotifs) markNotifsRead(); }} />
                {notificationPanel}
              </div>
            </div>
          )}
          {!isSm && <div style={S.logo}>⚡ DriveRight</div>}
          <div className={isSm ? "nav-scroll-hide" : undefined} style={S.navLinks}>
            {([["home","🏠 Home"],["enroll","📝 Enroll"],["rides","🚗 Rides"],["chat","💬 Chat"],["track","📍 Track"],["admin","⚙️ Admin"]] as const).map(([v, label]) => (
              <button type="button" key={v} style={S.navBtn(view === v)} onClick={() => { setView(v); setSuccessId(null); }}>{label}</button>
            ))}
          </div>
          {!isSm && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <NotifBell count={unreadNotifs} onClick={() => { setShowNotifs(s => !s); if (showNotifs) markNotifsRead(); }} />
              {notificationPanel}
            </div>
          )}
        </nav>

        {/* HOME */}
        {view === "home" && (
          <>
            <div style={S.hero}>
              <h1 style={S.h1}>Learn to Drive<br /><span style={S.accent}>the Right Way.</span></h1>
              <p style={S.sub}>Professional instructors, GPS-tracked pickups, live ride monitoring, and flexible slots designed for Faridabad.</p>
              <button style={S.ctaBtn} onClick={() => setView("enroll")}>Start Your Journey →</button>
            </div>
            <div style={S.featureGrid}>
              {[
                ["🚗","Expert Instructors","Certified trainers with 10+ years of teaching defensive driving."],
                ["📍","GPS Pickup","We track your exact location and come to your door."],
                ["📅","Flexible Timing","Morning, afternoon, or evening slots — pick what works."],
                ["💬","Live Chat","Chat directly with your driver before and during the ride."],
                ["🗺️","Live Tracking","Track your driver in real-time on the map."],
                ["⏰","Slot Reminders","Get in-app alerts 10 min before your session starts."],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={S.featureCard}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 5 }}>{title}</div>
                  <div style={{ color: "#666", fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ENROLLMENT FORM */}
        {view === "enroll" && (
          <div style={S.formWrap}>
            <div style={S.pageTitle}>Enrollment Form</div>
            <div style={S.pageSubtitle}>Fill in your details and we'll contact you within 24 hours.</div>
            {successId && (
              <div style={S.successBox}>
                <div style={{ fontSize: 32 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>You're registered!</div>
                <div style={{ color: "#10b981", marginTop: 4 }}>Enrollment ID: <strong>{successId}</strong></div>
                <div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>We'll call you within 24 hours to confirm your slot.</div>
              </div>
            )}
            <div style={S.card}>
              <div style={S.fieldRow}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Full Name *</label>
                  <input style={{ ...S.input, ...(errors.name ? S.inputErr : {}) }} placeholder="Rahul Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {errors.name && <span style={S.errMsg}>{errors.name}</span>}
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Age *</label>
                  <input style={{ ...S.input, ...(errors.age ? S.inputErr : {}) }} placeholder="22" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                  {errors.age && <span style={S.errMsg}>{errors.age}</span>}
                </div>
              </div>
              <div style={S.fieldRow}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Email *</label>
                  <input style={{ ...S.input, ...(errors.email ? S.inputErr : {}) }} placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  {errors.email && <span style={S.errMsg}>{errors.email}</span>}
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Phone *</label>
                  <input style={{ ...S.input, ...(errors.phone ? S.inputErr : {}) }} placeholder="98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  {errors.phone && <span style={S.errMsg}>{errors.phone}</span>}
                </div>
              </div>
              <div style={S.fieldRow}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>License Type</label>
                  <select style={S.select} value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}>
                    <option>Car (4W)</option><option>Bike (2W)</option><option>Commercial Vehicle</option>
                  </select>
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Experience Level</label>
                  <select style={S.select} value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}>
                    <option value="beginner">Beginner – Never Driven</option>
                    <option value="some">Some Experience</option>
                    <option value="refresher">Refresher Needed</option>
                  </select>
                </div>
              </div>

              {/* GPS Location */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Pickup Location *</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" style={S.geoBtn} onClick={getLocation} disabled={geoLoading}>
                    {geoLoading ? "⏳ Getting GPS..." : "📡 Get Current Location"}
                  </button>
                  {form.lat && <span style={{ fontSize: 11, color: "#10b981", alignSelf: "center" }}>✓ GPS: {form.lat}, {form.lng}</span>}
                </div>
                <input style={{ ...S.input, width: "100%", ...(errors.pickupAddress ? S.inputErr : {}) }} placeholder="House No., Street, Sector, City" value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} />
                {errors.pickupAddress && <span style={S.errMsg}>{errors.pickupAddress}</span>}
                {geoError && <span style={S.errMsg}>{geoError}</span>}
                {form.lat && <div style={{ marginTop: 10 }}><MiniMap userLat={+form.lat} userLng={+form.lng} height={180} /></div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Preferred Time Slot</label>
                <select style={{ ...S.select, width: "100%", marginTop: 6 }} value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))}>
                  <option>Morning (8–11 AM)</option>
                  <option>Afternoon (12–3 PM)</option>
                  <option>Evening (4–7 PM)</option>
                </select>
              </div>

              {/* Slot Alarm Toggle */}
              <div style={{ background: "#070710", border: "1px solid #1e1e30", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>⏰ Slot Reminder Alarm</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Get notified 10 min before your slot</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSlotAlarms(a => ({ ...a, [form.preferredTime]: !a[form.preferredTime] }))}
                  style={{ background: slotAlarms[form.preferredTime] ? "#f9731622" : "#151525", color: slotAlarms[form.preferredTime] ? "#f97316" : "#555", border: `1px solid ${slotAlarms[form.preferredTime] ? "#f97316" : "#2a2a3a"}`, borderRadius: 20, padding: "5px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
                  {slotAlarms[form.preferredTime] ? "ON" : "OFF"}
                </button>
              </div>

              <button style={S.submitBtn} onClick={handleSubmit}>Submit Enrollment →</button>
            </div>
          </div>
        )}

        {/* RIDES VIEW */}
        {view === "rides" && (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: `36px ${pagePad}`, width: "100%", boxSizing: "border-box" }}>
            <div style={S.pageTitle}>Ride Center</div>
            <div style={S.pageSubtitle}>Track ongoing rides and find available drivers</div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #151525", marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 4 }}>
              {(["ongoing", "drivers"] as const).map(t => (
                <button type="button" key={t} style={{ ...S.tabBtn(activeRideTab === t), flexShrink: 0, padding: isSm ? "10px 12px" : "10px 18px", fontSize: isSm ? 12 : 13 }} onClick={() => setActiveRideTab(t)}>
                  {t === "ongoing" ? "🚗 Ongoing Rides" : "👨‍✈️ Available Drivers"}
                </button>
              ))}
            </div>

            {activeRideTab === "ongoing" && (
              <>
                {/* My ride */}
                {myRide && (
                  <div style={{ ...S.rideCard, border: "1px solid #f9731633" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: isSm ? 15 : 17 }}>Your Current Ride</div>
                        <div style={{ color: "#555", fontSize: 13 }}>Ride ID: <span style={{ color: "#f97316" }}>{myRide.id}</span></div>
                      </div>
                      <RideStatusBadge status={myRide.status} />
                    </div>
                    <MiniMap userLat={28.3909} userLng={77.3140} driverLat={28.3980} driverLng={77.3200} height={isSm ? 200 : 220} />
                    <div style={{ display: "grid", gridTemplateColumns: isSm ? "1fr" : "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                      <div style={{ background: "#070710", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#f97316" }}>{myRide.eta}</div>
                        <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase" }}>ETA mins</div>
                      </div>
                      <div style={{ background: "#070710", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>₹{myRide.fare}</div>
                        <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase" }}>Fare</div>
                      </div>
                      <div style={{ background: "#070710", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#6366f1" }}>{myRide.driverName.split(" ")[0]}</div>
                        <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase" }}>Driver</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                      <button type="button" style={{ ...S.actionBtn("#60a5fa"), padding: "8px 16px", fontSize: 12 }} onClick={() => { setChatRideId(myRide.id); setView("chat"); }}>💬 Chat Driver</button>
                      {myRide.status !== "completed" && <button type="button" style={{ ...S.actionBtn("#10b981"), padding: "8px 16px", fontSize: 12 }} onClick={() => completeRide(myRide.id)}>🏁 Complete Ride</button>}
                    </div>
                  </div>
                )}
                {!myRide && <div style={{ color: "#444", textAlign: "center", padding: 60, fontSize: 15 }}>No active rides right now. Enroll to get started!</div>}

                {/* All ongoing (admin view) */}
                {ongoingRides.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: "#888" }}>ALL ACTIVE RIDES</div>
                    {ongoingRides.map(r => (
                      <div key={r.id} style={S.rideCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{r.studentName} ↔ {r.driverName}</div>
                            <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>Started {new Date(r.startTime).toLocaleTimeString("en-IN")} · ETA {r.eta} min</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <RideStatusBadge status={r.status} />
                            <span style={{ color: "#10b981", fontWeight: 800, fontSize: 14 }}>₹{r.fare}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeRideTab === "drivers" && (
              <>
                {/* Filter bar */}
                <div style={S.toolbar}>
                  <select style={{ ...S.searchInput, flex: "none", width: 180 }} value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
                    <option value="all">All Time Slots</option>
                    <option>Morning (8–11 AM)</option>
                    <option>Afternoon (12–3 PM)</option>
                    <option>Evening (4–7 PM)</option>
                  </select>
                  {(["all","idle","on-ride"] as const).map(s => (
                    <button key={s} style={S.filterBtn(filterSlot === s)} onClick={() => {}}>{s === "all" ? "All" : s === "idle" ? "🟢 Available" : "🔴 On Ride"}</button>
                  ))}
                </div>
                <MiniMap userLat={28.4089} userLng={77.3178} driverLat={28.4050} driverLng={77.3100} height={isSm ? 220 : 260} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 14, marginTop: 16 }}>
                  {drivers.map(d => (
                    <div key={d.id} style={{ ...S.rideCard, borderColor: d.status === "idle" ? "#10b98133" : d.status === "on-ride" ? "#ef444433" : "#1e1e2e" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontWeight: 800 }}>{d.name}</div>
                        <span style={{ fontSize: 11, color: d.status === "idle" ? "#10b981" : d.status === "on-ride" ? "#ef4444" : "#888", fontWeight: 800, textTransform: "uppercase" }}>
                          {d.status === "idle" ? "🟢" : d.status === "on-ride" ? "🔴" : "⚫"} {d.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>{d.licenseType} · {d.slot}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
                        <StarRating value={Math.round(d.rating)} readonly />
                        <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>{d.rating}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>{d.phone}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* CHAT VIEW */}
        {view === "chat" && (
          <div style={S.chatWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={S.pageTitle}>Live Chat</div>
                <div style={{ color: "#555", fontSize: isSm ? 12 : 13 }}>Ride: <span style={{ color: "#f97316" }}>{chatRideId}</span> · Driver: Suresh Kumar</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
            </div>
            <div style={{ background: "#0d0d1a", border: "1px solid #151525", borderRadius: 16, padding: isSm ? 14 : 20, height: isSm ? "min(52vh, 360px)" : 380, minHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {chats.filter(c => c.rideId === chatRideId).map(m => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender === "user" ? "flex-end" : "flex-start" }}>
                  <div style={S.chatBubble(m.sender)}>{m.text}</div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 3, paddingInline: 4 }}>
                    {m.sender === "driver" ? "🚗 Driver" : "👤 You"} · {new Date(m.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: isSm ? "wrap" : "nowrap" }}>
              <input style={{ ...S.input, flex: isSm ? "1 1 100%" : 1, minWidth: 0, fontSize: 16 }} placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
              <button type="button" style={{ ...S.submitBtn, width: isSm ? "100%" : "auto", marginTop: 0, padding: "11px 20px" }} onClick={sendChat}>Send</button>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["I'm ready outside 🙋", "Be there in 5 mins 🏃", "Running late, sorry!", "All good, thanks! 👍"].map(quick => (
                <button key={quick} onClick={() => { setChatInput(quick); }} style={{ ...S.actionBtn("#60a5fa"), padding: "6px 12px" }}>{quick}</button>
              ))}
            </div>
          </div>
        )}

        {/* TRACK VIEW */}
        {view === "track" && (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: `36px ${pagePad}`, width: "100%", boxSizing: "border-box" }}>
            <div style={S.pageTitle}>Live Tracking</div>
            <div style={S.pageSubtitle}>Your driver's location updates every 30 seconds</div>
            {myRide ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: isSm ? 14 : 16 }}>{myRide.driverName}</span>
                    <span style={{ color: "#555", fontSize: isSm ? 12 : 13, marginLeft: 8 }}>is on the way</span>
                  </div>
                  <RideStatusBadge status={myRide.status} />
                </div>
                <MiniMap userLat={28.3909} userLng={77.3140} driverLat={28.3980} driverLng={77.3200} height={isSm ? 240 : 340} />
                {/* Status bar */}
                <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 0", padding: "0 4px", flexWrap: isSm ? "wrap" : "nowrap", gap: isSm ? 12 : 0 }}>
                  {["Started","Ongoing","Reached","Completed"].map((s, i) => {
                    const statusOrder = ["started","ongoing","reached","completed"];
                    const current = statusOrder.indexOf(myRide.status);
                    const done = i <= current;
                    return (
                      <div key={s} style={{ textAlign: "center", flex: isSm ? "1 1 45%" : 1, minWidth: isSm ? "40%" : 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#f97316" : "#151525", border: `2px solid ${done ? "#f97316" : "#2a2a3a"}`, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: done ? "#fff" : "#444" }}>{done ? "✓" : i + 1}</div>
                        <div style={{ fontSize: isSm ? 10 : 11, color: done ? "#f97316" : "#444", fontWeight: 700 }}>{s}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#0d0d1a", border: "1px solid #151525", borderRadius: 14, padding: isSm ? 16 : 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isSm ? "1fr" : "1fr 1fr", gap: 16 }}>
                    {[["ETA", `${myRide.eta} min`],["Fare","₹"+myRide.fare],["Driver",myRide.driverName],["Status",myRide.status]].map(([k,v]) => (
                      <div key={k as string}><div style={{ fontSize: 11, color: "#555", fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>{k}</div><div style={{ fontWeight: 700, fontSize: 15, textTransform: "capitalize" }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    <button type="button" style={{ ...S.actionBtn("#60a5fa"), padding: "8px 16px" }} onClick={() => { setChatRideId(myRide.id); setView("chat"); }}>💬 Chat Driver</button>
                    {myRide.status !== "completed" && <button type="button" style={{ ...S.actionBtn("#10b981"), padding: "8px 16px" }} onClick={() => completeRide(myRide.id)}>🏁 Complete Ride</button>}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "#444", textAlign: "center", padding: 80 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontSize: 15 }}>No active ride to track</div>
                <div style={{ fontSize: 13, color: "#333", marginTop: 6 }}>Enroll and get assigned a driver to see live tracking</div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN */}
        {view === "admin" && !adminAuth && (
          <div style={S.loginWrap}>
            <div style={S.loginCard}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>Admin Login</div>
              <div style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>Password hint: <strong>admin123</strong></div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Password</label>
                <input type="password" style={{ ...S.input, ...(pwError ? S.inputErr : {}) }} placeholder="••••••••" value={adminPw}
                  onChange={e => { setAdminPw(e.target.value); setPwError(false); }}
                  onKeyDown={e => { if (e.key === "Enter") { if (adminPw === "admin123") setAdminAuth(true); else setPwError(true); }}} />
                {pwError && <span style={S.errMsg}>Incorrect password</span>}
              </div>
              <button style={{ ...S.submitBtn, marginTop: 16 }} onClick={() => { if (adminPw === "admin123") setAdminAuth(true); else setPwError(true); }}>Login →</button>
            </div>
          </div>
        )}

        {view === "admin" && adminAuth && (
          <div style={S.adminWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={S.pageTitle}>Admin Dashboard</div>
                <div style={{ color: "#555", fontSize: 13 }}>Full platform overview</div>
              </div>
              <button type="button" onClick={() => setAdminAuth(false)} style={{ ...S.filterBtn(false), fontSize: 12 }}>Logout</button>
            </div>

            {/* Stats */}
            <div style={S.statsRow}>
              {[["Total", stats.total, "#f97316"],["Pending", stats.pending, "#f59e0b"],["Confirmed", stats.confirmed, "#10b981"],["Completed", stats.completed, "#6366f1"]].map(([label, num, color]) => (
                <div key={label as string} style={S.statCard(color as string)}>
                  <div style={{ ...S.statNum, color: color as string }}>{num}</div>
                  <div style={S.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            {/* Notifications panel */}
            {adminNotifs.filter(n => !n.read).length > 0 && (
              <div style={{ background: "#0d1a0d", border: "1px solid #10b981", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#10b981", marginBottom: 10 }}>🔔 New Notifications ({adminNotifs.filter(n => !n.read).length})</div>
                {adminNotifs.filter(n => !n.read).map(n => (
                  <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #0a2a0a" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{n.message}</div>
                      {n.data?.location && <div style={{ fontSize: 11, color: "#10b981", marginTop: 1 }}>📍 {n.data.location.address} · Lat: {n.data.location.lat}, Lng: {n.data.location.lng}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{new Date(n.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #151525", marginBottom: 20, overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 4 }}>
              {(["enrollments","rides","drivers"] as const).map(t => (
                <button type="button" key={t} style={{ ...S.tabBtn(adminTab === t), flexShrink: 0, padding: isSm ? "10px 12px" : "10px 18px", fontSize: isSm ? 12 : 13 }} onClick={() => setAdminTab(t)}>
                  {t === "enrollments" ? "📋 Enrollments" : t === "rides" ? "🚗 Rides" : "👨‍✈️ Drivers"}
                </button>
              ))}
            </div>

            {/* Enrollments Tab */}
            {adminTab === "enrollments" && (
              <>
                <div style={S.toolbar}>
                  <input style={S.searchInput} placeholder="Search name, email, ID…" value={search} onChange={e => setSearch(e.target.value)} />
                  <select style={{ ...S.searchInput, flex: "none", width: 170 }} value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
                    <option value="all">All Slots</option>
                    <option>Morning (8–11 AM)</option>
                    <option>Afternoon (12–3 PM)</option>
                    <option>Evening (4–7 PM)</option>
                  </select>
                  {(["all","pending","confirmed","completed","cancelled"] as const).map(s => (
                    <button key={s} style={S.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
                <div className="table-responsive" style={{ background: "#0d0d1a", border: "1px solid #151525", borderRadius: 14, maxWidth: "100%" }}>
                  <table style={{ ...S.table, minWidth: 720 }}>
                    <thead>
                      <tr>{["ID","Name","Phone","License","Location","Slot","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#333", padding: 40 }}>No enrollments found</td></tr>}
                      {filtered.map(e => (
                        <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setSelectedEnrollment(e)}>
                          <td style={{ ...S.td, color: "#f97316", fontWeight: 700 }}>{e.id}</td>
                          <td style={{ ...S.td, fontWeight: 600 }}>{e.name}<div style={{ color: "#444", fontSize: 11 }}>{e.email}</div></td>
                          <td style={S.td}>{e.phone}</td>
                          <td style={S.td}>{e.licenseType}</td>
                          <td style={{ ...S.td, maxWidth: 160 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.pickupAddress}</div>
                            {e.location && <div style={{ color: "#f97316", fontSize: 10, marginTop: 1 }}>📍 {e.location.lat.toFixed(3)}, {e.location.lng.toFixed(3)}</div>}
                          </td>
                          <td style={S.td}>{e.preferredTime}</td>
                          <td style={S.td}><StatusBadge status={e.status} /></td>
                          <td style={S.td} onClick={ev => ev.stopPropagation()}>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {e.status !== "confirmed" && <button style={S.actionBtn("#10b981")} onClick={() => updateStatus(e.id, "confirmed")}>Confirm</button>}
                              {e.status !== "completed" && <button style={S.actionBtn("#6366f1")} onClick={() => updateStatus(e.id, "completed")}>Done</button>}
                              {e.status !== "cancelled" && <button style={S.actionBtn("#ef4444")} onClick={() => updateStatus(e.id, "cancelled")}>Cancel</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ color: "#333", fontSize: 12, marginTop: 10 }}>Showing {filtered.length} of {enrollments.length}</div>
              </>
            )}

            {/* Rides Tab */}
            {adminTab === "rides" && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <MiniMap userLat={28.4089} userLng={77.3178} driverLat={28.3980} driverLng={77.3200} height={260} />
                </div>
                {rides.map(r => (
                  <div key={r.id} style={{ ...S.rideCard, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{r.id}</div>
                        <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>{r.studentName} ↔ {r.driverName}</div>
                        <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>Started: {new Date(r.startTime).toLocaleString("en-IN")} · Fare: <span style={{ color: "#10b981", fontWeight: 700 }}>₹{r.fare}</span></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <RideStatusBadge status={r.status} />
                        <div style={{ fontSize: 12, color: "#f97316", marginTop: 6 }}>ETA: {r.eta} min</div>
                      </div>
                    </div>
                    {r.rating && (
                      <div style={{ marginTop: 12, padding: "10px 0", borderTop: "1px solid #151525" }}>
                        <StarRating value={r.rating} readonly />
                        {r.feedback && <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>"{r.feedback}"</div>}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Drivers Tab */}
            {adminTab === "drivers" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))", gap: 14 }}>
                {drivers.map(d => (
                  <div key={d.id} style={{ ...S.rideCard, borderColor: d.status === "idle" ? "#10b98133" : "#ef444422" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontWeight: 800 }}>{d.name}</div>
                      <span style={{ fontSize: 11, color: d.status === "idle" ? "#10b981" : "#ef4444", fontWeight: 800, textTransform: "uppercase" }}>{d.status === "idle" ? "🟢 Available" : "🔴 On Ride"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{d.licenseType} · {d.slot}</div>
                    <div style={{ fontSize: 11, color: "#444" }}>📞 {d.phone}</div>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>📍 {d.location.lat.toFixed(3)}, {d.location.lng.toFixed(3)}</div>
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <StarRating value={Math.round(d.rating)} readonly />
                      <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 13 }}>{d.rating} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL MODAL */}
        {selectedEnrollment && (
          <div style={S.modal} onClick={() => setSelectedEnrollment(null)}>
            <div style={S.modalCard} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedEnrollment.name}</div>
                  <div style={{ color: "#f97316", fontSize: 12, fontWeight: 700 }}>{selectedEnrollment.id}</div>
                </div>
                <button onClick={() => setSelectedEnrollment(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <StatusBadge status={selectedEnrollment.status} />
              {selectedEnrollment.location && (
                <div style={{ marginTop: 16 }}>
                  <MiniMap userLat={selectedEnrollment.location.lat} userLng={selectedEnrollment.location.lng} height={180} />
                  <div style={{ fontSize: 11, color: "#f97316", marginTop: 6 }}>📍 GPS: {selectedEnrollment.location.lat}, {selectedEnrollment.location.lng}</div>
                </div>
              )}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: isSm ? "1fr" : "1fr 1fr", gap: 14 }}>
                {[["📧 Email", selectedEnrollment.email],["📞 Phone", selectedEnrollment.phone],["🎂 Age", selectedEnrollment.age],["🚗 License", selectedEnrollment.licenseType],["⏰ Slot", selectedEnrollment.preferredTime],["📊 Experience", selectedEnrollment.experience],["📍 Address", selectedEnrollment.pickupAddress],["📅 Joined", new Date(selectedEnrollment.submittedAt).toLocaleDateString("en-IN")]].map(([label, val]) => (
                  <div key={label as string}><div style={{ color: "#444", fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div></div>
                ))}
              </div>
              {selectedEnrollment.rating && (
                <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid #151525" }}>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 800, marginBottom: 6 }}>STUDENT RATING</div>
                  <StarRating value={selectedEnrollment.rating} readonly />
                  {selectedEnrollment.feedback && <div style={{ color: "#777", fontSize: 12, marginTop: 6, fontStyle: "italic" }}>"{selectedEnrollment.feedback}"</div>}
                </div>
              )}
              <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ ...S.actionBtn("#10b981"), padding: "7px 14px" }} onClick={() => updateStatus(selectedEnrollment.id, "confirmed")}>✅ Confirm</button>
                <button style={{ ...S.actionBtn("#6366f1"), padding: "7px 14px" }} onClick={() => updateStatus(selectedEnrollment.id, "completed")}>🏁 Complete</button>
                <button style={{ ...S.actionBtn("#ef4444"), padding: "7px 14px" }} onClick={() => updateStatus(selectedEnrollment.id, "cancelled")}>❌ Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}