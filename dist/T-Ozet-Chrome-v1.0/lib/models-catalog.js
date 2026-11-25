/**
 * Yapısal Format Seçenekleri ve Dinamik Prompt Üreticisi
 */
export const STRUCTURAL_OPTIONS = [
  { id: "bullets", label: "📌 Maddeler", desc: "Önemli noktaları 3-5 maddede listeler", default: true },
  { id: "bold", label: "✒️ Kalın Vurgu", desc: "Kilit kelimeleri ve sayıları kalın yapar", default: true },
  { id: "takeaway", label: "💡 Ana Çıkarım", desc: "En sona tek satırlık sonuç/çıkarım ekler", default: true },
  { id: "table", label: "📊 Tablo", desc: "Verileri ve durumları Markdown tablosuna döker", default: false },
  { id: "headings", label: "🏷️ Başlıklar", desc: "Hiyerarşik ## bölüm başlıkları kullanır", default: false }
];

export const SUMMARY_PROMPTS = {
  twosentence: { id: "twosentence", title: "⚡ 2 Cümlede Özet" },
  bullets: { id: "bullets", title: "📌 Madde Madde" },
  news: { id: "news", title: "📰 Haber 5N1K" },
  forum: { id: "forum", title: "💬 Forum Analizi" }
};