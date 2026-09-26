var flipbook={
	orientation:null,
	onLoaded:function(bool) {
		flipbook.wrapper=lib("#wrapper").targets[0];
		flipbook.wrapperContent=lib("#wrapper .content").targets[0];
		flipbook.background=lib("#background").targets[0];
		flipbook.preparePersistentPagePairs();
		if (lib("#siteLoader").targets.length>0) {
			lib("#siteLoader").to({ style: { opacity:0 }}, { duration:500, oncomplete:function() { lib(".loader").remove(); } });
		}
		lib([flipbook.wrapper, flipbook.background]).css({ display:"block" });
		lib([flipbook.wrapper, flipbook.background]).to({ style: { opacity:1 } }, { duration:250 });
		flipbook.tweakLinks();
		flipbook.history=("history" in window && "pushState" in window.history && typeof(window.history.pushState)==="function")?window.history:("History" in window && "pushState" in window.History && typeof(window.History.pushState)==="function"?window.History:null);
		for (var p in onLoadedFunctions) {
			if (typeof(onLoadedFunctions[p])==="function") {
				onLoadedFunctions[p]();
			}
		}
		flipbook.tweaks();
		if (!bool) {
			var addr=lib.address.pathname().replace(/(.*)\//, "");
			if (addr.length>0) {
				flipbook.page(addr, true);
			} else {
				flipbook.page("1", true);
			}
			if ("orientation" in window && Math.abs(window.orientation)===90) {
                flipbook.orientation="landscape";
            } else if (Math.abs(window.orientation)%180===0) {
                flipbook.orientation="portrait";
            }
			flipbook.listeners();
			if (flipbook.history) {
				flipbook.history.replaceState({ addr:lib.address.pathname().replace(/^[^\/]+/, "") }, document.title, lib.address.pathname().replace(/^[^\/]+/, ""));
			}
			lib("window").on("resize", function() { flipbook.tweaks(true); });
			lib("window").on("wheel", flipbook.scrollWheel);
			lib("window").on("mouseup", flipbook.stopScrollVertically);
			lib("window").on("mouseup", flipbook.stopScrollHorizontally);
				lib("window").on("blur", flipbook.stopScrollVertically);
				lib("window").on("blur", flipbook.stopScrollHorizontally);
			lib("window").on("keydown", flipbook.onKeyDown);
			lib("window").on("keyup", flipbook.onKeyUp);
			lib("window").on("popstate", function(event) {
				if (event.state!=null && "addr" in event.state) {
					var addr=event.state.addr.toString().replace(/^(.*)\//, "");
					flipbook.page(addr, false);
				}
			});
			lib("window").on("orientationchange", function(event) {
                if (Math.abs(window.orientation)===90) {
                    flipbook.orientation="landscape";
                } else {
                    flipbook.orientation="portrait";
                }
                flipbook.scrollDirectlyTo(0,0);
            });
		}
	},
	onKeyDown:function(event) {
		var key=("which" in event && typeof(event.which)!=="undefined")?event.which:event.key;
		if (key===16) {
			flipbook.majKey=true;
		}
	},
	onKeyUp:function(event) {
		var key=("which" in event && typeof(event.which)!=="undefined")?event.which:event.key;
		if (key===16) {
			flipbook.majKey=false;
		}
	},
	listeners:function() {
		lib(".thumb").on("mouseover", flipbook.thumbMouseover);
		lib(".thumb").on("mouseout", flipbook.thumbMouseout);
	},
	tweaks:function(onresize) {
		flipbook.setFontSize();
		lib("#pages_list>.flipbook_content>.flipbook_sub>a").css({ width:8*docWidth/docHeight+"em" });
		flipbook.resizeHtmlThumbs();
	 	if (typeof(onresize)==="undefined") { flipbook.scrollTop(); }
	 	flipbook.calcPositions();
	 	flipbook.scrollDirectlyTo(0,0);
        lib().preventMultipleThrowsDuringPeriod(function() {
            flipbook.setScrollBars();
        }, 250);
	},
	resizeHtmlThumbs:function() {
		var thumbs=lib("#pages_list .htmlThumb").targets;
		var previewWidth=800;
		var previewHeight=previewWidth*docHeight/docWidth;
		for (var i=0; i<thumbs.length; i++) {
			var iframe=thumbs[i].querySelector("iframe");
			if (!iframe || thumbs[i].clientWidth<=0) continue;
			var scale=thumbs[i].clientWidth/previewWidth;
			lib([iframe]).css({
				width:previewWidth+"px",
				height:previewHeight+"px",
				transform:"scale("+scale+")"
			});
		}
	},
	setFontSize:function() {
		var ltwh=lib("#wrapper").ltwhRelativeTo(document.body)[0];
		flipbook.fs=ltwh.width/100;
	},
	mode:null,
	w:null,
	h:null,
	diffs:{ x:null, y:null },
	calcPositions:function() {
		var previousMode=flipbook.mode;
		var ratioWoverH, mobileMode, widthIn=parseFloat(lib("body").css("width", "in")[0]);
		if (widthIn>10) {
			mobileMode=false;
		} else {
			mobileMode=true;
		}
		ratioWoverH=document.body.offsetWidth/document.body.offsetHeight;
		var diminishBodyWidth=0, diminishBodyHeight=0;
		var a=Math.atan(docWidth/docHeight);
		flipbook.diagAngletoVertical=a;
		if (ratioWoverH>docWidth/docHeight && !mobileMode) {
			//place at left
			flipbook.listAt="left";
			lib("#pages_list>.flipbook_content>.flipbook_sub").css({ paddingLeft:"0em", paddingRight:"0em", paddingTop:"1em", paddingBottom:"1em" });
			lib("#pages_list").css({ left:0, top:0, width:"10em", height:"100%", whiteSpace:"normal" });
			lib("#pages_list>.flipbook_content>.flipbook_sub>a").css({ marginTop:"0.25em", marginBottom:"0.25em", marginLeft:"1em", marginRight:"1em" });
			lib("#pages_view").css({ left:"10em", top:0, width:"calc(100% - 10em)", height:"100%" });
			diminishBodyWidth=10*parseFloat(lib("#pages_list").css("font-size", "px")[0]);
		} else {
			//place at top
			flipbook.listAt="top";
			lib("#pages_list>.flipbook_content>.flipbook_sub").css({ paddingLeft:"1em", paddingRight:"1em", paddingTop:"0em", paddingBottom:"0em" });
			lib("#pages_list").css({ left:0, top:0, width:"100%", height:"10em", whiteSpace:"nowrap" });
			lib("#pages_list>.flipbook_content>.flipbook_sub>a").css({ marginTop:"0.75em", marginBottom:"0.75em", marginLeft:"0.25em", marginRight:"0.25em" });
			lib("#pages_view").css({ left:0, top:"10em", width:"100%", height:"calc(100% - 10em)" });
			diminishBodyHeight=10*parseFloat(lib("#pages_list").css("font-size", "px")[0]);
		}
		flipbook.diagAngle=Math.abs(Math.atan(docWidth/docHeight));
		lib(".flipbookBack, .flipbookFront").css({ left:"0em", top:"0em" });
		if ((document.body.offsetWidth-diminishBodyWidth)/(document.body.offsetHeight-diminishBodyHeight)>2*docWidth/docHeight && !mobileMode) {
			// place 2 pages
			flipbook.mode="dual";
			flipbook.constraintViewToDesiredWidthAndHeight();
			lib("#flipbookMono").css({ display:"none" });
			lib("#flipbookDual").css({ display:"block" });
			var h=(document.body.offsetHeight-diminishBodyHeight-2*parseFloat(lib("#pages_view").css("font-size", "px")[0]))/parseFloat(lib("#pages_view").css("font-size", "px")[0]);
			var w=h*docWidth/docHeight;
			flipbook.w=w;
			flipbook.h=h;
			flipbook.sqrt=Math.sqrt(Math.pow(flipbook.w, 2)+Math.pow(flipbook.h, 2));
			flipbook.diffs={ x:(flipbook.sqrt-flipbook.w)/2,  y:(flipbook.sqrt-flipbook.h)/2 };
			lib("#flipbookDual").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			lib(".flipbookDualPage").css({  width:flipbook.w+"em", height:flipbook.h+"em" });
			lib("#flipbookDual").css({ left:"50%", marginLeft:-(flipbook.w*.5)+"em" });
			lib("#flipbookDual").find(".flipbookFront").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
			lib("#flipbookDual").find(".flipbookBack").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
			lib("#flipbookDual").find(".flipbookBehind").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			lib("#flipbookDual").find(".flipbookFront>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			lib("#flipbookDual").find(".flipbookBack>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			// Keep both halves attached while the window is still being resized.
			// Their offsets depend on w and therefore have to be refreshed on every
			// resize event, not only when mono/dual mode changes.
			var resizeIndex=Math.max(0, Math.min(imgs.length-1, parseInt(flipbook.currentIndex, 10)||0));
			if (resizeIndex>0 && resizeIndex<imgs.length-1 && resizeIndex%2===0) resizeIndex--;
			flipbook.centerDualOnOccupiedWidth(resizeIndex);
			flipbook.closeDualSeam(resizeIndex);
		} else {
			// place 1 page
			flipbook.mode="mono";
			lib("#flipbookDual").css({ display:"none" });
			if (flipbook.orientation==="landscape") {
				flipbook.resizeViewToDesiredHeight();
			} else {
				flipbook.constraintViewToDesiredHeight();
			}
			lib("#flipbookMono").css({ display:"block" });
			if ((document.body.offsetWidth-diminishBodyWidth)/(document.body.offsetHeight-diminishBodyHeight)>docWidth/docHeight) {
				// limit on height
				var h=(document.body.offsetHeight-diminishBodyHeight-2*parseFloat(lib("#pages_view").css("font-size", "px")[0]))/parseFloat(lib("#pages_view").css("font-size", "px")[0]);
				var w=h*docWidth/docHeight;
				flipbook.w=w;
				flipbook.h=h;
				flipbook.sqrt=Math.sqrt(Math.pow(flipbook.w, 2)+Math.pow(flipbook.h, 2));
				flipbook.diffs={ x:(flipbook.sqrt-flipbook.w)/2,  y:(flipbook.sqrt-flipbook.h)/2 };
				lib("#flipbookMonoSub").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookFront").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
				lib("#flipbookMono").find(".flipbookBack").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
				lib("#flipbookMono").find(".flipbookBehind").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookFront>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookBack>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			} else {
				// limit on width
				var w=(document.body.offsetWidth-diminishBodyWidth-2*parseFloat(lib("#pages_view").css("font-size", "px")[0]))/parseFloat(lib("#pages_view").css("font-size", "px")[0]);
				var h=w*docHeight/docWidth;
				flipbook.w=w;
				flipbook.h=h;
				flipbook.sqrt=Math.sqrt(Math.pow(flipbook.w, 2)+Math.pow(flipbook.h, 2));
				flipbook.diffs={ x:(flipbook.sqrt-flipbook.w)/2,  y:(flipbook.sqrt-flipbook.h)/2 };
				lib("#flipbookMonoSub").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookFront").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
				lib("#flipbookMono").find(".flipbookBack").css({ width:flipbook.sqrt+"em", height:flipbook.sqrt+"em" });
				lib("#flipbookMono").find(".flipbookBehind").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookFront>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
				lib("#flipbookMono").find(".flipbookBack>*").css({ width:flipbook.w+"em", height:flipbook.h+"em" });
			}
		}
		if (previousMode!==null && previousMode!==flipbook.mode) {
			flipbook.syncModeState(previousMode);
		}
	},
	constraintViewToDesiredWidthAndHeight:function() {
		lib("#pages_view").find(".flipbook_content>.flipbook_sub").css({ maxWidth:"100%", maxHeight:"100%" });
	},
	constraintViewToDesiredHeight:function() {
		lib("#pages_view").find(".flipbook_content>.flipbook_sub").css({ maxHeight:"100%" });
	},
	resizeViewToDesiredHeight:function() {
		var w=parseFloat(lib("#pages_view").css("width", "em")[0]);
		var val=w*docHeight/docWidth;
		lib("#pages_view").find(".flipbook_content>.flipbook_sub").css({ maxHeight:val+"em" });
	},
	thumbMouseover:function(event) {
		lib([event.libTarget]).css({ zIndex:2 });
		lib([event.libTarget]).find("img").to({ style: { left:"-"+1*(docWidth/docHeight)+"em", top:"-1em", height:"calc(100% + 2em)" } }, { duration:125 });
	},
	thumbMouseout:function(event) {
		lib([event.libTarget]).css({ zIndex:1 });
		lib([event.libTarget]).find("img").to({ style: { left:"0em", top:"0em", height:"100%" } }, { duration:125 });
	},
	currentIndex:0,
	interval:-1,
	autoRunId:0,
	manualFrame:-1,
	previewWatchInterval:-1,
	autoStepTarget:null,
	autoStepTimer:-1,
	context:null,
	angle:0,
	angleModifying:null,
	currentTurnButton:null,
	startCoords:{},
	coordinates:{ x:null, y:null },
	delta:{ x:null, y:null },
	cancellableMove:true,
	cancelMove:false,
	turnSide:null,
	distMax:0,
	distCurrent:0,
	distDelta:3,
	tDiff:{ x:null, y:null },
	animatedIndex:-1,
	animating:false,
	futureIndex:-1,
	isDownOrTouched:false,
	selectPageImage:function(referenceContent, pageUrl, style) {
		if (!referenceContent || !referenceContent.parentNode || !pageUrl) return [];
		var contents=referenceContent.parentNode.querySelectorAll(".pageContent[data-flipbook-bank='true']");
		var selectedContent=null;
		for (var i=0; i<contents.length; i++) {
			var selected=contents[i].getAttribute("data-page-url")===pageUrl;
			lib([contents[i]]).css({ visibility:selected?"visible":"hidden", pointerEvents:selected?"auto":"none" });
			contents[i].setAttribute("aria-hidden", selected?"false":"true");
			if (selected) selectedContent=contents[i];
		}
		if (selectedContent) {
			if (style) lib([selectedContent]).css(style);
			return [selectedContent];
		}
		return [];
	},
	centerDualOnOccupiedWidth:function(index) {
		if (flipbook.mode!=="dual" || !isFinite(index)) return;
		lib("#flipbookDual").css({ left:"50%", marginLeft:(-flipbook.w/2)+"em" });
		if (index===0 || index===imgs.length-1) {
			lib("#flipbookDualLeft, #flipbookDualRight").css({ left:"0em" });
		} else {
			lib("#flipbookDualLeft").css({ left:(-flipbook.w/2)+"em" });
			lib("#flipbookDualRight").css({ left:(flipbook.w/2)+"em" });
		}
	},
	closeDualSeam:function(index) {
		if (flipbook.mode!=="dual" || index<=0 || index>=imgs.length-1) return;
		var leftPage=lib("#flipbookDualLeft .flipbookFront>.pageContent").targets[0];
		var rightPage=lib("#flipbookDualRight .flipbookFront>.pageContent").targets[0];
		if (!leftPage || !rightPage) return;
		var leftRect=leftPage.getBoundingClientRect();
		var rightRect=rightPage.getBoundingClientRect();
		var gap=rightRect.left-leftRect.right;
		if (!isFinite(gap) || Math.abs(gap)<0.5) return;
		var fontSize=parseFloat(lib("#pages_view").css("font-size", "px")[0]);
		if (!isFinite(fontSize) || fontSize<=0) return;
		var halfGap=gap/(fontSize*2);
		lib("#flipbookDualLeft").css({ left:(-flipbook.w/2+halfGap)+"em" });
		lib("#flipbookDualRight").css({ left:(flipbook.w/2-halfGap)+"em" });
	},
	showDualSpread:function(index) {
		if (flipbook.mode!=="dual" || imgs.length===0) return;
		index=Math.max(0, Math.min(imgs.length-1, parseInt(index, 10)||0));
		if (index>0 && index<imgs.length-1 && index%2===0) index--;
		flipbook.currentIndex=index;
		flipbook.futureIndex=index;
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ left:"0em", top:"0em", transform:"translate(0em, 0em) rotate(0deg)" });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ left:"0em", top:"0em", opacity:1, transform:"rotate(0deg)" });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack").css({ opacity:1, visibility:"hidden", zIndex:0 });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0, left:"0em", top:"0em", transform:"rotate(0deg)" });
		if (index===0) {
			lib("#flipbookDualLeft").css({ opacity:0, left:"0em", zIndex:1 });
			lib("#flipbookDualRight").css({ opacity:1, left:"0em", zIndex:2 });
			flipbook.selectPageImage(lib("#flipbookDualRight .flipbookFront>.pageContent").targets[0], imgs[0], { opacity:1 });
			if (imgs.length>1) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBack>.pageContent").targets[0], imgs[1]);
			if (imgs.length>2) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBehind>.pageContent").targets[0], imgs[2]);
		} else if (index===imgs.length-1) {
			lib("#flipbookDualLeft").css({ opacity:1, left:"0em", zIndex:2 });
			lib("#flipbookDualRight").css({ opacity:0, left:"0em", zIndex:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookFront>.pageContent").targets[0], imgs[index], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBack>.pageContent").targets[0], imgs[index-1]);
			if (index-2>=0) flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBehind>.pageContent").targets[0], imgs[index-2]);
		} else {
			lib("#flipbookDualLeft").css({ opacity:1, zIndex:1 });
			lib("#flipbookDualRight").css({ opacity:1, zIndex:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookFront>.pageContent").targets[0], imgs[index], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualRight .flipbookFront>.pageContent").targets[0], imgs[index+1], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBack>.pageContent").targets[0], imgs[index-1]);
			if (index-2>=0) flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBehind>.pageContent").targets[0], imgs[index-2]);
			if (index+2<imgs.length) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBack>.pageContent").targets[0], imgs[index+2]);
			if (index+3<imgs.length) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBehind>.pageContent").targets[0], imgs[index+3]);
		}
		flipbook.centerDualOnOccupiedWidth(index);
		flipbook.closeDualSeam(index);
	},
	showFirstPageWithoutAnimation:function() {
		flipbook.currentIndex=0;
		flipbook.futureIndex=0;
		if (flipbook.mode==="dual") {
			lib("#flipbookDualLeft").css({ opacity:0, left:"0em" });
			lib("#flipbookDualRight").css({ opacity:1, left:"0em" });
			lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ left:"0em", top:"0em", transform:"translate(0em, 0em) rotate(0deg)" });
			lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack").css({ opacity:1, visibility:"hidden", zIndex:0 });
			var dualFront=lib("#flipbookDualRight").find(".flipbookFront>.pageContent").targets[0];
			var selected=flipbook.selectPageImage(dualFront, imgs[0], { opacity:1, left:"0em", top:"0em", transform:"rotate(0deg)" });
			flipbook.centerDualOnOccupiedWidth(0);
		} else {
			lib("#flipbookMono").find(".flipbookFront, .flipbookBack").css({ left:"0em", top:"0em", transform:"translate(0em, 0em) rotate(0deg)" });
			lib("#flipbookMono").find(".flipbookBack").css({ opacity:0, visibility:"hidden" });
			var monoFront=lib("#flipbookMono").find(".flipbookFront>.pageContent").targets[0];
			flipbook.selectPageImage(monoFront, imgs[0], { opacity:1, left:"0em", top:"0em", transform:"rotate(0deg)" });
		}
	},
	syncModeState:function(previousMode) {
		if (flipbook.interval!==-1) {
			clearInterval(flipbook.interval);
			flipbook.interval=-1;
		}
		flipbook.autoRunId++;
		if (flipbook.manualFrame!==-1) {
			window.cancelAnimationFrame(flipbook.manualFrame);
			flipbook.manualFrame=-1;
		}
		lib("window").off("mousemove", flipbook.onMouseMoveManualTurn);
		lib("window").off("mouseup", flipbook.onMouseUpManualTurn);
		flipbook.animating=false;
		flipbook.isDownOrTouched=false;
		flipbook.cancelMove=false;
		flipbook.finishMove=false;
		flipbook.endMove="";
		var index=Math.max(0, Math.min(imgs.length-1, parseInt(flipbook.currentIndex, 10)||0));
		if (flipbook.mode==="dual" && index>0 && index<imgs.length-1 && index%2===0) {
			index--;
		}
		flipbook.currentIndex=index;
		flipbook.futureIndex=index;
		if (flipbook.mode==="mono") {
			lib("#flipbookMono").find(".flipbookFront, .flipbookBack").css({ left:"0em", top:"0em", opacity:1, transform:"translate(0em, 0em) rotate(0deg)" });
			lib("#flipbookMono").find(".flipbookFront>.pageContent, .flipbookBack>.pageContent").css({ left:"0em", top:"0em", transform:"rotate(0deg)" });
			lib("#flipbookMono").find(".flipbookBack").css({ opacity:0, visibility:"hidden", zIndex:0 });
			flipbook.selectPageImage(lib("#flipbookMono .flipbookFront>.pageContent").targets[0], imgs[index], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookMono .flipbookBack>.pageContent").targets[0], imgs[index]);
			if (index+1<imgs.length) flipbook.selectPageImage(lib("#flipbookMono .flipbookBehindF>.pageContent").targets[0], imgs[index+1]);
			if (index-1>=0) flipbook.selectPageImage(lib("#flipbookMono .flipbookBehindB>.pageContent").targets[0], imgs[index-1]);
			lib("#monoTopLeft, #monoBottomLeft").css({ display:index===0?"none":"block" });
			lib("#monoTopRight, #monoBottomRight").css({ display:index===imgs.length-1?"none":"block" });
			return;
		}
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ left:"0em", top:"0em", transform:"translate(0em, 0em) rotate(0deg)" });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ left:"0em", top:"0em", opacity:1, transform:"rotate(0deg)" });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack").css({ opacity:1, visibility:"hidden", zIndex:0 });
		lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0, transform:"rotate(0deg)", top:"0em" });
		lib("#flipbookDualLeft .flipbookBehind, #flipbookDualRight .flipbookBehind").css({ opacity:0 });
		if (index===0) {
			lib("#flipbookDualLeft").css({ opacity:0, left:"0em", zIndex:1 });
			lib("#flipbookDualRight").css({ opacity:1, left:"0em", zIndex:2 });
			flipbook.selectPageImage(lib("#flipbookDualRight .flipbookFront>.pageContent").targets[0], imgs[0], { opacity:1 });
			if (imgs.length>1) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBack>.pageContent").targets[0], imgs[1]);
			if (imgs.length>2) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBehind>.pageContent").targets[0], imgs[2]);
		} else if (index===imgs.length-1) {
			lib("#flipbookDualLeft").css({ opacity:1, left:"0em", zIndex:2 });
			lib("#flipbookDualRight").css({ opacity:0, left:"0em", zIndex:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookFront>.pageContent").targets[0], imgs[index], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBack>.pageContent").targets[0], imgs[index-1]);
			if (index-2>=0) flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBehind>.pageContent").targets[0], imgs[index-2]);
		} else {
			lib("#flipbookDualLeft").css({ opacity:1, zIndex:1 });
			lib("#flipbookDualRight").css({ opacity:1, zIndex:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookFront>.pageContent").targets[0], imgs[index], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualRight .flipbookFront>.pageContent").targets[0], imgs[index+1], { opacity:1 });
			flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBack>.pageContent").targets[0], imgs[index-1]);
			if (index-2>=0) flipbook.selectPageImage(lib("#flipbookDualLeft .flipbookBehind>.pageContent").targets[0], imgs[index-2]);
			if (index+2<imgs.length) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBack>.pageContent").targets[0], imgs[index+2]);
			if (index+3<imgs.length) flipbook.selectPageImage(lib("#flipbookDualRight .flipbookBehind>.pageContent").targets[0], imgs[index+3]);
		}
		flipbook.centerDualOnOccupiedWidth(index);
		flipbook.closeDualSeam(index);
	},
	preparePersistentPagePairs:function() {
		var selector=".flipbookFront>.pageContent, .flipbookBack>.pageContent, .flipbookBehind>.pageContent";
		var initialContents=lib(selector).targets;
		for (var contentIndex=0; contentIndex<initialContents.length; contentIndex++) {
			var original=initialContents[contentIndex];
			if (original.getAttribute("data-flipbook-bank")==="true") continue;
			var parent=original.parentNode;
			var originalUrl=original.getAttribute("data-page-url");
			for (var pageIndex=0; pageIndex<imgs.length; pageIndex++) {
				var pageContent=original.cloneNode(true);
				var pageType=pageTypes[pageIndex]||"image";
				var imageContent=pageContent.querySelector(".imageContent");
				var htmlContent=pageContent.querySelector(".htmlContent");
				var image=imageContent?imageContent.querySelector("img"):null;
				var iframe=htmlContent?htmlContent.querySelector("iframe"):null;
				pageContent.setAttribute("data-flipbook-bank", "true");
				pageContent.setAttribute("data-page-index", pageIndex);
				pageContent.setAttribute("data-page-url", imgs[pageIndex]);
				pageContent.setAttribute("data-page-type", pageType);
				pageContent.setAttribute("data-pair-index", Math.floor(pageIndex/2));
				pageContent.setAttribute("data-pair-face", pageIndex%2===0?"front":"back");
				pageContent.style.visibility=imgs[pageIndex]===originalUrl?"visible":"hidden";
				pageContent.style.pointerEvents=imgs[pageIndex]===originalUrl?"auto":"none";
				pageContent.setAttribute("aria-hidden", imgs[pageIndex]===originalUrl?"false":"true");
				if (imageContent) imageContent.hidden=pageType!=="image";
				if (htmlContent) htmlContent.hidden=pageType!=="html";
				if (image) {
					if (pageType==="image") image.src=imgs[pageIndex];
					else image.removeAttribute("src");
				}
				if (iframe) {
					if (pageType==="html") iframe.src=imgs[pageIndex];
					else iframe.removeAttribute("src");
					iframe.title="Page "+(pageIndex+1);
				}
				parent.insertBefore(pageContent, original);
			}
			parent.removeChild(original);
		}
	},
	goToPageAuto:function(page, useIntermediateStep) {
		var r, targetIndex=page-1;
		if (flipbook.animating) return false;
		if (targetIndex===flipbook.currentIndex) {
			if (targetIndex===0) flipbook.showFirstPageWithoutAnimation();
			return false;
		}
		if (useIntermediateStep && imgs.length>2 && ((flipbook.currentIndex===0 && targetIndex===imgs.length-1) || (flipbook.currentIndex===imgs.length-1 && targetIndex===0))) {
			var intermediatePage=Math.ceil(imgs.length/2);
			if (intermediatePage>1 && intermediatePage<imgs.length) {
				flipbook.autoStepTarget=page;
				page=intermediatePage;
				targetIndex=page-1;
			}
		}
		if (!flipbook.animating && page!==flipbook.currentIndex+1) {
			if (flipbook.mode==="mono") {
				if (targetIndex<flipbook.currentIndex) {
					r=flipbook.selectPageImage(lib("#flipbookMono").find(".flipbookBack>.pageContent").targets[0], imgs[targetIndex+1]);
					r=flipbook.selectPageImage(lib("#flipbookMono").find(".flipbookBehindB>.pageContent").targets[0], imgs[targetIndex]);
				} else if (targetIndex>flipbook.currentIndex) {
					r=flipbook.selectPageImage(lib("#flipbookMono").find(".flipbookBack>.pageContent").targets[0], imgs[targetIndex-1]);
					r=flipbook.selectPageImage(lib("#flipbookMono").find(".flipbookBehindF>.pageContent").targets[0], imgs[targetIndex]);
				}
				flipbook.futureIndex=targetIndex;
			} else {
				if (page-1>0 && page%2===1 && page-1<imgs.length-1) {
					page--;
				}
				if (!(page%2===0 && page-1===flipbook.currentIndex)) {
					flipbook.futureIndex=page-1;
					if (flipbook.futureIndex>0 && flipbook.futureIndex<flipbook.currentIndex && flipbook.futureIndex<imgs.length-1) {
						r=flipbook.selectPageImage(lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0], imgs[flipbook.futureIndex+1]);
						r=flipbook.selectPageImage(lib("#flipbookDualLeft").find(".flipbookBehind>.pageContent").targets[0], imgs[flipbook.futureIndex]);
						lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
					} else if (flipbook.futureIndex>0 && flipbook.futureIndex>flipbook.currentIndex && flipbook.futureIndex<imgs.length-1) {
						r=flipbook.selectPageImage(lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0], imgs[flipbook.futureIndex]);
						if (flipbook.futureIndex+1<imgs.length-1) {
							lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
							r=flipbook.selectPageImage(lib("#flipbookDualRight").find(".flipbookBehind>.pageContent").targets[0], imgs[flipbook.futureIndex+1]);
						} else {
							lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
						}
					} else if (flipbook.futureIndex===imgs.length-1) {
						lib("#flipbookDualLeft").css({ opacity:1 });
						r=flipbook.selectPageImage(lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0], imgs[flipbook.futureIndex]);
						lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
						lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
					} else if (flipbook.futureIndex===0) {
						lib("#flipbookDualRight").css({ opacity:1 });
						r=flipbook.selectPageImage(lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0], imgs[flipbook.futureIndex]);
						lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:0 });
						lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
					}
				} else return false;
			}
			flipbook.cancelMove=false;
			flipbook.finishMove=false;
			var fs=parseFloat(lib("#pages_view").css("font-size", "px")[0]);
			flipbook.distDelta=flipbook.w/50*fs;
			flipbook.context="goToPageAuto";
			var rand=(Math.random()*2<1?"Bottom":"Top");
			flipbook.currentTurnButton=lib("#"+(flipbook.mode==="mono"?"mono":"dual")+(page-1<flipbook.currentIndex?rand+"Left":rand+"Right")).targets[0];
			flipbook.startCoords=flipbook.calcPointCoords(flipbook.currentTurnButton);
			switch (flipbook.currentTurnButton.id.substr(4)) {
				case "TopLeft":
					flipbook.angle=Math.PI/6;
				break;
				case "TopRight":
					flipbook.angle=-Math.PI/6;
				break;
				case "BottomRight":
					flipbook.angle=Math.PI/6;
				break;
				case "BottomLeft":
					flipbook.angle=-Math.PI/6;
				break;
			}
			flipbook.angleDelta=flipbook.angle*(flipbook.distDelta/(flipbook.w*fs));
			flipbook.angleModifying="auto";
			flipbook.distMax=flipbook.w;
			flipbook.distCurrent=0;
			flipbook.initTurnAuto();
		}
	},
	showTurnPossibility:function(side, element) {
		if (!flipbook.animating && !flipbook.isDownOrTouched) {
			if (flipbook.previewWatchInterval!==-1) clearInterval(flipbook.previewWatchInterval);
			flipbook.cancelMove=false;
			flipbook.finishMove=false;
			flipbook.distDelta=3;
			flipbook.context="turnPossibility";
			flipbook.currentTurnButton=element;
			switch (element.id.substr(4)) {
				case "TopLeft":
					flipbook.angle=Math.PI/4;
				break;
				case "TopRight":
					flipbook.angle=-Math.PI/4;
				break;
				case "BottomRight":
					flipbook.angle=Math.PI/4;
				break;
				case "BottomLeft":
					flipbook.angle=-Math.PI/4;
				break;
			}
			flipbook.startCoords=flipbook.calcPointCoords(flipbook.currentTurnButton);
			flipbook.angleModifying="no";
			flipbook.turnSide=side;
			flipbook.distMax=Math.sqrt(2*Math.pow(2.5, 2));
			/* A corner preview must never reuse the distance of the previous turn. */
			flipbook.distCurrent=0;
			flipbook.memDistCurrent=0;
			flipbook.initTurnAuto();
			flipbook.previewWatchInterval=setInterval(function() {
				if (flipbook.context!=="turnPossibility" || flipbook.isDownOrTouched) {
					clearInterval(flipbook.previewWatchInterval);
					flipbook.previewWatchInterval=-1;
					return;
				}
				if (!element.matches(":hover")) {
					clearInterval(flipbook.previewWatchInterval);
					flipbook.previewWatchInterval=-1;
					flipbook.hideTurnPossibility(side, element);
				}
			}, 50);
		}
	},
	hideTurnPossibility:function(side, element) {
		if ((!flipbook.animating || flipbook.context==="turnPossibility") && !flipbook.isDownOrTouched) {
			if (flipbook.previewWatchInterval!==-1) {
				clearInterval(flipbook.previewWatchInterval);
				flipbook.previewWatchInterval=-1;
			}
			var previewWasAnimating=flipbook.animating && flipbook.context==="turnPossibility";
			flipbook.distDelta=3;
			flipbook.context="turnPossibility";
			flipbook.currentTurnButton=element;
			switch (element.id.substr(4)) {
				case "TopLeft":
					flipbook.angle=Math.PI/4;
				break;
				case "TopRight":
					flipbook.angle=-Math.PI/4;
				break;
				case "BottomRight":
					flipbook.angle=Math.PI/4;
				break;
				case "BottomLeft":
					flipbook.angle=-Math.PI/4;
				break;
			}
			flipbook.startCoords=flipbook.calcPointCoords(flipbook.currentTurnButton);
			flipbook.angleModifying="no";
			flipbook.turnSide=side;
			if (!previewWasAnimating) {
				flipbook.distCurrent=flipbook.memDistCurrent;
			}
			flipbook.distMax=0;
			flipbook.initTurnAuto();
		}
	},
	initTurnManual:function(event, side, element) {
		if (!flipbook.animating) {
			if (flipbook.previewWatchInterval!==-1) {
				clearInterval(flipbook.previewWatchInterval);
				flipbook.previewWatchInterval=-1;
			}
			flipbook.isDownOrTouched=true;
			flipbook.context="initTurnManual";
			flipbook.currentTurnButton=element;
			flipbook.startCoords=flipbook.calcPointCoords(flipbook.currentTurnButton);
			flipbook.ltwhContainer=lib([element.parentNode]).ltwhRelativeTo(document.body)[0];
			lib("window").off("mousemove", flipbook.onMouseMoveManualTurn);
			lib("window").off("mouseup", flipbook.onMouseUpManualTurn);
			lib("window").on("mousemove", flipbook.onMouseMoveManualTurn);
			lib("window").on("mouseup", flipbook.onMouseUpManualTurn);
			flipbook.coordinates={ x:event.pageX-flipbook.ltwhContainer.left, y:event.pageY-flipbook.ltwhContainer.top };
			flipbook.angleModifying="manual";
			flipbook.maxDist=0;
			flipbook.cancellableMove=true;
			if (flipbook.interval!==-1) {
				clearInterval(flipbook.interval);
				flipbook.interval=-1;
			}
			if (flipbook.manualFrame!==-1) {
				window.cancelAnimationFrame(flipbook.manualFrame);
				flipbook.manualFrame=-1;
			}
		}
	},
	initTurnAuto:function() {
		if (!flipbook.isDownOrTouched) {
			if (flipbook.interval!==-1) {
				clearInterval(flipbook.interval);
				flipbook.interval=-1;
			}
			var runId=++flipbook.autoRunId;
			var intervalId=setInterval(function() {
				if (runId!==flipbook.autoRunId) {
					clearInterval(intervalId);
					return;
				}
				flipbook.turn("auto");
			}, 16);
			flipbook.interval=intervalId;
		}
	},
	calcPointCoords:function(element) {
		var ltwh=lib([element]).ltwhRelativeTo(document.body)[0];
		switch (element.id.substr(4)) {
			case "TopLeft":
				return { x:ltwh.left, y:ltwh.top };
			break;
			case "TopRight":
				return { x:ltwh.left+ltwh.width, y:ltwh.top };
			break;
			case "BottomRight":
				return { x:ltwh.left+ltwh.width, y:ltwh.top+ltwh.height };
			break;
			case "BottomLeft":
				return { x:ltwh.left, y:ltwh.top+ltwh.height };
			break;
		}
	},
	onMouseMoveManualTurn:function(event) {
		var coordinates={ x:event.pageX-flipbook.ltwhContainer.left, y:event.pageY-flipbook.ltwhContainer.top };
		flipbook.delta={ x:coordinates.x-flipbook.coordinates.x, y:coordinates.y-flipbook.coordinates.y };
		flipbook.coordinates=coordinates;
		if (flipbook.manualFrame===-1) {
			flipbook.manualFrame=window.requestAnimationFrame(function() {
				flipbook.manualFrame=-1;
				flipbook.turn("manual");
			});
		}
	},
	finishMove:false,
	cancelMove:false,
	onMouseUpManualTurn:function(event) {
		lib("window").off("mousemove", flipbook.onMouseMoveManualTurn);
		lib("window").off("mouseup", flipbook.onMouseUpManualTurn);
		if (flipbook.manualFrame!==-1) {
			window.cancelAnimationFrame(flipbook.manualFrame);
			flipbook.manualFrame=-1;
		}
		if (flipbook.ltwhContainer && isFinite(event.pageX) && isFinite(event.pageY)) {
			var releaseCoordinates={ x:event.pageX-flipbook.ltwhContainer.left, y:event.pageY-flipbook.ltwhContainer.top };
			flipbook.delta={ x:releaseCoordinates.x-flipbook.coordinates.x, y:releaseCoordinates.y-flipbook.coordinates.y };
			flipbook.coordinates=releaseCoordinates;
			flipbook.turn("manual");
		}
		var fs=parseFloat(lib("#pages_view").css("font-size", "px")[0]);
		flipbook.isDownOrTouched=false;
		if (flipbook.distCurrent>0 && flipbook.cancellableMove) {
			flipbook.cancelMove=true;
			flipbook.finishMove=false;
			flipbook.distMax=0;
			flipbook.distDelta=flipbook.distCurrent/50;
			flipbook.angleDelta=flipbook.angle*(flipbook.distDelta/flipbook.distCurrent);
			flipbook.currentTurnButton=flipbook.lastTurnButton;
			flipbook.initTurnAuto();
		} else if (flipbook.distCurrent>0) {
			flipbook.cancelMove=false;
			flipbook.finishMove=true;
			flipbook.distMax=flipbook.w;
			flipbook.distDelta=(flipbook.w*fs-flipbook.distCurrent)/50;
			flipbook.angleDelta=flipbook.angle/50;
			flipbook.currentTurnButton=flipbook.lastTurnButton;
			flipbook.initTurnAuto();
		}
	},
	axialSymetry:function(line, point) {
		var line1, line2;
		if (Math.abs(line.slope)>Math.pow(2, 24)) {
			line1=[{ x:0, y:-Math.pow(2, 24)},{ x:0, y:Math.pow(2, 24)}];
			line2=[{ x:point.x+Math.pow(2, 24), y:point.y}, { x:point.x-Math.pow(2, 24), y:point.y }];
		} else {
			line1=[{ x:-Math.pow(2, 24), y:line.YOffset-Math.pow(2, 24)*line.slope }, { x:Math.pow(2, 24), y:line.YOffset+Math.pow(2, 24)*line.slope }];
			line2=[{ x:point.x-Math.pow(2, 24), y:point.y-Math.pow(2, 24)*(-1/line.slope) }, { x:point.x+Math.pow(2, 24), y:point.y+Math.pow(2, 24)*(-1/line.slope) }];
		}
		var tmp=lib().lineIntersectsLine(line1, line2);
		var result;
		if (tmp[0]) {
			result={ x:point.x+(tmp[1].x-point.x)*2, y:point.y+(tmp[1].y-point.y)*2 };
			return result;
		} else {
			result={ x:point.x, y:point.y };
			return result;
		}
	},
	heightIntersectionOnLine:function(line, point) {
		var offsetPerpendicularLineStartingFromPoint=point.y+point.x*(-1/line.slope);
		var lineOffset=typeof(line.YOffset)==="number"?line.YOffset:line.offset;
		var x=(lineOffset-offsetPerpendicularLineStartingFromPoint)/(line.slope-(-1/line.slope));
		var heightIntersectionOnLine={ x:x, y:-x*line.slope+lineOffset };
		return heightIntersectionOnLine;
	},
	sign:function(number) {
		if (!isFinite(number)) {
			return 0;
		} else if (number===0) {
			return 1;
		} else if (1/number===-Infinity) {
			return -1;
		} else {
			return number>0?1:-1;
		}
	},
	endMove:"",
	turnCssBatch:null,
	queueTurnCss:function(elements, values) {
		if (flipbook.turnCssBatch===null) return;
		for (var i=0; i<elements.length; i++) {
			var element=elements[i];
			if (!element || !element.style) continue;
			var styles=flipbook.turnCssBatch.get(element);
			if (!styles) {
				styles={};
				flipbook.turnCssBatch.set(element, styles);
			}
			for (var property in values) {
				styles[property]=values[property];
				if (property==="opacity" && element.classList && element.classList.contains("flipbookBehind")) {
					styles.visibility=parseFloat(values[property])<=0?"hidden":"visible";
				}
			}
		}
	},
	flushTurnCss:function() {
		var batch=flipbook.turnCssBatch;
		flipbook.turnCssBatch=null;
		if (!batch) return;
		batch.forEach(function(styles, element) {
			var stagedStyle=document.createElement("div").style;
			stagedStyle.cssText=element.style.cssText;
			for (var property in styles) {
				var value=styles[property];
				if (/\-?[0-9]+\.[0-9]+(?:e-[0-9]+)/i.test(value)) {
					var unitMatch=value.toString().match(/[a-z%]+$/i);
					value="0"+(unitMatch?unitMatch[0]:"");
				}
				stagedStyle[property]=value;
			}
			element.style.cssText=stagedStyle.cssText;
		});
	},
	turn:function(mousemoveOrAuto) {
		flipbook.turnCssBatch=new Map();
		try {
			return flipbook.runTurn(mousemoveOrAuto);
		} finally {
			flipbook.flushTurnCss();
		}
	},
	runTurn:function(mousemoveOrAuto) {
		var fs=parseFloat(lib("#pages_view").css("font-size", "px")[0]);
		var turnPoints, point, checked, currentButton=flipbook.currentTurnButton, coordinates=flipbook.coordinates, angle, normal, x, y, baseX, baseY, transformOrigin, a, b, c, l, t, lo, to, corX, corY, corXBack, corYBack, diff, containerPointsAfterRotation, foldingPointsRelativeToSheet, slopeToXAxis, angleBackImg, isIsoceles;
		var endTransition=false;
		var shadowLightOpacity=1;
		if (mousemoveOrAuto==="auto") {
			var angleStep=Math.abs(flipbook.angleDelta);
			if (flipbook.angle!==0 && (!isFinite(angleStep) || angleStep<=0)) {
				angleStep=Math.abs(flipbook.angle)/50;
			}
			if (flipbook.angle>0) {
				flipbook.angle=Math.max(0, flipbook.angle-angleStep);
			} else if (flipbook.angle<0) {
				flipbook.angle=Math.min(0, flipbook.angle+angleStep);
			}
			if (flipbook.context!=="goToPageAuto") {
				if (flipbook.currentTurnButton.id.substr(4).indexOf("Right")!==-1) {
					flipbook.futureIndex=flipbook.currentIndex+2;
					if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
						flipbook.futureIndex--;
					}
				} else {
					flipbook.futureIndex=flipbook.currentIndex-1;
					if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
						flipbook.futureIndex--;
					}
				}
			}
			var targetDistance=flipbook.distMax*fs;
			var distanceStep=Math.abs(flipbook.distDelta);
			if (flipbook.distCurrent<targetDistance) {
				flipbook.distCurrent=Math.min(targetDistance, flipbook.distCurrent+distanceStep);
			} else if (flipbook.distCurrent>targetDistance) {
				flipbook.distCurrent=Math.max(targetDistance, flipbook.distCurrent-distanceStep);
			}
			/*
			 * A nearly flat fold can uncover the stale opposite Front for one frame.
			 * Skip those final unstable frames after a validated manual release
			 * or during a complete automatic page navigation.
			 */
			if (flipbook.finishMove || flipbook.context==="goToPageAuto") {
				var remainingDistance=Math.abs(targetDistance-flipbook.distCurrent);
				var remainingAngle=Math.abs(flipbook.angle);
				var remainingFrames=Math.max(distanceStep>0?remainingDistance/distanceStep:0, angleStep>0?remainingAngle/angleStep:0);
				shadowLightOpacity=Math.min(1, remainingFrames/10);
				if (remainingDistance<=distanceStep*2+0.000001 && remainingAngle<=angleStep*2+0.000001) {
					flipbook.distCurrent=targetDistance;
					flipbook.angle=0;
				}
			}
		} else {
			function check(point, angle, distCurrent, turnPoints) {
				var angleCalc=Math.abs(angle), length=distCurrent*2, i, dist, distToTurnPointsRespected;
				if (Math.abs(point.y-length*Math.sin(angleCalc))<1) {
					distToTurnPointsRespected=true;
					dist=Math.sqrt(Math.pow(turnPoints[0].x-point.x, 2)+Math.pow(turnPoints[0].y-point.y, 2));
					if (dist>flipbook.w*fs) {
						distToTurnPointsRespected=false;
					}
					return distToTurnPointsRespected;
				} else {
					return false;
				}
			}
			function checkMove() {
				switch (currentButton.id.substr(4)) {
					case "TopLeft":
						angle=Math.atan(coordinates.y/(coordinates.x));
						flipbook.distCurrent=Math.sqrt(Math.pow(coordinates.x, 2)+Math.pow(coordinates.y, 2))/2;
						x=flipbook.distCurrent*Math.cos(angle)*2;
						y=flipbook.distCurrent*Math.sin(angle)*2;
						point={ x:x, y:y };
						if (y<0) {
							currentButton=flipbook.currentTurnButton.parentNode.querySelector("#"+flipbook.currentTurnButton.id.substr(0, 4)+"BottomLeft");
							coordinates={ x:x+Math.sin(angle*2)*flipbook.h*fs, y:y+Math.cos(angle*2)*flipbook.h*fs };
							return checkMove();
						}
						turnPoints=[
							{ x:flipbook.w*fs, y:0 }
						];
						checked=check(point, angle, flipbook.distCurrent, turnPoints);
						if (!checked) {
							var numIterations=0;
							while (!checked && numIterations<Math.round(flipbook.sqrt*fs)) {
								if (flipbook.distCurrent>0) {
									flipbook.distCurrent-=2;
								}
								x=flipbook.distCurrent*Math.cos(angle)*2;
								y=flipbook.distCurrent*Math.sin(angle)*2;
								point={ x:x, y:y };
								checked=check(point, angle, flipbook.distCurrent, turnPoints);
								numIterations++;
							}
						}
						flipbook.futureIndex=flipbook.currentIndex-1;
						if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
							flipbook.futureIndex--;
						}
					break;
					case "TopRight":
						angle=-Math.atan(coordinates.y/(flipbook.w*fs-coordinates.x));
						flipbook.distCurrent=Math.sqrt(Math.pow(flipbook.w*fs-coordinates.x, 2)+Math.pow(coordinates.y, 2))/2;
						x=flipbook.distCurrent*Math.cos(angle)*2;
						y=flipbook.distCurrent*Math.sin(-angle)*2;
						point={ x:x, y:y };
						if (y<0) {
							currentButton=flipbook.currentTurnButton.parentNode.querySelector("#"+flipbook.currentTurnButton.id.substr(0, 4)+"BottomRight");
							coordinates={ x:flipbook.w*fs-(x-Math.sin(angle*2)*flipbook.h*fs), y:y+Math.cos(angle*2)*flipbook.h*fs };
							return checkMove();
						}
						turnPoints=[
							{ x:flipbook.w*fs, y:0 }
						];
						checked=check(point, angle, flipbook.distCurrent, turnPoints);
						if (!checked) {
							var numIterations=0;
							while (!checked && numIterations<Math.round(flipbook.sqrt*fs)) {
								if (flipbook.distCurrent>0) {
									flipbook.distCurrent-=2;
								}
								x=flipbook.distCurrent*Math.cos(angle)*2;
								y=flipbook.distCurrent*Math.sin(-angle)*2;
								point={ x:x, y:y };
								checked=check(point, angle, flipbook.distCurrent, turnPoints);
								numIterations++;
							}
						}
						flipbook.futureIndex=flipbook.currentIndex+2;
						if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
							flipbook.futureIndex--;
						}
					break;
					case "BottomRight":
						angle=Math.atan((flipbook.h*fs-coordinates.y)/(flipbook.w*fs-coordinates.x));
						flipbook.distCurrent=Math.sqrt(Math.pow(flipbook.w*fs-coordinates.x, 2)+Math.pow(flipbook.h*fs-coordinates.y, 2))/2;
						x=flipbook.distCurrent*Math.cos(angle)*2;
						y=flipbook.distCurrent*Math.sin(angle)*2;
						point={ x:x, y:y };
						if (y<0) {
							currentButton=flipbook.currentTurnButton.parentNode.querySelector("#"+flipbook.currentTurnButton.id.substr(0, 4)+"TopRight");
							coordinates={ x:flipbook.w*fs-(x-Math.sin(angle*2)*flipbook.h*fs), y:flipbook.h*fs-y-Math.cos(angle*2)*flipbook.h*fs };
							return checkMove();
						}
						turnPoints=[
							{ x:flipbook.w*fs, y:0 }
						];
						checked=check(point, angle, flipbook.distCurrent, turnPoints);
						if (!checked) {
							var numIterations=0;
							while (!checked && numIterations<Math.round(flipbook.sqrt*fs)) {
								if (flipbook.distCurrent>0) {
									flipbook.distCurrent-=2;
								}
								x=flipbook.distCurrent*Math.cos(angle)*2;
								y=flipbook.distCurrent*Math.sin(angle)*2;
								point={ x:x, y:y };
								checked=check(point, angle, flipbook.distCurrent, turnPoints);
								numIterations++;
							}
						}
						flipbook.futureIndex=flipbook.currentIndex+2;
						if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
							flipbook.futureIndex--;
						}
					break;
					case "BottomLeft":
						angle=-Math.atan((flipbook.h*fs-coordinates.y)/coordinates.x);
						flipbook.distCurrent=Math.sqrt(Math.pow(coordinates.x, 2)+Math.pow(flipbook.h*fs-coordinates.y, 2))/2;
						x=flipbook.distCurrent*Math.cos(angle)*2;
						y=flipbook.distCurrent*Math.sin(-angle)*2;
						point={ x:x, y:y };
						if (y<0) {
							currentButton=flipbook.currentTurnButton.parentNode.querySelector("#"+flipbook.currentTurnButton.id.substr(0, 4)+"TopLeft");
							coordinates={ x:x+Math.sin(angle*2)*flipbook.h*fs, y:flipbook.h*fs-y-Math.cos(angle*2)*flipbook.h*fs };
							return checkMove();
						}
						turnPoints=[
							{ x:flipbook.w*fs, y:0 }
						];
						checked=check(point, angle, flipbook.distCurrent, turnPoints);
						if (!checked) {
							var numIterations=0;
							while (!checked && numIterations<Math.round(flipbook.sqrt*fs)) {
								if (flipbook.distCurrent>0) {
									flipbook.distCurrent-=2;
								}
								x=flipbook.distCurrent*Math.cos(angle)*2;
								y=flipbook.distCurrent*Math.sin(-angle)*2;
								point={ x:x, y:y };
								checked=check(point, angle, flipbook.distCurrent, turnPoints);
								numIterations++;
							}
						}
						flipbook.futureIndex=flipbook.currentIndex-1;
						if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex%2===0) || flipbook.futureIndex===imgs.length) {
							flipbook.futureIndex--;
						}
					break;
				}
				flipbook.angle=angle;
				return true;
			}
			var c=checkMove();
			if (flipbook.distCurrent<flipbook.w*fs/2) {
				flipbook.cancellableMove=true;
				flipbook.lastTurnButton=currentButton;
			} else {
				flipbook.cancellableMove=false;
				flipbook.lastTurnButton=currentButton;
			}
		}
		if (flipbook.distCurrent===flipbook.distMax*fs && flipbook.angle==0) {
			flipbook.autoRunId++;
			clearInterval(flipbook.interval);
			flipbook.interval=-1;
			flipbook.cancellableMove=false;
			if (flipbook.cancelMove) {
				flipbook.endMove="cancel";
			} else if (flipbook.finishMove) {
				flipbook.endMove="finish";
			} else {
				flipbook.endMove="";
			}
			flipbook.cancelMove=false;
			flipbook.finishMove=false;
			endTransition=true;
		}
		if (!currentButton || !isFinite(fs) || fs<=0 || !isFinite(flipbook.distCurrent) || !isFinite(flipbook.angle)) {
			if (flipbook.interval!==-1) {
				clearInterval(flipbook.interval);
				flipbook.interval=-1;
			}
			flipbook.animating=false;
			return false;
		}
		var maxTurnAngle=Math.PI/2-Math.PI/360;
		if (Math.abs(flipbook.angle)>maxTurnAngle) {
			flipbook.angle=(flipbook.angle<0?-1:1)*maxTurnAngle;
		}
		flipbook.distCurrent=Math.max(0, Math.min(flipbook.distCurrent, flipbook.sqrt*fs));
		x=flipbook.distCurrent*Math.cos(flipbook.angle);
		y=flipbook.distCurrent*Math.sin(flipbook.angle);
		switch (currentButton.id.substr(4)) {
			case "TopLeft":
				baseX=0;
				baseY=0;
				transformOrigin="100% 0% 0px";
				l=-(flipbook.sqrt-flipbook.w);
				t=-(flipbook.sqrt-flipbook.h);
				lo=flipbook.sqrt;
				to=0;
				corX=-flipbook.sqrt*Math.cos(flipbook.angle);
				corY=-flipbook.sqrt*Math.abs(Math.sin(flipbook.angle));
				corXBack=-flipbook.w*Math.cos(flipbook.angle*2);
				corYBack=-flipbook.w*Math.sin(flipbook.angle*2);
			break;
			case "TopRight":
				baseX=flipbook.w*fs;
				baseY=0;
				transformOrigin="0% 0% 0px";
				l=0;
				t=-(flipbook.sqrt-flipbook.h);
				lo=0;
				to=0;
				corX=0;
				corY=0;
				corXBack=0;
				corYBack=0;
			break;
			case "BottomRight":
				baseX=flipbook.w*fs;
				baseY=flipbook.h*fs;
				transformOrigin="0% 100% 0px";
				l=0;
				t=0;
				lo=0;
				to=flipbook.sqrt;
				corX=flipbook.sqrt*Math.abs(Math.sin(flipbook.angle));
				corY=-flipbook.sqrt*Math.cos(flipbook.angle);
				corXBack=flipbook.h*Math.sin(flipbook.angle*2);
				corYBack=-flipbook.h*Math.cos(flipbook.angle*2);
			break;
			case "BottomLeft":
				baseX=0;
				baseY=flipbook.h*fs;
				transformOrigin="100% 100% 0px";
				l=-(flipbook.sqrt-flipbook.w);
				t=0;
				lo=flipbook.sqrt;
				to=flipbook.sqrt;
				corX=-flipbook.sqrt*Math.cos(flipbook.angle)-flipbook.sqrt*Math.abs(Math.sin(flipbook.angle));
				corY=-flipbook.sqrt*Math.cos(flipbook.angle)+flipbook.sqrt*Math.abs(Math.sin(flipbook.angle));
				corXBack=-flipbook.sqrt*Math.cos(Math.PI/2-(Math.abs(flipbook.angle)*2+flipbook.diagAngle));
				corYBack=-flipbook.sqrt*Math.sin(Math.PI/2-(Math.abs(flipbook.angle)*2+flipbook.diagAngle));
			break;
		}
		if (!endTransition) {
			lib([currentButton.parentNode]).find(".flipbookBack, .flipbookFront").css({ left:l+"em", top:t+"em" });
		}
		slopeToXAxis=Math.tan(Math.PI/2-Math.abs(flipbook.angle));
		a=(baseY>0?-Math.abs(y):Math.abs(y))/slopeToXAxis;
		if (baseX>0?Math.round((baseX-Math.abs(x)-a)*100)<=Math.round(baseX*100):Math.round((baseX+Math.abs(x)+a)*100)>=Math.round(baseX*100)) {
			b=-Math.abs(y)/slopeToXAxis;
			c=Math.abs(x)*slopeToXAxis+Math.abs(y);
			if (currentButton.id.substr(4).indexOf("Bottom")!==-1) {
				foldingPointsRelativeToCorner=[
					{ x:baseX, y:baseY-c }, 
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?b:-b), y:baseY }
				];
			} else {
				foldingPointsRelativeToCorner=[
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?b:-b), y:baseY },
					{ x:baseX, y:baseY+c }
				];
			}
		} else {
			b=-Math.abs(y)/slopeToXAxis;
			if (currentButton.id.substr(4).indexOf("Bottom")!==-1) {
				foldingPointsRelativeToCorner=[
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?a:-a), y:0 }, 
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?b:-b), y:baseY }
				];
			} else {
				foldingPointsRelativeToCorner=[
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?b:-b), y:baseY },
					{ x:baseX+(baseX>0?-Math.abs(x):Math.abs(x))+(baseX>0?a:-a), y:0 }
				];
			}
		}
		flipbook.tDiff={ x:(currentButton.id.substr(4).indexOf("Right")===-1?flipbook.sqrt-(flipbook.w-foldingPointsRelativeToCorner[(currentButton.id.substr(4).indexOf("Top")===-1?1:0)].x/fs)*Math.cos(flipbook.angle):-flipbook.sqrt+foldingPointsRelativeToCorner[(currentButton.id.substr(4).indexOf("Top")===-1?1:0)].x/fs*Math.cos(flipbook.angle)), y:0 };
		angleBackImg=2*flipbook.angle;
		var txContainer=(currentButton.id.substr(4).indexOf("Right")===-1?(flipbook.sqrt-flipbook.h)*Math.abs(Math.sin(flipbook.angle)):-(flipbook.sqrt-flipbook.h)*Math.abs(Math.sin(flipbook.angle)))+flipbook.tDiff.x;
		var tyContainer=(currentButton.id.substr(4).indexOf("Bottom")===-1?(flipbook.sqrt-flipbook.h)*Math.cos(flipbook.angle):-(flipbook.sqrt-flipbook.h)*Math.cos(flipbook.angle))+flipbook.tDiff.y;
		var originCoordsOfSecondBackTransform={ x:l+lo, y:t+to };
		var rsTx=Math.cos(flipbook.angle)*txContainer-Math.sin(flipbook.angle)*tyContainer;
		var rsTy=Math.sin(flipbook.angle)*txContainer+Math.cos(flipbook.angle)*tyContainer;
		var referenceCornerOfContainerRelativeToFirstContext={ x:originCoordsOfSecondBackTransform.x+rsTx, y:originCoordsOfSecondBackTransform.y+rsTy };
		var topLeftOfContainerRelativeToFirstContext={ x:referenceCornerOfContainerRelativeToFirstContext.x+corX, y:referenceCornerOfContainerRelativeToFirstContext.y+corY };
		slopeToXAxis=Math.tan(flipbook.sign(flipbook.angle)*(Math.PI/2)-flipbook.angle);
		var foldedCornerCoordsRelativeToSheet=flipbook.axialSymetry({ slope:-slopeToXAxis, YOffset:foldingPointsRelativeToCorner[1].y/fs+slopeToXAxis*foldingPointsRelativeToCorner[1].x/fs }, { x:baseX/fs, y:baseY/fs });
		var foldedCornerRelativeToTopLeftOfContainerAfterRotation={ x:foldedCornerCoordsRelativeToSheet.x-topLeftOfContainerRelativeToFirstContext.x, y:foldedCornerCoordsRelativeToSheet.y-topLeftOfContainerRelativeToFirstContext.y };
		var leftBack=Math.cos(flipbook.angle)*(foldedCornerRelativeToTopLeftOfContainerAfterRotation.x)+Math.sin(flipbook.angle)*(foldedCornerRelativeToTopLeftOfContainerAfterRotation.y)+Math.cos(flipbook.angle)*corXBack+Math.sin(flipbook.angle)*corYBack;
		var topBack=Math.cos(flipbook.angle)*(foldedCornerRelativeToTopLeftOfContainerAfterRotation.y)-Math.sin(flipbook.angle)*(foldedCornerRelativeToTopLeftOfContainerAfterRotation.x)+Math.cos(flipbook.angle)*corYBack-Math.sin(flipbook.angle)*corXBack;
		var frontCoordsRelativeToTopLeftOfContainer={ x:-topLeftOfContainerRelativeToFirstContext.x, y:flipbook.h-topLeftOfContainerRelativeToFirstContext.y };
		var leftFront=Math.cos(flipbook.angle)*(frontCoordsRelativeToTopLeftOfContainer.x)+Math.sin(flipbook.angle)*(frontCoordsRelativeToTopLeftOfContainer.y);
		var topFront=Math.cos(flipbook.angle)*(frontCoordsRelativeToTopLeftOfContainer.y)-Math.sin(flipbook.angle)*(frontCoordsRelativeToTopLeftOfContainer.x);
		var visualValues=[txContainer, tyContainer, leftBack, topBack, leftFront, topFront, foldedCornerCoordsRelativeToSheet.x, foldedCornerCoordsRelativeToSheet.y];
		for (var visualIndex=0; visualIndex<visualValues.length; visualIndex++) {
			if (!isFinite(visualValues[visualIndex])) return false;
		}
		var pct=Math.max(0, Math.min(100, Math.round(flipbook.distCurrent/(flipbook.w*fs)*100)));
		lib(".flipbookBack").css({ zIndex:2 });
		lib("#flipbookDualLeft .flipbookBehind").css({ opacity:1 });
		lib("#flipbookDualRight .flipbookBehind").css({ opacity:1 });
		if (!endTransition) {
			lib([currentButton.parentNode]).find(".flipbookBack>.pageContent, .flipbookBack>.overlay").css({ opacity:1 });
				lib([currentButton.parentNode]).find(".shadow, .light").css({ opacity:shadowLightOpacity });
		}
		flipbook.animating=true;
		var r;
		if (currentButton.id.substr(0, 4)==="mono") {
			lib("#flipbookMono").find(".flipbookBack").css({ opacity:1 });
			if (currentButton.id.substr(4).indexOf("Right")!==-1) {
				lib("#flipbookMono .flipbookBehindF").css({ zIndex:0 });
				lib("#flipbookMono .flipbookBehindB").css({ zIndex:-1 });
			} else {
				lib("#flipbookMono .flipbookBehindF").css({ zIndex:-1 });
				lib("#flipbookMono .flipbookBehindB").css({ zIndex:0 });
			}
			lib("#flipbookMono .flipbookBack .light").css({ background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(255, 255, 255, "+((1-pct/100)*1/2+0.25)+") 0%, rgba(255, 255, 255, 0) "+(100-pct)+"%)" });
			lib("#flipbookMono .flipbookBack .overlay").css({ backgroundColor:"rgba(0,0,0,"+((1-pct/100)*1/2)+")" });
			lib("#flipbookMono .flipbookBack .shadow").css({ background:"linear-gradient("+(flipbook.angle*180/Math.PI+180+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+(100-pct)+"%)" });
			lib("#flipbookMono .flipbookBehind .shadow").css({ background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+pct+"%)" });
			lib([currentButton.parentNode]).find(".flipbookBack").css({ visibility:"visible", transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
			lib([currentButton.parentNode]).find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ left:leftBack.toFixed(10)+"em", top:topBack.toFixed(10)+"em", transformOrigin:"0% 0% 0px", transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
			lib([currentButton.parentNode]).find(".flipbookFront").css({ transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
			lib([currentButton.parentNode]).find(".flipbookFront>.pageContent").css({ left:leftFront.toFixed(10)+"em", top:(topFront-flipbook.h).toFixed(10)+"em", transformOrigin:"0% 100% 0px", transform:"rotate("+(-flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
			if (endTransition && flipbook.endMove!=="cancel" && flipbook.context==="initTurnManual") {
				if (currentButton.id.substr(4).indexOf("Right")!==-1) {
					flipbook.currentIndex++;
					if (flipbook.currentIndex>imgs.length-1) {
						flipbook.currentIndex=imgs.length-1;
					}
				} else if (currentButton.id.substr(4).indexOf("Left")!==-1) {
					flipbook.currentIndex--;
					if (flipbook.currentIndex<0) {
						flipbook.currentIndex=0;
					}
				}
			} else if (endTransition && flipbook.context==="goToPageAuto") {
				flipbook.currentIndex=flipbook.futureIndex;
			}
			if (endTransition) {
				if (mousemoveOrAuto!=="auto") {
					if (flipbook.history) flipbook.history.pushState({ addr:parseInt(flipbook.currentIndex, 10)+1 }, document.title, flipbook.currentIndex+1);
				}
				var img1=lib("#flipbookMono").find(".flipbookFront>.pageContent").targets[0];
				lib([img1]).css({ opacity:0 });
				r=flipbook.selectPageImage(img1, imgs[flipbook.currentIndex]);
				img1=r[0];
				lib([img1]).css({ opacity:1 });
				lib("#flipbookMono").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0 });
				lib("#flipbookMono").find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em) rotate(0deg)", left:"0em", top:"0em" });
				lib("#flipbookMono").find(".flipbookBack").css({ opacity:0 });
				lib("#flipbookMono").find(".flipbookFront>.pageContent, .flipbookBack>.pageContent").css({ left:"0em", top:"0em", transform:"rotate(0deg)" });
				if (flipbook.currentIndex<=imgs.length-1) {
					var img2=lib("#flipbookMono").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img2, imgs[flipbook.currentIndex]);
				}
				if (flipbook.currentIndex+1<=imgs.length-1) {
					var img3=lib("#flipbookMono").find(".flipbookBehindF>.pageContent").targets[0];
					r=flipbook.selectPageImage(img3, imgs[flipbook.currentIndex+1]);
				}
				if (flipbook.currentIndex-1>=0) {
					var img4=lib("#flipbookMono").find(".flipbookBehindB>.pageContent").targets[0];
					r=flipbook.selectPageImage(img4, imgs[flipbook.currentIndex-1]);
				}
				flipbook.animating=false;
				if (flipbook.currentIndex===0) {
					lib("#monoTopLeft, #monoBottomLeft").css({ display:"none" });
					lib("#monoTopRight, #monoBottomRight").css({ display:"block" });
				} else if (flipbook.currentIndex===imgs.length-1) {
					lib("#monoTopRight, #monoBottomRight").css({ display:"none" });
					lib("#monoTopLeft, #monoBottomLeft").css({ display:"block" });
				} else {
					lib("#monoTopLeft, #monoBottomLeft").css({ display:"block" });
					lib("#monoTopRight, #monoBottomRight").css({ display:"block" });
				}
			}
		} else if (currentButton.id.substr(0, 4)==="dual" && currentButton.id.substr(4).indexOf("Left")!==-1) {
			lib("#flipbookDualLeft").css({ zIndex:2 });
			lib("#flipbookDualRight").css({ zIndex:1 });
			lib("#flipbookDualLeft .flipbookBack").css({ opacity:1 });
			lib("#flipbookDualRight .flipbookBack").css({ opacity:0, visibility:"hidden" });
			lib("#flipbookDualLeft .flipbookBack .light").css({ opacity:!endTransition?shadowLightOpacity:0, background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(255, 255, 255, "+((1-pct/100)*1/2+0.25)+") 0%, rgba(255, 255, 255, 0) "+(100-pct)+"%)" });
			lib("#flipbookDualLeft .flipbookBack .overlay").css({ opacity:!endTransition?1:0, backgroundColor:"rgba(0,0,0,"+((1-pct/100)*1/2)+")" });
			lib("#flipbookDualLeft .flipbookBack .shadow").css({ opacity:!endTransition?shadowLightOpacity:0, background:"linear-gradient("+(flipbook.angle*180/Math.PI+180+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+(100-pct)+"%)" });
			lib("#flipbookDualLeft .flipbookBehind .shadow").css({ background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+pct+"%)" });
			lib("#flipbookDualRight .flipbookBack .light").css({ opacity:0 });
			lib("#flipbookDualRight .flipbookBack .overlay").css({ opacity:0 });
			lib("#flipbookDualRight .flipbookBack .shadow").css({ opacity:0 });
			if (!endTransition) {
				lib([currentButton.parentNode]).find(".flipbookBack").css({ visibility:"visible", transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
				lib([currentButton.parentNode]).find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ left:leftBack.toFixed(10)+"em", top:topBack.toFixed(10)+"em", transformOrigin:"0% 0% 0px", transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
				lib([currentButton.parentNode]).find(".flipbookFront").css({ transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
				lib([currentButton.parentNode]).find(".flipbookFront>.pageContent").css({ left:leftFront.toFixed(10)+"em", top:(topFront-flipbook.h).toFixed(10)+"em", transformOrigin:"0% 100% 0px", transform:"rotate("+(-flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
			}
		} else if (currentButton.id.substr(0, 4)==="dual" && currentButton.id.substr(4).indexOf("Right")!==-1) {
			lib("#flipbookDualRight").css({ zIndex:2 });
			lib("#flipbookDualLeft").css({ zIndex:1 });
			lib("#flipbookDualRight .flipbookBack").css({ opacity:1 });
			lib("#flipbookDualLeft .flipbookBack").css({ opacity:0, visibility:"hidden" });
			lib("#flipbookDualRight .flipbookBack .light").css({ opacity:!endTransition?shadowLightOpacity:0, background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(255, 255, 255, "+((1-pct/100)*1/2+0.25)+") 0%, rgba(255, 255, 255, 0) "+(100-pct)+"%)" });
			lib("#flipbookDualRight .flipbookBack .overlay").css({ opacity:!endTransition?1:0, backgroundColor:"rgba(0,0,0,"+((1-pct/100)*1/2)+")" });
			lib("#flipbookDualRight .flipbookBack .shadow").css({ opacity:!endTransition?shadowLightOpacity:0, background:"linear-gradient("+(flipbook.angle*180/Math.PI+180+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+(100-pct/2)+"%)" });
			lib("#flipbookDualRight .flipbookBehind .shadow").css({ background:"linear-gradient("+(flipbook.angle*180/Math.PI+90*(currentButton.id.substr(4).indexOf("Left")!==-1?1:-1))+"deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, "+((1-pct/100)*3/4+0.25)+") "+pct+"%)" });
			lib("#flipbookDualLeft .flipbookBack .light").css({ opacity:0 });
			lib("#flipbookDualLeft .flipbookBack .overlay").css({ opacity:0 });
			lib("#flipbookDualLeft .flipbookBack .shadow").css({ opacity:0 });
			if (!endTransition) {
				lib([currentButton.parentNode]).find(".flipbookBack").css({ visibility:"visible", transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
				lib([currentButton.parentNode]).find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ left:leftBack.toFixed(10)+"em", top:topBack.toFixed(10)+"em", transformOrigin:"0% 0% 0px", transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
				lib([currentButton.parentNode]).find(".flipbookFront").css({ transformOrigin:transformOrigin, transform:"rotate("+(flipbook.angle*180/Math.PI).toFixed(10)+"deg) translate("+txContainer.toFixed(10)+"em, "+tyContainer.toFixed(10)+"em)" });
				lib([currentButton.parentNode]).find(".flipbookFront>.pageContent").css({ left:leftFront.toFixed(10)+"em", top:(topFront-flipbook.h).toFixed(10)+"em", transformOrigin:"0% 100% 0px", transform:"rotate("+(-flipbook.angle*180/Math.PI).toFixed(10)+"deg)"});
			}
		}
		if (currentButton.id.substr(0, 4)==="dual") {
			if (flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.currentIndex===0 && currentButton.id.substr(4).indexOf("Right")!==-1 && (!endTransition || flipbook.endMove==="cancel")) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:"0em", opacity:0 });
				lib("#flipbookDualRight").css({ left:flipbook.w/4-flipbook.w/2*foldedCornerCoordsRelativeToSheet.x/(flipbook.w*2)+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:0 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
			} else if (flipbook.futureIndex===0 && flipbook.endMove==="cancel" && !endTransition) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:"0em" });
				lib("#flipbookDualRight").css({ left:flipbook.w/4-flipbook.w/2*foldedCornerCoordsRelativeToSheet.x/(flipbook.w*2)+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:0 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
			} else if (flipbook.futureIndex===0 && currentButton.id.substr(4).indexOf("Left")!==-1 && !endTransition) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:-flipbook.w/2-flipbook.w/2*foldedCornerCoordsRelativeToSheet.x/(flipbook.w*2)+"em" });
				lib("#flipbookDualRight").css({ left:flipbook.w/2-flipbook.w/2*foldedCornerCoordsRelativeToSheet.x/(flipbook.w*2)+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:0 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
			} else if (flipbook.futureIndex===0 && endTransition && flipbook.endMove!=="cancel") {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:"0em", opacity:0 });
				lib("#flipbookDualRight").css({ left:"0em", opacity:1 });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:0 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualLeft").css({ zIndex:1 });
				lib("#flipbookDualRight").css({ zIndex:2 });
			} else if (((flipbook.futureIndex===imgs.length-1 && currentButton.id.substr(4).indexOf("Left")!==-1 && flipbook.endMove!=="cancel") || (flipbook.futureIndex===imgs.length-2-(imgs.length-2)%2 && flipbook.currentIndex===imgs.length-1 && currentButton.id.substr(4).indexOf("Right")!==-1)) && !endTransition) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:"0em", opacity:0 });
				lib("#flipbookDualRight").css({ left:"0em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
			} else if (flipbook.futureIndex===imgs.length-1 && flipbook.futureIndex>flipbook.currentIndex && currentButton.id.substr(4).indexOf("Right")!==-1 && !endTransition) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:-flipbook.w/2+flipbook.w/2*(flipbook.w-foldedCornerCoordsRelativeToSheet.x)/(flipbook.w*2)+"em" });
				lib("#flipbookDualRight").css({ left:flipbook.w/2+flipbook.w/2*(flipbook.w-foldedCornerCoordsRelativeToSheet.x)/(flipbook.w*2)+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
			} else if ((flipbook.futureIndex>0 && flipbook.futureIndex<imgs.length-1 && flipbook.currentIndex===imgs.length-1 && currentButton.id.substr(4).indexOf("Left")!==-1 && (!endTransition || flipbook.endMove==="cancel")) || (flipbook.futureIndex===imgs.length-1 && currentButton.id.substr(4).indexOf("Left")!==-1 && flipbook.endMove==="cancel" && !endTransition)) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:-flipbook.w/4+flipbook.w/2*(flipbook.w-foldedCornerCoordsRelativeToSheet.x)/(flipbook.w*2)+"em" });
				lib("#flipbookDualRight").css({ left:-flipbook.w/4+flipbook.w/2*(flipbook.w-foldedCornerCoordsRelativeToSheet.x)/(flipbook.w*2)+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
			} else if (flipbook.futureIndex===imgs.length-1) {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:"0em", opacity:1 });
				lib("#flipbookDualRight").css({ left:flipbook.w/2*(flipbook.w-foldedCornerCoordsRelativeToSheet.x)/(flipbook.w*2)+"em", opacity:endTransition?0:1 });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:0 });
				if (endTransition) {
					lib("#flipbookDualLeft").css({ zIndex:2 });
					lib("#flipbookDualRight").css({ zIndex:1 });
				}
			} else if ((flipbook.futureIndex>0 && flipbook.futureIndex-flipbook.currentIndex>0) || (flipbook.futureIndex<imgs.length-1 && flipbook.futureIndex!==-1 && flipbook.futureIndex-flipbook.currentIndex<0) || flipbook.endMove==="cancel") {
				lib("#flipbookDual").css({ marginLeft:-flipbook.w/2+"em" });
				lib("#flipbookDualLeft").css({ left:-flipbook.w/2+"em" });
				lib("#flipbookDualRight").css({ left:flipbook.w/2+"em" });
				lib("#flipbookDualLeft").find(".flipbookBehind").css({ opacity:1 });
				lib("#flipbookDualRight").find(".flipbookBehind").css({ opacity:1 });
			}
			if (endTransition && flipbook.endMove!=="cancel" && flipbook.context==="initTurnManual") {
				if (currentButton.id.substr(4).indexOf("Right")!==-1) {
					if (flipbook.currentIndex===0) {
						flipbook.currentIndex++;
					} else {	
						flipbook.currentIndex+=2;
					}
					if (flipbook.currentIndex>imgs.length-1) {
						flipbook.currentIndex=imgs.length-1;
					}
				} else if (currentButton.id.substr(4).indexOf("Left")!==-1) {
					flipbook.currentIndex-=2;
					if (flipbook.currentIndex<0) {
						flipbook.currentIndex=0;
					}
				}
			} else if (endTransition && flipbook.endMove!=="cancel" && flipbook.context==="goToPageAuto") {
				flipbook.currentIndex=flipbook.futureIndex;
				if (flipbook.currentIndex>0 && flipbook.currentIndex<imgs.length-1 && flipbook.currentIndex%2===0) {
					flipbook.currentIndex--;
				}
			}
			if (flipbook.context==="initTurnManual" && endTransition) {
				// debugger;
			}
			if (endTransition && flipbook.endMove!=="cancel" && flipbook.context!=="turnPossibility") {
				flipbook.animating=false;
				flipbook.endMove="";
				var index=flipbook.context==="goToPageAuto"?flipbook.currentIndex:flipbook.futureIndex;
				if (flipbook.context!=="goToPageAuto") {
					if (flipbook.futureIndex!==-1) {
						if (flipbook.history) flipbook.history.pushState({ addr:parseInt(flipbook.futureIndex, 10)+1 }, document.title, flipbook.futureIndex+1);
					} else {
						if (flipbook.history) flipbook.history.pushState({ addr:parseInt(flipbook.currentIndex, 10)+1 }, document.title, flipbook.currentIndex+1);
					}
				}
				if (index===0) {
					lib("#flipbookDualLeft").css({ opacity:0 });
					lib("#flipbookDualRight").css({ opacity:1 });
					lib(".flipbookFront").css({ opacity:1 });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em) rotate(0deg)", left:"0em", top:"0em" });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ left:"0em", top:"0em", transform:"rotate(0deg)" });
					var img1=lib("#flipbookDualRight").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					var img2=lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img2, imgs[index+1]);
					var img3=lib("#flipbookDualRight").find(".flipbookBehind>.pageContent").targets[0];
					r=flipbook.selectPageImage(img3, imgs[index+2]);
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0 });
					lib(".flipbookBack").css({ zIndex:0 });
				} else if (index>0 && index<imgs.length-1) {
					lib("#flipbookDualLeft").css({ opacity:1 });
					lib("#flipbookDualRight").css({ opacity:1 });
					lib("#flipbookDualLeft .flipbookBack>.pageContent, #flipbookDualLeft .flipbookBack .overlay, #flipbookDualLeft .flipbookBack .shadow, #flipbookDualLeft .flipbookBack .light").css({ left:0+"em" });
					lib("#flipbookDualRight .flipbookBack>.pageContent, #flipbookDualRight .flipbookBack .overlay, #flipbookDualRight .flipbookBack .shadow, #flipbookDualRight .flipbookBack .light").css({ left:(flipbook.sqrt-flipbook.w)+"em" });
					lib(".flipbookFront").css({ opacity:1 });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em)", left:"0em", top:"0em" });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ left:"0em", top:"0em", transform:"rotate(0deg)" });
					var img1=lib("#flipbookDualLeft").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					var img1b=lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img1b, imgs[index-1]);
					if (index-2>=0) {
						var img1c=lib("#flipbookDualLeft").find(".flipbookBehind>.pageContent").targets[0];
						r=flipbook.selectPageImage(img1c, imgs[index-2]);
					}
					var img2=lib("#flipbookDualRight").find(".flipbookFront>.pageContent").targets[0];
					lib([img2]).css({ opacity:0 });
					r=flipbook.selectPageImage(img2, imgs[index+1]);
					img2=r[0];
					lib([img2]).css({ opacity:1 });
					if (index+2<imgs.length) {
						var img2b=lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0];
						r=flipbook.selectPageImage(img2b, imgs[index+2]);
					}
					if (index+3<imgs.length) {
						var img2c=lib("#flipbookDualRight").find(".flipbookBehind>.pageContent").targets[0];
						r=flipbook.selectPageImage(img2c, imgs[index+3]);
					}
					lib(".flipbookBack").css({ zIndex:0 });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0, left:"0em" });
				} else if (index===imgs.length-1) {
					lib("#flipbookDualLeft").css({ opacity:1 });
					lib("#flipbookDualRight").css({ opacity:0 });
					lib(".flipbookFront").css({ opacity:1 });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em)", left:"0em", top:"0em" });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ left:"0em", top:"0em", transform:"rotate(0deg)" });
					lib("#flipbookDualRight").css({ opacity:0 });
					var img1=lib("#flipbookDualLeft").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					var img2=lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img2, imgs[index-1]);
					var img3=lib("#flipbookDualLeft").find(".flipbookBehind>.pageContent").targets[0];
					r=flipbook.selectPageImage(img3, imgs[index-2]);
					lib(".flipbookBack").css({ zIndex:0 });
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0, left:"0em" });
				}
			} else if (endTransition && flipbook.context!=="turnPossibility") {
				if (flipbook.context!=="goToPageAuto" && flipbook.endMove!=="cancel") {
					if (flipbook.history) flipbook.history.pushState({ addr:parseInt(flipbook.currentIndex, 10)+1 }, document.title, flipbook.currentIndex+1);
				}
				flipbook.animating=false;
				lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em) rotate(0deg)", left:"0em", top:"0em" });
				lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookFront>.pageContent").css({ transform:"rotate(0deg)", left:"0em", top:"0em" });
				lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ transform:"rotate(0deg)", top:"0em" });
				var index=flipbook.endMove!=="cancel"?flipbook.futureIndex:flipbook.currentIndex;
				if (index===0) {
					lib("#flipbookDualRight").css({ opacity:1 });
					lib("#flipbookDualLeft").css({ opacity:0 });
					var img1=lib("#flipbookDualRight").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					var img2=lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img2, imgs[index+1]);
					var img3=lib("#flipbookDualRight").find(".flipbookBehind>.pageContent").targets[0];
					r=flipbook.selectPageImage(img3, imgs[index+2]);
					lib(".flipbookBack").css({ zIndex:0 });
				} else if (index>0 && index<imgs.length-1) {
					lib("#flipbookDualLeft").css({ opacity:1 });
					lib("#flipbookDualRight").css({ opacity:1 });
					lib("#flipbookDualLeft .flipbookBack>.pageContent, #flipbookDualLeft .flipbookBack .overlay, #flipbookDualLeft .flipbookBack .shadow, #flipbookDualLeft .flipbookBack .light").css({ left:0+"em" });
					lib("#flipbookDualRight .flipbookBack>.pageContent, #flipbookDualRight .flipbookBack .overlay, #flipbookDualRight .flipbookBack .shadow, #flipbookDualRight .flipbookBack .light").css({ left:(flipbook.sqrt-flipbook.w)+"em" });
					var img1=lib("#flipbookDualRight").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index+1]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					if (index+2<imgs.length) {
						flipbook.loadCountWanted++;
						var img1b=lib("#flipbookDualRight").find(".flipbookBack>.pageContent").targets[0];
						r=flipbook.selectPageImage(img1b, imgs[index+2]);
					}
					if (index+3<imgs.length) {
						flipbook.loadCountWanted++;
						var img1c=lib("#flipbookDualRight").find(".flipbookBehind>.pageContent").targets[0];
						r=flipbook.selectPageImage(img1c, imgs[index+3]);
					}
					var img2=lib("#flipbookDualLeft").find(".flipbookFront>.pageContent").targets[0];
					lib([img2]).css({ opacity:0 });
					r=flipbook.selectPageImage(img2, imgs[index]);
					img2=r[0];
					lib([img2]).css({ opacity:1 });
					if (index-1>=0) {
						var img2b=lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0];
						r=flipbook.selectPageImage(img2b, imgs[index-1]);
					}
					if (index-2>=0) {
						var img2c=lib("#flipbookDualLeft").find(".flipbookBehind>.pageContent").targets[0];
						r=flipbook.selectPageImage(img2c, imgs[index-2]);
					}
					lib(".flipbookBack").css({ zIndex:0 }); 
					lib("#flipbookDualLeft, #flipbookDualRight").find(".flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ opacity:0 });
				} else if (index===imgs.length-1) {
					lib("#flipbookDualLeft").css({ opacity:1 });
					lib("#flipbookDualRight").css({ opacity:0 });
					var img1=lib("#flipbookDualLeft").find(".flipbookFront>.pageContent").targets[0];
					lib([img1]).css({ opacity:0 });
					r=flipbook.selectPageImage(img1, imgs[index]);
					img1=r[0];
					lib([img1]).css({ opacity:1 });
					var img2=lib("#flipbookDualLeft").find(".flipbookBack>.pageContent").targets[0];
					r=flipbook.selectPageImage(img2, imgs[index-1]);
					var img3=lib("#flipbookDualLeft").find(".flipbookBehind>.pageContent").targets[0];
					r=flipbook.selectPageImage(img3, imgs[index-2]);
					lib(".flipbookBack").css({ zIndex:0 });
				}
			}
		}
		if (endTransition && flipbook.endMove==="cancel") {
			flipbook.endMove="";
		}
		if (endTransition && flipbook.context!=="turnPossibility" && flipbook.mode==="dual") {
			flipbook.showDualSpread(flipbook.currentIndex);
		}
		if (endTransition && flipbook.context==="goToPageAuto" && flipbook.autoStepTarget!==null && !flipbook.animating) {
			var autoStepTarget=flipbook.autoStepTarget;
			flipbook.autoStepTarget=null;
			flipbook.animating=true;
			if (flipbook.autoStepTimer!==-1) clearTimeout(flipbook.autoStepTimer);
			flipbook.autoStepTimer=setTimeout(function() {
				flipbook.autoStepTimer=-1;
				flipbook.animating=false;
				flipbook.goToPageAuto(autoStepTarget, false);
			}, 200);
		}
		if (flipbook.distCurrent===flipbook.distMax*fs && flipbook.context==="turnPossibility") {
			clearInterval(flipbook.interval);
			flipbook.animating=false;
			if (flipbook.distMax===0 && currentButton && currentButton.parentNode) {
				lib([currentButton.parentNode]).find(".flipbookFront, .flipbookBack").css({ transform:"translate(0em, 0em) rotate(0deg)", left:"0em", top:"0em" });
				lib([currentButton.parentNode]).find(".flipbookFront>.pageContent").css({ transform:"rotate(0deg)", left:"0em", top:"0em" });
				lib([currentButton.parentNode]).find(".flipbookBack>.pageContent, .flipbookBack>.pageContent, .flipbookBack>.overlay, .flipbookBack>.shadow, .flipbookBack>.light").css({ transform:"rotate(0deg)", left:"0em", top:"0em" });
				lib([currentButton.parentNode]).find(".flipbookBack").css({ visibility:"hidden", zIndex:0 });
			}
			flipbook.memDistCurrent=flipbook.distCurrent;
			flipbook.distCurrent=0;
		}
	},
	isTouchDevice:'ontouchstart' in document.documentElement,
	page:function(addr, boolState, useIntermediateStep) {
		addr=addr.toString().toLowerCase();
		if (boolState && flipbook.history) { flipbook.history.pushState({ addr:addr }, document.title, addr); }
		if (parseInt(addr, 10)-1>=0 && parseInt(addr, 10)-1<imgs.length) {
			flipbook.goToPageAuto(parseInt(addr, 10), useIntermediateStep===true);
		}
	},
	preventDefaultOnImg:function() {
		lib("img").on("dragenter", function(e) { e.preventDefault(); });
		lib("img").on("mousedown", function(e) { e.preventDefault(); });
	},
	tweakLinks:function() {
		var hasHref=lib(":not(link):not(img)[href]").targets;
		var nohash=lib().address.nohash().replace(/[^\/]+$/, "");
		var href;
		if (hasHref.hasOwnProperty("length")) {
			for (var i=0; i<hasHref.length; i++) {
				if ((hasHref[i].href.toString().indexOf(nohash)!=-1 || hasHref[i].href.toString().replace(/[^\/]+$/, "")==="") && !/^mailto:|tel:/.test(hasHref[i].href.toString()) && !/\.[a-z0-9]+$/.test(hasHref[i].href.toString()) && !/#[a-z0-9-]+$/.test(hasHref[i].href.toString()) && hasHref[i].href.toString().replace(nohash, "")!=="") {
					hasHref[i].href=hasHref[i].href.toString().replace(/[^#]([a-z0-9-]+)$/, "/$1");
					lib([hasHref[i]]).on("click", function(e) { e.preventDefault(); var t=e.libTarget; if ("href" in t) { flipbook.page(t.href.toString().substring(t.href.toString().lastIndexOf("/")+1), true, t.classList.contains("thumb")); } });
				}
			}
		}
		lib('a[href$="#flipbook"]').on("click", function(e) { e.preventDefault(); });
	},
	customScroll:function() {
		return (flipbook.getScrollBarWidth()!==0);
	},
	getScrollBarWidth:function() {
		var inner = document.createElement('p');
		lib([inner]).css({ width:"100%", height:"200px" });
		var outer = document.createElement('div');
		lib([outer]).css({ position:"absolute", top:"0px", left:"0px", visibility:"hidden", width:"200px", height:"150px", overflow:"hidden" });
		outer.appendChild(inner);
		document.body.appendChild(outer);
		var w1=inner.offsetWidth;
		outer.style.overflow = 'scroll';
		var w2=inner.offsetWidth;
		if (w1==w2) w2=outer.clientWidth;
		document.body.removeChild (outer);
		return (w1 - w2);
	},
	scrollableHorizontally:[],
	scrollableVertically:[],
	scrollBarWidth:[],
	scrollBarHeight:[],
	scrollDirection:[],
	scrollTarget:"pages_view",
	scrollOffset:{},
	scrollXOffset:{},
	scrollYOffset:{},
	lockScrollTarget:false,
	setScrollBars:function() {
		var fs, scFS;
		fs=1;
		if (flipbook.customScroll()) {
			var scrollable=lib(".flipbook_scrollable").targets,scFs;
			if (scrollable.length>0) {
				flipbook.ltwhScrollable=[];
				flipbook.ltwhScrollableContent=[];
				for (var i=0; i<scrollable.length; i++) {
					if (!(scrollable[i].getAttribute("data-guid")!==null && flipbook.dontSetScrollBarsForOverlay[scrollable[i]["data-guid"]])) {
						lib([scrollable[i]]).find(".flipbook_container").css({ fontSize:"1em", overflow:"hidden" });
						flipbook.ltwhScrollable[i]=lib(scrollable[i]).ltwhRelativeTo(document.body)[0];
						flipbook.ltwhScrollableContent[i]=lib(scrollable[i]).find(".flipbook_content").ltwhRelativeTo(document.body)[0];
						scFs=parseFloat(lib("#verticalScroll_"+scrollable[i].id).css("font-size", "px")[0]);
						fs=parseFloat(lib([scrollable[i]]).css("font-size", "px")[0]);
						if (flipbook.ltwhScrollableContent[i].width-1>flipbook.ltwhScrollable[i].width) {
							flipbook.scrollableHorizontally[scrollable[i].id]=true;
							if (!(scrollable[i].id in flipbook.scrollXOffset)) {
								flipbook.scrollXOffset[scrollable[i].id]=0;
							}
							flipbook.scrollDirection[scrollable[i].id]="horizontal";
							lib([scrollable[i]]).on("mouseover", flipbook.setScrollTarget);
							lib([scrollable[i]]).find(".flipbook_scroll").css({ visibility:"visible", opacity:1 });
							lib([scrollable[i]]).find(".flipbook_horizontalScroll").to({ style: { height:"0.5em" } }, { duration:250 });
							flipbook.scrollBarWidth[scrollable[i].id]=Math.pow(scrollable[i].offsetWidth-lib("#verticalScroll_"+scrollable[i].id).targets[0].offsetWidth,2)/lib([scrollable[i]]).find(".flipbook_content").targets[0].offsetWidth/scFs;
							lib("#horizontalScrollBar_"+scrollable[i].id).to({ style: { width:flipbook.scrollBarWidth[scrollable[i].id]+"em", left:"0em" } }, { duration:250 });
							lib("#horizontalScrollBar_"+scrollable[i].id).on("mousedown", flipbook.initScrollHorizontally);
							lib("#horizontalScrollBack_"+scrollable[i].id).on("mousedown", flipbook.directScrollHorizontally);
						} else {
							flipbook.scrollXOffset[scrollable[i].id]=0;
							flipbook.scrollableHorizontally[scrollable[i].id]=false;
							lib([scrollable[i]]).find(".flipbook_content").to({ style: { fontSize:"1em" } }, { duration:250 });
							lib([scrollable[i]]).find(".flipbook_horizontalScroll").to({ style: { height:"0em" } }, { duration:250 });
							lib([scrollable[i]]).find(".flipbook_content").to({ style: { left:"0em" } }, { duration:250 });
							lib("#horizontalScrollBar_"+scrollable[i].id).to({ style: { width:(scrollable[i].offsetWidth/scFs)+"em", left:"0em" } }, { duration:250 });
							lib("#horizontalScrollBar_"+scrollable[i].id).off("mousedown", flipbook.initScrollHorizontally);
							lib("#horizontalScrollBack_"+scrollable[i].id).off("mousedown", flipbook.directScrollHorizontally);
						}
						if (flipbook.ltwhScrollableContent[i].height-1>flipbook.ltwhScrollable[i].height) {
							flipbook.scrollableVertically[scrollable[i].id]=true;
							if (!(scrollable[i].id in flipbook.scrollYOffset)) {
								flipbook.scrollYOffset[scrollable[i].id]=0;
							}
							flipbook.scrollDirection[scrollable[i].id]="vertical";
							lib([scrollable[i]]).on("mouseover", flipbook.setScrollTarget);
							lib([scrollable[i]]).find(".flipbook_scroll").css({ visibility:"visible", opacity:1 });
							lib([scrollable[i]]).find(".flipbook_verticalScroll").to({ style: { width:"0.5em" } }, { duration:250 });
							flipbook.scrollBarHeight[scrollable[i].id]=Math.pow(scrollable[i].offsetHeight-lib("#horizontalScroll_"+scrollable[i].id).targets[0].offsetHeight,2)/lib([scrollable[i]]).find(".flipbook_content").targets[0].offsetHeight/scFs;
							lib("#verticalScrollBar_"+scrollable[i].id).to({ style: { height:flipbook.scrollBarHeight[scrollable[i].id]+"em", top:"0em" } }, { duration:250 });
							lib("#verticalScrollBar_"+scrollable[i].id).on("mousedown", flipbook.initScrollVertically);
							lib("#verticalScrollBack_"+scrollable[i].id).on("mousedown", flipbook.directScrollVertically);
						} else {
							flipbook.scrollYOffset[scrollable[i].id]=0;
							flipbook.scrollableVertically[scrollable[i].id]=false;
							lib([scrollable[i]]).find(".flipbook_content").to({ style: { fontSize:"1em" } }, { duration:250 });
							lib([scrollable[i]]).find(".flipbook_verticalScroll").to({ style: { width:"0em" } }, { duration:250 });
							lib([scrollable[i]]).find(".flipbook_content").to({ style: { top:"0em" } }, { duration:250 });
							lib("#verticalScrollBar_"+scrollable[i].id).to({ style: { height:(scrollable[i].offsetHeight/scFs)+"em", top:"0em" } }, { duration:250 });
							lib("#verticalScrollBar_"+scrollable[i].id).off("mousedown", flipbook.initScrollVertically);
							lib("#verticalScrollBack_"+scrollable[i].id).off("mousedown", flipbook.directScrollVertically);
						}
					}
				}
			}
		} else {
			var scrollBarWidth=flipbook.getScrollBarWidth();
			if (scrollBarWidth>0) {
				var str='html::-webkit-scrollbar, .flipbook_scrollable>.flipbook_container::-webkit-scrollbar { width:15px; } html::-webkit-scrollbar-track, .flipbook_scrollable>.flipbook_container::-webkit-scrollbar-track { background-color:#ccc; box-shadow:inset 0 0 6px rgba(0,0,0,0.3); } html::-webkit-scrollbar-thumb, .flipbook_scrollable>.flipbook_container::-webkit-scrollbar-thumb { background-color:#333; outline:1px solid #333; }';
				lib("head").createNode("style", { type:"text/css" }, str);
			}
			var scrollable=lib(".flipbook_scrollable").targets;
			if (scrollable.length>0) {
				lib(scrollable).css({ overflow:"auto" });
			}
		}
		return true;
	},
	setListenersForVerticalScrollBar:function() {
		lib([flipbook.verticalScrollBar]).on("mousedown", flipbook.initScrollVertically);
		lib([flipbook.verticalScrollBack]).on("mousedown", flipbook.directScrollVertically);
	},
	scrollDirectlyTo:function(top, left) {
		if (flipbook.customScroll()) {
			var scrollable=lib(".flipbook_scrollable").targets;
			for (var i=0; i<scrollable.length; i++) {
				var ltwhVertScrollBar=lib("#verticalScrollBar_"+scrollable[i].id).ltwhRelativeTo(scrollable[i])[0],
					ltwhHorizScrollBar=lib("#horizontalScrollBar_"+scrollable[i].id).ltwhRelativeTo(scrollable[i])[0];
					scrollTarget=scrollable[i].id,
					scrollTargetContent=lib([scrollable[i]]).find(".flipbook_content").targets[0],
					ltwhContainer=lib([scrollable[i]]).ltwhRelativeTo(document.body)[0],
					ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollable[i])[0];
				flipbook.scrollYOffset[flipbook.scrollTarget]=top;
				var horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight;
				if (flipbook.scrollYOffset[flipbook.scrollTarget]<ltwhContainer.height-ltwhContent.height-horizHeight) {
					flipbook.scrollYOffset[flipbook.scrollTarget]=ltwhContainer.height-ltwhContent.height-horizHeight;
				}
				if (flipbook.scrollYOffset[flipbook.scrollTarget]>0) {
					flipbook.scrollYOffset[flipbook.scrollTarget]=0;
				}
				lib([scrollTargetContent]).stop().css({ top:flipbook.scrollYOffset[flipbook.scrollTarget]+"px" });
				lib("#verticalScrollBar_"+flipbook.scrollTarget).stop().css({ top:flipbook.scrollYOffset[flipbook.scrollTarget]/(ltwhContainer.height-(ltwhContent.height)-horizHeight)*(ltwhContainer.height-ltwhVertScrollBar.height-horizHeight)+"px" });
				flipbook.scrollXOffset[flipbook.scrollTarget]=left;
				var vertWidth=lib("#verticalScroll_"+flipbook.scrollTarget).targets[0].offsetWidth;
				if (flipbook.scrollXOffset[flipbook.scrollTarget]<ltwhContainer.width-ltwhContent.width-vertWidth) {
					flipbook.scrollXOffset[flipbook.scrollTarget]=ltwhContainer.width-ltwhContent.width-vertWidth;
				}
				if (flipbook.scrollXOffset[flipbook.scrollTarget]>0) {
					flipbook.scrollXOffset[flipbook.scrollTarget]=0;
				}
				lib([scrollTargetContent]).stop().css({ left:flipbook.scrollXOffset[flipbook.scrollTarget]+"px" });
				lib("#horizontalScrollBar_"+flipbook.scrollTarget).stop().css({ left:flipbook.scrollXOffset[flipbook.scrollTarget]/(ltwhContainer.width-ltwhContent.width-vertWidth)*(ltwhContainer.width-ltwhHorizScrollBar.width-vertWidth)+"px" });
			}
		} else {
			var scrollable=lib(".flipbook_scrollable").targets;
			for (var i=0; i<scrollable.length; i++) {
				scrollable[i].scrollTop=-Math.round(top);
				scrollable[i].scrollLeft=-Math.round(left);
			}
		}
	},
	setScrollTarget:function(event) {
		if (!flipbook.lockScrollTarget) {
			var elm=event.target;
			while (!/\bflipbook_scrollTarget\b/.test(elm.className) && elm!==document.documentElement) {
				elm=elm.parentNode;
			}
			if (/\bflipbook_scrollTarget\b/.test(elm.className)) {
				flipbook.scrollTarget=elm.id;
			}
		}
	},
	initScrollHorizontally:function(event) {
		if (event.button==0) {
			event.preventDefault();
			var ltwh=lib("#horizontalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(document.body)[0];
			if (!(flipbook.scrollTarget in flipbook.scrollOffset)) {
				flipbook.scrollOffset[flipbook.scrollTarget]={};
			}
			flipbook.scrollOffset[flipbook.scrollTarget].x=event.clientX-ltwh.left;
			lib("document").on("mousemove", flipbook.scrollHorizontally);
			flipbook.lockScrollTarget=true;
		}
	},
	initScrollVertically:function(event) {
		if (event.button==0) {
			event.preventDefault();
			var ltwh=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(document.body)[0];
			if (!(flipbook.scrollTarget in flipbook.scrollOffset)) {
				flipbook.scrollOffset[flipbook.scrollTarget]={};
			}
			flipbook.scrollOffset[flipbook.scrollTarget].y=event.clientY-ltwh.top;
			lib("document").on("mousemove", flipbook.scrollVertically);
			flipbook.lockScrollTarget=true;
		}
	},
	stopScrollHorizontally:function(event) {
		lib("document").off("mousemove", flipbook.scrollHorizontally);
		flipbook.lockScrollTarget=false;
	},
	stopScrollVertically:function(event) {
		lib("document").off("mousemove", flipbook.scrollVertically);
		flipbook.lockScrollTarget=false;
	},
	scrollHorizontally:function(event) {
			if ("buttons" in event && event.buttons===0) {
				flipbook.stopScrollHorizontally();
				return;
			}
		event.preventDefault();
		if (flipbook.scrollTarget!=="") {
			var scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
				scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
				ltwhScrollBar=lib("#horizontalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0],
				ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
				ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
				x=event.clientX-ltwhScrollBar.left-flipbook.scrollOffset[flipbook.scrollTarget].x-ltwhContainer.left,
				vertWidth=lib("#verticalScroll_"+flipbook.scrollTarget).targets[0].offsetWidth,
				scFs=parseFloat(lib("#horizontalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
				cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
			if (ltwhScrollBar.left+x<0) {
				x=-ltwhScrollBar.left;
			}
			if (ltwhScrollBar.left+x>ltwhContainer.width-ltwhScrollBar.width-vertWidth) {
				x=ltwhContainer.width-ltwhScrollBar.width-ltwhScrollBar.left-vertWidth;
			}
			flipbook.scrollXOffset[flipbook.scrollTarget]=(ltwhScrollBar.left+x)/(ltwhContainer.width-ltwhScrollBar.width-vertWidth)*(ltwhContainer.width-ltwhContent.width-vertWidth);
			lib([scrollTargetContent]).css({ left:flipbook.scrollXOffset[flipbook.scrollTarget]+"px" });
			lib("#horizontalScrollBar_"+flipbook.scrollTarget).css({ left:(ltwhScrollBar.left+x)+"px" });
		}
	},
	scrollVertically:function(event) {
			if ("buttons" in event && event.buttons===0) {
				flipbook.stopScrollVertically();
				return;
			}
		event.preventDefault();
		if (flipbook.scrollTarget!=="") {
			var scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
				scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
				ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0],
				ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
				ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
				y=event.clientY-ltwhScrollBar.top-flipbook.scrollOffset[flipbook.scrollTarget].y-ltwhContainer.top,
				horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
				scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
				cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
			if (ltwhScrollBar.top+y<0) {
				y=-ltwhScrollBar.top;
			}
			if (ltwhScrollBar.top+y>ltwhContainer.height-ltwhScrollBar.height-horizHeight) {
				y=ltwhContainer.height-ltwhScrollBar.height-ltwhScrollBar.top-horizHeight;
			}
			flipbook.scrollYOffset[flipbook.scrollTarget]=(ltwhScrollBar.top+y)/(ltwhContainer.height-ltwhScrollBar.height-horizHeight)*(ltwhContainer.height-(ltwhContent.height)-horizHeight);
			lib([scrollTargetContent]).css({ top:flipbook.scrollYOffset[flipbook.scrollTarget]+"px" });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).css({ top:(ltwhScrollBar.top+y)+"px" });
		}
	},
	directScrollHorizontally:function(event) {
		event.preventDefault();
		if (flipbook.scrollTarget!=="") {
			var scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
				scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
				ltwhScrollBar=lib("#horizontalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0],
				ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
				ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
				x=event.clientX-ltwhScrollBar.width/2-ltwhScrollBar.left-ltwhContainer.left,
				vertWidth=lib("#verticalScroll_"+flipbook.scrollTarget).targets[0].offsetWidth,
				scFs=parseFloat(lib("#horizontalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
				cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
			if (ltwhScrollBar.left+x<0) {
				x=-ltwhScrollBar.left;
			}
			if (ltwhScrollBar.left+x>ltwhContainer.width-ltwhScrollBar.width-vertWidth) {
				x=ltwhContainer.width-ltwhScrollBar.width-ltwhScrollBar.left-vertWidth;
			}
			flipbook.scrollXOffset[flipbook.scrollTarget]=(ltwhScrollBar.left+x)/(ltwhContainer.width-ltwhScrollBar.width-vertWidth)*(ltwhContainer.width-ltwhContent.width-vertWidth);
			lib([scrollTargetContent]).to({ style: { left:flipbook.scrollXOffset[flipbook.scrollTarget]+"px" }}, { duration:125 });
			lib("#horizontalScrollBar_"+flipbook.scrollTarget).to({ style: { left:(ltwhScrollBar.left+x)+"px" } }, { duration:125 });
		}
	},
	directScrollVertically:function(event) {
		event.preventDefault();
		if (flipbook.scrollTarget!=="") {
			var scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
				scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
				ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0],
				ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
				ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
				y=event.clientY-ltwhScrollBar.height/2-ltwhScrollBar.top-ltwhContainer.top,
				horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
				scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
				cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
			if (ltwhScrollBar.top+y<0) {
				y=-ltwhScrollBar.top;
			}
			if (ltwhScrollBar.top+y>ltwhContainer.height-ltwhScrollBar.height-horizHeight) {
				y=ltwhContainer.height-ltwhScrollBar.height-ltwhScrollBar.top-horizHeight;
			}
			flipbook.scrollYOffset[flipbook.scrollTarget]=(ltwhScrollBar.top+y)/(ltwhContainer.height-ltwhScrollBar.height-horizHeight)*(ltwhContainer.height-(ltwhContent.height)-horizHeight);
			lib([scrollTargetContent]).to({ style: { top:flipbook.scrollYOffset[flipbook.scrollTarget]+"px" }}, { duration:125 });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).to({ style: { top:(ltwhScrollBar.top+y)+"px" }}, { duration:125 });
		}
	},
	scrollWheel:function(event) {
		if (flipbook.customScroll()) {
			if ("preventDefault" in event && typeof(event.preventDefault)==="function") {
				event.preventDefault();
			}
			if (flipbook.scrollTarget!=="") {
				var ltwhScrollBar,
					scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
					scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
					ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
					ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
					value=(Math.abs(event.deltaY)!==0 && !isNaN(event.deltaY))?event.deltaY:(!isNaN(event.deltaX)?event.deltaX:0),
					scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
					cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
				if (flipbook.scrollDirection[flipbook.scrollTarget]=="vertical" && flipbook.scrollableVertically[flipbook.scrollTarget] && !(flipbook.majKey && flipbook.scrollableHorizontally[flipbook.scrollTarget])) {
					ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
					flipbook.scrollYOffset[flipbook.scrollTarget]-=value;
					var horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight;
					if (flipbook.scrollYOffset[flipbook.scrollTarget]<ltwhContainer.height-ltwhContent.height-horizHeight) {
						flipbook.scrollYOffset[flipbook.scrollTarget]=ltwhContainer.height-ltwhContent.height-horizHeight;
					}
					if (flipbook.scrollYOffset[flipbook.scrollTarget]>0) {
						flipbook.scrollYOffset[flipbook.scrollTarget]=0;
					}
					lib([scrollTargetContent]).stop().to({ style : { top:flipbook.scrollYOffset[flipbook.scrollTarget]+"px" }}, { duration:125 });
					lib("#verticalScrollBar_"+flipbook.scrollTarget).stop().to({ style : { top:flipbook.scrollYOffset[flipbook.scrollTarget]/(ltwhContainer.height-(ltwhContent.height)-horizHeight)*(ltwhContainer.height-ltwhScrollBar.height-horizHeight)+"px" }}, { duration:125 });
				} else if (flipbook.scrollableHorizontally[flipbook.scrollTarget]) {
					ltwhScrollBar=lib("#horizontalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
					flipbook.scrollXOffset[flipbook.scrollTarget]-=value;
					var vertWidth=lib("#verticalScroll_"+flipbook.scrollTarget).targets[0].offsetWidth;
					if (flipbook.scrollXOffset[flipbook.scrollTarget]<ltwhContainer.width-ltwhContent.width-vertWidth) {
						flipbook.scrollXOffset[flipbook.scrollTarget]=ltwhContainer.width-ltwhContent.width-vertWidth;
					}
					if (flipbook.scrollXOffset[flipbook.scrollTarget]>0) {
						flipbook.scrollXOffset[flipbook.scrollTarget]=0;
					}
					lib([scrollTargetContent]).stop().to({ style : { left:flipbook.scrollXOffset[flipbook.scrollTarget]+"px" }}, { duration:125 });
					lib("#horizontalScrollBar_"+flipbook.scrollTarget).stop().to({ style : { left:flipbook.scrollXOffset[flipbook.scrollTarget]/(ltwhContainer.width-ltwhContent.width-vertWidth)*(ltwhContainer.width-ltwhScrollBar.width-vertWidth)+"px" }}, { duration:125 });
				}
			}
		}
	},
	fixScroll:function(now, override) {
		if (flipbook.customScroll()) {
			lib("document").off("mousemove", flipbook.scrollHorizontally);
			lib("document").off("mousemove", flipbook.scrollVertically);
			var scrollTarget, scrollTargetContent, scrollBar, fs, fsScroll, scFs, horizHeight, vertWidth, p, fsTools, scrollBarContainer;
			for (p in flipbook.scrollableHorizontally) {
				if (lib("#"+p).targets.length>0) {
					scrollTarget=lib("#"+p).targets[0];
					scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0];
					scrollBar=lib("#horizontalScrollBar_"+p).targets[0];
					vertWidth=lib("#verticalScroll_"+p).targets[0].offsetWidth;
					fs=parseFloat(lib([scrollTarget]).css("font-size", "px")[0]);
					scFs=parseFloat(lib("#horizontalScroll_"+p).css("font-size", "px")[0]);
					cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]);
					flipbook.scrollBarWidth[p]=scrollBar.offsetWidth/scFs;
					if (scrollTargetContent.offsetLeft+scrollTargetContent.offsetWidth<scrollTarget.offsetWidth-vertWidth) {
						if (flipbook.scrollXOffset[p]<scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth) {
							flipbook.scrollXOffset[p]=scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth;
						}
						if (flipbook.scrollXOffset[p]>0) {
							flipbook.scrollXOffset[p]=0;
						}
						if (typeof(now)=="undefined" || !now) {
							lib([scrollTargetContent]).to({ style: { left:(flipbook.sizeMode==="em"?flipbook.scrollXOffset[p]/cFs+"em":flipbook.scrollXOffset[p]+"px") }}, { duration:150 });
							lib([scrollBar]).to({ style: { left:(flipbook.sizeMode==="em"?flipbook.scrollXOffset[p]/(scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth)*(scrollTarget.offsetWidth-flipbook.scrollBarWidth[p]*scFs-vertWidth)/scFs+"em":flipbook.scrollXOffset[p]/(scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth)*(scrollTarget.offsetWidth-flipbook.scrollBarWidth[p]*scFs-vertWidth)+"px") }}, { duration:150 });
						} else {
							lib([scrollTargetContent]).css({ left:(flipbook.sizeMode==="em"?flipbook.scrollXOffset[p]/cFs+"em":flipbook.scrollXOffset[p]+"px") });
							lib([scrollBar]).css({ left:(flipbook.sizeMode==="em"?flipbook.scrollXOffset[p]/(scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth)*(scrollTarget.offsetWidth-flipbook.scrollBarWidth[p]*scFs-vertWidth)/scFs+"em":flipbook.scrollXOffset[p]/(scrollTarget.offsetWidth-vertWidth-scrollTargetContent.offsetWidth)*(scrollTarget.offsetWidth-flipbook.scrollBarWidth[p]*scFs-vertWidth)+"px") });
						}
					} else if (scrollTargetContent.offsetLeft>0) {
						flipbook.scrollXOffset[p]=0;
						if (typeof(now)=="undefined" || !now) {
							lib([scrollTargetContent]).to({ style: { left:"0em" } }, { duration:150 });
							lib([scrollBar]).to({ style: { left:"0em" } }, { duration:150 });
						} else {
							lib([scrollTargetContent]).css({ left:"0em" });
							lib([scrollBar]).css({ left:"0em" });
						}
					}
				}
			}
			for (p in flipbook.scrollableVertically) {
				if (lib("#"+p).targets.length>0) {
					scrollTarget=lib("#"+p).targets[0];
					scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0];
					scrollBar=lib("#verticalScrollBar_"+p).targets[0];
					scrollBarContainer=lib("#verticalScroll_"+p).targets[0];
					horizHeight=lib("#horizontalScroll_"+p).targets[0].offsetHeight;
					fs=parseFloat(lib([scrollTarget]).css("font-size", "px")[0]);
					scFs=parseFloat(lib("#verticalScroll_"+p).css("font-size", "px")[0]);
					cFs=fs*parseFloat(lib([scrollTargetContent]).css("font-size")[0]);
					flipbook.scrollBarHeight[p]=scrollBar.offsetHeight/scFs;
					if (typeof(override)!=="undefined" && p==="flipbook_wrapper") {
						switch (override) {
							case "down":
								flipbook.scrollYOffset[p]=parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight;
							break;
							case "up":
								flipbook.scrollYOffset[p]=0;
							break;
						}
					}
					if (scrollTargetContent.offsetTop+scrollTargetContent.offsetHeight<parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight || typeof(override)!=="undefined") {
						if (flipbook.scrollYOffset[p]<parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight) {
							flipbook.scrollYOffset[p]=parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight;
						}
						if (flipbook.scrollYOffset[p]>0) {
							flipbook.scrollYOffset[p]=0;
						}
						var tt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[p]/cFs+"em":flipbook.scrollYOffset[p]+"px");
						var bt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[p]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[p]*scFs-horizHeight)/scFs+"em":flipbook.scrollYOffset[p]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[p]*scFs-horizHeight)+"px");
						if (typeof(now)==="undefined" || !now) {
							lib([scrollTargetContent]).to({ style: { top:tt }}, { duration:150 });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
						} else if (typeof(now)!=="undefined" && now==="top") {
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
						} else {
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).css({ top:bt });
						}
					} else if (scrollTargetContent.offsetTop>0) {
						flipbook.scrollYOffset[p]=0;
						var tt=(flipbook.sizeMode==="em"?"0em":"0px");
						var bt=(flipbook.sizeMode==="em"?"0em":"0px");
						if (typeof(now)==="undefined" || !now) {
							lib([scrollTargetContent]).to({ style: { top:tt }}, { duration:150 });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
						} else if (typeof(now)!=="undefined" && now==="top") {
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
						} else {
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).css({ top:bt });
						}
					} else if (!flipbook.animatingVerticalScroll && scrollTargetContent.offsetTop/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-scrollTargetContent.offseHeight)!==scrollBar.offsetTop/(scrollBarContainer.offsetHeight-scrollBar.offsetHeight)) {
						flipbook.scrollYOffset[p]=scrollTargetContent.offsetTop;
						if (flipbook.scrollYOffset[p]<parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight) {
							flipbook.scrollYOffset[p]=parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight;
						}
						if (flipbook.scrollYOffset[p]>0) {
							flipbook.scrollYOffset[p]=0;
						}
						var tt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[p]/cFs+"em":flipbook.scrollYOffset[p]+"px");
						var bt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[p]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[p]*scFs-horizHeight)/scFs+"em":flipbook.scrollYOffset[p]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[p]*scFs-horizHeight)+"px");
						if (typeof(now)==="undefined" || !now) {
							flipbook.animatingVerticalScroll=true;
							lib([scrollTargetContent]).to({ style: { top:tt }}, { duration:150 });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
							setTimeout(function() { flipbook.animatingVerticalScroll=false; }, 250);
						} else if (typeof(now)!=="undefined" && now==="top") {
							flipbook.animatingVerticalScroll=true;
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).to({ style: { top:bt }}, { duration:150 });
							setTimeout(function() { flipbook.animatingVerticalScroll=false; }, 250);
						} else {
							lib([scrollTargetContent]).css({ top:tt });
							lib([scrollBar]).css({ top:bt });
						}
					}
				}
			}
		}
		return true;
	},
	scrollTo:function(value, time) {
		flipbook.scrollYOffset["flipbook_wrapper"]=value;
		if (flipbook.customScroll()) {
			var horizHeight=lib("#horizontalScroll_flipbook_wrapper").targets[0].offsetHeight,
				scFs=parseFloat(lib("#verticalScroll_flipbook_wrapper").css("font-size", "px")[0]),
				cFs=parseFloat(lib([flipbook.wrapperContent]).css("font-size", "px")[0]);
			if (time===0) {
				lib([flipbook.wrapperContent]).css({ top:value/cFs+"em" });
				lib([flipbook.verticalScrollBar]).css({ top:value/(parseFloat(lib([flipbook.wrapper]).css("height", "px")[0])-parseFloat(lib([flipbook.wrapperContent]).css("height", "px")[0])-horizHeight)*(parseFloat(lib([flipbook.wrapper]).css("height", "px")[0])-flipbook.verticalScrollBar.offsetHeight-horizHeight)/scFs+"em"  });
			} else {
				lib([flipbook.wrapperContent]).to({ style: { top:value/cFs+"em" } }, { duration:time });
				lib([flipbook.verticalScrollBar]).to({ style: { top:value/(parseFloat(lib([flipbook.wrapper]).css("height", "px")[0])-parseFloat(lib([flipbook.wrapperContent]).css("height", "px")[0])-horizHeight)*(parseFloat(lib([flipbook.wrapper]).css("height", "px")[0])-flipbook.verticalScrollBar.offsetHeight-horizHeight)/scFs+"em"  } }, { duration:time });
			}
		} else {
			if (time===0) {
				document.body.scrollTop=-Math.round(value);
			} else {
				lib([document.body]).to({ scrollTop:-Math.round(value) }, { duration:time })
			}
		}
	},
	scrollTop:function() {
		var ltwhScrollBar,
			scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
			scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
			ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
			ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
			scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
			cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]),
			horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
			ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
		if (flipbook.scrollYOffset[flipbook.scrollTarget]<0) {
			flipbook.scrollYOffset[flipbook.scrollTarget]=0;
			lib("#verticalScrollBar_"+flipbook.scrollTarget).stop();
			var tt=(flipbook.sizeMode==="em"?"0em":"0px");
			var bt=(flipbook.sizeMode==="em"?"0em":"0px");
			lib([scrollTargetContent]).css({ top:tt });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).css({ top:bt });
		}
	},
	scrollDown:function() {
		var ltwhScrollBar,
			scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
			scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
			ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
			ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
			scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
			cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]),
			horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
			ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
		if (flipbook.scrollYOffset[flipbook.scrollTarget]>parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight) {
			flipbook.scrollYOffset[flipbook.scrollTarget]=parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight;
			lib("#verticalScrollBar_"+flipbook.scrollTarget).stop();
			var tt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[flipbook.scrollTarget]/cFs+"em":flipbook.scrollYOffset[flipbook.scrollTarget]+"px");
			var bt=(flipbook.sizeMode==="em"?flipbook.scrollYOffset[flipbook.scrollTarget]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[flipbook.scrollTarget]*scFs-horizHeight)/scFs+"em":flipbook.scrollYOffset[flipbook.scrollTarget]/(parseFloat(lib([scrollTarget]).css("height", "px")[0])-horizHeight-scrollTargetContent.offsetHeight)*(parseFloat(lib([scrollTarget]).css("height", "px")[0])-flipbook.scrollBarHeight[flipbook.scrollTarget]*scFs-horizHeight)+"px");
			lib([scrollTargetContent]).css({ top:tt });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).css({ top:bt });
		}
	},
	scrollLeft:function() {
		var ltwhScrollBar,
			scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
			scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
			ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
			ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
			scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
			cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]),
			horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
			ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
		if (flipbook.scrollYOffset[flipbook.scrollTarget]<0) {
			flipbook.scrollYOffset[flipbook.scrollTarget]=0;
			lib("#verticalScrollBar_"+flipbook.scrollTarget).stop();
			var tt=(flipbook.sizeMode==="em"?"0em":"0px");
			var bt=(flipbook.sizeMode==="em"?"0em":"0px");
			lib([scrollTargetContent]).css({ top:tt });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).css({ top:bt });
		}
	},
	scrollRight:function() {
		var ltwhScrollBar,
			scrollTarget=lib("#"+flipbook.scrollTarget).targets[0],
			scrollTargetContent=lib([scrollTarget]).find(".flipbook_content").targets[0],
			ltwhContainer=lib([scrollTarget]).ltwhRelativeTo(document.body)[0],
			ltwhContent=lib([scrollTargetContent]).ltwhRelativeTo(scrollTarget)[0],
			scFs=parseFloat(lib("#verticalScroll_"+flipbook.scrollTarget).css("font-size", "px")[0]),
			cFs=parseFloat(lib([scrollTargetContent]).css("font-size", "px")[0]),
			horizHeight=lib("#horizontalScroll_"+flipbook.scrollTarget).targets[0].offsetHeight,
			ltwhScrollBar=lib("#verticalScrollBar_"+flipbook.scrollTarget).ltwhRelativeTo(scrollTarget)[0];
		if (flipbook.scrollYOffset[flipbook.scrollTarget]<0) {
			flipbook.scrollYOffset[flipbook.scrollTarget]=0;
			lib("#verticalScrollBar_"+flipbook.scrollTarget).stop();
			var tt=(flipbook.sizeMode==="em"?"0em":"0px");
			var bt=(flipbook.sizeMode==="em"?"0em":"0px");
			lib([scrollTargetContent]).css({ top:tt });
			lib("#verticalScrollBar_"+flipbook.scrollTarget).css({ top:bt });
		}
	},
	wait:function(variable, refs, fn) {
		var ref=window;
		for (var p in refs) {
			if (refs[p]!=="" && typeof(refs[p])==="string") {
				if (refs[p] in ref) {
					ref=ref[refs[p]];
				} else {
					setTimeout(function() { flipbook.wait(variable, refs, fn); }, 100);
					return;
				}
			}
		}
		if (variable in ref) {
			fn();
		} else {
			setTimeout(function() { flipbook.wait(variable, refs, fn); }, 100);
		}
	},
	onUnloadFunctions:[]
};
