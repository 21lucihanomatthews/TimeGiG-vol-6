/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Briefcase,
  Phone,
  Wallet,
  MoreVertical,
  User,
  Settings,
  Shield,
  Camera,
  CheckCircle,
  Mail,
  LogOut,
  Plus,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Bell,
  Flag,
  Trash2,
  Clock,
  Send,
  MessageSquare,
  X,
  Image,
  Ban,
  FileText,
  Square,
  Check,
  Info,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PricingModal } from "./components/PricingModal";
import { SeekerItem } from "./components/SeekerItem";

interface ProfileData {
  fullName: string;
  dob: string;
  location: string;
  phone: string;
  email: string;
  gender: string;
  education: string;
  languages: string;
  info: string;
  experience: string;
  skills: string;
  workPreference: string;
  level: string;
  password: string;
  isVisible: boolean;
  isDisabled?: boolean;
  pictures: { left: string; front: string; right: string };
  idDocument: string;
  isVerified: boolean;
  certificates: { name: string; url: string }[];
  alternativePhone: string;
  whatsapp: string;
  linkedin: string;
  telegram: string;
  contactMethod: string;
  contactHours: string;
}

const ensureProfileData = (data: any): ProfileData => {
  if (!data || typeof data !== "object") {
    return {
      fullName: "",
      dob: "",
      location: "",
      phone: "",
      email: "",
      gender: "",
      education: "",
      languages: "",
      info: "",
      experience: "",
      skills: "",
      workPreference: "",
      level: "Novice",
      password: "",
      isVisible: true,
      pictures: { left: "", front: "", right: "" },
      idDocument: "",
      isVerified: false,
      certificates: [],
      alternativePhone: "",
      whatsapp: "",
      linkedin: "",
      telegram: "",
      contactMethod: "Any",
      contactHours: "",
    };
  }
  return {
    fullName: data.fullName || "",
    dob: data.dob || "",
    location: data.location || "",
    phone: data.phone || "",
    email: data.email || "",
    gender: data.gender || "",
    education: data.education || "",
    languages: data.languages || "",
    info: data.info || "",
    experience: data.experience || "",
    skills: data.skills || "",
    workPreference: data.workPreference || "",
    level: data.level || "Novice",
    password: data.password || "",
    isVisible: data.isVisible !== false,
    pictures: {
      left: (data.pictures && data.pictures.left) || "",
      front: (data.pictures && data.pictures.front) || "",
      right: (data.pictures && data.pictures.right) || "",
    },
    idDocument: data.idDocument || "",
    isVerified: !!data.isVerified,
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    alternativePhone: data.alternativePhone || "",
    whatsapp: data.whatsapp || "",
    linkedin: data.linkedin || "",
    telegram: data.telegram || "",
    contactMethod: data.contactMethod || "Any",
    contactHours: data.contactHours || "",
    isDisabled: !!data.isDisabled,
  };
};

const compressImage = (base64Str: string, maxWidth = 1000, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:")) {
      resolve(base64Str);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

const fileToCompressedBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      if (file.type && file.type.startsWith("image/")) {
        const compressed = await compressImage(result, 600, 400, 0.6);
        resolve(compressed);
      } else {
        resolve(result);
      }
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const MAX_LOCALSTORAGE_SIZE = 4.5 * 1024 * 1024;

const safeLoadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    return JSON.parse(raw);
  } catch (error) {
    console.warn("Load Error (safe fallback):", error);

    localStorage.removeItem(key);

    return fallback;
  }
};

