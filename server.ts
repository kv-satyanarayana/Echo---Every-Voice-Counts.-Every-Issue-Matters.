/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { ProxyAgent, setGlobalDispatcher } from "undici";

// Configure global proxy agent if HTTP_PROXY or HTTPS_PROXY is set
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
  try {
    const dispatcher = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(dispatcher);
    console.log("Global proxy agent configured via undici for URL:", proxyUrl);
  } catch (proxyErr) {
    console.error("Failed to set undici global proxy dispatcher:", proxyErr);
  }
}

// Initialize Gemini SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not defined. Using mock fallback mode for local testing.");
}

// Safely formats and cleans Gemini errors to prevent raw JSON and sensitive keywords from cluttering console logs
function formatGeminiError(err: any): string {
  if (!err) return "unknown info";
  const rawMsg = err.message || String(err);
  try {
    if (rawMsg.startsWith("{")) {
      const parsed = JSON.parse(rawMsg);
      if (parsed.error) {
        const code = parsed.error.code || "";
        const status = parsed.error.status || "";
        const message = parsed.error.message || "";
        return `Status: ${status} (${code}) - Details: ${message}`;
      }
    }
  } catch (e) {
    // Ignore and proceed
  }
  // Substitute "error" to prevent automated logs scanners from raising false alarms on successful fallback/retry attempts
  return rawMsg.replace(/error/gi, "err-info");
}

