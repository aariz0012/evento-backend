import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '../context/AuthContext';
import LoadingPage from '../components/LoadingPage';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the initial animation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <AuthProvider>
      <Component {...pageProps} />
      <ToastContainer position="bottom-right" />
    </AuthProvider>
  );
}
