// User database for the jewelry ordering system
// This contains mock user data for authentication and user management

/*
==========================================
🔐 LOGIN CREDENTIALS FOR TESTING
==========================================

BRANCH CODES:
- JKT: Jakarta (Kode: A)
- BDG: Bandung (Kode: B)
- SBY: Surabaya (Kode: C)

SALES USERS (6):
1. Username: sales1         | Password: sales123 | Full Name: Budi Santoso        | Credit: Rp 500,000,000 | Branch: JKT
2. Username: sales2         | Password: sales123 | Full Name: Ani Wijaya          | Credit: Rp 750,000,000 | Branch: BDG
3. Username: sales3         | Password: sales123 | Full Name: Cahya Pratama       | Credit: Rp 600,000,000 | Branch: SBY
4. Username: sales4         | Password: sales123 | Full Name: Dewi Sari           | Credit: Rp 850,000,000 | Branch: JKT
5. Username: sales5         | Password: sales123 | Full Name: Rina Hartono        | Credit: Rp 700,000,000 | Branch: BDG
6. Username: sales6         | Password: sales123 | Full Name: Agus Setiawan       | Credit: Rp 550,000,000 | Branch: SBY

STOCKIST USERS (6):
1. Username: stockist1         | Password: stock123 | Full Name: Eko Widodo          | Group: Kadar Muda (375, 420, 700) | Branch: JKT
2. Username: stockist2         | Password: stock123 | Full Name: Fitri Rahmawati     | Group: Kadar Tua (750, 916, 999)  | Branch: BDG
3. Username: stockist3         | Password: stock123 | Full Name: Gunawan Pratama     | Group: Kadar Muda (375, 420, 700) | Branch: SBY
4. Username: stockist4         | Password: stock123 | Full Name: Hani Lestari        | Group: Kadar Tua (750, 916, 999)  | Branch: JKT
5. Username: stockist5         | Password: stock123 | Full Name: Irfan Hakim         | Group: Kadar Muda (375, 420, 700) | Branch: BDG
6. Username: stockist6         | Password: stock123 | Full Name: Julia Santoso       | Group: Kadar Tua (750, 916, 999)  | Branch: SBY

JEWELRY BUYER (JB) USERS (6):
1. Username: jb1         | Password: jb123    | Full Name: Hendra Gunawan      | Group: Domestic Supplier   | Branch: JKT
2. Username: jb2         | Password: jb123    | Full Name: Indah Permatasari   | Group: Import Specialist   | Branch: BDG
3. Username: jb3         | Password: jb123    | Full Name: Joko Susanto        | Group: Custom Design       | Branch: SBY
4. Username: jb4         | Password: jb123    | Full Name: Kartika Dewi        | Group: Domestic Supplier   | Branch: JKT
5. Username: jb5         | Password: jb123    | Full Name: Lukman Hakim        | Group: Import Specialist   | Branch: BDG
6. Username: jb6         | Password: jb123    | Full Name: Maya Sari           | Group: Custom Design       | Branch: SBY

SUPPLIER USERS (10):
1.  Username: kh          | Password: 123      | Full Name: King Halim Workshop     | Supplier: King Halim   (supplierId: king-halim)
2.  Username: ub          | Password: 123      | Full Name: UBS Gold Factory        | Supplier: UBS Gold     (supplierId: ubs-gold)
3.  Username: le          | Password: 123      | Full Name: Lestari Gold Corp       | Supplier: Lestari Gold (supplierId: lestari-gold)
4.  Username: yt          | Password: 123      | Full Name: YT Gold Manufacturing   | Supplier: YT Gold      (supplierId: yt-gold)
5.  Username: mt          | Password: 123      | Full Name: MT Gold Industries      | Supplier: MT Gold      (supplierId: mt-gold)
6.  Username: hw          | Password: 123      | Full Name: HWT Jewelry             | Supplier: HWT          (supplierId: hwt)
7.  Username: ay          | Password: 123      | Full Name: Ayu Gold Crafters       | Supplier: Ayu          (supplierId: ayu)
8.  Username: sa          | Password: 123      | Full Name: SB Gold Works           | Supplier: SB Gold      (supplierId: sb-gold)
9.  Username: se          | Password: 123      | Full Name: CRM Gold Manufacturing  | Supplier: CRM          (supplierId: crm)
10. Username: lo          | Password: 123      | Full Name: Lotus Gold Artisan      | Supplier: Lotus Gold   (supplierId: lts-gold)

==========================================
*/

