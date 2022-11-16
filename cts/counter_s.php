<?php

/*
   -----------------------------------------------------
   簡易アクセスカウンター
   Ver. 1.0.2
   update 2017.8.9
   Copyright (C) WEB-JOZU  URL:http://www.web-jozu.com/
   -----------------------------------------------------
*/


session_start();

//GETのposを整数に変換
$pos = intval($_GET['pos']);


//ファイル名
$fileName = "count.php";

//ファイル読み込み
$file = fopen($fileName, "r+") or die("ファイルのオープンに失敗しました");
flock($file, LOCK_EX);
$fileVal = fgets($file, 10000);

//カウントを増やす
$countVal = explode("=", $fileVal);
$num = intval($countVal[1]);

if($pos == "0" && $_SESSION['first'] != "on"){
	$num++;
}else if($pos == "1" && $_SESSION['first'] != "on"){
	$_SESSION['first'] = "on";
}

$writeVal = "count=" . $num . ";";


//ファイル書き込み
if($pos == "0" && $_SESSION['first'] != "on"){
	rewind($file);
	fwrite($file, $writeVal);
}
flock($file, LOCK_UN);
fclose($file);


if($pos != 0){

	if(strlen($num) < $pos){
		$imgNum = 0;
	}else{
		$imgNum = substr($num, -$pos, 1);
	}

	//画像表示
	$fileName = "img/" . $imgNum . ".gif";

	header("Content-type: image/gif");
	readfile($fileName);
}

?>