var video = document.querySelector('video');
var diff = [];
var COLS = 40;
var ROWS = 30;
var WIDTH = 1200;
var HEIGHT = 900;
var initialized = false;
var showCardWaiting = 0;
var scratching = false;
var freezing = false;


function getWebcam(){
	navigator.getMedia =  navigator.getUserMedia ||
        								navigator.webkitGetUserMedia ||
								        navigator.mozGetUserMedia ||
								        navigator.msGetUserMedia;

  if (navigator.getMedia) {
		navigator.getMedia (
			{
				video: true
			},
			function(localMediaStream){
				console.log('success callback');
				video.src = window.URL.createObjectURL(localMediaStream);
				video.onloadedmetadata = function(e) {
		      setTimeout(function(){
		      	initialized = true;
		      	onFrame();
		      },1000);
		    };
			},
		  function(e){
	   		console.log(e);
	   	}
		);
	}
}

function Source(width, height) {
	this.cols = COLS;
	this.rows = ROWS;
	this.width = width;
	this.height = height;
	this.colWidth = width / this.cols;
	this.rowHeight = height / this.rows;
	this.currentFrame = null;
	this.previousFrame = null;
	this.canvas = document.getElementById('sourceCanvas');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
}

Source.prototype.drawCanvas = function() {
	var c = this.canvas.getContext('2d');
	var width = this.canvas.width;
	var height = this.canvas.height;
	c.save();
	c.scale(-1, 1);
  c.drawImage(video, -width, 0, width, height);
  c.restore();
  this.storeFrames();
}

Source.prototype.storeFrames = function() {
	var c = this.canvas.getContext('2d');
	var width = this.canvas.width;
	var height = this.canvas.height;
	//console.log('previousFrame: '+sourceCanvas.previousFrame);
	//console.log('currentFrame: '+sourceCanvas.currentFrame);

	if (this.previousFrame === null) {
		this.previousFrame = c.getImageData(0, 0, width, height);

	}
	else {
		if (this.currentFrame !== null) {
			this.previousFrame = this.currentFrame;
		}
		this.currentFrame = c.getImageData(0, 0, width, height);
		this.detect();
	}
}

Source.prototype.detect = function() {
	diff = [];
	var previous = this.previousFrame;
	var current = this.currentFrame;

	for(var r = 0; r < this.rows; r++) {
		for(var c = 0; c < this.cols; c++) {
			var x = c * this.colWidth + Math.floor(this.colWidth / 2);
			var y = r * this.rowHeight + Math.floor(this.rowHeight / 2);
			var pixelPos = (this.canvas.width * 4) * y + x * 4;

			var dr = Math.abs(previous.data[pixelPos] - current.data[pixelPos]);
			var dg = Math.abs(previous.data[pixelPos + 1] - current.data[pixelPos + 1]);
			var db = Math.abs(previous.data[pixelPos + 2] - current.data[pixelPos + 2]);

			// motion detected
			if((dr + dg + db) >= 90) {
				diff.push([c, r]);
			}
		}
	}
	frontCanvas.scratch();
}

function Back(width, height) {
	this.width = width;
	this.height = height;
	this.canvas = document.getElementById('backCanvas');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
}

Back.prototype.drawCanvas = function() {
	var c = this.canvas.getContext('2d');
	var width = this.canvas.width;
	var height = this.canvas.height;
	if(scratching) {
		c.save();
		c.scale(-1, 1);
	  c.drawImage(video, -width, 0, width, height);
	  c.restore();
	}
	else{
		c.putImageData(this.captureFrame, 0, 0);
	}
}

Back.prototype.capture = function(argument) {
	this.captureFrame = sourceCanvas.currentFrame;
}

Back.prototype.post = function() {

	$.ajax({
    url: '/cards',
    data: { card: {url: this.canvas.toDataURL()} },
    type: 'POST',
    dataType:'text'
  }).done(function(data){
  		var hashed_id = data;
  		document.getElementById("qrcode").innerHTML = '';
  		var qrcode = new QRCode(document.getElementById("qrcode"), {
			    text: "http://scratch-rails.herokuapp.com/cards/" + hashed_id,
			    width: 160,
			    height: 160,
			    colorDark : "#000000",
			    colorLight : "#ffffff"
			});
  	});
}

function Front(width, height) {
	this.width = width;
	this.height = height;
	this.canvas = document.getElementById('frontCanvas');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.colWidth = width / COLS;
	this.rowHeight = height / ROWS;
	this.bricks = [];
	this.cleared = 0;
}

Front.prototype.fill = function() {
	this.bg = 'hsl('+ Math.random() * 360 + ', 100%, 70%)';
	for(var r = 0; r < ROWS; r++) {
		for(var c = 0; c < COLS; c++) {
			var x = c * this.colWidth;
			var y = r * this.rowHeight;
			var rectangle = new Rectangle(new Point(x, y), new Point(x + this.colWidth, y + this.rowHeight));
			var brick  = new Path.Rectangle(rectangle);
			brick.fillColor = this.bg;
			brick.opacity = 1;
			this.bricks.push(brick);
		}
	}
	$(function(){
		$('#backCanvas').addClass('general');
		$('#backCanvas').removeClass('highlight');
	});
}

Front.prototype.scratch = function() {
	var diffs = diff.length;
	if(diffs > 0) {
		for(var i = 0; i < diffs; i ++) {
			var index = diff[i][1] * COLS + diff[i][0];
			if(this.bricks[index].opacity === 1) {
				this.cleared += 1;
				this.bricks[index].opacity = 0;

				if (this.cleared === 1200) {
					scratching  = false;
					backCanvas.capture();
					$(function(){
						$('#backCanvas').removeClass('general');
		  			$('#backCanvas').addClass('highlight');
		  		});
		  		freezing = true;
		  		freezeCardWaiting = 360;
				}
			}
		}
	}
}

Front.prototype.showCard = function() {
	this.bricks = [];
	this.fill();
	showCardWaiting = 60;
	sourceCanvas.previousFrame = null;
	sourceCanvas.currentFrame = null;

}

function onFrame(event){
	if (initialized) {
		if (showCardWaiting > 0 && !scratching) {
			showCardWaiting -= 1;
			if (showCardWaiting === 0) {
				frontCanvas.cleared = 0;
				sourceCanvas.previousFrame = null;
				sourceCanvas.currentFrame = null;
				diff = [];
				scratching = true;
			};
		}
		else if (scratching) {
			sourceCanvas.drawCanvas();
		  backCanvas.drawCanvas();
		}
		else if (freezeCardWaiting > 0) {
			if (freezeCardWaiting === 360) {
				backCanvas.post();
			};
			backCanvas.drawCanvas();
			freezeCardWaiting -= 1;

			if(freezeCardWaiting === 0) {
				freezing = false;
				frontCanvas.showCard();
			}
		}
		else {
			console.log('what!?');
		}
	}
}

var sourceCanvas = new Source(1200,900);

var backCanvas = new Back(1200,900);

var frontCanvas = new Front(1200,900);
frontCanvas.showCard();

view.size = new Size(this.width, this.height);
getWebcam();
