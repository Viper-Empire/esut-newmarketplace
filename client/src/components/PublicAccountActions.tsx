import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";

const publicStorefrontPaths = ["/", "/explore", "/cart", "/checkout", "/sell"];
export const shouldShowPublicAccountActions = (path: string, isAuthenticated: boolean, loading: boolean) => !loading && !isAuthenticated && (publicStorefrontPaths.includes(path) || path.startsWith("/product/") || path.startsWith("/category/"));

export default function PublicAccountActions() {
  const { isAuthenticated, loading } = useAuth(); const [path] = useLocation();
  if (!shouldShowPublicAccountActions(path, isAuthenticated, loading)) return null;
  return <div className="border-b border-[#00843d]/15 bg-[#ecf9f0]"><div className="page-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-[#14532d]">New here? Create an account to save listings, use your cart, and apply to sell.</p><div className="flex gap-2"><Link href="/login"><Button size="sm" variant="outline" className="border-[#00843d] text-[#006b32] hover:bg-white"><LogIn size={16}/> Log in</Button></Link><Link href="/register"><Button size="sm" className="bg-[#e31b23] hover:bg-[#c9161d]"><UserPlus size={16}/> Create account</Button></Link></div></div></div>;
}
