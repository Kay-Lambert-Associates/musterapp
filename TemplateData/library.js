mergeInto(LibraryManager.library, {
    pdfjsLib: {},
    thePdf: {},
    modal: {},
    base64ToPdf__deps: [
        'modal',
        'pdfjsLib',
        'thePdf'
    ],
    base64ToPdf: function (pdfString, isLeader) {
        var _this = this;
        var _isLeader = isLeader;
        if (!pdfString) {
            console.error('The pdf string must not be empty');
            return;
        }
        if (typeof Pointer_stringify !== 'undefined') {
            pdfString = Pointer_stringify(pdfString);
        }
        _modal = new tingle.modal({
            footer: false,
            stickyFooter: false,
            closeMethods: [
                'button',
                'escape'
            ],
            cssClass: ['tingle-force-overflow'],
            onOpen: function () {
                if (!_isLeader || isLeader === false) {
                    var closeButton = document.getElementsByClassName('tingle-modal__close')[0];
                    closeButton.parentNode.removeChild(closeButton);
                }
                if (typeof gameInstance !== 'undefined') {
                    gameInstance.SetFullscreen(0);
                }
            },
            onClose: function () {
                if (typeof gameInstance !== 'undefined') {
                    gameInstance.SetFullscreen(1);
                }
                _modal.destroy();
            },
            beforeClose: function () {
                if (!_isLeader || _isLeader == false) {
                    return false;
                }
                return true;
            }
        });
        _pdfjsLib = window['pdfjs-dist/build/pdf'];
        _pdfjsLib.GlobalWorkerOptions.workerSrc = './TemplateData/pdf.worker.js';
        var viewer = document.createElement('div');
        viewer.setAttribute('id', 'pdf-viewer');
        var pdfData = atob(pdfString);
        var loadingTask = _pdfjsLib.getDocument({ data: pdfData });
        loadingTask.promise.then(function (pdf) {
            console.log('PDF loaded');
            _thePdf = pdf;
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function (page) {
                console.log('Page loaded');
                for (page = 1; page <= pdf.numPages; page++) {
                    var canvas = document.createElement('canvas');
                    canvas.className = 'pdf-page-canvas';
                    viewer.appendChild(canvas);
                    _this.renderPage(page, canvas);
                }
                _modal.setContent(viewer);
                _modal.open();
            });
        }, function (reason) {
            console.error(JSON.stringify(reason));
        });
    },
    closePdf__deps: ['modal'],
    closePdf: function () {
        _modal.close();
    },
    renderPage__deps: ['thePdf'],
    renderPage: function (pageNumber, canvas) {
        _thePdf.getPage(pageNumber).then(function (page) {
            console.log('Page rendering');
            var scale = 1.5;
            var viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            });
        });
    }
});
