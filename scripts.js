function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 55.53, lng: 9.4 },
      zoom: 10,
    });
  }
  
  var options = { types: ['(cities)'] };
  
  window.onload = function () {
    var input1 = document.getElementById("destination");
    var autocomplete1 = new google.maps.places.Autocomplete(input1, options);
  };

  async function drawLines(locations, destinationInput, maxDistance) {
    const directionsService = new google.maps.DirectionsService();
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 55.53, lng: 9.4 },
        zoom: 10,
    });

    const bounds = new google.maps.LatLngBounds();

    for (const location of locations) {
        const request = {
            origin: location,
            destination: destinationInput,
            travelMode: google.maps.TravelMode.BICYCLING,
        };

        directionsService.route(request, function (result, status) {
            if (status === 'OK') {
                const color = result.routes[0].legs[0].distance.value <= maxDistance ? 'blue' : 'red';
                const polyline = new google.maps.Polyline({
                    path: result.routes[0].overview_path,
                    geodesic: true,
                    strokeColor: color,
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                });
                polyline.setMap(map);

                // Loop through each point in the path to extend the bounds
                result.routes[0].overview_path.forEach(point => {
                    bounds.extend(point);
                });

                // Adjust the map to fit all polylines
                map.fitBounds(bounds);
            } else {
                console.error('Error fetching directions:', status);
            }
        });
    }
}
  
  async function processCSV() {
    const csvFileInput = document.getElementById('csvFile');
    const destinationInput = document.getElementById('destination').value;
    const maxDistance = parseFloat(document.getElementById('maxDistance').value);

    console.log("destinationInput: " + destinationInput);
    console.log("maxDistance: " + maxDistance);

    const file = csvFileInput.files[0];

    if (!file) {
        alert('Please choose a CSV file.');
        return;
    }

    if(destinationInput == ""){
        alert('Please enter your Destination.');
        return;
    }

    if(isNaN(maxDistance)){
        alert('Please enter your max Distance.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const csvContent = e.target.result;

        const lines = csvContent.split('\n');
        console.log("lines: " + lines);

        const modifiedCsv = [];

        const locations = [];

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            console.log("line: " + line);

            if (i === 0) {// Header row
                modifiedCsv.push(line + ',Flag'); // Add "Flag" to the header
            } else if (line) {
                locations.push(line);
                const flag = await calculateDistance(line, destinationInput, maxDistance);
                modifiedCsv.push(line + ',"' + flag + '"'); // Add flag value to each row
            }
        }
        drawLines(locations, destinationInput, maxDistance);

        // Display modified CSV
        document.getElementById('response').innerText = modifiedCsv.join('\n');

        // Enable the download button
        const downloadButton = document.getElementById('downloadButton');
        downloadButton.disabled = false;
    };

    reader.readAsText(file);
}

async function calculateDistance(location, destinationInput, maxDistance) {
    const service = new google.maps.DistanceMatrixService();
    const origins = [location];
    const destinations = [destinationInput];

    const request = {
        origins: origins,
        destinations: destinations,
        travelMode: google.maps.TravelMode.BICYCLING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
    };

    return new Promise((resolve, reject) => {
        service.getDistanceMatrix(request, function (response, status) {
            if (status === 'OK' && response.rows.length > 0 && response.rows[0].elements.length > 0) {
                const distance = response.rows[0].elements[0].distance.value;

                console.log("location: " + location);
                console.log("Distance: " + distance + " m");
                console.log("maxDistance: "+maxDistance);

                const flag = distance > maxDistance ? 'YES' : 'NO';
                console.log("flag: " + flag);
                resolve(flag); // Resolve the promise with the flag value
            } else {
                console.error('Error fetching distance matrix:', status);
                reject(); // Reject the promise if there's an error
            }
        });
    });
}

    function downloadCSV() {
        const content = document.getElementById('response').innerText;
        const filename = 'modified_data.csv';

        const blob = new Blob([content], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
  