window.JNLPhones = {
  fallbackData: {
    common_resolutions: [
      { label: "Android FHD+ 20:9", width: 1080, height: 2400, category: "Android" },
      { label: "Hammer / Android FHD+", width: 1080, height: 2408, category: "Android" },
      { label: "iPhone 15 / 15 Pro", width: 1179, height: 2556, category: "iPhone" }
    ],
    phones: [
      { brand: "Hammer", model: "Construction 2 Thermal 5G", width: 1080, height: 2408, category: "Android", notes: "FHD+" },
      { brand: "Samsung", model: "Galaxy S24", width: 1080, height: 2340, category: "Android", notes: "FHD+" },
      { brand: "Apple", model: "iPhone 15 Pro", width: 1179, height: 2556, category: "iPhone", notes: "Super Retina" }
    ]
  },

  async load() {
    try {
      const response = await fetch("data/phones.json", { cache: "no-store" });
      if (!response.ok) throw new Error("phones.json not found");
      const data = await response.json();
      if (!Array.isArray(data.phones)) throw new Error("Invalid phones.json");
      return data;
    } catch (error) {
      return this.fallbackData;
    }
  },

  labelPhone(phone) {
    const name = `${phone.brand || ""} ${phone.model || ""}`.trim();
    const res = `${phone.width}×${phone.height}`;
    const note = phone.notes ? ` • ${phone.notes}` : "";
    return `${name} — ${res}${note}`;
  },

  labelResolution(item) {
    const category = item.category ? ` • ${item.category}` : "";
    return `${item.label} — ${item.width}×${item.height}${category}`;
  },

  uniqueBrands(phones) {
    return [...new Set(phones.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }
};
