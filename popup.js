document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const defaultSitemapUrl = `${new URL(tab.url).origin}/sitemap.xml`;
    document.getElementById("sitemapUrl").value = defaultSitemapUrl;
});

document.getElementById("analyze").addEventListener("click", async () => {
    const sitemapUrl = document.getElementById("sitemapUrl").value;
    const report = document.getElementById("report");
    report.style.display = "block";
    report.innerHTML = "<p>Searching for sitemap...</p>";

    try {
        const response = await fetch(sitemapUrl);
        if (!response.ok) throw new Error("Sitemap not found");

        const sitemapText = await response.text();
        const parser = new DOMParser();
        const sitemapDoc = parser.parseFromString(sitemapText, "application/xml");

        const sitemaps = sitemapDoc.querySelectorAll("sitemap > loc");
        let totalUrls = 0;
        let summary = "<h4>Audit Results</h4>";

        if (sitemaps.length > 0) {
            summary += `<p>Total Sitemaps: ${sitemaps.length}</p>`;
            summary += "<table><tr><th>Sitemap</th><th>URLs</th><th>Examples</th></tr>";
            for (const sitemap of sitemaps) {
                const subSitemapUrl = sitemap.textContent;
                const subResponse = await fetch(subSitemapUrl);
                const subText = await subResponse.text();
                const subDoc = parser.parseFromString(subText, "application/xml");
                const urls = subDoc.querySelectorAll("url > loc");
                totalUrls += urls.length;

                let examples = "";
                for (let i = 0; i < Math.min(urls.length, 3); i++) {
                    examples += `<a href="${urls[i].textContent}" target="_blank">${urls[i].textContent}</a><br>`;
                }

                summary += `<tr><td><a href="${subSitemapUrl}" target="_blank">${subSitemapUrl}</a></td><td>${urls.length}</td><td>${examples}</td></tr>`;
            }
            summary += "</table>";
        } else {
            const urls = sitemapDoc.querySelectorAll("url > loc");
            totalUrls = urls.length;
            summary += `<p>Total URLs: ${totalUrls}</p>`;
        }

        summary += `<p>Total URLs Found: ${totalUrls}</p>`;
        report.innerHTML = summary;
    } catch (error) {
        report.innerHTML = `<p>Error: ${error.message}</p>`;
    }
});