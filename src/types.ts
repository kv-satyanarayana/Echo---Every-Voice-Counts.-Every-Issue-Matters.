/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Worker {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  distance: string; // e.g. "0.8 miles away"
  availability: "Available" | "Busy" | "On Leave";
  workload: number; // active tasks count
}

export interface Report {
  id: string;
  category: string;
  description: string;
  voiceUrl?: string;
  imageUrl: string;
  severity: number; // 0-100
  impactScore: number; // calculated severity + population impact
  department: string;
  status: "Pending" | "Assigned" | "In Progress" | "Resolved";
  statusTimeline: {
    stage: string;
    date: string;
    completed: boolean;
    description: string;
  }[];
  address: string;
  lat: number;
  lng: number;
  dateSubmitted: string;
  citizenName: string;
  assignedWorker?: Worker;
  aiSummary?: string;
  recommendedAction?: string;
  issueTitle?: string;
  citizenSummary?: string;
  authoritySummary?: string;
  futureImpact?: string;
  isValid?: boolean;
  reasonIfInvalid?: string;
  confidence?: number;
  safetyAdvice?: string;
  estimatedWorkers?: number;
  estimatedResolutionTime?: string;
  duplicateKeywords?: string[];
  isDuplicateOf?: string;
  duplicateExplanation?: string;
  affectedCount?: number;
  notPresentCount?: number;
  upvoters?: string[];
  downvoters?: string[];
  aiPriority?: "Low" | "Medium" | "High" | "Critical";
  aiPriorityReason?: string;
}

export const DEPARTMENTS = [
  "Road Maintenance",
  "Water Supply",
  "Electrical",
  "Sanitation",
];

