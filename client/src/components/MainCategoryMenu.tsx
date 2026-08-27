import { ArrowLeft, ChevronRight, Cpu, Gamepad2, House, Laptop, Menu, Package, Shirt, Smartphone, Sparkles, Tv, Utensils, Wrench } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { canonicalCategoryRoute } from "@/lib/verticalCatalog";

type CategoryNode = { id: number; name: string; slug: string; availability?: "ACTIVE" | "COMING_SOON"; children?: CategoryNode[] };

const icons = [
  ["electronics", Tv], ["phones", Smartphone], ["computing", Laptop], ["fashion", Shirt],
  ["beauty", Sparkles], ["services", Wrench], ["food", Utensils], ["accommodation", House],
] as const;

function categoryIcon(slug: string, name: string) {
  const match = icons.find(([key]) => slug.includes(key) || name.toLowerCase().includes(key));
  return match?.[1] ?? Package;
}

function activeCategories(categories: CategoryNode[]) {
  return categories.filter(category => category.availability !== "COMING_SOON");
}

export function MainCategoryMenu({ categories, inline = false }: { categories: CategoryNode[]; inline?: boolean }) {
  const [open, setOpen] = useState(inline);
  const [selectedParent, setSelectedParent] = useState<CategoryNode | null>(null);
  const parents = activeCategories(categories);
  const children = selectedParent ? activeCategories(selectedParent.children ?? []) : [];
  const close = () => { setOpen(false); setSelectedParent(null); };

  return <div className={inline ? "w-full" : "relative"}>
    {!inline ? <button type="button" aria-expanded={open} aria-controls="main-category-menu" onClick={() => { setOpen(value => !value); setSelectedParent(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe3d5] bg-white px-4 text-sm font-extrabold text-[#006b32] shadow-sm transition hover:bg-[#eaf7ef] focus:outline-none focus:ring-2 focus:ring-[#00843d]/40"><Menu size={18}/><span>Categories</span></button> : null}
    {open ? <div id="main-category-menu" role="dialog" aria-label="Main category menu" className={`${inline ? "w-full" : "absolute left-0 top-[calc(100%+0.55rem)] z-50 w-[min(92vw,25rem)] shadow-2xl"} overflow-hidden rounded-2xl border border-slate-200 bg-white`}>
      <div className="border-b border-slate-100 bg-[#f7fbf8] px-4 py-3"><div className="flex items-center justify-between gap-3">{selectedParent ? <button type="button" onClick={() => setSelectedParent(null)} className="inline-flex min-h-9 items-center gap-1 text-sm font-extrabold text-[#006b32] focus:outline-none focus:ring-2 focus:ring-[#00843d]/40"><ArrowLeft size={16}/>All categories</button> : <p className="text-xs font-black uppercase tracking-[.14em] text-[#006b32]">Main categories</p>}{inline ? null : <button type="button" aria-label="Close categories" onClick={close} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-[#006b32] focus:outline-none focus:ring-2 focus:ring-[#00843d]/40">×</button>}</div>{selectedParent ? <p className="mt-1 text-lg font-black text-[#102a43]">{selectedParent.name}</p> : <p className="mt-1 text-sm text-slate-600">Shop from the active ESUT Marketplace departments.</p>}</div>
      <nav className="max-h-[min(70vh,34rem)] overflow-y-auto p-2" aria-label={selectedParent ? `${selectedParent.name} sub-categories` : "Active marketplace categories"}>{(selectedParent ? children : parents).map(category => { const Icon = categoryIcon(category.slug, category.name); const hasChildren = (category.children ?? []).some(child => child.availability !== "COMING_SOON"); return <div key={category.id} className="flex items-center gap-2"><Link href={canonicalCategoryRoute(category)} onClick={close} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-[#253b53] transition hover:bg-[#eaf7ef] hover:text-[#006b32] focus:outline-none focus:ring-2 focus:ring-[#00843d]/40"><Icon size={20} strokeWidth={1.8} className="shrink-0 text-[#006b32]"/><span className="min-w-0 flex-1">{category.name}</span>{!selectedParent && hasChildren ? <ChevronRight size={17} className="shrink-0 text-slate-400"/> : null}</Link>{!selectedParent && hasChildren ? <button type="button" aria-label={`View ${category.name} sub-categories`} onClick={() => setSelectedParent(category)} className="rounded-lg p-2 text-slate-500 hover:bg-[#eaf7ef] hover:text-[#006b32] focus:outline-none focus:ring-2 focus:ring-[#00843d]/40"><ChevronRight size={17}/></button> : null}</div>; })}</nav>
    </div> : null}
  </div>;
}

export function activeCategoryMenuItems(categories: CategoryNode[]) { return activeCategories(categories).map(category => category.slug); }
