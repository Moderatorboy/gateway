// ===============================================================
// CODExTRMS - TRMS_AI Doubt Section (Upgraded Premium Version - Fixed)
// ===============================================================

(function initDoubt() {
  const target = document.getElementById("doubt-section");
  if (!target) return;

  const style = document.createElement("style");
  style.textContent = `
    #doubt-section {
      display: none;
      flex-direction: column;
      height: calc(100vh - 58px - 60px);
      overflow: hidden;
      background: #0d1117;
      font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #doubt-section.ds-active { display: flex; }

    .ds-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .ds-chat {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      scroll-behavior: smooth;
    }
    .ds-chat::-webkit-scrollbar { display: none; }
    .ds-chat { scrollbar-width: none; }

    .ds-bot-row { display: flex; gap: 10px; align-items: flex-start; }
    .ds-av {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #00d4b4, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,212,180,0.2);
    }
    .ds-bubble {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 0px 16px 16px 16px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.92);
      font-size: 14px; line-height: 1.6;
      max-width: 80%; white-space: pre-wrap; word-break: break-word;
      letter-spacing: 0.3px;
      position: relative;
    }
    .ds-user-row { display: flex; justify-content: flex-end; }
    .ds-user-row .ds-bubble {
      background: linear-gradient(135deg, rgba(0,212,180,0.12), rgba(168,85,247,0.12));
      border-color: rgba(168,85,247,0.25);
      border-radius: 16px 0px 16px 16px;
    }
    
    .ds-bubble code {
      background: rgba(0, 0, 0, 0.4);
      padding: 2px 6px; border-radius: 4px;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 13px; color: #00d4b4;
    }
    .ds-bubble pre {
      background: #05070a; border: 1px solid rgba(255,255,255,0.05);
      padding: 12px; border-radius: 8px; overflow-x: auto;
      margin: 8px 0; font-family: 'Fira Code', monospace; font-size: 13px;
      position: relative;
    }
    .ds-copy-btn {
      position: absolute; top: 6px; right: 6px;
      background: rgba(255,255,255,0.08); border: none;
      color: rgba(255,255,255,0.6); padding: 3px 8px;
      font-size: 11px; border-radius: 4px; cursor: pointer;
    }
    .ds-copy-btn:hover { background: #00d4b4; color: #000; }

    .ds-chips {
      display: flex; gap: 8px; padding: 8px 16px;
      overflow-x: auto; flex-wrap: nowrap; flex-shrink: 0;
    }
    .ds-chips::-webkit-scrollbar { display: none; }
    .ds-chip {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.65); font-size: 12.5px;
      padding: 6px 14px; border-radius: 20px;
      cursor: pointer; white-space: nowrap; transition: all 0.2s ease;
    }
    .ds-chip:hover { border-color: #00d4b4; color: #00d4b4; background: rgba(0,212,180,0.04); }

    .ds-voice-bar {
      display: none; padding: 10px 16px;
      background: rgba(239,68,68,0.05);
      border-top: 1px solid rgba(239,68,68,0.15);
      align-items: center; gap: 10px; flex-shrink: 0;
    }
    .ds-voice-bar.on { display: flex; }
    .ds-vwaves { display: flex; align-items: center; gap: 3.5px; flex: 1; }
    .ds-vwaves span {
      display: block; width: 3px; border-radius: 2px;
      background: #ef4444; animation: dsvw .7s ease-in-out infinite;
    }
    .ds-vwaves span:nth-child(1){height:6px;}
    .ds-vwaves span:nth-child(2){height:14px;animation-delay:.1s;}
    .ds-vwaves span:nth-child(3){height:22px;animation-delay:.2s;}
    .ds-vwaves span:nth-child(4){height:12px;animation-delay:.3s;}
    .ds-vwaves span:nth-child(5){height:6px;animation-delay:.4s;}
    @keyframes dsvw { 0%,100% {transform:scaleY(.6);} 50% {transform:scaleY(1.3);} }
    .ds-vtimer { font-size: 13px; color: #ef4444; font-weight: 500; }
    .ds-vstop {
      background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.25);
      color: #ef4444; font-size: 12px; padding: 5px 14px; border-radius: 20px; cursor: pointer;
    }

    .ds-inputbar {
      flex-shrink: 0;
      display: flex; align-items: flex-end; gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: #0d1117;
    }
    .ds-inputwrap {
      flex: 1; min-width: 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px; display: flex; align-items: flex-end;
      padding: 8px 14px; gap: 10px;
    }
    .ds-inputwrap:focus-within { border-color: rgba(0,212,180,0.4); background: rgba(255,255,255,0.06); }
    .ds-textarea {
      flex: 1; min-width: 0; background: transparent; border: none; outline: none;
      color: rgba(255,255,255,0.95); font-size: 14.5px;
      font-family: inherit; resize: none;
      max-height: 90px; line-height: 1.5;
    }
    .ds-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .ds-micbtn {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.06); border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.6); flex-shrink: 0; transition: all 0.2s;
    }
    .ds-micbtn.rec { background: rgba(239,68,68,0.2); color: #ef4444; animation: dsrp 1.2s infinite; }
    @keyframes dsrp { 0%,100% {box-shadow:0 0 0 0 rgba(239,68,68,.3);} 50% {box-shadow:0 0 0 6px rgba(239,68,68,0);} }
    
    .ds-sendbtn {
      width: 40px; height: 40px; flex-shrink: 0;
      background: linear-gradient(135deg, #00d4b4, #a855f7);
      border: none; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,212,180,0.15);
    }
    .ds-sendbtn:hover { opacity: .9; transform: scale(1.02); }
    .ds-typing { display: flex; gap: 5px; align-items: center; padding: 4px 0; }
    .ds-typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00d4b4; animation: dsbl 1.4s infinite both;
    }
    .ds-typing span:nth-child(2){animation-delay:.2s;}
    .ds-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes dsbl { 0%,80%,100% {opacity:.2;} 40% {opacity:1;} }
  `;
  document.head.appendChild(style);

  // Global actions map for chips window target context scoping
  window.dsFill = function (text) {
    const inp = document.getElementById("dsInput");
    if (!inp) return;
    inp.value = text;
    dsResize(inp);
    inp.focus();
  };

  window.dsResize = function (el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 90) + "px";
  };

  target.innerHTML = `
    <div class="ds-header">
      <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);letter-spacing:0.5px;">CODExTRMS AI</span>
      <span style="background:rgba(0,212,180,0.1);border:1px solid rgba(0,212,180,0.25);color:#00d4b4;font-size:11px;padding:3px 12px;border-radius:20px;font-weight:500;">Doubt Assistant</span>
    </div>

    <div class="ds-chat" id="dsChat">
      <div class="ds-bot-row">
        <div class="ds-av">AI</div>
        <div class="ds-bubble">Hello, main aapka coding assistant hoon. Apna doubt yahan type kijiye ya voice note ke zariye poochiye.</div>
      </div>
    </div>

    <div class="ds-chips">
      <span class="ds-chip" onclick="dsFill('Array aur Linked List mein basic difference kya hai?')">Array vs List</span>
      <span class="ds-chip" onclick="dsFill('Recursion process deep mein kaise kaam karta hai?')">Recursion</span>
      <span class="ds-chip" onclick="dsFill('Big O Notation ko simple language mein samjhao')">Big O Notation</span>
      <span class="ds-chip" onclick="dsFill('REST API kya hota hai aur iska use kyun karte hain?')">REST API</span>
      <span class="ds-chip" onclick="dsFill('Git aur GitHub ke beech ka main difference batao')">Git vs GitHub</span>
    </div>

    <div class="ds-voice-bar" id="dsVoiceBar">
      <div class="ds-vwaves"><span></span><span></span><span></span><span></span><span></span></div>
      <span class="ds-vtimer" id="dsVTimer">0:00</span>
      <button class="ds-vstop" onclick="dsStopVoice()">Send ✓</button>
    </div>

    <div class="ds-inputbar">
      <div class="ds-inputwrap">
        <textarea class="ds-textarea" id="dsInput" placeholder="Apna technical doubt poochhein..." rows="1"
          oninput="dsResize(this)"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();dsSend();}"></textarea>
        <button class="ds-micbtn" id="dsMicBtn" onclick="dsToggleVoice()" title="Voice Typing">
          <i class="fas fa-microphone" style="font-size:13px;"></i>
        </button>
      </div>
      <button class="ds-sendbtn" onclick="dsSend()">
        <i class="fas fa-paper-plane" style="font-size:14px;color:#fff;"></i>
      </button>
    </div>
  `;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.section === "testsSection") {
        target.classList.add("ds-active");
        dsScrollToBottom();
      } else {
        target.classList.remove("ds-active");
      }
    });
  });

  const activeNav = document.querySelector(".nav-item.active");
  if (activeNav && activeNav.dataset.section === "testsSection") {
    target.classList.add("ds-active");
    dsScrollToBottom();
  }
})();

