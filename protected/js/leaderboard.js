async function filterLeaderboard(filter) {
    try {
        // Fetch leaderboard data based on the filter
        const response = await fetch(`/api/get-leaderboard?filter=${encodeURIComponent(filter)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }

        const leaderboardData = await response.json();

        // Get the table body element
        const tableBody = document.getElementById('leaderboard-table').querySelector('tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        // Populate the table with new data
        leaderboardData.forEach(rsrows => {
            const row = document.createElement('tr');
        
            row.innerHTML = `
              <td>${rsrows.rank}</td>
              <td>${rsrows.user_name}</td>
              <td>${rsrows.total_emissions.toFixed(2)}</td>
            `;
    
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading leaderboard. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    filterLeaderboard('all');
  });