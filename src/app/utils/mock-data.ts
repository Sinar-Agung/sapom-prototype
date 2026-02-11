// Mock data generator for the jewelry ordering system
// This creates realistic sample data for testing and demonstration

import { Photo, Request } from "../types/request";

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
const generateItemId = () =>
  `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Mock Photo Database
const mockPhotos: Photo[] = [
  {
    id: "photo-001",
    name: "Kalung Emas Putih Premium",
    description: "Kalung desain Italia dengan batu permata",
    category: "kalung",
  },
  {
    id: "photo-002",
    name: "Kalung Emas Kuning Klasik",
    description: "Kalung tradisional dengan tali emas",
    category: "kalung",
  },
  {
    id: "photo-003",
    name: "Gelang Rantai Emas Putih",
    description: "Gelang dengan rantai presisi halus",
    category: "gelang-rantai",
  },
  {
    id: "photo-004",
    name: "Gelang Keroncong Modern",
    description: "Gelang dengan desain keroncong kontemporer",
    category: "gelang-keroncong",
  },
  {
    id: "photo-005",
    name: "Cincin Emas Putih Elegan",
    description: "Cincin dengan desain minimalis modern",
    category: "cincin",
  },
  {
    id: "photo-006",
    name: "Cincin Emas Kuning Bertahtakan",
    description: "Cincin dengan batu mulia pilihan",
    category: "cincin",
  },
  {
    id: "photo-007",
    name: "Anting Emas Putih Berlian",
    description: "Anting dengan desain geometris modern",
    category: "anting",
  },
  {
    id: "photo-008",
    name: "Anting Emas Kuning Tradisional",
    description: "Anting dengan motif batik Indonesia",
    category: "anting",
  },
  {
    id: "photo-009",
    name: "Kalung Panjang Emas Campuran",
    description: "Kalung dengan kombinasi warna emas",
    category: "kalung",
  },
  {
    id: "photo-010",
    name: "Set Perhiasan Lengkap",
    description: "Set kalung, cincin, dan anting koordinasi",
    category: "set",
  },
];

// Mock data generator
export const generateMockOrders = (): Request[] => {
  const orders: Request[] = [];
  const salesUsers = ["sales1", "sales2", "sales3", "sales4"];
  const stockistUsers = ["stockist1", "stockist2"];

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
    { id: "perhiasan-modern", name: "Perhiasan Modern" },
  ];

  const suppliers = [
    { id: "king-halim", name: "King Halim" },
    { id: "ubs-gold", name: "UBS Gold" },
    { id: "lestari-gold", name: "Lestari Gold" },
    { id: "yt-gold", name: "YT Gold" },
    { id: "mt-gold", name: "MT Gold" },
    { id: "hwt", name: "HWT" },
    { id: "ayu", name: "Ayu" },
    { id: "lts-gold", name: "Lotus Gold" },
    { id: "sb-gold", name: "SB Gold" },
    { id: "crm", name: "CRM" },
  ];

  // Open Request 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(5),
    requestNo: "RPO-20260201-0001",
    updatedDate: 1770238055591,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[0],
    photoId: "photo-003",
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-santa",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(7),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "16",
        berat: "5.5",
        pcs: "10",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "ap",
        ukuran: "18",
        berat: "6.0",
        pcs: "15",
      },
    ],
    status: "Open",
  });

  // Open Request 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(4),
    requestNo: "RPO-20260202-0002",
    updatedDate: 1770156075717,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[1],
    photoId: "photo-004",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-rantai",
    namaProduk: "gelang-keroncong",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(10),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "kn",
        ukuran: "18",
        berat: "12.0",
        pcs: "5",
      },
    ],
    status: "Open",
  });

  // Open Request 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(3),
    requestNo: "RPO-20260203-0003",
    updatedDate: 1769759553456,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[2],
    photoId: "photo-005",
    pabrik: suppliers.find((s) => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "kalung-flexi",
    namaPelanggan: customers.find((c) => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(5),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "6k",
        warna: "rg",
        ukuran: "40",
        berat: "3.2",
        pcs: "20",
      },
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "rg",
        ukuran: "45",
        berat: "3.5",
        pcs: "25",
      },
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "rg",
        ukuran: "40",
        berat: "3.3",
        pcs: "10",
      },
    ],
    status: "Open",
  });

  // Open Request 4
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(2),
    requestNo: "RPO-20260204-0004",
    updatedDate: 1769812380438,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[3],
    photoId: "photo-006",
    pabrik: suppliers.find((s) => s.id === "yt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-indah")!,
    waktuKirim: getDaysFromNow(12),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "15",
        berat: "2.5",
        pcs: "8",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "16",
        berat: "2.6",
        pcs: "12",
      },
    ],
    status: "Open",
  });

  // Open Request 5
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    requestNo: "RPO-20260205-0005",
    updatedDate: 1769799199817,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[0],
    photoId: "photo-007",
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "italy-bambu",
    namaPelanggan: customers.find((c) => c.id === "perhiasan-permata")!,
    waktuKirim: getDaysFromNow(8),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "rg",
        ukuran: "18",
        berat: "10.0",
        pcs: "6",
      },
    ],
    status: "Open",
  });

  // Open Request 6
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    requestNo: "RPO-20260205-0006",
    updatedDate: 1769432858172,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[1],
    photoId: "photo-008",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "model",
    jenisProduk: "liontin",
    namaProduk: "liontin-heart-love",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-berkah")!,
    waktuKirim: getDaysFromNow(15),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "kn",
        ukuran: "n",
        berat: "4.5",
        pcs: "10",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "n",
        berat: "4.5",
        pcs: "10",
      },
    ],
    status: "Open",
  });

  // Open Request 7
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(6),
    requestNo: "RPO-20260131-0007",
    updatedDate: 1769455151169,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[2],
    photoId: "photo-009",
    pabrik: suppliers.find((s) => s.id === "mt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "tambang",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-harmoni")!,
    waktuKirim: getDaysFromNow(6),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "rg",
        ukuran: "42",
        berat: "8.0",
        pcs: "15",
      },
    ],
    status: "Open",
  });

  // Open Request 8
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(7),
    requestNo: "RPO-20260130-0008",
    updatedDate: 1769545011219,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[3],
    photoId: "photo-010",
    pabrik: suppliers.find((s) => s.id === "hwt")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "sunny-vanessa",
    namaPelanggan: customers.find((c) => c.id === "galeri-emas-nusantara")!,
    waktuKirim: getDaysFromNow(9),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "6k",
        warna: "rg",
        ukuran: "17",
        berat: "5.5",
        pcs: "12",
      },
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "rg",
        ukuran: "18",
        berat: "6.0",
        pcs: "18",
      },
    ],
    status: "Open",
  });

  // Open Request 9
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(8),
    requestNo: "RPO-20260129-0009",
    updatedDate: 1769120685303,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[0],
    photoId: "photo-001",
    pabrik: suppliers.find((s) => s.id === "ayu")!,
    kategoriBarang: "model",
    jenisProduk: "anting",
    namaProduk: "anting-berlian-bulat",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-rejeki")!,
    waktuKirim: getDaysFromNow(11),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "n",
        berat: "2.0",
        pcs: "25",
      },
    ],
    status: "Open",
  });

  // Open Request 10
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(9),
    requestNo: "RPO-20260128-0010",
    updatedDate: 1769141583919,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[1],
    photoId: "photo-002",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "casteli",
    namaPelanggan: customers.find((c) => c.id === "perhiasan-modern")!,
    waktuKirim: getDaysFromNow(14),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "ap",
        ukuran: "14",
        berat: "3.0",
        pcs: "8",
      },
      {
        id: generateItemId(),
        kadar: "24k",
        warna: "ap",
        ukuran: "15",
        berat: "3.2",
        pcs: "10",
      },
      {
        id: generateItemId(),
        kadar: "24k",
        warna: "ap",
        ukuran: "16",
        berat: "3.4",
        pcs: "12",
      },
    ],
    status: "Open",
  });

  // Open Request 11
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(10),
    requestNo: "RPO-20260127-0011",
    updatedDate: 1769087661483,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[2],
    photoId: "photo-003",
    pabrik: suppliers.find((s) => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "hollow-fancy-nori",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(7),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "40",
        berat: "7.5",
        pcs: "5",
      },
    ],
    status: "Open",
  });

  // Open Request 12
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(11),
    requestNo: "RPO-20260126-0012",
    updatedDate: 1768793577938,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[3],
    photoId: "photo-004",
    pabrik: suppliers.find((s) => s.id === "yt-gold")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-kaku",
    namaProduk: "gelang-bangle-emas",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(20),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "kn",
        ukuran: "17",
        berat: "15.0",
        pcs: "3",
      },
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "ap",
        ukuran: "18",
        berat: "16.0",
        pcs: "3",
      },
    ],
    status: "Open",
  });

  // Stockist Processing 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(12),
    requestNo: "RPO-20260125-0013",
    updatedDate: 1768850816562,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[0],
    photoId: "photo-005",
    stockistId: stockistUsers[0],
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-kaca",
    namaPelanggan: customers.find((c) => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(5),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "16",
        berat: "4.5",
        pcs: "12",
        availablePcs: "",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "kn",
        ukuran: "16",
        berat: "4.5",
        pcs: "8",
        availablePcs: "",
      },
    ],
    status: "Stockist Processing",
  });

  // Stockist Processing 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(13),
    requestNo: "RPO-20260124-0014",
    updatedDate: 1768804928883,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[1],
    photoId: "photo-006",
    stockistId: stockistUsers[1],
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-indah")!,
    waktuKirim: getDaysFromNow(8),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "6k",
        warna: "rg",
        ukuran: "17",
        berat: "6.0",
        pcs: "20",
        availablePcs: "",
      },
    ],
    status: "Stockist Processing",
  });

  // Stockist Processing 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(14),
    requestNo: "RPO-20260123-0015",
    updatedDate: 1768489027261,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[2],
    photoId: "photo-007",
    stockistId: stockistUsers[0],
    pabrik: suppliers.find((s) => s.id === "mt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "tambang",
    namaPelanggan: customers.find((c) => c.id === "perhiasan-permata")!,
    waktuKirim: getDaysFromNow(6),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "ap",
        ukuran: "15",
        berat: "2.8",
        pcs: "10",
        availablePcs: "",
      },
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "ap",
        ukuran: "16",
        berat: "3.0",
        pcs: "15",
        availablePcs: "",
      },
    ],
    status: "Stockist Processing",
  });

  // Stockist Processing 4
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(15),
    requestNo: "RPO-20260122-0016",
    updatedDate: 1768486279272,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[3],
    photoId: "photo-008",
    stockistId: stockistUsers[1],
    pabrik: suppliers.find((s) => s.id === "hwt")!,
    kategoriBarang: "model",
    jenisProduk: "liontin",
    namaProduk: "liontin-salib-emas",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-berkah")!,
    waktuKirim: getDaysFromNow(10),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "24k",
        warna: "rg",
        ukuran: "n",
        berat: "5.0",
        pcs: "6",
        availablePcs: "",
      },
    ],
    status: "Stockist Processing",
  });

  // Ready Stock 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(16),
    requestNo: "RPO-20260121-0017",
    updatedDate: 1768507011572,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[0],
    photoId: "photo-009",
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "kalung-flexi",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-harmoni")!,
    waktuKirim: getDaysFromNow(3),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "40",
        berat: "5.0",
        pcs: "10",
        availablePcs: "10",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "kn",
        ukuran: "40",
        berat: "5.0",
        pcs: "8",
        availablePcs: "8",
      },
    ],
    status: "Ready Stock Marketing",
  });

  // Ready Stock 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(17),
    requestNo: "RPO-20260120-0018",
    updatedDate: 1768054848696,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[1],
    photoId: "photo-010",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "gelang-rantai",
    namaProduk: "",
    namaBasic: "italy-santa",
    namaPelanggan: customers.find((c) => c.id === "galeri-emas-nusantara")!,
    waktuKirim: getDaysFromNow(4),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "6k",
        warna: "rg",
        ukuran: "18",
        berat: "7.5",
        pcs: "15",
        availablePcs: "15",
      },
    ],
    status: "Ready Stock Marketing",
  });

  // Ready Stock 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(18),
    requestNo: "RPO-20260119-0019",
    updatedDate: 1768061245139,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[2],
    photoId: "photo-001",
    pabrik: suppliers.find((s) => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "casteli",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-rejeki")!,
    waktuKirim: getDaysFromNow(2),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "ap",
        ukuran: "15",
        berat: "3.5",
        pcs: "12",
        availablePcs: "12",
      },
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "ap",
        ukuran: "16",
        berat: "3.7",
        pcs: "10",
        availablePcs: "10",
      },
    ],
    status: "Ready Stock Marketing",
  });

  // Requested to JB 1
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(19),
    requestNo: "RPO-20260118-0020",
    updatedDate: 1768143958427,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[3],
    photoId: "photo-002",
    pabrik: suppliers.find((s) => s.id === "yt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-bambu",
    namaPelanggan: customers.find((c) => c.id === "perhiasan-modern")!,
    waktuKirim: getDaysFromNow(12),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "42",
        berat: "6.5",
        pcs: "20",
        availablePcs: "8",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "kn",
        ukuran: "42",
        berat: "6.5",
        pcs: "15",
        availablePcs: "5",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB 2
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(20),
    requestNo: "RPO-20260117-0021",
    updatedDate: 1767753615148,
    updatedBy: stockistUsers[2],
    createdBy: salesUsers[0],
    photoId: "photo-003",
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-kaku",
    namaProduk: "gelang-cuff-tebal",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(15),
    customerExpectation: "ready-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "24k",
        warna: "ap",
        ukuran: "18",
        berat: "12.0",
        pcs: "10",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB 3
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(21),
    requestNo: "RPO-20260116-0022",
    updatedDate: 1767782907414,
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[1],
    photoId: "photo-004",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find((c) => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(18),
    customerExpectation: "ready-marketing",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "rg",
        ukuran: "14",
        berat: "2.5",
        pcs: "25",
        availablePcs: "10",
      },
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "rg",
        ukuran: "15",
        berat: "2.6",
        pcs: "20",
        availablePcs: "15",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB 4
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(22),
    requestNo: "RPO-20260115-0023",
    updatedDate: 1767722916901,
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[2],
    photoId: "photo-005",
    pabrik: suppliers.find((s) => s.id === "ayu")!,
    kategoriBarang: "basic",
    jenisProduk: "anting",
    namaProduk: "",
    namaBasic: "sunny-vanessa",
    namaPelanggan: customers.find((c) => c.id === "emas-berlian-jaya")!,
    waktuKirim: getDaysFromNow(14),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "kn",
        ukuran: "n",
        berat: "3.0",
        pcs: "30",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 1 - Kalung Italy Santa
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(2),
    requestNo: "RPO-20260209-0021",
    updatedDate: getTimestampDaysAgo(1),
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[0],
    photoId: "photo-001",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-santa",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-sejahtera")!,
    waktuKirim: getDaysFromNow(15),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "18",
        berat: "5.2",
        pcs: "12",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "16",
        berat: "4.8",
        pcs: "15",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "kn",
        ukuran: "18",
        berat: "5.5",
        pcs: "10",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 2 - Gelang Keroncong
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(3),
    requestNo: "RPO-20260208-0022",
    updatedDate: getTimestampDaysAgo(2),
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[1],
    photoId: "photo-004",
    pabrik: suppliers.find((s) => s.id === "ubs-gold")!,
    kategoriBarang: "model",
    jenisProduk: "gelang-keroncong",
    namaProduk: "gelang-modern",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-perhiasan-mulia")!,
    waktuKirim: getDaysFromNow(18),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "2w-ap-rg",
        ukuran: "16",
        berat: "8.5",
        pcs: "8",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "18",
        berat: "9.2",
        pcs: "6",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 3 - Kalung Flexi
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    requestNo: "RPO-20260210-0023",
    updatedDate: getTimestampDaysAgo(0),
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[2],
    photoId: "photo-002",
    pabrik: suppliers.find((s) => s.id === "lestari-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "kalung-flexi",
    namaPelanggan: customers.find((c) => c.id === "galeri-emas-nusantara")!,
    waktuKirim: getDaysFromNow(12),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "kn",
        ukuran: "16",
        berat: "4.5",
        pcs: "20",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "kn",
        ukuran: "18",
        berat: "5.0",
        pcs: "18",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "ap",
        ukuran: "16",
        berat: "4.3",
        pcs: "15",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "18",
        berat: "4.8",
        pcs: "12",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 4 - Cincin
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(2),
    requestNo: "RPO-20260209-0024",
    updatedDate: getTimestampDaysAgo(1),
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[3],
    photoId: "photo-005",
    pabrik: suppliers.find((s) => s.id === "yt-gold")!,
    kategoriBarang: "model",
    jenisProduk: "cincin",
    namaProduk: "cincin-berlian",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-indah")!,
    waktuKirim: getDaysFromNow(20),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "24k",
        warna: "kn",
        ukuran: "n",
        berat: "2.5",
        pcs: "25",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "n",
        berat: "2.0",
        pcs: "30",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "rg",
        ukuran: "n",
        berat: "2.2",
        pcs: "28",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 5 - Milano
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(3),
    requestNo: "RPO-20260208-0025",
    updatedDate: getTimestampDaysAgo(2),
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[0],
    photoId: "photo-009",
    pabrik: suppliers.find((s) => s.id === "mt-gold")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "milano",
    namaPelanggan: customers.find((c) => c.id === "perhiasan-permata")!,
    waktuKirim: getDaysFromNow(16),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "2w-ap-kn",
        ukuran: "16",
        berat: "6.0",
        pcs: "14",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "kn",
        ukuran: "18",
        berat: "6.5",
        pcs: "12",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 6 - Anting
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    requestNo: "RPO-20260210-0026",
    updatedDate: getTimestampDaysAgo(0),
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[1],
    photoId: "photo-007",
    pabrik: suppliers.find((s) => s.id === "hwt")!,
    kategoriBarang: "model",
    jenisProduk: "anting",
    namaProduk: "anting-tusuk",
    namaBasic: "",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-berkah")!,
    waktuKirim: getDaysFromNow(14),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "n",
        berat: "1.8",
        pcs: "40",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "kn",
        ukuran: "n",
        berat: "2.0",
        pcs: "35",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "rg",
        ukuran: "n",
        berat: "1.9",
        pcs: "38",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 7 - Tambang
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(2),
    requestNo: "RPO-20260209-0027",
    updatedDate: getTimestampDaysAgo(1),
    updatedBy: stockistUsers[0],
    createdBy: salesUsers[2],
    photoId: "photo-001",
    pabrik: suppliers.find((s) => s.id === "ayu")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "tambang",
    namaPelanggan: customers.find((c) => c.id === "toko-emas-harmoni")!,
    waktuKirim: getDaysFromNow(17),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "2w-ap-rg",
        ukuran: "16",
        berat: "7.5",
        pcs: "10",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "17k",
        warna: "ap",
        ukuran: "18",
        berat: "8.0",
        pcs: "8",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "16k",
        warna: "kn",
        ukuran: "16",
        berat: "7.2",
        pcs: "12",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  // Requested to JB Request 8 - Casteli
  orders.push({
    id: generateId(),
    timestamp: getTimestampDaysAgo(1),
    requestNo: "RPO-20260210-0028",
    updatedDate: getTimestampDaysAgo(0),
    updatedBy: stockistUsers[1],
    createdBy: salesUsers[3],
    photoId: "photo-002",
    pabrik: suppliers.find((s) => s.id === "king-halim")!,
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "casteli",
    namaPelanggan: customers.find((c) => c.id === "toko-mas-rejeki")!,
    waktuKirim: getDaysFromNow(19),
    customerExpectation: "order-pabrik",
    detailItems: [
      {
        id: generateItemId(),
        kadar: "8k",
        warna: "ap",
        ukuran: "16",
        berat: "5.8",
        pcs: "16",
        availablePcs: "0",
      },
      {
        id: generateItemId(),
        kadar: "9k",
        warna: "kn",
        ukuran: "18",
        berat: "6.2",
        pcs: "14",
        availablePcs: "0",
      },
    ],
    status: "Requested to JB",
  });

  return orders;
};

export const initializeMockData = () => {
  const existingOrders = localStorage.getItem("requests");

  if (!existingOrders) {
    const mockOrders = generateMockOrders();
    localStorage.setItem("requests", JSON.stringify(mockOrders));
    console.log(
      `✅ Initialized ${mockOrders.length} mock orders in session storage`,
    );
    return mockOrders;
  } else {
    console.log("📦 Existing orders found, skipping mock data initialization");
    return JSON.parse(existingOrders);
  }
};

export const resetMockData = () => {
  const mockOrders = generateMockOrders();
  localStorage.setItem("requests", JSON.stringify(mockOrders));
  console.log(`🔄 Reset and initialized ${mockOrders.length} mock orders`);
  return mockOrders;
};

// Export photo database
export const getPhotoDatabase = (): Photo[] => mockPhotos;

export const getPhotoById = (photoId: string): Photo | undefined => {
  return mockPhotos.find((photo) => photo.id === photoId);
};
