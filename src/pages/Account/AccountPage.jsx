import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import authService from "../../api/authService";
import ProfileImageUpload from "../../components/Account/ProfileImageUpload";
import {
  Save,
  Mail,
  Phone,
  User as UserIcon,
  Shield,
  Crown,
  Eye,
  Home,
} from "lucide-react";

export default function AccountPage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhoto: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [hasChanges, setHasChanges] = useState(false);

  // Load user data ONLY on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        profilePhoto: user.profilePhoto || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Run when user data loads

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleImageUpdate = (newImageUrl) => {
    console.log("Image uploaded - Full URL:", newImageUrl); // Debug log
    setFormData((prev) => {
      console.log(
        "Updating formData.profilePhoto from",
        prev.profilePhoto,
        "to",
        newImageUrl,
      );
      return { ...prev, profilePhoto: newImageUrl };
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await authService.updateProfile(formData);

      // Update user in context
      updateUser(response.user);

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setHasChanges(false);

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="mt-2 text-gray-600">
            {user.name}, {user.email}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Profile Image Section */}
            <div className="bg-white px-6 py-8 border-b border-gray-200">
              <ProfileImageUpload
                currentImage={formData.profilePhoto}
                onImageUpdate={handleImageUpdate}
              />
            </div>

            {/* User Info Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.name}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Type & Usage Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Plan
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${
                    (user.accountType || "free") === "premium"
                      ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {(user.accountType || "free") === "premium" && (
                    <Crown className="w-4 h-4" />
                  )}
                  {(user.accountType || "free") === "premium"
                    ? "Premium"
                    : "Free"}{" "}
                  Plan
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact Views</p>
                    <p className="font-semibold text-gray-900">
                      {user.contactViewsUsed || 0} /{" "}
                      {(user.accountType || "free") === "premium" ? 10 : 1}
                      <span className="text-xs text-gray-500 font-normal">
                        {" "}
                        this month
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Listings</p>
                    <p className="font-semibold text-gray-900">
                      {user.propertiesListedThisMonth || 0} /{" "}
                      {(user.accountType || "free") === "premium" ? 20 : 2}
                      <span className="text-xs text-gray-500 font-normal">
                        {" "}
                        this month
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="px-6 py-6 space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <UserIcon className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Mail className="w-4 h-4" />
                  Email Address
                  <span className="text-xs text-gray-500 font-normal">
                    (Read-only)
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Phone className="w-4 h-4" />
                  Phone Number
                  <span className="text-xs text-gray-500 font-normal">
                    (Verified)
                  </span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              {/* Message Display */}
              {message.text && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
