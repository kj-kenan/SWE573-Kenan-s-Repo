import React, { useEffect, useState } from "react";

function TimeBank() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Fetch unified timebank data (balance + transactions)
    fetch(`${API_BASE_URL}/api/timebank/`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          }
          throw new Error("Failed to fetch timebank data.");
        }

        const data = await res.json();
        setBalance(data.balance || 0);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      })
      .catch((err) => {
        setError(err.message || "Server connection error.");
        console.error("Error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_BASE_URL]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 flex items-center justify-center">
        <p className="text-center text-red-600 text-xl">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 flex items-center justify-center">
        <p className="text-center text-xl">Loading your Timebank...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 px-10 py-16 text-center mb-8">
          <h1 className="text-4xl font-extrabold text-amber-600 mb-4">
            Your Beellars
          </h1>
          <p className="text-6xl font-bold text-gray-800">{balance}</p>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
          <h2 className="text-2xl font-bold text-amber-700 mb-6">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No transactions yet. Complete handshakes to see your transaction history.
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isEarned = transaction.transaction_type === "earned";
                const isSpent = transaction.transaction_type === "spent";
                
                return (
                  <div
                    key={transaction.id}
                    className={`border-l-4 p-4 rounded-lg ${
                      isEarned
                        ? "bg-green-50 border-green-500"
                        : isSpent
                        ? "bg-red-50 border-red-500"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              isEarned
                                ? "bg-green-200 text-green-800"
                                : isSpent
                                ? "bg-red-200 text-red-800"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {isEarned ? "💰 Earned" : isSpent ? "💸 Spent" : "📊 Transaction"}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                            {new Date(transaction.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {transaction.related_post_title && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-semibold">Related post:</span> {transaction.related_post_title}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {isEarned
                            ? `Received from ${transaction.sender_username}`
                            : isSpent
                            ? `Paid to ${transaction.receiver_username}`
                            : `${transaction.sender_username} → ${transaction.receiver_username}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            isEarned
                              ? "text-green-600"
                              : isSpent
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {isEarned ? "+" : isSpent ? "-" : ""}
                          {transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">Beellars</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeBank;
