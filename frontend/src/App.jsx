import React, { useState, useRef } from "react";
import HealthMetrics from "./components/HealthMetrics";
import SettingsSecurity from "./pages/SettingsSecurity";
import SettingsPersonalization from "./pages/SettingsPersonalization";
import SettingsIngredients from "./pages/SettingsIngredients";
import "./styles.css";
import runPng from "./assets/run.png";
import runGif from "./assets/run.gif";
import foodPng from "./assets/food.png";
import foodGif from "./assets/food.gif";
import gearPng from "./assets/gear.png";
import gearGif from "./assets/gear.gif";
import maoFullPng from "./assets/mao_full.png";
import chatPng from "./assets/chat.png";
import dishPng from "./assets/dish.png";
import gymPng from "./assets/gym.png";
import botPng from "./assets/bot.png";

function BarIcon({ staticSrc, gifSrc, alt, active, onClick, gifDuration = 1200 }) {
  const [showGif, setShowGif] = useState(false);
  function handleClick(e) {
    setShowGif(true);
    if (onClick) onClick(e);
    setTimeout(() => setShowGif(false), gifDuration);
  }
  return (
    <button
      className={"bar-btn" + (active ? " active" : "")}
      aria-label={alt}
      onClick={handleClick}
      style={{ background: active ? "#e3f2fd" : undefined }}
    >
      <img
        src={showGif ? gifSrc : staticSrc}
        alt={alt}
        className="bar-img"
        draggable={false}
        style={{
          filter: alt === "Fitness" && typeof window !== 'undefined' && window.darkMode ? 'invert(1) hue-rotate(180deg)' : undefined,
          width: showGif ? 40 : 28,
          height: showGif ? 40 : 28,
          transition: 'width 0.18s, height 0.18s'
        }}
      />
    </button>
  );
}


