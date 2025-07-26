import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Generate fake health data with realistic variations
const generateHealthData = () => {
    const baseTime = Date.now();
    return {
        heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
        steps: 7500, // Fixed step count
        bloodOxygen: Math.floor(Math.random() * 5) + 95, // 95-99%
        lastUpdated: baseTime
    };
};

// Function to get color based on recovery time (0-48 hours) - darker colors for better visibility
const getRecoveryColor = (hours) => {
    const percentage = Math.min(hours / 48, 1); // Normalize to 0-1
    if (percentage <= 0.5) {
        // Dark Green to Dark Orange (0-24 hours)
        const greenToOrange = percentage * 2; // 0-1
        const red = Math.floor(200 * greenToOrange);
        const green = 200;
        const blue = 0;
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // Dark Orange to Dark Red (24-48 hours)
        const orangeToRed = (percentage - 0.5) * 2; // 0-1
        const red = 200;
        const green = Math.floor(150 * (1 - orangeToRed));
        const blue = 0;
        return `rgb(${red}, ${green}, ${blue})`;
    }
};

const HealthMetric = ({ icon, value, unit, label, position, recoveryTime }) => {
    const positionStyles = {
        topLeft: { position: 'absolute', top: '15px', left: '15px' },
        topRight: { position: 'absolute', top: '15px', right: '15px' },
        bottomLeft: { position: 'absolute', bottom: '70px', left: '15px' },
        bottomRight: { position: 'absolute', bottom: '70px', right: '15px' }
    };

    const isRecoveryMetric = label === 'Recovery';
    const percentage = isRecoveryMetric ? Math.min(recoveryTime / 48, 1) : 0;
    const arrowPosition = percentage * 100;

    return (
        <div
            className="health-metric"
            style={{
                ...positionStyles[position],
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '60px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
        >
            <div style={{ fontSize: '16px', marginBottom: '2px' }}>{icon}</div>
            <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1976d2',
                marginBottom: '1px'
            }}>
                {value}<span style={{ fontSize: '10px', fontWeight: 'normal' }}>{unit}</span>
            </div>

            {/* Recovery bar - only show for recovery metric */}
            {isRecoveryMetric && (
                <div style={{
                    height: '4px',
                    background: 'linear-gradient(to right, #00ff00, #ffff00, #ff8000, #ff0000)',
                    borderRadius: '2px',
                    position: 'relative',
                    margin: '2px 0',
                    width: '100%'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: `${arrowPosition}%`,
                        top: '-1px',
                        transform: 'translateX(-50%)',
                        width: '0',
                        height: '0',
                        borderLeft: '2px solid transparent',
                        borderRight: '2px solid transparent',
                        borderTop: '3px solid #333'
                    }} />
                </div>
            )}

            <div style={{
                fontSize: '9px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
            }}>
                {label}
            </div>
        </div>
    );
};

