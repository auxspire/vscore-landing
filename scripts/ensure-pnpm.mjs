const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.includes("pnpm")) {
  console.error("This project uses pnpm. Install with: npm install -g pnpm");
  process.exit(1);
}
