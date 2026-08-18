import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;
  return <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
    <Card className="mx-4 w-full max-w-lg border-0 bg-white/90 shadow-lg backdrop-blur-sm dark:bg-slate-900/90">
      <CardContent className="pb-8 pt-8 text-center">
        <div className="mb-6 flex justify-center"><div className="relative"><div className="absolute inset-0 animate-pulse rounded-full bg-red-100 dark:bg-red-950/60" /><AlertCircle className="relative h-16 w-16 text-red-500" /></div></div>
        <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">404</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-200">Page not found</h1>
        <p className="mb-8 mt-4 leading-relaxed text-slate-600 dark:text-slate-400">Sorry, the page you are looking for does not exist or may have moved. Use one of the safe routes below to continue.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {canGoBack && <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Go back</Button>}
          <Button onClick={() => setLocation("/")} className="bg-[#00843d] text-white hover:bg-[#006b32]"><Home className="mr-2 h-4 w-4" />Marketplace home</Button>
          <Link href="/explore"><Button variant="ghost">Browse products</Button></Link>
        </div>
      </CardContent>
    </Card>
  </div>;
}
