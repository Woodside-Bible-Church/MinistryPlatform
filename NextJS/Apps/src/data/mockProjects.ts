// Mock data for Project Budgets app with Series support
// Demonstrates year-over-year recurring projects

export interface ProjectSeries {
  id: string;
  name: string;
  description?: string;
  defaultCoordinatorId?: number;
  isActive: boolean;
  createdDate: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "pending" | "approved" | "in-progress" | "completed" | "closed";
  budgetStatus: "under" | "on-track" | "over";
  coordinator: {
    userId: number;
    contactId: number;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  totalEstimated: number;
  totalActual: number;
  categories: BudgetCategory[];
  // Series fields
  seriesId?: string;
  year?: number;
  isTemplate?: boolean;
  copiedFromProjectId?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  type: "expense" | "revenue";
  estimated: number;
  actual: number;
  lineItems: LineItem[];
}

export interface LineItem {
  id: string;
  name: string;
  description?: string;
  estimated: number;
  actual: number;
  quantity?: number;
  unitPrice?: number;
  vendor?: string;
  status: "pending" | "ordered" | "received" | "paid" | "cancelled";
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  date: string;
  type: "expense" | "income" | "refund" | "adjustment";
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  payee: string;
  description: string;
  receiptUrl?: string;
  approvedBy?: string;
  approvedDate?: string;
}

// Mock Project Series
export const mockProjectSeries: ProjectSeries[] = [
  {
    id: "series-1",
    name: "Winter Retreat",
    description: "Annual youth winter retreat featuring worship, teaching sessions, and team-building activities",
    defaultCoordinatorId: 228155,
    isActive: true,
    createdDate: "2023-01-15",
  },
  {
    id: "series-2",
    name: "Summer Camp",
    description: "Week-long summer camp program with outdoor activities, spiritual growth, and fellowship",
    defaultCoordinatorId: 228156,
    isActive: true,
    createdDate: "2023-02-20",
  },
  {
    id: "series-3",
    name: "Christmas Outreach",
    description: "Community outreach event serving families during the Christmas season",
    defaultCoordinatorId: 228157,
    isActive: true,
    createdDate: "2023-03-10",
  },
  {
    id: "series-4",
    name: "Easter Service",
    description: "Special Easter weekend services and community celebrations",
    defaultCoordinatorId: 228155,
    isActive: true,
    createdDate: "2023-04-01",
  },
];

// Mock Projects with Series data
export const mockProjects: Project[] = [
  // Winter Retreat Series - 2024 (Completed)
  {
    id: "1",
    title: "Winter Retreat 2024",
    description: "Annual youth winter retreat featuring worship, teaching sessions, and team-building activities",
    status: "completed",
    budgetStatus: "under",
    seriesId: "series-1",
    year: 2024,
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2024-02-15",
    endDate: "2024-02-20",
    totalEstimated: 245000.0,
    totalActual: 238500.0,
    categories: [
      {
        id: "cat-1-2024",
        name: "Operational Costs",
        type: "expense",
        estimated: 185000.0,
        actual: 180200.0,
        lineItems: [
          {
            id: "line-1-2024",
            name: "Timberwolf",
            description: "Venue rental for main sessions",
            estimated: 110000.0,
            actual: 115000.0,
            status: "paid",
            vendor: "Timberwolf Lodge",
            transactions: [
              {
                id: "txn-1-2024",
                date: "2024-01-15",
                type: "expense",
                amount: 115000.0,
                paymentMethod: "Check",
                referenceNumber: "7891",
                payee: "Timberwolf Lodge",
                description: "Venue rental - full payment",
                approvedBy: "Sarah Johnson",
                approvedDate: "2024-01-14",
              },
            ],
          },
          {
            id: "line-2-2024",
            name: "Transportation",
            estimated: 55000.0,
            actual: 52200.0,
            status: "paid",
            vendor: "ABC Charter",
            transactions: [
              {
                id: "txn-2-2024",
                date: "2024-02-10",
                type: "expense",
                amount: 52200.0,
                paymentMethod: "Credit Card",
                payee: "ABC Charter",
                description: "Bus transportation",
              },
            ],
          },
          {
            id: "line-3-2024",
            name: "Medical Care",
            estimated: 2000.0,
            actual: 1500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-3-2024",
                date: "2024-02-17",
                type: "expense",
                amount: 1500.0,
                paymentMethod: "Cash",
                payee: "Urgent Care Clinic",
                description: "Medical supplies",
              },
            ],
          },
        ],
      },
      {
        id: "cat-2-2024",
        name: "Admissions",
        type: "revenue",
        estimated: 215000.0,
        actual: 218500.0,
        lineItems: [
          {
            id: "line-4-2024",
            name: "Student Registrations",
            quantity: 950,
            unitPrice: 225.0,
            estimated: 213750.0,
            actual: 218500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-4-2024",
                date: "2024-02-01",
                type: "income",
                amount: 218500.0,
                paymentMethod: "Credit Card",
                payee: "Various Students",
                description: "Student registration payments",
              },
            ],
          },
        ],
      },
    ],
  },

  // Winter Retreat Series - 2025 (In Progress)
  {
    id: "2",
    title: "Winter Retreat 2025",
    description: "Annual youth winter retreat featuring worship, teaching sessions, and team-building activities",
    status: "in-progress",
    budgetStatus: "on-track",
    seriesId: "series-1",
    year: 2025,
    copiedFromProjectId: "1",
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2025-02-12",
    endDate: "2025-02-17",
    totalEstimated: 255000.0,
    totalActual: 195000.0,
    categories: [
      {
        id: "cat-1-2025",
        name: "Operational Costs",
        type: "expense",
        estimated: 195000.0,
        actual: 185000.0,
        lineItems: [
          {
            id: "line-1-2025",
            name: "Timberwolf",
            description: "Venue rental for main sessions",
            estimated: 118000.0,
            actual: 118000.0,
            status: "paid",
            vendor: "Timberwolf Lodge",
            transactions: [
              {
                id: "txn-1-2025",
                date: "2025-01-10",
                type: "expense",
                amount: 118000.0,
                paymentMethod: "Check",
                referenceNumber: "8234",
                payee: "Timberwolf Lodge",
                description: "Venue rental - full payment",
              },
            ],
          },
          {
            id: "line-2-2025",
            name: "Transportation",
            estimated: 57000.0,
            actual: 57000.0,
            status: "paid",
            vendor: "ABC Charter",
            transactions: [
              {
                id: "txn-2-2025",
                date: "2025-02-01",
                type: "expense",
                amount: 57000.0,
                paymentMethod: "Credit Card",
                payee: "ABC Charter",
                description: "Bus transportation",
              },
            ],
          },
          {
            id: "line-3-2025",
            name: "Medical Care",
            estimated: 2100.0,
            actual: 1800.0,
            status: "paid",
            transactions: [
              {
                id: "txn-3-2025",
                date: "2025-02-14",
                type: "expense",
                amount: 1800.0,
                paymentMethod: "Cash",
                payee: "Urgent Care Clinic",
                description: "Medical supplies",
              },
            ],
          },
        ],
      },
      {
        id: "cat-2-2025",
        name: "Admissions",
        type: "revenue",
        estimated: 225000.0,
        actual: 228000.0,
        lineItems: [
          {
            id: "line-4-2025",
            name: "Student Registrations",
            quantity: 1000,
            unitPrice: 225.0,
            estimated: 225000.0,
            actual: 228000.0,
            status: "paid",
            transactions: [
              {
                id: "txn-4-2025",
                date: "2025-01-25",
                type: "income",
                amount: 228000.0,
                paymentMethod: "Credit Card",
                payee: "Various Students",
                description: "Student registration payments",
              },
            ],
          },
        ],
      },
    ],
  },

  // Winter Retreat Series - 2026 (In Progress - the main detailed one)
  {
    id: "3",
    title: "Winter Retreat 2026",
    description: "Annual youth winter retreat featuring worship, teaching sessions, and team-building activities",
    status: "in-progress",
    budgetStatus: "under",
    seriesId: "series-1",
    year: 2026,
    copiedFromProjectId: "2",
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2026-02-18",
    endDate: "2026-02-23",
    totalEstimated: 315650.0,
    totalActual: 249782.0,
    categories: [
      {
        id: "cat-1",
        name: "Venue & Lodging",
        type: "expense",
        estimated: 125000.0,
        actual: 120889.0,
        lineItems: [
          {
            id: "line-1",
            name: "Timberwolf Lodge",
            description: "Main venue rental for sessions and lodging",
            estimated: 120000.0,
            actual: 120889.0,
            status: "paid",
            vendor: "Timberwolf Lodge",
            transactions: [
              {
                id: "txn-1",
                date: "2026-01-15",
                type: "expense",
                amount: 120889.0,
                paymentMethod: "Check",
                referenceNumber: "8472",
                payee: "Timberwolf Lodge",
                description: "Venue rental - full payment",
                approvedBy: "Sarah Johnson",
                approvedDate: "2026-01-14",
              },
            ],
          },
          {
            id: "line-1b",
            name: "Emergency Housing",
            description: "Backup hotel rooms for overflow",
            estimated: 5000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-2",
        name: "Transportation",
        type: "expense",
        estimated: 62000.0,
        actual: 60647.0,
        lineItems: [
          {
            id: "line-2",
            name: "Charter Buses",
            estimated: 55000.0,
            actual: 59547.0,
            status: "paid",
            vendor: "ABC Charter",
            transactions: [
              {
                id: "txn-2",
                date: "2026-01-20",
                type: "expense",
                amount: 30000.0,
                paymentMethod: "Credit Card",
                referenceNumber: "CC-2891",
                payee: "ABC Charter",
                description: "Bus transportation - 50% deposit",
              },
              {
                id: "txn-3",
                date: "2026-02-15",
                type: "expense",
                amount: 29547.0,
                paymentMethod: "Credit Card",
                referenceNumber: "CC-3012",
                payee: "ABC Charter",
                description: "Bus transportation - final payment",
              },
            ],
          },
          {
            id: "line-2b",
            name: "Van Rentals",
            estimated: 4500.0,
            actual: 100.0,
            status: "ordered",
            vendor: "Enterprise",
            transactions: [
              {
                id: "txn-3b",
                date: "2026-02-10",
                type: "expense",
                amount: 100.0,
                paymentMethod: "Credit Card",
                payee: "Enterprise Rental",
                description: "Van rental deposit",
              },
            ],
          },
          {
            id: "line-2c",
            name: "Fuel",
            estimated: 2500.0,
            actual: 1000.0,
            status: "paid",
            transactions: [
              {
                id: "txn-3c",
                date: "2026-02-19",
                type: "expense",
                amount: 1000.0,
                paymentMethod: "Credit Card",
                payee: "Shell Station",
                description: "Van and bus fuel",
              },
            ],
          },
        ],
      },
      {
        id: "cat-3",
        name: "Food & Catering",
        type: "expense",
        estimated: 45000.0,
        actual: 28500.0,
        lineItems: [
          {
            id: "line-3a",
            name: "Meals - Main Kitchen",
            description: "All meals provided by venue",
            estimated: 38000.0,
            actual: 26000.0,
            status: "paid",
            vendor: "Timberwolf Lodge",
            transactions: [
              {
                id: "txn-4a",
                date: "2026-02-18",
                type: "expense",
                amount: 26000.0,
                paymentMethod: "Check",
                payee: "Timberwolf Lodge",
                description: "Meal package for 1020 students",
              },
            ],
          },
          {
            id: "line-3b",
            name: "Snacks & Beverages",
            estimated: 5000.0,
            actual: 2500.0,
            status: "paid",
            vendor: "Costco",
            transactions: [
              {
                id: "txn-4b",
                date: "2026-02-15",
                type: "expense",
                amount: 2500.0,
                paymentMethod: "Credit Card",
                payee: "Costco Wholesale",
                description: "Snacks and drinks",
              },
            ],
          },
          {
            id: "line-3c",
            name: "Special Dietary Accommodations",
            estimated: 2000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-4",
        name: "Programming & Activities",
        type: "expense",
        estimated: 32000.0,
        actual: 22150.0,
        lineItems: [
          {
            id: "line-4a",
            name: "Worship Band",
            description: "Live worship team for all sessions",
            estimated: 8850.0,
            actual: 8850.0,
            status: "paid",
            vendor: "WorshipWorks Collective",
            transactions: [
              {
                id: "txn-5a",
                date: "2026-02-20",
                type: "expense",
                amount: 8850.0,
                paymentMethod: "Check",
                payee: "WorshipWorks Collective",
                description: "Worship band services",
              },
            ],
          },
          {
            id: "line-4b",
            name: "Guest Speaker",
            estimated: 5000.0,
            actual: 5000.0,
            status: "paid",
            vendor: "Mark Davis Ministries",
            transactions: [
              {
                id: "txn-5b",
                date: "2026-02-10",
                type: "expense",
                amount: 5000.0,
                paymentMethod: "Check",
                payee: "Mark Davis",
                description: "Speaker honorarium",
              },
            ],
          },
          {
            id: "line-4c",
            name: "Outdoor Activities",
            description: "Skiing, tubing, and adventure activities",
            estimated: 12000.0,
            actual: 8300.0,
            status: "paid",
            vendor: "Mountain Adventures",
            transactions: [
              {
                id: "txn-5c",
                date: "2026-02-19",
                type: "expense",
                amount: 8300.0,
                paymentMethod: "Credit Card",
                payee: "Mountain Adventures",
                description: "Activity package",
              },
            ],
          },
          {
            id: "line-4d",
            name: "Team Building Supplies",
            estimated: 3500.0,
            actual: 0,
            status: "ordered",
            transactions: [],
          },
          {
            id: "line-4e",
            name: "Ice Breaker Materials",
            estimated: 2650.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-5",
        name: "Audio/Visual & Tech",
        type: "expense",
        estimated: 18500.0,
        actual: 12450.0,
        lineItems: [
          {
            id: "line-5a",
            name: "Sound System Rental",
            estimated: 8500.0,
            actual: 8500.0,
            status: "paid",
            vendor: "Pro Audio Rentals",
            transactions: [
              {
                id: "txn-6a",
                date: "2026-02-15",
                type: "expense",
                amount: 8500.0,
                paymentMethod: "Credit Card",
                payee: "Pro Audio Rentals",
                description: "PA system and mics",
              },
            ],
          },
          {
            id: "line-5b",
            name: "Lighting Package",
            estimated: 6500.0,
            actual: 3950.0,
            status: "paid",
            vendor: "Stage Lights Inc",
            transactions: [
              {
                id: "txn-6b",
                date: "2026-02-15",
                type: "expense",
                amount: 3950.0,
                paymentMethod: "Credit Card",
                payee: "Stage Lights Inc",
                description: "Stage lighting rental",
              },
            ],
          },
          {
            id: "line-5c",
            name: "Video Screens & Projectors",
            estimated: 3500.0,
            actual: 0,
            status: "ordered",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-6",
        name: "Merchandise & Materials",
        type: "expense",
        estimated: 15500.0,
        actual: 2846.0,
        lineItems: [
          {
            id: "line-6a",
            name: "Retreat T-Shirts",
            description: "1020 custom retreat t-shirts",
            estimated: 12000.0,
            actual: 0,
            quantity: 1020,
            unitPrice: 11.76,
            status: "ordered",
            vendor: "CustomInk",
            transactions: [],
          },
          {
            id: "line-6b",
            name: "Workbooks & Journals",
            estimated: 2500.0,
            actual: 2386.0,
            status: "paid",
            vendor: "Christian Book Distributors",
            transactions: [
              {
                id: "txn-7b",
                date: "2026-02-10",
                type: "expense",
                amount: 2386.0,
                paymentMethod: "Credit Card",
                payee: "Christian Book Distributors",
                description: "Student journals",
              },
            ],
          },
          {
            id: "line-6c",
            name: "Signage & Banners",
            estimated: 1000.0,
            actual: 460.0,
            status: "paid",
            vendor: "PrintShop Pro",
            transactions: [
              {
                id: "txn-7c",
                date: "2026-02-08",
                type: "expense",
                amount: 460.0,
                paymentMethod: "Credit Card",
                payee: "PrintShop Pro",
                description: "Retreat signage",
              },
            ],
          },
        ],
      },
      {
        id: "cat-7",
        name: "Staffing & Leadership",
        type: "expense",
        estimated: 8650.0,
        actual: 1800.0,
        lineItems: [
          {
            id: "line-7a",
            name: "Staff Stipends",
            description: "Volunteer leader stipends",
            estimated: 6000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-7b",
            name: "Medical Staff",
            estimated: 1850.0,
            actual: 1800.0,
            status: "paid",
            vendor: "RN Medical Services",
            transactions: [
              {
                id: "txn-8b",
                date: "2026-02-18",
                type: "expense",
                amount: 1800.0,
                paymentMethod: "Check",
                payee: "RN Medical Services",
                description: "On-site medical coverage",
              },
            ],
          },
          {
            id: "line-7c",
            name: "Security Personnel",
            estimated: 800.0,
            actual: 0,
            status: "ordered",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-8",
        name: "Insurance & Permits",
        type: "expense",
        estimated: 4500.0,
        actual: 500.0,
        lineItems: [
          {
            id: "line-8a",
            name: "Event Insurance",
            estimated: 3500.0,
            actual: 0,
            status: "pending",
            vendor: "Church Mutual Insurance",
            transactions: [],
          },
          {
            id: "line-8b",
            name: "Activity Waivers Processing",
            estimated: 500.0,
            actual: 500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-9b",
                date: "2026-02-01",
                type: "expense",
                amount: 500.0,
                paymentMethod: "Credit Card",
                payee: "WaiverSign",
                description: "Digital waiver platform",
              },
            ],
          },
          {
            id: "line-8c",
            name: "Permits & Licenses",
            estimated: 500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-9",
        name: "Miscellaneous",
        type: "expense",
        estimated: 4500.0,
        actual: 0,
        lineItems: [
          {
            id: "line-9a",
            name: "Emergency Fund",
            description: "Contingency for unexpected expenses",
            estimated: 3000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-9b",
            name: "Office Supplies",
            estimated: 800.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-9c",
            name: "Communication & Wifi",
            estimated: 700.0,
            actual: 0,
            status: "ordered",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-10",
        name: "Student Registrations",
        type: "revenue",
        estimated: 239700.0,
        actual: 0,
        lineItems: [
          {
            id: "line-10a",
            name: "Early Bird Registrations",
            description: "Registrations before Dec 15",
            quantity: 520,
            unitPrice: 225.0,
            estimated: 117000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-10b",
            name: "Standard Registrations",
            quantity: 450,
            unitPrice: 235.0,
            estimated: 105750.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-10c",
            name: "Late Registrations",
            description: "After Jan 31",
            quantity: 50,
            unitPrice: 250.0,
            estimated: 12500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-10d",
            name: "Scholarships (Revenue Offset)",
            description: "Sponsored student registrations",
            estimated: 4450.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-11",
        name: "Fundraising & Donations",
        type: "revenue",
        estimated: 15000.0,
        actual: 0,
        lineItems: [
          {
            id: "line-11a",
            name: "Parent Donations",
            estimated: 8000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-11b",
            name: "Church Subsidy",
            estimated: 5000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-11c",
            name: "Corporate Sponsorships",
            estimated: 2000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
    ],
  },

  // Summer Camp Series - 2024 (Completed)
  {
    id: "4",
    title: "Summer Camp 2024",
    description: "Week-long summer camp program with outdoor activities, spiritual growth, and fellowship",
    status: "completed",
    budgetStatus: "under",
    seriesId: "series-2",
    year: 2024,
    coordinator: {
      userId: 202,
      contactId: 228156,
      firstName: "Sarah",
      lastName: "Johnson",
      displayName: "Sarah Johnson",
      email: "sarah@woodsidebible.org",
    },
    startDate: "2024-07-08",
    endDate: "2024-07-15",
    totalEstimated: 78000.0,
    totalActual: 76200.0,
    categories: [
      {
        id: "cat-11-2024",
        name: "Venue & Lodging",
        type: "expense",
        estimated: 40000.0,
        actual: 39500.0,
        lineItems: [
          {
            id: "line-50-2024",
            name: "Camp Rental",
            estimated: 40000.0,
            actual: 39500.0,
            status: "paid",
            vendor: "Pine Lake Camp",
            transactions: [
              {
                id: "txn-23-2024",
                date: "2024-04-15",
                type: "expense",
                amount: 39500.0,
                paymentMethod: "Check",
                referenceNumber: "6891",
                payee: "Pine Lake Camp",
                description: "Full camp rental payment",
              },
            ],
          },
        ],
      },
      {
        id: "cat-13-2024",
        name: "Registrations",
        type: "revenue",
        estimated: 82000.0,
        actual: 85200.0,
        lineItems: [
          {
            id: "line-54-2024",
            name: "Student Registrations",
            quantity: 140,
            unitPrice: 550.0,
            estimated: 77000.0,
            actual: 80500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-30-2024",
                date: "2024-06-01",
                type: "income",
                amount: 80500.0,
                paymentMethod: "Credit Card",
                payee: "Various Students",
                description: "Registration payments",
              },
            ],
          },
        ],
      },
    ],
  },

  // Summer Camp Series - 2025 (Completed)
  {
    id: "5",
    title: "Summer Camp 2025",
    description: "Week-long summer camp program with outdoor activities, spiritual growth, and fellowship",
    status: "completed",
    budgetStatus: "on-track",
    seriesId: "series-2",
    year: 2025,
    copiedFromProjectId: "4",
    coordinator: {
      userId: 202,
      contactId: 228156,
      firstName: "Sarah",
      lastName: "Johnson",
      displayName: "Sarah Johnson",
      email: "sarah@woodsidebible.org",
    },
    startDate: "2025-07-12",
    endDate: "2025-07-19",
    totalEstimated: 82000.0,
    totalActual: 81500.0,
    categories: [
      {
        id: "cat-11-2025",
        name: "Venue & Lodging",
        type: "expense",
        estimated: 42000.0,
        actual: 42000.0,
        lineItems: [
          {
            id: "line-50-2025",
            name: "Camp Rental",
            estimated: 42000.0,
            actual: 42000.0,
            status: "paid",
            vendor: "Pine Lake Camp",
            transactions: [
              {
                id: "txn-23-2025",
                date: "2025-03-15",
                type: "expense",
                amount: 42000.0,
                paymentMethod: "Check",
                referenceNumber: "7456",
                payee: "Pine Lake Camp",
                description: "Full camp rental payment",
              },
            ],
          },
        ],
      },
      {
        id: "cat-13-2025",
        name: "Registrations",
        type: "revenue",
        estimated: 88000.0,
        actual: 91500.0,
        lineItems: [
          {
            id: "line-54-2025",
            name: "Student Registrations",
            quantity: 145,
            unitPrice: 560.0,
            estimated: 81200.0,
            actual: 84500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-30-2025",
                date: "2025-06-01",
                type: "income",
                amount: 84500.0,
                paymentMethod: "Credit Card",
                payee: "Various Students",
                description: "Registration payments",
              },
            ],
          },
        ],
      },
    ],
  },

  // Summer Camp Series - 2026 (Approved)
  {
    id: "6",
    title: "Summer Camp 2026",
    description: "Week-long summer camp program with outdoor activities, spiritual growth, and fellowship",
    status: "approved",
    budgetStatus: "on-track",
    seriesId: "series-2",
    year: 2026,
    copiedFromProjectId: "5",
    coordinator: {
      userId: 202,
      contactId: 228156,
      firstName: "Sarah",
      lastName: "Johnson",
      displayName: "Sarah Johnson",
      email: "sarah@woodsidebible.org",
    },
    startDate: "2026-07-10",
    endDate: "2026-07-17",
    totalEstimated: 85000.0,
    totalActual: 12500.0,
    categories: [
      {
        id: "cat-11",
        name: "Venue & Lodging",
        type: "expense",
        estimated: 45000.0,
        actual: 10000.0,
        lineItems: [
          {
            id: "line-50",
            name: "Camp Rental",
            estimated: 40000.0,
            actual: 10000.0,
            status: "ordered",
            vendor: "Pine Lake Camp",
            transactions: [
              {
                id: "txn-23",
                date: "2026-02-15",
                type: "expense",
                amount: 10000.0,
                paymentMethod: "Check",
                referenceNumber: "7891",
                payee: "Pine Lake Camp",
                description: "Deposit for summer camp rental",
              },
            ],
          },
          {
            id: "line-51",
            name: "Lodging Upgrades",
            estimated: 5000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-13",
        name: "Registrations",
        type: "revenue",
        estimated: 95000.0,
        actual: 0,
        lineItems: [
          {
            id: "line-54",
            name: "Student Registrations",
            quantity: 150,
            unitPrice: 580.0,
            estimated: 87000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
    ],
  },

  // Christmas Outreach Series - 2024 (Completed)
  {
    id: "7",
    title: "Christmas Outreach 2024",
    description: "Community outreach event serving families during the Christmas season",
    status: "completed",
    budgetStatus: "under",
    seriesId: "series-3",
    year: 2024,
    coordinator: {
      userId: 203,
      contactId: 228157,
      firstName: "Mike",
      lastName: "Chen",
      displayName: "Mike Chen",
      email: "mike@woodsidebible.org",
    },
    startDate: "2024-12-01",
    endDate: "2024-12-25",
    totalEstimated: 14500.0,
    totalActual: 13800.0,
    categories: [
      {
        id: "cat-14-2024",
        name: "Outreach Materials",
        type: "expense",
        estimated: 7500.0,
        actual: 7200.0,
        lineItems: [
          {
            id: "line-56-2024",
            name: "Gift Bags",
            estimated: 4500.0,
            actual: 4300.0,
            status: "paid",
            transactions: [
              {
                id: "txn-25-2024",
                date: "2024-11-10",
                type: "expense",
                amount: 4300.0,
                paymentMethod: "Credit Card",
                payee: "Bulk Bags Inc",
                description: "Gift bags for outreach",
              },
            ],
          },
        ],
      },
    ],
  },

  // Christmas Outreach Series - 2025 (Completed)
  {
    id: "8",
    title: "Christmas Outreach 2025",
    description: "Community outreach event serving families during the Christmas season",
    status: "completed",
    budgetStatus: "under",
    seriesId: "series-3",
    year: 2025,
    copiedFromProjectId: "7",
    coordinator: {
      userId: 203,
      contactId: 228157,
      firstName: "Mike",
      lastName: "Chen",
      displayName: "Mike Chen",
      email: "mike@woodsidebible.org",
    },
    startDate: "2025-12-01",
    endDate: "2025-12-25",
    totalEstimated: 15000.0,
    totalActual: 13250.0,
    categories: [
      {
        id: "cat-14-2025",
        name: "Outreach Materials",
        type: "expense",
        estimated: 8000.0,
        actual: 7100.0,
        lineItems: [
          {
            id: "line-56-2025",
            name: "Gift Bags",
            estimated: 5000.0,
            actual: 4500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-25-2025",
                date: "2025-11-15",
                type: "expense",
                amount: 4500.0,
                paymentMethod: "Credit Card",
                payee: "Bulk Bags Inc",
                description: "Gift bags for outreach",
              },
            ],
          },
        ],
      },
    ],
  },

  // Easter Service Series - 2025 (Completed)
  {
    id: "9",
    title: "Easter Service 2025",
    description: "Special Easter weekend services and community celebrations",
    status: "completed",
    budgetStatus: "on-track",
    seriesId: "series-4",
    year: 2025,
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2025-04-18",
    endDate: "2025-04-20",
    totalEstimated: 35000.0,
    totalActual: 34200.0,
    categories: [
      {
        id: "cat-easter-2025",
        name: "Event Production",
        type: "expense",
        estimated: 25000.0,
        actual: 24200.0,
        lineItems: [
          {
            id: "line-easter-1-2025",
            name: "Stage & Lighting",
            estimated: 15000.0,
            actual: 14500.0,
            status: "paid",
            vendor: "Stage Pro LLC",
            transactions: [
              {
                id: "txn-easter-1-2025",
                date: "2025-04-10",
                type: "expense",
                amount: 14500.0,
                paymentMethod: "Check",
                referenceNumber: "9123",
                payee: "Stage Pro LLC",
                description: "Stage and lighting rental",
              },
            ],
          },
        ],
      },
    ],
  },

  // Easter Service Series - 2026 (Approved)
  {
    id: "10",
    title: "Easter Service 2026",
    description: "Special Easter weekend services and community celebrations",
    status: "approved",
    budgetStatus: "on-track",
    seriesId: "series-4",
    year: 2026,
    copiedFromProjectId: "9",
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2026-04-03",
    endDate: "2026-04-05",
    totalEstimated: 38000.0,
    totalActual: 0,
    categories: [
      {
        id: "cat-easter-2026",
        name: "Event Production",
        type: "expense",
        estimated: 28000.0,
        actual: 0,
        lineItems: [
          {
            id: "line-easter-1-2026",
            name: "Stage & Lighting",
            estimated: 16500.0,
            actual: 0,
            status: "pending",
            vendor: "Stage Pro LLC",
            transactions: [],
          },
        ],
      },
    ],
  },

  // Standalone project (not part of a series)
  {
    id: "11",
    title: "New Building Campaign 2026",
    description: "Capital campaign for new ministry center construction",
    status: "pending",
    budgetStatus: "on-track",
    coordinator: {
      userId: 204,
      contactId: 228158,
      firstName: "David",
      lastName: "Martinez",
      displayName: "David Martinez",
      email: "david@woodsidebible.org",
    },
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    totalEstimated: 5000000.0,
    totalActual: 0,
    categories: [
      {
        id: "cat-building-1",
        name: "Construction Costs",
        type: "expense",
        estimated: 4500000.0,
        actual: 0,
        lineItems: [
          {
            id: "line-building-1",
            name: "General Contractor",
            estimated: 4000000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-building-2",
        name: "Campaign Donations",
        type: "revenue",
        estimated: 5000000.0,
        actual: 0,
        lineItems: [
          {
            id: "line-building-2",
            name: "Major Gifts",
            estimated: 3000000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
    ],
  },
];

// Helper function to get projects by series
export function getProjectsBySeries(seriesId: string): Project[] {
  return mockProjects
    .filter((p) => p.seriesId === seriesId)
    .sort((a, b) => (b.year || 0) - (a.year || 0)); // Sort by year descending
}

// Helper function to get series info
export function getSeriesById(seriesId: string): ProjectSeries | undefined {
  return mockProjectSeries.find((s) => s.id === seriesId);
}

// Helper function to get all years for a series
export function getSeriesYears(seriesId: string): number[] {
  return mockProjects
    .filter((p) => p.seriesId === seriesId && p.year)
    .map((p) => p.year!)
    .sort((a, b) => b - a); // Descending
}
