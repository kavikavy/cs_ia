document.addEventListener('DOMContentLoaded', async function() {
    const appId = '9dea8692';
    const appKey = '76815bedb29b8e488099b0ad54221356';

    document.getElementById('recipe-search-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form from submitting traditionally
        searchRecipes();
    });
});

async function searchRecipes() {
    const appId = '9dea8692';
    const appKey = '76815bedb29b8e488099b0ad54221356';
    const query = document.getElementById('query').value;
    const diet = document.getElementById('diet').value;
    const mealType = document.getElementById('meal-type').value;

    let apiUrl = `https://api.edamam.com/search?q=${query}&app_id=${appId}&app_key=${appKey}`;

    if (diet) apiUrl += `&diet=${diet}`;
    if (mealType) apiUrl += `&mealType=${mealType}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.hits);
        })
        .catch(error => {
            console.error('Error fetching recipes:', error);
        });
}

function displayRecipes(recipes) {
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = ''; 

    recipes.forEach(hit => {
        const recipe = hit.recipe;
        const recipeItem = document.createElement('li');
        recipeItem.innerHTML = `
            <h3>${recipe.label}</h3>
            <p>Calories: ${Math.round(recipe.calories)}</p>
            <img src="${recipe.image}" alt="${recipe.label}">
            <a href="${recipe.url}" target="_blank">View Recipe</a>
        `;
        recipeList.appendChild(recipeItem);
    });
}


