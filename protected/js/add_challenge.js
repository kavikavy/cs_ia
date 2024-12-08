document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Fetch categories from the server
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categories = await response.json();
    const challengeTypeSelect = document.getElementById('challenge-type');

    // Populate the dropdown
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.category_name; // Use category_name as the value
      option.textContent = category.category_name; // Display the name
      challengeTypeSelect.appendChild(option);
    });

  } catch (error) {
    console.error('Error populating categories:', error);
  }
});

async function showSpecificFields() {
  const type = document.getElementById('challenge-type').value;
  const dynamicFields = document.getElementById('dynamic-fields');
  dynamicFields.innerHTML = ''; // Clear previous dynamic fields

  if (!type) {
    return; // Exit if no category is selected
  }

  try {
    // Fetch category details for the selected type
    const response = await fetch(`/api/get-category-unit?category=${encodeURIComponent(type)}`);
    if (!response.ok) throw new Error('Failed to fetch category details');

    const categoryDetails = await response.json();
    const measurementUnit = categoryDetails.measurement_unit;

    // Create input field for the amount with the measurement unit displayed
    const html = `
            <div class="input-group">
                <label for="consumption-amount">Enter Number of Units (${measurementUnit})</label>
                <input type="number" id="consumption-amount" min="1" name = "targetUnits" required>
            </div>
        `;

    dynamicFields.innerHTML = html;
  } catch (error) {
    console.error('Error fetching category details:', error);
    alert('Failed to load additional input fields');
  }
}


document.getElementById('insertChallengeForm').addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent form from refreshing the page

  const challengeName = document.getElementById('challenge-name').value;
  const categoryName = document.getElementById('challenge-type').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const targetUnits = document.getElementById('consumption-amount').value;

  // Get today's date in the correct format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // Check if start date is today or later
  if (startDate < today) {
    document.getElementById('responseMessage').textContent = 'Start date must be today or later.';
    document.getElementById('responseMessage').style.color = 'red';
    return;
  }

  // Check if end date is greater than today
  if (endDate <= today) {
    document.getElementById('responseMessage').textContent = 'End date must be greater than today.';
    document.getElementById('responseMessage').style.color = 'red';
    return;
  }

  try {
    document.getElementById('responseMessage').textContent = 'Adding challenge...';
    document.getElementById('responseMessage').style.color = 'blue';
    const response = await fetch('/api/add-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeName, targetUnits, startDate, endDate, categoryName }),
    });

    const result = await response.json();

    if (response.ok) {
      // Show success message and redirect after a short delay
      document.getElementById('responseMessage').textContent = result.message;
      document.getElementById('responseMessage').style.color = 'green';

      // Redirect to the challenges page after 1 second
      setTimeout(() => {
        window.location.href = '/challenges.html';
      }, 1000);
    } else {
      // Show error message
      document.getElementById('responseMessage').textContent = result.message;
      document.getElementById('responseMessage').style.color = 'red';
    }
  } catch (error) {
    // Handle unexpected errors
    document.getElementById('responseMessage').textContent = 'An unexpected error occurred.';
    document.getElementById('responseMessage').style.color = 'red';
  }
});