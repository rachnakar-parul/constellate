"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const P = { bg: "#0F172A", night: "#1E293B", lav: "#C4B5FD", gold: "#FDE68A", rose: "#FBCFE8", ice: "#BFDBFE", mist: "#F8FAFC" };
const COLORS = [P.rose, P.ice, P.lav, P.gold, "#A7F3D2", "#E2D5F0", "#FFB4A2", "#93C5FD", "#FCA5A5", "#86EFAC", "#F9CB8B", "#B4A0E8", "#A0D8E8", "#E8A0C8", "#C8E8A0", "#E8D4A0", "#A0C8E8", "#D4A0E8", "#A0E8C8", "#E8A0A0"];
const FEELINGS = ["Safe", "Loved", "Brave", "Seen", "Capable", "Free", "Hopeful", "Grounded", "Inspired"];

/* ── Voice Input ── */
function MicButton({ onResult, color = P.mist }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const test = new SR();
        test.onend = () => {};
        setSupported(true);
      }
    } catch { setSupported(false); }
  }, []);

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      let final = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        onResult((final + interim).trim());
      };
      rec.onerror = () => { setListening(false); setSupported(false); };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch { setSupported(false); }
  };

  if (!supported) return null;

  return (
    <button onClick={toggle} style={{
      background: listening ? `${color}20` : "transparent",
      border: `1px solid ${listening ? color + "44" : P.mist + "12"}`,
      borderRadius: "50%", width: 36, height: 36, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.3s",
      boxShadow: listening ? `0 0 12px ${color}25` : "none",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening ? color : P.mist} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: listening ? 0.8 : 0.3 }}>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="22" />
        {listening && <circle cx="12" cy="8" r="2" fill={color} opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
        </circle>}
      </svg>
    </button>
  );
}

const OB_PROMPTS = [
  { q: "Who would you call at 2am — not because they'd have answers, but because their voice alone would help?", hint: "What does knowing they'd answer make possible for you?" },
  { q: "Who believed in you before you believed in yourself?", hint: "What did their belief make possible?" },
  { q: "Think of a stranger or brief encounter that changed something small inside you.", hint: "What shifted in you after that moment?" },
  { q: "Whose words come out of your mouth when you give advice to someone you love?", hint: "What did inheriting their words make possible for you?" },
  { q: "Who showed up — not with grand gestures, but by simply staying?", hint: "What does their steadiness make you feel?" },
];

const DAILY = [
  "Who taught you something this week without meaning to?",
  "Whose voice did you hear inside your own head today?",
  "Did anyone make your day lighter — even slightly?",
  "Is there someone whose impact you're only now beginning to understand?",
  "Look at your sky. Who deserves another star?",
  "Who made you laugh recently when you needed it most?",
  "Who showed you a different way to see something?",
  "Is there someone who helped you through something they don't even know about?",
  "Who do you become more yourself around?",
  "Who gave you permission to want what you want?",
  "Whose kindness caught you off guard recently?",
  "Who helped you become braver than you were before?",
];