/* ──────────────────────────────────────
    CORE LOGIC & UTILITIES
────────────────────────────────────── */
let dsRec = false,
  dsVInt = null,
  dsVSec = 0;
let dsChatHistory = [];

function dsScrollToBottom() {
  const chat = document.getElementById("dsChat");
  if (chat) {
    setTimeout(() => {
      chat.scrollTop = chat.scrollHeight;
    }, 50);
  }
}

// Custom Markdown parsing safe implementation for code syntax blocks rendering
function parseMarkdown(text) {
  // Safe HTML Escaping to prevent XSS injection injections
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Multi-line code block parser (\`\`\`javascript ... \`\`\`)
  escaped = escaped.replace(
    /\`\`\`(?:[a-zA-Z]+)?\n([\s\S]*?)\`\`\`/g,
    function (match, code) {
      return `<pre><code>${code.trim()}</code><button class="ds-copy-btn" onclick="dsCopyCode(this)">Copy</button></pre>`;
    },
  );

  // Inline code snippets configuration (\`code\`)
  escaped = escaped.replace(/\`([^`]+)\`/g, "<code>$1</code>");
  return escaped;
}

window.dsCopyCode = function (btn) {
  const codeNode = btn.previousElementSibling;
  if (!codeNode) return;
  navigator.clipboard.writeText(codeNode.textContent).then(() => {
    const originalText = btn.textContent;
    btn.textContent = "Copied!";
    btn.style.background = "#00d4b4";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 2000);
  });
};

window.dsAddMsg = function (role, text) {
  const chat = document.getElementById("dsChat");
  if (!chat) return;
  const div = document.createElement("div");
  div.className = role === "user" ? "ds-user-row" : "ds-bot-row";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "ds-bubble";

  if (role === "user") {
    // User validation - rendering as raw text safely
    bubbleDiv.textContent = text;
    div.appendChild(bubbleDiv);
  } else {
    // AI Content - Rich HTML parsing for markdown blocks styling alignment
    bubbleDiv.innerHTML = parseMarkdown(text);
    div.innerHTML = `<div class="ds-av">AI</div>`;
    div.appendChild(bubbleDiv);
  }

  chat.appendChild(div);
  dsScrollToBottom();
};

window.dsShowTyping = function () {
  const chat = document.getElementById("dsChat");
  if (!chat) return;

  // Cleanup duplicates safely
  const oldTyping = document.getElementById("dsTyping");
  if (oldTyping) oldTyping.remove();

  const d = document.createElement("div");
  d.className = "ds-bot-row";
  d.id = "dsTyping";
  d.innerHTML = `<div class="ds-av">AI</div><div class="ds-bubble"><div class="ds-typing"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(d);
  dsScrollToBottom();
};