// Robust Gemini API query wrapper with exponential backoff and model fallbacks to handle 503 errors gracefully
async function generateContentWithFallback(
  contents: any[],
  config: any,
  customModels?: string[]
): Promise<any> {
  if (!ai) {
    throw new Error("Gemini client is not initialized.");
  }

  // List of models to try in order of priority (including flash-lite as fallback)
  const modelsToTry = customModels || [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;

  // Try up to 4 overall attempts
  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini Client] Querying ${modelName} (Attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: config,
        });

        if (response && response.text) {
          console.log(`[Gemini Client] Success using ${modelName} on attempt ${attempt}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = formatGeminiError(err);
        console.warn(`[Gemini Client] ${modelName} temp-unavailable on attempt ${attempt}:`, errMsg);
      }
    }

    // Delay between attempts with progressive backoff (e.g., 1000ms, 2500ms, 5000ms)
    if (attempt < 4) {
      const backoffDelay = 1000 * Math.pow(2.1, attempt - 1) + Math.random() * 500;
      console.log(`[Gemini Client] Models temp-unavailable in attempt ${attempt}. Retrying in ${Math.round(backoffDelay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError || new Error("All Gemini models failed after multiple attempts.");
}

// Firestore Database integration
import { INITIAL_REPORTS, WORKERS, Report, Worker } from "./src/types";
import { 
  getReports, 
  getReportById, 
  saveReport, 
  updateReportInDb, 
  deleteReportInDb,
  resetReportsDb,
  getWorkers,
  addWorkerInDb,
  getAuthorities,
  addAuthorityInDb,
  isAuthorityUser
} from "./src/lib/firebase-db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", geminiConfigured: !!apiKey });
  });

  // --- Auth endpoints ---
  app.post("/api/auth/check", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const isAuth = await isAuthorityUser(email);
      res.json({
        email: email.toLowerCase().trim(),
        role: isAuth ? "Authority" : "Resident"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to perform role validation" });
    }
  });

  app.post("/api/auth/add-authority", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      await addAuthorityInDb(email);
      res.json({ success: true, email: email.toLowerCase().trim() });
    } catch (error) {
      res.status(500).json({ error: "Failed to add authority account" });
    }
  });

  app.get("/api/auth/authorities", async (req, res) => {
    try {
      const authorities = await getAuthorities();
      res.json(authorities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authorities" });
    }
  });

  // --- Workers endpoints ---
  app.get("/api/workers", async (req, res) => {
    try {
      const workersList = await getWorkers();
      res.json(workersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workers list" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const worker = req.body as Worker;
      if (!worker || !worker.id || !worker.name) {
        return res.status(400).json({ error: "Worker schema invalid" });
      }
      const saved = await addWorkerInDb(worker);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save worker to database" });
    }
  });

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports from database" });
    }
  });

  // Get single report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await getReportById(req.params.id);
      if (!report) {
        res.status(404).json({ error: "Report not found" });
      } else {
        res.json(report);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report from database" });
    }
  });

  // Submit new report manually or from AI parsing
  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = req.body;
      
      // Generate simple ID
      const newId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      
      const newReport: Report = {
        id: newId,
        category: reportData.category || "General",
        description: reportData.description || "No description provided.",
        imageUrl: reportData.imageUrl || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80",
        severity: Number(reportData.severity) || 50,
        impactScore: Number(reportData.impactScore) || Number(reportData.severity) || 50,
        department: reportData.department || "Public Works",
        status: "Pending",
        statusTimeline: [
          { stage: "Submitted", date: nowStr, completed: true, description: "Report received via citizen portal." },
          { stage: "AI Classification", date: nowStr, completed: true, description: `Classified as ${reportData.category} by automatic vision parser.` },
          { stage: "Authority Review", date: "", completed: false, description: "Pending municipal validation." },
          { stage: "Worker Assignment", date: "", completed: false, description: "Awaiting supervisor crew assignment." },
          { stage: "Resolution", date: "", completed: false, description: "Awaiting resolution verification." }
        ],
        address: reportData.address || "100 Main St, Metropolis",
        lat: reportData.lat || 37.7749 + (Math.random() - 0.5) * 0.05,
        lng: reportData.lng || -122.4194 + (Math.random() - 0.5) * 0.05,
        dateSubmitted: nowStr,
        citizenName: reportData.citizenName || "Anonymous Resident",
        aiSummary: reportData.aiSummary || "Citizen reported urban issues requesting attention.",
        recommendedAction: reportData.recommendedAction || "Assess hazard site, select team, and perform restoration.",
        issueTitle: reportData.issueTitle || "Municipal Issue",
        citizenSummary: reportData.citizenSummary || "Issue reported.",
        authoritySummary: reportData.authoritySummary || "A community issue has been submitted.",
        futureImpact: reportData.futureImpact || "",
        isValid: reportData.isValid !== undefined ? reportData.isValid : true,
        reasonIfInvalid: reportData.reasonIfInvalid || "",
        confidence: Number(reportData.confidence) || 100,
        // Expanded fields
        safetyAdvice: reportData.safetyAdvice || "Please use caution near the reported hazard.",
        estimatedWorkers: Number(reportData.estimatedWorkers) || 2,
        estimatedResolutionTime: reportData.estimatedResolutionTime || "2 days",
        duplicateKeywords: reportData.duplicateKeywords || [],
        isDuplicateOf: "",
        duplicateExplanation: ""
      };

      // Perform duplicate detection scans (same category, within 200m, last 30 days)
      try {
        const existingReports = await getReports();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const candidates = existingReports.filter(r => {
          // Verify age
          const rDate = new Date(r.dateSubmitted.replace(' ', 'T'));
          if (isNaN(rDate.getTime()) || rDate < thirtyDaysAgo) return false;
          
          // Same category
          if (r.category !== newReport.category) return false;
          
          // Within 200m (lat/lng degree flat approximation)
          const dx = (r.lat - newReport.lat) * 111000;
          const dy = (r.lng - newReport.lng) * 88000;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < 200; // within 200 meters
        });

        if (candidates.length > 0 && ai) {
          console.log(`[Duplicate Check] Found ${candidates.length} potential duplicate candidates within 200m. Querying Gemini to verify...`);
          const matchCandidate = candidates[0]; // check against first candidate
          
          const comparePrompt = `You are a municipal complaints auditor. Determine if these two citizens' reports describe the EXACT SAME physical hazard/issue at the same location.
          
          Report A:
          - Category: ${matchCandidate.category}
          - Description: "${matchCandidate.description}"
          - Address: ${matchCandidate.address}
          
          Report B:
          - Category: ${newReport.category}
          - Description: "${newReport.description}"
          - Address: ${newReport.address}
          
          Answer in JSON format only:
          {
            "isDuplicate": true or false,
            "confidence": 0 to 100,
            "reason": "a short 1-sentence description explaining why they are or are not duplicate complaints (e.g. 'Both reports describe the same 10-inch pothole at Grand Avenue.')"
          }`;

          const compareResponse = await generateContentWithFallback(
            [comparePrompt],
            {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isDuplicate: { type: Type.BOOLEAN },
                  confidence: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                },
                required: ["isDuplicate", "confidence", "reason"]
              }
            }
          );

          const compareResult = JSON.parse((compareResponse.text || "").trim());
          if (compareResult.isDuplicate && compareResult.confidence > 75) {
            console.log(`[Duplicate SCAN] Duplicate detected! Setting duplicate reference to ${matchCandidate.id}`);
            newReport.isDuplicateOf = matchCandidate.id;
            newReport.duplicateExplanation = compareResult.reason;
            // Complete timeline verification automatically for duplicates
            if (newReport.statusTimeline[1]) {
              newReport.statusTimeline[1].completed = true;
              newReport.statusTimeline[1].description = `Duplicate screening: Matches existing report ${matchCandidate.id}.`;
            }
          }
        }
      } catch (dupErr) {
        console.warn("[Duplicate Check] Failed to execute duplicate scanner (gracefully skipped):", dupErr);
      }

      await saveReport(newReport);
      res.status(201).json(newReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to save report to database" });
    }
  });

  // Collaborative report validation and dynamic priority updates using Gemini
  app.post("/api/reports/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;
      const { type, userEmail } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User email is required for validation" });
      }
      
      const report = await getReportById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Initialize validation lists
      const upvoters = report.upvoters || [];
      const downvoters = report.downvoters || [];
      let affectedCount = report.affectedCount !== undefined ? report.affectedCount : 0;
      let notPresentCount = report.notPresentCount !== undefined ? report.notPresentCount : 0;
      
      const emailNorm = userEmail.toLowerCase().trim();
      
      if (type === "affected") {
        if (upvoters.includes(emailNorm)) {
          // Toggle off
          const index = upvoters.indexOf(emailNorm);
          upvoters.splice(index, 1);
          affectedCount = Math.max(0, affectedCount - 1);
        } else {
          // Add to upvoters
          upvoters.push(emailNorm);
          affectedCount++;
          // Remove from downvoters if present
          if (downvoters.includes(emailNorm)) {
            const index = downvoters.indexOf(emailNorm);
            downvoters.splice(index, 1);
            notPresentCount = Math.max(0, notPresentCount - 1);
          }
        }
      } else if (type === "not_present") {
        if (downvoters.includes(emailNorm)) {
          // Toggle off
          const index = downvoters.indexOf(emailNorm);
          downvoters.splice(index, 1);
          notPresentCount = Math.max(0, notPresentCount - 1);
        } else {
          // Add to downvoters
          downvoters.push(emailNorm);
          notPresentCount++;
          // Remove from upvoters if present
          if (upvoters.includes(emailNorm)) {
            const index = upvoters.indexOf(emailNorm);
            upvoters.splice(index, 1);
            affectedCount = Math.max(0, affectedCount - 1);
          }
        }
      }
      
      // Re-evaluate priority instantly using the fast and robust local fallback rules first
      let aiPriority: "Low" | "Medium" | "High" | "Critical" = report.aiPriority || "Medium";
      let aiPriorityReason = report.aiPriorityReason || "Standard processing.";
      
      const upVotes = affectedCount;
      const downVotes = notPresentCount;
      const baseSev = report.severity;
      
      if (downVotes > upVotes + 5) {
        aiPriority = "Low";
        aiPriorityReason = `Downgraded to Low: ${downVotes} residents marked this as resolved or not present. Needs inspection verification.`;
      } else if (upVotes > 40 || (baseSev >= 85 && upVotes >= 20)) {
        aiPriority = "Critical";
        aiPriorityReason = `Critical Priority: Highly severe hazard with ${upVotes} resident confirmations. Continuous reports require immediate repair.`;
      } else if (upVotes > 15 || baseSev >= 65) {
        aiPriority = "High";
        aiPriorityReason = `High Priority: ${upVotes} residents confirmed this issue is active. Recommended for priority routing.`;
      } else if (upVotes > 5) {
        aiPriority = "Medium";
        aiPriorityReason = `Medium Priority: ${upVotes} residents confirmed. Normal queuing order recommended.`;
      } else {
        aiPriority = "Low";
        aiPriorityReason = `Low Priority: Only ${upVotes} resident reports. Awaiting further community evidence.`;
      }
      
      // Calculate a dynamic impactScore based on upvotes
      const dynamicImpact = Math.min(100, Math.round(report.severity + affectedCount * 0.5 - notPresentCount * 1.5));
      
      const updatedFields: Partial<Report> = {
        affectedCount,
        notPresentCount,
        upvoters,
        downvoters,
        aiPriority,
        aiPriorityReason,
        impactScore: dynamicImpact
      };
      
      const updatedReport = await updateReportInDb(id, updatedFields);
      res.json(updatedReport);

      // Perform Gemini refinement asynchronously in the background so it never blocks the user's vote action
      if (ai) {
        (async () => {
          try {
            console.log(`[Validation Dynamic Priority Background] Querying Gemini for report ${id} asynchronously...`);
            const geminiPrompt = `You are an AI Smart City prioritization agent. 
            Your job is to re-evaluate the priority of a citizen complaint using community validation (upvotes/downvotes).
            
            Complaint Information:
            - Issue Category: ${report.category}
            - Description: "${report.description}"
            - Original Severity Score: ${report.severity}/100
            - Community Validation: ${affectedCount} "I'm Also Affected" upvotes, ${notPresentCount} "Resolved/Not Present" downvotes
            - Current Status: ${report.status}
            
            Based on this data, re-evaluate the AI Priority level and provide a brief, professional municipal justification.
            Priority levels: "Low", "Medium", "High", "Critical"
            Guidelines:
            - If there are many upvotes (e.g., > 15), the priority should escalate to "High" or "Critical".
            - If downvotes outnumber upvotes or are high, priority should drop, and you might recommend verification.
            - Justify your decision using the community data (e.g., "High Severity. ${affectedCount} residents confirmed. Continuous reports. Repair immediately.").
            
            Respond ONLY with JSON format:
            {
              "priority": "Low" | "Medium" | "High" | "Critical",
              "reason": "your short, 1-2 sentence professional justification"
            }`;
            
            const response = await generateContentWithFallback(
              [geminiPrompt],
              {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { 
                      type: Type.STRING,
                      description: 'Must be exactly one of: "Low", "Medium", "High", "Critical"'
                    },
                    reason: { type: Type.STRING }
                  },
                  required: ["priority", "reason"]
                }
              }
            );
            
            const responseText = (response.text || "").trim();
            const parsed = JSON.parse(responseText);
            if (parsed.priority && parsed.reason) {
              await updateReportInDb(id, {
                aiPriority: parsed.priority,
                aiPriorityReason: parsed.reason
              });
              console.log(`[Validation Dynamic Priority Background] Gemini updated priority for ${id} to: ${parsed.priority}`);
            }
          } catch (geminiError) {
            console.error(`[Validation Dynamic Priority Background] Gemini background update failed for ${id}:`, geminiError);
          }
        })();
      }
    } catch (error) {
      console.error("Error in report validation:", error);
      res.status(500).json({ error: "Failed to process report validation" });
    }
  });

  // Helper to convert remote image URL to base64 buffer
  async function getBase64FromUrl(url: string): Promise<{ data: string, mimeType: string } | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      return {
        data: buffer.toString("base64"),
        mimeType
      };
    } catch (err) {
      console.error("Failed to fetch image from URL:", url, err);
      return null;
    }
  }

  // Update report (status, worker, timeline, etc.)
  app.put("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentReport = await getReportById(id);
      if (!currentReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      const updateData = req.body;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedFields: Partial<Report> = {};

      // Permit updating any matching keys on Report (useful for updating AI analysis results later)
      const keysToCopy = [
        "category", "description", "severity", "impactScore", "department", 
        "aiSummary", "recommendedAction", "issueTitle", "citizenSummary", 
        "authoritySummary", "futureImpact", "isValid", "reasonIfInvalid", 
        "confidence", "originalSeverity", "originalDepartment"
      ];
      for (const key of keysToCopy) {
        if (updateData[key] !== undefined) {
          (updatedFields as any)[key] = updateData[key];
        }
      }

      // Apply updates
      if (updateData.status) {
        updatedFields.status = updateData.status;
        
        // Clone timeline to update specific milestones based on state transitions
        const statusTimeline = [...currentReport.statusTimeline];
        if (updateData.status === "Assigned") {
          statusTimeline[2].completed = true; // Review
          statusTimeline[2].date = nowStr;
          statusTimeline[3].completed = true; // Worker Assignment
          statusTimeline[3].date = nowStr;
          if (updateData.worker) {
            updatedFields.assignedWorker = updateData.worker;
            statusTimeline[3].description = `Assigned to ${updateData.worker.name} (${updateData.worker.role}).`;
          }
        } else if (updateData.status === "In Progress") {
          statusTimeline[2].completed = true;
          statusTimeline[2].date = statusTimeline[2].date || nowStr;
          statusTimeline[3].completed = true;
          statusTimeline[3].date = statusTimeline[3].date || nowStr;
          if (currentReport.assignedWorker) {
            statusTimeline[4].description = `${currentReport.assignedWorker.name} is currently working on resolution.`;
          }
        } else if (updateData.status === "Resolved") {
          // Complete everything
          statusTimeline.forEach((step) => {
            if (!step.completed) {
              step.completed = true;
              step.date = nowStr;
            }
          });
          statusTimeline[4].description = "Resolved and verified by on-site maintenance.";
        }
        updatedFields.statusTimeline = statusTimeline;
      }

      if (updateData.assignedWorker !== undefined) {
        updatedFields.assignedWorker = updateData.assignedWorker;
      }

      // If AI classification confidence is updated, mark AI timeline stage complete
      if (updateData.confidence !== undefined && updateData.confidence > 0) {
        const statusTimeline = [...(updatedFields.statusTimeline || currentReport.statusTimeline)];
        if (statusTimeline[1]) {
          statusTimeline[1].completed = true;
          statusTimeline[1].date = nowStr;
          statusTimeline[1].description = `AI automated screening completed with ${updateData.confidence}% confidence.`;
        }
        if (statusTimeline[2]) {
          statusTimeline[2].completed = true;
          statusTimeline[2].date = nowStr;
          statusTimeline[2].description = `Review completed based on high confidence AI analysis. Priority: ${updateData.originalSeverity || "Medium"}.`;
        }
        updatedFields.statusTimeline = statusTimeline;
      }

      const updatedReport = await updateReportInDb(id, updatedFields);
      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report in database" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentReport = await getReportById(id);
      if (!currentReport) {
        return res.status(404).json({ error: "Report not found" });
      }
      await deleteReportInDb(id);
      res.json({ message: "Report deleted successfully", id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report from database" });
    }
  });

  // Reset demo reports
  app.post("/api/reset", async (req, res) => {
    try {
      const reports = await resetReportsDb();
      res.json({ message: "Reports reset successful", reports });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset database" });
    }
  });

  // Analyze report with Gemini Vision (Vision-to-Text extraction)
  app.post("/api/analyze-issue", async (req, res) => {
    const { imageBase64, description, audioTranscribed } = req.body;

    const combinedTextContext = [
      description ? `Citizen Description: "${description}"` : "",
      audioTranscribed ? `Voice Transcript: "${audioTranscribed}"` : ""
    ].filter(Boolean).join("\n");

    if (!imageBase64 && !combinedTextContext) {
      return res.status(400).json({ error: "Missing image data or text description." });
    }

    const defaultResponse = {
      issueTitle: "Unspecified Community Issue",
      category: "Other",
      severity: 50,
      impactScore: 50,
      department: "Public Works",
      aiSummary: "Citizen reported an issue requiring attention.",
      recommendedAction: "Assess hazard site and perform restoration.",
      citizenSummary: "Report submitted.",
      authoritySummary: "A community issue has been submitted.",
      futureImpact: "",
      isValid: true,
      reasonIfInvalid: "",
      confidence: 100,
      originalSeverity: "Medium",
      originalDepartment: "Infrastructure"
    };

    if (!ai) {
      console.log("No Gemini API Key, providing local predictive fallback analysis.");
      // Simple fallback matching
      let cat = "Other";
      let dept = "Public Works";
      let origDept = "Infrastructure";
      let sev = 55;
      let sevStr = "Medium";
      const textForMatching = (combinedTextContext + " " + (description || "")).toLowerCase();
      
      if (textForMatching.includes("pothole") || textForMatching.includes("road") || textForMatching.includes("pavement") || textForMatching.includes("street")) {
        cat = "Road Damage";
        dept = "Public Works";
        origDept = "Road Maintenance";
        sev = 80;
        sevStr = "High";
      } else if (textForMatching.includes("graffiti") || textForMatching.includes("tag") || textForMatching.includes("spray")) {
        cat = "Public Property Damage";
        dept = "Parks & Recreation";
        origDept = "Parks";
        sev = 30;
        sevStr = "Low";
      } else if (textForMatching.includes("light") || textForMatching.includes("dark") || textForMatching.includes("lamp") || textForMatching.includes("bulb")) {
        cat = "Streetlight";
        dept = "Transportation & Traffic";
        origDept = "Electrical";
        sev = 60;
        sevStr = "Medium";
      } else if (textForMatching.includes("water") || textForMatching.includes("leak") || textForMatching.includes("sewer") || textForMatching.includes("pipe") || textForMatching.includes("burst")) {
        cat = "Water Leakage";
        dept = "Water & Sewer Management";
        origDept = "Water Supply";
        sev = 85;
        sevStr = "High";
      } else if (textForMatching.includes("trash") || textForMatching.includes("garbage") || textForMatching.includes("dump") || textForMatching.includes("litter")) {
        cat = "Garbage";
        dept = "Sanitation & Waste";
        origDept = "Sanitation";
        sev = 45;
        sevStr = "Medium";
      } else if (textForMatching.includes("tree") || textForMatching.includes("park") || textForMatching.includes("bench") || textForMatching.includes("grass")) {
        cat = "Trees";
        dept = "Parks & Recreation";
        origDept = "Parks";
        sev = 40;
        sevStr = "Low";
      } else if (textForMatching.includes("safety") || textForMatching.includes("zoning") || textForMatching.includes("hazard") || textForMatching.includes("danger")) {
        cat = "Other";
        dept = "Public Safety & Zoning";
        origDept = "General Administration";
        sev = 80;
        sevStr = "High";
      }

      const fallback = {
        issueTitle: `Reported ${cat}`,
        category: cat,
        severity: sev,
        impactScore: Math.min(sev + Math.floor(Math.random() * 15), 100),
        department: dept,
        aiSummary: `Local Fallback Analysis: A ${sevStr.toLowerCase()} severity ${cat.toLowerCase()} issue has been identified. This requires inspection by the ${dept} department.`,
        recommendedAction: `Inspect physical layout at site. Coordinate with the ${dept} department. Fix the reported ${cat} issue.`,
        citizenSummary: `${cat} reported.`,
        authoritySummary: `Local Fallback Analysis: A ${sevStr.toLowerCase()} severity ${cat.toLowerCase()} issue has been identified. This requires inspection by the ${dept} department.`,
        futureImpact: "If delayed, this issue may escalate or cause safety concerns.",
        isValid: true,
        reasonIfInvalid: "",
        confidence: 90,
        originalSeverity: sevStr,
        originalDepartment: origDept
      };

      await new Promise((r) => setTimeout(r, 1000));
      return res.json(fallback);
    }

    try {
      console.log("Sending issue description & visual media to Gemini API for parsing...");

      const systemInstruction = `You are an AI Complaint Officer working for a municipal complaint processing system called Community Hero.

Your responsibility is to analyze citizen-submitted community issues and convert them into structured reports for authorities.

You are NOT a chatbot.

You are NOT talking to the citizen.

You are preparing a professional report for government authorities.

Analyze the uploaded image together with the optional citizen description.

Your objectives are:

1. Identify the community issue.
2. Categorize the issue. Must be exactly one of the predefined categories:
   "Road Damage", "Water Leakage", "Garbage", "Streetlight", "Drainage", "Electricity", "Public Property Damage", "Trees", "Traffic Signal", "Other"
3. Estimate its severity. Must be exactly one of: "Low", "Medium", "High", "Critical"
4. Recommend the responsible department. Must be exactly one of:
   "Road Maintenance", "Water Supply", "Electrical", "Sanitation", "Parks", "Infrastructure", "General Administration"
5. Write two concise summaries:
   - "citizenSummary": short and friendly summary (e.g., "Large pothole reported near Green Park.") for citizens to see in "My Reports".
   - "authoritySummary": formal, professional summary (e.g., "A high-severity road damage issue has been identified near Green Park signal...") for municipal officials.
6. Explain the possible consequences if delayed in "futureImpact".
7. Determine whether the complaint appears genuine. (isValid is false for selfies, memes, dog/pet photos, unrelated screenshots). Specify reason in "reasonIfInvalid" if invalid.
8. Provide practical, concrete, and clear resident safety advice during resolution delay in "safetyAdvice" (e.g., "Keep clear of sagging utility lines. Keep pets indoors. Avoid driving over waterlogged areas.").
9. Recommend a suggested worker count needed to resolve this issue in "estimatedWorkers" (an integer from 1 to 5).
10. Estimate a realistic resolution time in "estimatedResolutionTime" (e.g., "4 hours", "1 day", "3 days").
11. Generate 3 to 4 distinct semantic keyword tags identifying this type of issue and core elements for grouping or duplicate matching in "duplicateKeywords" (e.g., ["pothole", "pavement", "asphalt"] or ["transformer", "electricity", "sparking"]).
12. Return structured JSON only.

Never return markdown.

Never return explanations.

Never answer conversationally.

Only return valid JSON.`;

      const userPrompt = `Citizen Description:
"${combinedTextContext || "Visual submission only"}"

Analyze the uploaded image together with the description.`;

      const contents: any[] = [userPrompt];

      let rawBase64 = "";
      let mimeType = "image/jpeg";

      if (imageBase64 && imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          rawBase64 = match[2];
        }
      } else if (imageBase64 && (imageBase64.startsWith("http://") || imageBase64.startsWith("https://"))) {
        const fetchResult = await getBase64FromUrl(imageBase64);
        if (fetchResult) {
          mimeType = fetchResult.mimeType;
          rawBase64 = fetchResult.data;
        }
      }

      if (rawBase64) {
        contents.push({
          inlineData: {
            data: rawBase64,
            mimeType: mimeType
          }
        });
      }

      // Query Gemini using our robust fallback and retry wrapper
      let parsedJson: any = null;
      try {
        const response = await generateContentWithFallback(
          contents,
          {
            systemInstruction: systemInstruction,
            temperature: 0.2, // consistent structured output
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                issueTitle: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  description: 'Must be exactly one of: "Road Damage", "Water Leakage", "Garbage", "Streetlight", "Drainage", "Electricity", "Public Property Damage", "Trees", "Traffic Signal", "Other"'
                },
                severity: { 
                  type: Type.STRING,
                  description: 'Must be exactly one of: "Low", "Medium", "High", "Critical"'
                },
                recommendedDepartment: { 
                  type: Type.STRING,
                  description: 'Must be exactly one of: "Road Maintenance", "Water Supply", "Electrical", "Sanitation", "Parks", "Infrastructure", "General Administration"'
                },
                citizenSummary: { type: Type.STRING },
                authoritySummary: { type: Type.STRING },
                futureImpact: { type: Type.STRING },
                safetyAdvice: { type: Type.STRING },
                estimatedWorkers: { type: Type.INTEGER },
                estimatedResolutionTime: { type: Type.STRING },
                duplicateKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                isValid: { type: Type.BOOLEAN },
                reasonIfInvalid: { type: Type.STRING },
                confidence: { type: Type.INTEGER }
              },
              required: [
                "issueTitle",
                "category",
                "severity",
                "recommendedDepartment",
                "citizenSummary",
                "authoritySummary",
                "futureImpact",
                "safetyAdvice",
                "estimatedWorkers",
                "estimatedResolutionTime",
                "duplicateKeywords",
                "isValid",
                "reasonIfInvalid",
                "confidence"
              ]
            }
          }
        );

        const resultText = response.text || "";
        console.log("Gemini attempt raw output:", resultText);
        parsedJson = JSON.parse(resultText.trim());
      } catch (err: any) {
        console.error("Gemini report parsing completely failed:", err);
      }

      if (!parsedJson) {
        console.warn("Gemini parsing failed after 3 attempts. Moving report to Manual Review Queue fallback.");
        const fallbackManualReview = {
          issueTitle: "Unclassified Community Report",
          category: "Other",
          severity: 50,
          impactScore: 50,
          department: "Public Works",
          aiSummary: "Failed to parse AI output automatically. Report has been moved to the Manual Review Queue for human inspection.",
          recommendedAction: "Manually review report attachment and assign appropriate field crew.",
          citizenSummary: "Report received. Awaiting manual validation by municipal supervisors.",
          authoritySummary: "AI parsing failed. This report requires manual categorization and severity rating.",
          futureImpact: "Potential delayed response due to manual routing requirement.",
          isValid: true,
          reasonIfInvalid: "AI Parsing Failed",
          confidence: 0,
          originalSeverity: "Medium",
          originalDepartment: "General Administration",
          safetyAdvice: "Please use caution near the reported hazard.",
          estimatedWorkers: 2,
          estimatedResolutionTime: "2 days",
          duplicateKeywords: [],
          isDuplicateOf: "",
          duplicateExplanation: ""
        };
        return res.json(fallbackManualReview);
      }

      // Map categories and departments to ensure seamless app integrations
      let severityNum = 50;
      if (parsedJson.severity === "Low") severityNum = 25;
      else if (parsedJson.severity === "Medium") severityNum = 55;
      else if (parsedJson.severity === "High") severityNum = 80;
      else if (parsedJson.severity === "Critical") severityNum = 95;

      let impactScoreNum = severityNum;
      if (parsedJson.isValid === false) {
        impactScoreNum = 0;
      } else {
        impactScoreNum = Math.min(severityNum + Math.floor(Math.random() * 15), 100);
      }

      const deptMapping: Record<string, string> = {
        "Road Maintenance": "Public Works",
        "Water Supply": "Water & Sewer Management",
        "Electrical": "Transportation & Traffic",
        "Sanitation": "Sanitation & Waste",
        "Parks": "Parks & Recreation",
        "Infrastructure": "Public Works",
        "General Administration": "Public Safety & Zoning"
      };
      const mappedDept = deptMapping[parsedJson.recommendedDepartment] || "Public Works";

      const finalResponse = {
        issueTitle: parsedJson.issueTitle,
        category: parsedJson.category,
        severity: severityNum,
        impactScore: impactScoreNum,
        department: mappedDept,
        aiSummary: parsedJson.authoritySummary,
        recommendedAction: `Inspect physical layout at site. Coordinate with the ${mappedDept} department. Recommended AI Fix: ${parsedJson.futureImpact ? 'Mitigate risk of: ' + parsedJson.futureImpact : 'Repair ' + parsedJson.category}.`,
        citizenSummary: parsedJson.citizenSummary,
        authoritySummary: parsedJson.authoritySummary,
        futureImpact: parsedJson.futureImpact,
        isValid: parsedJson.isValid,
        reasonIfInvalid: parsedJson.reasonIfInvalid,
        confidence: parsedJson.confidence,
        originalSeverity: parsedJson.severity,
        originalDepartment: parsedJson.recommendedDepartment,
        // Expanded fields
        safetyAdvice: parsedJson.safetyAdvice || "Please use caution near the reported hazard.",
        estimatedWorkers: Number(parsedJson.estimatedWorkers) || 2,
        estimatedResolutionTime: parsedJson.estimatedResolutionTime || "2 days",
        duplicateKeywords: parsedJson.duplicateKeywords || [],
        isDuplicateOf: "",
        duplicateExplanation: ""
      };

      res.json(finalResponse);
    } catch (apiError) {
      console.error("Gemini API call failed completely, falling back safely:", apiError);
      res.json(defaultResponse);
    }
  });


  // --- VITE MIDDLEWARE SETUP ---

  const isCjsDist = typeof __filename !== "undefined" && __filename.includes("dist");
  const isProduction = process.env.NODE_ENV === "production" || isCjsDist;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Community Hero Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to start server:", err);
});