async function load() {
  try {
    const data = localStorage.getItem("grat-v4");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function save(d) {
  try {
    localStorage.setItem("grat-v4", JSON.stringify(d));
  } catch (e) {
    console.error(e);
  }
}

async function loadAuth() {
  try {
    const data = localStorage.getItem("grat-auth");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function saveAuth(d) {
  try {
    localStorage.setItem("grat-auth", JSON.stringify(d));
  } catch (e) {
    console.error(e);
  }
}
/* ── Name intelligence ── */
const MY_PATTERN = /^my\s+/i;
const isRelational = (name) => MY_PATTERN.test(name.trim());
// App talking to user: "my sister" → "your sister"
const appName = (name) => {
  const n = name.trim();
  if (!isRelational(n)) return n;
  return n.replace(MY_PATTERN, (m) => m[0] === 'M' ? 'Your ' : 'your ');
};
// Share card sent to that person: "my sister" → "you"
const shareName = (name) => isRelational(name.trim()) ? "you" : name.trim();
// Label on star: "my sister" → "sister", proper names stay
const starName = (name) => {
  const n = name.trim();
  if (!isRelational(n)) return n;
  return n.replace(MY_PATTERN, '').replace(/^\w/, c => c.toUpperCase());
};

/* ── Background ── */
function Sky({ w, h }) {
  const stars = useMemo(() => Array.from({ length: 30 }, () => ({
    x: Math.random() * w, y: Math.random() * h, s: Math.random() * 1.4 + 0.3,
    o: Math.random() * 0.3 + 0.05, d: 3 + Math.random() * 6, dl: -Math.random() * 8,
  })), [w, h]);
  const dust = useMemo(() => Array.from({ length: 8 }, () => {
    const cs = [P.lav, P.gold, P.rose, P.ice];
    return { x: Math.random() * w, y: Math.random() * h, s: 1 + Math.random() * 2,
      c: cs[Math.floor(Math.random() * cs.length)], o: 0.03 + Math.random() * 0.08,
      dur: 22 + Math.random() * 25, dl: -Math.random() * 20,
      dx: (Math.random() - 0.5) * 60, dy: (Math.random() - 0.5) * 60 };
  }), [w, h]);
  return <>
    {stars.map((s, i) => <div key={`s${i}`} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: "50%", background: P.mist, opacity: s.o, boxShadow: s.s > 1 ? `0 0 ${s.s * 2}px rgba(248,250,252,0.12)` : "none", animation: `twinkle ${s.d}s ease-in-out ${s.dl}s infinite`, pointerEvents: "none" }} />)}
    {dust.map((d, i) => <div key={`d${i}`} style={{ position: "absolute", left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: "50%", background: d.c, opacity: d.o, boxShadow: `0 0 ${d.s * 3}px ${d.c}33`, animation: `drift ${d.dur}s ease-in-out ${d.dl}s infinite alternate`, "--dx": `${d.dx}px`, "--dy": `${d.dy}px`, pointerEvents: "none" }} />)}
  </>;
}

/* ── Mini constellation shown during onboarding ── */
function MiniConstellation({ people, width }) {
  const h = 180;
  const cx = width / 2, cy = h / 2;
  if (!people.length) return <div style={{ height: h }} />;
  const maxE = Math.max(...people.map(p => p.entries.length), 1);
  const golden = 2.399963;
  const maxR = Math.min(width, h) * 0.32;
  const minR = 25;

  const sorted = [...people].sort((a, b) => b.entries.length - a.entries.length);
  const pos = sorted.map((p, i) => {
    const ratio = p.entries.length / maxE;
    const r = minR + (1 - ratio) * (maxR - minR);
    const a = i * golden - Math.PI / 2;
    return { p, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });

  return (
    <div style={{ position: "relative", width, height: h, margin: "0 auto 20px" }}>
      {/* Lines */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {pos.map(({ p, x, y }, i) => (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={p.color} strokeWidth="0.5" opacity="0.15" strokeDasharray="2,5" />
        ))}
      </svg>
      {/* Center cluster */}
      {people.map((p, i) => {
        const a = (i / people.length) * Math.PI * 2;
        const r = 4 + (people.length > 1 ? 3 : 0);
        return <div key={`cc${i}`} style={{
          position: "absolute", left: cx + Math.cos(a) * r - 2, top: cy + Math.sin(a) * r - 2,
          width: 4, height: 4, borderRadius: "50%", background: p.color, opacity: 0.6,
          boxShadow: `0 0 6px ${p.color}55`, animation: `twinkle ${3 + i * 0.5}s ease-in-out infinite`,
        }} />;
      })}
      <div style={{
        position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)",
        width: 20 + people.length * 5, height: 20 + people.length * 5, borderRadius: "50%",
        background: `radial-gradient(circle, ${P.lav}08, ${P.gold}04, transparent 70%)`,
        pointerEvents: "none",
      }} />
      {/* Star orbs */}
      {pos.map(({ p, x, y }) => {
        const sz = 5 + (p.entries.length / maxE) * 6;
        return (
          <div key={p.id} style={{
            position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)",
            animation: "fadeUp 0.6s ease",
          }}>
            <div style={{
              width: sz * 3, height: sz * 3, borderRadius: "50%", position: "absolute",
              left: "50%", top: "50%", transform: "translate(-50%,-50%)",
              background: `radial-gradient(circle, ${p.color}18, transparent 70%)`,
            }} />
            <div style={{
              width: sz, height: sz, borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, #fff 15%, ${p.color} 55%, transparent 90%)`,
              boxShadow: `0 0 ${sz}px ${p.color}55`,
            }} />
            <div style={{
              position: "absolute", top: sz + 4, left: "50%", transform: "translateX(-50%)",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "9px", color: p.color,
              opacity: 0.8, whiteSpace: "nowrap",
            }}>{starName(p.name)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Onboarding ── */
function Onboarding({ onComplete }) {
  const [beat, setBeat] = useState(0); // 0-7 story beats, 8+ = entry flow
  const [entryNum, setEntryNum] = useState(0); // 0 or 1 (two entries)
  const [name, setName] = useState("");
  const [gave, setGave] = useState("");
  const [impact, setImpact] = useState("");
  const [feelings, setFeelings] = useState([]);
  const [phase, setPhase] = useState("prompt"); // prompt, name, gave, impact
  const [collected, setCollected] = useState([]);
  const [showStarBirth, setShowStarBirth] = useState(false);
  const [birthColor, setBirthColor] = useState(P.rose);
  const [birthName, setBirthName] = useState("");
  const [dims, setDims] = useState({ w: 360, h: 600 });
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) setDims({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
  }, []);

  const [promptIdx, setPromptIdx] = useState(0);
  const [promptFade, setPromptFade] = useState(true);
  const prompt = OB_PROMPTS[promptIdx];
  const toggleF = f => setFeelings(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const nextPrompt = () => {
    setPromptFade(false);
    setTimeout(() => {
      setPromptIdx(p => (p + 1) % OB_PROMPTS.length);
      setPromptFade(true);
    }, 300);
  };

  const goBack = () => {
    if (phase === "impact") setPhase("gave");
    else if (phase === "gave") setPhase("name");
    else if (phase === "name") setPhase("prompt");
  };

  const submitEntry = () => {
    const color = COLORS[collected.length % COLORS.length];
    const trimName = name.trim();
    const existing = collected.find(p => p.name.toLowerCase() === trimName.toLowerCase());
    let updated;
    if (existing) {
      updated = collected.map(p => p.id === existing.id ? { ...p, entries: [...p.entries, { text: gave.trim(), impact: impact.trim(), feelings: [...feelings], date: new Date().toISOString().split("T")[0] }] } : p);
    } else {
      const entry = {
        id: `p-${Date.now()}`, name: trimName, color,
        entries: [{ text: gave.trim(), impact: impact.trim(), feelings: [...feelings], date: new Date().toISOString().split("T")[0] }],
      };
      updated = [...collected, entry];
    }
    setCollected(updated);
    save({ people: updated });

    setBirthColor(existing ? existing.color : color);
    setBirthName(starName(trimName));
    setShowStarBirth(true);

    setTimeout(() => {
      setShowStarBirth(false);
      if (entryNum < 1) {
        setEntryNum(1);
        setName(""); setGave(""); setImpact(""); setFeelings([]);
        setPhase("prompt");
        setPromptIdx(p => (p + 1) % OB_PROMPTS.length);
        setBeat(8);
      } else {
        onComplete(updated);
      }
    }, 3200);
  };

  const inp = {
    width: "100%", boxSizing: "border-box", background: "transparent",
    border: "none", borderBottom: `1px solid ${P.mist}15`, color: P.mist,
    fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300,
    fontStyle: "italic", padding: "12px 0", outline: "none", opacity: 0.80,
  };

  const bg = `linear-gradient(170deg, #060a16 0%, ${P.bg} 40%, ${P.night} 70%, #0d1525 100%)`;

  /* ── Star Birth Animation ── */
  if (showStarBirth) {
    const cx = dims.w / 2, cy = dims.h * 0.35;
    return (
      <div ref={ref} style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
        <Sky w={dims.w} h={dims.h} />

        {/* Existing stars */}
        {collected.slice(0, -1).map((p, i) => {
          const a = i * 2.399963 - Math.PI / 2;
          const r = 85;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          return (
            <div key={p.id} style={{ position: "absolute", left: x - 4, top: y - 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", position: "absolute", left: -16, top: -16, background: `radial-gradient(circle, ${p.color}15, transparent 70%)` }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: `radial-gradient(circle at 38% 33%, #fff 15%, ${p.color} 55%, transparent 85%)`, boxShadow: `0 0 10px ${p.color}55` }} />
              <div style={{ position: "absolute", top: 14, left: 4, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: p.color, opacity: 0.65 }}>{starName(p.name)}</div>
            </div>
          );
        })}

        {/* Center — "you" */}
        <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%", margin: "0 auto",
            background: `radial-gradient(circle at 38% 33%, rgba(255,255,255,0.3), ${P.lav}33, transparent 80%)`,
            boxShadow: `0 0 16px ${P.lav}18, 0 0 35px ${P.mist}08`,
          }}>
            {collected.slice(0, -1).map((p, i) => {
              const a = (i / Math.max(collected.length - 1, 1)) * Math.PI * 2;
              return <div key={`c${i}`} style={{
                position: "absolute", left: 6 + Math.cos(a) * 5, top: 6 + Math.sin(a) * 5,
                width: 3, height: 3, borderRadius: "50%", background: p.color, opacity: 0.6,
              }} />;
            })}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "9px", fontStyle: "italic", color: P.mist, opacity: 0.8, marginTop: 6, letterSpacing: "2px" }}>you</p>
        </div>

        {/* NEW star appearing */}
        {(() => {
          const newIdx = collected.length - 1;
          const a = newIdx * 2.399963 - Math.PI / 2;
          const r = 85;
          const sx = cx + Math.cos(a) * r;
          const sy = cy + Math.sin(a) * r;
          return (
            <>
              <div style={{ position: "absolute", left: sx, top: sy, transform: "translate(-50%,-50%)" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", position: "absolute", left: -24, top: -24, background: `radial-gradient(circle, ${birthColor}22, transparent 70%)`, animation: "pulseGlow 2s ease-in-out infinite" }} />
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: `radial-gradient(circle at 38% 33%, #fff 20%, ${birthColor} 50%, transparent 85%)`,
                  boxShadow: `0 0 18px ${birthColor}77, 0 0 40px ${birthColor}30`,
                  opacity: 0, animation: "slowFade 1s ease forwards",
                }} />
                <div style={{ position: "absolute", top: 22, left: 7, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: birthColor, opacity: 0, animation: "slowFade 1s ease 0.5s forwards" }}>{birthName}</div>
              </div>
              {/* Shooting stars to center */}
              {[0, 1, 2, 3].map(i => (
                <div key={`sh${i}`} style={{
                  position: "absolute", left: sx, top: sy, width: 5, height: 5, borderRadius: "50%",
                  background: birthColor, boxShadow: `0 0 10px 3px ${birthColor}aa`,
                  opacity: 0, pointerEvents: "none", zIndex: 8,
                  animation: `shoot 1.1s ease-in ${0.8 + i * 0.2}s forwards`,
                  "--sX": `${cx - sx}px`, "--sY": `${cy - sy}px`,
                }} />
              ))}
              {/* Constellation line */}
              <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
                <line x1={sx} y1={sy} x2={cx} y2={cy} stroke={birthColor} strokeWidth="0.8" strokeDasharray="3,7" opacity="0" style={{ animation: "slowFade 0.8s ease 0.3s forwards" }} />
              </svg>
            </>
          );
        })()}

        {/* Text */}
        <div style={{
          position: "absolute", bottom: 65, left: 0, right: 0, textAlign: "center",
          opacity: 0, animation: "slowFade 1.5s ease 1s forwards",
        }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.65 }}>
            That's now part of who you are.
          </p>
        </div>
      </div>
    );
  }

  /* ── Story Beats ── */
  if (beat < 8) {
    const backBtn = (target) => beat > 0 ? (
      <button onClick={() => setBeat(target)} style={{
        position: "absolute", top: 28, left: 22, zIndex: 10,
        background: "none", border: "none", color: P.mist, opacity: 0.2,
        fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic",
        cursor: "pointer", padding: "8px 0",
      }}>← back</button>
    ) : null;

    const beats = [
      // Beat 0: App name
      () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", animation: "slowFade 1.5s ease" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.85, margin: "0 0 14px", letterSpacing: "5px" }}>
            Constellate
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, color: P.mist, opacity: 0.8, letterSpacing: "2.5px" }}>
            see who helped you become you
          </p>
          <button onClick={() => setBeat(1)} style={{
            marginTop: 52, background: "transparent", border: `1px solid ${P.mist}18`,
            borderRadius: "24px", padding: "13px 36px", color: P.mist, opacity: 0.7,
            fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontStyle: "italic",
            cursor: "pointer", transition: "opacity 0.3s",
          }} onMouseEnter={e => e.target.style.opacity = "0.5"} onMouseLeave={e => e.target.style.opacity = "0.3"}>
            begin
          </button>
        </div>
      ),
      // Beat 1: We are never alone
      () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px", textAlign: "center", cursor: "pointer" }} onClick={() => setBeat(2)}>
          {backBtn(0)}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.80, lineHeight: 1.7, margin: 0, animation: "slowFade 1.5s ease" }}>
            We are never alone.
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.6, lineHeight: 1.7, margin: "24px 0 0", animation: "slowFade 1.5s ease 1.2s both" }}>
            We are the sum total of everyone we've ever met.
          </p>
        </div>
      ),
      // Beat 2: Star appears
      () => {
        const cx = dims.w / 2, cy = dims.h * 0.35;
        return (
          <div style={{ flex: 1, position: "relative", cursor: "pointer" }} onClick={() => setBeat(3)}>
            {backBtn(1)}
            <div style={{
              position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)",
              animation: "starAppear 1.2s ease-out",
            }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${P.rose}20, transparent 70%)` }} />
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: `radial-gradient(circle at 38% 33%, #fff 20%, ${P.rose} 50%, transparent 85%)`, boxShadow: `0 0 18px ${P.rose}66, 0 0 40px ${P.rose}22` }} />
            </div>
            <p style={{ position: "absolute", bottom: 180, left: 0, right: 0, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.9, padding: "0 30px", lineHeight: 1.7, animation: "slowFade 1.5s ease 0.6s both" }}>
              Every person who helped you become who you are is a star in your sky.
            </p>
          </div>
        );
      },
      // Beat 3: More stars + proximity + "You" at center
      () => {
        const cx = dims.w / 2, cy = dims.h * 0.35;
        const demo = [
          { x: cx - 50, y: cy - 35, s: 11, c: P.rose, d: 0 },
          { x: cx + 55, y: cy - 18, s: 7, c: P.ice, d: 0.3 },
          { x: cx - 28, y: cy + 48, s: 9, c: P.lav, d: 0.5 },
          { x: cx + 38, y: cy + 38, s: 5, c: P.gold, d: 0.7 },
          { x: cx + 12, y: cy - 62, s: 4, c: "#A7F3D2", d: 0.9 },
        ];
        return (
          <div style={{ flex: 1, position: "relative", cursor: "pointer" }} onClick={() => setBeat(4)}>
            {backBtn(2)}
            {demo.map((st, i) => (
              <div key={i} style={{ position: "absolute", left: st.x, top: st.y, transform: "translate(-50%,-50%)", animation: `starAppear 0.9s ease-out ${st.d}s both` }}>
                <div style={{ width: st.s * 4, height: st.s * 4, borderRadius: "50%", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${st.c}15, transparent 70%)` }} />
                <div style={{ width: st.s, height: st.s, borderRadius: "50%", background: `radial-gradient(circle at 38% 33%, #fff 15%, ${st.c} 55%, transparent 85%)`, boxShadow: `0 0 ${st.s}px ${st.c}55` }} />
              </div>
            ))}
            {/* Center: YOU */}
            <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `radial-gradient(circle, ${P.mist}55, ${P.lav}22, transparent 80%)`, boxShadow: `0 0 20px ${P.mist}15`, margin: "0 auto" }} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", fontStyle: "italic", color: P.mist, opacity: 0.8, marginTop: 6, letterSpacing: "2px" }}>you</p>
            </div>
            <p style={{ position: "absolute", bottom: 180, left: 0, right: 0, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.65, padding: "0 30px", lineHeight: 1.7, animation: "slowFade 1.5s ease 0.8s both" }}>
              The closer a star, the more they helped you become you.
            </p>
          </div>
        );
      },
      // Beat 4: Beams to center
      () => {
        const cx = dims.w / 2, cy = dims.h * 0.35;
        const demo = [
          { x: cx - 50, y: cy - 35, c: P.rose },
          { x: cx + 55, y: cy - 18, c: P.ice },
          { x: cx - 28, y: cy + 48, c: P.lav },
          { x: cx + 38, y: cy + 38, c: P.gold },
        ];
        return (
          <div style={{ flex: 1, position: "relative", cursor: "pointer" }} onClick={() => setBeat(5)}>
            {backBtn(3)}
            {demo.map((st, i) => (
              <div key={i}>
                <div style={{ position: "absolute", left: st.x, top: st.y, transform: "translate(-50%,-50%)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${st.c}14, transparent 70%)` }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: `radial-gradient(circle at 38% 33%, #fff 15%, ${st.c} 55%, transparent 85%)`, boxShadow: `0 0 10px ${st.c}55` }} />
                </div>
                <div style={{ position: "absolute", left: st.x, top: st.y, width: 5, height: 5, borderRadius: "50%", background: st.c, boxShadow: `0 0 8px ${st.c}88`, opacity: 0, animation: `shoot 1.2s ease-in ${0.4 + i * 0.3}s infinite`, "--sX": `${cx - st.x}px`, "--sY": `${cy - st.y}px` }} />
                <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <line x1={st.x} y1={st.y} x2={cx} y2={cy} stroke={st.c} strokeWidth="0.6" strokeDasharray="3,7" opacity="0.15" />
                </svg>
              </div>
            ))}
            <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: `radial-gradient(circle, ${P.mist}14, ${P.lav}0a, transparent 70%)`, animation: "pulseGlow 2s ease-in-out infinite", boxShadow: `0 0 30px ${P.lav}10`, margin: "0 auto" }} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", fontStyle: "italic", color: P.mist, opacity: 0.8, marginTop: 6, letterSpacing: "2px" }}>you</p>
            </div>
            <p style={{ position: "absolute", bottom: 180, left: 0, right: 0, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.65, padding: "0 30px", lineHeight: 1.7, animation: "slowFade 1.5s ease 0.6s both" }}>
              Together, they helped you become who you are.
            </p>
          </div>
        );
      },
      // Beat 5: Self portrait with "because of"
      () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 28px", cursor: "pointer" }} onClick={() => setBeat(6)}>
          {backBtn(4)}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.6, marginBottom: 36, textAlign: "center", lineHeight: 1.6, animation: "slowFade 1.5s ease" }}>
            Tap yourself to see how others have helped you become who you are.
          </p>
          {[{ f: "Safe", names: "Mom, Aisha, David", c: P.rose }, { f: "Brave", names: "Mr. Torres, Priya", c: P.lav }, { f: "Loved", names: "Mom, Aisha", c: P.gold }].map((item, i) => (
            <div key={i} style={{ marginBottom: 24, textAlign: "center", opacity: 0, animation: `slowFade 1.2s ease ${0.5 + i * 0.3}s forwards` }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.75, margin: "0 0 5px" }}>I am {item.f.toLowerCase()}</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", color: item.c, opacity: 0.8, margin: 0 }}>because of {item.names}</p>
              <div style={{ marginTop: 8, height: 2, borderRadius: 1, width: 90, margin: "6px auto 0", background: `linear-gradient(90deg, ${item.c}44, transparent)` }} />
            </div>
          ))}
        </div>
      ),
      // Beat 6: Share card
      () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px", cursor: "pointer" }} onClick={() => setBeat(7)}>
          {backBtn(5)}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.6, marginBottom: 32, textAlign: "center", lineHeight: 1.6, animation: "slowFade 1.5s ease" }}>
            When you want to share the light of your gratitude with someone — show them their star.
          </p>
          {/* Mini share card preview */}
          <div style={{
            width: "85%", maxWidth: 260, background: `linear-gradient(170deg, #0a1020, ${P.bg}ee, #111d35)`,
            borderRadius: 16, border: `1px solid ${P.mist}0a`, padding: "22px 20px",
            boxShadow: `0 4px 40px rgba(0,0,0,0.4)`,
            opacity: 0, animation: "slowFade 1.2s ease 0.4s forwards",
          }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "9px", color: P.rose, opacity: 0.8, letterSpacing: "2px", textTransform: "uppercase", textAlign: "center", margin: "0 0 14px" }}>your star in my sky</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[P.mist, P.ice, P.rose, P.lav].map((c, i) => (
                <div key={i} style={{ width: i === 2 ? 8 : 4, height: i === 2 ? 8 : 4, borderRadius: "50%", background: c, opacity: i === 2 ? 0.7 : 0.12, boxShadow: i === 2 ? `0 0 10px ${c}55` : "none" }} />
              ))}
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}18, transparent)`, margin: "0 0 16px" }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic", color: P.mist, opacity: 0.8, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
              You taught me that panic is a choice.<br />You showed me what a good father looks like.
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "8px", color: P.mist, opacity: 0.6, textAlign: "center", margin: "16px 0 0", letterSpacing: "1.5px" }}>✦ constellate ✦</p>
          </div>
        </div>
      ),
      // Beat 7: Begin
      () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", animation: "slowFade 1.5s ease" }}>
          {backBtn(6)}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.70, textAlign: "center", margin: "0 30px 14px", lineHeight: 1.6 }}>
            Your sky is empty.
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, textAlign: "center", margin: "0 30px 44px" }}>
            Let's find your first star.
          </p>
          <button onClick={() => setBeat(8)} style={{
            background: `linear-gradient(135deg, ${P.lav}12, transparent)`,
            border: `1px solid ${P.lav}22`, borderRadius: "24px", padding: "14px 36px",
            color: P.mist, opacity: 0.6, fontFamily: "'Cormorant Garamond', serif",
            fontSize: "16px", fontStyle: "italic", letterSpacing: "1.5px", cursor: "pointer",
            transition: "opacity 0.3s",
          }} onMouseEnter={e => e.target.style.opacity = "0.65"} onMouseLeave={e => e.target.style.opacity = "0.45"}>
            begin ✦
          </button>
        </div>
      ),
    ];

    return (
      <div ref={ref} style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        background: bg, overflow: "hidden",
      }}>
        <Sky w={dims.w} h={dims.h} />
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          {beats[beat]()}
        </div>
      </div>
    );
  }

  /* ── Entry Flow (beat >= 8) ── */
  return (
    <div ref={ref} style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      padding: "32px 28px 28px", overflowY: "auto", background: bg,
    }}>
      {/* Progress: 2 dots */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {[0, 1].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < collected.length ? COLORS[i] : `${P.mist}15`,
            boxShadow: i < collected.length ? `0 0 8px ${COLORS[i]}55` : "none",
            transition: "all 0.5s",
          }} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {phase !== "prompt" && (
          <button onClick={goBack} style={{
            background: "none", border: "none", color: P.mist, opacity: 0.18,
            fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic",
            cursor: "pointer", padding: "4px 0", alignSelf: "flex-start", marginBottom: 16,
          }}>← back</button>
        )}

        {phase === "prompt" && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", fontWeight: 300,
              fontStyle: "italic", color: P.mist, opacity: promptFade ? 0.55 : 0, lineHeight: 1.65,
              margin: "0 0 28px", transition: "opacity 0.3s ease",
            }}>
              {prompt.q}
            </p>
            <button onClick={nextPrompt} style={{
              display: "block", margin: "0 auto 28px", background: "transparent", border: "none",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic",
              color: P.lav, opacity: 0.6, cursor: "pointer", letterSpacing: "0.5px",
              padding: "4px 0", transition: "opacity 0.3s",
            }}
              onMouseEnter={e => e.target.style.opacity = "0.55"}
              onMouseLeave={e => e.target.style.opacity = "0.35"}
            >try a different question →</button>
            <button onClick={() => setPhase("name")} style={{
              background: "transparent", border: `1px solid ${P.mist}18`, borderRadius: "24px",
              padding: "12px 30px", color: P.mist, opacity: 0.8, fontFamily: "'Cormorant Garamond', serif",
              fontSize: "14px", fontStyle: "italic", letterSpacing: "1px", cursor: "pointer", transition: "opacity 0.3s",
            }} onMouseEnter={e => e.target.style.opacity = "0.55"} onMouseLeave={e => e.target.style.opacity = "0.3"}>
              someone comes to mind
            </button>
          </div>
        )}

        {phase === "name" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", color: P.mist, opacity: 0.7, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 14 }}>their name</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="..." autoFocus style={inp}
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) setPhase("gave"); }} />
            {name.trim() && (
              <button onClick={() => setPhase("gave")} style={{ marginTop: 24, background: "transparent", border: `1px solid ${P.mist}12`, borderRadius: "20px", padding: "10px 24px", color: P.mist, opacity: 0.25, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", cursor: "pointer", display: "block", marginLeft: "auto" }}>next →</button>
            )}
          </div>
        )}

        {phase === "gave" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", color: P.mist, opacity: 0.7, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 14 }}>how did {appName(name)} show up for you?</p>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <textarea value={gave} onChange={e => setGave(e.target.value)} placeholder="..." autoFocus rows={3} style={{ ...inp, resize: "none", lineHeight: 1.6, flex: 1 }} />
              <MicButton onResult={setGave} color={COLORS[entryNum]} />
            </div>
            {gave.trim() && (
              <button onClick={() => setPhase("impact")} style={{ marginTop: 20, background: "transparent", border: `1px solid ${P.mist}12`, borderRadius: "20px", padding: "10px 24px", color: P.mist, opacity: 0.25, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", cursor: "pointer", display: "block", marginLeft: "auto" }}>next →</button>
            )}
          </div>
        )}

        {phase === "impact" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.6, marginBottom: 18 }}>{prompt.hint}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {FEELINGS.map(f => (
                <button key={f} onClick={() => toggleF(f)} style={{
                  background: feelings.includes(f) ? `${P.lav}18` : "transparent",
                  border: `1px solid ${feelings.includes(f) ? P.lav + "40" : P.mist + "10"}`,
                  borderRadius: "15px", padding: "5px 13px",
                  color: feelings.includes(f) ? P.lav : P.mist,
                  opacity: feelings.includes(f) ? 0.65 : 0.22,
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "12.5px", fontStyle: "italic", cursor: "pointer", transition: "all 0.2s",
                }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <textarea value={impact} onChange={e => setImpact(e.target.value)} placeholder="or in your own words..." rows={2} style={{ ...inp, resize: "none", fontSize: "15px", lineHeight: 1.6, flex: 1 }} />
              <MicButton onResult={setImpact} color={COLORS[entryNum]} />
            </div>
            {(impact.trim() || feelings.length > 0) && (
              <button onClick={submitEntry} style={{
                marginTop: 22, background: `linear-gradient(135deg, ${COLORS[entryNum]}15, transparent)`,
                border: `1px solid ${COLORS[entryNum]}25`, borderRadius: "24px", padding: "12px 30px",
                color: P.mist, opacity: 0.6, fontFamily: "'Cormorant Garamond', serif", fontSize: "14px",
                fontStyle: "italic", letterSpacing: "1px", cursor: "pointer", display: "block", marginLeft: "auto",
              }}>add this star ✦</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Star orb ── */
function StarOrb({ person, x, y, maxE, onTap, faded }) {
  const int = person.entries.length / Math.max(maxE, 1);
  const core = 8 + int * 12;
  const halo = core * (2.8 + int * 1.8);
  return (
    <div onClick={() => onTap(person)} style={{
      position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)",
      cursor: "pointer", transition: "opacity 0.8s, filter 0.8s",
      opacity: faded ? 0.06 : 1, filter: faded ? "blur(3px)" : "none", zIndex: 5,
    }}>
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: halo, height: halo, borderRadius: "50%",
        background: `radial-gradient(circle, ${person.color}18 0%, ${person.color}08 40%, transparent 70%)`,
        animation: `breathe ${3 + Math.random() * 2}s ease-in-out infinite`,
      }} />
      <div style={{
        width: core, height: core, borderRadius: "50%",
        background: `radial-gradient(circle at 38% 33%, #fff ${10 + int * 18}%, ${person.color} 55%, ${person.color}66 85%)`,
        boxShadow: `0 0 ${core * 1.2}px ${core * 0.5}px ${person.color}55, 0 0 ${core * 3}px ${core}px ${person.color}18`,
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: "22%", left: "28%", width: "32%", height: "28%", borderRadius: "50%", background: "rgba(255,255,255,0.55)", filter: "blur(1.5px)" }} />
      </div>
      <div style={{
        position: "absolute", top: core / 2 + 16, left: "50%", transform: "translateX(-50%)",
        whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif", fontSize: "12px",
        color: person.color, opacity: faded ? 0 : 0.55, letterSpacing: "0.5px",
        textShadow: `0 0 10px ${person.color}33`, transition: "opacity 0.6s",
      }}>{starName(person.name)}</div>
    </div>
  );
}

