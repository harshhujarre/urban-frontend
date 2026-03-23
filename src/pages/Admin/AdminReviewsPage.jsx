import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import {
  getAdminReviews,
  deleteAdminReview,
  downloadCSV,
} from "../../api/adminApi";
import {
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Trash2,
} from "lucide-react";

const AdminReviewsPage = () => {
  const [data, setData] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews({ page, limit: 15 });
      setData(res);
    } catch {
      showToast("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteAdminReview(id);
      showToast("Review deleted.");
      fetchReviews();
    } catch {
      showToast("Failed to delete review.");
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-gray-600"
          }`}
        />
      ))}
    </div>
  );

  const { pagination } = data;

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <CheckCheck className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Reviews</h1>
              <p className="text-sm text-gray-400">
                {pagination?.total?.toLocaleString() || 0} total reviews
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadCSV("reviews")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-4 font-medium">Reviewer</th>
                  <th className="px-5 py-4 font-medium">Property</th>
                  <th className="px-5 py-4 font-medium">Rating</th>
                  <th className="px-5 py-4 font-medium">Comment</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : data.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-gray-500"
                    >
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  data.data.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                            {r.userId?.profilePhoto ? (
                              <img
                                src={r.userId.profilePhoto}
                                alt={r.userId.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              r.userId?.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {r.userId?.name || "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.userId?.email || r.userId?.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white line-clamp-1 max-w-[200px]">
                          {r.propertyId?.title || "Deleted"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.propertyId?.location?.city || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">{renderStars(r.rating)}</td>
                      <td className="px-5 py-4">
                        <p className="text-gray-400 line-clamp-2 max-w-[260px]">
                          {r.comment}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
