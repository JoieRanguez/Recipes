// Recipe Management with localStorage
let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
let currentRecipeId = null;
let editingRecipeId = null;

// DOM elements
const recipesGrid = document.getElementById('recipesGrid');
const searchInput = document.getElementById('searchInput');
const timeFilter = document.getElementById('timeFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const categoryPills = document.querySelectorAll('.category-pill');
const modal = document.getElementById('recipeModal');
const closeModalBtn = document.getElementById('closeModal');
const noResults = document.getElementById('noResults');
const emptyState = document.getElementById('emptyState');

// Form elements
const recipeFormModal = document.getElementById('recipeFormModal');
const addRecipeBtn = document.getElementById('addRecipeBtn');
const closeFormModal = document.getElementById('closeFormModal');
const recipeForm = document.getElementById('recipeForm');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const addIngredientBtn = document.getElementById('addIngredientBtn');
const addStepBtn = document.getElementById('addStepBtn');
const ingredientsList = document.getElementById('ingredientsList');
const stepsList = document.getElementById('stepsList');
const editRecipeBtn = document.getElementById('editRecipeBtn');
const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');

// State
let currentCategory = 'all';
let currentFilters = {
    search: '',
    time: '',
    difficulty: ''
};

// Initialize
displayRecipes(recipes);
updateEmptyState();

// Event Listeners - Search and Filters
searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    filterRecipes();
});

timeFilter.addEventListener('change', (e) => {
    currentFilters.time = e.target.value;
    filterRecipes();
});

difficultyFilter.addEventListener('change', (e) => {
    currentFilters.difficulty = e.target.value;
    filterRecipes();
});

categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.category;
        filterRecipes();
    });
});

// Event Listeners - Modals
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

addRecipeBtn.addEventListener('click', () => {
    openRecipeForm();
});

closeFormModal.addEventListener('click', () => {
    closeRecipeFormModal();
});

cancelFormBtn.addEventListener('click', () => {
    closeRecipeFormModal();
});

recipeFormModal.addEventListener('click', (e) => {
    if (e.target === recipeFormModal) {
        closeRecipeFormModal();
    }
});

// Event Listeners - Form
addIngredientBtn.addEventListener('click', () => {
    addIngredientField();
});

addStepBtn.addEventListener('click', () => {
    addStepField();
});

recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveRecipe();
});

editRecipeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    openRecipeForm(currentRecipeId);
});

deleteRecipeBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this recipe?')) {
        deleteRecipe(currentRecipeId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Functions - Display
function displayRecipes(recipesToShow) {
    if (recipesToShow.length === 0) {
        recipesGrid.style.display = 'none';
        if (recipes.length === 0) {
            noResults.style.display = 'none';
        } else {
            noResults.style.display = 'block';
        }
        return;
    }

    recipesGrid.style.display = 'grid';
    noResults.style.display = 'none';

    recipesGrid.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card ${recipe.category}" onclick="openRecipe(${recipe.id})">
            <div class="recipe-image">${recipe.emoji || '🍽️'}</div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span class="meta-item">⏱️ ${recipe.totalTime}</span>
                    <span class="meta-item">🍽️ ${recipe.servings} servings</span>
                    <span class="meta-item">📊 ${recipe.difficulty}</span>
                </div>
                <div class="recipe-tags">
                    <span class="tag ${recipe.category}">${recipe.category}</span>
                    ${recipe.dietary.map(diet => `<span class="tag ${diet}">${diet}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function updateEmptyState() {
    if (recipes.length === 0) {
        emptyState.classList.add('show');
        recipesGrid.style.display = 'none';
        noResults.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
    }
}

function filterRecipes() {
    let filtered = recipes;

    // Category filter
    if (currentCategory !== 'all') {
        filtered = filtered.filter(recipe => recipe.category === currentCategory);
    }

    // Search filter
    if (currentFilters.search) {
        filtered = filtered.filter(recipe => 
            recipe.title.toLowerCase().includes(currentFilters.search) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(currentFilters.search))
        );
    }

    // Time filter
    if (currentFilters.time) {
        filtered = filtered.filter(recipe => {
            const totalMinutes = parseInt(recipe.totalTime);
            if (currentFilters.time === 'quick') return totalMinutes < 30;
            if (currentFilters.time === 'medium') return totalMinutes >= 30 && totalMinutes <= 60;
            if (currentFilters.time === 'long') return totalMinutes > 60;
            return true;
        });
    }

    // Difficulty filter
    if (currentFilters.difficulty) {
        filtered = filtered.filter(recipe => recipe.difficulty === currentFilters.difficulty);
    }

    displayRecipes(filtered);
}

function openRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    currentRecipeId = id;

    const modalHeader = document.getElementById('modalHeader');
    const modalBody = document.getElementById('modalBody');

    modalHeader.innerHTML = `
        <button class="close-modal" id="closeModal">×</button>
        ${recipe.emoji || '🍽️'}
        <button class="jump-to-recipe" onclick="document.getElementById('recipeContent').scrollIntoView({behavior: 'smooth'})">
            Jump to Recipe ↓
        </button>
    `;

    modalBody.innerHTML = `
        <h2 class="modal-title">${recipe.title}</h2>
        <p class="modal-description">${recipe.description}</p>
        
        <div class="time-info">
            <div class="time-item">
                <div class="time-label">Prep Time</div>
                <div class="time-value">${recipe.prepTime}</div>
            </div>
            <div class="time-item">
                <div class="time-label">Cook Time</div>
                <div class="time-value">${recipe.cookTime}</div>
            </div>
            <div class="time-item">
                <div class="time-label">Total Time</div>
                <div class="time-value">${recipe.totalTime}</div>
            </div>
            <div class="time-item">
                <div class="time-label">Servings</div>
                <div class="time-value">${recipe.servings}</div>
            </div>
        </div>

        <div id="recipeContent">
            <h3 class="section-title">Ingredients</h3>
            <ul class="ingredients-list">
                ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>

            <h3 class="section-title">Instructions</h3>
            <ol class="steps-list">
                ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>

            ${recipe.tips ? `
                <div class="tips-box">
                    <h3>💡 Tips & Tricks</h3>
                    <p>${recipe.tips}</p>
                </div>
            ` : ''}

            ${recipe.substitutions ? `
                <div class="tips-box">
                    <h3>🔄 Substitutions & Variations</h3>
                    <p>${recipe.substitutions}</p>
                </div>
            ` : ''}
        </div>
    `;

    // Re-attach close button listener
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Functions - Recipe Form
function openRecipeForm(recipeId = null) {
    editingRecipeId = recipeId;
    const formTitle = document.getElementById('formModalTitle');
    
    if (recipeId) {
        formTitle.textContent = 'Edit Recipe';
        loadRecipeIntoForm(recipeId);
    } else {
        formTitle.textContent = 'Add New Recipe';
        resetForm();
        addIngredientField();
        addStepField();
    }
    
    recipeFormModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRecipeFormModal() {
    recipeFormModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    recipeForm.reset();
    ingredientsList.innerHTML = '';
    stepsList.innerHTML = '';
    editingRecipeId = null;
    
    // Uncheck all dietary checkboxes
    document.querySelectorAll('.dietary-checkbox').forEach(cb => cb.checked = false);
}

function loadRecipeIntoForm(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Basic info
    document.getElementById('recipeTitle').value = recipe.title;
    document.getElementById('recipeDescription').value = recipe.description;
    document.getElementById('recipeEmoji').value = recipe.emoji || '';
    document.getElementById('recipeCategory').value = recipe.category;
    
    // Timing
    document.getElementById('prepTime').value = recipe.prepTime;
    document.getElementById('cookTime').value = recipe.cookTime;
    document.getElementById('totalTime').value = recipe.totalTime;
    document.getElementById('servings').value = recipe.servings;
    document.getElementById('difficulty').value = recipe.difficulty;
    
    // Dietary
    document.querySelectorAll('.dietary-checkbox').forEach(cb => {
        cb.checked = recipe.dietary.includes(cb.value);
    });
    
    // Ingredients
    ingredientsList.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        addIngredientField(ingredient);
    });
    
    // Steps
    stepsList.innerHTML = '';
    recipe.steps.forEach(step => {
        addStepField(step);
    });
    
    // Additional info
    document.getElementById('tips').value = recipe.tips || '';
    document.getElementById('substitutions').value = recipe.substitutions || '';
}

function addIngredientField(value = '') {
    const div = document.createElement('div');
    div.className = 'ingredient-item';
    div.innerHTML = `
        <input type="text" placeholder="e.g., 2 cups all-purpose flour" value="${value}" required>
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    ingredientsList.appendChild(div);
}

function addStepField(value = '') {
    const div = document.createElement('div');
    div.className = 'step-item';
    div.innerHTML = `
        <textarea placeholder="Describe this step..." required>${value}</textarea>
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    stepsList.appendChild(div);
}

function saveRecipe() {
    // Collect form data
    const ingredients = Array.from(ingredientsList.querySelectorAll('input'))
        .map(input => input.value.trim())
        .filter(val => val);
    
    const steps = Array.from(stepsList.querySelectorAll('textarea'))
        .map(textarea => textarea.value.trim())
        .filter(val => val);
    
    const dietary = Array.from(document.querySelectorAll('.dietary-checkbox:checked'))
        .map(cb => cb.value);
    
    if (ingredients.length === 0) {
        alert('Please add at least one ingredient!');
        return;
    }
    
    if (steps.length === 0) {
        alert('Please add at least one step!');
        return;
    }
    
    const recipeData = {
        id: editingRecipeId || Date.now(),
        title: document.getElementById('recipeTitle').value.trim(),
        description: document.getElementById('recipeDescription').value.trim(),
        emoji: document.getElementById('recipeEmoji').value.trim() || '🍽️',
        category: document.getElementById('recipeCategory').value,
        prepTime: document.getElementById('prepTime').value.trim(),
        cookTime: document.getElementById('cookTime').value.trim(),
        totalTime: document.getElementById('totalTime').value.trim(),
        servings: parseInt(document.getElementById('servings').value),
        difficulty: document.getElementById('difficulty').value,
        dietary: dietary,
        ingredients: ingredients,
        steps: steps,
        tips: document.getElementById('tips').value.trim(),
        substitutions: document.getElementById('substitutions').value.trim()
    };
    
    if (editingRecipeId) {
        // Update existing recipe
        const index = recipes.findIndex(r => r.id === editingRecipeId);
        recipes[index] = recipeData;
    } else {
        // Add new recipe
        recipes.push(recipeData);
    }
    
    // Save to localStorage
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    // Update display
    filterRecipes();
    updateEmptyState();
    closeRecipeFormModal();
    
    // Show success message
    alert(editingRecipeId ? 'Recipe updated!' : 'Recipe added!');
}

function deleteRecipe(recipeId) {
    recipes = recipes.filter(r => r.id !== recipeId);
    localStorage.setItem('recipes', JSON.stringify(recipes));
    filterRecipes();
    updateEmptyState();
}

// Make openRecipe available globally for onclick handlers
window.openRecipe = openRecipe;
