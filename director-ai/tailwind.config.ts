import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      keyframes: {
        blink: {
          "0%, 45%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-20%)" },
          "100%": { transform: "translateY(120vh)" },
        },
        telemetry: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        flicker: {
          "0%, 19%, 21%, 100%": { opacity: "1" },
          "20%": { opacity: "0.35" },
        },
      },
      animation: {
        blink: "blink 1.05s steps(1, end) infinite",
        scan: "scan 8s linear infinite",
        telemetry: "telemetry 22s linear infinite",
        flicker: "flicker 5.5s linear infinite",
      },
    },
  },
};

export default config;
