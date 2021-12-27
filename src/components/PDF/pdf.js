import getPdfjsDist from './getPdfjsDist'

export default {
    name: 'Pdf',
    props: {
        url: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'canvas'
        },
        pdfjsDistPath: {
            type: String,
            default: '.'
        }
    },
    data() {
        return {
            pdfViewer: null,
            pdfLinkService: null,
            currentScale: '1.0',//缩放比例
            loadingTask: null
        }
    },

    methods: {
        onPagesInit({ source }) {
            source.currentScaleValue = this.currentScale
        },
        async pdfLibInit() {
            let pdfjsLib = window.pdfjsLib;
            let pdfjsViewer = window.pdfjsViewer
            if (!pdfjsLib || !pdfjsViewer) {
                try {
                    await getPdfjsDist(this.pdfjsDistPath)
                    this.CMAP_URL = `${this.pdfjsDistPath}/pdf/cmaps/`;
                    // console.log( this.CMAP_URL)
                    pdfjsLib = window.pdfjsLib;
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `${this.pdfjsDistPath}/pdf/build/pdf.worker.js`
                    pdfjsViewer = window.pdfjsViewer
                } catch (error) {
                    // console.log(error)
                    // pdfjs文件获取失败
                    return
                }
            }

            const container = this.$refs.container
            const eventBus = new pdfjsViewer.EventBus();

            // (Optionally) enable hyperlinks within PDF files.
            const pdfLinkService = new pdfjsViewer.PDFLinkService({
                eventBus: eventBus,
            });
            this.pdfLinkService = pdfLinkService
            const pdfViewer = new pdfjsViewer.PDFViewer({
                container: container,
                eventBus: eventBus,
                linkService: pdfLinkService,
                renderer: this.type,
                textLayerMode: 0,
                downloadManager: new pdfjsViewer.DownloadManager({}),
                enableWebGL: true
            });
            this.pdfViewer = pdfViewer
            pdfLinkService.setViewer(pdfViewer);

            eventBus.on("pagesinit", this.onPagesInit);
        },
        renderPdf() {
            if (!this.url) { return }
            // Loading document.
            if (this.pdfViewer === null || this.pdfLinkService === null) {
                return
            }
            if (this.loadingTask !== null) {
                this.loadingTask.destroy()
                this.loadingTask = null
            }
            this.loadingTask = window.pdfjsLib.getDocument({
                cMapUrl: this.CMAP_URL,
                cMapPacked: true,
                url: this.url,
            });
            return this.loadingTask.promise.then((pdfDocument) => {
                if (pdfDocument.loadingTask.destroyed || !this.url) { return }
                this.pdfViewer.setDocument(pdfDocument)
                this.pdfLinkService.setDocument(pdfDocument, null);
                this.loadingTask = null
            }).catch(error => {
                console.log(error)
            });
        }
    },
    mounted() {
        this.pdfLibInit().then(() => {
            this.renderPdf()
        })
    },
    watch: {
        url() {
            // 如果存在pdfViewer则取消渲染
            if (this.pdfViewer) {
                this.pdfViewer._cancelRendering()
            }
            this.renderPdf()
        }
    },
    render() {
        return (
            <div class="pdf-view">
                <div id="viewerContainer" ref="container">
                    <div id="viewer" class="pdfViewer"/>
                </div>
            </div>
        )
    }
}