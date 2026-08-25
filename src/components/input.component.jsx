'use client'

import { useState, useCallback, memo } from "react";

const InputBox = ({ 
  name, 
  type, 
  id, 
  value, 
  placeholder, 
  icon, 
  autoComplete = "off",
  disable = false,
  onChange,
  onBlur,
  required = false,
  maxLength,
  minLength,
  pattern,
  ariaLabel,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((currentVal) => !currentVal);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  const isPassword = type === "password";
  const inputType = isPassword && passwordVisible ? "text" : type;
  const showPasswordToggle = isPassword;

  return (
    <div className="relative w-full mb-4">
      <input 
        name={name}
        type={inputType}
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        disabled={disable}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`input-box transition-all duration-200 ${
          isFocused ? 'ring-2 ring-black/20' : ''
        } ${disable ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={ariaLabel || placeholder}
        aria-invalid={required && !value ? "true" : "false"}
        aria-describedby={id ? `${id}-description` : undefined}
      />
      
      {/* Left Icon */}
      {icon && (
        <i 
          className={`fi ${icon} input-icon pointer-events-none`}
          aria-hidden="true"
        />
      )}

      {/* Password Toggle Icon */}
      {showPasswordToggle && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disable}
          className="absolute left-auto right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 rounded p-1"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          <i 
            className={`fi fi-rr-eye${!passwordVisible ? "-crossed" : ""} text-xl`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

InputBox.displayName = "InputBox";

export default memo(InputBox);