// index.js

const channelID = "2622080"; // Replace with your actual Channel ID
const readAPIKey = "RIEUXY3AUOHUBFVM"; // Replace with your actual Read API Key
const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`;

let startPosition = null;
let intervalID = null;

// Initialize Leaflet map
const map = L.map("map").setView([0, 0], 13); // Centered at lat=0, lon=0 with zoom level 13

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let startMarker, currentMarker;

document.getElementById("start-button").addEventListener("click", () => {
  // Clear previous logs
  document.getElementById("log").textContent = "";

  // Fetch the starting position
  fetchGPSData().then((data) => {
    if (data) {
      startPosition = data;
      document.getElementById(
        "start-position"
      ).textContent = `${data.latitude}, ${data.longitude}`;
      log(`Started at: ${data.latitude}, ${data.longitude}`);

      // Place the start marker on the map
      if (startMarker) map.removeLayer(startMarker);
      startMarker = L.marker([data.latitude, data.longitude])
        .addTo(map)
        .bindPopup("Start Position")
        .openPopup();
      map.setView([data.latitude, data.longitude], 13); // Center map on the start position
    }
  });

  // Start updating the position every 5 seconds
  if (intervalID) clearInterval(intervalID);
  intervalID = setInterval(updatePosition, 5000);
});

function fetchGPSData() {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.feeds.length > 0) {
        const feed = data.feeds[0];
        return {
          latitude: parseFloat(feed.field1),
          longitude: parseFloat(feed.field2),
        };
      }
      return null;
    });
}

function updatePosition() {
  fetchGPSData().then((currentPosition) => {
    if (!startPosition || !currentPosition) return;

    document.getElementById(
      "current-position"
    ).textContent = `${currentPosition.latitude}, ${currentPosition.longitude}`;
    const distance = calculateDistance(startPosition, currentPosition).toFixed(
      2
    );
    document.getElementById("distance").textContent = `${distance} meters`;
    log(
      `Moved to: ${currentPosition.latitude}, ${currentPosition.longitude} (Distance: ${distance} meters)`
    );

    // Place the current marker on the map
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([
      currentPosition.latitude,
      currentPosition.longitude,
    ])
      .addTo(map)
      .bindPopup("Current Position")
      .openPopup();
  });
}

function calculateDistance(pos1, pos2) {
  const R = 6371000; // Radius of the Earth in meters
  const lat1 = degreesToRadians(pos1.latitude);
  const lat2 = degreesToRadians(pos2.latitude);
  const deltaLat = degreesToRadians(pos2.latitude - pos1.latitude);
  const deltaLon = degreesToRadians(pos2.longitude - pos1.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function log(message) {
  const logElement = document.getElementById("log");
  logElement.textContent += `${message}\n`;
  logElement.scrollTop = logElement.scrollHeight;
}
