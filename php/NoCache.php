<?php

/*
 * 14.09.2025 22:08 {BETA}
 * TODO: replace version change with "preg_replace"
 */

//////////////////////////////////////////////////////////////////////////////
////////////////////// WARNING!!! ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// [MAKE COPY OF YOUR DATA] !!!
// BE CAREFULL WITH THIS FILE, THAT MANIPULATE YOUR FILE(S) DIRECTLY !!!
// TESTED ON WINDOWS, FOLDER PERMISSIONS (CHMOD) MUST BE GRANTED IN LINUX AND MACOS!
//


// USAGE
//

// require_once 'php/NoCache.php';

// FOR PREVENT CACHING 

// CLEAN UP ALL (clean all get parameters from defined extensions)
// NoCache::cleanUpAll(['!DATA', '!BACKUPS']);

// REPLACE ALL FILES (set version get parameters)
// Exclude array of Directories in same directory (without . or /)
// NoCache::replaceAllInline(['!DATA', '!BACKUPS']);

// CHANGE ONLY CURRENT FILE
// or you change only this file with;
// put top of file:
// NoCache::start();
// and the bottom: 
// NoCache::end();

$CONFIG = [
    'DOC_ROOT' => $_SERVER['DOCUMENT_ROOT'] . '/Customizer3D/',
    'version' => 1
];


class NoCache
{
    public static $debug = false;
    private static $versionGetParamName = 'version'; // ?version=00000 get parameter
    private static $acceptableFileTypes = ['css', 'js', 'html', 'json']; // read and change/update inline links   
    private static $exceptFileNames = ['min', 'esm', ' ', 'NoCache.php']; // pass file if filename contains
    private static $extensions = ['.css', '.png', '.jpg', '.svg', '.js', '.mp4', '.glb']; // add version to these extensions
    private static $isFileConditions = ['http', '.', '/']; // check if founded string contains acceptable link


    public static function start()
    {
        if(self::$debug) return;
        if(self::_supportsGzip()) ob_start("ob_gzhandler");
        else ob_start();
    }

    public static function end()
    {
        if(self::$debug) exit;

        $buffer = ob_get_contents();
        $buffer = self::_replace($buffer);
        
        ob_end_clean();
        
        if(!self::_supportsGzip())
        {
            echo $buffer;
            return;
        }

        // https://www.php.net/manual/de/function.ob-gzhandler.php#35969
        $gzip_size = strlen($buffer);
        $gzip_crc = crc32($buffer);
        $buffer = gzcompress($buffer, 9);
        $cLength = strlen($buffer);

        header('Content-Encoding: gzip');
        header("Content-length: ".$cLength);

        $buffer = substr($buffer, 0, $cLength - 4);
    
        echo "\x1f\x8b\x08\x00\x00\x00\x00\x00";
        echo $buffer;
        echo pack('V', $gzip_crc);
        echo pack('V', $gzip_size);
        
    }

    public static function replaceAllInline($excludeFolders, $cleanUp = false)
    {
        $DOC_ROOT = $GLOBALS['CONFIG']['DOC_ROOT'];
        $rii = self::_getAllFilesAndFolders($excludeFolders);
    
        /** @var SplFileInfo $file https://www.php.net/manual/tr/class.splfileinfo.php */
        foreach ($rii as $file)
        {
            if ($file->isDir()) continue;
    
            if(in_array(strtolower($file->getExtension()), self::$acceptableFileTypes))
            {
                $currentFile = $file->getFileName();
    
                $pass = false;
                for ($i = 0; $i < count(self::$exceptFileNames); $i++)
                { 
                    if(str_contains($currentFile, self::$exceptFileNames[$i]))
                    {
                        $pass = true;
                        break;
                    }
                }
    
                if($pass) continue;
    
                $currentFileWithPath = realpath($DOC_ROOT . $rii->getSubPathName());
                $buffer = file_get_contents($currentFileWithPath);
                $buffer = self::_replace($buffer, $currentFileWithPath, $cleanUp);
                file_put_contents($currentFileWithPath, $buffer);
            }
        }
    }


    public static function cleanUpAll($excludeFolders = [])
    {
        self::replaceAllInline($excludeFolders, true);
    }

    /*
    // https://stackoverflow.com/questions/5707806/recursive-copy-of-directory
    public static function dist($dest, $excludeFolders = [])
    {
        self::_rrmdir($dest);
        
        array_push($excludeFolders, $dest);
        $rii = self::_getAllFilesAndFolders($excludeFolders);

        echo '<style>*{font-family:system-ui;font-size:0.85rem;line-height:2;}</style>';
        echo '<span style="color:green;"><b>ROOT:</b></span> '.$dest.'<br>----------------------------------------------------<br>';

        mkdir($dest, 0755);

        foreach ($rii as $item)
        {
            if ($item->isDir())
            {
                $dir = $dest . DIRECTORY_SEPARATOR . $rii->getSubPathName();
                mkdir($dir);
                echo '<span style="color:violet;"><b>MKDIR:</b></span> '. $dir . '<br>';
            }
            else
            {
                $file = $dest . DIRECTORY_SEPARATOR . $rii->getSubPathName();
                copy($item, $file);
                $ext = strtolower(pathinfo($item->getFilename())['extension']);
                if(in_array($ext, self::$acceptableFileTypes))
                {
                    $buffer = file_get_contents($file);
                    $buffer = self::_replace($buffer, $file, true); // delete version
                    file_put_contents($file, $buffer);
                }
                echo '<span style="color:orange;"><b>COPY:</b></span> '. $file.'<br>';
            }

            flush();
        }

        exit;

    }

    // https://stackoverflow.com/questions/3338123/how-do-i-recursively-delete-a-directory-and-its-entire-contents-files-sub-dir
    private static function _rrmdir($dir)
    {
        if(!is_dir($dir)) return;

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        
        foreach ($files as $fileinfo) {
            $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
            $todo($fileinfo->getRealPath());
        }

        rmdir($dir);
    }
    */


