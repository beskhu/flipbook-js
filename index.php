<?php
	if (file_exists(__DIR__.'/dependencies/session.php')) {
		include_once(__DIR__.'/dependencies/session.php');
	}
?>
<!DOCTYPE HTML>
<html lang="fr">
<head>
	<title>Flipbook</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<meta http-equiv="Content-type" content="text/html; charset=UTF-8"/>
	<meta name="description" content=""/>
	<meta name="keywords" content=""/>
	<meta name="robots" content="index, follow, all"/>
	<meta name="revisit-after" content=""/>
	<meta name="category" content=""/>
	<meta name="rating" content=""/>
	<meta name="author" content=""/>
	<link rel="icon" type="image/png" href="./favicon.png"/>
	<script type="text/javascript">var onLoadedFunctions=[];</script>
<?php
	include_once(__DIR__.'/dependencies/fontsAndScripts.php');
?>
	<script type="text/javascript" class="loading">
		var originalTime=(new Date()).getTime(),
		timerId=false,
		timeElapsed=0,
		memLoaded=0,
		memTimeElapsed=0,
		loadPerMs=200,
		loadedEstimation=0,
		estim=0,
		filesLoaded=[],
		percent=0,
		loaded=0,
		totalToLoad=0.000000001,
		tQ=[],
		percentCont=null,
		arc=null,
		ctx=null,
		timer=function() {
			var time=(new Date()).getTime();
			timeElapsed=time-originalTime;
			if (loadPerMs>0 && timeElapsed!=memTimeElapsed) {
				estim=Math.round(loadPerMs*(timeElapsed-memTimeElapsed));
				loader(estim, 'estimation', null);
			}
		};
		totalToLoad=<?php echo $_SESSION["total_to_load"]; ?>;
		function drawPercent(pct) {
			var currentAngle=pct/100*Math.PI*2;
			ctx.clearRect(0, 0, 500, 500);
			ctx.beginPath();
			ctx.lineWidth=10;
			ctx.strokeStyle="#000";
			ctx.arc(250, 250, 240, 0, currentAngle);
			ctx.stroke(); 
			percentCont.innerHTML=Math.round(pct)+"%";
		}
		function complete() {
			clearInterval(easingTimerId);
			if ("lib" in window && "flipbook" in window && "onLoaded" in window.flipbook) {
				flipbook.onLoaded(false);
			} else {
				setTimeout(function() { complete(); }, 100);
			}
		}
		function loader(size, origin, filePath) {
			var time=(new Date()).getTime();
			timeElapsed=time-originalTime;
			if ((filesLoaded.indexOf(filePath)==-1 && (origin=="html" || origin=="css")) || origin=="estimation") {
				if (origin=="html" || origin=="css") { 
					filesLoaded.push(filePath);
					loadedEstimation+=parseInt(size, 10);
					if (loaded!=memLoaded && timeElapsed!=memTimeElapsed) {
						loadPerMs=(loaded-memLoaded)/(timeElapsed-memTimeElapsed);
						memLoaded=loaded;
						memTimeElapsed=timeElapsed;
					} else if (loadPerMs==0) {
						loadPerMs=2000;
					}
				} else {
					loadedEstimation+=parseInt(size, 10);
					memTimeElapsed=timeElapsed;
				}
				var old_percent=percent;
				percent=Math.ceil(loadedEstimation/totalToLoad*100);
				if (percent>=100) percent=100;
				tQ=(percent<100)
					?(tQ[2]!=percent)
						?[function (pct) { wait(["ctx"], function() { drawPercent(pct); }); }, old_percent, percent, 0, 250, false]
						:tQ
					:(tQ[2]!=100)
						?[function (pct) { wait(["ctx"], function() { drawPercent(pct); }); }, old_percent, percent, 0, 250, function () { complete(); }]
						:tQ
				;
				if (percent==100) {
					clearInterval(timerId);
				}
			}
		}
		timerId=setInterval(timer, 50);
		function doTheLoadingJob() {
			var isTouchDevice="ontouchstart" in document.documentElement;
			var siteLoader=document.createElement("div");
			siteLoader.id="siteLoader";
			siteLoader.className="loader";
			siteLoader.style.position="absolute";
			siteLoader.style.width="100%";
			siteLoader.style.height="100%";
			document.body.appendChild(siteLoader);
			var wTot=window.innerWidth;
			var hTot=window.innerHeight;
			var dim=(hTot+wTot)/2;
			var str="";
			if (!/iphone|ipod|ipad|blackberry|galaxy|android|mobile/i.test(navigator.userAgent)) {
				siteLoader.style.left="40%";
				siteLoader.style.top=Math.round(window.innerHeight*0.4)+"px";
				siteLoader.style.width="20%";
				siteLoader.style.height=Math.round(window.innerHeight*0.2)+"px";
			} else {
				siteLoader.style.left="30%";
				siteLoader.style.top=Math.round(window.innerHeight*0.3)+"px";
				siteLoader.style.width="40%";
				siteLoader.style.height=Math.round(window.innerHeight*0.4)+"px";
			}
			str+="\n\t\t"+'<span style="position:absolute; width:'+Math.round(dim*0.2)+'px; height:'+Math.round(dim*0.2)+'px; left:50%; margin-left:'+Math.round(-dim*0.1)+'px; top:50%; margin-top:'+Math.round(-dim*0.1)+'px; font-size:'+Math.round(dim*0.025)+'px;"><canvas width=500 height=500 style="width:100%; height:100%;" id="_arc"></canvas></span>';
			str+="\n\t\t"+'<span id="_pct" style="position:absolute; width:'+Math.round(dim*0.2)+'px; height:'+Math.round(dim*0.025)+'px; left:50%; margin-left:'+Math.round(-dim*0.1)+'px; top:50%; margin-top:'+Math.round(-dim*0.0175)+'px; font-size:'+Math.round(dim*0.025)+'px; font-weight:bold; text-align:center; font-family:Arial; color:#000;"></span>';
			siteLoader.innerHTML=str;
			percentCont=document.getElementById("_pct");
			arc=document.getElementById("_arc");
			ctx=arc.getContext("2d");
			var cssImages=false;
			var easingId=false;
			var linearEasing=function () {
				if (typeof(tQ)!=undefined && tQ.length==6) {
					if (tQ[3]<tQ[4]) {
						var value;
						tQ[3]+=25;
						value=tQ[1]+(tQ[2]-tQ[1])*(tQ[3]/tQ[4]);
						tQ[0](value);
					} else {
						if (tQ[5]!=false) {
							tQ[5]();
							tQ=[];
						}
					}
				}
			};
			var bBpath=<?php echo $_SESSION['bBpathStr']; ?>;
			var bBtype=<?php echo $_SESSION['bBtypeStr']; ?>;
			if (bBpath.length>0) {
				for (var i=0; i<bBpath.length; i++) {
					if (bBtype[i]=="css") {
						document.getElementById("bBpath_"+i).href=bBpath[i];
					} else if (bBtype[i]=="js") {
						document.getElementById("bBpath_"+i).src=bBpath[i];
					}
				}
			}
			if (isTouchDevice) {
				window.onload=complete;
			}
			timerId=setInterval(timer, 50);
			easingTimerId=setInterval(linearEasing, 25);
		}
		function wait(a, f) {
			var o=window;
			for (var p in a) {
				if (a[p] in o && o[a[p]]!==null) {
					o=o[a[p]];
					if (p==a.length-1) {
						f();
					}
				} else {
					setTimeout(function() { wait(a, f); }, 50);
				}
			}
		}
		wait(["document","body"], doTheLoadingJob);
	</script>
	<?php
	echo $_SESSION['css'];
	echo $_SESSION['fontsCss'];
	echo $_SESSION['js']['lib'].$_SESSION['js']['flipbook'].(preg_match('/msie 9/i', $_SERVER['HTTP_USER_AGENT'])?$_SESSION['js']['history.adapter.native'].$_SESSION['js']['history']:'');
	?>
