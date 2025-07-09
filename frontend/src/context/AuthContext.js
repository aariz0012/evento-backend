import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [host, setHost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  
  // Check if user is logged in on initial load
  useEffect(() => {
    checkUserLoggedIn();
  }, []);
  
  // Register user
  const registerUser = async (userData) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/user`, userData);
      
      if (res.data.success) {
        setUser(jwt_decode(res.data.token));
        setCookie('token', res.data.token);
        setIsLoading(false);
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setIsLoading(false);
      throw err;
    }
  };
  
  // Register host
  const registerHost = async (hostData) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/host`, hostData);
      
      if (res.data.success) {
        setHost(jwt_decode(res.data.token));
        setCookie('token', res.data.token);
        setIsLoading(false);
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setIsLoading(false);
      throw err;
    }
  };
  
  // Login user
  const loginUser = async ({ email, password }) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/user`, {
        email,
        password
      });
      
      if (res.data.success) {
        setUser(jwt_decode(res.data.token));
        setCookie('token', res.data.token);
        setIsLoading(false);
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
      setIsLoading(false);
      throw err;
    }
  };
  
  // Login host
  const loginHost = async ({ email, password }) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/host`, {
        email,
        password
      });
      
      if (res.data.success) {
        setHost(jwt_decode(res.data.token));
        setCookie('token', res.data.token);
        setIsLoading(false);
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
      setIsLoading(false);
      throw err;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`);
      setUser(null);
      setHost(null);
      deleteCookie('token');
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  // Verify OTP
  const verifyOTP = async (data) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, data);
      setIsLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
      setIsLoading(false);
      throw err;
    }
  };
  
  // Check if user is logged in
  const checkUserLoggedIn = async () => {
    try {
      const token = getCookie('token');
      
      if (token) {
        // Set auth token header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get current user
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`);
        
        if (res.data.success) {
          if (res.data.isHost) {
            setHost(res.data.data);
          } else {
            setUser(res.data.data);
          }
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      deleteCookie('token');
      setUser(null);
      setHost(null);
      setIsLoading(false);
      console.error('Check auth error:', err);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        host,
        isLoading,
        error,
        registerUser,
        registerHost,
        loginUser,
        loginHost,
        logout,
        verifyOTP,
        checkUserLoggedIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    ...context,
    isAuthenticated: Boolean(context.user || context.host),
    loading: context.isLoading
  };
};
