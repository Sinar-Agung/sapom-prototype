/**
 * Lifecycle Simulator – populates localStorage with requests, orders,
 * and matching notifications that mirror the real creation/editing/approval
 * flow.  All notifications are generated through the helpers in
 * notification-helper.ts so they look exactly like production notifications.
 */

import type { Order, OrderRevision } from "../types/order";
import type { DetailBarangItem, Request } from "../types/request";
import { storeImageDeduped } from "./image-storage";
import {
  getAllNotifications,
  notifyOrderCreated,
  notifyOrderRevised,
  notifyOrderStatusChanged,
  notifyRequestCancelled,
  notifyRequestCreated,
  notifyRequestReviewed,
  notifyRequestStatusChanged,
  notifyRequestViewedByStockist,
} from "./notification-helper";
import { generatePONumber } from "./request-number";
import type { BranchCode } from "./user-data";

// ── image assets ─────────────────────────────────────────────────────────

/** Eagerly import all PNG URLs from assets/images at build time */
const imageModules = import.meta.glob<string>("../../assets/images/*.png", {
  eager: true,
  import: "default",
});
const IMAGE_URLS: string[] = Object.values(imageModules);

/** Fetch an image URL as a base64 data-URL string */
async function fetchImageAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/** Pick a random asset image, store it in IndexedDB, and return its image ID */
async function storeRandomImage(): Promise<string> {
  const url = IMAGE_URLS[Math.floor(Math.random() * IMAGE_URLS.length)];
  const base64 = await fetchImageAsBase64(url);
  return storeImageDeduped(base64, "image/png");
}

// ── helpers ──────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const HR = 3_600_000;
const MIN = 60_000;

/** Short unique tag for this populate batch */
const batchTag = () => Date.now().toString(36);

/** Deterministic id builder */
const uid = (prefix: string, tag: string, i: number) =>
  `${prefix}-sim-${tag}-${i}`;

// ── static lookup data ───────────────────────────────────────────────────

const SUPPLIERS: { id: string; name: string; username: string }[] = [
  { id: "king-halim", name: "King Halim", username: "kh" },
  { id: "ubs-gold", name: "UBS Gold", username: "ub" },
  { id: "lestari-gold", name: "Lestari Gold", username: "le" },
  { id: "yt-gold", name: "YT Gold", username: "yt" },
  { id: "mt-gold", name: "MT Gold", username: "mt" },
  { id: "hwt", name: "HWT", username: "hw" },
  { id: "ayu", name: "Ayu", username: "ay" },
];

const SALES: { username: string; branch: BranchCode }[] = [
  { username: "sales1", branch: "JKT" },
  { username: "sales2", branch: "BDG" },
  { username: "sales3", branch: "SBY" },
  { username: "sales4", branch: "JKT" },
  { username: "sales5", branch: "BDG" },
  { username: "sales6", branch: "SBY" },
];

const STOCKISTS: { username: string; branch: BranchCode }[] = [
  { username: "stockist1", branch: "JKT" },
  { username: "stockist2", branch: "BDG" },
  { username: "stockist3", branch: "SBY" },
  { username: "stockist4", branch: "JKT" },
  { username: "stockist5", branch: "BDG" },
  { username: "stockist6", branch: "SBY" },
];

const JBS: { username: string; branch: BranchCode }[] = [
  { username: "jb1", branch: "JKT" },
  { username: "jb2", branch: "BDG" },
  { username: "jb3", branch: "SBY" },
  { username: "jb4", branch: "JKT" },
  { username: "jb5", branch: "BDG" },
  { username: "jb6", branch: "SBY" },
];

