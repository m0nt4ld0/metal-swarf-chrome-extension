document.addEventListener("DOMContentLoaded", () => {
  const getHtmlBtn = document.getElementById("getHtml");
  const closeModalBtn = document.getElementById("closeModal");

  // Traducción de textos del DOM
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });

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
          throw new Error(chrome.i18n.getMessage("error_no_tab"));
        }

        const url = new URL(tab.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          alert(chrome.i18n.getMessage("error_invalid_url"));
          return;
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
              throw new Error(chrome.i18n.getMessage("error_no_html"));
            }

            const regex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]+/g;
            const matches = results[0].result.match(regex);

            if (matches && matches.length > 0) {
              let magnetLinks = matches.join("\n");
              await navigator.clipboard.writeText(magnetLinks);
              alert(chrome.i18n.getMessage("success_copy"));

              const tabTitle = tab.title;
              const fileContent = magnetLinks;
              const blob = new Blob([fileContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${chrome.i18n.getMessage("filename_prefix")} - ${tabTitle}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            } else {
              alert(chrome.i18n.getMessage("no_magnets"));
            }
          }
        );
      } catch (error) {
        console.error("Error:", error);
        alert(`${chrome.i18n.getMessage("error_generic")}: ${error.message}`);
      }
    });
  }

  const openModal = document.getElementById("openModal");
  if (openModal) {
    openModal.addEventListener("click", () => {
      chrome.windows.create({
        url: "modal.html",
        type: "popup",
        width: 400,
        height: 300
      });
    });
  }
});
