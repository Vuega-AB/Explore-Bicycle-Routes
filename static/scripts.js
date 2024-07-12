function initMap() {
    new google.maps.Map(document.getElementById("map"), {
      center: { lat: 55.53, lng: 9.4 },
      zoom: 10,
    });
  }
  
  var options = { types: ['(cities)'] };
  
  window.onload = function () {
    var input1 = document.getElementById("destination");
    new google.maps.places.Autocomplete(input1, options);
  };


  async function drawLines(locations, destinationInput, maxDistance) {
    const directionsService = new google.maps.DirectionsService();
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 55.53, lng: 9.4 },
        zoom: 10,
    });
    const bounds = new google.maps.LatLngBounds();
    
    // Add marker for the destination
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destinationInput }, function(results, status) {
        if (status === 'OK') {
            const destinationLocation = results[0].geometry.location;
            const destinationMarker = new google.maps.Marker({
                position: destinationLocation,
                map: map,
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Red marker icon
                }
            });
        } else {
            console.error('Geocode was not successful for the following reason:', status);
        }
    });

    // Add markers for origin addresses
    for (const location of locations) {
        geocoder.geocode({ address: location }, function(results, status) {
            if (status === 'OK') {
                const originLocation = results[0].geometry.location;
                const originMarker = new google.maps.Marker({
                    position: originLocation,
                    map: map,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // Blue marker icon
                    }
                });
            } else {
                console.error('Geocode was not successful for the following reason:', status);
            }
        });

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
                result.routes[0].overview_path.forEach(point => {
                    bounds.extend(point);
                });
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

    // Show loading overlay
    document.getElementById('loading-overlay').style.display = 'block';
    console.log("stuck?");
    const reader = new FileReader();
    console.log("here?");
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
                modifiedCsv.push(line + "," + flag); // Add flag value to each row
            }
        }

        // Hide loading overlay after processing
        document.getElementById('loading-overlay').style.display = 'none';

        drawLines(locations, destinationInput, maxDistance);

        // Display modified CSV
        document.getElementById('response').innerText = modifiedCsv.join('\n');

        // Enable the download button
        const downloadButton = document.getElementById('downloadButton');
        downloadButton.disabled = false;
        console.log("modifiedCsv:",modifiedCsv);
    };

    reader.readAsText(file, 'ISO-8859-1'); // Specify the character encoding
}

//postgres://explore_bicycle_routes_user:lEDM6m3U6MiQX7nJGsAvzUwyHEWtWbwT@dpg-cngs8micn0vc73fbcabg-a.oregon-postgres.render.com/explore_bicycle_routes

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

    return new Promise((resolve) => {
        service.getDistanceMatrix(request, function (response, status) {
            console.log("response: ", response);

            if (status === 'OK' && response.rows.length > 0 && response.rows[0].elements.length > 0) {
                const element = response.rows[0].elements[0];

                if (element.status === 'OK' && element.distance) {

                    const distance = element.distance.value;
                    console.log("location: " + location);
                    console.log("Distance: " + distance);
                    console.log("maxDistance: " + maxDistance);
                    console.log(distance + ">" + maxDistance);
                    const flag = distance > maxDistance ? 'YES' : 'NO';
                    console.log("flag:", flag);
                    resolve(flag);
                } else {
                    console.warn('No path available for:', location);
                    resolve('NO PATH');
                }
            } else {
                console.error('Error fetching distance matrix:', status);
                resolve('NO PATH'); // Set flag to "NO PATH" on error
            }
        });
    });
}

function downloadCSV() {
    const content = document.getElementById('response').innerText;
    const filename = 'modified_data.csv';

    const csvData = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const csvURL = window.URL.createObjectURL(csvData);
    const link = document.createElement('a');
    link.href = csvURL;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



  