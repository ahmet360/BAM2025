import React, { useState } from "react";
import './settings.css';

export default function SettingsIngredients({ ingredients = [], setIngredients = () => { } }) {
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

            <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%)',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #c8e6c9'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px' }}>📷</span>
                    <span style={{ fontWeight: '600', color: '#2e7d32', fontSize: '14px' }}>Camera Scanner Integration</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#1b5e20', lineHeight: 1.4 }}>
                    Ingredients scanned from receipts are automatically added here! Use the camera scanner in the food page to detect new ingredients.
                </p>
            </div>

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

            {ingredients.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '32px 16px',
                    color: '#666',
                    fontStyle: 'italic'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🥬</div>
                    <p>No ingredients yet!</p>
                    <p style={{ fontSize: '14px', margin: 0 }}>Add some manually or use the camera scanner to get started.</p>
                </div>
            )}
        </div>
    );
}