/* ── Center cluster ── */
function CenterCluster({ people, cx, cy, onTap }) {
  const total = people.reduce((s, p) => s + p.entries.length, 0);
  const clusterR = 18 + Math.min(total * 1.5, 40);
  const coreSize = 14 + Math.min(total * 0.8, 12);
  const stars = useMemo(() => {
    const arr = [];
    people.forEach(p => p.entries.forEach((_, ei) => {
      const a = Math.random() * Math.PI * 2;
      const r = coreSize * 0.6 + Math.random() * (clusterR - coreSize * 0.6);
      arr.push({ k: `${p.id}-${ei}`, x: Math.cos(a) * r, y: Math.sin(a) * r, s: 0.8 + Math.random() * 2, c: p.color, o: 0.3 + Math.random() * 0.5, td: 2 + Math.random() * 4 });
    }));
    return arr;
  }, [people, total, clusterR, coreSize]);

  return (
    <div onClick={onTap} style={{
      position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)",
      zIndex: 6, cursor: "pointer",
    }}>
      {/* Outer aura */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: clusterR * 4.5, height: clusterR * 4.5, borderRadius: "50%",
        background: `radial-gradient(circle, ${P.lav}0a 0%, ${P.gold}06 25%, ${P.rose}04 45%, transparent 65%)`,
        animation: "clusterPulse 6s ease-in-out infinite",
      }} />
      {/* Inner glow */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: clusterR * 2.5, height: clusterR * 2.5, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(248,250,252,0.08) 0%, ${P.lav}06 40%, transparent 65%)`,
      }} />
      {/* Orbiting star dots */}
      {stars.map(s => <div key={s.k} style={{
        position: "absolute", left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`,
        width: s.s, height: s.s, borderRadius: "50%", background: s.c, opacity: s.o,
        boxShadow: `0 0 ${s.s * 2.5}px ${s.c}55`,
        transform: "translate(-50%,-50%)",
        animation: `twinkle ${s.td}s ease-in-out ${-Math.random() * 5}s infinite`,
      }} />)}
      {/* Core orb — visible "you" */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: coreSize, height: coreSize, borderRadius: "50%",
        background: `radial-gradient(circle at 38% 33%, rgba(255,255,255,0.35) 0%, ${P.lav}44 40%, ${P.mist}15 70%, transparent 85%)`,
        boxShadow: `0 0 ${coreSize}px ${coreSize * 0.4}px ${P.lav}20, 0 0 ${coreSize * 2.5}px ${coreSize}px ${P.mist}08`,
      }} />
      {/* Label */}
      <div style={{
        position: "absolute", top: clusterR + 16, left: "50%", transform: "translateX(-50%)",
        whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif",
        fontSize: "11px", fontWeight: 300, fontStyle: "italic",
        color: P.mist, opacity: 0.6, letterSpacing: "2px", textTransform: "lowercase",
      }}>you</div>
    </div>
  );
}

