import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MockProvider from "./components/MockProvider";
import Index from "./pages/Index";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import ListingDetails from "./pages/ListingDetails";
import { SessionProvider } from "./context/SessionContext";
import { I18nProvider } from "./context/I18nContext";
import Checkout from "./pages/Checkout";
import CheckoutReturn from "./pages/CheckoutReturn";
import MockPsp from "./pages/MockPsp";
import OrderTracker from "./pages/OrderTracker";
import OrderPickupQr from "./pages/OrderPickupQr";
import CreateListingWizard from "./pages/CreateListingWizard";
import Profile from "./pages/Profile";
import PublicImporterProfile from "./pages/PublicImporterProfile";
import ShareRedirect from "./pages/ShareRedirect";
import RefundPolicy from "./pages/RefundPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <SessionProvider>
          <MockProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/listings/:id" element={<ListingDetails />} />
                <Route path="/checkout/:listingId" element={<Checkout />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/order/:id" element={<OrderTracker />} />
                <Route path="/order/:id/qr" element={<OrderPickupQr />} />
                <Route path="/importer/create" element={<CreateListingWizard />} />
                <Route path="/account" element={<Profile />} />
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
