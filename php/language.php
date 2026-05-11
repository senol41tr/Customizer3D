<?php
    
    define('PATH', '../lang/');
    define('COOKIE_NAME', 'C3D_UserLogged');

    $CONFIG = json_decode(file_get_contents(PATH . 'config.json'), true);

    require_once PATH . 'htmlpurifier-4.15.0/library/HTMLPurifier.auto.php';
    require_once PATH . 'htmlpurifier-4.15.0/htmlpurifier_html5.php';

    $allowed_tags_and_attributes =
    [
        'style',
        'img[src|alt|title|id|width|height|style|id]',
        'figure', 
        'figcaption',
        'video[src|type|width|height|poster|preload|controls|id]', 
        'source[src|type]',
        'a[href|target|title|id]',
        // 'iframe[width|height|src|frameborder|allowfullscreen]',
        'strong', 
        'em', 
        'br', 
        // 'font',
        'p[style|title|id]', 
        'center', 
        'address[style|id]',
        'span[style|id]', 
        'pre[style|id]',
        'ul[style|title|id]', 
        'ol[style|title|id]', 
        'li[style|title|id]',
        'hr[style|title|id]',
        'br[style|title|id]',
        'b[style|title|id]',
        'i[style|title|id]',
        'u[style|title|id]',
        's[style|title|id]',
        'li[style|title|id]',
        'ol[style|title|id]',
        'p[style|title|id]',
        's[style|title|id]',
        'span[style|title|id]',
        'table[width|height|border|style|title|id]',
        'thead[style|title|id]',
        'tbody[style|title|id]',
        'th[style|title|id|colspan|rowspan|id]',
        'tr[style|title|id]',
        'td[style|title|id|colspan|rowspan|id]',
        'u[style|title|id]',
        'ul[style|title|id]',
        'abbr[style|title|id]',
        'code[style|title|id]',
        'h1[style|title|id]',
        'h2[style|title|id]',
        'h3[style|title|id]',
        'h4[style|title|id]',
        'h5[style|title|id]',
        'h6[style|title|id]',
        'sub[style|title|id]',
        'sup[style|title|id]',
        'hr[style|title|id]',
        'div[style|title|id]'
    ];
  
    $PURIFIER = load_htmlpurifier($allowed_tags_and_attributes);
    $CONFIG = json_decode(file_get_contents(PATH . 'config.json'), true);
    $ID = 0;
    
    function stripUnwantedTagsAndAttrs($html)
    {
      global $PURIFIER;
      $clean_html = $PURIFIER->purify($html);
      return $clean_html;
    }    

    function secureInput($str)
    {
        $str = stripUnwantedTagsAndAttrs($str);
        // $str = preg_replace('#[\r\n]#', '', $str);
        $str = trim($str);
        return $str;
    }

    
    function secureInputRecursive(&$data)
    {
        foreach($data as $key => &$value)
        {
            if(is_string($value))
            {
                $data[$key] = secureInput($value);
            }
            elseif (is_array($value))
            {
                secureInputRecursive($value);
            }
        }
    }

    function checkStrID()
    {
        header('Content-type:application/json;charset=utf-8');

        $exist = ['exist' => array_search($_POST['strID'], getStrIDs()) === false ? false : true];
        echo json_encode($exist, JSON_FORCE_OBJECT);
        exit;
    }

    function getStrIDs()
    {
        $langs = getAvailableLangs();
        if(count($langs) == 0) return [];
        $path = PATH . $langs[0][0] . '.json'; // first Lang
        if(!file_exists($path)) return [];
        $json = json_decode(file_get_contents($path), true);
        return array_keys($json);
    }

    function getAvailableLangs()
    {
        $json = PATH . $GLOBALS['CONFIG']['LANGS'];
        $queryPos = strpos($json, '?');
        if($queryPos !== false) $json = substr($json, 0, $queryPos);

        if(is_file($json))
        {
            $langs = json_decode(file_get_contents($json), true);
            $abbr = array_keys($langs);
            $longName = array_values($langs);
        }
        else
        {
            $abbr = [];
            $longName = [];
        }
        
        return [$abbr, $longName];
    }

    function writeFile($path, $buffer)
    {
        $queryPos = strpos($path, '?');
        if($queryPos !== false) $path = substr($path, 0, $queryPos);
        $file = fopen($path,'w');
        $success = fwrite($file, $buffer);
        fclose($file);
        return $success;
    }

    function toJSON($buffer)
    {
        // return json_encode($buffer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return json_encode($buffer, JSON_UNESCAPED_UNICODE);
    }


    // POST Operations

    function saveAvailableLanguages($abbr = '', $longName = '')
    {
        if($abbr == '') $abbr = $_POST['abbr'];
        if($longName == '') $longName = $_POST['longName'];
        $count = count($abbr);
        for ($i=0; $i < $count; $i++)
        {
            $langs[$abbr[$i]] = $longName[$i];
        }

        $json = PATH . $GLOBALS['CONFIG']['LANGS'];
        $queryPos = strpos($json, '?');
        if($queryPos !== false) $json = substr($json, 0, $queryPos);

        if($count == 0) unlink($json);
        else writeFile($json, toJSON($langs));
    }

    function addNewLanguage()
    {
        $newLangAbbr = $_POST['abbr'];
        $newLangLongName = $_POST['longName'];
        list($abbr, $longName) = getAvailableLangs();

        if(array_search($newLangAbbr, $abbr) === false)
        {
            $abbr[] = $newLangAbbr;
            $longName[] = $newLangLongName;

            $json = PATH . $abbr[0] . '.json'; // !!!
            if(is_file($json))
            {
                $lang = json_decode(file_get_contents($json), true);
                // $newLang = array_fill_keys(array_keys($lang), '');
                writeFile(PATH . $newLangAbbr . '.json', toJSON($lang));
            }
            saveAvailableLanguages($abbr, $longName);
        }
    }

    function removeLanguage($_abbr = '')
    {
        $oldLangAbbr = $_abbr == '' ? $_POST['removeAbbr'] : $_abbr;
        if($oldLangAbbr == '') return;

        list($abbr, $longName) = getAvailableLangs();
        $index = array_search($oldLangAbbr, $abbr);
        if(is_int($index))
        {
            $json = PATH . $abbr[$index] . '.json';
            array_splice($abbr, $index, 1);
            array_splice($longName, $index, 1);
            if(is_file($json)) unlink($json);
            saveAvailableLanguages($abbr, $longName);    
        }
    }


    function saveTranslationTable()
    {
        $strIDs = getStrIDs();

        foreach ($_POST as $key => $value)
        {
            if(!is_array($value) || $key == 'strID') continue; 
            
            $table = [];
            for ($i=0; $i < count($value); $i++)
            {
                if($value[$i] != '' && array_search($value, $strIDs) === false)
                {
                    $table[$_POST['strID'][$i]] = $value[$i];
                }
            }

            $json = PATH . $key . '.json';
            if(count(array_keys($table)) == 0)
            {
                if(is_file($json)) unlink($json);
            }
            else writeFile($json, toJSON($table));
        }
    }



    // htmlentities etc.
    if($_POST) secureInputRecursive($_POST);


    // LOGIN & LOGOUT


    $logout = isset($_GET['logout']) ? (int) $_GET['logout'] : 0;
    
    if($logout == 1)
    {
        if(isset($_COOKIE[COOKIE_NAME]))
        {
            unset($_COOKIE[COOKIE_NAME]);
            setcookie(COOKIE_NAME, '', time() - 3600, '/');
        }
    }

    $isLogged = isset($_COOKIE[COOKIE_NAME]) ? (int) $_COOKIE[COOKIE_NAME] : 0;

    if(isset($_POST['username']) && isset($_POST['password']) && $isLogged == 0)
    {
        if(sha1($_POST['username']) == 'eb24b45ed80e25a81058ed88f58ae94b6297cfd8' && sha1($_POST['password']) == 'e10b23e565b10628754dfd1fbd80666e7eb134d2')
        {
            setcookie(COOKIE_NAME, 1, time() + (10 * 365 * 24 * 60 * 60), '/'); // 3 month
            $isLogged = 1;
        }
    }


    //
    if($_POST && isset($_POST['op']))
    {
        // echo '<h1 style="font-size:2rem; text-align:center;"> DEMO MODE! </h1>';
        
        switch ($_POST['op'])
        {
            case 'checkStrID':
            case 'saveAvailableLanguages':
            case 'addNewLanguage':
            case 'saveTranslationTable':
            case 'removeLanguage':
                $_POST['op']();
            break;
        }

    }


    list($abbr, $longName) = getAvailableLangs();
