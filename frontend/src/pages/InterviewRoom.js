import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedQuestions = JSON.parse(localStorage.getItem("questions"));
  const questions = location.state?.questions || storedQuestions || [];

  // PHASES: "intro", "ready_check", "interview", "prompt_next"
  const [phase, setPhase] = useState("intro");
  
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [loading, setLoading] = useState(true);

  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  const [aiSubtitle, setAiSubtitle] = useState("");
  const [userSubtitle, setUserSubtitle] = useState("");
  
  const [silenceEvents, setSilenceEvents] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [isDifficultyAdjusting, setIsDifficultyAdjusting] = useState(false);
  const [hasAdjustedDifficulty, setHasAdjustedDifficulty] = useState(false);

  const micOnRef = useRef(true);

  // Vision AI States
  const [visionModelsLoaded, setVisionModelsLoaded] = useState(false);
  const [emotionScoreAgg, setEmotionScoreAgg] = useState(0);
  const [emotionSamples, setEmotionSamples] = useState(0);
  const [headPenalty, setHeadPenalty] = useState(0);

  // Advanced AI Proctoring States
  const [multiPersonWarning, setMultiPersonWarning] = useState(false);
  const [audioWarning, setAudioWarning] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const [guestReport, setGuestReport] = useState(null);
  const liveAnswerRef = useRef("");

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);

  const currentQuestion = 
    phase === "interview" || phase === "prompt_next" 
      ? questions[questionIndex] 
      : (phase === "intro" ? "Ensuring optimal environment..." : "Are you ready to begin?");

  /* ------------------------
     LOADING SCREEN
  ------------------------- */
  useEffect(() => {
    if (questions.length > 0) {
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }
  }, [questions]);

  /* ------------------------
     ANTI-CHEAT: TAB / BACK BUTTON PROCTORING
  ------------------------- */
  useEffect(() => {
    // 1. Prevent back/forward navigation
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
      alert("⚠️ Proctoring Alert: Navigation is locked during the active interview session.");
    };
    window.addEventListener("popstate", handlePopState);

    // 2. Prevent Tab Switching (Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarning(true);
        setHeadPenalty(prev => prev + 10); // Critical Cheating Penalty
        
        // Stop audio immediately if they switch tabs
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Block Copy, Paste, Context Menu natively
    const preventAction = (e) => e.preventDefault();
    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
    };
  }, []);

  /* ------------------------
     VISION AI (FACE-API) LOADER
  ------------------------- */
  useEffect(() => {
    // Inject FaceAPI via official jsdelivr to bypass potential local npm failures safely
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;
    script.onload = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setVisionModelsLoaded(true);
        console.log("Vision AI Logic Engaged seamlessly!");
      } catch (err) {
        console.warn("Vision AI failed to load weights:", err);
      }
    };
    document.body.appendChild(script);

  }, []);

  /* ------------------------
     VISION AI TRACKING LOOP
  ------------------------- */
  useEffect(() => {
    if (!visionModelsLoaded || !cameraOn || !videoRef.current) return;

    const interval = setInterval(async () => {
      const videoEl = videoRef.current;
      if (videoEl.paused || videoEl.ended) return;

      // 1. ADVANCED MULTI-FACE DETECTION
      const detections = await window.faceapi
        .detectAllFaces(videoEl, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 1) {
          setMultiPersonWarning(true);
          setHeadPenalty(prev => prev + 2); // Heavy Penalty
      } else {
          setMultiPersonWarning(false);
      }

      if (detections.length === 1) {
        const detection = detections[0];
        const exps = detection.expressions;
        // Aggressive mapping logic: Joy/Neutral -> High Focus. Fear/Angry/Sad/Disgust -> Low Focus.
        let frameScore = 5;
        if (exps.happy > 0.4 || exps.neutral > 0.5) frameScore += 2;
        if (exps.fearful > 0.3 || exps.angry > 0.3 || exps.sad > 0.3) frameScore -= 3;
        
        setEmotionScoreAgg(prev => prev + frameScore);
        setEmotionSamples(prev => prev + 1);

        // Erratic Head Movement check
        const nose = detection.landmarks.getNose()[0];
        const box = detection.detection.box;
        const centerX = box.x + box.width / 2;
        const offset = Math.abs(nose.x - centerX);
        
        if (offset > box.width * 0.3) {
           setHeadPenalty(prev => prev + 1);
        }
      }

      // BACKGROUND NOISE / SECONDARY VOICE DETECTION
      if (analyserRef.current) {
         const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
         analyserRef.current.getByteFrequencyData(dataArray);
         // Calculate average volume
         let sum = 0;
         for(let i=0; i<dataArray.length; i++) {
           sum += dataArray[i];
         }
         const avgVolume = sum / dataArray.length;
         
         // If AI isn't speaking and user isn't expected to be speaking OR if volume is extremely abnormal consistently
         // Standardize a threshold to check for loud abrupt interruptions globally
         if (avgVolume > 60 && isAiSpeaking) {
             setAudioWarning(true);
             setHeadPenalty(prev => prev + 0.5); // Minor penalty for noise during instructions
         } else {
             setAudioWarning(false);
         }
      }

    }, 1500); // 1.5s interval to ensure buttery smooth browser performance

    return () => clearInterval(interval);
  }, [visionModelsLoaded, cameraOn, isAiSpeaking]);

  /* ------------------------
     CAMERA
  ------------------------- */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Video Play Error:", e));
        }

        // Initialize AudioContext for Background Noise Proctoring
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
        } catch(err) {
          console.warn("AudioContext setup failed:", err);
        }

      })
      .catch((err) => console.log("Camera error:", err));
      
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const streams = videoRef.current.srcObject.getTracks();
      streams.forEach(track => {
        if (track.kind === 'video') {
          track.enabled = !cameraOn;
        }
      });
      setCameraOn(!cameraOn);
    }
  };

  const toggleMic = () => {
    setMicOn(prev => {
      micOnRef.current = !prev;
      return !prev;
    });
  };

  /* ------------------------
     AI VOICE
  ------------------------- */
  const speak = (text, onEndCallback = null) => {
    setIsAiSpeaking(true);
    setAiSubtitle(text);
    window.speechSynthesis.cancel(); // Cancel any ongoing speech immediately

    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1.05;
    speech.pitch = 1;
    speech.onend = () => {
      setIsAiSpeaking(false);
      setAiSubtitle("");
      if (onEndCallback) onEndCallback();
    };
    speech.onerror = () => {
      setIsAiSpeaking(false);
      setAiSubtitle("");
      if (onEndCallback) onEndCallback();
    };

    // Slight delay ensures the browser's speech-engine .cancel() has time to clear
    setTimeout(() => {
      window.speechSynthesis.speak(speech);
    }, 100);
  };

  const encourageCandidate = () => {
    setSilenceEvents(prev => prev + 1);
    speak("Take your time. If you don't know the answer, say skip and we will move forward.");
  };

  /* ------------------------
     INTRO PHASE LOGIC
  ------------------------- */
  useEffect(() => {
    if (loading) return;

    if (phase === "intro") {
      speak(
        "Please sit in a quiet room, use your earphones, and speak clearly. Be confident. We are evaluating your verbal and technical skills. Take a deep breath. Are you ready to begin?", 
        () => {
          setPhase("ready_check"); 
        }
      );
    }
  }, [loading, phase]);

  const nextQuestion = () => {
    if (questionIndex + 1 < questions.length) {
      const next = questionIndex + 1;
      setQuestionIndex(next);
      liveAnswerRef.current = "";
      speak(questions[next]);
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        encourageCandidate();
      }, 15000);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    speak("Interview concluded. Generating your professional report. You will be redirected shortly.");
    try {
      const finalEmotionScore = emotionSamples > 0 
        ? Math.max(1, Math.min(10, Math.round((emotionScoreAgg / emotionSamples) * (10/7)))) 
        : 0;

      const isGuest = localStorage.getItem("isGuest") === "true";
      const userStorage = JSON.parse(localStorage.getItem("user"));

      const isFullyCompleted = answers.length === questions.length && answers.every(a => a && a !== "[Manually Skipped]");

      const res = await fetch(`${API_BASE}/send_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isGuest ? null : userStorage?.email,
          answers: answers,
          questions: questions,
          stress_count: silenceEvents,
          adjusted_difficulty: hasAdjustedDifficulty,
          emotion_score: finalEmotionScore,
          head_penalty: headPenalty,
          interview_completed: isFullyCompleted
        })
      });

      const data = await res.json();

      if (isGuest) {
          setGuestReport(data.report_data);
      } else {
          navigate("/dashboard");
      }
    } catch (err) {
      console.log(err);
      navigate("/dashboard");
    }
  };

  /* ------------------------
     SPEECH RECOGNITION
  ------------------------- */
  useEffect(() => {
    if (!questions.length || loading) return;
    if (phase === "intro") return; 

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      if (!micOnRef.current) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setUserSubtitle(interimTranscript || finalTranscript);

      if (!finalTranscript) return;

      clearTimeout(silenceTimer.current);
      const transcript = finalTranscript.toLowerCase().trim();
      console.log("User said:", transcript);

      // READY CHECK PHASE
      if (phase === "ready_check") {
        if (/yes|ready|start|yeah|sure|okay|begin/i.test(transcript)) {
          setPhase("interview");
          speak("Excellent. Let's begin. " + questions[0]);
          clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => encourageCandidate(), 15000);
        } else if (/no|wait|not ready/i.test(transcript)) {
          speak("Take a deep breath. Be confident, you will do great. Let me know when you are ready.");
        }
        return;
      }

      // INTERVENTION LOGIC
      if (isDifficultyAdjusting) {
        if (/yes|yeah|sure|okay/i.test(transcript)) {
          speak("Adjusting to fundamental concepts. Please wait...");
          setIsDifficultyAdjusting(false);
          setSkipCount(0);
          setHasAdjustedDifficulty(true);
          
          fetch(`${API_BASE}/generate-easier-questions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ skills: "core fundamental concepts from previous scope" })
          })
          .then(res => res.json())
          .then(data => {
            if(!data.error) {
              const newQs = [...questions];
              newQs.splice(questionIndex + 1, newQs.length, ...data.questions);
              localStorage.setItem("questions", JSON.stringify(newQs));
              window.location.reload(); 
            }
          })
          .catch(err => console.log(err));
          return;
        } else if (/no|nah|continue/i.test(transcript)) {
          speak("Understood. Moving forward.");
          setIsDifficultyAdjusting(false);
          setSkipCount(0);
          nextQuestion();
          return;
        }
      }

      // NORMAL SKIP LOGIC (At any point)
      if (/don't know|dont know|do not know|skip|next question/i.test(transcript)) {
        const newSkipCount = skipCount + 1;
        setSkipCount(newSkipCount);

        if (newSkipCount === 3 && !hasAdjustedDifficulty) {
          setIsDifficultyAdjusting(true);
          speak("I noticed you skipped a few questions. Would you like me to adjust the difficulty and ask easier foundational questions instead?");
          return;
        }

        setPhase("interview");
        liveAnswerRef.current = "[Manually Skipped]";
        setAnswers((prev) => {
          const newAnswers = [...prev];
          newAnswers[questionIndex] = liveAnswerRef.current;
          return newAnswers;
        });
        nextQuestion();
        return;
      }

      // PROMPT NEXT PHASE
      if (phase === "prompt_next") {
        if (/yes|yeah|sure|okay|move|go ahead/i.test(transcript)) {
           setPhase("interview");
           nextQuestion();
        } else if (/no|wait|not yet|hold on/i.test(transcript)) {
           setPhase("interview");
           speak("Take your time.");
           silenceTimer.current = setTimeout(() => {
             setPhase("prompt_next");
             speak("Shall we move to the next question?");
           }, 8000);
        } else {
           // User gave more answer context instead
           setPhase("interview");
           setAnswers((prev) => {
             const newAnswers = [...prev];
             if (!newAnswers[questionIndex]) newAnswers[questionIndex] = transcript;
             else newAnswers[questionIndex] += ". " + transcript;
             return newAnswers;
           });
           silenceTimer.current = setTimeout(() => {
             setPhase("prompt_next");
             speak("Shall we move to the next question?");
           }, 7000);
        }
        return;
      }

      // NORMAL ANSWER LOGIC (phase === "interview")
      setAnswers((prev) => {
        const newAnswers = [...prev];
        if (!newAnswers[questionIndex]) newAnswers[questionIndex] = transcript;
        else newAnswers[questionIndex] += ". " + transcript;
        liveAnswerRef.current = newAnswers[questionIndex];
        return newAnswers;
      });

      // Silence detection to prompt moving to the next question smoothly / Evaluate Live
      silenceTimer.current = setTimeout(async () => {
        // Only interrupt if AI is not already speaking
        if (!isAiSpeaking && phase === "interview" && liveAnswerRef.current) {
          setPhase("evaluating");
          setIsAiSpeaking(true); // Triggers Orb thinking pulse
          
          try {
             const res = await fetch(`${API_BASE}/evaluate-answer-live`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: questions[questionIndex], answer: liveAnswerRef.current })
             });
             const evaluation = await res.json();
             
             if (evaluation.status === "irrelevant") {
                 liveAnswerRef.current = "";
                 setAnswers(prev => { const n = [...prev]; n[questionIndex] = ""; return n; });
                 speak("That seems irrelevant. " + evaluation.feedback + " Could you please provide a direct technical response?");
                 setPhase("interview");
             } else if (evaluation.status === "skipped") {
                 const newSkipCount = skipCount + 1;
                 setSkipCount(newSkipCount);
                 if (newSkipCount === 3 && !hasAdjustedDifficulty) {
                   setIsDifficultyAdjusting(true);
                   speak("I noticed you are struggling. Would you like me to adjust the difficulty to foundational questions?");
                   return;
                 }
                 liveAnswerRef.current = "[Skipped]";
                 setAnswers(prev => { const n = [...prev]; n[questionIndex] = liveAnswerRef.current; return n; });
                 speak("No problem. Let's skip to the next question.");
                 nextQuestion();
                 setPhase("interview");
             } else {
                 speak("Got it. Shall we move to the next question?");
                 setPhase("prompt_next");
             }
          } catch (e) {
             console.error("Live Evaluation Error:", e);
             speak("Got it. Shall we move to the next question?");
             setPhase("prompt_next");
          }
        } else if (!isAiSpeaking && phase === "prompt_next") {
             speak("Shall we move to the next question?");
        }
      }, 3500); // Wait 3.5s of silence before hitting Evaluation Engine

    };

    recognition.onspeechstart = () => setIsUserSpeaking(true);
    recognition.onspeechend = () => {
       setIsUserSpeaking(false);
       setTimeout(() => setUserSubtitle(""), 2000); // Clear subtitle after 2 seconds of silence
    };

    recognition.start();
    recognitionRef.current = recognition;

    // Start initial encourage timer if nothing has been spoken at all
    if (phase === "interview") {
        silenceTimer.current = setTimeout(() => {
          if (!isAiSpeaking) encourageCandidate();
        }, 12000); // Smoother wait time
    }

    return () => recognition.stop();

  }, [phase, questionIndex, questions, loading, isDifficultyAdjusting, hasAdjustedDifficulty, skipCount]);


  if (!questions.length) {
    return (
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        No interview questions found. Please upload resume again.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "22px" }}>
        Preparing your AI interview...
      </div>
    );
  }

  if (guestReport) {
    return (
      <div className="interview-container layout-v2" style={{ padding: "40px", textAlign: "center", color: "#fff", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflowY: "auto" }}>
        <div style={{ background: "#0b1221", padding: "40px", borderRadius: "16px", border: "1px solid #1e293b", maxWidth: "700px", width: "100%" }}>
          <h1 style={{ color: "#00c8ff", marginBottom: "10px" }}>Sandbox Complete 🚀</h1>
          <p style={{ color: "#94a3b8", marginBottom: "30px" }}>Here is your instant AI-generated performance breakdown.</p>
          
          <h2 style={{ color: "#f8fafc", fontSize: "48px", marginBottom: "30px" }}>Score: <span style={{ color: "#00ff9d" }}>{guestReport.score}/10</span></h2>
          
          <div style={{ background: "#0f172a", padding: "25px", borderRadius: "10px", textAlign: "left", marginBottom: "40px", borderLeft: "4px solid #00c8ff" }}>
            <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Areas to Improve:</h3>
            <ul style={{ color: "#cbd5e1", lineHeight: "1.8", paddingLeft: "20px" }}>
              {guestReport.areas_to_improve && guestReport.areas_to_improve.length > 0 ? (
                 guestReport.areas_to_improve.map((area, i) => <li key={i}>{area}</li>)
              ) : (
                 <li>Great job! Keep practicing.</li>
              )}
            </ul>
          </div>
          
          <button className="primary-btn glow-btn" onClick={() => {
             localStorage.removeItem("isGuest");
             localStorage.removeItem("questions");
             navigate("/");
          }} style={{ fontSize: "18px", padding: "14px 40px" }}>
            Finish & Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    // FINAL ENHANCEMENT: userSelect: none strictly prevents drag-highlighting text!
    <div className="interview-container layout-v2" style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle at center, #0b1120 0%, #020617 100%)", overflow: "hidden", position: "relative", userSelect: "none" }}>

      {/* FULL SCREEN TAB SWITCH CHEATING OVERLAY */}
      {tabSwitchWarning && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(239, 68, 68, 0.95)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px", textAlign: "center" }}>
           <h1 style={{ color: "white", fontSize: "40px", marginBottom: "20px" }}>🚨 TAB SWITCH DETECTED 🚨</h1>
           <p style={{ color: "#fca5a5", fontSize: "20px", maxWidth: "600px", lineHeight: "1.6" }}>
             You have navigated away from the active interview window. This event has been tracked and permanently added to your penalty score.
           </p>
           <button className="primary-btn glow-btn" onClick={() => setTabSwitchWarning(false)} style={{ marginTop: "30px", background: "#f87171", border: "none" }}>
             Acknowledge & Continue
           </button>
        </div>
      )}

      {/* PROCTORING ALERTS */}
      <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 999 }}>
        {multiPersonWarning && <div className="warning-pill animate-slide-up" style={{ background: "rgba(239, 68, 68, 0.9)", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #ffcccc" }}>⚠️ Multiple People Detected!</div>}
        {audioWarning && <div className="warning-pill animate-slide-up" style={{ background: "rgba(245, 158, 11, 0.9)", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #ffeedd" }}>🔊 High Background Noise!</div>}
      </div>

      {/* TOP RIGHT: VIDEO CAMERA */}
      <div 
        className={`cam-box-container ${!cameraOn ? "cam-off" : ""}`}
        style={{
          position: "absolute",
          top: "40px",
          right: "40px",
          width: "280px",
          height: "158px",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
          border: "2px solid rgba(0,200,255,0.4)",
          background: "#0f172a",
          zIndex: 100
        }}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="feed-vid" 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: "scaleX(-1)"
          }}
        />
        <div className="camera-overlay">
          <span className="cam-off-text" style={{ color: "#fff" }}>Privacy Mode</span>
        </div>
      </div>

      <div className="interview-main-stage animate-slide-up" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px", width: "100%", maxWidth: "900px" }}>
        
        {/* CENTER: AI ORB */}
        <div className="ai-section" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="orb-wrapper" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", transform: "scale(0.70)" }}>
            <div className={`orb-container ${isAiSpeaking ? 'orb-speaking' : isUserSpeaking ? 'orb-listening' : 'orb-idling'}`}>
              <div className="orb-layer ring-1"></div>
              <div className="orb-layer ring-2"></div>
              <div className="orb-layer ring-3"></div>
              <div className="orb-core"></div>
            </div>
            <div className="orb-status-text">
              {isAiSpeaking ? "Speaking..." : isUserSpeaking ? "Listening..." : "Analyzing..."}
              <div className="wave-indicator">
                <span className="wave-dot"></span><span className="wave-dot"></span><span className="wave-dot"></span>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION BELOW STAGE */}
        <div className="question-section-bottom" style={{ textAlign: "center", width: "100%", padding: "0 20px", position: "relative", zIndex: 50 }}>
          <h2 className="question-text" style={{ fontSize: "24px", color: "#f8fafc", lineHeight: "1.6", fontWeight: 500, marginBottom: "15px" }}>
            {currentQuestion}
          </h2>

          {/* CINEMATIC LIVE CAPTIONS */}
          <div style={{ height: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {aiSubtitle && (
              <div className="subtitle-box ai-subtitle" style={{ background: "rgba(0, 200, 255, 0.1)", border: "1px solid rgba(0, 200, 255, 0.3)", padding: "10px 20px", borderRadius: "8px", color: "#00c8ff", fontSize: "18px", fontStyle: "italic", maxWidth: "80%", boxShadow: "0 0 20px rgba(0, 200, 255, 0.2)" }}>
                AI: {aiSubtitle}
              </div>
            )}
            {!aiSubtitle && userSubtitle && (
              <div className="subtitle-box user-subtitle" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "10px 20px", borderRadius: "8px", color: "#10b981", fontSize: "18px", maxWidth: "80%", boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)" }}>
                You: {userSubtitle}
              </div>
            )}
          </div>
        </div>

        {/* INLINE CONTROL PILL */}
        <div className="control-pill" style={{ position: "relative", bottom: "auto", left: "auto", transform: "none", marginTop: "10px", zIndex: 10 }}>
          <button className={`pill-btn ${!micOn ? "cam-off" : ""}`} onClick={toggleMic} style={{ color: micOn ? "#00c8ff" : "#ef4444" }}>
            {micOn ? (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 1v10M12 19v4M8 23h8M4 9v6M20 9v6M8 5v14M16 5v14"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>
          <div className="pill-divider"></div>
          <button className={`pill-btn ${!cameraOn ? "cam-off" : ""}`} onClick={toggleCamera}>
            {cameraOn ? (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
          </button>
          <button className="pill-btn danger-btn" onClick={finishInterview} style={{ marginLeft: "10px" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

      </div>

    </div>
  );
};

export default InterviewRoom;