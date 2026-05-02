<?php

// $language = new Lang();
// $lang = $language->getTranslationTablPHP();
// Usage: echo '<h1>' . $lang['STR_ID'] . '</h1>';

class Lang
{
    function __construct()
    {
        if(!isset($_GET['lang'])) return;
        $lang = secureInput($_GET['lang']);
        $availableLangs = json_decode($this->getAvailLangs());
        $index = array_search($lang, $availableLangs);
        if($index !== false) $_SESSION['lang'] = $lang;
    }

    public function getLang()
    {
        if(isset($_SESSION['lang'])) return $_SESSION['lang'];
        
        $CONFIG = $GLOBALS['CONFIG'];
        $json = $CONFIG['LANGS'];
        $langs = json_decode(file_get_contents($CONFIG['DOC_ROOT'] . 'php/lang/' . $json), true);
        $availableLangs = array_keys($langs);
    
        $lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
        $lang = in_array($lang, $availableLangs) ? $lang : 'tr';
        $_SESSION['lang'] = $lang;

        return $lang;
    }

    public function getTranslationTable()
    {
        $CONFIG = $GLOBALS['CONFIG'];
        $path = $CONFIG['DOC_ROOT'] . 'php/lang/' . $this->getLang() . '.json';
        $json = file_get_contents($path);
        return $json;
    }

    public function getTranslationTablPHP()
    {
        return json_decode($this->getTranslationTable(), true);
    }

    public function getAvailLangs($php = false)
    {
        $CONFIG = $GLOBALS['CONFIG'];
        $json = $CONFIG['LANGS'];
        $langs = json_decode(file_get_contents($CONFIG['DOC_ROOT'] . 'php/lang/' . $json), true);
        $availableLangs = $langs;
        if($php) return $availableLangs;
        return json_encode(array_keys($availableLangs));
    }
}

?>
