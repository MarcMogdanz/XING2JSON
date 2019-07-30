import browser from "webextension-polyfill";
import $ from "jquery";

import "popper.js"; // bootstrap js dependency
import "bootstrap"; // bootstrap js
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/options.css";

(async function executeCode() {
  $(document).ready(async () => {
    const downloadButton = $("#download");
    const downloadMinifiedButton = $("#downloadMinified");
    const resumeDiv = $("div#resume");
    const downloadFailedModal = $("#downloadFailedModal");

    const data = await browser.storage.local.get("last");

    // check if a resume was already created
    if ($.isEmptyObject(data)) {
      downloadButton.prop("disabled", true);
      downloadMinifiedButton.prop("disabled", true);
      resumeDiv.text("No resume generated yet. :(");
      return;
    }

    const resume = JSON.stringify(data.last.resume, null, 2); // beautify the resume
    const minifiedResume = JSON.stringify(JSON.parse(resume)); // minify the resume

    resumeDiv.html(`<pre>${resume}</pre>`);

    // event handler for downloading the normal resume as .json file
    downloadButton.click(async () => {
      try {
        await browser.downloads.download({
          url: `data:text/plain;charset=utf-8,${encodeURIComponent(resume)}`,
          filename: "resume.json",
          conflictAction: "uniquify"
        });
      } catch (err) {
        downloadFailedModal.modal("show");
      }
    });

    // event handler for downloading the minified resume as .json file
    downloadMinifiedButton.click(async () => {
      try {
        await browser.downloads.download({
          url: `data:text/plain;charset=utf-8,${encodeURIComponent(
            minifiedResume
          )}`,
          filename: "resume.json",
          conflictAction: "uniquify"
        });
      } catch (err) {
        downloadFailedModal.modal("show");
      }
    });
  });
})();
