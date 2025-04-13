// src/pages/SettingsPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  UserCircleIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { updateProfile, resetAuthStatus } from "../features/auth/authSlice";

// Note: For profile picture uploads to work properly, you need to add your Cloudinary credentials to server/.env:
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret

const SettingsPage = () => {
  const { user, isLoading, isSuccess, isError, message } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    status: user?.status || "Hey there! I am using NeumoChat.",
    pic: user?.pic || "",
  });
  
  // Preview image for upload
  const [previewImage, setPreviewImage] = useState(formData.pic);
  
  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      console.log("User data updated in Settings:", user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        status: user.status || "Hey there! I am using NeumoChat.",
        pic: user.pic || ""
      });
      setPreviewImage(user.pic || "");
    }
  }, [user]);
  
  // Handle success/error messages from Redux state
  useEffect(() => {
    if (isSuccess) {
      setSuccess(true);
      setError("");
      
      // Reset the success/error state after 3 seconds
      const timer = setTimeout(() => {
        dispatch(resetAuthStatus());
        setSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (isError) {
      setError(message || "Something went wrong. Please try again.");
      setSuccess(false);
      
      // Reset the error state after showing the message
      const timer = setTimeout(() => {
        dispatch(resetAuthStatus());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isError, message, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation
      if (!file.type.match('image.*')) {
        setError("Please select an image file");
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {  // 2MB limit
        setError("Image must be less than 2MB");
        return;
      }
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      // Create form data
      const updateData = new FormData();
      
      // Log the form data before sending
      console.log("Form Data before submitting:", {
        name: formData.name,
        email: formData.email,
        status: formData.status
      });
      
      updateData.append("name", formData.name);
      updateData.append("email", formData.email);
      updateData.append("status", formData.status);
      
      // If a new image was selected
      if (fileInputRef.current.files[0]) {
        updateData.append("profilePic", fileInputRef.current.files[0]);
      }
      
      // Dispatch the updateProfile action
      dispatch(updateProfile(updateData));
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Profile update error:", error);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-3 sm:p-6 flex flex-col items-center custom-scrollbar">
      {/* Main Card */}
      <div className="neumorphic-raised w-full max-w-md p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-[color:var(--text-primary)] text-center">
          Profile Settings
        </h2>

        {/* Status Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center text-green-600 dark:text-green-400">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>Profile updated successfully!</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center text-red-600 dark:text-red-400">
            <XCircleIcon className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="mb-6 flex flex-col items-center">
            <div 
              className="neumorphic-pressed rounded-full w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden cursor-pointer mb-2"
              onClick={triggerFileInput}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      formData.name || "User"
                    )}&background=random&color=fff&size=128`;
                  }}
                />
              ) : (
                <UserCircleIcon className="w-16 h-16 text-[color:var(--text-secondary)]" />
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            
            <button
              type="button"
              onClick={triggerFileInput}
              className="neumorphic-interactive text-sm py-1 px-3 rounded-md flex items-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              Change Photo
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="neumorphic-inset w-full px-3 py-2 rounded-md text-[color:var(--text-primary)] bg-transparent focus:outline-none"
                placeholder="Your name"
              />
            </div>
            
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="neumorphic-inset w-full px-3 py-2 rounded-md text-[color:var(--text-primary)] bg-transparent focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>
            
            {/* Status Input */}
            <div>
              <label 
                htmlFor="status" 
                className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-1"
              >
                Status
              </label>
              <textarea
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="neumorphic-inset w-full px-3 py-2 rounded-md text-[color:var(--text-primary)] bg-transparent focus:outline-none resize-none"
                placeholder="Tell others what you're up to..."
                rows="3"
              />
            </div>
            
            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`neumorphic-interactive py-2 px-6 rounded-md text-[color:var(--primary-accent)] font-medium hover:brightness-110 dark:hover:brightness-125 transition-all ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