const HealthMetrics = () => {
    const [healthData, setHealthData] = useState(generateHealthData());
    const [recoveryTime, setRecoveryTime] = useState(30); // Start at 30 hours

    // Update health data every 30 seconds (except steps and recovery)
    useEffect(() => {
        const interval = setInterval(() => {
            setHealthData(generateHealthData());
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Decrease recovery time every 60 seconds
    useEffect(() => {
        const recoveryInterval = setInterval(() => {
            setRecoveryTime(prev => Math.max(0, prev - 1)); // Decrease by 1 hour, minimum 0
        }, 60000); // 60 seconds

        return () => clearInterval(recoveryInterval);
    }, []);

    // Helper to get custom styles for each muscle group
    const getMuscleCustomStyles = (name) => {
        switch (name) {
            case 'highlight-left-shoulder':
                return {
                    clipPath: 'polygon(50% 0%, 75% 60%, 65% 80%, 55% 95%, 35% 90%, 20% 75%, 25% 85%)',
                    borderRadius: '0px'
                };
            case 'highlight-right-shoulder':
                return {
                    clipPath: 'polygon(50% 0%, 25% 60%, 35% 80%, 45% 95%, 65% 90%, 80% 75%, 75% 85%)',
                    borderRadius: '0px'
                };
            case 'highlight-chest':
                return {
                    clipPath: 'polygon(30% 0%, 70% 0%, 85% 40%, 80% 70%, 60% 90%, 40% 90%, 20% 70%, 15% 40%)',
                    borderRadius: '0px'
                };
            case 'highlight-left-lower-arm':
                return {
                    clipPath: 'polygon(20% 0%, 80% 10%, 90% 25%, 85% 50%, 90% 75%, 75% 90%, 50% 95%, 25% 85%, 15% 60%, 10% 30%)',
                    borderRadius: '0px'
                };
            case 'highlight-right-lower-arm':
                return {
                    clipPath: 'polygon(80% 0%, 20% 10%, 10% 25%, 15% 50%, 10% 75%, 25% 90%, 50% 95%, 75% 85%, 85% 60%, 90% 30%)',
                    borderRadius: '0px'
                };
            default:
                return { borderRadius: '6px' };
        }
    };

    // Helper to get shape type
    const getMuscleShapeType = (name) => {
        switch (name) {
            case 'highlight-left-shoulder':
                return 'shoulder-angled';
            case 'highlight-right-shoulder':
                return 'shoulder-angled-right';
            case 'highlight-chest':
                return 'chest-pectoral';
            case 'highlight-left-lower-arm':
                return 'forearm-left';
            case 'highlight-right-lower-arm':
                return 'forearm-right';
            default:
                return 'default';
        }
    };

    // Generate muscle highlights based on recovery time
    const muscleHighlights = () => {
        const recoveryColor = getRecoveryColor(recoveryTime);
        const muscleGroups = [
            { name: 'highlight-chest', top: '33%', left: '58%', width: '12%', height: '16%' },
            { name: 'highlight-left-shoulder', top: '24%', left: '49%', width: '6%', height: '12%' },
            { name: 'highlight-right-shoulder', top: '24%', left: '72%', width: '6%', height: '12%' },
            { name: 'highlight-left-lower-arm', top: '35%', left: '49%', width: '4%', height: '18%' },
            { name: 'highlight-right-lower-arm', top: '35%', left: '74%', width: '4%', height: '18%' }
        ];

        return muscleGroups.map((muscle, index) => (
            <div
                key={muscle.name}
                data-muscle={muscle.name}
                data-shape-type={getMuscleShapeType(muscle.name)}
                className="muscle-highlight"
                style={{
                    position: 'absolute',
                    top: muscle.top,
                    left: muscle.left,
                    width: muscle.width,
                    height: muscle.height,
                    backgroundColor: recoveryColor,
                    opacity: 1.0,
                    ...getMuscleCustomStyles(muscle.name),
                    pointerEvents: 'none',
                    animation: 'musclePulse 4s ease-in-out infinite',
                    animationDelay: `${index * 0.4}s`,
                    border: '1px dashed rgba(255,255,255,0.3)'
                }}
            />
        ));
    };

    return (
        <>
            <HealthMetric
                icon="❤️"
                value={healthData.heartRate}
                unit=" BPM"
                label="Heart Rate"
                position="topLeft"
            />
            <HealthMetric
                icon="👟"
                value={healthData.steps.toLocaleString()}
                unit=""
                label="Steps"
                position="topRight"
            />
            <HealthMetric
                icon="🩸"
                value={healthData.bloodOxygen}
                unit="%"
                label="Blood O²"
                position="bottomLeft"
            />
            <HealthMetric
                icon="⏱️"
                value={recoveryTime}
                unit="h"
                label="Recovery"
                position="bottomRight"
                recoveryTime={recoveryTime}
            />
            {muscleHighlights()}
        </>
    );
};
HealthMetric.propTypes = {
    icon: PropTypes.node.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string,
    label: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']).isRequired,
    recoveryTime: PropTypes.number
};

export default HealthMetrics;