    // PRIVATE METHODS

    
    private static function _supportsGzip()
    {
        if(isset($_SERVER['HTTP_ACCEPT_ENCODING']))
        {
            return strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false;
        }
        return false;
    }


    private static function _replace($buffer, $file = '', $cleanUp = false)
    {
        $CONFIG = $GLOBALS['CONFIG'];
        $bufferLength = strlen($buffer);
        $replace = [];

        foreach(self::$extensions as $ext)
        { 
            $j = 0;

            while($j <= $bufferLength)
            {
                $firstPos = stripos($buffer, $ext, $j);

                if($firstPos === false)
                {
                    break;
                }
                else
                {
                    $lastPos = $firstPos + strlen($ext);

                    // get extension
                    $fileExt = substr($buffer, $firstPos, strlen($ext));

                    // find begin and end " or ' 
                    $i = $firstPos;
                    $fileNamePosStart = -1;
                    while(true)
                    {
                        if($i < 0 || $buffer[$i] == '"' || $buffer[$i] == "'")
                        {
                            $fileNamePosStart = $i;
                            break;
                        }
                        $i--;
                    }

                    $i = $lastPos;
                    $fileNamePosEnd = -1;
                    while(true)
                    {
                        if($i >= $bufferLength || $buffer[$i] == '"' || $buffer[$i] == "'")
                        {
                            $fileNamePosEnd = $i + 1;
                            break;
                        }
                        $i++;
                    }

                    $fileNameWithQuery = substr($buffer, $fileNamePosStart, $fileNamePosEnd - $fileNamePosStart);
                    $fileName = substr($fileNameWithQuery, 1, strpos($fileNameWithQuery, '?') - 1);

                    $isRealFile = false;
                    for ($i = 0; $i < count(self::$isFileConditions); $i++)
                    { 
                        $condition = self::$isFileConditions[$i];
                        if(str_contains($fileNameWithQuery, $condition))
                        {
                            $isRealFile = true;
                            break;
                        }
                    }


                    // skip .min.js, esm.js or defined
                    $skip = false;
                    for ($i = 0; $i < count(self::$exceptFileNames); $i++)
                    {
                        if(str_contains($fileNameWithQuery, self::$exceptFileNames[$i]))
                        {
                            $skip = true;
                            break;
                        }
                    }


                    // skip
                    if(str_contains($fileNameWithQuery, "\n") || str_contains($fileNameWithQuery, "\r") || !$isRealFile || $skip || strlen($fileName) <= strlen($ext))
                    {
                        $j = $lastPos;
                        continue;
                    }

                    // find query
                    $fileQuery = '';
                    if(substr($buffer, $lastPos, 1) == '?')
                    {
                        $fileQuery = substr($fileNameWithQuery, stripos($fileNameWithQuery, '?') + 1, -1);
                        $fileQuery = preg_replace('/\&?'.self::$versionGetParamName.'=\d+/i', '', $fileQuery);
                        if(substr($fileQuery, 0, 1) == '&') $fileQuery = substr($fileQuery, 1); // !!! workaround
                    }


                    // set version
                    $newFileName = substr($fileNameWithQuery, 0, 1);
                    if($fileQuery == '')
                    {
                        if($cleanUp)
                        {
                            $newFileName .= $fileName;
                        }
                        else
                        {
                            $newFileName .= $fileName.'?'.self::$versionGetParamName.'='.$CONFIG['version'];
                        }
                    }
                    else
                    {
                        if($cleanUp)
                        {
                            $newFileName .= $fileName.'?'.$fileQuery;
                        }
                        else
                        {
                            $newFileName .= $fileName.'?'.$fileQuery.'&'.self::$versionGetParamName.'='.$CONFIG['version'];
                        }
                    }
                    $newFileName .= substr($fileNameWithQuery, -1);

                    if(self::$debug)
                    {
                        echo "\n";
                        echo 'file: '.$file."\n";
                        echo 'fileExt: '.$fileExt."\n";
                        echo 'fileName: '.$fileName."\n";
                        echo 'fileNameWithQuery: '.$fileNameWithQuery."\n";
                        echo 'fileQuery: '.$fileQuery."\n";
                        echo 'newFileName: '.$newFileName."\n";
                    }
                    
                    $replace[] = [$fileNameWithQuery => $newFileName];

                    $j = $lastPos;
                }
            }

        }


        for($i = 0; $i < count($replace); $i++)
        {
            $buffer = str_replace(
                array_key_first($replace[$i]), 
                $replace[$i][array_key_first($replace[$i])], 
                $buffer
            );
        }

        return $buffer;

    }


    public static function _getAllFilesAndFolders($excludeFolders = [])
    {
        $DOC_ROOT = $GLOBALS['CONFIG']['DOC_ROOT'];
        array_push($excludeFolders, '.', '..');

        $directory = new RecursiveDirectoryIterator($DOC_ROOT, RecursiveDirectoryIterator::SKIP_DOTS);
        $filter = new RecursiveCallbackFilterIterator($directory, function($current, $key, $iterator) use ($excludeFolders) {
            if ($current->isDir()) {
                return in_array($current->getFilename(), $excludeFolders, true) === false;
            } else {
                return true;
            }
        });
        $iterator = new RecursiveIteratorIterator($filter, RecursiveIteratorIterator::SELF_FIRST | RecursiveIteratorIterator::LEAVES_ONLY);

        return $iterator;
    }

}

?>
