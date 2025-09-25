import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MockProvider from "./components/MockProvider";
import Index from "./pages/Index";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import AuctionDetail from "./pages/AuctionDetail";
import ListingDetails from "./pages/ListingDetails";
import VendorProfile from "./pages/VendorProfile";
import { SessionProvider } from "./context/SessionContext";
import { I18nProvider } from "./context/I18nContext";
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
import PublicImporterProfile from "./pages/PublicImporterProfile";
import ShareRedirect from "./pages/ShareRedirect";
import RefundPolicy from "./pages/RefundPolicy";

const queryClient = new QueryClient();
const rawBaseUrl = import.meta.env.BASE_URL ?? "/";
const routerBasename = rawBaseUrl.replace(/\/+$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <SessionProvider>
          <MockProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={routerBasename || undefined}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auctions" element={<Index />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
                <Route path="/listings/:id" element={<ListingDetails />} />
                <Route path="/seller/:id" element={<VendorProfile />} />
                <Route path="/checkout/:listingId" element={<Checkout />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/order/:id" element={<OrderTracker />} />
                <Route path="/order/:id/qr" element={<OrderPickupQr />} />
                <Route path="/importer/create" element={<CreateListingWizard />} />
                <Route path="/account" element={<Profile />} />
                <Route path="/profile/bids" element={<ProfileBids />} />
                <Route path="/profile/watchlist" element={<ProfileWatchlist />} />
                <Route path="/profile/wins" element={<ProfileWins />} />
                <Route path="/importers/:id/profile" element={<PublicImporterProfile />} />
                <Route path="/l/:id" element={<ShareRedirect context="listing" />} />
                <Route path="/s/:id" element={<ShareRedirect context="store" />} />
                <Route path="/mock/psp" element={<MockPsp />} />
                <Route path="/offline" element={<Offline />} />
                <Route path="/policy/refunds" element={<RefundPolicy />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </MockProvider>
        </SessionProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
