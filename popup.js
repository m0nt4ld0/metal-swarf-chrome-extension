document.addEventListener("DOMContentLoaded", () => {
  const getHtmlBtn = document.getElementById("getHtml");
  const closeModalBtn = document.getElementById("closeModal");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      window.close();
    });
  }

  if (getHtmlBtn) {
    getHtmlBtn.addEventListener("click", async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
          throw new Error("No se encontró una pestaña activa.");
        }

        const url = new URL(tab.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          alert("La pestaña no es una página web válida.");
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => {
              // Get both the HTML and all href attributes
              const html = document.documentElement.outerHTML;
              const links = Array.from(document.getElementsByTagName('a'))
                .map(a => a.href)
                .filter(href => href.endsWith('.torrent'));
              
              return { html, torrentLinks: links };
            },
          },
          async (results) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }

            if (!results || !results[0] || !results[0].result) {
              throw new Error("No se pudo obtener el contenido de la página.");
            }

            const { html, torrentLinks } = results[0].result;

            // Find magnet links
            const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]+/g;
            const magnetMatches = html.match(magnetRegex) || [];

            // Prepare the content with sections
            let fileContent = '';
            
            if (magnetMatches.length > 0) {
              fileContent += "=== ENLACES MAGNET ===\n";
              fileContent += magnetMatches.join('\n');
            }

            if (torrentLinks.length > 0) {
              if (fileContent) fileContent += '\n\n';
              fileContent += "=== ENLACES TORRENT ===\n";
              fileContent += torrentLinks.join('\n');
            }

            if (magnetMatches.length === 0 && torrentLinks.length === 0) {
              alert("No se encontraron enlaces magnet ni torrent en la página.");
              return;
            }

            // Copy to clipboard
            await navigator.clipboard.writeText(fileContent);
            alert("Enlaces copiados al portapapeles con éxito.");

            // Download as file
            const tabTitle = tab.title;
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `enlaces_${tabTitle}.txt`;
            link.click();
            URL.revokeObjectURL(url);
          }
        );
      } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
      }
    });
  }
});

if (document.getElementById("openModal")) {
  document.getElementById("openModal").addEventListener("click", () => {
    chrome.windows.create({
      url: "modal.html",
      type: "popup",
      width: 400,
      height: 300
    });
  });
}