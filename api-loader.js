// Retrieve the API key from localStorage
const apiKey = localStorage.getItem('apiKey');

if (apiKey) {
  // Dynamically load the Google Maps API script with the stored API key
  const scriptTag = document.createElement('script');
  scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
  document.head.appendChild(scriptTag);
} else {
  console.error('API key is missing. Please enter your API key.');
}
