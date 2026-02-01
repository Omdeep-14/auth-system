import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppData } from "../context/AppContext";
import api from "../apiInterceptor/apiInterceptor.js";

function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuth, setUser } = AppData();

  const submitHandler = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("email");

    if (!email) {
      toast.error("Email not found. Please login again.");
      navigate("/login");
      return;
    }

    try {
      setBtnLoading(true);

      const { data } = await api.post("/api/user/verifyOtp", {
        email,
        otp,
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      localStorage.removeItem("email");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setBtnLoading(false);
    }
  };

  const resendOtp = async () => {
    const email = localStorage.getItem("email");

    if (!email) {
      toast.error("Email not found. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const { data } = await api.post("/api/user/resendOtp", { email });
      toast.success(data.message || "OTP sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">
            Verify using OTP
          </h1>
          <p className="leading-relaxed mt-4">
            Enter 6 digit OTP sent to your email
          </p>
        </div>
        <form
          onSubmit={submitHandler}
          className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
        >
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
            Verify
          </h2>
          <div className="relative mb-4">
            <label htmlFor="otp" className="leading-7 text-sm text-gray-600">
              Enter OTP
            </label>
            <input
              type="number"
              id="otp"
              name="otp"
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              minLength={6}
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={btnLoading}
          >
            {btnLoading ? "Submitting..." : "Submit"}
          </button>
          <div>
            <Link
              to={"/login"}
              className="text-xs text-gray-500 mt-3 cursor-pointer block"
            >
              Go to login page
            </Link>
            <p
              onClick={resendOtp}
              className="text-xs text-indigo-500 mt-2 cursor-pointer hover:underline"
            >
              Resend OTP
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

export default VerifyOtp;
