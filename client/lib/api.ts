// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_URL || 'http://localhost:4000';
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4003';
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:4001';

// ============================================================================
// Authentication API
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Register a new user
 */
export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

/**
 * Login user
 */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/api/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

/**
 * Logout user
 */
export async function logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${AUTH_API_URL}/api/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  return response.json();
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

/**
 * Save tokens to localStorage
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// ============================================================================
// Payment API
// ============================================================================

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentRequest {
  cart: CartItem[];
  total: number;
  customerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    conversationId: string;
    responseCode: string;
    responseDesc: string;
    transactionReference: string;
    thirdPartyReference: string;
    amount: number;
    cart: CartItem[];
    orderId?: string;
    performance?: {
      mpesaPayment: string;
      orderCreation: string;
      emailSending: string;
      total: string;
    };
  };
  error?: string | { message: string };
}

/**
 * Process payment through M-Pesa
 * Requires authentication
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const data = await response.json();
    if (data.expired) {
      const newAccessToken = await handleTokenRefresh();
      if (newAccessToken) {
        // Retry with new token
        const retryResponse = await fetch(`${API_BASE_URL}/api/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
          },
          body: JSON.stringify(request),
        });
        return retryResponse.json();
      }
    }
    throw new Error('Authentication failed. Please login again.');
  }

  if (!response.ok && response.status !== 400) {
    throw new Error('Payment service unavailable');
  }

  return response.json();
}

/**
 * Handle token refresh
 */
async function handleTokenRefresh(): Promise<string | null> {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const result = await refreshToken({ refreshToken: refreshTokenValue });
    
    if (result.success && result.data) {
      saveTokens(result.data.accessToken, result.data.refreshToken);
      return result.data.accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return null;
}

/**
 * Check API health
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}

// ============================================================================
// Order API
// ============================================================================

export interface Order {
  orderId: string;
  userId: number;
  transactionId: string;
  conversationId: string;
  transactionReference: string;
  thirdPartyReference: string;
  amount: number;
  cart: CartItem[];
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  data: Order;
}

/**
 * Get all orders for the authenticated user
 */
export async function getOrders(): Promise<OrdersResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${ORDER_API_URL}/api/orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    const newAccessToken = await handleTokenRefresh();
    if (newAccessToken) {
      const retryResponse = await fetch(`${ORDER_API_URL}/api/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });
      return retryResponse.json();
    }
    throw new Error('Authentication failed. Please login again.');
  }

  return response.json();
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${ORDER_API_URL}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    const newAccessToken = await handleTokenRefresh();
    if (newAccessToken) {
      const retryResponse = await fetch(`${ORDER_API_URL}/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });
      return retryResponse.json();
    }
    throw new Error('Authentication failed. Please login again.');
  }

  return response.json();
}

