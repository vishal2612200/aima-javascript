// Common component elements

/**
 * Fallback component for loading
 */
class FallbackComponent extends React.Component {
    render() {
        return e('div', { className: "loader center" }, null);
    }
}

/**
 * Reveals child component
 */
class Revealer extends React.Component {
    componentDidMount() {
        $(`#${this.props.baseId}-container`).hide();
    }
    render() {
        return e('div', null,
            e('div', {
                id: `${this.props.baseId}-button`,
                className: 'center btn btn-info',
                style: { marginTop: '5%', marginBottom: '5%' },
                onClick: () => {
                    $(`#${this.props.baseId}-container`).slideDown();
                    $(`#${this.props.baseId}-button`).hide();
                }
            }, this.props.promptText),
            e('div', { id: `${this.props.baseId}-container` },
                this.props.children
            ),
        );
    }
}

/**
 * Grid cell
 */
class Cell extends React.Component {

    render() {

        return e('div', {
            className: 'square',
            style: {
                border: this.props.highlightColor ? `0.1vw solid ${this.props.highlightColor}` : '0.05vw solid gray',
                backgroundColor: this.props.bgColor,
                cursor: this.props.handleMouseOver ? 'none' : null,
            },
            onMouseOver: this.props.handleMouseOver ? this.props.handleMouseOver : null,
        },
            this.props.children
        );
    }
}

/**
 * Upload image button
 * 
 * Provides button for uploading image to document
 * and processing it
 */
class ImageUploader extends React.Component {

    render() {

        return e('div', { style: { marginRight: 10 } },
            e('img', {
                src: this.props.defaultImage,
                id: `${this.props.imageId}-img`,
                hidden: true,
                onLoad: () => this.props.processHandler(),
            }, null),

            e('div', { className: 'btn-group' },
                e('label', { className: 'btn btn-success' },
                    e('input', {
                        id: `${this.props.imageId}-input`,
                        type: 'file',
                        name: `${this.props.imageId}-input`,
                        accept: 'image/x-png,image/gif,image/jpeg',
                        style: { display: 'none' },
                        onChange: () => {
                            this.props.changeHandler && this.props.changeHandler();
                            document.body.style.opacity = '0.3';
                            readURL(`${this.props.imageId}-img`, document.getElementById(`${this.props.imageId}-input`))
                                .then((result) => this.props.processHandler())
                                .catch((err) => {
                                    if(!err instanceof NoImageError){
                                        throw err;
                                    }
                                })
                                .finally(() => {
                                    document.body.style.opacity = '1';
                                });
                        },
                    }, null),
                    e('i', { className: 'fas fa-upload' }, null),
                ),
                e('div', {
                    className: 'btn btn-info',
                    onClick: () => {
                        this.props.changeHandler && this.props.changeHandler();
                        let img = document.getElementById(`${this.props.imageId}-img`);
                        img.src = this.props.defaultImage;
                        this.props.processHandler();
                    }
                },
                    e('i', { className: 'fas fa-undo' }, null)
                ),
            ),
        );
    }
}

/**
 * Webcam capture
 */
class WebcamCapture extends React.Component {

    render() {

        return e('div', { style: { marginRight: 10 } },
            e('video', {
                autoPlay: true,
                id: `${this.props.imageId}-webcam`,
                hidden: true,
            }, null),
            e('div', {
                className: this.props.isRecording ? 'btn btn-danger' : 'btn btn-primary',
                onClick: () => {
                    this.props.changeHandler();
                },
            },
                e('i', { className: this.props.isRecording ? 'fas fa-stop' : 'fas fa-video' }, null)),
        );
    }
}

/**
 * Gradient grid canvas
 */
class GradientGrid extends React.Component {

    constructor(props) {
        super(props);
        this.canvas = null;
    }

    componentDidMount() {
        this.canvas = document.getElementById(`${this.props.idBase}-canvas`);
        let currRow = -1;
        let currCol = -1;

        const draw = (e) => {
            const a = this.canvas.getBoundingClientRect();
            const cursorRatioX = (e.pageX - a.left - window.pageXOffset) / a.width;
            const cursorRatioY = (e.pageY - a.top - window.pageYOffset) / a.height;
            const col = Math.floor(this.props.source.width * cursorRatioX);
            const row = Math.floor(this.props.source.height * cursorRatioY);

            if (row != currRow || col != currCol) {
                currRow = row;
                currCol = col;
                this.props.drawHandler(currRow, currCol);
            }
        }

        this.canvas.addEventListener('mousemove', (e) => isMouseDown && draw(e));
        this.canvas.addEventListener('click', (e) => draw(e));

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e.touches[0]);
        });
    }

    process() {
        if (!this.canvas) {
            return;
        }

        // Set max and min mags
        const minMag = 0;
        const maxMag = 1141;

        const context = this.canvas.getContext('2d');
        const pixelDelta = this.canvas.width / this.props.source.width;

        for (let i = 0; i < this.props.source.height; i++) {
            for (let j = 0; j < this.props.source.width; j++) {
                const value = this.props.source.getValue(i, j);

                // Draw cell
                context.fillStyle = `rgb(${value}, ${value}, ${value})`;
                context.fillRect(j * pixelDelta, i * pixelDelta, pixelDelta, pixelDelta);

                // Draw cell border
                context.strokeStyle = 'grey'
                if (this.props.highlightMask) {
                    context.strokeStyle = this.props.highlightMask.getValue(i, j);
                }
                context.strokeRect(j * pixelDelta, i * pixelDelta, pixelDelta, pixelDelta);

                // Draw gradient arrow
                const isShowGrad = i > 0 && j > 0 && i < this.props.magGrid.height - 1 && j < this.props.magGrid.width - 1;
                const ratio = (this.props.magGrid.getValue(i, j) - minMag) / (maxMag - minMag);
                const dx = this.props.sobelX.getValue(i, j) / this.props.magGrid.getValue(i, j);
                const dy = this.props.sobelY.getValue(i, j) / this.props.magGrid.getValue(i, j);

                context.save();
                context.lineWidth = 3;
                context.beginPath();
                if (!isShowGrad || Number.isNaN(dx) && Number.isNaN(dy)) {
                    context.globalAlpha = 0.5;
                    context.strokeStyle = 'pink';
                    canvasCross(context, j * pixelDelta + pixelDelta / 2, i * pixelDelta + pixelDelta / 2, 5);
                }
                else {
                    context.lineWidth = 5 * ratio + 1;
                    context.strokeStyle = 'blue';
                    const lenWeight = 10 * ratio + 2;
                    const headLen = 5 * ratio + 2
                    const arrowX = j * pixelDelta + pixelDelta / 2;
                    const arrowY = i * pixelDelta + pixelDelta / 2;
                    canvas_arrow(context, arrowX, arrowY, lenWeight * dx + arrowX, -lenWeight * dy + arrowY, headLen);
                }
                context.stroke();
                context.restore();
            }
        }
    }

    render() {

        this.process();

        return e('canvas', {
            id: `${this.props.idBase}-canvas`,
            width: 800,
            height: 800,
            style: {
                width: '100%'
            }
        }, null);
    }
}

