app.register({
    baseUi: {
        initEvents: function() {
            $(document)

                .on('templates.registered', function() {
                    app.core.ui.applyTemplate('navbar');
                })

                .on('app.ready', function() {
                    app.ctrl.homeAction();
                })
        },
        registerTemplates: function() {
            app.core.ui.addTemplate('app', 'navbar', app.config.liftJsPath+'js/modules/baseUi/views/navbar.html');
            app.core.ui.addTemplate('content', 'settings', app.config.liftJsPath+'js/modules/baseUi/views/settings.html');
        },

        openModal: function(templateName, data) {
            app.core.ctrl.render(templateName, data, false).then(function() {
                $('.modal')
                    .modal({
                        dismissible: true,
                        opacity: .5,
                        inDuration: 300,
                        outDuration: 200,
                        startingTop: '4%',
                        endingTop: '10%',
                    })
                    .modal('open');
            });
        },

        closeModal: function() {
            $('.modal').modal('close');
        },
    }
});
