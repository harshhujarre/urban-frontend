import { useState, useCallback } from "react";
import { MapPin, Bed, Bath, Users, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import propertyService from "../../api/propertyService";

export default function PropertyGrid({ properties, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <PropertySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 text-lg mb-2">No properties found</p>
        <p className="text-gray-500">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyGridCard
          key={property._id}
          property={property}
          onClick={() => navigate(`/property/${property._id}`)}
        />
      ))}
    </div>
  );
}

function PropertyGridCard({ property, onClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialise liked state from likedBy if user is logged in
  const isLikedInitially = user
    ? (property.likedBy || []).some(
        (id) => id === user._id || id?.toString?.() === user._id,
      )
    : false;

  const [liked, setLiked] = useState(isLikedInitially);
  const [likesCount, setLikesCount] = useState(property.likes || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleLike = useCallback(
    async (e) => {
      e.stopPropagation(); // Don't navigate to property detail

      if (!user) {
        navigate("/login");
        return;
      }

      if (likeLoading) return;

      // Optimistic update
      const newLiked = !liked;
      const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
      setLiked(newLiked);
      setLikesCount(newCount);
      setLikeLoading(true);

      try {
        const response = await propertyService.toggleLike(property._id);
        // apiClient returns data directly (no extra .data wrapper)
        if (response && typeof response.liked !== "undefined") {
          setLiked(response.liked);
          setLikesCount(response.likesCount ?? newCount);
        }
      } catch (error) {
        // Revert on failure
        setLiked(liked);
        setLikesCount(likesCount);
        console.error("Failed to toggle like:", error);
      } finally {
        setLikeLoading(false);
      }
    },
    [user, liked, likesCount, likeLoading, property._id, navigate],
  );

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden mb-3">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <MapPin className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          title={user ? (liked ? "Unlike" : "Like") : "Login to like"}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-all duration-200 shadow-md
            ${
              liked
                ? "bg-white text-red-500 hover:bg-red-50"
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-400"
            }
            ${likeLoading ? "opacity-70 cursor-wait" : "hover:scale-110"}
          `}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${liked ? "fill-red-500 stroke-red-500" : "fill-none"}`}
          />
          {likesCount > 0 && (
            <span className="text-xs font-semibold leading-none">
              {likesCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div>
        {/* Location */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {property.location.city}
            {property.location.state && `, ${property.location.state}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-gray-700 mb-1 line-clamp-1">{property.title}</h3>

        {/* Details */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{property.maxGuests}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(property.rentAmount || property.pricePerNight || 0)}
          </span>
          <span className="text-sm text-gray-600">
            {property.rentType === "per_person" ? "/ person" : "/ night"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}
