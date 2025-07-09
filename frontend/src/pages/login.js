import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiUser, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const Login = () => {
  const [userType, setUserType] = useState('user'); // 'user' or 'host'
  const { loginUser, loginHost } = useAuth();
  const router = useRouter();
  
  // Get the redirect path from location state or default to '/'
  const from = router.query.from || '/';

  // Validation schema
  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });

  // Handle login submission
  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      let response;
      
      if (userType === 'user') {
        response = await loginUser(values);
        if (response.success) {
          toast.success('Login successful!');
          router.push('/dashboard');
        }
      } else {
        response = await loginHost(values);
        if (response.success) {
          toast.success('Login successful!');
          router.push('/host/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
      setErrors({ submit: error.response?.data?.error || 'Invalid credentials' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Login - EventO">
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-4 px-6">
            <h1 className="text-2xl font-bold text-white text-center">Log In to Your Account</h1>
          </div>

          <div className="p-6">
            <div className="flex mb-6">
              <button
                className={`flex-1 py-2 text-center font-medium rounded-l-md ${
                  userType === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setUserType('user')}
              >
                <div className="flex items-center justify-center">
                  <FiUser className="mr-2" /> User
                </div>
              </button>
              <button
                className={`flex-1 py-2 text-center font-medium rounded-r-md ${
                  userType === 'host'
                    ? 'bg-secondary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setUserType('host')}
              >
                <div className="flex items-center justify-center">
                  <FiHome className="mr-2" /> Host
                </div>
              </button>
            </div>

            <Formik
              initialValues={{
                email: '',
                password: ''
              }}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className={`form-input pl-10 ${
                          errors.email && touched.email ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="form-error" />
                  </div>

                  <div>
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" />
                      </div>
                      <Field
                        type="password"
                        name="password"
                        id="password"
                        className={`form-input pl-10 ${
                          errors.password && touched.password ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter your password"
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className="form-error" />
                  </div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                      Forgot password?
                    </Link>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {errors.submit}
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 flex justify-center ${
                        userType === 'user' ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      {userType === 'user' ? (
                        <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                          Sign Up
                        </Link>
                      ) : (
                        <Link href="/host/register" className="text-secondary-600 hover:text-secondary-500 font-medium">
                          Register as Host
                        </Link>
                      )}
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
