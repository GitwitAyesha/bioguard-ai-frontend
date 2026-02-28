import { useRef, useEffect, useState, useCallback } from "react";
import "./CameraCapture.css";

export default function CameraCapture({ onCapture, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      onError?.("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        doCapture();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  const doCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    stopCamera();
    onCapture?.(dataUrl);
  };

  const retake = () => {
    setCaptured(null);
    onCapture?.(null);
    startCamera();
  };

  return (
    <div className="camera-wrap">
      <div className="camera-frame">
        {/* Corner brackets */}
        <div className="corner tl" />
        <div className="corner tr" />
        <div className="corner bl" />
        <div className="corner br" />

        {countdown && (
          <div className="countdown">{countdown}</div>
        )}

        {!captured ? (
          <video ref={videoRef} autoPlay muted playsInline className="camera-video" />
        ) : (
          <img src={captured} alt="captured" className="camera-video" />
        )}

        {!captured && ready && (
          <div className="scan-line" />
        )}

        <div className="face-oval" />
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p className="camera-hint">
        {captured
          ? "✓ Photo captured successfully"
          : "Position your face in the frame"}
      </p>

      <div className="camera-btns">
        {!captured ? (
          <button
            className="btn-primary capture-btn"
            onClick={capture}
            disabled={!ready || countdown !== null}
          >
            {countdown ? `Capturing in ${countdown}...` : "📸  Capture Photo"}
          </button>
        ) : (
          <button className="btn-ghost capture-btn" onClick={retake}>
            ↺ Retake
          </button>
        )}
      </div>
    </div>
  );
}