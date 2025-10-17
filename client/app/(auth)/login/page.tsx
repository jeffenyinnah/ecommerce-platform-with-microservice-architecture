"use client";
import React, {useState} from 'react'
import { useRouter } from 'next/navigation';
import { Mail, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('http://localhost:4003/login', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            const data = await response.json();
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            localStorage.setItem('userEmail', email); // Save user email for display

            setSuccess('Login successful. Redirecting to home...');
            setEmail('');
            setPassword('');
            setLoading(false);
            router.push('/');
        }
        catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        }
    }

  return (
    <div className='min-h-screen bg-white flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg p-8 border border-gray-200 shadow-lg'>
          {/* Header */}
          <div className='mb-8 text-center'>
            <h1 className='text-3xl font-bold text-black mb-2'>Login</h1>
            <p className='text-gray-600'>Welcome back to our platform</p>
          </div>

          {/* Form Inputs */}
          <div className='space-y-4 mb-6'>
            {/* Email */}
            <div className='relative'>
              <Mail className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' />
              <input
                type='email'
                placeholder='Email address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className='w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-500 transition disabled:opacity-50'
              />
            </div>

            {/* Password */}
            <div className='relative'>
              <Lock className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' />
              <input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className='w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-500 transition disabled:opacity-50'
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className='mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-lg'>
              <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0' />
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}

          {success && (
            <div className='mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-lg'>
              <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
              <p className='text-green-600 text-sm'>{success}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className='w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <Loader className='w-5 h-5 animate-spin' />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          {/* Footer */}
          <p className='text-center text-gray-600 text-sm mt-6'>
            Don&apos;t have an account?{' '}
            <a href='/register' className='text-black hover:underline font-semibold transition'>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
