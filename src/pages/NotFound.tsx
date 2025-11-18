import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import animationData from '../animations/404-animation.json';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <Player
          autoplay
          loop
          src={animationData}
          style={{ height: '300px', width: '300px' }}
          className="mx-auto mb-4"
        />
        <Link
          to="/"
          className="
            inline-flex items-center
            mb-6 -ml-4
            px-4 py-2
            rounded-2xl
            text-gray-700
            hover:bg-gray-100 hover:text-black
            transition-all group
          "
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
