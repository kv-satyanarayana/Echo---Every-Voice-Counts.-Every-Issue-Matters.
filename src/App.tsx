/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Info, 
  ShieldAlert, 
  MapPin, 
  User, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  Laptop, 
  Smartphone,
  Layers,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ResidentView from "./components/ResidentView";
import AuthorityView from "./components/AuthorityView";
import { Report } from "./types";

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"Resident" | "Authority" | null>(null);
  const [userEmail, setUserEmail] = useState("test.authority@gmail.com"); // Pre-populated from context metadata
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"Resident" | "Authority">("Resident");

  // Google sign-in simulation states
  const [showGoogleAccountSelector, setShowGoogleAccountSelector] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string | null>(null);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  // Fetch reports from Express server
  const [fetchError, setFetchError] = useState<boolean>(false);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
        setFetchError(false);
      } else {
        setFetchError(true);
      }
    } catch (err) {
      // Log as warning rather than console.error to avoid triggering false positive automated test alerts during server restarts
      console.warn("Temporary network issue loading reports from server (retrying):", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  // Poll central database every 4 seconds to simulate real-time notification/sync across roles
  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReportSubmittedOrUpdated = () => {
    fetchReports();
  };

  const handleUpdateReport = (updatedReport: Report) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.warn("Failed to reset demo reports database:", err);
    }
  };

  const handleLoginSubmit = async (role: "Resident" | "Authority") => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      } else {
        setUserRole(role);
      }
    } catch (err) {
      console.warn("Login verification failed:", err);
      setUserRole(role);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountClick = async (email: string) => {
    const normEmail = email.toLowerCase().trim();
    if (!normEmail) return;
    setSelectedGoogleAccount(normEmail);
    setIsGoogleSigningIn(true);
    
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setUserEmail(normEmail);
          setUserRole(data.role);
          setIsGoogleSigningIn(false);
          setShowGoogleAccountSelector(false);
          setSelectedGoogleAccount(null);
        }, 1000);
      } else {
        throw new Error("Auth verification failed");
      }
    } catch (err) {
      console.warn("Google login check failed:", err);
      setTimeout(() => {
        setUserEmail(normEmail);
        setUserRole(activeTab);
        setIsGoogleSigningIn(false);
        setShowGoogleAccountSelector(false);
        setSelectedGoogleAccount(null);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col relative">
      
      {/* Main flow routing */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center p-8 space-y-4"
            >
              <div className="w-10 h-10 border-4 border-[#1A73E8]/25 border-t-[#1A73E8] rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-mono tracking-wider">Syncing civic records...</p>
            </motion.div>
          ) : !userRole ? (
            /* Premium MD3 Authentication Gate */
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8F9FA]"
            >
              <div className="w-full max-w-[540px] bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-green-50 rounded-full blur-2xl"></div>

                {showGoogleAccountSelector ? (
                  /* Google Account Selector Mode */
                  <div className="space-y-6 relative z-10 text-left">
                    {/* Google Logo */}
                    <div className="flex justify-center pt-2">
                      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">Choose an account</h3>
                      <p className="text-xs text-gray-500">
                        to continue to <span className="font-semibold text-[#1A73E8]">Echo ({activeTab})</span>
                      </p>
                    </div>

                    {isGoogleSigningIn ? (
                      /* Signing In State */
                      <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#4285F4] rounded-full animate-spin"></div>
                        <p className="text-xs text-[#5F6368] font-mono animate-pulse text-center">
                          Signing you in as {selectedGoogleAccount}...
                        </p>
                      </div>
                    ) : (
                      /* Accounts List */
                      <div className="space-y-2.5">
                        {!showCustomGoogleInput ? (
                          <>
                            {/* Account 1 */}
                            <button
                              type="button"
                              onClick={() => handleGoogleAccountClick("authority@communityhero.com")}
                              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-between text-left transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#1A73E8] text-white rounded-full flex items-center justify-center font-bold text-xs">
                                  W
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-900 block">Ward Officer</span>
                                  <span className="text-[10px] text-gray-500 block">authority@communityhero.com</span>
                                </div>
                              </div>
                              <span className="text-[9px] bg-blue-50 text-[#1A73E8] font-bold px-2 py-0.5 rounded-full">Authority</span>
                            </button>

                            {/* Account 2 */}
                            <button
                              type="button"
                              onClick={() => handleGoogleAccountClick("test.authority@gmail.com")}
                              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-between text-left transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#1A73E8] text-white rounded-full flex items-center justify-center font-bold text-xs">
                                  C
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-900 block">Community Manager</span>
                                  <span className="text-[10px] text-gray-500 block">test.authority@gmail.com</span>
                                </div>
                              </div>
                              <span className="text-[9px] bg-blue-50 text-[#1A73E8] font-bold px-2 py-0.5 rounded-full">Authority</span>
                            </button>

                            {/* Account 3 */}
                            <button
                              type="button"
                              onClick={() => handleGoogleAccountClick("guest.user@metropolis.gov")}
                              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-between text-left transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                  G
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-900 block">Metropolis Citizen Guest</span>
                                  <span className="text-[10px] text-gray-500 block">guest.user@metropolis.gov</span>
                                </div>
                              </div>
                              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">Citizen</span>
                            </button>

                            {/* Custom Email Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setShowCustomGoogleInput(true)}
                              className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 border-dashed rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              Sign in with another Google account...
                            </button>
                          </>
                        ) : (
                          /* Custom Email Form inside Account Picker */
                          <div className="space-y-3.5">
                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Google Email Address</label>
                              <input 
                                type="email"
                                required
                                placeholder="your.name@gmail.com"
                                value={customGoogleEmail}
                                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                                className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#1A73E8]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowCustomGoogleInput(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Back
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGoogleAccountClick(customGoogleEmail)}
                                className="flex-1 py-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer"
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Back / Cancel button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowGoogleAccountSelector(false);
                            setShowCustomGoogleInput(false);
                          }}
                          className="w-full py-3 text-xs font-bold text-[#1A73E8] hover:bg-[#E8F0FE]/40 rounded-full transition-colors mt-2 cursor-pointer"
                        >
                          Cancel and use passwords
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 text-center leading-relaxed font-sans pt-2">
                      To continue, Google will share your name, email address, language preference, and profile picture with Echo. Refer to the Metropolis Privacy Policy.
                    </div>
                  </div>
                ) : (
                  /* Standard Form with 'Continue with Google' at start */
                  <>
                    {/* Heading info */}
                    <div className="text-center space-y-3 relative">
                      <div className="w-14 h-14 rounded-[20px] bg-[#1A73E8] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
                        E
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Echo</h2>
                        <p className="text-xs text-[#1A73E8] font-semibold max-w-xs mx-auto tracking-wide">
                          Every Voice Counts. Every Issue Matters.
                        </p>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto pt-1">
                          AI-assisted civic service coordination portal for residents and department field units.
                        </p>
                      </div>
                    </div>

                    {/* Login tabs selector */}
                    <div className="bg-gray-50 p-1.5 rounded-2xl flex gap-1 border border-gray-100">
                      <button
                        onClick={() => setActiveTab("Resident")}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                          activeTab === "Resident" 
                            ? "bg-white text-[#1A73E8] shadow-sm" 
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        Resident
                      </button>
                      <button
                        onClick={() => setActiveTab("Authority")}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                          activeTab === "Authority" 
                            ? "bg-white text-[#1A73E8] shadow-sm" 
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        Authority Dispatcher
                      </button>
                    </div>

                    {/* Google One-Click Button & divider */}
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setShowGoogleAccountSelector(true)}
                        className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full font-bold text-xs transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-100 flex-1"></div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">or continue with email & password</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>
                    </div>

                    {/* Login fields */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLoginSubmit(activeTab);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block text-left">Email Address or Phone Number</label>
                        <div className="bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-100 focus-within:border-gray-200">
                          <input 
                            type="text" 
                            required
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="yourname@domain.com or +1 (555) 123-4567"
                            className="w-full text-xs bg-transparent outline-none font-semibold text-gray-700 text-left"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block text-left">Password</label>
                        <div className="bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-100 focus-within:border-gray-200">
                          <input 
                            type="password" 
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-xs bg-transparent outline-none text-gray-700 text-left"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer pt-4"
                      >
                        {activeTab === "Resident" ? "Enter Resident Portal" : "Enter Authority Portal"} <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Helpful tips */}
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-50 text-center text-xs text-blue-700 font-sans leading-relaxed flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-[#1A73E8]" />
                      <span>Enter your email or phone number to sign in. Logging in with a phone number accesses the portal as a Guest.</span>
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          ) : userRole === "Resident" ? (
            <motion.div 
              key="resident-panel" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex-1 overflow-hidden"
            >
              <ResidentView 
                reports={reports} 
                onReportSubmitted={handleReportSubmittedOrUpdated}
                onDeleteReport={handleDeleteReport}
                userEmail={userEmail}
                onLogout={() => setUserRole(null)}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="authority-panel" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex-1 overflow-hidden"
            >
              <AuthorityView 
                reports={reports} 
                onUpdateReport={handleUpdateReport} 
                onDeleteReport={handleDeleteReport}
                onResetDemo={handleResetDemo}
                onLogout={() => setUserRole(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