</head>
<body>
	<div id="background"></div>
	<div id="wrapper">
		<div id="subwrapper" style="height:100%;" class="flipbook_more_resizable">
			<?php
				$contentDirectory=__DIR__.'/content';
				$contentUrl='./content/';
				$contentFiles=glob($contentDirectory.'/*.{jpg,jpeg,png,gif,webp,html,htm}', GLOB_BRACE);

				natcasesort($contentFiles);
				$contentFiles=array_values($contentFiles);
				$imgs=[];
				$pageTypes=[];
				$imageSize=[210, 297];
				$imageSizeDetected=false;

				foreach ($contentFiles as $v) {
					$extension=strtolower(pathinfo($v, PATHINFO_EXTENSION));
					$pageType=in_array($extension, ['html', 'htm'], true)?'html':'image';
					$imgs[]=$contentUrl.rawurlencode(basename($v));
					$pageTypes[]=$pageType;

					if ($pageType==='image' && !$imageSizeDetected) {
						$detectedSize=@getimagesize($v);
						if ($detectedSize) {
							$imageSize=[$detectedSize[0], $detectedSize[1]];
							$imageSizeDetected=true;
						}
					}
				}

				$thumbs=[];
				foreach(glob(__DIR__.'/thumbs/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) as $v) {
					$thumbs[]=preg_replace('/^(.*)\/thumbs\//', "./thumbs/", $v);
				}
				natcasesort($thumbs);
				$thumbs=array_values($thumbs);

				function flipbookPageContent($url, $type, $extraClass='') {
					$safeUrl=htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
					$isHtml=$type==='html';
					echo '<div class="pageContent'.($extraClass?' '.$extraClass:'').'" data-page-url="'.$safeUrl.'" data-page-type="'.($isHtml?'html':'image').'">';
					echo '<div class="imageContent"'.($isHtml?' hidden':'').'><img src="'.($isHtml?'':$safeUrl).'" alt="" /></div>';
					echo '<div class="htmlContent"'.($isHtml?'':' hidden').'><iframe src="'.($isHtml?$safeUrl:'').'" title="Contenu de la page" loading="eager"></iframe></div>';
					echo '</div>';
				}

				echo '
			<script>
				var imgs='.json_encode($imgs, JSON_UNESCAPED_SLASHES).';
				var pageTypes='.json_encode($pageTypes, JSON_UNESCAPED_SLASHES).';
				var thumbs='.json_encode($thumbs, JSON_UNESCAPED_SLASHES).';
				var docWidth='.$imageSize[0].';
				var docHeight='.$imageSize[1].';
			</script>
			<div id="preload" style="width:0; height:0; visibility:hidden; overflow:hidden;">';
				foreach ($imgs as $k=>$v) {
					if ($pageTypes[$k]==='image') {
						echo '
				<img src="'.htmlspecialchars($v, ENT_QUOTES, 'UTF-8').'" />';
					}
				}
			echo '
			</div>
';
			?>
			<div id="pages_list" class="flipbook_scrollable flipbook_scrollTarget">
				<div class="flipbook_content">
					<div class="flipbook_sub">
					<?php
						for ($i=0; $i<count($imgs); $i++) {
							echo '
						<a class="thumb" data-index="'.$i.'" href="./'.($i+1).'">';
							if (isset($thumbs[$i])) {
								echo '<img src="'.htmlspecialchars($thumbs[$i], ENT_QUOTES, 'UTF-8').'" alt="aller à la page '.($i+1).'" />';
							} else {
								echo '<span class="thumbFallback">Page '.($i+1).'</span>';
							}
							echo '</a>';
						}
					?>
					</div>
				</div>
				<div id="verticalScroll_pages_list" class="flipbook_scroll flipbook_verticalScroll">
					<div id="verticalScrollBack_pages_list" class="flipbook_verticalScrollBack"></div>
					<div id="verticalScrollBar_pages_list" class="flipbook_verticalScrollBar"></div>
				</div>
				<div id="horizontalScroll_pages_list" class="flipbook_scroll flipbook_horizontalScroll">
					<div id="horizontalScrollBack_pages_list" class="flipbook_horizontalScrollBack"></div>
					<div id="horizontalScrollBar_pages_list" class="flipbook_horizontalScrollBar"></div>
				</div>
			</div>
			<div id="pages_view" class="flipbook_scrollable flipbook_scrollTarget">
				<div class="flipbook_content">
					<div id="flipbookDual">
						<div id="flipbookDualLeft" class="flipbookDualPage">
							<div id="pageLeftBack" class="flipbookBack flipbookMask">
								<?php $initialIndex=isset($imgs[1])?1:0; flipbookPageContent($imgs[$initialIndex] ?? '', $pageTypes[$initialIndex] ?? 'image'); ?>
								<div id="leftOverlay" class="overlay"></div>
								<div id="leftBackShadow" class="shadow"></div>
								<div id="leftBackLight" class="light"></div>
							</div>
							<div id="pageLeftFront" class="flipbookFront flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image'); ?>
							</div>
							<div id="pageLeftBehind" class="flipbookBehind flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image'); ?>
								<div id="leftBehindShadow" class="shadow"></div>
							</div>
							<button id="dualTopLeft" class="turnButton" onmouseover="flipbook.showTurnPossibility('left', this);" onmouseout="flipbook.hideTurnPossibility('left', this);" onmousedown="flipbook.initTurnManual(event, 'left', this);"></button>
							<button id="dualBottomLeft" class="turnButton" onmouseover="flipbook.showTurnPossibility('left', this);" onmouseout="flipbook.hideTurnPossibility('right', this);" onmousedown="flipbook.initTurnManual(event, 'left', this);"></button>
						</div>
						<div id="flipbookDualRight" class="flipbookDualPage">
							<div id="pageRightBack" class="flipbookBack flipbookMask">
								<?php $initialIndex=isset($imgs[1])?1:0; flipbookPageContent($imgs[$initialIndex] ?? '', $pageTypes[$initialIndex] ?? 'image'); ?>
								<div id="rightBackOverlay" class="overlay"></div>
								<div id="rightBackShadow" class="shadow"></div>
								<div id="rightBackLight" class="light"></div>
							</div>
							<div id="pageRightFront" class="flipbookFront flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image'); ?>
							</div>
							<div id="pageRightBehind" class="flipbookBehind flipbookMask">
								<?php $initialIndex=isset($imgs[2])?2:(isset($imgs[1])?1:0); flipbookPageContent($imgs[$initialIndex] ?? '', $pageTypes[$initialIndex] ?? 'image'); ?>
								<div id="rightBehindShadow" class="shadow"></div>
							</div>
							<button id="dualTopRight" class="turnButton" onmouseover="flipbook.showTurnPossibility('right', this);" onmouseout="flipbook.hideTurnPossibility('left', this);" onmousedown="flipbook.initTurnManual(event, 'right', this);"></button>
							<button id="dualBottomRight" class="turnButton" onmouseover="flipbook.showTurnPossibility('right', this);" onmouseout="flipbook.hideTurnPossibility('right', this);" onmousedown="flipbook.initTurnManual(event, 'right', this);"></button>
						</div>
					</div>
					<div id="flipbookMono">
						<div id="flipbookMonoSub">
							<div class="flipbookBack flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image', 'imgCont'); ?>
								<div id="monoBackOverlay" class="overlay"></div>
								<div id="monoBackShadow" class="shadow"></div>
								<div id="monoBackLight" class="light"></div>
							</div>
							<div class="flipbookFront flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image'); ?>
							</div>
							<div class="flipbookBehind flipbookBehindF flipbookMask">
								<?php $initialIndex=isset($imgs[1])?1:0; flipbookPageContent($imgs[$initialIndex] ?? '', $pageTypes[$initialIndex] ?? 'image'); ?>
								<div id="monoShadow" class="shadow"></div>
							</div>
							<div class="flipbookBehind flipbookBehindB flipbookMask">
								<?php flipbookPageContent($imgs[0] ?? '', $pageTypes[0] ?? 'image'); ?>
								<div id="monoShadow" class="shadow"></div>
							</div>
							<button id="monoTopLeft" class="turnButton" onmouseover="flipbook.showTurnPossibility('left', this);" onmouseout="flipbook.hideTurnPossibility('left', this);" onmousedown="flipbook.initTurnManual(event, 'left', this);"></button>
							<button id="monoTopRight" class="turnButton" onmouseover="flipbook.showTurnPossibility('right', this);" onmouseout="flipbook.hideTurnPossibility('right', this);" onmousedown="flipbook.initTurnManual(event, 'right', this);"></button>
							<button id="monoBottomLeft" class="turnButton" onmouseover="flipbook.showTurnPossibility('left', this);" onmouseout="flipbook.hideTurnPossibility('left', this);" onmousedown="flipbook.initTurnManual(event, 'left', this);"></button>
							<button id="monoBottomRight" class="turnButton" onmouseover="flipbook.showTurnPossibility('right', this);" onmouseout="flipbook.hideTurnPossibility('right', this);" onmousedown="flipbook.initTurnManual(event, 'right', this);"></button>
						</div>
					</div>
				</div>
				<div id="verticalScroll_pages_view" class="flipbook_scroll flipbook_verticalScroll">
					<div id="verticalScrollBack_pages_view" class="flipbook_verticalScrollBack"></div>
					<div id="verticalScrollBar_pages_view" class="flipbook_verticalScrollBar"></div>
				</div>
				<div id="horizontalScroll_pages_view" class="flipbook_scroll flipbook_horizontalScroll">
					<div id="horizontalScrollBack_pages_view" class="flipbook_horizontalScrollBack"></div>
					<div id="horizontalScrollBar_pages_view" class="flipbook_horizontalScrollBar"></div>
				</div>
			</div>
		</div>
	</div>
</body>
</html>
