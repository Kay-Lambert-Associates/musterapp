class PdfViewer {
  static pdfjsLib;
  static modal;
  static wasFullscreen;
  static thePdf;
  static viewer;
  static isLeader;
  static canClose;
  static loadingTask;

  constructor() {}

  static {
    if (!this.pdfjsLib) {
      this.pdfjsLib = window["pdfjs-dist/build/pdf"];
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = "./TemplateData/pdf.worker.js";
    }
  }

  static stringToPdf(pdfString, isLeader, canClose) {
    this.isLeader = isLeader;
    this.canClose = canClose;

    this.wasFullscreen = false;

    PdfViewer.createViewer();

    PdfViewer.setUpModal();

    PdfViewer.renderPdf(pdfString);
  }

  static createViewer() {
    this.viewer = document.createElement("div");
    this.viewer.setAttribute("id", "pdf-viewer");
  }

  static renderPdf(pdfString) {
    // atob() is used to convert base64 encoded PDF to binary-like data.
    // (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
    // Base64_encoding_and_decoding.)
    let pdfData = atob(pdfString);

    var _this = this;
    // Using DocumentInitParameters object to load binary data.
    this.loadingTask = pdfjsLib.getDocument({ data: pdfData });
    this.loadingTask.promise.then(
      function (pdf) {
        console.log("PDF loaded");
        _this.thePdf = pdf;
        // Fetch the first page
        var pageNumber = 1;
        pdf.getPage(pageNumber).then(function (page) {
          console.log("Page loaded");

          // Prepare canvas using PDF page dimensions

          for (page = 1; page <= pdf.numPages; page++) {
            let canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";
            _this.viewer.appendChild(canvas);
            PdfViewer.renderPage(page, canvas);
          }

          _this.modal.setContent(_this.viewer);
          _this.modal.open();
        });
      },
      function (reason) {
        // PDF loading error
        console.error(JSON.stringify(reason));
        PdfViewer.cleanUp();
      }
    );
  }

  static setUpModal() {
    this.modal = new tingle.modal({
      footer: false,
      stickyFooter: false,
      closeLabel: "Close",
      closeMethods: ["button", "escape"],
      cssClass: ["tingle-force-overflow"],
      onOpen: PdfViewer.onModalOpen,
      onClose: PdfViewer.onModalClose,
      beforeClose: PdfViewer.onModalBeforeClose,
    });
  }

  static onModalOpen() {
    if (!PdfViewer.isLeader && !PdfViewer.canClose) {
      let closeButton = PdfViewer.modal.modalCloseBtn;
      closeButton.parentNode.removeChild(closeButton);
    }
    if (typeof gameInstance !== "undefined") {
      if (document.fullscreen) {
        PdfViewer.wasFullscreen = true;
        gameInstance.SetFullscreen(0);
      }
    }
  }

  static onModalClose() {
    if (typeof gameInstance !== "undefined") {
      if (document.fullscreen && PdfViewer.wasFullscreen) {
        gameInstance.SetFullscreen(1);
      }
    }
    if (PdfViewer.isLeader) {
      gameInstance.SendMessage("LibraryScriptHolder", "CmdCloseFile");
    }

    PdfViewer.cleanUp();
  }

  static onModalBeforeClose() {
    if (!PdfViewer.isLeader && !PdfViewer.canClose) {
      return false;
    }
    return true;
  }

  static closePdf() {
    if (this.modal.modal) {
      this.cleanUp();
      if (this.wasFullscreen) {
        gameInstance.SetFullscreen(1);
      }
    }
  }

  static renderPage(pageNumber, canvas) {
    this.thePdf.getPage(pageNumber).then(function (page) {
      console.log("Page rendering");
      let scale = 1.5;
      let viewport = page.getViewport({ scale: scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport });
    });
  }

  static cleanUp() {
    this.modal.destroy();
    this.loadingTask.destroy();
    $(this.viewer).remove();
    if (this.thePdf) {
      this.thePdf.destroy();
    }
  }
}
