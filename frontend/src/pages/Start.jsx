
import { Link } from "react-router-dom";
import rapidoLogo from "../assets/rapido.jpg";

const Start = () => {
  return (
        <div className="h-screen flex justify-between flex-col w-full items-center bg-gray-100 ">
            <div>
                 <img src={rapidoLogo} alt="Rapido Logo" className="h-full" />

                <h2 className="text-3xl px-4 font-bold">
                    Welcome to Rapid-go!
                </h2>

                <Link to='/login' className="inline-block bg-black text-white font-bold py-4 px-4 rounded w-full mt-5">
                    Get Started
                </Link>
            </div>
        </div>
  )
}

export default Start
