import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MockProvider from "./components/MockProvider";
import { DealsStoreProvider } from "./lib/dealsStore";
import { PostStoreProvider } from "./context/PostStore";
import Index from "./pages/Index";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import AuctionDetail from "./pages/AuctionDetail";
import ListingDetails from "./pages/ListingDetails";
import { SessionProvider } from "./context/SessionContext";
import { I18nProvider, useI18n } from "./context/I18nContext";
import Checkout from "./pages/Checkout";
import CheckoutReturn from "./pages/CheckoutReturn";
import MockPsp from "./pages/MockPsp";
import OrderTracker from "./pages/OrderTracker";
import OrderPickupQr from "./pages/OrderPickupQr";
import CreateListingWizard from "./pages/CreateListingWizard";
import Profile from "./pages/Profile";
import ProfileBids from "./pages/ProfileBids";
import ProfileWatchlist from "./pages/ProfileWatchlist";
import ProfileWins from "./pages/ProfileWins";
import WinnerCheckout from "./pages/WinnerCheckout";
import ShareRedirect from "./pages/ShareRedirect";
import RefundPolicy from "./pages/RefundPolicy";
import AuctionFulfillmentFlow from "./pages/AuctionFulfillmentFlow";
import MerchantWorkspacePage from "./pages/MerchantWorkspacePage";
import MerchantResultsPage from "./pages/MerchantResultsPage";
import CreatorProfilePage from "./pages/CreatorProfile";
import VendorProfile from "./pages/VendorProfile";
import NotificationsInbox from "./pages/NotificationsInbox";
import NotificationSettings from "./pages/NotificationSettings";
import InvoiceView from "./invoices/InvoiceView";
import BuyerInvoices from "./pages/BuyerInvoices";
import BuyerOrders from "./pages/BuyerOrders";
import CreatePost from "./pages/CreatePost";
import UserPosts from "./pages/UserPosts";
import Listings from "./pages/Listings";
import { Badge } from "./components/ui/badge";
import SwitchRole from "./pages/SwitchRole";

const queryClient = new QueryClient();
const rawBaseUrl = import.meta.env.BASE_URL ?? "/";
const routerBasename = rawBaseUrl.replace(/\/+$/, "");

const PreviewBadge = () => {
  const { t } = useI18n();
  const showPreviewBadge = import.meta.env.MODE !== "production" || import.meta.env.DEV;

  if (!showPreviewBadge) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120]">
      <Badge className="rounded-full bg-primary text-primary-foreground shadow-soft">
        {t("common.preview")}
      </Badge>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <SessionProvider>
          <PostStoreProvider>
            <DealsStoreProvider>
              <MockProvider>
                <Toaster />
                <Sonner />
                <PreviewBadge />
                <BrowserRouter basename={routerBasename || undefined}>
                  <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auctions" element={<Index />} />
                <Route path="/following" element={<Index />} />
                <Route path="/buyer/following" element={<Index />} />
                <Route path="/buyers/following" element={<Index />} />
                <Route path="/buyers/deals" element={<Index />} />
                <Route path="/buyer/deals" element={<Index />} />
                <Route path="/deals" element={<Index />} />
                <Route path="/buyers/profile/orders" element={<BuyerOrders />} />
                <Route path="/buyers/profile/invoices" element={<BuyerInvoices />} />
          <Route path="/user/create-post" element={<CreatePost />} />
          <Route path="/user/posts" element={<UserPosts />} />
          <Route path="/buyers/listings" element={<Listings />} />
                <Route path="/vendor" element={<Index />} />
                <Route path="/vendor/:id" element={<VendorProfile />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
                <Route path="/listings/:id" element={<ListingDetails />} />
                <Route path="/checkout/:listingId" element={<Checkout />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/order/:id" element={<OrderTracker />} />
                <Route path="/order/:id/qr" element={<OrderPickupQr />} />
                <Route path="/importer/create" element={<CreateListingWizard />} />
                <Route path="/account" element={<Profile />} />
                <Route path="/account/switch-role" element={<SwitchRole />} />
                <Route path="/profile/bids" element={<ProfileBids />} />
                <Route path="/profile/watchlist" element={<ProfileWatchlist />} />
                <Route path="/profile/wins" element={<ProfileWins />} />
                <Route path="/profile/wins/:winId/checkout" element={<WinnerCheckout />} />
                <Route path="/merchant" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/listings" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/listings/mine" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/preorder" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/preorder/mine" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/follows" element={<MerchantWorkspacePage />} />
                <Route path="/merchant/results/:id" element={<MerchantResultsPage />} />
                <Route path="/creator/:id" element={<CreatorProfilePage />} />
                <Route path="/notifications" element={<NotificationsInbox />} />
                <Route path="/settings/notifications" element={<NotificationSettings />} />
                <Route path="/invoice/:invoiceNo" element={<InvoiceView />} />
                <Route path="/l/:id" element={<ShareRedirect context="listing" />} />
                <Route path="/s/:id" element={<ShareRedirect context="store" />} />
                <Route path="/mock/psp" element={<MockPsp />} />
                <Route path="/offline" element={<Offline />} />
                <Route path="/policy/refunds" element={<RefundPolicy />} />
                <Route path="/auction/winner-flow" element={<AuctionFulfillmentFlow />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </MockProvider>
          </DealsStoreProvider>
        </PostStoreProvider>
      </SessionProvider>
    </I18nProvider>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
