// Mock data generator for the jewelry ordering system
// This creates realistic sample data for testing and demonstration

interface OrderItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
}

interface Order {
  id: string;
  timestamp: number;
  createdBy?: string;
  pabrik: {
    id: string;
    name: string;
  };
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  namaPelanggan: {
    id: string;
    name: string;
  };
  waktuKirim: string;
  followUpAction: string;
  detailItems: OrderItem[];
  fotoBarangBase64?: string;
  status: string;
}

// Helper to generate dates
const getDaysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getTimestampDaysAgo = (days: number): number => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.getTime();
};

// Helper to generate unique IDs
let idCounter = 1;
const generateId = () => `order-${Date.now()}-${idCounter++}`;
const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock data generator
export const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const salesUsers = ["Budi Santoso", "Ani Wijaya", "Cahya Pratama", "Dewi Sari"];
  
  // Customer names from ATAS_NAMA_OPTIONS - using proper labels with both id and name
  const customers = [
    { id: "toko-emas-sejahtera", name: "Toko Emas Sejahtera" },
    { id: "toko-perhiasan-mulia", name: "Toko Perhiasan Mulia" },
    { id: "emas-berlian-jaya", name: "Emas & Berlian Jaya" },
    { id: "toko-mas-indah", name: "Toko Mas Indah" },
    { id: "perhiasan-permata", name: "Perhiasan Permata" },
    { id: "toko-emas-berkah", name: "Toko Emas Berkah" },
    { id: "toko-emas-harmoni", name: "Toko Emas Harmoni" },
    { id: "galeri-emas-nusantara", name: "Galeri Emas Nusantara" },
    { id: "toko-mas-rejeki", name: "Toko Mas Rejeki" },
    { id: "perhiasan-modern", name: "Perhiasan Modern" }
  ];
  
  // Realistic supplier names from PABRIK_OPTIONS
  const suppliers = [
    { id: "king-halim", name: "King Halim" },
    { id: "ubs-gold", name: "UBS Gold" },
    { id: "lestari-gold", name: "Lestari Gold" },
    { id: "yt-gold", name: "YT Gold" },
    { id: "mt-gold", name: "MT Gold" },
    { id: "hwt", name: "HWT" },
    { id: "ayu", name: "Ayu" }
  ];
  
  // ==========================================
  // 12 OPEN REQUESTS
  // ==========================================
  
  // Open Request 1: Basic - Italy Santa
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(5),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-santa",
    namaPelanggan: customers.find(c => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(7),
    followUpAction: "Call customer for confirmation",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "16",
        berat: "5.5",
        pcs: "10"
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "18",
        berat: "6.0",
        pcs: "15"
      }
    ],
    status: "Open"
  });

  // Open Request 2: Model - Custom Design
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(4),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-rantai",
    namaProduk: "gelang-keroncong",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(10),
    followUpAction: "Wait for sample approval",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "750",
        warna: "k",
        ukuran: "18",
        berat: "12.0",
        pcs: "5"
      }
    ],
    status: "Open"
  });

  // Open Request 3: Basic - Kalung Flexi
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(3),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "kalung-flexi",
    namaPelanggan: customers.find(c => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(5),
    followUpAction: "Send catalog",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "40",
        berat: "3.2",
        pcs: "20"
      },
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "45",
        berat: "3.5",
        pcs: "25"
      },
      {
        id: generateItemId(),
        kadar: "420",
        warna: "p",
        ukuran: "40",
        berat: "3.3",
        pcs: "10"
      }
    ],
    status: "Open"
  });

  // Open Request 4: Basic - Milano
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(2),
    createdBy: salesUsers[3],
    pabrik: suppliers.find(s => s.id === "yt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find(c => c.id === "toko-mas-indah")!,
    waktuKirim: getDaysFromNow(12),
    followUpAction: "Follow up payment",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "m",
        ukuran: "15",
        berat: "2.5",
        pcs: "8"
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "m",
        ukuran: "16",
        berat: "2.6",
        pcs: "12"
      }
    ],
    status: "Open"
  });

  // Open Request 5: Basic - Italy Bambu
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "italy-bambu",
    namaPelanggan: customers.find(c => c.id === "perhiasan-permata")!,
    waktuKirim: getDaysFromNow(8),
    followUpAction: "Confirm size availability",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "750",
        warna: "p",
        ukuran: "18",
        berat: "10.0",
        pcs: "6"
      }
    ],
    status: "Open"
  });

  // Open Request 6: Model - Custom Liontin
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "model",
    jenisProduk: "liontin",
    namaProduk: "liontin-heart-love",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-emas-berkah")!,
    waktuKirim: getDaysFromNow(15),
    followUpAction: "Send design mockup",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "k",
        ukuran: "n",
        berat: "4.5",
        pcs: "10"
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "m",
        ukuran: "n",
        berat: "4.5",
        pcs: "10"
      }
    ],
    status: "Open"
  });

  // Open Request 7: Basic - Tambang
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(6),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "mt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "tambang",
    namaPelanggan: customers.find(c => c.id === "toko-emas-harmoni")!,
    waktuKirim: getDaysFromNow(6),
    followUpAction: "Price negotiation",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "420",
        warna: "p",
        ukuran: "42",
        berat: "8.0",
        pcs: "15"
      }
    ],
    status: "Open"
  });

  // Open Request 8: Basic - Sunny Vanessa
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(7),
    createdBy: salesUsers[3],
    pabrik: suppliers.find(s => s.id === "hwt")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "sunny-vanessa",
    namaPelanggan: customers.find(c => c.id === "galeri-emas-nusantara")!,
    waktuKirim: getDaysFromNow(9),
    followUpAction: "Wait for deposit",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "17",
        berat: "5.5",
        pcs: "12"
      },
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "18",
        berat: "6.0",
        pcs: "18"
      }
    ],
    status: "Open"
  });

  // Open Request 9: Model - Anting Custom
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(8),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ayu")!,
    kategoriBarang: "model",
    jenisProduk: "anting",
    namaProduk: "anting-berlian-bulat",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-mas-rejeki")!,
    waktuKirim: getDaysFromNow(11),
    followUpAction: "Customer review",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "n",
        berat: "2.0",
        pcs: "25"
      }
    ],
    status: "Open"
  });

  // Open Request 10: Basic - Casteli
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(9),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "casteli",
    namaPelanggan: customers.find(c => c.id === "perhiasan-modern")!,
    waktuKirim: getDaysFromNow(14),
    followUpAction: "Size confirmation needed",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "750",
        warna: "m",
        ukuran: "14",
        berat: "3.0",
        pcs: "8"
      },
      {
        id: generateItemId(),
        kadar: "750",
        warna: "m",
        ukuran: "15",
        berat: "3.2",
        pcs: "10"
      },
      {
        id: generateItemId(),
        kadar: "750",
        warna: "m",
        ukuran: "16",
        berat: "3.4",
        pcs: "12"
      }
    ],
    status: "Open"
  });

  // Open Request 11: Basic - Hollow Fancy Nori
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(10),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "hollow-fancy-nori",
    namaPelanggan: customers.find(c => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(7),
    followUpAction: "Urgent - follow up today",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "40",
        berat: "7.5",
        pcs: "5"
      }
    ],
    status: "Open"
  });

  // Open Request 12: Model - Gelang Custom
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(11),
    createdBy: salesUsers[3],
    pabrik: suppliers.find(s => s.id === "yt-gold")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-kaku",
    namaProduk: "gelang-bangle-emas",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(20),
    followUpAction: "Sample production",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "420",
        warna: "k",
        ukuran: "17",
        berat: "15.0",
        pcs: "3"
      },
      {
        id: generateItemId(),
        kadar: "420",
        warna: "m",
        ukuran: "18",
        berat: "16.0",
        pcs: "3"
      }
    ],
    status: "Open"
  });

  // ==========================================
  // 4 STOCKIST PROCESSING
  // ==========================================

  // Stockist Processing 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(12),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-kaca",
    namaPelanggan: customers.find(c => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(5),
    followUpAction: "Stockist checking inventory",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "16",
        berat: "4.5",
        pcs: "12",
        availablePcs: ""
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "k",
        ukuran: "16",
        berat: "4.5",
        pcs: "8",
        availablePcs: ""
      }
    ],
    status: "Stockist Processing"
  });

  // Stockist Processing 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(13),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find(c => c.id === "toko-mas-indah")!,
    waktuKirim: getDaysFromNow(8),
    followUpAction: "Verify stock levels",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "17",
        berat: "6.0",
        pcs: "20",
        availablePcs: ""
      }
    ],
    status: "Stockist Processing"
  });

  // Stockist Processing 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(14),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "mt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "tambang",
    namaPelanggan: customers.find(c => c.id === "perhiasan-permata")!,
    waktuKirim: getDaysFromNow(6),
    followUpAction: "Stock verification in progress",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "420",
        warna: "m",
        ukuran: "15",
        berat: "2.8",
        pcs: "10",
        availablePcs: ""
      },
      {
        id: generateItemId(),
        kadar: "420",
        warna: "m",
        ukuran: "16",
        berat: "3.0",
        pcs: "15",
        availablePcs: ""
      }
    ],
    status: "Stockist Processing"
  });

  // Stockist Processing 4
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(15),
    createdBy: salesUsers[3],
    pabrik: suppliers.find(s => s.id === "hwt")!,
    kategoriBarang: "model",
    jenisProduk: "liontin",
    namaProduk: "liontin-salib-emas",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-emas-berkah")!,
    waktuKirim: getDaysFromNow(10),
    followUpAction: "Check warehouse",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "750",
        warna: "p",
        ukuran: "n",
        berat: "5.0",
        pcs: "6",
        availablePcs: ""
      }
    ],
    status: "Stockist Processing"
  });

  // ==========================================
  // 3 READY STOCK MARKETING (all available)
  // ==========================================

  // Ready Stock 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(16),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "kalung-flexi",
    namaPelanggan: customers.find(c => c.id === "toko-emas-harmoni")!,
    waktuKirim: getDaysFromNow(3),
    followUpAction: "Ready for pickup",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "40",
        berat: "5.0",
        pcs: "10",
        availablePcs: "10"
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "k",
        ukuran: "40",
        berat: "5.0",
        pcs: "8",
        availablePcs: "8"
      }
    ],
    status: "Ready Stock Marketing"
  });

  // Ready Stock 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(17),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "italy-santa",
    namaPelanggan: customers.find(c => c.id === "galeri-emas-nusantara")!,
    waktuKirim: getDaysFromNow(4),
    followUpAction: "All items available",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "18",
        berat: "7.5",
        pcs: "15",
        availablePcs: "15"
      }
    ],
    status: "Ready Stock Marketing"
  });

  // Ready Stock 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(18),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "casteli",
    namaPelanggan: customers.find(c => c.id === "toko-mas-rejeki")!,
    waktuKirim: getDaysFromNow(2),
    followUpAction: "Contact customer for delivery",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "420",
        warna: "m",
        ukuran: "15",
        berat: "3.5",
        pcs: "12",
        availablePcs: "12"
      },
      {
        id: generateItemId(),
        kadar: "420",
        warna: "m",
        ukuran: "16",
        berat: "3.7",
        pcs: "10",
        availablePcs: "10"
      }
    ],
    status: "Ready Stock Marketing"
  });

  // ==========================================
  // 4 REQUESTED TO JB (partial/none available)
  // ==========================================

  // Requested to JB 1 - Partially available
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(19),
    createdBy: salesUsers[3],
    pabrik: suppliers.find(s => s.id === "yt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-bambu",
    namaPelanggan: customers.find(c => c.id === "perhiasan-modern")!,
    waktuKirim: getDaysFromNow(12),
    followUpAction: "Waiting for JB response",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "700",
        warna: "p",
        ukuran: "42",
        berat: "6.5",
        pcs: "20",
        availablePcs: "8"
      },
      {
        id: generateItemId(),
        kadar: "700",
        warna: "k",
        ukuran: "42",
        berat: "6.5",
        pcs: "15",
        availablePcs: "5"
      }
    ],
    status: "Requested to JB"
  });

  // Requested to JB 2 - Completely unavailable
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(20),
    createdBy: salesUsers[0],
    pabrik: suppliers.find(s => s.id === "ubs-gold")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-kaku",
    namaProduk: "gelang-cuff-tebal",
    namaBasic: "",
    namaPelanggan: customers.find(c => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(15),
    followUpAction: "JB to check supplier",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "750",
        warna: "m",
        ukuran: "18",
        berat: "12.0",
        pcs: "10",
        availablePcs: "0"
      }
    ],
    status: "Requested to JB"
  });

  // Requested to JB 3 - Partially available
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(21),
    createdBy: salesUsers[1],
    pabrik: suppliers.find(s => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find(c => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(18),
    followUpAction: "Partial stock - rest with JB",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "14",
        berat: "2.5",
        pcs: "25",
        availablePcs: "10"
      },
      {
        id: generateItemId(),
        kadar: "375",
        warna: "p",
        ukuran: "15",
        berat: "2.6",
        pcs: "20",
        availablePcs: "15"
      }
    ],
    status: "Requested to JB"
  });

  // Requested to JB 4 - Completely unavailable
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(22),
    createdBy: salesUsers[2],
    pabrik: suppliers.find(s => s.id === "ayu")!,
    kategoriBarang: "basic",
    jenisProduk: "anting",
    namaProduk: "",
    namaBasic: "sunny-vanessa",
    namaPelanggan: customers.find(c => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(14),
    followUpAction: "Out of stock - JB sourcing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "420",
        warna: "k",
        ukuran: "n",
        berat: "3.0",
        pcs: "30",
        availablePcs: "0"
      }
    ],
    status: "Requested to JB"
  });

  return orders;
};

// Function to initialize mock data in session storage
export const initializeMockData = () => {
  const existingOrders = sessionStorage.getItem("orders");
  
  // Only initialize if there's no existing data or if user explicitly wants to reset
  if (!existingOrders) {
    const mockOrders = generateMockOrders();
    sessionStorage.setItem("orders", JSON.stringify(mockOrders));
    console.log(`✅ Initialized ${mockOrders.length} mock orders in session storage`);
    return mockOrders;
  } else {
    console.log("📦 Existing orders found, skipping mock data initialization");
    return JSON.parse(existingOrders);
  }
};

// Function to force reset mock data (useful for testing)
export const resetMockData = () => {
  const mockOrders = generateMockOrders();
  sessionStorage.setItem("orders", JSON.stringify(mockOrders));
  console.log(`🔄 Reset and initialized ${mockOrders.length} mock orders`);
  return mockOrders;
};