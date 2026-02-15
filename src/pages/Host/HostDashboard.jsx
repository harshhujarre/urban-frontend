import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import propertyService from "../../api/propertyService";
import PropertyCard from "../../components/Property/PropertyCard";
import { Plus, Home, Crown, AlertTriangle } from "lucide-react";

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Account limits
  const accountType = user?.accountType || "free";
  const listingLimit = accountType === "premium" ? 20 : 2;
  const listingsUsed = user?.propertiesListedThisMonth || 0;
  const canAddMore = listingsUsed < listingLimit;

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getMyProperties();
      setProperties(data.data);
      setError("");
    } catch (error) {
      console.error("Failed to load properties:", error);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyDeleted = (propertyId) => {
    setProperties(properties.filter((p) => p._id !== propertyId));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Host Dashboard
              </h1>
              {/* Account Type Badge */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    accountType === "premium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {accountType === "premium" && <Crown className="w-3 h-3" />}
                  {accountType === "premium" ? "Premium" : "Free"} Account
                </span>
                <span className="text-sm text-gray-500">
                  {listingsUsed}/{listingLimit} listings this month
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/host/dashboard/add-property")}
              disabled={!canAddMore}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                canAddMore
                  ? "bg-gradient-to-r from-[#FF5A5F] to-[#E0484D] text-white hover:shadow-lg"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
          </div>
        </div>
      </div>

      {/* Listing Limit Warning */}
      {!canAddMore && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                Monthly listing limit reached
              </p>
              <p className="text-sm text-amber-700 mt-1">
                You've used all {listingLimit} listings for this month (
                {accountType} account).
                {accountType === "free" &&
                  " Upgrade to Premium to list up to 20 properties per month."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF5A5F]"></div>
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            onAddClick={() => navigate("/host/dashboard/add-property")}
            canAddMore={canAddMore}
          />
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Properties ({properties.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onUpdate={loadProperties}
                  onDelete={handlePropertyDeleted}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onAddClick, canAddMore }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Home className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        No properties yet
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Start earning by listing your first property. It only takes a few
        minutes to create a listing.
      </p>
      <button
        onClick={onAddClick}
        disabled={!canAddMore}
        className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-all duration-200 font-medium text-lg ${
          canAddMore
            ? "bg-gradient-to-r from-[#FF5A5F] to-[#E0484D] text-white hover:shadow-lg"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Plus className="w-6 h-6" />
        Create Your First Listing
      </button>
    </div>
  );
}
