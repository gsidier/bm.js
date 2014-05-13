
var bmjs = bmjs || { };

(function(bmjs) {
	// numbers are represented using Arrays of Integers
	
	bmjs.dyadic = function(ip, fp) {
		// both ip and fp are Arrays of Number with isSafeInteger = true.
		// ip: integral part. 
		// fp: fractional part.
		this.ip = ip;
		this.fp = fp;
		this.bpp = 30;
		
		
	};
	
	////// implementation using doubles
	
	function FloatMath() {
		
		this.Int = function Int(n) {
			return n;
		}
		
		this.tofloat = function tofloat(x) {
			return x;
		}
		
		this.signed = function signed(x, s) {
			return x * s;
		}
		
		this.shift = function shift(x, n) {
			return x * Math.pow(2, n);
		}
		
		this.mid = function mid(x, y) {
			return (x + y) * .5;
		}
		
		this.iterbits = function iterbits(x, func) {
			// iterate over a series of bits that uniquely encodes x
			// first return the sign
			if (x >= 0) func(0); else func(1);
			x = Math.abs(x);
			// next iterate alternatingly between integer part and fractional part bits
			var ip = Math.floor(x);
			var fp = x - ip;
			while (ip > 1e-10 || fp > 1e-15) {
				func(ip & 1);
				ip = ip >> 1;
				fp = fp << 1;
				func(Math.floor(fp));
				fp = fp - Math.floor(fp);
			}
		}
		
		this.abs = function abs(x) {
			return Math.abs(x);
		}
		
		this.eq = function eq(x, y) {
			return x === y;
		}
		
		this.lt = function lt(x, y) {
			return x < y;
		}
	};
	
	////// Dyadic Reals
	
	var R = new FloatMath();
	R.gt = R.gt || function(x, y) { return R.lt(y, x); }
	R.ge = R.ge || function(x, y) { return ! R.lt(x, y); }
	R.le = R.le || function(x, y) { return ! R.gt(x, y); }
	
	//////
	
	bmjs.rand = function rand(x){
		var BITS_PREC = 30;
		
		var res = 0;
		R.iterbits(x, function(bit) {
			var r = Math.random() * Math.pow(2, BITS_PREC);
			if (bit) {
				res = res ^ r;
			}
		});
		return res * Math.pow(2, - BITS_PREC);
	}
	
	function seed(s) {
		// XXX TODO 
	}
	
	bmjs.nrand = function nrand(x) {
		var N_SUM = 6;
		// var U = Int[-1/2, 1/2] x**2 dx = [ x**3/3 ][-1/2, 1/2] = 1/12
		// std U = 1/2sqrt3
		var _1_2sqrt3 = 1 / (2 * Math.sqrt(3));
		
		var res = 0;
		for (var i = 0; i < N_SUM; i ++) {
			seed(i * 42 + 13);
			var u = (rand(x) - .5) * _1_2sqrt3;
			res += u;
		}
		res *= Math.sqrt(N_SUM);
		return res;
	}
	
	////////
	
	bmjs.bm = function bm(x, x0) {
		// x0 is an optional base to prevent numerical overflow.
		// x0 MUST have same sign as x if nonzero.
		// x0 MUST be a signed power of 2 if nonzero.
		
		var a = R.abs(x0) || R.Int(0);
		var b = R.eq(a, 0) ? R.Int(1) : R.shift(a, 1);
		var ab = R.eq(a, 0) ? b : a;
		var s = x >= 0 ? +1 : -1;
		x = R.abs(x);
		var res = 0;
		
		var std = Math.sqrt(R.tofloat(ab));
		var dW = bmjs.nrand(R.signed(b, s));
		while (b < x) {
			x += std * dW;
			
		}
	}
	
})(bmjs);

