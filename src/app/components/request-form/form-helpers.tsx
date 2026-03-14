// Helper utility functions for order form

export const getKadarColor = (kadar: string): string => {
  const colors: Record<string, string> = {
    "6k": "bg-white text-black",
    "8k": "bg-white text-black",
    "9k": "bg-white text-black",
    "16k": "bg-white text-black",
    "17k": "bg-white text-black",
    "24k": "bg-white text-black",
  };
  return colors[kadar.toLowerCase()] || "bg-gray-500 text-white";
};

export const getWarnaColor = (warna: string): string => {
  const colors: Record<string, string> = {
    rg: "bg-rose-300 text-gray-800",
    ap: "bg-gray-200 text-gray-800",
    kn: "bg-yellow-400 text-gray-800",
    ks: "bg-yellow-300 text-gray-800",
    "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
    "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
  };
  return colors[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
};

export const getWarnaLabel = (warna: string): string => {
  const labels: Record<string, string> = {
    rg: "RG",
    ap: "AP",
    kn: "KN",
    ks: "KS",
    "2w-ap-rg": "2W (AP & RG)",
    "2w-ap-kn": "2W (AP & KN)",
  };
  return labels[warna.toLowerCase()] || warna.toUpperCase();
};

export const getUkuranDisplay = (
  ukuran: string,
): { value: string; showUnit: boolean } => {
  const labels: Record<string, string> = {
    a: "Anak",
    n: "Normal",
    p: "Panjang",
    t: "Tanggung",
  };

  // Check if it's a predefined value
  const label = labels[ukuran.toLowerCase()];
  if (label) {
    return { value: label, showUnit: false };
  }

  // Otherwise it's a custom numeric value
  return { value: ukuran, showUnit: true };
};

export const parseBerat = (beratInput: string): string[] => {
  const result: string[] = [];
  const parts = beratInput.split(",").map((p) => p.trim());

  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          result.push(i.toString());
        }
      }
    } else if (part) {
      result.push(part);
    }
  });

  return result;
};
