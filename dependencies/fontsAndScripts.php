<?php
	if (file_exists(__DIR__.'/session.php')) {
		include_once(__DIR__.'/session.php');
	}
	$_SESSION["total_to_load"]=0;
	if (file_exists(__DIR__.'/fonts.php')) {
		include_once(__DIR__.'/fonts.php');
	}
	$_SESSION['prefixCss']="flipbook";
	$_SESSION['prefixJs']=array("lib"=>"lib", "flipbook"=>"flipbook");
	if (preg_match('/msie 9/i', $_SERVER['HTTP_USER_AGENT'])) {
		$_SESSION['prefixJs']['history']='history';
		$_SESSION['prefixJs']['history.adapter.native']='history.adapter.native';
	}
	$memPath=[];
	$memType=[];
	if (file_exists(__DIR__.'/../css/'.$_SESSION['prefixCss'].".css")) {
		$_SESSION["total_to_load"]+=filesize(__DIR__.'/../css/'.$_SESSION['prefixCss'].'.css');
		$_SESSION['css']="\t".'<link rel="stylesheet" type="text/css" href="./css/'.$_SESSION['prefixCss'].'.css?mod='.filemtime(__DIR__.'/../css/'.$_SESSION['prefixCss'].".css").'" media="all" id="bBpath_'.count($memPath).'" onload="loader('.filesize(__DIR__.'/../css/'.$_SESSION['prefixCss'].'.css').', \'html\', \'./css/'.$_SESSION['prefixCss'].'.css?mod='.filemtime(__DIR__.'/../css/'.$_SESSION['prefixCss'].".css").'\');"/>'."\n";
	}
	foreach ($_SESSION['prefixJs'] as $k=>$v) {
		if (file_exists(__DIR__.'/../js/'.$v.'.js')) {
			$_SESSION["total_to_load"]+=filesize(__DIR__.'/../js/'.$v.'.js');
			$_SESSION['js'][$k]="\t".'<script type="text/javascript" src="./js/'.$v.'.js?mod='.filemtime(__DIR__.'/../js/'.$v.'.js').'" id="bBpath_'.count($memPath).'" onload="loader('.filesize(__DIR__.'/../js/'.$v.'.js').', \'html\', \'./js/'.$v.'.js?mod='.filemtime(__DIR__.'/../js/'.$v.'.js').'\');"></script>'."\n";
			$memPath[]='./js/'.$v.'.js?mod='.filemtime(__DIR__.'/../js/'.$v.'.js');
			$memType[]='js';
		}
	}
	echo "\t".'<style type="text/css" class="extra normal_loading">
		#background {
			display:none;
			opacity:0;
		}
		#wrapper {
			display:none;
			opacity:0;
		}
		#menuContainer {
			visibility:hidden;
			opacity:0;
		}
		canvas {
			display:block;
		}
	</style>';
	$_SESSION['bBpathStr']=count($memPath)>0?'["'.implode('","',$memPath).'"]':'[]';
	$_SESSION['bBtypeStr']=count($memType)>0?'["'.implode('","',$memType).'"]':'[]';
?>