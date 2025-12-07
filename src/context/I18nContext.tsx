import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

export type Locale = 'en' | 'fr';

const translations = {
  en: {
    app: { name: 'ProList Mini', tagline: 'Fast preorder companion' },
    common: {
      continue: 'Continue',
      cancel: 'Cancel',
      preview: 'Preview',
      verified: 'Verified',
      save: 'Save',
      demoData: 'Demo data',
      back: 'Back',
    },
    navigation: {
      aria: 'Primary navigation',
      preorder: 'Preorder',
      auctions: 'Auctions',
      listings: 'Listings',
      add: 'Add',
      notifications: 'Notifications',
      following: 'Following',
      deals: 'Deals',
    },
    home: { modes: { preorder: 'Preorder', auctions: 'Auctions', following: 'Following', deals: 'Deals' } },
    roles: {
      prompt: 'How do you want to use ProList Mini today?',
      description: 'Pick the workspace you need right now — you can switch anytime.',
      buyerTitle: 'Buyer', buyerSubtitle: 'Shop listings and track pooled orders.',
      vendorTitle: 'Vendor', vendorSubtitle: 'Auctions & direct listings management.',
      importerTitle: 'Importer', importerSubtitle: 'Create drops and manage preorder pools.',
      merchantTitle: 'Merchant', merchantSubtitle: 'Repost and market others\' listings.',
      buyerBadge: 'Users Mode', vendorBadge: 'Vendor mode',
      importerBadge: 'Importer mode', merchantBadge: 'Merchant mode',
      buyerTag: 'Shop', vendorTag: 'Sell', importerTag: 'Pool', merchantTag: 'Boost',
      buyerSummary: 'Browse curated products and keep an eye on pooled shipments.',
      vendorSummary: 'Create auctions, manage direct listings, and track sales.',
      importerSummary: 'Launch preorder pools, monitor commitments, and prep paperwork.',
      merchantSummary: 'Repost vendor listings and preorders to earn commission.',
      switchTitle: 'Switch role', switchNote: 'Tap a mode to jump right in — updates instantly.',
    },
    onboarding: {
      modeChooser: {
        title: 'Choose how you want to start',
        subtitle: 'Pick the workspace that fits what you need today.',
        tryVendorDemo: 'Try the vendor workspace demo',
        signInCta: 'Already have an account? Sign in',
      },
      modes: {
        buyer: { title: 'Buyer workspace', description: 'Browse pooled listings and track escrow-protected orders.' },
        vendor: { title: 'Vendor workspace', description: 'Create auctions and direct listings with flexible fulfillment.' },
        importer: { title: 'Importer workspace', description: 'Launch preorder pools and manage shipping logistics.' },
        merchant: { title: 'Merchant workspace', description: 'Repost and market others\' listings to earn commission.' },
      },
      basics: {
        title: 'Tell us about you',
        subtitle: 'A few details so we can tailor your workspace.',
        nameLabel: 'Display name',
        namePlaceholder: 'Enter the name buyers should see',
        languageLabel: 'Preferred language',
        cityLabel: 'City',
        cityPlaceholder: 'Where do you mainly operate?',
        passwordLabel: 'Create a password',
        passwordPlaceholder: 'Choose something secure',
        passwordHint: 'Must be at least 6 characters. Use letters and numbers for a stronger password.',
        confirmPasswordLabel: 'Confirm password',
        confirmPasswordPlaceholder: 'Re-enter your password',
        passwordMismatch: 'Passwords do not match. Please try again.',
      },
      signIn: {
        title: 'Sign back in',
        subtitle: 'Enter your Users Mode credentials. Complete verification once to unlock the other workspaces.',
        roleLabel: 'Workspace',
        contactLabel: 'Phone or email',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        submit: 'Sign in',
        invalidCredentials: 'We couldn\'t find a matching account. Check your details and try again.',
        demoTitle: 'Demo credentials',
        demoHint: 'Use these general accounts to compare the unverified and verified experiences.',
        showPassword: 'Show password',
        forgotPassword: 'Forgot password?',
        noAccountPrompt: "Don't have an account?",
        createAccountCta: 'Create an account',
        demoStatusVerified: 'Verified — Pro workspaces unlocked',
        demoStatusUnverified: 'Unverified — Users Mode only',
        finalizingTitle: 'Finishing setup…',
        finalizingSubtitle: 'Hang tight while we save your workspace preferences and sign you in.',
      },
    },
    merchant: {
      kpiActiveReposts: 'Active reposts', kpiTotalSales: 'Total sales',
      kpiCommissionEarned: 'Commission earned', kpiCustomers: 'Customers',
      listingsTab: 'Listings', preorderTab: 'Preorder',
      catalogTab: 'Catalog', myRepostsTab: 'My Reposts',
      repostAction: 'Repost an item', claimRepost: 'Claim & Repost',
      createAction: 'What would you like to repost?',
      createFromListings: 'Browse listings catalog',
      createFromListingsSubtitle: 'Auctions & direct listings from vendor partners.',
      createFromPreorders: 'Browse preorder pools',
      createFromPreordersSubtitle: 'Group importer-led drops to earn commission.',
      manageReposts: 'Manage my reposts',
      manageRepostsSubtitle: 'Review active listings and preorder shares.',
      repostPreorder: 'Repost Preorder', ownerMinimum: 'Owner minimum',
      commission: 'Commission', claimedByYou: 'Claimed by you', claimedByOther: 'Claimed by other',
      escrowProtection: 'Escrow protection', preorderProtection: 'Protected by Escrow • Auto-refund if late',
      sharedMOQ: 'Shared MOQ', ordersViaMe: 'orders via me', commissionToDate: 'Commission to date',
      lockingSoon: 'Locking soon', minimumBid: 'Minimum bid', endTime: 'End time',
      mustBeAtLeast: 'Must be at least', minimum: 'Minimum', unitPrice: 'Unit price',
      readyToPublish: 'Ready to publish', directListingReady: 'This direct listing is ready to publish immediately.',
      confirmPublish: 'Confirm & Publish', repostAuction: 'Repost Auction', repostListing: 'Repost Listing',
      invalidBid: 'Invalid bid amount', bidMustBeHigher: 'Bid must be at least {{min}} F',
      endTimeRequired: 'End time is required', repostSuccess: 'Item reposted successfully',
      repostSuccessDesc: 'Your repost is now live in your storefront',
      preorderRepostSuccess: 'Preorder reposted', preorderRepostSuccessDesc: 'Orders will now contribute to the shared pool',
      sharedPoolNote: 'All orders flow into the shared pool. Commission paid on collection.',
      fromFollows: 'From people I follow', newFromFollows: 'New from follows',
      followCardAria: 'Open profile for {{name}}',
      manageFollows: 'Manage follows',
      noFollowUpdatesTitle: "You're all caught up",
      noFollowUpdatesSubtitle: 'New drops from followed vendors will appear here.',
      catalogEmptyFiltered: 'No matches — try discover more creators',
      repostsEmpty: 'No reposts yet — claim from catalog to get started',
      preorderEmptyFiltered: 'No preorder pools from your follows yet',
      preorderRepostsEmpty: 'You have not reposted any preorder pools yet',
      viewResults: 'View result summary',
      redirecting: 'Opening merchant workspace…',
      resultSettled: 'Settled', finalPrice: 'Final price', ownerPayout: 'Owner payout',
      merchantCommission: 'Your commission', resultWinner: 'Winning buyer',
      resultBids: 'Bids received', resultWatchers: 'Watchers', resultClicks: 'Repost clicks',
      resultOrders: 'Orders via you', resultTimeline: 'Result timeline',
      viewMyReposts: 'Back to My Reposts', exploreCatalog: 'Explore catalog',
      onTimePercent: 'On-time %',
    },
    distribution: {
      title: 'Distribution',
      vendorSubtitle: 'Decide how this release should go live.',
      importerSubtitle: 'Choose how this preorder should go live.',
      publishOnly: 'Publish on my store',
      publishOnlyDesc: 'Launch on your storefront only.',
      offerMerchant: 'Offer to a Merchant',
      offerMerchantDesc: 'Send to one merchant partner before going live.',
      offerMerchants: 'Offer to Merchants',
      offerMerchantsDesc: 'Share with merchant partners to repost.',
      publishOffer: 'Publish + Offer',
      publishOfferDesc: 'Go live now and notify your merchant partners.',
      importerCommissionLabel: 'Commission per collected order',
      importerCommissionValue: '{{amount}} per collected order',
      vendorCommissionLabel: 'Merchant commission rule',
      vendorCommissionAuction: '{{percent}} rev-share on final price',
      vendorCommissionListing: '{{amount}} per sale to merchant partners',
      successAdded: 'Added to Merchant Catalog',
      auctionsOnlyBadge: 'Auctions only',
      offerAuctionsOnly: 'Available for auctions only.',
      publishConfirmed: 'Published on your store',
    },
    following: {
      tab: 'Following', discover: 'Discover', myFollows: 'Following', followersTab: 'Followers',
      follow: 'Follow', following: 'Following', unfollow: 'Unfollow', viewProfile: 'View profile',
      requestNotifications: 'Request notifications', manageNotifications: 'Manage notifications',
      newAuctions: 'New auctions', newPreorders: 'New preorders',
      notifyOn: 'Notify me', notifyPending: 'Daily digest', notifyOff: 'Off',
      notifyReassurance: 'You can switch to a daily digest anytime.',
      followers: 'followers', closedDeals: 'deals (60d)',
      closedDealsWindow: 'Last 60 days', responseTime: 'Response time',
      emptyFollows: 'No follows yet — discover trusted sellers',
      nowFollowing: 'Now following {{name}}', unfollowed: 'Unfollowed {{name}}',
      blocked: 'Blocked {{name}}', reported: 'Reported successfully',
      notificationsUpdated: 'Notifications updated',
      shareProfile: 'Share profile', block: 'Block', report: 'Report',
      auctions: 'Auctions', preorders: 'Preorders',
      showNameInFollowers: 'Allow my name in followers lists',
      makeDeal: 'Make a deal',
      followingSince: 'Following since {{value}}',
      spendLast90d: 'Spend (90 days)',
      lastOrder: 'Last order',
      focusAreas: 'Focus areas',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
    },
    profile: {
      cards: {
        posts: 'My posts',
        deals: 'Deals',
        invoices: 'Invoices',
        bids: 'Bids',
        wins: 'Wins',
        watchlist: 'Watchlist',
      },
      wins: {
        title: 'Wins',
        subtitle: 'Settle escrow and schedule pickup for your auction lots.',
        actions: {
          payNow: 'Pay now',
          choosePickup: 'Choose pickup',
          viewInvoice: 'View invoice',
          trackOrder: 'Track order',
        },
        status: {
          pending_payment: 'Payment due',
          paid_pickup_pending: 'Paid — choose pickup',
          paid_pickup_selected: 'Paid & pickup set',
          completed: 'Completed',
        },
        thumbnailFallback: 'Item',
        fallbackTitle: 'Auction win',
        wonOn: 'Won {{date}}',
        card: {
          totalLabel: 'Total',
          sellerLabel: 'Seller',
          pickupEta: 'Pickup ETA',
          payBy: 'Pay before this deadline',
          escrowLine: 'Protected by Escrow • Auto-refund if late',
        },
        emptyTitle: 'No wins yet',
        emptySubtitle: 'Your winning auctions will appear here once you take one home.',
      },
      deals: {
        title: 'Deals',
        subtitle: 'Preview escrow-backed deals from your partners.',
        placeholder: 'Preview deals from your partners.',
        badge: 'Preview',
      },
    },
    winnerCheckout: {
      title: 'Winner checkout',
      subtitle: 'Follow the steps to fund escrow, choose pickup, and access your invoice.',
      missingTitle: 'Win not found',
      missingSubtitle: 'Refresh your wins list and try again.',
      backToWins: 'Back to wins',
      sections: { payment: 'Payment', pickup: 'Pickup', invoice: 'Invoice' },
      payment: {
        title: 'Fund escrow',
        subtitle: 'Pay now to secure your item.',
        totalDue: 'Total due',
        escrowLine: 'Protected by Escrow • Auto-refund if late',
        acceptedWallets: 'MTN MoMo • Orange Money',
        helper: 'Escrow unlocks pickup planning.',
        paidBadge: 'Paid',
        paidStatus: 'Escrow funded — pickup next',
        paidReminder: 'Choose your pickup hub to generate the invoice.',
        paidCta: 'Paid',
      },
      actions: {
        payNow: 'Pay now',
        choosePickup: 'Choose pickup',
        viewInvoice: 'View invoice',
        viewOrder: 'Track order',
      },
      pickup: {
        title: 'Choose pickup hub',
        subtitle: 'Select where you want to collect this item.',
        locked: 'Unlock by paying first',
        savedBadge: 'Pickup saved',
        lastUsed: 'Last used',
        defaultEta: 'Ready within 24–48h after drop-off',
      },
      invoice: {
        title: 'Invoice & receipt',
        subtitle: 'Invoice unlocks after pickup is set.',
        locked: 'Choose your pickup hub to view the invoice',
        readyBadge: 'Invoice ready',
        summaryTitle: 'Invoice summary',
        dialogTitle: 'Invoice details',
        header: 'ProList Mini',
        number: 'Invoice {{number}}',
        seller: 'Seller',
        escrowProtected: 'Escrow protected',
        buyer: 'Buyer',
        hammerPrice: 'Final price',
        buyerPremium: 'Buyer premium ({{pct}}%)',
        serviceFee: 'Service fee',
        handlingFee: 'Centre handling fee',
        total: 'Total',
        pickupHub: 'Pickup hub',
        orderId: 'Order ID {{id}}',
        footer: 'Funds held in escrow. Released on collection.',
        copyLink: 'Copy link',
        download: 'Download PDF',
        windowTitle: 'Invoice',
      },
      sheet: {
        title: 'Pay now',
        subtitle: 'Use the demo payment flow to fund escrow.',
        total: 'Total due',
        escrowCopy: 'Funds are held in escrow until you collect the item.',
        paymentCopy: 'This demo simulates a mobile money payment sheet.',
        cancel: 'Cancel',
        confirm: 'Confirm payment',
      },
      toasts: {
        paymentSuccess: 'Payment received — choose pickup.',
        pickupSaved: 'Pickup saved: {{hub}}',
        linkCopied: 'Invoice link copied',
      },
    },
    creator: {
      tabs: {
        overview: 'Overview',
        auctions: 'Recent auctions',
        listings: 'Recent listings',
        preorders: 'Preorders',
        about: 'About',
      },
      actions: {
        placeBid: 'Place bid',
        viewListing: 'View listing',
        preOrder: 'Pre-order',
      },
      demoCta: 'Demo data — full actions coming soon.',
      preorderCta: 'Preorders lock through the Merchant workspace in this demo.',
      trustline: 'Protected by Escrow • Auto-refund if late',
      verified: 'Verified',
      watchers: '{{count}} watching',
      listingEta: 'Ships in {{min}}–{{max}} days',
      preorderMoq: 'MOQ progress',
      preorderLockIn: 'Lock in now',
      preorderLockDate: 'Locks {{date}}',
      preorderEta: '{{min}}–{{max}} days ETA',
      metrics: {
        onTime: 'On-time %',
        onTimeHint: 'Based on tracked deliveries',
        disputeRate: 'Dispute rate',
        disputeHint: 'Filed in the last 60 days',
        closedDeals: 'Closed deals (60d)',
        closedHint: 'Completed with escrow release',
        followers: 'Followers',
      },
      followersPanel: {
        title: 'Community followers',
        subtitle: 'Some recent buyers sharing their support.',
        openSheet: 'See all followers',
        seeAll: 'See all',
        sheetTitle: 'Followers',
        privacy: 'Show my name when others view this list',
        privacyHint: 'Toggle off to display initials + city only.',
        hiddenLabel: 'Follower • {{city}}',
        hiddenFallback: 'Follower',
        followerBadge: 'Following',
      },
      about: {
        storyHeading: 'Story & values',
        highlightsHeading: 'Highlights',
        focusHeading: 'Focus areas',
        categoriesHeading: 'Categories',
        lanes: 'Trusted lanes',
        languages: 'Languages',
      },
      languages: {
        english: 'English',
        french: 'French',
      },
      categories: {
        electronics: 'Electronics',
        accessories: 'Accessories',
        smartHome: 'Smart home',
        beauty: 'Beauty',
        wellness: 'Wellness',
        home: 'Home essentials',
        kitchen: 'Kitchen',
        fashion: 'Fashion',
        kids: 'Kids',
        toys: 'Toys & play',
        sports: 'Sports',
        fitness: 'Fitness',
        health: 'Health',
      },
      taglines: {
        nelly: 'Douala buyers’ bulk partner for reliable drops',
        techplus: 'Quick-turn tech and smart accessories for Cameroon',
        beauty: 'Inclusive cosmetics and salon stock from trusted labs',
        home: 'Appliances and kitchen essentials curated for Douala homes',
        fashion: 'Limited-run fashion capsules for West African boutiques',
        kids: 'STEM-forward toys and essentials for growing families',
        sports: 'Performance gear for clubs and weekend athletes',
        wellness: 'Everyday wellness supplies for salons and spas',
      },
      story: {
        nelly:
          'Nelly Stores curates importer-ready bundles for Douala boutiques, pairing bulk-friendly pricing with transparent logistics updates.',
        techplus:
          'TechPlus Import sources fast-moving consumer electronics with vetted suppliers and air freight partners for 5–10 day arrivals.',
        beauty:
          'Beauty Hub CM partners with certified labs to deliver trending SKUs in shades and textures retailers request most.',
        home:
          'Home Essentials scouts dependable appliances and kitchenware, focusing on durable builds that handle Cameroonian usage.',
        fashion:
          'Fashion Forward assembles limited runs from Lagos and Guangzhou studios, tailored to local sizing charts and fabrics.',
        kids:
          'Kids Corner mixes STEM toys and classroom staples, balancing durability with price points that work for parents and schools.',
        sports:
          'Sports Zone outfits grassroots clubs with FIFA-grade balls, kits, and training gear sourced through verified factories.',
        wellness:
          'Wellness Shop bundles spa and salon consumables, offering eco-conscious alternatives with reliable restock cadence.',
      },
      highlights: {
        nelly: {
          quality: 'Fast customs clearance with daily WhatsApp updates.',
          bulk: 'Escrow-backed fulfillment across Douala pickup hubs.',
          aftercare: 'Bulk pricing tiers for merchants and resellers.',
        },
        techplus: {
          partnerships: 'Direct factory relationships for brand-authentic stock.',
          speed: 'Express air shipments locked with a 96% on-time rate.',
          support: 'After-sales support with local repair partners.',
        },
        beauty: {
          shades: 'Shade ranges curated for West and Central Africa.',
          certified: 'Batch-tested imports with traceable paperwork.',
          retailers: 'Merchandising kits for salons and beauty retailers.',
        },
        home: {
          kitchen: 'Warranty-backed small appliances ready for resale.',
          service: 'Hands-on product QC before each shipment leaves port.',
          brands: 'Distributor pricing with flexible MOQ for mixed cartons.',
        },
        fashion: {
          curated: 'Trend scouting weekly with Lagos stylists.',
          limited: 'Limited capsules that keep client racks fresh.',
          tailored: 'Tailored size runs and fabric specs for humid climates.',
        },
        kids: {
          educational: 'Educational toys vetted by local teachers.',
          safety: 'Safety compliance checked across EU and NA standards.',
          parents: 'Parent-ready bundles for birthdays and school drives.',
        },
        sports: {
          performance: 'Teamwear printing handled before arrival.',
          teamwear: 'Durable equipment rated for outdoor pitches.',
          community: 'Community sponsorship kits for tournaments.',
        },
        wellness: {
          organic: 'Organic and cruelty-free product mixes.',
          routines: 'Refill programs to cut packaging waste.',
          partners: 'Training decks for partner spas and salons.',
        },
      },
    },
    notifications: {
      title: 'Notifications',
      unread: 'unread',
      markAllRead: 'Mark all read',
      clearAll: 'Clear all',
      settingsButton: 'Settings',
      markedAllRead: 'All notifications marked as read',
      clearedAll: 'All notifications cleared',
      empty: {
        title: 'All caught up',
        description: 'No new notifications right now',
        cta: 'Browse Home'
      },
      tabs: {
        all: 'All',
        buying: 'Buying',
        preorder: 'Preorder',
        selling: 'Selling',
        merchant: 'Merchant',
        follows: 'Follows',
        system: 'System'
      },
      channels: {
        inapp: 'In-app',
        inappDesc: 'Always enabled for core notifications',
        push: 'Push notifications',
        pushDesc: 'Get instant alerts on your device',
        whatsapp: 'WhatsApp',
        whatsappDesc: 'Receive updates via WhatsApp',
        sms: 'SMS',
        smsDesc: 'Get text message alerts',
        email: 'Email',
        emailDesc: 'Receive email notifications'
      },
      settings: {
        title: 'Notification Settings',
        channelsTitle: 'Channels',
        channelUpdated: 'Channel settings updated',
        preview: 'Preview',
        quietHoursTitle: 'Quiet Hours',
        quietHoursLabel: 'Enable quiet hours',
        quietHoursDesc: 'Mute real-time notifications during these hours',
        digestTitle: 'Digest',
        digestLabel: 'Digest frequency',
        digestDesc: 'Get bundled updates instead of individual alerts',
        digestOff: 'Off',
        digestDaily: 'Daily',
        digestWeekly: 'Weekly',
        digestUpdated: 'Digest settings updated'
      }
    },
    vendor: { createAction: 'Create', createAuction: 'Create Auction', createListing: 'Create Listing',
      createAuctionSubtitle: 'Time-limited bidding', createListingSubtitle: 'Fixed price sales',
      auctionsTab: 'Auctions', directListingsTab: 'Direct Sales', winnersOrdersTab: 'Winners & Orders',
    },
  },
  fr: {
    app: { name: "ProList Mini", tagline: "Compagnon précommande rapide" },
    common: {
      continue: "Continuer",
      cancel: "Annuler",
      preview: "Aperçu",
      verified: "Vérifié",
      save: "Enregistrer",
      demoData: "Données de démonstration",
      back: "Retour",
    },
    navigation: {
      aria: "Navigation principale",
      preorder: "Précommande",
      auctions: "Enchères",
      listings: "Annonces",
      add: "Ajouter",
      notifications: "Notifications",
      following: "Abonnements",
      deals: "Deals",
    },
    home: { modes: { preorder: "Précommande", auctions: "Enchères", following: "Abonnements", deals: "Deals" } },
    roles: {
      prompt: "Comment souhaitez-vous utiliser ProList Mini aujourd'hui ?",
      description: "Choisissez l'espace de travail voulu — vous pourrez changer ensuite.",
      buyerTitle: "Acheteur", buyerSubtitle: "Achetez des offres et suivez vos commandes groupées.",
      vendorTitle: "Vendeur", vendorSubtitle: "Enchères et annonces fixes.",
      importerTitle: "Importateur", importerSubtitle: "Créez des drops et gérez les précommandes.",
      merchantTitle: "Marchand", merchantSubtitle: "Relayez et commercialisez les offres d'autrui.",
      buyerBadge: "Mode Utilisateur", vendorBadge: "Mode Vendeur",
      importerBadge: "Mode Importateur", merchantBadge: "Mode Marchand",
      buyerTag: "Acheter", vendorTag: "Vendre", importerTag: "Mutualiser", merchantTag: "Promouvoir",
      buyerSummary: "Parcourez les produits et surveillez vos expéditions groupées.",
      vendorSummary: "Créez des enchères, gérez les annonces et suivez les ventes.",
      importerSummary: "Lancez des précommandes, suivez les engagements et préparez les dossiers.",
      merchantSummary: "Relayez les offres de vendeurs et précommandes pour gagner des commissions.",
      switchTitle: "Changer de mode", switchNote: "Touchez un mode pour y accéder immédiatement.",
    },
    onboarding: {
      modeChooser: {
        title: "Choisissez votre départ",
        subtitle: "Sélectionnez l'espace qui correspond à votre besoin du moment.",
        tryVendorDemo: "Tester l'espace vendeur démo",
        signInCta: "Vous avez déjà un compte ? Connectez-vous",
      },
      modes: {
        buyer: {
          title: "Espace acheteur",
          description: "Parcourez les offres mutualisées et suivez vos commandes protégées.",
        },
        vendor: {
          title: "Espace vendeur",
          description: "Créez des enchères et annonces avec fulfillment flexible.",
        },
        importer: {
          title: "Espace importateur",
          description: "Lancez des pools précommande et gérez la logistique.",
        },
        merchant: {
          title: "Espace marchand",
          description: "Relayez et commercialisez les offres d'autrui pour des commissions.",
        },
      },
      basics: {
        title: "Présentez-vous",
        subtitle: "Quelques détails pour configurer votre espace.",
        nameLabel: "Nom affiché",
        namePlaceholder: "Nom que verront les acheteurs",
        languageLabel: "Langue préférée",
        cityLabel: "Ville",
        cityPlaceholder: "Où opérez-vous principalement ?",
        passwordLabel: "Créez un mot de passe",
        passwordPlaceholder: "Choisissez un mot de passe sécurisé",
        passwordHint: "Au moins 6 caractères. Combinez lettres et chiffres pour plus de sécurité.",
        confirmPasswordLabel: "Confirmez le mot de passe",
        confirmPasswordPlaceholder: "Retapez votre mot de passe",
        passwordMismatch: "Les mots de passe ne correspondent pas. Merci de réessayer.",
      },
      signIn: {
        title: "Reconnectez-vous",
        subtitle: "Connectez-vous au Mode Utilisateur. Une vérification suffit pour débloquer les autres espaces.",
        roleLabel: "Espace",
        contactLabel: "Téléphone ou e-mail",
        passwordLabel: "Mot de passe",
        passwordPlaceholder: "Saisissez votre mot de passe",
        submit: "Se connecter",
        invalidCredentials: "Impossible de trouver ce compte. Vérifiez vos informations et réessayez.",
        demoTitle: "Identifiants démo",
        demoHint: "Comparez les expériences non vérifiée et vérifiée avec ces comptes généraux.",
        showPassword: "Afficher le mot de passe",
        forgotPassword: "Mot de passe oublié ?",
        noAccountPrompt: "Pas encore de compte ?",
        createAccountCta: "Créer un compte",
        demoStatusVerified: "Vérifié — Espaces pro débloqués",
        demoStatusUnverified: "Non vérifié — Mode Utilisateur uniquement",
        finalizingTitle: "Finalisation en cours…",
        finalizingSubtitle: "Nous enregistrons vos préférences et ouvrons votre espace. Un instant.",
      },
    },
    merchant: {
      kpiActiveReposts: "Reposts actifs",
      kpiTotalSales: "Ventes totales",
      kpiCommissionEarned: "Commission gagnée",
      kpiCustomers: "Clients",
      listingsTab: "Annonces",
      preorderTab: "Précommande",
      catalogTab: "Catalogue",
      myRepostsTab: "Mes Reposts",
      repostAction: "Reposter un article",
      createAction: "Que souhaitez-vous republier ?",
      createFromListings: "Parcourir le catalogue d'annonces",
      createFromListingsSubtitle: "Enchères et ventes directes partagées par vos vendeurs partenaires.",
      createFromPreorders: "Parcourir les pools de précommandes",
      createFromPreordersSubtitle: "Regroupez les commandes des importateurs partenaires pour gagner une commission.",
      manageReposts: "Gérer mes reposts",
      manageRepostsSubtitle: "Consultez vos annonces actives et partages de précommandes.",
      claimRepost: "Réserver & Reposter",
      repostPreorder: "Reposter la précommande",
      ownerMinimum: "Minimum propriétaire",
      commission: "Commission",
      claimedByYou: "Réservé par vous",
      claimedByOther: "Réservé par un autre",
      escrowProtection: "Protection dépôt de garantie",
      preorderProtection: "Protégé par Escrow • Remboursement auto si retard",
      sharedMOQ: "MOQ partagé",
      ordersViaMe: "commandes via moi",
      commissionToDate: "Commission cumulée",
      lockingSoon: "Verrouillage bientôt",
      minimumBid: "Enchère minimum",
      endTime: "Heure de fin",
      mustBeAtLeast: "Doit être au moins",
      minimum: "Minimum", unitPrice: "Prix unitaire",
      readyToPublish: "Prêt à publier",
      directListingReady: "Cette annonce directe est prête à être publiée immédiatement.",
      confirmPublish: "Confirmer & Publier",
      repostAuction: "Reposter l'enchère",
      repostListing: "Reposter l'annonce",
      invalidBid: "Montant d'enchère invalide",
      bidMustBeHigher: "L'enchère doit être au moins {{min}} F",
      endTimeRequired: "Heure de fin requise",
      repostSuccess: "Article reposté avec succès",
      repostSuccessDesc: "Votre repost est maintenant en ligne dans votre vitrine",
      preorderRepostSuccess: "Précommande repostée",
      preorderRepostSuccessDesc: "Les commandes contribueront maintenant au pool partagé",
      sharedPoolNote: "Toutes les commandes affluent dans le pool partagé. Commission payée à la collecte.",
      fromFollows: "De mes abonnements", newFromFollows: "Nouveautés de vos abonnements",
      followCardAria: "Ouvrir le profil de {{name}}",
      manageFollows: "Gérer mes abonnements",
      noFollowUpdatesTitle: "Vous êtes à jour",
      noFollowUpdatesSubtitle: "Les nouvelles offres de vos abonnements apparaîtront ici.",
      catalogEmptyFiltered: "Aucun résultat — découvrez de nouveaux créateurs",
      repostsEmpty: "Aucun repost pour le moment — reprenez du catalogue",
      preorderEmptyFiltered: "Aucune précommande de vos abonnements pour l'instant",
      preorderRepostsEmpty: "Vous n'avez pas encore reposté de précommandes",
      viewResults: "Voir le résumé du résultat",
      redirecting: "Ouverture de l'espace marchand…",
      resultSettled: "Soldé", finalPrice: "Prix final", ownerPayout: "Versement vendeur",
      merchantCommission: "Votre commission", resultWinner: "Acheteur gagnant",
      resultBids: "Enchères reçues", resultWatchers: "Observateurs", resultClicks: "Clics sur le repost",
      resultOrders: "Commandes via vous", resultTimeline: "Chronologie du résultat",
      viewMyReposts: "Retour à Mes Reposts", exploreCatalog: "Explorer le catalogue",
      onTimePercent: "Livraison à l'heure",
    },
    distribution: {
      title: "Distribution",
      vendorSubtitle: "Décidez comment cette mise en vente sera diffusée.",
      importerSubtitle: "Choisissez comment cette précommande sera diffusée.",
      publishOnly: "Publier dans ma boutique",
      publishOnlyDesc: "Mise en ligne immédiate uniquement sur votre boutique.",
      offerMerchant: "Proposer à un marchand",
      offerMerchantDesc: "Envoyer à un marchand partenaire avant publication.",
      offerMerchants: "Proposer aux marchands",
      offerMerchantsDesc: "Partager avec vos partenaires marchands pour repost.",
      publishOffer: "Publier + Proposer",
      publishOfferDesc: "Mettre en ligne et avertir vos marchands simultanément.",
      importerCommissionLabel: "Commission par commande collectée",
      importerCommissionValue: "{{amount}} par commande collectée",
      vendorCommissionLabel: "Règle de commission marchand",
      vendorCommissionAuction: "{{percent}} de partage sur le prix final",
      vendorCommissionListing: "{{amount}} par vente vers les marchands partenaires",
      successAdded: "Ajouté au catalogue marchands",
      auctionsOnlyBadge: "Enchères uniquement",
      offerAuctionsOnly: "Disponible pour les enchères uniquement.",
      publishConfirmed: "Publié dans votre boutique",
    },
    following: {
      tab: "Abonnements", discover: "Découvrir", myFollows: "Abonnements", followersTab: "Abonnés",
      follow: "Suivre", following: "Abonné", unfollow: "Se désabonner", viewProfile: "Voir le profil",
      requestNotifications: "Demander des notifications", manageNotifications: "Gérer les notifications",
      newAuctions: "Nouvelles enchères", newPreorders: "Nouvelles précommandes",
      notifyOn: "Me notifier", notifyPending: "Digest quotidien", notifyOff: "Désactivé",
      notifyReassurance: "Vous pouvez basculer vers un digest quotidien à tout moment.",
      followers: "abonnés", closedDeals: "transactions (60j)",
      closedDealsWindow: "Sur les 60 derniers jours", responseTime: "Temps de réponse",
      emptyFollows: "Aucun abonnement — découvrez des vendeurs de confiance",
      nowFollowing: "Vous suivez {{name}}", unfollowed: "Désabonné de {{name}}",
      blocked: "{{name}} bloqué", reported: "Signalement envoyé",
      notificationsUpdated: "Notifications mises à jour",
      shareProfile: "Partager le profil", block: "Bloquer", report: "Signaler",
      auctions: "Enchères", preorders: "Précommandes",
      showNameInFollowers: "Autoriser l'affichage de mon nom dans les listes d'abonnés",
      makeDeal: "Créer un deal",
      followingSince: "Abonné depuis {{value}}",
      spendLast90d: "Dépenses (90 j)",
      lastOrder: "Dernière commande",
      focusAreas: "Centres d'intérêt",
      emailLabel: "Email",
      phoneLabel: "Téléphone",
    },
    profile: {
      cards: {
        posts: "Mes posts",
        deals: "Deals",
        invoices: "Factures",
        bids: "Enchères",
        wins: "Victoires",
        watchlist: "Liste de suivi",
      },
      wins: {
        title: "Victoires",
        subtitle: "Réglez l'escrow et planifiez votre retrait.",
        actions: {
          payNow: "Payer maintenant",
          choosePickup: "Choisir le point de retrait",
          viewInvoice: "Voir la facture",
          trackOrder: "Suivre la commande",
        },
        status: {
          pending_payment: "Paiement dû",
          paid_pickup_pending: "Payé — choisir le retrait",
          paid_pickup_selected: "Payé & retrait défini",
          completed: "Terminé",
        },
        thumbnailFallback: "Article",
        fallbackTitle: "Lot remporté",
        wonOn: "Gagné le {{date}}",
        card: {
          totalLabel: "Total",
          sellerLabel: "Vendeur",
          pickupEta: "Retrait estimé",
          payBy: "Payer avant cette échéance",
          escrowLine: "Paiement séquestré • Remboursement auto en cas de retard",
        },
        emptyTitle: "Aucune victoire",
        emptySubtitle: "Vos enchères remportées apparaîtront ici après paiement.",
      },
      deals: {
        title: "Deals",
        subtitle: "Aperçu des deals sécurisés de vos partenaires.",
        placeholder: "Aperçu des deals de vos partenaires.",
        badge: "Aperçu",
      },
    },
    winnerCheckout: {
      title: "Finalisation gagnant",
      subtitle: "Suivez les étapes pour financer l’escrow, choisir le retrait et récupérer la facture.",
      missingTitle: "Victoire introuvable",
      missingSubtitle: "Actualisez vos victoires puis réessayez.",
      backToWins: "Retour aux victoires",
      sections: { payment: "Paiement", pickup: "Retrait", invoice: "Facture" },
      payment: {
        title: "Financer l’escrow",
        subtitle: "Payez maintenant pour sécuriser votre lot.",
        totalDue: "Montant dû",
        escrowLine: "Paiement séquestré • Remboursement auto en cas de retard",
        acceptedWallets: "MTN MoMo • Orange Money",
        helper: "L’escrow débloque le choix du point de retrait.",
        paidBadge: "Payé",
        paidStatus: "Escrow financé — choisir le retrait",
        paidReminder: "Sélectionnez un point de retrait pour générer la facture.",
        paidCta: "Payé",
      },
      actions: {
        payNow: "Payer maintenant",
        choosePickup: "Choisir le retrait",
        viewInvoice: "Voir la facture",
        viewOrder: "Suivre la commande",
      },
      pickup: {
        title: "Choisir le hub de retrait",
        subtitle: "Sélectionnez où récupérer ce lot.",
        locked: "Débloquez en payant d’abord",
        savedBadge: "Retrait enregistré",
        lastUsed: "Dernier utilisé",
        defaultEta: "Prêt sous 24–48h après dépôt vendeur",
      },
      invoice: {
        title: "Facture & reçu",
        subtitle: "La facture se débloque après le choix du retrait.",
        locked: "Choisissez un hub pour voir la facture",
        readyBadge: "Facture prête",
        summaryTitle: "Résumé de facture",
        dialogTitle: "Détails de facture",
        header: "ProList Mini",
        number: "Facture {{number}}",
        seller: "Vendeur",
        escrowProtected: "Protégé par l’escrow",
        buyer: "Acheteur",
        hammerPrice: "Prix final",
        buyerPremium: "Prime acheteur ({{pct}} %)",
        serviceFee: "Frais de service",
        handlingFee: "Frais centre",
        total: "Total",
        pickupHub: "Point de retrait",
        orderId: "Commande {{id}}",
        footer: "Fonds tenus en escrow. Libérés à la collecte.",
        copyLink: "Copier le lien",
        download: "Télécharger le PDF",
        windowTitle: "Facture",
      },
      sheet: {
        title: "Payer maintenant",
        subtitle: "Utilisez le flux de paiement démo pour financer l’escrow.",
        total: "Montant dû",
        escrowCopy: "Les fonds restent en escrow jusqu’à la collecte.",
        paymentCopy: "Cette démo simule un paiement mobile money.",
        cancel: "Annuler",
        confirm: "Confirmer le paiement",
      },
      toasts: {
        paymentSuccess: "Paiement reçu — choisissez le retrait.",
        pickupSaved: "Point de retrait enregistré : {{hub}}",
        linkCopied: "Lien de facture copié",
      },
    },
    creator: {
      tabs: {
        overview: "Aperçu",
        auctions: "Enchères récentes",
        listings: "Annonces récentes",
        preorders: "Précommandes",
        about: "À propos",
      },
      actions: {
        placeBid: "Placer une enchère",
        viewListing: "Voir l’annonce",
        preOrder: "Précommander",
      },
      demoCta: "Données de démonstration — actions complètes bientôt disponibles.",
      preorderCta: "Les précommandes se verrouillent via l’espace Marchand dans cette démo.",
      trustline: "Protégé par l’escrow • Remboursement automatique en cas de retard",
      verified: "Vérifié",
      watchers: "{{count}} observent",
      listingEta: "Expédition sous {{min}}–{{max}} jours",
      preorderMoq: "Progression du MOQ",
      preorderLockIn: "Réserver maintenant",
      preorderLockDate: "Clôture le {{date}}",
      preorderEta: "Arrivée estimée {{min}}–{{max}} jours",
      metrics: {
        onTime: "Livraisons à l’heure",
        onTimeHint: "Basé sur les livraisons suivies",
        disputeRate: "Taux de litiges",
        disputeHint: "Ouverts sur les 60 derniers jours",
        closedDeals: "Transactions conclues (60j)",
        closedHint: "Finalisées avec libération d’escrow",
        followers: "Abonnés",
      },
      followersPanel: {
        title: "Communauté d’abonnés",
        subtitle: "Quelques acheteurs récents qui soutiennent la boutique.",
        openSheet: "Voir tous les abonnés",
        seeAll: "Voir tout",
        sheetTitle: "Abonnés",
        privacy: "Afficher mon nom lorsque d’autres consultent cette liste",
        privacyHint: "Désactivez pour montrer uniquement initiales + ville.",
        hiddenLabel: "Abonné • {{city}}",
        hiddenFallback: "Abonné",
        followerBadge: "Abonné",
      },
      about: {
        storyHeading: "Histoire & valeurs",
        highlightsHeading: "Points forts",
        focusHeading: "Domaines d’expertise",
        categoriesHeading: "Catégories",
        lanes: "Lignes fiables",
        languages: "Langues",
      },
      languages: {
        english: "Anglais",
        french: "Français",
      },
      categories: {
        electronics: "Électronique",
        accessories: "Accessoires",
        smartHome: "Maison connectée",
        beauty: "Beauté",
        wellness: "Bien-être",
        home: "Essentiels maison",
        kitchen: "Cuisine",
        fashion: "Mode",
        kids: "Enfants",
        toys: "Jouets & loisirs",
        sports: "Sports",
        fitness: "Fitness",
        health: "Santé",
      },
      taglines: {
        nelly: "Partenaire grossiste de Douala pour des drops fiables",
        techplus: "Tech et accessoires rapides pour le Cameroun",
        beauty: "Cosmétiques inclusifs et stocks salon issus de laboratoires certifiés",
        home: "Appareils et essentiels cuisine adaptés aux foyers de Douala",
        fashion: "Capsules mode en séries limitées pour les boutiques ouest-africaines",
        kids: "Jouets et essentiels éducatifs pour les familles en croissance",
        sports: "Équipements de performance pour clubs et athlètes du week-end",
        wellness: "Fournitures bien-être quotidiennes pour salons et spas",
      },
      story: {
        nelly:
          "Nelly Stores assemble des lots prêts à importer pour les boutiques de Douala, avec des prix adaptés au gros et un suivi logistique transparent.",
        techplus:
          "TechPlus Import source des produits électroniques à rotation rapide auprès de fournisseurs vérifiés et d’affrètements aériens 5–10 jours.",
        beauty:
          "Beauty Hub CM collabore avec des laboratoires certifiés pour livrer les références tendances dans les teintes et textures les plus demandées.",
        home:
          "Home Essentials sélectionne des appareils et ustensiles fiables, pensés pour résister aux usages camerounais.",
        fashion:
          "Fashion Forward compose des séries limitées depuis Lagos et Guangzhou, ajustées aux tailles et tissus locaux.",
        kids:
          "Kids Corner combine jouets STEM et fournitures scolaires avec un équilibre entre robustesse et budget parents/écoles.",
        sports:
          "Sports Zone équipe les clubs de quartier avec ballons, kits et accessoires issus d’usines homologuées.",
        wellness:
          "Wellness Shop regroupe les consommables spa & salon, avec des alternatives éco-responsables et des réassorts réguliers.",
      },
      highlights: {
        nelly: {
          quality: "Dédouanement rapide avec mises à jour WhatsApp quotidiennes.",
          bulk: "Livraison sous escrow via les hubs de retrait de Douala.",
          aftercare: "Paliers tarifaires pour marchands et revendeurs.",
        },
        techplus: {
          partnerships: "Relations directes usine pour des produits authentiques.",
          speed: "Expéditions aériennes express avec 96 % de ponctualité.",
          support: "Support après-vente avec partenaires de réparation locaux.",
        },
        beauty: {
          shades: "Gamme de teintes pensée pour l’Afrique centrale et de l’Ouest.",
          certified: "Lots testés en laboratoire avec traçabilité complète.",
          retailers: "Kits merchandising pour salons et détaillants beauté.",
        },
        home: {
          kitchen: "Petits électroménagers garantis prêts à la revente.",
          service: "Contrôle qualité manuel avant chaque départ de port.",
          brands: "Prix distributeur avec MOQ flexible pour assortiments mixtes.",
        },
        fashion: {
          curated: "Veille tendances hebdomadaire avec stylistes de Lagos.",
          limited: "Capsules limitées qui renouvellent les portants clients.",
          tailored: "Tailles et tissus ajustés aux climats humides.",
        },
        kids: {
          educational: "Jouets éducatifs validés par des enseignants locaux.",
          safety: "Conformité sécurité vérifiée selon normes UE/NA.",
          parents: "Packs prêts pour anniversaires et actions scolaires.",
        },
        sports: {
          performance: "Flocage des maillots géré avant l’arrivée.",
          teamwear: "Équipement robuste adapté aux terrains extérieurs.",
          community: "Kits de sponsoring pour tournois communautaires.",
        },
        wellness: {
          organic: "Produits bio et cruelty-free.",
          routines: "Programmes de recharge pour réduire les déchets.",
          partners: "Fiches de formation pour spas et salons partenaires.",
        },
      },
    },
    vendor: { createAction: "Créer", createAuction: "Créer enchère", createListing: "Créer annonce",
      createAuctionSubtitle: "Enchères limitées dans le temps", createListingSubtitle: "Ventes à prix fixe",
      auctionsTab: "Enchères", directListingsTab: "Ventes directes", winnersOrdersTab: "Gagnants & Commandes",
    },
  },
} as const;

