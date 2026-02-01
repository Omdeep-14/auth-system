import React from "react";
import { AppData } from "../context/AppContext";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const { logOutUser, user } = AppData();
  const navigate = useNavigate();
  return (
    <div>
      <button
        className="bg-red-500 text-white p-2 rounded-md"
        onClick={() => logOutUser(navigate)}
      >
        LogOut
      </button>
      {user && user.role === "admin" && (
        <Link className="bg-purple-500 text-white p-2 rounded-md">
          Admin Dashboard
        </Link>
      )}
    </div>
  );
}

export default Home;
