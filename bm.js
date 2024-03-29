
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
		
		this.Int = function(n) {
			return n;
		}
		
		this.tofloat = function(x) {
			return x;
		}
		
		this.signed = function(x, s) {
			return x * s;
		}
		
		this.shift = function(x, n) {
			return x * Math.pow(2, n);
		}
		
		this.mid = function(x, y) {
			return (x + y) * .5;
		}
		
		this.iterbits = function(x, func) {
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
				fp = fp * 2;
				func(Math.floor(fp));
				fp = fp - Math.floor(fp);
			}
		}
		
		this.abs = function(x) {
			return Math.abs(x);
		}
		
		this.eq = function(x, y) {
			return x === y;
		}
		
		this.lt = function(x, y) {
			return x < y;
		}
	};
	
	////// Dyadic Reals
	
	var R = bmjs.R = new FloatMath();
	R.gt = R.gt || function(x, y) { return R.lt(y, x); }
	R.ge = R.ge || function(x, y) { return ! R.lt(x, y); }
	R.le = R.le || function(x, y) { return ! R.gt(x, y); }
	
	////// Shift RNG 

	bmjs.LinConRNG = function(a, c) {
		/// Linear Congruence Random Number Generator
		/// 
		/// X[n+1] = (a X[n] + c) mod m
		/// 
		///	Here we set m = 2 ^ 30 (approx 1e9).
		/// 
		/// See [Knuth, AOCP Vol. 2] for detailed discussion and 
		/// the following rule for good choices of a and c:
		/// 
		/// 	.1 m < a < .99 m
		/// 	a mod 8 = 5
		///		c > 0, c = 1 for instance
		///		
		var mod = Math.pow(2, 30);
		
		a = Math.abs(a);
		if (a % 2 == 0) { a ++; }
		if (a < 3) { a = 3; }
		
		var cur = 123456789; // arbitrary seed
		
		this.random = function() {
			cur *= a
			cur = cur % mod;
			return cur / mod;
		}
		
		this.seed = function(s) {
			s = s % mod;
			s = s ^ 123456789; 
			if (s == 0) { s = 1; }
			cur = s;
			for (var i = 0; i < 30; i ++) {
				this.random();
			}
		}
	}
	
	////// RNG
	
	var RNG = bmjs.RNG = new bmjs.LinConRNG(368405565, 1);
	
	//////
	
	bmjs.rand = function(x){
		var BITS_PREC = 30;
		
		var res = 0;
		R.iterbits(x, function(bit) {
			var r = RNG.random() * Math.pow(2, BITS_PREC);
			if (bit) {
				res = res ^ r;
			}
		});
		return res * Math.pow(2, - BITS_PREC);
	}
	
	bmjs.nrand = function(x) {
		var N_SUM = 6;
		// var U = Int[-1/2, 1/2] x**2 dx = [ x**3/3 ][-1/2, 1/2] = 1/12
		// std U = 1/2sqrt3
		var _1_2sqrt3 = 1 / (2 * Math.sqrt(3));
		
		var res = 0;
		for (var i = 0; i < N_SUM; i ++) {
			RNG.seed(i * 42 + 13);
			var u = (bmjs.rand(x) - .5) * _1_2sqrt3;
			res += u;
		}
		res *= Math.sqrt(N_SUM);
		return res;
	}
	
	////////
	
	bmjs.bm = function(x, x0) {
		// x0 is an optional base to prevent numerical overflow.
		// x0 MUST have same sign as x if nonzero.
		// x0 MUST be a signed power of 2 if nonzero.
		
		var a = R.abs(x0) || R.Int(0);
		var b = R.eq(a, 0) ? R.Int(1) : R.shift(a, 1);
		var ab = R.eq(a, 0) ? b : a;
		var s = x >= 0 ? +1 : -1;
		x = R.abs(x);
		var ya = 0;
		var yb;
		var dW;
		var std;
		
		// hunt upwards
		while (1) {
			if (R.eq(x, a)) {
				return ya;
			}
			std = Math.sqrt(R.tofloat(ab));
			dW = bmjs.nrand(R.signed(b, s));
			yb = ya + dW * std;
			if (R.gt(b, x)) break;
			
			a = b;
			ya = yb;
			b = R.shift(b, 1);
			ab = R.shift(ab, 1);
		}
		
		// close in
		for (var i = 0; i < 1000; i ++) {
			if (R.eq(x, a)) {
				return ya;
			}
			var c = R.mid(a, b);
			std = Math.sqrt(R.tofloat(ab) / 2);
			dW = bmjs.nrand(R.signed(c, s));
			yc = (ya + yb) * .5 + dW * std;
			
			if (R.gt(c, x)) {
				b = c;
				yb = yc;
			} else {
				a = c;
				ya = yc;
			}
			ab = R.shift(ab, -1);
		}
	}
	
})(bmjs);

