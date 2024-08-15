// Map stations to their respective lines
const metroLines = {};
const metroStations = {};
// Function to calculate the shortest route and fare
function calculate() {
  // Get the source and destination stations from the dropdowns
  const sourceStation = document.getElementById('source').value;
  const destinationStation = document.getElementById('destination').value;

  // Check if source and destination are selected
  if (sourceStation === '' || destinationStation === '') {
    alert('Please select source and destination stations.');
    return;
  }

  // Dijkstra's algorithm implementation to find the shortest route and fare
  const stations = Object.keys(metroStations);
  const INF = Number.MAX_SAFE_INTEGER;

  // Create a distance matrix and initialize with Infinity
  const distances = {};
  stations.forEach((station) => (distances[station] = INF));
  distances[sourceStation] = 0;

  const visited = {};
  const path = {};

  while (true) {
    let currentStation = null;

    // Find the nearest station
    stations.forEach((station) => {
      if (
        !visited[station] &&
        (currentStation === null ||
          distances[station] < distances[currentStation])
      ) {
        currentStation = station;
      }
    });

    if (currentStation === null || distances[currentStation] === INF) {
      break;
    }

    visited[currentStation] = true;

    // Update distances to adjacent stations
    for (const neighbor in metroStations[currentStation]) {
      const distance =
        distances[currentStation] + metroStations[currentStation][neighbor];
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        path[neighbor] = currentStation;
      }
    }
  }

  // Build the route and calculate the fare
  const route = [];
  let current = destinationStation;
  let lastLine = metroLines[destinationStation];
  let interchangeStations = [];

  while (current !== sourceStation) {
    route.unshift(current);
    current = path[current];

    // Check for line change, but only allow direct changes
    const currentLine = metroLines[current];
    if (currentLine !== lastLine && currentLine !== 'Interchange') {
      interchangeStations.unshift(current);
      lastLine = currentLine;
    }
  }
  route.unshift(sourceStation);

  const fare = distances[destinationStation];

  // Display the results
  const routeElement = document.getElementById('route');
  routeElement.innerHTML = '';

  route.forEach((station) => {
    const span = document.createElement('span');
    if (interchangeStations.includes(station)) {
      span.classList.add('interchange-station');
      span.innerHTML = `${station} <span class="tooltip">Change train here from ${
        metroLines[path[station]]
      } to ${metroLines[station]}</span>`;
    } else {
      span.textContent = station;
    }
    routeElement.appendChild(span);
    routeElement.appendChild(document.createTextNode(' -> '));
  });

  // Remove the last arrow
  routeElement.lastChild.remove();

  document.getElementById('fare').textContent = fare + ' units'; // You can replace 'units' with your currency
}

// Fetch and parse the CSV file
fetch('Delhi_metro.csv')
  .then((response) => response.text())
  .then((data) => {
    Papa.parse(data, {
      header: true,
      complete: function (results) {
        console.log(results.data);
        populateStations(results.data);
      },
    });
  });

function populateStations(stations) {
  const sourceSelect = document.getElementById('source');
  const destinationSelect = document.getElementById('destination');

  const stationsSet = new Set();
  const connectionStations = new Set();

  stations.forEach((station) => {
    const stationName = String(station['Station Names']).trim();
    const lineName = String(station['Metro Line']).trim();

    if (stationName && lineName) {
      // Map stations to their respective lines
      metroLines[stationName] = lineName;

      // Check for connection points
      if (stationName.includes('Conn')) {
        const cleanName = stationName.split('[')[0].trim();
        connectionStations.add(cleanName);
      }

      // Add to stationsSet
      if (!stationsSet.has(stationName)) {
        stationsSet.add(stationName);

        // Create and append options
        const sourceOption = document.createElement('option');
        sourceOption.value = stationName;
        sourceOption.textContent = `${stationName} (${lineName})`;
        sourceSelect.appendChild(sourceOption);

        const destinationOption = document.createElement('option');
        destinationOption.value = stationName;
        destinationOption.textContent = `${stationName} (${lineName})`;
        destinationSelect.appendChild(destinationOption);
      }
    }
  });

  // Final log of the metroLines object
  console.log('Final Metro Lines Object:', metroLines);
  const metroStations = buildMetroStations(metroLines);
  // console.log("lines", metroLines);
  // console.log('hello', metroStations);
  // Add connection stations separately if needed
  connectionStations.forEach((name) => {
    if (!stationsSet.has(name)) {
      const connectionOption = document.createElement('option');
      connectionOption.value = name;
      connectionOption.textContent = `${name} (Connection)`;
      sourceSelect.appendChild(connectionOption);
      destinationSelect.appendChild(connectionOption);
    }
  });
  console.log('Connection Stations:', connectionStations);
}


// Function to build and sort the metro stations object
function buildMetroStations(metroLinesData) {
  console.log('Building station', metroLinesData);
  const lineStations = {};

  // Group stations by metro line
  Object.entries(metroLinesData).forEach(([station, line]) => {
    if (!lineStations[line]) {
      lineStations[line] = [];
    }

    lineStations[line].push(station);
  });

  // console.log('lineStations', lineStations);
  // Sort the stations for each line
  Object.keys(lineStations).forEach((line) => {
    lineStations[line].sort((a, b) => a.localeCompare(b)); // Sorting alphabetically
  });

  console.log('lineStations', lineStations);
  // Build the metroStations object

  Object.entries(lineStations).forEach(([line, stations]) => {
    for (let i = 0; i < stations.length - 1; i++) {
      const station1 = stations[i];
      const station2 = stations[i + 1];

      if (!metroStations[station1]) {
        metroStations[station1] = {};
      }
      if (!metroStations[station2]) {
        metroStations[station2] = {};
      }

      // Assuming a fare of 5 between consecutive stations
      metroStations[station1][station2] = 5;
      metroStations[station2][station1] = 5; // Bidirectional fare
    }
  });

  console.log('hsdfd', metroStations);

  // Handle inter-line connections
  const interLineConnections = {
    'Anand Vihar [Conn: Blue]': {
      'Anand Vihar [Conn: Pink]': 5,
    },
    'Azadpur [Conn: Pink]': {
      'Azadpur [Conn: Yellow]': 5,
    },
  };

  // Add inter-line connections to metroStations
  Object.entries(interLineConnections).forEach(([station1, connections]) => {
    Object.entries(connections).forEach(([station2, fare]) => {
      if (!metroStations[station1]) {
        metroStations[station1] = {};
      }
      if (!metroStations[station2]) {
        metroStations[station2] = {};
      }

      metroStations[station1][station2] = fare;
      metroStations[station2][station1] = fare; // Bidirectional fare
    });
  });

  return metroStations;
}


