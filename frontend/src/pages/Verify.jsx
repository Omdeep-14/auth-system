import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { server } from "../config/config";
import Loading from "./Loading";

function Verify() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const params = useParams();

  const verifyUser = useCallback(async () => {
    try {
      const { data } = await axios.post(
        `${server}/api/user/verify/${params.token}`,
      );
      setSuccessMessage(data.message);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Verification failed ,please try again",
      );
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="w-50 m-auto m-top">
          {successMessage && (
            <div>
              <p className="text-green-500 text-2xl ">{successMessage}</p>
              <div>
                <Link
                  to="/login"
                  className="text-blue-500 underline mt-4 inline-block"
                >
                  Please login
                </Link>
              </div>
            </div>
          )}
          {errorMessage && (
            <p className="text-red-500 text-2xl ">{errorMessage}</p>
          )}
        </div>
      )}
    </>
  );
}

export default Verify;
