document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Fetch user consumption data from the backend
        const response = await fetch(`/api/get-consumption`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch consumption data');
        }

        const userConsumptionData = await response.json();

        // Check if the data is empty or undefined
        if (!userConsumptionData || userConsumptionData.length === 0) {
            alert('No consumption data available.');
            return;
        }

        // Calculate total CO2
        const totalCO2 = calculateTotalCO2(userConsumptionData);
        document.getElementById("total-co2").textContent = `${totalCO2.toFixed(2)} kg`;

        // Initialize CO2 data object
        const co2Data = {
            transport: 0,
            meat: 0,
            electricity: 0,
            water: 0
        };

        document.getElementById("total-co2").textContent = `${totalCO2.toFixed(2)} kg`;

        // Update bar graph dynamically based on CO2 values
        function updateBarGraph(component, value) {
            const bar = document.getElementById(`bar-${component}`);
            const barValue = document.getElementById(`value-${component}`);
            const maxBarWidth = 300; // Set a maximum width for the bars in pixels
            const percentage = (value / totalCO2) * 100; // Calculate percentage of total CO2
            const barWidth = Math.round(Math.min(maxBarWidth, (maxBarWidth * (percentage / 100)))); // Limit the bar width
            console.log(`Updating bar for ${component}: width = ${barWidth}px`);
            bar.style.width = `${barWidth}px`;  // Set bar width
            barValue.textContent = `${value.toFixed(2)} kg`;  // Display the value
            return { component, barWidth, value };
        }

        const barElements = [];

        // Populate co2Data based on userConsumptionData
        userConsumptionData.forEach(item => {
            const type = item.type.toLowerCase();
            const widthData = updateBarGraph(type, parseFloat(item.co2));
            barElements.push(widthData);
        });

        // Sort bars based on width (barWidth)
        barElements.sort((a, b) => b.barWidth - a.barWidth);

        // Re-render bars in DOM
        const barContainer = document.querySelector(".bar-graph");
        barContainer.innerHTML = "";  // Clear the existing bars  

        // Rebuild the bar container with sorted bars
        barElements.forEach(({ component, barWidth, value }) => {
            if (value !== undefined && value !== null) {
                // Create label for the component
                const barLabel = document.createElement('div');
                barLabel.classList.add('bar-label');
                barLabel.textContent = component.charAt(0).toUpperCase() + component.slice(1);

                // Create bar
                const bar = document.createElement('div');
                bar.classList.add('bar');
                bar.style.width = `${barWidth}px`; // Set width dynamically
                bar.setAttribute('id', `bar-${component}`);

                // Create value display
                const barValue = document.createElement('div');
                barValue.classList.add('bar-value');
                barValue.textContent = `${value.toFixed(2)} kg`; // Display the CO2 value

                // Append all elements to the bar container
                barContainer.appendChild(barLabel);
                barContainer.appendChild(bar);
                barContainer.appendChild(barValue);
            } else {
                console.error(`Invalid value for ${component}:`, value);
            }

            if (value === 0) {
                // Create label for the component
                const barLabel = document.createElement('div');
                barLabel.classList.add('bar-label');
                barLabel.textContent = component.charAt(0).toUpperCase() + component.slice(1);

                // Create bar
                const bar = document.createElement('div');
                bar.classList.add('bar');
                bar.style.width = `${barWidth}px`; // Set width dynamically
                bar.setAttribute('id', `bar-${component}`);

                // Create value display
                const barValue = document.createElement('div');
                barValue.classList.add('bar-value');
                barValue.textContent = `${value} kg`; // Display the CO2 value

                // Append all elements to the bar container
                barContainer.appendChild(barLabel);
                barContainer.appendChild(bar);
                barContainer.appendChild(barValue);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Error fetching user data. Please try again later.');
    }
});


function calculateTotalCO2(consumptionData) {
    // Initialize the total CO2 to 0
    let totalCO2 = 0;

    // Iterate through each item in the consumptionData array
    consumptionData.forEach(item => {
        // Ensure the CO2 value is valid and add it to totalCO2
        const co2Value = parseFloat(item.co2);

        // Check if the value is a valid number
        if (!isNaN(co2Value)) {
            totalCO2 += co2Value;
        } else {
            console.warn(`Invalid CO2 value for category ${item.category_name}: ${item.co2}`);
        }
    });

    // Return the total CO2
    return totalCO2;
}
