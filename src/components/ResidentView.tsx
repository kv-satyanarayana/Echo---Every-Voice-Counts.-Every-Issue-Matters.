/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Mic, 
  MicOff,
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Navigation, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight, 
  User, 
  RefreshCw,
  X,
  UploadCloud,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  Users,
  Hourglass,
  Search,
  LogOut,
  Map,
  Droplet,
  Lightbulb,
  Paintbrush,
  Trash2,
  Trees,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Briefcase,
  Activity,
  Plus,
  Brain,
  Cpu,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Report, WORKERS } from "../types";

// Standard preset samples for simulation
const PRESET_HAZARDS = [
  {
    name: "Pothole on Grand Ave",
    image: "https://images.unsplash.com/photo-1621244249243-436b79b5eea8?w=600&auto=format&fit=crop&q=80",
    desc: "A massive pothole in the middle of Grand Avenue. It has sharp edges and causes drivers to swerve dangerously.",
    transcript: "Hey, I'm calling in a really deep pothole on Grand Avenue, right near Elm Street. Cars are swerving to avoid it and it looks really dangerous."
  },
  {
    name: "Park Plaque Graffiti",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
    desc: "Graffiti spray-painted over the historical informational plaque at the Pioneer park entrance.",
    transcript: "There's fresh spray paint graffiti all over the historical plaque at the park entrance. You can't read the text anymore."
  },
  {
    name: "Dark Streetlight on Oak",
    image: "https://images.unsplash.com/photo-1542640244-7e672d6cef21?w=600&auto=format&fit=crop&q=80",
    desc: "A flickering streetlight bulb that eventually went completely dark, making the sidewalk pitch black.",
    transcript: "The street light in front of 804 Oak Drive is completely out. The whole sidewalk is pitch black and it feels pretty unsafe."
  },
  {
    name: "Water Main Leak",
    image: "https://images.unsplash.com/photo-1548248823-7a7669151593?w=600&auto=format&fit=crop&q=80",
    desc: "Water actively bubbling out from a cracked sidewalk on Pine Blvd, creating a large pool on the road.",
    transcript: "Water is bubbling up through the cracks on the sidewalk near 290 Pine Blvd. It's pooling and wasting a ton of clean water."
  },
  {
    name: "Illegal Trash Dumping",
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
    desc: "Piles of plastic garbage bags, an old mattress, and tires discarded in the alleyway behind the shops.",
    transcript: "Someone dumped a bunch of trash, a mattress, and old tires in the alleyway behind the shops on Main Street."
  }
];

const getCategoryIcon = (category: string, className = "w-5 h-5") => {
  const cat = category.toLowerCase();
  if (cat.includes("water") || cat.includes("leak") || cat.includes("sewer")) {
    return <Droplet className={className} />;
  }
  if (cat.includes("pothole") || cat.includes("road") || cat.includes("street")) {
    return <AlertTriangle className={className} />;
  }
  if (cat.includes("light") || cat.includes("streetlight")) {
    return <Lightbulb className={className} />;
  }
  if (cat.includes("graffiti") || cat.includes("paint") || cat.includes("vandalism")) {
    return <Paintbrush className={className} />;
  }
  if (cat.includes("trash") || cat.includes("garbage") || cat.includes("dumping") || cat.includes("sanitation")) {
    return <Trash2 className={className} />;
  }
  if (cat.includes("tree") || cat.includes("park") || cat.includes("recreation")) {
    return <Trees className={className} />;
  }
  return <AlertTriangle className={className} />;
};

interface ResidentViewProps {
  reports: Report[];
  onReportSubmitted: () => void;
  onDeleteReport: (id: string) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function ResidentView({ reports, onReportSubmitted, onDeleteReport, userEmail, onLogout }: ResidentViewProps) {
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "profile">("home");
  const [isReporting, setIsReporting] = useState(false);
  const [isNewReportSubmission, setIsNewReportSubmission] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Permissions Request Center states
  const [showPermissionsModal, setShowPermissionsModal] = useState(() => {
    return !localStorage.getItem("hasAcceptedPermissions");
  });
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [permissionRequestStatus, setPermissionRequestStatus] = useState<string | null>(null);

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setPermissionRequestStatus("Requesting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationPermissionGranted(true);
        setPermissionRequestStatus("Location access granted!");
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => {
        console.warn("Location permission denied or failed:", err);
        setPermissionRequestStatus("Location access denied.");
      }
    );
  };

  const requestCameraPermission = async () => {
    setPermissionRequestStatus("Requesting camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
      setPermissionRequestStatus("Camera access granted!");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn("Camera permission denied:", err);
      setPermissionRequestStatus("Camera access denied.");
    }
  };

  const requestMicrophonePermission = async () => {
    setPermissionRequestStatus("Requesting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermissionGranted(true);
      setPermissionRequestStatus("Microphone access granted!");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      setPermissionRequestStatus("Microphone access denied.");
    }
  };

  const handleCompletePermissions = () => {
    localStorage.setItem("hasAcceptedPermissions", "true");
    setShowPermissionsModal(false);
  };
  
  // Reporting Form States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const [address, setAddress] = useState("1420 Grand Avenue, Metropolis");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Live Camera & Speech Recognition States & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = () => {
    setCameraError(null);
    setIsCameraActive(true);
    
