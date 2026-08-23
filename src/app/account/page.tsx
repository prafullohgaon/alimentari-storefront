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
  TrendingUp,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Printer,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, PRODUCTS } from "@/lib/data";
import { getProducts } from "@/lib/shopify";
import { DICTIONARY, Locale } from "@/lib/dictionary";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer, CartItem } from "@/components/grocery/cart-drawer";
import { Notification } from "@/components/grocery/notification";
import { cartStorage } from "@/lib/cart-storage";
import { getProvinces, getCitiesForProvince, findProvinceByNameOrCode } from "@/data/italy-locations";
import { getCountries, getCountryNameForShopify, normalizeCountryToCode } from "@/data/countries";
import {
  getSubdivisionLabel,
  getSubdivisionsForCountry,
  getCitiesForSubdivision,
  matchSavedSubdivision,
  getProvinceNameForShopify,
  getItalyRegions,
  getItalyProvincesForRegion,
  getRegionForProvince,
  validateItalianCap,
} from "@/lib/location-helper";

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
import { signOut, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import { useDeliveryPreferencesStore } from "@/store/delivery-preferences";
import { useSavedListsStore, SavedGroceryList, SavedListItem } from "@/store/saved-lists";

export default function AccountDashboard() {
  const router = useRouter();
  const { locale, setLocale, dict: t, t: tFunc } = useTranslation();
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>({});

  // Saved Addresses State
  interface AddressItem {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    fullName: string;
    address1: string;
    address2: string;
    address: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form Fields
  const [addrFirstName, setAddrFirstName] = useState("");
  const [addrLastName, setAddrLastName] = useState("");
  const [addrTitle, setAddrTitle] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrApartment, setAddrApartment] = useState("");
  const [addrRegion, setAddrRegion] = useState("");
  const [addrCity, setAddrCity] = useState("Milano");
  const [addrProvince, setAddrProvince] = useState("MI");
  const [addrZip, setAddrZip] = useState("20121");
  const [addrCountry, setAddrCountry] = useState("IT");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Address Form Validation & Action Loading States
  const [addrFieldErrors, setAddrFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    street?: string;
    city?: string;
    province?: string;
    region?: string;
    zip?: string;
    country?: string;
    phone?: string;
  }>({});

  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [settingDefaultAddressId, setSettingDefaultAddressId] = useState<string | null>(null);
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Zustand Global Stores Integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const token = useAuthStore((state) => state.token);
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);

  const { data: session, status } = useSession();

  // Real Shopify Orders State
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  // Unified Session Redirection & Profile Fetching
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Immediate hydration from NextAuth Session if available
      if (session?.user) {
        if (session.user.name && !firstName && !lastName) {
          const parts = session.user.name.trim().split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (session.user.email && !email) {
          setEmail(session.user.email);
        }
      }

      const sessionToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;

      if (!sessionToken) {
        setIsProfileLoading(false);
        setIsOrdersLoading(false);
        return;
      }

      const fetchProfileAndOrders = async () => {
        try {
          const { getCustomerProfile, getCustomerOrders } = await import("@/lib/shopify");

          // Fetch profile and orders in parallel
          const [profileData, ordersData] = await Promise.all([
            getCustomerProfile(sessionToken),
            getCustomerOrders(sessionToken)
          ]);

          if (profileData) {
            setProfile(profileData);

            if (profileData.firstName || profileData.lastName) {
              setFirstName(profileData.firstName || "");
              setLastName(profileData.lastName || "");
            } else if (session?.user?.name) {
              const nameParts = session.user.name.trim().split(" ");
              setFirstName(nameParts[0] || "");
              setLastName(nameParts.slice(1).join(" ") || "");
            }

            if (profileData.email) {
              setEmail(profileData.email);
            } else if (session?.user?.email) {
              setEmail(session.user.email);
            }

            setPhone(profileData.phone || "");

            const calculatedName = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() || session?.user?.name || "Cliente Alimentari";
            
            if (profileData.addresses && profileData.addresses.length > 0) {
              const defaultAddrId = profileData.defaultAddress?.id;
              setAddresses(
                profileData.addresses.map((addr: any, index: number) => {
                  const isDef = defaultAddrId ? addr.id === defaultAddrId : index === 0;
                  const addrFullName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
                  return {
                    id: addr.id || `addr-${index}`,
                    title: isDef ? "Indirizzo Principale" : `Indirizzo Aggiuntivo ${index}`,
                    firstName: addr.firstName || profileData.firstName || "",
                    lastName: addr.lastName || profileData.lastName || "",
                    fullName: addrFullName || calculatedName,
                    address1: addr.address1 || "",
                    address2: addr.address2 || "",
                    address: (addr.address1 || "") + (addr.address2 ? `, ${addr.address2}` : ""),
                    city: addr.city || "",
                    province: addr.province || "MI",
                    zip: addr.zip || "",
                    country: addr.country || "Italia",
                    phone: addr.phone || "",
                    isDefault: isDef,
                  };
                })
              );
            } else {
              setAddresses([]);
            }
          }

          if (ordersData) {
            setCustomerOrders(ordersData);
          }
        } catch (err) {
          console.error("Failed to load customer profile and orders:", err);
        } finally {
          setIsProfileLoading(false);
          setIsOrdersLoading(false);
        }
      };

      fetchProfileAndOrders();
    }
  }, [session, token, setProfile, logout, router]);

  const handleQuantityChange = (productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = existing?.product;

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
    if (isSavingProfile) return;

    setProfileSuccess(false);
    setProfileError(null);
    setFieldErrors({});

    const errors: { firstName?: string; lastName?: string; email?: string; phone?: string } = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      errors.firstName = locale === "it" ? "Inserisci il tuo nome" : "First name is required";
    }

    if (!trimmedLastName) {
      errors.lastName = locale === "it" ? "Inserisci il tuo cognome" : "Last name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = locale === "it" ? "Inserisci la tua email" : "Email is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = locale === "it" ? "Inserisci un indirizzo email valido" : "Please enter a valid email address";
    }

    if (trimmedPhone && trimmedPhone.replace(/\D/g, "").length < 6) {
      errors.phone = locale === "it" ? "Numero di telefono non valido" : "Please enter a valid phone number";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const customerToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;
    if (!customerToken) {
      setProfileError(locale === "it" ? "Sessione scaduta. Effettua nuovamente l'accesso." : "Session expired. Please log in again.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const previousEmail = useAuthStore.getState().profile?.email || email || session?.user?.email;
      const { customerUpdate, getCustomerProfile } = await import("@/lib/shopify");
      const { success, error } = await customerUpdate(customerToken, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined
      });

      if (success) {
        const updatedProfile = await getCustomerProfile(customerToken);
        if (updatedProfile) {
          setProfile(updatedProfile);
          setFirstName(updatedProfile.firstName || trimmedFirstName);
          setLastName(updatedProfile.lastName || trimmedLastName);
          setEmail(updatedProfile.email || trimmedEmail);
          setPhone(updatedProfile.phone || trimmedPhone);
        }

        // Re-synchronize active cart buyer identity if email address changed
        const isEmailChanged = Boolean(
          previousEmail &&
          trimmedEmail &&
          previousEmail.toLowerCase().trim() !== trimmedEmail.toLowerCase().trim()
        );

        if (isEmailChanged) {
          try {
            await useCartStore.getState().associateBuyerIdentity(customerToken, trimmedEmail);
          } catch (cartErr) {
            console.error("[handleProfileSave] Non-destructive error re-syncing cart buyer identity:", cartErr);
          }
        }

        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 4000);
      } else {
        setProfileError(error || (locale === "it" ? "Errore durante l'aggiornamento del profilo." : "Failed to update profile."));
      }
    } catch (err) {
      console.error(err);
      setProfileError(locale === "it" ? "Errore di connessione durante il salvataggio." : "Connection error while saving.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword) return;

    setPasswordSuccess(false);
    setPasswordError(null);

    const activeEmail = email || session?.user?.email;
    if (!activeEmail) {
      setPasswordError(t.dashboard.passwordChangeFailed);
      return;
    }

    // Step 1: Client Validation
    if (!currentPassword) {
      setPasswordError(t.dashboard.currentPasswordIncorrect);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError(t.dashboard.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.dashboard.passwordsDoNotMatch);
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(t.dashboard.samePasswordError);
      return;
    }

    const customerToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;
    if (!customerToken) {
      setPasswordError(t.dashboard.sessionRefreshRequired);
      return;
    }

    setIsChangingPassword(true);

    try {
      const { customerLogin, updateCustomerPassword } = await import("@/lib/shopify");

      // Step 2: Verify current password
      const verifyRes = await customerLogin(activeEmail, currentPassword);
      if (verifyRes.error || !verifyRes.token) {
        setPasswordError(t.dashboard.currentPasswordIncorrect);
        setIsChangingPassword(false);
        return;
      }

      // Step 3: Update password on Shopify using active customer token
      const { success, error } = await updateCustomerPassword(customerToken, newPassword);

      if (!success) {
        setPasswordError(error || t.dashboard.passwordChangeFailed);
        setIsChangingPassword(false);
        return;
      }

      // Step 4: Immediately acquire fresh access token using new password
      const newTokenRes = await customerLogin(activeEmail, newPassword);

      if (newTokenRes.token) {
        // Step 5: Update Auth Store with fresh token
        useAuthStore.getState().login(newTokenRes.token);

        // Step 6: Re-synchronize active cart buyer identity with new token
        const activeCartId = useCartStore.getState().cartId;
        if (activeCartId) {
          useCartStore.getState().associateBuyerIdentity(newTokenRes.token, activeEmail);
        }

        // Step 7: Clear form fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Step 8: Success feedback
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 5000);
      } else {
        // Password changed on Shopify, but fresh token creation failed
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError(t.dashboard.sessionRefreshRequired);
      }
    } catch (err) {
      console.error("[handlePasswordChangeSubmit] Error:", err);
      setPasswordError(t.dashboard.passwordChangeFailed);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const subdivisions = React.useMemo(() => {
    if (addrCountry === "IT") {
      if (!addrRegion) return [];
      const list = getItalyProvincesForRegion(addrRegion);
      if (addrProvince && !list.some((s) => s.code === addrProvince || s.rawName === addrProvince)) {
        return [{ code: addrProvince, name: addrProvince, rawName: addrProvince }, ...list];
      }
      return list;
    }
    const list = getSubdivisionsForCountry(addrCountry);
    if (addrProvince && !list.some((s) => s.code === addrProvince || s.rawName === addrProvince)) {
      return [{ code: addrProvince, name: addrProvince, rawName: addrProvince }, ...list];
    }
    return list;
  }, [addrCountry, addrRegion, addrProvince]);

  const subdivisionLabel = React.useMemo(() => {
    return getSubdivisionLabel(addrCountry, locale);
  }, [addrCountry, locale]);

  const availableCities = React.useMemo(() => {
    if (!addrProvince) return [];
    const list = getCitiesForSubdivision(addrCountry, addrProvince);
    if (addrCity && !list.includes(addrCity)) {
      return [addrCity, ...list];
    }
    return list;
  }, [addrCountry, addrProvince, addrCity]);

  const resetAddressForm = () => {
    setAddrFirstName(firstName || (session?.user?.name ? session.user.name.split(" ")[0] : ""));
    setAddrLastName(lastName || (session?.user?.name ? session.user.name.split(" ").slice(1).join(" ") : ""));
    setAddrTitle("");
    setAddrStreet("");
    setAddrApartment("");
    setAddrRegion("");
    setAddrCity("");
    setAddrProvince("");
    setAddrZip("");
    setAddrCountry("IT");
    setAddrPhone(phone || "");
    setAddrIsDefault(false);
    setAddrFieldErrors({});
    setEditingAddressId(null);
  };

  const handleOpenAddAddress = () => {
    resetAddressForm();
    setShowAddAddress(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddrFirstName(addr.firstName || firstName || "");
    setAddrLastName(addr.lastName || lastName || "");
    setAddrTitle(addr.title || "");
    setAddrStreet(addr.address1 || "");
    setAddrApartment(addr.address2 || "");

    // Normalize country to ISO code ("IT", "FR", "US", etc.)
    const countryCode = normalizeCountryToCode(addr.country);
    setAddrCountry(countryCode);

    if (countryCode === "IT") {
      const reg = getRegionForProvince(addr.province);
      setAddrRegion(reg || "");
      const provCode = matchSavedSubdivision(countryCode, addr.province);
      setAddrProvince(provCode);
    } else {
      setAddrRegion("");
      const provCode = matchSavedSubdivision(countryCode, addr.province);
      setAddrProvince(provCode);
    }

    setAddrCity(addr.city || "");
    setAddrZip(addr.zip || "");
    setAddrPhone(addr.phone || "");
    setAddrIsDefault(addr.isDefault);
    setAddrFieldErrors({});
    setShowAddAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAddress) return;

    setAddressSuccess(null);
    setAddressError(null);
    setAddrFieldErrors({});

    const errors: typeof addrFieldErrors = {};
    const trimmedFirstName = addrFirstName.trim();
    const trimmedLastName = addrLastName.trim();
    const trimmedStreet = addrStreet.trim();
    const trimmedCity = addrCity.trim();
    const trimmedProvince = addrProvince.trim();
    const trimmedZip = addrZip.trim();
    const trimmedCountry = addrCountry.trim();
    const trimmedPhone = addrPhone.trim();

    const normalizedCountryCode = normalizeCountryToCode(trimmedCountry);

    if (!trimmedFirstName) {
      errors.firstName = locale === "it" ? "Inserisci il nome" : "First name is required";
    }
    if (!trimmedLastName) {
      errors.lastName = locale === "it" ? "Inserisci il cognome" : "Last name is required";
    }
    if (!trimmedStreet) {
      errors.street = locale === "it" ? "Inserisci via e numero civico" : "Street address is required";
    }
    if (!trimmedCity) {
      errors.city = locale === "it" ? "Inserisci la città" : "City is required";
    }
    if (normalizedCountryCode === "IT" && !addrRegion) {
      errors.region = locale === "it" ? "Seleziona la regione" : "Region is required";
    }
    if ((normalizedCountryCode === "IT" || subdivisions.length > 0) && !trimmedProvince) {
      errors.province = locale === "it" ? `Seleziona ${subdivisionLabel.toLowerCase()}` : `${subdivisionLabel} is required`;
    }
    if (!trimmedZip) {
      errors.zip = locale === "it" ? "Inserisci il CAP" : "Postal code is required";
    } else if (normalizedCountryCode === "IT") {
      const capCheck = validateItalianCap(trimmedZip, trimmedProvince, trimmedCity, locale);
      if (!capCheck.isValid && capCheck.error) {
        errors.zip = capCheck.error;
      }
    }
    if (!trimmedCountry) {
      errors.country = locale === "it" ? "Inserisci il paese" : "Country is required";
    }
    if (trimmedPhone && trimmedPhone.replace(/\D/g, "").length < 6) {
      errors.phone = locale === "it" ? "Numero di telefono non valido" : "Invalid phone number";
    }

    if (Object.keys(errors).length > 0) {
      setAddrFieldErrors(errors);
      return;
    }

    const customerToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;
    if (!customerToken) {
      setAddressError(locale === "it" ? "Sessione scaduta. Effettua nuovamente l'accesso." : "Session expired. Please log in again.");
      return;
    }

    setIsSubmittingAddress(true);
    try {
      const { customerAddressCreate, customerAddressUpdate, customerDefaultAddressUpdate, getCustomerProfile } = await import("@/lib/shopify");

      const shopifyCountry = getCountryNameForShopify(normalizedCountryCode);
      const shopifyProvince = getProvinceNameForShopify(normalizedCountryCode, trimmedProvince);

      const mailingAddressInput = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        address1: trimmedStreet,
        address2: addrApartment.trim() || undefined,
        city: trimmedCity,
        province: shopifyProvince || undefined,
        zip: trimmedZip,
        country: shopifyCountry,
        phone: trimmedPhone || undefined,
      };

      let resultAddressId: string | null = null;
      let apiError: string | null = null;

      if (editingAddressId) {
        const { address: updatedAddr, error: updateErr } = await customerAddressUpdate(customerToken, editingAddressId, mailingAddressInput);
        if (updateErr) {
          apiError = updateErr;
        } else if (updatedAddr) {
          resultAddressId = updatedAddr.id;
        }
      } else {
        const { address: createdAddr, error: createErr } = await customerAddressCreate(customerToken, mailingAddressInput);
        if (createErr) {
          apiError = createErr;
        } else if (createdAddr) {
          resultAddressId = createdAddr.id;
        }
      }

      if (apiError) {
        setAddressError(apiError);
      } else {
        if (addrIsDefault && resultAddressId) {
          await customerDefaultAddressUpdate(customerToken, resultAddressId);
        }

        const calculatedName = `${trimmedFirstName} ${trimmedLastName}`.trim() || "Cliente Alimentari";
        const updatedProfile = await getCustomerProfile(customerToken);
        if (updatedProfile?.addresses) {
          const defaultAddrId = updatedProfile.defaultAddress?.id;
          setAddresses(
            updatedProfile.addresses.map((addr: any, index: number) => {
              const isDef = defaultAddrId ? addr.id === defaultAddrId : index === 0;
              const addrFullName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
              return {
                id: addr.id || `addr-${index}`,
                title: isDef ? "Indirizzo Principale" : `Indirizzo Aggiuntivo ${index}`,
                firstName: addr.firstName || updatedProfile.firstName || "",
                lastName: addr.lastName || updatedProfile.lastName || "",
                fullName: addrFullName || calculatedName,
                address1: addr.address1 || "",
                address2: addr.address2 || "",
                address: (addr.address1 || "") + (addr.address2 ? `, ${addr.address2}` : ""),
                city: addr.city || "",
                province: addr.province || "MI",
                zip: addr.zip || "",
                country: addr.country || "Italia",
                phone: addr.phone || "",
                isDefault: isDef,
              };
            })
          );
        }

        if (customerToken) {
          useCartStore.getState().associateBuyerIdentity(customerToken, email);
        }

        setAddressSuccess(
          editingAddressId
            ? (locale === "it" ? t.dashboard.addressSuccessUpdate : t.dashboard.addressSuccessUpdate)
            : (locale === "it" ? t.dashboard.addressSuccessAdd : t.dashboard.addressSuccessAdd)
        );
        setShowAddAddress(false);
        resetAddressForm();
        setTimeout(() => setAddressSuccess(null), 4000);
      }
    } catch (err) {
      console.error("Error saving address:", err);
      setAddressError(locale === "it" ? "Errore di connessione durante il salvataggio dell'indirizzo." : "Connection error while saving address.");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (deletingAddressId) return;

    const customerToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;
    if (!customerToken) {
      setAddressError(locale === "it" ? "Sessione scaduta." : "Session expired.");
      return;
    }

    setAddressSuccess(null);
    setAddressError(null);
    setDeletingAddressId(id);

    try {
      const { customerAddressDelete, getCustomerProfile } = await import("@/lib/shopify");
      const { success, error } = await customerAddressDelete(customerToken, id);

      if (!success) {
        setAddressError(error || (locale === "it" ? "Errore durante la rimozione dell'indirizzo." : "Failed to delete address."));
      } else {
        const calculatedName = `${firstName} ${lastName}`.trim() || "Cliente Alimentari";
        const updatedProfile = await getCustomerProfile(customerToken);
        if (updatedProfile) {
          const defaultAddrId = updatedProfile.defaultAddress?.id;
          setAddresses(
            (updatedProfile.addresses || []).map((addr: any, index: number) => {
              const isDef = defaultAddrId ? addr.id === defaultAddrId : index === 0;
              const addrFullName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
              return {
                id: addr.id || `addr-${index}`,
                title: isDef ? "Indirizzo Principale" : `Indirizzo Aggiuntivo ${index}`,
                firstName: addr.firstName || updatedProfile.firstName || "",
                lastName: addr.lastName || updatedProfile.lastName || "",
                fullName: addrFullName || calculatedName,
                address1: addr.address1 || "",
                address2: addr.address2 || "",
                address: (addr.address1 || "") + (addr.address2 ? `, ${addr.address2}` : ""),
                city: addr.city || "",
                province: addr.province || "MI",
                zip: addr.zip || "",
                country: addr.country || "Italia",
                phone: addr.phone || "",
                isDefault: isDef,
              };
            })
          );
        } else {
          setAddresses(addresses.filter((a) => a.id !== id));
        }

        if (customerToken) {
          useCartStore.getState().associateBuyerIdentity(customerToken, email);
        }

        setAddressSuccess(locale === "it" ? t.dashboard.addressSuccessDelete : t.dashboard.addressSuccessDelete);
        setTimeout(() => setAddressSuccess(null), 4000);
      }
    } catch (err) {
      console.error("Error deleting address:", err);
      setAddressError(locale === "it" ? "Errore di connessione." : "Network connection error.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (settingDefaultAddressId) return;

    const customerToken = (session as { accessToken?: string })?.accessToken || useAuthStore.getState().token;
    if (!customerToken) {
      setAddressError(locale === "it" ? "Sessione scaduta." : "Session expired.");
      return;
    }

    setAddressSuccess(null);
    setAddressError(null);
    setSettingDefaultAddressId(id);

    try {
      const { customerDefaultAddressUpdate, getCustomerProfile } = await import("@/lib/shopify");
      const { success, error } = await customerDefaultAddressUpdate(customerToken, id);

      if (!success) {
        setAddressError(error || (locale === "it" ? "Errore durante l'impostazione dell'indirizzo predefinito." : "Failed to set default address."));
      } else {
        const calculatedName = `${firstName} ${lastName}`.trim() || "Cliente Alimentari";
        const updatedProfile = await getCustomerProfile(customerToken);
        if (updatedProfile) {
          const defaultAddrId = updatedProfile.defaultAddress?.id;
          setAddresses(
            (updatedProfile.addresses || []).map((addr: any, index: number) => {
              const isDef = defaultAddrId ? addr.id === defaultAddrId : index === 0;
              const addrFullName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
              return {
                id: addr.id || `addr-${index}`,
                title: isDef ? "Indirizzo Principale" : `Indirizzo Aggiuntivo ${index}`,
                firstName: addr.firstName || updatedProfile.firstName || "",
                lastName: addr.lastName || updatedProfile.lastName || "",
                fullName: addrFullName || calculatedName,
                address1: addr.address1 || "",
                address2: addr.address2 || "",
                address: (addr.address1 || "") + (addr.address2 ? `, ${addr.address2}` : ""),
                city: addr.city || "",
                province: addr.province || "MI",
                zip: addr.zip || "",
                country: addr.country || "Italia",
                phone: addr.phone || "",
                isDefault: isDef,
              };
            })
          );
        } else {
          setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
        }

        if (customerToken) {
          useCartStore.getState().associateBuyerIdentity(customerToken, email);
        }

        setAddressSuccess(locale === "it" ? t.dashboard.addressSuccessDefault : t.dashboard.addressSuccessDefault);
        setTimeout(() => setAddressSuccess(null), 4000);
      }
    } catch (err) {
      console.error("Error setting default address:", err);
      setAddressError(locale === "it" ? "Errore di connessione." : "Network connection error.");
    } finally {
      setSettingDefaultAddressId(null);
    }
  };

  // Payment Methods States
  const [payments, setPayments] = useState<Array<{
    id: string;
    type: string;
    last4: string;
    expiry: string;
    holder: string;
    isDefault: boolean;
  }>>([]);

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
      holder: (`${firstName} ${lastName}`.trim() || session?.user?.name || "Cliente Alimentari").toUpperCase(),
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

  // Customer Key for Data Isolation
  const customerKey = email || session?.user?.email || "";

  // Delivery preferences
  const [preferredWindow, setPreferredWindow] = useState("10:00 - 12:00");
  const [gateInstructions, setGateInstructions] = useState("");
  const [prefSuccess, setPrefSuccess] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [isSavingPref, setIsSavingPref] = useState(false);

  // Hydrate Delivery Preferences when customerKey changes (Customer Isolation Guard)
  useEffect(() => {
    if (customerKey) {
      const saved = useDeliveryPreferencesStore.getState().getCustomerPreferences(customerKey);
      if (saved) {
        setPreferredWindow(saved.preferredWindow || "10:00 - 12:00");
        setGateInstructions(saved.gateInstructions || "");
      } else {
        setPreferredWindow("10:00 - 12:00");
        setGateInstructions("");
      }
    } else {
      setPreferredWindow("10:00 - 12:00");
      setGateInstructions("");
    }
  }, [customerKey]);

  const handleSavePref = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerKey) {
      setPrefError(locale === "it" ? "Sessione utente non identificata. Effettua l'accesso." : "User session not identified. Please log in.");
      return;
    }

    setIsSavingPref(true);
    setPrefSuccess(false);
    setPrefError(null);

    try {
      // 1. Persist preferences under authenticated customerKey in localStorage
      useDeliveryPreferencesStore.getState().setCustomerPreferences(customerKey, {
        preferredWindow,
        gateInstructions: gateInstructions.trim(),
      });

      // 2. Sync note & attributes to active Shopify Cart if cart exists
      const activeCartId = useCartStore.getState().cartId;
      if (activeCartId) {
        const { syncCartDeliveryPreferences } = await import("@/lib/shopify");
        const updatedCart = await syncCartDeliveryPreferences(activeCartId, {
          preferredWindow,
          gateInstructions: gateInstructions.trim(),
        });

        if (updatedCart) {
          useCartStore.setState({ checkoutUrl: updatedCart.checkoutUrl });
        }
      }

      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving delivery preferences:", err);
      setPrefError(locale === "it" ? "Errore durante il salvataggio delle preferenze." : "Failed to save delivery preferences.");
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleClearPref = async () => {
    if (!customerKey) return;
    setIsSavingPref(true);
    setPrefSuccess(false);
    setPrefError(null);

    try {
      useDeliveryPreferencesStore.getState().clearCustomerPreferences(customerKey);
      setPreferredWindow("10:00 - 12:00");
      setGateInstructions("");

      const activeCartId = useCartStore.getState().cartId;
      if (activeCartId) {
        const { syncCartDeliveryPreferences } = await import("@/lib/shopify");
        const updatedCart = await syncCartDeliveryPreferences(activeCartId, {
          preferredWindow: "",
          gateInstructions: "",
        });
        if (updatedCart) {
          useCartStore.setState({ checkoutUrl: updatedCart.checkoutUrl });
        }
      }
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      console.error("Error clearing preferences:", err);
    } finally {
      setIsSavingPref(false);
    }
  };

  // Catalog Product Resolution for Wishlist & Saved Lists
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    getProducts(50)
      .then((liveProducts) => {
        if (isMounted && liveProducts && liveProducts.length > 0) {
          setCatalogProducts((prev) => {
            const map = new Map<string, Product>();
            prev.forEach((p) => map.set(p.id, p));
            liveProducts.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const findCatalogProduct = (id: string): Product | null => {
    return (
      catalogProducts.find((p) => p.id === id || p.handle === id || p.variantId === id) ||
      cart.find((item) => item.product.id === id)?.product ||
      PRODUCTS.find((p) => p.id === id || p.handle === id || p.variantId === id) ||
      null
    );
  };

  // Wishlist
  const wishlist = useWishlistStore((state) => state.ids);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  // Saved Grocery Lists (Zustand store with customer isolation)
  const getCustomerLists = useSavedListsStore((state) => state.getCustomerLists);
  const createListAction = useSavedListsStore((state) => state.createList);
  const renameListAction = useSavedListsStore((state) => state.renameList);
  const deleteListAction = useSavedListsStore((state) => state.deleteList);
  const removeProductFromListAction = useSavedListsStore((state) => state.removeProductFromList);
  const updateItemQuantityAction = useSavedListsStore((state) => state.updateItemQuantity);

  const customerLists = customerKey ? getCustomerLists(customerKey) : [];

  // Saved Lists Modal / UI States
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListNameInput, setNewListNameInput] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListNameInput, setEditListNameInput] = useState("");
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerKey) return;
    const cleanName = newListNameInput.trim();
    if (!cleanName) return;

    createListAction(customerKey, cleanName);
    setNewListNameInput("");
    setShowCreateListModal(false);
  };

  const handleRenameListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerKey || !editingListId) return;
    const cleanName = editListNameInput.trim();
    if (!cleanName) return;

    renameListAction(customerKey, editingListId, cleanName);
    setEditingListId(null);
    setEditListNameInput("");
  };

  const handleDeleteListConfirm = () => {
    if (!customerKey || !deletingListId) return;
    deleteListAction(customerKey, deletingListId);
    setDeletingListId(null);
  };

  const loadSavedListToActiveCart = (items: SavedListItem[]) => {
    items.forEach((it) => {
      const p = findCatalogProduct(it.productId);
      if (p) {
        useCartStore.getState().addItem(p, it.quantity);
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

  const handleReorderOrder = (order: any) => {
    if (!order?.lineItems) return;
    order.lineItems.forEach((item: any) => {
      const reorderProduct: Product = {
        id: item.variantId || item.productId || `reorder-${Date.now()}`,
        name: item.title,
        price: parseFloat(item.price?.amount || "0"),
        unit: "1 pz",
        category: "Spesa",
        imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
        rating: 5,
      };
      addItem(reorderProduct, item.quantity || 1);
    });
    useUiStore.getState().openCart();
  };
  // Component-Level Unauthenticated Route Guard
  const hasAuthToken = Boolean(
    status === "authenticated" ||
    (session as unknown as { accessToken?: string })?.accessToken ||
    (typeof window !== "undefined" && useAuthStore.getState().token)
  );

  useEffect(() => {
    if (status === "unauthenticated" && !hasAuthToken) {
      router.replace("/accedi");
    }
  }, [status, hasAuthToken, router]);

  if (status === "loading" && !hasAuthToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
        <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground animate-pulse">{tFunc("account.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAuthToken && status === "unauthenticated") {
    return null;
  }

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
              onClick={async () => {
                logout();
                await signOut({ callbackUrl: "/accedi" });
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
          <aside className="space-y-4 select-none">
            {/* Authenticated User Summary Card */}
            <div className="p-4 border border-border/80 rounded-xl bg-card shadow-soft flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-serif font-bold text-lg flex items-center justify-center border border-primary/20 shrink-0">
                {firstName ? firstName[0]?.toUpperCase() : (session?.user?.name ? session.user.name[0]?.toUpperCase() : "C")}
              </div>
              <div className="min-w-0 flex-grow">
                {isProfileLoading && !firstName && !session?.user ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-4 bg-muted/30 rounded w-24" />
                    <div className="h-3 bg-muted/20 rounded w-32" />
                  </div>
                ) : (
                  <>
                    <h4 className="font-serif font-bold text-sm text-foreground truncate">
                      {`${firstName} ${lastName}`.trim() || session?.user?.name || "Cliente Alimentari"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {email || session?.user?.email || ""}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              {[
                { id: "profilo" as const, label: t.dashboard.profile, icon: UserIcon },
                { id: "ordini" as const, label: t.dashboard.orders, icon: ShoppingBag },
                { id: "abbonamenti" as const, label: t.dashboard.subscriptions, icon: Calendar },
                { id: "wishlist" as const, label: t.account?.tabs?.wishlist || (locale === "it" ? "Lista dei Desideri" : "Wishlist"), icon: Heart },
                { id: "carrelli" as const, label: t.account?.tabs?.carrelli || (locale === "it" ? "Liste Spesa Salvate" : "Saved Grocery Lists"), icon: TrendingUp },
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
            </div>
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
                  isProfileLoading && !firstName ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="h-8 bg-muted/30 rounded w-1/3 mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/20 rounded w-1/4" />
                          <div className="h-10 bg-muted/30 rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/20 rounded w-1/4" />
                          <div className="h-10 bg-muted/30 rounded" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <div className="h-4 bg-muted/20 rounded w-1/4" />
                          <div className="h-10 bg-muted/30 rounded" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <form onSubmit={handleProfileSave} className="space-y-6">
                        <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                          {locale === "it" ? "Informazioni Personali" : "Personal Information"}
                        </h3>

                        {profileSuccess && (
                          <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 font-semibold text-sm">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <span>
                              {locale === "it"
                                ? "Profilo aggiornato con successo!"
                                : "Profile successfully updated!"}
                            </span>
                          </div>
                        )}

                        {profileError && (
                          <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-2 font-semibold text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{profileError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.auth.firstName}
                            </label>
                            <Input
                              type="text"
                              value={firstName}
                              onChange={(e) => {
                                setFirstName(e.target.value);
                                if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                              }}
                              placeholder={t.auth.firstName}
                              className={cn(fieldErrors.firstName && "border-error focus-visible:ring-error")}
                            />
                            {fieldErrors.firstName && (
                              <p className="text-xs text-error font-medium pl-0.5 mt-1">{fieldErrors.firstName}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.auth.lastName}
                            </label>
                            <Input
                              type="text"
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
                              }}
                              placeholder={t.auth.lastName}
                              className={cn(fieldErrors.lastName && "border-error focus-visible:ring-error")}
                            />
                            {fieldErrors.lastName && (
                              <p className="text-xs text-error font-medium pl-0.5 mt-1">{fieldErrors.lastName}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.auth.email}
                            </label>
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                              }}
                              placeholder={t.auth.email}
                              className={cn(fieldErrors.email && "border-error focus-visible:ring-error")}
                            />
                            {fieldErrors.email && (
                              <p className="text-xs text-error font-medium pl-0.5 mt-1">{fieldErrors.email}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {locale === "it" ? "Numero di Telefono" : "Phone Number"}
                            </label>
                            <Input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                              }}
                              placeholder={tFunc("account.phonePlaceholder")}
                              className={cn(fieldErrors.phone && "border-error focus-visible:ring-error")}
                            />
                            {fieldErrors.phone && (
                              <p className="text-xs text-error font-medium pl-0.5 mt-1">{fieldErrors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-end">
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={isSavingProfile}
                            className="font-bold text-sm shadow-soft flex items-center gap-2"
                          >
                            {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                            <span>
                              {isSavingProfile
                                ? (locale === "it" ? "Salvataggio in corso..." : "Saving...")
                                : (locale === "it" ? "Salva Modifiche" : "Save Changes")}
                            </span>
                          </Button>
                        </div>
                      </form>

                      {/* CHANGE PASSWORD CARD */}
                      <div className="pt-8 border-t border-border">
                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
                          <div className="space-y-1">
                            <h3 className="font-serif text-2xl font-bold tracking-tight">
                              {t.dashboard.changePasswordTitle}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {locale === "it"
                                ? "Aggiorna la password del tuo account per mantenere il tuo profilo sicuro."
                                : "Update your account password to keep your profile secure."}
                            </p>
                          </div>

                          {passwordSuccess && (
                            <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 font-semibold text-sm">
                              <CheckCircle className="w-5 h-5 shrink-0" />
                              <span>{t.dashboard.passwordChangedSuccess}</span>
                            </div>
                          )}

                          {passwordError && (
                            <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-2 font-semibold text-sm">
                              <AlertCircle className="w-5 h-5 shrink-0" />
                              <span>{passwordError}</span>
                            </div>
                          )}

                          <div className="space-y-4 max-w-md">
                            {/* Current Password */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                                {t.dashboard.currentPasswordLabel}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showCurrentPassword ? "text" : "password"}
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  required
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                                {t.dashboard.newPasswordLabel}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  required
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Confirm New Password */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                                {t.dashboard.confirmNewPasswordLabel}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  required
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border flex justify-end">
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={isChangingPassword}
                              className="font-bold text-sm shadow-soft flex items-center gap-2"
                            >
                              {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                              <span>
                                {isChangingPassword
                                  ? t.dashboard.changingPassword
                                  : t.dashboard.changePasswordBtn}
                              </span>
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )
                )}

                {/* 2. ORDERS LOG TAB */}
                {activeTab === "ordini" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-bold tracking-tight mb-2">
                      {locale === "it" ? "I Miei Ordini Recenti" : "My Recent Orders"}
                    </h3>

                    {isOrdersLoading ? (
                      <div className="space-y-4 animate-pulse">
                        {[1, 2].map((n) => (
                          <div key={n} className="h-36 bg-muted/20 rounded-xl border border-border/50" />
                        ))}
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border rounded-2xl space-y-3">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                        <h4 className="font-serif text-lg font-bold text-foreground">
                          {locale === "it" ? "Nessun ordine effettuato" : "No orders found"}
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
                          {locale === "it"
                            ? "Non hai ancora effettuato ordini su Alimentari. Inizia ad acquistare le tue specialità preferite!"
                            : "You haven't placed any orders on Alimentari yet. Start shopping your favorite specialties!"}
                        </p>
                        <Button
                          onClick={() => router.push("/reparto")}
                          variant="primary"
                          className="text-xs font-bold mt-2"
                        >
                          {locale === "it" ? "Esplora i Reparti" : "Browse Store"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerOrders.map((order) => {
                          const formattedDate = new Date(order.processedAt).toLocaleDateString(
                            locale === "it" ? "it-IT" : "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          );
                          const totalAmt = parseFloat(order.totalPrice?.amount || "0").toFixed(2);
                          const currency = order.totalPrice?.currencyCode || "EUR";

                          return (
                            <div
                              key={order.id}
                              className="border border-border/80 rounded-xl p-4 md:p-6 bg-card space-y-4 shadow-soft"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-xs text-muted-foreground font-semibold">
                                    {formattedDate}
                                  </span>
                                  <h4 className="font-bold text-sm text-foreground">
                                    {t.dashboard.orderNo} {order.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <Badge className="bg-success/15 text-success border border-success/30 font-bold px-2 py-0.5 text-xs">
                                    {order.financialStatus === "PAID"
                                      ? locale === "it" ? "Pagato" : "Paid"
                                      : order.financialStatus}
                                  </Badge>
                                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 text-xs">
                                    {order.fulfillmentStatus === "FULFILLED"
                                      ? locale === "it" ? "Spedito" : "Fulfilled"
                                      : locale === "it" ? "In Elaborazione" : "Processing"}
                                  </Badge>
                                  <span className="font-bold text-base text-foreground ml-1">
                                    €{totalAmt}
                                  </span>
                                </div>
                              </div>

                              {/* Order Line Items */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {order.lineItems.map((item: any, idx: number) => (
                                  <div key={item.variantId || `item-${idx}`} className="flex gap-3 items-center">
                                    <div className="w-11 h-11 relative flex-shrink-0 rounded-lg border border-border/60 overflow-hidden bg-slate-50">
                                      <Image
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop"}
                                        alt={item.title}
                                        fill
                                        sizes="44px"
                                        className="object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                          e.currentTarget.srcset = "";
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-semibold text-foreground truncate">
                                        {item.title}
                                      </h5>
                                      <span className="text-[10px] text-muted-foreground block font-bold">
                                        {item.quantity}x • €{parseFloat(item.price?.amount || "0").toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Tracking Link (if available) */}
                              {order.trackingInfo && order.trackingInfo.length > 0 && (
                                <div className="p-3 bg-muted/15 border border-border/60 rounded-lg text-xs flex items-center justify-between">
                                  <span className="font-semibold text-muted-foreground">
                                    Tracciamento: <strong>{order.trackingInfo[0].company || "Spedizioniere"} #{order.trackingInfo[0].number}</strong>
                                  </span>
                                  {order.trackingInfo[0].url && (
                                    <a
                                      href={order.trackingInfo[0].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-bold text-xs"
                                    >
                                      Traccia Pacco →
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Actions Bar */}
                              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                                <button
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="text-xs font-bold text-primary hover:underline"
                                >
                                  {locale === "it" ? "Vedi Dettagli Complete →" : "View Full Details →"}
                                </button>

                                <Button
                                  onClick={() => handleReorderOrder(order)}
                                  variant="outline"
                                  size="sm"
                                  className="font-bold text-xs hover:border-primary hover:text-primary"
                                >
                                  {t.dashboard.reorder}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                                const p = findCatalogProduct(it.productId);
                                if (!p) {
                                  return (
                                    <div key={it.productId} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center justify-between text-xs text-muted-foreground">
                                      <span>{locale === "it" ? "Prodotto non disponibile" : "Product unavailable"} (ID: {it.productId})</span>
                                      <span className="font-bold">Q.tà: {it.quantity}</span>
                                    </div>
                                  );
                                }
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
                          const p = findCatalogProduct(wId);
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
                                  onClick={() => toggleWishlist(wId)}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60 mb-2">
                      <div>
                        <h3 className="font-serif text-2xl font-bold tracking-tight">
                          {locale === "it" ? "Liste della Spesa Salvate" : "Saved Grocery Lists"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {locale === "it"
                            ? "Crea e gestisci le tue liste spesa personalizzate per acquisti veloci."
                            : "Create and manage your custom grocery lists for fast shopping."}
                        </p>
                      </div>

                      <Button
                        onClick={() => {
                          setNewListNameInput("");
                          setShowCreateListModal(true);
                        }}
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs h-9 shadow-soft shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {locale === "it" ? "Crea Nuova Lista" : "Create New List"}
                      </Button>
                    </div>

                    {customerLists.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border/80 rounded-2xl bg-card/50 space-y-3 select-none">
                        <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                        <h4 className="font-serif text-lg font-bold text-foreground">
                          {locale === "it" ? "Nessuna lista salvata" : "No saved grocery lists"}
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
                          {locale === "it"
                            ? "Crea una lista per organizzare facilmente i tuoi prodotti preferiti e caricarli nel carrello in un click."
                            : "Create a list to organize your favorite products and add them to cart in a single click."}
                        </p>
                        <Button
                          onClick={() => {
                            setNewListNameInput("");
                            setShowCreateListModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1 text-primary" />
                          {locale === "it" ? "Crea Nuova Lista" : "Create New List"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {customerLists.map((sc) => (
                          <div
                            key={sc.id}
                            className="border border-border/80 rounded-2xl p-5 md:p-6 bg-card space-y-5 shadow-soft transition-all"
                          >
                            {/* List Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/50 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif text-lg font-bold text-foreground">
                                    {sc.name}
                                  </h4>
                                  <button
                                    onClick={() => {
                                      setEditingListId(sc.id);
                                      setEditListNameInput(sc.name);
                                    }}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors p-1"
                                    title={locale === "it" ? "Rinomina lista" : "Rename list"}
                                  >
                                    ✏️
                                  </button>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium block">
                                  {sc.items.length} {locale === "it" ? "prodotti in lista" : "items in list"} • {locale === "it" ? "Aggiornato:" : "Updated:"} {new Date(sc.updatedAt).toLocaleDateString(locale === "it" ? "it-IT" : "en-US")}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => loadSavedListToActiveCart(sc.items)}
                                  disabled={sc.items.length === 0}
                                  variant="primary"
                                  size="sm"
                                  className="font-bold text-xs h-9 shadow-soft"
                                >
                                  {locale === "it" ? "Carica Tutto nel Carrello" : "Add All to Cart"}
                                </Button>
                                <Button
                                  onClick={() => setDeletingListId(sc.id)}
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-2.5 text-error border-error/20 hover:bg-error/5 text-xs font-bold"
                                  title={locale === "it" ? "Elimina lista" : "Delete list"}
                                >
                                  &times;
                                </Button>
                              </div>
                            </div>

                            {/* List Items */}
                            {sc.items.length === 0 ? (
                              <div className="text-center py-6 text-xs text-muted-foreground italic">
                                {locale === "it"
                                  ? "Questa lista è vuota. Aggiungi prodotti dalle schede o dalle pagine dettaglio."
                                  : "This list is empty. Add products from product cards or detail pages."}
                              </div>
                            ) : (
                              <div className="divide-y divide-border/60">
                                {sc.items.map((it) => {
                                  const p = findCatalogProduct(it.productId);
                                  if (!p) {
                                    return (
                                      <div key={it.productId} className="py-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{locale === "it" ? "Prodotto non disponibile" : "Product unavailable"} (ID: {it.productId})</span>
                                        <button
                                          onClick={() => removeProductFromListAction(customerKey, sc.id, it.productId)}
                                          className="text-error hover:underline text-xs font-bold"
                                        >
                                          {locale === "it" ? "Rimuovi" : "Remove"}
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={it.productId} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-12 h-12 relative flex-shrink-0 rounded-lg border border-border/60 overflow-hidden bg-slate-50">
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
                                        <div className="min-w-0">
                                          <h5 className="text-sm font-semibold text-foreground truncate">
                                            {p.name}
                                          </h5>
                                          <span className="text-xs text-muted-foreground block font-medium">
                                            {p.unit} • €{p.price.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-3 select-none">
                                        {/* Quantity Selector */}
                                        <div className="flex items-center border border-border rounded-lg bg-card">
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantityAction(customerKey, sc.id, it.productId, it.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-muted/20"
                                          >
                                            -
                                          </button>
                                          <span className="w-8 text-center text-xs font-bold">
                                            {it.quantity}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantityAction(customerKey, sc.id, it.productId, it.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-muted/20"
                                          >
                                            +
                                          </button>
                                        </div>

                                        {/* Single Item Add to Cart */}
                                        <Button
                                          onClick={() => {
                                            addItem(p, it.quantity);
                                            useUiStore.getState().openCart();
                                          }}
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-xs font-bold hover:border-primary hover:text-primary"
                                        >
                                          + Spesa
                                        </Button>

                                        {/* Remove Item */}
                                        <button
                                          type="button"
                                          onClick={() => removeProductFromListAction(customerKey, sc.id, it.productId)}
                                          className="text-error/70 hover:text-error text-xs font-bold p-1"
                                          title={locale === "it" ? "Rimuovi dalla lista" : "Remove from list"}
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                        onClick={() => {
                          if (showAddAddress) {
                            setShowAddAddress(false);
                            resetAddressForm();
                          } else {
                            handleOpenAddAddress();
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs h-9"
                      >
                        <Plus className="w-4 h-4 mr-1 text-primary" />
                        {showAddAddress ? (locale === "it" ? t.dashboard.cancel : t.dashboard.cancel) : (locale === "it" ? t.dashboard.addAddress : t.dashboard.addAddress)}
                      </Button>
                    </div>

                    {addressSuccess && (
                      <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>{addressSuccess}</span>
                      </div>
                    )}

                    {addressError && (
                      <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-2 font-semibold text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{addressError}</span>
                      </div>
                    )}

                    {showAddAddress && (
                      <form onSubmit={handleSaveAddress} className="border border-primary/20 rounded-xl p-5 space-y-4 bg-primary/5 select-none">
                        <h4 className="font-serif font-bold text-base text-foreground">
                          {editingAddressId
                            ? (locale === "it" ? t.dashboard.editAddress : t.dashboard.editAddress)
                            : (locale === "it" ? t.dashboard.newAddress : t.dashboard.newAddress)}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.auth.firstName} *
                            </label>
                            <Input
                              placeholder={t.auth.firstName}
                              value={addrFirstName}
                              onChange={(e) => {
                                setAddrFirstName(e.target.value);
                                if (addrFieldErrors.firstName) setAddrFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                              }}
                              className={cn(addrFieldErrors.firstName && "border-error focus-visible:ring-error")}
                            />
                            {addrFieldErrors.firstName && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.firstName}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.auth.lastName} *
                            </label>
                            <Input
                              placeholder={t.auth.lastName}
                              value={addrLastName}
                              onChange={(e) => {
                                setAddrLastName(e.target.value);
                                if (addrFieldErrors.lastName) setAddrFieldErrors((prev) => ({ ...prev, lastName: undefined }));
                              }}
                              className={cn(addrFieldErrors.lastName && "border-error focus-visible:ring-error")}
                            />
                            {addrFieldErrors.lastName && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.lastName}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.streetLabel} *
                            </label>
                            <Input
                              placeholder={t.dashboard.streetLabel}
                              value={addrStreet}
                              onChange={(e) => {
                                setAddrStreet(e.target.value);
                                if (addrFieldErrors.street) setAddrFieldErrors((prev) => ({ ...prev, street: undefined }));
                              }}
                              className={cn(addrFieldErrors.street && "border-error focus-visible:ring-error")}
                            />
                            {addrFieldErrors.street && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.street}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.apartmentLabel}
                            </label>
                            <Input
                              placeholder={t.dashboard.apartmentLabel}
                              value={addrApartment}
                              onChange={(e) => setAddrApartment(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.countryLabel} *
                            </label>
                            <select
                              value={addrCountry}
                              onChange={(e) => {
                                const newCountry = e.target.value;
                                setAddrCountry(newCountry);
                                setAddrRegion("");
                                setAddrProvince("");
                                setAddrCity("");
                                if (addrFieldErrors.country) setAddrFieldErrors((prev) => ({ ...prev, country: undefined }));
                              }}
                              className={cn(
                                "w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                                addrFieldErrors.country && "border-error focus:ring-error/20"
                              )}
                            >
                              {getCountries(locale).map((c) => (
                                <option key={c.code} value={c.code}>
                                  {locale === "it" ? c.nameIt : c.nameEn}
                                </option>
                              ))}
                            </select>
                            {addrFieldErrors.country && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.country}</p>
                            )}
                          </div>

                          {addrCountry === "IT" && (
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                                {locale === "it" ? "Regione" : "Region"} *
                              </label>
                              <select
                                value={addrRegion}
                                onChange={(e) => {
                                  setAddrRegion(e.target.value);
                                  setAddrProvince("");
                                  setAddrCity("");
                                  if (addrFieldErrors.region) setAddrFieldErrors((prev) => ({ ...prev, region: undefined }));
                                }}
                                className={cn(
                                  "w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                                  addrFieldErrors.region && "border-error focus:ring-error/20"
                                )}
                              >
                                <option value="">
                                  {locale === "it" ? "Seleziona regione..." : "Select region..."}
                                </option>
                                {getItalyRegions().map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              {addrFieldErrors.region && (
                                <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.region}</p>
                              )}
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {subdivisionLabel} {(addrCountry === "IT" || subdivisions.length > 0) && "*"}
                            </label>
                            {subdivisions.length > 0 || addrCountry === "IT" ? (
                              <select
                                value={addrProvince}
                                disabled={addrCountry === "IT" && !addrRegion}
                                onChange={(e) => {
                                  setAddrProvince(e.target.value);
                                  setAddrCity("");
                                  if (addrFieldErrors.province) setAddrFieldErrors((prev) => ({ ...prev, province: undefined }));
                                }}
                                className={cn(
                                  "w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                  addrFieldErrors.province && "border-error focus:ring-error/20"
                                )}
                              >
                                <option value="">
                                  {addrCountry === "IT" && !addrRegion
                                    ? (locale === "it" ? "Seleziona prima la regione" : "Select region first")
                                    : (locale === "it" ? `Seleziona ${subdivisionLabel.toLowerCase()}...` : `Select ${subdivisionLabel.toLowerCase()}...`)}
                                </option>
                                {subdivisions.map((s) => (
                                  <option key={s.code} value={s.code}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                placeholder={subdivisionLabel}
                                value={addrProvince}
                                onChange={(e) => {
                                  setAddrProvince(e.target.value);
                                  if (addrFieldErrors.province) setAddrFieldErrors((prev) => ({ ...prev, province: undefined }));
                                }}
                              />
                            )}
                            {addrFieldErrors.province && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.province}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.cityLabel} *
                            </label>
                            {availableCities.length > 0 || subdivisions.length > 0 ? (
                              <select
                                value={addrCity}
                                disabled={!addrProvince}
                                onChange={(e) => {
                                  setAddrCity(e.target.value);
                                  if (addrFieldErrors.city) setAddrFieldErrors((prev) => ({ ...prev, city: undefined }));
                                }}
                                className={cn(
                                  "w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                  addrFieldErrors.city && "border-error focus:ring-error/20"
                                )}
                              >
                                <option value="">
                                  {addrProvince
                                    ? t.dashboard.selectCity
                                    : (locale === "it" ? `Seleziona prima ${subdivisionLabel.toLowerCase()}` : `Select ${subdivisionLabel.toLowerCase()} first`)}
                                </option>
                                {availableCities.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                placeholder={t.dashboard.cityLabel}
                                value={addrCity}
                                onChange={(e) => {
                                  setAddrCity(e.target.value);
                                  if (addrFieldErrors.city) setAddrFieldErrors((prev) => ({ ...prev, city: undefined }));
                                }}
                                className={cn(addrFieldErrors.city && "border-error focus-visible:ring-error")}
                              />
                            )}
                            {addrFieldErrors.city && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.city}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.zipLabel} *
                            </label>
                            <Input
                              placeholder={t.dashboard.zipLabel}
                              value={addrZip}
                              onChange={(e) => {
                                setAddrZip(e.target.value);
                                if (addrFieldErrors.zip) setAddrFieldErrors((prev) => ({ ...prev, zip: undefined }));
                              }}
                              className={cn(addrFieldErrors.zip && "border-error focus-visible:ring-error")}
                            />
                            {addrFieldErrors.zip && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.zip}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
                              {t.dashboard.phoneLabel}
                            </label>
                            <Input
                              placeholder={t.dashboard.phoneLabel}
                              value={addrPhone}
                              onChange={(e) => {
                                setAddrPhone(e.target.value);
                                if (addrFieldErrors.phone) setAddrFieldErrors((prev) => ({ ...prev, phone: undefined }));
                              }}
                              className={cn(addrFieldErrors.phone && "border-error focus-visible:ring-error")}
                            />
                            {addrFieldErrors.phone && (
                              <p className="text-xs text-error font-medium pl-0.5">{addrFieldErrors.phone}</p>
                            )}
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="addrIsDefaultCheckbox"
                              checked={addrIsDefault}
                              onChange={(e) => setAddrIsDefault(e.target.checked)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            <label htmlFor="addrIsDefaultCheckbox" className="text-xs font-semibold text-foreground cursor-pointer">
                              {t.dashboard.isDefaultCheckbox}
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddAddress(false);
                              resetAddressForm();
                            }}
                            disabled={isSubmittingAddress}
                            className="text-xs h-9 font-semibold"
                          >
                            {t.dashboard.cancel}
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmittingAddress}
                            className="font-bold text-xs h-9 shadow-soft flex items-center gap-1.5"
                          >
                            {isSubmittingAddress ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{t.dashboard.saving}</span>
                              </>
                            ) : (
                              <span>{editingAddressId ? t.dashboard.updateAddress : t.dashboard.saveAddress}</span>
                            )}
                          </Button>
                        </div>
                      </form>
                    )}

                    {addresses.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border/80 rounded-xl bg-card/50 text-muted-foreground select-none">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="font-semibold text-sm">
                          {t.dashboard.noAddresses}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={cn(
                              "border rounded-xl p-5 flex flex-col justify-between shadow-soft bg-card transition-all relative overflow-hidden",
                              addr.isDefault ? "border-primary bg-primary/5" : "border-border/80"
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center gap-2">
                                <h4 className="font-serif font-bold text-base text-foreground capitalize">
                                  {addr.title || `${addr.city} (${addr.province})`}
                                </h4>
                                {addr.isDefault && (
                                  <Badge className="bg-primary text-primary-foreground font-bold text-[9px] px-2 py-0.5 rounded-full shrink-0">
                                    {t.dashboard.defaultAddress}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs font-semibold text-muted-foreground space-y-0.5 leading-relaxed">
                                <p className="font-bold text-foreground">{addr.fullName}</p>
                                <p>{addr.address}</p>
                                <p>{addr.zip} {addr.city} ({addr.province})</p>
                                <p>{addr.country}</p>
                                {addr.country !== "Italy" && addr.country !== "Italia" && (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded px-1.5 py-0.5 inline-block">
                                    ℹ️ {locale === "it" ? "Disponibilità spedizione valutata al Checkout (Zone attive)" : "Shipping availability evaluated at Checkout (Active Zones)"}
                                  </p>
                                )}
                                {addr.phone && <p className="text-[11px] text-muted-foreground/80 mt-1">📞 {addr.phone}</p>}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/40 select-none">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAddress(addr)}
                                  disabled={isSubmittingAddress || deletingAddressId === addr.id || settingDefaultAddressId === addr.id}
                                  className="text-[11px] font-bold text-foreground hover:text-primary transition-colors underline disabled:opacity-50"
                                >
                                  {t.dashboard.editAddress}
                                </button>
                                {!addr.isDefault && (
                                  <>
                                    <span className="text-muted-foreground/40">•</span>
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAddress(addr.id)}
                                      disabled={settingDefaultAddressId === addr.id || deletingAddressId === addr.id}
                                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                                    >
                                      {settingDefaultAddressId === addr.id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>{t.dashboard.settingDefault}</span>
                                        </>
                                      ) : (
                                        <span>{t.dashboard.setAsDefault}</span>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                disabled={deletingAddressId === addr.id || settingDefaultAddressId === addr.id}
                                className="text-[11px] font-bold text-error hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {deletingAddressId === addr.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>{t.dashboard.deleting}</span>
                                  </>
                                ) : (
                                  <span>{t.dashboard.deleteAddress}</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                            placeholder={tFunc("account.cardNumberPlaceholder")}
                            value={newCardNumber}
                            onChange={(e) => setNewCardNumber(e.target.value)}
                            maxLength={16}
                            required
                          />
                          <Input
                            placeholder={tFunc("account.cardExpiryPlaceholder")}
                            value={newCardExpiry}
                            onChange={(e) => setNewCardExpiry(e.target.value)}
                            maxLength={5}
                            required
                          />
                          <Input
                            placeholder={tFunc("account.cardCvvPlaceholder")}
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

                    {payments.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border/80 rounded-xl bg-card/50 text-muted-foreground select-none">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="font-semibold text-sm">
                          {locale === "it" ? "Nessun metodo di pagamento salvato" : "No saved payment method"}
                        </p>
                      </div>
                    ) : (
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
                  )}
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
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        {locale === "it"
                          ? "Preferenze di consegna salvate e sincronizzate con il carrello!"
                          : "Delivery preferences saved and synchronized with your cart!"}
                      </div>
                    )}

                    {prefError && (
                      <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-2 font-semibold text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{prefError}</span>
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
                          <option value="08:00 - 10:00">08:00 - 10:00 ({locale === "it" ? "Mattina" : "Morning"})</option>
                          <option value="10:00 - 12:00">10:00 - 12:00 ({locale === "it" ? "Mattina" : "Morning"})</option>
                          <option value="14:00 - 16:00">14:00 - 16:00 ({locale === "it" ? "Pomeriggio" : "Afternoon"})</option>
                          <option value="18:00 - 20:00">18:00 - 20:00 ({locale === "it" ? "Sera" : "Evening"})</option>
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
                          placeholder={locale === "it" ? "es. Suonare citofono Rossi, secondo piano..." : "e.g. Ring Rossi doorbell, second floor..."}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearPref}
                        disabled={isSavingPref}
                        className="text-xs text-error border-error/20 hover:bg-error/5"
                      >
                        {locale === "it" ? "Rimuovi Preferenze" : "Clear Preferences"}
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSavingPref}
                        className="font-bold text-sm shadow-soft flex items-center gap-2"
                      >
                        {isSavingPref && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {isSavingPref
                            ? (locale === "it" ? "Salvataggio..." : "Saving...")
                            : (locale === "it" ? "Salva Preferenze" : "Save Preferences")}
                        </span>
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-elevation space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {new Date(selectedOrderDetails.processedAt).toLocaleDateString(
                      locale === "it" ? "it-IT" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-foreground">
                    Ordine {selectedOrderDetails.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="w-8 h-8 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center text-foreground font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2">
                <Badge className="bg-success/15 text-success border border-success/30 font-bold px-2.5 py-1 text-xs">
                  Pagamento: {selectedOrderDetails.financialStatus}
                </Badge>
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-1 text-xs">
                  Stato: {selectedOrderDetails.fulfillmentStatus}
                </Badge>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Prodotti Acquistati
                </h4>
                <div className="divide-y divide-border/60 border border-border/60 rounded-xl p-3 bg-muted/5">
                  {selectedOrderDetails.lineItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 relative rounded border overflow-hidden shrink-0 bg-slate-50">
                          <Image
                            src={item.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop"}
                            alt={item.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Quantità: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        €{(parseFloat(item.price?.amount || "0") * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrderDetails.shippingAddress && (
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                    Indirizzo di Spedizione
                  </h4>
                  <div className="p-3 bg-muted/10 border border-border/60 rounded-xl space-y-0.5 font-semibold text-foreground">
                    <p>{selectedOrderDetails.shippingAddress.name}</p>
                    <p>{selectedOrderDetails.shippingAddress.address1} {selectedOrderDetails.shippingAddress.address2 || ""}</p>
                    <p>{selectedOrderDetails.shippingAddress.zip} {selectedOrderDetails.shippingAddress.city} ({selectedOrderDetails.shippingAddress.province})</p>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="pt-4 border-t border-border space-y-2 text-xs font-medium text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t.dashboard.subtotal}</span>
                  <span className="font-semibold text-foreground">
                    €{parseFloat(selectedOrderDetails.subtotalPrice?.amount || selectedOrderDetails.lineItems.reduce((sum: number, it: any) => sum + (parseFloat(it.price?.amount || "0") * it.quantity), 0).toFixed(2)).toFixed(2)}
                  </span>
                </div>
                {selectedOrderDetails.totalShippingPrice && (
                  <div className="flex justify-between">
                    <span>{t.dashboard.shipping}</span>
                    <span className="font-semibold text-foreground">
                      €{parseFloat(selectedOrderDetails.totalShippingPrice.amount).toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedOrderDetails.totalTax && parseFloat(selectedOrderDetails.totalTax.amount) > 0 && (
                  <div className="flex justify-between">
                    <span>{t.dashboard.tax}</span>
                    <span className="font-semibold text-foreground">
                      €{parseFloat(selectedOrderDetails.totalTax.amount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between font-bold text-base text-foreground pt-2 border-t border-border/50">
                  <span>{t.dashboard.total}</span>
                  <span className="text-primary text-lg">
                    €{parseFloat(selectedOrderDetails.totalPrice?.amount || "0").toFixed(2)} {selectedOrderDetails.totalPrice?.currencyCode || "EUR"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 select-none">
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  variant="outline"
                  className="w-full sm:w-1/2 h-11 font-bold text-xs flex items-center justify-center gap-2 border-border/80 hover:bg-muted/10"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  <span>{t.dashboard.printReceipt}</span>
                </Button>
                <Button
                  onClick={() => {
                    handleReorderOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  variant="primary"
                  className="w-full sm:w-1/2 h-11 font-bold text-xs shadow-soft"
                >
                  {locale === "it" ? "Riordina Tutti i Prodotti" : "Reorder All Products"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Printable Receipt Section for window.print() */}
      {selectedOrderDetails && (
        <div id="printable-order-receipt" className="hidden print:block p-8 bg-white text-black font-sans text-xs space-y-6">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-emerald-900 tracking-tight">ALIMENTARI</h1>
              <p className="text-xs text-gray-600 font-medium">Bottega & Gastronomia Italiana</p>
            </div>
            <div className="text-right">
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-800">{t.dashboard.orderReceipt}</h2>
              <p className="text-sm font-bold text-gray-900">{t.dashboard.orderNo} {selectedOrderDetails.name}</p>
              <p className="text-xs text-gray-500">
                {t.dashboard.orderDate}: {new Date(selectedOrderDetails.processedAt).toLocaleDateString(locale === "it" ? "it-IT" : "en-US")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-2 border-b">
            <div>
              <h3 className="font-bold uppercase text-[10px] text-gray-500 mb-1">{t.dashboard.customer}</h3>
              <p className="font-semibold text-gray-800">{selectedOrderDetails.shippingAddress?.name || (session as any)?.user?.name || "Cliente Alimentari"}</p>
              <p className="text-gray-600">{selectedOrderDetails.email || email || (session as any)?.user?.email || ""}</p>
            </div>
            {selectedOrderDetails.shippingAddress && (
              <div>
                <h3 className="font-bold uppercase text-[10px] text-gray-500 mb-1">{t.dashboard.shippingAddress}</h3>
                <p className="text-gray-800">{selectedOrderDetails.shippingAddress.address1} {selectedOrderDetails.shippingAddress.address2 || ""}</p>
                <p className="text-gray-800">{selectedOrderDetails.shippingAddress.zip} {selectedOrderDetails.shippingAddress.city} ({selectedOrderDetails.shippingAddress.province})</p>
                <p className="text-gray-800">{selectedOrderDetails.shippingAddress.country}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold uppercase text-[10px] text-gray-500 mb-2">{t.dashboard.products}</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-gray-500 text-[10px] uppercase">
                  <th className="py-2">{tFunc("account.tableProduct")}</th>
                  <th className="py-2 text-center">{tFunc("account.tableQuantity")}</th>
                  <th className="py-2 text-right">{tFunc("account.tableUnitPrice")}</th>
                  <th className="py-2 text-right">{tFunc("account.tableTotal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedOrderDetails.lineItems.map((it: any, idx: number) => {
                  const unitP = parseFloat(it.price?.amount || "0");
                  return (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{it.title}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">€{unitP.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold">€{(unitP * it.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <div className="w-1/2 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{t.dashboard.subtotal}:</span>
                <span className="font-semibold text-gray-900">
                  €{parseFloat(selectedOrderDetails.subtotalPrice?.amount || selectedOrderDetails.lineItems.reduce((sum: number, it: any) => sum + (parseFloat(it.price?.amount || "0") * it.quantity), 0).toFixed(2)).toFixed(2)}
                </span>
              </div>
              {selectedOrderDetails.totalShippingPrice && (
                <div className="flex justify-between text-gray-600">
                  <span>{t.dashboard.shipping}:</span>
                  <span className="font-semibold text-gray-900">
                    €{parseFloat(selectedOrderDetails.totalShippingPrice.amount).toFixed(2)}
                  </span>
                </div>
              )}
              {selectedOrderDetails.totalTax && parseFloat(selectedOrderDetails.totalTax.amount) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{t.dashboard.tax}:</span>
                  <span className="font-semibold text-gray-900">
                    €{parseFloat(selectedOrderDetails.totalTax.amount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                <span>{t.dashboard.total}:</span>
                <span className="text-emerald-800">
                  €{parseFloat(selectedOrderDetails.totalPrice?.amount || "0").toFixed(2)} {selectedOrderDetails.totalPrice?.currencyCode || "EUR"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t text-[10px] text-gray-400 flex justify-between">
            <span>Alimentari Headless Store • Alimentari.it</span>
            <span>Stato Pagamento: {selectedOrderDetails.financialStatus} • Stato Spedizione: {selectedOrderDetails.fulfillmentStatus}</span>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      <AnimatePresence>
        {showCreateListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-elevation space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {locale === "it" ? "Crea Nuova Lista della Spesa" : "Create New Grocery List"}
                </h3>
                <button
                  onClick={() => setShowCreateListModal(false)}
                  className="w-8 h-8 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center text-foreground font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateListSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {locale === "it" ? "Nome Lista" : "List Name"}
                  </label>
                  <Input
                    type="text"
                    placeholder={locale === "it" ? "es. Spesa Settimanale, Grigliata..." : "e.g. Weekly Grocery, BBQ Party..."}
                    value={newListNameInput}
                    onChange={(e) => setNewListNameInput(e.target.value)}
                    maxLength={50}
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateListModal(false)}
                    className="font-semibold text-xs"
                  >
                    {locale === "it" ? "Annulla" : "Cancel"}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="font-bold text-xs">
                    {locale === "it" ? "Crea Lista" : "Create List"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename List Modal */}
      <AnimatePresence>
        {editingListId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-elevation space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {locale === "it" ? "Rinomina Lista" : "Rename List"}
                </h3>
                <button
                  onClick={() => setEditingListId(null)}
                  className="w-8 h-8 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center text-foreground font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleRenameListSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {locale === "it" ? "Nuovo Nome" : "New Name"}
                  </label>
                  <Input
                    type="text"
                    value={editListNameInput}
                    onChange={(e) => setEditListNameInput(e.target.value)}
                    maxLength={50}
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingListId(null)}
                    className="font-semibold text-xs"
                  >
                    {locale === "it" ? "Annulla" : "Cancel"}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="font-bold text-xs">
                    {locale === "it" ? "Salva Modifiche" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete List Modal */}
      <AnimatePresence>
        {deletingListId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-elevation space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-serif font-bold text-lg text-foreground text-error">
                  {locale === "it" ? "Elimina Lista della Spesa" : "Delete Grocery List"}
                </h3>
                <button
                  onClick={() => setDeletingListId(null)}
                  className="w-8 h-8 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center text-foreground font-bold"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {locale === "it"
                  ? "Sei sicuro di voler eliminare questa lista? L'operazione non può essere annullata."
                  : "Are you sure you want to delete this list? This action cannot be undone."}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingListId(null)}
                  className="font-semibold text-xs"
                >
                  {locale === "it" ? "Annulla" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteListConfirm}
                  variant="primary"
                  size="sm"
                  className="font-bold text-xs bg-error hover:bg-error/90 border-error"
                >
                  {locale === "it" ? "Elimina Definitivamente" : "Delete List"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer />

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
