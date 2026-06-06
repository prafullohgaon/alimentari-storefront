/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  ShoppingBag,
  Clock,
  MapPin,
  CreditCard,
  Heart,
  LogOut,
  Calendar,
  CheckCircle,
  Plus,
  Play,
  Pause,
  SkipForward,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS, Product } from "@/lib/data";
import { DICTIONARY, Locale } from "@/lib/dictionary";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer, CartItem } from "@/components/grocery/cart-drawer";
import { Notification } from "@/components/grocery/notification";

interface MockSubscriptionItem {
  productId: string;
  quantity: number;
}

interface MockSubscription {
  id: string;
  name: string;
  items: MockSubscriptionItem[];
  frequency: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused";
  nextDelivery: string;
  deliveryDay: string;
  paymentMethodId: string;
}

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";

export default function AccountDashboard() {
  const router = useRouter();
  const { locale, setLocale, dict: t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "profilo" | "ordini" | "abbonamenti" | "indirizzi" | "pagamenti" | "preferenze" | "wishlist" | "carrelli"
  >("profilo");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "wishlist") {
        setActiveTab("wishlist");
      }
    }
  }, []);

  // Page UI States
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Profile Loading state
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Profile Form States
  const [fullName, setFullName] = useState("Giovanni Rossi");
  const [email, setEmail] = useState("giovanni.rossi@example.com");
  const [phone, setPhone] = useState("+39 345 6789 012");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Saved Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      title: "Casa Milano",
      fullName: "Giovanni Rossi",
      address: "Via della Spiga 12",
      city: "Milano",
      province: "MI",
      zip: "20121",
      isDefault: true
    },
    {
      id: "addr-2",
      title: "Ufficio",
      fullName: "Giovanni Rossi c/o TechCorp",
      address: "Corso Buenos Aires 45",
      city: "Milano",
      province: "MI",
      zip: "20124",
      isDefault: false
    }
  ]);

  const [newAddrTitle, setNewAddrTitle] = useState("");
  const [newAddrStreet, setNewAddrStreet] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Milano");
  const [newAddrZip, setNewAddrZip] = useState("20121");
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Zustand Global Stores Integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const token = useAuthStore((state) => state.token);
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);

  // Unified Session Redirection & Profile Fetching
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeToken = useAuthStore.getState().token;
      if (!activeToken) {
        router.push("/accedi");
        return;
      }

      const fetchProfile = async () => {
        try {
          const { getCustomerProfile } = await import("@/lib/shopify");
          const profileData = await getCustomerProfile(activeToken);
          if (profileData) {
            setProfile(profileData);
            setFullName(`${profileData.firstName} ${profileData.lastName}`.trim() || "Cliente Alimentari");
            setEmail(profileData.email);
            setPhone(profileData.phone || "");
            
            if (profileData.addresses && profileData.addresses.length > 0) {
              setAddresses(
                profileData.addresses.map((addr: any, index: number) => ({
                  id: addr.id,
                  title: index === 0 ? "Indirizzo Principale" : `Indirizzo Aggiuntivo ${index}`,
                  fullName: `${profileData.firstName} ${profileData.lastName}`,
                  address: addr.address1 + (addr.address2 ? `, ${addr.address2}` : ""),
                  city: addr.city,
                  province: addr.province || "MI",
                  zip: addr.zip,
                  isDefault: profileData.defaultAddress?.id === addr.id
                }))
              );
            }
          } else {
            logout();
            router.push("/accedi");
          }
        } catch (err) {
          console.error("Failed to load customer profile:", err);
        } finally {
          setIsProfileLoading(false);
        }
      };

      fetchProfile();
    }
  }, [token, setProfile, logout, router]);

  const handleQuantityChange = (productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = PRODUCTS.find((p) => p.id === productId);

    if (!existing && qty === 1 && productObj) {
      setToast({ id: String(Date.now()), product: productObj });
    }

    if (qty <= 0) {
      removeItem(productId);
    } else if (existing) {
      updateQuantity(productId, qty);
    } else if (productObj) {
      addItem(productObj, qty);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const token = localStorage.getItem("alimentari_customer_token");
      if (!token) return;

      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { customerUpdate } = await import("@/lib/shopify");
      const { success, error } = await customerUpdate(token, {
        firstName,
        lastName,
        phone,
        email
      });

      if (success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        alert(error || "Errore durante l'aggiornamento del profilo.");
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione.");
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrTitle || !newAddrStreet) return;
    
    try {
      const token = localStorage.getItem("alimentari_customer_token");
      if (!token) return;

      const { customerAddressCreate } = await import("@/lib/shopify");
      const { address: createdAddr, error } = await customerAddressCreate(token, {
        address1: newAddrStreet,
        city: newAddrCity,
        zip: newAddrZip,
        province: "MI",
        country: "Italia"
      });

      if (createdAddr) {
        const newAddr = {
          id: createdAddr.id,
          title: newAddrTitle,
          fullName: fullName,
          address: createdAddr.address1 + (createdAddr.address2 ? `, ${createdAddr.address2}` : ""),
          city: createdAddr.city,
          province: createdAddr.province || "MI",
          zip: createdAddr.zip,
          isDefault: false
        };
        setAddresses([...addresses, newAddr]);
        setNewAddrTitle("");
        setNewAddrStreet("");
        setShowAddAddress(false);
      } else {
        alert(error || "Errore durante la creazione dell'indirizzo.");
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione.");
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("alimentari_customer_token");
      if (!token) return;

      setAddresses(addresses.filter((a) => a.id !== id));

      const { customerAddressDelete } = await import("@/lib/shopify");
      const { success, error } = await customerAddressDelete(token, id);
      if (!success) {
        alert(error || "Errore durante la rimozione dell'indirizzo.");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione.");
    }
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id
      }))
    );
  };

  // Payment Methods States
  const [payments, setPayments] = useState([
    {
      id: "pay-1",
      type: "Visa",
      last4: "4242",
      expiry: "12/28",
      holder: "GIOVANNI ROSSI",
      isDefault: true
    },
    {
      id: "pay-2",
      type: "Mastercard",
      last4: "8899",
      expiry: "06/29",
      holder: "GIOVANNI ROSSI",
      isDefault: false
    }
  ]);

  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCVV, setNewCardCVV] = useState("");
  const [showAddPayment, setShowAddPayment] = useState(false);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardNumber.length < 16) return;
    const newPay = {
      id: `pay-${Date.now()}`,
      type: "Visa",
      last4: newCardNumber.slice(-4),
      expiry: newCardExpiry || "12/29",
      holder: "GIOVANNI ROSSI",
      isDefault: false
    };
    setPayments([...payments, newPay]);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCVV("");
    setShowAddPayment(false);
  };

  const deletePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  // Delivery preferences
  const [preferredWindow, setPreferredWindow] = useState("10:00 - 12:00");
  const [gateInstructions, setGateInstructions] = useState("Suonare Rossi. Lasciare al portiere se assente.");
  const [prefSuccess, setPrefSuccess] = useState(false);

  const handleSavePref = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  // Wishlist
  const wishlist = useWishlistStore((state) => state.ids);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  // Saved Carts (grocery lists)
  const [savedCarts] = useState([
    {
      id: "sc-1",
      name: "Spesa Domenica in Famiglia",
      items: [
        { productId: "1", qty: 1 },
        { productId: "3", qty: 2 },
        { productId: "4", qty: 2 },
        { productId: "7", qty: 1 }
      ]
    },
    {
      id: "sc-2",
      name: "Necessità Quotidiane Bio",
      items: [
        { productId: "8", qty: 2 },
        { productId: "9", qty: 1 },
        { productId: "10", qty: 4 }
      ]
    }
  ]);

  const loadSavedCartToActive = (items: { productId: string; qty: number }[]) => {
    useCartStore.getState().clearCart();
    items.forEach((it) => {
      const p = PRODUCTS.find((prod) => prod.id === it.productId);
      if (p) {
        useCartStore.getState().addItem(p, it.qty);
      }
    });
    useUiStore.getState().openCart();
  };

  // Grocery Subscriptions State
  const [subscriptions, setSubscriptions] = useState<MockSubscription[]>([
    {
      id: "sub-1",
      name: "Spesa Settimanale di Latticini & Dispensa",
      items: [
        { productId: "3", quantity: 1 }, // Parmigiano
        { productId: "11", quantity: 2 }, // Mozzarella
        { productId: "2", quantity: 3 } // Pasta Paccheri
      ],
      frequency: "weekly",
      status: "active",
      nextDelivery: "2026-05-30",
      deliveryDay: "Sabato",
      paymentMethodId: "pay-1"
    }
  ]);

  const toggleSubscriptionStatus = (id: string) => {
    setSubscriptions(
      subscriptions.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: s.status === "active" ? "paused" : "active"
          };
        }
        return s;
      })
    );
  };

  const skipNextDelivery = (id: string) => {
    setSubscriptions(
      subscriptions.map((s) => {
        if (s.id === id) {
          // Increment delivery date by 7 days
          const d = new Date(s.nextDelivery);
          d.setDate(d.getDate() + 7);
          const formatted = d.toISOString().split("T")[0];
          return {
            ...s,
            nextDelivery: formatted
          };
        }
        return s;
      })
    );
    alert(locale === "it" ? "Prossima consegna saltata con successo!" : "Next delivery successfully skipped!");
  };

  const updateSubFrequency = (id: string, freq: "weekly" | "biweekly" | "monthly") => {
    setSubscriptions(
      subscriptions.map((s) => {
        if (s.id === id) {
          return { ...s, frequency: freq };
        }
        return s;
      })
    );
  };

  // Orders Log
  const mockOrders = [
    {
      id: "ORD-2847",
      date: "18 Mag 2026",
      status: locale === "it" ? "Consegnato" : "Delivered",
      total: 78.4,
      items: [
        { productId: "1", qty: 1 }, // Olio Coratina
        { productId: "2", qty: 3 }, // Paccheri
        { productId: "3", qty: 2 } // Parmigiano Reggiano
      ]
    },
    {
      id: "ORD-2712",
      date: "04 Mag 2026",
      status: locale === "it" ? "Consegnato" : "Delivered",
      total: 45.2,
      items: [
        { productId: "11", qty: 2 }, // Mozzarella Bufala
        { productId: "10", qty: 4 }, // Passata San Marzano
        { productId: "8", qty: 2 } // Limoni Sorrento
      ]
    }
  ];

  const handleReorder = (items: { productId: string; qty: number }[]) => {
    items.forEach((it) => {
      const prod = PRODUCTS.find((p) => p.id === it.productId);
      if (prod) {
        addItem(prod, it.qty);
      }
    });
    useUiStore.getState().openCart();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 flex flex-col font-sans">
      <DesktopNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
      />

      <MobileNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Title Toggler */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/80 pb-6 mb-8 gap-4 select-none">
          <div className="space-y-1">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {t.dashboard.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "it"
                ? "Gestisci la tua spesa, abbonamenti ricorrenti e preferenze di consegna"
                : "Manage your shopping, recurring subscriptions and delivery options"}
            </p>
          </div>

          {/* Controls Bar: Language + Logout */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-muted/10 font-bold text-xs select-none">
              <button
                onClick={() => setLocale("it")}
                className={cn(
                  "px-3 py-1.5 rounded",
                  locale === "it" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                IT
              </button>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "px-3 py-1.5 rounded",
                  locale === "en" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                EN
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.push("/accedi");
              }}
              className="text-error border-error/20 hover:bg-error/5 flex items-center gap-1.5 h-9 font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.logout}</span>
            </Button>
          </div>
        </div>

        {/* Dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column Navigation */}
          <aside className="space-y-1 select-none">
            {[
              { id: "profilo" as const, label: t.dashboard.profile, icon: UserIcon },
              { id: "ordini" as const, label: t.dashboard.orders, icon: ShoppingBag },
              { id: "abbonamenti" as const, label: t.dashboard.subscriptions, icon: Calendar },
              { id: "wishlist" as const, label: locale === "it" ? "Lista dei Desideri" : "Wishlist", icon: Heart },
              { id: "carrelli" as const, label: locale === "it" ? "Liste Spesa Salvate" : "Saved Grocery Lists", icon: TrendingUp },
              { id: "indirizzi" as const, label: t.dashboard.addresses, icon: MapPin },
              { id: "pagamenti" as const, label: t.dashboard.payments, icon: CreditCard },
              { id: "preferenze" as const, label: t.dashboard.preferences, icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-3",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  )}
                >
                  <Icon className="w-4.5 h-4.5 stroke-[2]" />
                  <span>{tab.label}</span>
                  {tab.id === "abbonamenti" && subscriptions.length > 0 && (
                    <span className="ml-auto bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Right Column content panel */}
          <section className="lg:col-span-3 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-soft"
              >
                {/* 1. PROFILE TAB */}
                {activeTab === "profilo" && (
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {locale === "it" ? "Informazioni Personali" : "Personal Information"}
                    </h3>

                    {profileSuccess && (
                      <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle className="w-5 h-5" />
                        {locale === "it"
                          ? "Profilo aggiornato con successo!"
                          : "Profile successfully updated!"}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                          {t.auth.fullName}
                        </label>
                        <Input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Giovanni Rossi"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                          {t.auth.email}
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="giovanni.rossi@example.com"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                          {locale === "it" ? "Numero di Telefono" : "Phone Number"}
                        </label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+39 345 6789 012"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button type="submit" variant="primary" className="font-bold text-sm shadow-soft">
                        {locale === "it" ? "Salva Modifiche" : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* 2. ORDERS LOG TAB */}
                {activeTab === "ordini" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {locale === "it" ? "I Miei Ordini Recenti" : "My Recent Orders"}
                    </h3>

                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-border/80 rounded-xl p-4 md:p-6 bg-card space-y-4 shadow-soft"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 gap-2">
                            <div className="space-y-0.5">
                              <span className="text-xs text-muted-foreground font-semibold">
                                {order.date}
                              </span>
                              <h4 className="font-bold text-sm text-foreground">
                                {t.dashboard.orderNo} {order.id}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className="bg-success/10 text-success border border-success/20 font-bold px-2 py-0.5">
                                {order.status}
                              </Badge>
                              <span className="font-bold text-sm">€{order.total.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {order.items.map((it) => {
                              const p = PRODUCTS.find((prod) => prod.id === it.productId);
                              if (!p) return null;
                              return (
                                <div key={it.productId} className="flex gap-2.5 items-center">
                                  <div className="w-10 h-10 relative flex-shrink-0 rounded border overflow-hidden">
                                    <Image
                                      src={p.imageUrl}
                                      alt={p.name}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                        e.currentTarget.srcset = "";
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-semibold text-foreground truncate">
                                      {p.name}
                                    </h5>
                                    <span className="text-[10px] text-muted-foreground block font-bold">
                                      {it.qty} x {p.unit}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-3 border-t border-border/50 flex justify-end">
                            <Button
                              onClick={() => handleReorder(order.items)}
                              variant="outline"
                              size="sm"
                              className="font-bold text-xs hover:border-primary hover:text-primary"
                            >
                              {t.dashboard.reorder}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SUBSCRIPTIONS (SUBSCRIBE & SAVE) */}
                {activeTab === "abbonamenti" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-2">
                      <h3 className="font-serif text-2xl font-bold tracking-tight">
                        {locale === "it" ? "Abbonamenti Ricorrenti Spesa" : "Recurring Grocery Subscriptions"}
                      </h3>
                      <Badge variant="outline" className="text-primary border-primary bg-primary/5 font-bold">
                        Subscribe & Save
                      </Badge>
                    </div>

                    {subscriptions.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground select-none">
                        {locale === "it"
                          ? "Non hai abbonamenti spesa attivi."
                          : "You do not have any active grocery subscriptions."}
                      </div>
                    ) : (
                      subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="border border-border rounded-xl p-5 md:p-6 bg-card space-y-6 shadow-soft"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/50 gap-4">
                            <div className="space-y-1">
                              <h4 className="font-serif text-lg font-bold text-foreground">
                                {sub.name}
                              </h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
                                <span className="flex items-center gap-1.5 text-foreground">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  {locale === "it" ? "Consegna:" : "Delivery:"} {sub.frequency === "weekly" ? "Ogni Settimana" : "Ogni 2 Settimane"} ({sub.deliveryDay})
                                </span>
                                <span>
                                  {locale === "it" ? "Prossima Spesa:" : "Next Order:"} <strong>{sub.nextDelivery}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {sub.status === "active" ? (
                                <Badge className="bg-success/15 text-success border border-success/20 font-bold">
                                  {t.dashboard.active}
                                </Badge>
                              ) : (
                                <Badge className="bg-muted text-muted-foreground font-bold">
                                  {t.dashboard.paused}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Subscriptions Items */}
                          <div className="space-y-3.5">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                              {locale === "it" ? "Prodotti in Consegna" : "Recurring Products"}
                            </h5>

                            <div className="divide-y divide-border/60">
                              {sub.items.map((it) => {
                                const p = PRODUCTS.find((prod) => prod.id === it.productId);
                                if (!p) return null;
                                return (
                                  <div key={it.productId} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center justify-between">
                                    <div className="flex gap-3 items-center">
                                      <div className="w-12 h-12 relative flex-shrink-0 rounded border overflow-hidden">
                                        <Image
                                          src={p.imageUrl}
                                          alt={p.name}
                                          fill
                                          sizes="48px"
                                          className="object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                            e.currentTarget.srcset = "";
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <h6 className="text-sm font-semibold text-foreground leading-snug">
                                          {p.name}
                                        </h6>
                                        <span className="text-xs text-muted-foreground">
                                          {p.unit} • €{p.price.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-bold text-foreground">
                                        Q.tà: {it.quantity}
                                      </span>
                                      <span className="font-bold text-sm text-foreground">
                                        €{(p.price * it.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Controls Row */}
                          <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground">{locale === "it" ? "Frequenza:" : "Frequency:"}</span>
                              <select
                                value={sub.frequency}
                                onChange={(e) => updateSubFrequency(sub.id, e.target.value as "weekly" | "biweekly" | "monthly")}
                                className="bg-transparent text-xs font-bold text-foreground border border-border rounded px-2.5 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                              >
                                <option value="weekly">{locale === "it" ? "Ogni Settimana" : "Every Week"}</option>
                                <option value="biweekly">{locale === "it" ? "Ogni 2 Settimane" : "Every 2 Weeks"}</option>
                                <option value="monthly">{locale === "it" ? "Ogni Mese" : "Every Month"}</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Skip delivery */}
                              <Button
                                onClick={() => skipNextDelivery(sub.id)}
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-bold flex items-center gap-1 hover:border-primary hover:text-primary"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                {t.dashboard.skipNext}
                              </Button>

                              {/* Toggle pause/resume */}
                              <Button
                                onClick={() => toggleSubscriptionStatus(sub.id)}
                                variant={sub.status === "active" ? "outline" : "primary"}
                                size="sm"
                                className={cn(
                                  "h-9 px-3 text-xs font-bold flex items-center gap-1",
                                  sub.status === "active" ? "text-error border-error/20 hover:bg-error/5" : ""
                                )}
                              >
                                {sub.status === "active" ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5" />
                                    {locale === "it" ? "Sospendi" : "Pause"}
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5" />
                                    {locale === "it" ? "Attiva" : "Resume"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. WISHLIST */}
                {activeTab === "wishlist" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {locale === "it" ? "La Mia Spesa Preferita" : "My Favorite Groceries"}
                    </h3>

                    {wishlist.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground select-none">
                        {locale === "it" ? "Nessun prodotto preferito." : "No favorite products saved."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {wishlist.map((wId) => {
                          const p = PRODUCTS.find((prod) => prod.id === wId);
                          if (!p) return null;
                          return (
                            <div
                              key={wId}
                              className="border border-border/80 rounded-xl p-4 bg-card flex flex-col justify-between shadow-soft hover:shadow-premium transition-all duration-200"
                            >
                              <div className="space-y-2">
                                <div className="w-full h-28 relative rounded-lg overflow-hidden border">
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 240px"
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                      e.currentTarget.srcset = "";
                                    }}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-serif font-bold text-sm text-foreground truncate">
                                    {p.name}
                                  </h4>
                                  <span className="text-[11px] text-muted-foreground">
                                    {p.unit} • €{p.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 select-none">
                                <Button
                                  onClick={() => handleQuantityChange(p.id, 1)}
                                  variant="primary"
                                  size="sm"
                                  className="flex-grow font-bold text-xs h-8 shadow-soft"
                                >
                                  + Spesa
                                </Button>
                                <Button
                                  onClick={() => toggleWishlist(p.id)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 text-error border-error/10 hover:bg-error/5"
                                >
                                  &times;
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. SAVED CARTS / GROCERY LISTS */}
                {activeTab === "carrelli" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {locale === "it" ? "Liste della Spesa Salvate" : "Saved Grocery Lists"}
                    </h3>

                    <div className="space-y-4">
                      {savedCarts.map((sc) => (
                        <div
                          key={sc.id}
                          className="border border-border/80 rounded-xl p-4 md:p-5 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft"
                        >
                          <div className="space-y-2">
                            <h4 className="font-serif text-base font-bold text-foreground">
                              {sc.name}
                            </h4>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                              {sc.items.map((it) => {
                                const p = PRODUCTS.find((prod) => prod.id === it.productId);
                                if (!p) return null;
                                return (
                                  <span key={it.productId} className="bg-muted/15 border border-border px-2 py-0.5 rounded">
                                    {it.qty} x {p.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <Button
                            onClick={() => loadSavedCartToActive(sc.items)}
                            variant="primary"
                            size="sm"
                            className="font-bold text-xs h-9 shadow-soft self-end md:self-center"
                          >
                            {locale === "it" ? "Carica nel Carrello" : "Load to Cart"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. SAVED ADDRESSES */}
                {activeTab === "indirizzi" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50 mb-2">
                      <h3 className="font-serif text-2xl font-bold tracking-tight">
                        {t.dashboard.addresses}
                      </h3>

                      <Button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs h-9"
                      >
                        <Plus className="w-4 h-4 mr-1 text-primary" />
                        {locale === "it" ? "Aggiungi" : "Add Address"}
                      </Button>
                    </div>

                    {showAddAddress && (
                      <form onSubmit={handleAddAddress} className="border border-primary/20 rounded-xl p-4 space-y-4 bg-primary/5 select-none">
                        <h4 className="font-serif font-bold text-sm text-foreground">
                          {locale === "it" ? "Nuovo Indirizzo" : "New Address"}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Etichetta (es. Casa, Ufficio)"
                            value={newAddrTitle}
                            onChange={(e) => setNewAddrTitle(e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Via e numero civico"
                            value={newAddrStreet}
                            onChange={(e) => setNewAddrStreet(e.target.value)}
                            required
                          />
                          <Input
                            placeholder="CAP"
                            value={newAddrZip}
                            onChange={(e) => setNewAddrZip(e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Città"
                            value={newAddrCity}
                            onChange={(e) => setNewAddrCity(e.target.value)}
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddAddress(false)}
                            className="text-xs h-8"
                          >
                            {locale === "it" ? "Annulla" : "Cancel"}
                          </Button>
                          <Button type="submit" variant="primary" size="sm" className="font-bold text-xs h-8 shadow-soft">
                            {locale === "it" ? "Salva" : "Save"}
                          </Button>
                        </div>
                      </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={cn(
                            "border rounded-xl p-4 flex flex-col justify-between shadow-soft bg-card transition-all",
                            addr.isDefault ? "border-primary bg-primary/5" : "border-border/80"
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <h4 className="font-serif font-bold text-sm text-foreground capitalize">
                                {addr.title}
                              </h4>
                              {addr.isDefault && (
                                <Badge className="bg-primary text-primary-foreground font-bold text-[9px] px-1.5">
                                  {t.dashboard.defaultAddress}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {addr.fullName} <br />
                              {addr.address} <br />
                              {addr.zip} {addr.city} ({addr.province})
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 select-none">
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(addr.id)}
                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide mr-auto"
                              >
                                Predefinito
                              </button>
                            )}
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="text-[10px] font-bold text-error hover:underline uppercase tracking-wide ml-auto"
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. PAYMENT METHODS */}
                {activeTab === "pagamenti" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50 mb-2">
                      <h3 className="font-serif text-2xl font-bold tracking-tight">
                        {t.dashboard.payments}
                      </h3>

                      <Button
                        onClick={() => setShowAddPayment(!showAddPayment)}
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs h-9"
                      >
                        <Plus className="w-4 h-4 mr-1 text-primary" />
                        {locale === "it" ? "Nuova Carta" : "Add Card"}
                      </Button>
                    </div>

                    {showAddPayment && (
                      <form onSubmit={handleAddPayment} className="border border-primary/20 rounded-xl p-4 space-y-4 bg-primary/5 select-none">
                        <h4 className="font-serif font-bold text-sm text-foreground">
                          {locale === "it" ? "Associa Carta di Credito" : "Associate Credit Card"}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            placeholder="Numero di Carta (16 cifre)"
                            value={newCardNumber}
                            onChange={(e) => setNewCardNumber(e.target.value)}
                            maxLength={16}
                            required
                          />
                          <Input
                            placeholder="Scadenza (MM/AA)"
                            value={newCardExpiry}
                            onChange={(e) => setNewCardExpiry(e.target.value)}
                            maxLength={5}
                            required
                          />
                          <Input
                            placeholder="CVV"
                            type="password"
                            value={newCardCVV}
                            onChange={(e) => setNewCardCVV(e.target.value)}
                            maxLength={3}
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddPayment(false)}
                            className="text-xs h-8"
                          >
                            {locale === "it" ? "Annulla" : "Cancel"}
                          </Button>
                          <Button type="submit" variant="primary" size="sm" className="font-bold text-xs h-8 shadow-soft">
                            {locale === "it" ? "Salva" : "Save"}
                          </Button>
                        </div>
                      </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className={cn(
                            "border rounded-xl p-4 flex flex-col justify-between shadow-soft bg-card transition-all",
                            p.isDefault ? "border-primary bg-primary/5" : "border-border/80"
                          )}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded block w-max uppercase mb-1">
                                  {p.type}
                                </span>
                                <h4 className="font-serif font-bold text-sm text-foreground">
                                  •••• •••• •••• {p.last4}
                                </h4>
                              </div>
                              <CreditCard className="w-6 h-6 text-muted-foreground stroke-[1.5]" />
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span>Titolare: {p.holder}</span>
                              <span>Scad: {p.expiry}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 select-none">
                            {!p.isDefault && (
                              <button
                                onClick={() => deletePayment(p.id)}
                                className="text-[10px] font-bold text-error hover:underline uppercase tracking-wide ml-auto"
                              >
                                Rimuovi
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. DELIVERY PREFERENCES */}
                {activeTab === "preferenze" && (
                  <form onSubmit={handleSavePref} className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {t.dashboard.preferences}
                    </h3>

                    {prefSuccess && (
                      <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle className="w-5 h-5" />
                        {locale === "it" ? "Preferenze salvate con successo!" : "Preferences successfully saved!"}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                          {t.dashboard.preferredTime}
                        </label>
                        <select
                          value={preferredWindow}
                          onChange={(e) => setPreferredWindow(e.target.value)}
                          className="w-full h-11 bg-card text-foreground border rounded-lg px-4 text-base transition-all focus:border-primary outline-none cursor-pointer"
                        >
                          <option value="08:00 - 10:00">08:00 - 10:00 (Mattina)</option>
                          <option value="10:00 - 12:00">10:00 - 12:00 (Mattina)</option>
                          <option value="14:00 - 16:00">14:00 - 16:00 (Pomeriggio)</option>
                          <option value="18:00 - 20:00">18:00 - 20:00 (Sera)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                          {locale === "it" ? "Istruzioni per il Corriere" : "Notes for the courier"}
                        </label>
                        <textarea
                          rows={4}
                          value={gateInstructions}
                          onChange={(e) => setGateInstructions(e.target.value)}
                          className="w-full bg-card text-foreground border border-border rounded-lg p-4 text-base transition-all focus:border-primary outline-none resize-none"
                          placeholder="es. Suonare citofono Rossi, secondo piano..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button type="submit" variant="primary" className="font-bold text-sm shadow-soft">
                        {locale === "it" ? "Salva Preferenze" : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