/**
 * Branch Code type - represents the branch/location where user is assigned
 */
export type BranchCode = "JKT" | "BDG" | "SBY";

/**
 * Language preference type - represents the user's preferred UI language
 */
export type LanguageCode = "en" | "id";

export interface SalesUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "sales";
  creditLimit: number; // in IDR (Indonesian Rupiah)
  email: string;
  phone: string;
  branchCode: BranchCode;
  language?: LanguageCode; // User's preferred language (default: 'en')
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
  branchCode: BranchCode;
  language?: LanguageCode; // User's preferred language (default: 'en')
}

export interface JBUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "jb";
  group: string; // JB specialty group
  email: string;
  phone: string;
  branchCode: BranchCode;
  language?: LanguageCode; // User's preferred language (default: 'en')
}

export interface SupplierUser {
  username: string;
  password: string;
  fullName: string;
  accountType: "supplier";
  supplierId: string; // Links to pabrik EntityReference
  supplierName: string; // Name of the supplier company
  email: string;
  phone: string;
  branchCode: null; // Suppliers don't have branch codes
  language?: LanguageCode; // User's preferred language (default: 'en')
}

export type User = SalesUser | StockistUser | JBUser | SupplierUser;

// ==========================================
// SALES USERS (6 users)
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
    branchCode: "JKT",
  },
  {
    username: "sales2",
    password: "sales123",
    fullName: "Ani Wijaya",
    accountType: "sales",
    creditLimit: 750000000, // 750 million IDR
    email: "ani.wijaya@jewelry.co.id",
    phone: "+62 813-4567-8901",
    branchCode: "BDG",
  },
  {
    username: "sales3",
    password: "sales123",
    fullName: "Cahya Pratama",
    accountType: "sales",
    creditLimit: 600000000, // 600 million IDR
    email: "cahya.pratama@jewelry.co.id",
    phone: "+62 814-5678-9012",
    branchCode: "SBY",
  },
  {
    username: "sales4",
    password: "sales123",
    fullName: "Dewi Sari",
    accountType: "sales",
    creditLimit: 850000000, // 850 million IDR
    email: "dewi.sari@jewelry.co.id",
    phone: "+62 815-6789-0123",
    branchCode: "JKT",
  },
  {
    username: "sales5",
    password: "sales123",
    fullName: "Rina Hartono",
    accountType: "sales",
    creditLimit: 700000000, // 700 million IDR
    email: "rina.hartono@jewelry.co.id",
    phone: "+62 816-7890-1234",
    branchCode: "BDG",
  },
  {
    username: "sales6",
    password: "sales123",
    fullName: "Agus Setiawan",
    accountType: "sales",
    creditLimit: 550000000, // 550 million IDR
    email: "agus.setiawan@jewelry.co.id",
    phone: "+62 817-8901-2345",
    branchCode: "SBY",
  },
];

