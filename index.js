function redirectToMainPage() {
    const apiKey = document.getElementById('apiKeyInput').value;
    if (apiKey.trim() !== '') {
      // Store the API key in localStorage
      localStorage.setItem('apiKey', apiKey);
      
      // Redirect to the index page
      window.location.href = 'app.html';
    } else {
      alert('Please enter a valid API key.');
    }
  }
  