export const WORKERS: Worker[] = [
  {
    id: "w1",
    name: "Ramesh Kumar",
    role: "Senior Technician",
    department: "Road Maintenance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    distance: "0.4 mi away",
    availability: "Available",
    workload: 2,
  },
  {
    id: "w2",
    name: "Priya Sharma",
    role: "Lead Electrician",
    department: "Electrical",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    distance: "1.2 mi away",
    availability: "Busy",
    workload: 4,
  },
  {
    id: "w3",
    name: "Anil Patel",
    role: "Water Supply Engineer",
    department: "Water Supply",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    distance: "0.8 mi away",
    availability: "Available",
    workload: 0,
  },
  {
    id: "w4",
    name: "Elena Rostova",
    role: "Sanitation Supervisor",
    department: "Sanitation",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    distance: "1.5 mi away",
    availability: "Available",
    workload: 3,
  },
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: "REP-4821",
    category: "Pothole",
    description: "Deep, jagged pothole in the middle lane on Grand Avenue near Elm Street. It has sharp edges and is causing drivers to swerve dangerously into the oncoming lane. Several cars have already suffered tyre damage here.",
    imageUrl: "https://images.unsplash.com/photo-1621244249243-436b79b5eea8?w=600&auto=format&fit=crop&q=80",
    severity: 85,
    impactScore: 88,
    department: "Road Maintenance",
    status: "Pending",
    statusTimeline: [
      { stage: "Submitted", date: "2026-06-25 08:30", completed: true, description: "Report received via mobile app." },
      { stage: "AI Classification", date: "2026-06-25 08:31", completed: true, description: "Identified as highly severe Pothole; Road Maintenance department notified." },
      { stage: "Authority Review", date: "2026-06-25 09:15", completed: true, description: "Review pending. Priority set to High due to traffic safety hazard." },
      { stage: "Worker Assignment", date: "", completed: false, description: "Awaiting local crew assignment." },
      { stage: "Resolution", date: "", completed: false, description: "Awaiting repair verification." }
    ],
    address: "1420 Grand Avenue, Metropolis",
    lat: 37.7749,
    lng: -122.4194,
    dateSubmitted: "2026-06-25 08:30",
    citizenName: "Jane Doe",
    aiSummary: "Hazardous 10-inch deep pothole on high-traffic secondary arterial. High risk of vehicle damage and multi-vehicle collision due to rapid obstacle evasion maneuvers by local drivers.",
    recommendedAction: "Dispatch emergency asphalt patching crew to perform cold-mix temporary fill within 4 hours, followed by standard hot-mix permanent resurfacing during off-peak hours tomorrow.",
    affectedCount: 43,
    notPresentCount: 2,
    upvoters: [],
    downvoters: [],
    aiPriority: "Critical",
    aiPriorityReason: "High Severity. 43 residents confirmed. Continuous reports. Repair immediately."
  },
  {
    id: "REP-9043",
    category: "Graffiti",
    description: "Extensive spray-paint graffiti covering the historical information plaque at the park entrance. The text is completely unreadable and detracts from the park aesthetic.",
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
    severity: 40,
    impactScore: 45,
    department: "Sanitation",
    status: "Assigned",
    statusTimeline: [
      { stage: "Submitted", date: "2026-06-24 14:10", completed: true, description: "Report received via resident web portal." },
      { stage: "AI Classification", date: "2026-06-24 14:11", completed: true, description: "Identified as Graffiti; Sanitation department assigned." },
      { stage: "Authority Review", date: "2026-06-24 15:30", completed: true, description: "Aesthetic cleanup approved. Assigned standard priority." },
      { stage: "Worker Assignment", date: "2026-06-24 16:00", completed: true, description: "Assigned to Elena Rostova (Sanitation Supervisor)." },
      { stage: "Resolution", date: "", completed: false, description: "Awaiting paint removal & plaque restoration." }
    ],
    address: "Pioneer Park Entrance, Metropolis",
    lat: 37.7833,
    lng: -122.4167,
    dateSubmitted: "2026-06-24 14:10",
    citizenName: "Robert Miller",
    assignedWorker: WORKERS[3],
    aiSummary: "Vandalism on civic historical marker. Non-offensive paint, but high public visibility. Cleanup is recommended to prevent broken-windows effect in the neighborhood park.",
    recommendedAction: "Deploy pressure washing unit and specialized chemical solvent. Use caution to avoid damaging the historical bronze finish on the plaque.",
    affectedCount: 5,
    notPresentCount: 0,
    upvoters: [],
    downvoters: [],
    aiPriority: "Low",
    aiPriorityReason: "Aesthetic cleanup. Low impact with 5 resident validations."
  },
  {
    id: "REP-1102",
    category: "Streetlight",
    description: "Entire block streetlight fixture is completely dark and flickering on and off intermittently. The neighborhood feels unsafe to walk in at night, especially with the dark alleyways nearby.",
    imageUrl: "https://images.unsplash.com/photo-1542640244-7e672d6cef21?w=600&auto=format&fit=crop&q=80",
    severity: 70,
    impactScore: 78,
    department: "Electrical",
    status: "In Progress",
    statusTimeline: [
      { stage: "Submitted", date: "2026-06-23 21:05", completed: true, description: "Voice-to-text report submitted by resident." },
      { stage: "AI Classification", date: "2026-06-23 21:06", completed: true, description: "Identified as Streetlight Failure. Auto-allocated to Electrical." },
      { stage: "Authority Review", date: "2026-06-24 08:30", completed: true, description: "Approved. Set to high impact due to lighting/safety intersection." },
      { stage: "Worker Assignment", date: "2026-06-24 09:00", completed: true, description: "Assigned to Priya Sharma (Lead Electrician)." },
      { stage: "Resolution", date: "", completed: false, description: "Priya is currently replacing the faulty high-pressure sodium bulb and ballast with high-efficiency LED fixture." }
    ],
    address: "804 Oak Drive, Metropolis",
    lat: 37.7699,
    lng: -122.4468,
    dateSubmitted: "2026-06-23 21:05",
    citizenName: "Emily Watson",
    assignedWorker: WORKERS[1],
    aiSummary: "Inoperative street illumination along active residential corridor. High pedestrian risk, specifically adjacent to dark intersection. Auto-upgrade to Priority 2.",
    recommendedAction: "Dispatch electrical service vehicle. Replace current faulty bulb with municipal standard LED fixture to improve visibility and durability.",
    affectedCount: 18,
    notPresentCount: 1,
    upvoters: [],
    downvoters: [],
    aiPriority: "High",
    aiPriorityReason: "Safety/lighting hazard on active residential corridor. 18 community confirmations."
  },
  {
    id: "REP-3344",
    category: "Water Leak",
    description: "Water is bubbling up through the sidewalk cracks and pooling on the curb. It is wasting thousands of gallons and causing a slipping hazard for pedestrians.",
    imageUrl: "https://images.unsplash.com/photo-1548248823-7a7669151593?w=600&auto=format&fit=crop&q=80",
    severity: 90,
    impactScore: 92,
    department: "Water Supply",
    status: "Resolved",
    statusTimeline: [
      { stage: "Submitted", date: "2026-06-22 11:00", completed: true, description: "Citizen report submitted." },
      { stage: "AI Classification", date: "2026-06-22 11:02", completed: true, description: "Water Main break signature detected. Sent to Water Supply." },
      { stage: "Authority Review", date: "2026-06-22 11:15", completed: true, description: "Urgent status confirmed. Dispatched immediate crew." },
      { stage: "Worker Assignment", date: "2026-06-22 11:20", completed: true, description: "Assigned to Anil Patel." },
      { stage: "Resolution", date: "2026-06-22 15:45", completed: true, description: "Main valve shut down, broken joint pipe replaced, and asphalt resealed. Successfully completed." }
    ],
    address: "290 Pine Blvd, Metropolis",
    lat: 37.7892,
    lng: -122.4018,
    dateSubmitted: "2026-06-22 11:00",
    citizenName: "Michael Chang",
    assignedWorker: WORKERS[2],
    aiSummary: "Critical secondary water main rupture. Active soil erosion occurring. Direct risk of sidewalk collapse and local building basement flooding if not contained.",
    recommendedAction: "Shut off immediate local water valves. Coordinate excavation permit. Replace ruptured 4-inch cast iron pipe section with modern PVC equivalent.",
    affectedCount: 53,
    notPresentCount: 1,
    upvoters: [],
    downvoters: [],
    aiPriority: "Critical",
    aiPriorityReason: "Ruptured high-volume main line. 53 residents verified impact."
  }
];