const CUSTOMERS = [
  { id: "toko-emas-sejahtera", name: "Toko Emas Sejahtera" },
  { id: "toko-perhiasan-mulia", name: "Toko Perhiasan Mulia" },
  { id: "perhiasan-permata", name: "Perhiasan Permata" },
  { id: "toko-mas-indah", name: "Toko Mas Indah" },
  { id: "toko-emas-berkah", name: "Toko Emas Berkah" },
  { id: "emas-berlian-jaya", name: "Emas & Berlian Jaya" },
  { id: "galeri-perhiasan-elegan", name: "Galeri Perhiasan Elegan" },
  { id: "perhiasan-cantik", name: "Perhiasan Cantik" },
];

const PRODUCTS = [
  {
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "italy-santa",
  },
  {
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "milano",
  },
  {
    kategoriBarang: "basic",
    jenisProduk: "anting",
    namaProduk: "",
    namaBasic: "sunny-vanessa",
  },
  {
    kategoriBarang: "model",
    jenisProduk: "gelang-rantai",
    namaProduk: "gelang-keroncong",
    namaBasic: "",
  },
  {
    kategoriBarang: "basic",
    jenisProduk: "kalung",
    namaProduk: "",
    namaBasic: "tambang",
  },
  {
    kategoriBarang: "model",
    jenisProduk: "gelang-kaku",
    namaProduk: "gelang-cuff-tebal",
    namaBasic: "",
  },
  {
    kategoriBarang: "basic",
    jenisProduk: "cincin",
    namaProduk: "",
    namaBasic: "italy-kaca",
  },
  {
    kategoriBarang: "model",
    jenisProduk: "anting",
    namaProduk: "anting-berlian-bulat",
    namaBasic: "",
  },
  {
    kategoriBarang: "basic",
    jenisProduk: "liontin",
    namaProduk: "",
    namaBasic: "casteli",
  },
  {
    kategoriBarang: "model",
    jenisProduk: "kalung",
    namaProduk: "kalung-rantai-emas",
    namaBasic: "",
  },
];

const KADAR = ["8k", "9k", "16k", "17k", "24k"];
const WARNA = ["ap", "rg", "kn", "2w-ap-rg", "ks"];
const UKURAN = ["14", "15", "16", "17", "18", "p", "n"];

function makeItem(
  tag: string,
  seed: number,
  overridePcs?: string,
): DetailBarangItem {
  return {
    id: uid("item", tag, seed),
    kadar: KADAR[seed % KADAR.length],
    warna: WARNA[seed % WARNA.length],
    ukuran: UKURAN[seed % UKURAN.length],
    berat: String(3 + (seed % 7)),
    pcs: overridePcs ?? String(5 + (seed % 16)),
    availablePcs: "0",
    orderPcs: overridePcs ?? String(5 + (seed % 16)),
  };
}

function pickStockist(branch: BranchCode): string {
  const match = STOCKISTS.find((s) => s.branch === branch);
  return match?.username ?? "stockist1";
}

function pickJB(branch: BranchCode): string {
  const match = JBS.find((j) => j.branch === branch);
  return match?.username ?? "jb1";
}

// ── Scenario definitions ─────────────────────────────────────────────────
// Each scenario describes how far a request (and possibly its order) should
// progress through the lifecycle.

type RequestEnd =
  | "open" // just created, nothing else
  | "jb-verifying" // stockist viewed → approved → forwarded to JB
  | "requested-to-jb" // same as jb-verifying but status set
  | "rejected" // stockist rejected
  | "cancelled" // sales cancelled
  | "ordered"; // JB wrote an order

type OrderEnd =
  | "new-order"
  | "viewed"
  | "change-pending"
  | "order-revised"
  | "in-production"
  | "stock-ready";

interface Scenario {
  requestEnd: RequestEnd;
  orderEnd?: OrderEnd;
  /** How many days ago the request was created */
  daysAgo: number;
}

