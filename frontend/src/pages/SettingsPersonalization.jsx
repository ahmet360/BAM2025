import React from 'react';
import './settings.css';


export default function SettingsPersonalization() {
    return (
        <div className="settings-content">
            <h3 className="settings-subtitle" style={{ marginBottom: 4 }}>Personalization</h3>
            <p className="settings-desc" style={{ marginBottom: 18 }}>Customize the look and feel of your app.</p>

            <div className="settings-card" style={{ marginBottom: 18, background: '#f7faff', boxShadow: '0 1px 6px rgba(25,118,210,0.07)' }}>
                <div className="setting-item" style={{ borderBottom: 'none', padding: '10px 0' }}>
                    <div>
                        <label htmlFor="theme-toggle" style={{ fontWeight: 500, fontSize: 17, color: '#1976d2' }}>Dark Mode</label>
                        <div style={{ fontSize: 13, color: '#888' }}>Reduce eye strain with a darker theme.</div>
                    </div>
                    <div className="setting-control">
                        <label className="switch">
                            <input type="checkbox" id="theme-toggle" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="settings-card" style={{ marginBottom: 18, background: '#fff8f7', boxShadow: '0 1px 6px rgba(233,30,99,0.07)' }}>
                <div className="setting-item" style={{ borderBottom: 'none', padding: '10px 0' }}>
                    <div>
                        <label htmlFor="font-size-slider" style={{ fontWeight: 500, fontSize: 17, color: '#e91e63' }}>Font Size</label>
                        <div style={{ fontSize: 13, color: '#888' }}>Adjust text size for better readability.</div>
                    </div>
                    <div className="setting-control">
                        <input type="range" id="font-size-slider" min="80" max="120" defaultValue="100" style={{ accentColor: '#e91e63' }} />
                    </div>
                </div>
            </div>

            <div className="settings-card" style={{ marginBottom: 0, background: '#f7fff8', boxShadow: '0 1px 6px rgba(0,150,136,0.07)' }}>
                <div className="setting-item" style={{ borderBottom: 'none', padding: '10px 0' }}>
                    <div>
                        <label style={{ fontWeight: 500, fontSize: 17, color: '#009688' }}>Accent Color</label>
                        <div style={{ fontSize: 13, color: '#888' }}>Choose your favorite highlight color.</div>
                    </div>
                    <div className="setting-control color-swatches">
                        <button className="color-swatch active" style={{ background: '#1976d2', boxShadow: '0 0 0 2px #1976d2' }}></button>
                        <button className="color-swatch" style={{ background: '#009688' }}></button>
                        <button className="color-swatch" style={{ background: '#e91e63' }}></button>
                        <button className="color-swatch" style={{ background: '#ff9800' }}></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
