document.getElementById('signinForm').addEventListener('submit', async (event) => {
  event.preventDefault();  // Prevent default form submission

  const username = document.getElementById('signin-username').value;
  const password = document.getElementById('signin-password').value;

  try {
      // Send the login request to the server
      const response = await fetch('/api/signin', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      });

      // Check if the response is okay (status 200-299)
      if (!response.ok) {
          const errorData = await response.json();  // Assuming the API sends an error message in JSON
          throw new Error(errorData.message || 'Unknown error occurred');
      }

      // If the response is successful, handle the success
      const data = await response.json();
      //alert('Login successful!');
      // Optionally redirect the user after success
      window.location.href = '/home.html'; // or any page you want to redirect to
  } catch (error) {
      // Show the error message in an alert if something goes wrong
      alert(`Error: ${error.message}`);
  }
});