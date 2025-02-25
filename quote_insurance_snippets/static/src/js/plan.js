odoo.define('quote_insurance_snippets.add_to_cart', function (require) {
    "use strict";

    var ajax = require('web.ajax');
    var domReady = require('web.dom_ready');

    domReady(function () {
        $('a.btn-main').click(function (event) {
            event.preventDefault();
            var planId = $(this).data('plan-id');
            var productId = $(this).data('product-id');
            var productPrice = $(this).data('product-price');
            console.log(planId,
                productId,
                productPrice)
            // Realizar la solicitud AJAX al servidor de Odoo para agregar el producto al carrito
            ajax.jsonRpc('/shop/cart/update_json_qu', 'call', {
                product_id: productId,
                planId: planId,
                set_qty: 1,
                productPrice: productPrice,
            }).then(function (data) {
                // Redirigir al usuario a la página del carrito después de agregar el producto
                window.location.href = '/shop/cart';
            }).catch(function (error) {
                // Manejar errores aquí
                console.error(error);
            });
        });
    });
});



odoo.define('tu_modulo.custom_cart_button', function (require) {
    "use strict";

   

    $(document).ready(function () {
        // Obtener el enlace modificado
        var customLink = $('a.redirec');

        // Agregar evento de clic al enlace
        customLink.on('click', function (event) {
            // Prevenir el comportamiento predeterminado del enlace
            event.preventDefault();

            // Ejecutar window.history.back() para retroceder en la historia del navegador
            window.history.back();
        });
    });
});
