// src/pages/SignupPage.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { register, resetAuthStatus } from "../features/auth/authSlice";
import AuthForm from "../components/AuthForm";
import ThemeToggle from "../components/ThemeToggle"; // Import ThemeToggle

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const signupFields = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Your Name",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "you@example.com",
      required: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Minimum 6 characters",
      required: true,
    },
  ];

  useEffect(() => {
    if (isSuccess || user) {
      navigate("/");
    }
    return () => {
      if (isSuccess || isError) {
        dispatch(resetAuthStatus());
      }
    };
  }, [user, isSuccess, isError, navigate, dispatch]);

  const handleSignup = (formData) => {
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };
    dispatch(register(userData));
  };

  return (
    // Main container using Grid for two columns, responsive stacking
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[color:var(--bg-base)] text-[color:var(--text-primary)]">
      {/* Theme Toggle - Positioned absolute top-right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Column: App Description */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 lg:p-16 bg-opacity-50 neumorphic-pressed">
        {" "}
        {/* Subtle pressed background */}
        <div className="text-center">
          {/* Logo Placeholder */}
          <div className="h-16 w-16 neumorphic-pressed rounded-full flex items-center justify-center text-4xl font-bold text-[color:var(--primary-accent)] mb-6 mx-auto border-2 border-[color:var(--primary-accent)] border-opacity-30">
            N
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-[color:var(--text-primary)]">
            Join NeumoChat Today!
          </h1>
          <p className="text-lg lg:text-xl text-[color:var(--text-secondary)]">
            Experience a fresh take on messaging. Sign up for free and start
            chatting with a unique, modern interface.
          </p>
          {/* Optional: Add an illustration or more features description later */}
        </div>
      </div>

      {/* Right Column: Signup Form */}
      <div className="flex flex-col justify-center items-center p-6 md:p-10 lg:p-16">
        {" "}
        {/* Centering content */}
        <div className="w-full max-w-md neumorphic-raised p-8 md:p-10 rounded-neumorphic-lg">
          <h2 className="text-3xl font-bold text-center mb-6 text-[color:var(--text-primary)]">
            Create Account
          </h2>

          {/* Display Error Message */}
          {isError && message && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-md border border-red-300 dark:border-red-600">
              Error: {message}
            </div>
          )}

          <AuthForm
            fields={signupFields}
            buttonText="Sign Up"
            onSubmit={handleSignup}
            isLoading={isLoading}
          />

          <p className="text-center text-sm mt-6 text-[color:var(--text-secondary)]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[color:var(--primary-accent)] hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
        {/* Add app name/footer for mobile view if needed */}
        <p className="md:hidden text-center text-xs mt-8 text-[color:var(--text-secondary)]">
          NeumoChat
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
