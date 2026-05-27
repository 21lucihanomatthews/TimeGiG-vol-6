/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Search, Briefcase, Wallet, MoreVertical, User, Settings, Shield, Camera, CheckCircle, Mail, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>('register');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [tempUserData, setTempUserData] = useState<{email: string, pin: string} | null>(null);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [currentView, setCurrentView] = useState<'seeker' | 'profile-edit' | 'gigs' | 'wallet' | 'profile-details' | 'inbox' | 'chat' | 'admin'>(() => (localStorage.getItem('currentView') as any) || 'seeker');
  const [profileCompleted, setProfileCompleted] = useState(() => localStorage.getItem('profileCompleted') === 'true');
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('balance') || '0'));
  const [transactions, setTransactions] = useState<{id: number, date: string, type: 'bought' | 'spent' | 'pending', amount: number, proof?: string}[]>(() => JSON.parse(localStorage.getItem('transactions') || '[]') as {id: number, date: string, type: 'bought' | 'spent' | 'pending', amount: number, proof?: string}[]);
  const [pendingApprovals, setPendingApprovals] = useState<{id: number, user: string, amount: number, proof: string, price: string}[]>(() => JSON.parse(localStorage.getItem('pendingApprovals') || '[]') as {id: number, user: string, amount: number, proof: string, price: string}[]);
  const [businessRequests, setBusinessRequests] = useState<{id: number, user: string, documents: string[], status: 'pending' | 'approved' | 'rejected'}[]>(() => JSON.parse(localStorage.getItem('businessRequests') || '[]') as {id: number, user: string, documents: string[], status: 'pending' | 'approved' | 'rejected'}[]);
  const [walletSubView, setWalletSubView] = useState<'main' | 'topup' | 'bank'>('main');
  const [selectedTopup, setSelectedTopup] = useState<{coins: number, price: string, days: number} | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isBusinessMode, setIsBusinessMode] = useState(() => localStorage.getItem('isBusinessMode') === 'true');
  const [businessDocs, setBusinessDocs] = useState<File[]>([]);
  const [profileData, setProfileData] = useState<{
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
    pin: string;
    isVisible: boolean;
    pictures: {left: string, front: string, right: string};
    certificates: { name: string, url: string }[];
  }>(() => {
    const saved = localStorage.getItem('profileData');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      dob: '',
      location: '',
      phone: '',
      email: '',
      gender: '',
      education: '',
      languages: '',
      info: '', 
      experience: '', 
      skills: '', 
      workPreference: '', 
      level: 'Novice', 
      pin: '',
      isVisible: true, 
      pictures: {left: '', front: '', right: ''},
      certificates: []
    };
  });
  const [capturingAngle, setCapturingAngle] = useState<'left' | 'front' | 'right' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [appliedGigs, setAppliedGigs] = useState<number[]>(() => JSON.parse(localStorage.getItem('appliedGigs') || '[]') as number[]);
  const [selectedSeeker, setSelectedSeeker] = useState<{id: number, name: string} | null>(null);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [adminPendingApprovals, setAdminPendingApprovals] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [messages, setMessages] = useState<Record<number, { sender: 'me' | 'other', text: string}[]>>(() => JSON.parse(localStorage.getItem('messages') || '{}') as Record<number, { sender: 'me' | 'other', text: string}[]>);
  const [backgroundWallpaper, setBackgroundWallpaper] = useState<string | null>(() => localStorage.getItem('backgroundWallpaper'));
  const [newMessage, setNewMessage] = useState('');
  const [gigs, setGigs] = useState<({id: number, title: string, description: string, creator: string, fileUrls: string[], views: number, applicants: number})[]>(() => JSON.parse(localStorage.getItem('gigs') || JSON.stringify([{id: 1, title: 'Garden Help', description: 'Need help weeding', creator: 'Jane', fileUrls: [], views: 12, applicants: 2}])) as ({id: number, title: string, description: string, creator: string, fileUrls: string[], views: number, applicants: number})[]);
  const [newGig, setNewGig] = useState({title: '', description: '', files: null as FileList | null, fileUrls: [] as string[]});

  // Sync state to Supabase via our API
  useEffect(() => {
    if (!isLoggedIn || !profileData.email) return;

    const syncState = async () => {
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profileData.email,
            state: {
              currentView, profileCompleted, balance, transactions,
              pendingApprovals, businessRequests, isBusinessMode,
              profileData, appliedGigs, messages, gigs, backgroundWallpaper
            }
          })
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
            if (remote.profileData && JSON.stringify(remote.profileData) !== JSON.stringify(profileData)) {
              setProfileData(remote.profileData);
            }
            if (remote.transactions && JSON.stringify(remote.transactions) !== JSON.stringify(transactions)) {
              setTransactions(remote.transactions);
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync to Supabase:", e);
      }
    };

    const timeout = setTimeout(syncState, 2000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [isLoggedIn, currentView, profileCompleted, balance, transactions, pendingApprovals, businessRequests, isBusinessMode, profileData, appliedGigs, messages, gigs, backgroundWallpaper]);

  // Load state from Supabase on Login change
  useEffect(() => {
    if (!isLoggedIn || !profileData.email) return;

    const loadState = async () => {
      try {
        const res = await fetch(`/api/state/${profileData.email}`);
        if (res.ok) {
          const state = await res.json();
          if (state && Object.keys(state).length > 0) {
            if (state.currentView) setCurrentView(state.currentView);
            if (state.profileCompleted !== undefined) setProfileCompleted(state.profileCompleted);
            if (state.balance !== undefined) setBalance(state.balance);
            if (state.transactions) setTransactions(state.transactions);
            if (state.pendingApprovals) setPendingApprovals(state.pendingApprovals);
            if (state.businessRequests) setBusinessRequests(state.businessRequests);
            if (state.isBusinessMode !== undefined) setIsBusinessMode(state.isBusinessMode);
            if (state.profileData) setProfileData(state.profileData);
            if (state.appliedGigs) setAppliedGigs(state.appliedGigs);
            if (state.messages) setMessages(state.messages);
            if (state.gigs) setGigs(state.gigs);
            if (state.backgroundWallpaper) setBackgroundWallpaper(state.backgroundWallpaper);
          }
        }
      } catch (e) {
        console.error("Failed to load from Supabase:", e);
      }
    };
    loadState();
    
    // Auto-refresh for Admin every 30 seconds
    let poller: any;
    if (isLoggedIn && profileData.email === '21lucihanomatthews@gmail.com') {
      poller = setInterval(loadState, 30000);
    }
    
    return () => { if (poller) clearInterval(poller); };
  }, [isLoggedIn]);

  // Standard Persistence Effects
  useEffect(() => { localStorage.setItem('isLoggedIn', String(isLoggedIn)); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('currentView', currentView); }, [currentView]);
  useEffect(() => { localStorage.setItem('profileCompleted', String(profileCompleted)); }, [profileCompleted]);
  useEffect(() => { localStorage.setItem('balance', String(balance)); }, [balance]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals)); }, [pendingApprovals]);
  useEffect(() => { localStorage.setItem('businessRequests', JSON.stringify(businessRequests)); }, [businessRequests]);
  useEffect(() => { localStorage.setItem('isBusinessMode', String(isBusinessMode)); }, [isBusinessMode]);
  useEffect(() => { localStorage.setItem('profileData', JSON.stringify(profileData)); }, [profileData]);
  useEffect(() => { localStorage.setItem('appliedGigs', JSON.stringify(appliedGigs)); }, [appliedGigs]);
  useEffect(() => { localStorage.setItem('messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('gigs', JSON.stringify(gigs)); }, [gigs]);
  useEffect(() => { if (backgroundWallpaper) localStorage.setItem('backgroundWallpaper', backgroundWallpaper); else localStorage.removeItem('backgroundWallpaper'); }, [backgroundWallpaper]);

  const handleLogin = async () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail || !loginPin) {
      alert("Please enter your email and 4-digit PIN");
      return;
    }

    try {
      const res = await fetch(`/api/state/${normalizedEmail}`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const state = await res.json();
      if (state && state.profileData) {
        if (state.profileData.pin === loginPin) {
          setIsLoggedIn(true);
          setProfileData(state.profileData);
          
          // Full state restoration
          if (state.currentView) setCurrentView(state.currentView);
          if (state.profileCompleted !== undefined) setProfileCompleted(state.profileCompleted);
          if (state.balance !== undefined) setBalance(state.balance);
          if (state.transactions) setTransactions(state.transactions);
          if (state.pendingApprovals) setPendingApprovals(state.pendingApprovals);
          if (state.businessRequests) setBusinessRequests(state.businessRequests);
          if (state.isBusinessMode !== undefined) setIsBusinessMode(state.isBusinessMode);
          if (state.appliedGigs) setAppliedGigs(state.appliedGigs);
          if (state.messages) setMessages(state.messages);
          if (state.gigs) setGigs(state.gigs);
          if (state.backgroundWallpaper) setBackgroundWallpaper(state.backgroundWallpaper);
          
          setPopupMessage("Welcome back!");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 2000);
        } else {
          alert("Incorrect PIN for this email. Try again.");
        }
      } else {
        alert(`No account found for ${normalizedEmail}. Please register first.`);
        setAuthMode('register');
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      alert("System Error: Could not connect to the authentication server. Please try again later.");
    }
  };

  const handleRegisterInitiate = () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      alert("Please enter a valid email address");
      return;
    }
    if (loginPin.length !== 4) {
      alert("Please choose a 4-digit secret PIN");
      return;
    }
    if (!acceptTerms) {
      alert("You must accept the Terms and Conditions to continue");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setTempUserData({ email: normalizedEmail, pin: loginPin });
    setAuthMode('verify');
    setShowVerificationPopup(true);
  };

  const handleVerify = async () => {
    if (enteredCode !== verificationCode || !tempUserData) {
      alert("Invalid verification code. Please check the code in the popup.");
      return;
    }

    const newProfile = { 
      ...profileData, 
      email: tempUserData.email, 
      pin: tempUserData.pin,
      isVisible: true // Ensure visible by default
    };
    
    try {
      // First, attempt to save the new user record to the server
      const syncRes = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUserData.email,
          state: {
            currentView, 
            profileCompleted: false, 
            balance: 0, 
            transactions: [],
            pendingApprovals: [], 
            businessRequests: [], 
            isBusinessMode: false,
            profileData: newProfile,
            appliedGigs: [], 
            messages: [], 
            gigs: gigs, // include global gigs
            backgroundWallpaper,
            isLoggedIn: true
          }
        })
      });

      if (!syncRes.ok) {
        const errorData = await syncRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initialize user record on server");
      }

      // If server save succeeded, update local state
      setProfileData(newProfile);
      setIsLoggedIn(true);
      setPopupMessage("Account verified and created successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      
    } catch (e: any) {
      console.error("Registration Sync Error:", e);
      alert(`Verification failed: ${e.message}. Please check if the backend is properly configured.`);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode('login');
    setShowVerificationPopup(false);
    localStorage.clear();
    setProfileData({
      fullName: '', dob: '', location: '', phone: '', email: '', gender: '', education: '', languages: '',
      info: '', experience: '', skills: '', workPreference: '', level: 'Novice', pin: '', isVisible: true,
      pictures: {left: '', front: '', right: ''}, certificates: []
    });
    setBalance(0);
    setTransactions([]);
    setAppliedGigs([]);
    setCurrentView('seeker');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 5) {
        alert("You can only upload up to 5 images.");
        return;
      }
      const urls = Array.from(files).map(file => URL.createObjectURL(file as File));
      setNewGig({...newGig, files, fileUrls: urls});
    }
  };

  const requestCameraAccess = async (angle: 'left' | 'front' | 'right') => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      setCapturingAngle(angle);
    } catch (err) {
      alert("Camera access denied!");
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photo = canvas.toDataURL('image/png');
    
    setProfileData(prev => ({
        ...prev,
        pictures: { ...prev.pictures, [capturingAngle!]: photo }
    }));
    
    closeCamera();
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCapturingAngle(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'seeker':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Available Seekers</h2>
            <div className="grid gap-4">
              {profileCompleted && profileData.isVisible && (
                <div className="bg-white p-4 rounded-lg shadow border-2 border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{profileData.fullName || 'My Profile (You)'}</h3>
                      <p className="text-sm text-gray-500">Work Preference: {profileData.workPreference}</p>
                      <p className="text-sm text-blue-600 font-medium">Level: {profileData.level}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedSeeker({id: 0, name: 'My Profile'}); setCurrentView('profile-details'); }} className="text-blue-600 font-medium text-sm">View My Profile</button>
                </div>
              )}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">John Doe {i}</h3>
                      <p className="text-sm text-gray-500">Work Preference: {profileData.workPreference || 'Permanent'}</p>
                      <p className="text-sm text-blue-600 font-medium">Level: {profileData.level}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedSeeker({id: i, name: `John Doe ${i}`}); setCurrentView('profile-details'); }} className="text-blue-600 font-medium text-sm">View Profile</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'profile-details':
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{selectedSeeker?.id === 0 ? profileData.fullName || 'My Profile' : selectedSeeker?.name}</h2>
            <div className="grid grid-cols-3 gap-2">
                {selectedSeeker?.id === 0 ? (
                    <>
                        <img src={profileData.pictures.left} className="w-full aspect-square bg-gray-200 rounded object-cover" alt="left" />
                        <img src={profileData.pictures.front} className="w-full aspect-square bg-gray-200 rounded object-cover" alt="front" />
                        <img src={profileData.pictures.right} className="w-full aspect-square bg-gray-200 rounded object-cover" alt="right" />
                    </>
                ) : (
                    [1,2,3].map(i => <div key={i} className="w-full aspect-square bg-gray-200 rounded flex items-center justify-center"><User className="text-gray-400" /></div>)
                )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="space-y-2">
                    <p><strong>Full Name:</strong> {selectedSeeker?.id === 0 ? profileData.fullName : 'John Doe'}</p>
                    <p><strong>Location:</strong> {selectedSeeker?.id === 0 ? profileData.location : 'Cape Town'}</p>
                    <p><strong>Education:</strong> {selectedSeeker?.id === 0 ? profileData.education : 'Diploma'}</p>
                    <p><strong>Languages:</strong> {selectedSeeker?.id === 0 ? profileData.languages : 'English, Xhosa'}</p>
                </div>
                <div className="space-y-2">
                    <p><strong>Date of Birth:</strong> {selectedSeeker?.id === 0 ? profileData.dob : '1995/05/20'}</p>
                    <p><strong>Gender:</strong> {selectedSeeker?.id === 0 ? profileData.gender : 'Other'}</p>
                    <p><strong>Work Pref:</strong> {selectedSeeker?.id === 0 ? profileData.workPreference : 'Permanent'}</p>
                    <p><strong>Level:</strong> {selectedSeeker?.id === 0 ? profileData.level : 'Novice'}</p>
                </div>
            </div>
            <div className="pt-4 border-t space-y-2">
                <p><strong>Skills:</strong> {selectedSeeker?.id === 0 ? profileData.skills : 'Gardening, Painting'}</p>
                <p><strong>Experience:</strong> {selectedSeeker?.id === 0 ? profileData.experience : '5 years'}</p>
                <p><strong>About:</strong> {selectedSeeker?.id === 0 ? profileData.info : 'Hardworking individual.'}</p>
            </div>

            {selectedSeeker?.id === 0 && profileData.certificates.length > 0 && (
                <div className="pt-4 border-t">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Verified Certificates</p>
                    <div className="flex gap-2 flex-wrap">
                        {profileData.certificates.map((cert, idx) => (
                            <div key={idx} className="w-16 h-16 border rounded bg-gray-50 overflow-hidden relative group">
                                <img src={cert.url} className="w-full h-full object-cover" alt="cert" />
                                <button onClick={() => window.open(cert.url)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold">View</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedSeeker?.id !== 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Contact Details</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedSeeker?.id === 0 ? profileData.email : 'contact@example.com'}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedSeeker?.id === 0 ? profileData.phone : '+27 12 345 6789'}</p>
                </div>
            )}
            <button onClick={() => { setActiveChat(selectedSeeker!.id); setCurrentView('chat'); }} className="w-full p-2 bg-blue-600 text-white rounded">Hire</button>
          </div>
        );
      case 'inbox':
        const inboxItems = Object.entries(messages).map(([id, msgs]) => {
          const typedMsgs = msgs as { sender: 'me' | 'other', text: string }[];
          return {
            id: parseInt(id),
            lastMessage: typedMsgs[typedMsgs.length - 1],
            name: id === '100' ? 'System/Admin' : (id === '0' ? (profileData.fullName || 'My Profile') : `John Doe ${id}`)
          };
        });

        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
            {inboxItems.length === 0 ? (
              <div className="text-center mt-10 p-10 bg-white rounded-lg border border-gray-100">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No messages yet.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {inboxItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveChat(item.id); setCurrentView('chat'); setSelectedSeeker({id: item.id, name: item.name}); }}
                    className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      {item.id === 100 ? <Shield className="text-blue-600 w-6 h-6" /> : <User className="text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{item.lastMessage.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'chat':
        return (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col pt-20 pb-20">
            <div className="p-4 border-b flex justify-between items-center">
                <button onClick={() => setCurrentView('inbox')} className="text-blue-600">Back</button>
                <div className="flex items-center gap-2">
                    {activeChat === 100 ? <Shield className="text-blue-600 w-6 h-6" /> : <div className="w-10 h-10 bg-gray-200 rounded-full" />}
                     <h2 className="font-bold text-gray-800">{selectedSeeker?.name}</h2>
                </div>
                <div/>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {(messages[activeChat!] || []).map((msg, i) => (
                <div key={i} className={`p-2 rounded ${msg.sender === 'me' ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-100'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="p-2 flex flex-wrap gap-2">
              {['😊', '😂', '😍', '👍', '🔥', '✨', '👋', '🎉', '❤️', '💼', '💪', '🚀'].map(emoji => (
                <motion.button
                  key={emoji}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: Math.random() }}
                  onClick={() => setNewMessage(newMessage + emoji)}
                  className="text-xl hover:bg-gray-100 rounded"
                >{emoji}</motion.button>
              ))}
            </div>
            <form className="p-2 border-t flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (newMessage.trim()) {
                setMessages({...messages, [activeChat!]: [...(messages[activeChat!] || []), {sender: 'me', text: newMessage}]});
                setNewMessage('');
              }
            }}>
                <input className="flex-1 border p-2 rounded" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type message..." />
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
            </form>
          </div>
        );
      case 'profile-edit':
        const allPicturesCaptured = profileData.pictures.left && profileData.pictures.front && profileData.pictures.right;
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Seeker Profile</h2>
            
            {capturingAngle && (
                <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-4">
                    <h3 className="text-white text-xl mb-4 uppercase font-bold">Capture {capturingAngle} View</h3>
                    <video 
                        id="camera-preview"
                        autoPlay 
                        playsInline
                        ref={(el) => { if (el && stream) el.srcObject = stream; }}
                        className="w-full max-w-md aspect-[3/4] object-cover rounded-lg bg-gray-900 scale-x-[-1]"
                    />
                    <div className="mt-8 flex gap-4">
                        <button onClick={closeCamera} className="bg-gray-800 text-white px-6 py-2 rounded-full">Cancel</button>
                        <button onClick={capturePhoto} className="bg-white text-black px-8 py-2 rounded-full font-bold">Capture</button>
                    </div>
                </div>
            )}

            {profileCompleted ? (
              <div className="flex flex-col items-center justify-center p-10 bg-green-50 rounded-lg">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-green-700">Congratulations!</h3>
                <p className="text-green-600 mt-2">Your profile is complete.</p>
                <button onClick={() => setCurrentView('seeker')} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Back to seekers</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { 
                e.preventDefault(); 
                if (!allPicturesCaptured) {
                    alert("Please capture all 3 profile pictures first.");
                    return;
                }
                setProfileCompleted(true); 
              }}>
                <div className="grid grid-cols-3 gap-4">
                  {(['left', 'front', 'right'] as const).map(angle => (
                    <button 
                        type="button" 
                        key={angle} 
                        onClick={() => requestCameraAccess(angle)} 
                        className={`aspect-square rounded flex flex-col items-center justify-center border-2 transition-all overflow-hidden ${profileData.pictures[angle] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}
                    >
                        {profileData.pictures[angle] ? (
                            <img src={profileData.pictures[angle]} className="w-full h-full object-cover" alt={angle} />
                        ) : (
                            <>
                                <Camera className="text-gray-400 mb-1" />
                                <span className="text-[10px] uppercase font-bold text-gray-400">{angle}</span>
                            </>
                        )}
                    </button>
                  ))}
                </div>
                {allPicturesCaptured && (
                    <div className="bg-green-100 text-green-700 p-2 rounded text-xs font-bold text-center animate-pulse">
                        ✓ Photos Approved Automatically
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} className="w-full p-2 border rounded" required />
                    <input type="date" placeholder="DOB" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="w-full p-2 border rounded" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Location (City/Province)" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} className="w-full p-2 border rounded" required />
                    <select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full p-2 border rounded" required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="tel" placeholder="Phone Number" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Email Address" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full p-2 border rounded" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Education Level" value={profileData.education} onChange={e => setProfileData({...profileData, education: e.target.value})} className="w-full p-2 border rounded" />
                    <input type="text" placeholder="Languages" value={profileData.languages} onChange={e => setProfileData({...profileData, languages: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <textarea placeholder="Tell us about yourself (Bio)" value={profileData.info} onChange={e => setProfileData({...profileData, info: e.target.value})} className="w-full p-2 border rounded"></textarea>
                <textarea placeholder="Work Experience" value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} className="w-full p-2 border rounded"></textarea>
                <input type="text" placeholder="Job Skills" value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} className="w-full p-2 border rounded" />
                
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Certificates & Qualifications</label>
                    <input 
                        type="file" 
                        multiple 
                        accept=".pdf,image/*"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                                const newCerts = Array.from(files).map(f => ({
                                    name: (f as File).name,
                                    url: URL.createObjectURL(f as File)
                                }));
                                setProfileData(prev => ({...prev, certificates: [...prev.certificates, ...newCerts]}));
                            }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {profileData.certificates.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2 p-2 bg-gray-50 rounded border border-dashed">
                            {profileData.certificates.map((cert, idx) => (
                                <div key={idx} className="relative group w-12 h-12 bg-white border rounded overflow-hidden">
                                    <img src={cert.url} className="w-full h-full object-cover" alt="cert" />
                                    <button 
                                        type="button"
                                        onClick={() => setProfileData(prev => ({...prev, certificates: prev.certificates.filter((_, i) => i !== idx)}))}
                                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold"
                                    >Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <select value={profileData.workPreference} onChange={e => setProfileData({...profileData, workPreference: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select Work Preference</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Casual">Casual</option>
                  <option value="Both">Both</option>
                </select>
                
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Level</p>
                  <p className="font-semibold text-blue-600">{profileData.level}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">Display profile in Seeker list?</p>
                    <p className="text-xs text-gray-500">Allow others to find and hire you.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setProfileData({...profileData, isVisible: true})}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${profileData.isVisible ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                    >Yes</button>
                    <button 
                      type="button" 
                      onClick={() => setProfileData({...profileData, isVisible: false})}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${!profileData.isVisible ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                    >No</button>
                  </div>
                </div>

                {!isBusinessMode && (
                  <div className="mt-8 pt-6 border-t">
                      <h3 className="font-bold text-gray-800 mb-2">Setup Business Account</h3>
                      <p className="text-xs text-gray-500 mb-4">Select and upload up to 10 business registration documents at once (PDF, JPG, PNG).</p>
                      
                      <div className="space-y-3">
                        <label className="block">
                          <span className="sr-only">Choose files</span>
                          <input 
                            type="file" 
                            multiple 
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const newFiles = Array.from(files);
                                if (businessDocs.length + newFiles.length > 10) {
                                  alert("You can only upload a maximum of 10 documents in total.");
                                } else {
                                  setBusinessDocs([...businessDocs, ...newFiles]);
                                }
                                // Reset input so same file can be picked again if removed
                                e.target.value = '';
                              }
                            }} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </label>

                        {businessDocs.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Live Preview ({businessDocs.length}/10 folders)</p>
                            <div className="grid grid-cols-5 gap-2">
                              {businessDocs.map((f, idx) => {
                                const isImage = f.type.startsWith('image/');
                                return (
                                  <div key={idx} className="aspect-square bg-white rounded border overflow-hidden relative group shadow-sm">
                                    {isImage ? (
                                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="preview" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <Mail className="w-4 h-4 text-blue-400" />
                                      </div>
                                    )}
                                    <button 
                                      type="button"
                                      onClick={() => setBusinessDocs(businessDocs.filter((_, i) => i !== idx))}
                                      className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >×</button>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 pointer-events-none">
                                      <span className="text-[8px] text-white font-bold truncate">{f.name}</span>
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
                                    setBusinessRequests([...businessRequests, {
                                      id: Date.now(), 
                                      user: 'Current User', 
                                      documents: businessDocs.map(f => URL.createObjectURL(f)), 
                                      status: 'pending'
                                    }]);
                                    setBusinessDocs([]);
                                    setPopupMessage("Business account submitted! In Review.");
                                    setShowPopup(true);
                                    setTimeout(() => setShowPopup(false), 3000);
                                } else {
                                    alert("Please upload at least 2 documents for verification.");
                                }
                            }}
                            className={`w-full p-2 rounded text-sm font-bold border transition-colors ${businessDocs.length >= 2 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                        >
                          {businessDocs.length === 1 ? 'Add 1 more document' : 'Submit for Review'}
                        </button>
                      </div>
                  </div>
                )}
                {businessRequests.some(r => r.user === 'Current User' && r.status === 'pending') && (
                  <div className="bg-blue-50 p-3 rounded text-blue-700 text-sm font-bold border border-blue-100 flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    Account In Review: Verification in progress
                  </div>
                )}
                {isBusinessMode && <div className="bg-green-50 p-3 rounded text-green-700 text-sm font-bold border border-green-100 mt-4">✓ Verified Business Owner Account</div>}

                <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Save Profile</button>
              </form>
            )}
          </div>
        );
      case 'gigs':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Gigs</h2>
            <form className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-2" onSubmit={(e) => { e.preventDefault(); setGigs([...gigs, {id: Date.now(), ...newGig, creator: profileData.fullName || 'Anonymous', views: 0, applicants: 0}]); setNewGig({title: '', description: '', files: null, fileUrls: []}); }}>
              <input type="text" placeholder="Gig Title" value={newGig.title} onChange={e => setNewGig({...newGig, title: e.target.value})} className="w-full p-2 border rounded" required />
              <textarea placeholder="Description" value={newGig.description} onChange={e => setNewGig({...newGig, description: e.target.value})} className="w-full p-2 border rounded" required />
              <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="w-full p-2 border rounded" />
              {newGig.fileUrls.length > 0 && (
                <div className="flex gap-2 p-2">
                  {newGig.fileUrls.map(url => <img key={url} src={url} alt="preview" className="w-16 h-16 object-cover rounded" />)}
                </div>
              )}
              <button type="submit" className="w-full p-2 bg-blue-800 text-white rounded">Create Gig</button>
            </form>
            <div className="grid gap-4">
              {gigs.map(gig => {
                const isMyGig = gig.creator === profileData.fullName;
                const alreadyApplied = appliedGigs.includes(gig.id);
                return (
                  <div key={gig.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                        <p className="text-sm text-gray-500">{gig.description}</p>
                        <p className="text-[10px] uppercase font-bold text-blue-500 mt-1">Creator: {gig.creator}</p>
                      </div>
                      <button 
                        className={`${(alreadyApplied || isMyGig) ? 'bg-gray-400' : 'bg-blue-600'} text-white px-3 py-1 rounded text-sm font-medium`} 
                        disabled={alreadyApplied || isMyGig}
                        onClick={() => { 
                          setGigs(gigs.map(g => g.id === gig.id ? {...g, applicants: g.applicants + 1} : g));
                          setAppliedGigs([...appliedGigs, gig.id]);
                          setPopupMessage("Application successfully sent to gig owner!");
                          setShowPopup(true);
                          setTimeout(() => setShowPopup(false), 2000);
                        }}
                      >
                        {isMyGig ? 'My Gig' : (alreadyApplied ? 'Applied' : 'I can do')}
                      </button>

                    </div>
                    <div className="text-xs text-gray-400 flex gap-4">
                      <span>{gig.views} views</span>
                      <span>{gig.applicants} applicants</span>
                    </div>
                    {gig.fileUrls.length > 0 && (
                      <div className="flex gap-2 p-2">
                        {gig.fileUrls.map(url => <img key={url} src={url} alt="gig" className="w-24 h-24 object-cover rounded" />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'wallet':
        if (walletSubView === 'bank') return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold">Bank Transfer Details</h2>
            <p>Please transfer the amount of {selectedTopup?.price} to the following account:</p>
            <div className="bg-gray-100 p-4 rounded text-sm space-y-2">
                <p><strong>Bank:</strong> Capitec</p>
                <p><strong>Account Number:</strong> 1334067366</p>
                <p><strong>Account Name:</strong> Matthews</p>
                <p><strong>Ref:</strong> {selectedTopup?.coins} coins</p>
            </div>
            <input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded" accept="image/*" />
            <button 
               disabled={!proofFile}
               onClick={() => { 
                    if (!proofFile) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64proof = reader.result as string;
                        setTransactions([...transactions, {id: Date.now(), date: new Date().toLocaleDateString(), type: 'pending', amount: selectedTopup!.coins, proof: base64proof}]); 
                        setPendingApprovals([...pendingApprovals, {id: Date.now(), user: profileData.email, amount: selectedTopup!.coins, price: selectedTopup!.price, proof: base64proof}]);
                        setWalletSubView('main'); 
                        setProofFile(null);
                        setPopupMessage("Proof submitted! Awaiting admin approval.");
                        setShowPopup(true);
                        setTimeout(() => setShowPopup(false), 3000);
                    };
                    reader.readAsDataURL(proofFile);
               }} 
               className={`w-full p-2 ${proofFile ? 'bg-green-600' : 'bg-gray-400'} text-white rounded font-bold transition-all active:scale-95`}>
               Submit Proof
            </button>
            <button onClick={() => setWalletSubView('topup')} className="w-full p-2 text-gray-600">Back</button>
          </div>);
        if (walletSubView === 'topup') return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold">Top Up Coins</h2>
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Expire after 30 days:</h3>
                {[ {coins: 20, price: 'R5,00', days: 30}, {coins: 50, price: 'R10,00', days: 30}, {coins: 90, price: 'R15,00', days: 30}, {coins: 150, price: 'R25,00', days: 30} ].map(option => (
                    <button key={option.coins} onClick={() => { setSelectedTopup(option); setWalletSubView('bank'); }} className="w-full flex justify-between p-3 border rounded items-center">
                        <span>{option.coins} coins</span> <span>{option.price}</span>
                    </button>
                ))}
                <h3 className="font-semibold text-gray-700 mt-4">Expire after 60 days:</h3>
                {[ {coins: 1000, price: 'R149,99', days: 60}, {coins: 3000, price: 'R249,99', days: 60} ].map(option => (
                    <button key={option.coins} onClick={() => { setSelectedTopup(option); setWalletSubView('bank'); }} className="w-full flex justify-between p-3 border rounded items-center">
                        <span>{option.coins} coins</span> <span>{option.price}</span>
                    </button>
                ))}
            </div>
            <p className="text-xs text-gray-500 italic">Paystack payment is still in progress.</p>
            <button onClick={() => setWalletSubView('main')} className="w-full p-2 text-gray-600">Back</button>
          </div>
        );

        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 text-center">
              <h2 className="text-sm text-gray-500 uppercase tracking-wide">Coin Balance</h2>
              <p className="text-4xl font-bold text-gray-900 mt-2">{balance} <span className="text-gray-400">coins</span></p>
              <button onClick={() => setWalletSubView('topup')} className="mt-4 w-full p-2 bg-blue-600 text-white rounded font-semibold">Top Up</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Transactions</h3>
              {transactions.length === 0 ? <p className="text-sm text-gray-500">No recent transactions.</p> :
              <div className="space-y-2">
                {transactions.map(t => <div key={t.id} className="flex justify-between items-center text-sm border-b py-2">
                    <div className="flex flex-col">
                        <span>{t.type === 'bought' ? 'Top up' : t.type === 'pending' ? 'Pending top up' : 'Spent'}</span>
                        <span className="text-xs text-gray-400">{t.date}</span>
                    </div>
                    <span className={`font-bold ${t.type === 'pending' ? 'text-orange-500' : ''}`}>{t.type === 'spent' ? '-' : '+'}{t.amount}</span>
                </div>)}
              </div>}
            </div>
          </div>
        );
      case 'admin':
        if (profileData.email !== '21lucihanomatthews@gmail.com') return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>;
        
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
                if (state.pendingApprovals) setPendingApprovals(state.pendingApprovals);
                if (state.profileData) setProfileData(state.profileData);
              }
            }
            const resApprovals = await fetch(`/api/admin/pending-approvals?adminEmail=${profileData.email}`);
            if (resApprovals.ok) {
              setAdminPendingApprovals(await resApprovals.json());
            }
          } catch (e) {}
          setTimeout(() => setShowPopup(false), 1000);
        };

        // Total profit includes top-ups (10% mock)
        const totalApprovedProfit = transactions.filter(t => t.type === 'bought' && !t.note?.includes('Payment from')).reduce((acc, curr) => acc + (curr.amount * 0.1), 0);
        
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
                  <p className="text-2xl font-bold">R{totalApprovedProfit.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                   <p className="text-sm text-green-600">Pending Payments</p>
                   <p className="text-2xl font-bold">{adminPendingApprovals.length}</p>
                </div>
              </div>

              <h3 className="font-bold mb-2">Pending Coin Approvals</h3>
              <div className="space-y-4">
                {adminPendingApprovals.length === 0 ? <p className="text-gray-500 text-sm">No pending coin approvals. Use Refresh to check.</p> : 
                adminPendingApprovals.map(pa => (
                  <div key={pa.id} className="p-4 border rounded-lg space-y-2 bg-gray-50">
                    <div className="flex justify-between">
                        <span className="font-medium text-sm text-gray-700">{pa.user}</span>
                        <span className="font-bold text-blue-600 text-sm">{pa.amount} coins ({pa.price})</span>
                    </div>
                    <div className="mt-2 text-center bg-white p-2 rounded border">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-left">Proof Image</p>
                        {pa.proof ? (
                          <img 
                            src={pa.proof} 
                            className="inline-block max-w-full max-h-48 rounded cursor-pointer hover:opacity-90" 
                            alt="proof" 
                            onClick={() => {
                              const w = window.open("");
                              if (w) {
                                w.document.title = `Proof from ${pa.user}`;
                                w.document.body.style.margin = "0";
                                w.document.body.style.backgroundColor = "#000";
                                w.document.body.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${pa.proof}" style="max-width:100%;max-height:100%;"></div>`;
                              }
                            }} 
                          />
                        ) : <div className="p-4 text-gray-400 italic text-xs">No image provided</div>}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={async () => {
                                try {
                                  const res = await fetch('/api/admin/approve-topup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      userEmail: pa.user,
                                      amount: pa.amount,
                                      adminEmail: profileData.email,
                                      requestId: pa.id
                                    })
                                  });

                                  if (res.ok) {
                                    if (pa.user === profileData.email) {
                                      setBalance(balance + pa.amount);
                                      setTransactions(transactions.map(t => (t.id === pa.id || t.proof === pa.proof) ? {...t, type: 'bought', note: 'Approved'} : t));
                                      setPendingApprovals(pendingApprovals.filter(p => p.id !== pa.id));
                                    }
                                    setAdminPendingApprovals(adminPendingApprovals.filter(p => p.id !== pa.id));
                                    setPopupMessage(`Approved ${pa.amount} coins for ${pa.user}`);
                                    setShowPopup(true);
                                    setTimeout(() => setShowPopup(false), 3000);
                                  } else {
                                    alert("Server failed to approve.");
                                  }
                                } catch (e) {
                                  alert("System error during approval.");
                                }
                            }}
                            className="flex-1 bg-green-600 text-white py-2 px-2 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                        >Approve</button>
                        <button 
                            onClick={async () => {
                                try {
                                  const res = await fetch('/api/admin/reject-topup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      userEmail: pa.user,
                                      adminEmail: profileData.email,
                                      requestId: pa.id
                                    })
                                  });
                                  if (res.ok) {
                                    if (pa.user === profileData.email) {
                                      setTransactions(transactions.filter(t => (t.id !== pa.id && t.proof !== pa.proof)));
                                      setPendingApprovals(pendingApprovals.filter(p => p.id !== pa.id));
                                    }
                                    setAdminPendingApprovals(adminPendingApprovals.filter(p => p.id !== pa.id));
                                    setPopupMessage("Rejected.");
                                    setShowPopup(true);
                                    setTimeout(() => setShowPopup(false), 3000);
                                  }
                                } catch (e) {
                                  alert("System error during rejection.");
                                }
                            }}
                            className="flex-1 bg-red-600 text-white py-2 px-2 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                        >Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold mt-8 mb-2">Business Account Requests</h3>
              <div className="space-y-4">
                {businessRequests.length === 0 ? <p className="text-gray-500 text-sm">No pending business requests.</p> :
                businessRequests.map(br => (
                    <div key={br.id} className="p-4 border rounded-lg space-y-2 bg-blue-50">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-sm">User: {br.user}</p>
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Pending Setup</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {br.documents.map((doc, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={doc} className="w-16 h-16 object-cover rounded border bg-white" alt="doc" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded">
                                        <button onClick={() => window.open(doc)} className="text-[8px] bg-white text-black px-1 rounded font-bold">View</button>
                                        <a href={doc} download={`business_doc_${idx}.png`} className="text-[8px] bg-blue-600 text-white px-1 rounded font-bold">Download</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { 
                                setBusinessRequests(businessRequests.filter(r => r.id !== br.id)); 
                                setIsBusinessMode(true); 
                                // Send Inbox Notification
                                const adminMsg = {sender: 'other' as const, text: "Your Business Account has been APPROVED! You now have access to verified business features."};
                                setMessages(prev => ({...prev, 100: [...(prev[100] || []), adminMsg]}));
                                alert("Business account approved!"); 
                            }} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-semibold">Approve</button>
                            <button onClick={() => { 
                                setBusinessRequests(businessRequests.filter(r => r.id !== br.id)); 
                                // Send Inbox Notification
                                const adminMsg = {sender: 'other' as const, text: "Your Business Account verification was REJECTED. Please ensure your documents are clear and valid before re-submitting."};
                                setMessages(prev => ({...prev, 100: [...(prev[100] || []), adminMsg]}));
                                alert("Business account rejected."); 
                            }} className="flex-1 bg-red-600 text-white py-1.5 rounded text-xs font-semibold">Reject</button>
                        </div>
                    </div>
                ))}
              </div>

              <h3 className="font-bold mt-8 mb-2">Application Wallpaper</h3>
              <div className="p-4 border rounded-lg bg-purple-50 space-y-3">
                <p className="text-xs text-purple-600">Set a custom background wallpaper for the entire application.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBackgroundWallpaper(URL.createObjectURL(file));
                    }
                  }} 
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {backgroundWallpaper && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                        <img src={backgroundWallpaper} className="w-24 h-14 object-cover rounded border bg-white" alt="preview" />
                        <button onClick={() => setBackgroundWallpaper(null)} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow">×</button>
                    </div>
                    <span className="text-xs text-gray-500 italic">Live preview active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={backgroundWallpaper ? { 
        backgroundImage: `url(${backgroundWallpaper})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      } : {}}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-12">
            <Briefcase className="w-10 h-10 text-white transform -rotate-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeGIG</h1>
          <p className="text-gray-500 mb-8">
            {authMode === 'register' ? 'Join the community' : (authMode === 'login' ? 'Welcome back' : 'Verification')}
          </p>
          
          <div className="space-y-4">
            {authMode !== 'verify' ? (
              <>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">{authMode === 'register' ? 'Choose Your PIN' : 'Enter Your PIN'}</label>
                  <input 
                    type="password" 
                    placeholder="••••" 
                    maxLength={4}
                    value={loginPin} 
                    onChange={e => setLoginPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} 
                    className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none tracking-widest text-2xl transition-all text-center" 
                  />
                </div>

                {authMode === 'register' && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={acceptTerms} 
                      onChange={e => setAcceptTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="terms" className="text-[11px] text-gray-500 leading-tight">
                      I accept the <span className="text-blue-600 font-bold underline">Terms and Conditions</span> and understand my PIN will be required for all future access.
                    </label>
                  </div>
                )}

                <button 
                  onClick={authMode === 'register' ? handleRegisterInitiate : handleLogin}
                  disabled={authMode === 'register' && !acceptTerms}
                  className={`w-full ${authMode === 'register' ? 'bg-gray-900 disabled:bg-gray-400' : 'bg-blue-600'} text-white py-4 rounded-2xl font-bold shadow-xl hover:opacity-90 active:scale-95 transition-all mt-4`}
                >
                  {authMode === 'register' ? 'Save & Register' : 'Login Access'}
                </button>
                
                <button 
                  onClick={() => {
                    setAuthMode(authMode === 'register' ? 'login' : 'register');
                    setAcceptTerms(false);
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2 block mx-auto underline underline-offset-4"
                >
                  {authMode === 'register' ? 'Already have an account? Login' : "Don't have an account? Register"}
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-left">
                  <p className="text-xs text-yellow-800 leading-relaxed font-medium text-center">
                    Enter the one-time verification code shown on screen to finalize your registration.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                   <input 
                    type="text" 
                    placeholder="6-DIGIT CODE" 
                    value={enteredCode} 
                    onChange={e => setEnteredCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/30 text-center text-2xl font-mono tracking-[0.5em] focus:border-blue-500 outline-none"
                   />
                </div>
                <button 
                  onClick={handleVerify}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Verify One-Time Code
                </button>
                <button 
                  onClick={() => setAuthMode('login')}
                  className="text-sm font-semibold text-gray-500"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
          <p className="mt-12 text-[10px] text-gray-400 font-medium">Secure access powered by TimeGIG Cloud</p>
        </motion.div>

        <AnimatePresence>
          {showVerificationPopup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Code</h3>
                <p className="text-gray-500 text-sm mb-8">Copy this code to proceed with your registration</p>
                
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-blue-200 mb-8 items-center justify-center flex">
                  <span className="text-4xl font-mono font-black tracking-[0.2em] text-blue-700">
                    {verificationCode}
                  </span>
                </div>

                <button 
                  onClick={() => setShowVerificationPopup(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={backgroundWallpaper ? { 
      backgroundImage: `url(${backgroundWallpaper})`, 
      backgroundSize: 'cover', 
      backgroundAttachment: 'fixed', 
      backgroundPosition: 'center' 
    } : {}}>
      {/* Top Bar */}
      <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">TimeGIG</h1>
          <div className="flex items-center gap-2">
            {profileCompleted && profileData.pictures.front && (
              <button 
                onClick={() => { setCurrentView('profile-details'); setSelectedSeeker({id: 0, name: 'My Profile'}); }}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm transition-all hover:scale-110 mr-1"
              >
                <img src={profileData.pictures.front} className="w-full h-full object-cover" alt="Profile" />
              </button>
            )}
            <button
                onClick={() => setCurrentView('inbox')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-6 h-6 text-gray-700" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-6 h-6 text-gray-700" />
              </button>
              <AnimatePresence>
                {isTopMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  >
                    <button onClick={() => { setCurrentView('profile-edit'); setIsTopMenuOpen(false); }} className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700"><User className="w-4 h-4 mr-2" />Profile</button>
                    <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700"><Settings className="w-4 h-4 mr-2" />Settings</button>
                    {profileData.email === '21lucihanomatthews@gmail.com' && (
                      <button onClick={() => { setCurrentView('admin'); setIsTopMenuOpen(false); }} className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700"><Shield className="w-4 h-4 mr-2" />Admin</button>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600"><LogOut className="w-4 h-4 mr-2" />Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 pt-20 pb-20 p-4">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
            <button onClick={() => setCurrentView('seeker')} className={`flex flex-col items-center p-2 transition-colors ${currentView === 'seeker' ? 'text-blue-600' : 'text-gray-500'}`}>
                <Search className="w-6 h-6" />
                <span className="text-xs pt-1">Seeker</span>
            </button>
            <button onClick={() => setCurrentView('gigs')} className={`flex flex-col items-center p-2 transition-colors ${currentView === 'gigs' ? 'text-blue-600' : 'text-gray-500'}`}>
                <Briefcase className="w-6 h-6" />
                <span className="text-xs pt-1">Gigs</span>
            </button>
            <button onClick={() => setCurrentView('wallet')} className={`flex flex-col items-center p-2 transition-colors ${currentView === 'wallet' ? 'text-blue-600' : 'text-gray-500'}`}>
                <Wallet className="w-6 h-6" />
                <span className="text-xs pt-1">Wallet</span>
            </button>
        </div>
      </nav>
      {showPopup && (
        <div className="fixed bottom-24 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-[100] text-center font-medium animate-bounce">
          {popupMessage}
        </div>
      )}
    </div>
  );
}
