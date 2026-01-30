import React from "react";
import { AppData } from "../context/AppContext";

function Home() {
  const { logOutUser } = AppData();
  return (
    <div>
      <button
        className="bg-red-500 text-white p-2 rounded-md"
        onClick={logOutUser}
      >
        LogOut
      </button>
    </div>
  );
}

export default Home;