window.dsAskAI = async function (doubtText) {
  dsShowTyping();

  const sysMsg = {
    role: "system",
    content:
      "Tu CODExTRMS platform ka expert AI tutor hai. Har programming topic ko clear, structural Hinglish mein samjhao. Lambe arrays ya parameters ko subpoints ya custom code snippet format mein organize karo. Emojis ka use bohot limited karo (poore message mein maximum 1 ya 2 hi use hone chahiye, har line mein nahi). Punctuation aur commas ka clean visual format rakho.",
  };

  dsChatHistory.push({ role: "user", content: doubtText });
  const recentHistory = dsChatHistory.slice(-10);

  try {
    const res = await fetch("/api/vercel-gemini-handler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [sysMsg, ...recentHistory],
      }),
    });

    const data = await res.json();
    const typingEl = document.getElementById("dsTyping");
    if (typingEl) typingEl.remove();

    if (data.error) {
      dsAddMsg("bot", "❌ Server se technical issue aa raha hai.");
      return;
    }

    let reply =
      data.answer ||
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content);

    if (!reply) {
      reply =
        "Mujhe iska data context generate karne mein dikkat ho rahi hai. Kripya naya sawal poochein.";
    }

    dsChatHistory.push({ role: "assistant", content: reply });
    dsAddMsg("bot", reply);
  } catch (err) {
    const typingEl = document.getElementById("dsTyping");
    if (typingEl) typingEl.remove();
    dsAddMsg(
      "bot",
      "🚨 Network validation failed! Internet connection check kijiye.",
    );
  }
};

