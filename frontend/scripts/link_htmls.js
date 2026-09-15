const fs = require("fs");
const path = require("path");

const htmlDir = path.join(__dirname, '../design/stitch_htmls');
const outDir = path.join(__dirname, '../design/html_prototype');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Based on context and PRD flow
const screenMap = {
  SCREEN_93: "home_dashboard___final_branding.html",
  SCREEN_118: "shop_home___prd___reference_aligned.html",
  SCREEN_143: "session_setup___prd_aligned_standardized.html",
  SCREEN_96: "sessions_list___hybrid_redesign.html",
  SCREEN_92: "account.html",
  SCREEN_90: "welcome___standardized_progress.html",
  SCREEN_98: "account_details___standardized_progress.html",
  SCREEN_52: "home_dashboard___final_branding.html", // from notif pref
  SCREEN_104: "live_session___refined_map_tracker.html", // start tracking
  SCREEN_88: "shopping_cart__no_tote_bag_.html",
  SCREEN_146: "product_detail__cleanup_kit___high_fidelity.html",
  SCREEN_160: "donate.html",
  SCREEN_170: "thank_you___no_tote_bag_.html",
  SCREEN_63: "sessions_list___hybrid_redesign.html",
  SCREEN_70: "session_setup___prd_aligned_standardized.html", // placeholder for session detail
};

const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith(".html"));

files.forEach((file) => {
  let content = fs.readFileSync(path.join(htmlDir, file), "utf8");

  // Replace mapped screens
  content = content.replace(
    /\{\{DATA:SCREEN:(SCREEN_[0-9]+)\}\}/g,
    (match, p1) => {
      if (screenMap[p1]) {
        return screenMap[p1];
      }
      return "javascript:alert('Screen not mapped in prototype: " + p1 + "')";
    },
  );

  // Also link up the 'Continue with Google' etc if they are just empty buttons
  // Since we don't have CSS selectors here, we just write the file
  fs.writeFileSync(path.join(outDir, file), content);
});

console.log("Successfully linked and exported HTML files to html_prototype/");
