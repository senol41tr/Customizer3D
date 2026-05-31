import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=106';

export class RulerSlider
{
    constructor(canvas, value, options)
    {
        this.canvas = typeof canvas == 'string' ? document.querySelector(canvas) : canvas;
        this.ctx = this.canvas.getContext('2d');
        this.valueDisplay = typeof value == 'string' ? document.querySelector(value) : value;

        this.min = options.min !== undefined ? options.min : -1.0;
        this.max = options.max !== undefined ? options.max : 1.0;
        this._value = options.value !== undefined ? options.value : 0.0;
        this.toFixed = options.toFixed !== undefined ? options.toFixed : 0;
        this.step = options.step !== undefined ? options.step : 4;
        this.suffix = options.suffix !== undefined ? options.suffix : '';
        this.onChange = options.onChange || null;

        this.isDragging = false;
        this.padding = 10;
        this.totalRange = this.max - this.min;

        this.snapThreshold = this.totalRange * 0.005;

        this.initEvents();
        this.render();
    }

    set value(val)
    {
        this._value = val;
        this.render();
    }

    initEvents()
    {
        if(isMobile())
        {
            this.canvas.addEventListener('touchstart', (e) =>
            {
                this.isDragging = true;
                this.canvas.setPointerCapture(e.pointerId);
                this.updateValueFromCoords(e.touches[0].clientX);
            });

            this.canvas.addEventListener('touchmove', (e) =>
            {
                if (!this.isDragging) return;
                this.updateValueFromCoords(e.touches[0].clientX);
            });

            this.canvas.addEventListener('touchend', (e) =>
            {
                this.isDragging = false;
                this.canvas.releasePointerCapture(e.pointerId);
            });
        }
        else
        {
            this.canvas.addEventListener('pointerdown', (e) =>
            {
                this.isDragging = true;
                this.canvas.setPointerCapture(e.pointerId);
                this.updateValueFromCoords(e.clientX);
            });

            this.canvas.addEventListener('pointermove', (e) =>
            {
                if (!this.isDragging) return;
                this.updateValueFromCoords(e.clientX);
            });

            this.canvas.addEventListener('pointerup', (e) =>
            {
                this.isDragging = false;
                this.canvas.releasePointerCapture(e.pointerId);
            });
        }
    }

    updateValueFromCoords(clientX)
    {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const x = (clientX - rect.left) * scaleX;

        const usableWidth = this.canvas.width - (this.padding * 2);

        let pct = (x - this.padding) / usableWidth;
        pct = Math.min(Math.max(pct, 0), 1);

        let newValue = this.min + pct * this.totalRange;

        if (this.min === 0.0)
        {
            if (newValue < this.snapThreshold)
            {
                newValue = 0.0;
            }
        }
        else if (this.min < 0 && this.max > 0)
        {
            if (Math.abs(newValue) < this.snapThreshold)
            {
                newValue = 0.0;
            }
        }

        this._value = newValue;
        this.render();

        if (this.onChange)
        {
            this.onChange(this._value);
        }
    }

    render()
    {
        const root = document.querySelector(':root');
        const cs = window.getComputedStyle(root);
        const primary_color = cs.getPropertyValue('--customizerColorPrimary');
        const text_color = cs.getPropertyValue('--customizerColorText');

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const usableWidth = w - (this.padding * 2);

        let zeroPct = (0.0 - this.min) / this.totalRange;
        zeroPct = Math.min(Math.max(zeroPct, 0), 1);
        const zeroX = this.padding + zeroPct * usableWidth;

        ctx.clearRect(0, 0, w, h);

        const totalTicks = this.max / this.step;
        ctx.lineWidth = 2;
        ctx.strokeStyle = text_color;
        for (let i = 0; i < totalTicks; i++)
        {
            const pct = i / (totalTicks - 1);
            const x = this.padding + pct * usableWidth;
            ctx.beginPath();
            ctx.moveTo(x, h * 0.4);
            ctx.lineTo(x, h * 0.7);
            ctx.stroke();
        }

        const currentPct = (this._value - this.min) / this.totalRange;
        const currentX = this.padding + currentPct * usableWidth;

        ctx.fillStyle = this._value === 0.0 ? "transparent" : text_color;
        const barY = h * 0.4;
        const barHeight = h * 0.3;
        const barWidth = currentX - zeroX;

        ctx.fillRect(zeroX, barY, barWidth, barHeight);

        ctx.lineWidth = 6;
        ctx.strokeStyle = text_color;
        ctx.beginPath();
        ctx.moveTo(zeroX, h * 0.35);
        ctx.lineTo(zeroX, h * 0.75);
        ctx.stroke();

        ctx.fillStyle = text_color;
        ctx.beginPath();
        ctx.moveTo(currentX, h * 0.35);
        ctx.lineTo(currentX - 5, h * 0.18);
        ctx.lineTo(currentX + 5, h * 0.18);
        ctx.closePath();
        ctx.fill();

        if (this.valueDisplay)
        {
            this.valueDisplay.innerText = this._value.toFixed(this.toFixed) + this.suffix;
            this.valueDisplay.style.color = text_color;
        }
    }
}