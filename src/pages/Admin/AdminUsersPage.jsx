import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import {
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  downloadCSV,
} from "../../api/adminApi";
import {
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCog,
  X,
  CheckCheck,
} from "lucide-react";

const ROLE_BADGE = {
  guest: "bg-indigo-500/20 text-indigo-400",
  host: "bg-purple-500/20 text-purple-400",
  admin: "bg-red-500/20 text-red-400",
};

const ACCOUNT_BADGE = {
  free: "bg-gray-700 text-gray-400",
  premium: "bg-amber-500/20 text-amber-400",
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <p className="text-white text-center mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors text-sm font-medium">Confirm</button>
      </div>
    </div>
  </div>
);

const AdminUsersPage = () => {
  const [data, setData] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(null); // { message, action }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        page,
        limit: 15,
        search: search || undefined,
        role: roleFilter || undefined,
        accountType: accountFilter || undefined,
      });
      setData(res);
    } catch {
      showToast("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, accountFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateAdminUser(userId, { role: newRole });
      showToast("Role updated successfully.");
      fetchUsers();
    } catch {
      showToast("Failed to update role.");
    }
  };

  const handleAccountChange = async (userId, newAccount) => {
    try {
      await updateAdminUser(userId, { accountType: newAccount });
      showToast("Account type updated.");
      fetchUsers();
    } catch {
      showToast("Failed to update account type.");
    }
  };

  const handleDelete = (userId, userName) => {
    setConfirm({
      message: `Delete "${userName}"? This will also remove their properties and bookings.`,
      action: async () => {
        try {
          await deleteAdminUser(userId);
          showToast("User deleted.");
          fetchUsers();
        } catch {
          showToast("Failed to delete user.");
        }
        setConfirm(null);
      },
    });
  };

  const { pagination } = data;

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <CheckCheck className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Users</h1>
              <p className="text-sm text-gray-400">
                {pagination?.total?.toLocaleString() || 0} total users
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadCSV("users")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="guest">Guest</option>
            <option value="host">Host</option>
          </select>
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Accounts</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Phone</th>
                  <th className="px-5 py-4 font-medium">City</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Account</th>
                  <th className="px-5 py-4 font-medium">Joined</th>
                  <th className="px-5 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : data.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-500">No users found.</td>
                  </tr>
                ) : (
                  data.data.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
                            {u.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.name}</p>
                            {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400">{u.phone}</td>
                      <td className="px-5 py-4 text-gray-400">{u.city}</td>
                      <td className="px-5 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer ${ROLE_BADGE[u.role] || ""} bg-transparent`}
                        >
                          <option value="guest">guest</option>
                          <option value="host">host</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={u.accountType}
                          onChange={(e) => handleAccountChange(u._id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer ${ACCOUNT_BADGE[u.accountType] || ""} bg-transparent`}
                        >
                          <option value="free">free</option>
                          <option value="premium">premium</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete user"
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

          {/* Pagination */}
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

export default AdminUsersPage;
