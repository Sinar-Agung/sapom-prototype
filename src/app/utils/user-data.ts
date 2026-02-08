// User database for the jewelry ordering system
// This contains mock user data for authentication and user management

/*
==========================================
🔐 LOGIN CREDENTIALS FOR TESTING
==========================================

SALES USERS (4):
1. Username: budi         | Password: sales123 | Full Name: Budi Santoso        | Credit: Rp 500,000,000
2. Username: anie         | Password: sales123 | Full Name: Ani Wijaya          | Credit: Rp 750,000,000
3. Username: cahy         | Password: sales123 | Full Name: Cahya Pratama       | Credit: Rp 600,000,000
4. Username: dewi         | Password: sales123 | Full Name: Dewi Sari           | Credit: Rp 850,000,000

STOCKIST USERS (2):
1. Username: ekmw         | Password: stock123 | Full Name: Eko Widodo          | Group: Kadar Muda (375, 420, 700)
2. Username: fitr         | Password: stock123 | Full Name: Fitri Rahmawati     | Group: Kadar Tua (750, 916, 999)

JEWELRY BUYER (JB) USERS (3):
1. Username: hend         | Password: jb123    | Full Name: Hendra Gunawan      | Group: Domestic Supplier
2. Username: inda         | Password: jb123    | Full Name: Indah Permatasari   | Group: Import Specialist
3. Username: joko         | Password: jb123    | Full Name: Joko Susanto        | Group: Custom Design

==========================================
*/

export interface SalesUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "sales";
  creditLimit: number; // in IDR (Indonesian Rupiah)
  email: string;
  phone: string;
}

export interface StockistUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "stockist";
  allocatedKadar: string[]; // Array of kadar values they handle
  group: "Kadar Muda" | "Kadar Tua";
  email: string;
  phone: string;
}

export interface JBUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "jb";
  group: string; // JB specialty group
  email: string;
  phone: string;
}

export type User = SalesUser | StockistUser | JBUser;

// ==========================================
// SALES USERS (4 users)
// ==========================================
export const SALES_USERS: SalesUser[] = [
  {
    username: "sales1",
    password: "sales123",
    fullName: "Budi Santoso",
    accountType: "sales",
    creditLimit: 500000000, // 500 million IDR
    email: "budi.santoso@jewelry.co.id",
    phone: "+62 812-3456-7890",
  },
  {
    username: "sales2",
    password: "sales123",
    fullName: "Ani Wijaya",
    accountType: "sales",
    creditLimit: 750000000, // 750 million IDR
    email: "ani.wijaya@jewelry.co.id",
    phone: "+62 813-4567-8901",
  },
  {
    username: "sales3",
    password: "sales123",
    fullName: "Cahya Pratama",
    accountType: "sales",
    creditLimit: 600000000, // 600 million IDR
    email: "cahya.pratama@jewelry.co.id",
    phone: "+62 814-5678-9012",
  },
  {
    username: "sales4",
    password: "sales123",
    fullName: "Dewi Sari",
    accountType: "sales",
    creditLimit: 850000000, // 850 million IDR
    email: "dewi.sari@jewelry.co.id",
    phone: "+62 815-6789-0123",
  },
];

// ==========================================
// STOCKIST USERS (2 users)
// ==========================================
export const STOCKIST_USERS: StockistUser[] = [
  {
    username: "stockist1",
    password: "stock123",
    fullName: "Eko Widodo",
    accountType: "stockist",
    allocatedKadar: ["375", "420", "700"], // 6k, 8k, 9k
    group: "Kadar Muda",
    email: "eko.widodo@jewelry.co.id",
    phone: "+62 816-7890-1234",
  },
  {
    username: "stockist2",
    password: "stock123",
    fullName: "Fitri Rahmawati",
    accountType: "stockist",
    allocatedKadar: ["750", "916", "999"], // 16k, 17k, 24k
    group: "Kadar Tua",
    email: "fitri.rahmawati@jewelry.co.id",
    phone: "+62 817-8901-2345",
  },
];

// ==========================================
// JEWELRY BUYER (JB) USERS (3 users)
// ==========================================
export const JB_USERS: JBUser[] = [
  {
    username: "jb1",
    password: "jb123",
    fullName: "Hendra Gunawan",
    accountType: "jb",
    group: "Domestic Supplier", // Handles local Indonesian suppliers
    email: "hendra.gunawan@jewelry.co.id",
    phone: "+62 818-9012-3456",
  },
  {
    username: "jb2",
    password: "jb123",
    fullName: "Indah Permatasari",
    accountType: "jb",
    group: "Import Specialist", // Handles international suppliers
    email: "indah.permatasari@jewelry.co.id",
    phone: "+62 819-0123-4567",
  },
  {
    username: "jb3",
    password: "jb123",
    fullName: "Joko Susanto",
    accountType: "jb",
    group: "Custom Design", // Handles custom/model orders
    email: "joko.susanto@jewelry.co.id",
    phone: "+62 820-1234-5678",
  },
];

// ==========================================
// COMBINED USER DATABASE
// ==========================================
export const ALL_USERS: User[] = [
  ...SALES_USERS,
  ...STOCKIST_USERS,
  ...JB_USERS,
];

// ==========================================
// AUTHENTICATION HELPERS
// ==========================================

// Find user by username
export const findUserByUsername = (username: string): User | undefined => {
  return ALL_USERS.find(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  );
};

// Authenticate user
export const authenticateUser = (
  username: string,
  password: string,
): User | null => {
  const user = findUserByUsername(username);

  if (!user) {
    return null;
  }

  // Check password
  if (user.password === password) {
    return user;
  }

  return null;
};

// Get user role
export const getUserRole = (user: User): "sales" | "stockist" | "jb" => {
  return user.accountType;
};

// Format credit limit to IDR currency
export const formatCreditLimit = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get stockist by kadar
export const getStockistByKadar = (kadar: string): StockistUser | undefined => {
  return STOCKIST_USERS.find((stockist) =>
    stockist.allocatedKadar.includes(kadar),
  );
};

// Check if stockist can handle kadar
export const canStockistHandleKadar = (
  username: string,
  kadar: string,
): boolean => {
  const stockist = STOCKIST_USERS.find((s) => s.username === username);
  if (!stockist) return false;
  return stockist.allocatedKadar.includes(kadar);
};

// Get all kadar groups
export const getKadarGroups = () => {
  return {
    "Kadar Muda": ["375", "420", "700"], // 6k, 8k, 9k
    "Kadar Tua": ["750", "916", "999"], // 16k, 17k, 24k
  };
};

// Initialize user data in session storage
export const initializeUserData = () => {
  // Store user database in sessionStorage for easy access
  if (!sessionStorage.getItem("userDatabase")) {
    sessionStorage.setItem("userDatabase", JSON.stringify(ALL_USERS));
    console.log(`✅ Initialized ${ALL_USERS.length} users in database`);
    console.log(`   - ${SALES_USERS.length} Sales users`);
    console.log(`   - ${STOCKIST_USERS.length} Stockist users`);
    console.log(`   - ${JB_USERS.length} JB users`);
  }
};

// Get current logged-in user details
export const getCurrentUserDetails = (): User | null => {
  const username =
    localStorage.getItem("username") || sessionStorage.getItem("username");
  if (!username) return null;

  return findUserByUsername(username) || null;
};

// Get full name from username
export const getFullNameFromUsername = (username: string): string => {
  const user = findUserByUsername(username);
  return user?.fullName || username; // Return username as fallback
};
