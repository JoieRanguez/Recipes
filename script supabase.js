// ===== SUPABASE CONFIGURATION =====
// Replace these with your Supabase project details
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://iuntcxfphjhesyivxzns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bnRjeGZwaGpoZXN5aXZ4em5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTU2MjEsImV4cCI6MjA4NTgzMTYyMX0.DZBtEfsgTHpPHoP3k5onWYbfKBev2R088ggYf4ezWQc';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== STATE =====
let recipes = [];
let currentRecipeId = null;

// DOM elements
const recipesGrid = document.getElementById('recipesGrid');
const searchInput = document.getElementById('searchInput');
const timeFilter = document.getElementById('timeFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const categoryPills = document.querySelectorAll('.category-pill');
const modal = document.getElementById('recipeModal');
const closeModalBtn = document.getElementById('closeModal');
const noResults = document.getElementById('noResults');

// State
let currentCategory = 'all';
let currentFilters = {
    search: '',
    time: '',
    difficulty: ''
};

// ===== INITIALIZE =====
loadRecipes();

// ===== SUPABASE FUNCTIONS =====
async function loadRecipes() {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        recipes = data || [];
        displayRecipes(recipes);
    } catch (error) {
        console.error('Error loading recipes:', error);
        alert('Failed to load recipes. Check your Supabase configuration.');
    }
}

async function saveRecipe(recipeData) {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .insert([recipeData])
            .select();
        
        if (error) throw error;
        
        await loadRecipes();
        return data[0];
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe.');
        return null;
    }
}

async function updateRecipe(id, recipeData) {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .update(recipeData)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        await loadRecipes();
        return data[0];
    } catch (error) {
        console.error('Error updating recipe:', error);
        alert('Failed to update recipe.');
        return null;
    }
}

async function deleteRecipe(id) {
    try {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadRecipes();
        return true;
    } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe.');
        return false;
    }
}

// ===== EVENT LISTENERS =====
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

// ===== DISPLAY FUNCTIONS =====
function displayRecipes(recipesToShow) {
    if (recipesToShow.length === 0) {
        recipesGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    recipesGrid.style.display = 'grid';
    noResults.style.display = 'none';

    recipesGrid.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card ${recipe.category}" onclick="openRecipe('${recipe.id}')">
            <div class="recipe-image">${recipe.emoji || '🍽️'}</div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span class="meta-item">⏱️ ${recipe.total_time}</span>
                    <span class="meta-item">🍽️ ${recipe.servings} servings</span>
                    <span class="meta-item">📊 ${recipe.difficulty}</span>
                </div>
                <div class="recipe-tags">
                    <span class="tag ${recipe.category}">${recipe.category}</span>
                </div>
            </div>
        </div>
    `).join('');
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
            (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(currentFilters.search)))
        );
    }

    // Time filter
    if (currentFilters.time) {
        filtered = filtered.filter(recipe => {
            const totalMinutes = parseInt(recipe.total_time);
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
                <div class="time-value">${recipe.prep_time}</div>
            </div>
            <div class="time-item">
                <div class="time-label">Cook Time</div>
                <div class="time-value">${recipe.cook_time}</div>
            </div>
            <div class="time-item">
                <div class="time-label">Total Time</div>
                <div class="time-value">${recipe.total_time}</div>
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

// Make openRecipe available globally
window.openRecipe = openRecipe;