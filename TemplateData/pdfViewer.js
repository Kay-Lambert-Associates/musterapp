var pdfjsLib = {},
  thePdf = {},
  modal = {};

function base64ToPdf (pdfString, isLeader) {
  var _this = this;
  var _isLeader = isLeader;
  if (!pdfString) {
    console.error("The pdf string must not be empty");
    return;
  }
  if (typeof Pointer_stringify !== "undefined") {
    pdfString = Pointer_stringify(pdfString);
  }

  modal = new tingle.modal({
    footer: false,
    stickyFooter: false,
    closeMethods: ["button", "escape"],
    cssClass: ["tingle-force-overflow"],
    onOpen: function () {
      if (!_isLeader || isLeader === false) {
        var closeButton = document.getElementsByClassName(
          "tingle-modal__close"
        )[0];
        closeButton.parentNode.removeChild(closeButton);
      }
      if (typeof gameInstance !== "undefined") {
        gameInstance.SetFullscreen(0);
      }
    },
    onClose: function () {
      if (typeof gameInstance !== "undefined") {
        gameInstance.SetFullscreen(1);
      }
      modal.destroy();
    },
    beforeClose: function () {
      if (!_isLeader || _isLeader == false) {
        return false;
      }
      return true;
    },
  });

  pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc = "./TemplateData/pdf.worker.js";

  var viewer = document.createElement("div");
  viewer.setAttribute("id", "pdf-viewer");

  // atob() is used to convert base64 encoded PDF to binary-like data.
  // (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
  // Base64_encoding_and_decoding.)
  var pdfData = atob(pdfString);

  // Using DocumentInitParameters object to load binary data.
  var loadingTask = pdfjsLib.getDocument({ data: pdfData });
  loadingTask.promise.then(
    function (pdf) {
      console.log("PDF loaded");
      thePdf = pdf;
      // Fetch the first page
      var pageNumber = 1;
      pdf.getPage(pageNumber).then(function (page) {
        console.log("Page loaded");

        // Prepare canvas using PDF page dimensions

        for (page = 1; page <= pdf.numPages; page++) {
          var canvas = document.createElement("canvas");
          canvas.className = "pdf-page-canvas";
          viewer.appendChild(canvas);
          _this.renderPage(page, canvas);
        }

        modal.setContent(viewer);
        modal.open();
      });
    },
    function (reason) {
      // PDF loading error
      console.error(JSON.stringify(reason));
    }
  );
}

function closePdf() {
  modal.close();
}

function renderPage(pageNumber, canvas) {
  thePdf.getPage(pageNumber).then(function (page) {
    console.log("Page rendering");
    var scale = 1.5;
    var viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport });
  });
}
