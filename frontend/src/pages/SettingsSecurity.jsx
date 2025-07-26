import React, { useState } from "react";
import './settings.css';

const mockData = [
    "Fitness Goals: Lose Weight, Build Muscle",
    "Dietary Preferences: Halal, Low-Carb",
    "Liked Recipes: Grilled Chicken, Spicy Chickpea Bowl",
    "Workout History: 3 sessions this week",
    "Location Data: Disabled"
];

export default function SettingsSecurity() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [wiped, setWiped] = useState(false);

    function handleWipe() {
        setWiped(true);
        setShowConfirm(false);
        setTimeout(() => setWiped(false), 3000);
    }

    return (
        <div className="settings-content">
            <h3 className="settings-subtitle">Data & Privacy</h3>
            <p className="settings-desc">Manage the data you share with us.</p>

            <div className="data-list">
                <h4>Data Stored About You:</h4>
                <ul>
                    {mockData.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>

            <div className="wipe-section">
                <button className="wipe-btn" onClick={() => setShowConfirm(true)}>
                    Wipe My Data
                </button>
                <p className="wipe-desc">This will permanently delete all your personal data. This action cannot be undone.</p>
            </div>

            {showConfirm && (
                <div className="confirm-dialog-overlay">
                    <div className="confirm-dialog">
                        <h4>Are you sure?</h4>
                        <p>This will permanently delete all your data.</p>
                        <div className="confirm-buttons">
                            <button onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="confirm-wipe-btn" onClick={handleWipe}>Yes, Wipe Data</button>
                        </div>
                    </div>
                </div>
            )}

            {wiped && (
                <div className="wiped-notification">
                    Your data has been wiped.
                </div>
            )}
        </div>
    );
}
