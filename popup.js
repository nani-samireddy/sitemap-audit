document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const defaultSitemapUrl = `${new URL(tab.url).origin}/sitemap.xml`;
    document.getElementById("sitemapUrl").value = defaultSitemapUrl;
  });
  
  document.getElementById("analyze").addEventListener("click", async () => {
    const sitemapUrl = document.getElementById("sitemapUrl").value;
    const report = document.getElementById("report");
    report.style.display = "block"; // Make the report visible during auditing
    report.innerHTML = "<p>Searching for sitemap...</p>";
  
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) throw new Error("Sitemap not found");
  
      const sitemapText = await response.text();
      const parser = new DOMParser();
      const sitemapDoc = parser.parseFromString(sitemapText, "application/xml");
  
      // Check if it's a sitemap index or a single sitemap
      const sitemaps = sitemapDoc.querySelectorAll("sitemap > loc");
      if (sitemaps.length > 0) {
        // If it's a sitemap index, process each child sitemap
        let summary = "<table><tr><th>Sitemap</th><th>URLs</th></tr>";
        for (const sitemap of sitemaps) {
          const subSitemapUrl = sitemap.textContent;
          const subResponse = await fetch(subSitemapUrl);
          const subText = await subResponse.text();
          const subDoc = parser.parseFromString(subText, "application/xml");
          const urls = subDoc.querySelectorAll("url > loc");
          summary += `<tr><td><a href="${subSitemapUrl}" target="_blank">${subSitemapUrl}</a></td><td>${urls.length}</td></tr>`;
        }
        summary += "</table>";
        report.innerHTML = `<h4>Audit Results</h4>${summary}`;
      } else {
        // Single sitemap case
        const urls = sitemapDoc.querySelectorAll("url > loc");
        report.innerHTML = `<h4>Audit Results</h4><p>${sitemapUrl}: ${urls.length} URLs</p>`;
      }
    } catch (error) {
      report.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });
  