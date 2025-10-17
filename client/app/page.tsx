'use client';

import { useState, useEffect } from 'react';
import { processPayment, logout, getAccessToken, clearTokens } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Product type definition
type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
};

// Cart item type definition
type CartItem = Product & {
  quantity: number;
};

// Sample products data
const products: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    description: 'Premium sound quality with noise cancellation',
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    description: 'Track your fitness and stay connected',
  },
  {
    id: 3,
    name: 'Laptop Stand',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    description: 'Ergonomic design for better posture',
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    description: 'Premium typing experience with RGB lighting',
  },
  {
    id: 5,
    name: 'USB-C Hub',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop',
    description: 'Expand your connectivity options',
  },
  {
    id: 6,
    name: 'Wireless Mouse',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
    description: 'Precision and comfort in one device',
  },
];

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const token = getAccessToken();
    const email = localStorage.getItem('userEmail');
    
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(email || 'User');
    } else {
      setIsLoggedIn(false);
      setUserEmail('');
    }
  }, []);
  // Add item to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (existingItem) {
        // If item exists, increase quantity
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If item doesn't exist, add it with quantity 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calculate total
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Get total items count
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Process checkout and payment
  const checkout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      console.log(cart)
      const result = await processPayment({
        cart: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: getTotal()
      });

      if (result.success && result.data) {
        const { transactionId, orderId, amount, performance } = result.data;
        
        alert(
          `✅ Payment Successful!\n\n` +
          `Transaction ID: ${transactionId}\n` +
          `Order ID: ${orderId || 'N/A'}\n` +
          `Amount: ${amount} MZN\n\n` +
          `⏱️ Performance:\n` +
          `• M-Pesa Payment: ${performance?.mpesaPayment || 'N/A'}\n` +
          `• Order Creation: ${performance?.orderCreation || 'N/A'}\n` +
          `• Email Sending: ${performance?.emailSending || 'N/A'}\n` +
          `• Total Time: ${performance?.total || 'N/A'}`
        );
        
        console.log('📊 Performance Metrics:', performance);
        
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert(`❌ Payment Failed\n\n${result.message}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unable to process payment'}`);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await logout(refreshToken);
      }
      
      // Clear all auth data
      clearTokens();
      localStorage.removeItem('userEmail');
      
      // Update state
      setIsLoggedIn(false);
      setUserEmail('');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      clearTokens();
      localStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail('');
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-foreground text-background shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Simple Shop</h1>
          
          <div className="flex items-center gap-4">
            {/* User Email Display */}
            {isLoggedIn && userEmail && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-background/10 rounded-lg">
                <span className="text-sm">👤</span>
                <span className="text-sm font-medium">{userEmail}</span>
              </div>
            )}
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative px-4 py-2 bg-background text-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              🛒 Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            {/* Auth Buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-background text-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {isLoggedIn ? `Welcome back, ${userEmail}! 👋` : 'Welcome to Simple Shop'}
          </h2>
          <p className="text-lg opacity-80">
            {isLoggedIn 
              ? 'Discover our curated collection of quality products' 
              : 'Please login or register to start shopping'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Product Image */}
              <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-sm opacity-70 mb-4">{product.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">MZN {product.price}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Shopping Cart Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-50 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Cart</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-3xl hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <p className="text-lg">Your cart is empty</p>
                <p className="text-sm mt-2">Add some products to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{item.name}</h3>
                      <p className="text-sm font-medium mb-2">MZN {item.price}</p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span>MZN {getTotal().toFixed(2)}</span>
              </div>
              <button onClick={checkout} className="w-full py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity font-bold text-lg">
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
        />
      )}
    </div>
  );
}
