import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  message?: string;
  onFinish: () => void;
  baseDuration?: number; // base duration for circle animation
  perLetterDelay?: number; // stagger delay per letter in ms
}

// Global constant to pause after full animation (ms)
const POST_ANIMATION_PAUSE = 1000;

const NUM_PARTICLES = 30; // number of floating particles

const SplashScreen = ({
  message = "Welcome to Shade Seat",
  onFinish,
  baseDuration = 1800,
  perLetterDelay = 50,
}: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState(0);

  // Split message into words
  const words = message.split(" ");

  // Compute dynamic timing based on words
  const textAnimationDuration = words.length * perLetterDelay * 3; // Adjust timing for words
  const expansionStart = baseDuration / 1.5;
  const textStart = expansionStart + 100;
  const finishTime = textStart + textAnimationDuration + 500 + POST_ANIMATION_PAUSE;

  useEffect(() => {
    const timers = [
      { time: 600, action: () => setStage(1) }, // initial bounce
      { time: expansionStart, action: () => setStage(2) }, // circle expand
      { time: textStart, action: () => setStage(3) }, // start text animation
      {
        time: finishTime,
        action: () => {
          setIsVisible(false);
          onFinish();
        },
      }, // finish
    ];

    timers.forEach(({ time, action }) => setTimeout(action, time));
  }, [onFinish, expansionStart, textStart, finishTime]);

  // Generate random particles
  const particles = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
    id: i,
    x: Math.random() * 200 - 100, // random x offset
    y: Math.random() * 200 - 100, // random y offset
    size: Math.random() * 6 + 2, // size between 2-8px
    delay: Math.random() * 1, // delay for animation
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Circle */}
          <motion.div
             className="absolute rounded-full w-24 h-24 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-[0_0_80px_rgba(255,140,0,0.7)]"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{
              scale:
                stage >= 2
                  ? 25
                  : stage === 1
                  ? [0.55, 0.6, 0.55]
                  : [0.3, 0.5, 0.45, 0.55],
              opacity: stage >= 2 ? 1 : 0.9,
            }}
            transition={{
              scale:
                stage >= 2
                  ? { duration: 0.6, ease: "easeOut" }
                  : { duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] },
            }}
          />

          {/* Ripple behind circle */}
          {stage >= 1 && (
            <motion.div
              className="absolute rounded-full w-24 h-24 bg-orange-400/30"
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          )}

          {/* Floating Particles */}
          {stage >= 1 &&
            particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute bg-yellow-400 rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [0, p.x],
                  y: [0, p.y],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  delay: p.delay,
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeOut",
                }}
              />
            ))}

          {/* Text Animation */}
          {stage >= 3 && (
            <motion.div
              className="relative z-10 flex flex-col items-center text-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1 className="text-6xl font-extrabold text-white drop-shadow-lg mb-2 flex flex-wrap justify-center gap-x-4">
                {words.map((word, index) => (
                  <motion.span
                    key={index}
                    className="inline-block whitespace-nowrap"
                    initial={{ y: 60, opacity: 0, rotate: 10 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{
                      delay: (perLetterDelay * index * 3) / 1000, // Stagger by word index
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                className="text-white text-lg opacity-90 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: (perLetterDelay * words.length * 3) / 1000 + 0.2,
                }}
              >
                Smart Seat Selection
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;