export default function App() {
  const [tab, setTab] = useState("fitness");
  const [settingsTab, setSettingsTab] = useState("security");
  const [darkMode] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hi! How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [talkModalOpen, setTalkModalOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [aiAudioUrl, setAiAudioUrl] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const audioStreamRef = useRef(null);
  const [audioLevels, setAudioLevels] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);

  // Food page states
  const [storedIngredients, setStoredIngredients] = useState([
    'chicken breast', 'broccoli', 'rice', 'olive oil', 'garlic', 'tomatoes', 'onions'
  ]);

  // Camera scanner states
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('equipment'); // 'equipment' or 'food'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [showScanResults, setShowScanResults] = useState(false);
  // Hold-to-talk: start and stop recording on button events
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setVoiceActive(true);
      setRecordedAudioUrl(null);
      setAiAudioUrl(null);
      setTranscribedText("");
      setRecordingTime(0);

      // Start timing
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Create audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 32;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevels = () => {
        if (voiceActive) {
          analyser.getByteFrequencyData(dataArray);
          const levels = Array.from(dataArray).map(value => (value / 255) * 100);
          setAudioLevels(levels);
          requestAnimationFrame(updateLevels);
        }
      };
      updateLevels();

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        // Stop timing
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        // process recording
        // Create URL for recorded user audio
        const userBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const userUrl = URL.createObjectURL(userBlob);
        setRecordedAudioUrl(userUrl);
        // Send to speech-to-text
        const form = new FormData(); form.append('file', userBlob, 'audio.webm');
        const sttRes = await fetch('http://localhost:8000/speech-to-text', { method: 'POST', body: form });
        const { text } = await sttRes.json();
        // Save transcript
        setTranscribedText(text);
        // Chat response
        const chatRes = await fetch('http://localhost:8000/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const { response } = await chatRes.json();
        // Text-to-speech
        const ttsRes = await fetch('http://localhost:8000/text-to-speech', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response })
        });
        const aiBlob = await ttsRes.blob();
        const aiUrl = URL.createObjectURL(aiBlob);
        setAiAudioUrl(aiUrl);
        setVoiceActive(false);
      };
      recorder.start();
    } catch {
      setVoiceActive(false);
    }
  }
  function stopRecording() {
    // immediately update UI
    setVoiceActive(false);
    setAudioLevels([]);

    // Stop timing
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      // stop the audio stream tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
    }
  }

  // Camera scanner functions
  function startScanning(mode) {
    setScannerMode(mode);
    setIsScanning(true);
    setShowScanResults(false);

    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      if (mode === 'equipment') {
        setScanResults([
          { name: 'Dumbbells', exercises: ['Bicep Curls', 'Chest Press', 'Shoulder Press'] },
          { name: 'Resistance Bands', exercises: ['Lat Pulldowns', 'Squats', 'Chest Flies'] },
          { name: 'Yoga Mat', exercises: ['Planks', 'Push-ups', 'Stretching'] }
        ]);
      } else {
        // Food mode - detect ingredients from receipt
        const newIngredients = ['salmon', 'quinoa', 'spinach', 'avocado', 'lemon'];
        setScanResults(newIngredients);
        // Add to stored ingredients
        setStoredIngredients(prev => [...new Set([...prev, ...newIngredients])]);
      }
      setShowScanResults(true);
    }, 2000);
  }

  // Generate AI recipes based on stored ingredients
  function generateRecipes() {
    const recipeTemplates = [
      {
        name: "Healthy {ingredient1} Bowl",
        ingredients: ["chicken breast", "salmon", "quinoa"],
        description: "A nutritious bowl with {ingredient1}, fresh vegetables, and a light dressing.",
        fullRecipe: {
          ingredients: ["{ingredient1}", "mixed greens", "cherry tomatoes", "cucumber", "olive oil"],
          instructions: ["Cook {ingredient1} until tender", "Mix vegetables in a bowl", "Add {ingredient1} on top", "Drizzle with olive oil and enjoy"]
        }
      },
      {
        name: "{ingredient1} Stir-Fry",
        ingredients: ["broccoli", "tomatoes", "onions"],
        description: "Quick and healthy stir-fry featuring {ingredient1} and protein.",
        fullRecipe: {
          ingredients: ["{ingredient1}", "chicken breast", "garlic", "soy sauce", "rice"],
          instructions: ["Heat oil in pan", "Add chicken and cook", "Add {ingredient1} and garlic", "Stir in soy sauce", "Serve over rice"]
        }
      },
      {
        name: "Mediterranean {ingredient1} Salad",
        ingredients: ["olive oil", "garlic", "tomatoes"],
        description: "Fresh Mediterranean salad with {ingredient1} and herbs.",
        fullRecipe: {
          ingredients: ["{ingredient1}", "feta cheese", "olives", "cucumber", "herbs"],
          instructions: ["Chop all vegetables", "Mix in a large bowl", "Add feta and olives", "Dress with olive oil", "Season and serve"]
        }
      }
    ];

    return recipeTemplates
      .filter(template => template.ingredients.some(ing => storedIngredients.includes(ing)))
      .slice(0, 3)
      .map(template => {
        const matchingIngredient = template.ingredients.find(ing => storedIngredients.includes(ing));
        return {
          ...template,
          name: template.name.replace('{ingredient1}', matchingIngredient),
          description: template.description.replace('{ingredient1}', matchingIngredient),
          fullRecipe: {
            ...template.fullRecipe,
            ingredients: template.fullRecipe.ingredients.map(ing =>
              ing.replace('{ingredient1}', matchingIngredient)
            ),
            instructions: template.fullRecipe.instructions.map(inst =>
              inst.replace('{ingredient1}', matchingIngredient)
            )
          }
        };
      });
  }
  // Recipe of the Day component
  const recipes = [
    {
      name: "Grilled Lemon Chicken Salad",
      desc: "Tender grilled chicken breast on a bed of fresh greens, tossed with lemon vinaigrette and cherry tomatoes.",
      fullRecipe: {
        prepTime: "15 mins",
        cookTime: "20 mins",
        servings: 2,
        difficulty: "Easy",
        ingredients: [
          "2 chicken breasts (6 oz each)",
          "4 cups mixed greens (arugula, spinach)",
          "1 cup cherry tomatoes, halved",
          "1/2 red onion, thinly sliced",
          "1/4 cup olive oil",
          "2 lemons, juiced",
          "2 cloves garlic, minced",
          "1 tsp dried oregano",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Season chicken breasts with salt, pepper, and half the oregano. Let rest for 10 minutes.",
          "Preheat grill or grill pan to medium-high heat. Brush grates with oil.",
          "Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F.",
          "While chicken cooks, whisk together olive oil, lemon juice, garlic, remaining oregano, salt and pepper for vinaigrette.",
          "Let chicken rest for 5 minutes, then slice diagonally into strips.",
          "In a large bowl, toss mixed greens with half the vinaigrette.",
          "Plate the salad, top with sliced chicken, cherry tomatoes, and red onion.",
          "Drizzle with remaining vinaigrette and serve immediately."
        ]
      }
    },
    {
      name: "Spicy Chickpea Bowl",
      desc: "Roasted chickpeas, quinoa, avocado, and spicy tahini sauce for a protein-packed vegan meal.",
      fullRecipe: {
        prepTime: "20 mins",
        cookTime: "25 mins",
        servings: 2,
        difficulty: "Easy",
        ingredients: [
          "1 cup quinoa, rinsed",
          "1 can (15 oz) chickpeas, drained and rinsed",
          "2 tbsp olive oil",
          "1 tsp smoked paprika",
          "1/2 tsp cumin",
          "1/4 tsp cayenne pepper",
          "1 avocado, sliced",
          "2 cups baby spinach",
          "1/4 cup tahini",
          "2 tbsp lemon juice",
          "1 clove garlic, minced",
          "1-2 tbsp hot sauce",
          "Salt to taste"
        ],
        instructions: [
          "Preheat oven to 400°F (200°C). Line a baking sheet with parchment paper.",
          "Cook quinoa according to package directions (typically 15 minutes in boiling water).",
          "Pat chickpeas dry and toss with 1 tbsp olive oil, paprika, cumin, cayenne, and salt.",
          "Spread chickpeas on baking sheet and roast for 20-25 minutes until crispy.",
          "Make tahini sauce: whisk together tahini, lemon juice, garlic, hot sauce, and 2-3 tbsp water until smooth.",
          "Divide cooked quinoa between two bowls.",
          "Top with baby spinach, roasted chickpeas, and sliced avocado.",
          "Drizzle generously with spicy tahini sauce and serve warm."
        ]
      }
    },
    {
      name: "Salmon & Asparagus Stir-Fry",
      desc: "Seared salmon fillet with garlic asparagus, bell peppers, and a light soy glaze.",
      fullRecipe: {
        prepTime: "15 mins",
        cookTime: "12 mins",
        servings: 2,
        difficulty: "Medium",
        ingredients: [
          "2 salmon fillets (6 oz each), skin removed",
          "1 lb asparagus, trimmed and cut into 2-inch pieces",
          "1 red bell pepper, sliced",
          "3 cloves garlic, minced",
          "2 tbsp vegetable oil",
          "3 tbsp low-sodium soy sauce",
          "1 tbsp honey",
          "1 tsp fresh ginger, grated",
          "1 tsp sesame oil",
          "2 green onions, sliced",
          "1 tbsp sesame seeds"
        ],
        instructions: [
          "Cut salmon into 1-inch cubes and season with salt and pepper.",
          "Mix soy sauce, honey, ginger, and sesame oil in a small bowl for the glaze.",
          "Heat 1 tbsp vegetable oil in a large wok or skillet over high heat.",
          "Add salmon cubes and sear for 2-3 minutes until golden. Remove and set aside.",
          "Add remaining oil to the pan. Stir-fry asparagus and bell pepper for 3-4 minutes.",
          "Add garlic and stir-fry for 30 seconds until fragrant.",
          "Return salmon to pan and add the soy glaze. Toss gently for 1-2 minutes.",
          "Garnish with green onions and sesame seeds. Serve over steamed rice."
        ]
      }
    },
    {
      name: "Egg White Veggie Omelette",
      desc: "Fluffy egg whites with spinach, mushrooms, and feta cheese, served with whole grain toast.",
      fullRecipe: {
        prepTime: "10 mins",
        cookTime: "8 mins",
        servings: 1,
        difficulty: "Easy",
        ingredients: [
          "4 large egg whites",
          "1 cup fresh spinach, chopped",
          "1/2 cup mushrooms, sliced",
          "1/4 cup feta cheese, crumbled",
          "2 tbsp olive oil",
          "1/4 small onion, diced",
          "1 clove garlic, minced",
          "2 slices whole grain bread",
          "Salt and pepper to taste",
          "Fresh herbs (chives or parsley)"
        ],
        instructions: [
          "Toast the bread slices and set aside.",
          "Heat 1 tbsp olive oil in a non-stick pan over medium heat.",
          "Sauté onion and mushrooms for 3-4 minutes until softened.",
          "Add garlic and spinach, cook for 1 minute until spinach wilts. Remove and set aside.",
          "Whisk egg whites with salt and pepper until slightly frothy.",
          "Heat remaining oil in the same pan over medium-low heat.",
          "Pour in egg whites and let set for 2 minutes without stirring.",
          "Add veggie mixture and feta to one half of the omelette.",
          "Carefully fold omelette in half and slide onto plate.",
          "Garnish with fresh herbs and serve with toast."
        ]
      }
    },
    {
      name: "Turkey Sweet Potato Skillet",
      desc: "Lean ground turkey sautéed with sweet potatoes, onions, and kale for a hearty one-pan dinner.",
      fullRecipe: {
        prepTime: "15 mins",
        cookTime: "25 mins",
        servings: 4,
        difficulty: "Easy",
        ingredients: [
          "1 lb lean ground turkey",
          "2 large sweet potatoes, diced",
          "1 large onion, diced",
          "4 cups kale, stems removed, chopped",
          "3 cloves garlic, minced",
          "2 tbsp olive oil",
          "1 tsp smoked paprika",
          "1/2 tsp cumin",
          "1/4 tsp red pepper flakes",
          "1/2 cup chicken broth",
          "Salt and pepper to taste",
          "Fresh cilantro for garnish"
        ],
        instructions: [
          "Heat 1 tbsp olive oil in a large skillet over medium-high heat.",
          "Add diced sweet potatoes and cook for 8-10 minutes until tender, stirring occasionally.",
          "Push sweet potatoes to one side of the pan.",
          "Add ground turkey to empty side and cook for 5-6 minutes, breaking it up as it browns.",
          "Add onion and cook for 3-4 minutes until softened.",
          "Add garlic, paprika, cumin, and red pepper flakes. Cook for 1 minute.",
          "Stir everything together and add chicken broth. Simmer for 3-4 minutes.",
          "Add kale and cook for 2-3 minutes until wilted.",
          "Season with salt and pepper. Garnish with fresh cilantro and serve."
        ]
      }
    }
  ];
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const recipeOfTheDay = recipes[Math.floor(Math.random() * recipes.length)];

  return (
    <div className="phone-outer" style={{ background: darkMode ? '#181a1b' : undefined }}>
      <div className="phone-bezel" style={{ background: darkMode ? '#222' : undefined, boxShadow: darkMode ? '0 12px 22px rgba(0,0,0,0.45)' : undefined }}>
        {/* Phone Status Bar */}
        <div
          id="phone-status-bar"
          className="phone-status-bar"
          style={{
            transform: 'translateY(11px)',
            height: '22px',
            background: '#000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#fff',
            borderRadius: '100px',
            marginTop: '8px'
          }}
        >
          <div className="status-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="status-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="signal-icon" style={{ fontSize: '10px' }}>📶</span>
            <span className="wifi-icon" style={{ fontSize: '10px' }}>📶</span>
            <span className="battery-icon" style={{ fontSize: '10px' }}>🔋</span>
            <span className="battery-percentage" style={{ fontSize: '11px' }}>85%</span>
          </div>
        </div>

        <div className="phone-inner" style={{ position: 'relative', overflow: 'hidden', background: darkMode ? '#222' : undefined, color: darkMode ? '#eee' : undefined }}>
          {tab === "fitness" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 12, padding: "12px 0 0 0", position: "relative" }}>
                <HealthMetrics />
                <img src={maoFullPng} alt="Body Silhouette" style={{ width: 360, height: "auto" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "16px 0" }}>
                <button className="ai-feature-btn icon-btn" onClick={() => { setTalkModalOpen(true); setEquipmentModalOpen(false); setChatModalOpen(false); }}>
                  <img src={botPng} alt="Live Talk" style={{ width: 32, height: 32 }} />
                </button>
                <button className="ai-feature-btn icon-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => { setEquipmentModalOpen(true); setTalkModalOpen(false); setChatModalOpen(false); }}>
                  <img src={gymPng} alt="Equipment" style={{ width: 32, height: 32 }} />
                  <img src={dishPng} alt="Food Analyzer" style={{ width: 32, height: 32 }} />
                </button>
                <button className="ai-feature-btn icon-btn" onClick={() => { setChatModalOpen(true); setEquipmentModalOpen(false); setTalkModalOpen(false); }}>
                  <img src={chatPng} alt="Chat" style={{ width: 32, height: 32 }} />
                </button>
              </div>
              {/* Recipe of the Day menu (bigger, clickable) */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                <button
                  style={{
                    background: darkMode ? 'rgba(32,32,32,0.98)' : 'rgba(255,255,255,0.98)',
                    borderRadius: 18,
                    boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.33)' : '0 4px 16px rgba(0,0,0,0.13)',
                    padding: '22px 32px',
                    minWidth: 280,
                    maxWidth: 400,
                    textAlign: 'left',
                    border: darkMode ? '2px solid #333' : '2px solid #e0e0e0',
                    fontSize: 18,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    outline: 'none',
                    color: darkMode ? '#eee' : undefined,
                  }}
                  onClick={() => {
                    setSelectedRecipe(recipeOfTheDay);
                    setTab('food');
                  }}
                  aria-label={`See full recipe for ${recipeOfTheDay.name}`}
                >
                  <div style={{ fontWeight: 'bold', color: darkMode ? '#90caf9' : '#1976d2', fontSize: 20, marginBottom: 8 }}>
                    🍽️ Recipe of the Day
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 18 }}>{recipeOfTheDay.name}</div>
                  <div style={{ color: darkMode ? '#bbb' : '#444', fontSize: 16 }}>{recipeOfTheDay.desc}</div>
                  <div style={{ color: darkMode ? '#aaa' : '#888', fontSize: 13, marginTop: 8 }}>
                    Tap for full recipe
                  </div>
                </button>
              </div>
              {/* Overlay for any open modal */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: (chatModalOpen || equipmentModalOpen || talkModalOpen) ? 'auto' : 'none', background: (chatModalOpen || equipmentModalOpen || talkModalOpen) ? 'rgba(0,0,0,0.32)' : 'transparent', backdropFilter: (chatModalOpen || equipmentModalOpen || talkModalOpen) ? 'blur(2px)' : 'none', zIndex: 1000, transition: 'background 0.3s, backdrop-filter 0.3s' }} onClick={() => { setChatModalOpen(false); setEquipmentModalOpen(false); setTalkModalOpen(false); }} />
              {/* Chat Panel */}
              {chatModalOpen && (
                <div className={`chat-slideup-panel open`} style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  maxWidth: '100%',
                  height: '75%',
                  background: '#fff',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  willChange: 'transform',
                  pointerEvents: 'auto',
                }}>
                  <button onClick={() => setChatModalOpen(false)} style={{ alignSelf: 'flex-end', margin: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1976d2' }}>&#8595;</button>
                  <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', fontWeight: 600, fontSize: 20, color: '#1976d2' }}>AI Chat</h3>
                  <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'user' ? '#1976d2' : '#e3f2fd',
                        color: msg.sender === 'user' ? '#fff' : '#222',
                        borderRadius: 16,
                        padding: '8px 14px',
                        maxWidth: '70%',
                        fontSize: 15,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
                      }}>{msg.text}</div>
                    ))}
                  </div>
                  <form style={{ display: 'flex', gap: 8, padding: '8px 16px 16px 16px', borderTop: '1px solid #eee' }}
                    onSubmit={e => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      setChatMessages(msgs => [...msgs, { sender: 'user', text: chatInput }]);
                      fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: chatInput })
                      })
                        .then(res => res.json())
                        .then(data => {
                          setChatMessages(msgs => [...msgs, { sender: 'ai', text: data.response }]);
                        })
                        .catch(() => {
                          setChatMessages(msgs => [...msgs, { sender: 'ai', text: '[Error: failed to connect to AI]' }]);
                        });
                      setChatInput('');
                    }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      style={{ flex: 1, borderRadius: 12, border: '1px solid #ccc', padding: '8px 12px', fontSize: 15 }}
                    />
                    <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 15, cursor: 'pointer' }}>Send</button>
                  </form>
                </div>
              )}
              {/* Equipment & Food Analyzer Panel */}
              {equipmentModalOpen && (
                <div className={`chat-slideup-panel open`} style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  maxWidth: '100%',
                  height: '75%',
                  background: '#fff',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  willChange: 'transform',
                  pointerEvents: 'auto',
                }}>
                  <button onClick={() => setEquipmentModalOpen(false)} style={{ alignSelf: 'flex-end', margin: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1976d2' }}>&#8595;</button>
                  <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>AI Equipment & Food Analyzer</h3>
                  <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {!showScanResults ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <div style={{
                          width: '280px',
                          height: '200px',
                          border: '2px dashed #ccc',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9f9f9'
                        }}>
                          {isScanning ? (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
                              <div style={{ fontSize: '16px', fontWeight: '500' }}>Scanning...</div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', color: '#666' }}>
                              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                              <div style={{ fontSize: '14px' }}>Camera Preview</div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                          <button
                            onClick={() => startScanning('equipment')}
                            disabled={isScanning}
                            style={{
                              width: '60px',
                              height: '60px',
                              backgroundColor: isScanning ? '#ccc' : '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              cursor: isScanning ? 'not-allowed' : 'pointer',
                              fontSize: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            title="Scan Equipment"
                          >
                            🏋️
                          </button>
                          <button
                            onClick={() => startScanning('food')}
                            disabled={isScanning}
                            style={{
                              width: '60px',
                              height: '60px',
                              backgroundColor: isScanning ? '#ccc' : '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              cursor: isScanning ? 'not-allowed' : 'pointer',
                              fontSize: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            title="Scan Receipt"
                          >
                            🧾
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 style={{ color: '#333', marginTop: '0' }}>Scan Results:</h4>
                        {scannerMode === 'equipment' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {scanResults.map((item, idx) => (
                              <div key={idx} style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                backgroundColor: '#f9f9f9',
                                color: '#333'
                              }}>
                                <strong style={{ color: '#1976d2' }}>{item.name}</strong>
                                <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                                  Suggested exercises:
                                  <ul style={{ margin: '4px 0', paddingLeft: '20px', color: '#666' }}>
                                    {item.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%)',
                              padding: '12px',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              border: '1px solid #4caf50'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '16px' }}>✅</span>
                                <span style={{ fontWeight: '600', color: '#2e7d32' }}>Ingredients Added Successfully!</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', color: '#1b5e20' }}>
                                These ingredients have been automatically added to your settings → ingredients page.
                              </p>
                            </div>
                            <p style={{ color: '#333', marginTop: '0', fontWeight: '500' }}>Scanned from receipt:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                              {scanResults.map((ingredient, idx) => (
                                <span key={idx} style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  borderRadius: '16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                                }}>
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button
                            onClick={() => setShowScanResults(false)}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              backgroundColor: '#666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Scan Again
                          </button>
                          {scannerMode === 'food' && (
                            <button
                              onClick={() => {
                                setCameraModalOpen(false);
                                setShowScanResults(false);
                                setTab('settings');
                                setSettingsTab('ingredients');
                              }}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            >
                              View in Settings
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Live Talk Panel */}
              {talkModalOpen && (
                <div className={`chat-slideup-panel open`} style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  maxWidth: '100%',
                  height: '75%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  willChange: 'transform',
                  pointerEvents: 'auto',
                }}>
                  <button
                    onClick={() => { setTalkModalOpen(false); setVoiceActive(false); }}
                    style={{ 
                      alignSelf: 'flex-end', 
                      margin: 8, 
                      background: 'rgba(255,255,255,0.2)', 
                      border: 'none', 
                      fontSize: 18, 
                      cursor: 'pointer', 
                      color: '#fff',
                      borderRadius: 20,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >×</button>
                  <h3 style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: '600' }}>🎙️ Voice Chat</h3>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <button
                      className={`record-btn ${voiceActive ? 'recording' : ''}`}
                      onClick={() => {
                        if (!voiceActive) startRecording();
                        else stopRecording();
                      }}
                      style={{
                        background: voiceActive ? '#d32f2f' : 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderRadius: '50%',
                        width: '80px',
                        height: '80px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        fontWeight: '600',
                        animation: voiceActive ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      {voiceActive ? '⏹ Stop' : '🎙 Record'}
                    </button>
                    {voiceActive && recordingTime && (
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        🕐 {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    {voiceActive && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '16px',
                        marginTop: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          alignItems: 'flex-end',
                          height: '60px'
                        }}>
                          {audioLevels.map((level, index) => (
                            <div
                              key={index}
                              style={{
                                width: '6px',
                                height: `${Math.max(4, level * 50)}px`,
                                background: 'linear-gradient(to top, #fff, rgba(255,255,255,0.6))',
                                borderRadius: '3px',
                                animation: `audioWave 0.${index + 1}s ease-in-out infinite alternate`,
                                opacity: 0.8 + (level * 0.2)
                              }}
                            />
                          ))}
                        </div>
                        <div style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.9rem',
                          textAlign: 'center'
                        }}>
                          Listening...
                        </div>
                      </div>
                    )}
                    {/* Playback Players */}
                    {recordedAudioUrl && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '20px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        width: '90%'
                      }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
                          🎵 Your Recording
                        </div>
                        <audio 
                          controls 
                          src={recordedAudioUrl} 
                          style={{ 
                            width: '100%',
                            filter: 'invert(1) hue-rotate(180deg)',
                            opacity: '0.9'
                          }} 
                        />
                        {transcribedText && (
                          <div style={{ 
                            marginTop: 8, 
                            color: 'rgba(255,255,255,0.9)', 
                            fontStyle: 'italic',
                            fontSize: '0.95rem',
                            textAlign: 'center',
                            lineHeight: '1.4'
                          }}>
                            💬 "{transcribedText}"
                          </div>
                        )}
                      </div>
                    )}
                    {aiAudioUrl && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '12px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        width: '90%'
                      }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
                          🤖 AI Response
                        </div>
                        <audio 
                          controls 
                          src={aiAudioUrl} 
                          style={{ 
                            width: '100%',
                            filter: 'invert(1) hue-rotate(180deg)',
                            opacity: '0.9'
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "food" && (
            <div className="dummy-content" style={{
              height: '100%',
              overflow: 'auto',
              paddingBottom: '80px' // Space for bottom nav
            }}>
              {selectedRecipe ? (
                <div style={{
                  background: darkMode ? 'rgba(32,32,32,0.98)' : 'rgba(255,255,255,0.98)',
                  borderRadius: 18,
                  boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.33)' : '0 4px 16px rgba(0,0,0,0.13)',
                  padding: '28px 36px',
                  minWidth: 320,
                  maxWidth: 440,
                  margin: '32px auto',
                  textAlign: 'left',
                  border: darkMode ? '2px solid #333' : '2px solid #e0e0e0',
                  fontSize: 19,
                  color: darkMode ? '#eee' : undefined,
                }}>
                  <div style={{ fontWeight: 'bold', color: darkMode ? '#90caf9' : '#1976d2', fontSize: 24, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🍽️ {selectedRecipe.name}
                  </div>
                  <div style={{ color: darkMode ? '#bbb' : '#444', fontSize: 17, marginBottom: 16, lineHeight: 1.4 }}>{selectedRecipe.desc}</div>

                  {selectedRecipe.fullRecipe && (
                    <>
                      {/* Recipe Info Bar */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: 20,
                        padding: '12px',
                        background: darkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                        borderRadius: 8,
                        border: darkMode ? '1px solid rgba(144, 202, 249, 0.2)' : '1px solid rgba(25, 118, 210, 0.1)'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 12, color: darkMode ? '#90caf9' : '#1976d2', fontWeight: 600 }}>PREP</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedRecipe.fullRecipe.prepTime}</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 12, color: darkMode ? '#90caf9' : '#1976d2', fontWeight: 600 }}>COOK</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedRecipe.fullRecipe.cookTime}</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 12, color: darkMode ? '#90caf9' : '#1976d2', fontWeight: 600 }}>SERVES</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedRecipe.fullRecipe.servings}</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 12, color: darkMode ? '#90caf9' : '#1976d2', fontWeight: 600 }}>LEVEL</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedRecipe.fullRecipe.difficulty}</div>
                        </div>
                      </div>

                      <div style={{ color: darkMode ? '#ccc' : '#222', fontSize: 16, marginTop: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: darkMode ? '#90caf9' : '#1976d2', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🛒 Ingredients
                        </div>
                        <ul style={{ marginTop: 8, marginBottom: 20, paddingLeft: 20, lineHeight: 1.6 }}>
                          {selectedRecipe.fullRecipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>{ingredient}</li>
                          ))}
                        </ul>

                        <div style={{ fontSize: 18, fontWeight: 'bold', color: darkMode ? '#90caf9' : '#1976d2', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          👨‍🍳 Instructions
                        </div>
                        <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                          {selectedRecipe.fullRecipe.instructions.map((instruction, idx) => (
                            <li key={idx} style={{ marginBottom: 8, paddingLeft: 4 }}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: 18 }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 15,
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert('Ordering ingredients for this recipe! This would integrate with grocery delivery services like Instacart or Amazon Fresh.')}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🛒 Order Ingredients
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #ff7043 0%, #ff8a65 100%)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 15,
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(255, 112, 67, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert('Ordering prepared food! This would integrate with food delivery services like DoorDash, Uber Eats, or local restaurants.')}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🍽️ Order Food
                    </button>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '10px 18px',
                        borderRadius: 8,
                        background: darkMode ? '#90caf9' : '#1976d2',
                        color: darkMode ? '#222' : '#fff',
                        border: 'none',
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => setSelectedRecipe(null)}
                    >
                      ← Back to Recipes
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', minHeight: '100%' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '20px', marginTop: '0' }}>🍽️ AI Recipe Generator</h2>

                  {/* Quick tip about ingredients */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: '1px solid #e1bee7',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#4a148c', fontWeight: '500' }}>
                      🥬 Add ingredients via camera scanner or settings to get personalized recipes!
                    </p>
                  </div>

                  {/* AI Generated Recipes */}
                  <div>
                    <h3>Recommended Recipes:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                      {generateRecipes().map((recipe, idx) => (
                        <div key={idx} style={{
                          padding: '16px',
                          border: darkMode ? '1px solid #333' : '1px solid #ddd',
                          borderRadius: '12px',
                          backgroundColor: darkMode ? 'rgba(32,32,32,0.5)' : 'rgba(255,255,255,0.8)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          ':hover': { transform: 'translateY(-2px)' }
                        }}
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '18px',
                            marginBottom: '8px',
                            color: darkMode ? '#90caf9' : '#1976d2'
                          }}>
                            {recipe.name}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: darkMode ? '#bbb' : '#666',
                            marginBottom: '12px'
                          }}>
                            {recipe.description}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#4caf50',
                            fontWeight: 'bold'
                          }}>
                            ✨ Click to view full recipe & order options
                          </div>
                        </div>
                      ))}
                    </div>

                    {generateRecipes().length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Add more ingredients to get personalized recipe suggestions!
                        <br />
                        <span style={{ fontSize: '12px' }}>Use the camera scanner to quickly add ingredients.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "settings" && (
            <div className="settings-page" style={{ maxWidth: 520, margin: '32px auto', padding: 0, background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: 32, padding: '8px', background: 'rgba(248,250,252,0.6)', borderRadius: '16px', margin: '16px 16px 24px 16px' }}>
                <button
                  className="settings-nav-btn"
                  style={{
                    minWidth: 95,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: settingsTab === 'security' ? 600 : 400,
                    color: settingsTab === 'security' ? '#1976d2' : '#64748b',
                    border: settingsTab === 'security' ? '2px solid #1976d2' : '1px solid transparent',
                    borderRadius: 12,
                    background: settingsTab === 'security' ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: settingsTab === 'security' ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none'
                  }}
                  onClick={() => setSettingsTab('security')}
                >
                  🔒 Security
                </button>
                <button
                  className="settings-nav-btn"
                  style={{
                    minWidth: 115,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: settingsTab === 'personalization' ? 600 : 400,
                    color: settingsTab === 'personalization' ? '#1976d2' : '#64748b',
                    border: settingsTab === 'personalization' ? '2px solid #1976d2' : '1px solid transparent',
                    borderRadius: 12,
                    background: settingsTab === 'personalization' ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: settingsTab === 'personalization' ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none'
                  }}
                  onClick={() => setSettingsTab('personalization')}
                >
                  ✨ Personalization
                </button>
                <button
                  className="settings-nav-btn"
                  style={{
                    minWidth: 95,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: settingsTab === 'ingredients' ? 600 : 400,
                    color: settingsTab === 'ingredients' ? '#1976d2' : '#64748b',
                    border: settingsTab === 'ingredients' ? '2px solid #1976d2' : '1px solid transparent',
                    borderRadius: 12,
                    background: settingsTab === 'ingredients' ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: settingsTab === 'ingredients' ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none'
                  }}
                  onClick={() => setSettingsTab('ingredients')}
                >
                  🥬 Ingredients
                </button>
              </div>
              <div style={{ minHeight: 420, paddingBottom: 32 }}>
                {settingsTab === 'security' && <SettingsSecurity />}
                {settingsTab === 'personalization' && <SettingsPersonalization />}
                {settingsTab === 'ingredients' && <SettingsIngredients ingredients={storedIngredients} setIngredients={setStoredIngredients} />}
              </div>
            </div>
          )}
          <div className="bottom-bar">
            <BarIcon
              staticSrc={runPng}
              gifSrc={runGif}
              alt="Fitness"
              active={tab === "fitness"}
              onClick={() => setTab("fitness")}
              gifDuration={1200}
            />
            <BarIcon
              staticSrc={foodPng}
              gifSrc={foodGif}
              alt="Food"
              active={tab === "food"}
              onClick={() => setTab("food")}
              gifDuration={1200}
            />
            <BarIcon
              staticSrc={gearPng}
              gifSrc={gearGif}
              alt="Settings"
              active={tab === "settings"}
              onClick={() => setTab("settings")}
              gifDuration={1200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
