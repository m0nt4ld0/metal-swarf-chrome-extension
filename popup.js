document.addEventListener("DOMContentLoaded", () => {
  const getMagnetLinksBtn = document.getElementById("getMagnetLinks");
  const showModalBtn = document.getElementById("showModal");

  // Botón para extraer enlaces magnet
  getMagnetLinksBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const html = document.documentElement.outerHTML;
            const regex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]+/g;
            const matches = html.match(regex);

            if (matches && matches.length > 0) {
              navigator.clipboard.writeText(matches.join("\n"));
              alert("Enlaces magnet copiados al portapapeles:\n" + matches.join("\n"));
            } else {
              alert("No se encontraron enlaces magnet en esta página.");
            }
          },
        });
      }
    });
  });

  // Botón para mostrar el modal
  showModalBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            window.dispatchEvent(new CustomEvent("showModal"));
          },
        });
      }
    });
  });
});
