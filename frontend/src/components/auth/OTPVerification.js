import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FiMail, FiPhone, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const OTPVerification = ({ email, mobileNumber, onVerified, onCancel }) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  
  const { verifyOTP } = useAuth();

  // Validation schema
  const OTPSchema = Yup.object().shape({
    emailOTP: Yup.string()
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
      .required('Email OTP is required'),
    mobileOTP: Yup.string()
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
      .required('Mobile OTP is required')
  });

  // Handle OTP verification
  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Verify email OTP if not already verified
      if (!emailVerified) {
        const emailResponse = await verifyOTP({
          email,
          otp: values.emailOTP,
          type: 'email'
        });
        
        if (emailResponse.success) {
          setEmailVerified(true);
          toast.success('Email verified successfully!');
        }
      }
      
      // Verify mobile OTP if not already verified
      if (!mobileVerified) {
        const mobileResponse = await verifyOTP({
          email, // We use email as identifier
          otp: values.mobileOTP,
          type: 'mobile'
        });
        
        if (mobileResponse.success) {
          setMobileVerified(true);
          toast.success('Mobile number verified successfully!');
        }
      }
      
      // If both are verified, call the onVerified callback
      if (emailVerified && mobileVerified) {
        onVerified();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed. Please try again.');
      setErrors({ submit: error.response?.data?.error || 'Verification failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async (type) => {
    try {
      // In a real implementation, we would call an API to resend the OTP
      toast.info(`New OTP sent to your ${type === 'email' ? 'email' : 'mobile number'}`);
    } catch (error) {
      toast.error(`Failed to resend OTP to ${type === 'email' ? 'email' : 'mobile number'}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-center mb-6">Verify Your Account</h2>
      <p className="text-gray-600 mb-6 text-center">
        We've sent verification codes to your email and mobile number. Please enter them below to complete your registration.
      </p>
      
      <Formik
        initialValues={{
          emailOTP: '',
          mobileOTP: ''
        }}
        validationSchema={OTPSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="emailOTP" className="form-label flex items-center">
                <FiMail className="mr-2" /> Email Verification Code
                {emailVerified && <FiCheck className="ml-2 text-green-500" />}
              </label>
              <div className="flex space-x-2">
                <Field
                  type="text"
                  name="emailOTP"
                  id="emailOTP"
                  disabled={emailVerified}
                  className={`form-input ${
                    errors.emailOTP && touched.emailOTP ? 'border-red-500' : ''
                  } ${emailVerified ? 'bg-gray-100' : ''}`}
                  placeholder="Enter 6-digit code"
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={() => handleResendOTP('email')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Resend
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Sent to: {email.substring(0, 3)}...{email.substring(email.indexOf('@'))}
              </div>
              <ErrorMessage name="emailOTP" component="div" className="form-error" />
            </div>

            <div>
              <label htmlFor="mobileOTP" className="form-label flex items-center">
                <FiPhone className="mr-2" /> Mobile Verification Code
                {mobileVerified && <FiCheck className="ml-2 text-green-500" />}
              </label>
              <div className="flex space-x-2">
                <Field
                  type="text"
                  name="mobileOTP"
                  id="mobileOTP"
                  disabled={mobileVerified}
                  className={`form-input ${
                    errors.mobileOTP && touched.mobileOTP ? 'border-red-500' : ''
                  } ${mobileVerified ? 'bg-gray-100' : ''}`}
                  placeholder="Enter 6-digit code"
                />
                {!mobileVerified && (
                  <button
                    type="button"
                    onClick={() => handleResendOTP('mobile')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Resend
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Sent to: {mobileNumber.substring(0, 2)}XXXXX{mobileNumber.substring(7)}
              </div>
              <ErrorMessage name="mobileOTP" component="div" className="form-error" />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="w-1/2 btn-outline py-3"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (emailVerified && mobileVerified)}
                className="w-1/2 btn-primary py-3"
              >
                {isSubmitting ? 'Verifying...' : emailVerified && mobileVerified ? 'Verified' : 'Verify'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default OTPVerification;
