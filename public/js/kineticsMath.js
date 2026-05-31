class EnzymeKineticsMath {
    constructor(params = {}) {
        this.params = {
            Km: params.Km || 25,
            kcat: params.kcat || 100,
            Et: params.Et || 10,
            Kcat: params.Kcat || params.kcat || 100,
            KI: params.KI || null,
            KIS: params.KIS || null,
            inhibitorType: params.inhibitorType || 'none'
        };
    }

    setParams(params) {
        Object.assign(this.params, params);
    }

    getVmax() {
        return this.params.kcat * this.params.Et * 0.001;
    }

    getRate(S) {
        if (S <= 0.001) return 0;
        
        const { Km, kcat, Et, inhibitorType, KI, KIS } = this.params;
        const Vmax = this.getVmax();
        let denominator = Km + S;
        
        if (inhibitorType === 'competitive') {
            const factor = 1 + (this.params.I || 0) / KI;
            denominator = Km * factor + S;
        } else if (inhibitorType === 'noncompetitive') {
            const factor = 1 + (this.params.I || 0) / KI;
            return (Vmax / factor) * S / (Km + S);
        } else if (inhibitorType === 'uncompetitive') {
            const factor = 1 + (this.params.I || 0) / KIS;
            return Vmax * S / (Km + S * factor);
        }
        
        return Vmax * S / denominator;
    }

    getRateCurve(startS = 0, endS = 200, steps = 100) {
        const curve = [];
        const step = (endS - startS) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const S = startS + i * step;
            curve.push({ x: S, y: this.getRate(S) });
        }
        
        return curve;
    }

    simulateReaction(initialS, totalTime, timeStep = 0.1) {
        let S = initialS;
        const data = [];
        let time = 0;
        
        data.push({ time: 0, S: initialS, P: 0, rate: this.getRate(initialS) });
        
        while (time < totalTime && S > 0.001) {
            const rate = this.getRate(S);
            const deltaS = rate * timeStep;
            S = Math.max(0, S - deltaS);
            time += timeStep;
            
            data.push({ 
                time: parseFloat(time.toFixed(4)), 
                S: parseFloat(S.toFixed(4)), 
                P: parseFloat((initialS - S).toFixed(4)),
                rate: parseFloat(rate.toFixed(6))
            });
        }
        
        return data;
    }

    getLineweaverBurk(startS = 10, endS = 100, steps = 20) {
        const curve = [];
        const step = (endS - startS) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const S = startS + i * step;
            const v = this.getRate(S);
            if (v > 0.0001) {
                curve.push({ x: 1 / S, y: 1 / v });
            }
        }
        
        return curve;
    }

    getHanesWoolf(startS = 10, endS = 100, steps = 20) {
        const curve = [];
        const step = (endS - startS) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const S = startS + i * step;
            const v = this.getRate(S);
            if (v > 0.0001) {
                curve.push({ x: S, y: S / v });
            }
        }
        
        return curve;
    }

    getEadieHofstee(startS = 10, endS = 100, steps = 20) {
        const curve = [];
        const step = (endS - startS) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const S = startS + i * step;
            const v = this.getRate(S);
            if (v > 0.0001) {
                curve.push({ x: v / S, y: v });
            }
        }
        
        return curve;
    }

    static calculateKmFromData(data) {
        const sorted = [...data].sort((a, b) => a.x - b.x);
        const maxY = Math.max(...sorted.map(d => d.y));
        const halfVmax = maxY / 2;
        
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i - 1].y <= halfVmax && sorted[i].y >= halfVmax) {
                const t = (halfVmax - sorted[i - 1].y) / (sorted[i].y - sorted[i - 1].y);
                return sorted[i - 1].x + t * (sorted[i].x - sorted[i - 1].x);
            }
        }
        
        return null;
    }

    static calculateVmaxFromData(data) {
        return Math.max(...data.map(d => d.y));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnzymeKineticsMath;
}
