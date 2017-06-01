app.register({
    core: {
        modal: {
            initPlugins: function () {
                app.core.ui.plugins.initModal();
            },

            initEvents: function () {
                $(document)
                    // -------------------------------------------------------------
                    // CONFIRMATION MODAL BUTTONS
                    // -------------------------------------------------------------

                    .on('click', '#cancel-btn', function (e) {
                        app.core.ui.modal.modal('close');
                    })

                    .on('click', '#save-btn', function (e) {
                        app.core.ui.modal.modal('close');
                    })

                    ;
            },
        },
        ui: {
            // HANDLE APPLICATION MODALE
            modal: null,
            plugins: {

                // ---------------------------------------------------------------------
                // MATERIALIZECSS MODAL
                // ---------------------------------------------------------------------

                initModal: function () {
                    app.core.ui.modal = $('#confirm-modal');
                    app.core.ui.modal.modal();
                }
            }
        }
    }
});