/* ── Shooting stars ── */
function Shooters({ stars }) {
  return <>{stars.map(s => <div key={s.key} style={{
    position: "absolute", left: s.fx, top: s.fy, width: 5, height: 5, borderRadius: "50%",
    background: s.color, boxShadow: `0 0 8px 3px ${s.color}99, 0 0 18px 5px ${s.color}33`,
    opacity: 0, pointerEvents: "none", zIndex: 8,
    animation: `shoot 1s ease-in ${s.delay}s forwards`,
    "--sX": `${s.tx - s.fx}px`, "--sY": `${s.ty - s.fy}px`,
  }} />)}</>;
}

/* ── Share Card ── */
function ShareCard({ person, allPeople, positions, cx, cy, onClose }) {
  const [phase, setPhase] = useState("curate");
  const [toggled, setToggled] = useState(() => person.entries.map(() => true));
  const [editedTexts, setEditedTexts] = useState(() => person.entries.map(e => e.text));
  const [greeting, setGreeting] = useState(`Dear ${starName(person.name)},`);
  const [opening, setOpening] = useState("There are people who help us become who we are — often without knowing it. You are one of those people for me.");
  const [closing, setClosing] = useState("I carry a little of you with me, everywhere I go.\nThank you for being part of who I am.");
  const [signoff, setSignoff] = useState("With gratitude ✦");
  const [editingIdx, setEditingIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef(null);

  const selectedEntries = person.entries.filter((_, i) => toggled[i]).map((e) => {
    const origIdx = person.entries.indexOf(e);
    return { ...e, text: editedTexts[origIdx] };
  });
  const toggle = i => setToggled(p => p.map((v, j) => j === i ? !v : v));
  const updateText = (i, val) => setEditedTexts(p => p.map((v, j) => j === i ? val : v));

  // Load html2canvas from CDN
  const loadH2C = () => new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error("Failed to load"));
    document.head.appendChild(s);
  });

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const h2c = await loadH2C();
      const canvas = await h2c(cardRef.current, { backgroundColor: "#0a1020", scale: 2, useCORS: true });
      // Try native share first (mobile)
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          try {
            const file = new File([blob], "constellate-letter.png", { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "Constellate" });
            } else { fallbackDownload(canvas); }
          } catch { fallbackDownload(canvas); }
          setSaving(false);
        }, "image/png");
        return;
      }
      fallbackDownload(canvas);
    } catch { setSaving(false); }
  };

  const fallbackDownload = (canvas) => {
    const link = document.createElement("a");
    link.download = `constellate-${starName(person.name).toLowerCase().replace(/\s/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setSaving(false);
  };

  const miniW = 280, miniH = 200, mCx = miniW / 2, mCy = miniH / 2;
  const maxE = Math.max(...allPeople.map(p => p.entries.length), 1);
  const miniPos = useMemo(() => {
    const sorted = [...allPeople].sort((a, b) => b.entries.length - a.entries.length);
    const maxR = Math.min(miniW, miniH) * 0.36, minR = 28, golden = 2.399963;
    return sorted.map((p, i) => {
      const ratio = p.entries.length / maxE;
      const r = minR + (1 - ratio) * (maxR - minR);
      const a = i * golden - Math.PI / 2;
      const hash = p.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      return { p, x: mCx + Math.cos(a) * r + Math.sin(hash * 0.7) * 5, y: mCy + Math.sin(a) * r + Math.cos(hash * 1.3) * 5 };
    });
  }, [allPeople, maxE]);

  const taStyle = {
    width: "100%", boxSizing: "border-box", background: `${P.mist}05`,
    border: `1px solid ${P.mist}0a`, borderRadius: 10,
    color: P.mist, fontFamily: "'Cormorant Garamond', serif",
    fontSize: "15px", fontWeight: 300, fontStyle: "italic",
    padding: "12px 14px", outline: "none", opacity: 0.7,
    resize: "none", lineHeight: 1.6,
  };

  /* ── Curation Phase ── */
  if (phase === "curate") {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: `linear-gradient(180deg, ${P.bg} 0%, #0c1322 100%)`,
        animation: "fadeUp 0.45s ease", overflowY: "auto",
      }}>
        <div style={{ padding: "24px 22px 10px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: P.mist, opacity: 0.7, fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", cursor: "pointer", padding: "8px 0" }}>← back</button>
        </div>
        <div style={{ textAlign: "center", padding: "8px 24px 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: P.mist, margin: 0, opacity: 0.8 }}>
            A letter for {appName(person.name)}
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", color: person.color, opacity: 0.8, marginTop: 8, letterSpacing: "1.5px" }}>edit anything to make it yours</p>
        </div>

        <div style={{ padding: "0 24px 12px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: P.mist, opacity: 0.6, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>greeting</p>
          <input value={greeting} onChange={e => setGreeting(e.target.value)} style={{ ...taStyle, borderRadius: 8, padding: "10px 14px" }} />
        </div>
        <div style={{ padding: "0 24px 16px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: P.mist, opacity: 0.6, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>opening</p>
          <textarea value={opening} onChange={e => setOpening(e.target.value)} rows={3} style={taStyle} />
        </div>

        <div style={{ padding: "0 24px 16px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: P.mist, opacity: 0.6, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>moments to include</p>
          {person.entries.map((entry, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, opacity: toggled[i] ? 1 : 0.3, transition: "opacity 0.3s" }}>
              <button onClick={() => toggle(i)} style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                background: toggled[i] ? `radial-gradient(circle, #fff 15%, ${person.color} 55%, transparent 85%)` : "transparent",
                border: `1.5px solid ${toggled[i] ? person.color + "55" : P.mist + "15"}`,
                boxShadow: toggled[i] ? `0 0 8px ${person.color}33` : "none", cursor: "pointer", transition: "all 0.3s",
              }} />
              <div style={{ flex: 1 }}>
                {editingIdx === i ? (
                  <textarea value={editedTexts[i]} onChange={e => updateText(i, e.target.value)}
                    onBlur={() => setEditingIdx(null)} autoFocus rows={2}
                    style={{ ...taStyle, background: "transparent", border: "none", borderBottom: `1px solid ${person.color}22`, borderRadius: 0, padding: "4px 0", fontSize: "14px" }} />
                ) : (
                  <p onClick={() => { if (toggled[i]) setEditingIdx(i); }} style={{
                    fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", lineHeight: 1.6,
                    color: P.mist, margin: 0, fontWeight: 300, fontStyle: "italic",
                    opacity: 0.65, cursor: toggled[i] ? "text" : "default",
                  }}>{editedTexts[i]} {toggled[i] && <span style={{ fontSize: "10px", opacity: 0.6 }}>✎</span>}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 24px 12px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: P.mist, opacity: 0.6, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>closing</p>
          <textarea value={closing} onChange={e => setClosing(e.target.value)} rows={2} style={taStyle} />
        </div>
        <div style={{ padding: "0 24px 28px" }}>
          <input value={signoff} onChange={e => setSignoff(e.target.value)} style={{ ...taStyle, borderRadius: 8, padding: "10px 14px" }} />
        </div>

        {selectedEntries.length > 0 && (
          <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
            <button onClick={() => setPhase("preview")} style={{
              background: `linear-gradient(135deg, ${person.color}18, ${person.color}08)`,
              border: `1px solid ${person.color}28`, borderRadius: "26px", padding: "14px 34px",
              color: P.mist, opacity: 0.65, fontFamily: "'Cormorant Garamond', serif",
              fontSize: "14px", fontStyle: "italic", letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.3s",
            }} onMouseEnter={e => e.target.style.opacity = "0.8"} onMouseLeave={e => e.target.style.opacity = "0.65"}>
              preview letter ✦
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Preview Phase: the beautiful card ── */
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
      background: `linear-gradient(180deg, #060a14 0%, ${P.bg} 100%)`,
      animation: "fadeUp 0.5s ease", overflowY: "auto",
    }}>
      <div style={{ padding: "20px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, position: "relative" }}>
        <button onClick={() => setPhase("curate")} style={{ background: "none", border: "none", color: P.mist, opacity: 0.7, fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", cursor: "pointer", padding: "8px 0" }}>← edit</button>
      </div>

      {/* ── THE CARD (captured for image) ── */}
      <div style={{ padding: "12px 16px 20px" }}>
        <div ref={cardRef} style={{
          background: `linear-gradient(170deg, #0a1020 0%, #111a2e 35%, #0f1828 70%, #0d1525 100%)`,
          borderRadius: 20, overflow: "hidden",
          border: `1px solid ${P.mist}08`,
          boxShadow: `0 4px 60px rgba(0,0,0,0.5)`,
          padding: "0 0 4px",
        }}>
          {/* Constellation */}
          <div style={{ position: "relative", height: miniH + 40, overflow: "hidden" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
                width: 0.5 + (i % 3) * 0.4, height: 0.5 + (i % 3) * 0.4,
                borderRadius: "50%", background: P.mist, opacity: 0.05 + (i % 4) * 0.04,
              }} />
            ))}
            <svg width={miniW} height={miniH} viewBox={`0 0 ${miniW} ${miniH}`} style={{ display: "block", margin: "20px auto 0" }}>
              {miniPos.map(({ p, x, y }) => {
                const isTarget = p.id === person.id;
                return <line key={`ml-${p.id}`} x1={x} y1={y} x2={mCx} y2={mCy}
                  stroke={p.color} strokeWidth={isTarget ? 0.8 : 0.4}
                  strokeDasharray={isTarget ? "none" : "2,5"} opacity={isTarget ? 0.3 : 0.06} />;
              })}
              {allPeople.map((p, i) => {
                const a = (i / allPeople.length) * Math.PI * 2;
                return <circle key={`mc-${p.id}`} cx={mCx + Math.cos(a) * 4} cy={mCy + Math.sin(a) * 4} r={1.5} fill={p.color} opacity={0.5} />;
              })}
              {miniPos.filter(({ p }) => p.id !== person.id).map(({ p, x, y }) => (
                <circle key={`ms-${p.id}`} cx={x} cy={y} r={2 + (p.entries.length / maxE) * 2.5} fill={p.color} opacity={0.1} />
              ))}
              {miniPos.filter(({ p }) => p.id === person.id).map(({ p, x, y }) => {
                const sz = 4 + (p.entries.length / maxE) * 4;
                return (
                  <g key={`mh-${p.id}`}>
                    <circle cx={x} cy={y} r={sz * 2.5} fill={p.color} opacity="0.08" />
                    <circle cx={x} cy={y} r={sz * 1.5} fill={p.color} opacity="0.15" />
                    <circle cx={x} cy={y} r={sz} fill={p.color} opacity="0.6" />
                    <circle cx={x} cy={y} r={sz * 0.4} fill="white" opacity="0.6" />
                    <text x={x} y={y + sz + 12} textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="10" fontStyle="italic" fill={p.color} opacity="0.7">{shareName(p.name)}</text>
                  </g>
                );
              })}
              <text x={mCx} y={mCy + 16} textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="8" fontStyle="italic" fill={P.mist} opacity="0.3">me</text>
            </svg>
            <p style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "10.5px", fontStyle: "italic", color: P.mist, opacity: 0.7, letterSpacing: "2px", margin: "8px 0 0" }}>your star in my sky</p>
          </div>

          <div style={{ height: 1, margin: "0 36px", background: `linear-gradient(90deg, transparent, ${person.color}20, transparent)` }} />

          {/* ── The Letter ── */}
          <div style={{ padding: "28px 30px 24px" }}>
            {/* Greeting */}
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.85, margin: "0 0 22px" }}>{greeting}</p>

            {/* Opening */}
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.8, margin: "0 0 22px" }}>{opening}</p>

            {/* Entries flowing as sentences */}
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.75, lineHeight: 1.85, margin: "0 0 26px" }}>
              {selectedEntries.map((e, i) => e.text + (i < selectedEntries.length - 1 ? ". " : ".")).join("")}
            </p>

            {/* Closing */}
            {closing.split("\n").map((line, i) => (
              <p key={i} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.8, margin: "2px 0" }}>{line}</p>
            ))}

            {/* Sign-off */}
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontWeight: 400, color: person.color, opacity: 0.8, margin: "18px 0 0" }}>{signoff}</p>
          </div>

          {/* Branding */}
          <div style={{ padding: "12px 28px 18px", textAlign: "center", borderTop: `1px solid ${P.mist}06` }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "9px", color: P.mist, opacity: 0.6, letterSpacing: "2.5px", margin: 0 }}>✦ constellate ✦</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 24px 44px", display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setPhase("curate")} style={{
          background: "transparent", border: `1px solid ${P.mist}15`, borderRadius: "22px",
          padding: "12px 24px", color: P.mist, opacity: 0.7,
          fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic",
          cursor: "pointer", transition: "opacity 0.3s",
        }} onMouseEnter={e => e.target.style.opacity = "0.6"} onMouseLeave={e => e.target.style.opacity = "0.45"}>
          edit
        </button>
        <button onClick={downloadImage} disabled={saving} style={{
          background: `linear-gradient(135deg, ${person.color}18, ${person.color}08)`,
          border: `1px solid ${person.color}28`, borderRadius: "22px",
          padding: "12px 28px", color: person.color, opacity: saving ? 0.3 : 0.65,
          fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic",
          letterSpacing: "1px", cursor: saving ? "wait" : "pointer", transition: "all 0.3s",
        }} onMouseEnter={e => { if (!saving) e.target.style.opacity = "0.8"; }}
           onMouseLeave={e => { if (!saving) e.target.style.opacity = "0.65"; }}>
          {saving ? "saving..." : "share as image ✦"}
        </button>
      </div>
    </div>
  );
}

