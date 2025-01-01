import { firefox, expect } from "@playwright/test";
import fs from "node:fs";
import { toContinue } from "./util";

async function main() {
  const response = await fetch("https://api.revanced.app/v4/patches/list");
  const json = await response.json();

  const youtubePatch = json.find((patch: any) => {
    // Check if the compatiblePackages contains "com.google.android.youtube"
    return (
      patch.compatiblePackages &&
      patch.compatiblePackages["com.google.android.youtube"]
    );
  });

  if (!youtubePatch) {
    console.error("No YouTube Patch found");
    return;
  }
  const versions =
    youtubePatch.compatiblePackages["com.google.android.youtube"];
  const highestVersion = versions.sort((a: string, b: string) => {
    // Split the versions into parts and compare them as numbers
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    // Compare parts of the version to get the highest version
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] > bParts[i]) return -1;
      if (aParts[i] < bParts[i]) return 1;
    }

    return 0; // If they are equal
  })[0]; // The highest version will be the first after sorting
  console.log("Suggested Version", highestVersion);
  toContinue(async () => {
    const [major, minor, patch] = highestVersion.split(".").map(Number);
    const browser = await firefox.launch({
      headless: false,
    });
    const context = await browser.newContext({
      acceptDownloads: true,
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(
      `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${major}-${minor}-${patch}-release/youtube-${major}-${minor}-${patch}-android-apk-download/`,
      { timeout: 60000 },
    );

    const button = page.locator("a[class*='downloadButton']");
    await button.waitFor({ state: "visible", timeout: 10000 });
    const relativeHref = await button.getAttribute("href");
    const fullUrl = `https://www.apkmirror.com${relativeHref}`;
    // Click the anchor tag, and wait for the page to navigate (redirect)
    await Promise.all([
      button.click(), // Click the anchor tag
      page.waitForURL(fullUrl, { waitUntil: "load" }), // Wait for page navigation (redirect)
    ]);
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 }); // Increase timeout
    const linkBtn = page.locator("#download-link");
    linkBtn.click();
    try {
      console.log("Download started....");

      // Wait for the download to complete
      const download = await downloadPromise;

      // Ensure the download folder exists
      const downloadFolder = "./downloads";
      if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
      }

      // Save the download with the suggested filename
      await download.saveAs(
        `${downloadFolder}/${download.suggestedFilename()}`,
      );
      console.log(
        "Download saved to:",
        `${downloadFolder}/${download.suggestedFilename()}`,
      );
    } catch (error) {
      console.error("Error during download:", error);
    } finally {
      await browser.close();
    }
  });
}

main().catch(console.error);
