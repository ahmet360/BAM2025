import React, { useState } from "react";
import ChatBox from "./components/ChatBox";
import "./styles.css";
import runPng from "./assets/run.png";
import runGif from "./assets/run.gif";
import foodPng from "./assets/food.png";
import foodGif from "./assets/food.gif";
import gearPng from "./assets/gear.png";
import gearGif from "./assets/gear.gif";
import maoFullSvg from "./assets/mao_full.svg";
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
        style={
          showGif
            ? { width: 40, height: 40, transition: 'width 0.18s, height 0.18s' }
            : { width: 28, height: 28, transition: 'width 0.18s, height 0.18s' }
        }
      />
    </button>
  );
}

const demoScores = {
  chest: 80,
  back: 60,
  quads: 35,
  hamstrings: 50,
  glutes: 90,
  core: 70,
  arms: 45,
};
const demoRecommended = ["glutes"];

export default function App() {
  const [tab, setTab] = useState("fitness");
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [talkModalOpen, setTalkModalOpen] = useState(false);
  return (
    <div className="phone-outer">
      <div className="phone-bezel">
        <div className="phone-notch" />
        <div className="phone-inner" style={{ position: 'relative', overflow: 'hidden' }}>
          {tab === "fitness" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 12, padding: "12px 0 0 0" }}>
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
                  <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Chat</h3>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <ChatBox />
                  </div>
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
                  <button onClick={() => setTalkModalOpen(false)} style={{ alignSelf: 'flex-end', margin: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1976d2' }}>&#8595;</button>
                  <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Live Talk</h3>
                  <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <span>Voice interaction coming soon...</span>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "food" && (
            <div className="dummy-content">
              <h2>Food (Coming Soon)</h2>
              <p>Nutrition logging and tips will appear here.</p>
            </div>
          )}
          {tab === "settings" && (
            <div className="settings-page">
              <h3>Settings</h3>
              <label>
                <input type="checkbox" disabled /> Dark mode (coming soon)
              </label>
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
