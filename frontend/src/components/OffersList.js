// OffersList.js
import React, { useEffect, useState } from "react";

// Fetches offers from Django API and displays them
function OffersList() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/offers/")
      .then((res) => res.json())
      .then((data) => setOffers(data))
      .catch((err) => console.error("Error fetching offers:", err));
  }, []);

  return (
    <div>
      <h2>Offers</h2>
      <ul>
        {offers.map((offer) => (
          <li key={offer.id}>{offer.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default OffersList;