window.dsSend = function () {
  const inp = document.getElementById("dsInput");
  const text = inp ? inp.value.trim() : "";

  if (!text) return;

  dsAddMsg("user", text);
  dsAskAI(text);

  if (inp) {
    inp.value = "";
    dsResize(inp);
  }
};

/* VOICE LOGIC COMPONENT (Web Speech API Wrapper Setup) */
window.dsToggleVoice = function () {
  dsRec ? dsStopVoice() : dsStartVoice();
};

window.dsStartVoice = function () {
  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const inp = document.getElementById("dsInput");
      if (inp && transcript.trim()) {
        inp.value = transcript;
        dsResize(inp);
        // Instant trigger handling after voice recognition processing
        dsSend();
      }
    };
    recognition.onerror = () => dsStopVoiceUI();
    recognition.onend = () => dsStopVoiceUI();

    recognition.start();
    window._dsRecognition = recognition;
    dsStartVoiceUI();
  } else {
    alert("Voice typing is not supported in this browser.");
  }
};

function dsStartVoiceUI() {
  dsRec = true;
  dsVSec = 0;
  const micBtn = document.getElementById("dsMicBtn");
  const voiceBar = document.getElementById("dsVoiceBar");
  if (micBtn) micBtn.classList.add("rec");
  if (voiceBar) voiceBar.classList.add("on");

  if (dsVInt) clearInterval(dsVInt);
  dsVInt = setInterval(() => {
    dsVSec++;
    const m = Math.floor(dsVSec / 60),
      s = dsVSec % 60;
    const timer = document.getElementById("dsVTimer");
    if (timer) timer.textContent = m + ":" + (s < 10 ? "0" : "") + s;
  }, 1000);
}

function dsStopVoiceUI() {
  dsRec = false;
  clearInterval(dsVInt);
  const micBtn = document.getElementById("dsMicBtn");
  const voiceBar = document.getElementById("dsVoiceBar");
  if (micBtn) micBtn.classList.remove("rec");
  if (voiceBar) voiceBar.classList.remove("on");
  const timer = document.getElementById("dsVTimer");
  if (timer) timer.textContent = "0:00";
}

window.dsStopVoice = function () {
  if (window._dsRecognition) {
    try {
      window._dsRecognition.stop();
    } catch (e) {}
  }
  dsStopVoiceUI();
  dsVSec = 0;
};