const IGNORED_SEGMENTS = new Set([
  'title',
  'subtitle',
  'heading',
  'body',
  'description',
  'desc',
  'label',
  'cta',
  'copy',
  'text',
  'helper',
  'help',
  'note',
  'summary',
  'status',
  'badge',
  'empty',
  'message',
  'count',
  'item',
  'items',
  'value',
  'tooltip',
  'error',
  'success',
  'warning',
  'placeholder',
  'primary',
  'secondary',
]);

function humanizeSegment(segment: string): string {
  const cleaned = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map(word => {
      if (!word) return word;
      if (word.length <= 3) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatMissingTranslation(key: string): string {
  const parts = key.split('.').filter(Boolean);
  if (!parts.length) return key;

  let fallback = parts[parts.length - 1];
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const segment = parts[index];
    if (!IGNORED_SEGMENTS.has(segment)) {
      fallback = segment;
      break;
    }
  }

  const humanized = humanizeSegment(fallback);
  if (humanized) {
    return humanized;
  }

  const joined = parts.map(humanizeSegment).filter(Boolean).join(' ');
  return joined || key;
}

type TranslationKey = keyof typeof translations.en;

const I18nContext = createContext<{
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
} | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    trackEvent('lang_change', { locale: newLocale });
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    const template = typeof value === 'string' ? value : formatMissingTranslation(key);

    if (params) {
      return template.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return template;
  }, [locale]);

  const contextValue = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};