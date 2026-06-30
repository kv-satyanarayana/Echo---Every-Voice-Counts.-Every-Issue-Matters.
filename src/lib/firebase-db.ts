import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch, 
  query, 
  limit,
  deleteDoc,
  Firestore 
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { Report, INITIAL_REPORTS, Worker, WORKERS as INITIAL_WORKERS } from "../types";

let db: Firestore | null = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const app = initializeApp(config);
    if (config.firestoreDatabaseId) {
      db = getFirestore(app, config.firestoreDatabaseId);
      console.log("Using Firestore database ID:", config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
      console.log("Using default Firestore database.");
    }
  }
} catch (error) {
  console.error("Failed to initialize Firebase Client SDK, falling back to in-memory db:", error);
}

const COLLECTION_NAME = "reports";
const WORKERS_COLLECTION = "workers";
const AUTHORITIES_COLLECTION = "authorities";

// Robust local in-memory stores in case Firestore has permission errors
let localReports: Report[] = [...INITIAL_REPORTS];
let localWorkers: Worker[] = [...INITIAL_WORKERS];
let localAuthorities: string[] = ["authority@communityhero.com", "test.authority@gmail.com"];
let useFallbackMemory = true; // Default to true (safe local memory) during initial connection test

/**
 * Cleanly removes undefined properties from objects recursively.
 * Firestore client SDK fails if passed keys containing undefined.
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === "object" && (obj.constructor === Object || Object.getPrototypeOf(obj) === null)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeObject(val);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Ensures reports database is seeded if it is empty.
 */
async function ensureSeeded() {
  if (!db) return;
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Firestore reports collection is empty. Seeding database...");
      const batch = writeBatch(db);
      for (const report of INITIAL_REPORTS) {
        const docRef = doc(db, COLLECTION_NAME, report.id);
        batch.set(docRef, sanitizeObject(report));
      }
      await batch.commit();
      console.log(`Successfully seeded Firestore with ${INITIAL_REPORTS.length} reports.`);
    }
  } catch (error: any) {
    console.error("Error seeding Firestore database:", error?.message || error);
  }
}

/**
 * Ensures workers database is seeded.
 */
async function ensureWorkersSeeded() {
  if (!db) return;
  try {
    const colRef = collection(db, WORKERS_COLLECTION);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Firestore workers collection is empty. Seeding workers...");
      const batch = writeBatch(db);
      for (const worker of INITIAL_WORKERS) {
        const docRef = doc(db, WORKERS_COLLECTION, worker.id);
        batch.set(docRef, sanitizeObject(worker));
      }
      await batch.commit();
      console.log(`Successfully seeded ${INITIAL_WORKERS.length} workers.`);
    }
  } catch (error: any) {
    console.warn("Error seeding Firestore workers:", error?.message || error);
  }
}

/**
 * Ensures authorities database is seeded.
 */
async function ensureAuthoritiesSeeded() {
  if (!db) return;
  try {
    const colRef = collection(db, AUTHORITIES_COLLECTION);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Firestore authorities collection is empty. Seeding authorities...");
      const batch = writeBatch(db);
      for (const email of localAuthorities) {
        const docRef = doc(db, AUTHORITIES_COLLECTION, email);
        batch.set(docRef, sanitizeObject({ email, role: "authority" }));
      }
      await batch.commit();
      console.log("Successfully seeded default authorities.");
    }
  } catch (error: any) {
    console.warn("Error seeding Firestore authorities:", error?.message || error);
  }
}

/**
 * Validates Firestore connection with a strict 1.5-second timeout.
 * If verified successfully, switches useFallbackMemory to false and performs seeding.
 */
