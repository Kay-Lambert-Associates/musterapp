(function() { // Begin scoping function
  window.lol = {

    init: function()
    {
        //Loaded via <script> tag, create shortcut to access PDF.js exports.
      this.pdfjsLib = window["pdfjs-dist/build/pdf"],
  
      //Global refrence to the full pdf file
      this.thePdf,
  
      //modal plugin used to display the pdf
      this.modal = new tingle.modal({
        footer: false,
        stickyFooter: false,
        closeLabel: "Close",
        onOpen: function() {
            console.log('modal open');
        },
        onClose: function() {
            console.log('modal closed');
        },
        beforeClose: function() {
            // here's goes some logic
            // e.g. save content before closing the modal
            return true; // close the modal
        }
      })
    },
  
  
    base64ToPdf: function(pdfString) {
      
      if (!pdfString) {
        console.error("The pdf string must not be empty");
        return;
      }
      this.init();
      var _this = this;
  
      _this.pdfjsLib.GlobalWorkerOptions.workerSrc = "./TemplateData/pdf.worker.js";
  
      var viewer = document.createElement('div');
      viewer.setAttribute('id', 'pdf-viewer');
  
      // atob() is used to convert base64 encoded PDF to binary-like data.
      // (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
      // Base64_encoding_and_decoding.)
      var pdfData = atob(pdfString);
  
      // Using DocumentInitParameters object to load binary data.
      var loadingTask = _this.pdfjsLib.getDocument({ data: pdfData });
      loadingTask.promise.then(
        function (pdf) {
          console.log("PDF loaded");
          _this.thePdf = pdf;
          // Fetch the first page
          var pageNumber = 1;
          pdf.getPage(pageNumber).then(function (page) {
            console.log("Page loaded");
  
            // Prepare canvas using PDF page dimensions
  
            for (page = 1; page <= pdf.numPages; page++) {
              var canvas = document.createElement("canvas");
              canvas.className = "pdf-page-canvas";
              viewer.appendChild(canvas);
              renderPage(page, canvas);
            }
  
            _this.modal.setContent(viewer);
            _this.modal.open();
          });
        },
        function (reason) {
          // PDF loading error
          console.error(JSON.stringify(reason));
        }
      );
    },
  
    renderPage: function(pageNumber, canvas) {
      this.thePdf.getPage(pageNumber).then(function (page) {
        console.log("Page rendering");
        var scale = 1.5;
        var viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport });
      });
    }
  }
})();        

