import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMarketplaceEventRefresh } from "@/hooks/useMarketplaceEventRefresh";
import PublicAccountActions from "@/components/PublicAccountActions";
import ContextualNavigation from "@/components/ContextualNavigation";
import AdminControlCenterNav from "@/components/AdminControlCenterNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import { ContactPage, PrivacyPage, SupportPage, TermsPage } from "@/pages/PublicUtilityPages";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";

const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const SellPage = lazy(() => import("@/pages/SellPage"));
const SellerDashboardPage = lazy(() => import("@/pages/SellerDashboardPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AdminVerificationsPage = lazy(() => import("@/pages/AdminVerificationsPage"));
const AdminReservationExpiryPage = lazy(() => import("@/pages/AdminReservationExpiryPage"));
const AdminRecoveryPage = lazy(() => import("@/pages/AdminRecoveryPage"));
const NotificationSettingsPage = lazy(() => import("@/pages/NotificationSettingsPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const ModeratorPage = lazy(() => import("@/pages/ModeratorPage"));
const StorePage = lazy(() => import("@/pages/StorePage"));
const ForgotPasswordPage = lazy(() => import("@/pages/PasswordRecoveryPage").then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/PasswordRecoveryPage").then(module => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("@/pages/PasswordRecoveryPage").then(module => ({ default: module.VerifyEmailPage })));
const AccountSecurityPage = lazy(() => import("@/pages/AccountSecurityPage"));
const AdminSecurityHealthPage = lazy(() => import("@/pages/AdminSecurityHealthPage"));
const AccountProfileMediaPage = lazy(() => import("@/pages/AccountProfileMediaPage"));
const BuyerOrdersPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.BuyerOrdersPage })));
const BuyerOrderDetailPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.BuyerOrderDetailPage })));
const SellerOrdersPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.SellerOrdersPage })));
const SellerOrderDetailPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.SellerOrderDetailPage })));
const AdminOrdersPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import("@/pages/OrderPages").then(module => ({ default: module.AdminOrderDetailPage })));
const SellerAnalyticsPage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerAnalyticsPage })));
const SellerInventoryPage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerInventoryPage })));
const SellerProductEvidencePage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerProductEvidencePage })));
const SellerProductFormPage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerProductFormPage })));
const SellerProductsPage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerProductsPage })));
const SellerStorePage = lazy(() => import("@/pages/SellerManagePages").then(module => ({ default: module.SellerStorePage })));
const AccountSettingsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.AccountSettingsPage })));
const AccountSupportPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.AccountSupportPage })));
const AccountVerificationPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.AccountVerificationPage })));
const BuyerFavoritesPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.BuyerFavoritesPage })));
const BuyerOffersPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.BuyerOffersPage })));
  const BuyerReminderDashboardPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.BuyerReminderDashboardPage })));
  const BuyerSearchAlertsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.BuyerSearchAlertsPage })));
const BuyerReviewsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.BuyerReviewsPage })));
const MessagesPage = lazy(() => import("@/pages/MarketplaceMessagesPage").then(module => ({ default: module.MarketplaceMessagesPage })));
const NotificationsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.NotificationsPage })));
const ProfilePage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.ProfilePage })));
const SellerOffersPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.SellerOffersPage })));
const SellerReviewsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.SellerReviewsPage })));
const SellerSettingsPage = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.SellerSettingsPage })));
const VerifiedSellerRouteGate = lazy(() => import("@/pages/AccountFeaturePages").then(module => ({ default: module.VerifiedSellerRouteGate })));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminAnalyticsPage })));
const AdminAuditLogsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminAuditLogsPage })));
const AdminCategoriesPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminCategoriesPage })));
const AdminDisputesPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminDisputesPage })));
const AdminListingsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminListingsPage })));
const AdminNotificationsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminNotificationsPage })));
const AdminOffersPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminOffersPage })));
const AdminReportsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminReportsPage })));
const AdminReviewsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminReviewsPage })));
const AdminSellersPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminSellersPage })));
const AdminSettingsPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminSettingsPage })));
const AdminStoresPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminStoresPage })));
const AdminUserDetailPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminUserDetailPage })));
const AdminUsersPage = lazy(() => import("@/pages/AdminSuitePages").then(module => ({ default: module.AdminUsersPage })));
const AdminOperationsPage = lazy(() => import("@/pages/AdminControlPlanePages").then(module => ({ default: module.AdminOperationsPage })));
const AdminStaffPage = lazy(() => import("@/pages/AdminControlPlanePages").then(module => ({ default: module.AdminStaffPage })));

