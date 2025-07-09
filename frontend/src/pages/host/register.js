import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiHome, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import OTPVerification from '../../components/auth/OTPVerification';

const HostRegister = () => {
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const { registerHost } = useAuth();
  const router = useRouter();

  // Validation schema for step 1 (Basic Information)
  const Step1Schema = Yup.object().shape({
    businessName: Yup.string()
      .min(3, 'Business name must be at least 3 characters')
      .required('Business name is required'),
    ownerName: Yup.string()
      .min(3, 'Owner name must be at least 3 characters')
      .required('Owner name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    mobileNumber: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Mobile number is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required')
  });

  // Validation schema for step 2 (Business Details)
  const Step2Schema = Yup.object().shape({
    hostType: Yup.string()
      .oneOf(['venue', 'caterer', 'decorator', 'organizer'], 'Please select a valid host type')
      .required('Host type is required'),
    venueType: Yup.string()
      .when('hostType', {
        is: 'venue',
        then: Yup.string()
          .oneOf(['lawn', 'banquet', 'cafe', 'hotel', 'resort', 'other'], 'Please select a valid venue type')
          .required('Venue type is required'),
        otherwise: Yup.string().notRequired()
      }),
    maxGuestCapacity: Yup.number()
      .when('hostType', {
        is: 'venue',
        then: Yup.number()
          .min(1, 'Capacity must be at least 1')
          .required('Maximum guest capacity is required'),
        otherwise: Yup.number().notRequired()
      }),
    address: Yup.string()
      .required('Address is required'),
    city: Yup.string()
      .required('City is required'),
    zipCode: Yup.string()
      .required('ZIP/Postal code is required'),
    services: Yup.array()
      .min(1, 'Please select at least one service')
      .required('Services are required'),
    termsAccepted: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  });

  // Handle step 1 submission
  const handleStep1Submit = (values) => {
    setFormData({ ...formData, ...values });
    setCurrentStep(2);
  };

  // Handle step 2 submission (final registration)
  const handleStep2Submit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Combine data from both steps
      const hostData = {
        ...formData,
        ...values
      };

      // Register host
      const response = await registerHost(hostData);
      
      if (response.success) {
        setRegisteredEmail(formData.email);
        setRegisteredMobile(formData.mobileNumber);
        setShowOTPForm(true);
        toast.success('Registration successful! Please verify your email and mobile.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
      setErrors({ submit: error.response?.data?.error || 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification success
  const handleOTPVerified = () => {
    toast.success('Verification successful!');
    router.push('/host/dashboard');
  };

  // Go back to step 1
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  return (
    <Layout title="Host Registration - EventO">
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-secondary-600 to-primary-600 py-4 px-6">
            <h1 className="text-2xl font-bold text-white text-center">Become a Host</h1>
            {!showOTPForm && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-white text-secondary-600' : 'bg-secondary-300 text-white'
                  } font-bold`}>
                    1
                  </div>
                  <div className={`w-16 h-1 ${
                    currentStep >= 2 ? 'bg-white' : 'bg-secondary-300'
                  }`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-white text-secondary-600' : 'bg-secondary-300 text-white'
                  } font-bold`}>
                    2
                  </div>
                </div>
              </div>
            )}
          </div>

          {!showOTPForm ? (
            <div className="p-6">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                  <Formik
                    initialValues={{
                      businessName: formData.businessName || '',
                      ownerName: formData.ownerName || '',
                      email: formData.email || '',
                      mobileNumber: formData.mobileNumber || '',
                      password: formData.password || '',
                      confirmPassword: formData.confirmPassword || ''
                    }}
                    validationSchema={Step1Schema}
                    onSubmit={handleStep1Submit}
                  >
                    {({ isSubmitting, errors, touched }) => (
                      <Form className="space-y-4">
                        <div>
                          <label htmlFor="businessName" className="form-label">
                            Business Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiHome className="text-gray-400" />
                            </div>
                            <Field
                              type="text"
                              name="businessName"
                              id="businessName"
                              className={`form-input pl-10 ${
                                errors.businessName && touched.businessName ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter your business name"
                            />
                          </div>
                          <ErrorMessage name="businessName" component="div" className="form-error" />
                        </div>

                        <div>
                          <label htmlFor="ownerName" className="form-label">
                            Owner Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiUser className="text-gray-400" />
                            </div>
                            <Field
                              type="text"
                              name="ownerName"
                              id="ownerName"
                              className={`form-input pl-10 ${
                                errors.ownerName && touched.ownerName ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter owner's name"
                            />
                          </div>
                          <ErrorMessage name="ownerName" component="div" className="form-error" />
                        </div>

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
                          <label htmlFor="mobileNumber" className="form-label">
                            Business Contact Number
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiPhone className="text-gray-400" />
                            </div>
                            <Field
                              type="text"
                              name="mobileNumber"
                              id="mobileNumber"
                              className={`form-input pl-10 ${
                                errors.mobileNumber && touched.mobileNumber ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter your contact number"
                            />
                          </div>
                          <ErrorMessage name="mobileNumber" component="div" className="form-error" />
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
                              placeholder="Create a password"
                            />
                          </div>
                          <ErrorMessage name="password" component="div" className="form-error" />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="form-label">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="text-gray-400" />
                            </div>
                            <Field
                              type="password"
                              name="confirmPassword"
                              id="confirmPassword"
                              className={`form-input pl-10 ${
                                errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''
                              }`}
                              placeholder="Confirm your password"
                            />
                          </div>
                          <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-secondary py-3 flex justify-center"
                          >
                            Next
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Business Details</h2>
                  <Formik
                    initialValues={{
                      hostType: formData.hostType || '',
                      venueType: formData.venueType || '',
                      maxGuestCapacity: formData.maxGuestCapacity || '',
                      address: formData.address || '',
                      city: formData.city || '',
                      zipCode: formData.zipCode || '',
                      services: formData.services || [],
                      termsAccepted: formData.termsAccepted || false
                    }}
                    validationSchema={Step2Schema}
                    onSubmit={handleStep2Submit}
                  >
                    {({ isSubmitting, errors, touched, values }) => (
                      <Form className="space-y-4">
                        <div>
                          <label htmlFor="hostType" className="form-label">
                            Host Type
                          </label>
                          <Field
                            as="select"
                            name="hostType"
                            id="hostType"
                            className={`form-input ${
                              errors.hostType && touched.hostType ? 'border-red-500' : ''
                            }`}
                          >
                            <option value="">Select host type</option>
                            <option value="venue">Venue Owner</option>
                            <option value="caterer">Caterer</option>
                            <option value="decorator">Decorator</option>
                            <option value="organizer">Event Organizer</option>
                          </Field>
                          <ErrorMessage name="hostType" component="div" className="form-error" />
                        </div>

                        {values.hostType === 'venue' && (
                          <>
                            <div>
                              <label htmlFor="venueType" className="form-label">
                                Venue Type
                              </label>
                              <Field
                                as="select"
                                name="venueType"
                                id="venueType"
                                className={`form-input ${
                                  errors.venueType && touched.venueType ? 'border-red-500' : ''
                                }`}
                              >
                                <option value="">Select venue type</option>
                                <option value="lawn">Lawn</option>
                                <option value="banquet">Banquet</option>
                                <option value="cafe">Cafe</option>
                                <option value="hotel">Hotel</option>
                                <option value="resort">Resort</option>
                                <option value="other">Other</option>
                              </Field>
                              <ErrorMessage name="venueType" component="div" className="form-error" />
                            </div>

                            <div>
                              <label htmlFor="maxGuestCapacity" className="form-label">
                                Maximum Guest Capacity
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiUsers className="text-gray-400" />
                                </div>
                                <Field
                                  type="number"
                                  name="maxGuestCapacity"
                                  id="maxGuestCapacity"
                                  min="1"
                                  className={`form-input pl-10 ${
                                    errors.maxGuestCapacity && touched.maxGuestCapacity ? 'border-red-500' : ''
                                  }`}
                                  placeholder="Enter maximum guest capacity"
                                />
                              </div>
                              <ErrorMessage name="maxGuestCapacity" component="div" className="form-error" />
                            </div>
                          </>
                        )}

                        <div>
                          <label htmlFor="address" className="form-label">
                            Full Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiMapPin className="text-gray-400" />
                            </div>
                            <Field
                              as="textarea"
                              name="address"
                              id="address"
                              rows="3"
                              className={`form-input pl-10 ${
                                errors.address && touched.address ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter your full address"
                            />
                          </div>
                          <ErrorMessage name="address" component="div" className="form-error" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="city" className="form-label">
                              City
                            </label>
                            <Field
                              type="text"
                              name="city"
                              id="city"
                              className={`form-input ${
                                errors.city && touched.city ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter city"
                            />
                            <ErrorMessage name="city" component="div" className="form-error" />
                          </div>

                          <div>
                            <label htmlFor="zipCode" className="form-label">
                              ZIP/Postal Code
                            </label>
                            <Field
                              type="text"
                              name="zipCode"
                              id="zipCode"
                              className={`form-input ${
                                errors.zipCode && touched.zipCode ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter ZIP/Postal code"
                            />
                            <ErrorMessage name="zipCode" component="div" className="form-error" />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Services Provided</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="catering"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Catering</span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="decoration"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Decoration</span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="organization"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Organization</span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="parking"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Parking</span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="music"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Music</span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="services"
                                value="photography"
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Photography</span>
                            </label>
                          </div>
                          <ErrorMessage name="services" component="div" className="form-error" />
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              type="checkbox"
                              name="termsAccepted"
                              className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              I agree to the{' '}
                              <Link href="/terms" className="text-secondary-600 hover:text-secondary-500">
                                Terms of Service
                              </Link>{' '}
                              and{' '}
                              <Link href="/privacy" className="text-secondary-600 hover:text-secondary-500">
                                Privacy Policy
                              </Link>
                            </span>
                          </label>
                          <ErrorMessage name="termsAccepted" component="div" className="form-error" />
                        </div>

                        {errors.submit && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {errors.submit}
                          </div>
                        )}

                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={handleBackToStep1}
                            className="w-1/2 btn-outline py-3"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-1/2 btn-secondary py-3 flex justify-center"
                          >
                            {isSubmitting ? 'Registering...' : 'Register'}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              )}

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-secondary-600 hover:text-secondary-500 font-medium">
                    Log In
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <OTPVerification
              email={registeredEmail}
              mobileNumber={registeredMobile}
              onVerified={handleOTPVerified}
              onCancel={() => setShowOTPForm(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HostRegister;