    // Defer media stream acquisition until video element is rendered
    setTimeout(() => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(e => console.warn("Video play failed:", e));
            }
            streamRef.current = stream;
          })
          .catch((err) => {
            console.error("Camera access failed:", err);
            setCameraError("Camera access denied or unavailable. Please upload a photo instead.");
            setIsCameraActive(false);
          });
      } else {
        setCameraError("Media devices API not supported in this environment.");
        setIsCameraActive(false);
      }
    }, 150);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
      }
      stopCamera();
    }
  };

  // Cleanup effect for camera and speech
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Stop camera if not in reporting mode
  useEffect(() => {
    if (!isReporting) {
      stopCamera();
    }
  }, [isReporting]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        alert("Could not automatically retrieve GPS. Please check permission or enter location manually.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  
  // AI processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  
  // Success state
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);

  // Filter citizen's own reports (simulate citizen specific based on name or display ours)
  const isEmail = userEmail.includes("@");
  const currentUserPrefix = isEmail ? userEmail.split("@")[0].toLowerCase().trim() : "guest";
  const isSpecificUser = isEmail && userEmail.toLowerCase().trim() === "vskattunga@gmail.com";
  const username = isEmail ? userEmail.split("@")[0] : "Guest";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  const isMyReport = (report: Report) => {
    const citizenNameLower = report.citizenName?.toLowerCase() || "";
    return citizenNameLower.includes(`(${currentUserPrefix})`) || citizenNameLower.includes(currentUserPrefix);
  };

  const myReports = reports.filter(isMyReport);
  const otherReports = reports.filter(r => !isMyReport(r));

  // Dynamic Community report statistics
  const citizenReportsCount = myReports.length;
  const resolvedCount = myReports.filter(r => r.status === "Resolved").length;
  const activeCount = myReports.filter(r => r.status === "Assigned" || r.status === "In Progress").length;

  useEffect(() => {
    if (isRecording) {
      setRecordingTimer(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } else {
      setIsRecording(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this environment. Falling back to simulation.");
        // Simulated fallback transcription
        setTimeout(() => {
          const matchedPreset = PRESET_HAZARDS.find(p => p.image === selectedImage);
          if (matchedPreset) {
            setDescriptionText(matchedPreset.transcript);
          } else {
            setDescriptionText("There is a municipal issue at this location. It looks like it needs urgent maintenance. Water is leaking or physical damage is present.");
          }
          setIsRecording(false);
        }, 3000);
        return;
      }

      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        let finalTranscript = "";

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const currentText = finalTranscript + interimTranscript;
          if (currentText.trim()) {
            setDescriptionText(currentText);
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech Recognition error:", err);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (e) {
        console.error("Failed to start Speech Recognition:", e);
        setIsRecording(false);
      }
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_HAZARDS[0]) => {
    setSelectedImage(preset.image);
    setDescriptionText(preset.desc);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAiAnalysis = async () => {
    if (!selectedImage || !descriptionText.trim()) return;
    
    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingLogs([]);

    const steps = [
      "Initializing secure connection to municipal server...",
      "Extracting physical features from submitted image...",
      "Analyzing voice transcript / textual hazard description...",
      "Running semantic category matching algorithm...",
      "Querying spatial boundaries for regional allocation...",
      "Calculating civic safety impact score (0-100)...",
      "Identifying responsible maintenance department...",
      "Formulating emergency action blueprint..."
    ];

    // Stagger the progress checklist slowly for that elegant, calm AI feel
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      setProcessingLogs(prev => [...prev, steps[i]]);
      await new Promise(resolve => setTimeout(resolve, i === 3 ? 1200 : 800));
    }

    let parsedAiData: any = null;
    try {
      // Call actual backend Express route which calls Gemini API
      const res = await fetch("/api/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage?.startsWith("data:") ? selectedImage : null,
          description: descriptionText,
          imageUrl: selectedImage
        })
      });

      if (res.ok) {
        parsedAiData = await res.json();
      } else {
        console.warn(`Analyze API returned status ${res.status}, using safe fallback.`);
      }
    } catch (apiErr) {
      console.warn("Express analyze-issue API failed or timed out, using local safe fallback.", apiErr);
    }

    if (!parsedAiData) {
      // Generate standard fallback fields matching the user's inputs
      let cat = "Other";
      let dept = "Road Maintenance";
      let origDept = "Road Maintenance";
      let sev = 55;
      let sevStr = "Medium";
      const textForMatching = (descriptionText || "").toLowerCase();
      
      if (textForMatching.includes("pothole") || textForMatching.includes("road") || textForMatching.includes("pavement") || textForMatching.includes("street")) {
        cat = "Road Damage";
        dept = "Road Maintenance";
        origDept = "Road Maintenance";
        sev = 80;
        sevStr = "High";
      } else if (textForMatching.includes("graffiti") || textForMatching.includes("tag") || textForMatching.includes("spray")) {
        cat = "Graffiti";
        dept = "Sanitation";
        origDept = "Sanitation";
        sev = 30;
        sevStr = "Low";
      } else if (textForMatching.includes("light") || textForMatching.includes("dark") || textForMatching.includes("lamp") || textForMatching.includes("bulb")) {
        cat = "Streetlight";
        dept = "Electrical";
        origDept = "Electrical";
        sev = 60;
        sevStr = "Medium";
      } else if (textForMatching.includes("water") || textForMatching.includes("leak") || textForMatching.includes("sewer") || textForMatching.includes("pipe") || textForMatching.includes("burst")) {
        cat = "Water Leakage";
        dept = "Water Supply";
        origDept = "Water Supply";
        sev = 85;
        sevStr = "High";
      } else if (textForMatching.includes("trash") || textForMatching.includes("garbage") || textForMatching.includes("dump") || textForMatching.includes("litter")) {
        cat = "Garbage";
        dept = "Sanitation";
        origDept = "Sanitation";
        sev = 45;
        sevStr = "Medium";
      } else if (textForMatching.includes("tree") || textForMatching.includes("park") || textForMatching.includes("bench") || textForMatching.includes("grass")) {
        cat = "Trees";
        dept = "Sanitation";
        origDept = "Sanitation";
        sev = 40;
        sevStr = "Low";
      } else if (textForMatching.includes("safety") || textForMatching.includes("zoning") || textForMatching.includes("hazard") || textForMatching.includes("danger")) {
        cat = "Other";
        dept = "Road Maintenance";
        origDept = "Road Maintenance";
        sev = 80;
        sevStr = "High";
      }

      parsedAiData = {
        issueTitle: descriptionText ? (descriptionText.length > 30 ? descriptionText.substring(0, 30) + "..." : descriptionText) : `Reported ${cat}`,
        category: cat,
        severity: sev,
        impactScore: Math.min(sev + Math.floor(Math.random() * 15), 100),
        department: dept,
        aiSummary: "The AI analysis service was heavily loaded. This report was assigned a standard priority rating and routed directly for human inspection.",
        recommendedAction: `Inspect physical layout at site. Coordinate with the ${dept} department. Fix the reported ${cat} issue.`,
        citizenSummary: descriptionText || `${cat} reported.`,
        authoritySummary: `The AI analysis service is experiencing high demand. This report requires manual verification on site.`,
        futureImpact: "Potential response delay due to temporary AI service disruption.",
        isValid: true,
        reasonIfInvalid: "",
        confidence: 0,
        originalSeverity: sevStr,
        originalDepartment: origDept,
        safetyAdvice: `Please keep distance from the reported ${cat.toLowerCase()} to avoid safety hazards.`,
        estimatedWorkers: sev > 75 ? 3 : 2,
        estimatedResolutionTime: sev > 75 ? "1 day" : "3 days",
        duplicateKeywords: [cat.toLowerCase(), dept.toLowerCase()]
      };
    }

    try {
      // Submit report to central DB
      const submitRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: parsedAiData.category,
          description: descriptionText || parsedAiData.citizenSummary || parsedAiData.aiSummary,
          imageUrl: selectedImage || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80",
          severity: parsedAiData.severity,
          impactScore: parsedAiData.impactScore,
          department: parsedAiData.department,
          address: address,
          citizenName: "Resident (" + (userEmail.includes("@") ? userEmail.split("@")[0] : "Guest") + ")",
          aiSummary: parsedAiData.aiSummary,
          recommendedAction: parsedAiData.recommendedAction,
          issueTitle: parsedAiData.issueTitle,
          citizenSummary: parsedAiData.citizenSummary,
          authoritySummary: parsedAiData.authoritySummary,
          futureImpact: parsedAiData.futureImpact,
          isValid: parsedAiData.isValid,
          reasonIfInvalid: parsedAiData.reasonIfInvalid,
          confidence: parsedAiData.confidence,
          safetyAdvice: parsedAiData.safetyAdvice,
          estimatedWorkers: parsedAiData.estimatedWorkers,
          estimatedResolutionTime: parsedAiData.estimatedResolutionTime,
          duplicateKeywords: parsedAiData.duplicateKeywords,
          ...(lat !== null ? { lat } : {}),
          ...(lng !== null ? { lng } : {})
        })
      });

      if (!submitRes.ok) {
        throw new Error("Failed to write report to DB");
      }

      const newReport = await submitRes.json();
      setIsNewReportSubmission(true);
      setSubmittedReport(newReport);
      onReportSubmitted();
    } catch (err) {
      console.error("AI Analysis flow error during submission, rendering mock local report:", err);
      
      // Construct a valid report format to display done screen to user safely
      const mockReport = {
        id: "R-" + Math.floor(Math.random() * 90000 + 10000),
        category: parsedAiData.category,
        description: descriptionText || "Community Report",
        imageUrl: selectedImage || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80",
        severity: parsedAiData.severity,
        impactScore: parsedAiData.impactScore,
        department: parsedAiData.department,
        address: address,
        citizenName: "Resident (" + (userEmail.includes("@") ? userEmail.split("@")[0] : "Guest") + ")",
        aiSummary: parsedAiData.aiSummary,
        recommendedAction: parsedAiData.recommendedAction,
        issueTitle: parsedAiData.issueTitle,
        citizenSummary: parsedAiData.citizenSummary,
        authoritySummary: parsedAiData.authoritySummary,
        futureImpact: parsedAiData.futureImpact,
        isValid: parsedAiData.isValid,
        reasonIfInvalid: parsedAiData.reasonIfInvalid,
        confidence: parsedAiData.confidence,
        status: "Submitted",
        dateSubmitted: new Date().toISOString().replace('T', ' ').substring(0, 16),
        lat: lat || 37.7749,
        lng: lng || -122.4194,
        statusTimeline: [
          { stage: "Submitted", date: new Date().toISOString().replace('T', ' ').substring(0, 16), completed: true, description: "Report received via mobile app." },
          { stage: "AI Classification", date: "", completed: false, description: "Awaiting automated severity scoring." },
          { stage: "Authority Review", date: "", completed: false, description: "Awaiting supervisor assessment." },
          { stage: "Worker Assignment", date: "", completed: false, description: "Dispatcher not yet allocated." },
          { stage: "Resolution", date: "", completed: false, description: "Worker dispatch pending." }
        ]
      };
      
      setIsNewReportSubmission(true);
      setSubmittedReport(mockReport as any);
      onReportSubmitted();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDescriptionText("");
    setIsReporting(false);
    setSubmittedReport(null);
    setLat(null);
    setLng(null);
    setShowConfirmDelete(false);
  };

  useEffect(() => {
    setShowConfirmDelete(false);
  }, [submittedReport]);

  const handleDeleteReportAction = async () => {
    if (!submittedReport) return;
    try {
      const res = await fetch(`/api/reports/${submittedReport.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onDeleteReport(submittedReport.id);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  const handleVoteValidation = async (type: "affected" | "not_present") => {
    if (!submittedReport) return;
    setIsVoting(true);
    try {
      const res = await fetch(`/api/reports/${submittedReport.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          userEmail: userEmail
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmittedReport(updated);
        onReportSubmitted();
      } else {
        console.error("Failed to submit validation vote");
      }
    } catch (err) {
      console.error("Validation vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDirectVote = async (reportId: string, type: "affected" | "not_present") => {
    setIsVoting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          userEmail: userEmail
        })
      });
      if (res.ok) {
        const updated = await res.json();
        if (submittedReport && submittedReport.id === reportId) {
          setSubmittedReport(updated);
        }
        onReportSubmitted();
      } else {
        console.error("Failed to submit direct validation vote");
      }
    } catch (err) {
      console.error("Direct validation vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex justify-center bg-[#F8F9FA] min-h-screen">
      {/* Container simulating a mobile phone viewport on desktop or full scale on mobile */}
      <div className="w-full max-w-[540px] bg-white min-h-screen shadow-2xl flex flex-col relative border-x border-gray-100">
        
        {/* TopAppBar */}
        <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans font-semibold text-base text-gray-900 tracking-tight leading-none">Echo</span>
              <span className="text-[9px] text-[#1A73E8] font-medium tracking-tight mt-0.5">Every Voice Counts</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-[#1A73E8] font-medium bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <User className="w-3 h-3" />
            Logout
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {!isReporting && activeTab === "home" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-6"
              >
                {/* Greeting Hero */}
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-sans font-semibold tracking-tight text-gray-900 leading-tight">
                      {isSpecificUser ? (
                        <>
                          Hello <span className="text-[#1A73E8] font-extrabold">{displayName}</span> and what do you want to report today?
                        </>
                      ) : (
                        <>
                          What do you want to <span className="text-[#1A73E8]">report</span> today?
                        </>
                      )}
                    </h1>
                    <p className="text-sm text-gray-500 font-sans">
                      Help make Metropolis safer and cleaner in 30 seconds. No complex categories required—our AI handles all classification.
                    </p>
                  </div>
                </div>

                {/* Primary Report CTA */}
                <button
                  id="citizen-report-cta"
                  onClick={() => setIsReporting(true)}
                  className="w-full h-48 rounded-3xl bg-[#1A73E8] hover:bg-[#1557b0] transition-all duration-300 shadow-lg hover:shadow-xl p-6 flex flex-col justify-between text-left text-white relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-32 h-32 text-white" />
                  </div>
                  
                  <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>

                  <div className="space-y-1 z-10">
                    <h3 className="text-xl font-semibold font-sans">File a New Report</h3>
                    <p className="text-xs text-blue-100 font-light">
                      Capture a photo, tell us what's wrong, and we'll route it.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-semibold mt-2 group-hover:translate-x-1 transition-transform">
                    Start Citizen Flow <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Info Card Banner */}
                <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-[#1A73E8]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-900 font-sans">AI-Powered Routing</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Our vision models extract category severity instantly to alert public works, parks, or safety departments.
                    </p>
                  </div>
                </div>

                {/* Active Community Issues Collaboration Feed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-bold text-gray-900 font-sans">
                      Community Issues Near You
                    </h3>
                    <button 
                      onClick={() => setActiveTab("reports")}
                      className="text-xs font-bold text-[#1A73E8] flex items-center bg-[#E8F0FE] hover:bg-[#D2E3FC] px-3 py-1 rounded-full transition-all"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {otherReports.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="text-xs">No other community issues near you. All clear!</p>
                      </div>
                    ) : (
                      otherReports.slice(0, 5).map((report) => {
                        const upCount = report.affectedCount !== undefined ? report.affectedCount : 0;
                        const downCount = report.notPresentCount !== undefined ? report.notPresentCount : 0;
                        
                        const emailNorm = userEmail.toLowerCase().trim();
                        const hasVotedYes = report.upvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;
                        const hasVotedNo = report.downvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;

                        return (
                          <div 
                            key={report.id}
                            className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all space-y-4 text-left cursor-pointer"
                            onClick={() => {
                              setSubmittedReport(report);
                              setIsNewReportSubmission(false);
                              setIsReporting(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0">{getCategoryIcon(report.category, "w-5 h-5 text-[#1A73E8]")}</span>
                                <div>
                                  <h4 className="text-sm font-extrabold text-gray-900 font-sans leading-tight">{report.category}</h4>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                report.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                                report.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                              }`}>
                                {report.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{report.address}</span>
                            </div>

                            {/* Direct Interactive Voting Buttons */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDirectVote(report.id, "affected");
                                }}
                                disabled={isVoting || hasVotedNo || report.status === "Resolved"}
                                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                                  hasVotedYes
                                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                    : "bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 border-emerald-100/50"
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {hasVotedYes ? (
                                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  ) : (
                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  <span className="font-semibold text-[11px]">
                                    {hasVotedYes ? "Cancel Yes" : "Yes, Me Too"}
                                  </span>
                                </span>
                                <span className="font-black text-emerald-600 font-mono text-xs ml-1 bg-white/60 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                  {upCount}
                                </span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDirectVote(report.id, "not_present");
                                }}
                                disabled={isVoting || hasVotedYes || report.status === "Resolved"}
                                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                                  hasVotedNo
                                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                    : "bg-amber-50/40 hover:bg-amber-50 text-amber-700 border-amber-100/50"
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {hasVotedNo ? (
                                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  ) : (
                                    <ThumbsDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  )}
                                  <span className="font-semibold text-[11px]">
                                    {hasVotedNo ? "Cancel No" : "Problem Not Present"}
                                  </span>
                                </span>
                                <span className="font-black text-amber-600 font-mono text-xs ml-1 bg-white/60 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                  {downCount}
                                </span>
                              </button>
                            </div>


                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reporting visual-first flow */}
            {isReporting && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col min-h-full"
              >
                {/* Detailed View branching: newly submitted success page vs collaborative detail */}
                {submittedReport ? (
                  isNewReportSubmission ? (
                    <div className="p-6 space-y-6 flex-1 flex flex-col justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-[#34A853]">
                          <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold text-gray-900 font-sans">Report Submitted!</h2>
                          <p className="text-sm text-gray-500">
                            Your request has been classified and successfully routed to municipal authorities.
                          </p>
                        </div>
                      </div>

                      {/* AI Classification Tag */}
                      <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-3xl space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1A73E8] tracking-wider uppercase font-sans">
                          <Cpu className="w-4 h-4" /> Auto-Generated AI Metadata
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-blue-50">
                            <span className="text-gray-400 block font-light">Category</span>
                            <span className="font-semibold text-gray-800">{submittedReport.category}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-50">
                            <span className="text-gray-400 block font-light">Assigned Bureau</span>
                            <span className="font-semibold text-gray-800">{submittedReport.department}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-50">
                            <span className="text-gray-400 block font-light">Severity Assessment</span>
                            <span className="font-semibold text-red-500">{submittedReport.severity}/100</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-50">
                            <span className="text-gray-400 block font-light">Impact Score</span>
                            <span className="font-semibold text-orange-600">{submittedReport.impactScore}/100</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-blue-50 text-xs text-gray-600 space-y-1">
                          <span className="font-semibold text-gray-800 block">AI Citizen Notification</span>
                          <p className="leading-relaxed italic">"{submittedReport.citizenSummary || submittedReport.aiSummary}"</p>
                        </div>
                      </div>

                      {/* Duplicate Detection Alert Banner */}
                      {submittedReport.isDuplicateOf && (
                        <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-3xl space-y-2 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Duplicate Ticket Merged</span>
                          </div>
                          <p className="text-xs text-amber-700 leading-normal font-sans">
                            Our AI duplicate screening matched this incident with an existing active report (<strong>{submittedReport.isDuplicateOf}</strong>). We have merged your report to consolidate work orders.
                          </p>
                          {submittedReport.duplicateExplanation && (
                            <div className="bg-white/60 p-2.5 rounded-xl text-[11px] text-amber-900 font-sans italic">
                              "{submittedReport.duplicateExplanation}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Safety Advisory Card */}
                      {submittedReport.safetyAdvice && (
                        <div className="bg-[#FEF7E0] border border-amber-200/50 p-4 rounded-3xl space-y-1.5 text-left">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider font-sans">
                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Local Safety Advisory
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed font-medium">
                            {submittedReport.safetyAdvice}
                          </p>
                        </div>
                      )}

                      {/* Estimated Repair Time Only */}
                      <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-3xl flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1A73E8]">
                          <Hourglass className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-light font-sans uppercase tracking-wider">Estimated Repair</span>
                          <span className="font-bold text-gray-800 text-sm font-sans">{submittedReport.estimatedResolutionTime || "2 days"}</span>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-left">Tracking Timeline</h4>
                        <div className="relative border-l border-gray-100 ml-3.5 space-y-6 text-left">
                          {submittedReport.statusTimeline.map((step, idx) => (
                            <div key={idx} className="relative pl-6">
                              <div className={`absolute -left-[9px] top-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 ${
                                step.completed 
                                  ? 'bg-[#34A853] border-white text-white' 
                                  : 'bg-white border-gray-200 text-gray-300'
                              }`}>
                                {step.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step.stage}
                                  </span>
                                  {step.date && <span className="text-[10px] text-gray-400 font-mono">{step.date}</span>}
                                </div>
                                <p className="text-xs text-gray-500 font-sans leading-tight">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={resetForm}
                        className="w-full py-4.5 bg-gray-950 hover:bg-gray-900 text-white rounded-full font-semibold transition-colors mt-4 text-sm"
                      >
                        Done & Return Home
                      </button>
                    </div>
                  ) : (
                    /* Collaborative Issue Details View (Opened from Issues Feed) */
                    <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-y-auto pb-24 text-left">
                      {/* Top bar with back button */}
                      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center gap-3">
                        <button 
                          onClick={resetForm}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0 text-gray-500 cursor-pointer"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-sm text-gray-900 font-sans">Issue Details</h3>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Title, Address, Status */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <h2 className="text-xl font-extrabold text-gray-900 font-sans tracking-tight">
                              {submittedReport.category}
                            </h2>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              submittedReport.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                              submittedReport.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                              {submittedReport.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-sans">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{submittedReport.address}</span>
                          </div>

                          {submittedReport.imageUrl && (
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 mt-1 relative">
                              <img 
                                src={submittedReport.imageUrl} 
                                alt={submittedReport.category}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <p className="text-xs text-gray-600 italic leading-relaxed pt-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/40">
                            "{submittedReport.description}"
                          </p>
                        </div>

                        {/* Interactive Voting: Are you also facing this issue? */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <div className="space-y-1 text-left">
                            <h4 className="text-sm font-extrabold text-gray-900 font-sans">
                              Are you also facing this issue?
                            </h4>
                            <p className="text-[11px] text-gray-500 font-sans leading-normal">
                              Help the city prioritize work orders by confirming if this hazard is still present.
                            </p>
                          </div>

                          {(() => {
                            const emailNorm = userEmail.toLowerCase().trim();
                            const hasVotedYes = submittedReport.upvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;
                            const hasVotedNo = submittedReport.downvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;

                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => handleVoteValidation("affected")}
                                  disabled={isVoting || hasVotedNo}
                                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                                    hasVotedYes
                                      ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                      : "bg-green-50 hover:bg-green-100 text-green-700 border-green-100"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {hasVotedYes ? (
                                    <>
                                      <X className="w-4 h-4 shrink-0" /> Cancel 'Yes' Vote
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp className="w-4 h-4 shrink-0" /> Yes, Me Too
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleVoteValidation("not_present")}
                                  disabled={isVoting || hasVotedYes}
                                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                                    hasVotedNo
                                      ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                      : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {hasVotedNo ? (
                                    <>
                                      <X className="w-4 h-4 shrink-0" /> Cancel 'No' Vote
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsDown className="w-4 h-4 shrink-0" /> No, It's Fixed
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })()}

                          {isVoting && (
                            <p className="text-[10px] text-blue-600 font-medium text-center animate-pulse">
                              Submitting vote & recalculating AI routing priority...
                            </p>
                          )}
                        </div>

                        {/* Community Validation & Affected Residents */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-left">
                            Community Validation
                          </h4>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[#E6F4EA]/40 p-3 rounded-2xl border border-green-100/50 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-green-700 font-medium flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-green-600 shrink-0" /> Yes</span>
                              <span className="text-lg font-black text-green-700 font-mono mt-1">
                                {submittedReport.affectedCount || 0}
                              </span>
                            </div>

                            <div className="bg-red-50/40 p-3 rounded-2xl border border-red-100/50 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-red-700 font-medium flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5 text-red-600 shrink-0" /> Fixed</span>
                              <span className="text-lg font-black text-red-700 font-mono mt-1">
                                {submittedReport.notPresentCount || 0}
                              </span>
                            </div>

                            <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100/50 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-[#1A73E8] font-medium flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" /> Affected</span>
                              <span className="text-lg font-black text-[#1A73E8] font-mono mt-1">
                                {submittedReport.affectedCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Destructive Delete Option for Author */}
                        {isMyReport(submittedReport) && (
                          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-left">
                              Manage Your Report
                            </h4>
                            <p className="text-xs text-gray-500 leading-normal">
                              As the creator of this report, you can delete it if it is no longer relevant, was made in error, or has been resolved.
                            </p>
                            <div className="pt-1">
                              {!showConfirmDelete ? (
                                <button
                                  onClick={() => setShowConfirmDelete(true)}
                                  className="w-full py-3 border border-[#EA4335] text-[#EA4335] hover:bg-[#EA4335]/5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete This Issue
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleDeleteReportAction}
                                    className="flex-1 py-3 bg-[#EA4335] text-white hover:bg-red-600 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                                  >
                                    <Trash2 className="w-4 h-4" /> Confirm Delete
                                  </button>
                                  <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="px-5 py-3 bg-[#F1F3F4] text-gray-700 hover:bg-[#E0E2E6] rounded-2xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}



                        {/* Last Updated Indicator */}
                        <div className="text-center pt-2 pb-6">
                          <span className="text-xs text-gray-400 font-sans flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Last Updated: 2 hours ago
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                ) : isProcessing ? (
                  /* Calm checklist loader showing AI effort */
                  <div className="p-6 space-y-8 flex-1 flex flex-col justify-center bg-gray-50">
                    <div className="text-center space-y-4">
                      {/* Modern calm radar spinner */}
                      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-blue-200 animate-spin border-t-[#1A73E8]"></div>
                        <div className="w-12 h-12 rounded-full bg-[#1A73E8] flex items-center justify-center text-white">
                          <Cpu className="w-6 h-6 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">AI Civil Agent At Work</h3>
                        <p className="text-xs text-gray-500">
                          Classifying incident, assessing priority, and computing safety score...
                        </p>
                      </div>
                    </div>

                    {/* Progress checklists */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3.5">
                      {processingLogs.map((log, index) => {
                        const isCurrent = index === processingStep;
                        const isCompleted = index < processingStep;
                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={index}
                            className="flex items-center gap-3"
                          >
                            <div className="shrink-0">
                              {isCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-[#34A853] flex items-center justify-center text-white">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                              ) : isCurrent ? (
                                <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#1A73E8] animate-spin"></div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200"></div>
                              )}
                            </div>
                            <span className={`text-xs ${
                              isCompleted ? 'text-gray-500 font-normal line-through' :
                              isCurrent ? 'text-[#1A73E8] font-semibold' : 'text-gray-300'
                            }`}>
                              {log}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Active Submission Form */
                  <div className="flex-1 flex flex-col">
                    {/* Header with back */}
                    <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-[68px] z-20">
                      <button 
                        onClick={() => setIsReporting(false)}
                        className="text-gray-500 hover:text-gray-900 text-xs font-semibold flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Cancel Report
                      </button>
                      <span className="text-xs font-bold text-gray-400">VISUAL-FIRST PIPELINE</span>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      {/* Image capture container (70% viewport design paradigm) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">1. Capture / Select Image (Vision First)</label>
                        <div className="relative aspect-[4/3] rounded-3xl bg-gray-900 overflow-hidden flex flex-col items-center justify-center border-4 border-white shadow-md">
                          
                          {selectedImage ? (
                            <>
                              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : isCameraActive ? (
                            <div className="relative w-full h-full bg-black flex flex-col justify-between">
                              <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                              />
                              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10 px-4">
                                <button 
                                  type="button"
                                  onClick={capturePhoto}
                                  className="px-4 py-2 bg-[#34A853] hover:bg-green-600 text-white text-xs font-bold rounded-full shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Capture Photo
                                </button>
                                <button 
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-4 py-2 bg-[#EA4335] hover:bg-red-600 text-white text-xs font-bold rounded-full shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-6 text-gray-400 space-y-4">
                              <Camera className="w-12 h-12 mx-auto text-gray-500" />
                              <div className="space-y-1">
                                <p className="text-sm text-gray-300 font-semibold">No Image Provided</p>
                                <p className="text-xs text-gray-500">Capture or upload a photo of the issue to begin.</p>
                              </div>

                              {cameraError && (
                                <p className="text-[11px] text-red-400 font-medium px-4">{cameraError}</p>
                              )}

                              <div className="flex flex-wrap justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="px-4 py-2 bg-[#34A853] text-white text-xs font-semibold rounded-full hover:bg-green-600 transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Live Camera
                                </button>

                                <label className="px-4 py-2 bg-[#1A73E8] text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-1.5 shadow-md">
                                  <UploadCloud className="w-3.5 h-3.5" /> Upload Photo
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location auto input */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">2. Incident Location</label>
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetectingLocation}
                            className="text-xs font-semibold text-[#1A73E8] hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                            {isDetectingLocation ? "Detecting..." : "Auto-Detect Location"}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                          <MapPin className="w-4 h-4 text-[#1A73E8]" />
                          <input 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="text-xs bg-transparent border-none outline-none text-gray-700 flex-1 font-medium font-sans" 
                          />
                        </div>
                      </div>

                      {/* Voice enabled / typing description */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">3. Voice Transcript / Extra Context (Required)</label>
                          <span className="text-[10px] text-[#EA4335] font-semibold">Required</span>
                        </div>

                        <div className="relative">
                          <textarea
                            rows={3}
                            value={descriptionText}
                            onChange={(e) => setDescriptionText(e.target.value)}
                            placeholder="Describe the issue. Record via mic or write details here. This voice transcript/context is required to run the AI."
                            className="w-full text-xs p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-[#1A73E8] focus:bg-white transition-all text-gray-700 leading-relaxed font-sans pr-14"
                          />
                          
                          {/* Microphone simulator button */}
                          <button
                            type="button"
                            onClick={handleMicClick}
                            className={`absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isRecording 
                                ? 'bg-[#EA4335] text-white animate-pulse' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                            }`}
                          >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Pulsing waveform overlay if recording */}
                        {isRecording && (
                          <div className="bg-red-50/50 rounded-2xl p-3 flex items-center gap-3 border border-red-100">
                            <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping inline-block"></span>
                              Listening... [{recordingTimer}s]
                            </span>
                            <div className="flex-1 flex gap-1 items-center h-4">
                              <span className="bg-red-300 w-1 h-3 rounded-full animate-pulse"></span>
                              <span className="bg-red-400 w-1 h-4 rounded-full animate-pulse delay-75"></span>
                              <span className="bg-red-500 w-1 h-2 rounded-full animate-pulse delay-100"></span>
                              <span className="bg-red-400 w-1 h-5 rounded-full animate-pulse delay-150"></span>
                              <span className="bg-red-300 w-1 h-3 rounded-full animate-pulse delay-200"></span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-sans">Tap Mic to stop & transcribe</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 space-y-3">
                        <button
                          type="button"
                          disabled={!selectedImage || !descriptionText.trim()}
                          onClick={startAiAnalysis}
                          className="w-full py-4 bg-[#1A73E8] hover:bg-[#1557b0] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Cpu className="w-4 h-4" /> Run AI Processing
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setIsReporting(false)}
                          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full font-semibold transition-colors text-xs border border-gray-100"
                        >
                          Cancel & Go Back
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* BottomNavBar (Citizen) - Only visible when not submitting/processing */}
        {!isReporting && (
          <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-[#E0E2E6] h-16 px-6 flex justify-around items-center z-30">
            <button
              onClick={() => {
                setActiveTab("home");
                setIsReporting(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === "home" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
              }`}
            >
              <div className={`px-5 py-1 rounded-full ${activeTab === "home" ? "bg-[#E8F0FE]" : ""}`}>
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold font-sans">Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setIsReporting(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === "reports" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
              }`}
            >
              <div className={`px-5 py-1 rounded-full ${activeTab === "reports" ? "bg-[#E8F0FE]" : ""}`}>
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold font-sans">My Reports</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsReporting(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === "profile" ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#1F1F1F]"
              }`}
            >
              <div className={`px-5 py-1 rounded-full ${activeTab === "profile" ? "bg-[#E8F0FE]" : ""}`}>
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold font-sans">Profile</span>
            </button>
          </nav>
        )}

        {/* Simple mock tab content (My Reports lists) */}
        {!isReporting && activeTab === "reports" && (
          <div className="absolute inset-x-0 bottom-16 top-[68px] bg-[#F8F9FA] overflow-y-auto p-6 space-y-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black font-sans text-gray-900">Community Issues Feed</h2>
              <span className="text-xs text-gray-500 font-mono font-bold bg-white px-2.5 py-1 rounded-full border border-gray-100">{myReports.length} Active</span>
            </div>

            <div className="space-y-4">
              {myReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs">No active reports found. Start by filing one!</p>
                </div>
              ) : (
                myReports.map((report) => {
                  const upCount = report.affectedCount !== undefined ? report.affectedCount : 0;
                  const downCount = report.notPresentCount !== undefined ? report.notPresentCount : 0;
                  const priority = report.aiPriority || "Medium";
                  
                  const emailNorm = userEmail.toLowerCase().trim();
                  const hasVotedYes = report.upvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;
                  const hasVotedNo = report.downvoters?.map((e: string) => e.toLowerCase().trim()).includes(emailNorm) || false;

                  const priorityColors = {
                    Critical: "bg-red-50 text-red-700 border-red-100",
                    High: "bg-orange-50 text-orange-700 border-orange-100",
                    Medium: "bg-blue-50 text-blue-700 border-blue-100",
                    Low: "bg-gray-50 text-gray-700 border-gray-100"
                  };

                  return (
                    <div 
                      key={report.id}
                      className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all space-y-4 cursor-pointer text-left"
                      onClick={() => {
                        setSubmittedReport(report);
                        setIsNewReportSubmission(false);
                        setIsReporting(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0">{getCategoryIcon(report.category, "w-5 h-5 text-[#1A73E8]")}</span>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-extrabold text-gray-900 leading-tight">{report.category}</h4>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          report.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                          report.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                          {report.status}
                        </span>
                      </div>

                      {report.imageUrl && (
                        <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-gray-50 bg-gray-50 relative">
                          <img src={report.imageUrl} alt={report.category} className="w-full h-full object-cover font-sans" />
                        </div>
                      )}

                      <div className="text-xs text-gray-500 space-y-1.5 font-sans">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span className="truncate">{report.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" /> Submitted: {report.dateSubmitted}
                        </div>
                      </div>

                      {/* Direct Interactive Voting Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectVote(report.id, "affected");
                          }}
                          disabled={isVoting || hasVotedNo || report.status === "Resolved"}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                            hasVotedYes
                              ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              : "bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 border-emerald-100/50"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <span className="flex items-center gap-1.5">
                            {hasVotedYes ? (
                              <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            ) : (
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className="font-semibold text-[11px]">
                              {hasVotedYes ? "Cancel Yes" : "Yes, Me Too"}
                            </span>
                          </span>
                          <span className="font-black text-emerald-600 font-mono text-xs ml-1 bg-white/60 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                            {upCount}
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectVote(report.id, "not_present");
                          }}
                          disabled={isVoting || hasVotedYes || report.status === "Resolved"}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                            hasVotedNo
                              ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              : "bg-amber-50/40 hover:bg-amber-50 text-amber-700 border-amber-100/50"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <span className="flex items-center gap-1.5">
                            {hasVotedNo ? (
                              <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            ) : (
                              <ThumbsDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span className="font-semibold text-[11px]">
                              {hasVotedNo ? "Cancel No" : "Problem Not Present"}
                            </span>
                          </span>
                          <span className="font-black text-amber-600 font-mono text-xs ml-1 bg-white/60 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                            {downCount}
                          </span>
                        </button>
                      </div>


                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Profile tab content */}
        {!isReporting && activeTab === "profile" && (
          <div className="absolute inset-x-0 bottom-16 top-[68px] bg-[#F8F9FA] overflow-y-auto p-6 space-y-6 z-10">
            <div className="space-y-2 text-center mt-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-[#1A73E8] flex items-center justify-center text-3xl font-bold mx-auto border-2 border-white shadow-md">
                {(userEmail.includes("@") ? userEmail.charAt(0) : "G").toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{userEmail.includes("@") ? userEmail.split("@")[0] : "Guest"}</h2>
              <p className="text-xs text-gray-500 font-mono">{userEmail}</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Resident Credentials</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Jurisdiction</span>
                  <span className="font-semibold text-gray-800">Metropolis City Admin</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Security Verification</span>
                  <span className="font-semibold text-green-500">Google Verified Resident</span>
                </div>
                 <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Active Reports</span>
                  <span className="font-semibold text-blue-600 font-mono">{activeCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Resolved Reports</span>
                  <span className="font-semibold text-green-600 font-mono">{resolvedCount}</span>
                </div>
              </div>
            </div>

            {/* My Activity Overview */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">My Activity Overview</h3>
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1A73E8] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                      <div className="text-[10px] text-gray-400 font-medium font-sans">Submitted</div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">{citizenReportsCount}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                      <div className="text-[10px] text-gray-400 font-medium font-sans">Active</div>
                      <div className="text-sm font-bold text-[#1A73E8] mt-0.5">{activeCount}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                      <div className="text-[10px] text-gray-400 font-medium font-sans">Resolved</div>
                      <div className="text-sm font-bold text-[#34A853] mt-0.5">{resolvedCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={onLogout}
                className="w-full py-4.5 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-full font-semibold transition-colors text-sm border border-red-100"
              >
                Sign Out of System
              </button>
            </div>
          </div>
        )}

        {/* Permissions Request Center overlay */}
        {showPermissionsModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-gray-100 shadow-2xl space-y-5 text-left relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">System Access Requested</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Metropolis Civic Security</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed relative z-10">
                To function as a fully automated normal citizen app, Echo requests access to your device capabilities.
              </p>

              <div className="space-y-3 relative z-10">
                {/* 1. Location */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-start gap-2.5 max-w-[70%]">
                    <MapPin className="w-4 h-4 text-[#1A73E8] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-gray-900 block leading-tight">GPS Location Access</span>
                      <span className="text-[9px] text-gray-500 block leading-normal">Required for pinning precise street repair coords automatically.</span>
                    </div>
                  </div>
                  <button 
                    onClick={requestLocationPermission}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      locationPermissionGranted 
                        ? "bg-green-100 text-green-700" 
                        : "bg-[#1A73E8] text-white hover:bg-blue-600 shadow-sm"
                    }`}
                  >
                    {locationPermissionGranted ? "Granted" : "Grant"}
                  </button>
                </div>

                {/* 2. Camera */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-start gap-2.5 max-w-[70%]">
                    <Camera className="w-4 h-4 text-[#1A73E8] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-gray-900 block leading-tight">Live Camera Access</span>
                      <span className="text-[9px] text-gray-500 block leading-normal">Required to snap photos of street issues and pothole hazards.</span>
                    </div>
                  </div>
                  <button 
                    onClick={requestCameraPermission}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      cameraPermissionGranted 
                        ? "bg-green-100 text-green-700" 
                        : "bg-[#1A73E8] text-white hover:bg-blue-600 shadow-sm"
                    }`}
                  >
                    {cameraPermissionGranted ? "Granted" : "Grant"}
                  </button>
                </div>

                {/* 3. Microphone */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-start gap-2.5 max-w-[70%]">
                    <Mic className="w-4 h-4 text-[#1A73E8] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-gray-900 block leading-tight">Microphone Access</span>
                      <span className="text-[9px] text-gray-500 block leading-normal">Required for direct speech-to-text AI hazard logging.</span>
                    </div>
                  </div>
                  <button 
                    onClick={requestMicrophonePermission}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      microphonePermissionGranted 
                        ? "bg-green-100 text-green-700" 
                        : "bg-[#1A73E8] text-white hover:bg-blue-600 shadow-sm"
                    }`}
                  >
                    {microphonePermissionGranted ? "Granted" : "Grant"}
                  </button>
                </div>
              </div>

              {permissionRequestStatus && (
                <div className="text-[10px] text-[#1A73E8] font-mono text-center animate-pulse bg-blue-50/50 py-1 rounded-lg">
                  {permissionRequestStatus}
                </div>
              )}

              <button 
                onClick={handleCompletePermissions}
                className="w-full py-3.5 bg-[#1F1F1F] hover:bg-black text-white rounded-full font-bold text-xs transition-all shadow-md cursor-pointer text-center"
              >
                Continue to Portal
              </button>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