const SCENARIOS: Scenario[] = [
  // ── Fresh requests (various stages) ──
  { requestEnd: "open", daysAgo: 1 },
  { requestEnd: "open", daysAgo: 2 },
  { requestEnd: "open", daysAgo: 3 },
  { requestEnd: "jb-verifying", daysAgo: 4 },
  { requestEnd: "jb-verifying", daysAgo: 5 },
  { requestEnd: "requested-to-jb", daysAgo: 6 },
  { requestEnd: "requested-to-jb", daysAgo: 7 },
  // ── Rejected / cancelled ──
  { requestEnd: "rejected", daysAgo: 5 },
  { requestEnd: "cancelled", daysAgo: 3 },
  // ── Ordered → various order stages ──
  { requestEnd: "ordered", orderEnd: "new-order", daysAgo: 8 },
  { requestEnd: "ordered", orderEnd: "viewed", daysAgo: 10 },
  { requestEnd: "ordered", orderEnd: "change-pending", daysAgo: 12 },
  { requestEnd: "ordered", orderEnd: "order-revised", daysAgo: 14 },
  { requestEnd: "ordered", orderEnd: "in-production", daysAgo: 16 },
  { requestEnd: "ordered", orderEnd: "stock-ready", daysAgo: 20 },
];

// ── Main populate function ───────────────────────────────────────────────

