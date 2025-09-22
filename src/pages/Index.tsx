import { ListChecks, Shield, Clock, MapPin } from 'lucide-react';

const Index = () => {
  return (
    <main className="min-h-dvh bg-bg text-fg antialiased">
      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Header */}
        <header className="text-center py-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
              <ListChecks className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-fg">ProList Mini</h1>
          <p className="mt-2 text-muted">Installable PWA scaffold. Tokens loaded.</p>
        </header>

        {/* Demo Components */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Component Demo</h2>
          
          {/* Buttons */}
          <div className="grid gap-3">
            <button className="btn-primary">
              <Shield className="w-4 h-4 mr-2" />
              Primary Action
            </button>
            <button className="btn-outline">
              <Clock className="w-4 h-4 mr-2" />
              Secondary Action
            </button>
          </div>
          
          {/* Chips/Tags */}
          <div className="space-y-2">
            <div className="chip chip-escrow">
              <Shield className="w-4 h-4" />
              Protected by Escrow
            </div>
            <div className="chip chip-lane">
              <MapPin className="w-4 h-4" />
              GZ→DLA • 93% on-time
            </div>
            <div className="chip chip-timer">
              <Clock className="w-4 h-4" />
              48h remaining
            </div>
          </div>
          
          {/* Card Example */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <h3 className="font-semibold text-fg mb-2">Sample Order</h3>
            <p className="text-muted text-sm mb-3">Mobile-first responsive design with design tokens.</p>
            <div className="flex justify-between items-center">
              <span className="chip chip-escrow">Secured</span>
              <span className="font-bold text-primary">$49.99</span>
            </div>
          </div>
        </section>

        {/* PWA Install Note */}
        <section className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <h3 className="font-semibold text-primary mb-2">PWA Ready</h3>
          <p className="text-sm text-muted">This app can be installed on your device for a native experience.</p>
        </section>
      </div>
    </main>
  );
};

export default Index;
