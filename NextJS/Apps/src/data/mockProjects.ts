// Mock data for Project Budgets app
// Based on "Product Launch Party" retreat budget Excel spreadsheet

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

// Mock project data based on "Product Launch Party 2026" Excel
export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Product Launch Party 2026",
    description: "Annual youth retreat featuring worship, teaching sessions, and team-building activities",
    status: "in-progress",
    budgetStatus: "under",
    coordinator: {
      userId: 201,
      contactId: 228155,
      firstName: "Colton",
      lastName: "Wirgau",
      displayName: "Colton Wirgau",
      email: "colton@woodsidebible.org",
    },
    startDate: "2026-06-15",
    endDate: "2026-06-20",
    totalEstimated: 263400.0,
    totalActual: 204608.0,
    categories: [
      {
        id: "cat-1",
        name: "Operational Costs",
        type: "expense",
        estimated: 203600.0,
        actual: 182406.0,
        lineItems: [
          {
            id: "line-1",
            name: "Timberwolf",
            description: "Venue rental for main sessions",
            estimated: 120000.0,
            actual: 120889.0,
            status: "paid",
            vendor: "Timberwolf Lodge",
            transactions: [
              {
                id: "txn-1",
                date: "2026-03-15",
                type: "expense",
                amount: 120889.0,
                paymentMethod: "Check",
                referenceNumber: "8472",
                payee: "Timberwolf Lodge",
                description: "Venue rental - deposit paid",
                approvedBy: "Sarah Johnson",
                approvedDate: "2026-03-14",
              },
            ],
          },
          {
            id: "line-2",
            name: "Staff/Band Coverage",
            estimated: 8850.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-3",
            name: "Transportation",
            estimated: 60000.0,
            actual: 59547.0,
            status: "paid",
            vendor: "ABC Charter",
            transactions: [
              {
                id: "txn-2",
                date: "2026-04-20",
                type: "expense",
                amount: 30000.0,
                paymentMethod: "Credit Card",
                referenceNumber: "CC-2891",
                payee: "ABC Charter",
                description: "Bus transportation - 50% deposit",
              },
              {
                id: "txn-3",
                date: "2026-05-15",
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
            id: "line-4",
            name: "Gas",
            estimated: 5800.0,
            actual: 1510.0,
            status: "paid",
            transactions: [
              {
                id: "txn-4",
                date: "2026-06-16",
                type: "expense",
                amount: 1510.0,
                paymentMethod: "Credit Card",
                payee: "Shell Station",
                description: "Van gas for retreat",
              },
            ],
          },
          {
            id: "line-5",
            name: "Medical Care",
            estimated: 1850.0,
            actual: 460.0,
            status: "paid",
            transactions: [
              {
                id: "txn-5",
                date: "2026-06-17",
                type: "expense",
                amount: 460.0,
                paymentMethod: "Cash",
                payee: "Urgent Care Clinic",
                description: "Medical supplies and first aid",
              },
            ],
          },
          {
            id: "line-6",
            name: "Staff Kid Discount",
            estimated: 2700.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-7",
            name: "Sibling Discount",
            estimated: 4400.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-2",
        name: "Activities",
        type: "expense",
        estimated: 3600.0,
        actual: 1686.0,
        lineItems: [
          {
            id: "line-8",
            name: "Large Group Games/prizes",
            estimated: 1500.0,
            actual: 240.0,
            status: "paid",
            transactions: [
              {
                id: "txn-6",
                date: "2026-05-20",
                type: "expense",
                amount: 240.0,
                paymentMethod: "Credit Card",
                payee: "Party Supplies Co",
                description: "Large group game supplies",
              },
            ],
          },
          {
            id: "line-9",
            name: "Free Time Activities",
            estimated: 700.0,
            actual: 675.0,
            status: "paid",
            transactions: [
              {
                id: "txn-7",
                date: "2026-05-25",
                type: "expense",
                amount: 675.0,
                paymentMethod: "Credit Card",
                payee: "Sports Equipment LLC",
                description: "Recreation equipment",
              },
            ],
          },
          {
            id: "line-10",
            name: "Mealtime games/prizes",
            estimated: 400.0,
            actual: 36.0,
            status: "paid",
            transactions: [
              {
                id: "txn-8",
                date: "2026-06-10",
                type: "expense",
                amount: 36.0,
                paymentMethod: "Cash",
                payee: "Dollar Store",
                description: "Small prizes for mealtime games",
              },
            ],
          },
          {
            id: "line-11",
            name: "Tournaments/prizes",
            estimated: 1000.0,
            actual: 735.0,
            status: "paid",
            transactions: [
              {
                id: "txn-9",
                date: "2026-06-05",
                type: "expense",
                amount: 735.0,
                paymentMethod: "Credit Card",
                payee: "Trophy Shop",
                description: "Tournament trophies and prizes",
              },
            ],
          },
        ],
      },
      {
        id: "cat-3",
        name: "Retreat Meal Supplies/Food",
        type: "expense",
        estimated: 5700.0,
        actual: 3718.0,
        lineItems: [
          {
            id: "line-12",
            name: "Paper Products",
            estimated: 2500.0,
            actual: 1619.0,
            status: "paid",
            transactions: [
              {
                id: "txn-10",
                date: "2026-06-12",
                type: "expense",
                amount: 1619.0,
                paymentMethod: "Credit Card",
                payee: "Costco",
                description: "Paper plates, cups, napkins",
              },
            ],
          },
          {
            id: "line-13",
            name: "Late Night Meals",
            estimated: 0,
            actual: 554.0,
            status: "paid",
            transactions: [
              {
                id: "txn-11",
                date: "2026-06-16",
                type: "expense",
                amount: 554.0,
                paymentMethod: "Credit Card",
                payee: "Pizza Place",
                description: "Late night pizza for staff",
              },
            ],
          },
          {
            id: "line-14",
            name: "Early Crew/staff meals",
            estimated: 3200.0,
            actual: 1545.0,
            status: "paid",
            transactions: [
              {
                id: "txn-12",
                date: "2026-06-14",
                type: "expense",
                amount: 1545.0,
                paymentMethod: "Credit Card",
                payee: "Catering Company",
                description: "Early crew meals",
              },
            ],
          },
        ],
      },
      {
        id: "cat-4",
        name: "Session Costs",
        type: "expense",
        estimated: 11200.0,
        actual: 7978.0,
        lineItems: [
          {
            id: "line-15",
            name: "Audio Contract",
            estimated: 1000.0,
            actual: 1000.0,
            status: "paid",
            vendor: "Pro Audio Services",
            transactions: [
              {
                id: "txn-13",
                date: "2026-05-01",
                type: "expense",
                amount: 1000.0,
                paymentMethod: "Check",
                referenceNumber: "8901",
                payee: "Pro Audio Services",
                description: "Sound engineer contract",
              },
            ],
          },
          {
            id: "line-16",
            name: "Stage Rentals",
            estimated: 8000.0,
            actual: 6748.0,
            status: "paid",
            transactions: [
              {
                id: "txn-14",
                date: "2026-04-15",
                type: "expense",
                amount: 6748.0,
                paymentMethod: "Check",
                referenceNumber: "8723",
                payee: "Stage Equipment Rental",
                description: "Stage and lighting rental",
              },
            ],
          },
          {
            id: "line-17",
            name: "Session supplies (non-band)",
            estimated: 200.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-18",
            name: "Band/Prod Supplies",
            estimated: 1500.0,
            actual: 230.0,
            status: "paid",
            transactions: [
              {
                id: "txn-15",
                date: "2026-05-28",
                type: "expense",
                amount: 230.0,
                paymentMethod: "Credit Card",
                payee: "Music Store",
                description: "Guitar strings, cables, batteries",
              },
            ],
          },
          {
            id: "line-19",
            name: "Setup/teardown supplies",
            estimated: 500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-5",
        name: "Volunteer Appreciation",
        type: "expense",
        estimated: 9500.0,
        actual: 5245.0,
        lineItems: [
          {
            id: "line-20",
            name: "Leader Lounge",
            estimated: 2500.0,
            actual: 588.0,
            status: "paid",
            transactions: [
              {
                id: "txn-16",
                date: "2026-06-10",
                type: "expense",
                amount: 588.0,
                paymentMethod: "Credit Card",
                payee: "Costco",
                description: "Snacks and drinks for leader lounge",
              },
            ],
          },
          {
            id: "line-21",
            name: "Welcome Kits",
            estimated: 1000.0,
            actual: 542.0,
            status: "paid",
            transactions: [
              {
                id: "txn-17",
                date: "2026-06-08",
                type: "expense",
                amount: 542.0,
                paymentMethod: "Credit Card",
                payee: "Amazon",
                description: "Welcome kit items",
              },
            ],
          },
          {
            id: "line-22",
            name: "Band/Production Appreciation",
            estimated: 1000.0,
            actual: 915.0,
            status: "paid",
            transactions: [
              {
                id: "txn-18",
                date: "2026-06-20",
                type: "expense",
                amount: 915.0,
                paymentMethod: "Credit Card",
                payee: "Restaurant Gift Cards",
                description: "Thank you gifts for band and production team",
              },
            ],
          },
          {
            id: "line-23",
            name: "Timberwolf Coffee",
            estimated: 3500.0,
            actual: 3200.0,
            status: "paid",
            transactions: [
              {
                id: "txn-19",
                date: "2026-06-15",
                type: "expense",
                amount: 3200.0,
                paymentMethod: "Credit Card",
                payee: "Timberwolf Lodge",
                description: "Coffee service for entire event",
              },
            ],
          },
          {
            id: "line-24",
            name: "Work Crew Appreciation",
            estimated: 1500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-6",
        name: "Communications",
        type: "expense",
        estimated: 5600.0,
        actual: 3575.0,
        lineItems: [
          {
            id: "line-25",
            name: "Promotions",
            estimated: 750.0,
            actual: 250.0,
            status: "paid",
            transactions: [
              {
                id: "txn-20",
                date: "2026-03-01",
                type: "expense",
                amount: 250.0,
                paymentMethod: "Credit Card",
                payee: "Facebook Ads",
                description: "Social media promotion",
              },
            ],
          },
          {
            id: "line-26",
            name: "Booklets",
            estimated: 1500.0,
            actual: 575.0,
            status: "paid",
            transactions: [
              {
                id: "txn-21",
                date: "2026-05-15",
                type: "expense",
                amount: 575.0,
                paymentMethod: "Credit Card",
                payee: "Print Shop",
                description: "Event program booklets",
              },
            ],
          },
          {
            id: "line-27",
            name: "Signage/Materials for Signs",
            estimated: 750.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-28",
            name: "Videographer/Photographer",
            estimated: 2600.0,
            actual: 2750.0,
            status: "paid",
            transactions: [
              {
                id: "txn-22",
                date: "2026-06-20",
                type: "expense",
                amount: 2750.0,
                paymentMethod: "Check",
                referenceNumber: "9201",
                payee: "Creative Media Co",
                description: "Video and photo coverage - full event",
              },
            ],
          },
        ],
      },
      {
        id: "cat-7",
        name: "Miscellaneous",
        type: "expense",
        estimated: 24200.0,
        actual: 0,
        lineItems: [
          {
            id: "line-29",
            name: "Admin/Staffing",
            estimated: 1000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-30",
            name: "Merch for Student Staff",
            estimated: 1200.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-31",
            name: "Free Shirts",
            estimated: 10000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-32",
            name: "Merch",
            estimated: 6000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-33",
            name: "Credit Card Processing 3%",
            estimated: 6000.0,
            actual: 0,
            status: "pending",
            description: "Estimated 3% processing fee on registrations",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-8",
        name: "Admissions",
        type: "revenue",
        estimated: 226689.0,
        actual: 0,
        lineItems: [
          {
            id: "line-34",
            name: "Middle School Students 6th Grade",
            quantity: 200,
            unitPrice: 225.0,
            estimated: 45000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-35",
            name: "Middle School Students 7/8 Full",
            quantity: 75,
            unitPrice: 0,
            estimated: 0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-36",
            name: "Middle School Leaders 5th",
            quantity: 40,
            unitPrice: 225.0,
            estimated: 9000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-37",
            name: "High School 9th Students",
            quantity: 200,
            unitPrice: 0,
            estimated: 0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-38",
            name: "High School 9th Students 1/2 Full",
            quantity: 62,
            unitPrice: 245.0,
            estimated: 15138.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-39",
            name: "High School 10th Students",
            quantity: 55,
            unitPrice: 225.0,
            estimated: 12375.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-40",
            name: "High School 11th Students",
            quantity: 200,
            unitPrice: 225.0,
            estimated: 45000.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-41",
            name: "High School 11th Students 1/2 Full",
            quantity: 55,
            unitPrice: 245.0,
            estimated: 13475.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-42",
            name: "High School 12th Leaders",
            quantity: 30,
            unitPrice: 245.0,
            estimated: 7350.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-43",
            name: "Summer Missions",
            quantity: 1930,
            unitPrice: 0,
            estimated: 0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-9",
        name: "One to One Program",
        type: "revenue",
        estimated: 4400.0,
        actual: 0,
        lineItems: [
          {
            id: "line-44",
            name: "March Weekend #1",
            quantity: 2000,
            unitPrice: 1.25,
            estimated: 2500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-45",
            name: "March Weekend #2",
            quantity: 2000,
            unitPrice: 1.25,
            estimated: 2500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-46",
            name: "March Weekend #3",
            quantity: 2000,
            unitPrice: 1.25,
            estimated: 2500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
      {
        id: "cat-10",
        name: "Bands/Production",
        type: "revenue",
        estimated: 750.0,
        actual: 0,
        lineItems: [
          {
            id: "line-47",
            name: "Band Week 1",
            quantity: 5,
            unitPrice: 50.0,
            estimated: 250.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-48",
            name: "Band Week 2",
            quantity: 5,
            unitPrice: 50.0,
            estimated: 250.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-49",
            name: "Band Week 3",
            quantity: 5,
            unitPrice: 50.0,
            estimated: 250.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Summer Camp 2026",
    description: "Week-long summer camp program with outdoor activities, spiritual growth, and fellowship",
    status: "approved",
    budgetStatus: "on-track",
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
        id: "cat-12",
        name: "Food & Catering",
        type: "expense",
        estimated: 25000.0,
        actual: 2500.0,
        lineItems: [
          {
            id: "line-52",
            name: "Meal Service",
            estimated: 22000.0,
            actual: 2500.0,
            status: "ordered",
            vendor: "Camp Food Services",
            transactions: [
              {
                id: "txn-24",
                date: "2026-03-01",
                type: "expense",
                amount: 2500.0,
                paymentMethod: "Check",
                referenceNumber: "8012",
                payee: "Camp Food Services",
                description: "Deposit for meal service",
              },
            ],
          },
          {
            id: "line-53",
            name: "Snacks & Beverages",
            estimated: 3000.0,
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
            unitPrice: 550.0,
            estimated: 82500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
          {
            id: "line-55",
            name: "Leader Registrations",
            quantity: 25,
            unitPrice: 500.0,
            estimated: 12500.0,
            actual: 0,
            status: "pending",
            transactions: [],
          },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Christmas Outreach 2025",
    description: "Community outreach event serving families during the Christmas season",
    status: "completed",
    budgetStatus: "under",
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
        id: "cat-14",
        name: "Outreach Materials",
        type: "expense",
        estimated: 8000.0,
        actual: 7100.0,
        lineItems: [
          {
            id: "line-56",
            name: "Gift Bags",
            estimated: 5000.0,
            actual: 4500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-25",
                date: "2025-11-15",
                type: "expense",
                amount: 4500.0,
                paymentMethod: "Credit Card",
                payee: "Bulk Bags Inc",
                description: "Gift bags for outreach",
              },
            ],
          },
          {
            id: "line-57",
            name: "Promotional Materials",
            estimated: 3000.0,
            actual: 2600.0,
            status: "paid",
            transactions: [
              {
                id: "txn-26",
                date: "2025-11-20",
                type: "expense",
                amount: 2600.0,
                paymentMethod: "Credit Card",
                payee: "Print Solutions",
                description: "Flyers and postcards",
              },
            ],
          },
        ],
      },
      {
        id: "cat-15",
        name: "Event Costs",
        type: "expense",
        estimated: 7000.0,
        actual: 6150.0,
        lineItems: [
          {
            id: "line-58",
            name: "Venue Rental",
            estimated: 4000.0,
            actual: 3500.0,
            status: "paid",
            transactions: [
              {
                id: "txn-27",
                date: "2025-11-10",
                type: "expense",
                amount: 3500.0,
                paymentMethod: "Check",
                referenceNumber: "7123",
                payee: "Community Center",
                description: "Christmas event venue",
              },
            ],
          },
          {
            id: "line-59",
            name: "Refreshments",
            estimated: 3000.0,
            actual: 2650.0,
            status: "paid",
            transactions: [
              {
                id: "txn-28",
                date: "2025-12-23",
                type: "expense",
                amount: 2650.0,
                paymentMethod: "Credit Card",
                payee: "Costco",
                description: "Food and drinks for event",
              },
            ],
          },
        ],
      },
    ],
  },
];
