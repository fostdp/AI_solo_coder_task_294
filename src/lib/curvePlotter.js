export default class CurvePlotter {
    constructor(canvas, config = {}) {
        this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
        this.ctx = this.canvas.getContext('2d');
        this.datasets = [];
        this.config = {
            padding: config.padding || { left: 60, right: 20, top: 30, bottom: 50 },
            backgroundColor: config.backgroundColor || '#0f0f23',
            gridColor: config.gridColor || 'rgba(255, 255, 255, 0.1)',
            axisColor: config.axisColor || 'rgba(255, 255, 255, 0.5)',
            textColor: config.textColor || '#ffffff',
            showGrid: config.showGrid !== false,
            showLegend: config.showLegend !== false,
            legendPosition: config.legendPosition || 'topRight',
            xAxis: config.xAxis || { label: 'X', min: null, max: null },
            yAxis: config.yAxis || { label: 'Y', min: null, max: null },
            animation: config.animation !== false,
            animationProgress: 1
        };
    }

    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }

    addDataset(data, config = {}) {
        const dataset = {
            data: data,
            color: config.color || '#00d4ff',
            label: config.label || `Dataset ${this.datasets.length + 1}`,
            lineWidth: config.lineWidth || 2,
            showPoints: config.showPoints || false,
            pointRadius: config.pointRadius || 3,
            pointColor: config.pointColor || config.color || '#00d4ff',
            dash: config.dash || [],
            highlightPoints: config.highlightPoints || []
        };
        this.datasets.push(dataset);
        return dataset;
    }

    clearDatasets() {
        this.datasets = [];
    }

    removeDataset(index) {
        this.datasets.splice(index, 1);
    }

    getDataBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.x < minX) minX = point.x;
                if (point.x > maxX) maxX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.y > maxY) maxY = point.y;
            });
        });

        return { minX, maxX, minY, maxY };
    }

    getAxisRange() {
        const bounds = this.getDataBounds();
        const xMin = this.config.xAxis.min !== null ? this.config.xAxis.min : Math.min(0, bounds.minX);
        const xMax = this.config.xAxis.max !== null ? this.config.xAxis.max : bounds.maxX * 1.05;
        const yMin = this.config.yAxis.min !== null ? this.config.yAxis.min : Math.min(0, bounds.minY);
        const yMax = this.config.yAxis.max !== null ? this.config.yAxis.max : bounds.maxY * 1.05;

        return { xMin, xMax, yMin, yMax };
    }

    toCanvasCoords(x, y, range) {
        const { xMin, xMax, yMin, yMax } = range;
        const { padding } = this.config;
        const width = this.canvas.width - padding.left - padding.right;
        const height = this.canvas.height - padding.top - padding.bottom;

        const canvasX = padding.left + ((x - xMin) / (xMax - xMin)) * width;
        const canvasY = this.canvas.height - padding.bottom - ((y - yMin) / (yMax - yMin)) * height;

        return { x: canvasX, y: canvasY };
    }

    drawBackground() {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid(range) {
        if (!this.config.showGrid) return;

        const { padding } = this.config;
        const { xMin, xMax, yMin, yMax } = range;
        const width = this.canvas.width - padding.left - padding.right;
        const height = this.canvas.height - padding.top - padding.bottom;

        this.ctx.strokeStyle = this.config.gridColor;
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 10; i++) {
            const x = padding.left + (width * i) / 10;
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding.top);
            this.ctx.lineTo(x, this.canvas.height - padding.bottom);
            this.ctx.stroke();

            const y = padding.top + (height * i) / 10;
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(this.canvas.width - padding.right, y);
            this.ctx.stroke();
        }
    }

    drawAxes(range) {
        const { padding } = this.config;
        const { xMin, xMax, yMin, yMax } = range;

        this.ctx.strokeStyle = this.config.axisColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const origin = this.toCanvasCoords(xMin, yMin, range);

        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(this.canvas.width - padding.right, origin.y);
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(origin.x, padding.top);
        this.ctx.stroke();

        this.ctx.fillStyle = this.config.textColor;
        this.ctx.font = '12px Microsoft YaHei';
        this.ctx.textAlign = 'center';

        for (let i = 0; i <= 10; i++) {
            const xVal = xMin + (xMax - xMin) * i / 10;
            const pos = this.toCanvasCoords(xVal, yMin, range);
            this.ctx.fillText(xVal.toFixed(1), pos.x, pos.y + 20);
        }

        this.ctx.textAlign = 'right';
        for (let i = 0; i <= 10; i++) {
            const yVal = yMin + (yMax - yMin) * i / 10;
            const pos = this.toCanvasCoords(xMin, yVal, range);
            this.ctx.fillText(yVal.toFixed(2), pos.x - 10, pos.y + 4);
        }

        this.ctx.font = '14px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.config.xAxis.label,
            this.canvas.width / 2,
            this.canvas.height - 10
        );

        this.ctx.save();
        this.ctx.translate(15, this.canvas.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText(this.config.yAxis.label, 0, 0);
        this.ctx.restore();
    }

    drawCurve(dataset, range) {
        if (dataset.data.length < 2) return;

        const progress = this.config.animation ? this.config.animationProgress : 1;
        const visiblePoints = Math.max(2, Math.floor(dataset.data.length * progress));
        const visibleData = dataset.data.slice(0, visiblePoints);

        this.ctx.strokeStyle = dataset.color;
        this.ctx.lineWidth = dataset.lineWidth;
        this.ctx.setLineDash(dataset.dash);
        this.ctx.beginPath();

        visibleData.forEach((point, i) => {
            const pos = this.toCanvasCoords(point.x, point.y, range);
            if (i === 0) {
                this.ctx.moveTo(pos.x, pos.y);
            } else {
                this.ctx.lineTo(pos.x, pos.y);
            }
        });

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (dataset.showPoints || dataset.highlightPoints.length > 0) {
            this.ctx.fillStyle = dataset.pointColor;
            visibleData.forEach((point, i) => {
                if (dataset.showPoints || dataset.highlightPoints.includes(i)) {
                    const pos = this.toCanvasCoords(point.x, point.y, range);
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, dataset.pointRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        }
    }

    drawLegend() {
        if (!this.config.showLegend || this.datasets.length === 0) return;

        const { padding } = this.config;
        const legendWidth = 150;
        const legendHeight = 20 + this.datasets.length * 25;
        let x, y;

        switch (this.config.legendPosition) {
            case 'topLeft':
                x = padding.left + 10;
                y = padding.top + 10;
                break;
            case 'topRight':
            default:
                x = this.canvas.width - padding.right - legendWidth - 10;
                y = padding.top + 10;
                break;
        }

        this.ctx.fillStyle = 'rgba(15, 15, 35, 0.9)';
        this.ctx.fillRect(x, y, legendWidth, legendHeight);
        this.ctx.strokeStyle = this.config.axisColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, legendWidth, legendHeight);

        this.ctx.font = '12px Microsoft YaHei';
        this.ctx.textAlign = 'left';

        this.datasets.forEach((dataset, i) => {
            const lineY = y + 20 + i * 25;

            this.ctx.strokeStyle = dataset.color;
            this.ctx.lineWidth = dataset.lineWidth;
            this.ctx.setLineDash(dataset.dash);
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, lineY);
            this.ctx.lineTo(x + 40, lineY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            if (dataset.showPoints) {
                this.ctx.fillStyle = dataset.pointColor;
                this.ctx.beginPath();
                this.ctx.arc(x + 25, lineY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.fillStyle = this.config.textColor;
            this.ctx.fillText(dataset.label, x + 50, lineY + 4);
        });
    }

    render() {
        if (this.datasets.length === 0) {
            this.drawBackground();
            return;
        }

        const range = this.getAxisRange();
        this.drawBackground();
        this.drawGrid(range);
        this.drawAxes(range);
        this.datasets.forEach(dataset => this.drawCurve(dataset, range));
        this.drawLegend();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }

    animate(duration = 1000) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            this.config.animationProgress = Math.min(1, elapsed / duration);
            this.render();
            
            if (this.config.animationProgress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    getCanvasPoint(x, y) {
        const range = this.getAxisRange();
        const { padding } = this.config;
        const width = this.canvas.width - padding.left - padding.right;
        const height = this.canvas.height - padding.top - padding.bottom;
        const { xMin, xMax, yMin, yMax } = range;

        const dataX = xMin + ((x - padding.left) / width) * (xMax - xMin);
        const dataY = yMin + ((this.canvas.height - padding.bottom - y) / height) * (yMax - yMin);

        return { x: dataX, y: dataY };
    }

    findNearestPoint(x, y, maxDistance = 50) {
        const range = this.getAxisRange();
        let nearest = null;
        let minDist = Infinity;

        this.datasets.forEach((dataset, datasetIndex) => {
            dataset.data.forEach((point, pointIndex) => {
                const canvasPos = this.toCanvasCoords(point.x, point.y, range);
                const dist = Math.sqrt(Math.pow(canvasPos.x - x, 2) + Math.pow(canvasPos.y - y, 2));
                
                if (dist < minDist && dist < maxDistance) {
                    minDist = dist;
                    nearest = { dataset, datasetIndex, point, pointIndex, distance: dist };
                }
            });
        });

        return nearest;
    }
}
