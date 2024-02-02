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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log("line: " + line);

            if (i === 0) {// Header row
                modifiedCsv.push(line + ',Flag'); // Add "Flag" to the header
            } else if (line) {
                const flag = await calculateDistance(line, destinationInput, maxDistance);
                modifiedCsv.push(line + ',"' + flag + '"'); // Add flag value to each row
            }
        }

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
                const distance = response.rows[0].elements[0].distance.value / 1000; // Convert meters to kilometers
                
                console.log("location: " + location);
                console.log("Distance: " + distance + " km");

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
  