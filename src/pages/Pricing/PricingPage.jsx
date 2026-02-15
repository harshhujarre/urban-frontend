import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import paymentService from "../../api/paymentService";
import {
  Crown,
  Check,
  X,
  Eye,
  Home,
  Headphones,
  Zap,
  Shield,
  ArrowLeft,
} from "lucide-react";

// Load Razorpay Checkout script dynamically
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PricingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isPremium = (user?.accountType || "free") === "premium";

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setMessage({
          type: "error",
          text: "Failed to load payment gateway. Please check your internet connection.",
        });
        return;
      }

      // Create order
      const orderData = await paymentService.createOrder();
      const { orderId, amount, currency, keyId } = orderData.data;

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "UrbanStay",
        description: "Premium Account Upgrade",
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyData = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Update user in context
            updateUser(verifyData.user);

            setMessage({
              type: "success",
              text: "🎉 Payment successful! Your account has been upgraded to Premium.",
            });

            // Redirect after delay
            setTimeout(() => navigate("/account"), 2500);
          } catch (err) {
            setMessage({
              type: "error",
              text:
                err.message || "Payment verification failed. Contact support.",
            });
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#FF5A5F",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setMessage({
          type: "error",
          text: `Payment failed: ${response.error.description}`,
        });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to create payment order.",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Get started with the basics",
      isCurrent: !isPremium,
      features: [
        { text: "1 contact view per month", included: true, icon: Eye },
        { text: "2 property listings per month", included: true, icon: Home },
        { text: "Basic property search", included: true, icon: Check },
        { text: "Priority support", included: false, icon: Headphones },
        { text: "Unlimited contact views", included: false, icon: Eye },
        { text: "Up to 20 listings/month", included: false, icon: Home },
      ],
    },
    {
      name: "Premium",
      price: "₹1",
      period: "/month",
      description: "Unlock the full UrbanStay experience",
      isCurrent: isPremium,
      highlight: true,
      features: [
        { text: "10 contact views per month", included: true, icon: Eye },
        { text: "20 property listings per month", included: true, icon: Home },
        { text: "Advanced property search", included: true, icon: Check },
        { text: "Priority support", included: true, icon: Headphones },
        { text: "Premium badge on profile", included: true, icon: Crown },
        { text: "Early access to new features", included: true, icon: Zap },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Title Section */}
      <div className="text-center px-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium mb-6">
          <Crown className="w-4 h-4" />
          Choose Your Plan
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Upgrade Your Experience
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get more contact views, list more properties, and unlock premium
          features to grow your rental business.
        </p>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div
            className={`p-4 rounded-xl text-center font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? "bg-white border-2 border-[#FF5A5F] shadow-xl shadow-red-100/50 scale-[1.02]"
                  : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Popular Badge */}
              {plan.highlight && !isPremium && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#FF5A5F] to-[#E0484D] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  {plan.highlight && (
                    <Crown className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.isCurrent && (
                    <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <Shield className="w-3 h-3" />
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-lg">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        feature.included
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.included ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {plan.highlight ? (
                isPremium ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
                  >
                    ✓ You're on Premium
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF5A5F] to-[#E0484D] text-white font-semibold hover:shadow-lg hover:shadow-red-200/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Upgrade Now — ₹1
                      </>
                    )}
                  </button>
                )
              ) : !isPremium ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-xl border border-gray-200 text-gray-500 font-semibold cursor-not-allowed"
                >
                  Free Plan
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Secure payments powered by
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-700">Razorpay</span>
            <span className="text-xs text-gray-500 ml-2">
              256-bit SSL encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
