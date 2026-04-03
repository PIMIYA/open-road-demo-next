/**
 * Canvas generation config: category → geometric shape, tag → color
 * Based on Arnheim visual tension × Heller color psychology
 */

// Tag → Color mapping
export const TAG_COLORS = {
  "視覺藝術": "#C45E3E",
  "新媒體":   "#1BA8C8",
  "說唱":     "#E04428",
  "戲劇":     "#7B3FA0",
  "舞蹈":     "#D9527A",
  "音樂":     "#2A4FA8",
  "設計":     "#4A7B9A",
  "建築":     "#8A8070",
  "元宇宙":   "#6A28C8",
  "出版":     "#B8903A",
  "電影":     "#2E2E38",
  "人文":     "#C08840",
  "科學":     "#2A9068",
};

// Category → Shape type
export const CATEGORY_SHAPES = {
  "展覽":                "scatter",       // scattered circles
  "表演":                "triangle",      // focal triangle
  "課程":                "layers",        // horizontal stacked lines
  "導覽":                "path",          // dashed curved path
  "工作坊":              "pentagon",      // irregular polygon
  "黑客松":              "starburst",     // radial burst
  "研討會／論壇／座談":  "venn",          // overlapping circles
  "研討會 / 論壇 / 座談": "venn",
  "節祭／展會／市集":    "mixed",         // heterogeneous shapes
  "分享會／同好會／見面會": "hub",         // hub-spoke
};

/**
 * Calculate tag weight distribution from NFT array
 * Returns sorted array of { tag, color, weight } (weight = 0..1)
 */
export function calcTagWeights(nfts) {
  const counts = {};
  let total = 0;
  for (const nft of nfts) {
    for (const tag of (nft.tags || [])) {
      counts[tag] = (counts[tag] || 0) + 1;
      total++;
    }
  }
  if (total === 0) return [];
  return Object.entries(counts)
    .map(([tag, count]) => ({
      tag,
      color: TAG_COLORS[tag] || "#888888",
      weight: count / total,
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Calculate category distribution from NFT array
 * Returns sorted array of { category, shape, count }
 */
export function calcCategoryDist(nfts) {
  const counts = {};
  for (const nft of nfts) {
    const cat = nft.category || nft.metadata?.category || "";
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      shape: CATEGORY_SHAPES[category] || "scatter",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
