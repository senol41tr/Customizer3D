<?php
/*
if (!isset($_SERVER['PHP_AUTH_USER']))
{
    header('WWW-Authenticate: Basic realm="TTF Preview Image Generator"');
    header('HTTP/1.0 401 Unauthorized');
    die ("Not authorized");
}

if($_SERVER['PHP_AUTH_USER'] !== 'FONT' && $_SERVER['PHP_AUTH_PW'] !== 'SECRET_PASS')
{
    header('HTTP/1.0 404 Not Found');
    exit;
}
*/
?>

<pre style="padding: 2rem;line-height:1.5;">
<?php

    error_reporting(0);

    require('TTFInfo/TTFInfo.php');

    function formatName($name)
    {
        $name = str_replace('.ttf', '', $name);
        $name = str_replace(['_', '-'], ' ', $name);

        return $name;
    }

    $files = glob("*.ttf");
    $json = [];
    $ttfInfo = new TTFInfo();

    for ($i = 0; $i < count($files); $i++)
    {
        echo ($i + 1).'. '. $files[$i].'<br>';

        $font = $files[$i];
        
        $ttfInfo->setFontFile($font);
        $fontInfo = $ttfInfo->getFontInfo();
        $postscript_name = $fontInfo[TTFInfo::NAME_POSTSCRIPT_NAME];
        $json[] = [
            'postscript_name' => $postscript_name, 
            'name' => formatName($font), 
            'url' => $font
        ];
        flush();
    }

    $file = fopen('fonts.json','w');
    $success = fwrite($file, json_encode($json, JSON_PRETTY_PRINT));
    fclose($file);

    if($success)
    {
        echo '<br>JSON was successfully created.'."\n";
    }
    else
    {
        echo '<br>Unable to create JSON file!'."\n";
    }

?>
</pre>