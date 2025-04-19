/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
// Usaremos el método _rpc proporcionado por publicWidget para llamar al backend
import { jsonrpc } from "@web/core/network/rpc_service"; // Alternativa si se llama directamente a una ruta del controlador
publicWidget.registry.websiteSaleCartTem = publicWidget.Widget.extend({
    selector: '.oe_website_sale .oe_cart',
    events: {
        
        'click .js_delete_product_': '_onClickDeleteProduct_',
    },

    
    _onClickDeleteProduct_: function (ev) {
        ev.preventDefault();
        $(ev.currentTarget).closest('.o_cart_product').find('.js_quantity').val(0).trigger('change');
    },
});