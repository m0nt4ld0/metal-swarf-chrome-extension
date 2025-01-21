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
            func: () => document.documentElement.outerHTML,
          },
          async (results) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }

            if (!results || !results[0] || !results[0].result) {
              throw new Error("No se pudo obtener el HTML de la página.");
            }

            const regex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]+/g;
            const matches = results[0].result.match(regex);

            if (matches && matches.length > 0) {
              let magnetLinks = matches.join("\n");
              await navigator.clipboard.writeText(magnetLinks);
              alert("Enlaces magnet copiados al portapapeles con éxito.");

              const tabTitle = tab.title;
              const fileContent = magnetLinks;
              const blob = new Blob([fileContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `enlaces_magnet - ${tabTitle}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            } else {
              alert("No se encontraron enlaces magnet en la página.");
            }
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
