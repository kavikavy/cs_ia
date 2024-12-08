document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Fetch categories from the server
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        const categories = await response.json();
        const consumptionTypeSelect = document.getElementById('category-type');

        // Populate the dropdown
        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.category_name; // Use category_name as the value
            option.textContent = category.category_name; // Display the name
            consumptionTypeSelect.appendChild(option);
        });

        // Add event listener for category change to populate subcategories
        consumptionTypeSelect.addEventListener('change', async function () {
            const selectedCategory = this.value;
            await populateSubcategories(selectedCategory);
        });
    } catch (error) {
        console.error('Error populating categories:', error);
    }
});

// Function to populate subcategories based on selected category
async function populateSubcategories(selectedCategory) {
    try {
        const response = await fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch subcategories');
        }

        const subcategories = await response.json();
        const dynamicFields = document.getElementById('dynamic-fields');

        // Remove existing subcategory dropdown and its label if they exist
        const existingSubcategoryDropdown = document.getElementById('subcategory-type');
        const existingSubcategoryLabel = document.querySelector('label[for="subcategory-type"]');
        if (existingSubcategoryDropdown) {
            existingSubcategoryDropdown.remove();
        }
        if (existingSubcategoryLabel) {
            existingSubcategoryLabel.remove();
        }

        // Remove existing unit input and its label if they exist
        const existingUnitInput = document.getElementById('consumed-unit');
        const existingUnitLabel = document.querySelector('label[for="consumed-unit"]');

        if (existingUnitInput) {
            existingUnitInput.remove();
        }
        if (existingUnitLabel) {
            existingUnitLabel.remove();
        }

        // Add subcategory dropdown
        if (subcategories.length > 0) {
            const subcategoryDropdown = document.createElement('select');
            subcategoryDropdown.id = 'subcategory-type';
            subcategoryDropdown.name = 'subcategory';
            subcategoryDropdown.required = true;

            subcategories.forEach((subcategory) => {
                const option = document.createElement('option');
                option.value = subcategory.subcategory_name;
                option.textContent = subcategory.subcategory_name;
                option.dataset.unit = subcategory.measurement_unit;
                subcategoryDropdown.appendChild(option);
            });

            const label = document.createElement('label');
            label.setAttribute('for', 'subcategory-type');
            label.textContent = 'Subcategory';

            dynamicFields.appendChild(label);
            dynamicFields.appendChild(subcategoryDropdown);

            const unitInput = document.createElement('input');
            unitInput.type = 'text';
            unitInput.id = 'consumed-unit';
            unitInput.name = 'consumed-unit';
            unitInput.required = true;

            const unitLabel = document.createElement('label');
            unitLabel.setAttribute('for', 'consumed-unit');
            unitLabel.textContent = `Consumed Units ( ${subcategories[0].measurement_unit}) `;

            dynamicFields.appendChild(unitLabel);
            dynamicFields.appendChild(unitInput);

            // Update measurement unit label based on subcategory selection
            subcategoryDropdown.addEventListener('change', (event) => {
                const selectedOption = event.target.options[event.target.selectedIndex];
                const unit = selectedOption.dataset.unit;
                unitLabel.textContent = `Measurement Unit: ${unit}`;
            });

        }
    } catch (error) {
        console.error('Error populating subcategories:', error);
    }
}

async function showSpecificFields() {
    const type = document.getElementById('consumption-type').value;
    const dynamicFields = document.getElementById('dynamic-fields');

    if (!type) {
        return; // Exit if no category is selected
    }

    try {
        // Fetch category details for the selected type
        const response = await fetch(`/api/get-category-unit?category=${encodeURIComponent(type)}`);
        if (!response.ok) throw new Error('Failed to fetch category details');

        const categoryDetails = await response.json();
        const measurementUnit = categoryDetails.measurement_unit;

        // Check if the subcategory field already exists
        const subcategoryFieldExists = document.getElementById('subcategory-type');
        if (!subcategoryFieldExists) {
            await populateSubcategories(type); // Ensure the subcategory dropdown is added first
        }

        // Create input field for the amount with the measurement unit displayed
        if (!document.getElementById('consumption-amount')) {
            const amountField = document.createElement('div');
            amountField.className = 'input-group';
            amountField.innerHTML = `
                <label for="consumption-amount">Enter Number of Units (${measurementUnit})</label>
                <input type="number" id="consumption-amount" min="1" name="consumption" required>
            `;
            dynamicFields.appendChild(amountField); // Append the amount field
        }
    } catch (error) {
        console.error('Error fetching category details:', error);
        alert('Failed to load additional input fields');
    }
}




document.getElementById('insertConsumptionForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form from refreshing the page

    const categoryName = document.getElementById('category-type').value;
    const subcategoryName = document.getElementById('subcategory-type').value;
    const consumedUnits = document.getElementById('consumed-unit').value;

    try {
        document.getElementById('responseMessage').textContent = 'Adding Consumption...';
        document.getElementById('responseMessage').style.color = 'blue';
        const response = await fetch('/api/add-consumption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName, subcategoryName, consumedUnits }),
        });

        const result = await response.json();

        if (response.ok) {
            // Show success message and redirect after a short delay
            document.getElementById('responseMessage').textContent = result.message;
            document.getElementById('responseMessage').style.color = 'green';

            // Redirect to the consumption page after 1 second
            setTimeout(() => {
                window.location.href = '/consumption.html';
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
