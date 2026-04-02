import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { DetailBarangItem, EntityReference } from "@/app/types/request";
import { useImageMap } from "@/app/utils/image-storage";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  getUkuranDisplay,
  getWarnaColor,
  getWarnaLabel,
} from "../request-form/form-helpers";
import { Card } from "./card";

const NAMA_BASIC_IMAGES: Record<string, string> = {
  "italy-santa": italySanta,
  "italy-kaca": italyKaca,
  "italy-bambu": italyBambu,
  "kalung-flexi": kalungFlexi,
  "sunny-vanessa": sunnyVanessa,
  "hollow-fancy-nori": hollowFancyNori,
  milano: milano,
  tambang: tambang,
  casteli: casteli,
};

const KADAR_COLORS: Record<string, string> = {
  "6k": "bg-green-500 text-white",
  "8k": "bg-blue-500 text-white",
  "9k": "bg-blue-700 text-white",
  "16k": "bg-orange-500 text-white",
  "17k": "bg-pink-500 text-white",
  "24k": "bg-red-500 text-white",
};

function getKadarColor(kadar: string): string {
  return KADAR_COLORS[kadar] || "";
}

export interface RevisionSnapshot {
  pabrik?: EntityReference | string;
  namaPelanggan?: EntityReference | string;
  kategoriBarang?: string;
  jenisProduk?: string;
  namaProduk?: string;
  namaBasic?: string;
  waktuKirim?: string;
  customerExpectation?: string;
  detailItems?: DetailBarangItem[];
  photoId?: string;
}

export interface RevisionEntry {
  revisionNumber: number;
  timestamp: number;
  updatedBy: string;
  revisionNotes?: string;
  changes: RevisionSnapshot;
  previousValues: RevisionSnapshot;
}

interface RevisionHistoryPanelProps {
  title?: string;
  createdTimestamp: number;
  createdBy: string;
  revisions: RevisionEntry[];
  /**
   * Current entity field values, used as fallback when the first revision's
   * previousValues don't contain a field.
   */
  entitySnapshot: RevisionSnapshot;
}

function collectPhotoIds(
  revisions: RevisionEntry[],
  entitySnapshot: RevisionSnapshot,
): (string | undefined | null)[] {
  const ids: (string | undefined | null)[] = [entitySnapshot.photoId];
  for (const rev of revisions) {
    ids.push(rev.changes.photoId, rev.previousValues.photoId);
  }
  return ids;
}

function resolveInitialPhoto(
  kategoriBarang: string | undefined,
  namaBasic: string | undefined,
  photoId: string | undefined,
  imageMap: Map<string, string>,
): string | null {
  if (kategoriBarang === "basic") {
    return NAMA_BASIC_IMAGES[namaBasic || ""] || null;
  }
  return photoId ? (imageMap.get(photoId) ?? null) : null;
}