export const populateMockData = async (): Promise<{
  requests: number;
  orders: number;
  notifications: number;
}> => {
  const now = Date.now();
  const tag = batchTag();

  // Snapshot notification count before we start
  const notifsBefore = getAllNotifications().length;

  const newRequests: Request[] = [];
  const newOrders: Order[] = [];

  // Pre-generate an image ID for each scenario (all async, run in parallel)
  const photoIds = await Promise.all(SCENARIOS.map(() => storeRandomImage()));

  SCENARIOS.forEach((scenario, i) => {
    const sales = SALES[i % SALES.length];
    const branch = sales.branch;
    const prod = PRODUCTS[i % PRODUCTS.length];
    const sup = SUPPLIERS[i % SUPPLIERS.length];
    const cust = CUSTOMERS[i % CUSTOMERS.length];
    const stockist = pickStockist(branch);
    const jb = pickJB(branch);
    const photoId = photoIds[i];

    // Stagger timestamps so they look realistic
    const createdAt = now - scenario.daysAgo * DAY - i * 37 * MIN; // slight jitter

    // ── Build request ──
    const reqId = uid("req", tag, i);
    const requestNo = generatePONumber(branch, new Date(createdAt), []);

    const request: Request = {
      id: reqId,
      timestamp: createdAt,
      requestNo,
      createdBy: sales.username,
      updatedDate: createdAt,
      updatedBy: sales.username,
      branchCode: branch,
      pabrik: { id: sup.id, name: sup.name },
      namaPelanggan: { id: cust.id, name: cust.name },
      kategoriBarang: prod.kategoriBarang,
      jenisProduk: prod.jenisProduk,
      namaProduk: prod.namaProduk,
      namaBasic: prod.namaBasic,
      photoId,
      waktuKirim: new Date(now + DAY * (20 + i * 3)).toISOString(),
      customerExpectation:
        i % 3 === 0
          ? "ready-marketing"
          : i % 3 === 1
            ? "ready-pabrik"
            : "order-pabrik",
      detailItems: [
        makeItem(tag, i * 3),
        makeItem(tag, i * 3 + 1, String(8 + (i % 10))),
      ],
      status: "Open",
    };

    // Step 1: Request created notification
    notifyRequestCreated(request, sales.username);

    // ── Progress the request through its lifecycle ──

    if (scenario.requestEnd === "cancelled") {
      request.status = "Cancelled";
      request.updatedDate = createdAt + 2 * HR;
      request.updatedBy = sales.username;
      notifyRequestCancelled(request, sales.username);
      newRequests.push(request);
      return; // done with this scenario
    }

    if (scenario.requestEnd === "rejected") {
      // Stockist views it first
      request.status = "JB Verifying";
      request.viewedBy = [stockist];
      request.updatedDate = createdAt + 4 * HR;
      request.updatedBy = stockist;
      notifyRequestViewedByStockist(request, stockist, "Open", "JB Verifying");

      // Stockist rejects
      request.status = "Rejected";
      request.rejectionReason =
        "Stock not available in requested specifications";
      request.updatedDate = createdAt + 6 * HR;
      request.updatedBy = stockist;
      notifyRequestReviewed(request, false, stockist);
      newRequests.push(request);
      return;
    }

    if (scenario.requestEnd === "open") {
      // Just stays Open
      newRequests.push(request);
      return;
    }

    // From here, at least stockist has viewed & approved → JB Verifying
    request.status = "JB Verifying";
    request.viewedBy = [stockist];
    request.updatedDate = createdAt + 3 * HR;
    request.updatedBy = stockist;
    notifyRequestViewedByStockist(request, stockist, "Open", "JB Verifying");

    // Stockist approves
    notifyRequestReviewed(request, true, stockist);

    if (scenario.requestEnd === "jb-verifying") {
      newRequests.push(request);
      return;
    }

    // Forward to JB → "Requested to JB"
    request.status = "Requested to JB";
    request.updatedDate = createdAt + 5 * HR;
    request.updatedBy = stockist;
    notifyRequestStatusChanged(
      request,
      "JB Verifying",
      "Requested to JB",
      stockist,
      "stockist",
    );

    if (scenario.requestEnd === "requested-to-jb") {
      newRequests.push(request);
      return;
    }

    // ── JB writes an order ──
    if (scenario.requestEnd === "ordered" && scenario.orderEnd) {
      const orderCreatedAt = createdAt + 8 * HR;
      const orderId = uid("order", tag, i);
      const PONumber =
        request.requestNo ??
        generatePONumber(branch, new Date(orderCreatedAt), []);

      const order: Order = {
        id: orderId,
        PONumber,
        requestNo: request.requestNo,
        requestId: request.id,
        sales: sales.username,
        atasNama: cust.name,
        createdDate: orderCreatedAt,
        createdBy: jb,
        updatedDate: orderCreatedAt,
        updatedBy: jb,
        jbId: jb,
        branchCode: branch,
        pabrik: { id: sup.id, name: sup.name },
        kategoriBarang: prod.kategoriBarang,
        jenisProduk: prod.jenisProduk,
        namaProduk: prod.namaProduk,
        namaBasic: prod.namaBasic,
        waktuKirim: request.waktuKirim,
        customerExpectation: request.customerExpectation,
        detailItems: [...request.detailItems],
        photoId,
        status: "New Order",
      };

      // Mark request as Ordered
      request.status = "Ordered";
      request.updatedDate = orderCreatedAt;
      request.updatedBy = jb;
      notifyRequestStatusChanged(
        request,
        "Requested to JB",
        "Ordered",
        jb,
        "jb",
        order,
      );

      // Order created notification
      notifyOrderCreated(order, jb);

      // ── Progress order through its lifecycle ──
      const supplierUser = sup.username;

      if (scenario.orderEnd === "new-order") {
        // stays as New Order
      }

      if (
        scenario.orderEnd === "viewed" ||
        scenario.orderEnd === "change-pending" ||
        scenario.orderEnd === "order-revised" ||
        scenario.orderEnd === "in-production" ||
        scenario.orderEnd === "stock-ready"
      ) {
        // Supplier views the order
        order.status = "Supplier Viewed";
        order.viewedBy = [supplierUser];
        order.updatedDate = orderCreatedAt + 4 * HR;
        order.updatedBy = supplierUser;
        notifyOrderStatusChanged(
          order,
          "New Order",
          "Supplier Viewed",
          supplierUser,
          "supplier",
        );
      }

      if (
        scenario.orderEnd === "change-pending" ||
        scenario.orderEnd === "order-revised" ||
        scenario.orderEnd === "in-production" ||
        scenario.orderEnd === "stock-ready"
      ) {
        // Supplier proposes changes → Pending Sales Review
        const revisedItems = [
          ...order.detailItems,
          makeItem(tag, i * 3 + 10, String(3 + (i % 5))),
        ];

        const revision: OrderRevision = {
          revisionNumber: 1,
          timestamp: orderCreatedAt + 8 * HR,
          updatedBy: supplierUser,
          revisionNotes:
            "Adjusted weight and added extra item per supplier capacity",
          changes: {
            kategoriBarang: order.kategoriBarang,
            jenisProduk: order.jenisProduk,
            namaProduk: order.namaProduk,
            namaBasic: order.namaBasic,
            detailItems: revisedItems,
            photoId: order.photoId,
          },
          previousValues: {
            kategoriBarang: order.kategoriBarang,
            jenisProduk: order.jenisProduk,
            namaProduk: order.namaProduk,
            namaBasic: order.namaBasic,
            detailItems: [...order.detailItems],
            photoId: order.photoId,
          },
        };

        order.status = "Pending Sales Review";
        order.revisionHistory = [revision];
        order.revisionNotes = revision.revisionNotes;
        order.detailItems = revisedItems;
        order.updatedDate = orderCreatedAt + 8 * HR;
        order.updatedBy = supplierUser;
        notifyOrderStatusChanged(
          order,
          "Supplier Viewed",
          "Pending Sales Review",
          supplierUser,
          "supplier",
        );
      }

      if (
        scenario.orderEnd === "order-revised" ||
        scenario.orderEnd === "in-production" ||
        scenario.orderEnd === "stock-ready"
      ) {
        // JB approves the revision → Order Revised
        order.status = "Order Revised";
        order.jbApproved = true;
        order.salesApproved = true;
        order.updatedDate = orderCreatedAt + 12 * HR;
        order.updatedBy = jb;
        notifyOrderRevised(order, jb);
        notifyOrderStatusChanged(
          order,
          "Pending Sales Review",
          "Order Revised",
          jb,
          "jb",
        );
      }

      if (
        scenario.orderEnd === "in-production" ||
        scenario.orderEnd === "stock-ready"
      ) {
        // Supplier starts production
        order.status = "In Production";
        order.updatedDate = orderCreatedAt + DAY;
        order.updatedBy = supplierUser;
        notifyOrderStatusChanged(
          order,
          "Order Revised",
          "In Production",
          supplierUser,
          "supplier",
        );
      }

      if (scenario.orderEnd === "stock-ready") {
        // Supplier marks stock ready
        order.status = "Stock Ready";
        order.updatedDate = orderCreatedAt + 3 * DAY;
        order.updatedBy = supplierUser;
        notifyOrderStatusChanged(
          order,
          "In Production",
          "Stock Ready",
          supplierUser,
          "supplier",
        );
      }

      newOrders.push(order);
      newRequests.push(request);
      return;
    }

    newRequests.push(request);
  });

  // ── Merge into localStorage ─────────────────────────────────────────────
  const existingRequests: unknown[] = JSON.parse(
    localStorage.getItem("requests") || "[]",
  );
  localStorage.setItem(
    "requests",
    JSON.stringify([...existingRequests, ...newRequests]),
  );

  const existingOrders: unknown[] = JSON.parse(
    localStorage.getItem("orders") || "[]",
  );
  localStorage.setItem(
    "orders",
    JSON.stringify([...existingOrders, ...newOrders]),
  );

  const notifsAfter = getAllNotifications().length;
  const notifsCreated = notifsAfter - notifsBefore;

  console.log(
    `🧪 Populated: ${newRequests.length} requests, ${newOrders.length} orders, ${notifsCreated} notifications`,
  );

  return {
    requests: newRequests.length,
    orders: newOrders.length,
    notifications: notifsCreated,
  };
};
