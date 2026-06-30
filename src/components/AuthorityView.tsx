/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Inbox, 
  Cpu, 
  UserCheck, 
  UserPlus,
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  Users, 
  Settings, 
  Search, 
  Filter, 
  Wrench, 
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Map,
  X,
  LogOut,
  ShieldAlert,
  Hourglass,
  Tag,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Zap,
  Calendar,
  Flag,
  Droplet,
  Lightbulb,
  Trash2,
  Trees,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Report, Worker, DEPARTMENTS } from "../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";

const getCategoryIcon = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("pothole") || cat.includes("road") || cat.includes("street")) {
    return <Wrench className="w-4 h-4 text-white" />;
  }
  if (cat.includes("water") || cat.includes("leak") || cat.includes("drain")) {
    return <Droplet className="w-4 h-4 text-white" />;
  }
  if (cat.includes("light") || cat.includes("power") || cat.includes("electricity")) {
    return <Lightbulb className="w-4 h-4 text-white" />;
  }
  if (cat.includes("garbage") || cat.includes("waste") || cat.includes("trash") || cat.includes("clean")) {
    return <Trash2 className="w-4 h-4 text-white" />;
  }
  if (cat.includes("tree") || cat.includes("park") || cat.includes("forest") || cat.includes("fallen")) {
    return <Trees className="w-4 h-4 text-white" />;
  }
  if (cat.includes("fire") || cat.includes("hazard")) {
    return <Flame className="w-4 h-4 text-white" />;
  }
  return <AlertTriangle className="w-4 h-4 text-white" />;
};

const getCategoryColor = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("pothole") || cat.includes("road") || cat.includes("street")) {
    return "bg-amber-500 shadow-amber-200";
  }
  if (cat.includes("water") || cat.includes("leak") || cat.includes("drain")) {
    return "bg-blue-500 shadow-blue-200";
  }
  if (cat.includes("light") || cat.includes("power") || cat.includes("electricity")) {
    return "bg-yellow-500 shadow-yellow-200";
  }
  if (cat.includes("garbage") || cat.includes("waste") || cat.includes("trash") || cat.includes("clean")) {
    return "bg-green-500 shadow-green-200";
  }
  if (cat.includes("tree") || cat.includes("park") || cat.includes("forest") || cat.includes("fallen")) {
    return "bg-emerald-500 shadow-emerald-200";
  }
  if (cat.includes("fire") || cat.includes("hazard")) {
    return "bg-red-500 shadow-red-200";
  }
  return "bg-rose-500 shadow-rose-200";
};

interface AuthorityViewProps {
  reports: Report[];
  onUpdateReport: (updatedReport: Report) => void;
  onDeleteReport: (id: string) => void;
  onResetDemo: () => void;
  onLogout: () => void;
}

