import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import PropTypes from "prop-types";
import "./UnifiedAuthModal.css";

const UnifiedAuthModal = ({ onSuccess }) => {
  // ==================== STATE MANAGEMENT ====================
  const [stage, setStage] = useState("initial"); // initial | otp | phone-for-google | profile
  const [authMethod, setAuthMethod] = useState(null); // phone | google

  const [formData, setFormData] = useState({
    phoneNumber: "",
    otp: "",
    name: "",
    city: "",
  });

  const [googleData, setGoogleData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  const otpInputRef = useRef(null);
  const { sendOtp, verifyOtp, googleLogin, completeSignup } = useAuth();

  // ==================== EFFECTS ====================

  // Auto-focus OTP input when stage changes to otp
  useEffect(() => {
    if (stage === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [stage]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Prefill name from Google data when entering profile stage
  useEffect(() => {
    if (stage === "profile" && googleData?.name && !formData.name) {
      setFormData((prev) => ({ ...prev, name: googleData.name }));
    }
  }, [stage, googleData, formData.name]);

  // ==================== VALIDATION ====================

  const validatePhone = (phone) => {
    if (!phone || phone.length !== 10) {
      return "Please enter a valid 10-digit phone number";
    }
    if (!/^\d{10}$/.test(phone)) {
      return "Phone number must contain only digits";
    }
    return null;
  };

  const validateOtp = (otp) => {
    if (!otp || otp.length !== 4) {
      return "Please enter the 4-digit OTP";
    }
    if (!/^\d{4}$/.test(otp)) {
      return "OTP must contain only digits";
    }
    return null;
  };

  const validateProfile = (name, city) => {
    if (!name || name.trim().length < 2) {
      return "Please enter your name (at least 2 characters)";
    }
    if (!city || city.trim().length < 2) {
      return "Please enter your city";
    }
    return null;
  };

  // ==================== HANDLERS ====================

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 10) {
      setFormData({ ...formData, phoneNumber: value });
      setError("");
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 4) {
      setFormData({ ...formData, otp: value });
      setError("");
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
  };

  // ==================== PHONE AUTH FLOW ====================

  const handleSendOtp = async () => {
    setError("");

    const validationError = validatePhone(formData.phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(formData.phoneNumber);
      setIsNewUser(result.isNewUser);
      setAuthMethod("phone");
      setStage("otp");
      startResendTimer();
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");

    const validationError = validateOtp(formData.otp);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(formData.phoneNumber, formData.otp);

      if (result.needsSignup) {
        // New user - go to profile completion
        setStage("profile");
      } else {
        // Existing user - logged in successfully
        onSuccess();
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError("");
    setLoading(true);
    try {
      await sendOtp(formData.phoneNumber);
      setFormData({ ...formData, otp: "" });
      startResendTimer();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to resend OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== GOOGLE AUTH FLOW ====================

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");

    try {
      const result = await googleLogin(credentialResponse.credential);

      if (result.needsPhoneVerification) {
        // Store Google data and require phone verification
        setGoogleData(result.googleData);
        setAuthMethod("google");
        setStage("phone-for-google");
      } else {
        // Existing user with phone - logged in successfully
        onSuccess();
      }
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Google login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  const handleSendOtpForGoogle = async () => {
    setError("");

    const validationError = validatePhone(formData.phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(formData.phoneNumber);
      setStage("otp");
      startResendTimer();
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== COMPLETE SIGNUP ====================

  const handleCompleteSignup = async () => {
    setError("");

    const validationError = validateProfile(formData.name, formData.city);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        phone: formData.phoneNumber,
        name: formData.name.trim(),
        city: formData.city.trim(),
        ...(googleData && {
          googleId: googleData.googleId,
          email: googleData.email,
          profilePhoto: googleData.profilePhoto,
        }),
      };

      await completeSignup(signupData);
      onSuccess();
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Signup failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== RESET ====================

  const handleBackToInitial = () => {
    setStage("initial");
    setFormData({ phoneNumber: "", otp: "", name: "", city: "" });
    setGoogleData(null);
    setError("");
    setResendTimer(0);
  };

  // ==================== RENDER STAGES ====================

  const renderInitialStage = () => (
    <div className="auth-stage">
      <h2 className="auth-title">Welcome to UrbanStay</h2>

      <div className="form-group">
        <label className="form-label">Country/Region</label>
        <div className="country-display">India (+91)</div>
      </div>

      <div className="form-group">
        <label className="form-label">Phone number</label>
        <div className="phone-input-wrapper">
          <span className="phone-prefix">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            className="form-input phone-input"
            placeholder="Enter 10-digit number"
            value={formData.phoneNumber}
            onChange={handlePhoneChange}
            maxLength="10"
          />
        </div>
      </div>

      <p className="auth-info">
        We'll text you to confirm your number. Standard message and data rates
        apply.
      </p>

      <button
        className="btn btn-primary btn-block"
        onClick={handleSendOtp}
        disabled={loading || formData.phoneNumber.length !== 10}
      >
        {loading ? "Sending..." : "Continue"}
      </button>

      <div className="divider">
        <span>or</span>
      </div>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="continue_with"
          width="100%"
        />
      </div>
    </div>
  );

  const renderOtpStage = () => (
    <div className="auth-stage">
      <div className="otp-header">
        <p className="otp-sent-to">OTP sent to +91 {formData.phoneNumber}</p>
        <button className="btn-link" onClick={handleBackToInitial}>
          Change
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Enter 4-Digit OTP</label>
        <input
          ref={otpInputRef}
          type="text"
          inputMode="numeric"
          className="form-input otp-input"
          placeholder="• • • •"
          value={formData.otp}
          onChange={handleOtpChange}
          maxLength="4"
        />
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={handleVerifyOtp}
        disabled={loading || formData.otp.length !== 4}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <button
        className="btn btn-link"
        onClick={handleResendOtp}
        disabled={resendTimer > 0}
      >
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
      </button>
    </div>
  );

  const renderPhoneForGoogleStage = () => (
    <div className="auth-stage">
      <h3 className="auth-title">Complete your profile</h3>
      <p className="auth-subtitle">We need to verify your phone number</p>

      {googleData && (
        <div className="google-user-info">
          <img
            src={googleData.profilePhoto}
            alt={googleData.name}
            className="google-avatar"
          />
          <div>
            <p className="google-name">{googleData.name}</p>
            <p className="google-email">{googleData.email}</p>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Phone number</label>
        <div className="phone-input-wrapper">
          <span className="phone-prefix">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            className="form-input phone-input"
            placeholder="Enter 10-digit number"
            value={formData.phoneNumber}
            onChange={handlePhoneChange}
            maxLength="10"
          />
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={handleSendOtpForGoogle}
        disabled={loading || formData.phoneNumber.length !== 10}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>
    </div>
  );

  const renderProfileStage = () => (
    <div className="auth-stage">
      <h3 className="auth-title">Complete your profile</h3>

      {googleData && (
        <div className="google-user-info">
          <img
            src={googleData.profilePhoto}
            alt={googleData.name}
            className="google-avatar"
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter your name"
          value={formData.name || googleData?.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">City</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter your city"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={handleCompleteSignup}
        disabled={loading || !formData.name.trim() || !formData.city.trim()}
      >
        {loading ? "Creating account..." : "Complete Signup"}
      </button>
    </div>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="unified-auth-modal">
      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}

      {/* Stage Rendering */}
      {stage === "initial" && renderInitialStage()}
      {stage === "otp" && renderOtpStage()}
      {stage === "phone-for-google" && renderPhoneForGoogleStage()}
      {stage === "profile" && renderProfileStage()}
    </div>
  );
};

UnifiedAuthModal.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default UnifiedAuthModal;
