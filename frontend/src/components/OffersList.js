// frontend/src/components/OffersList.js
import React, { useEffect, useState } from "react";

// This component fetches profiles from Django and displays them
function OffersList() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/api/profiles/", {
    headers: {
      "Accept": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => setProfiles(data))
    .catch((error) => console.error("Error fetching profiles:", error));
}, []);


  return (
    <div>
      <h2>Profiles from Django</h2>
      {profiles.length === 0 ? (
        <p>Loading or no profiles yet...</p>
      ) : (
        <ul>
          {profiles.map((profile, index) => (
            <li key={index}>
              <strong>{profile.username}</strong> —{" "}
              {profile.timebank_balance} hours available
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OffersList;
