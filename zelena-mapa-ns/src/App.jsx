import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Circle,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  getLocations,
  getAverageRating,
  getRatings,
  addLocation,
  login,
  register,
  uploadLocationImage,
  getFriends,
  recommendLocation,
  getNotifications,
  getImages,
  getPendingFriendRequests,
} from "./api/api";
import AddLocationModal from "./components/AddLocationModal";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import RatingWidget from "./components/RatingWidget";
import AdminPanel from "./components/AdminPanel";
import UserSearchPanel from "./components/UserSearchPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import FriendRequestsPanel from "./components/FriendRequestsPanel";
import ConfirmModal from "./components/ConfirmModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import RecommendModal from "./components/RecommendModal";
import ImageSlider from "./components/ImageSlider";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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

function pointToSegmentDistance(P, A, B) {
  const [px, py] = [P[0], P[1]];
  const [ax, ay] = [A[0], A[1]];
  const [bx, by] = [B[0], B[1]];
  const dx = bx - ax,
    dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineDistance(P, A);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closest = [ax + t * dx, ay + t * dy];
  return haversineDistance(P, closest);
}

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

async function fetchOSRMRoute(from, to, waypoints = []) {
  const coords = [
    [from.lng, from.lat],
    ...waypoints.map((w) => [w.lng, w.lat]),
    [to.lng, to.lat],
  ];
  const coordStr = coords.map((c) => c.join(",")).join(";");
  const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0)
    throw new Error("No route found");
  const route = data.routes[0];
  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distance: route.distance,
  };
}

function calcTravelTimes(distanceMeters) {
  const km = distanceMeters / 1000;
  return {
    foot: { duration: (km / 5) * 3600, distance: distanceMeters },
    bike: { duration: (km / 15) * 3600, distance: distanceMeters },
    car: { duration: (km / 50) * 3600, distance: distanceMeters },
  };
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function generateDetourCandidates(badLoc, radius) {
  const R = 6371000;
  const candidates = [];
  const bearings = [0, 45, 90, 135, 180, 225, 270, 315];
  const lat1 = (badLoc.lat * Math.PI) / 180;
  const lon1 = (badLoc.lng * Math.PI) / 180;
  const angDist = radius / R;

  for (const b of bearings) {
    const bearing = (b * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angDist) +
        Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1),
        Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
      );
    candidates.push({
      lat: (lat2 * 180) / Math.PI,
      lng: (lon2 * 180) / Math.PI,
    });
  }

  return candidates;
}

async function findShortestRoute(from, to) {
  const result = await fetchOSRMRoute(from, to);
  return {
    route: result.coords,
    safe: null,
    warning: null,
    travelTimes: calcTravelTimes(result.distance),
  };
}

async function findSafeRoute(from, to, allLocations) {
  const badLocations = allLocations.filter(
    (l) => l.averageRating > 0 && l.averageRating <= 3,
  );
  const BAD_ZONE_RADIUS = 250;

  async function findSafeForFoot() {
    const directResult = await fetchOSRMRoute(from, to);
    if (
      !routePassesThroughBadZone(
        directResult.coords,
        badLocations,
        BAD_ZONE_RADIUS,
      )
    ) {
      return directResult;
    }

    const violated = badLocations.filter((bad) => {
      const badPt = [bad.lat, bad.lng];
      for (let i = 0; i < directResult.coords.length - 1; i++) {
        const segA = [directResult.coords[i].lat, directResult.coords[i].lng];
        const segB = [
          directResult.coords[i + 1].lat,
          directResult.coords[i + 1].lng,
        ];
        if (pointToSegmentDistance(badPt, segA, segB) < BAD_ZONE_RADIUS)
          return true;
      }
      return false;
    });

    const detourRadii = [400, 600, 900, 1300, 1800, 2500, 3500];
    for (const radius of detourRadii) {
      for (const bad of violated) {
        const candidates = generateDetourCandidates(bad, radius);
        for (const waypoint of candidates) {
          try {
            const detourResult = await fetchOSRMRoute(from, to, [waypoint]);
            if (
              !routePassesThroughBadZone(
                detourResult.coords,
                badLocations,
                BAD_ZONE_RADIUS,
              )
            ) {
              return detourResult;
            }
          } catch (e) {}
        }
      }
    }

    if (violated.length >= 2) {
      for (const radius of [600, 1000, 1500]) {
        for (const bad1 of violated) {
          for (const bad2 of violated) {
            if (bad1 === bad2) continue;
            const c1 = generateDetourCandidates(bad1, radius);
            const c2 = generateDetourCandidates(bad2, radius);
            for (const w1 of c1.slice(0, 4)) {
              for (const w2 of c2.slice(0, 4)) {
                try {
                  const detourResult = await fetchOSRMRoute(from, to, [w1, w2]);
                  if (
                    !routePassesThroughBadZone(
                      detourResult.coords,
                      badLocations,
                      BAD_ZONE_RADIUS,
                    )
                  ) {
                    return detourResult;
                  }
                } catch (e) {}
              }
            }
          }
        }
      }
    }

    return null;
  }

  if (badLocations.length === 0) {
    const result = await fetchOSRMRoute(from, to);
    return {
      route: result.coords,
      safe: true,
      warning: null,
      travelTimes: calcTravelTimes(result.distance),
    };
  }

  const safeFootResult = await findSafeForFoot();

  if (!safeFootResult) {
    return {
      route: null,
      safe: false,
      warning:
        "Nije moguce pronaci rutu koja zaobilazi lose lokacije. Pokusaj odabrati drugu destinaciju.",
      travelTimes: null,
    };
  }

  return {
    route: safeFootResult.coords,
    safe: true,
    warning: null,
    travelTimes: calcTravelTimes(safeFootResult.distance),
  };
}