export default function AuthorityView({ reports, onUpdateReport, onDeleteReport, onResetDemo, onLogout }: AuthorityViewProps) {
  // Let selectedReportId start as null, mimicking list-first navigation on mobile
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setShowConfirmDelete(false);
  }, [selectedReportId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  
  // Mobile bottom navigation bar selection ("inbox" | "workers" | "analytics" | "settings")
  const [activeRailTab, setActiveRailTab] = useState<"inbox" | "workers" | "analytics" | "settings">("inbox");
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Dynamic workers management
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerRole, setNewWorkerRole] = useState("");
  const [newWorkerDept, setNewWorkerDept] = useState("Road Maintenance");
  const [newWorkerAvailability, setNewWorkerAvailability] = useState<"Available" | "Busy" | "On Leave">("Available");

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/workers");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (err) {
      console.warn("Failed to fetch workers:", err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerRole) return;

    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newWorker: Worker = {
      id: "w_" + Date.now(),
      name: newWorkerName,
      role: newWorkerRole,
      department: newWorkerDept,
      avatar: randomAvatar,
      distance: `${(Math.random() * 2.5 + 0.1).toFixed(1)} mi away`,
      availability: newWorkerAvailability,
      workload: 0
    };

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorker)
      });
      if (res.ok) {
        const savedWorker = await res.json();
        setWorkers(prev => [...prev, savedWorker]);
        setShowAddWorkerModal(false);
        setNewWorkerName("");
        setNewWorkerRole("");
        setNewWorkerDept("Road Maintenance");
        setNewWorkerAvailability("Available");
      }
    } catch (err) {
      console.warn("Failed to add worker:", err);
    }
  };

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Re-run AI analysis states and handler
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    if (!selectedReport) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedReport.imageUrl,
          description: selectedReport.description
        })
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const parsedAiData = await res.json();

      // Update the report in the database using PUT
      const updateRes = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: parsedAiData.category,
          severity: parsedAiData.severity,
          impactScore: parsedAiData.impactScore,
          department: parsedAiData.department,
          aiSummary: parsedAiData.aiSummary,
          recommendedAction: parsedAiData.recommendedAction,
          issueTitle: parsedAiData.issueTitle,
          citizenSummary: parsedAiData.citizenSummary,
          authoritySummary: parsedAiData.authoritySummary,
          futureImpact: parsedAiData.futureImpact,
          isValid: parsedAiData.isValid,
          reasonIfInvalid: parsedAiData.reasonIfInvalid,
          confidence: parsedAiData.confidence,
          originalSeverity: parsedAiData.originalSeverity,
          originalDepartment: parsedAiData.originalDepartment
        })
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to save re-analyzed fields to DB`);
      }

      const updatedReport = await updateRes.json();
      onUpdateReport(updatedReport);
    } catch (err: any) {
      console.error("AI Re-analysis error:", err);
      setAnalysisError(err?.message || "AI Analysis failed. Please try again later when Gemini API traffic relaxes.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filtered reports list (Gmail style queue)
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesDept = deptFilter === "All" || r.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Sort queue primarily by AI Impact Score (descending) to show critical issues first
  const sortedReports = [...filteredReports].sort((a, b) => b.impactScore - a.impactScore);

  const handleAssignWorker = async (worker: Worker) => {
    if (!selectedReport) return;
    
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Assigned",
          assignedWorker: worker,
          worker: worker
        })
      });
      const updated = await res.json();
      onUpdateReport(updated);
      setShowAssignModal(false);
    } catch (err) {
      console.error("Failed to assign worker:", err);
    }
  };

  const handleUpdateStatus = async (newStatus: "In Progress" | "Resolved") => {
    if (!selectedReport) return;
    
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus
        })
      });
      const updated = await res.json();
      onUpdateReport(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteReportAction = async () => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onDeleteReport(selectedReport.id);
        setSelectedReportId(null);
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // Recharts Analytics calculations
  const deptData = DEPARTMENTS.map(dept => {
    const deptReports = reports.filter(r => r.department === dept);
    return {
      name: dept.split(" ")[0], // Short name
      count: deptReports.length,
      resolved: deptReports.filter(r => r.status === "Resolved").length,
      averageSeverity: Math.round(deptReports.reduce((acc, curr) => acc + curr.severity, 0) / (deptReports.length || 1))
    };
  });

  const severityDistribution = [
    { range: "0-20 (Low)", count: reports.filter(r => r.severity <= 20).length },
    { range: "21-50 (Med)", count: reports.filter(r => r.severity > 20 && r.severity <= 50).length },
    { range: "51-80 (High)", count: reports.filter(r => r.severity > 50 && r.severity <= 80).length },
    { range: "81-100 (Crit)", count: reports.filter(r => r.severity > 80).length },
  ];

  return (
    <div className="flex justify-center bg-[#F8F9FA] min-h-screen w-full font-sans">
      {/* Simulated Mobile Frame mimicking ResidentView viewport sizing */}
      <div className="w-full max-w-[540px] bg-[#F8F9FA] min-h-screen shadow-2xl flex flex-col relative border-x border-[#E0E2E6] overflow-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-[#E0E2E6] px-5 py-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1A73E8] rounded-lg flex items-center justify-center text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="font-sans font-semibold text-sm text-[#1A73E8] block tracking-tight leading-none">Echo</span>
              <span className="text-[9px] text-[#5F6368] font-mono tracking-widest uppercase block mt-0.5">Metropolis Dispatch</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] text-[#5F6368] font-mono tracking-wider font-semibold">Live</span>
            </div>

            <button 
              onClick={onLogout}
              className="text-[10px] text-gray-500 hover:text-[#EA4335] font-bold bg-[#F1F3F4] hover:bg-red-50 px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-[#E0E2E6]"
              title="Logout from Authority Console"
            >
              <LogOut className="w-2.5 h-2.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body with slide effects per tab selection */}
        <main className="flex-1 overflow-y-auto pb-24 relative flex flex-col">
          <AnimatePresence mode="wait">
            
            {activeRailTab === "inbox" && (
              <motion.div
                key="inbox-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {!selectedReport ? (
                  /* Mobile Queue List View */
                  <div className="flex-1 flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-4 border-b border-[#E0E2E6] flex justify-between items-center bg-white shrink-0">
                      <h2 className="font-semibold text-[#1F1F1F] text-sm">Active Dispatch Queue</h2>
                      <span className="text-[10px] text-white bg-[#EA4335] px-2 py-0.5 rounded-full font-bold">
                        {reports.filter(r => r.status === "Pending").length} Pending
                      </span>
                    </div>

                    {/* Filter controls */}
                    <div className="p-4 border-b border-[#E0E2E6] bg-white space-y-2 shrink-0 text-left">
                      <div className="bg-[#F1F3F4] rounded-full px-4 py-2 flex items-center gap-2 border border-[#E0E2E6] focus-within:border-[#1A73E8] focus-within:bg-white transition-all">
                        <Search className="w-4 h-4 text-[#5F6368]" />
                        <input 
                          type="text" 
                          placeholder="Search municipal queue..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-xs bg-transparent outline-none flex-1 font-medium text-[#1F1F1F] placeholder-[#5F6368]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full text-[11px] font-semibold bg-[#F1F3F4] rounded-xl px-2.5 py-1.5 border border-[#E0E2E6] outline-none text-[#5F6368] appearance-none cursor-pointer"
                          >
                            <option value="All">Status: All</option>
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <Filter className="absolute right-2.5 top-2.5 w-3 h-3 text-[#5F6368] pointer-events-none" />
                        </div>

                        <div className="flex-1 relative">
                          <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full text-[11px] font-semibold bg-[#F1F3F4] rounded-xl px-2.5 py-1.5 border border-[#E0E2E6] outline-none text-[#5F6368] appearance-none cursor-pointer"
                          >
                            <option value="All">Dept: All</option>
                            {DEPARTMENTS.map(dept => (
                              <option key={dept} value={dept}>{dept.split(" ")[0]}</option>
                            ))}
                          </select>
                          <Sliders className="absolute right-2.5 top-2.5 w-3 h-3 text-[#5F6368] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Report Cards Feed */}
                    <div className="flex-1 overflow-y-auto divide-y divide-[#E0E2E6]">
                      {sortedReports.length === 0 ? (
                        <div className="text-center py-20 px-6 text-[#5F6368] space-y-2 bg-white">
                          <Inbox className="w-10 h-10 mx-auto text-[#E0E2E6]" />
                          <p className="text-xs font-semibold">No active reports match filters.</p>
                        </div>
                      ) : (
                        sortedReports.map((report) => {
                          const isHigh = report.severity >= 80;
                          const isMed = report.severity >= 50;
                          
                          let leftBorderClass = "border-l-4 border-l-[#34A853]";
                          let priorityLabel = "Maintenance";
                          let labelColorClass = "text-[#34A853]";
                          
                          if (isHigh) {
                            leftBorderClass = "border-l-4 border-l-[#EA4335]";
                            priorityLabel = "High Priority";
                            labelColorClass = "text-[#EA4335]";
                          } else if (isMed) {
                            leftBorderClass = "border-l-4 border-l-[#FBBC04]";
                            priorityLabel = "Public Safety";
                            labelColorClass = "text-[#FBBC04]";
                          }

                          const reportPriority = report.aiPriority || "Medium";
                          const priorityColors = {
                            Critical: "text-red-600 font-extrabold",
                            High: "text-orange-500 font-extrabold",
                            Medium: "text-blue-500 font-bold",
                            Low: "text-gray-500 font-medium"
                          };

                          if (reportPriority === "Critical" || reportPriority === "High") {
                            leftBorderClass = reportPriority === "Critical" ? "border-l-4 border-l-red-600" : "border-l-4 border-l-orange-500";
                            priorityLabel = `${reportPriority} AI Priority`;
                            labelColorClass = reportPriority === "Critical" ? "text-red-600" : "text-orange-500";
                          } else if (isHigh) {
                            leftBorderClass = "border-l-4 border-l-[#EA4335]";
                            priorityLabel = "High Severity";
                            labelColorClass = "text-[#EA4335]";
                          } else if (isMed) {
                            leftBorderClass = "border-l-4 border-l-[#FBBC04]";
                            priorityLabel = "Medium Priority";
                            labelColorClass = "text-[#FBBC04]";
                          }

                          const isOutOfJurisdiction = report.isValid === false || 
                                                      report.category?.toLowerCase() === "other" ||
                                                      (report.address && !report.address.toLowerCase().includes("metropolis"));

                          return (
                            <div
                              key={report.id}
                              onClick={() => setSelectedReportId(report.id)}
                              className={`p-4 border-b border-[#E0E2E6] cursor-pointer transition-colors text-left flex flex-col relative ${leftBorderClass} hover:bg-[#F8F9FA] bg-white`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${labelColorClass}`}>
                                  {priorityLabel}
                                </span>
                                <span className="text-[10px] text-[#5F6368] font-mono">
                                  {report.dateSubmitted.split(" ")[1] || "12m ago"}
                                </span>
                              </div>

                              <h3 className="font-semibold text-sm text-[#1F1F1F] truncate mt-0.5">
                                {report.category}
                              </h3>

                              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5F6368]">
                                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>Confirmed by {report.affectedCount || 0} residents</span>
                              </div>

                              <p className="text-xs text-[#5F6368] mt-1.5 line-clamp-1 italic">
                                "{report.description}"
                              </p>

                              {isOutOfJurisdiction && (
                                <div className="mt-2 flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full w-fit">
                                  <Flag className="w-3 h-3 text-red-600 fill-red-600 animate-pulse shrink-0" />
                                  <span>SUSPECTED OUT OF JURISDICTION</span>
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[10px]">
                                  <span className="text-gray-400">Impact Score:</span>
                                  <span className="font-extrabold text-orange-600">{report.impactScore}</span>
                                </div>
                                
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  report.status === "Resolved" 
                                    ? "bg-[#E6F4EA] text-[#1E8E3E]" 
                                    : report.status === "In Progress" 
                                    ? "bg-[#FEF7E0] text-[#B06000]" 
                                    : report.status === "Assigned"
                                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                                    : "bg-[#F1F3F4] text-[#5F6368]"
                                }`}>
                                  {report.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mobile Detailed Report View */
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* Navigation bar inside mobile detail panel */}
                    <div className="p-3 border-b border-[#E0E2E6] flex items-center justify-between bg-[#F8F9FA] shrink-0">
                      <button
                        onClick={() => setSelectedReportId(null)}
                        className="flex items-center gap-1 text-xs text-[#1A73E8] font-bold hover:bg-[#E8F0FE] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Queue
                      </button>
                      
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        selectedReport.status === "Resolved" 
                          ? "bg-[#E6F4EA] text-[#1E8E3E]" 
                          : selectedReport.status === "In Progress" 
                          ? "bg-[#FEF7E0] text-[#B06000]" 
                          : selectedReport.status === "Assigned"
                          ? "bg-[#E8F0FE] text-[#1A73E8]"
                          : "bg-[#F1F3F4] text-[#5F6368]"
                      }`}>
                        {selectedReport.status}
                      </span>
                    </div>

                    {/* Scrollable details view content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left bg-white pb-20">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest">ID: {selectedReport.id}</span>
                          <span className="text-[10px] text-[#E0E2E6]">•</span>
                          <span className="text-[10px] font-semibold text-[#5F6368]">{selectedReport.department}</span>
                        </div>
                        <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight mt-0.5 leading-snug">{selectedReport.category}</h2>
                      </div>

                      {/* Visual Attachment & Hotspot details stacked vertically for mobile size */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#5F6368] uppercase tracking-widest block">Visual Submission</label>
                          <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#E0E2E6] bg-[#F1F3F4] relative">
                            <img 
                              src={selectedReport.imageUrl} 
                              alt={selectedReport.category} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#5F6368] uppercase tracking-widest block">Incident Location Map</label>
                          <div className="aspect-[16/10] rounded-2xl border border-[#E0E2E6] bg-slate-100 relative overflow-hidden flex flex-col justify-between">
                            {/* Live Interactive OpenStreetMap */}
                            <iframe 
                              title="Incident Location Map"
                              width="100%" 
                              height="100%" 
                              className="absolute inset-0 w-full h-full border-0 z-0"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedReport.lng - 0.003}%2C${selectedReport.lat - 0.003}%2C${selectedReport.lng + 0.003}%2C${selectedReport.lat + 0.003}&layer=mapnik&marker=${selectedReport.lat}%2C${selectedReport.lng}`}
                            ></iframe>

                            {/* Bouncing Centered Map Pin with Category Icon */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="flex flex-col items-center">
                                <div className={`p-2 rounded-full shadow-lg flex items-center justify-center animate-bounce duration-1000 ${getCategoryColor(selectedReport.category)}`}>
                                  {getCategoryIcon(selectedReport.category)}
                                </div>
                                <div className="w-2.5 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-0.5 scale-x-150"></div>
                              </div>
                            </div>

                            <div className="z-10 flex justify-between items-center p-3 pointer-events-none">
                              <span className="text-[9px] font-bold text-[#5F6368] bg-white/95 backdrop-blur shadow-sm border border-[#E0E2E6] px-2 py-0.5 rounded flex items-center gap-1 pointer-events-auto">
                                <Map className="w-3 h-3 text-[#1A73E8]" /> Grid: Lat {selectedReport.lat.toFixed(4)}, Lng {selectedReport.lng.toFixed(4)}
                              </span>
                              <span className="text-[8px] text-red-500 font-extrabold bg-[#FDECEA]/95 backdrop-blur px-1.5 py-0.5 rounded-full pointer-events-auto shadow-sm">Heavy Zone</span>
                            </div>
                            
                            <div className="z-10 bg-white/95 backdrop-blur p-2.5 m-3 rounded-xl border border-[#E0E2E6] shadow-md space-y-0.5 pointer-events-auto self-start">
                              <span className="text-[10px] font-extrabold text-[#1F1F1F] block">Civic Priority Metrics</span>
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-[9px] text-[#5F6368] block">Physical Severity</span>
                                  <span className="text-xs font-bold text-[#EA4335]">{selectedReport.severity}/100</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#5F6368] block">Calculated Impact</span>
                                  <span className="text-xs font-bold text-orange-600">{selectedReport.impactScore}/100</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Community Validation & AI Priority Panel */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                          <Users className="w-4 h-4 text-[#1A73E8]" />
                          <span>Community Validation & Dispatch Actions</span>
                        </div>

                        <div className="bg-[#E8F0FE]/40 p-3 rounded-xl border border-[#1A73E8]/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-blue-500" /> Impact Level:
                            </span>
                            <span className="text-xs font-bold text-[#1A73E8] bg-white px-2.5 py-0.5 rounded-full border border-blue-50 shadow-2xs">
                              Confirmed by {selectedReport.affectedCount || 0} Residents
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                              <span className="text-gray-500 flex items-center gap-1">
                                <ThumbsUp className="w-3.5 h-3.5 text-green-600" /> Confirmed
                              </span>
                              <span className="font-extrabold text-green-600 font-mono">{selectedReport.affectedCount || 0}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                              <span className="text-gray-500 flex items-center gap-1">
                                <ThumbsDown className="w-3.5 h-3.5 text-gray-500" /> Not Present
                              </span>
                              <span className="font-extrabold text-gray-500 font-mono">{selectedReport.notPresentCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-red-500" /> AI Priority:
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              selectedReport.aiPriority === "Critical" ? "bg-red-50 text-red-700 border-red-100" :
                              selectedReport.aiPriority === "High" ? "bg-orange-50 text-orange-700 border-orange-100" :
                              selectedReport.aiPriority === "Medium" ? "bg-blue-50 text-blue-700 border-blue-100" :
                              "bg-gray-50 text-gray-700 border-gray-100"
                            }`}>
                              {selectedReport.aiPriority || "Medium"}
                            </span>
                          </div>
                          
                          {selectedReport.aiPriorityReason && (
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans italic bg-white p-2 rounded-lg border border-gray-100">
                              "{selectedReport.aiPriorityReason}"
                            </p>
                          )}
                        </div>

                        {/* Recommended Dispatch Action based on Community Feedback */}
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 space-y-1 text-left">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Recommended Dispatch Action</span>
                          <span className={`text-xs font-bold flex items-center gap-1.5 ${
                            selectedReport.aiPriority === "Critical" ? "text-red-600" :
                            selectedReport.aiPriority === "High" ? "text-orange-600" :
                            "text-[#1A73E8]"
                          }`}>
                            {selectedReport.aiPriority === "Critical" ? (
                              <>
                                <ShieldAlert className="w-4 h-4 text-red-600" />
                                <span>Assign Immediately</span>
                              </>
                            ) : selectedReport.aiPriority === "High" ? (
                              <>
                                <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                                <span>Prioritize Dispatch (Within 12 Hours)</span>
                              </>
                            ) : selectedReport.aiPriority === "Medium" ? (
                              <>
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>Routine Work Queue (Within 48 Hours)</span>
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4 text-gray-500" />
                                <span>Monitor & Schedule Inspection</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Duplicate Ticket Merging Alert */}
                      {selectedReport.isDuplicateOf && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 space-y-1 text-left">
                          <span className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> DUPLICATE COMPLAINT DETECTED
                          </span>
                          <p className="text-xs">
                            This report matches an existing open ticket: <strong>{selectedReport.isDuplicateOf}</strong>. Actions and status changes will affect both duplicates.
                          </p>
                          {selectedReport.duplicateExplanation && (
                            <p className="text-[11px] text-amber-800 italic bg-white/50 p-2 rounded mt-1">
                              "{selectedReport.duplicateExplanation}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* AI Assessment analysis report block */}
                      <div className="bg-[#E8F0FE] rounded-2xl border border-[#1A73E8]/20 p-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-[#1A73E8]" />
                            <span className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest">AI Vision & Routing Decision</span>
                          </div>
                          {selectedReport.confidence !== undefined && (
                            <span className="text-[9px] font-mono text-[#1A73E8] bg-[#1A73E8]/10 px-1.5 py-0.5 rounded-md">
                              Conf: {selectedReport.confidence}%
                            </span>
                          )}
                        </div>

                        {selectedReport.confidence === 0 && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl p-3 space-y-1">
                            <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> TEMPORARY LOCAL FALLBACK</span>
                            <p className="text-xs">Heuristics classification was used because of heavy API traffic. Click the diagnostics button below to run deep Gemini model analysis now.</p>
                          </div>
                        )}

                        {selectedReport.isValid === false && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 space-y-1">
                            <span className="font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" /> SUSPECTED INVALID COMPLAINT</span>
                            <p className="text-xs">{selectedReport.reasonIfInvalid || "AI flagged this submission as a selfie, meme, pet photo, or unrelated screenshot."}</p>
                          </div>
                        )}
                        
                        <div className="space-y-0.5 text-xs text-left">
                          <span className="font-bold text-[#1F1F1F] block">Civic Hazard Impact</span>
                          <p className="leading-relaxed text-[#5F6368] font-light italic">"{selectedReport.aiSummary}"</p>
                        </div>

                        {selectedReport.futureImpact && (
                          <>
                            <div className="h-px bg-[#1A73E8]/10"></div>
                            <div className="space-y-0.5 text-xs text-left">
                              <span className="font-bold text-[#1F1F1F] block">Consequences of Delay (Future Impact)</span>
                              <p className="leading-relaxed text-[#5F6368] font-light">{selectedReport.futureImpact}</p>
                            </div>
                          </>
                        )}

                        {selectedReport.safetyAdvice && (
                          <>
                            <div className="h-px bg-[#1A73E8]/10"></div>
                            <div className="space-y-0.5 text-xs text-left">
                              <span className="font-bold text-[#1F1F1F] block flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Resident Safety Advice
                              </span>
                              <p className="leading-relaxed text-amber-900 bg-amber-50/60 p-2.5 rounded-xl font-medium">{selectedReport.safetyAdvice}</p>
                            </div>
                          </>
                        )}

                        {/* Dispatch Guidance */}
                        {(selectedReport.estimatedWorkers || selectedReport.estimatedResolutionTime) && (
                          <>
                            <div className="h-px bg-[#1A73E8]/10"></div>
                            <div className="space-y-1.5 text-xs text-left">
                              <span className="font-bold text-[#1F1F1F] block flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" /> AI Dispatch Guidance
                              </span>
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-white/80 p-2 rounded-xl border border-[#1A73E8]/10 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                                  <span>Crew: <strong>{selectedReport.estimatedWorkers || 2} workers</strong></span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-xl border border-[#1A73E8]/10 flex items-center gap-1.5">
                                  <Hourglass className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                                  <span>Time: <strong>{selectedReport.estimatedResolutionTime || "2 days"}</strong></span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Semantic Grouping Tag list */}
                        {selectedReport.duplicateKeywords && selectedReport.duplicateKeywords.length > 0 && (
                          <>
                            <div className="h-px bg-[#1A73E8]/10"></div>
                            <div className="space-y-1 text-xs text-left">
                              <span className="font-bold text-[#1F1F1F] block">Semantic Keywords</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedReport.duplicateKeywords.map((tag: string, idx: number) => (
                                  <span key={idx} className="text-[9px] font-semibold bg-[#1A73E8]/10 text-[#1A73E8] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5 shrink-0" /> {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="h-px bg-[#1A73E8]/10"></div>

                        <div className="space-y-0.5 text-xs text-left">
                          <span className="font-bold text-[#1F1F1F] block">Recommended Action Checklist</span>
                          <p className="leading-relaxed text-[#5F6368] font-light">{selectedReport.recommendedAction}</p>
                        </div>

                        <div className="h-px bg-[#1A73E8]/10"></div>

                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            onClick={handleRunAiAnalysis}
                            disabled={isAnalyzing}
                            className="w-full flex items-center justify-center gap-2 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#1A73E8]/50 text-white text-xs font-semibold py-2 px-3 rounded-xl transition duration-150 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                            {isAnalyzing ? "Running Deep AI Analysis..." : "Run AI Diagnostics / Re-Analyze"}
                          </button>
                          {analysisError && (
                            <p className="text-[10px] text-red-600 font-medium text-center mt-1">{analysisError}</p>
                          )}
                        </div>
                      </div>

                      {/* Citizen's description and timestamp */}
                      <div className="bg-white rounded-2xl border border-[#E0E2E6] p-4 space-y-2">
                        <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block">Citizen's Original Request</span>
                        <p className="text-xs text-[#1F1F1F] leading-relaxed">"{selectedReport.description}"</p>
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#5F6368] font-mono">
                          <Clock className="w-3.5 h-3.5" /> {selectedReport.dateSubmitted}
                        </div>
                      </div>

                      {/* Assigned Dispatcher / Field Crew block */}
                      {selectedReport.assignedWorker && (
                        <div className="bg-[#F1F3F4] rounded-2xl p-4 border border-[#E0E2E6] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold flex items-center justify-center text-sm border-2 border-white shadow-xs shrink-0 select-none">
                              {selectedReport.assignedWorker.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-[9px] text-[#5F6368] block">Assigned Dispatcher</span>
                              <span className="text-xs font-bold text-[#1F1F1F] block">{selectedReport.assignedWorker.name}</span>
                              <span className="text-[10px] text-[#1A73E8] font-semibold">{selectedReport.assignedWorker.role}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] text-[#5F6368] block">Active Milestone</span>
                            <span className="text-[10px] font-semibold text-[#1E8E3E] bg-[#E6F4EA] px-2 py-0.5 rounded-full inline-block mt-0.5 border border-[#1E8E3E]/15">
                              {selectedReport.statusTimeline.find(t => !t.completed)?.stage || "Resolved"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action trigger section */}
                      <div className="pt-2">
                        {selectedReport.status === "Pending" && (
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="w-full py-3 bg-[#1A73E8] text-white hover:bg-blue-600 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" /> Recommend Best Dispatcher
                          </button>
                        )}

                        {selectedReport.status === "Assigned" && (
                          <button
                            onClick={() => handleUpdateStatus("In Progress")}
                            className="w-full py-3 bg-[#FBBC04] hover:bg-yellow-500 text-gray-900 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Wrench className="w-4 h-4 text-gray-800" /> Start Resolution Task
                          </button>
                        )}

                        {selectedReport.status === "In Progress" && (
                          <button
                            onClick={() => handleUpdateStatus("Resolved")}
                            className="w-full py-3 bg-[#34A853] hover:bg-green-600 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark as Fully Resolved
                          </button>
                        )}

                        {selectedReport.status === "Resolved" && (
                          <div className="bg-[#E6F4EA] text-[#1E8E3E] py-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border border-[#1E8E3E]/20">
                            <CheckCircle2 className="w-4 h-4" /> Task Resolved & Audited
                          </div>
                        )}
                      </div>

                      {/* Separator & Destructive Delete Option */}
                      <div className="mt-3 pt-3 border-t border-[#E0E2E6]">
                        {!showConfirmDelete ? (
                          <button
                            onClick={() => setShowConfirmDelete(true)}
                            className="w-full py-2.5 border border-[#EA4335] text-[#EA4335] hover:bg-[#EA4335]/5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Delete This Issue
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={handleDeleteReportAction}
                              className="flex-1 py-2.5 bg-[#EA4335] text-white hover:bg-red-600 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                            >
                              <Trash2 className="w-4 h-4" /> Confirm Delete
                            </button>
                            <button
                              onClick={() => setShowConfirmDelete(false)}
                              className="px-4 py-2.5 bg-[#F1F3F4] text-gray-700 hover:bg-[#E0E2E6] rounded-full text-xs font-bold transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeRailTab === "workers" && (
              <motion.div
                key="workers-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-4 space-y-4 bg-[#F8F9FA]"
              >
                <div className="flex items-center justify-between text-left">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#1A73E8]" /> Active Dispatchers
                    </h2>
                    <p className="text-xs text-[#5F6368]">
                      Availability parameters, ongoing task loads, and distance coordinates.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAddWorkerModal(true)}
                    className="px-3 py-1.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Worker
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pb-10">
                  {workers.map((worker) => {
                    const activeRepCount = reports.filter(r => r.assignedWorker?.id === worker.id && r.status !== "Resolved").length;
                    const isAvail = worker.availability === "Available";
                    return (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 border border-[#E0E2E6] flex items-center justify-between hover:shadow-sm transition-all text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold flex items-center justify-center text-sm border-2 border-[#E0E2E6] shadow-xs shrink-0 select-none">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[#1F1F1F]">{worker.name}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                                isAvail 
                                  ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/10" 
                                  : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/10"
                              }`}>
                                {worker.availability}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#5F6368] font-semibold block">{worker.role}</span>
                            <span className="text-[9px] text-[#5F6368] block font-light">{worker.department} • {worker.distance}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-0.5 bg-[#F1F3F4] p-2 rounded-xl border border-[#E0E2E6] text-center min-w-[75px]">
                          <span className="text-[8px] text-[#5F6368] uppercase tracking-wider block">Workload</span>
                          <span className="text-xs font-bold text-[#1A73E8]">{activeRepCount} tasks</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeRailTab === "analytics" && (
              <motion.div
                key="analytics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-4 space-y-4 bg-[#F8F9FA] overflow-y-auto pb-20"
              >
                <div className="space-y-0.5 text-left">
                  <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#1A73E8]" /> Operations Analytics
                  </h2>
                  <p className="text-xs text-[#5F6368]">
                    Response curves, physical hotspots, and department volume indices.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Department task load */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E0E2E6] space-y-3">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block text-left">Department Volume</span>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#5F6368" fontSize={9} tickLine={false} />
                          <YAxis stroke="#5F6368" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Severity Distribution */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E0E2E6] space-y-3">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block text-left">Urgency Severity Curve</span>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={severityDistribution} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <XAxis dataKey="range" stroke="#5F6368" fontSize={8} tickLine={false} />
                          <YAxis stroke="#5F6368" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="count" stroke="#EA4335" fill="#FDECEA" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* High performance metrics cards */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E0E2E6] space-y-2 text-left">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block">Response Target SLA metrics</span>
                    <p className="text-[11px] text-[#5F6368] leading-relaxed">
                      Metro-Dispatches optimizes routes instantly upon vision input matching spatial zones.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      <div className="bg-[#E8F0FE] p-2 rounded-xl border border-[#1A73E8]/10">
                        <span className="text-[9px] text-[#5F6368] block">Pending</span>
                        <span className="text-sm font-bold text-[#1A73E8]">{reports.filter(r => r.status === "Pending").length}</span>
                      </div>
                      <div className="bg-[#FEF7E0] p-2 rounded-xl border border-[#FBBC04]/10">
                        <span className="text-[9px] text-[#5F6368] block">Active</span>
                        <span className="text-sm font-bold text-[#B06000]">{reports.filter(r => r.status === "In Progress" || r.status === "Assigned").length}</span>
                      </div>
                      <div className="bg-[#E6F4EA] p-2 rounded-xl border border-[#1E8E3E]/10">
                        <span className="text-[9px] text-[#5F6368] block">Resolved</span>
                        <span className="text-sm font-bold text-[#1E8E3E]">{reports.filter(r => r.status === "Resolved").length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeRailTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-4 space-y-4 bg-[#F8F9FA] text-left"
              >
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#1A73E8]" /> Console Settings
                  </h2>
                  <p className="text-xs text-[#5F6368]">
                    Configure operational weights, security handshakes, and database seeds.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 border border-[#E0E2E6] space-y-3">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block">AI Decision Weights</span>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#1F1F1F]">Hazard Urgency Weight</span>
                        <span className="font-mono text-[#EA4335] font-bold">75% (Critical)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#1F1F1F]">Population Concentration</span>
                        <span className="font-mono text-[#34A853] font-bold">25% (Regional)</span>
                      </div>
                      <div className="h-px bg-[#E0E2E6]"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#1F1F1F]">Auto-Dispatch Filter</span>
                        <span className="font-mono text-[#1A73E8] font-bold">80+ Impact Score</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E6F4EA] rounded-2xl p-4 border border-[#1E8E3E]/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#1E8E3E] font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#1E8E3E]" />
                      <span>Security Handshake Node Connected</span>
                    </div>
                    <p className="text-[10px] text-[#1E8E3E] leading-relaxed opacity-90">
                      Live dispatch streams securely paired to AI analysis nodes.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-[#E0E2E6] space-y-2.5">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest block">System Diagnostics</span>
                    <button
                      onClick={onResetDemo}
                      className="w-full py-3 bg-[#EA4335]/10 hover:bg-[#EA4335]/20 text-[#EA4335] border border-[#EA4335]/20 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Database Seeds
                    </button>

                    <button
                      onClick={onLogout}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-gray-500" /> Sign Out from Console
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Bottom Navigation Tabs - matching MD3 spec */}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-[#E0E2E6] h-16 px-4 flex justify-around items-center z-30 shrink-0">
          <button
            onClick={() => {
              setActiveRailTab("inbox");
              setSelectedReportId(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeRailTab === "inbox" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
            }`}
          >
            <div className={`px-4 py-1 rounded-full ${activeRailTab === "inbox" ? "bg-[#E8F0FE]" : ""}`}>
              <Inbox className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold font-sans">Queue</span>
          </button>

          <button
            onClick={() => {
              setActiveRailTab("workers");
              setSelectedReportId(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeRailTab === "workers" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
            }`}
          >
            <div className={`px-4 py-1 rounded-full ${activeRailTab === "workers" ? "bg-[#E8F0FE]" : ""}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold font-sans">Dispatchers</span>
          </button>

          <button
            onClick={() => {
              setActiveRailTab("analytics");
              setSelectedReportId(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeRailTab === "analytics" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
            }`}
          >
            <div className={`px-4 py-1 rounded-full ${activeRailTab === "analytics" ? "bg-[#E8F0FE]" : ""}`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold font-sans">Analytics</span>
          </button>

          <button
            onClick={() => {
              setActiveRailTab("settings");
              setSelectedReportId(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeRailTab === "settings" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
            }`}
          >
            <div className={`px-4 py-1 rounded-full ${activeRailTab === "settings" ? "bg-[#E8F0FE]" : ""}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold font-sans">Settings</span>
          </button>
        </nav>

        {/* Interactive Bottom Sheet (Drawer modal) for Worker Assignment */}
        <AnimatePresence>
          {showAssignModal && selectedReport && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center z-50">
              <motion.div 
                initial={{ y: 250, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 250, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="bg-white rounded-t-3xl p-5 w-full shadow-2xl border-t border-[#E0E2E6] text-left space-y-4 max-h-[75%] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#1A73E8]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F] font-sans">Recommended Field dispatcher</h3>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-[#5F6368] hover:text-[#1F1F1F] p-1 rounded-full hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-[#5F6368] leading-relaxed">
                  AI-filtered best matching field technician specialized in **{selectedReport.department}** or currently closest:
                </p>

                <div className="space-y-2">
                  {workers.filter(w => w.department === selectedReport.department || w.availability === "Available").map((worker) => (
                    <div 
                      key={worker.id}
                      onClick={() => handleAssignWorker(worker)}
                      className="flex items-center justify-between p-2.5 bg-[#F1F3F4] hover:bg-[#E8F0FE] rounded-xl border border-[#E0E2E6] hover:border-[#1A73E8]/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold flex items-center justify-center text-xs border border-white shadow-xs shrink-0 select-none">
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#1F1F1F] block">{worker.name}</span>
                          <span className="text-[10px] text-[#1A73E8] font-semibold">{worker.role}</span>
                          <span className="text-[9px] text-[#5F6368] block font-light truncate">{worker.distance} • Load: {worker.workload} active</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#5F6368] group-hover:text-[#1A73E8] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="w-full py-3 bg-[#F1F3F4] hover:bg-gray-200 text-[#5F6368] rounded-full text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddWorkerModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl border border-gray-100 text-left space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F1F1F] font-sans flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#1A73E8]" /> Add New Field Worker
                  </h3>
                  <button onClick={() => setShowAddWorkerModal(false)} className="text-[#5F6368] hover:text-[#1F1F1F] p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddWorkerSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Liam Foster"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Role / Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Lead Inspector"
                      value={newWorkerRole}
                      onChange={(e) => setNewWorkerRole(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Department Assignment</label>
                    <select
                      value={newWorkerDept}
                      onChange={(e) => setNewWorkerDept(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#1A73E8]"
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Availability State</label>
                    <select
                      value={newWorkerAvailability}
                      onChange={(e) => setNewWorkerAvailability(e.target.value as any)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#1A73E8]"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddWorkerModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      Save Worker
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