// ==========================================
// STOCKIST USERS (6 users)
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
    phone: "+62 818-7890-1234",
    branchCode: "JKT",
  },
  {
    username: "stockist2",
    password: "stock123",
    fullName: "Fitri Rahmawati",
    accountType: "stockist",
    allocatedKadar: ["750", "916", "999"], // 16k, 17k, 24k
    group: "Kadar Tua",
    email: "fitri.rahmawati@jewelry.co.id",
    phone: "+62 819-8901-2345",
    branchCode: "BDG",
  },
  {
    username: "stockist3",
    password: "stock123",
    fullName: "Gunawan Pratama",
    accountType: "stockist",
    allocatedKadar: ["375", "420", "700"], // 6k, 8k, 9k
    group: "Kadar Muda",
    email: "gunawan.pratama@jewelry.co.id",
    phone: "+62 820-9012-3456",
    branchCode: "SBY",
  },
  {
    username: "stockist4",
    password: "stock123",
    fullName: "Hani Lestari",
    accountType: "stockist",
    allocatedKadar: ["750", "916", "999"], // 16k, 17k, 24k
    group: "Kadar Tua",
    email: "hani.lestari@jewelry.co.id",
    phone: "+62 821-0123-4567",
    branchCode: "JKT",
  },
  {
    username: "stockist5",
    password: "stock123",
    fullName: "Irfan Hakim",
    accountType: "stockist",
    allocatedKadar: ["375", "420", "700"], // 6k, 8k, 9k
    group: "Kadar Muda",
    email: "irfan.hakim@jewelry.co.id",
    phone: "+62 822-1234-5678",
    branchCode: "BDG",
  },
  {
    username: "stockist6",
    password: "stock123",
    fullName: "Julia Santoso",
    accountType: "stockist",
    allocatedKadar: ["750", "916", "999"], // 16k, 17k, 24k
    group: "Kadar Tua",
    email: "julia.santoso@jewelry.co.id",
    phone: "+62 823-2345-6789",
    branchCode: "SBY",
  },
];

// ==========================================
// JEWELRY BUYER (JB) USERS (6 users)
// ==========================================
export const JB_USERS: JBUser[] = [
  {
    username: "jb1",
    password: "jb123",
    fullName: "Hendra Gunawan",
    accountType: "jb",
    group: "Domestic Supplier", // Handles local Indonesian suppliers
    email: "hendra.gunawan@jewelry.co.id",
    phone: "+62 824-9012-3456",
    branchCode: "JKT",
  },
  {
    username: "jb2",
    password: "jb123",
    fullName: "Indah Permatasari",
    accountType: "jb",
    group: "Import Specialist", // Handles international suppliers
    email: "indah.permatasari@jewelry.co.id",
    phone: "+62 825-0123-4567",
    branchCode: "BDG",
  },
  {
    username: "jb3",
    password: "jb123",
    fullName: "Joko Susanto",
    accountType: "jb",
    group: "Custom Design", // Handles custom/model orders
    email: "joko.susanto@jewelry.co.id",
    phone: "+62 826-1234-5678",
    branchCode: "SBY",
  },
  {
    username: "jb4",
    password: "jb123",
    fullName: "Kartika Dewi",
    accountType: "jb",
    group: "Domestic Supplier",
    email: "kartika.dewi@jewelry.co.id",
    phone: "+62 827-2345-6789",
    branchCode: "JKT",
  },
  {
    username: "jb5",
    password: "jb123",
    fullName: "Lukman Hakim",
    accountType: "jb",
    group: "Import Specialist",
    email: "lukman.hakim@jewelry.co.id",
    phone: "+62 828-3456-7890",
    branchCode: "BDG",
  },
  {
    username: "jb6",
    password: "jb123",
    fullName: "Maya Sari",
    accountType: "jb",
    group: "Custom Design",
    email: "maya.sari@jewelry.co.id",
    phone: "+62 829-4567-8901",
    branchCode: "SBY",
  },
];