async function verifyConnectionAndSeed() {
  if (!db) {
    console.log("[Firebase-DB] No Firestore instance. Using robust local fallback database.");
    return;
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Firestore connection timed out")), 1500)
  );

  try {
    console.log("[Firebase-DB] Testing connection to Firestore database via client SDK...");
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, limit(1));
    
    // Attempt to read 1 doc from reports with a strict timeout
    await Promise.race([
      getDocs(q),
      timeoutPromise
    ]);
    
    console.log("[Firebase-DB] Firestore connection verified! Enabling persistent cloud storage.");
    // Enable persistent cloud storage
    useFallbackMemory = false;

    // Perform seeding since connection is verified
    await ensureSeeded();
    await ensureWorkersSeeded();
    await ensureAuthoritiesSeeded();
  } catch (error: any) {
    console.warn(
      "[Firebase-DB] Firestore is offline, inaccessible, or timed out. Gracefully falling back to robust local in-memory store. Error:",
      error?.message || error
    );
    useFallbackMemory = true;
  }
}

// Trigger connection verification & seeding
verifyConnectionAndSeed();

export async function getReports(): Promise<Report[]> {
  if (useFallbackMemory || !db) {
    return [...localReports].sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));
  }
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const reports: Report[] = [];
    snapshot.forEach((doc) => {
      reports.push(doc.data() as Report);
    });
    // Keep localReports in sync
    localReports = [...reports];
    return reports.sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));
  } catch (error: any) {
    console.warn("Firestore read failed, fallback to local in-memory storage:", error?.message || error);
    useFallbackMemory = true;
    return [...localReports].sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));
  }
}

export async function getReportById(id: string): Promise<Report | null> {
  if (useFallbackMemory || !db) {
    return localReports.find(r => r.id === id) || null;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Report;
      // Sync local memory
      const idx = localReports.findIndex(r => r.id === id);
      if (idx !== -1) {
        localReports[idx] = data;
      } else {
        localReports.push(data);
      }
      return data;
    }
    return localReports.find(r => r.id === id) || null;
  } catch (error: any) {
    console.warn(`Firestore getReportById ${id} failed, returning from local memory:`, error?.message || error);
    useFallbackMemory = true;
    return localReports.find(r => r.id === id) || null;
  }
}

export async function saveReport(report: Report): Promise<void> {
  // Always update local memory first
  const idx = localReports.findIndex(r => r.id === report.id);
  if (idx !== -1) {
    localReports[idx] = report;
  } else {
    localReports.push(report);
  }

  if (useFallbackMemory || !db) {
    console.log(`Saved report ${report.id} to robust local in-memory store.`);
    return;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, report.id);
    await setDoc(docRef, sanitizeObject(report));
    console.log(`Saved report ${report.id} to Firestore.`);
  } catch (error: any) {
    console.warn(`Firestore save failed, switching to local in-memory store for report ${report.id}:`, error?.message || error);
    useFallbackMemory = true;
  }
}

export async function updateReportInDb(id: string, updatedFields: Partial<Report>): Promise<Report | null> {
  // Always update local memory first
  const idx = localReports.findIndex(r => r.id === id);
  if (idx === -1) {
    return null;
  }
  
  const existingReport = localReports[idx];
  const mergedReport: Report = {
    ...existingReport,
    ...updatedFields,
    statusTimeline: updatedFields.statusTimeline || existingReport.statusTimeline,
    assignedWorker: updatedFields.assignedWorker !== undefined ? updatedFields.assignedWorker : existingReport.assignedWorker,
  };
  localReports[idx] = mergedReport;

  if (useFallbackMemory || !db) {
    console.log(`Updated report ${id} in robust local in-memory store.`);
    return mergedReport;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, sanitizeObject(mergedReport));
    console.log(`Updated report ${id} in Firestore.`);
    return mergedReport;
  } catch (error: any) {
    console.warn(`Firestore update failed, switching to local in-memory store for report ${id}:`, error?.message || error);
    useFallbackMemory = true;
    return mergedReport;
  }
}

