export default class ParticleAnimation {
    constructor(canvas, config = {}) {
        this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        this.animationId = null;
        this.config = {
            backgroundColor: config.backgroundColor || '#0f0f23',
            showLabels: config.showLabels !== false,
            glowIntensity: config.glowIntensity || 15,
            enzymeCount: config.enzymeCount || 10,
            substrateCount: config.substrateCount || 30,
            enzymeRadius: config.enzymeRadius || 15,
            substrateRadius: config.substrateRadius || 8,
            productRadius: config.productRadius || 6,
            enzymeSpeed: config.enzymeSpeed || 0.5,
            substrateSpeed: config.substrateSpeed || 1.5
        };
    }

    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }

    createEnzyme(x, y) {
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * this.config.enzymeSpeed,
            vy: (Math.random() - 0.5) * this.config.enzymeSpeed,
            type: 'enzyme',
            radius: this.config.enzymeRadius,
            color: '#4dabf7'
        };
    }

    createSubstrate(x, y) {
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * this.config.substrateSpeed,
            vy: (Math.random() - 0.5) * this.config.substrateSpeed,
            type: 'substrate',
            radius: this.config.substrateRadius,
            color: '#ff6b6b'
        };
    }

    createProduct(x, y, vx, vy) {
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: vx || (Math.random() - 0.5) * this.config.substrateSpeed * 1.2,
            vy: vy || (Math.random() - 0.5) * this.config.substrateSpeed * 1.2,
            type: 'product',
            radius: this.config.productRadius,
            color: '#00ff88'
        };
    }

    init() {
        this.particles = [];
        
        for (let i = 0; i < this.config.enzymeCount; i++) {
            this.particles.push(this.createEnzyme());
        }
        
        for (let i = 0; i < this.config.substrateCount; i++) {
            this.particles.push(this.createSubstrate());
        }
        
        this.draw();
    }

    addParticles(type, count = 1) {
        for (let i = 0; i < count; i++) {
            if (type === 'enzyme') {
                this.particles.push(this.createEnzyme());
            } else if (type === 'substrate') {
                this.particles.push(this.createSubstrate());
            } else if (type === 'product') {
                this.particles.push(this.createProduct());
            }
        }
    }

    removeParticles(type, count = 1) {
        const toRemove = this.particles.filter(p => p.type === type).slice(0, count);
        toRemove.forEach(p => {
            const index = this.particles.indexOf(p);
            if (index > -1) {
                this.particles.splice(index, 1);
            }
        });
    }

    convertToProduct() {
        const substrates = this.particles.filter(p => p.type === 'substrate');
        if (substrates.length > 2) {
            const toConvert = substrates[Math.floor(Math.random() * substrates.length)];
            toConvert.type = 'product';
            toConvert.color = '#00ff88';
            toConvert.radius = this.config.productRadius;
            toConvert.vx *= 1.2;
            toConvert.vy *= 1.2;
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < particle.radius || particle.x > this.canvas.width - particle.radius) {
                particle.vx *= -1;
                particle.x = Math.max(particle.radius, Math.min(this.canvas.width - particle.radius, particle.x));
            }
            if (particle.y < particle.radius || particle.y > this.canvas.height - particle.radius) {
                particle.vy *= -1;
                particle.y = Math.max(particle.radius, Math.min(this.canvas.height - particle.radius, particle.y));
            }
        });
    }

    draw() {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = this.config.glowIntensity;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        if (this.config.showLabels) {
            this.ctx.font = '12px Microsoft YaHei';
            this.ctx.textAlign = 'left';

            const counts = this.getCounts();
            let y = 25;

            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillText(`● 底物: ${counts.substrates}`, 20, y);
            y += 20;

            this.ctx.fillStyle = '#4dabf7';
            this.ctx.fillText(`● 酶: ${counts.enzymes}`, 20, y);
            y += 20;

            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillText(`● 产物: ${counts.products}`, 20, y);
        }
    }

    getCounts() {
        return {
            substrates: this.particles.filter(p => p.type === 'substrate').length,
            enzymes: this.particles.filter(p => p.type === 'enzyme').length,
            products: this.particles.filter(p => p.type === 'product').length
        };
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.draw();
    }

    clear() {
        this.particles = [];
        this.draw();
    }

    reset() {
        this.init();
    }
}