/**
 * Displays RGB grid
 */
class RGBGrid extends React.Component {

    render() {

        let cells = [];
        for (let i = 0; i < this.props.grid.height; i++) {
            for (let j = 0; j < this.props.grid.width; j++) {
                const r = this.props.grid.getValue(i, j, 0);
                const g = this.props.grid.getValue(i, j, 1);
                const b = this.props.grid.getValue(i, j, 2);
                cells.push(
                    e(Cell, {
                        key: `rgbcell-${i}-${j}`,
                        bgColor: `rgb(${r}, ${g}, ${b})`,
                    }, null)
                );
            }
        }

        return e('div', {
            className: 'square-grid-base',
            style: {
                gridTemplateColumns: `repeat(${this.props.grid.width}, ${this.props.cellSize}em)`,
                gridTemplateRows: `repeat(${this.props.grid.height}, ${this.props.cellSize}em)`,
            }
        }, cells);
    }
}

/**
 * Magnifies pixel array
 */
class PixelMagnifier extends React.Component {

    constructor(props) {
        super(props);

        this.magnifySize = 20;
        this.cellSize = 0.3;

        this.state = {
            cursorX: 0,
            cursorY: 0,
            magnifyGrid: new Array2D([], 5, 5, 4),
            magnifyVisible: false,
        }
    }

    componentDidMount() {
        // Create magnifier
        const canvas = document.getElementById(`${this.props.imageId}-canvas`);
        const context = canvas.getContext('2d');
        const magnifier = document.getElementById(`${this.props.imageId}-rgb-magnifier`);
        const updateFunc = (e) => {

            const a = canvas.getBoundingClientRect();

            // Lock magnifier to image
            let cursorX = e.pageX - magnifier.offsetWidth / 2;
            let cursorY = e.pageY - magnifier.offsetHeight / 2;
            cursorX = Math.min(a.right + window.pageXOffset - magnifier.offsetWidth, Math.max(a.left + window.pageXOffset, cursorX));
            cursorY = Math.min(a.bottom + window.pageYOffset - magnifier.offsetHeight, Math.max(a.top + window.pageYOffset, cursorY));

            // Get selected area
            const ratioX = (cursorX + magnifier.offsetWidth / 2 - a.left - window.pageXOffset) / a.width;
            const ratioY = (cursorY + magnifier.offsetHeight / 2 - a.top - window.pageYOffset) / a.height;
            const imgData = context.getImageData(
                Math.floor(ratioX * canvas.width) - Math.floor(this.magnifySize / 2),
                Math.floor(ratioY * canvas.height) - Math.floor(this.magnifySize / 2),
                this.magnifySize, this.magnifySize
            );

            this.setState({
                cursorX: cursorX,
                cursorY: cursorY,
                magnifyGrid: new Array2D([...imgData.data], this.magnifySize, this.magnifySize, 4),
                magnifyVisible: true,
            });
        }

        // Magnifier events
        magnifier.addEventListener('mouseleave', (e) => {
            this.setState({ magnifyVisible: false });
        });
        canvas.addEventListener('mouseleave', (e) => {
            this.setState({ magnifyVisible: false });
        });
        canvas.addEventListener('mousemove', updateFunc);
        magnifier.addEventListener('mousemove', updateFunc);

        magnifier.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.setState({ magnifyVisible: false });
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.setState({ magnifyVisible: false });
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            updateFunc(e.touches[0]);
        });
        magnifier.addEventListener('touchmove', (e) => {
            e.preventDefault();
            updateFunc(e.touches[0]);
        });

        $(window).resize(() => {
            this.setState({ magnifyVisible: false });
        });
    }

    render() {
        return e('div', {
            id: `${this.props.imageId}-rgb-magnifier`,
            style: {
                position: 'absolute',
                border: '3.2em solid pink',
                cursor: 'none',
                visibility: this.state.magnifyVisible && !this.props.isRecording ? 'visible' : 'hidden',

                width: `${this.cellSize * (this.state.magnifyGrid.width + 0.5)}em`,
                height: `${this.cellSize * (this.state.magnifyGrid.height + 0.5)}em`,
                left: this.state.cursorX,
                top: this.state.cursorY,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }
        },
            e(RGBGrid, { grid: this.state.magnifyGrid, cellSize: this.cellSize }, null),
        );
    }
}