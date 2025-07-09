import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = ({ Component, pageProps }) => {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <ToastContainer />
    </AuthProvider>
  );
};

export default App;
