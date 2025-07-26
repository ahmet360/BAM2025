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
  // Hold-to-talk: start and stop recording on button events
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setVoiceActive(true);
      setRecordedAudioUrl(null);
      setAiAudioUrl(null);
      setRecordedAudioUrl(null);
      setAiAudioUrl(null);
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
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
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ message: text })
        });
        const { response } = await chatRes.json();
        // Text-to-speech
        const ttsRes = await fetch('http://localhost:8000/text-to-speech', {
          method: 'POST', headers: {'Content-Type':'application/json'},
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
  // Recipe of the Day component
  const recipes = [
    {
      name: "Grilled Lemon Chicken Salad",
      desc: "Tender grilled chicken breast on a bed of fresh greens, tossed with lemon vinaigrette and cherry tomatoes."
    },
    {
      name: "Spicy Chickpea Bowl",
      desc: "Roasted chickpeas, quinoa, avocado, and spicy tahini sauce for a protein-packed vegan meal."
    },
    {
      name: "Salmon & Asparagus Stir-Fry",
      desc: "Seared salmon fillet with garlic asparagus, bell peppers, and a light soy glaze."
    },
    {
      name: "Egg White Veggie Omelette",
      desc: "Fluffy egg whites with spinach, mushrooms, and feta cheese, served with whole grain toast."
    },
    {
      name: "Turkey Sweet Potato Skillet",
      desc: "Lean ground turkey sautéed with sweet potatoes, onions, and kale for a hearty one-pan dinner."
    }
  ];
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const recipeOfTheDay = selectedRecipe || recipes[Math.floor(Math.random() * recipes.length)];

  return (
    <div className="phone-outer" style={{ background: darkMode ? '#181a1b' : undefined }}>
      <div className="phone-bezel" style={{ background: darkMode ? '#222' : undefined, boxShadow: darkMode ? '0 12px 22px rgba(0,0,0,0.45)' : undefined }}>
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
                  <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <span>Camera and food analysis coming soon...</span>
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
                  <button
                    onClick={() => { setTalkModalOpen(false); setVoiceActive(false); }}
                    style={{ alignSelf: 'flex-end', margin: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1976d2' }}
                  >18595;</button>
                  <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Live Talk</h3>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <button
                      className="record-btn"
                      onClick={() => {
                        if (!voiceActive) startRecording();
                        else stopRecording();
                      }}
                    >
                      {voiceActive ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    {voiceActive && (
                      <div className="voice-bubble-container">
                        <div className="voice-bubble">
                          <div className="pulse"></div>
                        </div>
                      </div>
                    )}
                    {/* Playback Players */}
                    {recordedAudioUrl && (
                      <>
                        <audio controls src={recordedAudioUrl} style={{ marginTop: 12, width: '80%' }} />
                        {transcribedText && (
                          <div style={{ marginTop: 8, color: '#444', fontStyle: 'italic' }}>
                            Transcribed Text: {transcribedText}
                          </div>
                        )}
                      </>
                    )}
                    {aiAudioUrl && (
                      <audio controls src={aiAudioUrl} style={{ marginTop: 8, width: '80%' }} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "food" && (
            <div className="dummy-content">
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
                  <div style={{ fontWeight: 'bold', color: darkMode ? '#90caf9' : '#1976d2', fontSize: 22, marginBottom: 10 }}>
                    🍽️ {selectedRecipe.name}
                  </div>
                  <div style={{ color: darkMode ? '#bbb' : '#444', fontSize: 17, marginBottom: 12 }}>{selectedRecipe.desc}</div>
                  <div style={{ color: darkMode ? '#ccc' : '#222', fontSize: 16, marginTop: 10 }}>
                    <strong>Full Recipe:</strong>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                      {/* Example steps for demo purposes */}
                      {selectedRecipe.name === "Grilled Lemon Chicken Salad" && [
                        <li key="1">Grill chicken breast with salt, pepper, and lemon juice.</li>,
                        <li key="2">Toss mixed greens, cherry tomatoes, and cucumber in a bowl.</li>,
                        <li key="3">Slice chicken and place on salad. Drizzle with lemon vinaigrette.</li>
                      ]}
                      {selectedRecipe.name === "Spicy Chickpea Bowl" && [
                        <li key="1">Roast chickpeas with paprika and olive oil.</li>,
                        <li key="2">Cook quinoa and slice avocado.</li>,
                        <li key="3">Assemble bowl and top with spicy tahini sauce.</li>
                      ]}
                      {selectedRecipe.name === "Salmon & Asparagus Stir-Fry" && [
                        <li key="1">Sear salmon fillet in a pan.</li>,
                        <li key="2">Stir-fry asparagus and bell peppers with garlic.</li>,
                        <li key="3">Add salmon and glaze with light soy sauce.</li>
                      ]}
                      {selectedRecipe.name === "Egg White Veggie Omelette" && [
                        <li key="1">Whisk egg whites and pour into a hot pan.</li>,
                        <li key="2">Add spinach, mushrooms, and feta cheese.</li>,
                        <li key="3">Fold omelette and serve with whole grain toast.</li>
                      ]}
                      {selectedRecipe.name === "Turkey Sweet Potato Skillet" && [
                        <li key="1">Sauté ground turkey with onions.</li>,
                        <li key="2">Add diced sweet potatoes and kale.</li>,
                        <li key="3">Cook until sweet potatoes are tender.</li>
                      ]}
                    </ul>
                  </div>
                  <button
                    style={{ marginTop: 18, padding: '8px 18px', borderRadius: 8, background: darkMode ? '#90caf9' : '#1976d2', color: darkMode ? '#222' : '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}
                    onClick={() => setSelectedRecipe(null)}
                  >Back to Dashboard</button>
                </div>
              ) : (
                <>
                  <h2>Food (Coming Soon)</h2>
                  <p>Nutrition logging and tips will appear here.</p>
                </>
              )}
            </div>
          )}
          {tab === "settings" && (
            <div className="settings-page" style={{ maxWidth: 520, margin: '32px auto', padding: 0, background: '#fff', borderRadius: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.13)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: 24 }}>
                <button
                  className="settings-btn"
                  style={{ transform: 'translateX(-13.6rem)', minWidth: 90, padding: '7px 10px', fontSize: 14, fontWeight: 400, color: '#333', border: '1px solid #ccc', borderRadius: 12 }}
                  onClick={() => setSettingsTab('security')}
                >Security</button>
                <button
                  className="settings-btn"
                  style={{ minWidth: 90, padding: '7px 10px', fontSize: 14, fontWeight: 700, color: '#1976d2', border: '2px solid #1976d2', borderRadius: 12, background: '#e3f2fd' }}
                  onClick={() => setSettingsTab('personalization')}
                >Personalization</button>
                <button
                  className="settings-btn"
                  style={{ transform: 'translateX(-8rem)', minWidth: 90, padding: '7px 10px', fontSize: 14, fontWeight: 400, color: '#333', border: '1px solid #ccc', borderRadius: 12 }}
                  onClick={() => setSettingsTab('ingredients')}
                >Ingredients</button>
              </div>
              <div style={{ minHeight: 420, paddingBottom: 32 }}>
                {settingsTab === 'security' && <SettingsSecurity />}
                {settingsTab === 'personalization' && <SettingsPersonalization />}
                {settingsTab === 'ingredients' && <SettingsIngredients />}
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
