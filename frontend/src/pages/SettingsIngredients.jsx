import React, { useState } from "react";
import './settings.css';

const initialIngredients = ["Chicken Breast", "Broccoli", "Quinoa", "Olive Oil", "Garlic"];

export default function SettingsIngredients() {
    const [ingredients, setIngredients] = useState(initialIngredients);
    const [newIngredient, setNewIngredient] = useState('');

    function handleAdd(e) {
        e.preventDefault();
        if (newIngredient && !ingredients.includes(newIngredient)) {
            setIngredients([...ingredients, newIngredient]);
            setNewIngredient('');
        }
    }

    function handleRemove(ingredientToRemove) {
        setIngredients(ingredients.filter(ing => ing !== ingredientToRemove));
    }

    return (
        <div className="settings-content">
            <h3 className="settings-subtitle">My Ingredients</h3>
            <p className="settings-desc">Manage the ingredients you have at home to get better recipe suggestions.</p>

            <form onSubmit={handleAdd} className="ingredient-form">
                <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    placeholder="Add a new ingredient..."
                />
                <button type="submit">+</button>
            </form>

            <ul className="ingredient-list">
                {ingredients.map((ing, i) => (
                    <li key={i}>
                        <span>{ing}</span>
                        <button onClick={() => handleRemove(ing)}>&times;</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