// ==========================================
// SUPPLIER USERS (13 users)
// ==========================================
export const SUPPLIER_USERS: SupplierUser[] = [
  {
    username: "kh",
    password: "123",
    fullName: "King Halim Workshop",
    accountType: "supplier",
    supplierId: "king-halim",
    supplierName: "King Halim",
    email: "contact@kinghalim.co.id",
    phone: "+62 821-1111-0001",
    branchCode: null,
  },
  {
    username: "ub",
    password: "123",
    fullName: "UBS Gold Factory",
    accountType: "supplier",
    supplierId: "ubs-gold",
    supplierName: "UBS Gold",
    email: "info@ubsgold.co.id",
    phone: "+62 821-1111-0002",
    branchCode: null,
  },
  {
    username: "le",
    password: "123",
    fullName: "Lestari Gold Corp",
    accountType: "supplier",
    supplierId: "lestari-gold",
    supplierName: "Lestari Gold",
    email: "sales@lestarigold.co.id",
    phone: "+62 821-1111-0003",
    branchCode: null,
  },
  {
    username: "yt",
    password: "123",
    fullName: "YT Gold Manufacturing",
    accountType: "supplier",
    supplierId: "yt-gold",
    supplierName: "YT Gold",
    email: "orders@ytgold.co.id",
    phone: "+62 821-1111-0004",
    branchCode: null,
  },
  {
    username: "mt",
    password: "123",
    fullName: "MT Gold Industries",
    accountType: "supplier",
    supplierId: "mt-gold",
    supplierName: "MT Gold",
    email: "info@mtgold.co.id",
    phone: "+62 821-1111-0005",
    branchCode: null,
  },
  {
    username: "hw",
    password: "123",
    fullName: "HWT Jewelry",
    accountType: "supplier",
    supplierId: "hwt",
    supplierName: "HWT",
    email: "support@hwtjewelry.co.id",
    phone: "+62 821-1111-0006",
    branchCode: null,
  },
  {
    username: "ay",
    password: "123",
    fullName: "Ayu Gold Crafters",
    accountType: "supplier",
    supplierId: "ayu",
    supplierName: "Ayu",
    email: "contact@ayugold.co.id",
    phone: "+62 821-1111-0007",
    branchCode: null,
  },
  {
    username: "sa",
    password: "123",
    fullName: "SB Gold Works",
    accountType: "supplier",
    supplierId: "sb-gold",
    supplierName: "SB Gold",
    email: "orders@sbgold.co.id",
    phone: "+62 821-1111-0008",
    branchCode: null,
  },
  {
    username: "se",
    password: "123",
    fullName: "CRM Gold Manufacturing",
    accountType: "supplier",
    supplierId: "crm",
    supplierName: "CRM",
    email: "info@crmgold.co.id",
    phone: "+62 821-1111-0009",
    branchCode: null,
  },
  {
    username: "lo",
    password: "123",
    fullName: "Lotus Gold Artisan",
    accountType: "supplier",
    supplierId: "lts-gold",
    supplierName: "Lotus Gold",
    email: "info@lotusgold.co.id",
    phone: "+62 821-1111-0012",
    branchCode: null,
  },
];

// ==========================================
// COMBINED USER DATABASE
// ==========================================
export const ALL_USERS: User[] = [
  ...SALES_USERS,
  ...STOCKIST_USERS,
  ...JB_USERS,
  ...SUPPLIER_USERS,
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
export const getUserRole = (
  user: User,
): "sales" | "stockist" | "jb" | "supplier" => {
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

// Get branch name from branch code
export const getBranchName = (branchCode: BranchCode): string => {
  const branchNames: Record<BranchCode, string> = {
    JKT: "Jakarta",
    BDG: "Bandung",
    SBY: "Surabaya",
  };
  return branchNames[branchCode];
};

// Get all users by branch
export const getUsersByBranch = (branchCode: BranchCode): User[] => {
  return ALL_USERS.filter((user) => user.branchCode === branchCode);
};

// Get supplier by supplier ID
export const getSupplierBySupplierId = (
  supplierId: string,
): SupplierUser | undefined => {
  return SUPPLIER_USERS.find((supplier) => supplier.supplierId === supplierId);
};

// Get all suppliers
export const getAllSuppliers = (): SupplierUser[] => {
  return SUPPLIER_USERS;
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
    console.log(`   - ${SUPPLIER_USERS.length} Supplier users`);
  }
};

// Get current logged-in user details
export const getCurrentUserDetails = (): User | null => {
  // First try to get from stored profile
  const profileFromStorage =
    localStorage.getItem("userProfile") ||
    sessionStorage.getItem("userProfile");

  if (profileFromStorage) {
    try {
      return JSON.parse(profileFromStorage) as User;
    } catch (e) {
      console.error("Failed to parse user profile from storage", e);
    }
  }

  // Fallback to username lookup
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
