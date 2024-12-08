document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Fetch user consumption data from the backend
        const response = await fetch(`/api/get-consumption/`);
        if (!response.ok) throw new Error('Failed to fetch consumption data');

        const userConsumptionData = await response.json();
        displayConsumption(userConsumptionData);
    } catch (error) {
        console.error('Error fetching consumption data:', error);
        alert('Error loading data. Please try again later.');
    }
});


function showSpecificFields() {
    const type = document.getElementById('consumption-type').value;
    const dynamicFields = document.getElementById('dynamic-fields');
    dynamicFields.innerHTML = ''; // Clear existing fields

    let html = `<div class="input-group">
                    <label for="consumption-amount">Amount of Consumption</label>
                    <input type="number" id="consumption-amount" min="1" required>
                </div>`;

    if (type === 'transport') {
        html += `<div class="input-group">
                    <label for="fuel-type">Fuel Type</label>
                    <select id="fuel-type" required>
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                    </select>
                </div>`;
    } else if (type === 'meat') {
        html += `<div class="input-group">
                    <label for="meat-type">Meat Type</label>
                    <select id="meat-type" required>
                        <option value="beef_herd">Beef: Herd</option>
                        <option value="lamb_mutton">Lamb & Mutton</option>
                        <option value="cheese">Cheese</option>
                        <option value="beef_dairy_herd">Beef: Dairy Herd</option>
                        <option value="prawns_farmed">Prawns</option>
                        <option value="pig_meat">Pig Meat</option>
                        <option value="poultry_meat">Poultry Meat</option>
                        <option value="fish_famed">Farmed Fish</option>
                        <option value="eggs">Eggs</option>
                        <option value="fish_wild">Wild Fist</option>
                        <option value="mutton">Mutton</option>
                    </select>
                </div>`;
    }

    dynamicFields.innerHTML = html;
}

function displayConsumption(data) {
    const tableBody = document.querySelector('#consumptionTable tbody');
    if (!tableBody) {
        console.error("Table body not found.");
        return;
    }
    tableBody.innerHTML = ''; // Clear the table

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.type}</td>
            <td>${item.consumption}</td>
            <td>${item.co2.toFixed(2)} kg</td>
        `;
        tableBody.appendChild(row);
    });

    updatePieChart(data);
}

function updatePieChart(data) {
    const ctx = document.getElementById('co2PieChart').getContext('2d');

    const co2Totals = data.reduce((totals, item) => {
        totals[item.type.toLowerCase()] = item.co2;
        return totals;
    }, {});

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Transport', 'Meat', 'Electricity', 'Water'],
            datasets: [{
                data: [co2Totals.transport || 0, co2Totals.meat || 0, co2Totals.electricity || 0, co2Totals.water || 0],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            }]
        },
        options: {}
    });
}