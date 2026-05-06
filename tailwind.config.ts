import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans KR"',
          '"Pretendard Variable"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      colors: {
        // v2 redesign — palette derived from design-v2-reference/index.html.
        // 기존 shadcn HSL 토큰과 공존. v2 페이지는 v2.* 만 사용.
        v2: {
          paper: "#F9FAFB",
          paper2: "#F4F5F7",
          paper3: "#EDEEF0",
          ink: "#1A1A1A",
          ink2: "#5A5A5A",
          ink3: "#6E6E73",
          ink4: "#999999",
          rule: "#E6E5E0",
          brand: "#2ECC8E",
          brandDeep: "#1DB87A",
          // 카드 4 톤 (액티브/로컬/글로벌/테크)
          cardActive: "#FDF4EC",
          cardLocal: "#EAF5EE",
          cardGlobal: "#EEF3FF",
          cardTech: "#E8F0F5",
          // 카드 4 톤별 텍스트/배지 색
          activeAccent: "#9B6020",
          localAccent: "#3A7A55",
          globalAccent: "#2060C8",
          techAccent: "#2060A0",
          // 다크 푸터
          footer: "#0F0F0F",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
