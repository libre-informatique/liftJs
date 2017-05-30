<?php
error_reporting(-1);
ini_set('display_errors', 1);

require_once 'actions.php';

$app = new App();

$parameters = $app->getParameters();

if (isset($_GET['getParameters'])) {
    $app->getParametersAction();
}
?>

<!DOCTYPE html>
<html>
    <head>
        <meta name="msapplication-tap-highlight" content="no">
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">

        <link rel="stylesheet" type="text/css" href="css/styles.css">
        <title><?php echo $parameters->applicationName; ?></title>

        <meta http-equiv="Access-Control-Allow-Origin" content="*">
        <meta name="theme-color" content="#455a64">
    </head>
    <body>
        <div id="app">

            <!-- NAVBAR -->

            <div id="mainLoader" class="progress">
                <div class="indeterminate"></div>
            </div>

            <nav>
                <div class="nav-wrapper primary">
                    <a href="/" class="brand-logo"><?php echo $parameters->applicationName; ?></a>
                    <ul id="nav-mobile-left" class="left">
                        <li>
                            <a href='javascript:;' data-go="homeAction">
                                <i class="material-icons left">home</i>
                                <span class="button-label hide-on-med-and-down">Home</span>
                            </a>
                        </li>
                    </ul>
                    <ul id="nav-mobile-right" class="right">
                        <li>
                            <a class='dropdown-button' href="javascript:;"
                               data-activates='rightMenu'
                               data-alignment="right"
                               data-constrainWidth="false"
                               data-belowOrigin="true"
                               ><span class="button-label hide-on-med-and-down">Right Menu</span>
                                <i class="material-icons"  id='rightMenuInfo'>menu</i>
                            </a>

                            <!-- Dropdown Structure -->
                            <ul id='rightMenu' class='dropdown-content'>
                                <li>
                                    <a href="javascript:;" data-go="showSettings">
                                        <i class="material-icons">settings</i>
                                        Settings
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>


            <div class="content">

                <!-- CONTENT VIEWS -->

                <handlebar-placeholder template="home"></handlebar-placeholder>
                <handlebar-placeholder template="settings"></handlebar-placeholder>

                <!-- CONTENT LOADER -->

                <div id="contentLoader"> 
                    <div class="preloader-wrapper big active">
                        <div class="spinner-layer spinner-blue">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div><div class="gap-patch">
                                <div class="circle"></div>
                            </div><div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>

                        <div class="spinner-layer spinner-red">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div><div class="gap-patch">
                                <div class="circle"></div>
                            </div><div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>

                        <div class="spinner-layer spinner-yellow">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div><div class="gap-patch">
                                <div class="circle"></div>
                            </div><div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>

                        <div class="spinner-layer spinner-green">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div><div class="gap-patch">
                                <div class="circle"></div>
                            </div><div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <handlebar-placeholder template="infos"></handlebar-placeholder>

            <!-- CONFIRM MODAL -->

            <div id="confirm-modal" class="modal bottom-sheet">
                <div class="modal-content center">
                    <h4>Modal title</h4>
                    <div class="btn-toolbar row">
                        <div class="col s6">
                            <a id="save-btn" class="waves-effect waves-light btn success">
                                <i class="material-icons left">check_circle</i>
                                Yes
                            </a>
                        </div>
                        <div class="col s6">
                            <a id="cancel-btn" class="waves-effect waves-light btn primary">
                                <i class="material-icons right">cancel</i>
                                No
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- LIBS -->

        <script src="js/libs/jquery-3.2.1.min.js"></script>
        <script src="js/libs/handlebars-v4.0.5.js"></script>
        <script src="js/libs/materialize.min.js"></script>
        <script src="js/libs/moment-with-locales.min.js"></script>
        <!-- UNCOMMENT IF YOU WANT TO SUPPORT LEGACY BROWSER -->
        <!--<script src="js/libs/jquery.history.js"></script>-->

        <!-- APP -->

        <script>
            var appHostname = "<?php echo $parameters->appHostname; ?>";
        </script>

        <script type="text/javascript" src="js/app.js"></script>
        <script type="text/javascript" src="js/core/utils.js"></script>
        <script type="text/javascript" src="js/core/ui.js"></script>
        <script type="text/javascript" src="js/core/controller.js"></script>
        <script type="text/javascript" src="js/core/events.js"></script>
        <script type="text/javascript" src="js/core/session.js"></script>
        <script type="text/javascript" src="js/core/history.js"></script>
        <script type="text/javascript" src="js/core/settings.js"></script>

        <!-- BUSINESS COMPONENTS -->

        <script type="text/javascript" src="js/modules/featureDiscovery.js"></script>

        <!-- APP STARTER -->

        <script type="text/javascript">
            // START APP
            $(document).ready(app.init());
        </script>

        <!-- TEMPLATES LOADED DIRECTLY -->

        <script id="home-template" type="text/x-handlebars-template" src="/views/home.html"></script>
        <script id="settings-template" type="text/x-handlebars-template" src="/views/user/settings.html"></script>
        <script id="infos-template" type="text/x-handlebars-template" src="/views/blocks/infos.html"></script>

        <!-- TEMPLATES LOADED VIA AJAX -->

    </body>
</html>