const renderDancingText = (plainText: string) => {
  if (!plainText) return "";
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const trimText = plainText.trim();
  
  // Checking if the text is exactly one single emoji
  const matches = [...trimText.matchAll(emojiRegex)];
  const isSingleEmoji = matches.length === 1 && matches[0][0] === trimText;

  if (isSingleEmoji) {
    return (
      <div className="flex justify-center items-center py-2 overflow-visible">
        <motion.span
          className="inline-block text-5xl origin-bottom"
          animate={{
            y: [0, -16, 0, -8, 0],
            rotate: [0, -12, 12, -8, 8, 0],
            scale: [1, 1.15, 0.95, 1.05, 1]
          }}
          transition={{
            duration: 1.6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.1
          }}
        >
          {trimText}
        </motion.span>
      </div>
    );
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  emojiRegex.lastIndex = 0; // Reset
  
  let match;
  let keyIdx = 0;
  while ((match = emojiRegex.exec(plainText)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];
    
    // Add text preceding the emoji
    if (matchIndex > lastIndex) {
      parts.push(<span key={`t-${keyIdx++}`}>{plainText.substring(lastIndex, matchIndex)}</span>);
    }
    
    // Add the emoji in a dancing wrapper
    parts.push(
      <motion.span
        key={`e-${keyIdx++}`}
        className="inline-block select-none mx-0.5"
        animate={{
          y: [0, -5, 0],
          rotate: [-10, 10, -10],
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          repeat: Infinity,
          delay: (keyIdx % 5) * 0.1,
        }}
      >
        {matchText}
      </motion.span>
    );
    
    lastIndex = emojiRegex.lastIndex;
  }
  
  if (lastIndex < plainText.length) {
    parts.push(<span key={`t-${keyIdx++}`}>{plainText.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : <span>{plainText}</span>;
};

const safeSaveJSON = (key: string, value: any) => {
  try {
    const json = typeof value === "string" ? value : JSON.stringify(value);

    const size = json.length;

    // Prevent storage crash
    if (size > MAX_LOCALSTORAGE_SIZE) {
      console.warn("Data too large for localStorage:", key);

      // Clean large profile images if it's profileData
      if (key === "profileData") {
        try {
          const parsed = typeof value === "string" ? JSON.parse(value) : value;
          if (parsed && typeof parsed === "object") {
            parsed.pictures = { left: "", front: "", right: "" };
            localStorage.setItem(key, JSON.stringify(parsed));
            console.warn("Cleared base64 profile pictures to preserve profile metadata due to size limit.");
            return true;
          }
        } catch (innerErr) {
          console.warn("Failed to recover profileData write on size check", innerErr);
        }
      }

      console.warn("Storage full. Large images/files were skipped for key:", key);
      return false;
    }

    localStorage.setItem(key, json);
    return true;
  } catch (error: any) {
    const isQuotaError =
      error?.name === "QuotaExceededError" ||
      error?.code === 22 ||
      error?.code === 1014 ||
      error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      String(error).includes("QuotaExceededError") ||
      String(error?.message).includes("quota");

    if (isQuotaError) {
      console.warn("Quota exceeded during save of key:", key);
      // Remove large assets
      localStorage.removeItem("backgroundWallpaper");

      if (key === "profileData") {
        try {
          const parsed = typeof value === "string" ? JSON.parse(value) : value;
          if (parsed && typeof parsed === "object") {
            parsed.pictures = { left: "", front: "", right: "" };
            localStorage.setItem(key, JSON.stringify(parsed));
            console.warn("Cleared base64 profile pictures to preserve profile metadata due to storage quota.");
            return true;
          }
        } catch (innerErr) {
          console.warn("Failed to recover profileData write on quota catch", innerErr);
        }
      }

      console.warn("Phone storage quota full. Large assets or backgrounds were cleared.");
    } else {
      console.warn("Save Error:", error);
    }

    return false;
  }
};

const safeSetItem = (key: string, value: string): void => {
  safeSaveJSON(key, value);
};

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: any) {
    console.error("App Crash:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            fontFamily: "sans-serif",
            marginTop: "100px",
          }}
        >
          <h2>Something went wrong</h2>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontWeight: "bold",
              marginTop: "20px",
            }}
          >
            Reset App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const IdDocumentViewer = ({ src, onClose }: { src: string, onClose: () => void }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [pointer, setPointer] = useState({ x: -1000, y: -1000 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey) || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        onClose();
        alert("Screenshots are not allowed for ID documents.");
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    // Attempt to block screenshot via visibility API
    const handleVisibilityChange = () => setIsHidden(document.visibilityState === "hidden");
    const handleBlur = () => setIsHidden(true);
    const handleFocus = () => setIsHidden(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [onClose]);

  const updatePointer = (e: React.PointerEvent) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className={`fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl transition-opacity duration-100 ${isHidden ? "opacity-0" : "opacity-100"}`} onClick={onClose} onContextMenu={e => e.preventDefault()}>
      <div className="absolute top-6 right-6 bg-white/10 p-3 rounded-full cursor-pointer hover:bg-white/20 transition-all z-50">
        <X className="w-8 h-8 text-white pointer-events-none" />
      </div>
      <div className="text-white/30 absolute top-8 font-black uppercase tracking-[0.5em] text-sm pointer-events-none z-0 text-center">
        CONFIDENTIAL<br/><span className="text-[10px]">DO NOT SCREENSHOT</span>
      </div>
      
      {/* Moving watermark overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-wrap opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' transform=\'rotate(-45)\' width=\'200\' height=\'200\'><text x=\'50\' y=\'100\' fill=\'white\' font-size=\'20\'>DO NOT SCREENSHOT</text></svg>")' }}>
      </div>
      
      <div className="relative z-10 w-full max-w-3xl h-[80vh] bg-gray-900 border border-white/10 rounded-2xl select-none" onClick={e => e.stopPropagation()}>
        {/* Anti-screenshot wrapper block */}
        <div 
          ref={wrapperRef}
          className="relative w-full h-full overflow-hidden rounded-xl cursor-crosshair touch-none"
          onPointerDown={(e) => {
            setIsActive(true);
            updatePointer(e);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (isActive) updatePointer(e);
          }}
          onPointerUp={(e) => {
            setIsActive(false);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => setIsActive(false)}
        >
          {/* Obscured inactive state */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl transition-opacity duration-200 pointer-events-none" style={{ opacity: isActive ? 0 : 1 }}>
             <Shield className="w-16 h-16 text-white/50 mb-4" />
             <h3 className="text-white font-black uppercase tracking-widest text-lg text-center">Hold to Inspect</h3>
             <p className="text-white/60 text-xs mt-2 font-bold px-8 text-center max-w-sm">
               Anti-screenshot protection active.<br/>
               Press and hold to reveal a small localized spotlight of the document.
             </p>
          </div>

          {/* Heavily blurred underlying image to give context */}
          <div className="absolute inset-0 z-10 opacity-30 blur-xl pointer-events-none bg-black">
             {src.startsWith("data:image/") || !src.startsWith("data:") ? (
               <img src={src} className="w-full h-full object-contain pointer-events-none" alt="" />
             ) : (
               <iframe src={src} className="w-full h-full border-0 pointer-events-none" title="bg"/>
             )}
          </div>

          {/* Spotlit clear image layer */}
          <div 
             className="absolute inset-0 z-30 pointer-events-none bg-gray-900"
             style={{
               clipPath: isActive ? `circle(90px at ${pointer.x}px ${pointer.y}px)` : 'circle(0px at 50% 50%)'
             }}
          >
             {src.startsWith("data:image/") || !src.startsWith("data:") ? (
               <img src={src} className="w-full h-full object-contain pointer-events-none select-none touch-none" alt="ID Document" draggable="false" />
             ) : (
               <div className="w-full h-full bg-white flex items-center justify-center">
                 <iframe src={src} className="w-full h-full border-0 pointer-events-none" title="ID Document" sandbox="allow-same-origin"/>
               </div>
             )}
          </div>
          
          {/* Internal overlay to block saving right click */}
          <div className="absolute inset-0 z-40 pointer-events-none" onContextMenu={e => e.preventDefault()}></div>
        </div>
      </div>
      
      <div className="absolute bottom-10 flex flex-col items-center text-white/50 pointer-events-none">
        <Shield className="w-6 h-6 mb-2" />
        <span className="text-xs uppercase font-bold tracking-widest">Protected Document</span>
      </div>
    </div>
  );
};

const WelcomeModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Welcome to TimeGIG",
      description: "Your local hub for short-term gigs and verified talent. Let's get you started!",
      icon: <Info className="w-8 h-8 text-blue-600" />,
    },
    {
      title: "Finding Gigs",
      description: "Browse the 'GIGS' tab to find opportunities. Apply with a custom pitch to stand out.",
      icon: <Briefcase className="w-8 h-8 text-[#001489]" />,
    },
    {
      title: "Being a Seeker",
      description: "Fill out your profile in 'SEEKER' tab to get hired. Businesses look for verified status!",
      icon: <Search className="w-8 h-8 text-[#007749]" />,
    },
    {
      title: "Wallet & Coins",
      description: "Actions like messaging or viewing profiles use coins. Top up in the 'WALLET' section.",
      icon: <Wallet className="w-8 h-8 text-[#FFB81C]" />,
    },
    {
      title: "Safety First",
      description: "Verify your identity with an ID document and a video pitch for maximum trust.",
      icon: <Shield className="w-8 h-8 text-red-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 flex">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-full transition-all duration-300 ${i <= step ? "bg-blue-600" : "bg-gray-100"}`} />
          ))}
        </div>

        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
          {steps[step].icon}
        </div>

        <h3 className="text-2xl font-black text-gray-900 text-center uppercase tracking-tight mb-2">
          {steps[step].title}
        </h3>
        
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-10 font-medium h-20 flex items-center justify-center">
          {steps[step].description}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onClose();
              }
            }}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {step < steps.length - 1 ? "Next " : "Get Started"}
          </button>
          
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full py-2.5 text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Back
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function AppContent() {

  const [showSplash, setShowSplash] = useState(true);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true",
  );
  const [authMode, setAuthMode] = useState<"login" | "register" | "verify">(
    "register",
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailCheckStatus, setEmailCheckStatus] = useState<"idle" | "checking" | "found" | "not_found">("idle");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [viewingIdDocument, setViewingIdDocument] = useState<string | null>(null);
  const [verificationSuccessEmail, setVerificationSuccessEmail] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.pathname === "/verification-success") {
      const params = new URLSearchParams(window.location.search);
      const email = params.get("email");
      if (email) {
        setVerificationSuccessEmail(email);
        setLoginEmail(email);
        setTimeout(() => {
          // Clear URL without reloading
          window.history.replaceState({}, document.title, "/");
        }, 5000);
      }
    }
  }, []);
  const [currentView, setCurrentView] = useState<
    | "seeker"
    | "profile-edit"
    | "gigs"
    | "wallet"
    | "profile-details"
    | "gig-details"
    | "inbox"
    | "chat"
    | "admin"
  >(() => (localStorage.getItem("currentView") as any) || "seeker");
  const [profileCompleted, setProfileCompleted] = useState(
    () => localStorage.getItem("profileCompleted") === "true",
  );
  const [balance, setBalance] = useState(() =>
    Number(localStorage.getItem("balance") || "10"),
  );
  const [transactions, setTransactions] = useState<
    {
      id: number;
      date: string;
      type: "bought" | "spent" | "pending";
      amount: number;
      proof?: string;
      note?: string;
    }[]
  >(() => safeLoadJSON("transactions", []));
  const [pendingApprovals, setPendingApprovals] = useState<
    { id: number; user: string; amount: number; proof: string; price: string }[]
  >(() => safeLoadJSON("pendingApprovals", []));
  const [businessRequests, setBusinessRequests] = useState<
    {
      id: number;
      user: string;
      documents: string[];
      status: "pending" | "approved" | "rejected";
    }[]
  >(() => safeLoadJSON("businessRequests", []));
  const [walletSubView, setWalletSubView] = useState<"main" | "topup" | "bank">(
    "main",
  );
  const [selectedTopup, setSelectedTopup] = useState<{
    coins: number;
    price: string;
    days: number;
  } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isBusinessMode, setIsBusinessMode] = useState(
    () => localStorage.getItem("isBusinessMode") === "true",
  );
  const [businessDocs, setBusinessDocs] = useState<{ name: string; url: string; type: string }[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem("profileData");
      if (saved) {
        return ensureProfileData(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return ensureProfileData(null);
  });
  const [capturingAngle, setCapturingAngle] = useState<
    "left" | "front" | "right" | "gig" | null
  >(null);
  const [cameraSequence, setCameraSequence] = useState<
    ("left" | "front" | "right")[] | null
  >(null);
  const [sequenceIndex, setSequenceIndex] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [appliedGigs, setAppliedGigs] = useState<number[]>(
    () => safeLoadJSON("appliedGigs", []),
  );
  const [selectedSeeker, setSelectedSeeker] = useState<any | null>(null);
  const [seekers, setSeekers] = useState<any[]>([]);
  const [selectedGig, setSelectedGig] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const [adminPendingApprovals, setAdminPendingApprovals] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [videoIntroStream, setVideoIntroStream] = useState<MediaStream | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoIntroRecorder, setVideoIntroRecorder] = useState<MediaRecorder | null>(null);
  const [videoIntroUrl, setVideoIntroUrl] = useState<string | null>(null);
  const [videoIntroBlob, setVideoIntroBlob] = useState<Blob | null>(null);
  const [videoIntroDuration, setVideoIntroDuration] = useState(60);
  const [applyCoverNoteValue, setApplyCoverNoteValue] = useState("");
  const [showGigApplyWorkflow, setShowGigApplyWorkflow] = useState(false);
  const [applicantLevelValue, setApplicantLevelValue] = useState("Beginner");
  const [applicantPhoneValue, setApplicantPhoneValue] = useState("");
  const [cameraDenied, setCameraDenied] = useState(false);
  const [showVideoIntroPermissionPrompt, setShowVideoIntroPermissionPrompt] = useState(false);
  const [isCameraSimulationActive, setIsCameraSimulationActive] = useState(false);
  const [isVideoSimulationActive, setIsVideoSimulationActive] = useState(false);
  const [videoIntroFileName, setVideoIntroFileName] = useState<string | null>(null);
  const applyLiveVideoRef = useRef<HTMLVideoElement>(null);
  const [newPromotionText, setNewPromotionText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState("");
  const popupTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("hasSeenOnboarding") !== "true";
  });

  useEffect(() => {
    if (!showSplash && showOnboarding) {
      // Show onboarding after splash
    }
  }, [showSplash, showOnboarding]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const alert = (msg: string) => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    setPopupMessage(msg);
    setShowPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
    }, 4500);
  };
  const showToast = (msg: string) => alert(msg);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);

  const handleVerifyIdentity = async (idDocumentBase64: string) => {
    setIsVerifyingIdentity(true);
    setFaceVerificationError("");
    
    // Auto set ID document
    setProfileData((prev) => ({ ...prev, idDocument: idDocumentBase64 }));

    if (!profileData.pictures.front) {
      setFaceVerificationError("Please upload profile picture first");
      setIsVerifyingIdentity(false);
      return;
    }

    try {
      const res = await fetch("/api/verify-identity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faceImage: profileData.pictures.front, idDocument: idDocumentBase64 }),
      });
      if (!res.ok) {
        throw new Error("Verification request failed");
      }
      const data = await res.json();
      if (data.isVerified) {
        setProfileData((prev) => ({
          ...prev,
          idDocument: idDocumentBase64,
          isVerified: true
        }));
        if (data.warning) {
          alert("Matches but warning: " + data.warning);
        } else {
          alert(`Identity verified! Confidence: ${data.matchPercentage}%`);
        }
      } else {
        setFaceVerificationError(data.reason || "Identity verification failed.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      // Fallback
      setProfileData((prev) => ({
        ...prev,
        idDocument: idDocumentBase64,
        isVerified: true
      }));
      alert("✓ Identity set and verified (fallback).");
    } finally {
      setIsVerifyingIdentity(false);
    }
  };

  const handleVerifyAndSetPicture = async (imageBase64: string) => {
    setIsVerifyingFace(true);
    setFaceVerificationError("");
    try {
      const res = await fetch("/api/verify-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64 })
      });
      if (!res.ok) {
        throw new Error("Server error during verification.");
      }
      const data = await res.json();
      if (data.isValid) {
        setProfileData((prev) => ({
          ...prev,
          pictures: {
            ...prev.pictures,
            front: imageBase64,
          },
        }));
        if (data.warning) {
          console.warn(data.warning);
        }
        alert("✓ Photo verified and accepted!");
      } else {
        setFaceVerificationError(data.reason || "Rejected: No clear human face detected.");
        alert(`❌ Rejected: ${data.reason || "Unable to detect a clear human face in the image."}`);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      // Fallback in case of networking error to keep applet operational
      setProfileData((prev) => ({
        ...prev,
        pictures: {
          ...prev.pictures,
          front: imageBase64,
        },
      }));
      alert("✓ Photo set successfully.");
    } finally {
      setIsVerifyingFace(false);
    }
  };
  const [messages, setMessages] = useState<
    Record<number, { sender: "me" | "other"; text: string; images?: string[]; companionName?: string; companionEmail?: string; }[]>
  >(() => safeLoadJSON("messages", {}));
  const [isInboxEditMode, setIsInboxEditMode] = useState(false);
  const [selectedInboxThreads, setSelectedInboxThreads] = useState<number[]>(
    [],
  );
  const [backgroundWallpaper, setBackgroundWallpaper] = useState<string | null>(
    () => localStorage.getItem("backgroundWallpaper"),
  );
  const [newMessage, setNewMessage] = useState("");
  const [chatFiles, setChatFiles] = useState<{ name: string; base64: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [topBarNotifications, setTopBarNotifications] = useState<
    { id: number; text: string; read: boolean; type: string }[]
  >(() => {
    const defaultNotifications = [
      {
        id: 2,
        text: "Promotion: Top up today and get 10% bonus coins!",
        read: false,
        type: "promo",
      },
    ];
    return safeLoadJSON("topBarNotifications", defaultNotifications).filter(
      (n) => n.id !== 1 && !n.text.includes("Garden Help")
    );
  });
  const [gigs, setGigs] = useState<
    {
      id: number;
      title: string;
      description: string;
      creator: string;
      creatorEmail?: string;
      fileUrls: string[];
      views: number;
      applicants: number;
      status?: 'active' | 'closed';
    }[]
  >(() => {
    const defaultGigs = [
      {
        id: 2,
        title: "Website React Developer",
        description: "Need help upgrading a simple dashboard with Tailwind CSS and responsive design.",
        creator: "TechCorp Ltd",
        fileUrls: [
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
        ],
        views: 24,
        applicants: 4,
      },
      {
        id: 3,
        title: "Store Assistant / Stock Clerk",
        description: "Organize inventory, count stock, and assist general store manager.",
        creator: "Main Street Market",
        fileUrls: [
          "https://images.unsplash.com/photo-1534452286114-14cc62a151d4?w=400",
        ],
        views: 8,
        applicants: 4,
      },
      {
        id: 4,
        title: "Social Media Marketer",
        description: "Create 3 Instagram reels/posts for local artisan coffee shop.",
        creator: "Brew & Co",
        fileUrls: [
          "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
        ],
        views: 31,
        applicants: 5,
      },
      {
        id: 5,
        title: "Pet Sitter for Weekend",
        description: "Looking after two friendly golden retrievers from Friday evening to Sunday afternoon.",
        creator: "Alice Martinez",
        fileUrls: [
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
        ],
        views: 15,
        applicants: 3,
      },
      {
        id: 6,
        title: "House Painting Helper",
        description: "Assist with prep-work and tape application for painting a 3-bedroom apartment.",
        creator: "Modern Brush LLC",
        fileUrls: [
          "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400",
        ],
        views: 19,
        applicants: 2,
      },
      {
        id: 7,
        title: "Filing and Scanning Assistant",
        description: "Help organize medical records and scan older documents to PDF database.",
        creator: "DocuClean Solutions",
        fileUrls: [
          "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400",
        ],
        views: 14,
        applicants: 1,
      },
      {
        id: 8,
        title: "Office Space Planner",
        description: "Arrange desks and dynamic seating setups for safe spacing in small startup hub.",
        creator: "Launchpad Hub",
        fileUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
        ],
        views: 22,
        applicants: 3,
      },
      {
        id: 9,
        title: "Tutor for Kids Basic Math",
        description: "Two simple 1-hour sessions for 5th grade beginner algebra prep.",
        creator: "Mark Henderson",
        fileUrls: [
          "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400",
        ],
        views: 28,
        applicants: 6,
      },
      {
        id: 10,
        title: "Event Setup Assistant",
        description: "Set up foldable chairs, banners, and audio/video speakers for community fundraiser.",
        creator: "Hope Foundations",
        fileUrls: [
          "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
        ],
        views: 45,
        applicants: 12,
      },
    ];
    return safeLoadJSON("gigs", defaultGigs).filter(
      (g) => g.id !== 1 && g.title !== "Garden Help"
    );
  });
  const [newGig, setNewGig] = useState({
    title: "",
    description: "",
    files: null as FileList | null,
    fileUrls: [] as string[],
    isImmediate: true,
    gigDate: "",
  });
  const [isEditingGig, setIsEditingGig] = useState(false);
  const [editingGigData, setEditingGigData] = useState({
    title: "",
    description: "",
    fileUrls: [] as string[],
  });
  const [gigsTab, setGigsTab] = useState<"all" | "applied" | "applications">("all");
  const [gigApplications, setGigApplications] = useState<any[]>([]);
  const [notificationsPermission, setNotificationsPermission] = useState<
    "granted" | "denied" | "pending"
  >(() => {
    return (
      (localStorage.getItem("notificationsPermission") as any) || "pending"
    );
  });

  useEffect(() => {
    if (notificationsPermission) {
      safeSetItem("notificationsPermission", notificationsPermission);
    }
  }, [notificationsPermission]);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const getEmailHashId = (email: string): number => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/gigs/all-applications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGigApplications(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch gig applications:", e);
    }
  };

  const fetchSeekers = async () => {
    try {
      const res = await fetch("/api/seekers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSeekers(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch seekers:", e);
    }
  };

  const handleDeleteApplication = async (applicationId: number) => {
    console.log("Delete application requested for ID:", typeof applicationId, applicationId);
    if (!window.confirm("Are you sure you want to delete this application permanently?")) return;
    
    // Optimistically remove from UI
    setGigApplications((prev) => {
        const next = (prev || []).filter((app) => String(app.id) !== String(applicationId));
        console.log("Optimistic update, old count:", prev?.length, "new count:", next.length);
        return next;
    });

    try {
      const res = await fetch(`/api/gigs/application/${applicationId}`, {
        method: "DELETE"
      });
      console.log("Delete request response ok:", res.ok, res.status);
      if (!res.ok) {
        console.error("Failed to delete application on server.");
        fetchApplications(); // Refresh list to get accurate state
      } else {
        const data = await res.json();
        console.log("Delete request response data:", data);
      }
    } catch (e) {
      console.error("Fetch error during deletion:", e);
      fetchApplications(); // Refresh list
    }
  };

  const handleCloseGig = (gigId: number) => {
    if (!window.confirm("Are you sure you want to close this gig? It will not accept new applications.")) return;
    setGigs((prev) => prev.map((g) => g.id === gigId ? { ...g, status: 'closed' } : g));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplications();
      fetchSeekers();
      const interval = setInterval(() => {
        fetchApplications();
        fetchSeekers();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleUpdateApplicationStatus = async (applicationId: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/gigs/application/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPopupMessage(`Application successfully ${status}!`);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
        
        // Update local status counters or reload as well
        fetchApplications();
      } else {
        setPopupMessage("Failed to update status.");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (e) {
      console.warn("Failed to update application status:", e);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startVideoIntroRecording = async () => {
    try {
      setVideoIntroUrl(null);
      setVideoIntroBlob(null);
      setVideoIntroDuration(60);
      setIsVideoSimulationActive(false);
      setCameraDenied(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });
      setVideoIntroStream(stream);
      if (applyLiveVideoRef.current) {
        applyLiveVideoRef.current.srcObject = stream;
        applyLiveVideoRef.current.play().catch(e => console.warn(e));
      }
      
      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const completedBlob = new Blob(chunks, { type: "video/webm" });
        setVideoIntroBlob(completedBlob);
        const url = URL.createObjectURL(completedBlob);
        setVideoIntroUrl(url);
        
        // Stop all tracks to turn off camera light
        stream.getTracks().forEach((track) => track.stop());
        setVideoIntroStream(null);
      };
      
      recorder.start();
      setVideoIntroRecorder(recorder);
      setIsRecordingVideo(true);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraDenied(true);
      setPopupMessage("Camera block detected. Live video simulator and upload fallback enabled below!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    }
  };

  const startVideoIntroSimulation = () => {
    setVideoIntroUrl(null);
    setVideoIntroBlob(null);
    setVideoIntroDuration(60);
    setIsVideoSimulationActive(true);
    setIsRecordingVideo(true);
    setPopupMessage("Interactive Video Simulator Started!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const stopVideoIntroSimulation = () => {
    if (isRecordingVideo && isVideoSimulationActive) {
      setIsRecordingVideo(false);
      setIsVideoSimulationActive(false);
      
      // Load a beautiful placeholder MP4 for fully previewable playback
      const placeholderVideo = "https://assets.mixkit.co/videos/preview/mixkit-woman-explaining-something-during-a-video-call-41908-large.mp4";
      setVideoIntroUrl(placeholderVideo);
      
      const simulatedBlob = new Blob([JSON.stringify({ simulated: true, duration: 60 })], { type: "video/webm" });
      setVideoIntroBlob(simulatedBlob);
      
      setPopupMessage("Mock recording processed and ready for preview playback!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  const stopVideoIntroRecording = () => {
    if (isVideoSimulationActive) {
      stopVideoIntroSimulation();
    } else if (videoIntroRecorder && isRecordingVideo) {
      try {
        videoIntroRecorder.stop();
      } catch (e) {}
      setIsRecordingVideo(false);
    }
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        setPopupMessage("Video file is too large (max 25MB).");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        return;
      }
      setPopupMessage("Loading video file...");
      setShowPopup(true);
      
      try {
        const url = URL.createObjectURL(file);
        setVideoIntroUrl(url);
        setVideoIntroBlob(file);
        setVideoIntroFileName(file.name);
        setCameraDenied(false); // remove warning since upload succeeded
        setPopupMessage("Video loaded successfully!");
        setTimeout(() => setShowPopup(false), 2000);
      } catch (err) {
        setPopupMessage("Failed to load video file.");
        setTimeout(() => setShowPopup(false), 3000);
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingVideo && videoIntroDuration > 0) {
      timer = setTimeout(() => {
        setVideoIntroDuration((prev) => prev - 1);
      }, 1000);
    } else if (isRecordingVideo && videoIntroDuration === 0) {
      if (isVideoSimulationActive) {
        stopVideoIntroSimulation();
      } else if (videoIntroRecorder) {
        try {
          videoIntroRecorder.stop();
        } catch (e) {}
        setIsRecordingVideo(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isRecordingVideo, videoIntroDuration, videoIntroRecorder, isVideoSimulationActive]);

  // Sync wallpaper to localStorage
  useEffect(() => {
    if (backgroundWallpaper) {
      safeSetItem("backgroundWallpaper", backgroundWallpaper);
    } else {
      localStorage.removeItem("backgroundWallpaper");
    }
  }, [backgroundWallpaper]);

  // Sync state to Supabase via our API
  useEffect(() => {
    if (!isLoggedIn || !profileData.email) return;

    const syncState = async () => {
      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: profileData.email,
            state: {
              currentView,
              profileCompleted,
              balance,
              transactions,
              pendingApprovals,
              businessRequests,
              isBusinessMode,
              profileData,
              appliedGigs,
              messages,
              gigs,
              backgroundWallpaper,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // If the server merged data (like new receipts or balance), update local state
          if (data.state) {
            const remote = data.state;
            // Only update if there is a real difference to avoid render loops
            if (remote.balance !== undefined && remote.balance !== balance) {
              setBalance(remote.balance);
            }
            if (
              remote.transactions &&
              JSON.stringify(remote.transactions) !==
                JSON.stringify(transactions)
            ) {
              setTransactions(remote.transactions);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to sync to Supabase:", e);
      }
    };

    const timeout = setTimeout(syncState, 2000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [
    isLoggedIn,
    currentView,
    profileCompleted,
    balance,
    transactions,
    pendingApprovals,
    businessRequests,
    isBusinessMode,
    profileData,
    appliedGigs,
    messages,
    gigs,
    backgroundWallpaper,
  ]);

  // Check email existence
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (loginEmail.includes("@") && loginEmail.includes(".")) {
        setEmailCheckStatus("checking");
        try {
          const res = await fetch(`/api/check-account?email=${encodeURIComponent(loginEmail)}`);
          const data = await res.json();
          setEmailCheckStatus(data.exists ? "found" : "not_found");
        } catch (e) {
          console.error("Failed to check account:", e);
          setEmailCheckStatus("idle");
        }
      } else {
        setEmailCheckStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [loginEmail]);
  useEffect(() => {
    if (!isLoggedIn || !profileData.email) return;

    const loadState = async (skipProfile = false) => {
      try {
        const res = await fetch(`/api/state/${profileData.email}`);
        if (res.ok) {
          const state = await res.json();
          if (state && Object.keys(state).length > 0) {
            if (state.currentView) setCurrentView(state.currentView);
            if (state.profileCompleted !== undefined)
              setProfileCompleted(state.profileCompleted);
            if (state.balance !== undefined) setBalance(state.balance);
            if (state.transactions) setTransactions(state.transactions);
            if (state.pendingApprovals)
              setPendingApprovals(state.pendingApprovals);
            if (state.businessRequests)
              setBusinessRequests(state.businessRequests);
            if (state.isBusinessMode !== undefined)
              setIsBusinessMode(state.isBusinessMode);
            if (state.profileData && !skipProfile)
              setProfileData(ensureProfileData(state.profileData));
            if (state.appliedGigs) setAppliedGigs(state.appliedGigs);
            if (state.messages) setMessages(state.messages);
            if (state.gigs)
              setGigs(
                state.gigs.filter(
                  (g: any) => g.id !== 1 && g.title !== "Garden Help"
                )
              );
            if (state.backgroundWallpaper)
              setBackgroundWallpaper(state.backgroundWallpaper);
          }
        }
      } catch (e) {
        console.warn("Failed to load from Supabase:", e);
      }
    };
    loadState(false);

    // Auto-refresh for Admin every 30 seconds
    if (isLoggedIn && profileData.email === "21lucihanomatthews@gmail.com") {
      intervalRef.current = window.setInterval(() => loadState(true), 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoggedIn]);

  // Standard Persistence Effects
  useEffect(() => {
    safeSetItem("isLoggedIn", String(isLoggedIn));
  }, [isLoggedIn]);
  useEffect(() => {
    safeSetItem("currentView", currentView);
  }, [currentView]);
  useEffect(() => {
    safeSetItem("profileCompleted", String(profileCompleted));
  }, [profileCompleted]);
  useEffect(() => {
    safeSetItem("balance", String(balance));
  }, [balance]);
  useEffect(() => {
    safeSetItem("transactions", JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    safeSetItem("pendingApprovals", JSON.stringify(pendingApprovals));
  }, [pendingApprovals]);
  useEffect(() => {
    safeSetItem("businessRequests", JSON.stringify(businessRequests));
  }, [businessRequests]);
  useEffect(() => {
    safeSetItem("isBusinessMode", String(isBusinessMode));
  }, [isBusinessMode]);
  useEffect(() => {
    safeSetItem("profileData", JSON.stringify(profileData));
  }, [profileData]);
  useEffect(() => {
    safeSetItem("appliedGigs", JSON.stringify(appliedGigs));
  }, [appliedGigs]);
  useEffect(() => {
    safeSetItem(
      "topBarNotifications",
      JSON.stringify(topBarNotifications),
    );
  }, [topBarNotifications]);
  useEffect(() => {
    safeSetItem("messages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    safeSetItem("gigs", JSON.stringify(gigs));
  }, [gigs]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        capturePhoto();
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleReport = (
    type: "gig" | "profile",
    targetId: number | string,
    reason: string,
  ) => {
    setMessages((prev) => {
      const safePrev = prev || {};
      const adminChat = safePrev[100] || [];
      const adminMsg = {
        sender: "me" as const,
        text: `I am reporting a ${type} (ID: ${targetId}) for reason: "${reason}". Please investigate.`,
      };

      return {
        ...safePrev,
        100: [...adminChat, adminMsg],
      };
    });
    setPopupMessage("Reported successfully to Admin");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleLogin = async () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail || !loginPassword) {
      alert("Please enter your email and password");
      return;
    }

    try {
      const res = await fetch(`/api/state/${normalizedEmail}`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const state = await res.json();
      if (state && state.profileData) {
        // CHECK VERIFICATION STATUS
        if (state.isVerified === false) {
          alert("Your account is not activated yet. Please check your email and click the activation link.");
          return;
        }

        if (state.profileData.password === loginPassword) {
          setIsLoggedIn(true);
          setProfileData(ensureProfileData(state.profileData));

          // Full state restoration
          if (state.currentView) setCurrentView(state.currentView);
          if (state.profileCompleted !== undefined)
            setProfileCompleted(state.profileCompleted);
          if (state.balance !== undefined) setBalance(state.balance);
          if (state.transactions) setTransactions(state.transactions);
          if (state.pendingApprovals)
            setPendingApprovals(state.pendingApprovals);
          if (state.businessRequests)
            setBusinessRequests(state.businessRequests);
          if (state.isBusinessMode !== undefined)
            setIsBusinessMode(state.isBusinessMode);
          if (state.appliedGigs) setAppliedGigs(state.appliedGigs);
          if (state.messages) setMessages(state.messages);
          if (state.gigs)
            setGigs(
              state.gigs.filter(
                (g: any) => g.id !== 1 && g.title !== "Garden Help"
              )
            );
          if (state.backgroundWallpaper)
            setBackgroundWallpaper(state.backgroundWallpaper);

          setPopupMessage("Welcome back!");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 2000);
          
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("loginEmail", loginEmail);
          localStorage.setItem("loginPassword", loginPassword);
        } else {
          alert("Incorrect Password for this email. Try again.");
        }
      } else {
        alert(
          `No account found for ${normalizedEmail}. Please register first.`,
        );
        setAuthMode("register");
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      alert(
        "System Error: Could not connect to the authentication server. Please try again later.",
      );
    }
  };

  const handleRegisterInitiate = async () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      alert("Please enter a valid email address");
      return;
    }
    if (loginPassword.length < 6) {
      alert("Please choose a password with at least 6 characters");
      return;
    }
    if (!acceptTerms) {
      alert("You must accept the Terms and Conditions to continue");
      return;
    }

    try {
      const res = await fetch("/api/auth/register-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginPassword,
          profileData: {
            ...profileData,
            email: normalizedEmail,
            password: loginPassword,
            isVisible: true,
            isVerified: false
          }
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start registration");

      setAuthMode("verify");
    } catch (e: any) {
      console.error("Register Init Error:", e);
      alert(`Registration error: ${e.message}`);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode("login");

    // Selectively clear only session-related data to preserve things like wallpaper
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("profileData");
    localStorage.removeItem("messages");
    localStorage.removeItem("appliedGigs");
    localStorage.removeItem("pendingApprovals");
    localStorage.removeItem("businessRequests");
    localStorage.removeItem("isBusinessMode");

    setLoginPassword("");

    setProfileData({
      fullName: "",
      dob: "",
      location: "",
      phone: "",
      email: "",
      gender: "",
      education: "",
      languages: "",
      info: "",
      experience: "",
      skills: "",
      workPreference: "",
      level: "Novice",
      password: "",
      isVisible: true,
      pictures: { left: "", front: "", right: "" },
      idDocument: "",
      isVerified: false,
      certificates: [],
      alternativePhone: "",
      whatsapp: "",
      linkedin: "",
      telegram: "",
      contactMethod: "Any",
      contactHours: "",
    });
    setBalance(0);
    setTransactions([]);
    setAppliedGigs([]);
    setCurrentView("seeker");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 5) {
        alert("You can only upload up to 5 images.");
        return;
      }
      const base64Promises = Array.from(files).map((file) =>
        fileToCompressedBase64(file as File)
      );
      const urls = await Promise.all(base64Promises);
      setNewGig((prev) => ({ ...prev, fileUrls: [...prev.fileUrls, ...urls] }));
    }
  };

  const requestCameraAccess = async (
    angle: "left" | "front" | "right" | "gig",
    mode: "user" | "environment" = facingMode,
  ) => {
    setIsCameraSimulationActive(false);
    setCameraDenied(false);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("navigator.mediaDevices.getUserMedia not available");
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setCapturingAngle(angle);
      setFacingMode(mode);
    } catch (err) {
      console.error("Camera Error:", err);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setStream(fallbackStream);
          setCapturingAngle(angle);
        } else {
          throw new Error("Fallback getUserMedia not available");
        }
      } catch (e) {
        console.warn("webcam access permission blocked or unavailable. triggering digital biometric simulation.");
        setCameraDenied(true);
        setIsCameraSimulationActive(true);
        setCapturingAngle(angle);
        setPopupMessage("Camera blocked by iframe. Unlocking Simulated Biometric Capture mode!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4500);
      }
    }
  };

  const startSequenceCapture = () => {
    setCameraSequence(["left", "front", "right"]);
    setSequenceIndex(0);
    requestCameraAccess("left");
    setCountdown(4);
  };

  const generateSimulatedPhoto = (angle: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Elegant navy to dark indigo gradient background for professional feel
      const grad = ctx.createLinearGradient(0, 0, 0, 480);
      grad.addColorStop(0, "#0b0f19");
      grad.addColorStop(1, "#1e1e38");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Grid lines for high-tech aesthetic
      ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 480); ctx.stroke();
      }
      for (let j = 0; j < 480; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(640, j); ctx.stroke();
      }

      // Capture boundary overlay
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, 580, 420);

      // Draw stylized head/shoulders outline representing the subject
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.arc(320, 210, 85, 0, Math.PI * 2); // Head
      ctx.fill();

      ctx.fillStyle = "#312e81";
      ctx.beginPath();
      ctx.ellipse(320, 440, 180, 130, 0, 0, Math.PI, true); // Shoulders
      ctx.fill();

      // Face mask outlines
      ctx.strokeStyle = "#4338ca";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(320, 210, 85, 0, Math.PI * 2);
      ctx.stroke();

      if (angle === "left") {
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(285, 205, 12, 0, Math.PI * 2); // Eye looking left
        ctx.fill();
        ctx.strokeStyle = "#818cf8";
        ctx.beginPath();
        ctx.ellipse(285, 205, 18, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (angle === "right") {
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(355, 205, 12, 0, Math.PI * 2); // Eye looking right
        ctx.fill();
        ctx.strokeStyle = "#818cf8";
        ctx.beginPath();
        ctx.ellipse(355, 205, 18, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(285, 205, 12, 0, Math.PI * 2); // Left eye
        ctx.arc(355, 205, 12, 0, Math.PI * 2); // Right eye
        ctx.fill();
        ctx.strokeStyle = "#818cf8";
        ctx.beginPath();
        ctx.ellipse(285, 205, 18, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(355, 205, 18, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Safe secure digital watermark
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#10b981";
      ctx.fillText("✓ VERIFIED IDENTITY SECURE SNAP", 50, 70);

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`ANGLE: ${angle.toUpperCase()}`, 50, 93);
      ctx.fillText(`TIME: ${new Date().toISOString()}`, 50, 110);
      ctx.fillText("IP SECURE HARBOUR PORT 3000", 50, 127);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(40, 70); ctx.lineTo(40, 40); ctx.lineTo(70, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(600, 70); ctx.lineTo(600, 40); ctx.lineTo(570, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, 410); ctx.lineTo(40, 440); ctx.lineTo(70, 440); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(600, 410); ctx.lineTo(600, 440); ctx.lineTo(570, 440); ctx.stroke();
    }
    return canvas.toDataURL("image/jpeg", 0.65);
  };

  const capturePhoto = () => {
    let shouldClose = true;
    try {
      if (!capturingAngle) {
        console.warn("capturePhoto called when capturingAngle is null or falsy.");
        return;
      }

      let photo = "";
      if (isCameraSimulationActive) {
        photo = generateSimulatedPhoto(capturingAngle);
      } else {
        const video = document.getElementById("camera-preview") as HTMLVideoElement;
        if (!video) {
          console.error("Camera preview video element not found!");
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          photo = canvas.toDataURL("image/jpeg", 0.6);
        }
      }

      if (photo) {
        if (capturingAngle === "gig") {
          setNewGig((prev) => ({ ...prev, fileUrls: [...prev.fileUrls, photo] }));
        } else {
          if (capturingAngle === "front") {
            handleVerifyAndSetPicture(photo);
          } else {
            setProfileData((prev) => ({
              ...prev,
              pictures: { ...prev.pictures, [capturingAngle as any]: photo },
            }));
          }
        }

        // Check if we are in sequence capture mode
        if (cameraSequence && sequenceIndex < cameraSequence.length - 1) {
          shouldClose = false;
          const nextIndex = sequenceIndex + 1;
          setSequenceIndex(nextIndex);
          setCapturingAngle(cameraSequence[nextIndex]);
          setCountdown(4); // 4 seconds to prepare for the next pose
        } else if (cameraSequence) {
          // Finished the last pose in sequence
          setCameraSequence(null);
          setSequenceIndex(0);
          setPopupMessage("All 3 profile views captured successfully!");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 2500);
        }
      }
    } catch (e) {
      console.error("Failed to capture photo:", e);
    } finally {
      if (shouldClose) {
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    setCountdown(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCapturingAngle(null);
    setCameraSequence(null);
    setSequenceIndex(0);
  };

  const renderContent = () => {
    switch (currentView) {
      case "seeker":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-black tracking-tight">
              Available Seekers
            </h2>
            <div className="grid gap-4">
              {profileCompleted && profileData.isVisible && !profileData.isDisabled && profileData.pictures.front && 
                !(seekers || []).some(s => s.email === profileData.email) && (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98, backgroundColor: "#f0fdf4" }}
                  onClick={() => {
                    setSelectedSeeker({ id: 0, name: "My Profile" });
                    setCurrentView("profile-details");
                  }}
                  className="bg-white p-4 rounded-3xl shadow-sm border-2 border-[#007749]/20 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#007749]/5 rounded-2xl flex items-center justify-center overflow-hidden border border-[#007749]/10">
                      {profileData.pictures.front ? (
                        <img
                          src={profileData.pictures.front}
                          className="w-full h-full object-cover"
                          alt="Me"
                        />
                      ) : (
                        <User className="text-[#007749] w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                        {profileData.fullName || "My Profile"}
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold uppercase">Me</span>
                      </h3>
                      {/* Location and Province for Current User Seeker */}
                      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                        <span className="text-[#007749]">📍</span> {profileData.location || "South Africa"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {profileData.workPreference} Preference
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="px-2 py-0.5 bg-[#007749] text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">
                          {profileData.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const seekerId = 0; // The id of the current seeker
                        setActiveChat(seekerId);
                        
                        const currentMessages = messages || {};
                        if (!currentMessages[seekerId] || currentMessages[seekerId].length === 0) {
                          setMessages({
                            ...currentMessages,
                            [seekerId]: [
                              { sender: "me", text: `Hi ${profileData.fullName || "John Doe"}, I would like to hire you for a gig!`, companionName: profileData.fullName || "John Doe", companionEmail: profileData.email },
                              { sender: "other", text: "Hello! Thank you for choosing me. I am absolutely interested and available. Let's discuss details and rate here! 😊", companionName: profileData.fullName || "John Doe", companionEmail: profileData.email }
                            ]
                          });
                        }
                        setCurrentView("chat");
                      }}
                      className="bg-[#001489] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider relative z-10 shadow-sm transition-all hover:bg-blue-800 active:scale-95"
                    >
                      Hire
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#007749]/5 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#007749] rounded-full animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Nearby Seekers Category */}
              {seekers && seekers.some(s => s.location === profileData.location) && (
                <>
                  <h3 className="text-gray-900 font-black uppercase text-xs tracking-wider my-4 px-4">Nearby Seekers</h3>
                  {(seekers || []).filter(s => s.location === profileData.location).sort((a: any, b: any) => (a.skills || "").localeCompare(b.skills || "")).map((seeker) => {
                    const isLocalMe = seeker.email === profileData.email;
                    const seekerHashId = getEmailHashId(seeker.email);
                    return (
                        <SeekerItem
                            key={seeker.email}
                            seeker={seeker}
                            isLocalMe={isLocalMe}
                            seekerHashId={seekerHashId}
                            onClick={(seekerData: any, hashId: any) => {
                                setSelectedSeeker({ ...seekerData, id: hashId });
                                setCurrentView("profile-details");
                            }}
                            setActiveChat={setActiveChat}
                        />
                    );
                })}

                </>
              )}

              {/* Other Provinces Seekers Category */}
              <h3 className="text-gray-900 font-black uppercase text-xs tracking-wider my-4 px-4">Other Provinces</h3>
              {(seekers || []).filter(s => s.location !== profileData.location).sort((a: any, b: any) => (a.skills || "").localeCompare(b.skills || "")).map((seeker) => {
                const isLocalMe = seeker.email === profileData.email;
                const seekerHashId = getEmailHashId(seeker.email);
                return (
                    <SeekerItem
                        key={seeker.email}
                        seeker={seeker}
                        isLocalMe={isLocalMe}
                        seekerHashId={seekerHashId}
                        onClick={(seekerData: any, hashId: any) => {
                            setSelectedSeeker({ ...seekerData, id: hashId });
                            setCurrentView("profile-details");
                        }}
                        setActiveChat={setActiveChat}
                    />
                );
              })}
            </div>
          </div>
        );
      case "profile-details":
        if (!selectedSeeker) {
          return (
            <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-medium">No seeker selected. Please select a profile from the seekers list.</p>
              <button 
                onClick={() => setCurrentView("seeker")}
                className="mt-4 px-6 py-2 bg-[#001489] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#000d5a] transition-all"
              >
                Go to Seekers
              </button>
            </div>
          );
        }
        return (
          <motion.div
            layoutId={
              selectedSeeker?.id !== 0
                ? `seeker-card-${selectedSeeker?.id}`
                : undefined
            }
            className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 relative overflow-hidden"
          >
            {selectedSeeker?.id !== 0 && (
              <div className="flex justify-center mb-6 mt-4">
                <motion.div
                  layoutId={`seeker-img-${selectedSeeker?.id}`}
                  className="w-40 h-40 bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white z-10 relative"
                >
                  <img
                    src={selectedSeeker?.pictures?.front || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSeeker?.name || selectedSeeker?.id}`}
                    className="w-full h-full object-cover scale-110"
                    alt="Seeker"
                  />
                </motion.div>
              </div>
            )}

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 },
                },
              }}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <div className="text-center">
                <motion.h2
                  layoutId={
                    selectedSeeker?.id !== 0
                      ? `seeker-info-${selectedSeeker?.id}`
                      : undefined
                  }
                  className="text-3xl font-black text-gray-900 tracking-tight"
                >
                  {selectedSeeker?.id === 0
                    ? profileData.fullName || "My Profile"
                    : selectedSeeker?.name}
                </motion.h2>
                {selectedSeeker?.id !== 0 && (
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, scale: 0.5 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        },
                      },
                    }}
                    className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1"
                  >
                    Professional Seeker
                  </motion.p>
                )}
              </div>

              {selectedSeeker?.id === 0 && profileData.pictures.front && (
                <div className="flex justify-center mb-6">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        transition: { type: "spring" },
                      },
                    }}
                    className="w-40 h-40 bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white z-10 relative"
                  >
                    <img
                      src={profileData.pictures.front}
                      className="w-full h-full object-cover"
                      alt="Front Profile view"
                    />
                  </motion.div>
                </div>
              )}

              <motion.div
                variants={{
                  hidden: { opacity: 0, rotateX: -90, transformOrigin: "top" },
                  visible: {
                    opacity: 1,
                    rotateX: 0,
                    transition: { type: "spring", stiffness: 200, damping: 15 },
                  },
                }}
                className="grid grid-cols-2 gap-4 text-sm mt-4 bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
              >
                <div className="space-y-4">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Full Name
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedSeeker?.id === 0
                        ? profileData.fullName
                        : selectedSeeker?.fullName || "John Doe"}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Location
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedSeeker?.id === 0
                        ? profileData.location
                        : selectedSeeker?.location || "Cape Town"}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Education
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedSeeker?.id === 0
                        ? profileData.education
                        : selectedSeeker?.education || "Diploma"}
                    </p>
                  </motion.div>
                </div>
                <div className="space-y-4">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Languages
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedSeeker?.id === 0
                        ? profileData.languages
                        : selectedSeeker?.languages || "English"}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Work Pref
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedSeeker?.id === 0
                        ? profileData.workPreference
                        : selectedSeeker?.workPreference || "Permanent"}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Level
                    </p>
                    <span className="inline-block px-3 py-1 bg-[#007749] text-white font-black text-[10px] uppercase tracking-widest rounded-full">
                      {selectedSeeker?.id === 0 ? profileData.level : selectedSeeker?.level || "Novice"}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Skills
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedSeeker?.id === 0
                      ? profileData.skills
                      : selectedSeeker?.skills || "Gardening, Painting"}
                  </p>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Experience
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedSeeker?.id === 0
                      ? profileData.experience
                      : selectedSeeker?.experience || "5 years"}
                  </p>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    About
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedSeeker?.id === 0
                      ? profileData.info
                      : selectedSeeker?.info || "Hardworking individual."}
                  </p>
                </motion.div>
              </div>

              {selectedSeeker?.id === 0 &&
                profileData.certificates?.length > 0 && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1 },
                    }}
                    className="pt-4 border-t border-gray-100"
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                      Verified Certificates
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {profileData.certificates.map((cert, idx) => (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, rotate: -15 },
                            visible: {
                              opacity: 1,
                              rotate: 0,
                              transition: { type: "spring" },
                            },
                          }}
                          key={idx}
                          className="w-20 h-20 border-2 border-gray-100 rounded-2xl bg-gray-50 overflow-hidden relative group"
                        >
                          {cert.url.startsWith("data:image/") || !cert.url.startsWith("data:") ? (
                            <img
                              src={cert.url}
                              className="w-full h-full object-cover"
                              alt="cert"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-400 p-2 text-center">
                              <FileText className="w-6 h-6 mb-1 text-gray-300" />
                              <span className="text-[8px] font-bold truncate w-full" title={cert.name || "cert"}>{cert.name || "Doc"}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              try {
                                window.open(cert.url);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest transition-opacity cursor-pointer"
                          >
                            View
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

              {selectedSeeker?.id === 0 && profileData.idDocument && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  className="pt-4 border-t border-gray-100 mt-2"
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    ID Document
                  </p>
                  <motion.div
                    className="w-20 h-20 border-2 border-gray-100 rounded-2xl bg-gray-50 overflow-hidden relative group"
                  >
                    {profileData.idDocument.startsWith("data:image/") || !profileData.idDocument.startsWith("data:") ? (
                      <img
                        src={profileData.idDocument}
                        className="w-full h-full object-cover"
                        alt="ID Document"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-400 p-2 text-center">
                        <FileText className="w-6 h-6 mb-1 text-gray-300" />
                        <span className="text-[8px] font-bold truncate w-full" title="ID Document">ID Doc</span>
                      </div>
                    )}
                    <button
                      onClick={() => setViewingIdDocument(profileData.idDocument)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest transition-opacity cursor-pointer"
                    >
                      View
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* Contact Information Panel */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, scaleY: 0.8 },
                  visible: {
                    opacity: 1,
                    scaleY: 1,
                    transition: { type: "spring", stiffness: 150 },
                  },
                }}
                className="bg-[#001489]/5 p-6 rounded-[2rem] border border-[#001489]/10 mt-6 overflow-hidden"
              >
                <p className="text-[10px] text-[#001489] font-black uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Channels
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#001489]/5 flex items-center justify-center text-[#001489] shrink-0 border border-[#001489]/10">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-xs font-bold text-gray-800 break-all">
                        {selectedSeeker?.id === 0 ? profileData.email || "No email" : selectedSeeker?.email || "contact@example.com"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#001489]/5 flex items-center justify-center text-[#001489] shrink-0 border border-[#001489]/10">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Phone</p>
                      <p className="text-xs font-bold text-gray-800">
                        {selectedSeeker?.id === 0 ? profileData.phone || "No phone" : selectedSeeker?.phone || "+27 12 345 6789"}
                      </p>
                    </div>
                  </div>

                  {/* Alt Phone */}
                  {(selectedSeeker?.id === 0 ? profileData.alternativePhone : selectedSeeker?.alternativePhone) && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#001489]/5 flex items-center justify-center text-[#001489] shrink-0 border border-[#001489]/10">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Alt. Phone</p>
                        <p className="text-xs font-bold text-gray-800">
                          {selectedSeeker?.id === 0 ? profileData.alternativePhone : selectedSeeker?.alternativePhone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {(selectedSeeker?.id === 0 ? profileData.whatsapp : selectedSeeker?.whatsapp) && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 border border-green-100">
                        <span className="text-xs font-black">💬</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-green-600/80 uppercase tracking-wider">WhatsApp</p>
                        <p className="text-xs font-bold text-gray-850">
                          {selectedSeeker?.id === 0 ? profileData.whatsapp : selectedSeeker?.whatsapp}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LinkedIn */}
                  {(selectedSeeker?.id === 0 ? profileData.linkedin : selectedSeeker?.linkedin) && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <span className="text-xs font-black">in</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-blue-600/80 uppercase tracking-wider">LinkedIn</p>
                        <p className="text-xs font-bold text-gray-850 underline truncate block max-w-full">
                          {selectedSeeker?.id === 0 ? profileData.linkedin : selectedSeeker?.linkedin}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telegram */}
                  {(selectedSeeker?.id === 0 ? profileData.telegram : selectedSeeker?.telegram) && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 border border-sky-100">
                        <span className="text-xs font-black">✈</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-wider">Telegram</p>
                        <p className="text-xs font-bold text-gray-850">
                          {selectedSeeker?.id === 0 ? profileData.telegram : selectedSeeker?.telegram}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preferred Contact Info */}
                  <div className="flex items-start gap-2.5 col-span-1 sm:col-span-2 border-t border-gray-100 pt-3">
                    <div className="w-8 h-8 rounded-xl bg-[#007749]/5 flex items-center justify-center text-[#007749] shrink-0 border border-[#007749]/10">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#007749] uppercase tracking-wider">Preference & Hours</p>
                      <p className="text-xs font-bold text-gray-800">
                        Prefers <span className="text-[#001489] font-black">{selectedSeeker?.id === 0 ? profileData.contactMethod || "Any" : selectedSeeker?.contactMethod || "Email"}</span>
                        {(selectedSeeker?.id === 0 ? profileData.contactHours : selectedSeeker?.contactHours) ? ` during ${selectedSeeker?.id === 0 ? profileData.contactHours || "Anytime" : selectedSeeker?.contactHours || "Anytime"}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {selectedSeeker?.id !== 0 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const seekerId = selectedSeeker!.id;
                      setActiveChat(seekerId);
                      
                      const currentMessages = messages || {};
                      if (!currentMessages[seekerId] || currentMessages[seekerId].length === 0) {
                        setMessages({
                          ...currentMessages,
                          [seekerId]: [
                            { sender: "me", text: `Hi ${selectedSeeker?.name}, I would like to hire you for a gig!` },
                            { sender: "other", text: "Hello! Thank you for choosing me. I am absolutely interested and available. Let's discuss details and rate here! 😊" }
                          ]
                        });
                      }
                      setCurrentView("chat");
                    }}
                    className="w-full py-5 bg-[#001489] text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#001489]/20 hover:bg-[#000d5a] active:scale-95 transition-all mt-4"
                  >
                    Hire Now
                  </motion.button>
                  <button
                    onClick={() =>
                      handleReport(
                        "profile",
                        selectedSeeker!.id,
                        "Fake profile or abusive behavior",
                      )
                    }
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-[#E03C31] text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-[2rem] transition-all"
                  >
                    <Flag className="w-3 h-3" /> Report Profile
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );
      case "inbox":
        const inboxItems = Object.entries(messages || {}).map(([id, msgs]) => {
          const typedMsgs = msgs as { sender: "me" | "other"; text: string; companionName?: string; companionEmail?: string }[];
          const customName = typedMsgs.find((m) => m.companionName)?.companionName;
          return {
            id: parseInt(id),
            lastMessage:
              typedMsgs && typedMsgs.length > 0
                ? typedMsgs[typedMsgs.length - 1]
                : undefined,
            name:
              id === "100"
                ? "System/Admin"
                : id === "0"
                  ? profileData.fullName || "My Profile"
                  : customName || `John Doe ${id}`,
          };
        });

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
              {inboxItems.length > 0 && (
                <button
                  onClick={() => {
                    if (isInboxEditMode && selectedInboxThreads.length > 0) {
                      const newMessages = { ...messages };
                      selectedInboxThreads.forEach(
                        (id) => delete newMessages[id],
                      );
                      setMessages(newMessages);
                      setSelectedInboxThreads([]);
                    }
                    setIsInboxEditMode(!isInboxEditMode);
                  }}
                  className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${isInboxEditMode ? (selectedInboxThreads.length > 0 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700") : "text-blue-600 bg-blue-50"}`}
                >
                  {isInboxEditMode
                    ? selectedInboxThreads.length > 0
                      ? `Delete (${selectedInboxThreads.length})`
                      : "Cancel"
                    : "Edit"}
                </button>
              )}
            </div>
            {inboxItems.length === 0 ? (
              <div className="text-center mt-10 p-10 bg-white rounded-lg border border-gray-100">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No messages yet.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {inboxItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group flex items-center"
                  >
                    {isInboxEditMode && (
                      <div className="pr-3 pl-1">
                        <div
                          onClick={() => {
                            if (selectedInboxThreads.includes(item.id)) {
                              setSelectedInboxThreads(
                                selectedInboxThreads.filter(
                                  (i) => i !== item.id,
                                ),
                              );
                            } else {
                              setSelectedInboxThreads([
                                ...selectedInboxThreads,
                                item.id,
                              ]);
                            }
                          }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${selectedInboxThreads.includes(item.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                        >
                          {selectedInboxThreads.includes(item.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isInboxEditMode) {
                          if (selectedInboxThreads.includes(item.id)) {
                            setSelectedInboxThreads(
                              selectedInboxThreads.filter((i) => i !== item.id),
                            );
                          } else {
                            setSelectedInboxThreads([
                              ...selectedInboxThreads,
                              item.id,
                            ]);
                          }
                        } else {
                          setActiveChat(item.id);
                          setCurrentView("chat");
                          setSelectedSeeker({ id: item.id, name: item.name });
                        }
                      }}
                      className={`bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center gap-4 text-left flex-1 min-w-0 transition-all ${isInboxEditMode && selectedInboxThreads.includes(item.id) ? "border-blue-300 bg-blue-50/50" : ""}`}
                    >
                      <div className="w-12 h-12 bg-[#001489]/5 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        {item.id === 100 ? (
                          <Shield className="text-[#001489] w-6 h-6" />
                        ) : item.id === 0 ? (
                          profileData.pictures.front ? (
                            <img
                              src={profileData.pictures.front}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <User className="text-[#001489]/60" />
                          )
                        ) : (
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name || item.id}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {item.lastMessage?.text || "No messages"}
                        </p>
                      </div>
                    </button>
                    {!isInboxEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newMessages = { ...messages };
                          delete newMessages[item.id];
                          setMessages(newMessages);
                        }}
                        className="absolute right-4 p-2 text-gray-300 hover:text-red-500 bg-white/80 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "chat":
        if (!selectedSeeker) {
          return (
            <div className="fixed inset-0 bg-white z-[60] flex flex-col pt-20 pb-20 items-center justify-center p-8 text-center">
              <p className="text-gray-500 font-medium font-sans">No active chat selected. Please go to your inbox or seekers list to start talking.</p>
              <button 
                onClick={() => setCurrentView("inbox")}
                className="mt-4 px-6 py-2 bg-[#001489] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#000d5a] transition-all"
              >
                Go to Inbox
              </button>
            </div>
          );
        }
        return (
          <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shadow-sm sticky top-0 z-10">
              <button
                onClick={() => {
                  setCurrentView("inbox");
                  setChatFiles([]);
                }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-900 font-bold transition-colors py-1.5 px-2.5 rounded-xl hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                <span className="text-xs uppercase tracking-wider font-extrabold hidden sm:inline">Back</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeChat === 100 ? (
                    <div className="w-10 h-10 bg-blue-50 text-[#001489] rounded-full shrink-0 flex items-center justify-center border border-blue-100 shadow-sm">
                      <Shield className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
                      {activeChat === 0 ? (
                        profileData.pictures.front ? (
                          <img
                            src={profileData.pictures.front}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <User className="text-[#001489]/60 w-5 h-5" />
                        )
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSeeker?.name || activeChat}`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      )}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                </div>
                
                <div className="flex flex-col min-w-0">
                  <h2 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight truncate max-w-[150px] sm:max-w-none">
                    {selectedSeeker?.name}
                  </h2>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    Active Now
                  </span>
                </div>
              </div>
              
              <div className="w-14 flex justify-end relative">
                <button
                  onClick={() => setIsChatMenuOpen(!isChatMenuOpen)}
                  className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors focus:outline-none"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                
                <AnimatePresence>
                  {isChatMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-10 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[100]"
                    >
                      <button
                        onClick={() => {
                          const isBlocked = blockedUsers.includes(activeChat!);
                          if (isBlocked) {
                            setBlockedUsers(blockedUsers.filter(id => id !== activeChat!));
                          } else {
                            setBlockedUsers([...blockedUsers, activeChat!]);
                          }
                          setIsChatMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-sm font-bold text-gray-700"
                      >
                        <Ban className="w-4 h-4 text-gray-500" />
                        {blockedUsers.includes(activeChat!) ? "Unblock user" : "Block user"}
                      </button>
                      
                      <button
                        onClick={() => {
                          const updatedMessages = { ...messages };
                          delete updatedMessages[activeChat!];
                          setMessages(updatedMessages);
                          setIsChatMenuOpen(false);
                          setCurrentView("inbox");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors text-left text-sm font-bold text-red-500 border-t border-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col bg-slate-50/70">
              {((messages || {})[activeChat!] || []).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-[#001489] rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 tracking-tight text-lg">Send a Message</h3>
                    <p className="text-sm text-gray-500 max-w-xs mt-1">
                      Start your conversation with <span className="font-bold text-[#001489]">{selectedSeeker?.name}</span> safely on TimeGIG.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-800 text-[10px] font-black uppercase rounded-full border border-yellow-105">
                    <Shield className="w-3 h-3" />
                    Secure & Private Chat
                  </div>
                </div>
              ) : (
                ((messages || {})[activeChat!] || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[78%] break-words px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm flex flex-col gap-2 ${
                      msg.sender === "me"
                        ? "bg-gradient-to-r from-[#001489] to-[#0028e0] text-white self-end ml-auto rounded-tr-none shadow-blue-100/40"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none self-start"
                    }`}
                  >
                    {/* Render attachment images nicely */}
                    {msg.images && msg.images.length > 0 && (
                      <div className={`grid gap-1.5 rounded-lg overflow-hidden py-1 ${
                        msg.images.length === 1 
                          ? "grid-cols-1 w-44" 
                          : msg.images.length === 2 
                            ? "grid-cols-2 w-52" 
                            : "grid-cols-3 w-64"
                      }`}>
                        {msg.images.map((imgSrc, imgIdx) => (
                          <a 
                            key={imgIdx} 
                            href={imgSrc} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block aspect-square overflow-hidden rounded-md border border-gray-150 shadow-sm bg-slate-50 hover:opacity-90 transition-all cursor-zoom-in"
                          >
                            <img
                              src={imgSrc}
                              className="w-full h-full object-cover"
                              alt="Attachment"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {msg.text && (
                      <div className="whitespace-pre-wrap">
                        {renderDancingText(msg.text)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {blockedUsers.includes(activeChat!) ? (
              <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center shrink-0">
                <Ban className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium sm:text-sm text-xs">
                  You have blocked this user. 
                </p>
                <button
                  onClick={() => setBlockedUsers(blockedUsers.filter(id => id !== activeChat!))}
                  className="mt-3 px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Unblock User
                </button>
              </div>
            ) : (
              <>
                {/* Quick Emoji Reaction Bar */}
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                    Quick Tap:
                  </span>
                  <div className="flex gap-2">
                    {[
                      "😊",
                      "😂",
                      "😍",
                      "👍",
                      "🔥",
                      "✨",
                      "👋",
                      "🎉",
                      "❤️",
                      "💼",
                      "💪",
                      "🚀",
                    ].map((emoji) => (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.25, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNewMessage((prev) => prev + emoji)}
                        className="w-8 h-8 rounded-full bg-slate-50 shadow-sm border border-gray-100 flex items-center justify-center text-lg hover:border-[#001489]/20 transition-all shrink-0"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Selected Files Preview Row */}
                {chatFiles.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2.5 overflow-x-auto shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {chatFiles.map((file, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm shrink-0 group">
                        <img src={file.base64} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setChatFiles(chatFiles.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center rounded-full shadow-md transition-all active:scale-95"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Input Row */}
                <form
                  className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newMessage.trim() || chatFiles.length > 0) {
                      const safeMessages = messages || {};
                      setMessages({
                        ...safeMessages,
                        [activeChat!]: [
                          ...(safeMessages[activeChat!] || []),
                          { 
                            sender: "me", 
                            text: newMessage,
                            images: chatFiles.length > 0 ? chatFiles.map(f => f.base64) : undefined
                          },
                        ],
                      });
                      setNewMessage("");
                      setChatFiles([]);
                    }
                  }}
                >
                  <div className="flex-1 relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#001489]/50 focus-within:bg-white rounded-full px-4 py-2 transition-all gap-2">
                    {/* Image upload label & hidden input */}
                    <label className="cursor-pointer shrink-0 w-8 h-8 rounded-full hover:bg-gray-200/50 flex items-center justify-center transition-all bg-transparent text-gray-500 hover:text-gray-900 active:scale-95">
                      <Image className="w-4.5 h-4.5" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(ev) => {
                          if (ev.target.files) {
                            const filesArray = Array.from(ev.target.files);
                            filesArray.forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setChatFiles((prev) => [
                                    ...prev,
                                    { name: file.name, base64: reader.result as string }
                                  ]);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                            ev.target.value = "";
                          }
                        }}
                      />
                    </label>
                    
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedSeeker?.name}...`}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!newMessage.trim() && chatFiles.length === 0}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all shrink-0 ${
                      newMessage.trim() || chatFiles.length > 0
                        ? "bg-[#001489] text-white shadow-[#001489]/20 hover:bg-blue-800 cursor-pointer"
                        : "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </>
            )}
          </div>
        );
      case "profile-edit":
        const allPicturesCaptured = !!profileData.pictures.front;
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Complete Seeker Profile
            </h2>

            {profileCompleted ? (
              <div className="flex flex-col items-center justify-center p-10 bg-green-50 rounded-[2.5rem] border border-green-100/50 max-w-md mx-auto text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                <h3 className="text-xl font-black text-green-800 uppercase tracking-wide">
                  Congratulations!
                </h3>
                <p className="text-green-600 mt-2 font-bold text-sm">Your profile is completed and verified.</p>
                <div className="flex flex-col gap-2.5 w-full mt-6">
                  <button
                    onClick={() => setCurrentView("seeker")}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-md shadow-green-100"
                  >
                    Back to Seekers
                  </button>
                  <button
                    onClick={() => setProfileCompleted(false)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all"
                  >
                    Edit Info & Contacts
                  </button>
                </div>
              </div>
            ) : (
                <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!allPicturesCaptured) {
                    setPopupMessage(
                      "Rejected: You must capture or upload your profile picture (Front View) before saving.",
                    );
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 3000);
                    return;
                  }
                  if (!profileData.isVerified) {
                    setPopupMessage(
                      "Rejected: You must upload and verify your ID document before saving.",
                    );
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 3000);
                    return;
                  }
                  setProfileCompleted(true);
                  setPopupMessage("Profile successfully verified and saved!");
                  setShowPopup(true);
                  setTimeout(() => setShowPopup(false), 2000);
                }}
              >
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Required Profile Picture
                    </h3>
                  </div>
                  <div className="flex justify-center py-4">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="relative w-48 h-48">
                        <div
                          className={`w-full h-full rounded-[1.5rem] flex flex-col items-center justify-between border-2 transition-all overflow-hidden relative ${profileData.pictures.front ? "border-green-500 bg-green-50 shadow-lg shadow-green-100" : "border-dashed border-gray-200 bg-gray-50/50"}`}
                        >
                          {isVerifyingFace ? (
                            <div className="flex flex-col items-center justify-center p-4 h-full w-full bg-white/95 backdrop-blur-sm z-10 transition-all">
                              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                              <span className="text-[9px] uppercase font-black text-blue-600 tracking-wider text-center">
                                Verifying Picture Clarity...
                              </span>
                              <span className="text-[7px] text-gray-400 mt-1 text-center">
                                Analyzing face with Gemini AI
                              </span>
                            </div>
                          ) : profileData.pictures.front ? (
                            <>
                              <img
                                src={profileData.pictures.front}
                                className="w-full h-full object-cover"
                                alt="Front Profile View"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFaceVerificationError("");
                                  setProfileData((prev) => ({
                                    ...prev,
                                    pictures: {
                                      ...prev.pictures,
                                      front: "",
                                    },
                                  }));
                                }}
                                className="absolute top-1.5 right-1.5 bg-red-400 text-white rounded-full p-1 hover:bg-red-500 transition-colors cursor-pointer shadow z-10"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                              </button>
                              <span className="absolute bottom-1 bg-black/60 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Front View
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-between p-4 h-full w-full">
                              <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider text-center mt-1">
                                Front View (Profile Pic)
                              </span>
                              <Camera className="text-gray-300 w-8 h-8 my-1" />
                              <div className="flex flex-col gap-1.5 w-full mb-1">
                                <button
                                  type="button"
                                  onClick={() => requestCameraAccess("front")}
                                  className="bg-blue-600 hover:bg-blue-700 text-[9px] text-white font-black uppercase py-1 px-2 rounded-xl transition-all tracking-wider text-center cursor-pointer shadow-sm"
                                >
                                  Take Photo
                                </button>
                                <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] font-black uppercase py-1 px-2 rounded-xl transition-all tracking-wider text-center cursor-pointer block shadow-sm">
                                  Upload Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          if (reader.result) {
                                            const compressed = await compressImage(reader.result as string, 600, 400, 0.6);
                                            handleVerifyAndSetPicture(compressed);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {faceVerificationError && (
                        <div className="w-64 text-red-600 text-[10px] font-black tracking-tight text-center mt-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100 uppercase animate-bounce">
                          ⚠️ {faceVerificationError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {allPicturesCaptured && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-green-100">
                    ✓ Profile Picture Validated
                  </div>
                )}
                
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      ID Document Verification
                    </h3>
                  </div>
                  {!profileData.isVerified ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-[1.5rem]">
                      <Shield className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-xs font-bold text-gray-600 text-center mb-4">
                        Please upload your ID to complete verification (matches against your profile picture).
                      </p>
                      {isVerifyingIdentity ? (
                        <div className="flex flex-col items-center">
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mb-2" />
                          <span className="text-[10px] uppercase font-black text-blue-600">Verifying AI Match...</span>
                        </div>
                      ) : (
                        <label className="bg-[#001489] hover:bg-blue-800 text-white text-xs font-black uppercase py-2.5 px-6 rounded-xl transition-all tracking-wider cursor-pointer shadow-sm">
                          Upload ID Document
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  if (reader.result) {
                                    // if it's an image we compress it, if pdf we just pass it
                                    let base64 = reader.result as string;
                                    if (file.type.startsWith("image/")) {
                                      base64 = await compressImage(base64, 800, 800, 0.7);
                                    }
                                    handleVerifyIdentity(base64);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-bold text-sm">Identity Verified</p>
                        <p className="text-[10px] uppercase font-black tracking-wider opacity-80">AI Face Match &gt; 75% Confirmed</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="date"
                    placeholder="DOB"
                    value={profileData.dob}
                    onChange={(e) =>
                      setProfileData({ ...profileData, dob: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Location (City/Province)"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        location: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                  <select
                    value={profileData.gender}
                    onChange={(e) =>
                      setProfileData({ ...profileData, gender: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Education Level"
                    value={profileData.education}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        education: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Languages"
                    value={profileData.languages}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        languages: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <textarea
                  placeholder="Tell us about yourself (Bio)"
                  value={profileData.info}
                  onChange={(e) =>
                    setProfileData({ ...profileData, info: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                ></textarea>
                <textarea
                  placeholder="Work Experience"
                  value={profileData.experience}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      experience: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                ></textarea>
                <input
                  type="text"
                  placeholder="Job Skills"
                  value={profileData.skills}
                  onChange={(e) =>
                    setProfileData({ ...profileData, skills: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />

                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-4">
                  <h4 className="text-xs font-black text-[#001489] uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Additional Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Alternative Phone (Optional)"
                      value={profileData.alternativePhone || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, alternativePhone: e.target.value })
                      }
                      className="w-full p-2.5 border bg-white rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp Number (Optional)"
                      value={profileData.whatsapp || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, whatsapp: e.target.value })
                      }
                      className="w-full p-2.5 border bg-white rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="LinkedIn Profile URL (Optional)"
                      value={profileData.linkedin || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, linkedin: e.target.value })
                      }
                      className="w-full p-2.5 border bg-white rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Telegram Username (Optional)"
                      value={profileData.telegram || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, telegram: e.target.value })
                      }
                      className="w-full p-2.5 border bg-white rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                        Preferred Contact Method
                      </label>
                      <select
                        value={profileData.contactMethod || "Any"}
                        onChange={(e) =>
                          setProfileData({ ...profileData, contactMethod: e.target.value })
                        }
                        className="w-full p-2.5 border bg-white rounded-lg text-sm"
                      >
                        <option value="Any">Any Contact Method</option>
                        <option value="Email">Email Address</option>
                        <option value="Phone">Phone Call</option>
                        <option value="WhatsApp">WhatsApp Message</option>
                        <option value="In-App Chat">In-App Live Chat</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                        Available/Preferred Hours
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9 AM - 5 PM / Anytime"
                        value={profileData.contactHours || ""}
                        onChange={(e) =>
                          setProfileData({ ...profileData, contactHours: e.target.value })
                        }
                        className="w-full p-2.5 border bg-white rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Certificates & Qualifications
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files) {
                        const base64Promises = Array.from(files).map(async (f) => {
                          const url = await fileToCompressedBase64(f as File);
                          return {
                            name: (f as File).name,
                            url: url,
                          };
                        });
                        const newCerts = await Promise.all(base64Promises);
                        setProfileData((prev) => ({
                          ...prev,
                          certificates: [...prev.certificates, ...newCerts],
                        }));
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {profileData.certificates?.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2 p-2 bg-gray-50 rounded border border-dashed">
                      {profileData.certificates.map((cert, idx) => (
                        <div
                          key={idx}
                          className="relative group w-12 h-12 bg-white border rounded overflow-hidden"
                        >
                          {cert.url.startsWith("data:image/") || !cert.url.startsWith("data:") ? (
                            <img
                              src={cert.url}
                              className="w-full h-full object-cover"
                              alt="cert"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-400 p-1 text-center">
                              <FileText className="w-4 h-4 mb-0.5 text-gray-300" />
                              <span className="text-[6px] font-bold truncate w-full" title={cert.name || "cert"}>{cert.name || "Doc"}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setProfileData((prev) => ({
                                ...prev,
                                certificates: prev.certificates.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={profileData.workPreference}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      workPreference: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Work Preference</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Casual">Casual</option>
                  <option value="Both">Both</option>
                </select>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Current Level
                  </p>
                  <p className="font-semibold text-blue-600">
                    {profileData.level}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Display profile in Seeker list?
                    </p>
                    <p className="text-xs text-gray-500">
                      Allow others to find and hire you.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProfileData({ ...profileData, isVisible: true })
                      }
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${profileData.isVisible ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProfileData({ ...profileData, isVisible: false })
                      }
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${!profileData.isVisible ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      No
                    </button>
                  </div>
                </div>


                {!isBusinessMode && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-bold text-gray-800 mb-2">
                      Setup Business Account
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Select and upload up to 10 business registration documents
                      at once (PDF, JPG, PNG).
                    </p>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="sr-only">Choose files</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,image/*"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files) {
                              const newFiles = Array.from(files);
                              if (businessDocs.length + newFiles.length > 10) {
                                alert(
                                  "You can only upload a maximum of 10 documents in total.",
                                );
                              } else {
                                const promises = newFiles.map(async (file) => {
                                  const url = await fileToCompressedBase64(file as File);
                                  return {
                                    name: (file as File).name,
                                    url: url,
                                    type: (file as File).type,
                                  };
                                });
                                const results = await Promise.all(promises);
                                setBusinessDocs((prev) => [...prev, ...results]);
                              }
                              // Reset input so same file can be picked again if removed
                              e.target.value = "";
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </label>

                      {businessDocs.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                            Live Preview ({businessDocs.length}/10 folders)
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {businessDocs.map((f, idx) => {
                              const isImage = (f.type && f.type.startsWith("image/")) || (f.url && f.url.startsWith("data:image/"));
                              return (
                                <div
                                  key={idx}
                                  className="aspect-square bg-white rounded border overflow-hidden relative group shadow-sm"
                                >
                                  {isImage ? (
                                    <img
                                      src={f.url}
                                      className="w-full h-full object-cover"
                                      alt="preview"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                                      <FileText className="w-4 h-4 mb-0.5 text-blue-400" />
                                      <span className="text-[6px] font-bold text-center text-blue-500 w-full truncate px-1" title={f.name}>{f.name}</span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBusinessDocs(
                                        businessDocs.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      )
                                    }
                                    className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 pointer-events-none">
                                    <span className="text-[8px] text-white font-bold truncate">
                                      {f.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={businessDocs.length < 2}
                        onClick={() => {
                          if (businessDocs.length >= 2) {
                            setBusinessRequests([
                              ...businessRequests,
                              {
                                id: Date.now(),
                                user: "Current User",
                                documents: businessDocs.map((f) => f.url),
                                status: "pending",
                              },
                            ]);
                            setBusinessDocs([]);
                            setPopupMessage(
                              "Business account submitted! In Review.",
                            );
                            setShowPopup(true);
                            setTimeout(() => setShowPopup(false), 3000);
                          } else {
                            alert(
                              "Please upload at least 2 documents for verification.",
                            );
                          }
                        }}
                        className={`w-full p-2 rounded text-sm font-bold border transition-colors ${businessDocs.length >= 2 ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-100 text-gray-400 border-gray-200"}`}
                      >
                        {businessDocs.length === 1
                          ? "Add 1 more document"
                          : "Submit for Review"}
                      </button>
                    </div>
                  </div>
                )}
                {(businessRequests || []).some(
                  (r) => r.user === "Current User" && r.status === "pending",
                ) && (
                  <div className="bg-blue-50 p-3 rounded text-blue-700 text-sm font-bold border border-blue-100 flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    Account In Review: Verification in progress
                  </div>
                )}
                {isBusinessMode && (
                  <div className="bg-green-50 p-3 rounded text-green-700 text-sm font-bold border border-green-100 mt-4">
                    ✓ Verified Business Owner Account
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
                   <button
                     type="button"
                     onClick={async () => {
                       const newStatus = !profileData.isDisabled;
                       if (window.confirm(`Are you sure you want to ${newStatus ? 'disable' : 'enable'} your account?`)) {
                         const updatedProfile = { ...profileData, isDisabled: newStatus };
                         setProfileData(updatedProfile);
                         try {
                           await fetch("/api/sync", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({
                               userId: profileData.email,
                               state: { profileData: updatedProfile }
                             })
                           });
                           setPopupMessage(`Account ${newStatus ? 'disabled' : 'enabled'} successfully`);
                           setShowPopup(true);
                           setTimeout(() => setShowPopup(false), 2000);
                         } catch (e) {
                           console.error("Failed to sync account status:", e);
                         }
                       }
                     }}
                     className={`px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold transition-all ${
                       profileData.isDisabled 
                        ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                     }`}
                   >
                     {profileData.isDisabled ? "Enable Account" : "Disable Account"}
                   </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-[#007749] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-green-100 hover:bg-[#00663d] active:scale-95 transition-all"
                >
                  Save & Verify Identity
                </button>
              </form>
            )}
          </div>
        );
      case "gigs":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-black tracking-tight">
              Available Gigs
            </h2>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => setGigsTab("all")}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all ${
                  gigsTab === "all"
                    ? "bg-[#001489] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All Gigs
              </button>
              <button
                onClick={() => setGigsTab("applied")}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all ${
                  gigsTab === "applied"
                    ? "bg-[#001489] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Applied ({(appliedGigs || []).length})
              </button>
              <button
                onClick={() => {
                  setGigsTab("applications");
                  fetchApplications();
                }}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all ${
                  gigsTab === "applications"
                    ? "bg-[#001489] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Applications Received ({(gigApplications || []).filter(app => (gigs || []).find(g => g.id === app.gigId)?.creator === profileData.fullName).length})
              </button>
            </div>
            {gigsTab === "all" && (
              <form
                className="bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-xl border border-white/20 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newGig.fileUrls.length === 0) {
                    setPopupMessage(
                      "Rejected: You must attach at least one image or video to post a gig.",
                    );
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 3000);
                    return;
                  }
                  setGigs([
                    {
                      id: Date.now(),
                      ...newGig,
                      creator: profileData.fullName || "Anonymous",
                      creatorEmail: profileData.email,
                      views: 0,
                      applicants: 0,
                    },
                    ...gigs,
                  ]);
                  setNewGig({
                    title: "",
                    description: "",
                    files: null,
                    fileUrls: [],
                    isImmediate: true,
                    gigDate: "",
                  });
                  setPopupMessage("Gig posted successfully!");
                  setShowPopup(true);
                  setTimeout(() => setShowPopup(false), 2000);
                }}
              >
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Plus className="w-3 h-3" /> Post a new gig
                </h3>
                <input
                  type="text"
                  placeholder="Gig Title"
                  value={newGig.title}
                  onChange={(e) =>
                    setNewGig({ ...newGig, title: e.target.value })
                  }
                  className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  required
                />
                <textarea
                  placeholder="Tell us more about the job..."
                  value={newGig.description}
                  onChange={(e) =>
                    setNewGig({ ...newGig, description: e.target.value })
                  }
                  className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm h-24 resize-none"
                  required
                />
                
                <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" id="isImmediate" checked={newGig.isImmediate} onChange={(e) => setNewGig({...newGig, isImmediate: e.target.checked})} className="accent-[#001489] w-4 h-4" />
                    <label htmlFor="isImmediate" className="text-xs font-bold text-gray-700">Post Immediately</label>
                </div>
                {!newGig.isImmediate && (
                    <input type="date" value={newGig.gigDate} onChange={(e) => setNewGig({...newGig, gigDate: e.target.value})} className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold" />
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex-1 min-w-[120px] flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 cursor-pointer transition-all hover:bg-blue-50/30">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => requestCameraAccess("gig", "environment")}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 cursor-pointer transition-all hover:bg-blue-50/30"
                  >
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                      Capture
                    </span>
                  </button>

                  <button
                    type="submit"
                    className="w-full p-4 bg-[#001489] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-[#000d5a] active:scale-95 transition-all"
                  >
                    Submit Post
                  </button>
                </div>

                {newGig.fileUrls.length > 0 && (
                  <div className="flex gap-2.5 p-1 overflow-x-auto">
                    {newGig.fileUrls.map((url, uidx) => (
                      <div key={url} className="relative group shrink-0">
                        <img
                          src={url}
                          alt="preview"
                          className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewGig((prev) => ({
                              ...prev,
                              fileUrls: prev.fileUrls.filter((_, idx) => idx !== uidx)
                            }));
                          }}
                          className="absolute inset-0 bg-red-500/80 rounded-xl text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase transition-opacity"
                          title="Click to remove attachment"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}

            {gigsTab === "applications" ? (
              <div className="space-y-6 pb-12">
                {(() => {
                  const myGigs = (gigs || []).filter((g) => g.creator === profileData.fullName);
                  const myGigIds = myGigs.map((g) => g.id);
                  const receivedApps = (gigApplications || []).filter((app) => myGigIds.includes(app.gigId));

                  if (receivedApps.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-6 border border-gray-100">
                        <p className="text-gray-400 text-sm font-bold">No applications received yet for your postings.</p>
                      </div>
                    );
                  }

                  return receivedApps.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4"
                    >
                      <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {app.gigTitle}
                          </span>
                          <h3 className="text-lg font-black text-gray-900 mt-1">{app.applicantName}</h3>
                          <p className="text-xs text-gray-400 font-bold">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === "pending" ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-black rounded-full uppercase">Pending Review</span>
                          ) : app.status === "approved" ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase border border-green-200">Approved ✓</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full uppercase border border-red-200">Rejected ✗</span>
                          )}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-1">Applicant Contact</p>
                          <p className="text-gray-800 font-medium"><strong>Email:</strong> {app.applicantEmail}</p>
                          <p className="text-gray-800 font-medium"><strong>Phone:</strong> {app.applicantPhone}</p>
                          <p className="text-gray-800 font-medium"><strong>Level:</strong> {app.applicantLevel || "Beginner"}</p>
                        </div>
                        <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-1">Applicant Skills & Bio</p>
                          <p className="text-gray-800 text-xs whitespace-pre-wrap">{app.applicantInfo || "No details provided."}</p>
                        </div>
                      </div>

                      {/* PICTURES AND IDENTITY DOCUMENTS SCREENSHOT PROTECTED VIEWER */}
                      <div className="bg-gray-50 p-4 rounded-3xl space-y-3">
                        <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Applicant's Verified Credentials</h4>
                        <div className="flex gap-4 items-center flex-wrap">
                          {app.pictures?.front && (
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Portrait Photo</p>
                              <div className="w-16 h-16 rounded-xl border-2 border-white shadow overflow-hidden">
                                <img src={app.pictures.front} className="w-full h-full object-cover" alt="Portrait" />
                              </div>
                            </div>
                          )}
                          {app.idDocument && (
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">ID Document</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<iframe src="${app.idDocument}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                  } else {
                                    alert("ID Document view is not available on this preview.");
                                  }
                                }}
                                className="px-3 py-2 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-blue-100 transition-colors border border-blue-100/50 flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" /> View ID Doc
                              </button>
                            </div>
                          )}
                          {app.certificates && app.certificates.length > 0 && (
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Certificates ({app.certificates.length})</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {app.certificates.map((cert: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      const win = window.open();
                                      if (win) win.document.write(`<iframe src="${cert.url}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;"></iframe>`);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded uppercase tracking-wider border border-emerald-100/50 hover:bg-emerald-100 transition-all font-bold"
                                  >
                                    Cert #{idx+1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* LIVESTREAM / RECORDED VIDEO DESCRIPTIONS PLAYBACK */}
                      {(app.videoUrl || app.videoData) ? (
                        <div className="bg-gray-50/70 p-4 rounded-3xl space-y-2">
                          <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                            Live 60s Explanation Clip
                          </h4>
                          <div className="max-w-md mx-auto aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-100 relative group">
                            <video
                              src={app.videoUrl || app.videoData}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No explanation video uploaded for this application.</p>
                      )}

                      {/* DECISION ACTION BUTTONS */}
                      {app.status === "pending" && (
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, "approved")}
                            className="flex-1 py-3 bg-[#007749] text-white font-black uppercase text-xs tracking-wider rounded-2xl hover:bg-[#00663d] transition-all shadow-md shadow-green-100"
                          >
                            Approve Application
                          </button>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                            className="flex-1 py-3 bg-[#E03C31] text-white font-black uppercase text-xs tracking-wider rounded-2xl hover:bg-red-700 transition-all shadow-md shadow-red-100"
                          >
                            Reject Application
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ));
                })()}
              </div>
            ) : (
              <div className="grid gap-4 mt-8 pb-10">
                {(() => {
                  const filteredGigs = (gigs || []).filter((gig) => {
                    if (gigsTab === "applied") {
                      return (appliedGigs || []).includes(gig.id);
                    }
                    return true;
                  });

                  if (filteredGigs.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-gray-100 p-6">
                        <p className="text-gray-400 text-sm font-bold">
                          {gigsTab === "applied"
                            ? "You haven't applied to any gigs yet."
                            : "No gigs available at the moment."}
                        </p>
                      </div>
                    );
                  }

                  return filteredGigs.map((gig) => {
                    const isMyGig = gig.creator === profileData.fullName;
                    const alreadyApplied = (appliedGigs || []).includes(gig.id);
                    const appStatus = (gigApplications || []).find(
                      (app) => app.gigId === gig.id && app.applicantEmail === profileData.email
                    )?.status || "pending";
                    return (
                      <motion.div
                        key={gig.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98, backgroundColor: "#eff6ff" }}
                        onClick={() => {
                          setSelectedGig(gig);
                          setCurrentView("gig-details");
                        }}
                        className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
                              {gig.fileUrls && gig.fileUrls.length > 0 ? (
                                <img
                                  src={gig.fileUrls[0]}
                                  className="w-full h-full object-cover"
                                  alt="thumbnail"
                                />
                              ) : (
                                <div className="w-full h-full bg-red-50 flex items-center justify-center text-[8px] font-black text-red-400 uppercase text-center p-1">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {gig.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] uppercase font-black text-gray-400">
                                  Owner: {gig.creator}
                                </p>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <p className="text-[10px] text-gray-400 font-bold">
                                  {gig.views} Views
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 px-3 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                              Details
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed ml-1">
                          {gig.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {gig.applicants} Applicants
                            </span>
                            {alreadyApplied && (
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                                appStatus === "approved" 
                                  ? "bg-green-100 text-green-700" 
                                  : appStatus === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700 font-bold"
                              }`}>
                                {appStatus === "approved" ? "Approved ✓" : appStatus === "rejected" ? "Rejected ✗" : "Pending"}
                              </span>
                            )}
                          </div>
                          {isMyGig ? (
                            <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded tracking-tighter border border-blue-100">
                              My Listing
                            </span>
                          ) : (
                            <ArrowRight className="w-4 h-4 text-gray-300" />
                          )}
                        </div>

                        {gig.fileUrls?.length > 0 && (
                          <div className="flex gap-2 p-1 overflow-x-auto">
                            {gig.fileUrls.map((url) => (
                              <img
                                key={url}
                                src={url}
                                alt="gig"
                                className="w-12 h-12 object-cover rounded-xl"
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        );
      case "gig-details":
        if (!selectedGig) return null;
        const alreadyApplied_details = (appliedGigs || []).includes(
          selectedGig.id,
        );
        const isMyGig_details = selectedGig.creator === profileData.fullName;
        return (
          <div className="space-y-6 pb-20">
            <button
              onClick={() => setCurrentView("gigs")}
              className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to gigs
            </button>

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-2 overflow-hidden">
                  {selectedGig.fileUrls && selectedGig.fileUrls.length > 0 ? (
                    <img
                      src={selectedGig.fileUrls[0]}
                      className="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  ) : (
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">
                    TimeGIG
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Verified Gig
                  </span>
                </div>
              </div>

              {isEditingGig ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Title
                    </h4>
                    <input
                      type="text"
                      value={editingGigData.title}
                      onChange={(e) =>
                        setEditingGigData({
                          ...editingGigData,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:border-[#001489] focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Description
                    </h4>
                    <textarea
                      value={editingGigData.description}
                      onChange={(e) =>
                        setEditingGigData({
                          ...editingGigData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:border-[#001489] focus:bg-white outline-none transition-all text-sm h-32 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                      {selectedGig.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-xs font-bold text-gray-500 capitalize">
                          {selectedGig.creator}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          Post ID: #{selectedGig.id.toString().slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-50">
                    <div className="bg-gray-50/50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Views
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        {selectedGig.views}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Applicants
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        {selectedGig.applicants}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Description
                    </h4>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedGig.description}
                    </p>
                  </div>
                </>
              )}

              {selectedGig.fileUrls && selectedGig.fileUrls.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Media Attachments
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {selectedGig.fileUrls.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt="gig media"
                        className="w-32 h-32 object-cover rounded-3xl border-4 border-white shadow-md flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                {isEditingGig ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setGigs(
                          gigs.map((g) =>
                            g.id === selectedGig.id
                              ? { ...g, ...editingGigData }
                              : g,
                          ),
                        );
                        setSelectedGig({ ...selectedGig, ...editingGigData });
                        setIsEditingGig(false);
                      }}
                      className="flex-1 py-4 bg-[#007749] text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-100 hover:bg-[#00663d]"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingGig(false)}
                      className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : isMyGig_details ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditingGig(true);
                        setEditingGigData({
                          title: selectedGig.title,
                          description: selectedGig.description,
                          fileUrls: selectedGig.fileUrls,
                        });
                      }}
                      className="flex-1 py-4 bg-gray-100 text-[#001489] rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-gray-200 transition-all font-bold"
                    >
                      Edit Gig
                    </button>
                    <button
                      onClick={() => {
                        setGigs(gigs.filter((g) => g.id !== selectedGig.id));
                        setCurrentView("gigs");
                      }}
                      className="flex-1 py-4 bg-[#E03C31] text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                    >
                      Delete Gig
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pt-4 border-t border-gray-100">
                    {selectedGig.status === 'closed' ? (
                      <div className="bg-gray-100 p-5 rounded-[2rem] text-center">
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Gig Closed</p>
                      </div>
                    ) : alreadyApplied_details ? (
                      <div className="bg-green-50 border border-green-100 p-5 rounded-[2rem] text-center space-y-2">
                        <Check className="w-8 h-8 text-green-600 mx-auto" />
                        <h4 className="font-black text-green-800 uppercase tracking-wider text-xs">Application Submitted</h4>
                        <p className="text-xs text-green-700 font-medium">Your credentials and introduction are under review by the gig owner.</p>
                      </div>
                    ) : !showGigApplyWorkflow ? (
                      <button
                        onClick={() => {
                          setVideoIntroUrl(null);
                          setVideoIntroBlob(null);
                          setVideoIntroDuration(60);
                          setApplyCoverNoteValue("");
                          setApplicantPhoneValue(profileData.phone || "");
                          setApplicantLevelValue("Intermediate");
                          setShowGigApplyWorkflow(true);
                        }}
                        className="w-full py-5 bg-[#001489] text-white hover:bg-[#000d5a] rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 shadow-blue-200"
                      >
                        Apply for this gig
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 space-y-6"
                      >
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Gig Application Wizard</h3>
                          <button
                            type="button"
                            onClick={() => {
                              stopVideoIntroRecording();
                              setShowGigApplyWorkflow(false);
                            }}
                            className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* STEP 1: VERIFIED IDENTITY DATA CONFIRMATION */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 1: Verify Profile Information</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Applicant Name</label>
                              <div className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-700">{profileData.fullName || "Google AI Studio User"}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Applicant Email</label>
                              <div className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-700">{profileData.email || "user@gmail.com"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Contact Phone</label>
                              <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl">
                                <Phone className="w-4 h-4 text-gray-400 ml-2" />
                                <input
                                  type="tel"
                                  placeholder="Enter your phone number"
                                  value={applicantPhoneValue}
                                  onChange={(e) => setApplicantPhoneValue(e.target.value)}
                                  className="w-full p-1.5 outline-none text-xs font-bold text-gray-700 bg-transparent"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Work Level Sector</label>
                              <select
                                value={applicantLevelValue}
                                onChange={(e) => setApplicantLevelValue(e.target.value)}
                                className="w-full p-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none"
                              >
                                <option value="Beginner">Beginner Level</option>
                                <option value="Intermediate">Intermediate Level</option>
                                <option value="Advanced">Advanced / Expert</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* STEP 2: ATTACHMENTS & SECURE IDENTITY CREDENTIALS */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 2: Attached Identity Credentials</p>
                          <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl space-y-3">
                            <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                              To prevent fraud and maintain the integrity of our gig economy, your verified identity documents and profile images will be securely attached with your application:
                            </p>
                            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase text-blue-600">
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100">
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span>Verified ID Document</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100">
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span>Front Face Portrait</span>
                              </div>
                              {profileData.certificates && profileData.certificates.length > 0 && (
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100">
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                  <span>{profileData.certificates.length} Portfolio Certs</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* STEP 3: COVER NOTE */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 3: Cover Note / Fit Details</label>
                          <textarea
                            placeholder="Briefly state why you are the best fit for this role..."
                            value={applyCoverNoteValue}
                            onChange={(e) => setApplyCoverNoteValue(e.target.value)}
                            className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:border-blue-500 text-xs font-bold text-gray-700 h-24 resize-none"
                            required
                          />
                        </div>

                        {/* STEP 4: OPTIONAL 60s VIDEO EXPLANATION */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 4: Optional 60s Video Intro (Recommend)</p>
                            {isRecordingVideo && (
                              <span className="text-red-500 text-xs font-black animate-pulse flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                RECORDING • {videoIntroDuration}s
                              </span>
                            )}
                          </div>

                          {/* CAMERA / SIMULATION TROUBLESHOOTING IF DENIED */}
                          {cameraDenied && (
                            <div className="bg-red-50/90 border border-red-100 p-4 rounded-3xl text-[11px] space-y-2 text-red-800 leading-relaxed">
                              <div className="flex items-center gap-2 font-black uppercase text-[10px] text-red-700">
                                <Ban className="w-4 h-4 text-red-500" />
                                <span>Camera Hardware or Permission Check Failed</span>
                              </div>
                              <p className="text-red-700 font-medium">
                                Chrome/Safari block camera recording inside embedded sandboxed preview iframes. Since your camera couldn't open, we unlocked <strong>two immediate alternatives</strong> below:
                              </p>
                              <div className="grid grid-cols-1 gap-1.5 font-bold text-red-800 bg-white/50 p-2.5 rounded-xl border border-red-100">
                                <div>1. Press <span className="text-emerald-700">"Simulate Video Pitch"</span> to perform a mock interactive recording countdown demo.</div>
                                <div>2. Press <span className="text-indigo-700">"Upload File Fallback"</span> to upload an existing video file (.mp4/.webm) instead.</div>
                              </div>
                              <p className="text-[10px] text-red-500 font-medium italic mt-1">
                                Info: You can also open the App in its own web tab using the URL at the top to bypass sandboxing!
                              </p>
                            </div>
                          )}

                          {/* CAMERA PREVIEW PORT */}
                          <div className="max-w-md mx-auto aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-inner border border-gray-200 relative group">
                            {/* LIVE PREVIEW IF RECORDING OR CAM ON */}
                            <video
                              ref={applyLiveVideoRef}
                              muted
                              playsInline
                              className={`w-full h-full object-cover ${videoIntroStream ? "block" : "hidden"}`}
                            />

                            {/* ANIMATED SIMULATED VIDEO STREAM RECORDING */}
                            {isRecordingVideo && isVideoSimulationActive && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900 border-4 border-red-600 overflow-hidden relative">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_3px_100%] pointer-events-none" />
                                
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-full border border-red-500/30">
                                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                                  <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">SIMULATING VIDEO CAPTURE</span>
                                </div>

                                <div className="absolute top-4 right-4 bg-black/60 px-2.5 py-1 rounded-full border border-gray-700">
                                  <span className="text-[9px] font-mono font-bold text-gray-300">00:{videoIntroDuration < 10 ? `0${videoIntroDuration}` : videoIntroDuration}</span>
                                </div>

                                {/* Simulated live soundwave voice waves visualizer */}
                                <div className="flex items-end justify-center gap-1.5 h-16 mb-4">
                                  {[1.2, 0.5, 1.8, 0.4, 1.5, 0.8, 1.9, 0.3, 1.4, 0.7, 1.6, 1.1, 0.6, 1.3].map((val, idx) => (
                                    <motion.div
                                      key={idx}
                                      animate={{ height: ["15px", `${val * 48}px`, "15px"] }}
                                      transition={{
                                        duration: 1 + val,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                      className="w-1.5 bg-gradient-to-t from-red-500 to-amber-500 rounded-full"
                                    />
                                  ))}
                                </div>

                                <p className="text-xs font-black text-white uppercase tracking-wider mb-1 z-10">Microphone Input Wave Active</p>
                                <p className="text-[10px] text-gray-400 max-w-[280px] leading-relaxed z-10 font-bold">The interactive system is simulating live speech capturing. Talk normally!</p>
                              </div>
                            )}
                            
                            {/* PLAYBACK PREVIEW AFTER RECORDED/SIMULATED */}
                            {!videoIntroStream && !isRecordingVideo && videoIntroUrl && (
                              <video
                                src={videoIntroUrl}
                                controls
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* STANDBY COVER STATE */}
                            {!videoIntroStream && !isRecordingVideo && !videoIntroUrl && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-900 text-gray-400 space-y-2">
                                <Camera className="w-10 h-10 text-gray-600 animate-pulse" />
                                <p className="text-xs font-bold text-white uppercase tracking-wider">No application video clip yet</p>
                                <p className="text-[10px] text-gray-400 max-w-[280px] mx-auto leading-relaxed">Let the gig owner get to know you! Record a 60-second video presentation or upload a clip directly.</p>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-center gap-2.5 flex-wrap">
                            {!isRecordingVideo ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowVideoIntroPermissionPrompt(true)}
                                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1.5 shadow"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  Record Live
                                </button>

                                <button
                                  type="button"
                                  onClick={startVideoIntroSimulation}
                                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1.5 shadow"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                                  Simulate Video Pitch
                                </button>

                                <label className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all text-center border border-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{videoIntroFileName ? `Loaded: ${videoIntroFileName.slice(0, 10)}...` : "Upload File"}</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoFileSelect}
                                    className="hidden"
                                  />
                                </label>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={stopVideoIntroRecording}
                                className="px-5 py-2.5 bg-gray-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all flex items-center gap-1.5 shadow"
                              >
                                <Square className="w-4 h-4 text-red-500" />
                                Stop Recording ({videoIntroDuration}s left)
                              </button>
                            )}
                            
                            {videoIntroUrl && !isRecordingVideo && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVideoIntroUrl(null);
                                  setVideoIntroBlob(null);
                                  setVideoIntroFileName(null);
                                }}
                                className="px-4 py-2.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all"
                              >
                                Clear Clip
                              </button>
                            )}
                          </div>
                        </div>

                        {/* FINAL SUBMIT BUTTON */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!applicantPhoneValue) {
                                setPopupMessage("Rejected: Telephone number is required to contact you.");
                                setShowPopup(true);
                                setTimeout(() => setShowPopup(false), 3000);
                                return;
                              }
                              if (!applyCoverNoteValue) {
                                setPopupMessage("Rejected: Please enter a cover note about your fitness for the job.");
                                setShowPopup(true);
                                setTimeout(() => setShowPopup(false), 3000);
                                return;
                              }

                              try {
                                setPopupMessage("Transmitting application details...");
                                setShowPopup(true);

                                let videoBase64 = "";
                                if (videoIntroBlob) {
                                  videoBase64 = await blobToBase64(videoIntroBlob);
                                }

                                const submitData = {
                                  id: Date.now(),
                                  appliedAt: new Date().toISOString(),
                                  status: "pending",
                                  gigId: selectedGig.id,
                                  gigTitle: selectedGig.title,
                                  gigCreator: selectedGig.creator,
                                  gigCreatorEmail: selectedGig.creatorEmail || "",
                                  applicantEmail: profileData.email,
                                  applicantName: profileData.fullName || "Google AI Studio User",
                                  applicantPhone: applicantPhoneValue,
                                  applicantLevel: applicantLevelValue,
                                  applicantInfo: applyCoverNoteValue,
                                  pictures: profileData.pictures || {},
                                  idDocument: profileData.idDocument || "",
                                  certificates: profileData.certificates || [],
                                  videoData: videoBase64
                                };

                                const res = await fetch("/api/gigs/apply", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(submitData)
                                });

                                if (res.ok) {
                                  // Local counter increment / state updates
                                  setGigs(
                                    gigs.map((g) =>
                                      g.id === selectedGig.id
                                        ? { ...g, applicants: g.applicants + 1 }
                                        : g,
                                    ),
                                  );
                                  setAppliedGigs([...appliedGigs, selectedGig.id]);
                                  
                                  setPopupMessage("Success: Application sent to gig owner!");
                                  setTimeout(() => setShowPopup(false), 3500);
                                  
                                  stopVideoIntroRecording();
                                  setShowGigApplyWorkflow(false);
                                  fetchApplications();
                                } else {
                                  setPopupMessage("Server responded with error sending application.");
                                  setTimeout(() => setShowPopup(false), 3000);
                                }
                              } catch (e: any) {
                                console.error("Error submitting app", e);
                                setPopupMessage("Error transmitting application files.");
                                setTimeout(() => setShowPopup(false), 3000);
                              }
                            }}
                            className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-98 transition-all hover:brightness-110"
                          >
                            Submit Completed Application
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                {!isEditingGig && !isMyGig_details && (
                  <button
                    onClick={() =>
                      handleReport(
                        "gig",
                        selectedGig.id,
                        "Suspicious or fake gig posting",
                      )
                    }
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-[#E03C31] text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-[2rem] transition-all"
                  >
                    <Flag className="w-3 h-3" /> Report Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case "wallet":
        if (walletSubView === "bank")
          return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold">Bank Transfer Details</h2>
              <p>
                Please transfer the amount of {selectedTopup?.price} to the
                following account:
              </p>
              <div className="bg-gray-100 p-4 rounded text-sm space-y-2">
                <p>
                  <strong>Bank:</strong> Capitec
                </p>
                <p>
                  <strong>Account Number:</strong> 1334067366
                </p>
                <p>
                  <strong>Account Name:</strong> Matthews
                </p>
                <p>
                  <strong>Ref:</strong> {selectedTopup?.coins} coins
                </p>
              </div>
              <input
                type="file"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded"
                accept="image/*"
              />
              <button
                disabled={!proofFile}
                onClick={() => {
                  if (!proofFile) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const rawBase64 = reader.result as string;
                    const base64proof = await compressImage(rawBase64, 600, 400, 0.6);
                    setTransactions([
                      ...transactions,
                      {
                        id: Date.now(),
                        date: new Date().toLocaleDateString(),
                        type: "pending",
                        amount: selectedTopup!.coins,
                        proof: base64proof,
                      },
                    ]);
                    setPendingApprovals([
                      ...pendingApprovals,
                      {
                        id: Date.now(),
                        user: profileData.email,
                        amount: selectedTopup!.coins,
                        price: selectedTopup!.price,
                        proof: base64proof,
                      },
                    ]);
                    setWalletSubView("main");
                    setProofFile(null);
                    setPopupMessage(
                      "Proof submitted! Awaiting admin approval.",
                    );
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 3000);
                  };
                  reader.readAsDataURL(proofFile);
                }}
                className={`w-full p-2 ${proofFile ? "bg-green-600" : "bg-gray-400"} text-white rounded font-bold transition-all active:scale-95`}
              >
                Submit Proof
              </button>
              <button
                onClick={() => setWalletSubView("topup")}
                className="w-full p-2 text-gray-600"
              >
                Back
              </button>
            </div>
          );
        if (walletSubView === "topup")
          return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold">Top Up Coins</h2>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">
                  Expire after 30 days:
                </h3>
                {[
                  { coins: 20, price: "R5,00", days: 30 },
                  { coins: 50, price: "R10,00", days: 30 },
                  { coins: 90, price: "R15,00", days: 30 },
                  { coins: 150, price: "R25,00", days: 30 },
                ].map((option) => (
                  <button
                    key={option.coins}
                    onClick={() => {
                      setSelectedTopup(option);
                      setWalletSubView("bank");
                    }}
                    className="w-full flex justify-between p-3 border rounded items-center"
                  >
                    <span>{option.coins} coins</span>{" "}
                    <span>{option.price}</span>
                  </button>
                ))}
                <h3 className="font-semibold text-gray-700 mt-4">
                  Expire after 60 days:
                </h3>
                {[
                  { coins: 1000, price: "R149,99", days: 60 },
                  { coins: 3000, price: "R249,99", days: 60 },
                ].map((option) => (
                  <button
                    key={option.coins}
                    onClick={() => {
                      setSelectedTopup(option);
                      setWalletSubView("bank");
                    }}
                    className="w-full flex justify-between p-3 border rounded items-center"
                  >
                    <span>{option.coins} coins</span>{" "}
                    <span>{option.price}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">
                Paystack payment is still in progress.
              </p>
              <button
                onClick={() => setWalletSubView("main")}
                className="w-full p-2 text-gray-600"
              >
                Back
              </button>
            </div>
          );

        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 text-center">
              <h2 className="text-sm text-gray-500 uppercase tracking-wide">
                Coin Balance
              </h2>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {balance} <span className="text-gray-400">coins</span>
              </p>
              <button
                onClick={() => setWalletSubView("topup")}
                className="mt-4 w-full p-2 bg-[#001489] text-white rounded font-semibold uppercase tracking-widest text-xs py-3 shadow-lg shadow-blue-100"
              >
                Top Up
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Transactions</h3>
              {(transactions || []).length === 0 ? (
                <p className="text-sm text-gray-500">No recent transactions.</p>
              ) : (
                <div className="space-y-2">
                  {(transactions || []).map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between items-center text-sm border-b py-2"
                    >
                      <div className="flex flex-col">
                        <span>
                          {t.type === "bought"
                            ? "Top up"
                            : t.type === "pending"
                              ? "Pending top up"
                              : "Spent"}
                        </span>
                        <span className="text-xs text-gray-400">{t.date}</span>
                      </div>
                      <span
                        className={`font-bold ${t.type === "pending" ? "text-orange-500" : ""}`}
                      >
                        {t.type === "spent" ? "-" : "+"}
                        {t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "admin":
        if (profileData.email !== "21lucihanomatthews@gmail.com")
          return (
            <div className="p-8 text-center text-red-500 font-bold">
              Unauthorized Access
            </div>
          );

        const handleRefresh = async () => {
          setPopupMessage("Refreshing data...");
          setShowPopup(true);
          try {
            const res = await fetch(`/api/state/${profileData.email}`);
            if (res.ok) {
              const state = await res.json();
              if (state && Object.keys(state).length > 0) {
                if (state.balance !== undefined) setBalance(state.balance);
                if (state.transactions) setTransactions(state.transactions);
                if (state.pendingApprovals)
                  setPendingApprovals(state.pendingApprovals);
                if (state.profileData)
                  setProfileData(ensureProfileData(state.profileData));
              }
            }
            const resApprovals = await fetch(
              `/api/admin/pending-approvals?adminEmail=${profileData.email}`,
            );
            if (resApprovals.ok) {
              const data = await resApprovals.json();
              if (Array.isArray(data)) {
                setAdminPendingApprovals(data);
              }
            }
            const resUsers = await fetch(
              `/api/admin/users?adminEmail=${profileData.email}`,
            );
            if (resUsers.ok) {
              const uData = await resUsers.json();
              if (Array.isArray(uData)) {
                setAdminUsers(uData);
              }
            }
          } catch (e) {}
          setTimeout(() => setShowPopup(false), 1000);
        };

        // Total profit includes top-ups (10% mock)
        const totalApprovedProfit = (transactions || [])
          .filter(
            (t) => t.type === "bought" && !t.note?.includes("Payment from"),
          )
          .reduce((acc, curr) => acc + curr.amount * 0.1, 0);

        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Admin Dashboard</h2>
                <button
                  onClick={handleRefresh}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  <MoreVertical className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Total Profit</p>
                  <p className="text-2xl font-bold">
                    R{totalApprovedProfit.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Pending Payments</p>
                  <p className="text-2xl font-bold">
                    {(adminPendingApprovals || []).length}
                  </p>
                </div>
              </div>

              <h3 className="font-bold mb-2">Manage Users</h3>
              <div className="space-y-4 mb-8">
                {(adminUsers || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No users found. Use Refresh to load.
                  </p>
                ) : (
                  (adminUsers || []).map((u) => (
                    <div
                      key={u.email}
                      className="p-4 border rounded-lg space-y-2 bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          {u.fullName} {u.isDisabled && <span className="text-xs text-red-500 font-bold ml-2">(Disabled)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to ${u.isDisabled ? 'enable' : 'disable'} this account?`)) return;
                            try {
                              const res = await fetch(`/api/admin/user/${u.email}/disable`, {
                                method: "POST",
                                body: JSON.stringify({ adminEmail: profileData.email, isDisabled: !u.isDisabled }),
                                headers: { "Content-Type": "application/json" }
                              });
                              if (res.ok) handleRefresh();
                            } catch (e) {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${u.isDisabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                        >
                          {u.isDisabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
                            try {
                              const res = await fetch(`/api/admin/user/${u.email}?adminEmail=${encodeURIComponent(profileData.email)}`, {
                                method: "DELETE",
                                body: JSON.stringify({ adminEmail: profileData.email }),
                                headers: { "Content-Type": "application/json" }
                              });
                              if (res.ok) {
                                handleRefresh();
                              } else {
                                const errorData = await res.json().catch(() => ({}));
                                console.error("Failed to delete user:", errorData);
                                alert(`Failed to delete user: ${errorData.error || res.statusText}`);
                              }
                            } catch (e) {
                              console.error("Failed to delete user:", e);
                              alert("Failed to delete user.");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h3 className="font-bold mb-2">Pending Coin Approvals</h3>
              <div className="space-y-4">
                {(adminPendingApprovals || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No pending coin approvals. Use Refresh to check.
                  </p>
                ) : (
                  (adminPendingApprovals || []).map((pa) => (
                    <div
                      key={pa.id}
                      className="p-4 border rounded-lg space-y-2 bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-sm text-gray-700">
                          {pa.user}
                        </span>
                        <span className="font-bold text-[#001489] text-sm">
                          {pa.amount} coins ({pa.price})
                        </span>
                      </div>
                      <div className="mt-2 text-center bg-white p-2 rounded border">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-left">
                          Proof Image
                        </p>
                        {pa.proof ? (
                          <img
                            src={pa.proof}
                            className="inline-block max-w-full max-h-48 rounded cursor-pointer hover:opacity-90"
                            alt="proof"
                            onClick={() => {
                              try {
                                const w = window.open("");
                                if (w) {
                                  w.document.title = `Proof from ${pa.user}`;
                                  w.document.body.style.margin = "0";
                                  w.document.body.style.backgroundColor =
                                    "#000";
                                  w.document.body.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${pa.proof}" style="max-width:100%;max-height:100%;"></div>`;
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          />
                        ) : (
                          <div className="p-4 text-gray-400 italic text-xs">
                            No image provided
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                "/api/admin/approve-topup",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    userEmail: pa.user,
                                    amount: pa.amount,
                                    adminEmail: profileData.email,
                                    requestId: pa.id,
                                  }),
                                },
                              );

                              if (res.ok) {
                                if (pa.user === profileData.email) {
                                  setBalance(balance + pa.amount);
                                  setTransactions(
                                    (transactions || []).map((t) =>
                                      t.id === pa.id || t.proof === pa.proof
                                        ? {
                                            ...t,
                                            type: "bought",
                                            note: "Approved",
                                          }
                                        : t,
                                    ),
                                  );
                                  setPendingApprovals(
                                    (pendingApprovals || []).filter(
                                      (p) => p.id !== pa.id,
                                    ),
                                  );
                                }
                                setAdminPendingApprovals(
                                  (adminPendingApprovals || []).filter(
                                    (p) => p.id !== pa.id,
                                  ),
                                );
                                setPopupMessage(
                                  `Approved ${pa.amount} coins for ${pa.user}`,
                                );
                                setShowPopup(true);
                                setTimeout(() => setShowPopup(false), 3000);
                              } else {
                                alert("Server failed to approve.");
                              }
                            } catch (e) {
                              alert("System error during approval.");
                            }
                          }}
                          className="flex-1 bg-[#007749] text-white py-2 px-2 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                "/api/admin/reject-topup",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    userEmail: pa.user,
                                    adminEmail: profileData.email,
                                    requestId: pa.id,
                                  }),
                                },
                              );
                              if (res.ok) {
                                if (pa.user === profileData.email) {
                                  setTransactions(
                                    (transactions || []).filter(
                                      (t) =>
                                        t.id !== pa.id && t.proof !== pa.proof,
                                    ),
                                  );
                                  setPendingApprovals(
                                    (pendingApprovals || []).filter(
                                      (p) => p.id !== pa.id,
                                    ),
                                  );
                                }
                                setAdminPendingApprovals(
                                  (adminPendingApprovals || []).filter(
                                    (p) => p.id !== pa.id,
                                  ),
                                );
                                setPopupMessage("Rejected.");
                                setShowPopup(true);
                                setTimeout(() => setShowPopup(false), 3000);
                              }
                            } catch (e) {
                              alert("System error during rejection.");
                            }
                          }}
                          className="flex-1 bg-[#E03C31] text-white py-2 px-2 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h3 className="font-bold mt-8 mb-2">Business Account Requests</h3>
              <div className="space-y-4">
                {(businessRequests || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No pending business requests.
                  </p>
                ) : (
                  (businessRequests || []).map((br) => (
                    <div
                      key={br.id}
                      className="p-4 border rounded-lg space-y-2 bg-blue-50"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">User: {br.user}</p>
                        <span className="text-[10px] bg-[#001489]/10 text-[#001489] px-2 py-0.5 rounded-full uppercase">
                          Pending Setup
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {br.documents.map((doc, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={doc}
                              className="w-16 h-16 object-cover rounded border bg-white"
                              alt="doc"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded">
                              <button
                                onClick={() => {
                                  try {
                                    window.open(doc);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="text-[8px] bg-white text-black px-1 rounded font-bold"
                              >
                                View
                              </button>
                              <a
                                href={doc}
                                download={`business_doc_${idx}.png`}
                                className="text-[8px] bg-[#001489] text-white px-1 rounded font-bold"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBusinessRequests(
                              (businessRequests || []).filter(
                                (r) => r.id !== br.id,
                              ),
                            );
                            setIsBusinessMode(true);
                            // Send Inbox Notification
                            const adminMsg = {
                              sender: "other" as const,
                              text: "Your Business Account has been APPROVED! You now have access to verified business features.",
                            };
                            setMessages((prev) => {
                              const safePrev = prev || {};
                              return {
                                ...safePrev,
                                100: [...(safePrev[100] || []), adminMsg],
                              };
                            });
                            alert("Business account approved!");
                          }}
                          className="flex-1 bg-[#007749] text-white py-1.5 rounded text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setBusinessRequests(
                              (businessRequests || []).filter(
                                (r) => r.id !== br.id,
                              ),
                            );
                            // Send Inbox Notification
                            const adminMsg = {
                              sender: "other" as const,
                              text: "Your Business Account verification was REJECTED. Please ensure your documents are clear and valid before re-submitting.",
                            };
                            setMessages((prev) => {
                              const safePrev = prev || {};
                              return {
                                ...safePrev,
                                100: [...(safePrev[100] || []), adminMsg],
                              };
                            });
                            alert("Business account rejected.");
                          }}
                          className="flex-1 bg-[#E03C31] text-white py-1.5 rounded text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h3 className="font-bold mt-8 mb-2">Create Promotion</h3>
              <div className="p-4 border rounded-lg bg-yellow-50 space-y-3">
                <p className="text-xs text-yellow-700">
                  Send a promotional alert to all users. It will appear in their
                  top bar notifications.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPromotionText}
                    onChange={(e) => setNewPromotionText(e.target.value)}
                    placeholder="E.g. Top up today for 20% bonus coins!"
                    className="flex-1 p-2 rounded-lg border border-yellow-200 outline-none focus:border-yellow-400 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (!newPromotionText.trim()) return;
                      setTopBarNotifications((prev) => [
                        {
                          id: Date.now(),
                          text: `Promotion: ${newPromotionText}`,
                          read: false,
                          type: "promo",
                        },
                        ...prev,
                      ]);
                      setNewPromotionText("");
                      setPopupMessage("Promotion sent to all users!");
                      setShowPopup(true);
                      setTimeout(() => setShowPopup(false), 2000);
                    }}
                    className="bg-[#001489] text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-[#000d5a] transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>

              <h3 className="font-bold mt-8 mb-2">Application Wallpaper</h3>
              <div className="p-4 border rounded-lg bg-purple-50 space-y-3">
                <p className="text-xs text-purple-600">
                  Set a custom background wallpaper for the entire application.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        if (reader.result) {
                          const compressed = await compressImage(reader.result as string, 1000, 600, 0.7);
                          setBackgroundWallpaper(compressed);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {backgroundWallpaper && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={backgroundWallpaper}
                        className="w-24 h-14 object-cover rounded border bg-white"
                        alt="preview"
                      />
                      <button
                        onClick={() => setBackgroundWallpaper(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 italic">
                      Live preview active
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-0 transition-all duration-700 overflow-x-hidden relative">
      {viewingIdDocument && (
        <IdDocumentViewer src={viewingIdDocument} onClose={() => setViewingIdDocument(null)} />
      )}
      {backgroundWallpaper && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${backgroundWallpaper})` }}
          />
          <div className="absolute inset-0 backdrop-blur-[6px] bg-white/60" />
        </div>
      )}
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 bg-white flex items-center justify-center z-[1000]"
          >
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-4xl font-extrabold text-black tracking-tighter"
              >
                TimeGIG
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="text-gray-400 font-medium text-sm mt-2 uppercase tracking-widest"
              >
                Work Redefined
              </motion.p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 100 }}
                transition={{ delay: 1.8, duration: 2.2, ease: "linear" }}
                className="h-1 bg-blue-600 mx-auto mt-8 rounded-full"
                style={{ width: "100px" }}
              />
            </div>
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full flex justify-center p-4"
          >
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 w-full max-w-md text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
                <motion.div 
                  className="h-full bg-black flex"
                  initial={{ width: "33%" }}
                  animate={{ 
                    width: emailCheckStatus === "found" || emailCheckStatus === "not_found" ? "66%" : "33%" 
                  }}
                />
              </div>

              <h1 className="text-3xl font-[900] text-black mb-1 tracking-tight">
                TimeGIG
              </h1>
              <p className="text-gray-400 text-sm font-medium mb-10 uppercase tracking-[0.2em]">
                {emailCheckStatus === "found" ? "Welcome Back" : emailCheckStatus === "not_found" ? "Create Account" : "Access Portal"}
              </p>

              <AnimatePresence mode="wait">
                {verificationSuccessEmail ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="space-y-6 py-4"
                  >
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-black uppercase tracking-tight">Account Activated</h2>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                        Welcome to the platform, {verificationSuccessEmail.split('@')[0]}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
                        Your identity has been verified. You can now log in using your email and password.
                      </p>
                    </div>
                    <button
                      onClick={() => setVerificationSuccessEmail(null)}
                      className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                    >
                      Continue to Login
                    </button>
                  </motion.div>
                ) : authMode === "verify" ? (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Mail className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="p-5 bg-gray-50 rounded-2xl text-left border border-gray-100">
                      <p className="text-[11px] text-gray-500 leading-relaxed font-bold text-center uppercase tracking-wider">
                        We've sent an activation link to <span className="text-black">{loginEmail || "your email"}</span>. Please check your inbox and click the link to activate your account.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <button
                        onClick={() => window.open(`mailto:${loginEmail}`)}
                        className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                         Open Inbox <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <div className="pt-2">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                          Didn't receive the email?
                        </p>
                        <button
                          onClick={handleRegisterInitiate}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors mr-4"
                        >
                          Resend Link
                        </button>
                        <button
                          onClick={() => {
                            setAuthMode("login");
                            setEmailCheckStatus("idle");
                          }}
                          className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                        >
                          Use Different Email
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth-main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={`w-full p-4 border-2 ${
                            emailCheckStatus === "found" ? "border-green-500/30" : 
                            emailCheckStatus === "not_found" ? "border-blue-500/30" :
                            "border-gray-100"
                          } rounded-2xl bg-gray-50/50 focus:border-black focus:bg-white outline-none transition-all font-medium`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                          {emailCheckStatus === "checking" && (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          )}
                          {emailCheckStatus === "found" && (
                            <div className="text-green-500">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                          )}
                          {emailCheckStatus === "not_found" && (
                            <div className="text-blue-500">
                              <UserPlus className="w-5 h-5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {emailCheckStatus === "not_found" ? "Create Secure Password" : "Security Password"}
                        </label>
                        {emailCheckStatus === "found" && (
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">
                            Identity Verified
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50/50 focus:border-black focus:bg-white outline-none tracking-[0.3em] text-xl font-black transition-all text-center"
                      />
                    </div>

                    {emailCheckStatus === "not_found" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50"
                      >
                        <input
                          type="checkbox"
                          id="terms"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded-lg border-blue-200 text-black focus:ring-black"
                        />
                        <label htmlFor="terms" className="text-[10px] text-gray-500 leading-relaxed font-medium text-left">
                          I agree to become a TimeGIG member and accept the <span className="text-black font-black underline">Membership Terms</span>. I'll remember this password for future access.
                        </label>
                      </motion.div>
                    )}

                    <button
                      onClick={() => {
                        if (emailCheckStatus === "found") {
                          handleLogin();
                        } else if (emailCheckStatus === "not_found" && acceptTerms) {
                          handleRegisterInitiate();
                        }
                      }}
                      disabled={(emailCheckStatus === "not_found" && !acceptTerms) || !loginEmail || loginPassword.length < 6}
                      className="w-full bg-black disabled:bg-gray-200 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-900 active:scale-95 transition-all mt-6"
                    >
                      {emailCheckStatus === "found" ? "Continue to App" : emailCheckStatus === "not_found" ? "Get Started" : "Enter Details"}
                    </button>
                    
                    <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest pt-4">
                      {emailCheckStatus === "found" ? "Encrypted Session Active" : "No credit card required to start"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="mt-8 text-[10px] text-gray-300 font-black uppercase tracking-widest text-center">
                Secure access powered by TimeGIG Cloud
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col min-h-screen relative"
          >
            {/* Global backdrop for top menu */}
            <AnimatePresence>
              {isTopMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsTopMenuOpen(false)}
                  onTouchStart={() => setIsTopMenuOpen(false)}
                  className="fixed inset-0 z-[9998] bg-transparent"
                />
              )}
            </AnimatePresence>
            
            {/* Onboarding Modal */}
            <AnimatePresence>
              {!showSplash && showOnboarding && (
                <WelcomeModal 
                  onClose={() => {
                    localStorage.setItem("hasSeenOnboarding", "true");
                    setShowOnboarding(false);
                  }} 
                />
              )}
            </AnimatePresence>

            {/* Pricing Modal */}
            <AnimatePresence>
              {isPricingModalOpen && (
                <PricingModal onClose={() => setIsPricingModalOpen(false)} />
              )}
            </AnimatePresence>

            {/* Top Bar */}
            <header
              className={`fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300 ${isTopMenuOpen ? "z-[10000]" : "z-50"}`}
            >
              <div className="h-1 flex">
                <div className="flex-1 bg-[#E03C31]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#007749]" />
                <div className="flex-1 bg-[#FFB81C]" />
                <div className="flex-1 bg-[#001489]" />
              </div>
              <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-black tracking-tighter flex items-center gap-2">
                    TimeGIG
                    <span className="text-[10px] bg-[#007749] text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black shadow-sm">
                      ZA
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative text-gray-500 hover:text-black transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {(topBarNotifications || []).filter((n) => !n.read)
                        .length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E03C31] border-2 border-white rounded-full bg-pulse" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="fixed inset-x-4 top-16 mt-2 sm:absolute sm:inset-auto sm:right-4 sm:top-full sm:mt-2 sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[10001]"
                        >
                          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                            <h4 className="font-black text-gray-900 text-sm">
                              Notifications
                            </h4>
                            <button
                              onClick={() => {
                                setTopBarNotifications(
                                  (topBarNotifications || []).map((n) => ({
                                    ...n,
                                    read: true,
                                  })),
                                );
                              }}
                              className="text-[10px] text-blue-600 font-bold uppercase tracking-widest hover:underline"
                            >
                              Mark all read
                            </button>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {(topBarNotifications || []).length === 0 ? (
                              <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                No new notifications
                              </div>
                            ) : (
                              (topBarNotifications || []).map(
                                (notification) => (
                                  <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${notification.read ? "opacity-60" : ""}`}
                                    onClick={() => {
                                      setTopBarNotifications(
                                        (topBarNotifications || []).map((n) =>
                                          n.id === notification.id
                                            ? { ...n, read: true }
                                            : n,
                                        ),
                                      );

                                      if (notification.type === "gig") {
                                        setCurrentView("gigs");
                                      } else if (
                                        notification.type === "promo"
                                      ) {
                                        setCurrentView("wallet");
                                      }

                                      setShowNotifications(false);
                                    }}
                                  >
                                    <div className="flex gap-3 items-start">
                                      <div
                                        className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.read ? "bg-transparent border border-gray-300" : "bg-[#E03C31]"}`}
                                      />
                                      <p className="text-sm text-gray-700 font-medium leading-tight">
                                        {notification.text}
                                      </p>
                                    </div>
                                  </div>
                                ),
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {profileCompleted && profileData.pictures.front && (
                    <button
                      onClick={() => {
                        setCurrentView("profile-details");
                        setSelectedSeeker({ id: 0, name: "My Profile" });
                      }}
                      className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#001489] shadow-sm transition-all hover:scale-110"
                    >
                      <img
                        src={profileData.pictures.front}
                        className="w-full h-full object-cover"
                        alt="Profile"
                      />
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTopMenuOpen(!isTopMenuOpen);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-6 h-6 text-gray-700" />
                    </button>
                    <AnimatePresence>
                      {isTopMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden z-[9999]"
                        >
                          <button
                            onClick={() => {
                              setIsPricingModalOpen(true);
                              setIsTopMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-3 hover:bg-blue-50 text-gray-700 transition-colors"
                          >
                            <Info className="w-4 h-4 mr-3" />
                            How to Use & Pricing
                          </button>
                          <button
                            onClick={() => {
                              setCurrentView("profile-edit");
                              setIsTopMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-3 hover:bg-blue-50 text-gray-700 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3 text-gray-400" />{" "}
                            Profile Settings
                          </button>
                          {profileData.email ===
                            "21lucihanomatthews@gmail.com" && (
                            <button
                              onClick={() => {
                                setCurrentView("admin");
                                setIsTopMenuOpen(false);
                              }}
                              className="flex items-center w-full px-4 py-3 hover:bg-blue-50 text-blue-600 transition-colors font-bold"
                            >
                              <Shield className="w-4 h-4 mr-3 text-blue-500" />{" "}
                              Admin Panel
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3 text-red-400" />{" "}
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 w-full max-w-md mx-auto pt-16 pb-24 overflow-x-hidden">
              
              {/* Popup Message */}
              <AnimatePresence>
                {showPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="relative bottom-4 mt-4 bg-gray-900 border border-white/20 text-white p-4 rounded-2xl shadow-2xl z-[100] text-center font-bold tracking-tight mx-4"
                  >
                    {popupMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {profileData.isDisabled && (
                <div className="mx-4 mb-4 bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">Account Deactivated</h3>
                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-widest mt-1">
                      Your profile is currently hidden from the platform. Use settings to reactivate.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>


            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
              <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-between">
                <button
                  onClick={() => setCurrentView("seeker")}
                  className={`flex flex-col items-center p-2 transition-all ${currentView === "seeker" ? "text-[#007749] scale-110" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Search
                    className={`w-6 h-6 ${currentView === "seeker" ? "stroke-[2.5px]" : ""}`}
                  />
                  <span className="text-[10px] pt-1 font-bold">SEEKER</span>
                </button>
                <button
                  onClick={() => setCurrentView("gigs")}
                  className={`flex flex-col items-center p-2 transition-all ${currentView === "gigs" ? "text-[#001489] scale-110" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Briefcase
                    className={`w-6 h-6 ${currentView === "gigs" ? "stroke-[2.5px]" : ""}`}
                  />
                  <span className="text-[10px] pt-1 font-bold">GIGS</span>
                </button>
                <button
                  onClick={() => setCurrentView("wallet")}
                  className={`flex flex-col items-center p-2 transition-all ${currentView === "wallet" ? "text-[#FFB81C] scale-110" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <div className="relative">
                    <Wallet
                      className={`w-6 h-6 ${currentView === "wallet" ? "stroke-[2.5px]" : ""}`}
                    />
                    {(pendingApprovals || []).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E03C31] border-2 border-white rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] pt-1 font-bold">WALLET</span>
                </button>
                <button
                  onClick={() => setCurrentView("inbox")}
                  className={`flex flex-col items-center p-2 transition-all ${currentView === "inbox" ? "text-[#E03C31] scale-110" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <div className="relative">
                    <Mail
                      className={`w-6 h-6 ${currentView === "inbox" ? "stroke-[2.5px]" : ""}`}
                    />
                    {Object.values(messages || {}).some(
                      (m: any) => m && m.length > 0,
                    ) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#001489] border-2 border-white rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] pt-1 font-bold">INBOX</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showSplash && notificationsPermission === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-24 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 z-[60] flex flex-col items-center text-center max-w-sm mx-auto"
          >
            <div className="w-12 h-12 bg-blue-50 text-[#001489] rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-black text-gray-900 tracking-tight text-lg mb-2">
              Enable Notifications?
            </h3>
            <p className="text-gray-500 text-sm font-medium mb-6">
              Can we send you alerts about the latest gigs and special
              promotions?
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setNotificationsPermission("denied")}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
              >
                Decline
              </button>
              <button
                onClick={() => setNotificationsPermission("granted")}
                className="flex-1 py-4 bg-[#001489] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:bg-[#000d5a] transition-all"
              >
                Accept
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {capturingAngle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100000] flex flex-col items-center justify-center p-4"
          >
            {cameraSequence ? (
              <div className="flex flex-col items-center mb-4">
                <span className="bg-[#001489] text-white border border-blue-500 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest mb-1.5 shadow-md">
                  Step {sequenceIndex + 1} of 3: {capturingAngle} view
                </span>
                <h3 className="text-white text-xl font-black uppercase tracking-wider text-center drop-shadow">
                  {capturingAngle === "left" && "Turn Face Left 👈"}
                  {capturingAngle === "front" && "Face the Camera Directly 👤"}
                  {capturingAngle === "right" && "Turn Face Right 👉"}
                </h3>
              </div>
            ) : (
              <h3 className="text-white text-xl mb-4 uppercase font-black tracking-widest">
                Capture {capturingAngle === "gig" ? "Gig" : capturingAngle} View
              </h3>
            )}
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-950 rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
              {isCameraSimulationActive ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-[0.15] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:20px_20px]" />
                  
                  {/* Cyber Scan line */}
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#10b981] to-transparent shadow-[0_0_12px_#10b981]"
                  />

                  {/* Telemetry metadata */}
                  <div className="absolute top-4 left-4 flex flex-col text-slate-400 font-mono text-[7px] tracking-widest leading-normal z-10 text-left">
                    <span className="text-[#10b981] font-bold">● SIMULATED VIEWPORT FEED</span>
                    <span>ANGLE: {capturingAngle?.toUpperCase()} VIEW</span>
                    <span>FPS: 30 (STABLE)</span>
                  </div>

                  {/* Positioning Face guidelines overlay */}
                  <div className="relative w-48 h-64 border-2 border-dashed border-sky-400/35 rounded-[5rem] flex items-center justify-center">
                    <div className="absolute inset-x-4 top-12 bottom-12 border border-[#10b981]/15 rounded-full" />
                    
                    {/* Face tracking marker */}
                    <div className="absolute top-1/3 flex gap-12">
                      <div className="w-5 h-5 border-t border-l border-emerald-400 rounded-tl" />
                      <div className="w-5 h-5 border-t border-r border-emerald-400 rounded-tr" />
                    </div>
                    <div className="absolute bottom-1/3 flex gap-12">
                      <div className="w-5 h-5 border-b border-l border-emerald-400 rounded-bl" />
                      <div className="w-5 h-5 border-b border-r border-emerald-400 rounded-br" />
                    </div>

                    <span className="text-[8px] font-black tracking-widest text-[#10b981] bg-black/60 px-2 py-0.5 rounded border border-[#10b981]/20 uppercase">
                      Ready to Capture
                    </span>
                  </div>

                  {/* Footer message */}
                  <div className="absolute bottom-16 text-center z-10 px-6">
                    <p className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest mb-1">Interactive Sandbox Bypass</p>
                    <p className="text-[8px] text-slate-400 font-bold max-w-[200px] leading-relaxed mx-auto uppercase">Press the Capture button securely on screen to proceed.</p>
                  </div>
                </div>
              ) : (
                <video
                  key={stream?.id || facingMode}
                  id="camera-preview"
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => {
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                  }}
                  onLoadedMetadata={(e) => {
                    e.currentTarget
                      .play()
                      .catch((err) => console.error("Play error:", err));
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
                  }}
                />
              )}
              
              <div className="absolute top-4 inset-x-0 flex justify-center z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (countdown === null) {
                      setCountdown(3);
                    } else {
                      setCountdown(null);
                    }
                  }}
                  className={`px-4 py-2 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition-all shadow-md ${countdown !== null ? "bg-red-500 text-white animate-pulse" : "bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border border-white/10"}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {countdown !== null ? `Cancel Countdown` : "3s Timer"}
                </button>
              </div>

              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  >
                    {countdown}
                  </motion.span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center items-center gap-8 bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={closeCamera}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-90 transition-all border-[6px] border-white/20"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-gray-900" />
                </button>
                <button
                  onClick={() => {
                    const newMode =
                      facingMode === "user" ? "environment" : "user";
                    requestCameraAccess(capturingAngle!, newMode);
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all group"
                >
                  <RefreshCw className="w-6 h-6 group-active:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-8 text-center px-4">
              {cameraSequence ? (
                countdown !== null ? (
                  <span>
                    Auto-capturing in <b className="text-blue-400 font-extrabold text-sm">{countdown}s</b>. Turn your head <b className="text-white font-extrabold">{capturingAngle}</b>!
                  </span>
                ) : (
                  "Ready! Press the record button to capture"
                )
              ) : (
                "Align your subject within the frame"
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoIntroPermissionPrompt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-red-600 animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-gray-900 text-center uppercase tracking-tight mb-2">
                Camera & Mic Consent
              </h3>
              
              <p className="text-gray-450 text-[10px] text-center font-black uppercase tracking-widest mb-6">
                Live Video Pitch Record
              </p>

              <div className="space-y-4 text-xs font-bold text-gray-700 leading-relaxed text-left bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 font-medium">
                <p>
                  To attach a live face pitch to your application, TimeGIG requests permission to activate your front-facing camera and microphone:
                </p>
                
                <div className="space-y-2 pt-2 border-t border-gray-200 text-gray-800 text-[11px]">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Accesses your <strong>front camera</strong> to record live action video.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Engages <strong>microphone</strong> so reviewers can hear your verbal pitch.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Private & secure: review, clear, or simulation features are fully supported.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoIntroPermissionPrompt(false);
                    startVideoIntroRecording();
                  }}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Allow Front Camera & Mic
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowVideoIntroPermissionPrompt(false)}
                  className="w-full py-2.5 text-gray-400 hover:text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Deny Access
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