/* ── Person Timeline ── */
function PersonView({ person, onClose, onShare, onAddMore, onUpdate, onDelete }) {
  const [vis, setVis] = useState(0);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState(person.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // null | 'entry-N' | 'person'

  useEffect(() => { setVis(0); const t = setInterval(() => setVis(p => p >= person.entries.length ? (clearInterval(t), p) : p + 1), 150); return () => clearInterval(t); }, [person]);

  const startEditEntry = (i) => { setEditText(person.entries[i].text); setEditingIdx(i); };
  const saveEditEntry = () => {
    if (editingIdx === null) return;
    const updated = { ...person, entries: person.entries.map((e, i) => i === editingIdx ? { ...e, text: editText.trim() || e.text } : e) };
    onUpdate(updated);
    setEditingIdx(null);
  };
  const deleteEntry = (i) => {
    if (person.entries.length <= 1) { setShowDeleteConfirm("person"); return; }
    const updated = { ...person, entries: person.entries.filter((_, j) => j !== i) };
    onUpdate(updated);
    setShowDeleteConfirm(null);
  };
  const saveName = () => {
    if (nameText.trim() && nameText.trim() !== person.name) {
      onUpdate({ ...person, name: nameText.trim() });
    }
    setEditingName(false);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column",
      background: `linear-gradient(180deg, ${P.bg} 0%, #0c1322 50%, ${P.bg} 100%)`,
      animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)", overflowY: "auto",
    }}>
      <div style={{ padding: "24px 22px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: P.mist, opacity: 0.2, fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", cursor: "pointer", padding: "8px 0" }}>← back</button>
        <button onClick={() => setShowDeleteConfirm("person")} style={{ background: "none", border: "none", color: "#ff6b6b", opacity: 0.2, fontSize: "11px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", cursor: "pointer", padding: "8px 0", letterSpacing: "1px" }}>remove star</button>
      </div>
      <div style={{ textAlign: "center", padding: "12px 20px 36px" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", margin: "0 auto 18px",
          background: `radial-gradient(circle at 38% 33%, #fff 10%, ${person.color} 45%, ${person.color}44 75%, transparent 90%)`,
          boxShadow: `0 0 35px 12px ${person.color}33, 0 0 70px 22px ${person.color}12`,
        }} />
        {editingName ? (
          <input value={nameText} onChange={e => setNameText(e.target.value)} onBlur={saveName}
            onKeyDown={e => { if (e.key === "Enter") saveName(); }}
            autoFocus style={{
              background: "transparent", border: "none", borderBottom: `1px solid ${person.color}33`,
              fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, fontStyle: "italic",
              color: P.mist, opacity: 0.75, textAlign: "center", outline: "none", width: "80%",
            }} />
        ) : (
          <h2 onClick={() => setEditingName(true)} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, fontStyle: "italic", color: P.mist, margin: 0, opacity: 0.85, cursor: "pointer" }}>
            {appName(person.name)}
            <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: 6, verticalAlign: "middle" }}>✎</span>
          </h2>
        )}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: person.color, opacity: 0.8, marginTop: 8, letterSpacing: "2.5px", textTransform: "uppercase" }}>
          {person.entries.length} {person.entries.length === 1 ? "star" : "stars"} in my sky
        </p>
      </div>
      <div style={{ padding: "0 26px 40px", position: "relative" }}>
        <div style={{ position: "absolute", left: 33, top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, ${person.color}25, ${person.color}05)` }} />
        {person.entries.map((entry, i) => (
          <div key={i} style={{
            display: "flex", gap: 18, marginBottom: 28, alignItems: "flex-start",
            opacity: i < vis ? 1 : 0, transform: i < vis ? "translateY(0)" : "translateY(14px)",
            transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: `radial-gradient(circle at 35% 30%, #fff 20%, ${person.color})`, boxShadow: `0 0 8px 3px ${person.color}40`, position: "relative", zIndex: 2 }} />
            <div style={{ flex: 1 }}>
              {editingIdx === i ? (
                <div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus rows={3}
                    style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: `1px solid ${person.color}22`, color: P.mist, fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, fontStyle: "italic", padding: "4px 0", outline: "none", opacity: 0.6, resize: "none", lineHeight: 1.6 }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={saveEditEntry} style={{ background: "none", border: "none", color: person.color, opacity: 0.8, fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic", cursor: "pointer" }}>save</button>
                    <button onClick={() => setEditingIdx(null)} style={{ background: "none", border: "none", color: P.mist, opacity: 0.2, fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic", cursor: "pointer" }}>cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p onClick={() => startEditEntry(i)} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15.5px", lineHeight: 1.65, color: P.mist, margin: 0, fontWeight: 300, fontStyle: "italic", opacity: 0.70, cursor: "pointer" }}>
                    {entry.text}
                  </p>
                  {(entry.impact || (entry.feelings && entry.feelings.length > 0)) && (
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", lineHeight: 1.5, color: person.color, margin: "5px 0 0", fontWeight: 300, opacity: 0.8 }}>
                      → {entry.feelings?.length ? entry.feelings.join(", ").toLowerCase() : ""}{entry.impact ? (entry.feelings?.length ? " · " : "") + entry.impact : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: person.color, opacity: 0.6, letterSpacing: "0.5px", margin: 0 }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <button onClick={() => setShowDeleteConfirm(`entry-${i}`)} style={{ background: "none", border: "none", color: "#ff6b6b", opacity: 0.15, fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", fontStyle: "italic", cursor: "pointer", padding: 0 }}>remove</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 26px 48px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <button onClick={onAddMore} style={{ background: `linear-gradient(135deg, ${person.color}14, ${person.color}06)`, border: `1px solid ${person.color}22`, borderRadius: "26px", padding: "13px 30px", color: person.color, opacity: 0.7, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", letterSpacing: "1.5px", textTransform: "lowercase", cursor: "pointer", fontStyle: "italic", transition: "all 0.3s", width: "fit-content" }}
          onMouseEnter={e => e.target.style.opacity = "0.65"} onMouseLeave={e => e.target.style.opacity = "0.45"}
        >add another moment ✦</button>
        <button onClick={onShare} style={{ background: "transparent", border: `1px solid ${person.color}18`, borderRadius: "26px", padding: "13px 30px", color: person.color, opacity: 0.6, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", letterSpacing: "2px", textTransform: "lowercase", cursor: "pointer", fontStyle: "italic", transition: "all 0.3s", width: "fit-content" }}
          onMouseEnter={e => e.target.style.opacity = "0.5"} onMouseLeave={e => e.target.style.opacity = "0.3"}
        >create something to share</button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "slowFade 0.3s ease",
        }} onClick={() => setShowDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: `linear-gradient(180deg, ${P.bg}, #0c1322)`,
            border: `1px solid ${P.mist}10`, borderRadius: 16,
            padding: "28px 24px", maxWidth: 280, textAlign: "center",
          }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: P.mist, opacity: 0.75, lineHeight: 1.6, margin: "0 0 20px" }}>
              {showDeleteConfirm === "person"
                ? `Remove ${appName(person.name)} from your sky?`
                : "Remove this moment?"}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{
                background: "transparent", border: `1px solid ${P.mist}15`, borderRadius: "20px",
                padding: "10px 22px", color: P.mist, opacity: 0.8, fontFamily: "'Cormorant Garamond', serif",
                fontSize: "13px", fontStyle: "italic", cursor: "pointer",
              }}>keep</button>
              <button onClick={() => {
                if (showDeleteConfirm === "person") {
                  onDelete(person.id);
                } else {
                  const idx = parseInt(showDeleteConfirm.split("-")[1]);
                  deleteEntry(idx);
                }
              }} style={{
                background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: "20px",
                padding: "10px 22px", color: "#ff6b6b", opacity: 0.75, fontFamily: "'Cormorant Garamond', serif",
                fontSize: "13px", fontStyle: "italic", cursor: "pointer",
              }}>remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Self Portrait: "I am" ── */
function SelfPortrait({ people, onClose }) {
  const feelMap = {};
  people.forEach(p => p.entries.forEach(e => {
    (e.feelings || []).forEach(f => {
      if (!feelMap[f]) feelMap[f] = new Map();
      feelMap[f].set(p.id, { name: appName(p.name), color: p.color });
    });
  }));
  const sorted = Object.entries(feelMap).map(([f, m]) => [f, [...m.values()]]).sort((a, b) => b[1].length - a[1].length);

  const customs = [];
  people.forEach(p => p.entries.forEach(e => {
    if (e.impact && e.impact.trim()) customs.push({ impact: e.impact, name: appName(p.name), color: p.color });
  }));
  const uniqueCustoms = [...new Map(customs.map(c => [c.impact + c.name, c])).values()];

  const hasChips = sorted.length > 0;
  const hasCustom = uniqueCustoms.length > 0;
  const isEmpty = !hasChips && !hasCustom;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column",
      background: `linear-gradient(180deg, ${P.bg} 0%, #0c1322 50%, ${P.bg} 100%)`,
      animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)", overflowY: "auto",
    }}>
      <div style={{ padding: "24px 22px 10px" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: P.mist, opacity: 0.2, fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", cursor: "pointer", padding: "8px 0" }}>← back</button>
      </div>
      <div style={{ textAlign: "center", padding: "12px 20px 32px" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: P.lav, opacity: 0.8, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>who I am because of everyone I've met</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, fontStyle: "italic", color: P.mist, margin: 0, opacity: 0.75 }}>My portrait</h2>
      </div>

      {isEmpty && (
        <div style={{ padding: "20px 28px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.6 }}>
            Your portrait is just beginning. As you add more moments and reflect on what they made possible, this will fill with who you've become.
          </p>
        </div>
      )}

      {hasChips && (
        <div style={{ padding: "0 26px 24px" }}>
          {sorted.map(([feeling, sources], fi) => (
            <div key={feeling} style={{ marginBottom: 26, opacity: 0, animation: `fadeUp 0.5s ease ${fi * 0.08}s forwards` }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.75, margin: "0 0 6px" }}>
                I am {feeling.toLowerCase()}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 2, alignItems: "center" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", color: P.mist, opacity: 0.7 }}>because of</span>
                {sources.map((s, i) => (
                  <span key={i} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", color: s.color, opacity: 0.6 }}>
                    {s.name}{i < sources.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 7, height: 2, borderRadius: 1, width: `${Math.min(sources.length * 20, 100)}%`, background: `linear-gradient(90deg, ${sources[0]?.color || P.lav}44, transparent)` }} />
            </div>
          ))}
        </div>
      )}

      {hasCustom && (
        <div style={{ padding: "0 26px 44px" }}>
          {hasChips && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: P.mist, opacity: 0.6, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>in their words, through mine</p>
          )}
          {!hasChips && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: P.mist, opacity: 0.6, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>what they made possible</p>
          )}
          {uniqueCustoms.map((c, i) => (
            <div key={i} style={{ marginBottom: 16, opacity: 0, animation: `fadeUp 0.4s ease ${(sorted.length + i) * 0.08}s forwards` }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14.5px", fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>"{c.impact}"</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: c.color, opacity: 0.7, marginTop: 3 }}>— because of {c.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Add Entry ── */
function AddEntry({ people, onAdd, onClose, mode = "free", prefillName = "" }) {
  const [name, setName] = useState(prefillName);
  const [gave, setGave] = useState("");
  const [impact, setImpact] = useState("");
  const [feelings, setFeelings] = useState([]);
  const [step, setStep] = useState(prefillName ? "gave" : "name");
  const [promptIdx, setPromptIdx] = useState(Math.floor(Date.now() / 86400000) % DAILY.length);
  const [promptFade, setPromptFade] = useState(true);
  const toggleF = f => setFeelings(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const sug = name.trim() ? people.filter(p => p.name.toLowerCase().includes(name.toLowerCase())).slice(0, 3) : [];

  const nextPrompt = () => {
    setPromptFade(false);
    setTimeout(() => {
      setPromptIdx(p => (p + 1) % DAILY.length);
      setPromptFade(true);
    }, 300);
  };

  const goBack = () => {
    if (step === "impact") setStep("gave");
    else if (step === "gave") setStep("name");
    else onClose();
  };

  const inp = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: `1px solid ${P.mist}12`, color: P.mist, fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", padding: "12px 0", outline: "none", opacity: 0.65 };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 40,
      background: `linear-gradient(180deg, ${P.bg}f8 0%, ${P.night}f8 100%)`,
      backdropFilter: "blur(20px)", display: "flex", flexDirection: "column",
      padding: 24, animation: "fadeUp 0.4s ease", overflowY: "auto",
    }}>
      <button onClick={goBack} style={{ background: "none", border: "none", color: P.mist, opacity: 0.18, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", cursor: "pointer", padding: "6px 0", alignSelf: "flex-start", marginBottom: 14 }}>← back</button>

      {mode === "prompt" && (
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300,
            fontStyle: "italic", color: P.mist, opacity: promptFade ? 0.45 : 0, lineHeight: 1.65,
            margin: "0 0 16px", transition: "opacity 0.3s ease",
          }}>{DAILY[promptIdx]}</p>
          <button onClick={nextPrompt} style={{
            background: "transparent", border: "none", padding: "4px 0",
            fontFamily: "'Cormorant Garamond', serif", fontSize: "12px",
            fontStyle: "italic", color: P.lav, opacity: 0.6, cursor: "pointer",
            letterSpacing: "0.5px", transition: "opacity 0.3s",
          }}
            onMouseEnter={e => e.target.style.opacity = "0.55"}
            onMouseLeave={e => e.target.style.opacity = "0.35"}
          >try a different question →</button>
        </div>
      )}
      {mode === "free" && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.7, lineHeight: 1.6, marginBottom: 32 }}>Add a new star to your sky.</p>
      )}

      {step === "name" && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", color: P.mist, opacity: 0.6, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>who?</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="their name" autoFocus style={inp}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStep("gave"); }} />
          {sug.map(s => (
            <button key={s.id} onClick={() => { setName(s.name); setStep("gave"); }} style={{ display: "block", background: "transparent", border: "none", color: s.color, opacity: 0.7, fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontStyle: "italic", cursor: "pointer", padding: "8px 0" }}>{s.name}</button>
          ))}
          {name.trim() && (
            <button onClick={() => setStep("gave")} style={{ marginTop: 22, background: "transparent", border: `1px solid ${P.mist}10`, borderRadius: "20px", padding: "10px 22px", color: P.mist, opacity: 0.22, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", cursor: "pointer", display: "block", marginLeft: "auto" }}>next →</button>
          )}
        </div>
      )}

      {step === "gave" && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", color: P.mist, opacity: 0.6, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>how did {appName(name)} show up for you?</p>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <textarea value={gave} onChange={e => setGave(e.target.value)} placeholder="..." autoFocus rows={3} style={{ ...inp, resize: "none", lineHeight: 1.6, flex: 1 }} />
            <MicButton onResult={setGave} color={P.lav} />
          </div>
          {gave.trim() && (
            <button onClick={() => setStep("impact")} style={{ marginTop: 18, background: "transparent", border: `1px solid ${P.mist}10`, borderRadius: "20px", padding: "10px 22px", color: P.mist, opacity: 0.22, fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontStyle: "italic", cursor: "pointer", display: "block", marginLeft: "auto" }}>next →</button>
          )}
        </div>
      )}

      {step === "impact" && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.6, marginBottom: 16 }}>And what did that make possible for you?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {FEELINGS.map(f => (
              <button key={f} onClick={() => toggleF(f)} style={{
                background: feelings.includes(f) ? `${P.lav}18` : "transparent",
                border: `1px solid ${feelings.includes(f) ? P.lav + "38" : P.mist + "0d"}`,
                borderRadius: "14px", padding: "5px 12px",
                color: feelings.includes(f) ? P.lav : P.mist,
                opacity: feelings.includes(f) ? 0.6 : 0.2,
                fontFamily: "'Cormorant Garamond', serif", fontSize: "12.5px", fontStyle: "italic", cursor: "pointer", transition: "all 0.2s",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <textarea value={impact} onChange={e => setImpact(e.target.value)} placeholder="or in your own words..." rows={2} style={{ ...inp, resize: "none", fontSize: "15px", lineHeight: 1.6, flex: 1 }} />
            <MicButton onResult={setImpact} color={P.lav} />
          </div>
          {(impact.trim() || feelings.length > 0) && (
            <button onClick={() => onAdd({ name: name.trim(), text: gave.trim(), impact: impact.trim(), feelings: [...feelings], date: new Date().toISOString().split("T")[0] })} style={{
              marginTop: 20, background: `linear-gradient(135deg, ${P.lav}12, transparent)`,
              border: `1px solid ${P.lav}20`, borderRadius: "24px", padding: "12px 28px",
              color: P.mist, opacity: 0.8, fontFamily: "'Cormorant Garamond', serif", fontSize: "14px",
              fontStyle: "italic", letterSpacing: "1px", cursor: "pointer", display: "block", marginLeft: "auto",
            }}>add this star ✦</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Afterglow ── */
function Afterglow({ color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 55, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      background: `linear-gradient(180deg, ${P.bg}f2 0%, ${P.night}f2 100%)`,
      backdropFilter: "blur(20px)", animation: "fadeUp 0.6s ease",
    }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", marginBottom: 34, background: `radial-gradient(circle, #fff 18%, ${color} 55%, transparent 85%)`, boxShadow: `0 0 24px 10px ${color}44, 0 0 55px 18px ${color}15`, animation: "pulseGlow 2s ease-in-out infinite" }} />
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8 }}>That's now part of who you are.</p>
    </div>
  );
}

/* ── Sign In Overlay ── */
function SignInOverlay({ onSignIn, onSkip }) {
  const [signingIn, setSigningIn] = useState(false);

  const handleAuth = (provider) => {
    setSigningIn(true);
    // In production: supabase.auth.signInWithOAuth({ provider })
    // For now, simulate auth
    setTimeout(() => {
      onSignIn({ provider, id: `user-${Date.now()}`, name: provider === "google" ? "You" : "You" });
    }, 800);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 70,
      background: `linear-gradient(180deg, #060a16 0%, ${P.bg} 40%, ${P.night} 70%, #0d1525 100%)`,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      padding: "40px 28px", animation: "slowFade 1s ease",
    }}>
      {/* Stars background */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          width: Math.random() * 1.3 + 0.3, height: Math.random() * 1.3 + 0.3,
          borderRadius: "50%", background: P.mist,
          opacity: Math.random() * 0.2 + 0.05, pointerEvents: "none",
        }} />
      ))}

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 300 }}>
        {/* Small constellation icon */}
        <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto 32px" }}>
          {[P.rose, P.ice, P.lav].map((c, i) => {
            const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
            const r = 20;
            return (
              <div key={i} style={{
                position: "absolute", left: 30 + Math.cos(a) * r, top: 30 + Math.sin(a) * r,
                width: 6, height: 6, borderRadius: "50%", transform: "translate(-50%,-50%)",
                background: `radial-gradient(circle, #fff 20%, ${c})`,
                boxShadow: `0 0 8px ${c}55`,
              }} />
            );
          })}
          <div style={{
            position: "absolute", left: 27, top: 27, width: 6, height: 6, borderRadius: "50%",
            background: `radial-gradient(circle, ${P.mist}44, ${P.lav}22, transparent)`,
          }} />
        </div>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300,
          fontStyle: "italic", color: P.mist, opacity: 0.8, lineHeight: 1.6, margin: "0 0 8px",
        }}>
          Your sky is yours.
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300,
          color: P.mist, opacity: 0.4, lineHeight: 1.6, margin: "0 0 40px",
        }}>
          Sign in to keep it safe across devices.
        </p>

        {signingIn ? (
          <div style={{ animation: "slowFade 0.5s ease" }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", margin: "0 auto",
              background: `radial-gradient(circle, #fff 20%, ${P.lav})`,
              boxShadow: `0 0 16px ${P.lav}55`,
              animation: "pulseGlow 1.5s ease-in-out infinite",
            }} />
          </div>
        ) : (
          <>
            {/* Google */}
            <button onClick={() => handleAuth("google")} style={{
              width: "100%", padding: "15px 20px", marginBottom: 12,
              background: `linear-gradient(135deg, rgba(248,250,252,0.08), rgba(248,250,252,0.03))`,
              border: `1px solid ${P.mist}18`, borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              cursor: "pointer", transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${P.mist}30`; e.currentTarget.style.background = `linear-gradient(135deg, rgba(248,250,252,0.12), rgba(248,250,252,0.05))`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${P.mist}18`; e.currentTarget.style.background = `linear-gradient(135deg, rgba(248,250,252,0.08), rgba(248,250,252,0.03))`; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "15px",
                color: P.mist, opacity: 0.7, fontStyle: "italic",
              }}>continue with Google</span>
            </button>

            {/* Apple */}
            <button onClick={() => handleAuth("apple")} style={{
              width: "100%", padding: "15px 20px", marginBottom: 32,
              background: `linear-gradient(135deg, rgba(248,250,252,0.08), rgba(248,250,252,0.03))`,
              border: `1px solid ${P.mist}18`, borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              cursor: "pointer", transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${P.mist}30`; e.currentTarget.style.background = `linear-gradient(135deg, rgba(248,250,252,0.12), rgba(248,250,252,0.05))`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${P.mist}18`; e.currentTarget.style.background = `linear-gradient(135deg, rgba(248,250,252,0.08), rgba(248,250,252,0.03))`; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={P.mist} style={{ opacity: 0.7 }}>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z"/>
              </svg>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "15px",
                color: P.mist, opacity: 0.7, fontStyle: "italic",
              }}>continue with Apple</span>
            </button>

            {/* Skip */}
            <button onClick={onSkip} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "13px",
              fontStyle: "italic", color: P.mist, opacity: 0.6,
              letterSpacing: "0.5px", transition: "opacity 0.3s",
            }}
              onMouseEnter={e => e.target.style.opacity = "0.5"}
              onMouseLeave={e => e.target.style.opacity = "0.3"}
            >
              skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function App() {
  const [people, setPeople] = useState([]);
  const [view, setView] = useState("loading");
  const [selected, setSelected] = useState(null);
  const [shooters, setShooters] = useState([]);
  const [afterColor, setAfterColor] = useState(P.lav);
  const [prefillName, setPrefillName] = useState("");
  const [authed, setAuthed] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [dims, setDims] = useState({ w: 400, h: 700 });
  const cRef = useRef(null);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    Promise.all([load(), loadAuth()]).then(([d, a]) => {
      if (d?.people?.length) {
        setPeople(d.people);
        setAuthed(!!a);
        setView("graph");
      } else {
        setView("onboarding");
      }
    });
  }, []);
  useEffect(() => { const el = cRef.current; if (!el) return; const ro = new ResizeObserver(e => { const { width, height } = e[0].contentRect; setDims({ w: width, h: height }); }); ro.observe(el); return () => ro.disconnect(); }, []);

  const cx = dims.w / 2, cy = dims.h * 0.38;
  const maxE = Math.max(...(people.length ? people.map(p => p.entries.length) : [1]));

  useEffect(() => {
    if (!people.length) { setPositions([]); return; }
    const sorted = [...people].sort((a, b) => b.entries.length - a.entries.length);
    const maxR = Math.min(dims.w, dims.h) * 0.42, minR = 60, golden = 2.399963;
    setPositions(sorted.map((person, i) => {
      const ratio = person.entries.length / maxE;
      const r = minR + (1 - ratio) * (maxR - minR);
      const a = i * golden - Math.PI / 2;
      const hash = person.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      return { person, x: cx + Math.cos(a) * r + Math.sin(hash * 0.7) * 8, y: cy + Math.sin(a) * r + Math.cos(hash * 1.3) * 8 };
    }));
  }, [dims, people, maxE, cx, cy]);

  const handleOBComplete = useCallback(async (entries) => {
    setPeople(entries); await save({ people: entries });
    setShowSignIn(true);
    setView("graph");
  }, []);

  const handleAdd = useCallback(async (entry) => {
    setPeople(prev => {
      const ex = prev.find(p => p.name.toLowerCase() === entry.name.toLowerCase());
      let upd;
      if (ex) {
        upd = prev.map(p => p.id === ex.id ? { ...p, entries: [...p.entries, { text: entry.text, impact: entry.impact, feelings: entry.feelings, date: entry.date }] } : p);
      } else {
        upd = [...prev, { id: `p-${Date.now()}`, name: entry.name, color: COLORS[prev.length % COLORS.length], entries: [{ text: entry.text, impact: entry.impact, feelings: entry.feelings, date: entry.date }] }];
      }
      save({ people: upd });
      const added = upd.find(p => p.name.toLowerCase() === entry.name.toLowerCase());
      setAfterColor(added?.color || P.lav);
      return upd;
    });
    setView("afterglow");
  }, []);

  const handleUpdate = useCallback((updatedPerson) => {
    setPeople(prev => {
      const upd = prev.map(p => p.id === updatedPerson.id ? updatedPerson : p);
      save({ people: upd });
      return upd;
    });
    setSelected(prev => prev?.id === updatedPerson.id ? updatedPerson : prev);
  }, []);

  const handleDelete = useCallback((personId) => {
    setPeople(prev => {
      const upd = prev.filter(p => p.id !== personId);
      save({ people: upd });
      return upd;
    });
    setSelected(null);
    setView(people.length <= 1 ? "onboarding" : "graph");
  }, [people.length]);

  const handleTap = useCallback((person) => {
    const pos = positions.find(p => p.person.id === person.id);
    if (!pos) return;
    const stars = person.entries.map((_, i) => ({
      key: `${person.id}-${i}-${Date.now()}`, fx: pos.x, fy: pos.y, tx: cx, ty: cy,
      color: person.color, delay: i * 0.1,
    }));
    setShooters(stars);
    const minDuration = 1200;
    const calcDuration = stars.length * 100 + 700;
    setTimeout(() => { setSelected(person); setView("person"); setShooters([]); }, Math.max(minDuration, calcDuration));
  }, [positions, cx, cy]);

  const rp = people.length > 0 ? people[Math.floor(Date.now() / 86400000) % people.length] : null;
  const isGraph = view === "graph" || view === "person" || view === "self" || view === "share";

  return (
    <div ref={cRef} style={{
      width: "100%", height: "100vh", position: "relative", overflow: "hidden",
      background: `linear-gradient(170deg, #080e1e 0%, ${P.bg} 25%, ${P.night} 55%, #131b30 80%, #0e1525 100%)`,
      fontFamily: "Georgia, serif",
    }}>
      <style>{`
        /* @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap'); */
        @keyframes twinkle { 0%,100% { opacity: inherit; } 50% { opacity: 0.08; } }
        @keyframes breathe { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.07); } }
        @keyframes drift { 0% { transform: translate(0,0); } 100% { transform: translate(var(--dx),var(--dy)); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
        @keyframes slowFade { from { opacity:0; } to { opacity:1; } }
        @keyframes clusterPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity:.8; } 50% { transform: translate(-50%,-50%) scale(1.05); opacity:1; } }
        @keyframes shoot { 0% { opacity:0; transform: translate(0,0) scale(1); } 10% { opacity:1; } 65% { opacity:.45; } 100% { opacity:0; transform: translate(var(--sX),var(--sY)) scale(.1); } }
        @keyframes starAppear { 0% { opacity:0; transform: translate(-50%,-50%) scale(0); } 50% { opacity:1; transform: translate(-50%,-50%) scale(1.3); } 100% { opacity:1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 24px 10px currentColor; transform: scale(1); } 50% { box-shadow: 0 0 40px 16px currentColor; transform: scale(1.1); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${P.mist}; opacity: 0.15; font-style: italic; }
        textarea:focus, input:focus { scroll-margin-bottom: 200px; }
      `}</style>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "28%", background: "linear-gradient(180deg, transparent, rgba(90,55,35,0.04) 65%, rgba(110,65,45,0.055))", pointerEvents: "none" }} />
      <Sky w={dims.w} h={dims.h} />

      {view === "loading" && <div />}
      {view === "onboarding" && <Onboarding onComplete={handleOBComplete} />}

      {isGraph && people.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, textAlign: "center", margin: "0 30px 20px", lineHeight: 1.6 }}>Your sky is empty.</p>
          <button onClick={() => setView("onboarding")} style={{
            background: `linear-gradient(135deg, ${P.lav}12, transparent)`, border: `1px solid ${P.lav}22`,
            borderRadius: "24px", padding: "13px 32px", color: P.mist, opacity: 0.8,
            fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontStyle: "italic", cursor: "pointer",
          }}>add your first star ✦</button>
        </div>
      )}

      {isGraph && people.length > 0 && (
        <>
          <div style={{ position: "absolute", top: 26, left: 0, right: 0, textAlign: "center", zIndex: 10, animation: "fadeUp 1s ease" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontWeight: 300, fontStyle: "italic", color: P.mist, opacity: 0.8, letterSpacing: "3.5px", textTransform: "lowercase", margin: 0 }}>constellate</h1>
          </div>

          {/* Constellation lines */}
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
            {positions.map(({ person, x, y }) => {
              const hash = person.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
              const dx = cx - x, dy = cy - y, len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len, wobble = Math.sin(hash * 2.7) * 8;
              const mx = (x + cx) / 2 + nx * wobble, my = (y + cy) / 2 + (dx / len) * wobble;
              const faded = view === "person" && selected?.id !== person.id;
              return <path key={`l-${person.id}`} d={`M ${x} ${y} Q ${mx} ${my} ${cx} ${cy}`}
                stroke={person.color} strokeWidth="0.7" fill="none" strokeDasharray="3,7" strokeLinecap="round"
                opacity={faded ? 0.02 : 0.12} style={{ transition: "opacity 0.8s" }} />;
            })}
          </svg>

          <CenterCluster people={people} cx={cx} cy={cy} onTap={() => { if (view === "graph") setView("self"); }} />
          <Shooters stars={shooters} />
          {positions.map(({ person, x, y }) => (
            <StarOrb key={person.id} person={person} x={x} y={y} maxE={maxE}
              onTap={handleTap} faded={view === "person" && selected?.id !== person.id} />
          ))}

          {view === "graph" && (
            <>
              {/* Two entry points */}
              <div style={{
                position: "absolute", bottom: 108, left: 0, right: 0,
                display: "flex", justifyContent: "center", gap: 12, padding: "0 20px",
                zIndex: 10, animation: "fadeUp 1.8s ease",
              }}>
                <button onClick={() => setView("prompt")} style={{
                  flex: 1, maxWidth: 175, background: `linear-gradient(135deg, ${P.lav}14, ${P.lav}06)`,
                  border: `1px solid ${P.lav}28`, borderRadius: "16px", padding: "16px 14px",
                  cursor: "pointer", transition: "all 0.3s", textAlign: "center",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${P.lav}45`; e.currentTarget.style.background = `linear-gradient(135deg, ${P.lav}1c, ${P.lav}0a)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${P.lav}28`; e.currentTarget.style.background = `linear-gradient(135deg, ${P.lav}14, ${P.lav}06)`; }}
                >
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontStyle: "italic", color: P.lav, opacity: 0.80, margin: 0, letterSpacing: "0.5px", pointerEvents: "none" }}>today's question</p>
                </button>
                <button onClick={() => setView("add")} style={{
                  flex: 1, maxWidth: 175, background: `linear-gradient(135deg, ${P.gold}14, ${P.gold}06)`,
                  border: `1px solid ${P.gold}28`, borderRadius: "16px", padding: "16px 14px",
                  cursor: "pointer", transition: "all 0.3s", textAlign: "center",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${P.gold}45`; e.currentTarget.style.background = `linear-gradient(135deg, ${P.gold}1c, ${P.gold}0a)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${P.gold}28`; e.currentTarget.style.background = `linear-gradient(135deg, ${P.gold}14, ${P.gold}06)`; }}
                >
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontStyle: "italic", color: P.gold, opacity: 0.80, margin: 0, letterSpacing: "0.5px", pointerEvents: "none" }}>add a star</p>
                </button>
              </div>
            </>
          )}
        </>
      )}

      {view === "add" && <AddEntry people={people} onAdd={handleAdd} onClose={() => { if (prefillName && selected) { setPrefillName(""); setView("person"); } else { setPrefillName(""); setView("graph"); } }} mode="free" prefillName={prefillName} />}
      {view === "prompt" && <AddEntry people={people} onAdd={handleAdd} onClose={() => setView("graph")} mode="prompt" />}
      {view === "person" && selected && <PersonView person={selected} onClose={() => { setSelected(null); setView("graph"); }} onShare={() => {
        if (!authed) { setShowSignIn(true); } else { setView("share"); }
      }} onAddMore={() => { setPrefillName(selected.name); setView("add"); }} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {view === "share" && selected && <ShareCard person={selected} allPeople={people} positions={positions} cx={cx} cy={cy} onClose={() => setView("person")} />}
      {view === "self" && <SelfPortrait people={people} onClose={() => setView("graph")} />}
      {view === "afterglow" && <Afterglow color={afterColor} onDone={() => { setPrefillName(""); setView("graph"); }} />}

      {/* Sign-in overlay */}
      {showSignIn && (
        <SignInOverlay
          onSignIn={async (user) => {
            setAuthed(true);
            setShowSignIn(false);
            await saveAuth({ userId: user.id, provider: user.provider });
            if (view === "person" && selected) setView("share");
          }}
          onSkip={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}
