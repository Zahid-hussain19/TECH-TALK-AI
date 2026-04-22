import React, { useRef, useEffect } from "react";

export default function VoiceRing() {
  const ringRef = useRef(null);

  useEffect(() => {
    let animationId;
    let audioCtx;
    let sourceNode;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        sourceNode = audioCtx.createMediaStreamSource(stream);
        sourceNode.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function animate() {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const volume = dataArray.length > 0 ? sum / dataArray.length : 0;

          if (ringRef.current) {
            ringRef.current.style.transform = `scale(${1 + volume / 300})`;
          }

          animationId = requestAnimationFrame(animate);
        }

        animate();
      })
      .catch((err) => {
        console.error("Microphone error:", err);
      });

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
    };
  }, []);

  return <div className="voice-ring" ref={ringRef}></div>;
}