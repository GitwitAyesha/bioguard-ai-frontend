// OTP verification is now fully handled inside Login.jsx
// This file redirects to login if someone visits /verify-otp directly
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/login", { replace: true }); }, []);
  return null;
}