export async function deleteReportInDb(id: string): Promise<boolean> {
  const idx = localReports.findIndex(r => r.id === id);
  if (idx !== -1) {
    localReports.splice(idx, 1);
  }
  if (useFallbackMemory || !db) {
    console.log(`Deleted report ${id} from local in-memory store.`);
    return true;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log(`Deleted report ${id} from Firestore.`);
    return true;
  } catch (error: any) {
    console.warn(`Firestore delete failed for report ${id}:`, error?.message || error);
    useFallbackMemory = true;
    return true;
  }
}

export async function resetReportsDb(): Promise<Report[]> {
  localReports = [...INITIAL_REPORTS];
  
  if (useFallbackMemory || !db) {
    console.log("Reset local reports database in memory.");
    return [...localReports];
  }
  try {
    console.log("Resetting Firestore database...");
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    
    // Seed with initial reports
    const seedBatch = writeBatch(db);
    for (const report of INITIAL_REPORTS) {
      const docRef = doc(db, COLLECTION_NAME, report.id);
      seedBatch.set(docRef, sanitizeObject(report));
    }
    await seedBatch.commit();
    console.log("Firestore database successfully reset & seeded.");
    return [...localReports];
  } catch (error: any) {
    console.warn("Firestore reset database failed, switching to local in-memory store:", error?.message || error);
    useFallbackMemory = true;
    return [...localReports];
  }
}

export async function getWorkers(): Promise<Worker[]> {
  if (useFallbackMemory || !db) {
    return [...localWorkers];
  }
  try {
    const colRef = collection(db, WORKERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const workers: Worker[] = [];
    snapshot.forEach((doc) => {
      workers.push(doc.data() as Worker);
    });
    localWorkers = [...workers];
    return workers;
  } catch (error: any) {
    console.warn("Firestore workers read failed, fallback to local in-memory storage:", error?.message || error);
    return [...localWorkers];
  }
}

export async function addWorkerInDb(worker: Worker): Promise<Worker> {
  const idx = localWorkers.findIndex(w => w.id === worker.id);
  if (idx !== -1) {
    localWorkers[idx] = worker;
  } else {
    localWorkers.push(worker);
  }

  if (useFallbackMemory || !db) {
    console.log(`Saved worker ${worker.name} to local memory.`);
    return worker;
  }
  try {
    const docRef = doc(db, WORKERS_COLLECTION, worker.id);
    await setDoc(docRef, sanitizeObject(worker));
    console.log(`Saved worker ${worker.name} to Firestore.`);
    return worker;
  } catch (error: any) {
    console.warn(`Firestore save worker failed, returning local copy:`, error?.message || error);
    return worker;
  }
}

export async function getAuthorities(): Promise<string[]> {
  if (useFallbackMemory || !db) {
    return [...localAuthorities];
  }
  try {
    const colRef = collection(db, AUTHORITIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const authorities: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.email) {
        authorities.push(data.email.toLowerCase());
      }
    });
    localAuthorities = Array.from(new Set([...localAuthorities, ...authorities]));
    return localAuthorities;
  } catch (error: any) {
    console.warn("Firestore authorities read failed, fallback to local memory:", error?.message || error);
    return [...localAuthorities];
  }
}

export async function addAuthorityInDb(email: string): Promise<void> {
  const normEmail = email.toLowerCase().trim();
  if (!localAuthorities.includes(normEmail)) {
    localAuthorities.push(normEmail);
  }

  if (useFallbackMemory || !db) {
    console.log(`Added authority email ${normEmail} to local memory.`);
    return;
  }
  try {
    const docRef = doc(db, AUTHORITIES_COLLECTION, normEmail);
    await setDoc(docRef, sanitizeObject({ email: normEmail, role: "authority" }));
    console.log(`Added authority email ${normEmail} to Firestore.`);
  } catch (error: any) {
    console.warn(`Firestore add authority failed:`, error?.message || error);
  }
}

export async function isAuthorityUser(email: string): Promise<boolean> {
  const list = await getAuthorities();
  return list.includes(email.toLowerCase().trim());
}
