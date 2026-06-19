import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import { getLocations, getAverageRating, login, register } from "./api/api";
import AddLocationModal from "./components/AddLocationModal";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import RatingWidget from "./components/RatingWidget";
import AdminPanel from "./components/AdminPanel";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const blueIcon = createColoredIcon("blue");
const greenIcon = createColoredIcon("green");
const redIcon = createColoredIcon("red");

const createSpecialIcon = (color, label) => {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      color:white;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-weight:bold;font-size:16px;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const iconA = createSpecialIcon("#1a73e8", "A");
const iconB = createSpecialIcon("#0f9d58", "B");

const getIconForRating = (avgRating) => {
  if (!avgRating || avgRating === 0) return blueIcon;
  if (avgRating > 3) return greenIcon;
  return redIcon;
};

// Haversine distance in meters between two [lat,lng] points
function haversineDistance(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const x =
    sinLat * sinLat +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Minimum distance from point P to segment AB (all as [lat,lng])
function pointToSegmentDistance(P, A, B) {
  const [px, py] = [P[0], P[1]];
  const [ax, ay] = [A[0], A[1]];
  const [bx, by] = [B[0], B[1]];
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineDistance(P, A);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closest = [ax + t * dx, ay + t * dy];
  return haversineDistance(P, closest);
}

// Check if a polyline route passes within `radius` meters of any red location
function routePassesThroughBadZone(routeCoords, badLocations, radius = 250) {
  for (const bad of badLocations) {
    const badPt = [bad.lat, bad.lng];
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segA = [routeCoords[i].lat, routeCoords[i].lng];
      const segB = [routeCoords[i + 1].lat, routeCoords[i + 1].lng];
      if (pointToSegmentDistance(badPt, segA, segB) < radius) {
        return true;
      }
    }
  }
  return false;
}

// Fetch route from OSRM between two points, optionally avoiding waypoints
async function fetchOSRMRoute(from, to, waypoints = []) {
  const coords = [[from.lng, from.lat], ...waypoints.map((w) => [w.lng, w.lat]), [to.lng, to.lat]];
  const coordStr = coords.map((c) => c.join(",")).join(";");
  const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No route found");
  const geom = data.routes[0].geometry.coordinates;
  return geom.map(([lng, lat]) => ({ lat, lng }));
}

// Generate candidate detour waypoints around a bad location
function generateDetourCandidates(badLoc, radius = 400) {
  const candidates = [];
  const R = 111320; // meters per degree lat approx
  const offsets = [
    [radius, 0], [-radius, 0], [0, radius], [0, -radius],
    [radius * 0.7, radius * 0.7], [-radius * 0.7, radius * 0.7],
    [radius * 0.7, -radius * 0.7], [-radius * 0.7, -radius * 0.7],
  ];
  for (const [dy, dx] of offsets) {
    candidates.push({
      lat: badLoc.lat + dy / R,
      lng: badLoc.lng + dx / (R * Math.cos((badLoc.lat * Math.PI) / 180)),
    });
  }
  return candidates;
}

// Smart routing: find a route from A to B that avoids red zones
async function findSafeRoute(from, to, allLocations) {
  const badLocations = allLocations.filter((l) => l.averageRating > 0 && l.averageRating <= 3);
  const BAD_ZONE_RADIUS = 250;
  const DETOUR_RADIUS = 400;

  let route = await fetchOSRMRoute(from, to);
  if (!routePassesThroughBadZone(route, badLocations, BAD_ZONE_RADIUS)) {
    return { route, safe: true, warning: null };
  }

  const violated = badLocations.filter((bad) => {
    const badPt = [bad.lat, bad.lng];
    for (let i = 0; i < route.length - 1; i++) {
      const segA = [route[i].lat, route[i].lng];
      const segB = [route[i + 1].lat, route[i + 1].lng];
      if (pointToSegmentDistance(badPt, segA, segB) < BAD_ZONE_RADIUS) return true;
    }
    return false;
  });

  for (const bad of violated) {
    const candidates = generateDetourCandidates(bad, DETOUR_RADIUS);
    for (const waypoint of candidates) {
      try {
        const detourRoute = await fetchOSRMRoute(from, to, [waypoint]);
        if (!routePassesThroughBadZone(detourRoute, badLocations, BAD_ZONE_RADIUS)) {
          return { route: detourRoute, safe: true, warning: null };
        }
      } catch (e) {
      }
    }
  }

  if (violated.length >= 2) {
    for (const bad1 of violated) {
      for (const bad2 of violated) {
        if (bad1 === bad2) continue;
        const c1 = generateDetourCandidates(bad1, DETOUR_RADIUS);
        const c2 = generateDetourCandidates(bad2, DETOUR_RADIUS);
        for (const w1 of c1.slice(0, 4)) {
          for (const w2 of c2.slice(0, 4)) {
            try {
              const detourRoute = await fetchOSRMRoute(from, to, [w1, w2]);
              if (!routePassesThroughBadZone(detourRoute, badLocations, BAD_ZONE_RADIUS)) {
                return { route: detourRoute, safe: true, warning: null };
              }
            } catch (e) {
            }
          }
        }
      }
    }
  }

  return {
    route,
    safe: false,
    warning: "Nije moguće pronaći rutu koja potpuno zaobilazi loše lokacije. Prikazana je najpribližnija ruta.",
  };
}

function MapClickHandler({ isPickingLocation, setSelectedPosition, setIsPickingLocation, setIsOpen }) {
  useMapEvents({
    click(e) {
      if (!isPickingLocation) return;
      setSelectedPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      setIsPickingLocation(false);
      setIsOpen(true);
    },
  });
  return null;
}

function RouteLayer({ routeCoords, safe }) {
  if (!routeCoords || routeCoords.length === 0) return null;
  return (
    <>
      <Polyline
        positions={routeCoords.map((c) => [c.lat, c.lng])}
        pathOptions={{ color: "white", weight: 8, opacity: 0.6 }}
      />
      <Polyline
        positions={routeCoords.map((c) => [c.lat, c.lng])}
        pathOptions={{
          color: safe ? "#1a73e8" : "#f59e0b",
          weight: 5,
          opacity: 0.9,
          dashArray: safe ? null : "10, 8",
        }}
      />
    </>
  );
}

function App() {
  const [locations, setLocations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem("username"));

  //Mladen NOVO: Stanje za praćenje ocenjenih lokacija za trenutnog korisnika
  const [ratedLocations, setRatedLocations] = useState([]);

  const [directionsMode, setDirectionsMode] = useState(false);
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeTo, setRouteTo] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeSafe, setRouteSafe] = useState(true);
  const [routeWarning, setRouteWarning] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  //Strahinja, pretraga po nazivu
  const [search, setSearch] = useState("");
  //Strahinja, loading
  const [loading, setLoading] = useState(false);

  const loadLocationsWithRatings = () => {
    setLoading(true);
    getLocations()
      .then(async (locs) => {
        const withRatings = await Promise.all(
          locs.map(async (loc) => {
            try {
              const avgData = await getAverageRating(loc.id);
              return { ...loc, averageRating: avgData.average ?? 0 };
            } catch (err) {
              return { ...loc, averageRating: 0 };
            }finally{
              setLoading(false);
            }
          })
        );
        setLocations(withRatings);
      })
      .catch(console.error);
      
  };

  useEffect(() => {
    loadLocationsWithRatings();
  }, []);

  //Mladen NOVO: Učitavanje već ocenjenih lokacija iz localStorage kada se username promeni
  useEffect(() => {
    if (username) {
      // Pravimo jedinstven ključ u memoriji za svakog korisnika (npr. "rated_Marko")
      const savedRatings = JSON.parse(localStorage.getItem(`rated_${username}`)) || [];
      setRatedLocations(savedRatings);
    } else {
      setRatedLocations([]);
    }
  }, [username]);

  // NOVO: Funkcija koja beleži da je korisnik uspešno ocenio lokaciju
  const handleLocationRated = (locId) => {
    // 1. Osvježava prosečne ocene sa servera
    toast.success("Uspešno ocenjeno!");
    loadLocationsWithRatings();
    
    // 2. Upisuje u memoriju pregledača da je ovaj korisnik glasao za ovu lokaciju
    if (username) {
      const updatedRatings = [...ratedLocations, locId];
      setRatedLocations(updatedRatings);
      localStorage.setItem(`rated_${username}`, JSON.stringify(updatedRatings));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    toast.success("Uspešan logout!");
    setUsername(null);
  };

  const clearRoute = () => {
    setRouteFrom(null);
    setRouteTo(null);
    setRouteCoords([]);
    setRouteSafe(true);
    setRouteWarning(null);
    setRouteError(null);
    setDirectionsMode(false);
  };

  const handleDirectionsClick = (loc) => {
    if (!directionsMode) {
      setRouteFrom(loc);
      setRouteTo(null);
      setRouteCoords([]);
      setRouteWarning(null);
      setRouteError(null);
      setDirectionsMode("selectB");
    }
  };

  const handleSelectB = async (loc) => {
    if (loc.id === routeFrom?.id) return; 
    setRouteTo(loc);
    setDirectionsMode(false);
    setRouteLoading(true);
    setRouteError(null);
    setRouteWarning(null);
    try {
      const { route, safe, warning } = await findSafeRoute(
        { lat: routeFrom.lat, lng: routeFrom.lng },
        { lat: loc.lat, lng: loc.lng },
        locations
      );
      setRouteCoords(route);
      setRouteSafe(safe);
      setRouteWarning(warning);
    } catch (e) {
      setRouteError("Greška pri računanju rute. Pokušaj ponovo.");
    } finally {
      setRouteLoading(false);
    }
  };

  const getMarkerIcon = (loc) => {
    if (routeFrom?.id === loc.id) return iconA;
    if (routeTo?.id === loc.id) return iconB;
    return getIconForRating(loc.averageRating);
  };

  const badLocations = locations.filter((l) => l.averageRating > 0 && l.averageRating <= 3);


  const filteredLocations = locations.filter((location) =>
  location.name.toLowerCase().includes(search.toLowerCase())
);

const handleDeleteLocation = async (id) => {
  const confirmed = window.confirm("Da li si siguran da želiš da obrišeš ovu lokaciju?");

  if (!confirmed) return;

  try {
    await fetch(`https://zelena-mapa-ns.onrender.com/api/${id}`, {
      method: "DELETE",
    });

    loadLocationsWithRatings(); // refresh mape
    toast.success("Lokacija obrisana!");
  } catch (err) {
    console.error(err);
    toast.error("Greška pri brisanju!");
  }
};

  return (
  <>
    {loading ? (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
        <div className="spinner"></div>
      </div>
    ) : (
      <div className="app">
        <header className="header">
          <div className="header-auth">
            <input
              type="text"
              placeholder="Pretraži po nazivu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {username ? (
              <>
                <span>Prijavljen: {username}</span>
                <button className="btn-logout" onClick={handleLogout}>
                  Odjava
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)}>Prijava</button>
                <button onClick={() => setShowRegister(true)}>Registracija</button>
              </>
            )}
          </div>

          <h1>Zelena mapa Novog Sada</h1>
          <p>Interaktivna mapa ekoloških i zdravih lokacija u Novom Sadu</p>

          <button
            className="add-location-btn"
            onClick={() => {
              setIsPickingLocation(true);
              setSelectedPosition(null);
            }}
          >
            + Dodaj lokaciju
          </button>

          {localStorage.getItem("role") === "ADMIN" && (
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => setShowAdmin(!showAdmin)}
            >
              Admin panel
            </button>
          )}

          {isPickingLocation && (
            <div className="picking-hint">
              📍 Klikni na mapu da izabereš lokaciju
            </div>
          )}
        </header>

        {(directionsMode === "selectB" ||
          routeLoading ||
          routeWarning ||
          routeError ||
          routeCoords.length > 0) && (
          <div
            className={`route-banner ${
              routeWarning
                ? "warning"
                : routeError
                ? "error"
                : routeCoords.length > 0 && routeSafe
                ? "success"
                : ""
            }`}
          >
            {directionsMode === "selectB" && !routeLoading && (
              <span>
                📍 Polazna: <strong>{routeFrom?.name}</strong> — Klikni na
                odredišnu lokaciju (B)
              </span>
            )}
            {routeLoading && <span>🔄 Računam bezbednu rutu...</span>}
            {!routeLoading &&
              routeCoords.length > 0 &&
              !routeWarning &&
              !routeError && (
                <span>
                  ✅ Bezbedna ruta: <strong>{routeFrom?.name}</strong> →{" "}
                  <strong>{routeTo?.name}</strong>
                </span>
              )}
            {routeWarning && <span>⚠️ {routeWarning}</span>}
            {routeError && <span>❌ {routeError}</span>}
            <button className="route-clear-btn" onClick={clearRoute}>
              ✕ Obriši rutu
            </button>
          </div>
        )}

        <MapContainer
          center={[45.2671, 19.8335]}
          zoom={13}
          scrollWheelZoom={true}
          className={`map ${
            isPickingLocation ? "picking-mode" : ""
          } ${directionsMode === "selectB" ? "selecting-b-mode" : ""}`}
        >
          <MapClickHandler
            isPickingLocation={isPickingLocation}
            setSelectedPosition={setSelectedPosition}
            setIsPickingLocation={setIsPickingLocation}
            setIsOpen={setIsOpen}
          />

          {selectedPosition && (
            <Marker position={[selectedPosition.lat, selectedPosition.lng]} />
          )}

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeCoords.length > 0 &&
            badLocations.map((loc) => (
              <Circle
                key={`zone-${loc.id}`}
                center={[loc.lat, loc.lng]}
                radius={250}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: "6, 4",
                }}
              />
            ))}

          <RouteLayer routeCoords={routeCoords} safe={routeSafe} />

          {filteredLocations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={getMarkerIcon(loc)}
              eventHandlers={
                directionsMode === "selectB"
                  ? { click: () => handleSelectB(loc) }
                  : {}
              }
            >
              {directionsMode !== "selectB" && (
                <Popup>
                  <h3>{loc.name}</h3>
                  <p>{loc.description}</p>
                  <p>
                    Prosečna ocena:{" "}
                    {loc.averageRating
                      ? loc.averageRating.toFixed(1)
                      : "0"}
                  </p>

                  {username ? (
                    ratedLocations.includes(loc.id) ? (
                      <p style={{ color: "green", fontSize: "0.9em", fontWeight: "bold" }}>
                        ✓ Već ste ostavili recenziju.
                      </p>
                    ) : (
                      <RatingWidget
                        locationId={loc.id}
                        username={username}
                        onRated={() => handleLocationRated(loc.id)}
                      />
                    )
                  ) : (
                    <p
                      style={{
                        color: "gray",
                        fontSize: "0.9em",
                        fontStyle: "italic",
                      }}
                    >
                      (Morate biti prijavljeni da biste ocenili lokaciju)
                    </p>
                  )}

                  <hr style={{ margin: "8px 0" }} />

                  <button
                    className="directions-btn"
                    onClick={() => handleDirectionsClick(loc)}
                  >
                    Directions
                  </button>

                  {routeFrom && routeFrom.id !== loc.id && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                      ili{" "}
                      <span
                        className="directions-link"
                        onClick={() => handleSelectB(loc)}
                      >
                        postavi kao odredište od "{routeFrom.name}"
                      </span>
                    </div>
                  )}
                  {localStorage.getItem("role") === "ADMIN" && (
  <button
    className="delete-btn"
    style={{
      marginTop: "8px",
      background: "red",
      color: "white",
      border: "none",
      padding: "5px 10px",
      cursor: "pointer",
    }}
    onClick={() => handleDeleteLocation(loc.id)}
  >
    🗑 Obriši lokaciju
  </button>
)}
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>

        {showAdmin && (
          <AdminPanel onUpdate={loadLocationsWithRatings} />
        )}

        <AddLocationModal
          isOpen={isOpen}
          selectedPosition={selectedPosition}
          onClose={() => {
            setIsOpen(false);
            setSelectedPosition(null);
          }}
          onSave={(newLocation) => {
            if (!newLocation.name || !selectedPosition) {
              alert("Greška: nedostaje lokacija ili naziv");
              return;
            }

            const locationToSend = {
              ...newLocation,
              lat: selectedPosition.lat,
              lng: selectedPosition.lng,
            };

            fetch("https://zelena-mapa-ns.onrender.com/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(locationToSend),
            })
              .then(() => {
                setIsOpen(false);
                setSelectedPosition(null);
                loadLocationsWithRatings();
                alert(
                  "Lokacija je poslata na proveru i biće prikazana na mapi kada bude bila odobrena."
                );
              })
              .catch(console.error);
          }}
        />

        <LoginModal
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={(data) => setUsername(data.username)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />

        <RegisterModal
          open={showRegister}
          onClose={() => setShowRegister(false)}
          onRegister={(user) =>
            register(user.username, user.email, user.password)
          }
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />

        <ToastContainer />
      </div>
    )}
  </>
);
}

export default App;