function NoticePage({ title, copy }: { title: string; copy: string }) {
  return <main className="page-shell py-20"><p className="eyebrow text-[#00843d]">ESUT MARKETPLACE</p><h1 className="mt-3 text-4xl font-extrabold">{title}</h1><p className="mt-4 max-w-xl text-slate-600">{copy}</p><Link href="/"><Button className="mt-7 bg-[#e31b23]">Return to marketplace</Button></Link></main>;
}

function ActiveWorkspaceEventRefresh() {
  const { user } = useAuth();
  useMarketplaceEventRefresh(user?.role);
  return null;
}

function App() {
  const [location] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const pathname = location.split("?")[0] || "/";
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminWorkspace = isAdminRoute && !authLoading && ["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");

  useEffect(() => {
    const pathname = location.split("?")[0] || "/";
    const metadata = pathname === "/" ? { title: "ESUT Marketplace | Buy. Sell. Connect.", description: "Shop products and services from verified ESUT sellers with convenient campus pickup." }
      : pathname === "/explore" || pathname.startsWith("/category/") ? { title: "Browse listings — ESUT Marketplace", description: "Find available products and services from the ESUT community." }
      : pathname === "/esutchop" ? { title: "ESUT Chop — Coming Soon | ESUT Marketplace", description: "ESUT Chop is being prepared for the ESUT community." }
      : pathname === "/accommodation" ? { title: "Accommodation — Coming Soon | ESUT Marketplace", description: "ESUT Accommodation is being prepared for the ESUT community." }
      : pathname.startsWith("/product/") ? { title: "Product — ESUT Marketplace", description: "Review listing details, seller context, availability, and campus-pickup information." }
      : pathname.startsWith("/store/") ? { title: "Store — ESUT Marketplace", description: "Browse a verified ESUT Marketplace seller store and its active listings." }
      : pathname === "/terms" ? { title: "Terms — ESUT Marketplace", description: "Read the current ESUT Marketplace product-policy terms outline." }
      : pathname === "/privacy" ? { title: "Privacy — ESUT Marketplace", description: "Read how ESUT Marketplace handles account, order, security, and public media information." }
      : pathname === "/support" ? { title: "Support — ESUT Marketplace", description: "Find the safest support route for ESUT Marketplace account, order, and safety questions." }
      : pathname === "/contact" ? { title: "Contact — ESUT Marketplace", description: "Choose a protected contact route for ESUT Marketplace questions and reports." }
      : { title: "ESUT Marketplace", description: "Buy. Sell. Connect. Right from ESUT." };
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `https://esutshop-59wzg8bs.manus.space${pathname}`;
  }, [location]);

  useEffect(() => {
    try { window.localStorage.removeItem("esut-marketplace-theme"); } catch { /* Storage access is optional. */ }
    const root = document.documentElement;
    root.classList.remove("dark");
    delete root.dataset.theme;
    root.style.colorScheme = "light";
  }, []);

  return <ErrorBoundary><a className="skip-link" href="#main-content">Skip to page content</a><Toaster/><ActiveWorkspaceEventRefresh/>{!isAdminRoute && <><PublicAccountActions/><ContextualNavigation/></>}<AdminControlCenterNav/><div className={isAdminWorkspace ? "admin-app-frame" : undefined}><div className={isAdminWorkspace ? "admin-app-content" : undefined}><div id="main-content" tabIndex={-1}><Suspense fallback={<main className="page-shell py-16 text-center text-slate-500" role="status">Loading workspace…</main>}><Switch>
    <Route path="/" component={Home}/>
    <Route path="/login">{() => <AuthPage mode="login"/>}</Route>
    <Route path="/register">{() => <AuthPage mode="register"/>}</Route>
    <Route path="/forgot-password" component={ForgotPasswordPage}/>
    <Route path="/reset-password" component={ResetPasswordPage}/>
    <Route path="/verify-email" component={VerifyEmailPage}/>
    <Route path="/terms" component={TermsPage}/>
    <Route path="/privacy" component={PrivacyPage}/>
    <Route path="/support" component={SupportPage}/>
    <Route path="/contact" component={ContactPage}/>
    <Route path="/account" component={AccountPage}/>
    <Route path="/account/orders" component={BuyerOrdersPage}/>
    <Route path="/account/orders/:id" component={BuyerOrderDetailPage}/>
    <Route path="/account/favorites" component={BuyerFavoritesPage}/>
    <Route path="/account/reminders" component={BuyerReminderDashboardPage}/>
    <Route path="/account/search-alerts" component={BuyerSearchAlertsPage}/>
    <Route path="/account/offers" component={BuyerOffersPage}/>
    <Route path="/account/messages">{() => <MessagesPage/>}</Route>
    <Route path="/account/messages/:id">{() => <MessagesPage/>}</Route>
    <Route path="/account/notifications" component={NotificationsPage}/>
    <Route path="/account/reviews" component={BuyerReviewsPage}/>
    <Route path="/account/support" component={AccountSupportPage}/>
    <Route path="/account/verification" component={AccountVerificationPage}/>
    <Route path="/account/profile" component={ProfilePage}/>
    <Route path="/account/profile-photo" component={AccountProfileMediaPage}/>
    <Route path="/account/security" component={AccountSecurityPage}/>
    <Route path="/account/settings" component={AccountSettingsPage}/>
    <Route path="/product/:slug" component={ProductPage}/>
    <Route path="/store/:slug" component={StorePage}/>
    <Route path="/cart" component={CartPage}/>
    <Route path="/checkout" component={CheckoutPage}/>
    <Route path="/explore" component={ExplorePage}/>
    <Route path="/esutchop"><Redirect to="/category/food"/></Route>
    <Route path="/accommodation"><Redirect to="/category/accommodation"/></Route>
    <Route path="/sell" component={SellPage}/>
    <Route path="/seller" component={SellerDashboardPage}/>
    <Route path="/seller/store" component={SellerStorePage}/>
    <Route path="/seller/products" component={SellerProductsPage}/>
    <Route path="/seller/products/new">{() => <SellerProductFormPage/>}</Route>
    <Route path="/seller/products/:id/evidence" component={SellerProductEvidencePage}/>
    <Route path="/seller/products/:id/edit">{() => <SellerProductFormPage edit/>}</Route>
    <Route path="/seller/inventory" component={SellerInventoryPage}/>
    <Route path="/seller/orders" component={SellerOrdersPage}/>
    <Route path="/seller/orders/:id" component={SellerOrderDetailPage}/>
    <Route path="/seller/offers">{() => <VerifiedSellerRouteGate><SellerOffersPage/></VerifiedSellerRouteGate>}</Route>
    <Route path="/seller/messages">{() => <VerifiedSellerRouteGate><MessagesPage seller/></VerifiedSellerRouteGate>}</Route>
    <Route path="/seller/messages/:id">{() => <VerifiedSellerRouteGate><MessagesPage seller/></VerifiedSellerRouteGate>}</Route>
    <Route path="/seller/reviews">{() => <VerifiedSellerRouteGate><SellerReviewsPage/></VerifiedSellerRouteGate>}</Route>
    <Route path="/seller/analytics" component={SellerAnalyticsPage}/>
    <Route path="/seller/settings">{() => <VerifiedSellerRouteGate><SellerSettingsPage/></VerifiedSellerRouteGate>}</Route>
    <Route path="/moderator" component={ModeratorPage}/>
    <Route path="/admin/operations" component={AdminOperationsPage}/>
    <Route path="/admin/security" component={AdminSecurityHealthPage}/>
    <Route path="/admin/staff" component={AdminStaffPage}/>
    <Route path="/admin/settings/notifications" component={NotificationSettingsPage}/>
    <Route path="/admin/settings" component={AdminSettingsPage}/>
    <Route path="/admin" component={AdminPage}/>
    <Route path="/admin/recovery" component={AdminRecoveryPage}/>
    <Route path="/admin/analytics" component={AdminAnalyticsPage}/>
    <Route path="/admin/users" component={AdminUsersPage}/>
    <Route path="/admin/users/:id">{() => <AdminUserDetailPage/>}</Route>
    <Route path="/admin/sellers" component={AdminSellersPage}/>
    <Route path="/admin/stores" component={AdminStoresPage}/>
    <Route path="/admin/listings" component={AdminListingsPage}/>
    <Route path="/admin/categories" component={AdminCategoriesPage}/>
    <Route path="/admin/orders" component={AdminOrdersPage}/>
    <Route path="/admin/orders/:id" component={AdminOrderDetailPage}/>
    <Route path="/admin/offers" component={AdminOffersPage}/>
    <Route path="/admin/verifications" component={AdminVerificationsPage}/>
    <Route path="/admin/reservations" component={AdminReservationExpiryPage}/>
    <Route path="/admin/reports" component={AdminReportsPage}/>
    <Route path="/admin/disputes" component={AdminDisputesPage}/>
    <Route path="/admin/reviews" component={AdminReviewsPage}/>
    <Route path="/admin/notifications" component={AdminNotificationsPage}/>
    <Route path="/admin/audit-logs" component={AdminAuditLogsPage}/>
    <Route path="/category/hostel-home"><Redirect to="/category/accommodation"/></Route>
    <Route path="/category/:slug" component={ExplorePage}/>
    <Route component={NotFound}/>
  </Switch></Suspense></div></div></div></ErrorBoundary>;
}

export default App;