?>





<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Translation Table</title>

        <link rel="icon" href="../../favicon.ico" type="image/x-icon">

        <style>

            *
            {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 0.85rem;
                line-height: 1.5;
                font-weight: normal;
                padding: 0;
                margin: 0;
                color: #000;
            }
            b
            {
                font-weight: bold;
            }
            h1, h1 a
            {
                font-size: 1.15rem;
                line-height: normal;
                font-weight: 500;
            }
            body
            {
                display: flex;
                justify-content: center;
                padding: 2rem;
                padding-bottom: 3rem;
            }
            input
            {
                margin: 0.2rem;
                padding: 0.1rem 0.3rem;
            }
            input[type="submit"]
            {
                margin: 1rem 0 1rem 0;
            }
            table
            {
                border-collapse: collapse;
                max-width:800px;
            }
            th,td
            {
                padding: 0.5rem;
                vertical-align: baseline;
            }
            th
            {
                background-color: #FFFCDB;
                font-size: 1rem;
                text-align: left;
                padding-left: 1rem;
            }
            img
            {
                width: 30px;
            }
            section
            {
                overflow: auto;
            }

            @media screen and (max-width: 500px)
            {
                body
                {
                    display: block;
                }
            }
        </style>

        <script type="module">

            window.addNewRow = (tr) =>
            {
                const newTr = tr.cloneNode(true);
                const inputs = newTr.querySelectorAll('input[type="text"]');
                inputs.forEach(input => {
                    input.value = input.style = '';
                });
                tr.parentNode.insertBefore(newTr, tr);
                inputs[0].focus();
            };

            window._checkStrID = async (input) =>
            {
                if(input.value.length <= 1) return;
                const url = '<?=$_SERVER['PHP_SELF']?>';
                const formData = new FormData();
                formData.append('op', 'checkStrID');
                formData.append('strID', input.value);
                
                const response = await fetch(url, {
                    method : "POST",
                    body: formData
                });
                const json = await response.json();
                input.style.outline = '2px solid ' + (json.exist ? 'red' : 'green');
            };

            window.autoTranslate = (lang) =>
            {
                let el;
                const inputs = document.querySelectorAll('input[name="' + lang + '[]"], textarea[name="' + lang + '[]"]');
                const strIDs = document.querySelectorAll('input[name="strID[]"]');
                const win = window.open("", "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width="+Math.min(500, screen.width)+",height="+Math.min(800, screen.height)+"");
                
                win.onblur = win.close;
                win.document.body.setAttribute('style', 'padding:30px 0;');
                
                inputs.forEach((input, i) =>
                {
                    if(input.value.length > 0)
                    {
                        el = document.createElement('p');
                        el.contentEditable = true;
                        el.setAttribute('id', strIDs[i].value);
                        el.setAttribute('style', 'border:1px solid #000; padding:0.5rem; margin-bottom:0.5rem');
                        el.innerText = input.value;
                        win.document.body.appendChild(el);
                    }
                });
                
                win.gtranslateSettings =
                {
                    "default_language":"en",
                    "detect_browser_language":true,
                    "wrapper_selector":".gtranslate_wrapper",
                    "flag_size":16,
                    "switcher_horizontal_position":"right",
                    "switcher_vertical_position":"top"
                };

                win.insertStrings = () =>
                {
                    const ps = win.document.querySelectorAll('p');

                    ps.forEach((input, i) => {
                        inputs[i].value = ps[i].innerText;
                        inputs[i].nextSibling.innerHTML = ps[i].innerText;
                    });

                    win.close();
                };
                
                el = document.createElement('div');
                el.setAttribute('class', 'gtranslate_wrapper');
                win.document.body.appendChild(el);

                el = document.createElement('script');
                el.setAttribute('defer', '');
                el.setAttribute('src', 'https://cdn.gtranslate.net/widgets/latest/dwf.js');
                win.document.body.appendChild(el);

                el = document.createElement('button');
                el.setAttribute('onclick', 'insertStrings();');
                el.innerText = 'Save Changes';
                win.document.body.appendChild(el);
            };

        </script>

    </head>

    <body>

        <?php

            if($isLogged == 0):
            
                echo '<form action="'.$_SERVER['PHP_SELF'].'" method="post" id="login_form">';
                echo <<<HTML
                    <section>
                        <h1>Language Administration<br><b>Login</b></h1>
                        <div style="display: flex; flex-direction:column; padding-top:1rem;">
                            <input type="text" placeholder="Username" name="username" value="C3D" required>
                            <input type="password" placeholder="Password" name="password" value="SECRET_PASS" required>
                            <input type="submit" value="Login">
                        </div>

                    </section>
                HTML;
                echo '</form>';
                echo '<script>window.addEventListener("load", () => document.getElementById("login_form").submit());</script>';
            else:
        ?>

        <section>
            
            <div style="padding:1rem 0;">
                <a href="?logout=1" title="Logout">Logout</a>
            </div>

            <h1><a href="?" style="text-decoration: none;">Language(s)</a></h1>
            
            <?php

                if(count($abbr) > 0)
                {
                    echo '<form action="'.$_SERVER['PHP_SELF'].'" method="post" id="availableLanguagesForm">';
                    echo '<p style="font-weight: bold;padding: 0.5rem 0;">Edit / Delete existing Language(s)</p>';
                    echo '<input type="hidden" name="op" id="availableLanguagesOP" value="saveAvailableLanguages">';
                    echo '<input type="hidden" name="removeAbbr" id="removeAbbr" value="">';
                    for ($i=0; $i < count($abbr); $i++)
                    {
                        echo <<<HTML
                            <div>
                                <input type="text" placeholder="abbr." name="abbr[]" style="width: 40px;" maxlength="2" value="$abbr[$i]" required>
                                <input type="text" placeholder="long name" name="longName[]" value="$longName[$i]" required>
                                <a onclick="if(!confirm('Are You Sure?')) { return; } this.parentNode.remove();document.getElementById('removeAbbr').value = '$abbr[$i]';document.getElementById('availableLanguagesOP').value = 'removeLanguage';document.getElementById('availableLanguagesForm').submit();" style="color: red;cursor:pointer;white-space:nowrap;" title="Remove Language">( <b>-</b> )</a>
                            </div>
                        HTML;
                    }
                    echo '<input type="submit" value="Save Changes">';
                    echo '</form>';
                }

            ?>


            <form action="<?=$_SERVER['PHP_SELF']?>" method="post">
                <div>
                    <p><b>Add New Language</b> ( <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">2 Letter Country Codes</a> )</p>
                    <input type="text" placeholder="abbr." name="abbr" style="width: 40px;" maxlength="2" required>
                    <input type="text" placeholder="long name" name="longName" required>
                    <input type="hidden" name="op" value="addNewLanguage">
                    <input type="submit">
                </div>
            </form>


            <?php if(count($abbr) > 0): ?>
            
            <h1 style="padding:2rem 0 1rem 0;">Translation Table</h1>

            <div class="allowed" style="padding-bottom:2rem;">
                <?php

                    echo '<div style="padding-bottom:1rem;font-weight:bold;">Ctrl + Click in to inputs to view as HTML</div>';
                    echo '<p style="background-color:#296EEB;padding:0.5rem;color:#fff;cursor:pointer;" onclick="this.nextSibling.style.display = this.nextSibling.style.display == \'flex\' ? \'none\' : \'flex\';">Click here for Allowed HTML Tags and Attributes</p>';
                    echo '<div style="display:none;gap:0.5rem;flex-wrap:wrap;padding-top:1rem;max-width:800px;">';
                    foreach($allowed_tags_and_attributes as $i => $tag)
                    {
                        echo '<div style="border:1px solid #ebebeb;padding:0.5rem;">';
                        $attr = str_replace('|', ' | ', substr($tag, strpos($tag,'[')));
                        $tagName = substr($tag, 0, strpos($tag,'['));
                        echo $tagName == '' ? $attr . "<br>\n" : $tagName . ' <span style="color:#999;font-size:0.75rem;">'.$attr.'</span><br>'."\n";
                        echo '</div>';
                    }
                    echo '</div>';
                ?>
            </div>

            <form action="<?=$_SERVER['PHP_SELF']?>" method="post" id="translationTableForm">

                <input type="hidden" name="op" value="saveTranslationTable">

                <table border="1">

                    <thead>
                        <th>String ID</th>
                        <?php
                            for ($i=0; $i < count($abbr); $i++)
                            {
                                echo '<th>'.$longName[$i].' ('.$abbr[$i].')</th>';
                            }
                        ?>
                        <th colspan="2"></th>
                    </thead>
                    
                    <tbody>

                        <?php

                            if(is_file(PATH . $abbr[0] . '.json'))
                            {
                                for ($i=0; $i < count($abbr); $i++)
                                {
                                    $json = PATH . $abbr[$i] . '.json';
                                    if(!is_file($json)) continue;
                                    $translationTable[$abbr[$i]] = json_decode(file_get_contents($json), true);
                                }

                                $arr = $translationTable[$abbr[0]]; // !!!
                                for ($i=0; $i < count($arr); $i++)
                                {
                                    $strID = array_keys($arr);
                                    echo '<tr>';
                                    echo '<td><input type="text" name="strID[]" value="'.$strID[$i].'" oninput="_checkStrID(this);"></td>';
                                    
                                    for ($j=0; $j < count($abbr); $j++)
                                    {
                                        $strID = array_keys($translationTable[$abbr[$j]]);
                                        $text = $translationTable[$abbr[$j]][$strID[$i]];

                                        echo '<td>';
                                        echo '<textarea rows="10" cols="40" lang="'.$abbr[$j].'" style="width:100%;height:100%;display:none;" name="'.$abbr[$j].'[]" onkeyup="this.nextSibling.innerHTML = this.value;" onclick="if(!event.ctrlKey){return;}this.style.display=\'none\';this.nextSibling.style.display=\'block\';">'.$text.'</textarea>';
                                        echo '<div style="padding: 0.5rem;" lang="'.$abbr[$j].'" contenteditable onkeyup="this.previousSibling.innerText = this.innerHTML;" onclick="if(!event.ctrlKey){return;}this.style.display=\'none\';this.previousSibling.style.display=\'block\';">'.$text.'</div>';
                                        echo '</td>';      
                                    }
                                    echo '<td></td><td onclick="if(!confirm(\'Are You Sure?\')) { return; } this.parentNode.remove();document.getElementById(\'translationTableForm\').submit();" style="color: red;cursor:pointer;white-space:nowrap;" title="Remove Row">( <b>-</b> )</td>';
                                    echo '</tr>'."\n";
                                }
                            }
                        ?>

                        <tr>
                            <td><input type="text" placeholder="String ID" name="strID[]" oninput="_checkStrID(this);"></td>
                            <?php
                                for ($i=0; $i < count($abbr); $i++)
                                {
                                    echo '<td>';
                                    echo '<input type="text" placeholder="'.$longName[$i].' ('.$abbr[$i].')" name="'.$abbr[$i].'[]">';
                                    echo '</td>';
                                }
                            ?>
                            <td onclick="addNewRow(this.parentNode);" style="color: limegreen;cursor:pointer;white-space:nowrap;" title="Add New Row">( <b>+</b> )</td>
                            <td onclick="this.parentNode.remove();" style="color: red;cursor:pointer;white-space:nowrap;" title="Remove Row">( <b>-</b> )</td>
                        </tr>

                        <?php

                            /*
                            echo '<tr>';
                            echo '<td></td>';
                            for ($i=0; $i < count($abbr); $i++)
                            {
                                echo '<td><a href="javascript:autoTranslate(\''.$abbr[$i].'\');" title="Automatic Translate">Auto. Translate {BETA}</a>';
                                echo '</td>';
                            }
                            echo '<td colspan="2"></td>';
                            echo '</tr>';
                            */
                        ?>
                        
                    </tbody>

                </table>
                
                <div>
                    <input type="submit" value="Save Changes" onclick="this.value = 'Please wait...';">
                </div>
                
            </form>

            <?php endif; ?>

        </section>

        <?php

            endif; // if(!$logged)

        ?>

    </body>

</html>
