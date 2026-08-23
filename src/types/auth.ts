import { CustomerProfile } from "@/lib/shopify";

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  accessToken: string;
  profile?: CustomerProfile;
  expires: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string | null;
  error?: string | null;
}