function MapClickHandler({
  isPickingLocation,
  setSelectedPosition,
  setIsPickingLocation,
  setIsOpen,
}) {
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

function RouteLayer({ routeCoords, routeMode }) {
  if (!routeCoords || routeCoords.length === 0) return null;
  const color = routeMode === "shortest" ? "#1a73e8" : "#16a34a";
  return (
    <>
      <Polyline
        positions={routeCoords.map((c) => [c.lat, c.lng])}
        pathOptions={{ color: "white", weight: 8, opacity: 0.6 }}
      />
      <Polyline
        positions={routeCoords.map((c) => [c.lat, c.lng])}
        pathOptions={{ color, weight: 5, opacity: 0.9 }}
      />
    </>
  );
}

function App() {
  const [recommendLocation_loc, setRecommendLocation_loc] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState(() =>
    localStorage.getItem("username"),
  );
  const [role, setRole] = useState(() => localStorage.getItem("role"));

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
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  const [routeMode, setRouteMode] = useState("safe");
  const [travelTimes, setTravelTimes] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagesByLocation, setImagesByLocation] = useState({});
  const [ratingsByLocation, setRatingsByLocation] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState({});
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Potvrdi",
    variant: "default",
    onConfirm: null,
    cancelText: "Otkazi",
  });

  const showConfirm = (options) => {
    setConfirmModal({
      ...confirmModal,
      open: true,
      cancelText: "Otkazi",
      ...options,
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const loadImages = async (locationId) => {
    try {
      const id = String(locationId);
      setLoadingImages((prev) => ({ ...prev, [id]: true }));
      const data = await getImages(id);
      const clean = Array.isArray(data)
        ? data.filter((img) => img?.imageUrl)
        : [];
      setImagesByLocation((prev) => ({ ...prev, [id]: clean }));
    } catch (e) {
      console.error("loadImages error:", e);
      setImagesByLocation((prev) => ({ ...prev, [String(locationId)]: [] }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [String(locationId)]: false }));
    }
  };

  const loadRatings = async (locationId) => {
    try {
      const ratings = await getRatings(locationId);
      if (!ratings?.length) {
        setRatingsByLocation((prev) => ({
          ...prev,
          [locationId]: {
            averageDistance: 0,
            averageCleanliness: 0,
            averageGreenArea: 0,
            count: 0,
          },
        }));
        return;
      }
      const summary = ratings.reduce(
        (acc, item) => {
          acc.distance += item.distanceFromCenter || 0;
          acc.cleanliness += item.cleanliness || 0;
          acc.green += item.greenArea || 0;
          acc.count += 1;
          return acc;
        },
        { distance: 0, cleanliness: 0, green: 0, count: 0 },
      );
      setRatingsByLocation((prev) => ({
        ...prev,
        [locationId]: {
          averageDistance: summary.count ? summary.distance / summary.count : 0,
          averageCleanliness: summary.count
            ? summary.cleanliness / summary.count
            : 0,
          averageGreenArea: summary.count ? summary.green / summary.count : 0,
          count: summary.count,
        },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedLocationId) return;
    loadImages(selectedLocationId);
    loadRatings(selectedLocationId);
  }, [selectedLocationId]);

  const uploadImage = async (locationId, file) => {
    if (!file) {
      showConfirm({
        title: "Nema slike",
        message: "Izaberi sliku pre uploada.",
        confirmText: "OK",
        cancelText: null,
        onConfirm: closeConfirm,
      });
      return;
    }
    try {
      await uploadLocationImage(locationId, file);
      toast.success("Slika uspesno uploadovana.");
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Upload nije uspeo.");
    }
  };

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
            }
          }),
        );
        setLocations(withRatings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLocationsWithRatings();
  }, []);

  useEffect(() => {
    if (username) {
      const savedRatings =
        JSON.parse(localStorage.getItem(`rated_${username}`)) || [];
      setRatedLocations(savedRatings);
    } else {
      setRatedLocations([]);
    }
  }, [username]);

  // Polling za notifikacije
  useEffect(() => {
    if (!username) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 15000);

    return () => clearInterval(interval);
  }, [username]);

  // Polling za zahteve za prijateljstvo
  useEffect(() => {
    if (!username) {
      setFriendRequestCount(0);
      return;
    }

    loadFriendRequestCount();

    const interval = setInterval(() => {
      loadFriendRequestCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [username]);

  const handleLocationRated = (locId) => {
    toast.success("Uspesno ocenjeno!");
    loadLocationsWithRatings();
    loadRatings(locId);

    if (username) {
      const updatedRatings = [...ratedLocations, locId];
      setRatedLocations(updatedRatings);
      localStorage.setItem(`rated_${username}`, JSON.stringify(updatedRatings));
    }
  };

  const loadUnreadCount = async () => {
    if (!username) {
      setUnreadCount(0);
      return;
    }
    const notifications = await getNotifications();
    const unread = notifications.filter((n) => !n.readFlag).length;
    setUnreadCount(unread);
  };

  const loadFriendRequestCount = async () => {
    if (!username) {
      setFriendRequestCount(0);
      return;
    }
    try {
      const data = await getPendingFriendRequests();
      setFriendRequestCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setFriendRequestCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    toast.success("Uspesna odjava!");
    setUsername(null);
    setRole(null);
    setRatedLocations([]);
    setUnreadCount(0);
    setFriendRequestCount(0);
  };

  const clearRoute = () => {
    setRouteFrom(null);
    setRouteTo(null);
    setRouteCoords([]);
    setRouteSafe(true);
    setRouteWarning(null);
    setRouteError(null);
    setDirectionsMode(false);
    setTravelTimes(null);
  };

  const handleDirectionsClick = (loc) => {
    if (!directionsMode) {
      setRouteFrom(loc);
      setRouteTo(null);
      setRouteCoords([]);
      setRouteWarning(null);
      setRouteError(null);
      setTravelTimes(null);
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
    setTravelTimes(null);
    try {
      const from = { lat: routeFrom.lat, lng: routeFrom.lng };
      const to = { lat: loc.lat, lng: loc.lng };

      if (routeMode === "shortest") {
        const { route, travelTimes } = await findShortestRoute(from, to);
        setRouteCoords(route);
        setRouteSafe(null);
        setRouteWarning(null);
        setTravelTimes(travelTimes);
      } else {
        const { route, safe, warning, travelTimes } = await findSafeRoute(
          from,
          to,
          locations,
        );
        if (!route) {
          setRouteError(warning);
          setRouteCoords([]);
          setTravelTimes(null);
        } else {
          setRouteCoords(route);
          setRouteSafe(safe);
          setRouteWarning(warning);
          setTravelTimes(travelTimes);
        }
      }
    } catch (e) {
      setRouteError("Greska pri racunanju rute. Pokusaj ponovo.");
      setTravelTimes(null);
    } finally {
      setRouteLoading(false);
    }
  };

  const getMarkerIcon = (loc) => {
    if (routeFrom?.id === loc.id) return iconA;
    if (routeTo?.id === loc.id) return iconB;
    return getIconForRating(loc.averageRating);
  };

  const badLocations = locations.filter(
    (l) => l.averageRating > 0 && l.averageRating <= 3,
  );

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDeleteLocation = (id) => {
    showConfirm({
      title: "Obrisi lokaciju",
      message:
        "Da li si siguran da zelis obrisati ovu lokaciju? Ova akcija se ne moze ponistiti.",
      confirmText: "Obrisi",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await fetch(`https://zelena-mapa-ns.onrender.com/api/${id}`, {
            method: "DELETE",
          });
          loadLocationsWithRatings();
          toast.success("Lokacija obrisana!");
        } catch (err) {
          console.error(err);
          toast.error("Greska pri brisanju!");
        }
      },
    });
  };

  return (
    <>
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 50 }}
        >
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="app">
          <header className="header-b">
            <div className="header-b-main">
              <span className="header-b-leaf">🌿</span>

              <div className="header-b-titles">
                <p className="header-b-title">Zelena mapa Novog Sada</p>
                <p className="header-b-desc">
                  Interaktivna mapa ekoloskih i zdravih lokacija u Novom Sadu
                </p>
              </div>

              <div className="header-b-actions">
                {username ? (
                  <>
                    <button
                      className="hb-icon-btn"
                      aria-label="Dodaj lokaciju"
                      title="Dodaj lokaciju"
                      onClick={() => {
                        setIsPickingLocation(true);
                        setSelectedPosition(null);
                      }}
                    >
                      <i className="ti ti-plus" aria-hidden="true"></i>
                    </button>

                    <button
                      className="hb-icon-btn"
                      aria-label="Korisnici"
                      title="Korisnici"
                      onClick={() => setShowUsersPanel(true)}
                    >
                      <i className="ti ti-users" aria-hidden="true"></i>
                    </button>

                    <button
                      className="hb-icon-btn hb-notif-btn"
                      aria-label="Zahtevi za prijateljstvo"
                      title="Zahtevi za prijateljstvo"
                      onClick={() => {
                        loadFriendRequestCount();
                        setShowFriendRequests(true);
                      }}
                    >
                      <i className="ti ti-user-plus" aria-hidden="true"></i>
                      {friendRequestCount > 0 && (
                        <span className="hb-notif-dot">
                          {friendRequestCount > 9 ? "9+" : friendRequestCount}
                        </span>
                      )}
                    </button>

                    <button
                      className="hb-icon-btn hb-notif-btn"
                      aria-label="Obavestenja"
                      title="Obavestenja"
                      onClick={() => {
                        loadUnreadCount();
                        setShowNotificationsPanel(true);
                      }}
                    >
                      <i className="ti ti-bell" aria-hidden="true"></i>
                      {unreadCount > 0 && (
                        <span className="hb-notif-dot">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {role === "ADMIN" && (
                      <button
                        className="hb-icon-btn"
                        aria-label="Admin panel"
                        title="Admin panel"
                        onClick={() => setShowAdmin(!showAdmin)}
                      >
                        <i className="ti ti-shield" aria-hidden="true"></i>
                      </button>
                    )}

                    <div className="hb-divider" />
                    <span className="hb-username">{username}</span>

                    <button className="hb-logout-btn" onClick={handleLogout}>
                      <i className="ti ti-logout" aria-hidden="true"></i> Odjava
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="hb-login-btn"
                      onClick={() => setShowLogin(true)}
                    >
                      Prijava
                    </button>
                    <button
                      className="hb-reg-btn"
                      onClick={() => setShowRegister(true)}
                    >
                      Registracija
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="header-b-search">
              <div className="header-b-search-wrap">
                <i className="ti ti-search" aria-hidden="true"></i>
                <input
                  type="text"
                  placeholder="Pretrazi lokacije..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isPickingLocation && (
              <div className="picking-hint">
                📍 Klikni na mapu da izaberes lokaciju
                <button
                  className="btn-cancel picking-cancel-btn"
                  onClick={() => {
                    setIsPickingLocation(false);
                    setSelectedPosition(null);
                  }}
                >
                  Otkazi
                </button>
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
                routeError
                  ? "error"
                  : routeWarning
                    ? "warning"
                    : routeCoords.length > 0
                      ? "success"
                      : ""
              }`}
            >
              {directionsMode === "selectB" && !routeLoading && (
                <span>
                  📍 Polazna: <strong>{routeFrom?.name}</strong> — Klikni na
                  odredisnu lokaciju (B)
                </span>
              )}
              {routeLoading && (
                <span>
                  🔄{" "}
                  {routeMode === "safe"
                    ? "Trazim sigurnu rutu..."
                    : "Racunam najkracu rutu..."}
                </span>
              )}
              {!routeLoading &&
                routeCoords.length > 0 &&
                !routeWarning &&
                !routeError && (
                  <span>
                    {routeMode === "safe"
                      ? "🛡️ Sigurna ruta"
                      : "⚡ Najkraca ruta"}
                    : <strong>{routeFrom?.name}</strong> →{" "}
                    <strong>{routeTo?.name}</strong>
                  </span>
                )}
              {routeWarning && <span>⚠️ {routeWarning}</span>}
              {routeError && <span>❌ {routeError}</span>}
              <button className="route-clear-btn" onClick={clearRoute}>
                ✕ Obrisi rutu
              </button>
            </div>
          )}

          {travelTimes && (
            <div
              style={{
                display: "flex",
                background: "var(--color-background-primary, #fff)",
                border: "0.5px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                overflow: "hidden",
                margin: "0 12px 8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {[
                { icon: "🚶", label: "Peske", key: "foot" },
                { icon: "🚲", label: "Bicikl", key: "bike" },
                { icon: "🚗", label: "Auto", key: "car" },
              ].map(({ icon, label, key }, i, arr) => (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRight:
                      i < arr.length - 1
                        ? "0.5px solid rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#888",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>
                      {formatDuration(travelTimes[key].duration)}
                    </span>
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {formatDistance(travelTimes[key].distance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <MapContainer
            center={[45.2671, 19.8335]}
            zoom={13}
            scrollWheelZoom={true}
            className={`map ${isPickingLocation ? "picking-mode" : ""} ${directionsMode === "selectB" ? "selecting-b-mode" : ""}`}
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

            {routeMode === "safe" &&
              routeCoords.length > 0 &&
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

            <RouteLayer routeCoords={routeCoords} routeMode={routeMode} />

            {filteredLocations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={getMarkerIcon(loc)}
                eventHandlers={{
                  click: () => {
                    console.log("MARKER CLICKED:", loc.id);

                    if (directionsMode === "selectB") {
                      handleSelectB(loc);
                      return;
                    }

                    setSelectedLocationId(loc.id);
                  },
                }}
              >
                {directionsMode !== "selectB" && (
                  <Popup>
                    <div className="popup-card">
                      <ImageSlider
                        key={loc.id}
                        images={imagesByLocation[String(loc.id)] || []}
                        loading={loadingImages[String(loc.id)]}
                      />

                      <h3>{loc.name}</h3>
                      <p>{loc.description}</p>

                      <div className="popup-rating-block">
                        <p className="popup-average">
                          Prosecna ocena:{" "}
                          {loc.averageRating
                            ? loc.averageRating.toFixed(1)
                            : "0"}
                        </p>
                        {ratingsByLocation[loc.id] && (
                          <>
                            <div className="popup-rating-summary">
                              <div className="popup-rating-summary-item">
                                <span>Udaljenost</span>
                                <strong>
                                  {ratingsByLocation[
                                    loc.id
                                  ].averageDistance.toFixed(1)}
                                </strong>
                              </div>
                              <div className="popup-rating-summary-item">
                                <span>Cistoca</span>
                                <strong>
                                  {ratingsByLocation[
                                    loc.id
                                  ].averageCleanliness.toFixed(1)}
                                </strong>
                              </div>
                              <div className="popup-rating-summary-item">
                                <span>Zelena povrsina</span>
                                <strong>
                                  {ratingsByLocation[
                                    loc.id
                                  ].averageGreenArea.toFixed(1)}
                                </strong>
                              </div>
                            </div>
                            {ratingsByLocation[loc.id].count > 0 && (
                              <p className="popup-rating-count">
                                Broj ocena: {ratingsByLocation[loc.id].count}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="popup-image-upload">
                        <label className="popup-file-label">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            style={{ display: "none" }}
                          />
                          <span className="popup-file-btn">
                            📎{" "}
                            {selectedFile ? selectedFile.name : "Izaberi sliku"}
                          </span>
                        </label>
                        {selectedFile && (
                          <button
                            className="btn-primary popup-upload-btn"
                            onClick={() => uploadImage(loc.id, selectedFile)}
                          >
                            Dodaj sliku
                          </button>
                        )}
                      </div>

                      {username ? (
                        ratedLocations.includes(loc.id) ? (
                          <p className="popup-note rated-note">
                            ✓ Vec ste ostavili recenziju.
                          </p>
                        ) : (
                          <RatingWidget
                            locationId={loc.id}
                            username={username}
                            onRated={() => handleLocationRated(loc.id)}
                          />
                        )
                      ) : (
                        <p className="popup-note">
                          (Morate biti prijavljeni da biste ocenili lokaciju)
                        </p>
                      )}

                      <hr style={{ margin: "8px 0" }} />

                      <div className="popup-actions">
                        <div className="route-mode-selector">
                          <div className="route-mode-toggle">
                            <button
                              className={`toggle-track ${routeMode === "safe" ? "on" : ""}`}
                              onClick={() =>
                                setRouteMode(
                                  routeMode === "safe" ? "shortest" : "safe",
                                )
                              }
                              aria-label="Prebaci tip rute"
                            >
                              <span className="toggle-thumb" />
                            </button>
                            <span className="toggle-text">
                              {routeMode === "safe"
                                ? "🛡️ Sigurna ruta"
                                : "⚡ Najkraca ruta"}
                            </span>
                          </div>
                        </div>

                        <button
                          className="directions-btn"
                          onClick={() => handleDirectionsClick(loc)}
                        >
                          Directions
                        </button>
                        {routeFrom && routeFrom.id !== loc.id && (
                          <div className="popup-route-link">
                            ili{" "}
                            <span
                              className="directions-link"
                              onClick={() => handleSelectB(loc)}
                            >
                              postavi kao odrediste od "{routeFrom.name}"
                            </span>
                          </div>
                        )}
                        <button
                          className="recommend-btn"
                          onClick={() => setRecommendLocation_loc(loc)}
                        >
                          Preporuci prijatelju
                        </button>
                        {role === "ADMIN" && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteLocation(loc.id)}
                          >
                            🗑 Obrisi lokaciju
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                )}
              </Marker>
            ))}
          </MapContainer>

          {showUsersPanel && (
            <UserSearchPanel
              onClose={() => setShowUsersPanel(false)}
              onFriendAdded={() => {
                toast.success("Zahtev za prijateljstvo je poslat!");
              }}
            />
          )}

          {showNotificationsPanel && (
            <NotificationsPanel
              onClose={() => setShowNotificationsPanel(false)}
              onUnreadChange={(count) => setUnreadCount(count)}
            />
          )}

          {showFriendRequests && (
            <FriendRequestsPanel
              onClose={() => setShowFriendRequests(false)}
              onRequestResponded={(accepted) => {
                if (accepted)
                  toast.success("Prihvatio/la si zahtev za prijateljstvo!");
                else toast.info("Odbio/la si zahtev.");
                setFriendRequestCount((c) => Math.max(0, c - 1));
              }}
            />
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
                toast.error("Greska: nedostaje lokacija ili naziv.");
                return;
              }
              if (
                newLocation.visibility === "PRIVATE" &&
                !localStorage.getItem("token")
              ) {
                toast.error(
                  "Morate biti prijavljeni da biste kreirali privatnu lokaciju.",
                );
                return;
              }
              const locationToSend = {
                name: newLocation.name,
                description: newLocation.description,
                lat: selectedPosition.lat,
                lng: selectedPosition.lng,
                privateLocation: newLocation.visibility === "PRIVATE",
              };
              addLocation(locationToSend)
                .then((res) => {
                  if (!res.ok) throw new Error("Greska pri dodavanju lokacije");
                  return res.json();
                })
                .then(() => {
                  setIsOpen(false);
                  setSelectedPosition(null);
                  loadLocationsWithRatings();
                  toast.success(
                    "Lokacija je poslata i bice prikazana nakon odobrenja ili odmah ako je javna.",
                  );
                })
                .catch((err) => {
                  console.error(err);
                  toast.error(err.message || "Greska pri dodavanju lokacije.");
                });
            }}
          />

          <LoginModal
            open={showLogin}
            onClose={() => setShowLogin(false)}
            onLogin={(data) => {
              setUsername(data.username);
              setRole(data.role);
            }}
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

          {recommendLocation_loc && (
            <RecommendModal
              location={recommendLocation_loc}
              onClose={() => setRecommendLocation_loc(null)}
            />
          )}

          {showAdmin && (
            <AdminPanel
              onUpdate={loadLocationsWithRatings}
              onClose={() => setShowAdmin(false)}
            />
          )}

          <ConfirmModal
            open={confirmModal.open}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
            variant={confirmModal.variant}
            onConfirm={confirmModal.onConfirm}
            onCancel={closeConfirm}
          />

          <ToastContainer />
        </div>
      )}
    </>
  );
}

export default App;
