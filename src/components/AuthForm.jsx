// src/components/AuthForm.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

// Simple Spinner component (can be replaced with a nicer one later)
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-[color:var(--primary-accent)] inline"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const AuthForm = ({ fields, buttonText, onSubmit, isLoading }) => {
  // Initialize form state dynamically based on fields prop
  const initialFormState = fields.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation: check if any required field is empty
    const missingField = fields.find(
      (field) => field.required && !formData[field.name]
    );
    if (missingField) {
      // Handle validation error (e.g., show a message, focus the field)
      alert(`Please fill in the ${missingField.label} field.`);
      return;
    }
    onSubmit(formData); // Pass the form data to the parent handler
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-sm font-medium mb-2 text-[color:var(--text-secondary)]"
          >
            {field.label}
          </label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            required={field.required !== false} // Default to true if not specified
            className="neumorphic-input" // Apply base neumorphic input style
            disabled={isLoading}
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full neumorphic-interactive px-5 py-3 text-[color:var(--primary-accent)] font-semibold rounded-neumorphic-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner /> Processing...
          </>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
};

AuthForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      required: PropTypes.bool,
    })
  ).isRequired,
  buttonText: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default AuthForm;
