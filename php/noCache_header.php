<?php

    // WARNING! [MAKE COPY OF YOUR DATA] {EXPERIMENTAL}

    // Be carefull with NoCache.php, that manipulate your file(s) directly !!!
    // require_once 'php/NoCache.php';

    // FOR PREVENT CACHING 

    // CLEAN UP ALL (clean all get parameters from defined extensions)
    // NoCache::cleanUpAll(['!DATA', '!BACKUPS']); // Exclude array of Directories in same directory (without . or / at the end)
    
    // REPLACE ALL FILES (set version get parameters)
    // NoCache::replaceAllInline(['!DATA', '!BACKUPS']); // Exclude array of Directories in same directory (without . or / at the end)

    // CHANGE ONLY CURRENT FILE
    // or you change only this (php) file with;
    
    // put top of file:
    // NoCache::start();

    // and the bottom: 
    // NoCache::end();
?>