function DetailItemsRevisionTable({
  items,
  prevItems,
}: {
  items: DetailBarangItem[];
  prevItems?: DetailBarangItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Kadar</th>
            <th className="border px-2 py-1 text-left">Warna</th>
            <th className="border px-2 py-1 text-left">Ukuran</th>
            <th className="border px-2 py-1 text-right">Berat</th>
            <th className="border px-2 py-1 text-right">Pcs</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const prevItem = prevItems?.[idx];
            const isNewItem = !prevItems || idx >= prevItems.length;
            const kadarChanged = prevItem && item.kadar !== prevItem.kadar;
            const warnaChanged = prevItem && item.warna !== prevItem.warna;
            const ukuranChanged = prevItem && item.ukuran !== prevItem.ukuran;
            const beratChanged = prevItem && item.berat !== prevItem.berat;
            const pcsChanged = prevItem && item.pcs !== prevItem.pcs;
            const newRowClass = isNewItem ? "border-4 border-green-500" : "";
            const changedCell = (changed: boolean | typeof prevItem) =>
              changed && !isNewItem
                ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50"
                : "border";
            const ud = getUkuranDisplay(item.ukuran);
            return (
              <tr key={idx} className={newRowClass}>
                <td
                  className={`px-2 py-1 font-medium ${getKadarColor(item.kadar)} ${changedCell(kadarChanged)}`}
                >
                  {item.kadar}
                </td>
                <td
                  className={`px-2 py-1 ${getWarnaColor(item.warna)} ${changedCell(warnaChanged)}`}
                >
                  {getWarnaLabel(item.warna)}
                </td>
                <td className={`px-2 py-1 ${changedCell(ukuranChanged)}`}>
                  {ud.showUnit ? `${ud.value} cm` : ud.value}
                </td>
                <td
                  className={`px-2 py-1 text-right ${changedCell(beratChanged)}`}
                >
                  {item.berat}
                </td>
                <td
                  className={`px-2 py-1 text-right ${changedCell(pcsChanged)}`}
                >
                  {item.pcs}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FieldDiff({
  label,
  prev,
  next,
}: {
  label: string;
  prev: string;
  next: string;
}) {
  return (
    <div>
      <p className="font-medium text-gray-700 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-red-500 line-through text-xs">{prev}</span>
        <span className="text-gray-400">→</span>
        <span className="text-green-700 font-semibold">{next}</span>
      </div>
    </div>
  );
}

export function RevisionHistoryPanel({
  title = "Revision History",
  createdTimestamp,
  createdBy,
  revisions,
  entitySnapshot,
}: RevisionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(
    new Set(),
  );

  const imageMap = useImageMap(collectPhotoIds(revisions, entitySnapshot));

  const toggleEntry = (id: number) => {
    setExpandedRevisions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const firstRevision = revisions[0];

  // Initial snapshot: first revision's previousValues take precedence over current entity values
  const initKategori =
    firstRevision?.previousValues.kategoriBarang ??
    entitySnapshot.kategoriBarang;
  const initJenis =
    firstRevision?.previousValues.jenisProduk ?? entitySnapshot.jenisProduk;
  const initNamaProduk =
    firstRevision?.previousValues.namaProduk ?? entitySnapshot.namaProduk;
  const initNamaBasic =
    firstRevision?.previousValues.namaBasic ?? entitySnapshot.namaBasic;
  const initWaktuKirim =
    firstRevision?.previousValues.waktuKirim ?? entitySnapshot.waktuKirim;
  const initDetailItems =
    firstRevision?.previousValues.detailItems ?? entitySnapshot.detailItems;
  const initPhotoId =
    firstRevision?.previousValues.photoId ?? entitySnapshot.photoId;
  const initPabrik =
    firstRevision?.previousValues.pabrik ?? entitySnapshot.pabrik;
  const initPelanggan =
    firstRevision?.previousValues.namaPelanggan ?? entitySnapshot.namaPelanggan;
  const initCustomerExpectation =
    firstRevision?.previousValues.customerExpectation ??
    entitySnapshot.customerExpectation;

  const initPabrikLabel =
    typeof initPabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, initPabrik)
      : initPabrik?.name || "";
  const initPelangganLabel =
    typeof initPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, initPelanggan)
      : initPelanggan?.name || "";

  const initialPhoto = resolveInitialPhoto(
    initKategori,
    initNamaBasic,
    initPhotoId,
    imageMap,
  );

  return (
    <Card className="p-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-6 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gray-200" />

          <div className="flex flex-col">
            {/* Revision entries — newest first */}
            {[...revisions].reverse().map((revision, revIdx) => {
              const index = revisions.length - 1 - revIdx;
              const isExpanded = expandedRevisions.has(index);

              const etaChanged =
                revision.changes.waktuKirim != null &&
                revision.previousValues.waktuKirim !==
                  revision.changes.waktuKirim;

              const pabrikChanged =
                JSON.stringify(revision.changes.pabrik) !==
                JSON.stringify(revision.previousValues.pabrik);
              const pelangganChanged =
                JSON.stringify(revision.changes.namaPelanggan) !==
                JSON.stringify(revision.previousValues.namaPelanggan);

              const revPabrikLabel =
                typeof revision.changes.pabrik === "string"
                  ? getLabelFromValue(PABRIK_OPTIONS, revision.changes.pabrik)
                  : revision.changes.pabrik?.name || "";
              const prevPabrikLabel =
                typeof revision.previousValues.pabrik === "string"
                  ? getLabelFromValue(
                      PABRIK_OPTIONS,
                      revision.previousValues.pabrik,
                    )
                  : revision.previousValues.pabrik?.name || "";

              const revPelangganLabel =
                typeof revision.changes.namaPelanggan === "string"
                  ? getLabelFromValue(
                      ATAS_NAMA_OPTIONS,
                      revision.changes.namaPelanggan,
                    )
                  : revision.changes.namaPelanggan?.name || "";
              const prevPelangganLabel =
                typeof revision.previousValues.namaPelanggan === "string"
                  ? getLabelFromValue(
                      ATAS_NAMA_OPTIONS,
                      revision.previousValues.namaPelanggan,
                    )
                  : revision.previousValues.namaPelanggan?.name || "";

              // Determine effective kategoriBarang for this revision context
              const revEffectiveKategori =
                revision.changes.kategoriBarang ??
                revision.previousValues.kategoriBarang ??
                entitySnapshot.kategoriBarang;
              const prevKategoriForPhoto =
                revision.previousValues.kategoriBarang ??
                entitySnapshot.kategoriBarang;

              let beforePhotoImg: string | null = null;
              let afterPhotoImg: string | null = null;
              let photoChanged = false;
              let photoSectionVisible = false;

              if (revision.previousValues.photoId || revision.changes.photoId) {
                // Model/custom photo: use imageMap
                beforePhotoImg = revision.previousValues.photoId
                  ? (imageMap.get(revision.previousValues.photoId) ?? null)
                  : null;
                afterPhotoImg = revision.changes.photoId
                  ? (imageMap.get(revision.changes.photoId) ?? null)
                  : null;
                photoChanged =
                  revision.previousValues.photoId !== revision.changes.photoId;
                photoSectionVisible = true;
              } else if (
                revision.changes.namaBasic &&
                revision.changes.namaBasic !==
                  revision.previousValues.namaBasic &&
                (revEffectiveKategori === "basic" ||
                  prevKategoriForPhoto === "basic")
              ) {
                // Basic product: image is derived from namaBasic
                const prevKey =
                  revision.previousValues.namaBasic ??
                  entitySnapshot.namaBasic ??
                  "";
                const nextKey = revision.changes.namaBasic;
                beforePhotoImg = NAMA_BASIC_IMAGES[prevKey] || null;
                afterPhotoImg = NAMA_BASIC_IMAGES[nextKey] || null;
                photoChanged = true;
                photoSectionVisible = !!(beforePhotoImg || afterPhotoImg);
              }

              return (
                <div key={index} className="flex gap-4 pb-6">
                  <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                    <div className="font-medium text-gray-700">
                      {new Date(revision.timestamp).toLocaleDateString(
                        "id-ID",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </div>
                    <div>
                      {new Date(revision.timestamp).toLocaleTimeString(
                        "id-ID",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-400 mt-2 z-10" />
                  </div>

                  <div className="flex-1 pb-2">
                    <button
                      onClick={() => toggleEntry(index)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -ml-2 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Revision #{revision.revisionNumber}
                          {index === revisions.length - 1 && (
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated by{" "}
                          {getFullNameFromUsername(revision.updatedBy)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 border rounded-lg bg-gray-50 p-4 text-sm space-y-3">
                        {/* Revision notes (supplier/JB notes) */}
                        {revision.revisionNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Revision Notes
                            </p>
                            <p className="text-sm text-gray-800">
                              {revision.revisionNotes}
                            </p>
                          </div>
                        )}

                        {/* ETA change */}
                        {etaChanged && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              ETA Change
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-red-600 line-through">
                                {revision.previousValues.waktuKirim
                                  ? new Date(
                                      revision.previousValues.waktuKirim,
                                    ).toLocaleDateString("id-ID")
                                  : "—"}
                              </span>
                              <span className="text-gray-500">→</span>
                              <span className="text-green-700 font-semibold">
                                {new Date(
                                  revision.changes.waktuKirim!,
                                ).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Left: changed fields */}
                          <div className="flex-1 space-y-3">
                            {pabrikChanged &&
                              revision.changes.pabrik != null && (
                                <FieldDiff
                                  label="Supplier"
                                  prev={prevPabrikLabel}
                                  next={revPabrikLabel}
                                />
                              )}
                            {pelangganChanged &&
                              revision.changes.namaPelanggan != null && (
                                <FieldDiff
                                  label="Customer"
                                  prev={prevPelangganLabel}
                                  next={revPelangganLabel}
                                />
                              )}
                            {revision.changes.kategoriBarang &&
                              revision.changes.kategoriBarang !==
                                revision.previousValues.kategoriBarang && (
                                <FieldDiff
                                  label="Product Category"
                                  prev={getLabelFromValue(
                                    [
                                      { value: "basic", label: "Basic" },
                                      { value: "model", label: "Model" },
                                    ],
                                    revision.previousValues.kategoriBarang ||
                                      "",
                                  )}
                                  next={getLabelFromValue(
                                    [
                                      { value: "basic", label: "Basic" },
                                      { value: "model", label: "Model" },
                                    ],
                                    revision.changes.kategoriBarang,
                                  )}
                                />
                              )}
                            {revision.changes.jenisProduk &&
                              revision.changes.jenisProduk !==
                                revision.previousValues.jenisProduk && (
                                <FieldDiff
                                  label="Product Type"
                                  prev={getLabelFromValue(
                                    JENIS_PRODUK_OPTIONS,
                                    revision.previousValues.jenisProduk || "",
                                  )}
                                  next={getLabelFromValue(
                                    JENIS_PRODUK_OPTIONS,
                                    revision.changes.jenisProduk,
                                  )}
                                />
                              )}
                            {revision.changes.namaBasic &&
                              revision.changes.namaBasic !==
                                revision.previousValues.namaBasic && (
                                <FieldDiff
                                  label="Basic Name"
                                  prev={getLabelFromValue(
                                    NAMA_BASIC_OPTIONS,
                                    revision.previousValues.namaBasic || "",
                                  )}
                                  next={getLabelFromValue(
                                    NAMA_BASIC_OPTIONS,
                                    revision.changes.namaBasic,
                                  )}
                                />
                              )}
                            {revision.changes.namaProduk &&
                              revision.changes.namaProduk !==
                                revision.previousValues.namaProduk && (
                                <FieldDiff
                                  label="Nama Produk"
                                  prev={getLabelFromValue(
                                    NAMA_PRODUK_OPTIONS,
                                    revision.previousValues.namaProduk || "",
                                  )}
                                  next={getLabelFromValue(
                                    NAMA_PRODUK_OPTIONS,
                                    revision.changes.namaProduk,
                                  )}
                                />
                              )}
                            {revision.changes.customerExpectation &&
                              revision.changes.customerExpectation !==
                                revision.previousValues.customerExpectation && (
                                <FieldDiff
                                  label="Customer Expectation"
                                  prev={getLabelFromValue(
                                    CUSTOMER_EXPECTATION_OPTIONS,
                                    revision.previousValues
                                      .customerExpectation || "",
                                  )}
                                  next={getLabelFromValue(
                                    CUSTOMER_EXPECTATION_OPTIONS,
                                    revision.changes.customerExpectation,
                                  )}
                                />
                              )}
                          </div>

                          {/* Right: photo before/after */}
                          {photoSectionVisible &&
                            (() => {
                              if (
                                photoChanged &&
                                beforePhotoImg &&
                                afterPhotoImg
                              ) {
                                return (
                                  <div className="flex gap-3 flex-wrap">
                                    <div className="w-36">
                                      <p className="font-medium text-gray-500 text-xs mb-1">
                                        Photo — Before
                                      </p>
                                      <img
                                        src={beforePhotoImg}
                                        alt="Before"
                                        className="w-full h-36 object-cover rounded border border-red-200"
                                      />
                                    </div>
                                    <div className="w-36">
                                      <p className="font-medium text-green-700 text-xs mb-1">
                                        Photo — After
                                      </p>
                                      <img
                                        src={afterPhotoImg}
                                        alt="After"
                                        className="w-full h-36 object-cover rounded border border-green-400"
                                      />
                                    </div>
                                  </div>
                                );
                              }
                              const singleImg = afterPhotoImg || beforePhotoImg;
                              return singleImg ? (
                                <div className="md:w-48">
                                  <p className="font-medium text-gray-700 text-xs mb-2">
                                    Product Photo
                                  </p>
                                  <img
                                    src={singleImg}
                                    alt="Product"
                                    className="w-full h-48 object-cover rounded border"
                                  />
                                </div>
                              ) : null;
                            })()}
                        </div>

                        {/* Detail items with diff highlighting */}
                        {revision.changes.detailItems &&
                          revision.changes.detailItems.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-700 text-xs mb-2">
                                Detail Barang (
                                {revision.changes.detailItems.length} items)
                              </p>
                              <DetailItemsRevisionTable
                                items={revision.changes.detailItems}
                                prevItems={revision.previousValues.detailItems}
                              />
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Initial Version — shown at bottom via order-last */}
            {(() => {
              const isExpanded = expandedRevisions.has(-1);
              return (
                <div className="flex gap-4 pb-6 order-last">
                  <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                    <div className="font-medium text-gray-700">
                      {new Date(createdTimestamp).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div>
                      {new Date(createdTimestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-400 mt-2 z-10" />
                  </div>

                  <div className="flex-1 pb-2">
                    <button
                      onClick={() => toggleEntry(-1)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -ml-2 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">Initial version</p>
                        <p className="text-xs text-gray-500">
                          Created by {getFullNameFromUsername(createdBy)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 border rounded-lg bg-white p-4 text-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Left: fields */}
                          <div className="flex-1 space-y-3">
                            {initPabrikLabel && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Supplier
                                </p>
                                <p className="text-gray-900">
                                  {initPabrikLabel}
                                </p>
                              </div>
                            )}
                            {initPelangganLabel && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Customer
                                </p>
                                <p className="text-gray-900">
                                  {initPelangganLabel}
                                </p>
                              </div>
                            )}
                            {initKategori && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Product Category
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    [
                                      { value: "basic", label: "Basic" },
                                      { value: "model", label: "Model" },
                                    ],
                                    initKategori,
                                  )}
                                </p>
                              </div>
                            )}
                            {initJenis && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Product Type
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    JENIS_PRODUK_OPTIONS,
                                    initJenis,
                                  )}
                                </p>
                              </div>
                            )}
                            {initNamaBasic && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Basic Name
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    NAMA_BASIC_OPTIONS,
                                    initNamaBasic,
                                  )}
                                </p>
                              </div>
                            )}
                            {initNamaProduk && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Nama Produk
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    NAMA_PRODUK_OPTIONS,
                                    initNamaProduk,
                                  )}
                                </p>
                              </div>
                            )}
                            {initWaktuKirim && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  ETA
                                </p>
                                <p className="text-gray-900">
                                  {new Date(initWaktuKirim).toLocaleDateString(
                                    "id-ID",
                                  )}
                                </p>
                              </div>
                            )}
                            {initCustomerExpectation && (
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Customer Expectation
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    CUSTOMER_EXPECTATION_OPTIONS,
                                    initCustomerExpectation,
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right: photo */}
                          {initialPhoto && (
                            <div className="md:w-48">
                              <p className="font-medium text-gray-700 text-xs mb-2">
                                Product Photo
                              </p>
                              <img
                                src={initialPhoto}
                                alt="Initial version"
                                className="w-full h-48 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>

                        {/* Detail items */}
                        {initDetailItems && initDetailItems.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium text-gray-700 text-xs mb-2">
                              Detail Barang ({initDetailItems.length} items)
                            </p>
                            <DetailItemsRevisionTable items={initDetailItems} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </Card>
  );
}
