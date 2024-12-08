document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#challenges-table tbody');
  
    try {
      const response = await fetch('/api/get-challenges', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.ok) {
        const challenges = await response.json();
  
        // Clear existing rows if necessary
        tableBody.innerHTML = '';
  
        // Add rows for each challenge
        challenges.forEach(challenge => {
          const row = document.createElement('tr');
          
          row.innerHTML = `
            <td>${challenge.challenge_name}</td>
            <td>${challenge.category_name}</td>
            <td>${challenge.target_units}</td>
            <td>${challenge.consumed_units}</td>
            <td>${new Date(challenge.start_date).toLocaleDateString()}</td>
            <td>${new Date(challenge.end_date).toLocaleDateString()}</td>
          `;
  
          tableBody.appendChild(row);
        });
      } else {
        console.error('Failed to fetch challenges:', await response.text());
        alert('Error loading challenges.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching challenges.');
    }
  });
  