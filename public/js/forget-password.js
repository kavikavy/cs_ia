document.getElementById('forgotPasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById('email').value;

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const message = await response.text();
      
      alert(message);
    } catch (error) {
      document.getElementById('responseMessage').textContent = 'Error: Could not process request.';
    }
});