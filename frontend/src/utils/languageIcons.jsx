import { PiCode, PiDatabase, PiTerminalWindow } from "react-icons/pi";
import {
  SiAngular,
  SiC,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDocker,
  SiDotnet,
  SiExpress,
  SiFlutter,
  SiGit,
  SiGithub,
  SiGnubash,
  SiGo,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiKotlin,
  SiKubernetes,
  SiLinux,
  SiMarkdown,
  SiMongodb,
  SiMysql,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiNpm,
  SiOpenjdk,
  SiPhp,
  SiPnpm,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReact,
  SiRedis,
  SiRuby,
  SiRubyonrails,
  SiRust,
  SiSass,
  SiSqlite,
  SiSvelte,
  SiSwift,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
  SiVuedotjs,
  SiYaml,
} from "react-icons/si";

const TECHNOLOGIES = [
  { aliases: ["javascript", "js"], Icon: SiJavascript, color: "#F7DF1E" },
  { aliases: ["typescript", "ts"], Icon: SiTypescript, color: "#3178C6" },
  {
    aliases: ["react", "reactjs", "react.js", "react js", "jsx", "tsx"],
    Icon: SiReact,
    color: "#61DAFB",
  },
  { aliases: ["ruby", "rb"], Icon: SiRuby, color: "#CC342D" },
  {
    aliases: ["rails", "ruby on rails"],
    Icon: SiRubyonrails,
    color: "#CC0000",
  },
  {
    aliases: ["postgresql", "postgres"],
    Icon: SiPostgresql,
    color: "#4169E1",
  },
  {
    aliases: ["tailwind", "tailwind css", "tailwindcss"],
    Icon: SiTailwindcss,
    color: "#06B6D4",
  },
  {
    aliases: ["node", "nodejs", "node.js", "node js"],
    Icon: SiNodedotjs,
    color: "#5FA04E",
  },
  { aliases: ["git"], Icon: SiGit, color: "#F05032" },
  { aliases: ["html", "html5"], Icon: SiHtml5, color: "#E34F26" },
  { aliases: ["css", "css3"], Icon: SiCss, color: "#1572B6" },
  { aliases: ["sass", "scss"], Icon: SiSass, color: "#CC6699" },
  { aliases: ["python", "py"], Icon: SiPython, color: "#3776AB" },
  { aliases: ["php"], Icon: SiPhp, color: "#777BB4" },
  { aliases: ["java"], Icon: SiOpenjdk, color: "#007396" },
  { aliases: ["c"], Icon: SiC, color: "#A8B9CC" },
  { aliases: ["c++", "cpp"], Icon: SiCplusplus, color: "#00599C" },
  { aliases: ["c#", "csharp", "c sharp"], Icon: SiDotnet, color: "#512BD4" },
  { aliases: ["go", "golang"], Icon: SiGo, color: "#00ADD8" },
  { aliases: ["rust"], Icon: SiRust, color: "#DEA584" },
  { aliases: ["swift"], Icon: SiSwift, color: "#F05138" },
  { aliases: ["kotlin"], Icon: SiKotlin, color: "#7F52FF" },
  { aliases: ["dart"], Icon: SiDart, color: "#0175C2" },
  { aliases: ["flutter"], Icon: SiFlutter, color: "#02569B" },
  {
    aliases: ["vue", "vuejs", "vue.js", "vue js"],
    Icon: SiVuedotjs,
    color: "#4FC08D",
  },
  {
    aliases: ["angular", "angularjs", "angular.js", "angular js"],
    Icon: SiAngular,
    color: "#DD0031",
  },
  { aliases: ["svelte", "sveltejs", "svelte js"], Icon: SiSvelte, color: "#FF3E00" },
  {
    aliases: ["next", "nextjs", "next.js", "next js"],
    Icon: SiNextdotjs,
    color: "#FFFFFF",
  },
  { aliases: ["vite", "vitejs", "vite js"], Icon: SiVite, color: "#646CFF" },
  {
    aliases: ["express", "expressjs", "express.js", "express js"],
    Icon: SiExpress,
    color: "#FFFFFF",
  },
  {
    aliases: ["nest", "nestjs", "nest.js", "nest js"],
    Icon: SiNestjs,
    color: "#E0234E",
  },
  { aliases: ["graphql", "graph ql"], Icon: SiGraphql, color: "#E10098" },
  { aliases: ["docker"], Icon: SiDocker, color: "#2496ED" },
  { aliases: ["kubernetes", "k8s"], Icon: SiKubernetes, color: "#326CE5" },
  { aliases: ["mongodb", "mongo"], Icon: SiMongodb, color: "#47A248" },
  { aliases: ["mysql", "my sql"], Icon: SiMysql, color: "#4479A1" },
  // SQLite's secondary blue stays legible on SnipStack's dark badge surface.
  { aliases: ["sqlite", "sqlite3"], Icon: SiSqlite, color: "#0F80CC" },
  { aliases: ["redis"], Icon: SiRedis, color: "#DC382D" },
  // Prisma's standard navy disappears on dark UI, so its monochrome mark is inverted.
  { aliases: ["prisma"], Icon: SiPrisma, color: "#FFFFFF" },
  { aliases: ["sql"], Icon: PiDatabase, color: "#336791" },
  {
    aliases: ["bash", "sh", "zsh"],
    Icon: SiGnubash,
    color: "#4EAA25",
  },
  {
    aliases: ["shell", "terminal"],
    Icon: PiTerminalWindow,
    color: "#4EAA25",
  },
  { aliases: ["markdown", "md"], Icon: SiMarkdown, color: "#FFFFFF" },
  { aliases: ["json"], Icon: SiJson, color: "#F7DF1E" },
  { aliases: ["yaml", "yml"], Icon: SiYaml, color: "#CB171E" },
  { aliases: ["npm"], Icon: SiNpm, color: "#CB3837" },
  { aliases: ["pnpm"], Icon: SiPnpm, color: "#F69220" },
  { aliases: ["vercel"], Icon: SiVercel, color: "#FFFFFF" },
  { aliases: ["github", "github.com"], Icon: SiGithub, color: "#FFFFFF" },
  { aliases: ["linux"], Icon: SiLinux, color: "#FCC624" },
];

const ICONS_BY_LANGUAGE = new Map(
  TECHNOLOGIES.flatMap(({ aliases, ...technology }) =>
    aliases.map((alias) => [alias, technology]),
  ),
);

const FALLBACK = {
  Icon: PiCode,
  color: "var(--neutral-300)",
};

function normalizeLanguage(language) {
  return (
    language
      ?.trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ") || ""
  );
}

export function LanguageIcon({ language, ...props }) {
  const technology = ICONS_BY_LANGUAGE.get(normalizeLanguage(language)) || FALLBACK;
  const { Icon, color } = technology;

  return <Icon {...props} color={color} />;
}
